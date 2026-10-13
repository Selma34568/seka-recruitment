
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Application, Branch, Candidate
from schemas import (
    BranchResponse,
    CandidateCreate,
    CandidateResponse,
    StatusUpdate,
)

app = FastAPI(
    title="SEKA Recruitment Management API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to SEKA Recruitment API"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/branches", response_model=list[BranchResponse])
def list_branches(db: Session = Depends(get_db)):
    return db.scalars(select(Branch).order_by(Branch.id)).all()


@app.get("/candidates", response_model=list[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    statement = (
        select(Candidate)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
        .order_by(Candidate.id)
    )
    return db.scalars(statement).all()


@app.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    statement = (
        select(Candidate)
        .where(Candidate.id == candidate_id)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
    )
    candidate = db.scalar(statement)

    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return candidate


@app.post("/candidates", response_model=CandidateResponse, status_code=201)
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
):
    branch = db.get(Branch, data.branch_id)

    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")

    candidate = Candidate(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
    )

    db.add(candidate)
    db.flush()

    application = Application(
        candidate_id=candidate.id,
        branch_id=branch.id,
        position=data.position,
        status="NEW",
    )

    db.add(application)
    db.commit()

    statement = (
        select(Candidate)
        .where(Candidate.id == candidate.id)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
    )
    return db.scalar(statement)


@app.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "NEW", "REVIEW", "INTERVIEW",
        "OFFER", "HIRED", "REJECTED"
    }

    status = data.status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status",
        )

    application = db.get(Application, application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    application.status = status
    db.commit()

    return {
        "message": "Status updated successfully",
        "application_id": application_id,
        "status": status,
    }

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import File, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_CV_SIZE = 5 * 1024 * 1024  # 5 MB


@app.post("/candidates/{candidate_id}/cv")
async def upload_candidate_cv(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    candidate = db.get(Candidate, candidate_id)

    if candidate is None:
        raise HTTPException(404, "Candidate not found")

    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are accepted")

    content = await file.read(MAX_CV_SIZE + 1)
    await file.close()

    if len(content) > MAX_CV_SIZE:
        raise HTTPException(413, "PDF exceeds 5 MB limit")

    if not content.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file")

    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ValueError("Encrypted PDFs are unsupported")

        extracted_text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages[:20]
        )
    except Exception:
        raise HTTPException(400, "PDF cannot be processed")

    filename = f"{uuid4().hex}.pdf"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(content)

    previous_file = candidate.cv_filename
    candidate.cv_filename = filename

    try:
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise

    if previous_file:
        (UPLOAD_DIR / Path(previous_file).name).unlink(
            missing_ok=True
        )

    return {
        "message": "CV uploaded successfully",
        "candidate_id": candidate_id,
        "filename": filename,
        "extracted_characters": len(extracted_text),
        "text_preview": extracted_text[:500],
    }


@app.get("/candidates/{candidate_id}/cv")
def download_candidate_cv(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    candidate = db.get(Candidate, candidate_id)

    if candidate is None or not candidate.cv_filename:
        raise HTTPException(404, "CV not found")

    file_path = UPLOAD_DIR / Path(candidate.cv_filename).name

    if not file_path.is_file():
        raise HTTPException(404, "CV file missing")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"candidate-{candidate_id}-cv.pdf",
        content_disposition_type="inline",
    )

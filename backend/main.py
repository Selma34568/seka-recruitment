from seka_features import router as seka_features_router, find_candidate, normalize_email, audit
from auth import get_current_user, require_roles
from intake import router as intake_router
from permissions import candidate_scope_query
from models import User
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from admin_routes import router as admin_router
from models import RecruitmentStatus
from admin_permissions import get_user_permissions
from seka_features import router as seka_features_router

from database import get_db
from models import Application, Branch, Candidate
from schemas import (
    BranchResponse,
    CandidateCreate,
    CandidateResponse,
    StatusUpdate,
)
DEFAULT_STATUSES = {
    "NEW",
    "REVIEW",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
}


def get_allowed_statuses(db: Session) -> set[str]:
    custom_statuses = db.scalars(
        select(RecruitmentStatus.name)
    ).all()

    return DEFAULT_STATUSES | {
        name.strip().upper()
        for name in custom_statuses
    }

app = FastAPI(
    title="SEKA Recruitment Management API",
    version="0.2.0",
)
app.include_router(intake_router)



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
def list_candidates(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        candidate_scope_query(user, db)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
        .order_by(Candidate.id)
    )

    if user.role == "BRANCH_MANAGER":
        from sqlalchemy.orm import with_loader_criteria

        if user.branch_id is None:
            raise HTTPException(403, "No assigned branch")

        statement = statement.options(
            with_loader_criteria(
                Application,
                Application.branch_id == user.branch_id,
                include_aliases=True,
            )
        )

    return db.scalars(statement).all()




@app.get(
    "/candidates/{candidate_id}",
    response_model=CandidateResponse
)
def get_candidate(
    candidate_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import with_loader_criteria

    statement = (
        candidate_scope_query(user, db)
        .where(Candidate.id == candidate_id)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
    )

    if (
    user.role == "BRANCH_MANAGER"
    or "view_branch_candidates" in get_user_permissions(user, db)
):
        if user.branch_id is None:
            raise HTTPException(403, "No assigned branch")

        statement = statement.options(
            with_loader_criteria(
                Application,
                Application.branch_id == user.branch_id,
                include_aliases=True,
            )
        )

    candidate = db.scalar(statement)

    if candidate is None:
        raise HTTPException(404, "Candidate not found")

    return candidate



@app.post("/candidates", response_model=CandidateResponse, status_code=201)

def create_candidate(
    data: CandidateCreate,
    user: User = Depends(
        require_roles("ADMIN", "HR_MANAGER")
    ),
    db: Session = Depends(get_db),
):

    branch = db.get(Branch, data.branch_id)

    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")

    candidate = find_candidate(db, data.email)
    is_new = candidate is None
    if is_new:
        candidate = Candidate(first_name=data.first_name, last_name=data.last_name,
                              email=normalize_email(data.email), phone=data.phone)
        db.add(candidate)
    db.flush()

    application = Application(
        candidate_id=candidate.id,
        branch_id=branch.id,
        position=data.position,
        status="NEW",
    )

    db.add(application)
    db.flush()
    if is_new: audit(db, "CANDIDATE_CREATED", candidate.id, actor="demo" if "request" in locals() else "user")
    audit(db, "APPLICATION_CREATED", candidate.id, application.id, {"position": application.position, "branch_id": application.branch_id})
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
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    allowed_statuses = get_allowed_statuses(db)

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


    if user.role == "BRANCH_MANAGER":
        if (
            user.branch_id is None
            or application.branch_id != user.branch_id
        ):
            raise HTTPException(
                status_code=403,
                detail="Outside assigned branch",
            )


    previous_status = application.status
    application.status = status
    audit(db, "STATUS_CHANGED", application.candidate_id, application.id, {"old": previous_status, "new": status})
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
    user: User = Depends(
        require_roles("ADMIN", "HR_MANAGER")
    ),
    db: Session = Depends(get_db),
):


    candidate = db.scalar(
        candidate_scope_query(user)
        .where(Candidate.id == candidate_id)
    )


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
    latest = db.scalar(select(Application).where(Application.candidate_id == candidate.id).order_by(Application.id.desc()))
    if latest:
        latest.cv_filename = filename
    audit(db, "CV_UPLOADED", candidate.id, latest.id if latest else None, {"filename": filename})

    try:
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise

    # Keep older CVs: each application may reference an earlier version.

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
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):


    candidate = db.scalar(
        candidate_scope_query(user)
        .where(Candidate.id == candidate_id)
    )


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

from models import User

@app.get("/auth/me")
def read_current_user(
    user: User = Depends(get_current_user),
):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "branch_id": user.branch_id,
    }

from permissions import candidate_scope_query
from models import User


@app.get(
    "/secure/candidates",
    response_model=list[CandidateResponse]
)
def list_secure_candidates(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        candidate_scope_query(user)
        .options(
            selectinload(Candidate.applications)
            .selectinload(Application.branch)
        )
        .order_by(Candidate.id)
    )

    candidates = db.scalars(statement).all()

    return candidates


import os
from fastapi import Query

@app.get(
    "/demo/candidates",
    response_model=list[CandidateResponse],
    include_in_schema=False,
)
def list_demo_candidates(
    role: str = Query(default="ADMIN"),
    branch_id: int | None = None,
    db: Session = Depends(get_db),
):
    if os.getenv("SEKA_DEMO_MODE") != "true":
        raise HTTPException(404, "Not found")

    if role not in {"ADMIN", "HR_MANAGER", "BRANCH_MANAGER"}:
        raise HTTPException(400, "Invalid demo role")

    statement = select(Candidate).options(
        selectinload(Candidate.applications)
        .selectinload(Application.branch)
    )

    if role == "BRANCH_MANAGER":
        if branch_id is None:
            raise HTTPException(400, "Branch required")

        statement = statement.where(
            Candidate.applications.any(
                Application.branch_id == branch_id
            )
        )

        from sqlalchemy.orm import with_loader_criteria

        statement = statement.options(
            with_loader_criteria(
                Application,
                Application.branch_id == branch_id,
            )
        )

    return db.scalars(
        statement.order_by(Candidate.id)
    ).all()

@app.get(
    "/demo/candidates/{candidate_id}",
    response_model=CandidateResponse,
)
def get_demo_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(
            status_code=404,
            detail="Demo mode is disabled",
        )

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
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    return candidate


@app.patch("/demo/applications/{application_id}/status")
def update_demo_application_status(
    application_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
):
    import os

    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(404, "Demo mode disabled")

    allowed_statuses = get_allowed_statuses(db)

    status = data.status.upper()

    if status not in allowed_statuses:
        raise HTTPException(400, "Invalid status")

    application = db.get(Application, application_id)

    if application is None:
        raise HTTPException(404, "Application not found")

    previous_status = application.status
    application.status = status
    audit(db, "STATUS_CHANGED", application.candidate_id, application.id, {"old": previous_status, "new": status})
    db.commit()

    return {
        "message": "Status updated",
        "application_id": application_id,
        "status": status,
    }

import os


def require_local_demo(request: Request):
    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(404, "Demo mode disabled")

    if request.client is None or request.client.host not in {
        "127.0.0.1",
        "::1",
    }:
        raise HTTPException(403, "Local demo only")


@app.post("/demo/candidates/{candidate_id}/cv")
async def upload_demo_cv(
    candidate_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    require_local_demo(request)

    candidate = db.get(Candidate, candidate_id)

    if candidate is None:
        raise HTTPException(404, "Candidate not found")

    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files accepted")

    content = await file.read(MAX_CV_SIZE + 1)
    await file.close()

    if len(content) > MAX_CV_SIZE:
        raise HTTPException(413, "PDF exceeds 5 MB")

    if not content.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF")

    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ValueError("Encrypted PDF")
        for page in reader.pages[:20]:
            page.extract_text()
    except Exception:
        raise HTTPException(400, "PDF cannot be processed")

    filename = f"{uuid4().hex}.pdf"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(content)

    previous_file = candidate.cv_filename
    candidate.cv_filename = filename
    latest = db.scalar(select(Application).where(Application.candidate_id == candidate.id).order_by(Application.id.desc()))
    if latest:
        latest.cv_filename = filename
    audit(db, "CV_UPLOADED", candidate.id, latest.id if latest else None, {"filename": filename})

    try:
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise

    # Keep older CVs: each application may reference an earlier version.

    return {"uploaded": True, "filename": filename}


@app.get("/demo/candidates/{candidate_id}/cv")
def view_demo_cv(
    candidate_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    require_local_demo(request)

    candidate = db.get(Candidate, candidate_id)

    if candidate is None or not candidate.cv_filename:
        raise HTTPException(404, "CV not found")

    path = UPLOAD_DIR / Path(candidate.cv_filename).name

    if not path.is_file():
        raise HTTPException(404, "CV file missing")

    return FileResponse(
        path,
        media_type="application/pdf",
        content_disposition_type="inline",
    )


@app.post(
    "/demo/candidates",
    response_model=CandidateResponse,
    status_code=201,
    include_in_schema=False,
)
def create_demo_candidate(
    data: CandidateCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(404, "Demo mode disabled")

    if request.client is None or request.client.host not in {
        "127.0.0.1", "::1"
    }:
        raise HTTPException(403, "Local demo only")

    branch = db.get(Branch, data.branch_id)

    if branch is None:
        raise HTTPException(404, "Branch not found")

    candidate = find_candidate(db, data.email)
    is_new = candidate is None
    if is_new:
        candidate = Candidate(first_name=data.first_name, last_name=data.last_name,
                              email=normalize_email(data.email), phone=data.phone)
        db.add(candidate)
    db.flush()

    application = Application(
        candidate_id=candidate.id,
        branch_id=branch.id,
        position=data.position,
        status="NEW",
    )

    db.add(application)
    db.flush()
    if is_new: audit(db, "CANDIDATE_CREATED", candidate.id, actor="demo" if "request" in locals() else "user")
    audit(db, "APPLICATION_CREATED", candidate.id, application.id, {"position": application.position, "branch_id": application.branch_id})
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

# HR Notes - local demonstration only
from pydantic import BaseModel, Field


class HRNoteUpdate(BaseModel):
    notes: str = Field(max_length=5000)


@app.patch(
    "/demo/applications/{application_id}/notes",
    include_in_schema=False,
)
def save_demo_hr_notes(
    application_id: int,
    data: HRNoteUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(
            status_code=404,
            detail="Demo mode disabled",
        )

    if (
        request.client is None
        or request.client.host not in {"127.0.0.1", "::1"}
    ):
        raise HTTPException(
            status_code=403,
            detail="Local demo only",
        )

    application = db.get(Application, application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    old_note = application.notes
    application.notes = data.notes.strip()
    audit(db, "NOTES_UPDATED", application.candidate_id, application.id, {"previous_length": len(old_note or ""), "new_length": len(application.notes or "")})
    db.commit()
    db.refresh(application)

    return {
        "saved": True,
        "application_id": application.id,
        "notes": application.notes,
    }
app.include_router(admin_router)

@app.get("/demo/statuses")
def list_demo_statuses(
    db: Session = Depends(get_db),
):
    import os

    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(
            status_code=404,
            detail="Demo mode disabled",
        )

    return sorted(get_allowed_statuses(db))

for route in seka_features_router.routes:
    app.router.routes.append(route)
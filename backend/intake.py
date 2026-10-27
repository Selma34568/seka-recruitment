from seka_features import audit, normalize_email, find_candidate

from pathlib import Path
from uuid import uuid4
from email_parser import parse_application_email

from fastapi import (
    APIRouter, Depends, File, Form,
    HTTPException, UploadFile,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from application_validator import validate_application
from auth import require_roles
from database import get_db
from email_templates import build_missing_information_email
from models import Application, Branch, Candidate

router = APIRouter(
    prefix="/intake",
    tags=["Application Intake"],
)

MAX_CV_SIZE = 5 * 1024 * 1024
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


async def read_cv(cv: UploadFile | None):
    if cv is None:
        return None, None

    content = await cv.read(MAX_CV_SIZE + 1)
    await cv.close()

    if len(content) > MAX_CV_SIZE:
        return None, "CV exceeds 5 MB limit"

    return content, None


def validate_submission(city, position, content, file_error):
    result = validate_application(
        city=city,
        position=position,
        cv_content=content,
    )

    if file_error:
        result.errors.append(file_error)

    return result


@router.post("/validate")
async def validate_incoming_application(
    candidate_name: str = Form(...),
    city: str | None = Form(None),
    position: str | None = Form(None),
    cv: UploadFile | None = File(None),
):
    content, file_error = await read_cv(cv)

    result = validate_submission(
        city, position, content, file_error
    )

    email_preview = None

    if not result.is_complete:
        email_preview = build_missing_information_email(
            candidate_name, result
        )

    return {
        "is_complete": result.is_complete,
        "missing_fields": result.missing_fields,
        "errors": result.errors,
        "email_preview": email_preview,
        "email_sent": False,
    }


@router.post("/submit", status_code=201)
async def submit_application(
    candidate_name: str = Form(...),
    email: str = Form(...),
    city: str | None = Form(None),
    position: str | None = Form(None),
    cv: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user=Depends(require_roles("ADMIN", "HR_MANAGER")),
):
    name = candidate_name.strip()
    email = normalize_email(email)

    if len(name.split()) < 2:
        raise HTTPException(
            422, "Please provide first and last name"
        )

    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            422, "Please provide a valid email address"
        )

    content, file_error = await read_cv(cv)

    result = validate_submission(
        city, position, content, file_error
    )

    if not result.is_complete:
        return {
            "saved": False,
            "missing_fields": result.missing_fields,
            "errors": result.errors,
            "email_preview": build_missing_information_email(
                name, result
            ),
            "email_sent": False,
        }

    normalized_city = city.strip()
    normalized_position = position.strip()

    branches = db.scalars(
        select(Branch).where(
            func.lower(Branch.city) == normalized_city.lower()
        )
    ).all()

    if len(branches) != 1:
        raise HTTPException(
            422,
            "City must match exactly one SEKA branch",
        )

    branch = branches[0]

    first_name, last_name = name.split(maxsplit=1)

    filename = f"{uuid4().hex}.pdf"
    destination = UPLOAD_DIR / filename

    try:
        destination.write_bytes(content)

        
        candidate = find_candidate(db, email)

        is_new = candidate is None
        if is_new:
            candidate = Candidate(
                first_name=first_name,
                last_name=last_name,
                email=email,
                cv_filename=filename,
            )
            db.add(candidate)
        else:
            candidate.cv_filename = filename

        db.flush()


        application = Application(
            candidate_id=candidate.id,
            branch_id=branch.id,
            position=normalized_position,
            status="NEW",
            cv_filename=filename,
        )

        db.add(application)
        db.flush()

        candidate_id = candidate.id
        application_id = application.id
        if is_new:
            audit(db, "CANDIDATE_CREATED", candidate_id, actor="intake")
        audit(db, "APPLICATION_CREATED", candidate_id, application_id, {"position": normalized_position, "branch_city": branch.city}, actor="intake")
        audit(db, "CV_UPLOADED", candidate_id, application_id, {"filename": filename}, actor="intake")
        db.commit()

    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise

    return {
        "saved": True,
        "candidate_id": candidate_id,
        "application_id": application_id,
        "branch": branch.city,
        "status": "NEW",
        "email_sent": False,
    }
@router.post("/email/preview")
async def preview_email_application(
    candidate_name: str = Form(...),
    email: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    cv: UploadFile | None = File(None),
):
    parsed = parse_application_email(subject, body)

    content, file_error = await read_cv(cv)

    result = validate_submission(
        parsed["city"],
        parsed["position"],
        content,
        file_error,
    )

    email_preview = None

    if not result.is_complete:
        email_preview = build_missing_information_email(
            candidate_name,
            result,
        )

    return {
        "candidate_name": candidate_name,
        "email": email,
        "city": parsed["city"],
        "position": parsed["position"],
        "is_complete": result.is_complete,
        "missing_fields": result.missing_fields,
        "errors": result.errors,
        "email_preview": email_preview,
        "email_sent": False,
    }
@router.post("/email/submit", status_code=201)
async def submit_email_application(
    candidate_name: str = Form(...),
    email: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    cv: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user=Depends(require_roles("ADMIN", "HR_MANAGER")),
):
    parsed = parse_application_email(subject, body)

    return await submit_application(
        candidate_name=candidate_name,
        email=email,
        city=parsed["city"],
        position=parsed["position"],
        cv=cv,
        db=db,
        user=user,
    )
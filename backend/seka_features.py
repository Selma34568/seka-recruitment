"""Candidate deduplication, audit trail and safe demo mailbox routes."""
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import Application, Candidate, ApplicationEvent, EmailMessage
from permissions import candidate_scope_query

router = APIRouter(tags=["SEKA additional features"])
MAILBOX = "kariera@seka.pl"


def normalize_email(email: str) -> str:
    return email.strip().lower()


def find_candidate(db: Session, email: str):
    return db.scalar(select(Candidate).where(func.lower(func.trim(Candidate.email)) == normalize_email(email)).order_by(Candidate.id))


def audit(db: Session, event_type: str, candidate_id: int | None, application_id: int | None = None, payload=None, actor="system"):
    db.add(ApplicationEvent(candidate_id=candidate_id, application_id=application_id, event_type=event_type, payload=json.dumps(payload or {}, ensure_ascii=False), actor_label=actor))


def local_demo(request: Request):
    if os.getenv("SEKA_DEMO_MODE", "").lower() != "true":
        raise HTTPException(404, "Demo mode disabled")
    if not request.client or request.client.host not in ("127.0.0.1", "::1", "testclient"):
        raise HTTPException(403, "Local demo only")


def serialize_event(event):
    return dict(id=event.id, event_type=event.event_type, candidate_id=event.candidate_id, application_id=event.application_id, payload=json.loads(event.payload), actor_label=event.actor_label, created_at=event.created_at.isoformat())


def list_history(db, candidate_id=None, application_id=None, kind=None):
    query = select(ApplicationEvent)
    if candidate_id is not None: query = query.where(ApplicationEvent.candidate_id == candidate_id)
    if application_id is not None: query = query.where(ApplicationEvent.application_id == application_id)
    if kind: query = query.where(ApplicationEvent.event_type == kind)
    return {"events": [serialize_event(e) for e in db.scalars(query.order_by(ApplicationEvent.id.desc())).all()]}


@router.get("/demo/candidates/{candidate_id}/history", include_in_schema=False)
def candidate_history(candidate_id: int, request: Request, event_type: str | None = None, db: Session = Depends(get_db)):
    local_demo(request)
    if not db.get(Candidate, candidate_id): raise HTTPException(404, "Candidate not found")
    return list_history(db, candidate_id=candidate_id, kind=event_type)


@router.get("/demo/applications/{application_id}/history", include_in_schema=False)
def application_history(application_id: int, request: Request, event_type: str | None = None, db: Session = Depends(get_db)):
    local_demo(request)
    if not db.get(Application, application_id): raise HTTPException(404, "Application not found")
    return list_history(db, application_id=application_id, kind=event_type)


@router.get("/candidates/{candidate_id}/history")
def secure_history(candidate_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if db.scalar(candidate_scope_query(user, db).where(Candidate.id == candidate_id)) is None:
        raise HTTPException(404, "Candidate not found")
    return list_history(db, candidate_id=candidate_id)


class EmailDraft(BaseModel):
    subject: str = Field(max_length=500)
    body: str = Field(max_length=20000)
    application_id: int | None = None


def email_dict(m):
    return dict(id=m.id, direction=m.direction, from_address=m.sender, to_address=m.recipient, subject=m.subject, body=m.body, status=m.status, provider=m.provider, application_id=m.application_id, created_at=m.created_at.isoformat())


@router.get("/demo/candidates/{candidate_id}/emails", include_in_schema=False)
def demo_emails(candidate_id: int, request: Request, db: Session = Depends(get_db)):
    local_demo(request)
    if not db.get(Candidate, candidate_id): raise HTTPException(404, "Candidate not found")
    return {"messages": [email_dict(m) for m in db.scalars(select(EmailMessage).where(EmailMessage.candidate_id == candidate_id).order_by(EmailMessage.id.desc())).all()]}


@router.post("/demo/candidates/{candidate_id}/emails", status_code=201, include_in_schema=False)
def demo_email(candidate_id: int, draft: EmailDraft, request: Request, db: Session = Depends(get_db)):
    local_demo(request)
    candidate = db.get(Candidate, candidate_id)
    if not candidate: raise HTTPException(404, "Candidate not found")
    if draft.application_id is not None:
        app = db.get(Application, draft.application_id)
        if not app or app.candidate_id != candidate_id: raise HTTPException(400, "Application does not belong to candidate")
    m = EmailMessage(candidate_id=candidate_id, application_id=draft.application_id, direction="outgoing", sender=MAILBOX, recipient=candidate.email, subject=draft.subject, body=draft.body, provider="demo", status="simulated")
    db.add(m)
    audit(db, "EMAIL_DRAFTED", candidate_id, draft.application_id, {"subject": draft.subject}, "demo")
    db.commit()
    db.refresh(m)
    return {**email_dict(m), "email_sent": False}


@router.get("/candidates/{candidate_id}/emails")
def secure_emails(candidate_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if db.scalar(candidate_scope_query(user, db).where(Candidate.id == candidate_id)) is None: raise HTTPException(404, "Candidate not found")
    return {"messages": [email_dict(m) for m in db.scalars(select(EmailMessage).where(EmailMessage.candidate_id == candidate_id).order_by(EmailMessage.id.desc())).all()]}

class IncomingDemoEmail(BaseModel):
    from_address: str = Field(max_length=255)
    subject: str = Field(max_length=500)
    body: str = Field(max_length=20000)
    application_id: int | None = None


@router.post('/demo/mailbox/incoming', status_code=201, include_in_schema=False)
def simulate_incoming_email(data: IncomingDemoEmail, request: Request, db: Session = Depends(get_db)):
    """Local test fixture only. Does not poll, read or authenticate a mailbox."""
    local_demo(request)
    candidate = find_candidate(db, data.from_address)
    if candidate is None:
        raise HTTPException(404, 'Matching candidate not found; use intake first')
    if data.application_id is not None:
        app = db.get(Application, data.application_id)
        if not app or app.candidate_id != candidate.id:
            raise HTTPException(400, 'Application does not belong to candidate')
    msg = EmailMessage(candidate_id=candidate.id, application_id=data.application_id,
                       direction='incoming', sender=normalize_email(data.from_address),
                       recipient=MAILBOX, subject=data.subject, body=data.body,
                       provider='demo', status='simulated')
    db.add(msg)
    audit(db, 'EMAIL_RECEIVED_SIMULATED', candidate.id, data.application_id,
          {'subject': data.subject}, 'demo')
    db.commit()
    db.refresh(msg)
    return {**email_dict(msg), 'real_email_received': False}


@router.get('/demo/applications/{application_id}/cv', include_in_schema=False)
def demo_application_cv(application_id: int, request: Request, db: Session = Depends(get_db)):
    from pathlib import Path
    from fastapi.responses import FileResponse
    local_demo(request)
    app = db.get(Application, application_id)
    if not app or not app.cv_filename:
        raise HTTPException(404, 'Application CV not found')
    path = Path(__file__).resolve().parent / 'uploads' / Path(app.cv_filename).name
    if not path.is_file():
        raise HTTPException(404, 'CV file missing')
    return FileResponse(path, media_type='application/pdf', content_disposition_type='inline')

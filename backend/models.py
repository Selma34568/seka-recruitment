
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    name: Mapped[str] = mapped_column(String(100), unique=True)
    city: Mapped[str] = mapped_column(String(100))

    applications: Mapped[list["Application"]] = relationship(
        back_populates="branch"
    )


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    cv_filename: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    applications: Mapped[list["Application"]] = relationship(
        back_populates="candidate"
    )


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id")
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.id")
    )
    position: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(
        String(30), default="NEW"
    )
    cv_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    candidate: Mapped["Candidate"] = relationship(
        back_populates="applications"
    )
    branch: Mapped["Branch"] = relationship(
        back_populates="applications"
    )

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )

    entra_object_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30), nullable=False, default="BRANCH_MANAGER"
    )

    branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("branches.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

class RecruitmentRole(Base):
    __tablename__ = "recruitment_roles"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    permissions: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )


class RecruitmentStatus(Base):
    __tablename__ = "recruitment_statuses"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )


class ApplicationEvent(Base):
    __tablename__ = "application_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int | None] = mapped_column(ForeignKey("candidates.id"), nullable=True)
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50))
    payload: Mapped[str] = mapped_column(Text, default="{}")
    actor_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class EmailMessage(Base):
    __tablename__ = "email_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    direction: Mapped[str] = mapped_column(String(20))
    sender: Mapped[str] = mapped_column(String(255))
    recipient: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(500), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    provider: Mapped[str] = mapped_column(String(30), default="demo")
    status: Mapped[str] = mapped_column(String(30), default="simulated")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


import json
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from admin_permissions import require_permission
from database import get_db
from models import User, RecruitmentRole, RecruitmentStatus

router = APIRouter(tags=["Administration"])


# SYSTEM ADMIN — Configuration status

@router.get("/system/config/status")
def system_configuration_status(
    user: User = Depends(require_permission("system_config")),
):
    return {
        "email_configured": bool(os.getenv("SMTP_HOST")),
        "azure_configured": bool(
            os.getenv("AZURE_TENANT_ID")
            and os.getenv("AZURE_API_AUDIENCE")
        ),
        "ai_configured": bool(os.getenv("AI_API_KEY")),
    }


# ADMIN — Users

@router.get("/admin/users")
def list_admin_users(
    user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(User).order_by(User.id)
    ).all()

    return [
        {
            "id": item.id,
            "full_name": item.full_name,
            "email": item.email,
            "role": item.role,
            "branch_id": item.branch_id,
        }
        for item in users
    ]


# ADMIN — Custom roles

ALLOWED_CUSTOM_PERMISSIONS = {
    "manage_candidates",
    "manage_applications",
    "manage_branch_applications",
    "view_branch_candidates",
}


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    permissions: list[str] = Field(default_factory=list)


@router.get("/admin/roles")
def list_roles(
    user: User = Depends(require_permission("manage_roles")),
    db: Session = Depends(get_db),
):
    roles = db.scalars(
        select(RecruitmentRole).order_by(RecruitmentRole.id)
    ).all()

    return [
        {
            "id": role.id,
            "name": role.name,
            "permissions": json.loads(role.permissions),
        }
        for role in roles
    ]


@router.post("/admin/roles", status_code=201)
def create_role(
    data: RoleCreate,
    user: User = Depends(require_permission("manage_roles")),
    db: Session = Depends(get_db),
):
    name = data.name.strip()

    if not name:
        raise HTTPException(422, "Role name cannot be empty")

    permissions = sorted(set(data.permissions))

    invalid = set(permissions) - ALLOWED_CUSTOM_PERMISSIONS
    if invalid:
        raise HTTPException(
            422,
            f"Unsupported permissions: {sorted(invalid)}",
        )

    existing = db.scalar(
        select(RecruitmentRole).where(
            func.lower(RecruitmentRole.name) == name.lower()
        )
    )

    if existing:
        raise HTTPException(409, "Role already exists")

    role = RecruitmentRole(
        name=name,
        permissions=json.dumps(permissions),
    )

    db.add(role)

    try:
        db.commit()
        db.refresh(role)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Role already exists")

    return {
        "id": role.id,
        "name": role.name,
        "permissions": permissions,
    }


# ADMIN — Custom recruitment statuses

class StatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


@router.get("/admin/statuses")
def list_statuses(
    user: User = Depends(require_permission("manage_statuses")),
    db: Session = Depends(get_db),
):
    statuses = db.scalars(
        select(RecruitmentStatus).order_by(
            RecruitmentStatus.id
        )
    ).all()

    return [
        {
            "id": status.id,
            "name": status.name,
        }
        for status in statuses
    ]


@router.post("/admin/statuses", status_code=201)
def create_status(
    data: StatusCreate,
    user: User = Depends(require_permission("manage_statuses")),
    db: Session = Depends(get_db),
):
    name = data.name.strip()

    if not name:
        raise HTTPException(422, "Status name cannot be empty")

    existing = db.scalar(
        select(RecruitmentStatus).where(
            func.lower(RecruitmentStatus.name) == name.lower()
        )
    )

    if existing:
        raise HTTPException(409, "Status already exists")

    status = RecruitmentStatus(name=name)

    db.add(status)

    try:
        db.commit()
        db.refresh(status)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Status already exists")

    return {
        "id": status.id,
        "name": status.name,
    }


from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import RecruitmentRole, User


ROLE_PERMISSIONS = {
    "SYSTEM_ADMIN": {
        "system_config",
        "email_config",
        "azure_config",
        "ai_config",
    },
    "ADMIN": {
        "manage_users",
        "manage_roles",
        "manage_statuses",
        "manage_permissions",
    },
    "HR_MANAGER": {
        "manage_candidates",
        "manage_applications",
    },
    "BRANCH_MANAGER": {
        "view_branch_candidates",
        "manage_branch_applications",
    },
}


def get_user_permissions(
    user: User,
    db: Session,
) -> set[str]:
    # Built-in roles keep their existing permissions.
    if user.role in ROLE_PERMISSIONS:
        return ROLE_PERMISSIONS[user.role]

    # Look up a custom role created by ADMIN.
    custom_role = db.scalar(
        select(RecruitmentRole).where(
            RecruitmentRole.name == user.role
        )
    )

    if custom_role is None:
        return set()

    
    import json

    raw_permissions = custom_role.permissions or []

    if isinstance(raw_permissions, str):
        try:
            raw_permissions = json.loads(raw_permissions)
        except json.JSONDecodeError:
            raw_permissions = []

    if not isinstance(raw_permissions, list):
        return set()

    return {
        item
        for item in raw_permissions
        if isinstance(item, str)
    }



def require_permission(permission: str):
    def check_permission(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        permissions = get_user_permissions(user, db)

        if permission not in permissions:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions",
            )

        return user

    return check_permission

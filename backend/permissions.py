
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from admin_permissions import get_user_permissions
from models import Application, Candidate, User


def candidate_scope_query(user: User, db: Session):
    """Return only candidates the user is allowed to see."""

    statement = select(Candidate)

    # Existing built-in roles
    if user.role in {
        "SYSTEM_ADMIN",
        "ADMIN",
        "HR_MANAGER",
    }:
        return statement

    if user.role == "BRANCH_MANAGER":
        if user.branch_id is None:
            raise HTTPException(
                status_code=403,
                detail="User has no assigned branch",
            )

        return statement.where(
            Candidate.applications.any(
                Application.branch_id == user.branch_id
            )
        )

    # Custom roles created by ADMIN
    permissions = get_user_permissions(user, db)

    if "view_all_candidates" in permissions:
        return statement

    if "view_branch_candidates" in permissions:
        if user.branch_id is None:
            raise HTTPException(
                status_code=403,
                detail="User has no assigned branch",
            )

        return statement.where(
            Candidate.applications.any(
                Application.branch_id == user.branch_id
            )
        )

    raise HTTPException(
        status_code=403,
        detail="Insufficient permissions",
    )

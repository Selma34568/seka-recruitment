
from fastapi import HTTPException
from sqlalchemy import select

from models import Application, Candidate, User


def candidate_scope_query(user: User):
    """Return only candidates visible to this user."""

    statement = select(Candidate)

    if user.role in {"ADMIN", "HR_MANAGER"}:
        return statement

    if user.role == "BRANCH_MANAGER":
        if user.branch_id is None:
            raise HTTPException(
                status_code=403,
                detail="Branch manager has no assigned branch",
            )

        return statement.where(
            Candidate.applications.any(
                Application.branch_id == user.branch_id
            )
        )

    raise HTTPException(
        status_code=403,
        detail="Invalid user role",
    )

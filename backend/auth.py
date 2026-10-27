
import os

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import RecruitmentRole, User

security = HTTPBearer()

TENANT_ID = os.getenv("AZURE_TENANT_ID")
API_AUDIENCE = os.getenv("AZURE_API_AUDIENCE")


VALID_ROLES = {
    "SYSTEM_ADMIN",
    "ADMIN",
    "HR_MANAGER",
    "BRANCH_MANAGER",
}



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if not TENANT_ID or not API_AUDIENCE:
        raise HTTPException(
            status_code=503,
            detail="Microsoft Entra ID is not configured",
        )

    authority = (
        f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"
    )
    jwks_client = PyJWKClient(
        f"{authority}/discovery/v2.0/keys"
    )

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(
            credentials.credentials
        )

        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            audience=API_AUDIENCE,
            issuer=authority,
            options={"require": ["exp", "iss", "aud", "tid", "oid"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    if payload.get("tid") != TENANT_ID:
        raise HTTPException(
            status_code=401,
            detail="Invalid tenant",
        )

    object_id = payload["oid"]

    user = db.scalar(
        select(User).where(User.entra_object_id == object_id)
    )

    if user is None:
        raise HTTPException(
            status_code=403,
            detail="User is not authorized",
        )

    
    if user.role not in VALID_ROLES:
        custom_role = db.scalar(
            select(RecruitmentRole).where(
                RecruitmentRole.name == user.role
            )
        )

        if custom_role is None:
            raise HTTPException(
                status_code=403,
                detail="Invalid user role",
            )


    return user


def require_roles(*allowed_roles):
    def check_role(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions",
            )
        return user

    return check_role


from types import SimpleNamespace

from fastapi import HTTPException

from auth import require_roles


def test_role(user_role, allowed_roles):
    fake_user = SimpleNamespace(role=user_role)

    check = require_roles(*allowed_roles)

    try:
        check(fake_user)
        return "ALLOWED"
    except HTTPException as exc:
        return f"DENIED ({exc.status_code})"


print("SEKA - Role Authorization Tests")

print(
    "Admin:",
    test_role("ADMIN", ["ADMIN"])
)

print(
    "HR Manager:",
    test_role("HR_MANAGER", ["ADMIN", "HR_MANAGER"])
)

print(
    "Branch Manager accessing admin:",
    test_role("BRANCH_MANAGER", ["ADMIN"])
)

print(
    "Branch Manager accessing branch:",
    test_role("BRANCH_MANAGER", ["BRANCH_MANAGER"])
)

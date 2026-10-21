
from types import SimpleNamespace

from fastapi.testclient import TestClient

from main import app
from auth import get_current_user

demo_users = {
    "ADMIN": SimpleNamespace(
        id=1,
        full_name="Demo Admin",
        email="admin@example.com",
        role="ADMIN",
        branch_id=None,
    ),
    "HR_MANAGER": SimpleNamespace(
        id=2,
        full_name="Demo HR Manager",
        email="hr@example.com",
        role="HR_MANAGER",
        branch_id=None,
    ),
    "BRANCH_MANAGER": SimpleNamespace(
        id=3,
        full_name="Demo Branch Manager",
        email="branch@example.com",
        role="BRANCH_MANAGER",
        branch_id=1,
    ),
}

try:
    with TestClient(app) as client:
        for role, demo_user in demo_users.items():
            app.dependency_overrides[get_current_user] = (
                lambda user=demo_user: user
            )

            response = client.get("/auth/me")

            candidates_response = client.get(
                "/secure/candidates"
            )

            assert candidates_response.status_code == 200, (
                candidates_response.text
            )

            print(
                role,
                "Visible candidates:",
                len(candidates_response.json())
            )

            print(role, response.status_code, response.json())

            assert response.status_code == 200
            assert response.json()["role"] == role

    print("Demo authentication tests PASSED!")

finally:
    app.dependency_overrides.clear()

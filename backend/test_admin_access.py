from types import SimpleNamespace

from fastapi.testclient import TestClient

from auth import get_current_user
from main import app

client = TestClient(app)

try:
    for role, expected in [
        ("SYSTEM_ADMIN", (200, 403)),
        ("ADMIN", (403, 200)),
        ("HR_MANAGER", (403, 403)),
        ("BRANCH_MANAGER", (403, 403)),
    ]:
        app.dependency_overrides[get_current_user] = (
            lambda role=role: SimpleNamespace(
                role=role,
                branch_id=None,
            )
        )

        system_response = client.get("/system/config/status")
        admin_response = client.get("/admin/users")

        actual = (
            system_response.status_code,
            admin_response.status_code,
        )

        print(role, "=>", actual)
        assert actual == expected, (
            f"{role}: expected {expected}, got {actual}"
        )

    print("ADMIN ACCESS TEST PASSED!")

finally:
    app.dependency_overrides.clear()
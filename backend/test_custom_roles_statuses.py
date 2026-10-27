
from uuid import uuid4
from types import SimpleNamespace

from fastapi.testclient import TestClient

from auth import get_current_user
from main import app

client = TestClient(app)

try:
    app.dependency_overrides[get_current_user] = lambda: (
        SimpleNamespace(role="ADMIN", branch_id=None)
    )

    suffix = uuid4().hex[:8]
    role_name = f"TEST_ASSISTANT_{suffix}"
    status_name = f"TEST_SCREENING_{suffix}"

    role = client.post(
        "/admin/roles",
        json={
            "name": role_name,
            "permissions": ["view_branch_candidates"],
        },
    )
    print("Create role:", role.status_code, role.json())
    assert role.status_code == 201, role.text

    status = client.post(
        "/admin/statuses",
        json={"name": status_name},
    )
    print("Create status:", status.status_code, status.json())
    assert status.status_code == 201, status.text

    roles = client.get("/admin/roles")
    statuses = client.get("/admin/statuses")

    assert roles.status_code == 200, roles.text
    assert statuses.status_code == 200, statuses.text

    assert any(
        item["name"] == role_name for item in roles.json()
    )
    assert any(
        item["name"] == status_name for item in statuses.json()
    )

    print("CUSTOM ROLES AND STATUSES TEST PASSED!")

finally:
    app.dependency_overrides.clear()

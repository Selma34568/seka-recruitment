
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

from auth import get_current_user
from database import get_db
from main import app
from models import Candidate
from sqlalchemy import select

# This override exists only in this test process.
app.dependency_overrides[get_current_user] = lambda: (
    SimpleNamespace(role="HR_MANAGER", branch_id=None)
)

client = TestClient(app)

cv_path = Path(__file__).resolve().parent / "test_cv.pdf"

if not cv_path.exists():
    raise FileNotFoundError(
        "Save a sample PDF as backend/test_cv.pdf"
    )

try:
    with cv_path.open("rb") as cv:
        response = client.post(
            "/intake/submit",
            data={
                "candidate_name": "Test Candidate",
                "email": "test.candidate@example.com",
                "city": "Warszawa",
                "position": "HR Specialist",
            },
            files={
                "cv": (
                    "test_cv.pdf",
                    cv,
                    "application/pdf",
                )
            },
        )

    print("Status:", response.status_code)
    print("Response:", response.json())

    assert response.status_code == 201, response.text
    assert response.json()["saved"] is True

    print("Intake submit test PASSED!")

finally:
    app.dependency_overrides.clear()

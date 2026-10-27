
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

from auth import get_current_user
from main import app

app.dependency_overrides[get_current_user] = lambda: (
    SimpleNamespace(role="HR_MANAGER", branch_id=None)
)

client = TestClient(app)

cv_path = Path(__file__).resolve().parent / "test_cv.pdf"

if not cv_path.exists():
    raise FileNotFoundError("backend/test_cv.pdf bulunamadı")

try:
    with cv_path.open("rb") as cv:
        response = client.post(
            "/intake/email/submit",
            data={
                "candidate_name": "Test Candidate",
                "email": "test.candidate@example.com",
                "subject": "Job Application",
                "body": "City: Krakow\nPosition: HR Assistant",
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

    result = response.json()
    assert result["saved"] is True
    assert result["candidate_id"] == 7, (
        "Beklenen aday ID'si farklı. Test verilerini kontrol et."
    )
    assert result["branch"] == "Kraków"
    assert result["status"] == "NEW"
    assert result["email_sent"] is False

    print("EMAIL SUBMIT TEST PASSED!")

finally:
    app.dependency_overrides.clear()

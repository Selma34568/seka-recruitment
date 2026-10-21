
from application_validator import validate_application
from email_templates import build_missing_information_email


result = validate_application(
    city="Warszawa",
    position=None,
    cv_content=None,
)

email = build_missing_information_email(
    candidate_name="Anna",
    result=result,
)

print("SUBJECT:")
print(email["subject"])

print("\nEMAIL BODY:")
print(email["body"])

assert "position" in email["body"].lower()
assert "CV" in email["body"]

print("\nEmail template test PASSED!")

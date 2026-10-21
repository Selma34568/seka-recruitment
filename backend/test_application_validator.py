
from application_validator import validate_application


def check_case(name, result):
    print(f"\n{name}")
    print(f"Complete: {result.is_complete}")
    print(f"Missing: {result.missing_fields}")
    print(f"Errors: {result.errors}")


# Case 1: Missing CV and position
result1 = validate_application(
    city="Warszawa",
    position=None,
    cv_content=None,
)

check_case("Missing CV and position", result1)

assert not result1.is_complete
assert set(result1.missing_fields) == {"position", "cv"}


# Case 2: Missing city
result2 = validate_application(
    city="",
    position="HR Specialist",
    cv_content=None,
)

check_case("Missing city", result2)

assert not result2.is_complete
assert "city" in result2.missing_fields


# Case 3: Invalid PDF
result3 = validate_application(
    city="Kraków",
    position="Engineer",
    cv_content=b"NOT A REAL PDF",
)

check_case("Invalid PDF", result3)

assert not result3.is_complete
assert "CV is not a valid PDF" in result3.errors


print("\nAll application validation tests PASSED!")

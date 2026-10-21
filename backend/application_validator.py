
from dataclasses import dataclass, field
from io import BytesIO

from pypdf import PdfReader


@dataclass
class ValidationResult:
    is_complete: bool
    missing_fields: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def validate_application(
    city: str | None,
    position: str | None,
    cv_content: bytes | None,
) -> ValidationResult:
    missing_fields = []
    errors = []

    if not city or not city.strip():
        missing_fields.append("city")

    if not position or not position.strip():
        missing_fields.append("position")

    if not cv_content:
        missing_fields.append("cv")
    else:
        if not cv_content.startswith(b"%PDF-"):
            errors.append("CV is not a valid PDF")
        else:
            try:
                reader = PdfReader(BytesIO(cv_content))

                if reader.is_encrypted:
                    errors.append("CV is encrypted")
                elif len(reader.pages) == 0:
                    errors.append("CV has no pages")

                else:
                    for page in reader.pages:
                        page.extract_text()

            except Exception:
                errors.append("CV cannot be processed")

    return ValidationResult(
        is_complete=not missing_fields and not errors,
        missing_fields=missing_fields,
        errors=errors,
    )

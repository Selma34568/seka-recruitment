
from application_validator import ValidationResult


def build_missing_information_email(
    candidate_name: str,
    result: ValidationResult,
) -> dict:
    if result.is_complete:
        raise ValueError("Application is already complete")

    missing_messages = {
        "city": "Your preferred city or branch",
        "position": "The position you are applying for",
        "cv": "Your CV in PDF format",
    }

    items = [
        missing_messages[field]
        for field in result.missing_fields
        if field in missing_messages
    ]

    if result.errors:
        items.append(
            "A valid, readable PDF version of your CV"
        )

    items = list(dict.fromkeys(items))

    missing_list = "\n".join(
        f"- {item}" for item in items
    )

    subject = "SEKA Recruitment – Additional Information Required"

    body = f"""Dear {candidate_name},

Thank you for your interest in SEKA.

We have reviewed your application and noticed that
some information is missing or needs correction.

Please provide the following:

{missing_list}

You may reply to this email with the requested
information or an updated CV.

Thank you for your cooperation.

Best regards,
SEKA Recruitment Team
"""

    return {
        "subject": subject,
        "body": body,
    }

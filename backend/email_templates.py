
from application_validator import ValidationResult


def build_missing_information_email(
    candidate_name: str,
    result: ValidationResult,
) -> dict:
    if result.is_complete:
        raise ValueError("Application is already complete")

    missing_messages = {
        "city": "Miasto lub oddział, w którym chcesz pracować",
        "position": "Stanowisko, o które się ubiegasz",
        "cv": "CV w formacie PDF",
    }

    items = [
        missing_messages[field]
        for field in result.missing_fields
        if field in missing_messages
    ]

    if result.errors:
        items.append(
            "Poprawny i możliwy do odczytania plik CV w formacie PDF"
        )

    items = list(dict.fromkeys(items))
    missing_list = "\n".join(f"- {item}" for item in items)

    subject = "SEKA Rekrutacja – Prośba o uzupełnienie danych"

    body = f"""Dzień dobry, {candidate_name},

Dziękujemy za zainteresowanie pracą w SEKA.

Po zapoznaniu się z przesłaną aplikacją zauważyliśmy,
że niektóre informacje są niekompletne lub wymagają poprawy.

Uprzejmie prosimy o uzupełnienie następujących informacji:

{missing_list}

Prosimy o przesłanie brakujących informacji lub poprawionego
CV w odpowiedzi na tę wiadomość.

Dziękujemy za współpracę.

Z poważaniem,
Zespół Rekrutacji SEKA
"""

    return {
        "subject": subject,
        "body": body,
    }

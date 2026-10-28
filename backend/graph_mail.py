
import os
from urllib.parse import quote

import msal
import requests


def send_seka_email(to_email: str, subject: str, message: str):
    if os.getenv("SEKA_REAL_EMAIL_ENABLED", "false").lower() != "true":
        raise RuntimeError("Real email sending is disabled.")

    tenant_id = os.getenv("MS_TENANT_ID")
    client_id = os.getenv("MS_CLIENT_ID")
    client_secret = os.getenv("MS_CLIENT_SECRET")

    if not all([tenant_id, client_id, client_secret]):
        raise RuntimeError("Microsoft Graph credentials are missing.")

    if not to_email or "@" not in to_email or not subject.strip():
        raise ValueError("Recipient and subject are required.")

    app = msal.ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret,
    )

    token_result = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )

    token = token_result.get("access_token")
    if not token:
        raise RuntimeError("Microsoft Graph authentication failed.")

    sender = "kariera@seka.pl"

    payload = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": message,
            },
            "toRecipients": [
                {"emailAddress": {"address": to_email}}
            ],
        },
        "saveToSentItems": True,
    }

    response = requests.post(
        f"https://graph.microsoft.com/v1.0/users/{quote(sender, safe='')}/sendMail",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
        timeout=30,
    )

    if response.status_code != 202:
        raise RuntimeError(
            f"Microsoft Graph rejected the message: HTTP {response.status_code}"
        )

    return {
        "accepted": True,
        "email_sent": False,
        "status": "accepted_by_graph",
    }

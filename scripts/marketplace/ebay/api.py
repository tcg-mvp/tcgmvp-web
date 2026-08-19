from __future__ import annotations

import base64
import os

import requests
from dotenv import load_dotenv


load_dotenv(".env.local")

EBAY_OAUTH_URL = (
    "https://api.ebay.com/identity/v1/oauth2/token"
)

EBAY_OAUTH_SCOPE = (
    "https://api.ebay.com/oauth/api_scope"
)


def get_application_token() -> str:
    app_id = os.getenv("EBAY_APP_ID")
    cert_id = os.getenv("EBAY_CERT_ID")

    if not app_id:
        raise RuntimeError(
            "EBAY_APP_ID is missing from the environment."
        )

    if not cert_id:
        raise RuntimeError(
            "EBAY_CERT_ID is missing from the environment."
        )

    credentials = f"{app_id}:{cert_id}"

    encoded_credentials = base64.b64encode(
        credentials.encode("utf-8")
    ).decode("utf-8")

    response = requests.post(
        EBAY_OAUTH_URL,
        headers={
            "Authorization": (
                f"Basic {encoded_credentials}"
            ),
            "Content-Type": (
                "application/x-www-form-urlencoded"
            ),
        },
        data={
            "grant_type": "client_credentials",
            "scope": EBAY_OAUTH_SCOPE,
        },
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            "eBay OAuth request failed.\n"
            f"Status: {response.status_code}\n"
            f"Response: {response.text}"
        )

    payload = response.json()

    access_token = payload.get("access_token")

    if not access_token:
        raise RuntimeError(
            "eBay OAuth response did not contain "
            "an access_token."
        )

    return access_token
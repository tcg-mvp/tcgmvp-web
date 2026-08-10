from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client


PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env.local")


def get_supabase_client() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise RuntimeError(
            "NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
        )

    if not key:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY environment variable is not set."
        )

    return create_client(url, key)
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def start_pipeline_run(
    *,
    pipeline_name: str,
) -> int:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("pipeline_runs")
        .insert(
            {
                "pipeline_name": pipeline_name,
                "started_at": datetime.now(UTC).isoformat(),
                "status": "running",
            }
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Could not create pipeline run record."
        )

    return int(rows[0]["id"])


def finish_pipeline_run(
    *,
    run_id: int,
    status: str,
    steps_successful: int,
    steps_failed: int,
    duration_seconds: float,
    details: dict[str, Any],
) -> None:
    supabase = get_supabase_client()

    (
        supabase
        .table("pipeline_runs")
        .update(
            {
                "completed_at": datetime.now(UTC).isoformat(),
                "status": status,
                "steps_successful": steps_successful,
                "steps_failed": steps_failed,
                "duration_seconds": duration_seconds,
                "details": details,
            }
        )
        .eq("id", run_id)
        .execute()
    )
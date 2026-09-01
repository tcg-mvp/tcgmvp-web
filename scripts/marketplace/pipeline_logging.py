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
                "started_at": datetime.now(
                    UTC
                ).isoformat(),
                "status": "running",
            }
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Could not create pipeline run "
            "record."
        )

    return int(
        rows[0]["id"]
    )


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
                "completed_at": datetime.now(
                    UTC
                ).isoformat(),
                "status": status,
                "steps_successful": (
                    steps_successful
                ),
                "steps_failed": (
                    steps_failed
                ),
                "duration_seconds": (
                    duration_seconds
                ),
                "details": details,
            }
        )
        .eq(
            "id",
            run_id,
        )
        .execute()
    )


def start_pipeline_step(
    *,
    run_id: int,
    step_name: str,
) -> int:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("pipeline_run_steps")
        .insert(
            {
                "pipeline_run_id": run_id,
                "step_name": step_name,
                "status": "running",
                "started_at": datetime.now(
                    UTC
                ).isoformat(),
            }
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Could not create pipeline "
            "step record."
        )

    return int(
        rows[0]["id"]
    )


def finish_pipeline_step(
    *,
    step_id: int,
    status: str,
    duration_seconds: float,
    products_attempted: int = 0,
    products_successful: int = 0,
    products_failed: int = 0,
    records_processed: int = 0,
    error_summary: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    supabase = get_supabase_client()

    (
        supabase
        .table("pipeline_run_steps")
        .update(
            {
                "completed_at": datetime.now(
                    UTC
                ).isoformat(),
                "status": status,
                "duration_seconds": (
                    duration_seconds
                ),
                "products_attempted": (
                    products_attempted
                ),
                "products_successful": (
                    products_successful
                ),
                "products_failed": (
                    products_failed
                ),
                "records_processed": (
                    records_processed
                ),
                "error_summary": (
                    error_summary
                ),
                "details": (
                    details or {}
                ),
            }
        )
        .eq(
            "id",
            step_id,
        )
        .execute()
    )
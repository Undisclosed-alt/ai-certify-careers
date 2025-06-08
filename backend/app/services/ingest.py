# backend/app/services/ingest.py
"""
Async helper that bulk-upserts Job rows.
"""

from __future__ import annotations

from typing import Iterable

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

# -------------------------------------------------------------
# 🔑  important – import the model straight from the sub-module
#     (avoids “ImportError: cannot import name 'Job'” in worker)
# -------------------------------------------------------------
from backend.app.models.job import Job              # ✅ ← change is here
# -------------------------------------------------------------


async def bulk_upsert_jobs(session: AsyncSession, jobs: Iterable[Job]) -> None:
    """
    Insert new jobs or update existing ones (same company + external_id).
    """
    if not jobs:
        return

    stmt = (
        insert(Job)
        .values([j.__dict__ for j in jobs])
        .on_conflict_do_update(
            index_elements=["company", "external_id"],
            set_={
                "title":         Job.title,
                "location_raw":  Job.location_raw,
                "location_norm": Job.location_norm,
                "remote_flag":   Job.remote_flag,
                "date_posted":   Job.date_posted,
                "last_seen":     Job.last_seen,
                "status":        Job.status,
                "url":           Job.url,
                "salary_min":    Job.salary_min,
                "salary_max":    Job.salary_max,
                "currency":      Job.currency,
                "raw_html":      Job.raw_html,
            },
        )
    )
    await session.execute(stmt)
    await session.commit()

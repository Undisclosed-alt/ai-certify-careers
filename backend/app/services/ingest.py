from typing import Iterable
from backend.app.models import Job                 # your SQLAlchemy model
from backend.app.db import AsyncSessionLocal

async def bulk_upsert_jobs(jobs: Iterable[Job]) -> int:
    """
    Insert-or-update a list of Job objects.
    Returns the number of rows written.
    """
    written = 0
    async with AsyncSessionLocal() as session:
        async with session.begin():
            for job in jobs:
                session.merge(job)                 # upsert-style
                written += 1
    return written

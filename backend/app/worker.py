"""
Background worker that periodically scrapes public job pages
and bulk-upserts them into the database.
"""

import asyncio
import logging
from datetime import datetime
from typing import Iterable

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db import AsyncSessionLocal
from backend.app.services.ingest import bulk_upsert_jobs
from backend.app.scraper.adapters.acme import AcmeScraper  # add more adapters here

logger = logging.getLogger("worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")


async def run_one_adapter(session: AsyncSession, adapter_cls) -> int:
    """Fetch + upsert for a single adapter class."""
    adapter = adapter_cls()
    jobs = [job async for job in adapter.fetch()]
    if not jobs:
        logger.info("%s: nothing to ingest", adapter_cls.__name__)
        return 0

    ingested = await bulk_upsert_jobs(session, jobs)
    logger.info("%s: %s postings ingested", adapter_cls.__name__, ingested)
    return ingested


async def scrape_all() -> None:
    """Task executed by APScheduler."""
    start = datetime.utcnow()
    total = 0

    async with AsyncSessionLocal() as session:
        for adapter in (AcmeScraper,):  # ← register more adapters here
            total += await run_one_adapter(session, adapter)

    dur = (datetime.utcnow() - start).total_seconds()
    logger.info("scrape cycle complete – %s rows, %.1fs", total, dur)


def main() -> None:
    scheduler = AsyncIOScheduler(timezone="UTC")
    # first run immediately, then every 60 min
    scheduler.add_job(scrape_all, trigger=IntervalTrigger(hours=1), next_run_time=datetime.utcnow())
    scheduler.start()

    logger.info("worker started – press Ctrl-C to quit")
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    main()

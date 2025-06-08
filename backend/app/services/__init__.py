# re-export helpers so `from backend.app.services import …` works
from .ingest import bulk_upsert_jobs  # noqa: F401


from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Iterable, TypedDict, Any

class JobData(TypedDict):
    external_id: str
    company: str
    title: str
    url: str
    location_raw: str | None
    date_posted: str | None
    remote_flag: bool

class ScraperAdapter(ABC):
    """One concrete implementation per careers site."""

    @abstractmethod
    async def fetch(self) -> Iterable[JobData]:
        """Yield raw job postings."""

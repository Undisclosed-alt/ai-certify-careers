from typing import Iterable
from datetime import date
from backend.app.scraper.base import ScraperAdapter, JobData
from backend.app.scraper.html import get_html

CAREERS_URL = "https://example.com/careers"

class AcmeScraper(ScraperAdapter):
    company = "Acme Corp"

    async def fetch(self) -> Iterable[JobData]:
        doc = await get_html(CAREERS_URL)
        for row in doc.css(".job-row"):
            yield {
                "external_id": row.attributes["data-id"],
                "company": self.company,
                "title": row.css_first(".job-title").text(strip=True),
                "url": row.css_first("a").attributes["href"],
                "location_raw": row.css_first(".job-location").text(strip=True),
                "date_posted": date.today().isoformat(),
                "remote_flag": "remote" in row.text().lower(),
            }

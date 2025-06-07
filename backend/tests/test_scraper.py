# backend/tests/test_scraper.py
import pytest
from selectolax.parser import HTMLParser
from backend.app.scraper.adapters.acme import AcmeScraper

fake_html = """
<div class="job-row" data-id="123">
  <a href="https://example.com/jobs/123"><span class="job-title">QA Engineer</span></a>
  <span class="job-location">Remote</span>
</div>
"""

@pytest.mark.asyncio
async def test_acme_fetch(monkeypatch):
    async def _fake_get_html(url: str):
        return HTMLParser(fake_html)

    # patch exactly what the adapter imports
    monkeypatch.setattr(
        "backend.app.scraper.adapters.acme.get_html",
        _fake_get_html,
        raising=True,          # ← old kw-arg name
    )

    jobs = [job async for job in AcmeScraper().fetch()]
    assert jobs and jobs[0]["external_id"] == "123"

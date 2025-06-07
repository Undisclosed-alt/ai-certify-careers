import pytest, asyncio
from selectolax.parser import HTMLParser
from backend.app.scraper.adapters.acme import AcmeScraper
from backend.app.scraper import html as html_util


fake_html = """
<div class="job-row" data-id="123">
    <a href="https://example.com/jobs/123">
        <span class="job-title">QA Engineer</span>
    </a>
    <span class="job-location">Remote</span>
</div>
"""

@pytest.mark.asyncio
async def test_acme_fetch(monkeypatch):
    async def _fake_get_html(url: str):
        return HTMLParser(fake_html)

    # patch the network helper
    monkeypatch.setattr(html_util, "get_html", _fake_get_html)

    scraper = AcmeScraper()
    jobs = [job async for job in scraper.fetch()]
    assert jobs and jobs[0]["external_id"] == "123"

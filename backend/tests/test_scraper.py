import pytest, asyncio
from backend.app.scraper.adapters.acme import AcmeScraper

@pytest.mark.asyncio
async def test_acme_fetch():
    scraper = AcmeScraper()
    jobs = [job async for job in scraper.fetch()]
    assert jobs, "should return at least one posting"
    sample = jobs[0]
    for field in ("external_id", "company", "title", "url"):
        assert field in sample and sample[field]

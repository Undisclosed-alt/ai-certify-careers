import httpx
from selectolax.parser import HTMLParser

async def get_html(url: str) -> HTMLParser:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        r.raise_for_status()
    return HTMLParser(r.text)

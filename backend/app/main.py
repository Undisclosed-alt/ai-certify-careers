from fastapi import FastAPI
from backend.app.routers.jobs import router as jobs_router

app = FastAPI(title="Careers API")

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(jobs_router)

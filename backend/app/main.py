from fastapi import FastAPI

app = FastAPI(title="Careers API")

@app.get("/health")
async def health():
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from inspectai.config import settings

app = FastAPI(
    title="InspectAI",
    version="0.1.0",
    description="Automated Adversarial Testing and Improvement Pipeline for AI Systems",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0", "environment": settings.environment}


@app.get("/")
async def root() -> dict:
    return {"message": "Welcome to InspectAI — Automated Adversarial Testing Pipeline"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("inspectai.main:app", host="0.0.0.0", port=8000, reload=True)

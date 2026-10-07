from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.requirements import router as requirements_router
from app.api.test_cases import router as test_cases_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requirements_router)
app.include_router(test_cases_router)

@app.get("/health")
def health():
    return {"status": "ok"}
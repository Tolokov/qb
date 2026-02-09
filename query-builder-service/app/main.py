from fastapi import FastAPI
from app.api.v1.routes.query import router as query_router

app = FastAPI(title="Query Builder Service")

app.include_router(query_router, prefix="/api/v1")

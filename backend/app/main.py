from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.config import SETTINGS
from app.utils import include_openapi


def create_app() -> FastAPI:
    app = FastAPI(
        title=SETTINGS.APP_TITLE,
        description=SETTINGS.APP_DESC,
        version=SETTINGS.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=SETTINGS.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_v1_router, prefix=SETTINGS.api_v1_prefix)
    app = include_openapi(app)
    return app


app = create_app()

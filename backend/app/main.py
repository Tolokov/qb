import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.orders import router as orders_router
from app.api.v1.routes.products import router as products_router
from app.api.v1.routes.query import router as query_router
from app.api.v1.routes.users import router as users_router
from app.config import SETTINGS


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
    app.include_router(health_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(query_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(users_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(orders_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(products_router, prefix=SETTINGS.api_v1_prefix)

    openapi_cache_path = Path(__file__).resolve().parents[2] / "openapi.json"

    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema  # type: ignore[no-any-return]

        if openapi_cache_path.exists():
            app.openapi_schema = json.loads(openapi_cache_path.read_text(encoding="utf-8"))
            return app.openapi_schema  # type: ignore[no-any-return]

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        app.openapi_schema = openapi_schema
        openapi_cache_path.write_text(
            json.dumps(openapi_schema, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return app.openapi_schema  # type: ignore[no-any-return]

    app.openapi = custom_openapi  # type: ignore[assignment]

    @app.get(
        "/.well-known/appspecific/com.chrome.devtools.json",
        include_in_schema=False,
    )
    def _chrome_devtools_well_known() -> dict:
        return {}

    return app


app = create_app()

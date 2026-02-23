from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    app.include_router(query_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(users_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(orders_router, prefix=SETTINGS.api_v1_prefix)
    app.include_router(products_router, prefix=SETTINGS.api_v1_prefix)

    @app.get(
        "/.well-known/appspecific/com.chrome.devtools.json",
        include_in_schema=False,
    )
    def _chrome_devtools_well_known() -> dict:
        """Тихий ответ для Chrome DevTools — убирает 404 из логов."""
        return {}

    return app


app = create_app()

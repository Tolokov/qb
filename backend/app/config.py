from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_TITLE: str = "Query Builder Service"
    APP_DESC: str = (
        "Принимает декларативное JSON-описание запроса и компилирует его в Hadoop-совместимый SQL."
    )
    APP_VERSION: str = Field(default="0.7.0", alias="version")
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    api_v1_prefix: str = "/api/v1"
    security_compile_path: str = f"{api_v1_prefix}/query/compile"
    security_compile_method: str = "POST"
    rate_limit_requests: int = 60
    rate_limit_window_sec: int = 60
    sql_injection_patterns: tuple[str, ...] = ()
    HEALTH_CHECK_TIMEOUT_SEC: int = 3
    MAX_ROWS: int = 500
    SPARK_MASTER: str = "local[*]"
    SPARK_WAREHOUSE_DIR: str = "defaultLakehouse"
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


SETTINGS = get_settings()

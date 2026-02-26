import logging
from typing import Any

from fastapi import HTTPException, status

from app.services.base import IQueryRepository
from app.services.validation_service import RequestValidationService

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(
        self,
        repository: IQueryRepository,
        validator: RequestValidationService | None = None,
    ) -> None:
        self._repository = repository
        self._validator = validator or RequestValidationService()

    def execute(self, payload: Any) -> dict[str, Any]:
        try:
            self._validator.validate_json_payload(payload)
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            logger.exception("Unexpected error in request validation: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            ) from e

        try:
            return self._repository.execute(payload)
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            logger.error("Repository execution error: %s", e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Query execution failed",
            ) from e

    def execute_sql(self, sql: str) -> dict[str, Any]:
        try:
            self._validator.validate_sql_string(sql)
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            logger.exception("Unexpected error in SQL validation: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            ) from e

        try:
            return self._repository.execute(sql)
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            logger.error("Repository execution error (SQL): %s", e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Query execution failed",
            ) from e

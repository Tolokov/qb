import logging
from typing import Any

from fastapi import HTTPException, status

from app.services.base import IQueryRepository

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(self, repository: IQueryRepository) -> None:
        self._repository = repository

    def execute(self, payload: Any) -> dict[str, Any]:
        try:
            self._validate_payload_type(payload)
            if isinstance(payload, dict):
                self._validate_payload_structure(payload)
                self._validate_business_rules(payload)
        except ValueError as e:
            logger.warning("Validation failed: %s", e)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Unexpected error in query service: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
            ) from e

        try:
            return self._repository.execute(payload)
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Repository execution error: %s", e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Query execution failed"
            ) from e

    def _validate_payload_type(self, payload: object) -> None:
        allowed = (dict, list, str, int, float, bool, type(None))
        if not isinstance(payload, allowed):
            raise ValueError("Body must be valid JSON (object/array/string/number/bool/null)")

    def _validate_payload_structure(self, payload: dict[str, Any]) -> None: ...

    def _validate_business_rules(self, payload: dict[str, Any]) -> None: ...

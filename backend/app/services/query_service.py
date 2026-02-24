import logging
from typing import Any

from fastapi import HTTPException

from app.services.base import IQueryRepository

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(self, repository: IQueryRepository) -> None:
        self._repository = repository

    def execute(self, payload: Any) -> dict[str, Any]:
        """
        Обрабатывает запрос: проверки, валидация, вызов репозитория.
        Репозиторий — конечная точка (эхо или БД).
        Принимает любой JSON (object/array/string/number/bool/null).
        """
        try:
            self._validate_payload_type(payload)
            if isinstance(payload, dict):
                self._validate_payload_structure(payload)
                self._validate_business_rules(payload)
        except ValueError as e:
            logger.warning("Validation failed: %s", e)
            raise HTTPException(status_code=400, detail=str(e)) from e
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Unexpected error in query service: %s", e)
            raise HTTPException(status_code=500, detail="Internal server error") from e

        return self._repository.execute(payload)

    def _validate_payload_type(self, payload: object) -> None:
        """Допустимы любые JSON-типы: dict, list, str, int, float, bool, None."""
        allowed = (dict, list, str, int, float, bool, type(None))
        if not isinstance(payload, allowed):
            raise ValueError("Body must be valid JSON (object/array/string/number/bool/null)")

    def _validate_payload_structure(self, payload: dict[str, Any]) -> None:
        """Проверка структуры payload (обязательные поля, типы). Зарезервировано для реализации."""
        # TODO: реализовать проверку структуры (from, select/columns и т.д.)
        pass

    def _validate_business_rules(self, payload: dict[str, Any]) -> None:
        """Бизнес-правила (лимиты, допустимые операторы и т.д.). Зарезервировано для реализации."""
        # TODO: реализовать бизнес-валидацию
        pass

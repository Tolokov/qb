from typing import Any

from fastapi import APIRouter, Body, Depends, Request

from app.api.v1.schemas.query import QueryResponse
from app.dependencies import get_query_service
from app.services.query_service import QueryService

router = APIRouter()


def _extract_payload(body: Any) -> Any:
    """Extract payload from body. Backward compatible: {"payload": x} -> x; else body as-is."""
    if isinstance(body, dict) and "payload" in body:
        return body["payload"]
    return body


_COMPILE_BODY_EXAMPLE = {
    "from": "table",
    "select": ["*"],
    "orderBy": [{"column": "id", "direction": "ASC"}],
}


@router.post(
    "/query/compile",
    response_model=QueryResponse,
    summary="Эхо JSON",
    description=(
        "Принимает любой валидный JSON; при body={'payload': ...} "
        "используется payload (обратная совместимость)."
    ),
)
async def compile_query_route(
    request: Request,
    body: Any = Body(
        default=None,
        description="Любой JSON: object/array/string/number/bool/null. "
        "Для обратной совместимости поддерживается формат {'payload': ...}.",
        openapi_examples={
            "object": {
                "summary": "Объект запроса (по умолчанию)",
                "value": _COMPILE_BODY_EXAMPLE,
            },
            "payload": {
                "summary": "С payload (обратная совместимость)",
                "value": {"payload": _COMPILE_BODY_EXAMPLE},
            },
        },
        json_schema_extra={
            "oneOf": [
                {"type": "object", "description": "JSON object"},
                {"type": "array", "description": "JSON array"},
                {"type": "string"},
                {"type": "number"},
                {"type": "boolean"},
                {"type": "null"},
            ],
            "example": _COMPILE_BODY_EXAMPLE,
        },
    ),
    service: QueryService = Depends(get_query_service),
) -> QueryResponse:
    if body is None and not await request.body():
        body = {}
    data = _extract_payload(body)
    result = service.execute(data)
    return QueryResponse(**result)

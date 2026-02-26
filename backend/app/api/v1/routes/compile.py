import json

from typing import Any

from fastapi import APIRouter, Body, Depends, Request

from app.api.v1.schemas.query import QueryResponse
from app.dependencies import get_json_query_service
from app.services.query_service import QueryService
from app.utils import extract_payload, get_query_logger

router = APIRouter()

_COMPILE_BODY_EXAMPLE = {
    "from": "table",
    "select": ["*"],
    "orderBy": [{"column": "id", "direction": "ASC"}],
}


@router.post(
    "/query/compile",
    response_model=QueryResponse,
    summary="Компиляция JSON-запроса в SQL и выполнение",
    description=(
        "Принимает описание запроса в формате JSON_SQL. При body={'payload': ...} "
        "используется payload (обратная совместимость). Возвращает скомпилированный SQL "
        "и (опционально) табличный результат выполнения."
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
    service: QueryService = Depends(get_json_query_service),
) -> QueryResponse:
    if body is None and not await request.body():
        body = {}
    query_logger = get_query_logger()
    query_logger.debug(json.dumps(body, ensure_ascii=False, default=str))
    data = extract_payload(body)
    result = service.execute(data)
    return QueryResponse(**result)

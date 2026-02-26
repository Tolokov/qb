import json
from typing import Any

from fastapi import Body, Depends, Request, APIRouter

from app.api.v1.schemas.query import QueryResponse
from app.dependencies import get_query_service
from app.services.query_service import QueryService
from app.utils import get_query_logger

_COMPILE_SQL_EXAMPLE = "SELECT 1 AS x"

router = APIRouter()

@router.post(
    "/query/compile-sql",
    response_model=QueryResponse,
    summary="Выполнить SQL-строку",
    description="Принимает SQL в виде строки и выполняет его на Spark.",
)
async def compile_sql_route(
    request: Request,
    body: Any = Body(
        default=_COMPILE_SQL_EXAMPLE,
        description="SQL-строка для выполнения.",
        json_schema_extra={"example": _COMPILE_SQL_EXAMPLE, "type": "string"},
    ),
    service: QueryService = Depends(get_query_service),
) -> QueryResponse:
    if body is None and not await request.body():
        body = _COMPILE_SQL_EXAMPLE
    query_logger = get_query_logger()
    query_logger.debug(json.dumps(body, ensure_ascii=False, default=str))
    sql = body["sql"] if isinstance(body, dict) and "sql" in body else body
    result = service.execute_sql(sql)
    return QueryResponse(**result)

from fastapi import APIRouter, Depends

from app.api.v1.schemas.query import QueryRequest, QueryResponse
from app.dependencies import get_query_service
from app.services.query_service import QueryService

router = APIRouter()


@router.post(
    "/query/compile",
    response_model=QueryResponse,
    summary="Эхо JSON",
    description="Принимает JSON (payload), возвращает эхо.",
)
def compile_query_route(
    body: QueryRequest,
    service: QueryService = Depends(get_query_service),
) -> QueryResponse:
    result = service.execute(body.payload)
    return QueryResponse(**result)

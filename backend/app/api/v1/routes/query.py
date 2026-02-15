from fastapi import APIRouter, Body, Depends, HTTPException

from app.dependencies import get_query_service
from app.services.query_service import QueryService

router = APIRouter()


@router.post("/query/compile")
def compile_query_route(
    payload: dict = Body(...),
    service: QueryService = Depends(get_query_service),
):
    try:
        return service.execute(payload)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка компиляции: {e!s}")

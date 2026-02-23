from fastapi import APIRouter, Depends

from app.dependencies import get_spark_repository
from app.repositories.spark_repository import SparkRepository

router = APIRouter(tags=["Backend"])


@router.get(
    "/backend",
    summary="CRUD backend mode",
    description="Returns whether CRUD uses Spark or in-memory storage.",
)
def crud_backend_mode(
    repository=Depends(get_spark_repository),
) -> dict[str, str]:
    return {
        "crud_backend": "spark" if isinstance(repository, SparkRepository) else "memory",
    }

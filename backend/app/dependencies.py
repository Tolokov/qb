from functools import lru_cache

from app.repositories.echo_repository import EchoQueryRepository
from app.services.query_service import QueryService


@lru_cache
def get_query_repository() -> EchoQueryRepository:
    return EchoQueryRepository()


def get_query_service() -> QueryService:
    return QueryService(repository=get_query_repository())

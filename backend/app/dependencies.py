from fastapi import Depends

from app.query_builder.query_builder import QueryBuilder
from app.query_builder.spark_renderer import SparkCodeRenderer
from app.repositories.query_repository import MockQueryRepository
from app.services.base import IConditionBuilder, IQueryCompiler, IQueryRepository
from app.services.condition_builder import ConditionBuilderService
from app.services.query_compiler import QueryCompilerService
from app.services.query_service import QueryService


def get_condition_builder() -> IConditionBuilder:
    return ConditionBuilderService()


def get_query_compiler(
    condition_builder: IConditionBuilder = Depends(get_condition_builder),
) -> IQueryCompiler:
    return QueryCompilerService(condition_builder=condition_builder)


def get_query_builder() -> QueryBuilder:
    return QueryBuilder()


def get_spark_renderer() -> SparkCodeRenderer:
    return SparkCodeRenderer()


def get_query_repository(
    query_builder: QueryBuilder = Depends(get_query_builder),
    renderer: SparkCodeRenderer = Depends(get_spark_renderer),
) -> IQueryRepository:
    return MockQueryRepository(query_builder=query_builder, renderer=renderer)


def get_query_service(
    repository: IQueryRepository = Depends(get_query_repository),
) -> QueryService:
    return QueryService(repository=repository)

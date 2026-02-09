from fastapi import APIRouter
from app.models.query import Query
from app.services.query_compiler import compile_query

router = APIRouter()

@router.post("/query/compile")
def compile(query: Query):
    sql = compile_query(query)
    return {"sql": sql}

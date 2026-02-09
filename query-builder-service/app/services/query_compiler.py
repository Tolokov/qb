from app.models.query import Query
from app.services.condition_builder import build_condition

def compile_query(query: Query) -> str:
    cols = []
    for col in query.columns:
        if col.aggregate:
            expr = f"{col.aggregate.upper()}({col.name})"
        else:
            expr = col.name
        if col.alias:
            expr += f" AS {col.alias}"
        cols.append(expr)

    sql = f"SELECT {', '.join(cols)} FROM {query.from_.table}"

    if query.where:
        sql += f" WHERE {build_condition(query.where)}"

    if query.group_by:
        sql += f" GROUP BY {', '.join(query.group_by)}"

    if query.having:
        sql += f" HAVING {build_condition(query.having)}"

    if query.order_by:
        order = ", ".join(
            f"{o['field']} {o['direction'].upper()}" for o in query.order_by
        )
        sql += f" ORDER BY {order}"

    if query.limit:
        sql += f" LIMIT {query.limit}"

    return sql

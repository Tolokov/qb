from app.models.query import Query
from app.services.base import IConditionBuilder, QueryCompilerBase


class QueryCompilerService(QueryCompilerBase):
    def __init__(self, condition_builder: IConditionBuilder) -> None:
        self._condition_builder = condition_builder

    def compile(self, query: Query) -> str:
        if not query.columns:
            raise ValueError("Список columns не может быть пустым")
        table = getattr(query.from_, "table", None) or ""
        if not table:
            raise ValueError("Не указана таблица (from.table)")

        cols = []
        for col in query.columns:
            if col.aggregate:
                expr = f"{col.aggregate.upper()}({col.name})"
            else:
                expr = col.name
            if col.alias:
                expr += f" AS {col.alias}"
            cols.append(expr)

        sql = f"SELECT {', '.join(cols)} FROM {table}"

        if query.where:
            sql += f" WHERE {self._condition_builder.build(query.where)}"

        if query.group_by:
            sql += f" GROUP BY {', '.join(query.group_by)}"

        if query.having:
            sql += f" HAVING {self._condition_builder.build(query.having)}"

        if query.order_by:
            order_parts = []
            for o in query.order_by:
                field = o.get("field") or o.get("column") or ""
                direction = (o.get("direction") or "ASC").upper()
                if field:
                    order_parts.append(f"{field} {direction}")
            if order_parts:
                sql += " ORDER BY " + ", ".join(order_parts)

        if query.limit:
            sql += f" LIMIT {query.limit}"

        return sql

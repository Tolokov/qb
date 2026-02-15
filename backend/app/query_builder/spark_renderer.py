from typing import Any

from app.query_builder.spark_query import SparkQuery


def _render_where(where: dict[str, Any], indent: str) -> str:
    field = where.get("field") or where.get("column") or "string"
    op = where.get("operator") or "=="
    if op not in (">", "<", ">=", "<=", "!=", "=="):
        op = "=="
    value = where.get("value") or "string"
    conditions = where.get("conditions") or []
    cond_expr = conditions[0] if conditions else "string"
    if op == "==":
        return f'{indent}.filter(\n{indent}    (F.col("{field}") == "{value}") &\n{indent}    (F.expr("{cond_expr}"))\n{indent})'
    return f'{indent}.filter(F.col("{field}") {op} "{value}")'


def _render_having(having: list[str] | dict[str, Any] | None, indent: str) -> str:
    if having is None:
        return ""
    if isinstance(having, list) and having:
        expr = having[0]
        return f'{indent}.filter(F.expr("{expr}"))'
    if isinstance(having, dict):
        field = having.get("field") or "string"
        value = having.get("value") or "string"
        conditions = having.get("conditions") or []
        cond_expr = conditions[0] if conditions else "string"
        return f'{indent}.filter(\n{indent}    (F.col("{field}") == "{value}") &\n{indent}    (F.expr("{cond_expr}"))\n{indent})'
    return ""


def _render_format1(query: SparkQuery) -> str:
    indent = "        "
    lines = [
        "",
        "    from pyspark.sql import functions as F",
        "",
        f'    df = spark.table("{query.table}")',
        "",
        "    result = (",
        "        df",
    ]
    if query.where:
        lines.append(_render_where(query.where, indent))
    if query.group_by:
        gb = ", ".join(f'"{x}"' for x in query.group_by)
        lines.append(f"{indent}.groupBy({gb})")
    if query.aggregations:
        agg = query.aggregations[0]
        func = (agg.get("function") or "string").lower()
        name = agg.get("column", "string")
        alias = agg.get("alias", "string")
        lines.append(f'{indent}.agg(\n{indent}    F.expr("{func}({name})").alias("{alias}")\n{indent})')
    if query.having:
        hav = _render_having(query.having, indent)
        if hav:
            lines.append(hav)
    if query.order_by:
        ob = query.order_by[0]
        col_expr = ob.get("column", "additionalProp1")
        lines.append(f'{indent}.orderBy(F.expr("{col_expr}"))')
    if query.limit is not None:
        lines.append(f"{indent}.limit({query.limit})")
    lines.append("    )")
    return "\n".join(lines)


def _render_format2(query: SparkQuery) -> str:
    indent = "        "
    lines = [
        "",
        "    from pyspark.sql import functions as F",
        "",
        f'    df = spark.table("{query.table}")',
        "",
        "    result = (",
        "        df",
        f'{indent}.selectExpr("*")',
    ]
    if query.order_by:
        ob = query.order_by[0]
        col_name = ob.get("column", "id")
        direction = (ob.get("direction") or "ASC").upper()
        lines.append(f'{indent}.orderBy(F.col("{col_name}").{direction.lower()}())')
    lines.append("    )")
    lines.append("    ")
    return "\n".join(lines)


def _render_format3(query: SparkQuery) -> str:
    indent = "    "
    lines = [
        "from pyspark.sql import functions as F",
        "",
        f'df = spark.table("{query.table}")',
        "",
        "result = (",
        "    df",
    ]
    if query.where:
        w = query.where
        col_name = w.get("column", "price")
        op = w.get("operator", ">")
        value = w.get("value", "100")
        lines.append(f'    .filter(F.col("{col_name}") {op} "{value}")')
    if query.group_by:
        gb = ", ".join(f'"{x}"' for x in query.group_by)
        lines.append(f"    .groupBy({gb})")
    if query.aggregations:
        agg = query.aggregations[0]
        func = (agg.get("function") or "SUM").lower()
        col_name = agg.get("column", "price")
        alias = agg.get("alias", "product_price")
        lines.append(f'    .agg(\n        F.{func}("{col_name}").alias("{alias}")\n    )')
    if query.having:
        hav = query.having
        if isinstance(hav, list) and hav:
            lines.append(f'    .filter(F.expr("{hav[0]}"))')
    select_parts = []
    for s in query.select:
        if isinstance(s, str):
            select_parts.append(f'"{s}"')
        elif isinstance(s, dict):
            select_parts.append(f'F.col("{s.get("column", "product")}").alias("{s.get("alias", "pr")}")')
    for a in query.aggregations:
        select_parts.append(f'"{a.get("alias", "product_price")}"')
    if select_parts:
        lines.append("    .select(")
        lines.append("        " + ",\n        ".join(select_parts))
        lines.append("    )")
    if query.order_by:
        ob = query.order_by[0]
        col_name = ob.get("column", "product_price")
        direction = (ob.get("direction") or "DESC").lower()
        lines.append(f'    .orderBy(F.col("{col_name}").{direction}())')
    if query.limit is not None:
        lines.append(f"    .limit({query.limit})")
    lines.append(")")
    lines.append("")
    return "\n".join(lines)


class SparkCodeRenderer:
    def render(self, query: SparkQuery) -> str:
        if query.source_format == 1:
            return _render_format1(query)
        if query.source_format == 3:
            return _render_format3(query)
        return _render_format2(query)

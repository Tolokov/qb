from app.query_builder.spark_query import SparkQuery


def _table_from(payload: dict) -> str:
    from_val = payload.get("from")
    if from_val is None:
        return "table"
    if isinstance(from_val, list) and from_val:
        return str(from_val[0])
    if isinstance(from_val, dict):
        return str(from_val.get("table", "table"))
    return "table"


def _normalize_format1(payload: dict) -> SparkQuery:
    table = _table_from(payload)
    columns = payload.get("columns") or []
    select: list[str | dict[str, str]] = []
    aggregations: list[dict[str, str]] = []
    for c in columns:
        if isinstance(c, dict):
            name = c.get("name", "")
            agg = c.get("aggregate")
            alias = c.get("alias")
            if agg:
                aggregations.append(
                    {
                        "function": agg,
                        "column": name,
                        "alias": alias or name,
                    }
                )
            else:
                select.append(name)
    where = payload.get("where")
    group_by = payload.get("group_by") or []
    having = payload.get("having")
    order_by_raw = payload.get("order_by") or []
    order_by: list[dict[str, str]] = []
    for ob in order_by_raw:
        if isinstance(ob, dict) and ob:
            for key in ob:
                order_by.append({"column": key, "direction": "ASC"})
            break
    limit = payload.get("limit")
    return SparkQuery(
        table=table,
        select=select if select else ["*"],
        aggregations=aggregations,
        where=where if isinstance(where, dict) else None,
        group_by=group_by,
        having=having if having else None,
        order_by=order_by,
        limit=limit,
        source_format=1,
    )


def _normalize_format2(payload: dict) -> SparkQuery:
    table = _table_from(payload)
    select = payload.get("select") or ["*"]
    order_by_raw = payload.get("orderBy") or []
    order_by: list[dict[str, str]] = []
    for ob in order_by_raw:
        if isinstance(ob, dict):
            order_by.append(
                {
                    "column": ob.get("column", "id"),
                    "direction": (ob.get("direction") or "ASC").upper(),
                }
            )
    return SparkQuery(
        table=table,
        select=select,
        aggregations=[],
        where=None,
        group_by=[],
        having=None,
        order_by=order_by,
        limit=None,
        source_format=2,
    )


def _normalize_format3(payload: dict) -> SparkQuery:
    table = _table_from(payload)
    select = payload.get("select") or []
    aggregations = payload.get("aggregations") or []
    where = payload.get("where")
    group_by = payload.get("groupBy") or []
    having = payload.get("having")
    order_by_raw = payload.get("orderBy") or []
    order_by: list[dict[str, str]] = []
    for ob in order_by_raw:
        if isinstance(ob, dict):
            order_by.append(
                {
                    "column": ob.get("column", ""),
                    "direction": (ob.get("direction") or "ASC").upper(),
                }
            )
    limit = payload.get("limit")
    return SparkQuery(
        table=table,
        select=select,
        aggregations=aggregations,
        where=where if isinstance(where, dict) else None,
        group_by=group_by,
        having=having if having else None,
        order_by=order_by,
        limit=limit,
        source_format=3,
    )


class QueryBuilder:
    def build(self, payload: dict) -> SparkQuery:
        if not isinstance(payload, dict):
            return SparkQuery(table="table")
        if "columns" in payload and "from" in payload:
            return _normalize_format1(payload)
        if "select" in payload and isinstance(payload.get("from"), list):
            if "aggregations" in payload or "groupBy" in payload:
                return _normalize_format3(payload)
            return _normalize_format2(payload)
        return SparkQuery(table=_table_from(payload), source_format=2)

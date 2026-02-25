import datetime
import decimal
import logging
import time
from typing import Any

import ibis
from pyspark.sql import SparkSession

from app.config import SETTINGS
from app.spark_tables import create_tables_and_view

logger = logging.getLogger(__name__)


class IbisRepository:
    def __init__(self, spark: SparkSession) -> None:
        create_tables_and_view(spark)
        self._con = ibis.pyspark.connect(spark)

    def execute(self, payload: object) -> dict[str, Any]:
        if not isinstance(payload, dict):
            return {"echo": payload, "sql": None}

        # Coerce "from" to list if it's a string
        from_val = payload.get("from", [])
        if isinstance(from_val, str):
            from_val = [from_val]
        if not from_val or not isinstance(from_val, list):
            return {"echo": payload, "sql": None}

        table_name = str(from_val[0])
        select_cols = payload.get("select", ["*"])

        expr = self._build_expression(table_name, payload, select_cols)
        sql = ibis.to_sql(expr)
        start = time.monotonic()
        df = expr.execute()
        elapsed_ms = int((time.monotonic() - start) * 1000)

        truncated = len(df) > SETTINGS.MAX_ROWS
        df = df.head(SETTINGS.MAX_ROWS)

        columns = list(df.columns)
        rows = [[self._serialize(v) for v in row] for row in df.itertuples(index=False, name=None)]

        return {
            "sql": str(sql),
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "truncated": truncated,
            "execution_time_ms": elapsed_ms,
            "echo": None,
        }

    def _build_expression(self, table_name: str, payload: dict[str, Any], select_cols: list[Any]) -> Any:
        if "." in table_name:
            db, tbl = table_name.split(".", 1)
            table = self._con.table(tbl, database=db)
        else:
            table = self._con.table(table_name)

        expr: Any = table

        where = payload.get("where")
        if where:
            condition = self._build_condition(expr, where)
            if condition is not None:
                expr = expr.filter(condition)

        if select_cols and select_cols != ["*"]:
            cols: list[Any] = []
            for s in select_cols:
                if isinstance(s, str) and s != "*":
                    cols.append(s)
                elif isinstance(s, dict) and "column" in s:
                    col = expr[s["column"]]
                    if s.get("alias"):
                        col = col.name(s["alias"])
                    cols.append(col)
            if cols:
                expr = expr.select(cols)

        group_by = payload.get("groupBy", [])
        if group_by and isinstance(group_by, list):
            expr = expr.group_by(group_by)

        order_by = payload.get("orderBy", [])
        if order_by and isinstance(order_by, list):
            sort_keys: list[Any] = []
            for o in order_by:
                if isinstance(o, dict) and o.get("column"):
                    if o.get("direction", "ASC").upper() == "DESC":
                        sort_keys.append(ibis.desc(o["column"]))
                    else:
                        sort_keys.append(o["column"])
            if sort_keys:
                expr = expr.order_by(sort_keys)

        limit = payload.get("limit")
        if limit and isinstance(limit, int) and limit > 0:
            expr = expr.limit(limit)

        return expr

    def _build_condition(self, table: Any, where: dict[str, Any]) -> Any:
        operator = where.get("operator", "=")
        conditions = where.get("conditions")

        if conditions and isinstance(conditions, list):
            sub = [self._build_condition(table, c) for c in conditions]
            sub = [c for c in sub if c is not None]
            if not sub:
                return None
            result = sub[0]
            for c in sub[1:]:
                if operator == "OR":
                    result = result | c
                elif operator == "NOT":
                    result = ~c
                else:
                    result = result & c
            return result

        col_name = where.get("column") or where.get("field")
        value = where.get("value")
        if not col_name:
            return None

        col = table[col_name]

        if operator in ("IS NULL", "isnull"):
            return col.isnull()
        if operator in ("IS NOT NULL", "notnull"):
            return col.notnull()
        if operator == "=":
            return col == value
        if operator == "!=":
            return col != value
        if operator == ">":
            return col > value
        if operator == "<":
            return col < value
        if operator == ">=":
            return col >= value
        if operator == "<=":
            return col <= value
        if operator == "LIKE":
            return col.like(str(value))
        if operator == "IN":
            vals = [v.strip() for v in str(value).split(",")] if isinstance(value, str) else list(value)
            return col.isin(vals)
        if operator == "BETWEEN":
            return col.between(where.get("valueLow"), where.get("valueHigh"))
        return None

    @staticmethod
    def _serialize(v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return v
        if isinstance(v, decimal.Decimal):
            return float(v)
        if isinstance(v, (datetime.datetime, datetime.date)):
            return str(v)
        try:
            import pandas as pd  # noqa: PLC0415

            if pd.isna(v):
                return None
        except Exception:  # noqa: BLE001
            pass
        return str(v)

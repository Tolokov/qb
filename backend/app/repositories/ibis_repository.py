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
        self._spark = spark
        self._con = ibis.pyspark.connect(spark)

    def execute(self, payload: object) -> dict[str, Any]:
        if not isinstance(payload, dict):
            return {"echo": payload, "sql": None}

        from_val = payload.get("from", [])
        if isinstance(from_val, str):
            from_val = [from_val]
        if not from_val or not isinstance(from_val, list):
            return {"echo": payload, "sql": None}

        subqueries = payload.get("subqueries", [])
        if subqueries and isinstance(subqueries, list):
            return self._execute_with_sql(payload)

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

    def _execute_with_sql(self, payload: dict[str, Any]) -> dict[str, Any]:
        sql_str = self._payload_to_sql(payload).rstrip(";").strip()
        start = time.monotonic()
        spark_df = self._spark.sql(sql_str)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        total = spark_df.count()
        truncated = total > SETTINGS.MAX_ROWS
        rows_data = spark_df.limit(SETTINGS.MAX_ROWS).collect()
        columns = spark_df.columns
        rows = [[self._serialize(v) for v in row] for row in rows_data]
        return {
            "sql": sql_str + ";",
            "columns": list(columns),
            "rows": rows,
            "row_count": len(rows),
            "truncated": truncated,
            "execution_time_ms": elapsed_ms,
            "echo": None,
        }

    def _payload_to_sql(self, payload: dict[str, Any]) -> str:
        select_cols = payload.get("select", ["*"])
        select_parts: list[str] = []
        for s in select_cols:
            if isinstance(s, str):
                select_parts.append(s if s else "*")
            elif isinstance(s, dict) and "column" in s:
                col = s["column"]
                alias = s.get("alias", "")
                select_parts.append(f"{col} AS {alias}" if alias else col)

        from_val = payload.get("from", [])
        if isinstance(from_val, str):
            from_val = [from_val]
        from_parts: list[str] = [str(from_val[0])] if from_val else []

        for sq in payload.get("subqueries", []):
            if not isinstance(sq, dict):
                continue
            alias = sq.get("alias", "")
            sub_payload = sq.get("query", {})
            if not isinstance(sub_payload, dict) or not alias:
                continue
            inner_sql = self._payload_to_sql(sub_payload).rstrip(";").strip()
            from_parts.append(f"({inner_sql}) AS {alias}")

        sql = f"SELECT {', '.join(select_parts) or '*'}"
        if from_parts:
            sql += f"\nFROM {', '.join(from_parts)}"

        where = payload.get("where")
        if where and isinstance(where, dict):
            clause = self._where_to_sql(where)
            if clause:
                sql += f"\nWHERE {clause}"

        group_by = payload.get("groupBy", [])
        if group_by and isinstance(group_by, list):
            sql += f"\nGROUP BY {', '.join(str(g) for g in group_by)}"

        order_by = payload.get("orderBy", [])
        if order_by and isinstance(order_by, list):
            parts: list[str] = []
            for o in order_by:
                if isinstance(o, dict) and o.get("column"):
                    direction = o.get("direction", "ASC").upper()
                    parts.append(f"{o['column']} {direction}")
            if parts:
                sql += f"\nORDER BY {', '.join(parts)}"

        limit = payload.get("limit")
        if isinstance(limit, int) and limit > 0:
            sql += f"\nLIMIT {limit}"

        return sql + ";"

    def _where_to_sql(self, where: dict[str, Any]) -> str:
        operator = where.get("operator", "=")
        conditions = where.get("conditions")

        if conditions and isinstance(conditions, list):
            parts = [self._where_to_sql(c) for c in conditions if isinstance(c, dict)]
            parts = [p for p in parts if p]
            if not parts:
                return ""
            if operator == "OR":
                return f"({' OR '.join(parts)})"
            if operator == "NOT":
                return f"NOT ({parts[0]})" if parts else ""
            return f"({' AND '.join(parts)})"

        col = where.get("column") or where.get("field", "")
        if not col:
            return ""
        col = str(col)
        value = where.get("value")

        if operator in ("IS NULL", "isnull"):
            return f"{col} IS NULL"
        if operator in ("IS NOT NULL", "notnull"):
            return f"{col} IS NOT NULL"
        if operator == "BETWEEN":
            lo, hi = where.get("valueLow"), where.get("valueHigh")
            return f"{col} BETWEEN {lo} AND {hi}" if lo is not None and hi is not None else ""
        if operator == "IN":
            vals = [v.strip() for v in str(value).split(",")] if isinstance(value, str) else list(value or [])
            quoted = ", ".join(f"'{v}'" for v in vals)
            return f"{col} IN ({quoted})" if quoted else ""
        if operator == "LIKE":
            safe = str(value).replace("'", "''")
            return f"{col} LIKE '{safe}'"
        if operator in ("=", "!=", ">", "<", ">=", "<="):
            if isinstance(value, bool):
                return f"{col} {operator} {str(value).upper()}"
            if isinstance(value, (int, float)):
                return f"{col} {operator} {value}"
            safe = str(value).replace("'", "''") if value is not None else ""
            return f"{col} {operator} '{safe}'"
        return ""

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

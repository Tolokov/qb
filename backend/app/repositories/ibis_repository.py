import datetime
import decimal
import logging
import time
from typing import Any

import ibis
from fastapi import HTTPException, status
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
        self._ensure_table_exists(table_name)
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
        from_val = payload.get("from", [])
        if isinstance(from_val, str):
            from_val = [from_val]
        if from_val and isinstance(from_val, list):
            table_name = str(from_val[0])
            self._ensure_table_exists(table_name)

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
        aggregations = payload.get("aggregations") or []
        distinct = bool(payload.get("distinct"))

        select_parts: list[str] = []
        if aggregations and isinstance(aggregations, list):
            # Aggregate queries: SELECT [groupBy cols], AGG_FN(col) [AS alias] ...
            group_by = payload.get("groupBy", [])
            if group_by and isinstance(group_by, list):
                for g in group_by:
                    select_parts.append(str(g))

            for agg in aggregations:
                if not isinstance(agg, dict):
                    continue
                func = str(agg.get("function", "")).upper()
                col = agg.get("column")
                if not isinstance(col, str) or not col:
                    continue
                alias = agg.get("alias")
                col_sql = "*" if col == "*" else col
                expr_sql = f"{func}({col_sql})"
                if isinstance(alias, str) and alias:
                    expr_sql += f" AS {alias}"
                select_parts.append(expr_sql)
        else:
            select_cols = payload.get("select", ["*"])
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

        distinct_kw = "DISTINCT " if distinct else ""
        sql = f"SELECT {distinct_kw}{', '.join(select_parts) or '*'}"
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

        available_cols = set(getattr(table, "columns", []))

        aggregations = payload.get("aggregations") or []
        if aggregations and isinstance(aggregations, list):
            return self._build_aggregate_expression(table, table_name, payload, aggregations, available_cols)

        expr: Any = table

        where = payload.get("where")
        if where:
            # Validate where-clause column names before building Ibis expressions, so we can
            # return a clear HTTP 400 instead of low-level IbisTypeError about missing columns.
            self._validate_where_columns(table_name, where, available_cols)
            condition = self._build_condition(expr, where)
            if condition is not None:
                expr = expr.filter(condition)

        self._validate_projection(table_name, payload, select_cols, available_cols)

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

        distinct = payload.get("distinct")
        if isinstance(distinct, bool) and distinct:
            expr = expr.distinct()

        limit = payload.get("limit")
        if limit and isinstance(limit, int) and limit > 0:
            expr = expr.limit(limit)

        return expr

    def _build_aggregate_expression(
        self,
        table: Any,
        table_name: str,
        payload: dict[str, Any],
        aggregations: list[Any],
        available_cols: set[str],
    ) -> Any:
        expr: Any = table

        where = payload.get("where")
        if where:
            condition = self._build_condition(expr, where)
            if condition is not None:
                expr = expr.filter(condition)

        group_by = payload.get("groupBy", [])
        if group_by and isinstance(group_by, list):
            missing_gb = [g for g in group_by if isinstance(g, str) and g not in available_cols]
            if missing_gb:
                cols_str = ", ".join(sorted(set(missing_gb)))
                available_str = ", ".join(sorted(available_cols))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column(s) in groupBy for table '{table_name}': {cols_str}. "
                        f"Available columns: {available_str}."
                    ),
                )

        metrics: dict[str, Any] = {}
        agg_aliases: set[str] = set()

        for agg in aggregations:
            if not isinstance(agg, dict):
                continue
            func = str(agg.get("function", "")).upper()
            column = agg.get("column")
            if not isinstance(column, str) or not column:
                continue
            if column != "*" and column not in available_cols:
                available_str = ", ".join(sorted(available_cols))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column '{column}' in aggregations for table '{table_name}'. "
                        f"Available columns: {available_str}."
                    ),
                )

            alias = agg.get("alias")
            if not isinstance(alias, str) or not alias:
                base_col = "all" if column == "*" else column
                alias_candidate = f"{func.lower()}_{base_col}"
                suffix = 2
                while alias_candidate in metrics:
                    alias_candidate = f"{func.lower()}_{base_col}_{suffix}"
                    suffix += 1
                alias = alias_candidate

            if func == "COUNT":
                if column == "*" or not column:
                    metric_expr = expr.count()
                else:
                    metric_expr = expr[column].count()
            elif func == "SUM":
                metric_expr = expr[column].sum()
            elif func == "MIN":
                metric_expr = expr[column].min()
            elif func == "MAX":
                metric_expr = expr[column].max()
            elif func == "AVG":
                metric_expr = expr[column].mean()
            else:
                continue

            metrics[alias] = metric_expr
            agg_aliases.add(alias)

        if not metrics:
            # No valid aggregations – return filtered table without aggregation.
            return expr

        if group_by and isinstance(group_by, list):
            expr = expr.group_by(group_by).aggregate(**metrics)
        else:
            expr = expr.aggregate(**metrics)

        order_by = payload.get("orderBy", [])
        if order_by and isinstance(order_by, list):
            invalid_order_cols: list[str] = []
            sort_keys: list[Any] = []
            for o in order_by:
                if not isinstance(o, dict):
                    continue
                col_name = o.get("column")
                if not isinstance(col_name, str) or not col_name:
                    continue
                if col_name not in agg_aliases and (not group_by or col_name not in group_by):
                    invalid_order_cols.append(col_name)
                direction = str(o.get("direction", "ASC")).upper()
                if direction == "DESC":
                    sort_keys.append(ibis.desc(col_name))
                else:
                    sort_keys.append(col_name)

            if invalid_order_cols:
                cols_str = ", ".join(sorted(set(invalid_order_cols)))
                allowed = sorted(set(agg_aliases).union(set(group_by if isinstance(group_by, list) else [])))
                allowed_str = ", ".join(allowed)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column(s) in orderBy for aggregated query on '{table_name}': {cols_str}. "
                        f"Allowed columns: {allowed_str}."
                    ),
                )

            if sort_keys:
                expr = expr.order_by(sort_keys)

        distinct = payload.get("distinct")
        if isinstance(distinct, bool) and distinct:
            expr = expr.distinct()

        limit = payload.get("limit")
        if isinstance(limit, int) and limit > 0:
            expr = expr.limit(limit)

        return expr

    def _validate_where_columns(
        self,
        table_name: str,
        where: dict[str, Any],
        available_cols: set[str],
    ) -> None:
        """Validate that all column references in WHERE exist in the table schema."""

        missing: set[str] = set()

        def _walk(node: dict[str, Any]) -> None:
            conditions = node.get("conditions")
            if conditions and isinstance(conditions, list):
                for c in conditions:
                    if isinstance(c, dict):
                        _walk(c)
                return

            col_name = node.get("column") or node.get("field")
            if isinstance(col_name, str) and col_name and col_name not in available_cols:
                missing.add(col_name)

        if isinstance(where, dict):
            _walk(where)

        if missing:
            missing_str = ", ".join(sorted(missing))
            available_str = ", ".join(sorted(available_cols))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Unknown column(s) in where for table '{table_name}': {missing_str}. "
                    f"Available columns: {available_str}."
                ),
            )

    def _validate_projection(
        self,
        table_name: str,
        payload: dict[str, Any],
        select_cols: list[Any],
        available_cols: set[str],
    ) -> None:
        """Validate selected / grouped / ordered columns against available schema."""
        if select_cols and select_cols != ["*"]:
            missing: list[str] = []
            seen: set[str] = set()
            duplicates: set[str] = set()

            for item in select_cols:
                if isinstance(item, str):
                    if item == "*":
                        continue
                    name = item
                    if name not in available_cols:
                        missing.append(name)
                elif isinstance(item, dict) and "column" in item:
                    col_name = str(item["column"])
                    if col_name not in available_cols:
                        missing.append(col_name)
                    alias = item.get("alias")
                    name = str(alias) if isinstance(alias, str) and alias else col_name
                else:
                    continue

                if name in seen:
                    duplicates.add(name)
                else:
                    seen.add(name)

            if missing:
                missing_str = ", ".join(sorted(set(missing)))
                available_str = ", ".join(sorted(available_cols))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column(s) in select for table '{table_name}': {missing_str}. "
                        f"Available columns: {available_str}."
                    ),
                )
            if duplicates:
                dup_str = ", ".join(sorted(duplicates))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Duplicate column(s) in select for table '{table_name}': {dup_str}. "
                        "Remove duplicates or use aliases."
                    ),
                )

        group_by = payload.get("groupBy", [])
        if group_by and isinstance(group_by, list):
            missing_gb = [g for g in group_by if isinstance(g, str) and g not in available_cols]
            if missing_gb:
                cols_str = ", ".join(sorted(set(missing_gb)))
                available_str = ", ".join(sorted(available_cols))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column(s) in groupBy for table '{table_name}': {cols_str}. "
                        f"Available columns: {available_str}."
                    ),
                )

        order_by = payload.get("orderBy", [])
        if order_by and isinstance(order_by, list):
            missing_ob: list[str] = []
            for spec in order_by:
                if not isinstance(spec, dict):
                    continue
                col = spec.get("column")
                if isinstance(col, str) and col not in available_cols:
                    missing_ob.append(col)
            if missing_ob:
                cols_str = ", ".join(sorted(set(missing_ob)))
                available_str = ", ".join(sorted(available_cols))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown column(s) in orderBy for table '{table_name}': {cols_str}. "
                        f"Available columns: {available_str}."
                    ),
                )

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

        # Best-effort приведение строковых значений к числам для базовых сравнений,
        # чтобы запросы с JSON-строками вроде "1" работали для числовых колонок.
        def _coerce_scalar(raw: Any) -> Any:
            if isinstance(raw, str):
                text = raw.strip()
                if not text:
                    return raw
                try:
                    return int(text)
                except ValueError:
                    try:
                        return float(text)
                    except ValueError:
                        return raw
            return raw

        if operator in ("=", "!=", ">", "<", ">=", "<=", "BETWEEN"):
            value = _coerce_scalar(value)

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
            low = _coerce_scalar(where.get("valueLow"))
            high = _coerce_scalar(where.get("valueHigh"))
            return col.between(low, high)
        return None

    def _ensure_table_exists(self, table_name: str) -> None:
        """Ensure the referenced Spark table or view exists; otherwise raise a clear HTTP error."""
        try:
            exists = self._spark.catalog.tableExists(table_name)
        except Exception as e:  # noqa: BLE001
            logger.error("Failed to check table existence for '%s': %s", table_name, e, exc_info=False)
            return

        if not exists:
            # Attempt to (re)create demo tables and databases – this is safe and idempotent.
            try:
                create_tables_and_view(self._spark)
                exists = self._spark.catalog.tableExists(table_name)
            except Exception as e:  # noqa: BLE001
                logger.error(
                    "Failed to auto-create demo tables when resolving '%s': %s",
                    table_name,
                    e,
                    exc_info=False,
                )

            if not exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Unknown table or view '{table_name}'. "
                        "Check that the name is correct and available in Spark."
                    ),
                )

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

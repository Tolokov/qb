from __future__ import annotations

import re
from typing import Any, Iterable

from fastapi import HTTPException, status

from app.config import SETTINGS


class RequestValidationService:
    """Common validation and basic security checks for incoming requests.

    This service does not talk to the database or Spark; it only inspects inputs.
    """

    def validate_json_payload(self, payload: Any) -> None:
        self._validate_payload_type(payload)
        if isinstance(payload, dict):
            self._validate_payload_structure(payload)
            self._validate_business_rules(payload)

    def validate_sql_string(self, sql: str) -> None:
        if not isinstance(sql, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Body must be a SQL string",
            )
        text = sql.strip()
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SQL string must not be empty",
            )

        # Basic multi-statement protection: allow a trailing ';' only.
        if ";" in text[:-1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Multiple SQL statements are not allowed",
            )

        self._detect_sql_injection(text)

    def _detect_sql_injection(self, sql: str) -> None:
        patterns: Iterable[str] = SETTINGS.sql_injection_patterns or (
            " or 1=1",
            " or '1'='1'",
            " union select",
            " drop table",
            " alter table",
            " truncate table",
            " insert into",
            " delete from",
            "--",
            "/*",
            "*/",
        )
        lowered = sql.lower()
        for pattern in patterns:
            if pattern and pattern.lower() in lowered:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Potentially unsafe SQL detected",
                )

        # Simple heuristic for stacked queries via comment tricks.
        stacked_query_match = re.search(r";\s*(select|insert|update|delete|drop|alter|truncate)\b", lowered)
        if stacked_query_match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stacked SQL statements are not allowed",
            )

    @staticmethod
    def _validate_payload_type(payload: object) -> None:
        allowed = (dict, list, str, int, float, bool, type(None))
        if not isinstance(payload, allowed):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Body must be valid JSON (object/array/string/number/bool/null)",
            )

    def _validate_payload_structure(self, payload: dict[str, Any]) -> None:
        """Validate basic shape and types of query-like payloads."""
        if not self._is_query_like(payload):
            return

        from_val = payload.get("from")
        if from_val is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'from' is required for query payloads",
            )
        if isinstance(from_val, str):
            if not from_val.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'from' must not be empty",
                )
        elif isinstance(from_val, list):
            if not from_val:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'from' list must not be empty",
                )
            for idx, item in enumerate(from_val):
                if not isinstance(item, str) or not item.strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'from[{idx}]' must be a non-empty string",
                    )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'from' must be a string or a list of strings",
            )

        if "select" in payload:
            select = payload["select"]
            if not isinstance(select, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'select' must be a list",
                )
            for idx, s in enumerate(select):
                if isinstance(s, str):
                    if not s:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'select[{idx}]' must not be empty",
                        )
                elif isinstance(s, dict):
                    col = s.get("column")
                    if not isinstance(col, str) or not col:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'select[{idx}].column' must be a non-empty string",
                        )
                    alias = s.get("alias")
                    if alias is not None and (not isinstance(alias, str) or not alias):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'select[{idx}].alias' must be a non-empty string when provided",
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "'select' items must be strings or objects with 'column' "
                            "(and optional 'alias')"
                        ),
                    )

        if "groupBy" in payload:
            group_by = payload["groupBy"]
            if not isinstance(group_by, list) or not group_by:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'groupBy' must be a non-empty list of column names",
                )
            for idx, col in enumerate(group_by):
                if not isinstance(col, str) or not col:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'groupBy[{idx}]' must be a non-empty string",
                    )

        if "orderBy" in payload:
            order_by = payload["orderBy"]
            if not isinstance(order_by, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'orderBy' must be a list",
                )
            for idx, spec in enumerate(order_by):
                if not isinstance(spec, dict):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="'orderBy' items must be objects with 'column' and optional 'direction'",
                    )
                col = spec.get("column")
                if not isinstance(col, str) or not col:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'orderBy[{idx}].column' must be a non-empty string",
                    )
                direction = spec.get("direction", "ASC")
                if not isinstance(direction, str) or direction.upper() not in {"ASC", "DESC"}:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'orderBy[{idx}].direction' must be 'ASC' or 'DESC'",
                    )

        if "aggregations" in payload:
            aggs = payload["aggregations"]
            if not isinstance(aggs, list) or not aggs:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'aggregations' must be a non-empty list",
                )
            allowed_funcs = {"COUNT", "SUM", "AVG", "MIN", "MAX"}
            for idx, agg in enumerate(aggs):
                if not isinstance(agg, dict):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="'aggregations' items must be objects with 'function' and 'column'",
                    )
                func = agg.get("function")
                if not isinstance(func, str) or not func:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'aggregations[{idx}].function' must be a non-empty string",
                    )
                func_upper = func.upper()
                if func_upper not in allowed_funcs:
                    allowed_str = ", ".join(sorted(allowed_funcs))
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Unsupported aggregation function '{func}'. "
                            f"Allowed functions: {allowed_str}"
                        ),
                    )
                col = agg.get("column")
                if not isinstance(col, str) or not col:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'aggregations[{idx}].column' must be a non-empty string",
                    )
                if col == "*" and func_upper != "COUNT":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'aggregations[{idx}].column' may be '*' only for COUNT",
                    )
                alias = agg.get("alias")
                if alias is not None and (not isinstance(alias, str) or not alias):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'aggregations[{idx}].alias' must be a non-empty string when provided",
                    )

        if "distinct" in payload and not isinstance(payload["distinct"], bool):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'distinct' must be a boolean",
            )

        if "having" in payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HAVING is not supported yet; please remove it or use WHERE instead",
            )

        if "subqueries" in payload:
            subqueries = payload["subqueries"]
            if not isinstance(subqueries, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="'subqueries' must be a list",
                )
            for idx, sq in enumerate(subqueries):
                if not isinstance(sq, dict):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="'subqueries' items must be objects with 'alias' and 'query'",
                    )
                alias = sq.get("alias")
                if not isinstance(alias, str) or not alias:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'subqueries[{idx}].alias' must be a non-empty string",
                    )
                query = sq.get("query")
                if not isinstance(query, dict):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"'subqueries[{idx}].query' must be an object",
                    )

    def _validate_business_rules(self, payload: dict[str, Any]) -> None:
        if not self._is_query_like(payload):
            return

        group_by = payload.get("groupBy") or []
        aggs = payload.get("aggregations") or []
        order_by = payload.get("orderBy") or []

        if group_by and not aggs:
            select_cols = self._extract_select_column_names(payload)
            if not select_cols:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Invalid combination of 'groupBy' and 'select': when using 'groupBy' "
                        "without aggregations, 'select' must list exactly the same columns "
                        "as 'groupBy'."
                    ),
                )
            if set(select_cols) != set(group_by):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Invalid combination of 'groupBy' and 'select': when there are no "
                        "aggregations, 'select' must list exactly the same columns as 'groupBy'."
                    ),
                )

        if order_by:
            directions_by_col: dict[str, set[str]] = {}
            for spec in order_by:
                if not isinstance(spec, dict):
                    continue
                col = spec.get("column")
                if not isinstance(col, str) or not col:
                    continue
                direction = str(spec.get("direction", "ASC")).upper()
                directions_by_col.setdefault(col, set()).add(direction)

            conflicts = [col for col, dirs in directions_by_col.items() if len(dirs) > 1]
            if conflicts:
                joined = ", ".join(sorted(conflicts))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Conflicting 'orderBy' directions for column(s) {joined}: "
                        "use either ASC or DESC for each column, not both."
                    ),
                )

    @staticmethod
    def _is_query_like(payload: dict[str, Any]) -> bool:
        query_keys = {
            "from",
            "select",
            "where",
            "groupBy",
            "orderBy",
            "aggregations",
            "subqueries",
            "distinct",
            "having",
        }
        return any(key in payload for key in query_keys)

    @staticmethod
    def _extract_select_column_names(payload: dict[str, Any]) -> list[str]:
        select = payload.get("select")
        if not isinstance(select, list):
            return []

        cols: list[str] = []
        for item in select:
            if isinstance(item, str):
                if item != "*":
                    cols.append(item)
            elif isinstance(item, dict):
                col = item.get("column")
                if isinstance(col, str) and col:
                    cols.append(col)
        return cols


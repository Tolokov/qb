import logging
from typing import Any

from fastapi import HTTPException, status

from app.services.base import IQueryRepository

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(self, repository: IQueryRepository) -> None:
        self._repository = repository

    def execute(self, payload: Any) -> dict[str, Any]:
        try:
            self._validate_payload_type(payload)
            if isinstance(payload, dict):
                self._validate_payload_structure(payload)
                self._validate_business_rules(payload)
        except ValueError as e:
            logger.warning("Validation failed: %s", e)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Unexpected error in query service: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
            ) from e

        try:
            return self._repository.execute(payload)
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Repository execution error: %s", e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Query execution failed"
            ) from e

    def _validate_payload_type(self, payload: object) -> None:
        allowed = (dict, list, str, int, float, bool, type(None))
        if not isinstance(payload, allowed):
            raise ValueError("Body must be valid JSON (object/array/string/number/bool/null)")

    def _validate_payload_structure(self, payload: dict[str, Any]) -> None:
        """Validate basic shape and types of query-like payloads.

        Non query-like dicts are treated as generic JSON for echo and are not validated here.
        """
        if not self._is_query_like(payload):
            return

        # FROM
        from_val = payload.get("from")
        if from_val is None:
            raise ValueError("'from' is required for query payloads")
        if isinstance(from_val, str):
            if not from_val.strip():
                raise ValueError("'from' must not be empty")
        elif isinstance(from_val, list):
            if not from_val:
                raise ValueError("'from' list must not be empty")
            for idx, item in enumerate(from_val):
                if not isinstance(item, str) or not item.strip():
                    raise ValueError(f"'from[{idx}]' must be a non-empty string")
        else:
            raise ValueError("'from' must be a string or a list of strings")

        # SELECT
        if "select" in payload:
            select = payload["select"]
            if not isinstance(select, list):
                raise ValueError("'select' must be a list")
            for idx, s in enumerate(select):
                if isinstance(s, str):
                    if not s:
                        raise ValueError(f"'select[{idx}]' must not be empty")
                elif isinstance(s, dict):
                    col = s.get("column")
                    if not isinstance(col, str) or not col:
                        raise ValueError(f"'select[{idx}].column' must be a non-empty string")
                    alias = s.get("alias")
                    if alias is not None and (not isinstance(alias, str) or not alias):
                        raise ValueError(f"'select[{idx}].alias' must be a non-empty string when provided")
                else:
                    raise ValueError(
                        "'select' items must be strings or objects with 'column' (and optional 'alias')"
                    )

        # GROUP BY
        if "groupBy" in payload:
            group_by = payload["groupBy"]
            if not isinstance(group_by, list) or not group_by:
                raise ValueError("'groupBy' must be a non-empty list of column names")
            for idx, col in enumerate(group_by):
                if not isinstance(col, str) or not col:
                    raise ValueError(f"'groupBy[{idx}]' must be a non-empty string")

        # ORDER BY
        if "orderBy" in payload:
            order_by = payload["orderBy"]
            if not isinstance(order_by, list):
                raise ValueError("'orderBy' must be a list")
            for idx, spec in enumerate(order_by):
                if not isinstance(spec, dict):
                    raise ValueError("'orderBy' items must be objects with 'column' and optional 'direction'")
                col = spec.get("column")
                if not isinstance(col, str) or not col:
                    raise ValueError(f"'orderBy[{idx}].column' must be a non-empty string")
                direction = spec.get("direction", "ASC")
                if not isinstance(direction, str):
                    raise ValueError(f"'orderBy[{idx}].direction' must be 'ASC' or 'DESC'")
                if direction.upper() not in {"ASC", "DESC"}:
                    raise ValueError(f"'orderBy[{idx}].direction' must be 'ASC' or 'DESC'")

        # AGGREGATIONS
        if "aggregations" in payload:
            aggs = payload["aggregations"]
            if not isinstance(aggs, list) or not aggs:
                raise ValueError("'aggregations' must be a non-empty list")
            allowed_funcs = {"COUNT", "SUM", "AVG", "MIN", "MAX"}
            for idx, agg in enumerate(aggs):
                if not isinstance(agg, dict):
                    raise ValueError("'aggregations' items must be objects with 'function' and 'column'")
                func = agg.get("function")
                if not isinstance(func, str) or not func:
                    raise ValueError(f"'aggregations[{idx}].function' must be a non-empty string")
                func_upper = func.upper()
                if func_upper not in allowed_funcs:
                    allowed_str = ", ".join(sorted(allowed_funcs))
                    raise ValueError(
                        f"Unsupported aggregation function '{func}'. " f"Allowed functions: {allowed_str}"
                    )
                col = agg.get("column")
                if not isinstance(col, str) or not col:
                    raise ValueError(f"'aggregations[{idx}].column' must be a non-empty string")
                if col == "*" and func_upper != "COUNT":
                    raise ValueError(f"'aggregations[{idx}].column' may be '*' only for COUNT")
                alias = agg.get("alias")
                if alias is not None and (not isinstance(alias, str) or not alias):
                    raise ValueError(f"'aggregations[{idx}].alias' must be a non-empty string when provided")

        # DISTINCT
        if "distinct" in payload:
            if not isinstance(payload["distinct"], bool):
                raise ValueError("'distinct' must be a boolean")

        # HAVING – currently not supported, but we want a clear, early error.
        if "having" in payload:
            raise ValueError("HAVING is not supported yet; please remove it or use WHERE instead")

        # SUBQUERIES (basic shape only; deeper validation is delegated to recursive handling).
        if "subqueries" in payload:
            subqueries = payload["subqueries"]
            if not isinstance(subqueries, list):
                raise ValueError("'subqueries' must be a list")
            for idx, sq in enumerate(subqueries):
                if not isinstance(sq, dict):
                    raise ValueError("'subqueries' items must be objects with 'alias' and 'query'")
                alias = sq.get("alias")
                if not isinstance(alias, str) or not alias:
                    raise ValueError(f"'subqueries[{idx}].alias' must be a non-empty string")
                query = sq.get("query")
                if not isinstance(query, dict):
                    raise ValueError(f"'subqueries[{idx}].query' must be an object")

    def _validate_business_rules(self, payload: dict[str, Any]) -> None:
        """Validate higher-level consistency of query-like payloads."""
        if not self._is_query_like(payload):
            return

        group_by = payload.get("groupBy") or []
        aggs = payload.get("aggregations") or []
        order_by = payload.get("orderBy") or []

        # When GROUP BY is used without aggregations, enforce that SELECT matches GROUP BY.
        if group_by and not aggs:
            select_cols = self._extract_select_column_names(payload)
            if not select_cols:
                raise ValueError(
                    "Invalid combination of 'groupBy' and 'select': when using 'groupBy' without "
                    "aggregations, 'select' must list exactly the same columns as 'groupBy'."
                )
            if set(select_cols) != set(group_by):
                raise ValueError(
                    "Invalid combination of 'groupBy' and 'select': when there are no aggregations, "
                    "'select' must list exactly the same columns as 'groupBy'."
                )

        # Detect conflicting ORDER BY directions for the same column.
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
                raise ValueError(
                    f"Conflicting 'orderBy' directions for column(s) {joined}: "
                    "use either ASC or DESC for each column, not both."
                )

    @staticmethod
    def _is_query_like(payload: dict[str, Any]) -> bool:
        """Heuristic: does this dict look like a query description rather than arbitrary JSON?"""
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
        """Return logical column names referenced in 'select' (ignores '*' and aliases)."""
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

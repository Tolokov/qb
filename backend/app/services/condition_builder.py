from app.models.condition import Condition
from app.services.base import ConditionBuilderBase


class ConditionBuilderService(ConditionBuilderBase):
    def build(self, cond: Condition) -> str:
        if cond.conditions:
            inner = f" {cond.operator.upper()} ".join(self.build(c) for c in cond.conditions)
            return f"({inner})"

        field = cond.field or ""
        op = cond.operator or "="
        value = cond.value
        if value is None:
            value_str = "NULL"
        elif isinstance(value, list):
            value_str = "(" + ", ".join(repr(v) for v in value) + ")"
        else:
            value_str = repr(value)

        return f"{field} {op} {value_str}"

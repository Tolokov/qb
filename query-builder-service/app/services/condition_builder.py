from app.models.condition import Condition

def build_condition(cond: Condition) -> str:
    if cond.conditions:
        inner = f" {cond.operator.upper()} ".join(
            build_condition(c) for c in cond.conditions
        )
        return f"({inner})"

    value = cond.value
    if isinstance(value, list):
        value = "(" + ", ".join(map(repr, value)) + ")"
    else:
        value = repr(value)

    return f"{cond.field} {cond.operator} {value}"

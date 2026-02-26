from typing import Protocol


class IQueryRepository(Protocol):
    """Repository protocol: единая точка доступа к исполнению запроса.

    Конкретные реализации могут ожидать разные типы аргумента (JSON_SQL payload,
    строка SQL и т.п.), но снаружи используется единый метод execute.
    """

    def execute(self, query: object) -> dict: ...


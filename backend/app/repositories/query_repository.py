from app.services.base import IQueryRepository


class QueryRepository(IQueryRepository):
    """Placeholder for future real repository based on QueryBuilder/SparkCodeRenderer.

    Реализация будет добавлена, когда появится полноценная компиляция JSON → SQL/код Spark.
    Сейчас этот класс существует как заглушка без внутренней логики, чтобы не хранить моки
    в боевом коде.
    """

    def execute(self, query: object) -> dict:
        # Заглушка: реализация будет добавлена позже.
        raise NotImplementedError("QueryRepository is not implemented yet.")

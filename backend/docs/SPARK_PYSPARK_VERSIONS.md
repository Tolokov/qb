# PySpark and Apache Spark version compatibility

The backend uses **PySpark** to interact with Spark. Docker Compose runs **Apache Spark 3.5.3** (containers `spark-master`, `spark-worker`).

## Compatibility

- **PySpark** version in the project: `pyspark>=3.5.0,<3.6` (see `backend/requirements.txt`).
- **Apache Spark** in Docker: `apache/spark:3.5.3`.

PySpark 3.5.x is the Python API for Apache Spark 3.5.x. Using PySpark 3.5.0+ with Spark 3.5.3 is compatible and supported.

## Pinning

The upper bound `<3.6` avoids pulling a future major release (e.g. Spark 4.x) when installing dependencies, so the backend stays aligned with the Spark 3.5.3 cluster.

## References

- [Spark Release 3.5.3](https://spark.apache.org/releases/spark-release-3-5-3.html)
- PySpark docs: [Getting Started — PySpark 3.5.3](https://spark.apache.org/docs/3.5.3/api/python/getting_started/index.html)

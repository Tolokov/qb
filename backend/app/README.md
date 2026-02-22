# SQL → PySpark Conversion Examples

Справочник по переводу SQL в PySpark для бекенда QB. Обзор проекта и запуск — см. [README.md](../../../README.md) в корне репозитория.

## Example 1

**SQL**

```sql
SELECT id, name, age
FROM users
WHERE city = 'Moscow'
  AND is_active = TRUE;
```

**PySpark**

```python
import spark
from pyspark.sql.functions import col

users_df = spark.table("users")
result_df = users_df.select("id", "name", "age").where(
    (col("city") == "Moscow") &
    (col("is_active") == True)
)
```

---

## Example 2

**SQL**

```sql
SELECT id, name, registration_date
FROM users
WHERE age > 30
  AND registration_date >= '2023-01-01';
```

**PySpark**

```python
import spark
from pyspark.sql.functions import col

users_df = spark.table("users")
result_df = users_df.select("id", "name", "registration_date").where(
    (col("age") > 30) &
    (col("registration_date") >= "2023-01-01")
)
```

---

## Example 3

**SQL**

```sql
SELECT city, COUNT(id) AS user_count
FROM users
WHERE is_active = TRUE
GROUP BY city
ORDER BY user_count DESC;
```

**PySpark**

```python
import spark
from pyspark.sql.functions import col, count, desc

users_df = spark.table("users")
result_df = users_df.where(col("is_active") == True) \
    .groupBy("city") \
    .agg(count("id").alias("user_count")) \
    .orderBy(desc("user_count"))
```

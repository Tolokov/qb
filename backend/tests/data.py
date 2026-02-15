DATA_OK = {
    "example1": """{
  "type": "select",
  "columns": [
    {
      "name": "string",
      "aggregate": "string",
      "alias": "string"
    }
  ],
  "from": {
    "table": "string"
  },
  "where": {
    "field": "string",
    "operator": "string",
    "value": "string",
    "conditions": [
      "string"
    ]
  },
  "group_by": [
    "string"
  ],
  "having": {
    "field": "string",
    "operator": "string",
    "value": "string",
    "conditions": [
      "string"
    ]
  },
  "order_by": [
    {
      "additionalProp1": {}
    }
  ],
  "limit": 0
}""",
    "response1": """
    from pyspark.sql import functions as F

    df = spark.table("string")

    result = (
        df
        .filter(
            (F.col("string") == "string") &
            (F.expr("string"))
        )
        .groupBy("string")
        .agg(
            F.expr("string(string)").alias("string")
        )
        .filter(
            (F.col("string") == "string") &
            (F.expr("string"))
        )
        .orderBy(F.expr("additionalProp1"))
        .limit(0)
    )""",
    "example2": """{
  "from": [
    "orders"
  ],
  "select": [
    "*"
  ],
  "orderBy": [
    {
      "column": "id",
      "direction": "ASC"
    }
  ]
}""",
    "response2": """
    from pyspark.sql import functions as F

    df = spark.table("orders")

    result = (
        df
        .selectExpr("*")
        .orderBy(F.col("id").asc())
    )
    """,
    "example3": """{
  "from": [
    "products"
  ],
  "select": [
    "name",
    {
      "column": "product",
      "alias": "pr"
    },
    "id_customer",
    "price"
  ],
  "aggregations": [
    {
      "function": "SUM",
      "column": "price",
      "alias": "product_price"
    }
  ],
  "where": {
    "column": "price",
    "operator": ">",
    "value": "100"
  },
  "groupBy": [
    "id_customer",
    "name"
  ],
  "having": [
    "product_price > 1000"
  ],
  "orderBy": [
    {
      "column": "product_price",
      "direction": "DESC"
    }
  ],
  "limit": 10
}""",
    "response3": """from pyspark.sql import functions as F

df = spark.table("products")

result = (
    df
    .filter(F.col("price") > "100")
    .groupBy("id_customer", "name")
    .agg(
        F.sum("price").alias("product_price")
    )
    .filter(F.expr("product_price > 1000"))
    .select(
        "name",
        F.col("product").alias("pr"),
        "id_customer",
        "price",
        "product_price"
    )
    .orderBy(F.col("product_price").desc())
    .limit(10)
)
""",
}

import random
import shutil
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

from pyspark.sql import SparkSession
from pyspark.sql import types as T

USERS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("name", T.StringType(), True),
        T.StructField("created_at", T.TimestampType(), True),
        T.StructField("score", T.DecimalType(10, 2), True),
        T.StructField("active", T.BooleanType(), True),
    ]
)

ORDERS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("user_id", T.IntegerType(), True),
        T.StructField("notes", T.StringType(), True),
        T.StructField("total", T.DecimalType(10, 2), True),
        T.StructField("completed", T.BooleanType(), True),
    ]
)

PRODUCTS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("name", T.StringType(), True),
        T.StructField("price", T.DecimalType(10, 2), True),
        T.StructField("created_at", T.TimestampType(), True),
        T.StructField("in_stock", T.BooleanType(), True),
    ]
)

TABLE_NAMES = ("users", "orders", "products")
VIEW_NAME = "user_orders_mart"

# --- advert schemas ---

DSP_EVENTS_SCHEMA = T.StructType(
    [
        T.StructField("event_id", T.LongType(), False),
        T.StructField("user_id", T.StringType(), True),
        T.StructField("event_ts", T.TimestampType(), True),
        T.StructField("bid_price", T.DecimalType(10, 4), True),
        T.StructField("is_viewable", T.BooleanType(), True),
    ]
)

V_SEGMENTS_REF_SCHEMA = T.StructType(
    [
        T.StructField("segment_id", T.IntegerType(), False),
        T.StructField("segment_name", T.StringType(), True),
        T.StructField("category", T.StringType(), True),
        T.StructField("is_active", T.BooleanType(), True),
        T.StructField("created_at", T.TimestampType(), True),
    ]
)

SGM_UPLOAD_DSP_SEGMENT_SCHEMA = T.StructType(
    [
        T.StructField("upload_id", T.LongType(), False),
        T.StructField("segment_id", T.IntegerType(), True),
        T.StructField("msisdn", T.StringType(), True),
        T.StructField("upload_ts", T.TimestampType(), True),
        T.StructField("status", T.StringType(), True),
    ]
)

HTTP_CYRILLIC_SCHEMA = T.StructType(
    [
        T.StructField("request_id", T.LongType(), False),
        T.StructField("url", T.StringType(), True),
        T.StructField("user_agent", T.StringType(), True),
        T.StructField("request_ts", T.TimestampType(), True),
        T.StructField("is_bot", T.BooleanType(), True),
    ]
)

V_CATALOG_2GIS_PHONES_SCHEMA = T.StructType(
    [
        T.StructField("phone_id", T.LongType(), False),
        T.StructField("phone_number", T.StringType(), True),
        T.StructField("rubric", T.StringType(), True),
        T.StructField("city", T.StringType(), True),
        T.StructField("is_valid", T.BooleanType(), True),
    ]
)

V_REGION_GIBDD_CODES_SCHEMA = T.StructType(
    [
        T.StructField("region_code", T.IntegerType(), False),
        T.StructField("region_name", T.StringType(), True),
        T.StructField("federal_district", T.StringType(), True),
        T.StructField("auto_code", T.StringType(), True),
        T.StructField("is_active", T.BooleanType(), True),
    ]
)

V_CITIES_REGIONS_SCHEMA = T.StructType(
    [
        T.StructField("city_id", T.IntegerType(), False),
        T.StructField("city_name", T.StringType(), True),
        T.StructField("region_name", T.StringType(), True),
        T.StructField("population", T.LongType(), True),
        T.StructField("is_regional_center", T.BooleanType(), True),
    ]
)

IMSI_X_MSISDN_ACTUAL_SCHEMA = T.StructType(
    [
        T.StructField("imsi", T.StringType(), False),
        T.StructField("msisdn", T.StringType(), True),
        T.StructField("operator", T.StringType(), True),
        T.StructField("updated_at", T.TimestampType(), True),
        T.StructField("is_active", T.BooleanType(), True),
    ]
)

SEGMENTS_BD_CUSTOM_SCHEMA = T.StructType(
    [
        T.StructField("segment_id", T.LongType(), False),
        T.StructField("user_id", T.StringType(), True),
        T.StructField("segments", T.ArrayType(T.StringType()), True),
        T.StructField("score", T.DecimalType(5, 2), True),
        T.StructField("updated_at", T.TimestampType(), True),
    ]
)

CM_ID_MSISDN_SCHEMA = T.StructType(
    [
        T.StructField("cm_id", T.StringType(), False),
        T.StructField("msisdn", T.StringType(), True),
        T.StructField("source", T.StringType(), True),
        T.StructField("created_at", T.TimestampType(), True),
        T.StructField("is_confirmed", T.BooleanType(), True),
    ]
)

TRACKING_ALL_SCHEMA = T.StructType(
    [
        T.StructField("pixel_id", T.StringType(), False),
        T.StructField("user_id", T.StringType(), True),
        T.StructField("page_url", T.StringType(), True),
        T.StructField("event_ts", T.TimestampType(), True),
        T.StructField("is_conversion", T.BooleanType(), True),
    ]
)

_ADVERT_DATABASES = ("prd_advert_ods", "prd_advert_dict", "advert_dm", "pixel")

# --- bulk-seed data pools (module-level, seeded for reproducibility) ---
_POOL_RNG = random.Random(42)
_USERS = [f"usr_{i:04d}" for i in range(1, 201)]
_MSISDNS = [f"7{_POOL_RNG.randint(9000000000, 9999999999)}" for _ in range(500)]
_OPERATORS = ["МТС", "Билайн", "МегаФон", "Теле2", "Ростелеком"]
_CITIES_POOL = [
    "Москва",
    "Санкт-Петербург",
    "Екатеринбург",
    "Краснодар",
    "Новосибирск",
    "Казань",
    "Нижний Новгород",
    "Челябинск",
    "Омск",
    "Самара",
    "Ростов-на-Дону",
    "Уфа",
    "Красноярск",
    "Пермь",
    "Воронеж",
]
_RUBRICS = [
    "Рестораны",
    "Автосервисы",
    "Салоны красоты",
    "Банки",
    "Аптеки",
    "Магазины",
    "Гостиницы",
    "Кафе",
    "Больницы",
    "Школы",
    "Супермаркеты",
    "Кинотеатры",
    "Стоматологии",
    "Фитнес-клубы",
]
_SEGMENTS_POOL = [
    "auto",
    "travel",
    "gaming",
    "tech",
    "sport",
    "food",
    "retail",
    "finance",
    "health",
    "education",
    "media",
    "fashion",
]
_FEDERAL_DISTRICTS = [
    "Центральный",
    "Северо-Западный",
    "Уральский",
    "Южный",
    "Приволжский",
    "Сибирский",
    "Дальневосточный",
    "Северо-Кавказский",
]
_CATEGORIES = [
    "Авто",
    "Туризм",
    "Развлечения",
    "Спорт",
    "Электроника",
    "Мода",
    "Финансы",
    "Здоровье",
    "Образование",
    "Медиа",
]
_URLS = [
    "https://example.ru/поиск",
    "https://news.ru/статья",
    "https://shop.ru/товары",
    "https://catalog.ru/категория",
    "https://market.ru/предложения",
] + [f"https://site{i}.ru/страница" for i in range(1, 46)]
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT)",
    "Mozilla/5.0 (Android)",
    "Mozilla/5.0 (iPhone)",
    "Googlebot/2.1",
    "YandexBot/3.0",
    "Mozilla/5.0 (Linux)",
    "Mozilla/5.0 (Macintosh)",
]
_SOURCES = ["CRM", "CDP", "manual", "API", "import"]
_STATUSES = ["success", "failed", "pending"]
_PAGE_URLS = [f"https://shop.example.ru/product/{i}" for i in range(1, 31)] + [
    "https://shop.example.ru/cart",
    "https://shop.example.ru/checkout",
    "https://shop.example.ru/thanks",
    "https://shop.example.ru/catalog",
]
_SEGMENT_NAMES = [
    "Авто-энтузиасты",
    "Путешественники",
    "Геймеры",
    "Спортсмены",
    "Технари",
    "Модники",
    "Финансисты",
    "Гурманы",
    "Читатели",
    "Туристы",
    "Покупатели",
    "Меломаны",
    "Кулинары",
    "Программисты",
    "Бизнесмены",
    "Родители",
    "Студенты",
    "Пенсионеры",
    "Дачники",
    "Путники",
]


def _ensure_table(spark: SparkSession, table_name: str, schema: T.StructType) -> None:
    if table_name in [t.name for t in spark.catalog.listTables()]:
        return
    # Remove orphaned filesystem location (exists on disk but not in Hive catalog).
    warehouse = spark.conf.get("spark.sql.warehouse.dir", ".").removeprefix("file:")
    location = Path(warehouse) / table_name
    if location.exists():
        shutil.rmtree(location)
    spark.createDataFrame([], schema).write.saveAsTable(table_name)


def _ensure_table_ns(spark: SparkSession, db_name: str, table_name: str, schema: T.StructType) -> None:
    """Create a table inside a named database if it does not yet exist in the Hive catalog."""
    if table_name in [t.name for t in spark.catalog.listTables(db_name)]:
        return
    warehouse = spark.conf.get("spark.sql.warehouse.dir", ".").removeprefix("file:")
    location = Path(warehouse) / f"{db_name}.db" / table_name
    if location.exists():
        shutil.rmtree(location)
    spark.createDataFrame([], schema).write.saveAsTable(f"{db_name}.{table_name}")


def _seed_if_empty(spark: SparkSession) -> None:
    base = datetime(2025, 1, 15, 12, 0, 0)
    if spark.table("users").count() == 0:
        users_data = [
            (1, "Alice", base, Decimal("10.50"), True),
            (2, "Bob", base, Decimal("20.00"), True),
            (3, "Carol", base, Decimal("15.75"), False),
        ]
        spark.createDataFrame(users_data, USERS_SCHEMA).write.mode("append").saveAsTable("users")
    if spark.table("orders").count() == 0:
        orders_data = [
            (1, 1, "First order", Decimal("99.99"), True),
            (2, 2, "Second order", Decimal("49.50"), False),
            (3, 1, "Third order", Decimal("25.00"), True),
        ]
        spark.createDataFrame(orders_data, ORDERS_SCHEMA).write.mode("append").saveAsTable("orders")
    if spark.table("products").count() == 0:
        products_data = [
            (1, "Widget", Decimal("12.99"), base, True),
            (2, "Gadget", Decimal("29.99"), base, True),
            (3, "Gizmo", Decimal("5.50"), base, False),
        ]
        spark.createDataFrame(products_data, PRODUCTS_SCHEMA).write.mode("append").saveAsTable("products")


def _seed_advert_tables_if_empty(spark: SparkSession) -> None:
    if spark.table("prd_advert_ods.dsp_events").count() == 0:
        spark.createDataFrame(
            [
                (1001, "usr_001", datetime(2025, 3, 1, 10, 0, 0), Decimal("0.0150"), True),
                (1002, "usr_002", datetime(2025, 3, 1, 10, 1, 0), Decimal("0.0220"), False),
                (1003, "usr_003", datetime(2025, 3, 1, 10, 2, 0), Decimal("0.0310"), True),
                (1004, "usr_004", datetime(2025, 3, 1, 10, 3, 0), Decimal("0.0180"), True),
                (1005, "usr_005", datetime(2025, 3, 1, 10, 4, 0), Decimal("0.0090"), False),
            ],
            DSP_EVENTS_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_ods.dsp_events")

    if spark.table("prd_advert_dict.v_segments_ref").count() == 0:
        spark.createDataFrame(
            [
                (101, "Авто-энтузиасты", "Авто", True, datetime(2024, 6, 1, 0, 0, 0)),
                (102, "Путешественники", "Туризм", True, datetime(2024, 6, 2, 0, 0, 0)),
                (103, "Геймеры", "Развлечения", False, datetime(2024, 6, 3, 0, 0, 0)),
                (104, "Любители спорта", "Спорт", True, datetime(2024, 6, 4, 0, 0, 0)),
                (105, "Покупатели техники", "Электроника", True, datetime(2024, 6, 5, 0, 0, 0)),
            ],
            V_SEGMENTS_REF_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_dict.v_segments_ref")

    if spark.table("prd_advert_ods.sgm_upload_dsp_segment").count() == 0:
        spark.createDataFrame(
            [
                (5001, 101, "79161234567", datetime(2025, 2, 10, 8, 0, 0), "success"),
                (5002, 102, "79261234568", datetime(2025, 2, 10, 8, 1, 0), "success"),
                (5003, 101, "79361234569", datetime(2025, 2, 10, 8, 2, 0), "failed"),
                (5004, 103, "79461234570", datetime(2025, 2, 10, 8, 3, 0), "pending"),
                (5005, 104, "79561234571", datetime(2025, 2, 10, 8, 4, 0), "success"),
            ],
            SGM_UPLOAD_DSP_SEGMENT_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_ods.sgm_upload_dsp_segment")

    if spark.table("prd_advert_ods.http_cyrillic").count() == 0:
        spark.createDataFrame(
            [
                (
                    2001,
                    "https://example.ru/поиск?q=москва",
                    "Mozilla/5.0 (Windows NT)",
                    datetime(2025, 4, 5, 9, 0, 0),
                    False,
                ),
                (
                    2002,
                    "https://example.ru/каталог/товары",
                    "Mozilla/5.0 (Android)",
                    datetime(2025, 4, 5, 9, 1, 0),
                    False,
                ),
                (
                    2003,
                    "https://example.ru/новости/спорт",
                    "Googlebot/2.1",
                    datetime(2025, 4, 5, 9, 2, 0),
                    True,
                ),
                (
                    2004,
                    "https://example.ru/магазин/одежда",
                    "Mozilla/5.0 (iPhone)",
                    datetime(2025, 4, 5, 9, 3, 0),
                    False,
                ),
                (
                    2005,
                    "https://example.ru/акции/скидки",
                    "YandexBot/3.0",
                    datetime(2025, 4, 5, 9, 4, 0),
                    True,
                ),
            ],
            HTTP_CYRILLIC_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_ods.http_cyrillic")

    if spark.table("prd_advert_dict.v_catalog_2gis_phones").count() == 0:
        spark.createDataFrame(
            [
                (3001, "+74951234567", "Рестораны", "Москва", True),
                (3002, "+74951234568", "Автосервисы", "Москва", True),
                (3003, "+78121234569", "Салоны красоты", "Санкт-Петербург", True),
                (3004, "+74951234570", "Банки", "Москва", False),
                (3005, "+73431234571", "Аптеки", "Екатеринбург", True),
            ],
            V_CATALOG_2GIS_PHONES_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_dict.v_catalog_2gis_phones")

    if spark.table("prd_advert_dict.v_region_gibdd_codes").count() == 0:
        spark.createDataFrame(
            [
                (77, "Москва", "Центральный", "77", True),
                (78, "Санкт-Петербург", "Северо-Западный", "78", True),
                (66, "Свердловская область", "Уральский", "66", True),
                (23, "Краснодарский край", "Южный", "23", True),
                (63, "Самарская область", "Приволжский", "63", False),
            ],
            V_REGION_GIBDD_CODES_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_dict.v_region_gibdd_codes")

    if spark.table("prd_advert_dict.v_cities_regions").count() == 0:
        spark.createDataFrame(
            [
                (1, "Москва", "Москва", 12600000, True),
                (2, "Санкт-Петербург", "Санкт-Петербург", 5380000, True),
                (3, "Екатеринбург", "Свердловская область", 1490000, True),
                (4, "Краснодар", "Краснодарский край", 920000, True),
                (5, "Новосибирск", "Новосибирская область", 1600000, True),
            ],
            V_CITIES_REGIONS_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_dict.v_cities_regions")

    if spark.table("prd_advert_ods.imsi_x_msisdn_actual").count() == 0:
        spark.createDataFrame(
            [
                ("250011234567890", "79161234567", "МТС", datetime(2025, 1, 1, 0, 0, 0), True),
                ("250021234567891", "79261234568", "Билайн", datetime(2025, 1, 2, 0, 0, 0), True),
                ("250031234567892", "79361234569", "МегаФон", datetime(2025, 1, 3, 0, 0, 0), True),
                ("250041234567893", "79461234570", "Теле2", datetime(2025, 1, 4, 0, 0, 0), False),
                ("250011234567894", "79561234571", "МТС", datetime(2025, 1, 5, 0, 0, 0), True),
            ],
            IMSI_X_MSISDN_ACTUAL_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_ods.imsi_x_msisdn_actual")

    if spark.table("advert_dm.segments_bd_custom").count() == 0:
        spark.createDataFrame(
            [
                (1001, "usr_101", ["auto", "travel"], Decimal("85.50"), datetime(2025, 5, 1, 0, 0, 0)),
                (1002, "usr_102", ["gaming", "tech"], Decimal("72.00"), datetime(2025, 5, 2, 0, 0, 0)),
                (1003, "usr_103", ["sport"], Decimal("90.25"), datetime(2025, 5, 3, 0, 0, 0)),
                (
                    1004,
                    "usr_104",
                    ["travel", "food", "retail"],
                    Decimal("65.75"),
                    datetime(2025, 5, 4, 0, 0, 0),
                ),
                (1005, "usr_105", ["auto"], Decimal("50.00"), datetime(2025, 5, 5, 0, 0, 0)),
            ],
            SEGMENTS_BD_CUSTOM_SCHEMA,
        ).write.mode("append").saveAsTable("advert_dm.segments_bd_custom")

    if spark.table("prd_advert_ods.cm_id_msisdn").count() == 0:
        spark.createDataFrame(
            [
                ("cm_abc123", "79161234567", "CRM", datetime(2025, 3, 1, 0, 0, 0), True),
                ("cm_def456", "79261234568", "CDP", datetime(2025, 3, 2, 0, 0, 0), True),
                ("cm_ghi789", "79361234569", "manual", datetime(2025, 3, 3, 0, 0, 0), False),
                ("cm_jkl012", "79461234570", "CRM", datetime(2025, 3, 4, 0, 0, 0), True),
                ("cm_mno345", "79561234571", "CDP", datetime(2025, 3, 5, 0, 0, 0), True),
            ],
            CM_ID_MSISDN_SCHEMA,
        ).write.mode("append").saveAsTable("prd_advert_ods.cm_id_msisdn")

    if spark.table("pixel.tracking_all").count() == 0:
        spark.createDataFrame(
            [
                (
                    "pxl_001",
                    "usr_201",
                    "https://shop.example.ru/product/123",
                    datetime(2025, 6, 1, 14, 0, 0),
                    False,
                ),
                ("pxl_002", "usr_202", "https://shop.example.ru/cart", datetime(2025, 6, 1, 14, 5, 0), False),
                (
                    "pxl_003",
                    "usr_203",
                    "https://shop.example.ru/checkout",
                    datetime(2025, 6, 1, 14, 10, 0),
                    True,
                ),
                (
                    "pxl_004",
                    "usr_204",
                    "https://shop.example.ru/product/456",
                    datetime(2025, 6, 1, 14, 15, 0),
                    False,
                ),
                (
                    "pxl_005",
                    "usr_205",
                    "https://shop.example.ru/thanks",
                    datetime(2025, 6, 1, 14, 20, 0),
                    True,
                ),
            ],
            TRACKING_ALL_SCHEMA,
        ).write.mode("append").saveAsTable("pixel.tracking_all")


def _bulk_seed_advert_tables(spark: SparkSession) -> None:
    """Append 10,000 rows to each advert table. Skipped if already seeded (count >= 1000)."""
    if spark.table("prd_advert_ods.dsp_events").count() >= 1000:
        return

    rng = random.Random(42)
    base_ts = datetime(2024, 1, 1)
    two_years_sec = 2 * 365 * 24 * 3600

    def _ts() -> datetime:
        return base_ts + timedelta(seconds=rng.randint(0, two_years_sec))

    # 1. prd_advert_ods.dsp_events  (event_id: 6–10005)
    spark.createDataFrame(
        [
            (
                6 + i,
                rng.choice(_USERS),
                _ts(),
                Decimal(str(round(rng.uniform(0.001, 9.9999), 4))),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        DSP_EVENTS_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_ods.dsp_events")

    # 2. prd_advert_dict.v_segments_ref  (segment_id: 6–10005)
    spark.createDataFrame(
        [
            (6 + i, rng.choice(_SEGMENT_NAMES), rng.choice(_CATEGORIES), rng.choice([True, False]), _ts())
            for i in range(10000)
        ],
        V_SEGMENTS_REF_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_dict.v_segments_ref")

    # 3. prd_advert_ods.sgm_upload_dsp_segment  (upload_id: 6–10005)
    spark.createDataFrame(
        [
            (6 + i, rng.randint(1, 10000), rng.choice(_MSISDNS), _ts(), rng.choice(_STATUSES))
            for i in range(10000)
        ],
        SGM_UPLOAD_DSP_SEGMENT_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_ods.sgm_upload_dsp_segment")

    # 4. prd_advert_ods.http_cyrillic  (request_id: 6–10005)
    spark.createDataFrame(
        [
            (6 + i, rng.choice(_URLS), rng.choice(_USER_AGENTS), _ts(), rng.choice([True, False]))
            for i in range(10000)
        ],
        HTTP_CYRILLIC_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_ods.http_cyrillic")

    # 5. prd_advert_dict.v_catalog_2gis_phones  (phone_id: 6–10005)
    spark.createDataFrame(
        [
            (
                6 + i,
                f"+7{rng.randint(9000000000, 9999999999)}",
                rng.choice(_RUBRICS),
                rng.choice(_CITIES_POOL),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        V_CATALOG_2GIS_PHONES_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_dict.v_catalog_2gis_phones")

    # 6. prd_advert_dict.v_region_gibdd_codes  (region_code: 100–10099, fictional)
    spark.createDataFrame(
        [
            (
                100 + i,
                f"Регион_{100 + i}",
                rng.choice(_FEDERAL_DISTRICTS),
                str(100 + i),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        V_REGION_GIBDD_CODES_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_dict.v_region_gibdd_codes")

    # 7. prd_advert_dict.v_cities_regions  (city_id: 6–10005)
    spark.createDataFrame(
        [
            (
                6 + i,
                rng.choice(_CITIES_POOL),
                rng.choice(_CITIES_POOL),
                rng.randint(10000, 15000000),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        V_CITIES_REGIONS_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_dict.v_cities_regions")

    # 8. prd_advert_ods.imsi_x_msisdn_actual  (imsi: unique string)
    spark.createDataFrame(
        [
            (
                f"IMSI{10001 + i:012d}",
                rng.choice(_MSISDNS),
                rng.choice(_OPERATORS),
                _ts(),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        IMSI_X_MSISDN_ACTUAL_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_ods.imsi_x_msisdn_actual")

    # 9. advert_dm.segments_bd_custom  (segment_id: 6–10005)
    spark.createDataFrame(
        [
            (
                6 + i,
                rng.choice(_USERS),
                rng.sample(_SEGMENTS_POOL, rng.randint(1, 4)),
                Decimal(str(round(rng.uniform(0.01, 99.99), 2))),
                _ts(),
            )
            for i in range(10000)
        ],
        SEGMENTS_BD_CUSTOM_SCHEMA,
    ).write.mode("append").saveAsTable("advert_dm.segments_bd_custom")

    # 10. prd_advert_ods.cm_id_msisdn  (cm_id: unique string)
    spark.createDataFrame(
        [
            (
                f"cm_{10001 + i:010d}",
                rng.choice(_MSISDNS),
                rng.choice(_SOURCES),
                _ts(),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        CM_ID_MSISDN_SCHEMA,
    ).write.mode("append").saveAsTable("prd_advert_ods.cm_id_msisdn")

    # 11. pixel.tracking_all  (pixel_id: unique string)
    spark.createDataFrame(
        [
            (
                f"pxl_{10001 + i:010d}",
                rng.choice(_USERS),
                rng.choice(_PAGE_URLS),
                _ts(),
                rng.choice([True, False]),
            )
            for i in range(10000)
        ],
        TRACKING_ALL_SCHEMA,
    ).write.mode("append").saveAsTable("pixel.tracking_all")


def create_advert_databases_and_tables(spark: SparkSession) -> None:
    for db in _ADVERT_DATABASES:
        spark.sql(f"CREATE DATABASE IF NOT EXISTS {db}")

    _ensure_table_ns(spark, "prd_advert_ods", "dsp_events", DSP_EVENTS_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_dict", "v_segments_ref", V_SEGMENTS_REF_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_ods", "sgm_upload_dsp_segment", SGM_UPLOAD_DSP_SEGMENT_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_ods", "http_cyrillic", HTTP_CYRILLIC_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_dict", "v_catalog_2gis_phones", V_CATALOG_2GIS_PHONES_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_dict", "v_region_gibdd_codes", V_REGION_GIBDD_CODES_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_dict", "v_cities_regions", V_CITIES_REGIONS_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_ods", "imsi_x_msisdn_actual", IMSI_X_MSISDN_ACTUAL_SCHEMA)
    _ensure_table_ns(spark, "advert_dm", "segments_bd_custom", SEGMENTS_BD_CUSTOM_SCHEMA)
    _ensure_table_ns(spark, "prd_advert_ods", "cm_id_msisdn", CM_ID_MSISDN_SCHEMA)
    _ensure_table_ns(spark, "pixel", "tracking_all", TRACKING_ALL_SCHEMA)

    _seed_advert_tables_if_empty(spark)
    _bulk_seed_advert_tables(spark)


def create_tables_and_view(spark: SparkSession) -> None:
    _ensure_table(spark, "users", USERS_SCHEMA)
    _ensure_table(spark, "orders", ORDERS_SCHEMA)
    _ensure_table(spark, "products", PRODUCTS_SCHEMA)
    _seed_if_empty(spark)
    if VIEW_NAME not in [t.name for t in spark.catalog.listTables()]:
        spark.sql(
            """
            CREATE OR REPLACE VIEW user_orders_mart AS
            SELECT u.id AS user_id, u.name AS user_name, o.id AS order_id, o.total, o.completed
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            """
        )
    create_advert_databases_and_tables(spark)

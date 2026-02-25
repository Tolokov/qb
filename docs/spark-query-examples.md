# Примеры Spark-запросов для QB

Коллекция примеров запросов для тестирования и демонстрации возможностей QB Query Builder.
Формат JSON соответствует схеме `IbisRepository.execute()` (backend).

---

## 1. Простой: фильтр по одному условию

**Описание:** Выбрать MSISDN из HTTP-логов за конкретную дату.

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["msisdn"],
  "where": {
    "column": "sn_start_time",
    "operator": ">=",
    "value": "2024-01-01"
  },
  "limit": 1000
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn
FROM prd.http_cyrillic
WHERE sn_start_time >= '2024-01-01'
LIMIT 1000
```

---

## 2. Простой: несколько колонок и исключение значения

**Описание:** Получить MSISDN и хост из HTTP-логов, исключив порт из результатов.

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["msisdn", "http_host"],
  "where": {
    "column": "http_host",
    "operator": "!=",
    "value": "port"
  },
  "limit": 500
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, http_host
FROM prd.http_cyrillic
WHERE http_host != 'port'
LIMIT 500
```

---

## 3. Средний: AND-комбинация фильтров + LIMIT

**Описание:** Найти HTTP-запросы с кириллическим поисковым запросом в заданный период, исключая нежелательные хосты.

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["msisdn", "http_host", "query_clean", "sn_start_time"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "sn_start_time", "operator": ">=", "value": "2024-01-01" },
      { "column": "sn_start_time", "operator": "<=", "value": "2024-01-31" },
      { "column": "http_host", "operator": "!=", "value": "port" },
      { "column": "query_clean", "operator": "LIKE", "value": "%поиск%" }
    ]
  },
  "limit": 1000
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, http_host, query_clean, sn_start_time
FROM prd.http_cyrillic
WHERE sn_start_time >= '2024-01-01'
  AND sn_start_time <= '2024-01-31'
  AND http_host != 'port'
  AND query_clean LIKE '%поиск%'
LIMIT 1000
```

---

## 4. Средний: ORDER BY + LIMIT

**Описание:** Получить последние DNS-запросы с сортировкой по времени по убыванию.

```json
{
  "from": ["prd.dns_logs"],
  "select": ["msisdn", "domain", "query_time", "response_code"],
  "orderBy": [
    { "column": "query_time", "direction": "DESC" }
  ],
  "limit": 200
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, domain, query_time, response_code
FROM prd.dns_logs
ORDER BY query_time DESC
LIMIT 200
```

---

## 5. Средний: GROUP BY с подсчётом сессий

**Описание:** Количество сессий по каждому MSISDN за период.

```json
{
  "from": ["prd.sessions"],
  "select": [
    "msisdn",
    { "column": "session_id", "alias": "session_count" }
  ],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "start_time", "operator": ">=", "value": "2024-01-01" },
      { "column": "start_time", "operator": "<",  "value": "2024-02-01" }
    ]
  },
  "groupBy": ["msisdn"],
  "orderBy": [
    { "column": "session_count", "direction": "DESC" }
  ],
  "limit": 100
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, session_id AS session_count
FROM prd.sessions
WHERE start_time >= '2024-01-01'
  AND start_time < '2024-02-01'
GROUP BY msisdn
ORDER BY session_count DESC
LIMIT 100
```

---

## 6. Сложный: вложенные AND/OR-условия

**Описание:** Найти сессии абонентов, у которых либо длительность больше 3600 секунд, либо объём трафика превышает 100 МБ, при этом статус сессии активный.

```json
{
  "from": ["prd.sessions"],
  "select": ["msisdn", "session_id", "duration_sec", "bytes_total", "status"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "status", "operator": "=", "value": "active" },
      {
        "operator": "OR",
        "conditions": [
          { "column": "duration_sec", "operator": ">", "value": 3600 },
          { "column": "bytes_total",  "operator": ">", "value": 104857600 }
        ]
      }
    ]
  },
  "limit": 500
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, session_id, duration_sec, bytes_total, status
FROM prd.sessions
WHERE status = 'active'
  AND (duration_sec > 3600 OR bytes_total > 104857600)
LIMIT 500
```

---

## 7. Сложный: BETWEEN + IN

**Описание:** Пользователи с заказами в определённом диапазоне сумм по конкретным статусам.

```json
{
  "from": ["orders"],
  "select": ["user_id", "order_id", "amount", "status", "created_at"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "amount",  "operator": "BETWEEN", "valueLow": 1000, "valueHigh": 50000 },
      { "column": "status",  "operator": "IN",      "value": "completed,shipped" }
    ]
  },
  "orderBy": [
    { "column": "created_at", "direction": "DESC" }
  ],
  "limit": 250
}
```

**Ожидаемый SQL:**
```sql
SELECT user_id, order_id, amount, status, created_at
FROM orders
WHERE amount BETWEEN 1000 AND 50000
  AND status IN ('completed', 'shipped')
ORDER BY created_at DESC
LIMIT 250
```

---

## 8. Сложный: IS NULL / IS NOT NULL

**Описание:** Найти DNS-запросы без ответного IP (NXDOMAIN или таймаут), у которых домен указан.

```json
{
  "from": ["prd.dns_logs"],
  "select": ["msisdn", "domain", "query_time", "response_ip"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "response_ip", "operator": "IS NULL" },
      { "column": "domain",      "operator": "IS NOT NULL" }
    ]
  },
  "orderBy": [
    { "column": "query_time", "direction": "DESC" }
  ],
  "limit": 300
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, domain, query_time, response_ip
FROM prd.dns_logs
WHERE response_ip IS NULL
  AND domain IS NOT NULL
ORDER BY query_time DESC
LIMIT 300
```

---

## 9. Аналитический: COUNT/SUM по группам с фильтром

**Описание:** Топ-продуктов по количеству и сумме завершённых заказов.

```json
{
  "from": ["orders"],
  "select": [
    { "column": "product_id", "alias": "product_id" },
    { "column": "order_id",   "alias": "order_count" },
    { "column": "amount",     "alias": "total_revenue" }
  ],
  "where": {
    "column": "status",
    "operator": "=",
    "value": "completed"
  },
  "groupBy": ["product_id"],
  "orderBy": [
    { "column": "total_revenue", "direction": "DESC" }
  ],
  "limit": 20
}
```

**Ожидаемый SQL:**
```sql
SELECT product_id, order_id AS order_count, amount AS total_revenue
FROM orders
WHERE status = 'completed'
GROUP BY product_id
ORDER BY total_revenue DESC
LIMIT 20
```

---

## 10. Edge case: пустые фильтры, только LIMIT

**Описание:** Получить все колонки таблицы без фильтров (разведочный запрос, сэмпл данных).

```json
{
  "from": ["users"],
  "select": ["*"],
  "limit": 10
}
```

**Ожидаемый SQL:**
```sql
SELECT *
FROM users
LIMIT 10
```

---

## 11. Edge case: несколько условий LIKE (поиск по шаблонам)

**Описание:** Найти DNS-запросы к социальным сетям или мессенджерам по маске домена.

```json
{
  "from": ["prd.dns_logs"],
  "select": ["msisdn", "domain", "query_time"],
  "where": {
    "operator": "OR",
    "conditions": [
      { "column": "domain", "operator": "LIKE", "value": "%vk.com%" },
      { "column": "domain", "operator": "LIKE", "value": "%telegram%" },
      { "column": "domain", "operator": "LIKE", "value": "%whatsapp%" }
    ]
  },
  "orderBy": [
    { "column": "query_time", "direction": "DESC" }
  ],
  "limit": 500
}
```

**Ожидаемый SQL:**
```sql
SELECT msisdn, domain, query_time
FROM prd.dns_logs
WHERE domain LIKE '%vk.com%'
   OR domain LIKE '%telegram%'
   OR domain LIKE '%whatsapp%'
ORDER BY query_time DESC
LIMIT 500
```

---

## Как тестировать

1. **Запустить окружение** — `make dev` (или `make up`) в корне проекта; убедиться, что backend и frontend доступны.
2. **Открыть QB интерфейс** — перейти на `http://localhost:3000`.
3. **Ввести запрос вручную** — в панели «Raw JSON» (или через API playground) вставить один из JSON-примеров выше.
4. **Нажать Run / Execute** — проверить, что:
   - Панель результатов отображает строки данных (или пустую таблицу, если данных нет).
   - SQL-превью совпадает с ожидаемым SQL из примера.
   - Поле `execution_time_ms` присутствует в ответе.
5. **Проверить edge cases:**
   - Запрос №10 (без фильтров) — убедиться, что возвращается не более `MAX_ROWS = 500` строк и флаг `truncated` выставлен корректно.
   - Запрос №8 (`IS NULL`) — убедиться, что условие `IS NOT NULL` правильно компилируется в SQL.
   - Запрос с `BETWEEN` — убедиться, что `valueLow`/`valueHigh` подставляются без ошибок валидации.
6. **Проверить ответ API напрямую:**
   ```bash
   curl -s -X POST http://localhost:8000/api/v1/query/execute \
     -H "Content-Type: application/json" \
     -d '{"from":["users"],"select":["*"],"limit":10}' | python3 -m json.tool
   ```
7. **Убедиться в корректности полей ответа:** `sql`, `columns`, `rows`, `row_count`, `truncated`, `execution_time_ms`.

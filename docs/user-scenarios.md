# Пользовательские сценарии QB

Сценарии реального использования QB Query Builder в телеком/аналитическом контексте.
Каждый сценарий соответствует одному или нескольким шаблонам из `frontend/lib/query-templates.ts`
и может быть воспроизведён вручную через QB-интерфейс.

---

## Сценарий 1: Исследование нового датасета

**Название:** Быстрый просмотр данных (Data Exploration)

**Описание:**
Аналитик впервые работает с таблицей и хочет посмотреть, какие данные в ней есть.
Запускает сэмпл без фильтров, чтобы увидеть структуру колонок и пример строк.

**Кому полезен:** Аналитик данных, Data Scientist, DBA

**Шаблон в QB:** Simple (3 блока: Source → Column → Limit)

**QB JSON:**

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["*"],
  "limit": 10
}
```

**Ожидаемый результат:** Первые 10 строк таблицы со всеми колонками; в SQL-превью виден `SELECT * FROM prd.http_cyrillic LIMIT 10`.

---

## Сценарий 2: Поиск активности конкретного абонента

**Название:** Трассировка абонента по MSISDN

**Описание:**
Специалист технической поддержки расследует жалобу абонента. Нужно найти все HTTP-запросы
конкретного MSISDN за период обращения и посмотреть, к каким хостам он обращался.

**Кому полезен:** Аналитик данных, инженер поддержки, разработчик

**Шаблон в QB:** Medium (Source → Columns → Filters → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["msisdn", "http_host", "query_clean", "sn_start_time"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "msisdn",        "operator": "=",  "value": "79001234567" },
      { "column": "sn_start_time", "operator": ">=", "value": "2024-01-15" },
      { "column": "sn_start_time", "operator": "<=", "value": "2024-01-16" }
    ]
  },
  "orderBy": [
    { "column": "sn_start_time", "direction": "ASC" }
  ],
  "limit": 500
}
```

**Ожидаемый результат:** Хронологический список HTTP-запросов абонента за выбранный день.

---

## Сценарий 3: Анализ поисковых запросов

**Название:** Мониторинг кириллических поисковых запросов

**Описание:**
Аналитик исследует, какие поисковые запросы отправляют абоненты через мобильный интернет.
Фильтрует HTTP-логи по маске поискового запроса и исключает технические домены (порты и служебные хосты).

**Кому полезен:** Аналитик данных, Data Scientist, Product Manager

**Шаблон в QB:** Complex (Source → Columns → Filters AND/LIKE → Limit)

**KB JSON:**

```json
{
  "from": ["prd.http_cyrillic"],
  "select": ["msisdn", "http_host", "query_clean"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "sn_start_time", "operator": ">=",   "value": "2024-01-01" },
      { "column": "http_host",     "operator": "!=",   "value": "port" },
      { "column": "query_clean",   "operator": "LIKE", "value": "%купить%" }
    ]
  },
  "orderBy": [
    { "column": "sn_start_time", "direction": "DESC" }
  ],
  "limit": 1000
}
```

**Ожидаемый результат:** Список MSISDN и очищенных поисковых запросов, содержащих ключевое слово.

---

## Сценарий 4: DNS-аудит подозрительных доменов

**Название:** Выявление DNS-запросов к заблокированным/подозрительным ресурсам

**Описание:**
DBA или аналитик безопасности проверяет DNS-логи на обращения к нескольким известным
мессенджерам или социальным сетям. Используется OR-комбинация LIKE-условий.

**Кому полезен:** DBA, аналитик ИБ, сетевой инженер

**Шаблон в QB:** Complex (Source → Columns → OR-Filters → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd.dns_logs"],
  "select": ["msisdn", "domain", "query_time", "response_code"],
  "where": {
    "operator": "OR",
    "conditions": [
      { "column": "domain", "operator": "LIKE", "value": "%telegram%" },
      { "column": "domain", "operator": "LIKE", "value": "%vk.com%"   },
      { "column": "domain", "operator": "LIKE", "value": "%tiktok%"   }
    ]
  },
  "orderBy": [
    { "column": "query_time", "direction": "DESC" }
  ],
  "limit": 500
}
```

**Ожидаемый результат:** Хронологический список DNS-запросов к целевым доменам; помогает оценить объём трафика к конкретным ресурсам.

---

## Сценарий 5: Агрегация сессий по абонентам

**Название:** Рейтинг активности абонентов по сессиям

**Описание:**
Аналитик строит рейтинг абонентов по количеству сессий за месяц для оценки загрузки сети
или сегментации абонентской базы.

**Кому полезен:** Аналитик данных, сетевой инженер, Product Manager

**Шаблон в QB:** Medium (Source → Columns → Filter → GroupBy → OrderBy → Limit)

**QB JSON:**

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
  "limit": 50
}
```

**Ожидаемый результат:** Топ-50 абонентов по количеству сессий за январь 2024.

---

## Сценарий 6: Анализ заказов по диапазону сумм

**Название:** Выборка заказов в заданном ценовом диапазоне

**Описание:**
Разработчик или аналитик проверяет тестовые данные: выбирает завершённые и отправленные заказы
с суммой в определённом диапазоне, чтобы убедиться в корректности расчёта скидок или бонусов.

**Кому полезен:** Разработчик, аналитик данных, QA

**Шаблон в QB:** Complex (Source → Columns → BETWEEN + IN → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["orders"],
  "select": ["user_id", "order_id", "amount", "status", "created_at"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "amount", "operator": "BETWEEN", "valueLow": 1000, "valueHigh": 10000 },
      { "column": "status", "operator": "IN",      "value": "completed,shipped"          }
    ]
  },
  "orderBy": [
    { "column": "created_at", "direction": "DESC" }
  ],
  "limit": 100
}
```

**Ожидаемый результат:** Список заказов со статусами `completed` и `shipped`, суммой от 1 000 до 10 000; упорядочен по дате создания.

---

## Сценарий 7: Поиск записей с незаполненными полями (контроль качества данных)

**Название:** Контроль качества данных (Data Quality Check)

**Описание:**
DBA или инженер данных проверяет качество таблицы DNS-логов: ищет записи, где ответный IP
отсутствует (возможные ошибки парсинга или NXDOMAIN), но домен при этом указан.
Помогает оценить процент аномалий в ETL-пайплайне.

**Кому полезен:** DBA, инженер данных, разработчик ETL

**Шаблон в QB:** Medium (Source → Columns → IS NULL + IS NOT NULL → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd.dns_logs"],
  "select": ["msisdn", "domain", "query_time", "response_ip", "response_code"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "response_ip", "operator": "IS NULL"     },
      { "column": "domain",      "operator": "IS NOT NULL" }
    ]
  },
  "orderBy": [
    { "column": "query_time", "direction": "DESC" }
  ],
  "limit": 200
}
```

**Ожидаемый результат:** Записи без IP-ответа — строки с `response_ip = NULL`. Количество строк показывает масштаб проблемы качества данных.

---

## Как тестировать

1. **Запустить QB** — `make dev` в корне проекта; открыть `http://localhost:3000`.
2. **Выбрать шаблон** — нажать кнопку «Templates» (шаблоны) в интерфейсе QB. Для каждого сценария соответствующий шаблон указан выше.
3. **Подставить параметры** — в блоках на канвасе заменить значения фильтров, колонок и лимитов согласно QB JSON из сценария. Либо вставить JSON напрямую в Raw JSON-редактор (если доступен).
4. **Нажать Run** — убедиться, что:
  - SQL-превью отображает правильный запрос (сравнить с ожидаемым из `spark-query-examples.md`).
  - Результаты соответствуют описанию сценария (или возвращается пустая таблица для несуществующих тестовых данных).
  - Нет ошибок в консоли браузера и в логах backend (`make logs` или `docker compose logs backend`).
5. **Проверить граничные случаи:**
  - Сценарий 7 (`IS NULL`) — убедиться, что условие отображается в SQL как `IS NULL`, а не как `= NULL`.
  - Сценарий 6 (`BETWEEN`) — убедиться, что оба значения `valueLow`/`valueHigh` попадают в SQL корректно.
  - Сценарий 4 (OR + LIKE) — убедиться, что скобки расставлены правильно в сгенерированном SQL.
6. **Проверить через API напрямую** (без UI):
  ```bash
   curl -s -X POST http://localhost:8000/api/v1/query/execute \
     -H "Content-Type: application/json" \
     -d '{"from":["users"],"select":["*"],"limit":5}' | python3 -m json.tool
  ```
7. **Зафиксировать отклонения** — если SQL из QB не совпадает с ожидаемым, завести задачу с указанием сценария и фактического/ожидаемого SQL.


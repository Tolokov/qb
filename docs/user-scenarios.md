# Пользовательские сценарии QB

Сценарии реального использования QB Query Builder в рекламно-аналитическом контексте.
Каждый сценарий соответствует одному или нескольким шаблонам из `frontend/lib/query-templates.ts`
и может быть воспроизведён вручную через QB-интерфейс.

---

## Сценарий 1: Быстрый просмотр HTTP-трафика

**Название:** Просмотр кириллических HTTP-запросов

**Описание:**
Аналитик впервые работает с таблицей HTTP-логов с кириллическими URL и хочет оценить структуру
данных: какие URL встречаются, какие User-Agent-ы присутствуют и как заполнено поле `is_bot`.
Запускает минимальный сэмпл без фильтров.

**Кому полезен:** Аналитик данных, Data Scientist, DBA

**Шаблон в QB:** Simple (Source → Columns → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_ods.http_cyrillic"],
  "select": ["request_id", "url", "user_agent", "request_ts"],
  "limit": 10
}
```

**Ожидаемый SQL:**

```sql
SELECT request_id, url, user_agent, request_ts
FROM prd_advert_ods.http_cyrillic
LIMIT 10
```

**Ожидаемый результат:** Первые 10 строк с URL, User-Agent и временной меткой запроса.

---

## Сценарий 2: Активные SIM-карты оператора МТС

**Название:** Абоненты МТС с активным IMSI

**Описание:**
Инженер данных выгружает все активные связки IMSI–MSISDN для оператора МТС, чтобы
сверить актуальность маппинга перед загрузкой в DSP. Фильтрует по оператору и флагу
`is_active`, сортирует по дате последнего обновления.

**Кому полезен:** Инженер данных, аналитик операторских данных, разработчик ETL

**Шаблон в QB:** Medium (Source → Columns → AND-Filters → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_ods.imsi_x_msisdn_actual"],
  "select": ["imsi", "msisdn", "operator", "updated_at"],
  "where": {
    "operator": "AND",
    "conditions": [
      { "column": "operator",  "operator": "=", "value": "МТС" },
      { "column": "is_active", "operator": "=", "value": true  }
    ]
  },
  "orderBy": [
    { "column": "updated_at", "direction": "DESC" }
  ],
  "limit": 100
}
```

**Ожидаемый SQL:**

```sql
SELECT imsi, msisdn, operator, updated_at
FROM prd_advert_ods.imsi_x_msisdn_actual
WHERE operator = 'МТС' AND is_active = true
ORDER BY updated_at DESC
LIMIT 100
```

**Ожидаемый результат:** Список активных IMSI–MSISDN пар для оператора МТС, отсортированный по свежести обновления.

---

## Сценарий 3: DSP-события с высокой ставкой

**Название:** Аукционы с ценой выше порога

**Описание:**
Трейдер DSP анализирует события с высокими ставками, чтобы оценить расходы на показы
в заданном диапазоне цен. Оператор `BETWEEN` позволяет задать нижний и верхний порог
`bid_price` без двух отдельных условий.

**Кому полезен:** DSP-трейдер, аналитик рекламного инвентаря, финансовый аналитик

**Шаблон в QB:** Medium (Source → Columns → BETWEEN → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_ods.dsp_events"],
  "select": ["event_id", "user_id", "event_ts", "bid_price", "is_viewable"],
  "where": {
    "column": "bid_price",
    "operator": "BETWEEN",
    "valueLow": 0.05,
    "valueHigh": 9.9999
  },
  "orderBy": [
    { "column": "bid_price", "direction": "DESC" }
  ],
  "limit": 50
}
```

**Ожидаемый SQL:**

```sql
SELECT event_id, user_id, event_ts, bid_price, is_viewable
FROM prd_advert_ods.dsp_events
WHERE bid_price BETWEEN 0.05 AND 9.9999
ORDER BY bid_price DESC
LIMIT 50
```

**Ожидаемый результат:** Топ-50 событий с самыми высокими ставками в указанном диапазоне; помогает оценить хвост распределения bid_price.

---

## Сценарий 4: Загрузки сегментов по статусу обработки

**Название:** Успешные и упавшие загрузки сегментов

**Описание:**
Инженер данных проверяет результаты батч-загрузки абонентов в DSP-сегменты. Оператор `IN`
позволяет одним запросом отобрать записи с двумя терминальными статусами — `success` и
`failed` — исключив записи в статусе `pending`.

**Кому полезен:** Инженер данных, разработчик ETL, аналитик качества данных

**Шаблон в QB:** Medium (Source → Columns → IN-Filter → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_ods.sgm_upload_dsp_segment"],
  "select": ["upload_id", "segment_id", "msisdn", "upload_ts", "status"],
  "where": {
    "column": "status",
    "operator": "IN",
    "value": "success,failed"
  },
  "orderBy": [
    { "column": "upload_ts", "direction": "DESC" }
  ],
  "limit": 200
}
```

**Ожидаемый SQL:**

```sql
SELECT upload_id, segment_id, msisdn, upload_ts, status
FROM prd_advert_ods.sgm_upload_dsp_segment
WHERE status IN ('success', 'failed')
ORDER BY upload_ts DESC
LIMIT 200
```

**Ожидаемый результат:** 200 последних завершённых (успешно или с ошибкой) загрузок; строки со статусом `pending` исключены.

---

## Сценарий 5: Телефоны заведений в двух городах

**Название:** Справочник 2GIS — Москва и Питер

**Описание:**
Менеджер по данным выгружает контакты организаций из двух ключевых городов присутствия
для обновления таргетинговой базы. OR-условие охватывает оба города за один запрос без
дополнительной фильтрации на стороне клиента.

**Кому полезен:** Менеджер по данным, аналитик рекламных кампаний, Product Manager

**Шаблон в QB:** Complex (Source → Columns → OR-Filters → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_dict.v_catalog_2gis_phones"],
  "select": ["phone_id", "phone_number", "rubric", "city"],
  "where": {
    "operator": "OR",
    "conditions": [
      { "column": "city", "operator": "=", "value": "Москва"          },
      { "column": "city", "operator": "=", "value": "Санкт-Петербург" }
    ]
  },
  "orderBy": [
    { "column": "rubric", "direction": "ASC" }
  ],
  "limit": 100
}
```

**Ожидаемый SQL:**

```sql
SELECT phone_id, phone_number, rubric, city
FROM prd_advert_dict.v_catalog_2gis_phones
WHERE city = 'Москва' OR city = 'Санкт-Петербург'
ORDER BY rubric ASC
LIMIT 100
```

**Ожидаемый результат:** До 100 записей по организациям из Москвы и Санкт-Петербурга, сгруппированных по рубрике (алфавитный порядок).

---

## Сценарий 6: Контроль качества CM-маппинга

**Название:** CM-записи без привязанного MSISDN

**Описание:**
Инженер данных ищет записи в таблице `cm_id_msisdn`, у которых отсутствует номер телефона
— это сигнал о незавершённой идентификации или ошибке ETL-пайплайна. Оператор `IS NULL`
позволяет точно находить строки с пустым полем без замены на пустую строку.

**Кому полезен:** Инженер данных, DBA, разработчик ETL

**Шаблон в QB:** Medium (Source → Columns → IS NULL → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["prd_advert_ods.cm_id_msisdn"],
  "select": ["cm_id", "source", "created_at", "is_confirmed"],
  "where": {
    "column": "msisdn",
    "operator": "IS NULL"
  },
  "orderBy": [
    { "column": "created_at", "direction": "DESC" }
  ],
  "limit": 200
}
```

**Ожидаемый SQL:**

```sql
SELECT cm_id, source, created_at, is_confirmed
FROM prd_advert_ods.cm_id_msisdn
WHERE msisdn IS NULL
ORDER BY created_at DESC
LIMIT 200
```

**Ожидаемый результат:** Записи с пустым `msisdn` — потенциальные аномалии идентификации; количество строк отражает масштаб проблемы.

---

## Сценарий 7: Пиксельные события на странице оформления заказа

**Название:** Конверсии на странице checkout

**Описание:**
Аналитик рекламной эффективности исследует пиксельные события на странице оформления
заказа. Оператор `LIKE` по полю `page_url` позволяет охватить все URL-варианты checkout
без перечисления точных адресов.

**Кому полезен:** Аналитик рекламной эффективности, Product Manager, Data Scientist

**Шаблон в QB:** Complex (Source → Columns → LIKE-Filter → OrderBy → Limit)

**QB JSON:**

```json
{
  "from": ["pixel.tracking_all"],
  "select": ["pixel_id", "user_id", "page_url", "event_ts", "is_conversion"],
  "where": {
    "column": "page_url",
    "operator": "LIKE",
    "value": "%checkout%"
  },
  "orderBy": [
    { "column": "event_ts", "direction": "DESC" }
  ],
  "limit": 100
}
```

**Ожидаемый SQL:**

```sql
SELECT pixel_id, user_id, page_url, event_ts, is_conversion
FROM pixel.tracking_all
WHERE page_url LIKE '%checkout%'
ORDER BY event_ts DESC
LIMIT 100
```

**Ожидаемый результат:** 100 последних пиксельных событий на URL, содержащих `checkout`; поле `is_conversion` показывает, завершилась ли сессия покупкой.

---

## Как тестировать

1. **Запустить QB** — `make dev` в корне проекта; открыть `http://localhost:3000`.
2. **Выбрать шаблон** — нажать кнопку «Templates» (шаблоны) в интерфейсе QB. Для каждого сценария соответствующий шаблон указан выше.
3. **Подставить параметры** — в блоках на канвасе заменить значения фильтров, колонок и лимитов согласно QB JSON из сценария. Либо вставить JSON напрямую в Raw JSON-редактор (если доступен).
4. **Нажать Run** — убедиться, что:
  - SQL-превью отображает правильный запрос (сравнить с ожидаемым SQL из сценария).
  - Результаты соответствуют описанию сценария (или возвращается пустая таблица для несуществующих тестовых данных).
  - Нет ошибок в консоли браузера и в логах backend (`make logs` или `docker compose logs backend`).
5. **Проверить граничные случаи:**
  - Сценарий 6 (`IS NULL`) — убедиться, что условие отображается в SQL как `IS NULL`, а не как `= NULL`.
  - Сценарий 3 (`BETWEEN`) — убедиться, что оба значения `valueLow`/`valueHigh` попадают в SQL корректно.
  - Сценарий 5 (OR + =) — убедиться, что скобки расставлены правильно в сгенерированном SQL.
  - Сценарий 4 (`IN`) — убедиться, что значения через запятую преобразуются в `IN ('success', 'failed')`.
6. **Проверить через API напрямую** (без UI):
```bash
curl -s -X POST http://localhost:8000/api/v1/query/compile \
  -H "Content-Type: application/json" \
  -d '{"from":["prd_advert_ods.http_cyrillic"],"select":["request_id","url"],"limit":5}' \
  | python3 -m json.tool
```
7. **Зафиксировать отклонения** — если SQL из QB не совпадает с ожидаемым, завести задачу с указанием сценария, фактического/ожидаемого SQL и текста ошибки (если бекенд вернул `400` или `503`).

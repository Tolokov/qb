/**
 * Каталог блоков конструктора запросов (Query Builder).
 * Все элементы, доступные в боковой панели «Components», описаны здесь
 * и разбиты на логические группы. Редактируйте этот файл, чтобы добавлять,
 * удалять или менять блоки без правок в типах и UI-логике.
 */

import type { LibraryItem } from "./types";

// ---------------------------------------------------------------------------
// 1. ИСТОЧНИКИ ДАННЫХ (Data Sources)
// Определяют таблицу/источник для FROM. Обычно один блок на запрос.
// ---------------------------------------------------------------------------

const SOURCE_ITEMS: LibraryItem[] = [
  {
    id: "source-prd-advert-ods",
    type: "source",
    label: "Prd Advert Ods",
    description: "prd_advert_ods namespace",
    icon: "Database",
    defaultConfig: { namespace: "prd_advert_ods", vitrina: "", table: "" },
  },
  {
    id: "source-prd-advert-dict",
    type: "source",
    label: "Prd Advert Dict",
    description: "prd_advert_dict namespace",
    icon: "Database",
    defaultConfig: { namespace: "prd_advert_dict", vitrina: "", table: "" },
  },
  {
    id: "source-advert-dm",
    type: "source",
    label: "Advert Dm",
    description: "advert_dm namespace",
    icon: "Database",
    defaultConfig: { namespace: "advert_dm", vitrina: "", table: "" },
  },
  {
    id: "source-pixel",
    type: "source",
    label: "Pixel",
    description: "pixel namespace",
    icon: "Database",
    defaultConfig: { namespace: "pixel", vitrina: "", table: "" },
  },
  {
    id: "source-custom",
    type: "source",
    label: "Custom Table",
    description: "Произвольная таблица (имя задаётся вручную)",
    icon: "Database",
    defaultConfig: { table: "" },
  },
];

// ---------------------------------------------------------------------------
// 2. КОЛОНКИ (Columns / SELECT)
// Что выбирать в запросе: колонки и алиасы. Может быть несколько блоков.
// ---------------------------------------------------------------------------

const COLUMN_ITEMS: LibraryItem[] = [
  {
    id: "column-select",
    type: "column",
    label: "Select Column",
    description: "Выбор одной колонки или *",
    icon: "Columns3",
    defaultConfig: { column: "*", alias: "" },
  },
];

// ---------------------------------------------------------------------------
// 3. УСЛОВИЯ ФИЛЬТРАЦИИ (Filters / WHERE)
// Условия для WHERE: сравнения, LIKE, IN, BETWEEN, IS NULL и т.д.
// Комбинируются через логические операторы (AND/OR).
// ---------------------------------------------------------------------------

const FILTER_ITEMS: LibraryItem[] = [
  {
    id: "filter-equals",
    type: "filter",
    label: "Equals",
    description: "column = value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "=", value: "" },
  },
  {
    id: "filter-not-equals",
    type: "filter",
    label: "Not Equals",
    description: "column != value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "!=", value: "" },
  },
  {
    id: "filter-greater",
    type: "filter",
    label: "Greater Than",
    description: "column > value",
    icon: "Filter",
    defaultConfig: { column: "", operator: ">", value: "" },
  },
  {
    id: "filter-less",
    type: "filter",
    label: "Less Than",
    description: "column < value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "<", value: "" },
  },
  {
    id: "filter-like",
    type: "filter",
    label: "Like",
    description: "column LIKE pattern (подстановки % и _)",
    icon: "Filter",
    defaultConfig: { column: "", operator: "LIKE", value: "" },
  },
  {
    id: "filter-in",
    type: "filter",
    label: "In",
    description: "column IN (value1, value2, ...) — значения через запятую",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IN", value: "" },
  },
  {
    id: "filter-between",
    type: "filter",
    label: "Between",
    description: "column BETWEEN valueLow AND valueHigh",
    icon: "Filter",
    defaultConfig: { column: "", operator: "BETWEEN", valueLow: "", valueHigh: "" },
  },
  {
    id: "filter-is-null",
    type: "filter",
    label: "Is Null",
    description: "column IS NULL",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IS NULL" },
  },
  {
    id: "filter-is-not-null",
    type: "filter",
    label: "Is Not Null",
    description: "column IS NOT NULL",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IS NOT NULL" },
  },
];

// ---------------------------------------------------------------------------
// 4. ЛОГИЧЕСКИЕ ОПЕРАТОРЫ (Logical / AND, OR, NOT)
// Связывают несколько условий WHERE в одно (контейнер с вложенными фильтрами).
// ---------------------------------------------------------------------------

const LOGICAL_ITEMS: LibraryItem[] = [
  {
    id: "logical-and",
    type: "logical",
    label: "AND",
    description: "Все вложенные условия должны выполняться",
    icon: "GitMerge",
    defaultConfig: { operator: "AND" },
  },
  {
    id: "logical-or",
    type: "logical",
    label: "OR",
    description: "Хотя бы одно вложенное условие должно выполняться",
    icon: "GitBranch",
    defaultConfig: { operator: "OR" },
  },
  {
    id: "logical-not",
    type: "logical",
    label: "NOT",
    description: "Отрицание вложенного условия",
    icon: "Ban",
    defaultConfig: { operator: "NOT" },
  },
];

// ---------------------------------------------------------------------------
// 5. АГРЕГАЦИИ (Aggregations)
// Функции SELECT: COUNT, SUM, AVG, MIN, MAX. Обычно используются с GROUP BY.
// ---------------------------------------------------------------------------

const AGGREGATION_ITEMS: LibraryItem[] = [
  {
    id: "agg-count",
    type: "aggregation",
    label: "COUNT",
    description: "Количество строк (или значений в колонке)",
    icon: "Hash",
    defaultConfig: { function: "COUNT", column: "*", alias: "" },
  },
  {
    id: "agg-sum",
    type: "aggregation",
    label: "SUM",
    description: "Сумма значений колонки",
    icon: "Plus",
    defaultConfig: { function: "SUM", column: "", alias: "" },
  },
  {
    id: "agg-avg",
    type: "aggregation",
    label: "AVG",
    description: "Среднее значение колонки",
    icon: "TrendingUp",
    defaultConfig: { function: "AVG", column: "", alias: "" },
  },
  {
    id: "agg-min",
    type: "aggregation",
    label: "MIN",
    description: "Минимальное значение",
    icon: "ArrowDown",
    defaultConfig: { function: "MIN", column: "", alias: "" },
  },
  {
    id: "agg-max",
    type: "aggregation",
    label: "MAX",
    description: "Максимальное значение",
    icon: "ArrowUp",
    defaultConfig: { function: "MAX", column: "", alias: "" },
  },
];

// ---------------------------------------------------------------------------
// 6. ГРУППИРОВКА (Grouping: GROUP BY, HAVING)
// GROUP BY — группировка по колонкам; HAVING — фильтр по результатам агрегации.
// ---------------------------------------------------------------------------

const GROUPING_ITEMS: LibraryItem[] = [
  {
    id: "group-by",
    type: "grouping",
    label: "GROUP BY",
    description: "Группировка результатов по указанной колонке",
    icon: "LayoutGrid",
    defaultConfig: { column: "" },
  },
  {
    id: "having",
    type: "grouping",
    label: "HAVING",
    description: "Условие для отбора групп (после агрегации)",
    icon: "LayoutGrid",
    defaultConfig: { condition: "" },
  },
];

// ---------------------------------------------------------------------------
// 7. СОРТИРОВКА (Ordering: ORDER BY)
// Порядок строк в результате: ASC или DESC по выбранной колонке.
// ---------------------------------------------------------------------------

const ORDERING_ITEMS: LibraryItem[] = [
  {
    id: "order-asc",
    type: "ordering",
    label: "Order ASC",
    description: "Сортировка по возрастанию",
    icon: "ArrowUpNarrowWide",
    defaultConfig: { column: "", direction: "ASC" },
  },
  {
    id: "order-desc",
    type: "ordering",
    label: "Order DESC",
    description: "Сортировка по убыванию",
    icon: "ArrowDownNarrowWide",
    defaultConfig: { column: "", direction: "DESC" },
  },
];

// ---------------------------------------------------------------------------
// 8. ЛИМИТ (Limit / OFFSET)
// Ограничение числа строк в результате и смещение (для постраничной выборки).
// ---------------------------------------------------------------------------

const LIMIT_ITEMS: LibraryItem[] = [
  {
    id: "limit",
    type: "limit",
    label: "LIMIT",
    description: "Максимальное число строк и опционально OFFSET",
    icon: "Minus",
    defaultConfig: { limit: 10, offset: 0 },
  },
];

// ---------------------------------------------------------------------------
// 9. ПОДЗАПРОСЫ (Subquery)
// Вложенный запрос внутри основного (контейнер с собственным набором блоков).
// ---------------------------------------------------------------------------

const SUBQUERY_ITEMS: LibraryItem[] = [
  {
    id: "subquery",
    type: "subquery",
    label: "Subquery",
    description: "Вложенный запрос (подзапрос в FROM или в условии)",
    icon: "Braces",
    defaultConfig: { alias: "sub" },
  },
];

export const NAMESPACE_VITRINAS: Record<string, string[]> = {
  prd_advert_ods: ["dsp_events", "sgm_upload_dsp_segment", "http_cyrillic", "imsi_x_msisdn_actual", "cm_id_msisdn"],
  prd_advert_dict: ["v_segments_ref", "v_catalog_2gis_phones", "v_region_gibdd_codes", "v_cities_regions"],
  advert_dm: ["segments_bd_custom"],
  pixel: ["tracking_all"],
};

// ---------------------------------------------------------------------------
// Сборка единого списка в порядке отображения в сайдбаре
// (порядок категорий задаётся в types.ts: CATEGORY_LABELS)
// ---------------------------------------------------------------------------

export const LIBRARY_ITEMS: LibraryItem[] = [
  ...SOURCE_ITEMS,
  ...COLUMN_ITEMS,
  ...FILTER_ITEMS,
  ...LOGICAL_ITEMS,
  ...AGGREGATION_ITEMS,
  ...GROUPING_ITEMS,
  ...ORDERING_ITEMS,
  ...LIMIT_ITEMS,
  ...SUBQUERY_ITEMS,
];

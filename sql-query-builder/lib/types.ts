export type BlockCategory =
  | "source"
  | "column"
  | "filter"
  | "logical"
  | "aggregation"
  | "grouping"
  | "ordering"
  | "limit"
  | "subquery";

export interface LibraryItem {
  id: string;
  type: BlockCategory;
  label: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, unknown>;
}

export interface QueryBlock {
  id: string;
  type: BlockCategory;
  label: string;
  config: Record<string, unknown>;
  children?: QueryBlock[];
}

export interface QueryHistoryEntry {
  id: string;
  timestamp: number;
  name: string;
  blocks: QueryBlock[];
  json: string;
  sql: string;
  executionTime: number | null;
}

export interface QueryState {
  blocks: QueryBlock[];
  activeBlockId: string | null;
}

export const LIBRARY_ITEMS: LibraryItem[] = [
  // Data Sources
  {
    id: "source-users",
    type: "source",
    label: "Users",
    description: "Users table",
    icon: "Database",
    defaultConfig: { table: "users" },
  },
  {
    id: "source-orders",
    type: "source",
    label: "Orders",
    description: "Orders table",
    icon: "Database",
    defaultConfig: { table: "orders" },
  },
  {
    id: "source-products",
    type: "source",
    label: "Products",
    description: "Products table",
    icon: "Database",
    defaultConfig: { table: "products" },
  },
  {
    id: "source-custom",
    type: "source",
    label: "Custom Table",
    description: "Custom data source",
    icon: "Database",
    defaultConfig: { table: "" },
  },
  // Columns
  {
    id: "column-select",
    type: "column",
    label: "Select Column",
    description: "Pick a column to select",
    icon: "Columns3",
    defaultConfig: { column: "*", alias: "" },
  },
  // Filters
  {
    id: "filter-equals",
    type: "filter",
    label: "Equals",
    description: "WHERE column = value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "=", value: "" },
  },
  {
    id: "filter-not-equals",
    type: "filter",
    label: "Not Equals",
    description: "WHERE column != value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "!=", value: "" },
  },
  {
    id: "filter-greater",
    type: "filter",
    label: "Greater Than",
    description: "WHERE column > value",
    icon: "Filter",
    defaultConfig: { column: "", operator: ">", value: "" },
  },
  {
    id: "filter-less",
    type: "filter",
    label: "Less Than",
    description: "WHERE column < value",
    icon: "Filter",
    defaultConfig: { column: "", operator: "<", value: "" },
  },
  {
    id: "filter-like",
    type: "filter",
    label: "Like",
    description: "WHERE column LIKE pattern",
    icon: "Filter",
    defaultConfig: { column: "", operator: "LIKE", value: "" },
  },
  {
    id: "filter-in",
    type: "filter",
    label: "In",
    description: "WHERE column IN (values)",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IN", value: "" },
  },
  {
    id: "filter-between",
    type: "filter",
    label: "Between",
    description: "WHERE column BETWEEN a AND b",
    icon: "Filter",
    defaultConfig: { column: "", operator: "BETWEEN", valueLow: "", valueHigh: "" },
  },
  {
    id: "filter-is-null",
    type: "filter",
    label: "Is Null",
    description: "WHERE column IS NULL",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IS NULL" },
  },
  {
    id: "filter-is-not-null",
    type: "filter",
    label: "Is Not Null",
    description: "WHERE column IS NOT NULL",
    icon: "Filter",
    defaultConfig: { column: "", operator: "IS NOT NULL" },
  },
  // Logical Operators
  {
    id: "logical-and",
    type: "logical",
    label: "AND",
    description: "Logical AND operator",
    icon: "GitMerge",
    defaultConfig: { operator: "AND" },
  },
  {
    id: "logical-or",
    type: "logical",
    label: "OR",
    description: "Logical OR operator",
    icon: "GitBranch",
    defaultConfig: { operator: "OR" },
  },
  {
    id: "logical-not",
    type: "logical",
    label: "NOT",
    description: "Logical NOT operator",
    icon: "Ban",
    defaultConfig: { operator: "NOT" },
  },
  // Aggregations
  {
    id: "agg-count",
    type: "aggregation",
    label: "COUNT",
    description: "Count rows",
    icon: "Hash",
    defaultConfig: { function: "COUNT", column: "*", alias: "" },
  },
  {
    id: "agg-sum",
    type: "aggregation",
    label: "SUM",
    description: "Sum of values",
    icon: "Plus",
    defaultConfig: { function: "SUM", column: "", alias: "" },
  },
  {
    id: "agg-avg",
    type: "aggregation",
    label: "AVG",
    description: "Average of values",
    icon: "TrendingUp",
    defaultConfig: { function: "AVG", column: "", alias: "" },
  },
  {
    id: "agg-min",
    type: "aggregation",
    label: "MIN",
    description: "Minimum value",
    icon: "ArrowDown",
    defaultConfig: { function: "MIN", column: "", alias: "" },
  },
  {
    id: "agg-max",
    type: "aggregation",
    label: "MAX",
    description: "Maximum value",
    icon: "ArrowUp",
    defaultConfig: { function: "MAX", column: "", alias: "" },
  },
  // Grouping
  {
    id: "group-by",
    type: "grouping",
    label: "GROUP BY",
    description: "Group results by column",
    icon: "LayoutGrid",
    defaultConfig: { column: "" },
  },
  {
    id: "having",
    type: "grouping",
    label: "HAVING",
    description: "Filter grouped results",
    icon: "LayoutGrid",
    defaultConfig: { condition: "" },
  },
  // Ordering
  {
    id: "order-asc",
    type: "ordering",
    label: "Order ASC",
    description: "Order ascending",
    icon: "ArrowUpNarrowWide",
    defaultConfig: { column: "", direction: "ASC" },
  },
  {
    id: "order-desc",
    type: "ordering",
    label: "Order DESC",
    description: "Order descending",
    icon: "ArrowDownNarrowWide",
    defaultConfig: { column: "", direction: "DESC" },
  },
  // Limit
  {
    id: "limit",
    type: "limit",
    label: "LIMIT",
    description: "Limit result rows",
    icon: "Minus",
    defaultConfig: { limit: 100, offset: 0 },
  },
  // Subquery
  {
    id: "subquery",
    type: "subquery",
    label: "Subquery",
    description: "Nested query block",
    icon: "Braces",
    defaultConfig: { alias: "sub" },
  },
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  source: "Data Sources",
  column: "Columns",
  filter: "Filters",
  logical: "Logical Operators",
  aggregation: "Aggregations",
  grouping: "Grouping",
  ordering: "Ordering",
  limit: "Limit",
  subquery: "Subquery",
};

// CSS variable-based block colors that adapt to any theme.
// Each category gets its own `--block-*` variable defined below, then the bg/border/text
// are built from that variable using Tailwind's arbitrary value syntax.
//
// The actual hue values are embedded as inline styles by the BlockCard component
// via the CATEGORY_HUES map, and the bg / border / text classes use CSS color-mix
// or opacity for theme adaptation.

export const CATEGORY_HUES: Record<BlockCategory, string> = {
  source: "213 90% 55%",
  column: "155 65% 44%",
  filter: "38 85% 52%",
  logical: "270 60% 55%",
  aggregation: "350 70% 55%",
  grouping: "190 70% 46%",
  ordering: "25 85% 55%",
  limit: "220 10% 50%",
  subquery: "230 70% 56%",
};

export const CATEGORY_COLORS: Record<BlockCategory, { bg: string; border: string; text: string }> = {
  source: { bg: "bg-[hsl(213_90%_55%/0.08)]", border: "border-[hsl(213_90%_55%/0.2)]", text: "text-[hsl(213_90%_55%)]" },
  column: { bg: "bg-[hsl(155_65%_44%/0.08)]", border: "border-[hsl(155_65%_44%/0.2)]", text: "text-[hsl(155_65%_44%)]" },
  filter: { bg: "bg-[hsl(38_85%_52%/0.08)]", border: "border-[hsl(38_85%_52%/0.2)]", text: "text-[hsl(38_85%_52%)]" },
  logical: { bg: "bg-[hsl(270_60%_55%/0.08)]", border: "border-[hsl(270_60%_55%/0.2)]", text: "text-[hsl(270_60%_55%)]" },
  aggregation: { bg: "bg-[hsl(350_70%_55%/0.08)]", border: "border-[hsl(350_70%_55%/0.2)]", text: "text-[hsl(350_70%_55%)]" },
  grouping: { bg: "bg-[hsl(190_70%_46%/0.08)]", border: "border-[hsl(190_70%_46%/0.2)]", text: "text-[hsl(190_70%_46%)]" },
  ordering: { bg: "bg-[hsl(25_85%_55%/0.08)]", border: "border-[hsl(25_85%_55%/0.2)]", text: "text-[hsl(25_85%_55%)]" },
  limit: { bg: "bg-[hsl(220_10%_50%/0.08)]", border: "border-[hsl(220_10%_50%/0.2)]", text: "text-[hsl(220_10%_50%)]" },
  subquery: { bg: "bg-[hsl(230_70%_56%/0.08)]", border: "border-[hsl(230_70%_56%/0.2)]", text: "text-[hsl(230_70%_56%)]" },
};

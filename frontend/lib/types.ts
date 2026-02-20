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
  /** Имя иконки из библиотеки (Database, Columns3, Filter, …) для отображения как в сайдбаре */
  icon?: string;
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

export { LIBRARY_ITEMS } from "./components-catalog";

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

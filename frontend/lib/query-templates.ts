/**
 * Шаблоны запросов (пресеты структур блоков) для быстрой подстановки на канвас.
 * Каждый шаблон возвращает массив QueryBlock с уникальными id.
 */

import type { QueryBlock } from "./types";
import { generateId } from "./utils";

function id() {
  return generateId();
}

function block(
  type: QueryBlock["type"],
  label: string,
  config: Record<string, unknown>,
  options: { icon?: string; children?: QueryBlock[] } = {}
): QueryBlock {
  return {
    id: id(),
    type,
    label,
    icon: options.icon,
    config: { ...config },
    children: options.children,
  };
}

/** Simple: source, one column, limit (3 blocks) */
function getSimpleBlocks(): QueryBlock[] {
  return [
    block("source", "Users", { table: "users" }, { icon: "Database" }),
    block("column", "Select Column", { column: "*", alias: "" }, { icon: "Columns3" }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Medium: source, column, one subquery (nested source + column + filter), limit */
function getMediumBlocks(): QueryBlock[] {
  const subqueryChildren: QueryBlock[] = [
    block("source", "Products", { table: "products" }, { icon: "Database" }),
    block("column", "Select Column", { column: "*", alias: "" }, { icon: "Columns3" }),
    block("filter", "Greater Than", { column: "id", operator: ">", value: "0" }, { icon: "Filter" }),
  ];
  return [
    block("source", "Orders", { table: "orders" }, { icon: "Database" }),
    block("column", "Select Column", { column: "*", alias: "" }, { icon: "Columns3" }),
    block("subquery", "Subquery", { alias: "sub" }, { icon: "Braces", children: subqueryChildren }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Complex: users + subqueries, subquery-in-subquery (ord contains items), filters at each level, ORDER BY, LIMIT */
function getComplexBlocks(): QueryBlock[] {
  const innerSubqueryChildren: QueryBlock[] = [
    block("source", "Order items", { table: "order_items" }, { icon: "Database" }),
    block("column", "Select Column", { column: "order_id", alias: "" }, { icon: "Columns3" }),
    block("filter", "Greater Than", { column: "quantity", operator: ">", value: "0" }, { icon: "Filter" }),
  ];
  const subOrdChildren: QueryBlock[] = [
    block("source", "Orders", { table: "orders" }, { icon: "Database" }),
    block("subquery", "Subquery", { alias: "items" }, { icon: "Braces", children: innerSubqueryChildren }),
    block("column", "Select Column", { column: "id", alias: "" }, { icon: "Columns3" }),
    block("filter", "Completed", { column: "completed", operator: "=", value: true }, { icon: "Filter" }),
  ];
  const subProdChildren: QueryBlock[] = [
    block("source", "Products", { table: "products" }, { icon: "Database" }),
    block("column", "Select Column", { column: "name", alias: "" }, { icon: "Columns3" }),
  ];
  const subCatChildren: QueryBlock[] = [
    block("source", "Categories", { table: "categories" }, { icon: "Database" }),
    block("column", "Select Column", { column: "*", alias: "" }, { icon: "Columns3" }),
  ];
  return [
    block("source", "Users", { table: "users" }, { icon: "Database" }),
    block("subquery", "Subquery", { alias: "ord" }, { icon: "Braces", children: subOrdChildren }),
    block("subquery", "Subquery", { alias: "prod" }, { icon: "Braces", children: subProdChildren }),
    block("subquery", "Subquery", { alias: "cat" }, { icon: "Braces", children: subCatChildren }),
    block("column", "Select Column", { column: "id", alias: "" }, { icon: "Columns3" }),
    block("column", "Select Column", { column: "name", alias: "" }, { icon: "Columns3" }),
    block("filter", "Greater Than", { column: "id", operator: ">=", value: "10" }, { icon: "Filter" }),
    block("filter", "Like", { column: "name", operator: "LIKE", value: "%" }, { icon: "Filter" }),
    block("ordering", "Order DESC", { column: "id", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("ordering", "Order ASC", { column: "name", direction: "ASC" }, { icon: "ArrowUpNarrowWide" }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

export interface QueryTemplate {
  id: string;
  label: string;
  description: string;
  getBlocks: () => QueryBlock[];
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "simple",
    label: "Simple",
    description: "Source, column, limit (3 blocks)",
    getBlocks: getSimpleBlocks,
  },
  {
    id: "medium",
    label: "Medium",
    description: "Source, column, one subquery, limit",
    getBlocks: getMediumBlocks,
  },
  {
    id: "complex",
    label: "Complex",
    description: "Complex subqueries, multiple filters and sorts",
    getBlocks: getComplexBlocks,
  },
];

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
    block(
      "source",
      "http_cyrillic",
      { table: "prd_advert_ods.http_cyrillic" },
      { icon: "Database" },
    ),
    block("column", "request_id", { column: "request_id", alias: "" }, { icon: "Columns3" }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Medium: source, column, one subquery (nested source + column + filter), limit */
function getMediumBlocks(): QueryBlock[] {
  const subqueryChildren: QueryBlock[] = [
    block(
      "source",
      "dsp_events (high bids)",
      { table: "prd_advert_ods.dsp_events" },
      { icon: "Database" },
    ),
    block("column", "event_id", { column: "event_id", alias: "" }, { icon: "Columns3" }),
    block(
      "filter",
      "bid_price > 0.05",
      { column: "bid_price", operator: ">", value: 0.05 },
      { icon: "Filter" },
    ),
  ];
  return [
    block(
      "source",
      "dsp_events",
      { table: "prd_advert_ods.dsp_events" },
      { icon: "Database" },
    ),
    block("column", "event_id", { column: "event_id", alias: "" }, { icon: "Columns3" }),
    block("subquery", "Subquery", { alias: "sub" }, { icon: "Braces", children: subqueryChildren }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Complex: users + subqueries, subquery-in-subquery (ord contains items), filters at each level, ORDER BY, LIMIT */
function getComplexBlocks(): QueryBlock[] {
  const innerSubqueryChildren: QueryBlock[] = [
    block(
      "source",
      "SGM_UPLOAD_DSP_SEGMENT (status IN)",
      { table: "prd_advert_ods.sgm_upload_dsp_segment" },
      { icon: "Database" },
    ),
    block("column", "upload_id", { column: "upload_id", alias: "" }, { icon: "Columns3" }),
    block(
      "filter",
      "status IN (success,failed)",
      { column: "status", operator: "IN", value: "success,failed" },
      { icon: "Filter" },
    ),
  ];
  const subOrdChildren: QueryBlock[] = [
    block(
      "source",
      "SGM_UPLOAD_DSP_SEGMENT",
      { table: "prd_advert_ods.sgm_upload_dsp_segment" },
      { icon: "Database" },
    ),
    block(
      "subquery",
      "Subquery",
      { alias: "recent_uploads" },
      { icon: "Braces", children: innerSubqueryChildren },
    ),
    block("column", "segment_id", { column: "segment_id", alias: "seg_id" }, { icon: "Columns3" }),
    block(
      "filter",
      "msisdn <> ''",
      { column: "msisdn", operator: "<>", value: "" },
      { icon: "Filter" },
    ),
  ];
  const subProdChildren: QueryBlock[] = [
    block(
      "source",
      "V_CATALOG_2GIS_PHONES",
      { table: "prd_advert_dict.v_catalog_2gis_phones" },
      { icon: "Database" },
    ),
    block("column", "phone_id", { column: "phone_id", alias: "phone_id" }, { icon: "Columns3" }),
  ];
  const subCatChildren: QueryBlock[] = [
    block(
      "source",
      "DSP_EVENTS",
      { table: "prd_advert_ods.dsp_events" },
      { icon: "Database" },
    ),
    block("column", "event_id", { column: "event_id", alias: "event_id" }, { icon: "Columns3" }),
    block("column", "user_id", { column: "user_id", alias: "user_id" }, { icon: "Columns3" }),
  ];
  return [
    block(
      "source",
      "IMSI_X_MSISDN_ACTUAL",
      { table: "prd_advert_ods.imsi_x_msisdn_actual" },
      { icon: "Database" },
    ),
    block("subquery", "Subquery", { alias: "uploads" }, { icon: "Braces", children: subOrdChildren }),
    block("subquery", "Subquery", { alias: "phones" }, { icon: "Braces", children: subProdChildren }),
    block("subquery", "Subquery", { alias: "events" }, { icon: "Braces", children: subCatChildren }),
    block("column", "imsi", { column: "imsi", alias: "" }, { icon: "Columns3" }),
    block("column", "msisdn", { column: "msisdn", alias: "" }, { icon: "Columns3" }),
    block(
      "filter",
      "operator = МТС",
      { column: "operator", operator: "=", value: "МТС" },
      { icon: "Filter" },
    ),
    block(
      "filter",
      "is_active = true",
      { column: "is_active", operator: "=", value: true },
      { icon: "Filter" },
    ),
    block(
      "ordering",
      "updated_at DESC",
      { column: "updated_at", direction: "DESC" },
      { icon: "ArrowDownNarrowWide" },
    ),
    block(
      "ordering",
      "imsi ASC",
      { column: "imsi", direction: "ASC" },
      { icon: "ArrowUpNarrowWide" },
    ),
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

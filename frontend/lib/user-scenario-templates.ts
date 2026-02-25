/**
 * Шаблоны пользовательских сценариев — реальные запросы к системным таблицам.
 * Каждый шаблон возвращает массив QueryBlock с уникальными id.
 */

import type { QueryBlock } from "./types";
import type { QueryTemplate } from "./query-templates";
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

/** Сценарий 1: HTTP-логи — быстрый просмотр */
function getHttpLogsBlocks(): QueryBlock[] {
  return [
    block("source", "http_cyrillic", { table: "prd_advert_ods.http_cyrillic" }, { icon: "Database" }),
    block("column", "request_id", { column: "request_id", alias: "" }, { icon: "Columns3" }),
    block("column", "url", { column: "url", alias: "" }, { icon: "Columns3" }),
    block("column", "user_agent", { column: "user_agent", alias: "" }, { icon: "Columns3" }),
    block("column", "request_ts", { column: "request_ts", alias: "" }, { icon: "Columns3" }),
    block("limit", "LIMIT", { limit: 10, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 2: Активные IMSI-записи МТС */
function getImsiMtsBlocks(): QueryBlock[] {
  return [
    block("source", "imsi_x_msisdn_actual", { table: "prd_advert_ods.imsi_x_msisdn_actual" }, { icon: "Database" }),
    block("column", "imsi", { column: "imsi", alias: "" }, { icon: "Columns3" }),
    block("column", "msisdn", { column: "msisdn", alias: "" }, { icon: "Columns3" }),
    block("column", "operator", { column: "operator", alias: "" }, { icon: "Columns3" }),
    block("column", "updated_at", { column: "updated_at", alias: "" }, { icon: "Columns3" }),
    block("logical", "AND", { operator: "AND" }, { icon: "GitMerge", children: [] }),
    block("filter", "operator = МТС", { column: "operator", operator: "=", value: "МТС" }, { icon: "Filter" }),
    block("filter", "is_active = true", { column: "is_active", operator: "=", value: true }, { icon: "Filter" }),
    block("ordering", "updated_at DESC", { column: "updated_at", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("limit", "LIMIT", { limit: 100, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 3: DSP-аукционы — ставки в диапазоне */
function getDspAuctionsBlocks(): QueryBlock[] {
  return [
    block("source", "dsp_events", { table: "prd_advert_ods.dsp_events" }, { icon: "Database" }),
    block("column", "event_id", { column: "event_id", alias: "" }, { icon: "Columns3" }),
    block("column", "user_id", { column: "user_id", alias: "" }, { icon: "Columns3" }),
    block("column", "event_ts", { column: "event_ts", alias: "" }, { icon: "Columns3" }),
    block("column", "bid_price", { column: "bid_price", alias: "" }, { icon: "Columns3" }),
    block("column", "is_viewable", { column: "is_viewable", alias: "" }, { icon: "Columns3" }),
    block("filter", "bid_price BETWEEN", { column: "bid_price", operator: "BETWEEN", valueLow: 0.05, valueHigh: 9.9999 }, { icon: "Filter" }),
    block("ordering", "bid_price DESC", { column: "bid_price", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("limit", "LIMIT", { limit: 50, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 4: Загрузки сегментов — success и failed */
function getSegmentUploadsBlocks(): QueryBlock[] {
  return [
    block("source", "sgm_upload_dsp_segment", { table: "prd_advert_ods.sgm_upload_dsp_segment" }, { icon: "Database" }),
    block("column", "upload_id", { column: "upload_id", alias: "" }, { icon: "Columns3" }),
    block("column", "segment_id", { column: "segment_id", alias: "" }, { icon: "Columns3" }),
    block("column", "msisdn", { column: "msisdn", alias: "" }, { icon: "Columns3" }),
    block("column", "upload_ts", { column: "upload_ts", alias: "" }, { icon: "Columns3" }),
    block("column", "status", { column: "status", alias: "" }, { icon: "Columns3" }),
    block("filter", "status IN", { column: "status", operator: "IN", value: "success,failed" }, { icon: "Filter" }),
    block("ordering", "upload_ts DESC", { column: "upload_ts", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("limit", "LIMIT", { limit: 200, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 5: Справочник 2GIS — Москва и Питер */
function get2gisDirectoryBlocks(): QueryBlock[] {
  return [
    block("source", "v_catalog_2gis_phones", { table: "prd_advert_dict.v_catalog_2gis_phones" }, { icon: "Database" }),
    block("column", "phone_id", { column: "phone_id", alias: "" }, { icon: "Columns3" }),
    block("column", "phone_number", { column: "phone_number", alias: "" }, { icon: "Columns3" }),
    block("column", "rubric", { column: "rubric", alias: "" }, { icon: "Columns3" }),
    block("column", "city", { column: "city", alias: "" }, { icon: "Columns3" }),
    block("logical", "OR", { operator: "OR" }, { icon: "GitMerge", children: [] }),
    block("filter", "city = Москва", { column: "city", operator: "=", value: "Москва" }, { icon: "Filter" }),
    block("filter", "city = Санкт-Петербург", { column: "city", operator: "=", value: "Санкт-Петербург" }, { icon: "Filter" }),
    block("ordering", "rubric ASC", { column: "rubric", direction: "ASC" }, { icon: "ArrowUpNarrowWide" }),
    block("limit", "LIMIT", { limit: 100, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 6: CM-маппинг — пустой MSISDN */
function getCmMappingBlocks(): QueryBlock[] {
  return [
    block("source", "cm_id_msisdn", { table: "prd_advert_ods.cm_id_msisdn" }, { icon: "Database" }),
    block("column", "cm_id", { column: "cm_id", alias: "" }, { icon: "Columns3" }),
    block("column", "source", { column: "source", alias: "" }, { icon: "Columns3" }),
    block("column", "created_at", { column: "created_at", alias: "" }, { icon: "Columns3" }),
    block("column", "is_confirmed", { column: "is_confirmed", alias: "" }, { icon: "Columns3" }),
    block("filter", "msisdn IS NULL", { column: "msisdn", operator: "IS NULL", value: "" }, { icon: "Filter" }),
    block("ordering", "created_at DESC", { column: "created_at", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("limit", "LIMIT", { limit: 200, offset: 0 }, { icon: "Minus" }),
  ];
}

/** Сценарий 7: Pixel — конверсии на checkout */
function getPixelConversionsBlocks(): QueryBlock[] {
  return [
    block("source", "tracking_all", { table: "pixel.tracking_all" }, { icon: "Database" }),
    block("column", "pixel_id", { column: "pixel_id", alias: "" }, { icon: "Columns3" }),
    block("column", "user_id", { column: "user_id", alias: "" }, { icon: "Columns3" }),
    block("column", "page_url", { column: "page_url", alias: "" }, { icon: "Columns3" }),
    block("column", "event_ts", { column: "event_ts", alias: "" }, { icon: "Columns3" }),
    block("column", "is_conversion", { column: "is_conversion", alias: "" }, { icon: "Columns3" }),
    block("filter", "page_url LIKE %checkout%", { column: "page_url", operator: "LIKE", value: "%checkout%" }, { icon: "Filter" }),
    block("ordering", "event_ts DESC", { column: "event_ts", direction: "DESC" }, { icon: "ArrowDownNarrowWide" }),
    block("limit", "LIMIT", { limit: 100, offset: 0 }, { icon: "Minus" }),
  ];
}

export const USER_SCENARIO_TEMPLATES: QueryTemplate[] = [
  {
    id: "http-logs",
    label: "HTTP-логи: быстрый просмотр",
    description: "prd_advert_ods.http_cyrillic · 4 колонки · LIMIT 10",
    getBlocks: getHttpLogsBlocks,
  },
  {
    id: "imsi-mts",
    label: "Активные IMSI-записи МТС",
    description: "prd_advert_ods.imsi_x_msisdn_actual · AND-фильтр · LIMIT 100",
    getBlocks: getImsiMtsBlocks,
  },
  {
    id: "dsp-auctions",
    label: "DSP-аукционы: ставки в диапазоне",
    description: "prd_advert_ods.dsp_events · BETWEEN 0.05–9.9999 · LIMIT 50",
    getBlocks: getDspAuctionsBlocks,
  },
  {
    id: "segment-uploads",
    label: "Загрузки сегментов: success и failed",
    description: "prd_advert_ods.sgm_upload_dsp_segment · IN (success, failed) · LIMIT 200",
    getBlocks: getSegmentUploadsBlocks,
  },
  {
    id: "2gis-directory",
    label: "Справочник 2GIS: Москва и Питер",
    description: "prd_advert_dict.v_catalog_2gis_phones · OR-фильтр · LIMIT 100",
    getBlocks: get2gisDirectoryBlocks,
  },
  {
    id: "cm-mapping",
    label: "CM-маппинг: пустой MSISDN",
    description: "prd_advert_ods.cm_id_msisdn · IS NULL · LIMIT 200",
    getBlocks: getCmMappingBlocks,
  },
  {
    id: "pixel-conversions",
    label: "Pixel: конверсии на checkout",
    description: "pixel.tracking_all · LIKE %checkout% · LIMIT 100",
    getBlocks: getPixelConversionsBlocks,
  },
];

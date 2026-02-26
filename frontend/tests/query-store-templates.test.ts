import { describe, it, expect } from "vitest";
import { blocksToJson, blocksToSql } from "../lib/query-store";
import { QUERY_TEMPLATES } from "../lib/query-templates";
import { USER_SCENARIO_TEMPLATES } from "../lib/user-scenario-templates";

describe("blocksToJson and blocksToSql for query templates", () => {
  it("generates expected JSON and SQL for simple template", () => {
    const tpl = QUERY_TEMPLATES.find((t) => t.id === "simple");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.http_cyrillic"],
      select: ["request_id"],
      limit: 10,
    });

    expect(sql.trim()).toBe(
      [
        "SELECT request_id",
        "FROM prd_advert_ods.http_cyrillic",
        "LIMIT 10;",
      ].join("\n"),
    );
  });

  it("generates stable SQL for medium template with subquery", () => {
    const tpl = QUERY_TEMPLATES.find((t) => t.id === "medium");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const sql = blocksToSql(blocks);

    // We do not assert full formatting of nested subquery here, only key pieces.
    expect(sql).toContain("SELECT event_id");
    expect(sql).toContain("FROM prd_advert_ods.dsp_events");
    expect(sql).toContain("bid_price > 0.05");
    expect(sql).toContain("LIMIT 10");
  });

  it("generates stable SQL for complex template with multiple subqueries", () => {
    const tpl = QUERY_TEMPLATES.find((t) => t.id === "complex");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const sql = blocksToSql(blocks);

    expect(sql).toContain("FROM prd_advert_ods.imsi_x_msisdn_actual");
    expect(sql).toContain("status IN (");
    expect(sql).toContain("updated_at DESC");
    expect(sql).toContain("imsi ASC");
    expect(sql).toContain("LIMIT 10");
  });
});

describe("blocksToJson and blocksToSql for user scenario templates", () => {
  it("HTTP logs scenario generates expected JSON and SQL", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "http-logs");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.http_cyrillic"],
      select: ["request_id", "url", "user_agent", "request_ts"],
      limit: 10,
    });

    expect(sql.trim()).toBe(
      [
        "SELECT request_id, url, user_agent, request_ts",
        "FROM prd_advert_ods.http_cyrillic",
        "LIMIT 10;",
      ].join("\n"),
    );
  });

  it("IMSI MTS scenario uses AND filter and ordering", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "imsi-mts");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.imsi_x_msisdn_actual"],
      select: ["imsi", "msisdn", "operator", "updated_at"],
      where: {
        operator: "AND",
        conditions: [
          { column: "operator", operator: "=", value: "МТС" },
          { column: "is_active", operator: "=", value: true },
        ],
      },
      orderBy: [{ column: "updated_at", direction: "DESC" }],
      limit: 100,
    });

    expect(sql).toContain("FROM prd_advert_ods.imsi_x_msisdn_actual");
    expect(sql).toContain("WHERE operator = 'МТС' AND is_active = TRUE");
    expect(sql).toContain("ORDER BY updated_at DESC");
    expect(sql.trim().endsWith("LIMIT 100;")).toBe(true);
  });

  it("DSP auctions scenario uses BETWEEN filter", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "dsp-auctions");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.dsp_events"],
      select: ["event_id", "user_id", "event_ts", "bid_price", "is_viewable"],
      where: {
        column: "bid_price",
        operator: "BETWEEN",
        valueLow: 0.05,
        valueHigh: 9.9999,
      },
      orderBy: [{ column: "bid_price", direction: "DESC" }],
      limit: 50,
    });

    expect(sql).toContain("bid_price BETWEEN 0.05 AND 9.9999");
    expect(sql).toContain("ORDER BY bid_price DESC");
    expect(sql.trim().endsWith("LIMIT 50;")).toBe(true);
  });

  it("segment uploads scenario uses IN filter", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "segment-uploads");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.sgm_upload_dsp_segment"],
      select: ["upload_id", "segment_id", "msisdn", "upload_ts", "status"],
      where: {
        column: "status",
        operator: "IN",
        value: "success,failed",
      },
      orderBy: [{ column: "upload_ts", direction: "DESC" }],
      limit: 200,
    });

    expect(sql).toContain("status IN ('success', 'failed')");
    expect(sql).toContain("ORDER BY upload_ts DESC");
    expect(sql.trim().endsWith("LIMIT 200;")).toBe(true);
  });

  it("2GIS directory scenario uses OR logical filter", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "2gis-directory");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_dict.v_catalog_2gis_phones"],
      select: ["phone_id", "phone_number", "rubric", "city"],
      where: {
        operator: "OR",
        conditions: [
          { column: "city", operator: "=", value: "Москва" },
          { column: "city", operator: "=", value: "Санкт-Петербург" },
        ],
      },
      orderBy: [{ column: "rubric", direction: "ASC" }],
      limit: 100,
    });

    expect(sql).toContain("FROM prd_advert_dict.v_catalog_2gis_phones");
    expect(sql).toContain(
      "WHERE city = 'Москва' OR city = 'Санкт-Петербург'",
    );
    expect(sql).toContain("ORDER BY rubric ASC");
    expect(sql.trim().endsWith("LIMIT 100;")).toBe(true);
  });

  it("CM mapping scenario uses boolean filter and ordering", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "cm-mapping");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["prd_advert_ods.cm_id_msisdn"],
      select: ["cm_id", "source", "created_at", "is_confirmed"],
      where: {
        column: "is_confirmed",
        operator: "=",
        value: true,
      },
      orderBy: [{ column: "created_at", direction: "DESC" }],
      limit: 200,
    });

    expect(sql).toContain("is_confirmed = TRUE");
    expect(sql).toContain("ORDER BY created_at DESC");
    expect(sql.trim().endsWith("LIMIT 200;")).toBe(true);
  });

  it("pixel conversions scenario uses LIKE filter", () => {
    const tpl = USER_SCENARIO_TEMPLATES.find((t) => t.id === "pixel-conversions");
    expect(tpl).toBeDefined();
    const blocks = tpl!.getBlocks();

    const json = blocksToJson(blocks);
    const sql = blocksToSql(blocks);

    expect(json).toEqual({
      from: ["pixel.tracking_all"],
      select: ["pixel_id", "user_id", "page_url", "event_ts", "is_conversion"],
      where: {
        column: "page_url",
        operator: "LIKE",
        value: "%checkout%",
      },
      orderBy: [{ column: "event_ts", direction: "DESC" }],
      limit: 100,
    });

    expect(sql).toContain("page_url LIKE '%checkout%'");
    expect(sql).toContain("ORDER BY event_ts DESC");
    expect(sql.trim().endsWith("LIMIT 100;")).toBe(true);
  });
});


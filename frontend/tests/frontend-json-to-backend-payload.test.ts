import { describe, it, expect } from "vitest";
import { frontendJsonToBackendPayload } from "../lib/api";

describe("frontendJsonToBackendPayload with spark-query-examples", () => {
  it("maps simple single-condition filter (example 1)", () => {
    const json = {
      from: ["prd.http_cyrillic"],
      select: ["msisdn"],
      where: {
        column: "sn_start_time",
        operator: ">=",
        value: "2024-01-01",
      },
      limit: 1000,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload).toEqual({
      type: "select",
      columns: [{ name: "msisdn" }],
      from: { table: "prd.http_cyrillic" },
      where: {
        field: "sn_start_time",
        operator: ">=",
        value: "2024-01-01",
      },
      limit: 1000,
    });
  });

  it("maps simple inequality filter (example 2)", () => {
    const json = {
      from: ["prd.http_cyrillic"],
      select: ["msisdn", "http_host"],
      where: {
        column: "http_host",
        operator: "!=",
        value: "port",
      },
      limit: 500,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload).toEqual({
      type: "select",
      columns: [{ name: "msisdn" }, { name: "http_host" }],
      from: { table: "prd.http_cyrillic" },
      where: {
        field: "http_host",
        operator: "!=",
        value: "port",
      },
      limit: 500,
    });
  });

  it("maps AND-combination of filters (example 3)", () => {
    const json = {
      from: ["prd.http_cyrillic"],
      select: ["msisdn", "http_host", "query_clean", "sn_start_time"],
      where: {
        operator: "AND",
        conditions: [
          { column: "sn_start_time", operator: ">=", value: "2024-01-01" },
          { column: "sn_start_time", operator: "<=", value: "2024-01-31" },
          { column: "http_host", operator: "!=", value: "port" },
          { column: "query_clean", operator: "LIKE", value: "%поиск%" },
        ],
      },
      limit: 1000,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.type).toBe("select");
    expect(payload.columns).toEqual([
      { name: "msisdn" },
      { name: "http_host" },
      { name: "query_clean" },
      { name: "sn_start_time" },
    ]);
    expect(payload.where).toEqual({
      operator: "AND",
      conditions: [
        { field: "sn_start_time", operator: ">=", value: "2024-01-01" },
        { field: "sn_start_time", operator: "<=", value: "2024-01-31" },
        { field: "http_host", operator: "!=", value: "port" },
        { field: "query_clean", operator: "LIKE", value: "%поиск%" },
      ],
    });
    expect(payload.limit).toBe(1000);
  });

  it("maps ORDER BY + LIMIT (example 4)", () => {
    const json = {
      from: ["prd.dns_logs"],
      select: ["msisdn", "domain", "query_time", "response_code"],
      orderBy: [{ column: "query_time", direction: "DESC" }],
      limit: 200,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.columns).toEqual([
      { name: "msisdn" },
      { name: "domain" },
      { name: "query_time" },
      { name: "response_code" },
    ]);
    expect(payload.order_by).toEqual([
      { field: "query_time", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(200);
  });

  it("maps GROUP BY with aggregations (example 5)", () => {
    const json = {
      from: ["prd.sessions"],
      select: ["msisdn"],
      where: {
        operator: "AND",
        conditions: [
          { column: "start_time", operator: ">=", value: "2024-01-01" },
          { column: "start_time", operator: "<", value: "2024-02-01" },
        ],
      },
      groupBy: ["msisdn"],
      aggregations: [
        { function: "COUNT", column: "*", alias: "session_count" },
      ],
      orderBy: [{ column: "session_count", direction: "DESC" }],
      limit: 100,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.columns).toEqual([
      { name: "msisdn" },
      { name: "*", aggregate: "COUNT", alias: "session_count" },
    ]);
    expect(payload.group_by).toEqual(["msisdn"]);
    expect(payload.order_by).toEqual([
      { field: "session_count", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(100);
  });

  it("maps nested AND/OR conditions (example 6)", () => {
    const json = {
      from: ["prd.sessions"],
      select: ["msisdn", "session_id", "duration_sec", "bytes_total", "status"],
      where: {
        operator: "AND",
        conditions: [
          { column: "status", operator: "=", value: "active" },
          {
            operator: "OR",
            conditions: [
              { column: "duration_sec", operator: ">", value: 3600 },
              { column: "bytes_total", operator: ">", value: 104857600 },
            ],
          },
        ],
      },
      limit: 500,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.where).toEqual({
      operator: "AND",
      conditions: [
        { field: "status", operator: "=", value: "active" },
        {
          operator: "OR",
          conditions: [
            { field: "duration_sec", operator: ">", value: 3600 },
            { field: "bytes_total", operator: ">", value: 104857600 },
          ],
        },
      ],
    });
    expect(payload.limit).toBe(500);
  });

  it("maps BETWEEN + IN (example 7)", () => {
    const json = {
      from: ["orders"],
      select: ["user_id", "order_id", "amount", "status", "created_at"],
      where: {
        operator: "AND",
        conditions: [
          {
            column: "amount",
            operator: "BETWEEN",
            valueLow: 1000,
            valueHigh: 50000,
          },
          {
            column: "status",
            operator: "IN",
            value: "completed,shipped",
          },
        ],
      },
      orderBy: [{ column: "created_at", direction: "DESC" }],
      limit: 250,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.where).toEqual({
      operator: "AND",
      conditions: [
        {
          field: "amount",
          operator: "BETWEEN",
          value: [1000, 50000],
        },
        {
          field: "status",
          operator: "IN",
          value: "completed,shipped",
        },
      ],
    });
    expect(payload.order_by).toEqual([
      { field: "created_at", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(250);
  });

  it("maps IS NULL / IS NOT NULL (example 8)", () => {
    const json = {
      from: ["prd.dns_logs"],
      select: ["msisdn", "domain", "query_time", "response_ip"],
      where: {
        operator: "AND",
        conditions: [
          { column: "response_ip", operator: "IS NULL" },
          { column: "domain", operator: "IS NOT NULL" },
        ],
      },
      orderBy: [{ column: "query_time", direction: "DESC" }],
      limit: 300,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.where).toEqual({
      operator: "AND",
      conditions: [
        { field: "response_ip", operator: "IS NULL" },
        { field: "domain", operator: "IS NOT NULL" },
      ],
    });
    expect(payload.order_by).toEqual([
      { field: "query_time", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(300);
  });

  it("maps analytical GROUP BY with COUNT and SUM (example 9)", () => {
    const json = {
      from: ["orders"],
      select: ["product_id"],
      where: {
        column: "status",
        operator: "=",
        value: "completed",
      },
      groupBy: ["product_id"],
      aggregations: [
        { function: "COUNT", column: "*", alias: "order_count" },
        { function: "SUM", column: "amount", alias: "total_revenue" },
      ],
      orderBy: [{ column: "total_revenue", direction: "DESC" }],
      limit: 20,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.columns).toEqual([
      { name: "product_id" },
      { name: "*", aggregate: "COUNT", alias: "order_count" },
      { name: "amount", aggregate: "SUM", alias: "total_revenue" },
    ]);
    expect(payload.where).toEqual({
      field: "status",
      operator: "=",
      value: "completed",
    });
    expect(payload.group_by).toEqual(["product_id"]);
    expect(payload.order_by).toEqual([
      { field: "total_revenue", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(20);
  });

  it("maps edge case with only LIMIT (example 10)", () => {
    const json = {
      from: ["users"],
      select: ["*"],
      limit: 10,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.columns).toEqual([{ name: "*" }]);
    expect(payload.from).toEqual({ table: "users" });
    expect(payload.limit).toBe(10);
  });

  it("maps OR-combination of LIKE filters (example 11)", () => {
    const json = {
      from: ["prd.dns_logs"],
      select: ["msisdn", "domain", "query_time"],
      where: {
        operator: "OR",
        conditions: [
          { column: "domain", operator: "LIKE", value: "%vk.com%" },
          { column: "domain", operator: "LIKE", value: "%telegram%" },
          { column: "domain", operator: "LIKE", value: "%whatsapp%" },
        ],
      },
      orderBy: [{ column: "query_time", direction: "DESC" }],
      limit: 500,
    } as const;

    const payload = frontendJsonToBackendPayload(json as unknown as Record<string, unknown>);

    expect(payload.where).toEqual({
      operator: "OR",
      conditions: [
        { field: "domain", operator: "LIKE", value: "%vk.com%" },
        { field: "domain", operator: "LIKE", value: "%telegram%" },
        { field: "domain", operator: "LIKE", value: "%whatsapp%" },
      ],
    });
    expect(payload.order_by).toEqual([
      { field: "query_time", direction: "DESC" },
    ]);
    expect(payload.limit).toBe(500);
  });
});


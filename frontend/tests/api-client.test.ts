import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  compileRawJsonOnBackend,
  compileSqlOnBackend,
  compileQueryOnBackend,
  type BackendQueryPayload,
} from "../lib/api";

const originalFetch = global.fetch;

describe("API client", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("calls /api/v1/query/compile with raw JSON payload", async () => {
    const payload = { from: ["users"], select: ["*"], limit: 10 };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ sql: "SELECT * FROM users LIMIT 10" }),
    });

    const result = await compileRawJsonOnBackend(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/query/compile",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ sql: "SELECT * FROM users LIMIT 10" });
  });

  it("calls /api/v1/query/compile-sql with raw SQL string", async () => {
    const sql = "SELECT * FROM users LIMIT 10";
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ sql }),
    });

    const result = await compileSqlOnBackend(sql);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/query/compile-sql",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sql),
      }),
    );
    expect(result).toEqual({ sql });
  });

  it("wraps normalized BackendQueryPayload into { payload } for JSON_SQL endpoint", async () => {
    const payload: BackendQueryPayload = {
      type: "select",
      columns: [{ name: "*" }],
      from: { table: "users" },
    };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ sql: "SELECT * FROM users" }),
    });

    const result = await compileQueryOnBackend(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/query/compile",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      }),
    );
    expect(result).toEqual({ sql: "SELECT * FROM users" });
  });

  it("formats JSON error responses with validation details", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          detail: [
            { loc: ["body", "payload", "from"], msg: "field required", type: "value_error.missing" },
            { loc: ["body", "payload", "select", 0], msg: "invalid value", type: "type_error" },
          ],
        }),
    });

    await expect(
      compileQueryOnBackend({
        type: "select",
        columns: [],
        from: { table: "" },
      } as BackendQueryPayload),
    ).rejects.toThrow(
      "body.payload.from: field required; body.payload.select.0: invalid value",
    );
  });

  it("falls back to plain text error when JSON cannot be parsed", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(compileSqlOnBackend("SELECT 1")).rejects.toThrow(
      "Internal Server Error",
    );
  });
});


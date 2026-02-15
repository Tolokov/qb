const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : "";

export interface BackendColumn {
  name: string;
  aggregate?: string;
  alias?: string;
}

export interface BackendCondition {
  field?: string;
  operator: string;
  value?: unknown;
  conditions?: BackendCondition[];
}

export interface BackendQueryPayload {
  type: "select";
  columns: BackendColumn[];
  from: { table: string };
  where?: BackendCondition;
  group_by?: string[];
  having?: BackendCondition;
  order_by?: { field: string; direction: string }[];
  limit?: number;
}

export interface CompileResponse {
  sql: string;
}

type FrontendJson = Record<string, unknown>;

function mapCondition(c: Record<string, unknown>): BackendCondition {
  if (c.conditions && Array.isArray(c.conditions)) {
    return {
      operator: (c.operator as string) || "AND",
      conditions: (c.conditions as Record<string, unknown>[]).map(mapCondition),
    };
  }
  const field = (c.column ?? c.field) as string | undefined;
  const operator = c.operator as string;
  const value = c.value ?? (c.valueLow != null && c.valueHigh != null ? [c.valueLow, c.valueHigh] : undefined);
  return { field: field ?? "", operator, value };
}

export function frontendJsonToBackendPayload(json: FrontendJson): BackendQueryPayload {
  const columns: BackendColumn[] = [];

  const select = json.select;
  if (Array.isArray(select)) {
    for (const s of select) {
      if (typeof s === "string") columns.push({ name: s });
      else if (s && typeof s === "object" && "column" in s) {
        const o = s as { column: string; alias?: string };
        columns.push({ name: o.column || "*", alias: o.alias });
      }
    }
  }
  if (columns.length === 0 && !Array.isArray(json.aggregations)) {
    columns.push({ name: "*" });
  }

  const aggs = json.aggregations as Array<{ function: string; column: string; alias?: string }> | undefined;
  if (Array.isArray(aggs)) {
    for (const a of aggs) {
      columns.push({
        name: a.column || "*",
        aggregate: a.function,
        alias: a.alias,
      });
    }
  }

  const fromTables = json.from as string[] | undefined;
  const table = Array.isArray(fromTables) && fromTables.length > 0 ? fromTables[0] : "unknown";

  const payload: BackendQueryPayload = {
    type: "select",
    columns,
    from: { table },
  };

  const where = json.where as Record<string, unknown> | undefined;
  if (where && Object.keys(where).length > 0) {
    payload.where = mapCondition(where);
  }

  const groupBy = json.groupBy as string[] | undefined;
  if (Array.isArray(groupBy) && groupBy.length > 0) {
    payload.group_by = groupBy;
  }

  const havingArr = json.having as unknown[] | undefined;
  if (Array.isArray(havingArr) && havingArr.length > 0 && havingArr[0]) {
    const first = havingArr[0];
    if (typeof first === "string") {
      payload.having = { operator: "=", value: first };
    } else if (first && typeof first === "object") {
      payload.having = mapCondition(first as Record<string, unknown>);
    }
  }

  const orderBy = json.orderBy as Array<{ column: string; direction: string }> | undefined;
  if (Array.isArray(orderBy) && orderBy.length > 0) {
    payload.order_by = orderBy
      .filter((o) => o?.column)
      .map((o) => ({ field: o.column, direction: o.direction || "ASC" }));
  }

  const limit = json.limit;
  if (typeof limit === "number" && limit > 0) {
    payload.limit = limit;
  }

  return payload;
}

export async function compileQueryOnBackend(
  payload: BackendQueryPayload
): Promise<CompileResponse> {
  const res = await fetch(`${API_BASE}/api/v1/query/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (j.detail !== undefined) {
        message = Array.isArray(j.detail)
          ? (j.detail as Array<{ msg?: string }>).map((d) => d.msg ?? String(d)).join("; ")
          : String(j.detail);
      } else if (text) {
        message = text;
      }
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json() as Promise<CompileResponse>;
}

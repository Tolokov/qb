# QB Subagent Prompts

Ready-to-use prompts for subagent tasks (mcp_task). Role and subagent type are listed per block.

**When to use this file:** (a) You need a ready-made prompt for a known QB task. (b) You want example goals for auto-delegation (use the “Goal (for auto-delegation)” line). (c) The delegation rule did not suggest a prompt and you need a template. If the subagent has no repo context, include in the prompt: project name (QB), area (backend/frontend), and goal; the full prompts below already do that.

**Automatic delegation:** With the **Subagent delegation** rule (`.cursor/rules/subagent-delegation.mdc`) enabled, you only need to state the **goal**; routing and task theme are set by the rule. The prompts below are optional examples for manual invocation or for refining the auto-generated prompt.

**Recommended order:** (1) Ensure the frontend sends requests to the backend (Stage 0.1). (2) Ensure the backend understands Spark and can emit simple queries (Stage 0.2). (3) Then implement full JSON → Spark SQL compilation and later tasks.

---

## Stage 0.1. Ensure the frontend sends requests to the backend

**Subagent type:** `explore` (verification) or `generalPurpose` (if code changes needed).  
**Rule:** Frontend developer.

**Goal (for auto-delegation):** Ensure the frontend actually sends requests to the backend and the chain works.

**Full prompt:**

```
Project QB (SQL Query Builder). You act as Frontend developer (.cursor/rules/frontend-developer.mdc).

Goal: Ensure the frontend sends requests to the backend and the chain works.

Context:
- lib/api.ts has compileQueryOnBackend: POST to NEXT_PUBLIC_API_URL (default http://localhost:8000) /api/v1/query/compile, body { payload } (BackendQueryPayload).
- preview-panel.tsx calls compileQueryOnBackend(payload) on Run Query; payload is built from blocks via frontendJsonToBackendPayload(blocksToJson(...)).

Tasks:
1. Verify code: URL is built correctly (no trailing slash), request is sent on Run Query, network and 4xx/5xx errors are handled and shown to the user.
2. If something is missing for confident verification, suggest minimal changes (logging, toast on call, or a short README note: run make run and check in UI that backend response (echo) appears in preview).
3. Result: explicit confirmation that "frontend sends requests to backend" and, if needed, steps for manual verification or a minimal test.

Do not change the API contract (request body, expected response). Do not add new dependencies unless necessary.
```

---

## Stage 0.2. Ensure the backend understands Spark and can emit simple queries

**Subagent type:** `generalPurpose`.  
**Rule:** Backend developer.

**Goal (for auto-delegation):** Ensure the backend can form simple Spark SQL or PySpark snippets; do not implement full JSON compilation yet.

**Full prompt:**

```
Project QB. You act as Backend developer (.cursor/rules/backend-developer.mdc).

Goal: Ensure the backend understands Spark and can form simple queries (Spark SQL or PySpark). Do not implement full compilation from arbitrary JSON at this stage.

Context:
- POST /api/v1/query/compile currently returns only echo (EchoQueryRepository). backend/app/README.md has SQL → PySpark examples. requirements.txt includes pyspark and Spark.
- MockQueryRepository in query_repository.py references undefined QueryBuilder and SparkCodeRenderer.

Tasks:
1. Add minimal working code that, for a fixed simple example (e.g. SELECT * FROM table_name LIMIT 10), produces a Spark SQL string and/or a PySpark code snippet (as in README).
2. Option A: Extend EchoQueryRepository (or a new repository) so that for one or two known payload shapes it returns, in addition to echo, a field sql with that simple string (hardcoded example or simple template from payload table name). Extend QueryResponse schema with optional sql so the frontend can display it. Option B: Add a separate endpoint GET /api/v1/query/spark-example (or with query param table=...) that returns an example Spark SQL and/or PySpark for demonstration.
3. Goal is to prove the project has code that can emit valid Spark; do not implement full JSON → SQL parsing.

Constraints: No eval, no shell=True, no unsafe SQL concatenation. Use templates or standard APIs. Do not weaken types. Preserve backward compatibility: do not break existing echo response.
```

---

## Next stage. Backend: JSON → Spark-compatible SQL compilation

**Subagent type:** `generalPurpose`.  
**Rule:** Backend developer. Run after stages 0.1 and 0.2.

**Goal (for auto-delegation):** Implement full compilation of frontend payload JSON to Spark-compatible SQL on the backend.

**Full prompt:**

```
Project QB. Backend developer (.cursor/rules/backend-developer.mdc).

Goal: Implement real compilation of JSON (frontend payload) → Spark-compatible SQL on the backend.

Context:
- By this stage it is already verified: frontend sends requests to backend; backend can form simple Spark queries (stage 0.2).
- Currently compile returns echo (and possibly a simple sql from stage 0.2). Full compilation is needed for payload structure (from, select, where, group_by, order_by, limit, etc. — see frontend lib/api.ts BackendQueryPayload, lib/types, and blocksToJson).

Tasks:
1. Implement compiler: input — JSON payload in frontend format; output — Spark-compatible SQL string (and optionally separate PySpark).
2. QueryResponse may already have sql; extend if needed. Wire the real compilation repository in dependencies.py.
3. Use payload structure from frontend; do not change request contract without agreement. Explicit error handling and invalid payload handling. No eval/shell/SQL concatenation; do not weaken types.
```

---

## 2. Frontend: Show compiled SQL from API in preview

**Subagent type:** `generalPurpose`.  
**Rule:** Frontend developer.

**Goal (for auto-delegation):** Once the backend returns sql in QueryResponse, show that compiled SQL in the preview (with fallback and error display).

**Full prompt:**

```
Project QB. You act as Frontend developer (.cursor/rules/frontend-developer.mdc).

Goal: After the backend adds sql to QueryResponse, show the compiled SQL from the API response in the preview (not only client-side generation).

Context:
- preview-panel has JSON and SQL tabs; SQL is currently generated on the client (blocksToSql, etc.).
- Run Query calls compile API; response currently has only echo.
- When the backend returns sql: show that SQL in preview (e.g. in the same SQL tab or a "Server SQL" section), handle missing sql (fallback to client SQL), show compilation errors from the backend.

Tasks:
1. Update types/API client (lib/api.ts) for QueryResponse with sql (and optional error message).
2. In the preview component, after a successful Run, use the sql value from the response for display, with fallback to current client generation if sql is absent.
3. Show backend compilation errors to the user (toast or block in preview) without breaking existing UX.

Do not change the request contract to the API. Follow existing patterns (Zustand, query-builder components, error handling).
```

---

## 3. Backend: Clear compilation error messages

**Subagent type:** `generalPurpose`.  
**Rule:** Backend developer.

**Goal (for auto-delegation):** Return clear error messages with block or field reference when compilation fails.

**Full prompt:**

```
Project QB. Backend developer (.cursor/rules/backend-developer.mdc).

Goal: When JSON → SQL compilation fails, return a clear message with block or field reference so the user can fix the query quickly.

Tasks:
1. Define error format in API response (e.g. error or errors field in QueryResponse, or HTTP 422 with details). Do not break the existing success contract.
2. In compiler/service, for invalid payload or SQL build errors, form a message with path (block id, field name) or line/position when possible.
3. Document the format in schemas (Pydantic) and OpenAPI if needed.

Handle errors explicitly (do not swallow exceptions); preserve types. Do not add extra dependencies.
```

---

## 4. Frontend: Save query to library

**Subagent type:** `generalPurpose`.  
**Rule:** Frontend developer.

**Goal (for auto-delegation):** Let the user save the current query to a library (saved/favorites) for reuse, separate from run history.

**Full prompt:**

```
Project QB. Frontend developer (.cursor/rules/frontend-developer.mdc).

Goal: User can save the current query to their library (saved/favorites) to reuse later, not only rely on in-browser history.

Context:
- There is run history (history-panel, Zustand + localStorage) and a block catalog (sidebar-library) — fixed set of blocks for drag-and-drop.
- "Library" here means user-saved full queries, separate from history.

Tasks:
1. Define data model: what to store (same block structures as history?), name, date. Storage local for now (localStorage or a separate key/section in Zustand persist).
2. Add UI: "Save to library" (query name, optional description), list of saved queries, load selected query onto canvas.
3. Keep "History" (recent runs) and "Library" (saved for reuse) distinct without breaking the existing history flow.

Minimal changes; avoid new dependencies. Follow query-store, history-panel, sidebar-library patterns.
```

---

## 5. PySpark export (backend + frontend)

**Subagent type:** First `generalPurpose` for backend, then for frontend.  
**Rule:** Backend developer, then Frontend developer.

**Goal (backend):** Add PySpark code to compile response (or a dedicated endpoint) so the user can export for pipeline/script.

**Full prompt (backend):**

```
Project QB. Backend developer.

Goal: Add a PySpark code field to the compile response (or a separate endpoint) so the user can export the query as code for a pipeline or script.

Tasks: Extend compiler or API response with pyspark (string), or add GET/POST /api/v1/query/export/pyspark with same payload. Document response format in schemas. Do not break existing compile contract. See backend/app/README.md for SQL → PySpark examples.
```

**Goal (frontend):** Let the user copy/download PySpark export when the backend provides it.

**Full prompt (frontend):**

```
Project QB. Frontend developer.

Goal: In preview or via a button, let the user copy/download PySpark export when the backend returns pyspark (or response from export/pyspark endpoint).

Tasks: "Export PySpark" button or tab in preview; on click — call API if separate endpoint or use field from compile response; show code and copy to clipboard. Handle case when backend does not yet provide PySpark (hide or disable). Do not change request contract.
```

---

## 6. Explore: API and contract audit

**Subagent type:** `explore`.  
**Thoroughness:** medium.

**Goal (for auto-delegation):** Quick audit of frontend–backend contracts and places that need changes for sql/pyspark.

**Full prompt:**

```
Project QB. Run a short audit of contracts between frontend and backend.

Find: (1) What fields the frontend expects in compile response (lib/api.ts, components calling the API). (2) What fields and formats the backend returns (QueryResponse, routes, repositories). (3) Gaps and places where adding sql/pyspark will require frontend changes. Result: short list of files and gaps; do not change code.
```

---

## How to use

- **Order:** Stage 0.1 (frontend → backend) → Stage 0.2 (backend simple Spark) → “Next stage” (full compilation) → remaining tasks.
- **With auto-delegation:** Enable **Subagent delegation** and pass only the **goal** from each section; the rule picks the agent and can use these prompts as reference for the generated prompt.
- **Manual:** In mcp_task set `subagent_type`: `generalPurpose` for implementation, `explore` for verification/audit. Paste the **Full prompt** (or the **Goal** plus context) into `prompt`. Add context if needed (e.g. “stage 0.2 done, implementing full compilation”). If the subagent has no repo context, always include project (QB), area (backend/frontend), and goal in the prompt.
- **Output:** Role rules expect a short summary of what was done or found and, if code changed, affected files or steps. Full prompts above already imply that.
- For backend/frontend tasks, the matching rule is applied automatically when working under `backend/**` or `frontend/**`, or enable it explicitly in the chat.

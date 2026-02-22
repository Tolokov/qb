# QB Project Agents

The project uses three roles (rules in `.cursor/rules/`). Enable the one that matches your task.

## 1. Product Owner (`product-owner.mdc`)

**When to use**: discussing vision, requirements, feature goals, writing user stories and acceptance criteria.

- Focuses on **what** the product should do and **why**.
- Does not prescribe implementation; ties tasks to user value.
- Enable by selecting the rule “Product Owner — product vision, goals and functionality” in Cursor (Rules / @-mention).

## 2. Backend Developer (`backend-developer.mdc`)

**When to use**: any backend work (API, query compilation, models, services).

- The rule is applied automatically when working with files under `backend/**`.
- You can also enable the “Backend developer” rule explicitly for backend-focused chat.

## 3. Frontend Developer (`frontend-developer.mdc`)

**When to use**: any frontend work (UI, query editor, API integration).

- The rule is applied automatically when working with files under `frontend/**`.
- You can also enable the “Frontend developer” rule explicitly for client-focused chat.

---

For mixed tasks you can enable multiple rules (e.g. Product Owner + Backend or Frontend).

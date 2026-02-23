# QB Project Agents

The project uses **role-based rules** in `.cursor/rules/`. Each role has a **task scope**: when you delegate to a subagent, you only need to state the **goal**; the role rule automatically scopes the task. You do **not** need to specify the exact steps for each subagent.

Project docs: [README.md](README.md) (overview, Makefile, run), [CHANGELOG.md](CHANGELOG.md) (version history).

---

## Role rules (all in English)

| Rule | When to use | Auto-scoped topics |
|------|-------------|--------------------|
| **Product Owner** (`product-owner.mdc`) | Vision, requirements, user stories, feature goals, evaluation, roadmap | Vision, requirements, user stories, feature definition, review, documentation of value |
| **Backend developer** (`backend-developer.mdc`) | API, query compilation, models, services, config | API, compilation, services/repositories, models/schemas, config, tests, security |
| **Frontend developer** (`frontend-developer.mdc`) | UI, query editor, preview, history, API integration | Query editor, API integration, UI/UX, types/state, components, localization |

- **Product Owner** is enabled by selecting the rule in Cursor (Rules / @-mention). It focuses on **what** and **why**, not implementation.
- **Backend** and **Frontend** are applied automatically when working with files under `backend/**` or `frontend/**`; you can also enable them explicitly.

All role rules **include the user rules from Cursor settings** (security, typing, minimal change, no public API changes without request, etc.). The full list is also in `_user-rules.mdc` (reference only; do not enable it alone).

---

## Subagent delegation (automatic task assignment)

When you **delegate to a subagent** (e.g. via `mcp_task`):

The rule is **applied automatically** (`alwaysApply: true`). No need to enable it manually.

1. **Do not** specify the exact task for each subagent. State the **goal** (e.g. “Ensure backend returns a simple Spark SQL string” or “Evaluate project stage and next step”). The role’s **task scope** (see table above) automatically narrows the work.
2. The **delegation rule** maps your intent to a subagent type and suggests a short prompt (goal + context). Use `generalPurpose` for implementation, `explore` for read-only search/audit, `shell` for commands. Ready-made goals and full prompts: [.cursor/subagent-prompts.md](.cursor/subagent-prompts.md).

For mixed tasks (e.g. backend + frontend), delegate **once per area** with one goal each. For ambiguous or cross-layer requests, the delegation rule describes how to split or fall back.

---

## Summary

- **Role rules**: English; include user rules; define **task scope** so tasks are auto-scoped when delegated. Each role describes **boundaries** (e.g. backend does not change frontend; frontend assumes backend contract) and **output** (short summary ± affected files/steps).
- **Delegation**: Use `subagent-delegation.mdc` when delegating; provide only the **goal**; the rule handles routing and prompt shape. See `subagent-prompts.md` for ready-made goals and full prompts.
- **User rules**: Embedded in each role; also in `_user-rules.mdc` for reference.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueryBlock, QueryHistoryEntry, LibraryItem } from "./types";
import type { ValidationError } from "./validation";
import { getVisualBlockOrder } from "./canvas-groups";
import { generateId } from "./utils";

function updateBlockInTree(
  blocks: QueryBlock[],
  id: string,
  updater: (b: QueryBlock) => QueryBlock
): QueryBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    if (b.children) return { ...b, children: updateBlockInTree(b.children, id, updater) };
    return b;
  });
}

function removeBlockFromTree(blocks: QueryBlock[], id: string): QueryBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => ({
      ...b,
      children: b.children ? removeBlockFromTree(b.children, id) : undefined,
    }));
}

function findBlockInTree(blocks: QueryBlock[], id: string): QueryBlock | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlockInTree(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function insertBlockInTree(
  blocks: QueryBlock[],
  parentId: string,
  newBlock: QueryBlock,
  index?: number
): QueryBlock[] {
  return blocks.map((b) => {
    if (b.id === parentId && b.children !== undefined) {
      const children = [...b.children];
      if (index !== undefined && index >= 0) {
        children.splice(index, 0, newBlock);
      } else {
        children.push(newBlock);
      }
      return { ...b, children };
    }
    if (b.children) {
      return { ...b, children: insertBlockInTree(b.children, parentId, newBlock, index) };
    }
    return b;
  });
}

export function blocksToJson(blocks: QueryBlock[]): object {
  const sources = blocks.filter((b) => b.type === "source");
  const columns = blocks.filter((b) => b.type === "column");
  const filters = blocks.filter((b) => b.type === "filter");
  const logicals = blocks.filter((b) => b.type === "logical");
  const aggregations = blocks.filter((b) => b.type === "aggregation");
  const grouping = blocks.filter((b) => b.type === "grouping");
  const ordering = blocks.filter((b) => b.type === "ordering");
  const limits = blocks.filter((b) => b.type === "limit");
  const subqueries = blocks.filter((b) => b.type === "subquery");

  const json: Record<string, unknown> = {};

  if (sources.length > 0) {
    json.from = sources.map((s) => s.config.table).filter(Boolean);
  }

  if (columns.length > 0) {
    json.select = columns.map((c) => {
      const col = c.config.column || "*";
      const alias = c.config.alias;
      return alias ? { column: col, alias } : col;
    });
  } else if (aggregations.length === 0) {
    json.select = ["*"];
  }

  if (aggregations.length > 0) {
    json.aggregations = aggregations.map((a) => ({
      function: a.config.function,
      column: a.config.column || "*",
      ...(a.config.alias ? { alias: a.config.alias } : {}),
    }));
  }

  if (filters.length > 0) {
    const conditions = filters.map((f) => ({
      column: f.config.column,
      operator: f.config.operator,
      ...(f.config.operator === "BETWEEN"
        ? { valueLow: f.config.valueLow, valueHigh: f.config.valueHigh }
        : f.config.operator === "IS NULL" || f.config.operator === "IS NOT NULL"
          ? {}
          : { value: f.config.value }),
    }));
    if (logicals.length > 0 && conditions.length > 1) {
      json.where = { operator: logicals[0].config.operator, conditions };
    } else if (conditions.length === 1) {
      json.where = conditions[0];
    } else {
      json.where = { operator: "AND", conditions };
    }
  }

  if (grouping.length > 0) {
    const groupBys = grouping.filter((g) => g.label === "GROUP BY" && g.config.column);
    const havings = grouping.filter((g) => g.label === "HAVING" && g.config.condition);
    if (groupBys.length > 0) json.groupBy = groupBys.map((g) => g.config.column);
    if (havings.length > 0) json.having = havings.map((h) => h.config.condition);
  }

  if (ordering.length > 0) {
    json.orderBy = ordering.map((o) => ({
      column: o.config.column,
      direction: o.config.direction,
    }));
  }

  if (limits.length > 0) {
    const l = limits[0];
    json.limit = l.config.limit;
    if (l.config.offset && Number(l.config.offset) > 0) json.offset = l.config.offset;
  }

  if (subqueries.length > 0) {
    json.subqueries = subqueries.map((sq) => ({
      alias: sq.config.alias,
      query: sq.children ? blocksToJson(sq.children) : {},
    }));
  }

  return json;
}

export function blocksToSql(blocks: QueryBlock[]): string {
  const json = blocksToJson(blocks) as Record<string, unknown>;
  const parts: string[] = [];

  const selects: string[] = [];
  if (Array.isArray(json.select)) {
    for (const s of json.select) {
      if (typeof s === "string") selects.push(s);
      else if (s && typeof s === "object" && "column" in s) {
        const obj = s as { column: string; alias?: string };
        selects.push(obj.alias ? `${obj.column} AS ${obj.alias}` : obj.column);
      }
    }
  }
  if (Array.isArray(json.aggregations)) {
    for (const a of json.aggregations as Array<{
      function: string;
      column: string;
      alias?: string;
    }>) {
      const expr = `${a.function}(${a.column})`;
      selects.push(a.alias ? `${expr} AS ${a.alias}` : expr);
    }
  }
  parts.push(`SELECT ${selects.length > 0 ? selects.join(", ") : "*"}`);

  const fromParts: string[] = [];
  for (const b of blocks) {
    if (b.type === "source" && b.config.table) {
      fromParts.push(String(b.config.table));
    } else if (b.type === "subquery" && b.children && b.children.length > 0 && b.config.alias) {
      const inner = blocksToSql(b.children).replace(/;\s*$/, "").trim();
      fromParts.push(`(\n${indentSql(inner, 1)}\n\t) AS ${b.config.alias}`);
    }
  }
  if (fromParts.length > 0) parts.push(`FROM ${fromParts.join(", ")}`);

  if (json.where) {
    const w = json.where as Record<string, unknown>;
    if (w.conditions && Array.isArray(w.conditions)) {
      const conds = (w.conditions as Array<Record<string, unknown>>)
        .map(formatCondition)
        .filter(Boolean);
      if (conds.length > 0) parts.push(`WHERE ${conds.join(` ${w.operator || "AND"} `)}`);
    } else {
      const cond = formatCondition(w);
      if (cond) parts.push(`WHERE ${cond}`);
    }
  }

  if (Array.isArray(json.groupBy) && json.groupBy.length > 0) {
    parts.push(`GROUP BY ${(json.groupBy as string[]).join(", ")}`);
  }

  if (Array.isArray(json.having) && json.having.length > 0) {
    parts.push(`HAVING ${(json.having as string[]).join(" AND ")}`);
  }

  if (Array.isArray(json.orderBy)) {
    const orderParts = (json.orderBy as Array<{ column: string; direction: string }>)
      .filter((o) => o.column)
      .map((o) => `${o.column} ${o.direction}`);
    if (orderParts.length > 0) parts.push(`ORDER BY ${orderParts.join(", ")}`);
  }

  if (json.limit !== undefined) parts.push(`LIMIT ${json.limit}`);
  if (json.offset !== undefined) parts.push(`OFFSET ${json.offset}`);

  return parts.join("\n") + ";";
}

/** Добавляет отступ (табы) к каждой строке SQL для вложенных подзапросов. */
function indentSql(sql: string, tabs: number): string {
  const tab = "\t".repeat(tabs);
  return sql
    .split("\n")
    .map((line) => tab + line)
    .join("\n");
}

function formatCondition(c: Record<string, unknown>): string {
  const col = c.column as string;
  const op = c.operator as string;
  if (!col) return "";
  if (op === "IS NULL" || op === "IS NOT NULL") return `${col} ${op}`;
  if (op === "BETWEEN")
    return `${col} BETWEEN ${quote(c.valueLow)} AND ${quote(c.valueHigh)}`;
  if (op === "IN") {
    const val = String(c.value || "");
    const items = val.split(",").map((v) => quote(v.trim()));
    return `${col} IN (${items.join(", ")})`;
  }
  return `${col} ${op} ${quote(c.value)}`;
}

function quote(val: unknown): string {
  if (val === undefined || val === null || val === "") return "''";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  const s = String(val);
  if (/^\d+(\.\d+)?$/.test(s)) return s;
  return `'${s.replace(/'/g, "''")}'`;
}

export interface QueryBuilderState {
  blocks: QueryBlock[];
  activeBlockId: string | null;
  history: QueryHistoryEntry[];
  showHistory: boolean;
  lastAppliedFromTemplate: boolean;
  dragOverContainerId: string | null;
  validationErrors: ValidationError[];
  backendResponse: string | null;
  backendError: string | null;
  lastRunTime: number | null;
  lastRunStatus: "success" | "error" | null;

  addBlock: (item: LibraryItem, parentId?: string) => void;
  removeBlock: (id: string) => void;
  updateBlockConfig: (id: string, key: string, value: unknown) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  moveBlockToContainer: (blockId: string, containerId: string) => void;
  moveBlockToRoot: (blockId: string, index?: number) => void;
  setBlocks: (blocks: QueryBlock[]) => void;
  setBlocksFromTemplate: (blocks: QueryBlock[]) => void;
  setRootBlocksOrder: (orderedIds: string[]) => void;
  reorderRootBlocks: (activeId: string, overId: string) => void;
  clearBlocks: () => void;
  setActiveBlockId: (id: string | null) => void;
  setDragOverContainerId: (id: string | null) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setBackendResult: (response: string | null, error: string | null, time: number, status: "success" | "error") => void;
  clearBackendResult: () => void;
  setShowHistory: (show: boolean) => void;
  setLastAppliedFromTemplate: (value: boolean) => void;
  addHistoryEntry: (entry: QueryHistoryEntry) => void;
  removeHistoryEntry: (id: string) => void;
  renameHistoryEntry: (id: string, name: string) => void;
  loadFromHistory: (entry: QueryHistoryEntry) => void;
  hasHistoryEntryWithSameJson: (canonicalJsonStr: string) => boolean;
  getJsonOutput: () => string;
  getSqlOutput: () => string;
}

export const useQueryStore = create<QueryBuilderState>()(
  persist(
    (set, get) => ({
      blocks: [],
      activeBlockId: null,
      history: [],
      showHistory: false,
      lastAppliedFromTemplate: false,
      dragOverContainerId: null,
      validationErrors: [],
      backendResponse: null,
      backendError: null,
      lastRunTime: null,
      lastRunStatus: null,

      addBlock: (item, parentId) => {
        const newBlock: QueryBlock = {
          id: generateId(),
          type: item.type,
          label: item.label,
          icon: item.icon,
          config: { ...item.defaultConfig },
          children:
            item.type === "subquery" || item.type === "logical" ? [] : undefined,
        };
        set((state) => {
          const isFirstSource =
            item.type === "source" &&
            !parentId &&
            !state.blocks.some((b) => b.type === "source");

          const newBlocks = parentId
            ? insertBlockInTree(state.blocks, parentId, newBlock)
            : [...state.blocks, newBlock];

          if (isFirstSource) {
            const selectBlock: QueryBlock = {
              id: generateId(),
              type: "column",
              label: "Select Column",
              icon: "Columns3",
              config: { column: "*", alias: "" },
            };
            return { blocks: [...newBlocks, selectBlock] };
          }

          return { blocks: newBlocks };
        });
      },

      removeBlock: (id) =>
        set((state) => ({
          blocks: removeBlockFromTree(state.blocks, id),
          activeBlockId: state.activeBlockId === id ? null : state.activeBlockId,
        })),

      updateBlockConfig: (id, key, value) =>
        set((state) => ({
          blocks: updateBlockInTree(state.blocks, id, (b) => ({
            ...b,
            config: { ...b.config, [key]: value },
          })),
          validationErrors: state.validationErrors.filter((e) => e.blockId !== id),
        })),

      reorderBlocks: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.blocks.findIndex((b) => b.id === activeId);
          const newIndex = state.blocks.findIndex((b) => b.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;
          const newBlocks = [...state.blocks];
          const [moved] = newBlocks.splice(oldIndex, 1);
          if (moved) newBlocks.splice(newIndex, 0, moved);
          return { blocks: newBlocks };
        }),

      moveBlockToContainer: (blockId, containerId) =>
        set((state) => {
          const block = findBlockInTree(state.blocks, blockId);
          if (!block) return state;
          const without = removeBlockFromTree(state.blocks, blockId);
          return { blocks: insertBlockInTree(without, containerId, block) };
        }),

      moveBlockToRoot: (blockId, index) =>
        set((state) => {
          const block = findBlockInTree(state.blocks, blockId);
          if (!block) return state;
          const without = removeBlockFromTree(state.blocks, blockId);
          if (index !== undefined) {
            const newBlocks = [...without];
            newBlocks.splice(index, 0, block);
            return { blocks: newBlocks };
          }
          return { blocks: [...without, block] };
        }),

      setBlocks: (blocks) => set({ blocks }),
      setBlocksFromTemplate: (blocks) =>
        set({ blocks, activeBlockId: null, lastAppliedFromTemplate: true }),
      setRootBlocksOrder: (orderedIds) =>
        set((state) => ({
          blocks: orderedIds
            .map((id) => state.blocks.find((b) => b.id === id))
            .filter((b): b is QueryBlock => b != null),
        })),
      reorderRootBlocks: (activeId, overId) =>
        set((state) => {
          const visualOrder = getVisualBlockOrder(state.blocks);
          if (!visualOrder.includes(overId)) return state;
          const newOrder = visualOrder.filter((id) => id !== activeId);
          const overIndex = newOrder.indexOf(overId);
          if (overIndex < 0) return state;
          newOrder.splice(overIndex, 0, activeId);
          const block = findBlockInTree(state.blocks, activeId);
          if (!block) return state;
          if (state.blocks.some((b) => b.id === activeId)) {
            return {
              blocks: newOrder
                .map((id) => state.blocks.find((b) => b.id === id))
                .filter((b): b is QueryBlock => b != null),
            };
          }
          const without = removeBlockFromTree(state.blocks, activeId);
          const newBlocks = newOrder
            .map((id) =>
              id === activeId ? block : findBlockInTree(without, id)
            )
            .filter((b): b is QueryBlock => b != null);
          return { blocks: newBlocks };
        }),
      clearBlocks: () => set({ blocks: [], activeBlockId: null }),

      setActiveBlockId: (id) => set({ activeBlockId: id }),
      setDragOverContainerId: (id) => set({ dragOverContainerId: id }),
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      setBackendResult: (response, error, time, status) =>
        set({ backendResponse: response, backendError: error, lastRunTime: time, lastRunStatus: status }),
      clearBackendResult: () =>
        set({ backendResponse: null, backendError: null, lastRunTime: null, lastRunStatus: null }),

      setShowHistory: (show) => set({ showHistory: show }),
      setLastAppliedFromTemplate: (value) =>
        set({ lastAppliedFromTemplate: value }),

      addHistoryEntry: (entry) =>
        set((state) => ({ history: [entry, ...state.history] })),

      removeHistoryEntry: (id) =>
        set((state) => ({ history: state.history.filter((e) => e.id !== id) })),

      renameHistoryEntry: (id, name) =>
        set((state) => ({
          history: state.history.map((e) => (e.id === id ? { ...e, name } : e)),
        })),

      loadFromHistory: (entry) =>
        set({
          blocks: JSON.parse(JSON.stringify(entry.blocks)),
          showHistory: false,
          activeBlockId: null,
        }),

      hasHistoryEntryWithSameJson: (canonicalJsonStr) => {
        const state = get();
        try {
          const canonical = canonicalJsonStr.trim();
          return state.history.some((e) => {
            try {
              return JSON.stringify(JSON.parse(e.json)) === canonical;
            } catch {
              return false;
            }
          });
        } catch {
          return false;
        }
      },

      getJsonOutput: () => {
        const { blocks } = get();
        if (blocks.length === 0) return "";
        return JSON.stringify(blocksToJson(blocks), null, 2);
      },

      getSqlOutput: () => {
        const { blocks } = get();
        if (blocks.length === 0) return "";
        return blocksToSql(blocks);
      },
    }),
    {
      name: "querycraft-store",
      partialize: (state) => ({
        blocks: state.blocks,
        history: state.history,
      }),
    }
  )
);

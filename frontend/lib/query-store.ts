"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueryBlock, QueryHistoryEntry, LibraryItem } from "./types";
import type { ValidationError } from "./validation";

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

function moveBlockInTree(
  blocks: QueryBlock[],
  blockId: string,
  oldIndex: number,
  newIndex: number
): QueryBlock[] {
  const rootIdx = blocks.findIndex((b) => b.id === blockId);
  if (rootIdx !== -1) {
    const result = [...blocks];
    const [item] = result.splice(oldIndex, 0);
    if (item) {
      result.splice(newIndex, 0, item);
    }
    return result;
  }
  return blocks.map((b) => {
    if (b.children) {
      const childIdx = b.children.findIndex((c) => c.id === blockId);
      if (childIdx !== -1) {
        const children = [...b.children];
        const [item] = children.splice(oldIndex, 1);
        if (item) children.splice(newIndex, 0, item);
        return { ...b, children };
      }
      return { ...b, children: moveBlockInTree(b.children, blockId, oldIndex, newIndex) };
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

  if (Array.isArray(json.from) && json.from.length > 0) {
    parts.push(`FROM ${(json.from as string[]).join(", ")}`);
  }

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
  const s = String(val);
  if (/^\d+(\.\d+)?$/.test(s)) return s;
  return `'${s.replace(/'/g, "''")}'`;
}

export interface QueryBuilderState {
  blocks: QueryBlock[];
  activeBlockId: string | null;
  history: QueryHistoryEntry[];
  showHistory: boolean;
  dragOverContainerId: string | null;
  validationErrors: ValidationError[];

  addBlock: (item: LibraryItem, parentId?: string) => void;
  removeBlock: (id: string) => void;
  updateBlockConfig: (id: string, key: string, value: unknown) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  moveBlockToContainer: (blockId: string, containerId: string) => void;
  moveBlockToRoot: (blockId: string, index?: number) => void;
  setBlocks: (blocks: QueryBlock[]) => void;
  clearBlocks: () => void;
  setActiveBlockId: (id: string | null) => void;
  setDragOverContainerId: (id: string | null) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setShowHistory: (show: boolean) => void;
  addHistoryEntry: (entry: QueryHistoryEntry) => void;
  removeHistoryEntry: (id: string) => void;
  renameHistoryEntry: (id: string, name: string) => void;
  loadFromHistory: (entry: QueryHistoryEntry) => void;
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
      dragOverContainerId: null,
      validationErrors: [],

      addBlock: (item, parentId) => {
        const newBlock: QueryBlock = {
          id: crypto.randomUUID(),
          type: item.type,
          label: item.label,
          config: { ...item.defaultConfig },
          children:
            item.type === "subquery" || item.type === "logical" ? [] : undefined,
        };
        set((state) => ({
          blocks: parentId
            ? insertBlockInTree(state.blocks, parentId, newBlock)
            : [...state.blocks, newBlock],
        }));
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
      clearBlocks: () => set({ blocks: [], activeBlockId: null }),

      setActiveBlockId: (id) => set({ activeBlockId: id }),
      setDragOverContainerId: (id) => set({ dragOverContainerId: id }),
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      setShowHistory: (show) => set({ showHistory: show }),

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

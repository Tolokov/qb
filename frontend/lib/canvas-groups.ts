/**
 * Группировка корневых блоков по строкам на канвасе.
 * Строка ломается при смене группы типов — порядок добавления сохраняется.
 * В одной строке только блоки одной логической группы (источники, колонки и т.д.).
 */

import type { QueryBlock, BlockCategory } from "./types";

/** Группы типов блоков (по смыслу SQL). Используется только для определения «одной группы». */
export const CANVAS_ROW_GROUPS: BlockCategory[][] = [
  ["source", "subquery"],
  ["column", "aggregation"],
  ["filter", "logical"],
  ["grouping"],
  ["ordering"],
  ["limit"],
];

function getGroupIndex(type: BlockCategory): number {
  const i = CANVAS_ROW_GROUPS.findIndex((group) => group.includes(type));
  return i >= 0 ? i : -1;
}

/**
 * Разбивает корневые блоки на строки по смене группы.
 * Порядок блоков совпадает с порядком в исходном массиве (порядок добавления).
 * Новая строка начинается, когда тип блока переходит в другую группу.
 */
export function groupBlocksIntoRows(blocks: QueryBlock[]): QueryBlock[][] {
  if (blocks.length === 0) return [];
  const rows: QueryBlock[][] = [];
  let currentRow: QueryBlock[] = [];
  let currentGroupIndex = -1;

  for (const block of blocks) {
    const groupIndex = getGroupIndex(block.type);
    if (groupIndex !== currentGroupIndex) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentGroupIndex = groupIndex;
    }
    currentRow.push(block);
  }
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

/**
 * Визуальный порядок id = порядок блоков в state (сохраняется при разбиении по строкам).
 */
export function getVisualBlockOrder(blocks: QueryBlock[]): string[] {
  return blocks.map((b) => b.id);
}

import type { QueryBlock } from "./types";

export interface ValidationError {
  blockId: string;
  field: string;
  message: string;
}

function collectBlocks(blocks: QueryBlock[]): QueryBlock[] {
  const out: QueryBlock[] = [];
  for (const b of blocks) {
    out.push(b);
    if (b.children?.length) {
      out.push(...collectBlocks(b.children));
    }
  }
  return out;
}

/**
 * Проверяет, что все обязательные поля блоков заполнены.
 */
export function validateBlocks(blocks: QueryBlock[]): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const all = collectBlocks(blocks);

  if (all.length === 0) {
    return { valid: false, errors: [{ blockId: "", field: "", message: "Добавьте хотя бы один блок на канвас." }] };
  }

  const sources = all.filter((b) => b.type === "source");
  const hasValidSource = sources.some((s) => String(s.config.table ?? "").trim() !== "");
  if (!hasValidSource) {
    if (sources.length > 0) {
      sources.forEach((s) => {
        errors.push({ blockId: s.id, field: "table", message: "Укажите имя таблицы (источник данных)." });
      });
    } else {
      errors.push({
        blockId: all[0].id,
        field: "",
        message: "Добавьте блок источника данных (Data Source) и укажите таблицу.",
      });
    }
  }

  for (const block of all) {
    switch (block.type) {
      case "source": {
        const table = String(block.config.table ?? "").trim();
        if (!table) {
          errors.push({ blockId: block.id, field: "table", message: "Таблица обязательна." });
        }
        break;
      }
      case "column": {
        const column = String(block.config.column ?? "").trim();
        if (column === "") {
          errors.push({ blockId: block.id, field: "column", message: "Укажите колонку или *." });
        }
        break;
      }
      case "filter": {
        const column = String(block.config.column ?? "").trim();
        if (!column) {
          errors.push({ blockId: block.id, field: "column", message: "Укажите колонку для условия." });
        }
        const op = block.config.operator;
        if (op !== "IS NULL" && op !== "IS NOT NULL") {
          if (op === "BETWEEN") {
            const low = String(block.config.valueLow ?? "").trim();
            const high = String(block.config.valueHigh ?? "").trim();
            if (low === "" || high === "") {
              errors.push({
                blockId: block.id,
                field: low ? "valueHigh" : "valueLow",
                message: "Для BETWEEN укажите оба значения (от и до).",
              });
            }
          } else {
            const value = block.config.value;
            if (value === undefined || value === null || String(value).trim() === "") {
              errors.push({ blockId: block.id, field: "value", message: "Укажите значение для сравнения." });
            }
          }
        }
        break;
      }
      case "aggregation": {
        const fn = block.config.function;
        const column = String(block.config.column ?? "").trim();
        if (fn !== "COUNT" && column === "") {
          errors.push({ blockId: block.id, field: "column", message: "Укажите колонку для агрегации." });
        }
        break;
      }
      case "grouping":
        if (block.label === "GROUP BY") {
          const column = String(block.config.column ?? "").trim();
          if (!column) {
            errors.push({ blockId: block.id, field: "column", message: "Укажите колонку для GROUP BY." });
          }
        } else if (block.label === "HAVING") {
          const condition = String(block.config.condition ?? "").trim();
          if (!condition) {
            errors.push({ blockId: block.id, field: "condition", message: "Укажите условие HAVING." });
          }
        }
        break;
      case "ordering": {
        const column = String(block.config.column ?? "").trim();
        if (!column) {
          errors.push({ blockId: block.id, field: "column", message: "Укажите колонку для сортировки." });
        }
        break;
      }
      case "limit": {
        const limit = block.config.limit;
        const num = typeof limit === "number" ? limit : Number(limit);
        if (Number.isNaN(num) || num < 1) {
          errors.push({ blockId: block.id, field: "limit", message: "Укажите число строк (целое, от 1)." });
        }
        break;
      }
      case "subquery": {
        const alias = String(block.config.alias ?? "").trim();
        if (!alias) {
          errors.push({ blockId: block.id, field: "alias", message: "Укажите алиас подзапроса." });
        }
        if (block.children?.length) {
          const childResult = validateBlocks(block.children);
          errors.push(...childResult.errors);
        }
        break;
      }
      case "logical":
        if (block.children?.length) {
          const childResult = validateBlocks(block.children);
          errors.push(...childResult.errors);
        }
        break;
      default:
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

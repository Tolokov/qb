import type { Locale } from "./translations";
import { TRANSLATIONS } from "./translations";
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

const DEFAULT_LOCALE: Locale = "en";

/**
 * Проверяет, что все обязательные поля блоков заполнены.
 * Сообщения возвращаются на выбранном языке (locale).
 * @param isRoot — только при вызове от корня дерева проверяется наличие Data Source (в поддеревьях logical/subquery источник не требуется).
 */
export function validateBlocks(
  blocks: QueryBlock[],
  locale: Locale = DEFAULT_LOCALE,
  isRoot: boolean = true
): { valid: boolean; errors: ValidationError[] } {
  const t = TRANSLATIONS[locale].validation;
  const errors: ValidationError[] = [];
  const all = collectBlocks(blocks);

  if (all.length === 0) {
    return { valid: false, errors: [{ blockId: "", field: "", message: t.addBlockToCanvas }] };
  }

  const sources = all.filter((b) => b.type === "source");
  const getSourceTable = (s: QueryBlock): string => {
    const table = String(s.config.table ?? "").trim();
    if (table) return table;
    const ns = String(s.config.namespace ?? "").trim();
    const vit = String(s.config.vitrina ?? "").trim();
    return ns && vit ? `${ns}.${vit}` : "";
  };
  const hasValidSource = sources.some((s) => getSourceTable(s) !== "");
  if (isRoot && !hasValidSource) {
    if (sources.length > 0) {
      sources.forEach((s) => {
        errors.push({ blockId: s.id, field: "table", message: t.specifyTable });
      });
    } else {
      errors.push({
        blockId: all[0].id,
        field: "",
        message: t.addDataSource,
      });
    }
  }

  for (const block of all) {
    switch (block.type) {
      case "source": {
        const table =
          String(block.config.table ?? "").trim() ||
          (block.config.namespace && block.config.vitrina
            ? `${String(block.config.namespace).trim()}.${String(block.config.vitrina).trim()}`
            : "");
        if (!table) {
          errors.push({ blockId: block.id, field: "table", message: t.tableRequired });
        }
        break;
      }
      case "column": {
        const column = String(block.config.column ?? "").trim();
        if (column === "") {
          errors.push({ blockId: block.id, field: "column", message: t.specifyColumnOrStar });
        }
        break;
      }
      case "filter": {
        const column = String(block.config.column ?? "").trim();
        if (!column) {
          errors.push({ blockId: block.id, field: "column", message: t.specifyColumnForCondition });
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
                message: t.betweenBothValues,
              });
            }
          } else {
            const value = block.config.value;
            if (value === undefined || value === null || String(value).trim() === "") {
              errors.push({ blockId: block.id, field: "value", message: t.specifyValueForCompare });
            }
          }
        }
        break;
      }
      case "aggregation": {
        const fn = block.config.function;
        const column = String(block.config.column ?? "").trim();
        if (fn !== "COUNT" && column === "") {
          errors.push({ blockId: block.id, field: "column", message: t.specifyColumnForAggregation });
        }
        break;
      }
      case "grouping":
        if (block.label === "GROUP BY") {
          const column = String(block.config.column ?? "").trim();
          if (!column) {
            errors.push({ blockId: block.id, field: "column", message: t.specifyColumnForGroupBy });
          }
        } else if (block.label === "HAVING") {
          const condition = String(block.config.condition ?? "").trim();
          if (!condition) {
            errors.push({ blockId: block.id, field: "condition", message: t.specifyHavingCondition });
          }
        }
        break;
      case "ordering": {
        const column = String(block.config.column ?? "").trim();
        if (!column) {
          errors.push({ blockId: block.id, field: "column", message: t.specifyColumnForOrder });
        }
        break;
      }
      case "limit": {
        const limit = block.config.limit;
        const num = typeof limit === "number" ? limit : Number(limit);
        if (Number.isNaN(num) || num < 1) {
          errors.push({ blockId: block.id, field: "limit", message: t.specifyLimit });
        }
        break;
      }
      case "subquery": {
        const alias = String(block.config.alias ?? "").trim();
        if (!alias) {
          errors.push({ blockId: block.id, field: "alias", message: t.specifySubqueryAlias });
        }
        if (block.children?.length) {
          const childResult = validateBlocks(block.children, locale, false);
          errors.push(...childResult.errors);
        }
        break;
      }
      case "logical":
        if (block.children?.length) {
          const childResult = validateBlocks(block.children, locale, false);
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

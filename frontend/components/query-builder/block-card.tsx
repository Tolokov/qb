"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Database,
  Columns3,
  Filter,
  GitMerge,
  GitBranch,
  Ban,
  Hash,
  Plus,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  Minus,
  Braces,
  X,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS, type QueryBlock } from "@/lib/types";
import { useQueryStore } from "@/lib/query-store";
import type { ValidationError } from "@/lib/validation";

/** Карта иконок по имени (как в библиотеке компонентов) */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Columns3,
  Filter,
  GitMerge,
  GitBranch,
  Ban,
  Hash,
  Plus,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  Minus,
  Braces,
};

function getIconForBlock(block: QueryBlock): React.ComponentType<{ className?: string }> {
  if (block.icon && ICON_MAP[block.icon]) return ICON_MAP[block.icon];
  const typeMap: Record<string, React.ComponentType<{ className?: string }>> = {
    source: Database,
    column: Columns3,
    filter: Filter,
    logical: GitMerge,
    aggregation: Hash,
    grouping: LayoutGrid,
    ordering: ArrowUpNarrowWide,
    limit: Minus,
    subquery: Braces,
  };
  return typeMap[block.type] ?? Database;
}

interface BlockCardProps {
  block: QueryBlock;
  depth?: number;
  index?: number;
}

function ContainerDropZone({
  containerId,
  children,
}: {
  containerId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${containerId}`,
    data: { type: "container-drop", containerId },
  });
  const dragOverContainerId = useQueryStore((s) => s.dragOverContainerId);
  const isHighlighted = isOver || dragOverContainerId === containerId;

  return (
    <div
      ref={setNodeRef}
      className={`mt-1 mx-3 mb-3 rounded-lg border-2 border-dashed p-2 transition-all duration-200 min-h-[48px] ${
        isHighlighted
          ? "border-primary/40 bg-primary/[0.04]"
          : "border-border/30 bg-card/30"
      }`}
    >
      {children}
    </div>
  );
}

export default function BlockCard({ block, depth = 0, index = 0 }: BlockCardProps) {
  const activeBlockId = useQueryStore((s) => s.activeBlockId);
  const setActiveBlockId = useQueryStore((s) => s.setActiveBlockId);
  const updateBlockConfig = useQueryStore((s) => s.updateBlockConfig);
  const removeBlock = useQueryStore((s) => s.removeBlock);
  const validationErrors = useQueryStore((s) => s.validationErrors);
  const blockErrors = validationErrors.filter((e) => e.blockId === block.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colors = CATEGORY_COLORS[block.type];
  const Icon = getIconForBlock(block);
  const isActive = activeBlockId === block.id;
  const hasChildren = block.children !== undefined;
  const isContainer = block.type === "subquery" || block.type === "logical";

  const handleUpdateConfig = (key: string, value: unknown) => {
    updateBlockConfig(block.id, key, value);
  };

  const isColumnBlock = block.type === "column";
  const isSourceBlock = block.type === "source";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border transition-all duration-200 ${colors.bg} ${colors.border} ${
        isSourceBlock ? "w-full" : isColumnBlock ? "w-fit max-w-full rounded-lg" : ""
      } ${
        isDragging ? "opacity-40 shadow-2xl z-50 scale-[1.02]" : "shadow-sm hover:shadow-md"
      } ${isActive ? "ring-2 ring-primary/25 shadow-md" : ""} ${depth > 0 ? "ml-4" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        setActiveBlockId(block.id);
      }}
    >
      {/* Nesting connector */}
      {depth > 0 && (
        <>
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-border/50" />
          <div className="absolute -left-4 top-5 w-4 h-px bg-border/50" />
        </>
      )}

      {/* Header: компактный только для COLUMN */}
      <div
        className={`flex items-start gap-2.5 ${isColumnBlock ? "p-2 pb-1.5" : "p-3 pb-2"}`}
      >
        <div
          {...attributes}
          {...listeners}
          className={`mt-0.5 cursor-grab active:cursor-grabbing rounded-md hover:bg-foreground/5 transition-colors shrink-0 ${isColumnBlock ? "p-0.5" : "p-1"}`}
        >
          <GripVertical
            className={`text-muted-foreground/50 ${isColumnBlock ? "h-3 w-3" : "h-3.5 w-3.5"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`flex items-center gap-2 ${isColumnBlock ? "mb-1.5 gap-1.5" : "mb-2"}`}
          >
            <div
              className={`flex items-center justify-center shrink-0 ${colors.text} ${
                isColumnBlock ? "h-4 w-4" : "h-5 w-5"
              }`}
            >
              <Icon
                className={`opacity-90 ${colors.text} ${isColumnBlock ? "h-3 w-3" : "h-3.5 w-3.5"}`}
              />
            </div>
            <span
              className={`font-bold uppercase tracking-wider ${colors.text} ${
                isColumnBlock ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {block.label}
            </span>
          </div>

          {/* Config */}
          <div className={`flex flex-wrap items-center ${isColumnBlock ? "gap-1" : "gap-1.5"}`}>
            <ConfigInputs block={block} onUpdate={handleUpdateConfig} errors={blockErrors} />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className={`rounded-full opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 ${
            isColumnBlock ? "h-5 w-5" : "h-6 w-6"
          }`}
        >
          <X className={isColumnBlock ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span className="sr-only">Remove block</span>
        </Button>
      </div>

      {/* Container children drop zone */}
      {isContainer && (
        <ContainerDropZone containerId={block.id}>
          {hasChildren && block.children && block.children.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {block.children.map((child, i) => (
                <BlockCard key={child.id} block={child} depth={depth + 1} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-2 text-center">
              <div className="flex items-center gap-1.5 text-muted-foreground/50">
                <Plus className="h-3 w-3" />
                <span className="text-[10px]">Drop nested blocks here</span>
              </div>
            </div>
          )}
        </ContainerDropZone>
      )}
    </div>
  );
}

// ---- Config Inputs ----

function getError(errors: ValidationError[], field: string): ValidationError | undefined {
  return errors.find((e) => e.field === field);
}

function ConfigInputs({
  block,
  onUpdate,
  errors,
}: {
  block: QueryBlock;
  onUpdate: (key: string, value: unknown) => void;
  errors: ValidationError[];
}) {
  const isColumnBlock = block.type === "column";
  const baseInputClass =
    "bg-card/80 border-border/60 font-mono focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/50";
  const baseInputSize = isColumnBlock
    ? "h-6 text-[11px] rounded-md"
    : "h-7 text-xs rounded-lg";
  const inputClass = (field: string) => {
    const err = getError(errors, field);
    return `${baseInputClass} ${baseInputSize} ${err ? "border-destructive focus-visible:ring-destructive/50" : ""}`;
  };
  const isEmpty = (val: unknown) => String(val ?? "").trim() === "";
  const Required = () => <span className="text-destructive/80 font-normal" aria-hidden>*</span>;

  switch (block.type) {
    case "source": {
      const tableEmpty = isEmpty(block.config.table);
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Input
              value={String(block.config.table || "")}
              onChange={(e) => onUpdate("table", e.target.value)}
              placeholder={tableEmpty ? "table_name (обяз.)" : "table_name"}
              className={`${inputClass("table")} w-36`}
              aria-required
              aria-invalid={!!getError(errors, "table")}
              aria-describedby={getError(errors, "table") ? `err-${block.id}-table` : undefined}
            />
            {tableEmpty && <Required />}
          </div>
          {getError(errors, "table") && (
            <span id={`err-${block.id}-table`} className="text-[10px] text-destructive" role="alert">
              {getError(errors, "table")?.message}
            </span>
          )}
        </div>
      );
    }

    case "column": {
      const columnEmpty = isEmpty(block.config.column);
      return (
        <>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.column || "")}
                onChange={(e) => onUpdate("column", e.target.value)}
                placeholder={columnEmpty ? "column или * (обяз.)" : "column или *"}
                className={`${inputClass("column")} ${isColumnBlock ? "w-24 min-w-0" : "w-28"}`}
                aria-required
                aria-invalid={!!getError(errors, "column")}
                aria-describedby={getError(errors, "column") ? `err-${block.id}-column` : undefined}
              />
              {columnEmpty && <Required />}
            </div>
            {getError(errors, "column") && (
              <span id={`err-${block.id}-column`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "column")?.message}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">AS</span>
          <Input
            value={String(block.config.alias || "")}
            onChange={(e) => onUpdate("alias", e.target.value)}
            placeholder="alias"
            className={`${baseInputClass} ${baseInputSize} ${isColumnBlock ? "w-20 min-w-0" : "w-24"}`}
          />
        </>
      );
    }

    case "filter": {
      const filterColumnEmpty = isEmpty(block.config.column);
      const valueEmpty = isEmpty(block.config.value);
      const valueLowEmpty = isEmpty(block.config.valueLow);
      const valueHighEmpty = isEmpty(block.config.valueHigh);
      return (
        <>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.column || "")}
                onChange={(e) => onUpdate("column", e.target.value)}
                placeholder={filterColumnEmpty ? "column (обяз.)" : "column"}
                className={`${inputClass("column")} w-24`}
                aria-required
                aria-invalid={!!getError(errors, "column")}
                aria-describedby={getError(errors, "column") ? `err-${block.id}-column` : undefined}
              />
              {filterColumnEmpty && <Required />}
            </div>
            {getError(errors, "column") && (
              <span id={`err-${block.id}-column`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "column")?.message}
              </span>
            )}
          </div>
          <Select
            value={String(block.config.operator || "=")}
            onValueChange={(v) => onUpdate("operator", v)}
          >
            <SelectTrigger className="h-7 w-[5.5rem] text-xs font-mono bg-card/80 border-border/60 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "BETWEEN", "IS NULL", "IS NOT NULL"].map(
                (op) => (
                  <SelectItem key={op} value={op} className="text-xs font-mono">
                    {op}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {block.config.operator !== "IS NULL" &&
            block.config.operator !== "IS NOT NULL" && (
              <>
                {block.config.operator === "BETWEEN" ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <Input
                          value={String(block.config.valueLow || "")}
                          onChange={(e) => onUpdate("valueLow", e.target.value)}
                          placeholder={valueLowEmpty ? "от (обяз.)" : "от"}
                          className={`${inputClass("valueLow")} w-16`}
                          aria-required
                          aria-invalid={!!getError(errors, "valueLow")}
                        />
                        {valueLowEmpty && <Required />}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">AND</span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <Input
                          value={String(block.config.valueHigh || "")}
                          onChange={(e) => onUpdate("valueHigh", e.target.value)}
                          placeholder={valueHighEmpty ? "до (обяз.)" : "до"}
                          className={`${inputClass("valueHigh")} w-16`}
                          aria-required
                          aria-invalid={!!getError(errors, "valueHigh")}
                        />
                        {valueHighEmpty && <Required />}
                      </div>
                      {(getError(errors, "valueLow") || getError(errors, "valueHigh")) && (
                        <span className="text-[10px] text-destructive" role="alert">
                          {getError(errors, "valueLow")?.message ?? getError(errors, "valueHigh")?.message}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <Input
                        value={String(block.config.value || "")}
                        onChange={(e) => onUpdate("value", e.target.value)}
                        placeholder={valueEmpty ? "value (обяз.)" : "value"}
                        className={`${inputClass("value")} w-24`}
                        aria-required
                        aria-invalid={!!getError(errors, "value")}
                        aria-describedby={getError(errors, "value") ? `err-${block.id}-value` : undefined}
                      />
                      {valueEmpty && <Required />}
                    </div>
                    {getError(errors, "value") && (
                      <span id={`err-${block.id}-value`} className="text-[10px] text-destructive" role="alert">
                        {getError(errors, "value")?.message}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
        </>
      );
    }

    case "logical":
      return (
        <Select
          value={String(block.config.operator || "AND")}
          onValueChange={(v) => onUpdate("operator", v)}
        >
          <SelectTrigger className="h-7 w-20 text-xs font-mono bg-card/80 border-border/60 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["AND", "OR", "NOT"].map((op) => (
              <SelectItem key={op} value={op} className="text-xs font-mono">
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "aggregation": {
      const aggColumnRequired = block.config.function !== "COUNT";
      const aggColumnEmpty = isEmpty(block.config.column);
      const showAggRequired = aggColumnRequired && aggColumnEmpty;
      return (
        <>
          <Select
            value={String(block.config.function || "COUNT")}
            onValueChange={(v) => onUpdate("function", v)}
          >
            <SelectTrigger className="h-7 w-[5.5rem] text-xs font-mono bg-card/80 border-border/60 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["COUNT", "SUM", "AVG", "MIN", "MAX"].map((fn) => (
                <SelectItem key={fn} value={fn} className="text-xs font-mono">
                  {fn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground font-mono">{"("}</span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.column || "")}
                onChange={(e) => onUpdate("column", e.target.value)}
                placeholder={showAggRequired ? "column (обяз.)" : "column или *"}
                className={`${inputClass("column")} w-20`}
                aria-required={aggColumnRequired}
                aria-invalid={!!getError(errors, "column")}
                aria-describedby={getError(errors, "column") ? `err-${block.id}-column` : undefined}
              />
              {showAggRequired && <Required />}
            </div>
            {getError(errors, "column") && (
              <span id={`err-${block.id}-column`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "column")?.message}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{")"}</span>
          <span className="text-[10px] text-muted-foreground font-medium">AS</span>
          <Input
            value={String(block.config.alias || "")}
            onChange={(e) => onUpdate("alias", e.target.value)}
            placeholder="alias"
            className={`${baseInputClass} ${baseInputSize} w-20`}
          />
        </>
      );
    }

    case "grouping":
      if (block.label === "HAVING") {
        const conditionEmpty = isEmpty(block.config.condition);
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.condition || "")}
                onChange={(e) => onUpdate("condition", e.target.value)}
                placeholder={conditionEmpty ? "condition (обяз.)" : "condition"}
                className={`${inputClass("condition")} w-44`}
                aria-required
                aria-invalid={!!getError(errors, "condition")}
                aria-describedby={getError(errors, "condition") ? `err-${block.id}-condition` : undefined}
              />
              {conditionEmpty && <Required />}
            </div>
            {getError(errors, "condition") && (
              <span id={`err-${block.id}-condition`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "condition")?.message}
              </span>
            )}
          </div>
        );
      }
      {
        const groupByColumnEmpty = isEmpty(block.config.column);
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.column || "")}
                onChange={(e) => onUpdate("column", e.target.value)}
                placeholder={groupByColumnEmpty ? "column (обяз.)" : "column"}
                className={`${inputClass("column")} w-32`}
                aria-required
                aria-invalid={!!getError(errors, "column")}
                aria-describedby={getError(errors, "column") ? `err-${block.id}-column` : undefined}
              />
              {groupByColumnEmpty && <Required />}
            </div>
            {getError(errors, "column") && (
              <span id={`err-${block.id}-column`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "column")?.message}
              </span>
            )}
          </div>
        );
      }

    case "ordering": {
      const orderColumnEmpty = isEmpty(block.config.column);
      return (
        <>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                value={String(block.config.column || "")}
                onChange={(e) => onUpdate("column", e.target.value)}
                placeholder={orderColumnEmpty ? "column (обяз.)" : "column"}
                className={`${inputClass("column")} w-24`}
                aria-required
                aria-invalid={!!getError(errors, "column")}
                aria-describedby={getError(errors, "column") ? `err-${block.id}-column` : undefined}
              />
              {orderColumnEmpty && <Required />}
            </div>
            {getError(errors, "column") && (
              <span id={`err-${block.id}-column`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "column")?.message}
              </span>
            )}
          </div>
          <Select
            value={String(block.config.direction || "ASC")}
            onValueChange={(v) => onUpdate("direction", v)}
          >
            <SelectTrigger className="h-7 w-20 text-xs font-mono bg-card/80 border-border/60 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASC" className="text-xs font-mono">
                ASC
              </SelectItem>
              <SelectItem value="DESC" className="text-xs font-mono">
                DESC
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    }

    case "limit": {
      const limitVal = block.config.limit;
      const limitEmpty = limitVal === undefined || limitVal === null || String(limitVal).trim() === "";
      return (
        <>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                value={String(block.config.limit ?? "")}
                onChange={(e) => onUpdate("limit", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder={limitEmpty ? "число (обяз.)" : "число"}
                className={`${inputClass("limit")} w-20`}
                aria-required
                aria-invalid={!!getError(errors, "limit")}
                aria-describedby={getError(errors, "limit") ? `err-${block.id}-limit` : undefined}
              />
              {limitEmpty && <Required />}
            </div>
            {getError(errors, "limit") && (
              <span id={`err-${block.id}-limit`} className="text-[10px] text-destructive" role="alert">
                {getError(errors, "limit")?.message}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">OFFSET</span>
          <Input
            type="number"
            min={0}
            value={String(block.config.offset ?? "")}
            onChange={(e) => onUpdate("offset", e.target.value === "" ? undefined : Number(e.target.value))}
            placeholder="0"
            className={`${baseInputClass} ${baseInputSize} w-20`}
          />
        </>
      );
    }

    case "subquery": {
      const aliasEmpty = isEmpty(block.config.alias);
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Input
              value={String(block.config.alias || "")}
              onChange={(e) => onUpdate("alias", e.target.value)}
              placeholder={aliasEmpty ? "alias (обяз.)" : "alias"}
              className={`${inputClass("alias")} w-28`}
              aria-required
              aria-invalid={!!getError(errors, "alias")}
              aria-describedby={getError(errors, "alias") ? `err-${block.id}-alias` : undefined}
            />
            {aliasEmpty && <Required />}
          </div>
          {getError(errors, "alias") && (
            <span id={`err-${block.id}-alias`} className="text-[10px] text-destructive" role="alert">
              {getError(errors, "alias")?.message}
            </span>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

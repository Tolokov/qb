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
  Hash,
  LayoutGrid,
  ArrowUpNarrowWide,
  Minus,
  Braces,
  X,
  GripVertical,
  ChevronDown,
  Plus,
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

function getIconForType(type: string): React.ComponentType<{ className?: string }> {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
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
  return map[type] || Database;
}

interface BlockCardProps {
  block: QueryBlock;
  depth?: number;
  index?: number;
}

// Container drop zone component for subquery/logical blocks
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
  const Icon = getIconForType(block.type);
  const isActive = activeBlockId === block.id;
  const hasChildren = block.children !== undefined;
  const isContainer = block.type === "subquery" || block.type === "logical";

  const handleUpdateConfig = (key: string, value: unknown) => {
    updateBlockConfig(block.id, key, value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border transition-all duration-200 ${colors.bg} ${colors.border} ${
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

      {/* Header */}
      <div className="flex items-start gap-2.5 p-3 pb-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing rounded-md p-1 hover:bg-foreground/5 transition-colors shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md ${colors.text}`}
              style={{ backgroundColor: "currentColor", opacity: 0.1 }}
            >
              <Icon className={`h-3 w-3 ${colors.text}`} />
            </div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${colors.text}`}
            >
              {block.label}
            </span>
          </div>

          {/* Config */}
          <div className="flex flex-wrap items-center gap-1.5">
            <ConfigInputs block={block} onUpdate={handleUpdateConfig} />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        >
          <X className="h-3 w-3" />
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

function ConfigInputs({
  block,
  onUpdate,
}: {
  block: QueryBlock;
  onUpdate: (key: string, value: unknown) => void;
}) {
  const inputClass =
    "h-7 text-xs bg-card/80 border-border/60 font-mono rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/50";

  switch (block.type) {
    case "source":
      return (
        <Input
          value={String(block.config.table || "")}
          onChange={(e) => onUpdate("table", e.target.value)}
          placeholder="table_name"
          className={`${inputClass} w-36`}
        />
      );

    case "column":
      return (
        <>
          <Input
            value={String(block.config.column || "")}
            onChange={(e) => onUpdate("column", e.target.value)}
            placeholder="column"
            className={`${inputClass} w-28`}
          />
          <span className="text-[10px] text-muted-foreground font-medium">
            AS
          </span>
          <Input
            value={String(block.config.alias || "")}
            onChange={(e) => onUpdate("alias", e.target.value)}
            placeholder="alias"
            className={`${inputClass} w-24`}
          />
        </>
      );

    case "filter":
      return (
        <>
          <Input
            value={String(block.config.column || "")}
            onChange={(e) => onUpdate("column", e.target.value)}
            placeholder="column"
            className={`${inputClass} w-24`}
          />
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
                    <Input
                      value={String(block.config.valueLow || "")}
                      onChange={(e) => onUpdate("valueLow", e.target.value)}
                      placeholder="low"
                      className={`${inputClass} w-16`}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      AND
                    </span>
                    <Input
                      value={String(block.config.valueHigh || "")}
                      onChange={(e) => onUpdate("valueHigh", e.target.value)}
                      placeholder="high"
                      className={`${inputClass} w-16`}
                    />
                  </>
                ) : (
                  <Input
                    value={String(block.config.value || "")}
                    onChange={(e) => onUpdate("value", e.target.value)}
                    placeholder="value"
                    className={`${inputClass} w-24`}
                  />
                )}
              </>
            )}
        </>
      );

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

    case "aggregation":
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
          <span className="text-[10px] text-muted-foreground font-mono">
            {"("}
          </span>
          <Input
            value={String(block.config.column || "")}
            onChange={(e) => onUpdate("column", e.target.value)}
            placeholder="column"
            className={`${inputClass} w-20`}
          />
          <span className="text-[10px] text-muted-foreground font-mono">
            {")"}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            AS
          </span>
          <Input
            value={String(block.config.alias || "")}
            onChange={(e) => onUpdate("alias", e.target.value)}
            placeholder="alias"
            className={`${inputClass} w-20`}
          />
        </>
      );

    case "grouping":
      if (block.label === "HAVING") {
        return (
          <Input
            value={String(block.config.condition || "")}
            onChange={(e) => onUpdate("condition", e.target.value)}
            placeholder="condition expression"
            className={`${inputClass} w-44`}
          />
        );
      }
      return (
        <Input
          value={String(block.config.column || "")}
          onChange={(e) => onUpdate("column", e.target.value)}
          placeholder="column"
          className={`${inputClass} w-32`}
        />
      );

    case "ordering":
      return (
        <>
          <Input
            value={String(block.config.column || "")}
            onChange={(e) => onUpdate("column", e.target.value)}
            placeholder="column"
            className={`${inputClass} w-24`}
          />
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

    case "limit":
      return (
        <>
          <Input
            type="number"
            value={String(block.config.limit || "")}
            onChange={(e) => onUpdate("limit", Number(e.target.value))}
            placeholder="limit"
            className={`${inputClass} w-20`}
          />
          <span className="text-[10px] text-muted-foreground font-medium">
            OFFSET
          </span>
          <Input
            type="number"
            value={String(block.config.offset || "")}
            onChange={(e) => onUpdate("offset", Number(e.target.value))}
            placeholder="0"
            className={`${inputClass} w-20`}
          />
        </>
      );

    case "subquery":
      return (
        <Input
          value={String(block.config.alias || "")}
          onChange={(e) => onUpdate("alias", e.target.value)}
          placeholder="alias"
          className={`${inputClass} w-28`}
        />
      );

    default:
      return null;
  }
}

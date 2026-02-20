"use client";

import React from "react"

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
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
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ArrowRightFromLine,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  LIBRARY_ITEMS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type LibraryItem,
  type BlockCategory,
} from "@/lib/types";
import { useQueryStore } from "@/lib/query-store";

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

function DraggableItem({ item }: { item: LibraryItem }) {
  const addBlock = useQueryStore((s) => s.addBlock);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `library-${item.id}`,
      data: { type: "library-item", item },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const Icon = ICON_MAP[item.icon] || Database;
  const colors = CATEGORY_COLORS[item.type];

  const addToCanvas = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addBlock(item);
  };

  const onRowDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest?.("button")) return;
    addToCanvas(e);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onDoubleClick={onRowDoubleClick}
      className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${colors.bg} ${colors.border} ${colors.text} ${isDragging ? "opacity-40 shadow-xl scale-[1.03]" : "hover:shadow-sm hover:translate-x-0.5"}`}
    >
      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-30 transition-opacity shrink-0" />
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="font-medium truncate flex-1 min-w-0">{item.label}</span>
      <button
        type="button"
        onClick={addToCanvas}
        onPointerDown={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-70 hover:opacity-100 w-[10%] min-w-8 h-6 rounded hover:bg-foreground/10 transition-opacity shrink-0 touch-manipulation flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none"
        aria-label={`Добавить ${item.label} на канвас`}
      >
        <ArrowRightFromLine className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as BlockCategory[];

/** Секции, свернутые по умолчанию при открытии */
const DEFAULT_COLLAPSED: BlockCategory[] = [
  "filter",
  "logical",
  "aggregation",
  "grouping",
  "subquery",
];

export default function SidebarLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_CATEGORIES.map((c) => [c, DEFAULT_COLLAPSED.includes(c)]))
  );

  const filteredItems = LIBRARY_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = ALL_CATEGORIES.reduce(
    (acc, cat) => {
      const items = filteredItems.filter((item) => item.type === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<BlockCategory, LibraryItem[]>
  );

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
          <Braces className="h-3 w-3 text-primary" />
        </div>
        <h2 className="text-[13px] font-semibold text-card-foreground">Components</h2>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="pl-8 h-8 text-xs bg-secondary/50 border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-1">
          {Object.entries(groupedItems).map(([cat, items]) => {
            const hasSearch = searchQuery.trim().length > 0;
            const isCollapsed = hasSearch ? false : collapsed[cat];
            return (
              <div key={cat} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1.5 w-full px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {CATEGORY_LABELS[cat as BlockCategory]}
                  <span className="ml-auto text-[10px] font-normal opacity-60">
                    {items.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-1 mt-0.5 ml-1">
                    {items.map((item) => (
                      <DraggableItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

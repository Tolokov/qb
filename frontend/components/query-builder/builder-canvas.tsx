"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Layers, MousePointerClick, Sparkles, Trash2, LayoutTemplate, Clock, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import BlockCard from "./block-card";
import { useQueryStore, blocksToJson, blocksToSql } from "@/lib/query-store";
import { groupBlocksIntoRows } from "@/lib/canvas-groups";
import { QUERY_TEMPLATES } from "@/lib/query-templates";
import type { QueryHistoryEntry } from "@/lib/types";

const btnClass =
  "h-8 min-w-[4.5rem] gap-1.5 text-[11px] rounded-md border border-border bg-card/50 text-muted-foreground hover:text-card-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none";

export default function BuilderCanvas() {
  const blocks = useQueryStore((s) => s.blocks);
  const setActiveBlockId = useQueryStore((s) => s.setActiveBlockId);
  const clearBlocks = useQueryStore((s) => s.clearBlocks);
  const setBlocksFromTemplate = useQueryStore((s) => s.setBlocksFromTemplate);
  const history = useQueryStore((s) => s.history);
  const addHistoryEntry = useQueryStore((s) => s.addHistoryEntry);
  const removeHistoryEntry = useQueryStore((s) => s.removeHistoryEntry);
  const loadFromHistory = useQueryStore((s) => s.loadFromHistory);
  const setShowHistory = useQueryStore((s) => s.setShowHistory);
  const { setNodeRef } = useDroppable({ id: "canvas" });

  const saveCurrentAsDraftThenLoad = (entry: QueryHistoryEntry) => {
    if (blocks.length > 0) {
      const draft: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        name: `Черновик ${new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}`,
        blocks: JSON.parse(JSON.stringify(blocks)),
        json: JSON.stringify(blocksToJson(blocks), null, 2),
        sql: blocksToSql(blocks),
        executionTime: null,
      };
      addHistoryEntry(draft);
    }
    loadFromHistory(entry);
  };

  return (
    <div
      ref={setNodeRef}
      className="flex h-full flex-col bg-canvas"
      onClick={() => setActiveBlockId(null)}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-5 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-[13px] font-semibold text-card-foreground">
            Query Builder
          </h2>
          {blocks.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium tabular-nums">
              {blocks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Шаблоны */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={btnClass}
                aria-label="Выбрать шаблон запроса"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Шаблоны
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-64 rounded-xl shadow-xl">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Query template
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {QUERY_TEMPLATES.map((tpl) => (
                  <DropdownMenuItem
                    key={tpl.id}
                    onClick={() => {
                      setBlocksFromTemplate(tpl.getBlocks());
                      setActiveBlockId(null);
                    }}
                    className="flex flex-col items-start gap-0.5 rounded-lg py-2.5 cursor-pointer"
                  >
                    <span className="text-[12px] font-medium">{tpl.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {tpl.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

          {/* История */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={btnClass}
                aria-label="История запросов"
              >
                <Clock className="h-3.5 w-3.5" />
                История
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-72 rounded-xl shadow-xl max-h-[70vh] overflow-hidden flex flex-col">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Query History
                  {history.length > 0 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {history.length}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-muted-foreground">
                    Запустите запрос на бекенд — конфигурация появится здесь
                  </div>
                ) : (
                  <>
                  <ScrollArea className="flex-1 max-h-[50vh]">
                    <div className="pr-2">
                      {history.map((entry) => (
                        <div
                          key={entry.id}
                          className="group flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-secondary/60 cursor-pointer"
                          onClick={() => saveCurrentAsDraftThenLoad(entry)}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-card-foreground truncate block">
                              {entry.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString("ru", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {entry.executionTime != null && ` · ${entry.executionTime}ms`}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                            aria-label="Удалить из истории"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistoryEntry(entry.id);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-lg py-2 cursor-pointer text-muted-foreground"
                    onClick={() => setShowHistory(true)}
                  >
                    Открыть полную историю
                  </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          {/* Очистить */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (blocks.length > 0) clearBlocks();
            }}
            disabled={blocks.length === 0}
            className={`${btnClass} hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30`}
            aria-label="Очистить рабочее поле"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Очистить
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-h-full p-5 canvas-grid">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="relative mb-5">
                <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
                  <MousePointerClick className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary/10 p-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1.5">
                Drop components here
              </h3>
              <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                Drag items from the sidebar to start building your SQL query visually
              </p>
            </div>
          ) : (() => {
              const rows = groupBlocksIntoRows(blocks);
              const visualOrder = rows.flatMap((r) => r);
              const visualIds = visualOrder.map((b) => b.id);
              return (
                <SortableContext
                  items={visualIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {rows.map((row) =>
                      row.length > 0 ? (
                        <div
                          key={row.map((b) => b.id).join("-")}
                          className="flex flex-wrap gap-2.5 items-start content-start"
                        >
                          {row.map((block) => (
                            <BlockCard
                              key={block.id}
                              block={block}
                              index={visualOrder.findIndex((b) => b.id === block.id)}
                            />
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                </SortableContext>
              );
            })()}

          {/* Drop hint */}
          {blocks.length > 0 && (
            <div className="mt-3 rounded-xl border-2 border-dashed border-border/40 py-3 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                Drop here to add
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

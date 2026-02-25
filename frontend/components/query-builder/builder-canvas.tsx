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
import { TRANSLATIONS } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { generateId } from "@/lib/utils";
import type { QueryHistoryEntry } from "@/lib/types";

const btnClass =
  "h-7 min-w-0 gap-1 text-[10px] rounded-md border border-border bg-card/50 text-muted-foreground hover:text-card-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none sm:h-8 sm:min-w-[4rem] sm:gap-1.5 sm:text-[11px] shrink-0";

export default function BuilderCanvas() {
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale];
  const blocks = useQueryStore((s) => s.blocks);
  const setActiveBlockId = useQueryStore((s) => s.setActiveBlockId);
  const clearBlocks = useQueryStore((s) => s.clearBlocks);
  const setBlocksFromTemplate = useQueryStore((s) => s.setBlocksFromTemplate);
  const history = useQueryStore((s) => s.history);
  const addHistoryEntry = useQueryStore((s) => s.addHistoryEntry);
  const removeHistoryEntry = useQueryStore((s) => s.removeHistoryEntry);
  const loadFromHistory = useQueryStore((s) => s.loadFromHistory);
  const setShowHistory = useQueryStore((s) => s.setShowHistory);
  const hasHistoryEntryWithSameJson = useQueryStore((s) => s.hasHistoryEntryWithSameJson);
  const { setNodeRef } = useDroppable({ id: "canvas" });

  const saveCurrentAsDraftThenLoad = (entry: QueryHistoryEntry) => {
    if (blocks.length > 0) {
      const now = new Date();
      const timeHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const draft: QueryHistoryEntry = {
        id: generateId(),
        timestamp: now.getTime(),
        name: t.draftTitle(timeHHmm),
        blocks: JSON.parse(JSON.stringify(blocks)),
        json: JSON.stringify(blocksToJson(blocks), null, 2),
        sql: blocksToSql(blocks),
        executionTime: null,
      };
      const canonicalJson = JSON.stringify(JSON.parse(draft.json));
      if (!hasHistoryEntryWithSameJson(canonicalJson)) {
        addHistoryEntry(draft);
      }
    }
    loadFromHistory(entry);
  };

  const dateLocale = locale === "ru" ? "ru" : "en-US";
  const formatEntryTimestamp = (ts: number) =>
    new Date(ts).toLocaleString(dateLocale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      ref={setNodeRef}
      className="flex h-full flex-col bg-canvas"
      onClick={() => setActiveBlockId(null)}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2 min-w-0 shrink-0 sm:px-4 sm:py-2.5 md:px-5 md:py-3">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 shrink-0 sm:h-6 sm:w-6">
            <Layers className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
          </div>
          <h2 className="text-[11px] font-semibold text-card-foreground truncate sm:text-[12px] md:text-[13px]">
            Query Builder
          </h2>
          {blocks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium tabular-nums shrink-0 sm:text-[11px] sm:px-2">
              {blocks.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0">
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
                <LayoutTemplate className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span className={cn("truncate", locale === "braille" && "font-braille")}>{t.templates}</span>
                <ChevronDown className="h-3 w-3 opacity-70 shrink-0 sm:h-3.5 sm:w-3.5" />
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
                <Clock className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span className={cn("truncate", locale === "braille" && "font-braille")}>{t.history}</span>
                <ChevronDown className="h-3 w-3 opacity-70 shrink-0 sm:h-3.5 sm:w-3.5" />
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
                          <div className={cn("flex-1 min-w-0", locale === "braille" && "font-braille")}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[12px] font-medium text-card-foreground truncate">
                                {entry.name}
                              </span>
                              {(() => {
                                const table = entry.blocks.find((b) => b.type === "source")?.config.table as string | undefined;
                                return table ? (
                                  <span className="shrink-0 text-[10px] text-muted-foreground bg-muted/60 rounded px-1 py-0.5 leading-none">
                                    {table}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {formatEntryTimestamp(entry.timestamp)}
                              {entry.executionTime != null && ` · ${entry.executionTime}ms`}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                            aria-label={t.removeFromHistory}
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
            <Trash2 className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className={cn("truncate", locale === "braille" && "font-braille")}>{t.clear}</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 canvas-grid flex flex-col min-h-0">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center flex-1 min-h-[280px]">
              <div className="relative mb-5">
                <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
                  <MousePointerClick className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary/10 p-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
              </div>
              <h3 className={cn("text-sm font-semibold text-card-foreground mb-1.5", locale === "braille" && "font-braille")}>
                {t.dropComponentsHere}
              </h3>
              <p className={cn("text-xs text-muted-foreground max-w-[220px] leading-relaxed min-w-0", locale === "braille" && "font-braille break-all")}>
                {t.dragItemsFromSidebar}
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const rows = groupBlocksIntoRows(blocks);
                const visualOrder = rows.flatMap((r) => r);
                const visualIds = visualOrder.map((b) => b.id);
                return (
                  <SortableContext
                    items={visualIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3 shrink-0">
                      {rows.map((row) =>
                        row.length > 0 ? (
                          <div
                            key={row.map((b) => b.id).join("-")}
                            className="flex flex-wrap gap-2.5 items-start content-start"
                          >
                            {row.map((block) => (
                              <BlockCard key={block.id} block={block} />
                            ))}
                          </div>
                        ) : null
                      )}
                    </div>
                  </SortableContext>
                );
              })()}
              <div
                className="mt-3 flex-1 min-h-[100px] rounded-xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-1.5 py-6"
                aria-label="Drop zone for new blocks"
              >
                <p className={cn("text-xs font-medium text-muted-foreground", locale === "braille" && "font-braille")}>
                  {t.dropHereToAddBlock}
                </p>
                <p className={cn("text-[11px] text-muted-foreground/70", locale === "braille" && "font-braille")}>
                  {t.dragComponentFromLeftPanel}
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

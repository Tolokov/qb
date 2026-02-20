"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Layers, MousePointerClick, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import BlockCard from "./block-card";
import { useQueryStore } from "@/lib/query-store";
import { groupBlocksIntoRows } from "@/lib/canvas-groups";

export default function BuilderCanvas() {
  const blocks = useQueryStore((s) => s.blocks);
  const setActiveBlockId = useQueryStore((s) => s.setActiveBlockId);
  const clearBlocks = useQueryStore((s) => s.clearBlocks);
  const { setNodeRef } = useDroppable({ id: "canvas" });

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
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (blocks.length > 0) clearBlocks();
                }}
                disabled={blocks.length === 0}
                className="h-8 min-w-[4.5rem] gap-1.5 text-[11px] rounded-md border border-border bg-card/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Очистить рабочее поле"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Очистить
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Удалить все блоки с рабочего поля
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

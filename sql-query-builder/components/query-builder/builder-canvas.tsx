"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Layers, MousePointerClick, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import BlockCard from "./block-card";
import { useQueryStore } from "@/lib/query-store";

export default function BuilderCanvas() {
  const blocks = useQueryStore((s) => s.blocks);
  const setActiveBlockId = useQueryStore((s) => s.setActiveBlockId);
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      className="flex h-full flex-col bg-canvas"
      onClick={() => setActiveBlockId(null)}
    >
      {/* Canvas header */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-5 py-3">
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
      </div>

      {/* Drop zone */}
      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={`min-h-full p-5 transition-all duration-300 canvas-grid ${
            isOver ? "bg-primary/[0.03]" : ""
          }`}
        >
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
          ) : (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {blocks.map((block, index) => (
                  <BlockCard key={block.id} block={block} index={index} />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Drop hint */}
          {blocks.length > 0 && (
            <div
              className={`mt-3 rounded-xl border-2 border-dashed py-3 text-center transition-all duration-300 ${
                isOver
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "border-border/40"
              }`}
            >
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

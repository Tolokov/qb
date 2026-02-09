"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import TopNav from "@/components/query-builder/top-nav";
import SidebarLibrary from "@/components/query-builder/sidebar-library";
import BuilderCanvas from "@/components/query-builder/builder-canvas";
import PreviewPanel from "@/components/query-builder/preview-panel";
import HistoryPanel from "@/components/query-builder/history-panel";
import { useQueryStore } from "@/lib/query-store";
import type { LibraryItem } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

export default function QueryBuilderPage() {
  const [mounted, setMounted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<LibraryItem | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const addBlock = useQueryStore((s) => s.addBlock);
  const reorderBlocks = useQueryStore((s) => s.reorderBlocks);
  const moveBlockToContainer = useQueryStore((s) => s.moveBlockToContainer);
  const moveBlockToRoot = useQueryStore((s) => s.moveBlockToRoot);
  const setDragOverContainerId = useQueryStore((s) => s.setDragOverContainerId);
  const blocks = useQueryStore((s) => s.blocks);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "library-item") {
      setDraggedItem(active.data.current.item as LibraryItem);
      setDraggedBlockId(null);
    } else {
      setDraggedItem(null);
      setDraggedBlockId(active.id as string);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setDragOverContainerId(null);
        return;
      }
      // If hovering over a container drop zone (subquery/logical)
      if (over.data.current?.type === "container-drop") {
        setDragOverContainerId(over.data.current.containerId as string);
      } else {
        setDragOverContainerId(null);
      }
    },
    [setDragOverContainerId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedItem(null);
      setDraggedBlockId(null);
      setDragOverContainerId(null);

      if (!over) return;

      // Library item drop
      if (active.data.current?.type === "library-item") {
        const item = active.data.current.item as LibraryItem;

        // Dropped onto a container
        if (over.data.current?.type === "container-drop") {
          addBlock(item, over.data.current.containerId as string);
        } else {
          // Dropped onto the canvas root
          addBlock(item);
        }
        return;
      }

      // Existing block reorder / nest
      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      // Dropping into a container
      if (over.data.current?.type === "container-drop") {
        const containerId = over.data.current.containerId as string;
        if (containerId !== activeId) {
          moveBlockToContainer(activeId, containerId);
        }
        return;
      }

      // Dropping onto canvas root
      if (overId === "canvas") {
        moveBlockToRoot(activeId);
        return;
      }

      // Reorder at root
      reorderBlocks(activeId, overId);
    },
    [addBlock, reorderBlocks, moveBlockToContainer, moveBlockToRoot, setDragOverContainerId]
  );

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">
            Loading QueryCraft...
          </span>
        </div>
      </div>
    );
  }

  const draggedBlock = draggedBlockId
    ? blocks.find((b) => b.id === draggedBlockId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col bg-background">
        <TopNav />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={28}>
            <SidebarLibrary />
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border hover:bg-primary/20 transition-colors" />

          <ResizablePanel defaultSize={48} minSize={30}>
            <BuilderCanvas />
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border hover:bg-primary/20 transition-colors" />

          <ResizablePanel defaultSize={32} minSize={22} maxSize={45}>
            <PreviewPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {draggedItem && (
          <div
            className={`rounded-xl border px-4 py-2.5 shadow-2xl text-sm font-medium ${CATEGORY_COLORS[draggedItem.type].bg} ${CATEGORY_COLORS[draggedItem.type].border} ${CATEGORY_COLORS[draggedItem.type].text}`}
          >
            {draggedItem.label}
          </div>
        )}
        {draggedBlock && (
          <div className="rounded-xl border bg-card px-4 py-2.5 shadow-2xl text-sm font-medium text-card-foreground opacity-90">
            {draggedBlock.label}
          </div>
        )}
      </DragOverlay>

      <HistoryPanel />
    </DndContext>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
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

const COMPONENTS_PANEL_MIN = 240;
const COMPONENTS_PANEL_MAX = 480;

export default function QueryBuilderPage() {
  const [mounted, setMounted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<LibraryItem | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [componentsPanelWidth, setComponentsPanelWidth] = useState(COMPONENTS_PANEL_MIN);
  const [isResizingComponents, setIsResizingComponents] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startW: number } | null>(null);

  const addBlock = useQueryStore((s) => s.addBlock);
  const reorderRootBlocks = useQueryStore((s) => s.reorderRootBlocks);
  const moveBlockToContainer = useQueryStore((s) => s.moveBlockToContainer);
  const moveBlockToRoot = useQueryStore((s) => s.moveBlockToRoot);
  const setDragOverContainerId = useQueryStore((s) => s.setDragOverContainerId);
  const blocks = useQueryStore((s) => s.blocks);

  useEffect(() => {
    // Hydration guard: defer setState to avoid react-hooks/set-state-in-effect
    queueMicrotask(() => setMounted(true));
  }, []);

  const startComponentsResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = { startX: e.clientX, startW: componentsPanelWidth };
    setIsResizingComponents(true);
  }, [componentsPanelWidth]);

  useEffect(() => {
    if (!isResizingComponents) return;
    const onMove = (e: MouseEvent) => {
      const r = resizeStartRef.current;
      if (!r) return;
      const next = r.startW + (e.clientX - r.startX);
      setComponentsPanelWidth(Math.min(COMPONENTS_PANEL_MAX, Math.max(COMPONENTS_PANEL_MIN, next)));
    };
    const onUp = () => {
      resizeStartRef.current = null;
      setIsResizingComponents(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizingComponents]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /** Коллизия по позиции указателя: container (зона вложенности) > блок > canvas — для точного срабатывания зон. */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const hits = pointerWithin(args);
    return [...hits].sort((a, b) => {
      const aId = String(a.id);
      const bId = String(b.id);
      const aIsContainer = aId.startsWith("container-");
      const bIsContainer = bId.startsWith("container-");
      if (aIsContainer && !bIsContainer) return -1;
      if (!aIsContainer && bIsContainer) return 1;
      if (aId === "canvas" && bId !== "canvas") return 1;
      if (bId === "canvas" && aId !== "canvas") return -1;
      return 0;
    });
  }, []);

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

      // Reorder at root (по визуальному порядку строк)
      reorderRootBlocks(activeId, overId);
    },
    [addBlock, reorderRootBlocks, moveBlockToContainer, moveBlockToRoot, setDragOverContainerId]
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
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col bg-background">
        <TopNav />

        <div className="flex flex-1 min-h-0 min-w-0">
          <aside
            className="shrink-0 flex flex-col min-h-0 bg-background"
            style={{ width: componentsPanelWidth, minWidth: COMPONENTS_PANEL_MIN }}
          >
            <SidebarLibrary />
          </aside>
          <div
            role="separator"
            aria-label="Изменить ширину панели компонентов"
            onMouseDown={startComponentsResize}
            className={`relative shrink-0 w-px bg-border hover:bg-primary/20 transition-colors cursor-col-resize flex items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 ${draggedItem || draggedBlockId ? "pointer-events-none" : ""}`}
          />

          <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0 bg-background">
            <ResizablePanel defaultSize={72} minSize={60}>
              <BuilderCanvas />
            </ResizablePanel>

            <ResizableHandle
              disabled={!!(draggedItem || draggedBlockId)}
              className="w-px bg-border hover:bg-primary/20 transition-colors"
            />

            <ResizablePanel defaultSize={28} minSize={15} maxSize={40}>
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
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

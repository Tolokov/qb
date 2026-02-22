"use client";

import { useState } from "react";
import {
  Clock,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileCode,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryStore } from "@/lib/query-store";
import { TRANSLATIONS } from "@/lib/translations";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import type { QueryHistoryEntry } from "@/lib/types";

export default function HistoryPanel() {
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale];
  const showHistory = useQueryStore((s) => s.showHistory);
  const setShowHistory = useQueryStore((s) => s.setShowHistory);
  const history = useQueryStore((s) => s.history);
  const removeHistoryEntry = useQueryStore((s) => s.removeHistoryEntry);
  const renameHistoryEntry = useQueryStore((s) => s.renameHistoryEntry);
  const loadFromHistory = useQueryStore((s) => s.loadFromHistory);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const dateLocale = locale === "ru" ? "ru" : "en-US";
  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const startRename = (entry: QueryHistoryEntry) => {
    setEditingId(entry.id);
    setEditName(entry.name);
  };

  const saveRename = () => {
    if (!editingId) return;
    renameHistoryEntry(editingId, editName);
    setEditingId(null);
  };

  return (
    <Dialog open={showHistory} onOpenChange={setShowHistory}>
      <DialogContent className={cn("max-w-2xl max-h-[80vh] p-0 gap-0 rounded-2xl border-border bg-card overflow-hidden shadow-2xl", locale === "braille" && "font-braille")}>
        <DialogHeader className="px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-2.5 text-[13px] font-semibold">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <Clock className="h-3 w-3 text-primary" />
            </div>
            {t.queryHistory}
            {history.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {history.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-60px)]">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-2xl bg-secondary/40 p-5 border border-border/50">
                <FileCode className="h-8 w-8 text-muted-foreground/25" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/70">
                {t.historyEmptyTitle}
              </p>
              <p className="text-[11px] text-muted-foreground/40 mt-1">
                {t.historyEmptyHint}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {history.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const isEditing = editingId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="group hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 px-5 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && saveRename()
                              }
                              className="h-7 text-xs w-40 bg-card border-border rounded-lg"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                              onClick={saveRename}
                            >
                              <Check className="h-3 w-3 text-primary" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-card-foreground truncate">
                              {entry.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => startRename(entry)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-card-foreground transition-opacity"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 mt-0.5">
                          <span>{formatTime(entry.timestamp)}</span>
                          {entry.executionTime && (
                            <span className="flex items-center gap-0.5 tabular-nums">
                              <Clock className="h-3 w-3" />
                              {entry.executionTime}ms
                            </span>
                          )}
                          <span className="tabular-nums">
                            {t.historyBlocksCount(entry.blocks.length)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => loadFromHistory(entry)}
                          title="Load into builder"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeHistoryEntry(entry.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 flex gap-3">
                        <div className="flex-1 rounded-xl bg-surface border border-border/60 p-3 overflow-hidden">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                            JSON
                          </p>
                          <pre className="text-[11px] font-mono text-card-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
                            {entry.json}
                          </pre>
                        </div>
                        <div className="flex-1 rounded-xl bg-surface border border-border/60 p-3 overflow-hidden">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                            SQL
                          </p>
                          <pre className="text-[11px] font-mono text-card-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
                            {entry.sql}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

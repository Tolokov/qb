"use client";
import { useState, useEffect } from "react";
import { Copy, Check, Terminal, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryStore } from "@/lib/query-store";
import { TRANSLATIONS } from "@/lib/translations";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

export default function BackendResponsePanel() {
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale];
  const backendResponse = useQueryStore((s) => s.backendResponse);
  const backendError = useQueryStore((s) => s.backendError);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const content = backendResponse ?? backendError ?? null;
  const isError = !!backendError && !backendResponse;

  useEffect(() => {
    if (content !== null) setCollapsed(false);
  }, [content]);

  const copyContent = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col bg-card border-t border-border shrink-0", !collapsed && "flex-1 min-h-0")}>
      <div
        className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2 shrink-0 cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("flex h-5 w-5 items-center justify-center rounded-md shrink-0", isError ? "bg-destructive/10" : "bg-primary/10")}>
            {isError
              ? <AlertCircle className="h-3 w-3 text-destructive" />
              : <Terminal className="h-3 w-3 text-primary" />}
          </div>
          <h2 className={cn("text-[13px] font-semibold truncate", isError ? "text-destructive" : "text-card-foreground")}>
            {t.backendResponseLabel}
          </h2>
          {content && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
              isError ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            )}>
              {isError ? t.backendErrorLabel : "OK"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {content && !collapsed && (
            <Button
              variant="outline"
              size="sm"
              className={cn("h-7 gap-1.5 text-[11px] rounded-lg", isError && "border-destructive/50 text-destructive hover:bg-destructive/10")}
              onClick={(e) => { e.stopPropagation(); void copyContent(); }}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t.copiedButton : t.copyButton}
            </Button>
          )}
          {collapsed
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {!collapsed && (
        <ScrollArea className="flex-1 min-h-0">
          <pre className={cn(
            "p-4 text-[12px] font-mono leading-5 whitespace-pre-wrap break-words min-h-[60px]",
            isError ? "text-destructive" : "text-card-foreground",
            locale === "braille" && "font-braille"
          )}>
            {content ?? <span className="text-muted-foreground/50 italic text-[11px]">Нет ответа от бекенда</span>}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}

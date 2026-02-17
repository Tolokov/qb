"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Copy,
  Check,
  Code2,
  FileJson,
  Play,
  Loader2,
  Clock,
  Terminal,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryStore, blocksToJson, blocksToSql } from "@/lib/query-store";
import {
  frontendJsonToBackendPayload,
  compileQueryOnBackend,
  formatBackendResponse,
} from "@/lib/api";
import type { QueryHistoryEntry } from "@/lib/types";

export default function PreviewPanel() {
  const blocks = useQueryStore((s) => s.blocks);
  const addHistoryEntry = useQueryStore((s) => s.addHistoryEntry);
  const historyLength = useQueryStore((s) => s.history.length);

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedBackendSql, setCopiedBackendSql] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: "success" | "error";
    time: number;
  } | null>(null);
  const [backendResponse, setBackendResponse] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const jsonOutput = useMemo(() => {
    if (blocks.length === 0) return "";
    return JSON.stringify(blocksToJson(blocks), null, 2);
  }, [blocks]);

  const sqlOutput = useMemo(() => {
    if (blocks.length === 0) return "";
    return blocksToSql(blocks);
  }, [blocks]);

  const copyToClipboard = useCallback(
    async (text: string, type: "json" | "sql") => {
      try {
        await navigator.clipboard.writeText(text);
        if (type === "json") {
          setCopiedJson(true);
          setTimeout(() => setCopiedJson(false), 2000);
        } else {
          setCopiedSql(true);
          setTimeout(() => setCopiedSql(false), 2000);
        }
      } catch (e) {
        setCopyError(e instanceof Error ? e.message : "Не удалось скопировать");
        setTimeout(() => setCopyError(null), 4000);
      }
    },
    []
  );

  const runQuery = useCallback(async () => {
    if (blocks.length === 0) return;
    setIsRunning(true);
    setLastResult(null);
    setBackendResponse(null);
    setBackendError(null);
    setCopyError(null);
    const start = Date.now();

    try {
      const json = blocksToJson(blocks) as Record<string, unknown>;
      const payload = frontendJsonToBackendPayload(json);
      const result = await compileQueryOnBackend(payload);
      const time = Date.now() - start;
      setBackendResponse(formatBackendResponse(result));
      setLastResult({ status: "success", time });

      const entry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        name: `Query ${historyLength + 1}`,
        blocks: JSON.parse(JSON.stringify(blocks)),
        json: jsonOutput,
        sql: sqlOutput,
        executionTime: time,
      };
      addHistoryEntry(entry);
    } catch (err) {
      const time = Date.now() - start;
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      setBackendError(message || "Неизвестная ошибка");
      setLastResult({ status: "error", time });
    } finally {
      setIsRunning(false);
    }
  }, [blocks, historyLength, addHistoryEntry, jsonOutput, sqlOutput]);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Terminal className="h-3 w-3 text-primary" />
          </div>
          <h2 className="text-[13px] font-semibold text-card-foreground">
            Output
          </h2>
        </div>
        <Button
          size="sm"
          onClick={runQuery}
          disabled={isRunning || blocks.length === 0}
          className="h-7 gap-1.5 text-[11px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
        >
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isRunning ? "Running..." : "Run Query"}
        </Button>
      </div>

      {lastResult && lastResult.status === "success" && (
        <div className="flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-success/10 text-success">
          <div className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="font-medium">Ответ бекенда получен</span>
          <span className="ml-auto flex items-center gap-1 opacity-60">
            <Clock className="h-3 w-3" />
            {lastResult.time}ms
          </span>
        </div>
      )}
      {lastResult && lastResult.status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-destructive/10 text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Ошибка запроса к бекенду</span>
        </div>
      )}

      {backendResponse && (
        <div className="border-b border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ответ бекенда
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11px] rounded-lg shrink-0"
              onClick={async () => {
                await navigator.clipboard.writeText(backendResponse);
                setCopiedBackendSql(true);
                setTimeout(() => setCopiedBackendSql(false), 2000);
              }}
            >
              {copiedBackendSql ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedBackendSql ? "Скопировано" : "Копировать"}
            </Button>
          </div>
          <pre className="p-3 rounded-lg border border-border bg-card text-[12px] font-mono leading-5 text-card-foreground overflow-x-auto">
            {backendResponse}
          </pre>
        </div>
      )}

      {backendError && (
        <div className="border-b border-border px-4 py-3 bg-destructive/5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider">
              Ошибка
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11px] rounded-lg shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                await navigator.clipboard.writeText(backendError);
                setCopiedBackendSql(true);
                setTimeout(() => setCopiedBackendSql(false), 2000);
              }}
            >
              {copiedBackendSql ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Копировать
            </Button>
          </div>
          <pre className="p-3 rounded-lg border border-destructive/20 bg-card text-[12px] font-mono leading-5 text-destructive overflow-x-auto whitespace-pre-wrap break-words">
            {backendError}
          </pre>
        </div>
      )}

      {copyError && (
        <div className="flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-destructive/10 text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{copyError}</span>
        </div>
      )}

      <Tabs defaultValue="sql" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3">
          <TabsList className="h-8 bg-secondary/50 rounded-lg p-0.5 w-full">
            <TabsTrigger
              value="sql"
              className="h-7 gap-1.5 text-[11px] rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm flex-1 font-medium"
            >
              <Code2 className="h-3 w-3" />
              SQL
            </TabsTrigger>
            <TabsTrigger
              value="json"
              className="h-7 gap-1.5 text-[11px] rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm flex-1 font-medium"
            >
              <FileJson className="h-3 w-3" />
              JSON
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sql" className="flex-1 min-h-0 mt-0 px-4 pb-4 pt-3">
          <div className="relative h-full rounded-xl border border-border bg-surface overflow-hidden">
            {sqlOutput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-10 rounded-lg bg-card/90 backdrop-blur border border-border/50 text-muted-foreground hover:text-card-foreground shadow-sm"
                onClick={() => copyToClipboard(sqlOutput, "sql")}
              >
                {copiedSql ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">Copy SQL</span>
              </Button>
            )}
            <ScrollArea className="h-full">
              <pre className="p-4 text-[12px] font-mono leading-6 text-card-foreground">
                {sqlOutput ? (
                  <SqlHighlight sql={sqlOutput} />
                ) : (
                  <span className="text-muted-foreground/60 italic text-[11px]">
                    {"Add components to generate SQL"}
                  </span>
                )}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent
          value="json"
          className="flex-1 min-h-0 mt-0 px-4 pb-4 pt-3"
        >
          <div className="relative h-full rounded-xl border border-border bg-surface overflow-hidden">
            {jsonOutput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-10 rounded-lg bg-card/90 backdrop-blur border border-border/50 text-muted-foreground hover:text-card-foreground shadow-sm"
                onClick={() => copyToClipboard(jsonOutput, "json")}
              >
                {copiedJson ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">Copy JSON</span>
              </Button>
            )}
            <ScrollArea className="h-full">
              <pre className="p-4 text-[12px] font-mono leading-6 text-card-foreground">
                {jsonOutput || (
                  <span className="text-muted-foreground/60 italic text-[11px]">
                    {"Add components to generate JSON"}
                  </span>
                )}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SqlHighlight({ sql }: { sql: string }) {
  const keywords =
    /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|GROUP BY|HAVING|ORDER BY|ASC|DESC|LIMIT|OFFSET|AS|COUNT|SUM|AVG|MIN|MAX|JOIN|ON|LEFT|RIGHT|INNER|OUTER|DISTINCT)\b/gi;
  const parts = sql.split(keywords);

  return (
    <>
      {parts.map((part, i) => {
        const isKeyword = i % 2 === 1;
        return isKeyword ? (
          <span key={i} className="text-primary font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

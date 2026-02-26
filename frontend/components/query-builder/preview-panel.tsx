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
  compileRawJsonOnBackend,
  compileSqlOnBackend,
  formatBackendResponse,
} from "@/lib/api";
import { logFrontendQuery } from "@/lib/frontend-logs";
import { generateId, cn } from "@/lib/utils";
import type { QueryHistoryEntry } from "@/lib/types";
import { TRANSLATIONS } from "@/lib/translations";
import { useLocale } from "@/hooks/use-locale";
import { validateBlocks } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

export default function PreviewPanel() {
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale];
  const blocks = useQueryStore((s) => s.blocks);
  const addHistoryEntry = useQueryStore((s) => s.addHistoryEntry);
  const historyLength = useQueryStore((s) => s.history.length);
  const setValidationErrors = useQueryStore((s) => s.setValidationErrors);
  const lastAppliedFromTemplate = useQueryStore((s) => s.lastAppliedFromTemplate);
  const setLastAppliedFromTemplate = useQueryStore((s) => s.setLastAppliedFromTemplate);
  const hasHistoryEntryWithSameJson = useQueryStore((s) => s.hasHistoryEntryWithSameJson);
  const { toast } = useToast();

  const setBackendResult = useQueryStore((s) => s.setBackendResult);
  const clearBackendResult = useQueryStore((s) => s.clearBackendResult);
  const lastRunStatus = useQueryStore((s) => s.lastRunStatus);
  const lastRunTime = useQueryStore((s) => s.lastRunTime);

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [payloadFormat, setPayloadFormat] = useState<"json" | "sql">("json");

  const jsonPayload = useMemo(() => {
    if (blocks.length === 0) return null;
    return blocksToJson(blocks);
  }, [blocks]);

  const jsonOutput = useMemo(() => {
    if (!jsonPayload) return "";
    return JSON.stringify(jsonPayload, null, 2);
  }, [jsonPayload]);

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

    const validation = validateBlocks(blocks, locale);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      const messages = validation.errors.map((e) => e.message);
      const unique = [...new Set(messages)];
      toast({
        title: t.validationToastTitle,
        description:
          unique.length <= 3
            ? unique.join(" ")
            : `${unique.slice(0, 2).join(" ")} ${t.validationToastAndMore(unique.length - 2)}.`,
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setIsRunning(true);
    clearBackendResult();
    setCopyError(null);
    const start = Date.now();

    try {
      const json = (jsonPayload ?? blocksToJson(blocks)) as unknown;
      void logFrontendQuery(json, sqlOutput);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[QB] payload sent to backend:",
          payloadFormat === "json" ? json : sqlOutput,
        );
      }
      const result =
        payloadFormat === "sql"
          ? await compileSqlOnBackend(sqlOutput)
          : await compileRawJsonOnBackend(json);
      const time = Date.now() - start;
      setBackendResult(formatBackendResponse(result), null, time, "success");

      const wasFromTemplate = lastAppliedFromTemplate;
      setLastAppliedFromTemplate(false);
      const canonicalJson = JSON.stringify(blocksToJson(blocks));
      const isDuplicate = hasHistoryEntryWithSameJson(canonicalJson);
      if (!wasFromTemplate && !isDuplicate) {
        const entry: QueryHistoryEntry = {
          id: generateId(),
          timestamp: Date.now(),
          name: t.queryTitle(historyLength + 1),
          blocks: JSON.parse(JSON.stringify(blocks)),
          json: jsonOutput,
          sql: sqlOutput,
          executionTime: time,
        };
        addHistoryEntry(entry);
      }
    } catch (err) {
      const time = Date.now() - start;
      setLastAppliedFromTemplate(false);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      setBackendResult(null, message || t.unknownError, time, "error");
    } finally {
      setIsRunning(false);
    }
  }, [
    blocks,
    locale,
    t,
    historyLength,
    addHistoryEntry,
    jsonOutput,
    sqlOutput,
    setValidationErrors,
    toast,
    lastAppliedFromTemplate,
    setLastAppliedFromTemplate,
    hasHistoryEntryWithSameJson,
    setBackendResult,
    clearBackendResult,
    payloadFormat,
    jsonPayload,
  ]);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <Terminal className="h-3 w-3 text-primary" />
          </div>
          <h2 className="text-[13px] font-semibold text-card-foreground truncate">
            Output
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Format:</span>
            <select
              className="h-7 rounded-md border border-border bg-card/60 px-2 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={payloadFormat}
              onChange={(e) =>
                setPayloadFormat(e.target.value === "sql" ? "sql" : "json")
              }
            >
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
            </select>
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
      </div>

      {lastRunStatus === "success" && lastRunTime !== null && (
        <div className={cn("flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-success/10 text-success", locale === "braille" && "font-braille")}>
          <div className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="font-medium">{t.backendResponseReceived}</span>
          <span className="ml-auto flex items-center gap-1 opacity-60">
            <Clock className="h-3 w-3" />
            {lastRunTime}ms
          </span>
        </div>
      )}
      {lastRunStatus === "error" && (
        <div className={cn("flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-destructive/10 text-destructive", locale === "braille" && "font-braille")}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{t.backendRequestError}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {copyError && (
          <div className="flex items-center gap-2 px-4 py-2 text-[11px] border-b border-border bg-destructive/10 text-destructive shrink-0">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{copyError}</span>
          </div>
        )}

        <Tabs defaultValue="sql" className="flex-1 flex flex-col min-h-0 shrink-0">
        <div className="px-4 pt-2.5 pb-2.5">
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
                  <span className={cn("text-muted-foreground/60 italic text-[11px]", locale === "braille" && "font-braille")}>
                    {t.addComponentsToGenerateSql}
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

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type Body = {
  json?: unknown;
  sql?: string;
};

async function appendLine(filePath: string, payload: unknown) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const line = JSON.stringify({ ts: Date.now(), payload }) + "\n";
  await fs.appendFile(filePath, line, { encoding: "utf8" });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const root = path.resolve(process.cwd(), "..");
    const jsonLogPath = path.join(root, "logs", "frontend-json.jsonl");
    const sqlLogPath = path.join(root, "logs", "frontend-sql.jsonl");

    const tasks: Promise<void>[] = [];
    if (body.json !== undefined) {
      tasks.push(appendLine(jsonLogPath, body.json));
    }
    if (body.sql !== undefined) {
      tasks.push(appendLine(sqlLogPath, body.sql));
    }

    if (tasks.length) {
      await Promise.all(tasks);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Логи не критичны для работы приложения.
    return new NextResponse(null, { status: 204 });
  }
}


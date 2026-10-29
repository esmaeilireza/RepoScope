// lib/knowledge/semantic-cache.ts
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { SemanticEvalResult } from "../types";

const CACHE_DIR = path.join(process.cwd(), ".reposcope-cache", "semantic");

function hashContent(content: string, prompt: string, model: string): string {
  return crypto
    .createHash("sha256")
    .update(`${model}::${prompt}::${content}`)
    .digest("hex")
    .slice(0, 20);
}

export function makeCacheKey(filePath: string, content: string, prompt: string, model: string): string {
  return `${path.basename(filePath)}-${hashContent(content, prompt, model)}`;
}

export function getCached(key: string): SemanticEvalResult | null {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function setCached(key: string, result: SemanticEvalResult): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CACHE_DIR, `${key}.json`),
    JSON.stringify(result, null, 2),
  );
}
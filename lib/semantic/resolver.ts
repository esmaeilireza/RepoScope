// lib/semantic/resolver.ts
// Priority: CLI flag > env var > reposcope.config.json default
import fs from "node:fs";
import path from "node:path";

interface ModelConfig {
  family: string;
  displayName: string;
  coldStartMs: number;
}

interface Config {
  semantic: {
    defaultModel: string;
    fallbackChain: string[];
    knownModels: Record<string, ModelConfig>;
  };
}

const CONFIG_PATH = path.join(process.cwd(), "reposcope.config.json");

function loadConfig(): Config | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as Config;
  } catch {
    return null;
  }
}

export async function resolveModel(explicit?: string): Promise<{ tag: string; source: string }> {
  if (explicit) return { tag: explicit, source: "cli-flag" };
  if (process.env.REPOSCOPE_MODEL) {
    return { tag: process.env.REPOSCOPE_MODEL, source: "env-var" };
  }
  const cfg = loadConfig();
  if (cfg?.semantic?.defaultModel) {
    return { tag: cfg.semantic.defaultModel, source: "config-default" };
  }
  if (cfg?.semantic?.fallbackChain?.length) {
    return { tag: cfg.semantic.fallbackChain[0], source: "config-fallback" };
  }
  throw new Error(
    "No model resolved. Set REPOSCOPE_MODEL env var or create reposcope.config.json"
  );
}

export function getColdStartMs(tag: string): number {
  const cfg = loadConfig();
  return cfg?.semantic?.knownModels?.[tag]?.coldStartMs ?? 15000;
}

export async function listRegisteredModels(): Promise<string[]> {
  const cfg = loadConfig();
  return Object.keys(cfg?.semantic?.knownModels ?? {});
}
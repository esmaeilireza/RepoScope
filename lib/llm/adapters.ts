// lib/llm/adapters.ts
// Wire-format adapters. Every known LLM API falls into one of three shapes.
// Pure functions — fully testable offline. ESLint-9-safe (no `any`).
import type { ProviderConfig } from "./providers";

export interface LLMRequest {
  system: string;
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OutboundRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface ParsedResponse {
  content: string;
}

// ---- unknown-narrowing helpers (lint-safe) ----
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
/**
 * Extract concatenated text from an array of parts.
 * Works for Anthropic `content: [{ type: "text", text: ... }]`
 * and for Google `parts: [{ text: ... }]`.
 */
function partsText(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((p) => (isRecord(p) ? str(p.text) ?? "" : ""))
    .join("")
    .trim();
}

export function buildRequest(
  config: ProviderConfig,
  req: LLMRequest,
  apiKey: string,
): OutboundRequest {
  switch (config.apiFormat) {
    case "openai-compatible":
      return buildOpenAI(config, req, apiKey);
    case "anthropic":
      return buildAnthropic(config, req, apiKey);
    case "google":
      return buildGoogle(config, req, apiKey);
    default: {
      // Compile-time exhaustiveness check. If `ApiFormat` grows, this
      // becomes a type error instead of a silent runtime fallthrough.
      const _exhaustive: never = config.apiFormat;
      throw new Error(`Unsupported API format: ${String(_exhaustive)}`);
    }
  }
}

export function parseResponse(
  config: ProviderConfig,
  data: unknown,
): ParsedResponse {
  switch (config.apiFormat) {
    case "openai-compatible":
      return parseOpenAI(data);
    case "anthropic":
      return parseAnthropic(data);
    case "google":
      return parseGoogle(data);
    default: {
      const _exhaustive: never = config.apiFormat;
      throw new Error(`Unsupported API format: ${String(_exhaustive)}`);
    }
  }
}

// ---- 1. OpenAI-compatible: OpenAI, Groq, Mistral, DeepSeek, Together,
//         OpenRouter, Fireworks, Perplexity, xAI, Ollama, vLLM, LiteLLM ----
function buildOpenAI(
  c: ProviderConfig,
  r: LLMRequest,
  key: string,
): OutboundRequest {
  return {
    url: `${c.baseUrl}/chat/completions`,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...c.extraHeaders,
    },
    body: {
      model: r.model,
      temperature: r.temperature ?? 0.1,
      max_tokens: r.maxTokens ?? 350,
      messages: [
        { role: "system", content: r.system },
        { role: "user", content: r.prompt },
      ],
    },
  };
}
function parseOpenAI(d: unknown): ParsedResponse {
  if (!isRecord(d) || !Array.isArray(d.choices) || d.choices.length === 0) {
    return { content: "" };
  }
  const first = d.choices[0];
  const content =
    isRecord(first) && isRecord(first.message)
      ? str(first.message.content)?.trim() ?? ""
      : "";
  return { content };
}

// ---- 2. Anthropic Messages API ----
function buildAnthropic(
  c: ProviderConfig,
  r: LLMRequest,
  key: string,
): OutboundRequest {
  return {
    url: `${c.baseUrl}/messages`,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: {
      model: r.model,
      max_tokens: r.maxTokens ?? 350,
      temperature: r.temperature ?? 0.1,
      system: r.system,
      messages: [{ role: "user", content: r.prompt }],
    },
  };
}
function parseAnthropic(d: unknown): ParsedResponse {
  const content = isRecord(d) ? partsText(d.content) : "";
  return { content };
}

// ---- 3. Google Gemini generateContent ----
function buildGoogle(
  c: ProviderConfig,
  r: LLMRequest,
  key: string,
): OutboundRequest {
  return {
    url: `${c.baseUrl}/models/${r.model}:generateContent`,
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: {
      systemInstruction: { parts: [{ text: r.system }] },
      contents: [{ role: "user", parts: [{ text: r.prompt }] }],
      generationConfig: {
        temperature: r.temperature ?? 0.1,
        maxOutputTokens: r.maxTokens ?? 350,
      },
    },
  };
}
function parseGoogle(d: unknown): ParsedResponse {
  if (
    !isRecord(d) ||
    !Array.isArray(d.candidates) ||
    d.candidates.length === 0
  ) {
    return { content: "" };
  }
  const first = d.candidates[0];
  const content =
    isRecord(first) && isRecord(first.content)
      ? partsText(first.content.parts)
      : "";
  return { content };
}
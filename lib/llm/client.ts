// lib/llm/client.ts — SERVER ONLY. Never import from a client component.
import type { ProviderConfig } from "./providers";
import { buildRequest, parseResponse, type LLMRequest } from "./adapters";

/**
 * Default timeout is 9s, deliberately below Vercel Hobby's 10s function cap.
 * For local Ollama / Qwen 9B on CPU, override:
 *   REPOSCOPE_LLM_TIMEOUT_MS=60000
 */
const TIMEOUT_MS = Number(process.env.REPOSCOPE_LLM_TIMEOUT_MS) || 9_000;

export class LLMError extends Error {
  constructor(
    message: string,
    public status: number,
    public providerId: string,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
}

export async function generateText(
  config: ProviderConfig,
  req: LLMRequest,
  apiKey: string,
): Promise<LLMResponse> {
  const { url, headers, body } = buildRequest(config, req, apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") {
      throw new LLMError(
        `${config.id} timed out after ${TIMEOUT_MS / 1000}s`,
        504,
        config.id,
      );
    }
    const msg = err instanceof Error ? err.message : "network error";
    throw new LLMError(`Could not reach ${config.id}: ${msg}`, 502, config.id);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = raw.slice(0, 200);
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      const errObj = isRecord(j.error) ? j.error : null;
      detail =
        (typeof j.message === "string" && j.message) ||
        (errObj && typeof errObj.message === "string" && errObj.message) ||
        detail;
    } catch {
      /* keep raw */
    }

    if (res.status === 401 || res.status === 403)
      throw new LLMError(
        `Invalid API key for ${config.id}. ${detail}`,
        401,
        config.id,
      );
    if (res.status === 429)
      throw new LLMError(
        `${config.id} rate limit exceeded. ${detail}`,
        429,
        config.id,
      );
    if (res.status === 404)
      throw new LLMError(
        `Model "${req.model}" not found on ${config.id}. ${detail}`,
        404,
        config.id,
      );
    throw new LLMError(
      `${config.id} error ${res.status}. ${detail}`,
      502,
      config.id,
    );
  }

  const data: unknown = await res.json().catch(() => null);
  const { content } = parseResponse(config, data);
  if (!content)
    throw new LLMError(
      `${config.id} returned an empty response.`,
      502,
      config.id,
    );

  return { content, provider: config.id, model: req.model };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
// lib/llm/ollama.ts
// Minimal typed wrapper around the local Ollama server.
// Enforces format: "json" on every request — the Universal AI Layer
// constraint (Week 2, Days 6-10).
//
// Model resolution: REPOSCOPE_MODEL env var, falling back to
// "reposcope-mistral:latest". This matches the pattern used by
// lib/semantic/runner.ts, scripts/semantic-calibrate.ts, and
// scripts/semantic-debug.ts, so every part of the semantic layer
// talks to the same model unless a caller explicitly overrides it.
//
// Timeout: 180s default. Cold start of a 7B Q4_K_M on a Windows box
// without a warm GPU can exceed 90s; the roadmap's known-models section
// documents 150s as the measured cold start for reposcope-mistral, so
// 180s provides headroom. Callers that need a tighter budget must pass
// timeoutMs explicitly — the default is deliberately generous because
// a 20s default caused multiple false "AbortError" failures before this
// value was corrected.
//
// Verify the source documentation for OLLAMA_BASE_URL if it differs
// in your environment.

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.REPOSCOPE_MODEL ?? "reposcope-mistral:latest";
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_NUM_PREDICT = 512;

export interface OllamaJsonRequest {
  model?: string;
  system: string;
  user: string;
  timeoutMs?: number;
  numPredict?: number;
  temperature?: number;
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

interface OllamaErrorResponse {
  error?: string;
}

export async function generateJson(req: OllamaJsonRequest): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const model = req.model ?? DEFAULT_MODEL;

  try {
    let res: Response;
    try {
      res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          system: req.system,
          prompt: req.user,
          format: "json", // MANDATORY — structured JSON on every call
          stream: false,
          options: {
            temperature: req.temperature ?? 0,
            num_predict: req.numPredict ?? DEFAULT_NUM_PREDICT,
          },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      // fetch throws DOMException with name "AbortError" on timeout,
      // or TypeError on connection refused / network failure.
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `Ollama request timed out after ${timeoutMs}ms (model: ${model}). ` +
            `If the model is cold-starting, increase timeoutMs or warm it manually.`,
        );
      }
      if (err instanceof TypeError) {
        throw new Error(
          `Ollama server unreachable at ${OLLAMA_BASE_URL} (model: ${model}). ` +
            `Start it with: ollama serve`,
        );
      }
      throw err;
    }

    if (!res.ok) {
      // Ollama returns JSON error bodies like {"error": "model 'foo' not found"}.
      // Include the body so callers can distinguish:
      //   404 → model not registered (fix: ollama pull or register the model)
      //   500 → server-side failure (fix: check ollama logs)
      //   400 → malformed request (fix: check the payload)
      let body = "";
      try {
        body = await res.text();
      } catch {
        // body read failed — fall through with empty body
      }
      const detail = extractErrorDetail(body);
      throw new Error(
        `Ollama HTTP ${res.status} ${res.statusText} (model: ${model})` +
          (detail ? `: ${detail}` : ""),
      );
    }

    const data = (await res.json()) as OllamaGenerateResponse;
    if (typeof data.response !== "string") {
      throw new Error(
        `Ollama returned no "response" field (model: ${model}). ` +
          `Full payload: ${JSON.stringify(data).slice(0, 200)}`,
      );
    }
    return data.response;
  } finally {
    clearTimeout(timer);
  }
}

function extractErrorDetail(body: string): string | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as OllamaErrorResponse;
    if (typeof parsed.error === "string" && parsed.error.length > 0) {
      return parsed.error;
    }
  } catch {
    // not JSON — fall through to raw body
  }
  return body.length > 0 ? body.slice(0, 200) : null;
}
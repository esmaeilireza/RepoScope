// lib/llm/providers.ts
// Provider registry — PUBLIC metadata only (no secrets). Safe for client import.
// Day 6: base registry. Refresh the `models` arrays quarterly (recurring issue).

export type ApiFormat = "openai-compatible" | "anthropic" | "google";

export type ProviderId =
  | "openai" | "anthropic" | "google" | "groq" | "mistral"
  | "deepseek" | "together" | "openrouter" | "fireworks"
  | "perplexity" | "xai" | "ollama" | "custom";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  baseUrl: string;
  apiFormat: ApiFormat;
  defaultModel: string;
  models: string[];
  envVar: string;
  docsUrl: string;
  requiresKey: boolean;
  extraHeaders?: Record<string, string>;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: "openai", name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiFormat: "openai-compatible",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o"],
    envVar: "OPENAI_API_KEY",
    docsUrl: "https://platform.openai.com/docs",
    requiresKey: true,
  },
  anthropic: {
    id: "anthropic", name: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com/v1",
    apiFormat: "anthropic",
    defaultModel: "claude-3-5-haiku-latest",
    models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
    envVar: "ANTHROPIC_API_KEY",
    docsUrl: "https://docs.anthropic.com",
    requiresKey: true,
  },
  google: {
    id: "google", name: "Google (Gemini)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiFormat: "google",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-flash"],
    envVar: "GOOGLE_API_KEY",
    docsUrl: "https://ai.google.dev/docs",
    requiresKey: true,
  },
  groq: {
    id: "groq", name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiFormat: "openai-compatible",
    defaultModel: "llama-3.1-8b-instant",
    models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
    envVar: "GROQ_API_KEY",
    docsUrl: "https://console.groq.com/docs",
    requiresKey: true,
  },
  mistral: {
    id: "mistral", name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    apiFormat: "openai-compatible",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest"],
    envVar: "MISTRAL_API_KEY",
    docsUrl: "https://docs.mistral.ai",
    requiresKey: true,
  },
  deepseek: {
    id: "deepseek", name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiFormat: "openai-compatible",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    envVar: "DEEPSEEK_API_KEY",
    docsUrl: "https://api-docs.deepseek.com",
    requiresKey: true,
  },
  together: {
    id: "together", name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    apiFormat: "openai-compatible",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
    envVar: "TOGETHER_API_KEY",
    docsUrl: "https://docs.together.ai",
    requiresKey: true,
  },
  openrouter: {
    id: "openrouter", name: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    apiFormat: "openai-compatible",
    // Verify availability of these model IDs against OpenRouter's model page
    // before relying on them: https://openrouter.ai/models
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    models: ["meta-llama/llama-3.1-8b-instruct:free", "openrouter/auto"],
    envVar: "OPENROUTER_API_KEY",
    docsUrl: "https://openrouter.ai/docs",
    requiresKey: true,
    extraHeaders: {
      "HTTP-Referer": "https://github.com/esmaeilireza/RepoScope",
      "X-Title": "RepoScope",
    },
  },
  fireworks: {
    id: "fireworks", name: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    apiFormat: "openai-compatible",
    defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    models: ["accounts/fireworks/models/llama-v3p1-8b-instruct"],
    envVar: "FIREWORKS_API_KEY",
    docsUrl: "https://docs.fireworks.ai",
    requiresKey: true,
  },
  perplexity: {
    id: "perplexity", name: "Perplexity",
    baseUrl: "https://api.perplexity.ai",
    apiFormat: "openai-compatible",
    defaultModel: "sonar",
    models: ["sonar", "sonar-pro"],
    envVar: "PERPLEXITY_API_KEY",
    docsUrl: "https://docs.perplexity.ai",
    requiresKey: true,
  },
  xai: {
    id: "xai", name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    apiFormat: "openai-compatible",
    defaultModel: "grok-2-latest",
    models: ["grok-2-latest"],
    envVar: "XAI_API_KEY",
    docsUrl: "https://docs.x.ai",
    requiresKey: true,
  },
  ollama: {
    id: "ollama", name: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    apiFormat: "openai-compatible",
    defaultModel: "qwen2.5:7b",
    models: ["qwen2.5:7b", "llama3.1"],
    envVar: "",
    docsUrl: "https://github.com/ollama/ollama",
    requiresKey: false,
  },
  custom: {
    id: "custom", name: "Custom (OpenAI-compatible)",
    baseUrl: "",            // resolved from CUSTOM_LLM_BASE_URL at runtime
    apiFormat: "openai-compatible",
    defaultModel: "",       // resolved from CUSTOM_LLM_MODEL at runtime
    models: [],
    envVar: "CUSTOM_LLM_API_KEY",
    docsUrl: "",
    requiresKey: false,
  },
};

export function getProvider(id: string): ProviderConfig | null {
  return (PROVIDERS as Record<string, ProviderConfig>)[id] ?? null;
}
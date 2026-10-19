// app/api/insight/route.ts — FINAL unified route.
//   Day 7:  providers, key resolution, rate limit
//   Day 17: grounded prompt (graph context)
//   Day 18: citation gate on output
//   Day 19: cross-domain mode emerges from multi-profile findings
//   Day 21: freshness metadata in the response
import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, getProvider } from "@/lib/llm/providers";
import { generateText, LLMError } from "@/lib/llm/client";
import {
  buildInsightPrompt,
  buildGroundedPrompt,
  buildDiagnosisPrompt,
  type InsightFinding,
} from "@/lib/insight";
import { checkAIRateLimit } from "@/lib/rate-limiter";
import { validateCitations } from "@/lib/knowledge/citation-gate";
import { graphIsAvailable } from "@/lib/knowledge/graph";

export const dynamic = "force-dynamic"; // never cache

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function listServerProviders(): string[] {
  return Object.values(PROVIDERS)
    .filter((p) => p.envVar && Boolean(process.env[p.envVar]))
    .map((p) => p.id);
}

/** GET — which providers are provisioned + whether the knowledge graph is live. */
export async function GET() {
  return NextResponse.json({
    serverProviders: listServerProviders(),
    defaultProvider: process.env.DEFAULT_AI_PROVIDER ?? "groq",
    dailyLimit: Number(process.env.AI_DAILY_LIMIT ?? 5),
    graph: graphIsAvailable(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      findings,
      profile,
      provider: providerId,
      model,
      mode,               // "insight" (default) | "diagnose"
      patterns,           // diagnose mode: detected error patterns
      logExcerpt,         // diagnose mode: truncated log text
      domain,             // diagnose mode: "data" | "ot" | "web" | "general"
    } = body as {
      findings?: InsightFinding[];
      profile?: string;
      provider?: string;
      model?: string;
      mode?: "insight" | "diagnose";
      patterns?: string[];
      logExcerpt?: string;
      domain?: "data" | "ot" | "web" | "general";
    };

    if (mode === "diagnose") {
      if (!Array.isArray(patterns) || typeof logExcerpt !== "string") {
        return NextResponse.json(
          { error: "diagnose mode requires patterns[] and logExcerpt" },
          { status: 400 }
        );
      }
    } else if (!Array.isArray(findings)) {
      return NextResponse.json({ error: "findings array is required" }, { status: 400 });
    }

    const provider = getProvider(providerId ?? process.env.DEFAULT_AI_PROVIDER ?? "groq");
    if (!provider) {
      return NextResponse.json(
        { error: `Unknown provider "${providerId}".`, available: Object.keys(PROVIDERS) },
        { status: 400 }
      );
    }

    let baseUrl = provider.baseUrl;
    let usedModel = model?.trim() || provider.defaultModel;

    if (provider.id === "custom") {
      const customBase = process.env.CUSTOM_LLM_BASE_URL;
      if (!customBase) {
        return NextResponse.json(
          { error: 'Provider "custom" requires CUSTOM_LLM_BASE_URL (and optionally CUSTOM_LLM_MODEL).' },
          { status: 503 }
        );
      }
      baseUrl = customBase.replace(/\/$/, "");
      usedModel = model?.trim() || process.env.CUSTOM_LLM_MODEL || "default";
    }

    // ---- Key resolution: BYOK header > server env > 503 (if key required) ----
    const userKey = request.headers.get("x-ai-key")?.trim() ?? "";
    const serverKey = provider.envVar ? process.env[provider.envVar] ?? "" : "";

    if (!userKey && !serverKey && provider.requiresKey) {
      return NextResponse.json(
        {
          error: `No API key available for provider "${provider.id}".`,
          serverProviders: listServerProviders(),
          hint: 'Send your own key via the "x-ai-key" header (BYOK), or pick a provisioned provider.',
        },
        { status: 503 }
      );
    }

    // Rate limit ONLY server-key usage — BYOK users pay for their own tokens.
    if (!userKey && serverKey) {
      const { allowed } = checkAIRateLimit(getClientIp(request));
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Daily AI analysis limit reached.",
            hint: "Provide your own API key via the x-ai-key header to bypass this limit.",
          },
          { status: 429 }
        );
      }
    }

    // ---- Prompt selection ----
    let system: string;
    let prompt: string;
    let maxTokens: number;

    if (mode === "diagnose") {
      const built = buildDiagnosisPrompt({
        patterns: patterns ?? [],
        logExcerpt: logExcerpt ?? "",
        domain: domain ?? "general",
      });
      system = built.system;
      prompt = built.prompt;
      maxTokens = 400;
    } else if (graphIsAvailable() && (findings ?? []).some((f) => Boolean(f.id))) {
      // Day 17: grounded path — the default when the graph exists
      const built = buildGroundedPrompt(findings ?? [], profile);
      system = built.system;
      prompt = built.prompt;
      maxTokens = 300; // grounded answers stay tight (Vercel Hobby timeout headroom)
    } else {
      const built = buildInsightPrompt(findings ?? [], profile ?? "general");
      system = built.system;
      prompt = built.prompt;
      maxTokens = 350;
    }

    const response = await generateText(
      { ...provider, baseUrl },
      { system, prompt, model: usedModel, temperature: 0.1, maxTokens },
      userKey || serverKey
    );

    // ---- Day 18: Citation Gate ----
    const gate = validateCitations(response.content);

    return NextResponse.json(
      {
        insight: gate.text,
        grounded: gate.grounded,
        citations: gate.validCitations,
        stripped: gate.stripped,
        provider: response.provider,
        model: response.model,
        generatedAt: new Date().toISOString(), // Day 21: freshness metadata
        usingByok: Boolean(userKey),
        mode: mode ?? "insight",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    if (error instanceof LLMError) {
      console.error(`[insight:${error.providerId}]`, error.message); // message only — never the key
      const status = error.status === 401 || error.status === 429 ? error.status : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Insight route error:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
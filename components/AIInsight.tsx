// components/AIInsight.tsx — final state: provider selector, BYOK,
// grounded/unverified chips, citation + stripped counts, freshness metadata.
"use client";
import { useEffect, useState } from "react";

interface InsightFinding {
  id?: string;
  profile?: string;
  severity?: string;
  title?: string;
  message?: string;
  fix?: string;
  file?: string;
}

interface InsightResponse {
  insight?: string;
  grounded?: boolean;
  citations?: string[];
  stripped?: number;
  provider?: string;
  model?: string;
  generatedAt?: string;
  usingByok?: boolean;
  error?: string;
}

interface Props {
  findings: InsightFinding[];
  profile: string;
}

type Status = "idle" | "loading" | "done" | "error" | "rate-limited";

const PROVIDER_OPTIONS = [
  ["groq", "Groq"], ["google", "Google Gemini"], ["openrouter", "OpenRouter (free)"],
  ["openai", "OpenAI"], ["anthropic", "Anthropic"], ["mistral", "Mistral"],
  ["deepseek", "DeepSeek"], ["together", "Together"], ["fireworks", "Fireworks"],
  ["perplexity", "Perplexity"], ["xai", "xAI"], ["ollama", "Ollama (local)"],
  ["custom", "Custom"],
] as const;

export function AIInsight({ findings, profile }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<InsightResponse>({});
  const [providerId, setProviderId] = useState("groq");
  const [byokKey, setByokKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [serverProviders, setServerProviders] = useState<string[]>([]);
  const [graphLive, setGraphLive] = useState(false);

  useEffect(() => {
    fetch("/api/insight")
      .then((r) => r.json())
      .then((d: { serverProviders?: string[]; graph?: boolean }) => {
        const list = d.serverProviders ?? [];
        setServerProviders(list);
        setGraphLive(Boolean(d.graph));
        if (list.length) setProviderId(list[0]);
      })
      .catch(() => {});
  }, []);

  const analyze = async () => {
    setStatus("loading");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (byokKey.trim()) headers["x-ai-key"] = byokKey.trim();

      const res = await fetch("/api/insight", {
        method: "POST",
        headers,
        body: JSON.stringify({ findings, profile, provider: providerId }),
      });
      const data: InsightResponse = await res.json();

      if (res.status === 429) { setStatus("rate-limited"); setResult(data); return; }
      if (!res.ok) { setStatus("error"); setResult(data); return; }
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
      setResult({ error: "Network error" });
    }
  };

  if (findings.length === 0) return null;

  return (
    <div className="rounded-xl border border-tealx/20 bg-panel p-4 space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-tealx uppercase tracking-wide">AI Insight</span>

        <select
          value={providerId}
          onChange={(e) => { setProviderId(e.target.value); setStatus("idle"); }}
          className="bg-night border border-edge rounded-md px-2 py-1 text-xs text-slate-200"
          aria-label="AI provider"
        >
          {PROVIDER_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>{label}{serverProviders.includes(id) ? " ✓" : ""}</option>
          ))}
        </select>

        {graphLive && (
          <span className="text-[10px] font-mono text-mint" title="Knowledge graph loaded">
            graph ✓
          </span>
        )}

        <button
          onClick={() => setShowKey((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          {showKey ? "Hide key" : "Use my key"}
        </button>

        {status !== "loading" && (
          <button
            onClick={analyze}
            className="ml-auto px-3 py-1 text-xs rounded-md bg-tealx/80 hover:bg-tealx text-night font-medium"
          >
            {status === "done" ? "Re-analyze" : "Analyze"}
          </button>
        )}
      </div>

      {showKey && (
        <input
          type="password"
          value={byokKey}
          onChange={(e) => setByokKey(e.target.value)}
          placeholder="Paste API key — used for this request only, never stored"
          className="w-full bg-night border border-edge rounded-md px-3 py-1.5 text-xs font-mono text-slate-200"
          aria-label="Your API key"
        />
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-tealx border-t-transparent animate-spin" />
          Analyzing findings via {providerId}…
        </div>
      )}

      {status === "done" && result.insight && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">{result.insight}</p>

          {/* Day 18/21: grounded badge + citations + freshness */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-edge/50">
            {result.grounded ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-mint">
                <span className="w-1.5 h-1.5 rounded-full bg-mint" /> grounded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amberx">
                <span className="w-1.5 h-1.5 rounded-full bg-amberx" /> unverified
              </span>
            )}
            {(result.citations?.length ?? 0) > 0 && (
              <span className="text-xs font-mono text-slate-500">
                {result.citations!.length} citation{result.citations!.length > 1 ? "s" : ""}
              </span>
            )}
            {(result.stripped ?? 0) > 0 && (
              <span className="text-xs font-mono text-slate-600">
                {result.stripped} stripped
              </span>
            )}
            <span className="text-xs font-mono text-slate-600 ml-auto">
              via {result.model} @ {result.provider}
              {result.usingByok ? " (your key)" : ""} · {result.generatedAt?.slice(0, 10)}
            </span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-1">
          <p className="text-sm text-rosex">{result.error ?? "Analysis failed"}</p>
          <button onClick={() => setStatus("idle")} className="text-xs underline text-slate-500">Retry</button>
        </div>
      )}

      {status === "rate-limited" && (
        <div className="space-y-2">
          <p className="text-sm text-amberx">{result.error ?? "Daily limit reached."}</p>
          <button
            onClick={() => setShowKey(true)}
            className="text-xs text-tealx hover:text-tealx/80 underline"
          >
            Use your own API key to continue
          </button>
        </div>
      )}
    </div>
  );
}
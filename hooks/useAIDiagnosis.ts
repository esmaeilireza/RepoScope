// hooks/useAIDiagnosis.ts — Day 22: wire SmartDiagnosis to real LLM diagnosis.
"use client";
import { useState } from "react";

export interface DiagnosisInput {
  patterns: string[];                 // from lib/github-error-patterns.ts matching
  logExcerpt: string;                 // truncated failed-run log text
  domain: "data" | "ot" | "web" | "general";
  provider?: string;
  apiKey?: string;                    // optional BYOK
}

export interface DiagnosisResult {
  insight?: string;
  provider?: string;
  model?: string;
  generatedAt?: string;
  error?: string;
}

export function useAIDiagnosis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult>({});

  const diagnose = async (input: DiagnosisInput) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (input.apiKey?.trim()) headers["x-ai-key"] = input.apiKey.trim();

      const res = await fetch("/api/insight", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "diagnose",
          patterns: input.patterns,
          logExcerpt: input.logExcerpt,
          domain: input.domain,
          provider: input.provider,
        }),
      });
      const data = await res.json();
      setResult(res.ok ? data : { error: data.error ?? "Diagnosis failed" });
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return { diagnose, loading, result };
}
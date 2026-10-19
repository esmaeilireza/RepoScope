// lib/types.ts
// ============================================================================
// Shared domain types for RepoScope.
//
// Every other module should import from here. Avoid duplicate shapes.
//
// Important invariant:
//   Every TypeScript-emitted finding.ruleId MUST match a YAML rule id in
//   docs/specs/*.yaml, public/knowledge/specs.json, and
//   public/knowledge/graph.json.
// ============================================================================

// ─── GitHub tree item ───────────────────────────────────────────────────────
export interface GitHubTreeItem {
  path: string;
  mode?: string;
  type: "blob" | "tree";
  sha?: string;
  size?: number;
  url?: string;
}

// ─── Severity ───────────────────────────────────────────────────────────────
export type Severity = "critical" | "error" | "warning" | "info";

/**
 * Backward-compatible alias used by UI components (Board.tsx, ScoreBoard.tsx).
 * Prefer `Severity` in new code.
 */
export type FindingSeverity = Severity;

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 20,
  error: 15,
  warning: 10,
  info: 2,
};

// ─── Canonical audit profiles ───────────────────────────────────────────────
export type CanonicalAuditProfile =
  | "dataops"
  | "iiot"
  | "webapp"
  | "cross"
  | "graph";

export type AuditProfile = CanonicalAuditProfile | "web";

export interface AuditProfileConfig {
  id: CanonicalAuditProfile;
  label: string;
  description: string;
}

export const CANONICAL_AUDIT_PROFILES: readonly CanonicalAuditProfile[] = [
  "dataops",
  "iiot",
  "webapp",
  "cross",
  "graph",
];

export const AUDIT_PROFILES: AuditProfileConfig[] = [
  {
    id: "dataops",
    label: "DataOps & Analytics",
    description:
      "Checks notebooks, dbt models, lockfiles, schema validation, and raw data leakage.",
  },
  {
    id: "iiot",
    label: "Industrial / PLC",
    description:
      "Validates deterministic code, Modbus mocks, SCADA tests, and OT safety patterns.",
  },
  {
    id: "webapp",
    label: "General Web App",
    description:
      "Standard CI/CD, README, dependency, security, and deployment audit.",
  },
  {
    id: "cross",
    label: "Cross-Domain",
    description:
      "Composite rules that span IIoT, DataOps, web, and knowledge-graph concerns.",
  },
  {
    id: "graph",
    label: "Graph RAG / Knowledge Graph",
    description:
      "Checks graph grounding, citation integrity, schema stability, and GraphRAG audit rules.",
  },
];

export const PROFILE_ALIASES: Record<string, CanonicalAuditProfile> = {
  web: "webapp",
  website: "webapp",
  general: "webapp",
  graphrag: "graph",
  "graph-rag": "graph",
};

function isCanonicalAuditProfile(value: string): value is CanonicalAuditProfile {
  return (CANONICAL_AUDIT_PROFILES as readonly string[]).includes(value);
}

export function normalizeAuditProfile(
  value: unknown
): CanonicalAuditProfile | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (isCanonicalAuditProfile(raw)) return raw;
  return PROFILE_ALIASES[raw] ?? null;
}

export function canonicalAuditProfile(
  value: unknown,
  fallback: CanonicalAuditProfile = "webapp"
): CanonicalAuditProfile {
  return normalizeAuditProfile(value) ?? fallback;
}

// ─── Rule ID convention ─────────────────────────────────────────────────────
export const RULE_ID_REGEX =
  /^(iiot|dataops|webapp|cross|general|graph)(-[a-z0-9]+)*-\d{3}[a-z]?$/;

export function isValidRuleId(value: unknown): boolean {
  return typeof value === "string" && RULE_ID_REGEX.test(value);
}

// ─── Finding ────────────────────────────────────────────────────────────────
//
// ruleId MUST match the YAML spec id.
// The `detail` field is canonical here. Do NOT add a `message` field to
// Finding — use toInsightFinding() to convert for the AI layer.
export interface Finding {
  ruleId: string;
  severity: Severity;
  title: string;
  detail: string;
  fix: string;
  weight: number;
  profile?: AuditProfile;
  file?: string;
}

export interface ScoredFinding extends Finding {
  points: number;
}

export interface AuditScore {
  score: number;
  critical: number;
  errors: number;
  warnings: number;
  infos: number;
  findings: Finding[];
  items: ScoredFinding[];
  counts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  summary: string;
}

// ─── Knowledge graph / citation gate types ──────────────────────────────────
export interface KnowledgeNode {
  id: string;
  concept: string;
  source: string;
  chapter?: string;
  page?: number;
  pageRange?: string;
  ruleId?: string;
  profile?: CanonicalAuditProfile;
  verificationStatus?:
    | "source-backed"
    | "synthesis"
    | "not-established"
    | "needs-verification";
}

export interface CitationResult {
  ruleId: string;
  grounded: boolean;
  node?: KnowledgeNode;
}

export interface GroundedSources {
  rules: string[];
  concepts: string[];
  books: string[];
}

export interface SmartDiagnosis {
  summary: string;
  citations: CitationResult[];
  strippedCount: number;
}

// ─── Insight finding shape used by the AI layer ─────────────────────────────
//
// INTENTIONALLY LOOSE:
//   - profile and severity are `string` here (not the strict unions) so that
//     a caller can pass legacy values like "web" or "info" without TS fighting
//     them.
//   - Both `message` and `detail` exist; use toInsightFinding() to fill both
//     so downstream prompt builders never see an empty body.
export interface InsightFinding {
  id?: string;
  ruleId?: string;
  profile?: string;
  severity?: string;
  title?: string;
  message?: string;
  detail?: string;
  fix?: string;
  file?: string;
}

/**
 * Normalize any Finding-like object into the canonical InsightFinding shape.
 *
 * This is the SINGLE source of truth for the message/detail alias. Call this
 * at every boundary where a raw audit finding enters the AI layer.
 *
 *   Finding.detail     -> InsightFinding.message AND .detail
 *   InsightFinding.id  -> InsightFinding.ruleId (backfilled)
 *   InsightFinding.ruleId -> InsightFinding.id (backfilled)
 */
export function toInsightFinding(
  finding: Finding | InsightFinding
): InsightFinding {
  const id =
    (finding as Finding).ruleId ??
    (finding as InsightFinding).id ??
    (finding as InsightFinding).ruleId;

  const detail =
    (finding as Finding).detail ??
    (finding as InsightFinding).message ??
    (finding as InsightFinding).detail ??
    "";

  const severity =
    typeof finding.severity === "string" ? finding.severity : undefined;

  const profile =
    typeof finding.profile === "string" ? finding.profile : undefined;

  return {
    id,
    ruleId: id,
    profile,
    severity,
    title: finding.title,
    message: detail,
    detail,
    fix: finding.fix,
    file: finding.file,
  };
}
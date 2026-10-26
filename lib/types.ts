// lib/types.ts
// Shared TypeScript vocabulary for RepoScope.
//
// Design rules:
//   1. `Finding` is the lean audit primitive produced by lib/*-audit.ts.
//      It carries `ruleId`, `severity`, `title`, `detail`, `fix`, `weight`,
//      and optional `profile` / `file`. It deliberately does NOT carry
//      `id` or `message` — those are synthesized on the derived types.
//   2. `ScoredFinding` is what scoreAndExplain() produces: it adds `points`.
//   3. `InsightFinding` is what the AI layer consumes: it adds `id`,
//      `message`, and `insight`, all backfilled from the lean fields.
//   4. `AuditProfile` is `"dataops" | "iiot" | "webapp" | "cross" | "general"`.
//   5. `KnowledgeProfile` additionally includes `"graph"` for grounding notes.
//   6. `RuleCheckType` includes `"semantic_eval"` for LLM-backed checks.
//      Semantic checks are OPTIONAL, budget-capped, and MUST fail-open
//      (skipped, not failed) when the LLM is unavailable.
//   7. `RuleCheckType` includes `"structural_ast"` for AST-based checks.
//      Structural checks are deterministic, subprocess-based, and MUST
//      fail-open (skipped) when the parser script is missing or the
//      target file cannot be parsed. They do not consume LLM budget.

// ─── Severity ────────────────────────────────────────────────────────────
export type Severity = "critical" | "error" | "warning" | "info";
export type FindingSeverity = Severity;

// ─── Profiles ────────────────────────────────────────────────────────────
export type AuditProfile =
  | "dataops"
  | "iiot"
  | "webapp"
  | "cross"
  | "general";

export interface AuditProfileConfig {
  id: AuditProfile;
  label: string;
  description: string;
}

export const AUDIT_PROFILES: readonly AuditProfileConfig[] = [
  {
    id: "webapp",
    label: "General Web App",
    description:
      "Standard CI/CD, README, dependency, security, and deployment audit.",
  },
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
    id: "cross",
    label: "Cross-Domain",
    description:
      "Composite rules that span IIoT, DataOps, web, and knowledge-graph concerns.",
  },
  {
    id: "general",
    label: "General",
    description:
      "Universal repository hygiene rules (docs, license, CI, configs).",
  },
] as const;

export type KnowledgeProfile =
  | "dataops"
  | "iiot"
  | "webapp"
  | "cross"
  | "general"
  | "graph";

export type Profile = KnowledgeProfile;

// ─── Rule schema ─────────────────────────────────────────────────────────
export type RuleCheckType =
  | "pattern_match"
  | "file_exists"
  | "file_absent"
  | "semantic_eval"   // LLM-backed evaluation (Week-1)
  | "structural_ast"; // AST-based evaluation (Week-3)

export type RuleErrorWhen =
  | "pattern_present"
  | "pattern_absent"
  | "file_present"
  | "file_absent";

export interface RuleReference {
  book?: string;
  standard?: string;
  concept?: string;
}

export interface RuleCheck {
  type: RuleCheckType;
  pattern?: string;
  file_glob?: string;
  path_glob?: string;
  paths?: string[];
  must_exist?: boolean;
  error_when?: RuleErrorWhen;
  message?: string;

  // ─── semantic_eval ONLY ───────────────────────────────────────────────
  /**
   * Instruction sent to the local LLM. MUST be a synthesized audit rule,
   * never a quoted passage from a copyrighted reference book.
   */
  evaluation_prompt?: string;
  /** Pass threshold in [0,1]. Default 0.7. */
  threshold?: number;
  /** Max characters fed to the LLM. Default 8000. NOT a token count. */
  max_input_chars?: number;

  // ─── structural_ast ONLY ──────────────────────────────────────────────
  /**
   * Which parser to invoke for `structural_ast` checks.
   *   "sql" → scripts/kg/parse_sql_ast.py
   *   "ts"  → scripts/kg/parse_ts_ast.mjs
   * Ignored by all other check types.
   */
  parser?: "sql" | "ts";
}

export interface RuleSpec {
  id: string;
  profile: KnowledgeProfile;
  severity: Severity;
  title: string;
  rationale: string;
  checks: RuleCheck[];
  fix: string;
  references: RuleReference[];
  full_text?: string;
  /**
   * Lifecycle marker used by build_knowledge.py and the acceptance suite:
   *   "active"  = implemented in TypeScript AND emitted into specs.json
   *   "draft"   = specified in YAML but not yet implemented in TS
   * Missing status is treated as "active" by the current test suite.
   */
  status?: "active" | "draft";
}

export interface SpecGlobalSettings {
  fail_on_critical?: boolean;
  ignore_paths?: string[];
  [key: string]: unknown;
}

export interface SpecFile {
  version: string;
  profile: KnowledgeProfile;
  description?: string;
  global_settings?: SpecGlobalSettings;
  rules: RuleSpec[];
}

export interface SpecBundle {
  version: string;
  rules: RuleSpec[];
}

// ─── Semantic evaluation result ──────────────────────────────────────────
export type SemanticSkipReason =
  | "budget_exceeded"
  | "llm_unavailable"
  | "invalid_json"
  | "file_missing";

export interface SemanticEvalResult {
  passed: boolean;
  score: number;
  missing: string[];
  reasoning: string;
  tokens_used: number;
  /**
   * True when the evaluation could not run (LLM down, malformed reply,
   * budget exhausted). A skipped result MUST NOT produce a finding.
   */
  skipped: boolean;
  skipReason?: SemanticSkipReason;
}

// ─── Findings (lean audit primitive) ─────────────────────────────────────
export interface FindingReference {
  book?: string;
  standard?: string;
  concept?: string;
}

export interface Finding {
  /** Rule identifier. Must match a `id` in docs/specs/*.yaml. */
  ruleId: string;
  severity: FindingSeverity;
  title: string;
  /** Long-form explanation. The test contract requires this field name. */
  detail: string;
  fix: string;
  weight: number;
  profile?: AuditProfile;
  /** Optional file path where the finding was observed. */
  file?: string;
  /** Optional line number inside `file`. */
  line?: number;
  references?: FindingReference[];
  metadata?: Record<string, unknown>;
}

export interface ScoredFinding extends Finding {
  points: number;
}

export interface InsightFinding extends Finding {
  /** Backfilled from ruleId when absent. */
  id?: string;
  /** Backfilled from detail when absent. */
  message?: string;
  /** Backfilled from detail when absent. */
  insight?: string;
}

/**
 * Normalize any Finding-like object into the canonical InsightFinding shape.
 *
 *   Finding.detail          -> InsightFinding.message AND .insight
 *   Finding.ruleId          -> InsightFinding.id
 *   InsightFinding.id       -> InsightFinding.ruleId (backfilled)
 *
 * Call this at every boundary where a raw audit finding enters the AI layer.
 */
export function toInsightFinding(
  f: Finding | InsightFinding,
): InsightFinding {
  const existing = f as InsightFinding;
  return {
    ...f,
    id: existing.id ?? f.ruleId,
    message: existing.message ?? f.detail,
    insight: existing.insight ?? f.detail,
  };
}

// ─── Deductions & scoring ────────────────────────────────────────────────
export interface Deduction {
  severity: FindingSeverity;
  points: number;
  reason: string;
  findingIds?: string[];
}

export type ScoreGrade =
  | "Excellent"
  | "Needs Attention"
  | "Critical"
  | (string & {});

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

// ─── GitHub tree ─────────────────────────────────────────────────────────
export interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha?: string;
  size?: number;
}

// ─── Diagnosis / citations ───────────────────────────────────────────────
export interface KnowledgeNode {
  id: string;
  concept: string;
  source: string;
  chapter?: string;
  page?: number;
  pageRange?: string;
  ruleId?: string;
  profile?: AuditProfile;
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
  steps?: string[];
  citations: CitationResult[];
  strippedCount: number;
}

// ─── Board / routing / notes ─────────────────────────────────────────────
export type BoardStatus =
  | "pass"
  | "warn"
  | "fail"
  | "info"
  | "pending"
  | (string & {});

export interface BoardSection {
  id: string;
  title: string;
  status: BoardStatus;
  summary: string;
  findings?: Finding[];
}

export interface RepoSignals {
  paths: string[];
  dependencies?: string[];
  fileCount?: number;
  languageHints?: string[];
}

export interface KnowledgeNote {
  path: string;
  profile: KnowledgeProfile;
  layer?: "grounding" | "global" | "profile";
  title?: string;
  source?: string;
  summary?: string;
  staticChecks?: string[];
  humanReview?: string[];
  readyRuleIds?: string[];
  candidateRuleIds?: string[];
}

export interface KnowledgeBundle {
  repo_root: string;
  primary_profile: KnowledgeProfile;
  secondary_profiles: KnowledgeProfile[];
  scores: Partial<Record<KnowledgeProfile, number>>;
  grounding_notes: KnowledgeNote[];
  global_notes: KnowledgeNote[];
  profile_notes: KnowledgeNote[];
  global_order: string[];
  profile_folders: string[];
  citation_allowlist?: string[];
  repo_signals?: RepoSignals;
}

export interface RoutingSummary {
  repository: string;
  primary_profile: KnowledgeProfile;
  secondary_profiles: KnowledgeProfile[];
  profile_scores: Partial<Record<KnowledgeProfile, number>>;
  global_lens_order: string[];
  layer_counts: {
    grounding: number;
    global: number;
    profile: number;
    total: number;
  };
  citation_allowlist_count: number;
}

export interface CrossDomainResult {
  crossDomain: boolean;
  domains: string[];
}

export interface CitationGateResult {
  grounded: boolean;
  text: string;
  stripped: number;
  validCitations: string[];
  strippedCitations: string[];
}

// ─── LLM provider (public metadata only) ─────────────────────────────────
export interface LLMProviderConfig {
  id: string;
  label: string;
  baseUrl?: string;
  apiKeyEnv?: string;
  model?: string;
  headers?: Record<string, string>;
  keyless?: boolean;
}

export interface LLMRequest {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: unknown;
}

export interface LLMResponse {
  content: string;
  raw?: unknown;
}

export interface LLMErrorInfo {
  message: string;
  status?: number;
  provider?: string;
  raw?: unknown;
}
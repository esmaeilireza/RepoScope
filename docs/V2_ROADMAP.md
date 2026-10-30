# RepoScope V2 - Roadmap

**Status:** V1 shipped (see `docs/architecture/V1_V2.md`). Nothing in this
document is shipped. Ordered by leverage per unit of effort.

The eight V2 gaps in `V1_V2.md` are all real. This document reframes them
as four workstreams so effort can be sequenced: two close gaps that
users see today (routing and grounding), one deepens audit precision
(AST), one changes the execution model (agents). Each section names
the gap it closes and the observable difference at the CLI.

---

## 1. Router consumes IML signals (2 days)

**Gap closed:** "Router consumes IML signals" in `V1_V2.md`.

**Current behavior:** `scripts/route_repo.py` classifies by file signals
(dep files, config files, source trees). `scripts/industrial_ml_filter.py`
separately detects realtime / edge / time-series / MLOps library names
and prints `[IML]` lines, but does not feed back into routing. A repo
with `pymodbus` + `mlflow` + `prophet` routes as `iiot` only.

**Change:** after `industrial_ml_filter.py` returns its categories,
merge them into the profile set before active-profile gating in
`scripts/reposcope-audit.ts`:

| IML category | Adds profile |
|---|---|
| `01-realtime-streams` | `dataops` |
| `02-iiot-edge-digital-twins` | `iiot` |
| `03-time-series-sensor-analytics` | `dataops` |
| `04-industrial-mlops` | `dataops` |

**Effort:** ~30 LOC across `reposcope-audit.ts` (one merge step) and
`industrial_ml_filter.py` (return category->profile map alongside the
existing signal->notes map). No new tests required beyond asserting
`iml-demo` now routes `iiot,dataops` and `cross-001` fires.

**Observable diff:** `pnpm reposcope --repo demo-repos/iml-demo --strict`
changes from `[ROUTE] profiles: iiot` (score 55) to
`[ROUTE] profiles: iiot, dataops` (score drops, `cross-001` fires).

**Why first:** smallest diff, closes the loudest narrative gap. A
reviewer already saw `iml-demo` route as `iiot` only and was told it is
a V2 item.

---

## 2. `general-*` migration to grounded `webapp.yaml` (3 days)

**Gap closed:** "`general-*` migration" in `V1_V2.md`.

**Current behavior:** nine hygiene rules (`general-docs-001`,
`general-legal-001`, `general-cicd-001`, `general-quality-001`,
`general-security-001`, `general-deps-001`, `general-docs-002`,
`general-docs-003`, `general-config-001`) live in `lib/audit.ts` as
regex/file-presence checks. They fire on any repo, but they have no
`:Rule` node in Neo4j, so `ground.py` returns `[]` and the CLI prints
no "Grounded in:" line. `webapp-demo` scores 0/100 entirely because of
these ungrounded rules.

**Change:**

1. Rename each rule ID to the `webapp-*` namespace
   (`webapp-general-docs-001` or fold into existing `webapp-001/002`).
2. Move detection logic from `lib/audit.ts` into `docs/specs/webapp.yaml`
   as rule entries with `check:` blocks (same schema as `dataops.yaml` /
   `iiot.yaml`).
3. Add `references:` with book citations:
   - `general-docs-001` (no README) → *The Pragmatic Programmer*
   - `general-legal-001` (no LICENSE) → *Open Source Licensing*
   - `general-cicd-001` (no CI) → *Continuous Delivery*
   - `general-quality-001` (no tests) → *Working Effectively with Legacy Code*
   - `general-security-001` (no security docs) → *Web Application Security*
   - `general-deps-001` (no dependabot) → *Software Supply Chain Security*
4. Delete the nine rules from `lib/audit.ts`.
5. Re-seed: `pnpm kg:seed` builds new `:Rule` and `:Concept` nodes.

**Effort:** ~3 days. Most of the time is finding/writing plausible
book-concepts for each of the nine rules — the migration itself is
mechanical once the references exist.

**Observable diff:** `pnpm reposcope --repo demo-repos/webapp-demo --strict`
changes from `11 findings, 2 grounded` to `11 findings, 11 grounded`.
Score goes from 0/100 to something meaningful.

**Why second:** closes the last ungrounded finding class in the webapp
profile. Until this ships, the profile splits into 2 grounded
`webapp-*` rules and 9 ungrounded `general-*` rules, so the grounding
story is incomplete for any repo that routes `webapp` and lacks
hygiene files — which is most repos on day one.

---

## 3. AST ingestion for Python/TypeScript (2 weeks)

**Gap closed:** "AST ingestion" + the honesty note at the bottom of
`V1_V2.md` ("regex detection is not AST detection").

**Current behavior:** every rule fires on a string pattern match in a
file. `iiot-002` ("Hardcoded PLC IP") fires when a regex hits
`\d+\.\d+\.\d+\.\d+` near `pymodbus` or `modbus` — it does not parse
the Python to check if the string is inside an assignment, a function
argument, or a config file. Semantic checks (data flow, schema
compatibility, idempotency) are impossible today.

**Change:**

1. Add `scripts/kg/ast_ingest.py` — parse Python via `ast` module,
   TypeScript via `tree-sitter-typescript` (or `@typescript-eslint/parser`
   piped through Node). Emit `(:AST_Node)` nodes with `{kind, file,
   line, name}` properties and `:PARENT_OF` edges.
2. For each rule in `dataops.yaml` / `iiot.yaml`, add an optional
   `ast_query:` block describing which AST pattern counts as a
   violation — e.g. `ast_query: "AssignmentValue(target=Name, value=Constant(str(ipaddress)))"`.
3. Rewrite `lib/dataops-audit.ts` and `lib/iiot-audit.ts` to prefer
   AST query results when available, fall back to regex otherwise.
4. Link `(:AST_Node)` to `(:Rule)` via `:VIOLATES` edges so graph
   traversals can explain *why* a rule fired, not just *where*.

**Effort:** ~2 weeks. The Python path is straightforward. The TypeScript
path is fiddly — `tree-sitter` bindings on Windows are a known source
of pain; may need a Node subprocess and JSON handoff.

**Observable diff:** `iiot-002` on a demo repo would no longer fire on
an IP literal inside a comment or a test fixture — only on real
assignments that reach production code. False-positive rate drops
measurably on the three demo repos.

**Why third:** biggest effort, but it's the credibility unlock. Every
enterprise audit conversation eventually asks "does it parse the code
or just grep it?" — right now the honest answer is "grep", and AST
changes that to "parse". Not needed for the meeting; needed before
the tool is taken seriously outside a demo.

---

## 4. Multi-agent pipeline (4+ weeks)

**Gap closed:** "Multi-agent pipeline" in `V1_V2.md`.

**Current behavior:** single-pass deterministic. Every finding is
`route -> filter -> audit -> ground`, no LLM in the loop, no agent
coordination, no second-pass review.

**Change:** introduce planner/auditor/reviewer agents per the agentic
GraphRAG blueprint:

- **Planner** reads the repo tree + router output, proposes an audit
  plan ("run dataops rules 1-22, then iiot 1-10 if `pymodbus` present,
  skip webapp if no `package.json`").
- **Auditor** executes the plan, produces findings, grounds each via
  Cypher.
- **Reviewer** takes findings + grounding, checks for false positives
  using the citation chain, and either upgrades a warning to error,
  downgrades an error to info, or emits `[REVIEWED]` annotation.

The reviewer is the interesting step: it uses the *citation* itself as
a signal. If a dataops rule fires but the grounded concept doesn't
match the code pattern, the reviewer proposes a new rule or a
narrowed trigger.

**Effort:** 4+ weeks. Needs a small model (7B-13B fine-tuned on
findings + groundings), a scoring function, and evaluation on the
demo repos + a held-out set of ~20 public repos.

**Observable diff:** `pnpm reposcope --strict` prints not just findings
+ groundings but also `[REVIEWED: confirmed]` / `[REVIEWED: suspected
false positive]` per finding, with a rationale drawn from the graph.

**Why fourth:** largest effort, least proven value. Deterministic
detection is a feature, not a limitation, for a compliance tool.
Adding an LLM to the loop is only worth it if the reviewer
demonstrably reduces false positives without introducing new ones.
That's a research question, not an engineering one — 4+ weeks of
build before the first reliable data point.

---

## Sequencing summary

| # | Workstream | Days | Gap closed | Demo impact |
|---|---|---|---|---|
| 1 | Router consumes IML | 2 | Routing | `iml-demo` routes 2 profiles |
| 2 | `general-*` migration | 3 | Grounding | `webapp-demo` 11/11 grounded |
| 3 | AST ingestion | 14 | Precision | False-positive rate drops |
| 4 | Multi-agent pipeline | 20+ | Review | `[REVIEWED]` annotations |

Workstreams 1 + 2 = 5 days and make every claim in the current
`V1_V2.md` literally true. Workstream 3 is the precision story.
Workstream 4 is the "GraphRAG" story — the project name — but should
not start until 1-3 are shipped and validated on more than four
demo repos.

---

## What this roadmap does NOT include

Items that come up in conversation but are not on the path:

- **Docker Compose / containerized Neo4j.** Neo4j runs as a local
  Windows service. Not a portability problem
  for the demo; a portability problem for CI. Deferred until CI actually
  needs Neo4j, which it does not today (only `pnpm kg:seed` /
  `pnpm kg:ground` need it, and neither runs in CI).
- **Web UI.** The Next.js app currently serves an empty landing page +
  two API routes (`/api/github`, `/api/insight`). A real UI showing
  findings + graph traversal is a separate product concern, not a
  V2 gap.
- **Multi-repo dashboards.** Same — product, not V2.
- **Custom rule authoring UI.** Rule files are YAML and hand-edited
  by design. A UI is V3 at the earliest.

If a stakeholder asks about any of these, the honest answer is "not on the
V2 roadmap because it's not a gap — it's a different product."

---

## Known classification gaps

### Semantic-rule classification gap

Semantic rules (`*-sem-*`) — currently `iiot-loto-sem-001` and
`webapp-csp-sem-001` — are executed at runtime by
`lib/semantic/runner.ts` from YAML source. The `scripts/triage_unknown_rules.py`
heuristic classifies rules by grepping for a quoted rule ID literal in
`lib/**/*.ts`. Semantic rules have no such literal, so they are marked
`draft` even though they are dispatched. This under-claims rather than
over-claims, which is the safe direction, but it is imprecise.

Reconcile in a dedicated pass:
- Either extend `triage_unknown_rules.py` to also scan `lib/semantic/`
  for YAML-sourced rule IDs, and decide what evidence counts as
  "implemented" for a runtime-dispatched rule.
- Or add an explicit `dispatch: semantic` field to the YAML schema so
  classification can branch on dispatch type instead of grepping.

---

## Tag index

- `week-1-gate-pass`: Week 1 gate first went green (pre-regression).
- `week-1-closure`: Week 1 gate re-verified after the rule-ID parity regression was fixed. This is the canonical Week 1 reference.
- `week-4-yml-layer1-live`: Week 4 YAML layer went live (pre-regression cleanup).
# RepoScope 🛡️

> **DataOps & Industrial Code Quality Gatekeeper**  
> Automated health-audit engine for public repositories, targeting Data Science, Analytics Engineering, and Industrial IoT (IIoT) pipelines.

<p align="center">
  <a href="https://github.com/esmaeilireza/RepoScope/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/esmaeilireza/RepoScope/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%20Pipeline" alt="CI Status" />
  </a>
  <a href="https://reposcope-ochre.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-Turbopack-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript%205.x-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/pnpm-9.15-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" />
  </a>
</p>

## 📖 Overview

RepoScope is an automated health-audit engine customized specifically for **Data Science, Analytics Engineering, and Industrial IoT (IIoT)** pipelines. It ensures codebases running critical models, SCADA integration logic, and Python microservices maintain production-grade compliance before merging.

Coming from an industrial automation and PLC background where runtime failure is not an option, I built RepoScope to bring deterministic health checks into data analytics and software workflows. Ambiguity in code readiness, broken pipelines, and unverified data references cause silent downstream failures. RepoScope automates repository integrity verification before code reaches production.

It doesn't just give you a score — it explains exactly **why** the health score is what it is, with actionable fixes.

---

<!-- README_STATUS_START -->
## Implementation Status (generated)

Generated from `public/knowledge/specs.json`. Do not edit this block by hand.

| Domain | Active | Draft | Unknown | Total |
|---|---:|---:|---:|---:|
| General (WebApp baseline) | 14 | 0 | 0 | 14 |
| DataOps | 11 | 0 | 0 | 11 |
| IIoT | 8 | 3 | 0 | 11 |
| WebApp | 2 | 3 | 0 | 5 |
| Cross-Domain | 2 | 0 | 0 | 2 |
| **Total** | **37** | **6** | **0** | **43** |

<!-- README_STATUS_END -->

All 37 active rules are enforced by contract tests in `__tests__/contract/` (violation → negative-control parity). The 6 draft rules are published in `docs/specs/` but not yet wired to checks; they are tracked in [`docs/V2_ROADMAP.md`](docs/V2_ROADMAP.md).

**The CLI Gate:** `npx --no-install reposcope --repo <path> [--strict]` exits non-zero on violations. This is the "gate" — a deterministic rule set that returns a signal your CI can act on, replacing manual audit checklists with executable YAML manifests. For a three-command walkthrough (violation → negative control → self-audit), see [`docs/DEMO.md`](docs/DEMO.md).

---

## ✨ Features

- **📊 DataOps Compliance Check** — Validates notebook clean-state, large dataset leakages, deterministic dependency resolution (Poetry/Pipfile/Conda-lock), and dbt schema tests.
- **⚙️ Deterministic Testing & IIoT Mock Integrity** — Verifies CI/CD pipelines for mock validation protocols (Modbus/SCADA simulations, OOM detection, pytest assertions).
- **🧭 Comprehensive Repository Audit** — Section-by-section evaluation mirroring GitHub's navigation (Code, Issues, PRs, Actions, Security, and more).
- **📝 Smart README Link Checker** — Heuristic classifier (`lib/link-classifier.ts`) that validates Markdown links, images, and relative paths; skips external URLs, API endpoints, HTML tags, and placeholders.
- **🧠 Knowledge-Grounded AI (Citation Gate)** — AI insights are grounded in a structured knowledge graph (`public/knowledge/graph.json`): findings map to rules, rules map to concepts and book chapters. The Citation Gate module (`lib/knowledge/citation-gate.ts`) filters LLM output against the canonical book/standard registry before display.
- **🕸️ Interactive Knowledge Graph** — A browser-based visualization of the knowledge graph is available at [`graphify-out/graph.html`](graphify-out/graph.html).
- **🤖 Actions Diagnostics** — Modules in `lib/github-diagnostics.ts` and `lib/github-error-patterns.ts` parse failed GitHub Actions logs and classify root causes (data pipeline, OT driver, web build).
- **🔐 Secure GitHub Proxy & BYOK** — AI requests are routed through a Next.js API route with rate limiting (`lib/rate-limiter.ts`). Provider adapters for LLM backends live in `lib/llm/providers.ts`.

---

## 🎯 Audit Profiles

RepoScope supports three specialized audit profiles, each with tailored rules and scoring weights:

| Profile | Target Use Case | Key Checks | Active Tabs |
|---------|-----------------|------------|-------------|
| **DataOps & Analytics** | Data science, dbt, analytics engineering | Notebook hygiene, DVC/LFS tracking, lockfile presence, dbt tests | Findings, Data Pipeline, Tree, README |
| **Industrial / PLC (IIoT)** | SCADA, Modbus, OT systems | Mock server integrity, deterministic execution, driver tests | Findings, IIoT / PLC, Tree, README |
| **General Web App** | Standard web projects | CI/CD, README, deployment, dependencies | Findings, Tree, README |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- pnpm 8+ (or npm/yarn)
- Python 3.9+ (for knowledge graph and spec building)

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/esmaeilireza/RepoScope.git
cd RepoScope

# Deterministic install
pnpm install --frozen-lockfile

# Start development server
pnpm dev
```

Open http://localhost:3000, paste any GitHub repository URL (e.g., `https://github.com/vercel/next.js`), select an Audit Profile, and click **Analyze Repository**.

### CLI Usage

Run the deterministic audit engine directly in your terminal to act as a CI gate:

```bash
# Run the CLI (using local installation)
npx --no-install reposcope --repo . --strict

# Or run the full audit suite locally
# (npm audit, README status check, SBOM, ESLint, Next build)
pnpm audit:all
```

### Quality & Audit Scripts

```bash
pnpm typecheck          # Run TypeScript compiler (0 errors)
pnpm build              # Production build + builds specs.json
pnpm lint               # Run ESLint
pnpm readme:status      # Generate README implementation-status block from specs.json
pnpm readme:check       # Fail if README status block is stale or specs contain unknown statuses
python scripts/verify_claims.py    # Verify all public claims against the codebase
pnpm verify:registry    # Verify knowledge graph integrity
```

---

## 🧠 Knowledge-Grounded AI & Citation Gate

RepoScope reduces LLM hallucination by grounding every AI insight in a curated knowledge graph (rule → concept → exact book chapter) instead of trusting the model's memory.

- **Graph Construction:** Engineering books and standards are processed with a local LLM (Ollama, `qwen2.5:7b`) to extract concepts and build `public/knowledge/graph.json`.
- **Context Assembly:** Findings are mapped to YAML rules, rules to concepts, concepts to the exact book chapter. Each finding carries its knowledge provenance.
- **Citation Gate** (`lib/knowledge/citation-gate.ts`): Before an AI response is shown to the user, it is scanned. Any sentence containing "page 42" or "according to [Author]" that does not also cite a known book from `lib/knowledge/books.ts` is stripped and replaced with `[source unverified]`.

**Roadmap:** chunk-level retrieval from the graph into the LLM prompt (GraphRAG-style RAG). Citation grounding is shipped; prompt-time retrieval is not, yet.

You can read more about this in the [Methodology ADR](docs/methodology.md) and the [Knowledge Index](docs/knowledge-index.md).

---

## 🔑 GitHub Token & AI BYOK (Optional)

RepoScope works without a token for public repositories (60 requests/hour limit). For higher limits or private repositories:

Create a `.env` file in the project root:

```env
GITHUB_TOKEN=ghp_your_token_here
DEFAULT_AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

Or use the **Advanced Settings** section in the UI to provide a token or AI key per-session (BYOK). The token is sent only to the local proxy and never stored.

| Mode | GitHub Requests/Hour | AI Requests/Day |
|---|---|---|
| Without token (Server default) | 60 | 5 (rate-limited) |
| With token / BYOK | 5,000 | Unlimited (you pay provider) |

---

## 🧭 What Gets Audited

### Repository Health Checks

Includes presence and quality of README, LICENSE, CI/CD workflows, Tests, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md, `.editorconfig`, and Dependabot config. It also checks for stale branches, open PRs, and open issues.

### DataOps & IIoT Specific Checks

| Category | What is Checked |
|---|---|
| Data Leakage | Raw `.csv`, `.parquet`, `.db`, `.pkl` files tracked without DVC/Git-LFS |
| Environment Parity | Presence of `poetry.lock`, `Pipfile.lock`, `requirements.lock`, `conda-lock.yml` |
| Notebook Hygiene | Out-of-order cell execution, bloated output cells (>200KB) |
| Industrial Mocks | Modbus/SCADA mock server configuration, connection error patterns |
| Memory Safety | OOM patterns (`MemoryError`, exit code 137, CUDA OOM) |

### README Link Validation (Heuristic-Based)

The audit engine uses a heuristic classifier (`lib/link-classifier.ts`) to validate README links:

- **External URLs** (`github.com`, `arxiv.org`): ✅ Skipped.
- **File Paths** (`src/app.py`, `backend/weights/model.pt`): ✅ Validated against repo tree.
- **HTML Tags** (`</td>`, `</table>`): ✅ Skipped (not links).
- **API Endpoints** (`/predict`, `/chat`): ⚠️ Flagged for manual review.
- **Placeholders/Dates/Hex Colors**: ✅ Skipped.

---

## 🧮 Health Score

The health score is computed from findings using severity weights that are defined and tested in the scoring module. Exact weight values live in code; if the code and this document disagree, the code is authoritative. Every deduction appears in the **"Why this score?"** panel along with its probable cause and a concrete fix suggestion.

| Severity | Examples |
|---|---|
| Critical | No README, No LICENSE, Unmanaged raw datasets |
| Error | No CI/CD, No tests, Loose dependency specs |
| Warning | No SECURITY.md, >15 open PRs, Notebook hygiene issues |
| Info | No Dependabot, No CONTRIBUTING, No CHANGELOG |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, Python 3 (KG pipeline) |
| UI | React 18 (deprecated in Next.js 16; migration planned), Tailwind CSS 3.4 |
| API | GitHub REST API v3, Ollama (Local), LLM provider adapters (`lib/llm/providers.ts`) |
| Visualization | Standalone HTML graph viewer (`graphify-out/graph.html`) |
| Package Manager | pnpm 9 |
| CI/CD | GitHub Actions |
| Deployment | Vercel |

> **Note:** React 18 support is deprecated in Next.js 16. The project currently runs on React 18; an upgrade to React 19 is planned. Verify against the Next.js documentation and React documentation before changing versions.

---

## 📂 Project Structure

<div align="center">
  <img src="./docs/structure.svg" alt="RepoScope Codebase Map" width="100%" style="max-width: 900px;" />
</div>

<details>
<summary><b>Click to expand the full text directory tree</b></summary>

```text
📁 my-reposcope-app
├── 🧪 __tests__
│   ├── 🗂️ broken-dbt
│   │   └── 📁 models
│   │       └── 📁 marts
│   ├── 🧪 contract
│   │   ├── 🧪 spec-parity.test.ts
│   │   └── 🧪 yaml-spec-parity.test.ts
│   ├── 🗂️ fixed-dbt
│   │   ├── 📁 models
│   │   │   └── 📁 marts
│   │   └── 🧾 dbt_project.yml
│   ├── 🗂️ fixtures
│   │   ├── 🗂️ broken-dbt
│   │   │   ├── 📁 models
│   │   │   └── 📁 tests
│   │   └── 🗂️ semantic
│   │       ├── 📁 dataops-data-product-sem-001
│   │       ├── 📁 dataops-dim-sem-001
│   │       ├── 📁 dataops-runbook-sem-001
│   │       ├── 📁 iiot-loto-sem-001
│   │       └── 📁 webapp-csp-sem-001
│   ├── 🧪 unit
│   │   └── 🧪 glob.test.ts
│   ├── 🧪 audit.test.ts
│   ├── 🧪 graph-grounding.test.ts
│   ├── 🧪 graph-spec.test.ts
│   ├── 🧪 llm-layer.test.ts
│   ├── 🧪 specs.test.ts
│   └── 🧪 test_specs.py
├── 📁 app
│   ├── 🔌 api
│   │   ├── 🔌 github
│   │   │   └── 🔷 route.ts
│   │   └── 🔌 insight
│   │       └── 🔷 route.ts
│   ├── 🎨 globals.css
│   ├── ⚛️ icon.tsx
│   ├── ⚛️ layout.tsx
│   ├── ⚛️ page.tsx
│   └── 🔷 sitemap.ts
├── 📁 bin
│   └── 🚀 reposcope
├── 🧩 components
│   ├── 🎨 ui
│   │   └── ⚛️ Card.tsx
│   ├── ⚛️ ActionsDashboard.tsx
│   ├── ⚛️ ActionsPanel.tsx
│   ├── ⚛️ AIInsight.tsx
│   ├── ⚛️ AuditTabs.tsx
│   ├── ⚛️ Board.tsx
│   ├── ⚛️ CommandBlock.tsx
│   ├── ⚛️ ErrorCard.tsx
│   ├── ⚛️ ExportButtons.tsx
│   ├── ⚛️ RepoInput.tsx
│   ├── ⚛️ ScoreBoard.tsx
│   ├── ⚛️ SmartDiagnosis.tsx
│   ├── ⚛️ StatusBadge.tsx
│   └── ⚛️ TokenInput.tsx
├── 📚 docs
│   ├── 📁 architecture
│   │   └── 📝 V1_V2.md
│   ├── 📁 checklists
│   │   ├── 📝 cross.md
│   │   ├── 📝 dataops.md
│   │   ├── 📝 general.md
│   │   ├── 📝 iiot.md
│   │   └── 📝 webapp.md
│   ├── 📁 network
│   │   └── 📝 topology.md
│   ├── 📓 notes
│   │   ├── 📁 dataops
│   │   │   ├── 📝 analytics-engineering-with-sql-and-dbt.md
│   │   │   ├── 📝 data-management-at-scale.md
│   │   │   ├── 📝 data-quality-fundamentals.md
│   │   │   ├── 📝 designing-data-intensive-applications.md
│   │   │   ├── 📝 fundamentals-of-data-engineering.md
│   │   │   ├── 📝 practical-dataops.md
│   │   │   └── 📝 the-data-warehouse-toolkit.md
│   │   ├── 📁 graph-rag
│   │   │   ├── 📝 agentic-graphrag.md
│   │   │   ├── 📝 essential-graphrag.md
│   │   │   ├── 📝 graph-algorithms.md
│   │   │   ├── 📝 graph-databases.md
│   │   │   └── 📝 graph-powered-machine-learning.md
│   │   ├── 📁 iiot
│   │   │   ├── 📝 automating-manufacturing-systems-with-plcs.md
│   │   │   ├── 📝 industrial-network-security.md
│   │   │   ├── 📝 opc-unified-architecture.md
│   │   │   ├── 📝 plc-controls-with-structured-text.md
│   │   │   └── 📝 practical-industrial-data-networks.md
│   │   ├── 📁 industrial-ml
│   │   │   ├── 📁 01-realtime-streams
│   │   │   ├── 📁 02-iiot-edge-digital-twins
│   │   │   ├── 📁 03-time-series-sensor-analytics
│   │   │   └── 📁 04-industrial-mlops
│   │   └── 📁 webapp
│   │       ├── 📝 api-design-patterns.md
│   │       ├── 📝 building-microservices.md
│   │       ├── 📝 clean-architecture.md
│   │       ├── 📝 continuous-delivery.md
│   │       ├── 📝 designing-web-apis.md
│   │       ├── 📝 production-ready-microservices.md
│   │       ├── 📝 site-reliability-engineering.md
│   │       ├── 📝 the-devops-handbook.md
│   │       └── 📝 web-application-security.md
│   ├── 📁 safety
│   │   └── 📝 loto.md
│   ├── 📐 specs
│   │   ├── 📁 _archive
│   │   │   ├── 🧾 cross.yaml
│   │   │   └── 🧾 general.yaml
│   │   ├── 🧾 _graph.yaml
│   │   ├── 🧾 _schema.yaml
│   │   ├── 🧾 cross.yaml
│   │   ├── 🧾 dataops.yaml
│   │   ├── 🧾 general.yaml
│   │   ├── 🧾 iiot.yaml
│   │   └── 🧾 webapp.yaml
│   ├── 📝 attribution.md
│   ├── 📝 audit-use-cases.md
│   ├── 🧾 claims.yaml
│   ├── 📝 DEMO.md
│   ├── 📝 knowledge-index.md
│   ├── 📝 methodology.md
│   ├── 🖼️ structure.svg
│   ├── 📝 token-handling.md
│   └── 📝 V2_ROADMAP.md
├── 🪝 hooks
│   ├── 🔷 useAIDiagnosis.ts
│   └── 🔷 useGitHubActions.ts
├── 🧰 lib
│   ├── 🧠 knowledge
│   │   ├── 🔷 books.ts
│   │   ├── 🔷 citation-gate.ts
│   │   ├── 🔷 deterministic.ts
│   │   ├── 🔷 graph.ts
│   │   ├── 🔷 grounding-renderer.ts
│   │   ├── 🔷 neo4j-client.ts
│   │   ├── 🔷 semantic-cache.ts
│   │   ├── 🔷 standards.ts
│   │   └── 🔷 structural.ts
│   ├── 🤖 llm
│   │   ├── 🔷 adapters.ts
│   │   ├── 🔷 client.ts
│   │   ├── 🔷 ollama.ts
│   │   └── 🔷 providers.ts
│   ├── 🧬 semantic
│   │   ├── 🔷 resolver.ts
│   │   └── 🔷 runner.ts
│   ├── 🔷 anomaly-detector.ts
│   ├── 🔷 audit-orchestrator.ts
│   ├── 🔷 audit.ts
│   ├── 🔷 config.ts
│   ├── 🔷 dataops-audit.ts
│   ├── 🔷 environment-parity.ts
│   ├── 🔷 export.ts
│   ├── 🔷 findings-dedupe.ts
│   ├── 🔷 github-auto-fix.ts
│   ├── 🔷 github-diagnostics.ts
│   ├── 🔷 github-error-patterns.ts
│   ├── 🔷 github-health-monitor.ts
│   ├── 🔷 github-log-parser.ts
│   ├── 🔷 github.ts
│   ├── 🔷 iiot-audit.ts
│   ├── 🔷 insight.ts
│   ├── 🔷 link-classifier.ts
│   ├── 🔷 profiles.ts
│   ├── 🔷 rate-limiter.ts
│   ├── 🔷 sbom-generator.ts
│   ├── 🔷 types.ts
│   └── 🔷 utils.ts
├── 🚚 migrations
│   └── 📝 README.md
├── 🌍 public
│   ├── 🧠 knowledge
│   │   ├── 📋 graph.json
│   │   └── 📋 specs.json
│   ├── 🌐 googlea4e112c226b2506e.html
│   ├── 🖼️ og-image.png
│   ├── 📌 robots.txt
│   └── 📋 site.webmanifest
├── 🧾 schemas
│   └── 📊 events.avsc
├── 🛠️ scripts
│   ├── 🚦 gates
│   │   └── ⚡ check-grounded-claims.sh
│   ├── 🕸️ kg
│   │   ├── 🐍 __init__.py
│   │   ├── 📋 aliases.json
│   │   ├── 🐍 assemble_graph.py
│   │   ├── 🐍 extract.py
│   │   ├── 🐍 ground.py
│   │   ├── 📝 knowledge-index.md
│   │   ├── 🐍 neo4j_export.py
│   │   ├── 🐍 neo4j_import.py
│   │   ├── 🐍 neo4j_validate.py
│   │   ├── 🐍 parse_sql_ast.py
│   │   ├── 🟨 parse_ts_ast.mjs
│   │   ├── 📝 README.md
│   │   ├── 📌 requirements.txt
│   │   ├── 🐍 route_knowledge.py
│   │   ├── 🔐 schema.cypher
│   │   ├── 🐍 seed.py
│   │   └── 🐍 validate_graph.py
│   ├── 🐍 build_knowledge.py
│   ├── 🔷 check-spec-parity.ts
│   ├── 🟨 check-structure.mjs
│   ├── 🐍 diagnose.py
│   ├── 🐍 evaluate_claims.py
│   ├── 🐍 fix_notes_metadata.py
│   ├── 🟨 generate-sbom.mjs
│   ├── 🐍 industrial_ml_filter.py
│   ├── ⚡ lock-to-mistral.sh
│   ├── ⚡ next-steps.sh
│   ├── 🐍 render_checklists.py
│   ├── 🔷 reposcope-audit.ts
│   ├── 🐍 route_repo.py
│   ├── 🔷 semantic-calibrate.ts
│   ├── 🔷 semantic-debug.ts
│   ├── 🔷 semantic-reset-cache.ts
│   ├── 🐍 verify_claims.py
│   └── 🔷 verify-knowledge-registry.ts
├── 📝 CHANGELOG.md
├── ⚡ collect-reposcope-context.sh
├── 📝 CONTRIBUTING.md
├── ⚙️ eslint.config.mjs
├── 📋 graph.json
├── 📜 LICENSE
├── 🔷 next-env.d.ts
├── ⚙️ next.config.js
├── ⚙️ package.json
├── 📦 pnpm-lock.yaml
├── 📦 pnpm-workspace.yaml
├── ⚙️ postcss.config.js
├── 📝 PROJECT_STRUCTURE.md
├── ⚙️ pytest.ini
├── 📝 README.md
├── 🚀 reposcope-check.sh
├── 📌 requirements.txt
├── 📝 SECURITY.md
├── ⚙️ tailwind.config.ts
└── ⚙️ tsconfig.json
```

</details>

---

## 🕸️ Knowledge Graph Visualization

<p align="center">
  <a href="https://reposcope-ochre.vercel.app/graphify-out/graph.html">
    <img src="docs/graph-preview.png" alt="RepoScope Knowledge Graph preview" width="100%" style="max-width: 900px;" />
  </a>
</p>

<p align="center">
  🔗 <a href="https://reposcope-ochre.vercel.app/graphify-out/graph.html"><strong>Open the interactive knowledge graph →</strong></a>
</p>
---

## 🤝 Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

**Good first issues:**

- Video production & walkthroughs
- Technical writing & UX documentation
- DataOps rule expansion (dbt, Great Expectations, Pandera)
- Industrial protocol mocking (Modbus, OPC-UA, MQTT)

---

## 📄 License & Security

This project is licensed under the MIT License — see the [`LICENSE`](LICENSE) file for details.

For security issues, please read [`SECURITY.md`](SECURITY.md) for responsible disclosure guidelines.

<div align="center">

Built with ❤️ by **Reza Esmaeili** and **Abbas Lotfi**

RepoScope — Bringing industrial-grade deterministic quality gates to DataOps, IIoT, and modern software pipelines.

</div>
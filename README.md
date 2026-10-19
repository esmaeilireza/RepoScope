Here is the fully updated `README.md` with the SVG codebase map integrated into the "Project Structure" section. 

I placed the SVG right below the section header so it acts as a beautiful visual map, followed by your collapsible text-based directory tree for detailed reference.

### The Updated `README.md`

```markdown
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
  <img src="https://img.shields.io/badge/Next.js%2014-Turbopack-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
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

It doesn't just give you a score—it explains exactly **why** the health score is what it is, with actionable fixes.

---

## 📊 Implementation Status (Oct 2026)

**Honest Engineering:** 22 of 47 YAML rules currently fire in the audit engine. The remaining 25 are marked `status: draft` in `docs/specs/*.yaml` (declared as roadmap, not yet wired to checks). This gap is strictly enforced by our test suite (`test_active_rules_are_all_implemented_in_typescript`).

| Domain | Active Rules | Draft Rules |
|---|---|---|
| General (WebApp baseline) | 14 | 0 |
| DataOps | 5 | 19 |
| IIoT | 4 | 2 |
| Cross-Domain | 0 | 2 |
| WebApp | 0 | 2 |

**The CLI Gate:** `npx --no-install reposcope --repo <path> [--strict]` exits non-zero on violations. This is the "gate" — a deterministic rule set that returns a signal your CI can act on, replacing manual markdown checklists with executable YAML manifests.

---

## ✨ Features

- **📊 DataOps Compliance Check** — Validates notebook clean-state, large dataset leakages, deterministic dependency resolution (Poetry/Pipfile/Conda-lock), and dbt schema tests.
- **⚙️ Deterministic Testing & IIoT Mock Integrity** — Verifies CI/CD pipelines for mock validation protocols (Modbus/SCADA simulations, OOM detection, pytest assertions).
- **🧭 Comprehensive Repository Audit** — Section-by-section evaluation mirroring GitHub's navigation (Code, Issues, PRs, Actions, Security, and more).
- **📝 Smart README Link Checker** — A heuristic-based classifier that validates every Markdown link, image, and relative path; intelligently skips external URLs, API endpoints, HTML tags, and placeholders.
- **🧠 Knowledge-Grounded AI (GraphRAG)** — AI insights are grounded in a structured knowledge graph (`public/knowledge/graph.json`). A **Citation Gate** strips any LLM claim referencing a page or author unless it exists in the canonical book/standard registry.
- **🤖 AI-Powered Actions Diagnostics** — Analyzes failed GitHub Actions runs, identifies root causes (data pipeline, OT driver, web build), and provides one-click fix commands.
- **🔐 Secure GitHub Proxy & BYOK** — All AI requests go through a Next.js API route with rate limiting. Supports Bring Your Own Key (BYOK) for 12+ providers (Groq, Google, OpenAI, Anthropic, etc.).

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

Open [http://localhost:3000](http://localhost:3000), paste any GitHub repository URL (e.g., `https://github.com/vercel/next.js`), select an **Audit Profile**, and click **Analyze Repository**.

### CLI Usage

Run the deterministic audit engine directly in your terminal to act as a CI gate:

```bash
# Run the CLI (using local installation)
npx --no-install reposcope --repo . --strict

# Or run the full audit suite locally (TypeScript, Lint, Build)
pnpm audit:all
```

### Quality & Audit Scripts

```bash
pnpm typecheck          # Run TypeScript compiler (0 errors)
pnpm build              # Production build + builds specs.json
pnpm lint               # Run ESLint
python scripts/verify_claims.py    # Verify all public claims against the codebase
pnpm verify:registry    # Verify knowledge graph integrity
```

---

## 🧠 Knowledge-Grounded AI & Citation Gate

RepoScope avoids LLM hallucinations by using a **GraphRAG** architecture instead of standard vector embeddings. 

1. **Graph Construction:** PDFs are processed via Ollama (`qwen2.5:7b`) to extract concepts and build `public/knowledge/graph.json`.
2. **Context Assembly:** Findings are mapped to YAML rules, which map to concepts, which map to the exact book chapter.
3. **Citation Gate (`lib/knowledge/citation-gate.ts`):** Before the AI response is shown to the user, it is scanned. Any sentence containing "page 42" or "according to [Author]" that *does not* also cite a known book from `lib/knowledge/books.ts` is stripped and replaced with `[source unverified]`.

You can read more about this in the [Methodology ADR](docs/methodology.md) and the [Knowledge Index](docs/knowledge-index.md).

---

## 🔑 GitHub Token & AI BYOK (Optional)

RepoScope works **without a token** for public repositories (60 requests/hour limit). For higher limits or private repositories:

1. Create a `.env` file in the project root:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   DEFAULT_AI_PROVIDER=groq
   GROQ_API_KEY=gsk_your_key_here
   ```
2. Or use the **Advanced Settings** section in the UI to provide a token or AI key per-session (BYOK). The token is sent only to the local proxy and never stored.

| Mode | GitHub Requests/Hour | AI Requests/Day |
|------|----------------------|-----------------|
| Without token (Server default) | 60 | 5 (rate-limited) |
| With token / BYOK | 5,000 | Unlimited (you pay provider) |

---

## 🧭 What Gets Audited

### Repository Health Checks
Includes presence and quality of README, LICENSE, CI/CD workflows, Tests, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md, .editorconfig, and Dependabot config. It also checks for stale branches, open PRs, and open issues.

### DataOps & IIoT Specific Checks

| Category | What is Checked |
|----------|-----------------|
| **Data Leakage** | Raw `.csv`, `.parquet`, `.db`, `.pkl` files tracked without DVC/Git-LFS |
| **Environment Parity** | Presence of `poetry.lock`, `Pipfile.lock`, `requirements.lock`, `conda-lock.yml` |
| **Notebook Hygiene** | Out-of-order cell execution, bloated output cells (>200KB) |
| **Industrial Mocks** | Modbus/SCADA mock server configuration, connection error patterns |
| **Memory Safety** | OOM patterns (`MemoryError`, exit code 137, CUDA OOM) |

### README Link Validation (Heuristic-Based)
The audit engine uses a stable heuristic classifier to validate README links:
- **External URLs** (`github.com`, `arxiv.org`): ✅ Skipped.
- **File Paths** (`src/app.py`, `backend/weights/model.pt`): ✅ Validated against repo tree.
- **HTML Tags** (`/td`, `/table`): ✅ Skipped (not links).
- **API Endpoints** (`/predict`, `/chat`): ⚠️ Flagged as suspicious.
- **Placeholders/Dates/Hex Colors**: ✅ Skipped.

---

## 🧮 Health Score Calculation

$$\text{Score} = 100 - \left( 20 \times \text{Critical} + 15 \times \text{Error} + 10 \times \text{Warning} + 2 \times \text{Info} \right)$$

| Severity | Weight | Examples |
|----------|--------|----------|
| **Critical** | -20 pts | No README, No LICENSE, Unmanaged raw datasets |
| **Error** | -15 pts | No CI/CD, No tests, Loose dependency specs |
| **Warning** | -10 pts | No SECURITY.md, >15 open PRs, Notebook hygiene issues |
| **Info** | -2 pts | No Dependabot, No CONTRIBUTING, No CHANGELOG |

Every deduction appears in the **"Why this score?"** panel along with its probable cause and a concrete fix suggestion.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5, Python 3 (KG Pipeline) |
| **UI** | React 18, Tailwind CSS 3.4 |
| **API** | GitHub REST API v3, Ollama (Local), 12+ LLM Providers |
| **Package Manager** | pnpm 9 |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel |

---

## 📂 Project Structure

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width: 900px;" viewBox="0 0 900 946" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" role="img" aria-label="Codebase map of RepoScope">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="48%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#eef2f7"/>
    </linearGradient>

    <linearGradient id="bgGradDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="55%" stop-color="#101a2e"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>

    <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d0d7de"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>

    <linearGradient id="frameGradDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22314e"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>

    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <linearGradient id="titleGradDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e6edf3"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>

    <radialGradient id="vignetteLight" cx="50%" cy="42%" r="78%">
      <stop offset="58%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.055"/>
    </radialGradient>

    <radialGradient id="vignetteDark" cx="50%" cy="42%" r="78%">
      <stop offset="58%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.24"/>
    </radialGradient>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#0b1220" flood-opacity="0.10"/>
    </filter>

    <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.1" flood-color="#0b1220" flood-opacity="0.13"/>
    </filter>

    <filter id="dotGlowDark" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.35"/>
    </filter>

    <pattern id="dotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.85" fill="#0f172a" fill-opacity="0.035"/>
    </pattern>

    <pattern id="dotGridDark" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.85" fill="#e6edf3" fill-opacity="0.045"/>
    </pattern>
  </defs>

  <style>
    .bg { fill: url(#bgGrad); }
    .frame { stroke: url(#frameGrad); stroke-width: 1.25; filter: url(#softShadow); }
    .dir { fill: none; stroke: #d0d7de; stroke-opacity: 0.48; stroke-width: 1; stroke-dasharray: 5 6; stroke-linecap: round; }
    .fileln { stroke: #ffffff; stroke-opacity: 0.78; paint-order: stroke fill; filter: url(#dotGlow); }
    .txt { fill: #475569; font-weight: 600; letter-spacing: 0.015em; paint-order: stroke fill; stroke: #ffffff; stroke-width: 2.75; stroke-opacity: 0.82; }
    .title { fill: url(#titleGrad); font-weight: 800; letter-spacing: -0.02em; paint-order: stroke fill; stroke: #ffffff; stroke-width: 3.5; stroke-opacity: 0.78; }
    .mark { fill: #64748b; font-weight: 700; letter-spacing: 0.01em; paint-order: stroke fill; stroke: #ffffff; stroke-width: 2.5; stroke-opacity: 0.78; }
    .mark-pill { fill: rgba(255, 255, 255, 0.72); stroke: rgba(203, 213, 225, 0.90); stroke-width: 1; filter: url(#softShadow); }
    .legend-card { fill: rgba(255, 255, 255, 0.78); stroke: rgba(203, 213, 225, 0.92); stroke-width: 1; filter: url(#softShadow); }
    .grid-light { display: block; fill: url(#dotGrid); }
    .grid-dark { display: none; fill: url(#dotGridDark); }
    .vignette { fill: url(#vignetteLight); pointer-events: none; }

    @media (prefers-color-scheme: dark) {
      .bg { fill: url(#bgGradDark); }
      .frame { stroke: url(#frameGradDark); }
      .dir { stroke: #22314e; stroke-opacity: 0.58; }
      .fileln { stroke: #0b1220; stroke-opacity: 0.72; filter: url(#dotGlowDark); }
      .txt { fill: #94a3b8; stroke: #0b1220; stroke-opacity: 0.86; }
      .title { fill: url(#titleGradDark); stroke: #0b1220; }
      .mark { fill: #8b949e; stroke: #0b1220; }
      .mark-pill { fill: rgba(16, 26, 46, 0.72); stroke: rgba(34, 49, 78, 0.95); }
      .legend-card { fill: rgba(16, 26, 46, 0.72); stroke: rgba(34, 49, 78, 0.95); }
      .grid-light { display: none; }
      .grid-dark { display: block; }
      .vignette { fill: url(#vignetteDark); }
    }
  </style>

  <title>RepoScope</title>

  <rect class="bg frame" x="0.5" y="0.5" width="899" height="945" rx="8"/>
  <rect class="grid grid-light" x="0.5" y="0.5" width="899" height="945" rx="8" pointer-events="none"/>
  <rect class="grid grid-dark" x="0.5" y="0.5" width="899" height="945" rx="8" pointer-events="none"/>
  <rect class="vignette" x="0.5" y="0.5" width="899" height="945" rx="8" pointer-events="none"/>
  
  <rect x="14" y="32" width="92" height="3" rx="1.5" fill="url(#accentGrad)"/>

  <g id="map-clusters">
    <circle class="dir" cx="350" cy="510" r="260"/>
    <text class="txt" x="350" y="245" text-anchor="middle" font-size="14">docs</text>
    
    <g class="fileln">
      <circle cx="430" cy="390" r="18" fill="#6a9fb5"/><circle cx="460" cy="380" r="18" fill="#6a9fb5"/><circle cx="445" cy="420" r="18" fill="#6a9fb5"/>
      <circle cx="390" cy="450" r="22" fill="#6a9fb5"/><circle cx="420" cy="470" r="22" fill="#6a9fb5"/><circle cx="470" cy="460" r="22" fill="#6a9fb5"/>
      <circle cx="370" cy="540" r="22" fill="#6a9fb5"/><circle cx="400" cy="550" r="22" fill="#6a9fb5"/><circle cx="430" cy="540" r="22" fill="#6a9fb5"/><circle cx="410" cy="580" r="22" fill="#6a9fb5"/>
      <circle cx="450" cy="600" r="22" fill="#6a9fb5"/><circle cx="480" cy="620" r="22" fill="#6a9fb5"/><circle cx="430" cy="640" r="22" fill="#6a9fb5"/>
      <circle cx="310" cy="630" r="22" fill="#6a9fb5"/><circle cx="340" cy="640" r="22" fill="#6a9fb5"/><circle cx="370" cy="640" r="22" fill="#6a9fb5"/><circle cx="340" cy="670" r="22" fill="#6a9fb5"/>
      
      <circle cx="140" cy="660" r="26" fill="#cb171e"/>
      <circle cx="115" cy="690" r="14" fill="#cb171e"/>
      <circle cx="140" cy="705" r="14" fill="#cb171e"/>
      <circle cx="165" cy="685" r="14" fill="#cb171e"/>
      <circle cx="170" cy="640" r="20" fill="#6a9fb5"/>
      <circle cx="190" cy="665" r="10" fill="#6a9fb5"/><circle cx="200" cy="680" r="10" fill="#6a9fb5"/>
    </g>

    <circle class="dir" cx="440" cy="150" r="100"/>
    <text class="txt" x="440" y="60" text-anchor="middle" font-size="14">scripts</text>
    
    <g class="fileln">
      <circle cx="385" cy="140" r="14" fill="#3178c6"/><circle cx="410" cy="130" r="14" fill="#3178c6"/><circle cx="390" cy="160" r="14" fill="#3178c6"/>
      <circle cx="415" cy="160" r="8" fill="#3178c6"/><circle cx="370" cy="155" r="8" fill="#3178c6"/>
      <circle cx="460" cy="120" r="20" fill="#3572a5"/><circle cx="490" cy="130" r="14" fill="#3572a5"/><circle cx="470" cy="160" r="20" fill="#3572a5"/>
      <circle cx="500" cy="160" r="10" fill="#3572a5"/>
      <circle cx="395" cy="175" r="6" fill="#cbcb41"/>
    </g>

    <circle cx="600" cy="150" r="55" fill="#cb171e" class="fileln"/>
    
    <circle class="dir" cx="770" cy="230" r="80"/>
    <text class="txt" x="770" y="175" text-anchor="middle" font-size="14">public</text>
    
    <g class="fileln">
      <circle cx="750" cy="195" r="16" fill="#a074c4"/>
      <circle cx="750" cy="245" r="22" fill="#cbcb41"/>
      <circle cx="805" cy="245" r="22" fill="#cbcb41"/>
    </g>

    <circle class="dir" cx="680" cy="370" r="65"/>
    <text class="txt" x="680" y="325" text-anchor="middle" font-size="14">components</text>
    
    <g class="fileln">
      <circle cx="650" cy="350" r="12" fill="#3178c6"/><circle cx="680" cy="345" r="16" fill="#3178c6"/><circle cx="710" cy="355" r="10" fill="#3178c6"/>
      <circle cx="660" cy="380" r="14" fill="#3178c6"/><circle cx="690" cy="385" r="18" fill="#3178c6"/><circle cx="720" cy="380" r="12" fill="#3178c6"/>
      <circle cx="680" cy="410" r="10" fill="#3178c6"/>
      <circle cx="635" cy="380" r="8" fill="#cb171e"/>
    </g>

    <circle class="dir" cx="720" cy="510" r="115"/>
    <text class="txt" x="720" y="420" text-anchor="middle" font-size="14">lib</text>
    
    <g class="fileln">
      <circle cx="740" cy="520" r="30" fill="#3178c6"/>
      <circle cx="690" cy="480" r="14" fill="#3178c6"/><circle cx="720" cy="470" r="12" fill="#3178c6"/><circle cx="760" cy="480" r="16" fill="#3178c6"/>
      <circle cx="670" cy="510" r="10" fill="#3178c6"/><circle cx="695" cy="520" r="8" fill="#3178c6"/>
      <circle cx="690" cy="550" r="22" fill="#3178c6"/><circle cx="730" cy="570" r="18" fill="#3178c6"/>
      <circle cx="770" cy="540" r="14" fill="#3178c6"/><circle cx="780" cy="510" r="12" fill="#3178c6"/>
      <circle cx="710" cy="590" r="10" fill="#3178c6"/>
    </g>

    <circle class="dir" cx="630" cy="215" r="45"/>
    <text class="txt" x="630" y="225" text-anchor="middle" font-size="14">app</text>
    <g class="fileln">
      <circle cx="615" cy="215" r="8" fill="#3178c6"/><circle cx="640" cy="210" r="12" fill="#3178c6"/><circle cx="630" cy="235" r="8" fill="#3178c6"/>
    </g>

    <circle class="dir" cx="560" cy="240" r="45"/>
    <text class="txt" x="540" y="215" text-anchor="middle" font-size="14">__tests__</text>
    <g class="fileln">
      <circle cx="550" cy="250" r="24" fill="#3178c6"/>
      <circle cx="590" cy="230" r="8" fill="#3178c6"/><circle cx="580" cy="260" r="6" fill="#3178c6"/>
      <circle cx="525" cy="230" r="6" fill="#3178c6"/>
      <circle cx="605" cy="220" r="6" fill="#cbcb41"/>
    </g>

    <circle class="dir" cx="580" cy="325" r="35"/>
    <text class="txt" x="580" y="320" text-anchor="middle" font-size="14">.github</text>
    <g class="fileln">
      <circle cx="565" cy="335" r="14" fill="#6a9fb5"/><circle cx="595" cy="340" r="10" fill="#3178c6"/>
    </g>

    <g class="fileln">
      <circle cx="480" cy="265" r="10" fill="#3178c6"/><circle cx="505" cy="275" r="6" fill="#3178c6"/>
      <circle cx="640" cy="285" r="18" fill="#6a9fb5"/><circle cx="570" cy="290" r="8" fill="#cbcb41"/>
      <circle cx="590" cy="360" r="18" fill="#cb171e"/><circle cx="570" cy="375" r="6" fill="#cb171e"/><circle cx="605" cy="370" r="6" fill="#cb171e"/>
      <circle cx="660" cy="255" r="14" fill="#3178c6"/><circle cx="685" cy="260" r="8" fill="#3178c6"/>
    </g>
  </g>

  <text class="title" x="14" y="26" font-size="16" font-weight="700">RepoScope</text>
  <rect class="mark-pill" x="778" y="7" width="116" height="24" rx="12"/>

  <rect class="legend-card" x="12" y="904" width="434" height="38" rx="12"/>

  <circle cx="19" cy="923" r="5" fill="#6a9fb5"/>
  <text class="txt" x="29" y="927" font-size="12">Markdown</text>

  <circle cx="102.6" cy="923" r="5" fill="#3178c6"/>
  <text class="txt" x="112.6" y="927" font-size="12">TypeScript</text>

  <circle cx="200.6" cy="923" r="5" fill="#cb171e"/>
  <text class="txt" x="210.6" y="927" font-size="12">YAML</text>

  <circle cx="255.4" cy="923" r="5" fill="#3572a5"/>
  <text class="txt" x="265.4" y="927" font-size="12">Python</text>

  <circle cx="324.6" cy="923" r="5" fill="#cbcb41"/>
  <text class="txt" x="334.6" y="927" font-size="12">JSON</text>

  <circle cx="379.4" cy="923" r="5" fill="#a074c4"/>
  <text class="txt" x="389.4" y="927" font-size="12">Image</text>
</svg>
</div>

<details>
<summary><b>Click to expand the full text directory tree</b></summary>

```text
── 📁 my-reposcope-app
    ├── 📁 __tests__
    │   ├── 🔷 audit.test.ts
    │   ├── 🔷 graph-grounding.test.ts
    │   ├── 🔷 graph-spec.test.ts
    │   ├── 🔷 llm-layer.test.ts
    │   ├── 🔷 specs.test.ts
    │   └── 📄 test_specs.py
    ├── 📁 app
    │   ├── 📁 api
    │   │   ├── 📁 github
    │   │   │   └── 🔷 route.ts
    │   │   └── 📁 insight
    │   │       └── 🔷 route.ts
    │   ├── 🎨 globals.css
    │   ├── 📄 icon.tsx
    │   ├── 📄 layout.tsx
    │   ├── 📄 page.tsx
    │   └── 🔷 sitemap.ts
    ├── 📁 bin
    │   └── 📄 reposcope
    ├── 📁 components
    │   ├── 📁 ui
    │   │   └── 📄 Card.tsx
    │   ├── 📄 ActionsDashboard.tsx
    │   ├── 📄 ActionsPanel.tsx
    │   ├── 📄 AIInsight.tsx
    │   ├── 📄 AuditTabs.tsx
    │   ├── 📄 Board.tsx
    │   ├── 📄 CommandBlock.tsx
    │   ├── 📄 ErrorCard.tsx
    │   ├── 📄 ExportButtons.tsx
    │   ├── 📄 RepoInput.tsx
    │   ├── 📄 ScoreBoard.tsx
    │   ├── 📄 SmartDiagnosis.tsx
    │   ├── 📄 StatusBadge.tsx
    │   └── 📄 TokenInput.tsx
    ├── 📁 docs
    │   ├── 📁 checklists
    │   │   ├── 📝 cross.md
    │   │   ├── 📝 dataops.md
    │   │   ├── 📝 general.md
    │   │   ├── 📝 iiot.md
    │   │   └── 📝 webapp.md
    │   ├── 📁 notes
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
    │   ├── 📁 specs
    │   │   ├── 📄 _graph.yaml
    │   │   ├── 📄 _schema.yaml
    │   │   ├── 📄 cross.yaml
    │   │   ├── 📄 dataops.yaml
    │   │   ├── 📄 general.yaml
    │   │   ├── 📄 iiot.yaml
    │   │   └── 📄 webapp.yaml
    │   ├── 📝 attribution.md
    │   ├── 📝 audit-use-cases.md
    │   ├── 📄 claims.yaml
    │   ├── 📝 knowledge-index.md
    │   ├── 📝 methodology.md
    │   └── 📝 token-handling.md
    ├── 📁 hooks
    │   ├── 🔷 useAIDiagnosis.ts
    │   └── 🔷 useGitHubActions.ts
    ├── 📁 lib
    │   ├── 📁 knowledge
    │   │   ├── 🔷 books.ts
    │   │   ├── 🔷 citation-gate.ts
    │   │   ├── 🔷 graph.ts
    │   │   └── 🔷 standards.ts
    │   ├── 📁 llm
    │   │   ├── 🔷 adapters.ts
    │   │   ├── 🔷 client.ts
    │   │   └── 🔷 providers.ts
    │   ├── 🔷 anomaly-detector.ts
    │   ├── 🔷 audit.ts
    │   ├── 🔷 config.ts
    │   ├── 🔷 dataops-audit.ts
    │   ├── 🔷 environment-parity.ts
    │   ├── 🔷 export.ts
    │   ├── 🔷 github-auto-fix.ts
    │   ├── 🔷 github-diagnostics.ts
    │   ├── 🔷 github-error-patterns.ts
    │   ├── 🔷 github-health-monitor.ts
    │   ├── 🔷 github-log-parser.ts
    │   ├── 🔷 github.ts
    │   ├── 🔷 iiot-audit.ts
    │   ├── 🔷 insight.ts
    │   ├── 🔷 link-classifier.ts
    │   ├── 🔷 rate-limiter.ts
    │   ├── 🔷 sbom-generator.ts
    │   ├── 🔷 types.ts
    │   └── 🔷 utils.ts
    ├── 📁 public
    │   ├── 📁 knowledge
    │   │   ├── 📋 graph.json
    │   │   └── 📋 specs.json
    │   ├── 🌐 googlea4e112c226b2506e.html
    │   ├── 📄 og-image.png
    │   ├── 📄 robots.txt
    │   └── 📄 site.webmanifest
    ├── 📁 scripts
    │   ├── 📁 kg
    │   │   ├── 📄 __init__.py
    │   │   ├── 📋 aliases.json
    │   │   ├── 📄 assemble_graph.py
    │   │   ├── 📄 extract.py
    │   │   ├── 📝 knowledge-index.md
    │   │   ├── 📄 neo4j_export.py
    │   │   ├── 📄 neo4j_import.py
    │   │   ├── 📄 neo4j_validate.py
    │   │   ├── 📝 README.md
    │   │   ├── 📄 route_knowledge.py
    │   │   └── 📄 validate_graph.py
    │   ├── 📄 build_knowledge.py
    │   ├── 📄 check-structure.mjs
    │   ├── 📄 diagnose.py
    │   ├── 📄 evaluate_claims.py
    │   ├── 📄 fix_notes_metadata.py
    │   ├── 📄 generate-sbom.mjs
    │   ├── 📄 render_checklists.py
    │   ├── 🔷 reposcope-audit.ts
    │   ├── 📄 verify_claims.py
    │   └── 🔷 verify-knowledge-registry.ts
    ├── 📝 CHANGELOG.md
    ├── 📝 CONTRIBUTING.md
    ├── 📄 eslint.config.mjs
    ├── 📋 graph.json
    ├── 📄 LICENSE
    ├── 🔷 next-env.d.ts
    ├── 🟨 next.config.js
    ├── 📋 package.json
    ├── 📄 pnpm-lock.yaml
    ├── 📄 pnpm-workspace.yaml
    ├── 🟨 postcss.config.js
    ├── 📄 pytest.ini
    ├── 📝 README.md
    ├── 📝 SECURITY.md
    ├── 📄 setup.sh
    ├── 🔷 tailwind.config.ts
    └── 📋 tsconfig.json
```

</details>

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Good First Issues:**
- Video production & walkthroughs
- Technical writing & UX documentation
- DataOps rule expansion (dbt, Great Expectations, Pandera)
- Industrial protocol mocking (Modbus, OPC-UA, MQTT)

---

## 📄 License & Security

- This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
- For security issues, please read [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

---

<div align="center">

**Built with ❤️ by [Reza Esmaeili](https://github.com/esmaeilireza) and [Abbas Lotfi](https://github.com/abbas-pt)**

*RepoScope — Bringing industrial-grade deterministic quality gates to DataOps, IIoT, and modern software pipelines.*

</div>
```
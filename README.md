# RepoScope 

**DataOps & Industrial Code Quality Gatekeeper**

RepoScope is an automated health-audit engine for public repositories, customized specifically for **Data Science, Analytics Engineering, and Industrial IoT (IIoT)** pipelines. It ensures codebases running critical models, SCADA integration logic, and Python microservices maintain production-grade compliance before merging.

Coming from an industrial automation and PLC background where runtime failure is not an option, I built RepoScope to bring deterministic health checks and automated quality audits into data analytics and software workflows. When structuring data analytics projects, ambiguity in code readiness, broken pipelines, and unverified data references cause silent downstream failures. RepoScope automates repository integrity verification before code reaches production.

It doesn't just give you a score—it explains exactly **why** the health score is what it is, with actionable fixes.

---

## ✨ Features

- 📊 **DataOps Compliance Check** — Validates notebook clean-state, large dataset leakages, deterministic dependency resolution (Poetry/Pipfile/Conda-lock), and dbt schema tests.
- ⚙️ **Deterministic Testing & IIoT Mock Integrity** — Verifies CI/CD pipelines for mock validation protocols (Modbus/SCADA simulations, OOM detection, pytest assertions).
- 🧭 **Comprehensive Repository Audit** — Section-by-section evaluation mirroring GitHub's navigation (Code, Issues, PRs, Actions, Security, and more).
- 🌿 **Branch Consistency Analysis** — Compares non-default branches against the default branch to track added, modified, or deleted files.
- 📝 **Smart README Link Checker** — A heuristic-based classifier that validates every Markdown link, image, and relative path; intelligently skips external URLs, API endpoints, HTML tags, and placeholders.
- 🤖 **AI-Powered Actions Diagnostics** — Analyzes failed GitHub Actions runs, identifies root causes, and provides one-click fix commands for data pipelines, industrial drivers, and web builds.
- 🧮 **Explained Health Score** — Every deduction is itemized with its probable root cause and concrete fix suggestions.
- 🔐 **Secure GitHub Proxy** — All requests go through a Next.js API route with rate limiting, caching, and optional token support.
- 🎨 **Modern UI** — Fast Refresh development experience with Next.js 14 App Router, Tailwind CSS, and a custom gradient theme.
- ⚡ **Zero Configuration** — Works out of the box for public repositories; no token required.

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

### Installation

```bash
# Clone the repository
git clone https://github.com/esmaeilireza/RepoScope.git
cd RepoScope

# Install dependencies
pnpm install
# or
npm install

# Start development server
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste any GitHub repository URL (e.g., `https://github.com/vercel/next.js`), select an **Audit Profile**, and click **Analyze Repository**.

### Other Scripts

```bash
pnpm build    # Production build
pnpm start    # Run production build
pnpm lint     # Run ESLint
```

---

## 🔑 GitHub Token (Optional)

RepoScope works **without a token** for public repositories (60 requests/hour limit). For higher limits or private repositories:

### Option 1: Environment Variable (Server-Side)
Create a `.env` file in the project root:

```env
GITHUB_TOKEN=ghp_your_token_here
```

### Option 2: UI Input (Per-Session)
Use the **Advanced Settings** section in the UI to provide a token. The token is sent only to the local proxy and never stored.

### Rate Limits

| Mode | Requests/Hour | Private Repos |
|------|---------------|---------------|
| Without token | 60 | ❌ No |
| With token | 5,000 | ✅ Yes |

### Generate a Token
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens/new)
2. **Note**: `RepoScope`
3. **Expiration**: Choose your preference
4. **Scopes**: Select `repo` (for private repos) or leave empty (public only)
5. Click **Generate token**

---

## 🧭 What Gets Audited

### Repository Health Checks

| Section | What is Checked |
|---------|-----------------|
| **README** | Presence, quality, and link validity |
| **License** | LICENSE file detection |
| **CI/CD** | GitHub Actions workflows presence |
| **Tests** | Test directory/file detection |
| **Security** | SECURITY.md, .env.example presence |
| **Documentation** | CONTRIBUTING.md, CHANGELOG.md |
| **Code Quality** | .editorconfig, Dependabot config |
| **Branches** | Stale branches, divergence from default |
| **Pull Requests** | Open PR count, stale PRs (>90 days) |
| **Issues** | Open issue count, stale issues |

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

| Category | Examples | Treatment |
|----------|----------|-----------|
| External URLs | `github.com`, `arxiv.org`, `docs.python.org` | ✅ Skipped (external) |
| File Paths | `src/app.py`, `backend/weights/model.pt` | ✅ Validated against repo tree |
| HTML Tags | `/td`, `/table`, `/summary` | ✅ Skipped (not links) |
| API Endpoints | `/predict`, `/chat`, `/health` | ⚠️ Flagged as suspicious |
| Placeholders | `/path/to/your/model`, `CHAPTER-NUMBER` | ✅ Skipped |
| Dates | `07/2026`, `2024-01-15` | ✅ Skipped |
| Hex Colors | `FBBF24`, `#FFFFFF` | ✅ Skipped |

---

## 🧮 Health Score Calculation

```
Score = 100 - (critical × 20 + errors × 15 + warnings × 10 + info × 2)
```

### Severity Levels

| Severity | Weight | Examples |
|----------|--------|----------|
| **Critical** | -20 pts | No README, No LICENSE, Unmanaged raw datasets |
| **Error** | -15 pts | No CI/CD, No tests, Loose dependency specs |
| **Warning** | -10 pts | No SECURITY.md, >15 open PRs, Notebook hygiene issues |
| **Info** | -2 pts | No Dependabot, No CONTRIBUTING, No CHANGELOG |

Every deduction appears in the **"Why this score?"** panel along with its probable cause and a concrete fix suggestion.

---

## 🤖 GitHub Actions Diagnostics

RepoScope includes an **AI-powered GitHub Actions Console** that:

1. **Fetches recent workflow runs** from your repository.
2. **Analyzes failed runs** using pattern matching tailored to your audit profile.
3. **Identifies root causes** across three domains: data pipelines, industrial drivers, and web builds.
4. **Provides fix commands** (e.g., `poetry lock --no-update`, `pytest -vv`, mock server spinup).
5. **Offers one-click copy** of diagnostic commands.

### Diagnostic Coverage

| Domain | Example Patterns Detected |
|--------|---------------------------|
| **Data Pipeline** | `dbt.exceptions.CompilationException`, `pytest AssertionError`, schema test failures |
| **Memory / Resources** | `MemoryError`, exit code 137 (OOM kill), CUDA OOM |
| **Industrial Drivers** | `ModbusIOException`, `SerialException`, SCADA mock connection failures |
| **Dependencies** | `ResolutionImpossible`, `ModuleNotFoundError`, lockfile conflicts |
| **General CI** | Build failures, ESLint errors, permission denied, rate limits |

### Dashboard Features

- 📊 **Run Statistics** — Total, failed, successful, and pending runs.
- 🔍 **Smart Diagnosis** — Pattern-based error detection across data, OT, and web domains.
- 💻 **Fix Commands** — Ready-to-use terminal commands.
- 🎯 **Severity Levels** — Critical, error, warning, info classifications.
- 🔄 **Auto-Refresh** — Polls for new runs every 60 seconds.

### Usage

1. Click **Connect to GitHub Actions**.
2. Enter your GitHub token (with `repo` scope).
3. View recent workflow runs.
4. Click **Fix** on failed runs to see diagnostics.

---

## 📁 Project Structure

```
RepoScope/
│
├── .github/                              # GitHub automation & CI/CD
│   ├── ISSUE_TEMPLATE/                   # Templates for GitHub issues
│   │   ├── bug_report.md                 # Bug report template
│   │   ├── feature_request.md            # Feature request template
│   │   └── question.md                   # Question template
│   ├── workflows/
│   │   └── ci.yml                        # GitHub Actions CI pipeline
│   ├── dependabot.yml                    # Automated dependency updates
│   └── PULL_REQUEST_TEMPLATE.md          # PR template for contributors
│
├── app/                                  # Next.js App Router
│   ├── api/
│   │   └── github/
│   │       └── route.ts                  # Secure proxy to GitHub API + enrichment
│   ├── globals.css                       # Global styles + Tailwind directives
│   ├── icon.tsx                          # Dynamic favicon generator
│   ├── layout.tsx                        # Root layout: fonts, metadata, providers
│   └── page.tsx                          # Main page: audit pipeline & rendering
│
├── components/                           # React components
│   ├── ui/
│   │   └── Card.tsx                      # Reusable card wrapper
│   ├── ActionsDashboard.tsx              # GitHub Actions dashboard
│   ├── ActionsPanel.tsx                  # Simplified actions panel
│   ├── AuditTabs.tsx                     # Tabs: Findings / IIoT / SBOM / Security / Tree / README
│   ├── Board.tsx                         # Section-by-section status board
│   ├── CommandBlock.tsx                  # Code block with copy-to-clipboard
│   ├── ErrorCard.tsx                     # Individual CI failure card
│   ├── RepoInput.tsx                     # Repo URL input + profile selection + token
│   ├── ScoreBoard.tsx                    # Health-score ring + detailed breakdown
│   ├── SmartDiagnosis.tsx                # AI-powered diagnosis with fix commands
│   ├── StatusBadge.tsx                   # Status indicator (success/failure/pending)
│   └── TokenInput.tsx                    # GitHub token input for Actions console
│
├── hooks/                                # Custom React hooks
│   └── useGitHubActions.ts               # Fetches and formats GitHub Actions runs
│
├── lib/                                  # Core logic & utilities
│   ├── audit.ts                          # Audit engine: scoring, findings, link classifier
│   ├── anomaly-detector.ts               # Security anomaly scanner (binaries, obfuscation, leaks)
│   ├── config.ts                         # Constants, thresholds, regexes
│   ├── dataops-audit.ts                  # DataOps audit: notebooks, lockfiles, dbt, leakage
│   ├── environment-parity.ts             # Environment variable validation
│   ├── github-auto-fix.ts                # Auto-fix command generator
│   ├── github-diagnostics.ts             # CI failure diagnosis logic
│   ├── github-error-patterns.ts          # Known error patterns & solutions
│   ├── github-health-monitor.ts          # Repository health metrics
│   ├── github-log-parser.ts              # Parse GitHub Actions logs
│   ├── github.ts                         # GitHub API client
│   ├── iiot-audit.ts                     # IIoT/PLC audit: hardware, mocking, fail-safe networking
│   ├── sbom-generator.ts                 # CycloneDX SBOM generator (npm/python/cargo/maven)
│   ├── types.ts                          # AuditProfile definitions & shared TypeScript types
│   └── utils.ts                          # Helpers: parseRepo(), decodeBase64Utf8()
│
├── public/                               # Static assets
│   ├── .gitkeep                          # Placeholder to keep empty directory in Git
│   ├── favicon.svg                       # SVG favicon
│   └── robots.txt                        # SEO crawler rules
│
├── scripts/                              # Build & utility scripts
│   └── check-structure.mjs               # Project structure validation
│
├── .env.example                          # Environment variables template
├── .eslintrc.json                        # ESLint configuration
├── .gitignore                            # Git ignore rules
├── CONTRIBUTING.md                       # Contribution guidelines
├── LICENSE                               # MIT License
├── next-env.d.ts                         # Next.js TypeScript declarations
├── next.config.js                        # Next.js configuration
├── package.json                          # Dependencies & scripts
├── pnpm-lock.yaml                        # pnpm lock file
├── pnpm-workspace.yaml                   # pnpm workspace config
├── postcss.config.js                     # PostCSS for Tailwind
├── README.md                             # 📖 This file
├── SECURITY.md                           # Security policy
├── setup.sh                              # Setup script for developers
├── tailwind.config.ts                    # Tailwind theme config
└── tsconfig.json                         # TypeScript config
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 18, Tailwind CSS 3.4 |
| **Fonts** | Inter (sans), JetBrains Mono (mono) |
| **API** | GitHub REST API v3 |
| **Package Manager** | pnpm 8 |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (recommended) |

---

## 🎨 Custom Theme

RepoScope uses a custom gradient theme with semantic colors:

```typescript
// tailwind.config.ts
colors: {
  night: '#0b1220',      // Background
  panel: '#101a2e',      // Card background
  edge: '#22314e',       // Borders
  mint: '#34d399',       // Success/primary
  tealx: '#2dd4bf',      // Accent
  amberx: '#fbbf24',     // Warning
  rosex: '#fb7185',      // Error
}
```

---

## 📊 Audit Results

### Score Board

- **Excellent** (80-100): Repository is production-ready.
- **Needs Attention** (60-79): Some issues to address before deployment.
- **Critical** (0-59): Major problems — do not merge to production.

### Findings Tabs

1. **Findings** — All issues with severity levels.
2. **Data Pipeline** — DataOps audit score, checks, and recommendations.
3. **IIoT / PLC** — Industrial audit results (when profile selected).
4. **SBOM** — CycloneDX software bill of materials.
5. **Security** — Anomaly detection results.
6. **Tree** — Complete file tree.
7. **README** — Link validation results.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set the following environment variables in your Vercel project settings:

```env
GITHUB_TOKEN=ghp_your_token_here  # Optional
```

### Other Platforms

RepoScope can be deployed to any platform that supports Next.js, including Netlify, Railway, Render, and AWS Amplify.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Make your changes.
4. Run tests and linting (`pnpm lint`).
5. Commit your changes (`git commit -m 'Add amazing feature'`).
6. Push to the branch (`git push origin feature/amazing-feature`).
7. Open a Pull Request.

### Good First Issues

Check the [open issues](https://github.com/esmaeilireza/RepoScope/issues) labeled `good first issue`

- Video production & walkthroughs
- Technical writing & UX documentation
- DataOps rule expansion (dbt, Great Expectations, Pandera)
- Industrial protocol mocking (Modbus, OPC-UA, MQTT)

---

## 👥 Contributors


<table>
  <tr>
    <td align="center">
      <a href="https://github.com/esmaeilireza">
        <img src="https://github.com/esmaeilireza.png" width="100px;" alt="Reza Esmaeili"/>
        <br />
        <sub><b>Reza Esmaeili</b></sub>
      </a>
      <br />
      <sub>Project Lead & Developer</sub>
    </td>
    <td align="center">
      <a href="https://github.com/abbas-pt">
        <img src="https://github.com/abbas-pt.png" width="100px;" alt="Abbas Lotfi"/>
        <br />
        <sub><b>Abbas Lotfi</b></sub>
      </a>
      <br />
      <sub>Co-Developer & Contributor</sub>
    </td>
  </tr>
</table>

### Contribution Types

- 💻 **Code** — Features, bug fixes, optimizations.
- 📖 **Documentation** — README, guides, comments.
- 🎨 **Design** — UI/UX improvements, theming.
- 🧪 **Testing** — Test coverage, bug reports.
- 🔧 **Maintenance** — Dependencies, CI/CD.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🔒 Security

For security issues, please read [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

---

## 🙏 Acknowledgments

- [GitHub REST API](https://docs.github.com/en/rest) for providing the data.
- [Next.js](https://nextjs.org/) for the amazing framework.
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework.
- [Vercel](https://vercel.com/) for seamless deployment.
- The DataOps & Industrial Automation communities for inspiring the quality-first mindset.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/esmaeilireza/RepoScope/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esmaeilireza/RepoScope/discussions)

---

<div align="center">

**Built with ❤️ by [Reza Esmaeili](https://github.com/esmaeilireza) and [Abbas Lotfi](https://github.com/abbas-pt)**

*RepoScope — Bringing industrial-grade deterministic quality gates to DataOps, IIoT, and modern software pipelines.*

</div>


```markdown
# RepoScope

**Audit any public GitHub repository, end-to-end.**

RepoScope is a powerful tool that evaluates repository health, cross-checks README references against reality, and provides AI-powered diagnostics for GitHub Actions failures. It doesn't just give you a score—it explains exactly **why** the health score is what it is, with actionable fixes.

## ✨ Features

- 🧭 **Comprehensive Repository Audit** — Section-by-section evaluation mirroring GitHub's navigation (Code, Issues, PRs, Actions, Security, and more).
- 🌿 **Branch Consistency Analysis** — Compares non-default branches against the default branch to track added, modified, or deleted files.
- 📝 **Smart README Link Checker** — A heuristic-based classifier that validates every Markdown link, image, and relative path; intelligently skips external URLs, API endpoints, HTML tags, and placeholders.
- 🤖 **AI-Powered Actions Diagnostics** — Analyzes failed GitHub Actions runs, identifies root causes, and provides one-click fix commands.
- 🧮 **Explained Health Score** — Every deduction is itemized with its probable root cause and concrete fix suggestions.
- 🔐 **Secure GitHub Proxy** — All requests go through a Next.js API route with rate limiting, caching, and optional token support.
- 🎨 **Modern UI** — Fast Refresh development experience with Next.js 14 App Router, Tailwind CSS, and a custom gradient theme.
- ⚡ **Zero Configuration** — Works out of the box for public repositories; no token required.

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

Open [http://localhost:3000](http://localhost:3000), paste any GitHub repository URL (e.g., `https://github.com/vercel/next.js`), and click **Analyze Repository**.

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
| **Critical** | -20 pts | No README, No LICENSE |
| **Error** | -15 pts | No CI/CD, No tests, >10 broken internal links |
| **Warning** | -10 pts | No SECURITY.md, >15 open PRs, broken internal links |
| **Info** | -2 pts | No Dependabot, No CONTRIBUTING, No CHANGELOG |

Every deduction appears in the **"Why this score?"** panel along with its probable cause and a concrete fix suggestion.

---

## 🤖 GitHub Actions Diagnostics

RepoScope includes an **AI-powered GitHub Actions Console** that:

1. **Fetches recent workflow runs** from your repository.
2. **Analyzes failed runs** using pattern matching.
3. **Identifies root causes** (e.g., missing dependencies, syntax errors, permission issues).
4. **Provides fix commands** (e.g., `npm install`, `git add .`, permission fixes).
5. **Offers one-click copy** of diagnostic commands.

### Dashboard Features
- 📊 **Run Statistics** — Total, failed, successful, and pending runs.
- 🔍 **Smart Diagnosis** — Pattern-based error detection.
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
├── .github/                              # GitHub automation & CI/CD
│   ├── dependabot.yml                    # Automated dependency updates
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI pipeline
│
├── app/                                  # Next.js App Router
│   ├── api/
│   │   └── github/
│   │       └── route.ts                  # API route: secure proxy to api.github.com
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
│   ├── AuditTabs.tsx                     # Tabs: Findings / Branches / Tree / README
│   ├── Board.tsx                         # Section-by-section status board
│   ├── CommandBlock.tsx                  # Code block with copy-to-clipboard
│   ├── ErrorCard.tsx                     # Individual CI failure card
│   ├── RepoInput.tsx                     # Repository URL input + token settings
│   ├── ScoreBoard.tsx                    # Health-score ring + detailed breakdown
│   ├── SmartDiagnosis.tsx                # AI-powered diagnosis with fix commands
│   ├── StatusBadge.tsx                   # Status indicator (success/failure/pending)
│   └── TokenInput.tsx                    # GitHub token input for Actions console
│
├── hooks/                                # Custom React hooks
│   └── useGitHubActions.ts               # Fetches and formats GitHub Actions runs
│
├── lib/                                  # Core logic & utilities
│   ├── audit.ts                          # Audit engine: scoring, findings, heuristic classifier
│   ├── config.ts                         # Constants, thresholds, regexes
│   ├── environment-parity.ts             # Environment variable validation
│   ├── github.ts                         # GitHub API client
│   ├── github-auto-fix.ts                # Auto-fix command generator
│   ├── github-diagnostics.ts             # CI failure diagnosis logic
│   ├── github-error-patterns.ts          # Known error patterns & solutions
│   ├── github-health-monitor.ts          # Repository health metrics
│   ├── github-log-parser.ts              # Parse GitHub Actions logs
│   └── utils.ts                          # Helpers: parseRepo(), decodeBase64Utf8()
│
├── public/                               # Static assets
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
├── README.md                             # This file
├── SECURITY.md                           # Security policy
├── next-env.d.ts                         # Next.js TypeScript declarations
├── next.config.js                        # Next.js configuration
├── package.json                          # Dependencies & scripts
├── pnpm-lock.yaml                        # pnpm lock file
├── pnpm-workspace.yaml                   # pnpm workspace config
├── postcss.config.js                     # PostCSS for Tailwind
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
- **Excellent** (80-100): Repository is well-maintained.
- **Needs Attention** (60-79): Some issues to address.
- **Critical** (0-59): Major problems detected.

### Findings Tabs
1. **Findings** — All issues with severity levels.
2. **Branches** — Branch consistency analysis.
3. **Tree** — Complete file tree.
4. **README** — Link validation results.

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

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/esmaeilireza/RepoScope/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esmaeilireza/RepoScope/discussions)

---

**Built with ❤️ by [Reza Esmaeili](https://github.com/esmaeilireza) and [Abbas Lotfi](https://github.com/abbas-pt)**

*RepoScope — Audit any GitHub Repository, End to End.*
```
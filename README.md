# RepoScope — GitHub Repository Auditor (Next.js)

RepoScope audits any public GitHub repository end-to-end. It evaluates every section of the
repository navigation bar (Code, Issues, Pull requests, Agents, Actions, Projects, Wiki,
Security and quality, Insights, Settings), compares every branch against the default branch
SHA-by-SHA, cross-checks every README reference against reality, and explains exactly
**why the health score is what it is**.

---

## ✨ Features

- 🧭 **Section-by-section board** mirroring the GitHub repo nav, each with PASS / WARN / FAIL / INFO status.
- 🌿 **Branch consistency** — up to 15 non-default branches are diffed against the default branch (added / modified / deleted files).
- 📝 **README contradiction detector** — every Markdown link, image and relative path is verified against the default branch; API/HTTP routes are smartly skipped.
- 🧮 **Explained health score** — every deduction is itemised with its probable root cause and how to fix it.
- 🔐 **Secure GitHub proxy** — all requests go through a Next.js API route; an optional server-side token keeps you above the 60 req/hour public limit.
- ⚡ Fast Refresh dev experience with Next.js 14 App Router + Tailwind CSS.

---

## 📁 Project Structure

```
my-reposcope-app/
├── .github/                         # GitHub automation & CI/CD
│   ├── dependabot.yml               # Automated dependency updates
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
│
├── app/                             # Next.js App Router
│   ├── api/
│   │   └── github/
│   │       └── route.ts             # API route: secure proxy to api.github.com
│   ├── globals.css                  # Global styles + Tailwind directives
│   ├── layout.tsx                   # Root layout: fonts, metadata
│   └── page.tsx                     # Main page: audit pipeline & rendering
│
├── components/                      # React components
│   ├── ui/
│   │   └── Card.tsx                 # Reusable card wrapper
│   ├── AuditTabs.tsx                # Tabs: Findings / Branches / Tree / README
│   ├── RepoInput.tsx                # Repository URL input + token settings
│   └── ScoreBoard.tsx               # Health-score ring + breakdown
│
├── lib/                             # Core logic & utilities
│   ├── audit.ts                     # Audit engine: scoring, findings, sections
│   ├── config.ts                    # Constants, thresholds, regexes
│   └── utils.ts                     # Helpers: parseRepo(), decodeBase64Utf8()
│
├── public/                          # Static assets (newly added)
│   ├── favicon.svg                  # Favicon placeholder
│   └── robots.txt                   # SEO crawler rules
│
├── scripts/                         # Build & utility scripts
│   └── check-structure.mjs         # Project structure validation
│
├── .env.example                     # Environment variables template
├── .eslintrc.json                   # ESLint configuration
├── .gitignore                       # Git ignore rules
├── CONTRIBUTING.md                  # Contribution guidelines
├── LICENSE                          # Project license
├── README.md                        # Project documentation
├── SECURITY.md                      # Security policy
│
├── next-env.d.ts                    # Next.js TypeScript declarations
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                   # pnpm lock file
├── pnpm-workspace.yaml             # pnpm workspace config
├── postcss.config.js                # PostCSS for Tailwind
├── setup.sh                         # Setup script for developers
├── tailwind.config.ts               # Tailwind theme config
└── tsconfig.json                    # TypeScript config
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — paste any `owner/repo` (e.g. `vercel/next.js`) and click **Analyze**.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
```

---

## 🔑 GitHub Token (optional)

Create a `.env` file in the project root:

```
GITHUB_TOKEN=ghp_your_token_here
```

- **Without a token:** 60 requests/hour (GitHub public limit).
- **With a token:** 5,000 requests/hour + private repo access.
- A token can also be supplied per-session from the UI (**Advanced settings**); it is sent only to the local proxy.

---

## 🧭 What Gets Audited (section board)

| Section (GitHub nav)      | What is checked                                                        |
| ------------------------- | ---------------------------------------------------------------------- |
| Code                      | File count on the default branch                                       |
| Issues                    | Open issues (warn > 10, fail > 50)                                     |
| Pull requests             | Open PRs + stale PRs older than 90 days                                |
| Agents                    | Not exposed by the public API (informational)                          |
| Actions                   | Presence of `.github/workflows/`                                       |
| Projects                  | `has_projects` flag                                                    |
| Wiki                      | `has_wiki` flag                                                        |
| Security and quality      | LICENSE, SECURITY.md, Dependabot config                                |
| Insights                  | Branch count, diverged branches, compare errors                        |
| Settings                  | Visibility, archived state, staleness (> 1 year without push)          |
| README audit              | Every link / image / relative path verified against the default branch |

---

## 🧮 Health Score

```
Score = 100 − (errors × 6 + warnings × 3 + info × 1), clamped to 0–100
```

Checks include: missing README / LICENSE / CONTRIBUTING / SECURITY.md / .gitignore, no CI workflow,
no Dependabot, issue backlog, stale or too many PRs, archived or unmaintained repos, diverged
branches, and broken README references. Every deduction appears in the **"Why this score?"** panel
with its probable cause and a concrete fix.

---

## 🛠 Tech Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · GitHub REST API v3

---

## ⚠️ Notes

- All GitHub requests are proxied via `/api/github` — the browser never talks to `api.github.com` directly.
- To conserve API quota, at most **15 non-default branches** are compared per run.
- Route-like paths in the README (e.g. `/api/v1/predict`) are treated as endpoints, not files, and never counted as broken links.
```

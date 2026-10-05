# Security Policy

RepoScope takes security and supply-chain integrity seriously. This document outlines our disclosure procedures, secret handling, and engineering controls.

## Supported Versions

Only the latest commit on the `main` branch is actively supported and maintained.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

Please **do not open a public issue** for vulnerabilities or potential security flaws.

1. **Privately report via GitHub Security Advisories:**  
   [Open an Advisory](https://github.com/esmaeilireza/RepoScope/security/advisories/new)
2. **Response SLA:**
   - **Acknowledgment:** Within 48 hours.
   - **Triage & Assessment:** Within 7 business days.
   - **Fix & Advisory Release:** Scheduled promptly with a CVE/GHSA reference where appropriate.

## Token & Secret Handling

- **Server-Side Isolation:** The optional `GITHUB_TOKEN` is consumed strictly server-side in `app/api/github/route.ts` through runtime environment variables (`process.env.GITHUB_TOKEN`).
- **Zero Browser Exposure:** The token is never included in client bundles, never sent to the browser, and never serialized into JSON API responses.
- **Production Deployments:** Configure `GITHUB_TOKEN` solely via your hosting provider's dashboard (e.g., Vercel / Railway / AWS). **Never commit `.env` or secrets to git.**
- **Accidental Exposure:** If a token is committed, revoke it immediately at [GitHub Token Settings](https://github.com/settings/tokens).

## Supply Chain & Dependency Gates

- All pull requests and commits run continuous dependency vulnerability scans (`pnpm audit`) and static secret scanning (`gitleaks`).
- CycloneDX Software Bill of Materials (SBOM) generation is integrated into RepoScope for pipeline transparency.

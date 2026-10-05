# Security Policy & Supply Chain Posture

RepoScope treats system resilience, secret safety, and supply-chain integrity as first-class architectural concerns. This document outlines vulnerability disclosure, token safety, and audit baselines.

## Supported Versions

Only the latest commit on the `main` branch receives active security updates and dependency patches.

| Version | Supported | Maintenance Window |
|---|---|---|
| `main` (0.1.x) | :white_check_mark: | Active Development |
| < 0.1.0 | :x: | End of Life |

## Vulnerability Reporting

Please **do not** report vulnerabilities through public GitHub issues or public discussions.

1. **Private Advisory Submission:** Submit a private report via [GitHub Security Advisories](https://github.com/esmaeilireza/RepoScope/security/advisories/new).
2. **SLA & Response Time:**
   - **Initial Acknowledgment:** Within **48 hours**.
   - **Triage & Risk Assessment:** Within **7 business days**.
   - **Remediation & Advisory Release:** A patch and GHSA/CVE notice will be published upon verification.

## Token & Secret Handling

- **Zero Client-Side Exposure:** `GITHUB_TOKEN` is consumed strictly server-side in `app/api/github/route.ts` via `process.env.GITHUB_TOKEN`. It is never exposed in client bundles or responses.
- **Environment Configuration:** Configure tokens exclusively through platform settings (Vercel, Railway, AWS). Never commit `.env` or secret-bearing files.
- **Emergency Revocation:** If a token is suspected of compromise, immediately revoke it via [GitHub Personal Access Tokens](https://github.com/settings/tokens) and redeploy.

## 2026 Audit Baseline Alignment

RepoScope integrates 4 continuous quality gates:

1. **OWASP Top 10:2025**
   - **A01:2025 (Broken Access Control):** Proxy routes enforce parameter validation and server-side boundaries.
   - **A03:2025 (Software Supply Chain Failures):** Strict lockfile checking, registry origin pinning, and CycloneDX 1.6 SBOM artifact generation.
   - **A10:2025 (Mishandling Exceptional Conditions):** Sanitized error payloads without leaking call stacks.
2. **SLSA v1.2 (Supply-chain Levels for Software Artifacts):** Level 2 Build Isolation with reproducible lockfiles and build provenance.
3. **Automated Secret Scanning:** Verified via Gitleaks pre-commit rules and CI pipelines.
4. **Dependency Auditing:** Daily automated checks with `pnpm audit` against the official npm registry.

# Security Policy

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.
Report them privately via GitHub Security Advisories:
<https://github.com/esmaeilireza/RepoScope/security/advisories/new>

You can expect an initial response within 7 days.

## Token handling

- `GITHUB_TOKEN` is read server-side only, inside `app/api/github/route.ts`.
- The token is never sent to the browser and never appears in an API response.
- In deployments, set `GITHUB_TOKEN` as an environment variable in the hosting
  provider's dashboard — never commit it to the repository.
- If a token is ever committed, revoke it immediately at
  <https://github.com/settings/tokens>.

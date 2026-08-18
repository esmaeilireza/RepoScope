# Token Handling During Audits

RepoScope can inspect public repository data without a token, but authenticated requests may provide higher rate limits. Tokens should be treated as short-lived inputs to the audit process rather than as application data.

## Safer defaults

Prefer an environment variable or a per-session input over committing a token to a file. Never include a token in a repository URL, a screenshot, a diagnostic export, or a client-side bundle. When an audit is complete, clear temporary shell history and revoke tokens that were created only for the audit.

## Operational checks

Before sharing an audit result, search the output for common credential markers and confirm that request headers are not rendered in logs. A redacted error message is more useful than a complete upstream response that could expose authorization details. If a token may have leaked, stop using it and rotate it before continuing the investigation.

## Least privilege

Use a token with only the repository permissions required for the checks being run. Read-only access is sufficient for health and diagnostic checks; write access should never be required for a routine audit.

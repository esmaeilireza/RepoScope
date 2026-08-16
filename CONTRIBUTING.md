# Contributing to RepoScope

Thanks for your interest in improving RepoScope.

## Getting started
```bash
pnpm install
cp .env.example .env.local   # optional: add a GITHUB_TOKEN to raise rate limits
pnpm dev

## Before opening a pull request

bash
pnpm audit:self   # tsc --noEmit + next lint + structure check
pnpm build

## Guidelines

- Keep pull requests focused on a single change.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Update `README.md` when you add or move files — the structure check validates
  the tree in the README against the real filesystem.
- Never commit `.env.local` or a real GitHub token.

## Reporting bugs

Open an issue with the repository URL you audited, the full error message,
and the browser console stack trace.

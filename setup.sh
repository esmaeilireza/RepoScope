#!/usr/bin/env bash
set -euo pipefail

YEAR=2025
AUTHOR="Reza Esmaeili Mood"

mkdir -p .github/workflows

# ---------- .gitignore ----------
cat > .gitignore <<'EOF'
node_modules/
.next/
out/
.env*
!.env.example
.DS_Store
*.tsbuildinfo
EOF

# ---------- .env.example ----------
cat > .env.example <<'EOF'
GITHUB_TOKEN=
EOF

# ---------- CI ----------
cat > .github/workflows/ci.yml <<'EOF'
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit:self
      - run: pnpm build
EOF

# ---------- Dependabot ----------
cat > .github/dependabot.yml <<'EOF'
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
EOF

# ---------- LICENSE (MIT) ----------
cat > LICENSE <<EOF
MIT License

Copyright (c) ${YEAR} ${AUTHOR}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# ---------- CONTRIBUTING ----------
cat > CONTRIBUTING.md <<'EOF'
# Contributing to RepoScope

Thanks for your interest in improving RepoScope.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional: add a GITHUB_TOKEN to raise rate limits
pnpm dev

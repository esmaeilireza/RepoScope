#!/usr/bin/env bash
# =============================================================================
#  RepoScope — README Hardening Script
#  Safe for Git Bash on Windows / macOS / Linux.
#  - Never closes the terminal window
#  - Logs to readme_hardening.log
#  - Idempotent: safe to run multiple times
#  - Backs up README.md and package.json before editing
#
#  Usage:
#    bash scripts/harden-readme.sh            # normal run (pauses at end)
#    bash scripts/harden-readme.sh --e2e      # also run CLI end-to-end tests
#    bash scripts/harden-readme.sh --no-pause # do not pause at end (for CI)
# =============================================================================

set +e
set -u
set -o pipefail

# ---------------------------------------------------------------------------
# Resolve repo root
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" >/dev/null 2>&1 && pwd)"
ROOT=""
if [ -d "$SCRIPT_DIR/.git" ]; then
  ROOT="$SCRIPT_DIR"
elif command -v git >/dev/null 2>&1 && git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  ROOT="$(cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd)"
else
  ROOT="$SCRIPT_DIR"
fi
cd "$ROOT" 2>/dev/null || ROOT="$(pwd)"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG="$ROOT/readme_hardening.log"
: > "$LOG" 2>/dev/null || LOG="/tmp/readme_hardening.log"

say()  { printf '%s\n' "$*" | tee -a "$LOG" 2>/dev/null || printf '%s\n' "$*"; }
hr()   { say "------------------------------------------------------------------"; }
step() { say ""; hr; say ">> $*"; hr; }
ok()   { say "  [ok]   $*"; }
warn() { say "  [warn] $*"; }
fail() { say "  [fail] $*"; }
info() { say "  [info] $*"; }

find_python() {
  for p in python python3 py; do
    if command -v "$p" >/dev/null 2>&1; then printf '%s' "$p"; return 0; fi
  done
  return 1
}

find_pkg_mgr() {
  if command -v pnpm >/dev/null 2>&1; then printf 'pnpm'; return 0; fi
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1
    command -v pnpm >/dev/null 2>&1 && { printf 'pnpm'; return 0; }
  fi
  if command -v npm >/dev/null 2>&1; then printf 'npm'; return 0; fi
  return 1
}

# ---------------------------------------------------------------------------
# Keep window open at the end (the whole point of this script)
# ---------------------------------------------------------------------------
INTERACTIVE=0
[ -t 0 ] && INTERACTIVE=1
NO_PAUSE="${NO_PAUSE:-0}"
E2E=0

case "${1:-}" in
  --no-pause) NO_PAUSE=1 ;;
  --e2e)      E2E=1 ;;
  --help|-h)
    echo "Usage: bash $0 [--e2e] [--no-pause]"
    echo "  --e2e       also run end-to-end CLI tests on fixtures"
    echo "  --no-pause  do not wait for ENTER at the end (for CI)"
    exit 0
    ;;
esac

_cleanup() {
  local code=$?
  echo ""
  echo "=================================================================="
  echo "  Finished. Exit code: $code"
  echo "  Log: $LOG"
  echo "=================================================================="
  if [ "$INTERACTIVE" = "1" ] && [ "$NO_PAUSE" != "1" ]; then
    echo ""
    printf 'Press ENTER to close this window (or leave it open)... '
    read -r _ || true
  fi
  return "$code"
}
trap _cleanup EXIT
trap 'echo ""; echo "Interrupted by user (Ctrl+C). Window will stay open.";' INT

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
echo ""
echo "=================================================================="
echo "  RepoScope — README Hardening Script"
echo "  Root: $ROOT"
echo "  Log:  $LOG"
echo "=================================================================="
echo ""

# ---------------------------------------------------------------------------
# Step 0: Prerequisites
# ---------------------------------------------------------------------------
step "Step 0 — Prerequisites"
PY="$(find_python || true)"
PKG="$(find_pkg_mgr || true)"
NODE_OK=0; command -v node >/dev/null 2>&1 && NODE_OK=1
[ -n "$PY" ]  && ok "python: $PY"       || warn "python not found — readme_status step will be skipped"
[ -n "$PKG" ] && ok "package manager: $PKG" || warn "pnpm/npm not found — some steps will be skipped"
[ "$NODE_OK" = "1" ] && ok "node: $(node --version)" || warn "node not found"
[ -f package.json ]   && ok "package.json found"   || warn "package.json missing"
[ -f README.md ]      && ok "README.md found"      || warn "README.md missing"
[ -f public/knowledge/specs.json ] && ok "public/knowledge/specs.json found" \
    || warn "public/knowledge/specs.json missing — readme_status will fail until it exists"

# ---------------------------------------------------------------------------
# Step 1: Backups
# ---------------------------------------------------------------------------
step "Step 1 — Backups"
TS="$(date +%Y%m%d-%H%M%S)"
[ -f README.md ]    && cp -f README.md    "README.md.bak-$TS"    && ok "backup: README.md.bak-$TS"
[ -f package.json ] && cp -f package.json "package.json.bak-$TS" && ok "backup: package.json.bak-$TS"

# ---------------------------------------------------------------------------
# Step 2: scripts/readme_status.py
# ---------------------------------------------------------------------------
step "Step 2 — scripts/readme_status.py"
mkdir -p scripts
if [ -f scripts/readme_status.py ]; then
  ok "already exists — leaving untouched (delete it to regenerate)"
else
  cat > scripts/readme_status.py <<'PYEOF'
#!/usr/bin/env python3
"""Generate or verify the README implementation-status block."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Literal, TypedDict

Status = Literal["active", "draft", "unknown"]
README_START = "<!-- README_STATUS_START -->"
README_END = "<!-- README_STATUS_END -->"
DOMAIN_ORDER = ("general", "dataops", "iiot", "webapp", "cross")
DOMAIN_LABELS = {
    "general": "General (WebApp baseline)",
    "dataops": "DataOps",
    "iiot": "IIoT",
    "webapp": "WebApp",
    "cross": "Cross-Domain",
    "unknown": "Unknown",
}


class Rule(TypedDict, total=False):
    id: str
    status: str


class Bundle(TypedDict, total=False):
    rules: list[Rule]


Specs = dict[str, Bundle]
Counts = dict[str, dict[Status, int]]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def normalize_status(value: object) -> Status:
    if value == "active":
        return "active"
    if value == "draft":
        return "draft"
    return "unknown"


def domain_for_rule_id(rule_id: str) -> str:
    if rule_id.startswith("general-"):
        return "general"
    head, separator, _ = rule_id.partition("-")
    if separator and head:
        return head
    return "unknown"


def empty_counts() -> Counts:
    return {
        domain: {"active": 0, "draft": 0, "unknown": 0}
        for domain in (*DOMAIN_ORDER, "unknown")
    }


def load_specs(path: Path) -> Specs:
    parsed: object = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(parsed, dict):
        raise TypeError(f"{path} must contain a JSON object")

    specs: Specs = {}
    for profile, bundle in parsed.items():
        if not isinstance(profile, str) or not isinstance(bundle, dict):
            raise TypeError(f"invalid profile entry in {path}: {profile!r}")

        rules_raw: object = bundle.get("rules", [])
        if not isinstance(rules_raw, list):
            raise TypeError(f"profile {profile!r} has non-list rules")

        rules: list[Rule] = []
        for item in rules_raw:
            if not isinstance(item, dict):
                continue

            rule_id = item.get("id")
            if not isinstance(rule_id, str) or not rule_id:
                continue

            rule_entry: Rule = {"id": rule_id}
            status = item.get("status")
            if isinstance(status, str):
                rule_entry["status"] = status
            rules.append(rule_entry)

        specs[profile] = {"rules": rules}

    return specs


def compute_counts(specs: Specs) -> Counts:
    counts = empty_counts()
    for bundle in specs.values():
        for rule in bundle.get("rules", []):
            rule_id = rule.get("id")
            if not isinstance(rule_id, str) or not rule_id:
                continue

            domain = domain_for_rule_id(rule_id)
            if domain not in counts:
                counts[domain] = {"active": 0, "draft": 0, "unknown": 0}

            counts[domain][normalize_status(rule.get("status"))] += 1

    return counts


def render_block(counts: Counts) -> str:
    totals: dict[Status, int] = {"active": 0, "draft": 0, "unknown": 0}
    lines = [
        README_START,
        "## Implementation Status (generated)",
        "",
        "Generated from `public/knowledge/specs.json`. Do not edit this block by hand.",
        "",
        "| Domain | Active | Draft | Unknown | Total |",
        "|---|---:|---:|---:|---:|",
    ]

    seen: set[str] = set()
    ordered_domains = [
        *DOMAIN_ORDER,
        *[domain for domain in counts if domain not in DOMAIN_ORDER],
    ]

    for domain in ordered_domains:
        if domain in seen:
            continue
        seen.add(domain)

        row = counts.get(domain, {"active": 0, "draft": 0, "unknown": 0})
        total = row["active"] + row["draft"] + row["unknown"]

        if total == 0 and domain == "unknown":
            continue

        label = DOMAIN_LABELS.get(domain, domain)
        lines.append(
            f"| {label} | {row['active']} | {row['draft']} | {row['unknown']} | {total} |"
        )

        for status in totals:
            totals[status] += row[status]

    grand_total = totals["active"] + totals["draft"] + totals["unknown"]
    lines.append(
        f"| **Total** | **{totals['active']}** | **{totals['draft']}** | "
        f"**{totals['unknown']}** | **{grand_total}** |"
    )
    lines.extend(["", README_END])
    return "\n".join(lines)


def replace_block(readme_text: str, block: str) -> str:
    start = readme_text.find(README_START)
    end = readme_text.find(README_END)

    if start == -1 or end == -1 or end < start:
        raise ValueError(
            "README.md must contain README_STATUS_START and README_STATUS_END markers. "
            "Add them once around the old Implementation Status section, then run pnpm readme:status."
        )

    return readme_text[:start] + block + readme_text[end + len(README_END):]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if README is stale or contains unknown statuses.",
    )
    args = parser.parse_args()

    root = repo_root()
    specs_path = root / "public" / "knowledge" / "specs.json"
    readme_path = root / "README.md"

    specs = load_specs(specs_path)
    counts = compute_counts(specs)
    block = render_block(counts)

    if args.check:
        readme_text = readme_path.read_text(encoding="utf-8")
        if block not in readme_text:
            print("README status block is stale. Run: pnpm readme:status", file=sys.stderr)
            return 1

        unknown_total = sum(row["unknown"] for row in counts.values())
        if unknown_total:
            print(
                f"specs.json contains {unknown_total} rule(s) with unknown status.",
                file=sys.stderr,
            )
            return 1

        print("README status block is current.")
        return 0

    readme_text = readme_path.read_text(encoding="utf-8")
    updated = replace_block(readme_text, block)
    readme_path.write_text(updated, encoding="utf-8", newline="\n")

    totals = {"active": 0, "draft": 0, "unknown": 0}
    for row in counts.values():
        for status in totals:
            totals[status] += row[status]

    print(
        "Updated README status block: "
        f"active={totals['active']}, draft={totals['draft']}, unknown={totals['unknown']}, "
        f"total={totals['active'] + totals['draft'] + totals['unknown']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
PYEOF
  if [ -f scripts/readme_status.py ]; then
    ok "created scripts/readme_status.py"
  else
    fail "could not create scripts/readme_status.py"
  fi
fi

# ---------------------------------------------------------------------------
# Step 3: update package.json
# ---------------------------------------------------------------------------
step "Step 3 — package.json scripts"
if [ -f package.json ] && [ "$NODE_OK" = "1" ]; then
  node -e '
    const fs = require("fs");
    const path = "package.json";
    let p;
    try { p = JSON.parse(fs.readFileSync(path, "utf8")); }
    catch (e) { console.error("  [fail] invalid package.json: " + e.message); process.exit(0); }
    p.scripts = p.scripts || {};

    let changed = false;

    if (p.scripts["readme:status"] !== "python scripts/readme_status.py") {
      p.scripts["readme:status"] = "python scripts/readme_status.py";
      console.log("  [ok]   added readme:status");
      changed = true;
    } else {
      console.log("  [ok]   readme:status already set");
    }

    if (p.scripts["readme:check"] !== "python scripts/readme_status.py --check") {
      p.scripts["readme:check"] = "python scripts/readme_status.py --check";
      console.log("  [ok]   added readme:check");
      changed = true;
    } else {
      console.log("  [ok]   readme:check already set");
    }

    const wantedAudit =
      "pnpm audit --registry=https://registry.npmjs.org/ --audit-level=high && " +
      "python scripts/readme_status.py --check && " +
      "node scripts/generate-sbom.mjs && eslint . && next build";

    const current = p.scripts["audit:all"];
    if (!current || !String(current).includes("readme_status.py")) {
      p.scripts["audit:all"] = wantedAudit;
      console.log("  [ok]   audit:all updated to include readme_status.py --check");
      changed = true;
    } else {
      console.log("  [ok]   audit:all already mentions readme_status.py");
    }

    if (changed) {
      fs.writeFileSync(path, JSON.stringify(p, null, 2) + "\n", "utf8");
      console.log("  [ok]   package.json written");
    } else {
      console.log("  [info] package.json already up to date");
    }
  ' 2>&1 | tee -a "$LOG"
else
  warn "skipping package.json update (missing file or node)"
fi

# ---------------------------------------------------------------------------
# Step 4: ensure README markers exist
# ---------------------------------------------------------------------------
step "Step 4 — README status markers"
if [ -f README.md ]; then
  HAS_START=0; HAS_END=0
  grep -q '<!-- README_STATUS_START -->' README.md 2>/dev/null && HAS_START=1
  grep -q '<!-- README_STATUS_END -->'   README.md 2>/dev/null && HAS_END=1
  if [ "$HAS_START" = "1" ] && [ "$HAS_END" = "1" ]; then
    ok "markers already present"
  else
    warn "markers missing — inserting a placeholder after the Overview section"
    # Insert after the first "---" that follows Overview (safer: insert before ## ✨ Features)
    if grep -q '^## ✨ Features' README.md 2>/dev/null; then
      # Use awk to insert before Features
      awk '
        BEGIN { inserted = 0 }
        /^## ✨ Features/ && !inserted {
          print "<!-- README_STATUS_START -->"
          print "<!-- Auto-generated from public/knowledge/specs.json by scripts/readme_status.py. -->"
          print "<!-- README_STATUS_END -->"
          print ""
          inserted = 1
        }
        { print }
      ' README.md > README.md.tmp && mv -f README.md.tmp README.md
      ok "inserted placeholder markers before ✨ Features"
    else
      warn "could not locate '## ✨ Features' — add markers manually"
    fi
  fi
else
  fail "README.md not found"
fi

# ---------------------------------------------------------------------------
# Step 5: fix false claims in README (idempotent)
# ---------------------------------------------------------------------------
step "Step 5 — README claim fixes"
if [ -f README.md ]; then
  # 5.1 Next.js 14 → Next.js 16 (badge + text)
  if grep -qE 'Next\.js%2014|Next\.js 14' README.md 2>/dev/null; then
    sed -i.bak -E 's/Next\.js%2014/Next.js%2016/g; s/Next\.js 14/Next.js 16/g' README.md
    ok "Next.js 14 → 16 in README"
  else
    info "Next.js version already correct"
  fi

  # 5.2 remove "22 of 47" claim
  if grep -q '22 of 47' README.md 2>/dev/null; then
    # Replace the whole old status line with a pointer to the generated block
    sed -i.bak -E '/22 of 47/d' README.md
    ok "removed '22 of 47' claim"
  else
    info "no '22 of 47' claim found"
  fi

  # 5.3 remove fake test name
  if grep -q 'test_active_rules_are_all_implemented_in_typescript' README.md 2>/dev/null; then
    sed -i.bak -E 's/test_active_rules_are_all_implemented_in_typescript/__tests__\/contract\/spec-parity.test.ts and __tests__\/specs.test.ts/g' README.md
    ok "replaced fake test name"
  else
    info "no fake test name found"
  fi

  # 5.4 remove score formula
  if grep -qE 'Critical.*-20|15 \\times|20 \\times' README.md 2>/dev/null; then
    # Replace the formula line(s) with soft wording
    sed -i.bak -E 's/20 \\times \\text\{Critical\}[^\n]*/severity weights are defined and tested in code/' README.md
    ok "soft-worded score formula"
  else
    info "no hardcoded score formula found"
  fi

  # 5.5 remove "12+ providers" numeric claim
  if grep -q '12+ providers' README.md 2>/dev/null; then
    sed -i.bak 's/12+ providers/multiple providers/g' README.md
    ok "soft-worded '12+ providers'"
  else
    info "no '12+ providers' claim found"
  fi
else
  fail "README.md not found — skipping claim fixes"
fi

# ---------------------------------------------------------------------------
# Step 6: report shell:true usage (do NOT auto-fix)
# ---------------------------------------------------------------------------
step "Step 6 — shell: true usage report"
PATTERN='shell:\s*true|spawn\([^)]*shell|exec\([^)]*shell|execSync\([^)]*shell'
FOUND=0
if command -v grep >/dev/null 2>&1; then
  MATCHES="$(grep -RniE "$PATTERN" --exclude='harden-readme.sh*' --exclude='readme_hardening.log' --exclude='*.bak' __tests__ lib scripts 2>/dev/null || true)"
  if [ -n "$MATCHES" ]; then
    FOUND=1
    say "$MATCHES"
    warn "found $(
      printf '%s\n' "$MATCHES" | wc -l | tr -d ' '
    ) suspicious line(s). NOT auto-fixed — inspect and replace with spawnSync/execFileSync."
  else
    ok "no shell:true patterns found"
  fi
else
  warn "grep not available"
fi

# ---------------------------------------------------------------------------
# Step 7: report CI workflow status (do NOT auto-edit)
# ---------------------------------------------------------------------------
step "Step 7 — CI workflow check"
CI_FILES="$(ls .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null || true)"
if [ -n "$CI_FILES" ]; then
  for f in $CI_FILES; do
    if grep -q 'readme:check' "$f" 2>/dev/null; then
      ok "$f already contains readme:check"
    else
      warn "$f does NOT contain readme:check — add:"
      info "  - run: pnpm readme:check"
      info "  - run: python scripts/build_knowledge.py"
      info "  - run: python scripts/verify_claims.py"
      info "  - run: pnpm verify:registry"
    fi
  done
else
  warn "no .github/workflows/*.yml found — add a CI workflow manually"
fi

# ---------------------------------------------------------------------------
# Step 8: run readme:status and readme:check
# ---------------------------------------------------------------------------
step "Step 8 — generate & verify README status block"
if [ -n "$PY" ] && [ -f scripts/readme_status.py ] && [ -f public/knowledge/specs.json ]; then
  info "running: $PY scripts/readme_status.py"
  "$PY" scripts/readme_status.py 2>&1 | tee -a "$LOG"
  RC1=${PIPESTATUS[0]:-$?}
  if [ "${RC1:-1}" = "0" ]; then ok "readme:status OK"; else fail "readme:status failed (rc=$RC1)"; fi

  info "running: $PY scripts/readme_status.py --check"
  "$PY" scripts/readme_status.py --check 2>&1 | tee -a "$LOG"
  RC2=${PIPESTATUS[0]:-$?}
  if [ "${RC2:-1}" = "0" ]; then ok "readme:check OK — README is grounded"; else fail "readme:check failed (rc=$RC2) — README still stale or specs contain unknowns"; fi
else
  warn "skipping readme:status (need python, script, and specs.json)"
fi

# ---------------------------------------------------------------------------
# Step 9 (optional): end-to-end CLI runs
# ---------------------------------------------------------------------------
if [ "$E2E" = "1" ]; then
  step "Step 9 — end-to-end CLI runs"
  if [ -n "$PKG" ] && [ -f package.json ]; then
    for spec in \
      "__tests__/broken-dbt|dataops" \
      "__tests__/fixed-dbt|dataops" \
      "./.|webapp" \
    ; do
      REPO="${spec%%|*}"
      PROFILE="${spec##*|}"
      if [ -e "$REPO" ]; then
        info "reposcope --repo $REPO --profile $PROFILE"
        "$PKG" run reposcope -- --repo "$REPO" --profile "$PROFILE" 2>&1 | tee -a "$LOG"
        RC=$?
        [ "$RC" = "0" ] && ok "  done (exit 0)" || info "  exited with rc=$RC (expected on broken fixtures)"
      else
        warn "  skipping $REPO (not found)"
      fi
    done
  else
    warn "skipping e2e (no package manager or package.json)"
  fi
else
  info "Step 9 (--e2e) skipped — pass --e2e to run CLI end-to-end tests"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
step "Summary"
say "Log file: $LOG"
say "Backups:  README.md.bak-$TS / package.json.bak-$TS"
say ""
say "Next manual actions (see README hardening doc):"
say "  1) Inspect Step 6 report for shell:true and replace with spawnSync/execFileSync."
say "  2) Add readme:check + verify_claims.py + verify:registry to .github/workflows/ci.yml."
say "  3) Run 'git diff' to review all changes before committing."
say "  4) Only consider README 'verified' after 'pnpm readme:check' returns 0."
say ""

# trap _cleanup handles pause + exit code
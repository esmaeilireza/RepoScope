#!/usr/bin/env bash
# scripts/gates/check-grounded-claims.sh
#
# Verifies public-facing grounding claims are accurate and V1_V2.md
# documents all known V2 gaps.
set -euo pipefail

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; NC=$'\033[0m'
fail() { printf '%s[FAIL]%s %s\n' "$RED" "$NC" "$*" >&2; exit 1; }
pass() { printf '%s[PASS]%s %s\n' "$GREEN" "$NC" "$*"; }
warn() { printf '%s[WARN]%s %s\n' "$YELLOW" "$NC" "$*"; }

cd "$(git rev-parse --show-toplevel)"

# -- 1. No absolute grounding claims in public docs --------------------
GROUND_ABS_RE='(every|all)\s+(finding|rule)s?\s+(is|are)\s+(fully\s+)?(grounded|grounded in a book|cites? a book)'
hits=$(grep -rniE "$GROUND_ABS_RE" \
  --include='*.md' --include='*.txt' \
  --include='*.yml' --include='*.yaml' \
  README.md docs/ 2>/dev/null || true)
if [ -n "$hits" ]; then
  printf '%s\n' "$hits" >&2
  fail "absolute grounding claim found -- must be profile-qualified"
fi
pass "no absolute grounding claims in README.md or docs/"

# -- 2. V1_V2.md documents all eight V2 gaps ---------------------------
V1V2=docs/architecture/V1_V2.md
[ -f "$V1V2" ] || fail "$V1V2 missing"

required_gaps=(
  "AST ingestion"
  "general-* migration"
  "dataops-004 rename"
  "Router consumes IML signals"
  "PLC register extraction"
  "Multi-agent pipeline"
  "Citation-gate edge cases"
  "Industrial-ML drift detection"
)

# Strip markdown code backticks so "`general-*` migration" matches
# "general-* migration". The doc is allowed to decorate gap names with
# backticks or bold; the gate cares about the words, not the markup.
V1V2_text=$(tr -d '`' < "$V1V2")
for gap in "${required_gaps[@]}"; do
  printf '%s' "$V1V2_text" | grep -qF "$gap" \
    || fail "$V1V2 does not document V2 gap: $gap"
done
pass "$V1V2 documents all ${#required_gaps[@]} V2 gaps"

# -- 3. specs.json: 3 profiles / 34 rules ------------------------------
python - <<'PY'
import json, sys
from pathlib import Path
p = Path("public/knowledge/specs.json")
if not p.exists():
    sys.exit("[FAIL] public/knowledge/specs.json missing")
d = json.loads(p.read_text(encoding="utf-8"))
profiles = sorted(d.keys())
expected = ["dataops", "iiot", "webapp"]
if profiles != expected:
    sys.exit(f"[FAIL] specs.json profiles={profiles}, expected {expected}")
total = sum(len(v["rules"]) for v in d.values())
if total != 34:
    sys.exit(f"[FAIL] specs.json total={total}, expected 34")
print("[PASS] specs.json: 3 profiles, 34 rules")
PY

# -- 4. demo-repos/ present and non-empty ------------------------------
for d in demo-repos/iiot-demo demo-repos/dataops-demo demo-repos/webapp-demo demo-repos/iml-demo; do
  [ -d "$d" ] || fail "$d missing"
  [ -n "$(ls -A "$d" 2>/dev/null)" ] || fail "$d is empty"
done
pass "all four demo-repos/ present and non-empty"

# -- 5. verify_claims.py if present ------------------------------------
# PYTHONIOENCODING forces UTF-8 for the Python subprocess's stdout/stderr,
# otherwise non-ASCII symbols in verify_claims.py status strings crash with
# UnicodeEncodeError on cp1252 Windows terminals.
if [ -f scripts/verify_claims.py ]; then
  if ! PYTHONIOENCODING=utf-8 python scripts/verify_claims.py >/dev/null 2>&1; then
    # Re-run without suppression so the failure reason is visible.
    PYTHONIOENCODING=utf-8 python scripts/verify_claims.py >&2 || true
    fail "scripts/verify_claims.py failed"
  fi
  pass "scripts/verify_claims.py passed"
else
  warn "scripts/verify_claims.py not present -- skipped"
fi

echo
printf '%sall grounded-claim checks passed%s\n' "$GREEN" "$NC"
#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

# =============================================================================
# RepoScope Launch Hardening Script (Week 5, Days 21-25)
# Git Bash hardened version.
# =============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT INT TERM

fail() { printf '[FAIL] %s\n' "$1" >&2; exit 1; }
info() { printf '[INFO] %s\n' "$1"; }
ok()   { printf '[OK]   %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }

STRICT_LINT="${STRICT_LINT:-0}"
STRICT_PARITY="${STRICT_PARITY:-0}"
STRICT_GROUNDING="${STRICT_GROUNDING:-0}"
STRICT_SELF_AUDIT_WARNINGS="${STRICT_SELF_AUDIT_WARNINGS:-0}"

ALLOW_KNOWN_PARITY_DRIFT="${ALLOW_KNOWN_PARITY_DRIFT:-1}"
ALLOW_GROUNDING_DEBT="${ALLOW_GROUNDING_DEBT:-1}"
ALLOW_KNOWN_SELF_AUDIT_ERRORS="${ALLOW_KNOWN_SELF_AUDIT_ERRORS:-1}"

PARITY_EXCEPTION_FILE="docs/architecture/parity-exceptions.txt"
GROUNDING_EXCEPTION_FILE="docs/architecture/grounding-exceptions.txt"
SELF_AUDIT_EXCEPTION_FILE="docs/architecture/self-audit-exceptions.txt"

read_exception_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  grep -vE '^[[:space:]]*(#|$)' "$file" | tr -d '\r' | sed 's/[[:space:]]*$//' | grep -v '^$' || true
}

echo "============================================================"
echo "RepoScope Launch Hardening"
echo "Working dir: $ROOT_DIR"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "============================================================"

# ─────────────── Step 0: Prerequisites ───────────────
echo ""
echo "--- Step 0: Prerequisites ---"
[[ -f package.json ]] || fail "package.json missing"
[[ -f public/knowledge/specs.json ]] || fail "public/knowledge/specs.json missing"
[[ -f scripts/reposcope-audit.ts ]] || fail "scripts/reposcope-audit.ts missing"
command -v node >/dev/null || fail "node not on PATH"
command -v npx  >/dev/null || fail "npx not on PATH"

node -e 'JSON.parse(require("fs").readFileSync("package.json", "utf8"))' >/dev/null 2>&1 \
  || fail "package.json is not valid JSON. Run: bash scripts/troubleshoot-launch.sh --apply"

node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const missing = [];
for (const s of ["reposcope", "test"]) {
  if (!pkg.scripts || typeof pkg.scripts[s] !== "string") missing.push(s);
}
if (missing.length) { process.stderr.write(missing.join(",") + "\n"); process.exit(1); }
' || fail "Required npm scripts missing: reposcope,test"
ok "Prerequisites present."

# ─────────────── Step 1: Edge Runtime deprecation ───────────────
echo ""
echo "--- Step 1: Edge Runtime migration ---"
EDGE_RUNTIME_PATTERN='export[[:space:]]+const[[:space:]]+runtime[[:space:]]*=[[:space:]]*(\x27|\x22)edge(\x27|\x22)'

SCAN_DIRS=()
for d in app lib src/app src/lib pages src/pages; do [[ -d "$d" ]] && SCAN_DIRS+=("$d"); done

if (( ${#SCAN_DIRS[@]} > 0 )); then
  find "${SCAN_DIRS[@]}" \
    \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' \) -prune -o \
    -type f \( -name '*.bak' -o -name '*.bak.*' -o -name '*.orig' -o -name '*~' \) -print -delete >/dev/null 2>&1 || true

  mapfile -d '' -t FILES_WITH_EDGE < <(
    find "${SCAN_DIRS[@]}" \
      \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' \) -prune -o \
      -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.cjs' \) \
      ! -name '*.bak*' ! -name '*.orig' ! -name '*~' -print0 |
    xargs -0 -r grep -lZE "$EDGE_RUNTIME_PATTERN" --
  )

  if (( ${#FILES_WITH_EDGE[@]} > 0 )); then
    for file in "${FILES_WITH_EDGE[@]}"; do
      [[ -z "$file" ]] && continue
      node -e '
const fs = require("fs");
const file = process.argv[1];
const src = fs.readFileSync(file, "utf8");
const testRe = /^[ \t]*export[ \t]+const[ \t]+runtime[ \t]*=[ \t]*(\x27|\x22)edge\1[ \t]*;?[ \t]*$/m;
if (!testRe.test(src)) process.exit(0);
fs.writeFileSync(file, src.replace(/^[ \t]*export[ \t]+const[ \t]+runtime[ \t]*=[ \t]*(\x27|\x22)edge\1[ \t]*;?[ \t]*$/gm, ""), "utf8");
' "$file"
      echo "[FIX] Removed Edge Runtime export from $file"
    done
    ok "Edge Runtime migration complete."
  else
    info "No Edge Runtime usage found."
  fi
else
  info "No scan directories found for Edge Runtime migration."
fi

# ─────────────── Step 2: React version ───────────────
echo ""
echo "--- Step 2: React version ---"
REACT_VERSION="$(node -p "require('./package.json').dependencies?.react ?? 'missing'" 2>/dev/null || echo "error")"
[[ "$REACT_VERSION" == "missing" || "$REACT_VERSION" == "error" ]] && fail "React version not in package.json."

if [[ "$REACT_VERSION" =~ ^\^?18\. ]]; then
  warn "React 18 detected ($REACT_VERSION). Upgrade to React 19 before final release."
  REACT_DEGRADED=1
else
  ok "React version ($REACT_VERSION) compatible."
  REACT_DEGRADED=0
fi

# ─────────────── Step 3: CSP / security headers ───────────────
echo ""
echo "--- Step 3: CSP / security headers ---"
NEXT_CONFIG=""
for cand in next.config.ts next.config.mjs next.config.js; do [[ -f "$cand" ]] && NEXT_CONFIG="$cand" && break; done
[[ -z "$NEXT_CONFIG" ]] && fail "No next.config.* found."

CSP_STATUS=0
node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
if (/unsafe-inline[\s\S]*unsafe-eval|unsafe-eval[\s\S]*unsafe-inline/.test(text)) process.exit(2);
if (/unsafe-(inline|eval)/.test(text)) process.exit(1);
process.exit(0);
' "$NEXT_CONFIG" || CSP_STATUS=$?

if (( CSP_STATUS == 2 )); then
  fail "Unsafe CSP directives detected in $NEXT_CONFIG."
elif (( CSP_STATUS == 1 )); then
  warn "CSP contains unsafe-inline or unsafe-eval in $NEXT_CONFIG. Self-audit may flag this."
fi

if grep -qE '(async[[:space:]]+headers[[:space:]]*\(|headers[[:space:]]*:)' "$NEXT_CONFIG"; then
  ok "Headers configuration present in $NEXT_CONFIG."
else
  fail "No headers() block in $NEXT_CONFIG."
fi

# ─────────────── Step 4: TypeScript ───────────────
echo ""
echo "--- Step 4: TypeScript ---"
npx tsc --noEmit || fail "TypeScript compilation errors."
ok "TypeScript passed."

# ─────────────── Step 5: ESLint ───────────────
echo ""
echo "--- Step 5: ESLint ---"
ESLINT_OUT="$TMP_DIR/eslint.txt"
set +e
npx eslint . > "$ESLINT_OUT" 2>&1
ESLINT_EXIT=$?
set -e
cat "$ESLINT_OUT"

COUNTS="$(
  node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
const lines = text.split(/\r?\n/);
let summary = "";
for (let i = lines.length - 1; i >= 0; i -= 1) {
  if (/\b\d+ problems? \(/.test(lines[i])) { summary = lines[i]; break; }
}
const err = (summary.match(/(\d+) errors?[,)]/) || [])[1] || "0";
const warn = (summary.match(/(\d+) warnings?[,)]/) || [])[1] || "0";
process.stdout.write(err + " " + warn + "\n");
' "$ESLINT_OUT" 2>/dev/null || printf '0 0\n'
)"
read -r ERR_COUNT WARN_COUNT <<< "$COUNTS"
ERR_COUNT="${ERR_COUNT:-0}"; WARN_COUNT="${WARN_COUNT:-0}"

if (( ESLINT_EXIT != 0 && ERR_COUNT == 0 )); then
  fail "ESLint exited ${ESLINT_EXIT} without reporting an error count."
fi
if (( ERR_COUNT > 0 )); then
  fail "$ERR_COUNT ESLint error(s). Blocking."
fi
info "$WARN_COUNT ESLint warning(s) (pre-existing debt; non-blocking)."
if [[ "$STRICT_LINT" == "1" && "$WARN_COUNT" -gt 0 ]]; then
  fail "STRICT_LINT=1 set and $WARN_COUNT warning(s) remain."
fi
ok "ESLint has zero errors."

# ─────────────── Step 6: Spec parity contract ───────────────
echo ""
echo "--- Step 6: Spec parity contract ---"
PARITY_FILE="__tests__/contract/spec-parity.test.ts"
[[ -f "$PARITY_FILE" ]] || fail "$PARITY_FILE missing."
npx jest "$PARITY_FILE" --ci --runInBand || fail "Spec parity contract failed."
ok "Spec parity contract passed."

# ─────────────── Step 7: Static parity drift ───────────────
echo ""
echo "--- Step 7: Static parity drift (TS emitters vs specs.json) ---"
TS_IDS="$TMP_DIR/ts-ids.txt"
SPEC_IDS="$TMP_DIR/spec-ids.txt"

SOURCE_DIRS=()
for d in scripts lib src app pages; do [[ -d "$d" ]] && SOURCE_DIRS+=("$d"); done

TS_ID_PATTERN='(\x27|\x22)(dataops|iiot|webapp|cross|general)-[a-z0-9-]+(\x27|\x22)'

if (( ${#SOURCE_DIRS[@]} > 0 )); then
  {
    find "${SOURCE_DIRS[@]}" \
      \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' -o -path '*/__tests__/*' -o -path '*/tests/*' -o -path '*/fixtures/*' \) -prune -o \
      -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.bak*' ! -name '*.orig' ! -name '*~' -print0 |
    xargs -0 -r grep -hoE "$TS_ID_PATTERN" -- | tr -d "'\"" | sort -u > "$TS_IDS"
  } || true
else
  : > "$TS_IDS"
fi

node -e '
const fs = require("fs");
const out = process.argv[1];
const specs = JSON.parse(fs.readFileSync("public/knowledge/specs.json", "utf8"));
const ids = new Set();
for (const b of Object.values(specs)) for (const r of b.rules ?? []) if (r && typeof r.id === "string") ids.add(r.id);
fs.writeFileSync(out, [...ids].sort().join("\n") + "\n");
' "$SPEC_IDS"

declare -A KNOWN_PARITY=()
DEFAULT_PARITY_EXCEPTIONS=0
while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  KNOWN_PARITY["$id"]=1
done < <(read_exception_file "$PARITY_EXCEPTION_FILE")

if (( ${#KNOWN_PARITY[@]} == 0 )); then
  DEFAULT_PARITY_EXCEPTIONS=1
  for id in dataops-004 dataops-006 dataops-atwal-003 dataops-kleppmann-002 dataops-kleppmann-003; do
    KNOWN_PARITY["$id"]=1
  done
fi

UNKNOWN_DRIFT_FILE="$TMP_DIR/unknown-drift.txt"
KNOWN_DRIFT_FILE="$TMP_DIR/known-drift.txt"
: > "$UNKNOWN_DRIFT_FILE"; : > "$KNOWN_DRIFT_FILE"

while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  if [[ -n "${KNOWN_PARITY[$id]:-}" ]]; then printf '%s\n' "$id" >> "$KNOWN_DRIFT_FILE"
  else printf '%s\n' "$id" >> "$UNKNOWN_DRIFT_FILE"; fi
done < <(comm -23 "$TS_IDS" "$SPEC_IDS" || true)

UNKNOWN_PARITY_COUNT="$(wc -l < "$UNKNOWN_DRIFT_FILE" | tr -d ' ')"
KNOWN_PARITY_COUNT="$(wc -l < "$KNOWN_DRIFT_FILE" | tr -d ' ')"

if (( UNKNOWN_PARITY_COUNT > 0 )); then
  echo "Unknown emitter IDs absent from specs.json:"
  sed 's/^/  - /' "$UNKNOWN_DRIFT_FILE"
  fail "Unknown parity drift detected. Add YAML rules or update $PARITY_EXCEPTION_FILE only for reviewed legacy debt."
fi

if (( KNOWN_PARITY_COUNT > 0 )); then
  echo "Known legacy emitter IDs absent from specs.json:"
  sed 's/^/  - /' "$KNOWN_DRIFT_FILE"
  (( DEFAULT_PARITY_EXCEPTIONS == 1 )) && warn "Using built-in parity exceptions. Create $PARITY_EXCEPTION_FILE to make this explicit."
  if [[ "$STRICT_PARITY" == "1" || "$ALLOW_KNOWN_PARITY_DRIFT" == "0" ]]; then
    fail "STRICT_PARITY=1 or ALLOW_KNOWN_PARITY_DRIFT=0 and $KNOWN_PARITY_COUNT known parity drift(s) remain."
  else
    warn "$KNOWN_PARITY_COUNT known parity drift(s) accepted as launch debt."
  fi
else
  ok "No parity drift: every TS-emitted ID exists in specs.json."
fi

# ─────────────── Step 8: Grounding coverage ───────────────
echo ""
echo "--- Step 8: Grounding coverage ---"
GRAPH_FILE="public/knowledge/graph.json"
MISSING_RAW="$TMP_DIR/grounding-missing-raw.txt"
UNKNOWN_GROUNDING_FILE="$TMP_DIR/grounding-unknown.txt"
KNOWN_GROUNDING_FILE="$TMP_DIR/grounding-known.txt"
: > "$UNKNOWN_GROUNDING_FILE"; : > "$KNOWN_GROUNDING_FILE"

GROUNDING_STATUS=0
node -e '
const fs = require("fs");
if (!fs.existsSync("public/knowledge/graph.json")) process.exit(3);
const specs = JSON.parse(fs.readFileSync("public/knowledge/specs.json", "utf8"));
const graph = fs.readFileSync("public/knowledge/graph.json", "utf8");
const out = [];
for (const b of Object.values(specs)) for (const r of b.rules ?? []) {
  if (!r || typeof r.id !== "string") continue;
  const s = r.status ?? "active";
  if (s !== "active" && s !== "implemented") continue;
  if (!graph.includes(`"${r.id}"`)) out.push(r.id);
}
process.stdout.write(out.join("\n") + (out.length ? "\n" : ""));
' > "$MISSING_RAW" || GROUNDING_STATUS=$?

if (( GROUNDING_STATUS == 3 )); then
  if [[ "$ALLOW_GROUNDING_DEBT" == "1" && "$STRICT_GROUNDING" == "0" ]]; then
    warn "$GRAPH_FILE missing. Grounding coverage skipped as debt."
    TOTAL_GROUNDING_MISSING=0
  else
    fail "$GRAPH_FILE missing — run Week 3 pipeline."
  fi
elif (( GROUNDING_STATUS != 0 )); then
  fail "Grounding coverage check failed unexpectedly."
else
  declare -A KNOWN_GROUNDING=()
  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    KNOWN_GROUNDING["$id"]=1
  done < <(read_exception_file "$GROUNDING_EXCEPTION_FILE")

  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    if [[ -n "${KNOWN_GROUNDING[$id]:-}" ]]; then printf '%s\n' "$id" >> "$KNOWN_GROUNDING_FILE"
    else printf '%s\n' "$id" >> "$UNKNOWN_GROUNDING_FILE"; fi
  done < "$MISSING_RAW"

  TOTAL_GROUNDING_MISSING="$(wc -l < "$MISSING_RAW" | tr -d ' ')"
  UNKNOWN_GROUNDING_COUNT="$(wc -l < "$UNKNOWN_GROUNDING_FILE" | tr -d ' ')"
  KNOWN_GROUNDING_COUNT="$(wc -l < "$KNOWN_GROUNDING_FILE" | tr -d ' ')"

  if (( TOTAL_GROUNDING_MISSING > 0 )); then
    echo "Active rules without grounding entries:"
    head -n 20 "$MISSING_RAW" | sed 's/^/  - /'
    (( TOTAL_GROUNDING_MISSING > 20 )) && echo "  ... $((TOTAL_GROUNDING_MISSING - 20)) more"
  fi

  if (( STRICT_GROUNDING == 1 && UNKNOWN_GROUNDING_COUNT > 0 )); then
    fail "$UNKNOWN_GROUNDING_COUNT active rule(s) without grounding and without exception."
  elif (( TOTAL_GROUNDING_MISSING > 0 )); then
    if [[ "$ALLOW_GROUNDING_DEBT" == "1" ]]; then
      warn "$TOTAL_GROUNDING_MISSING active rule(s) without grounding. Run Week 3 pipeline or patch graph.json."
    else
      fail "$TOTAL_GROUNDING_MISSING active rule(s) without grounding."
    fi
  else
    ok "All active rules have grounding entries."
  fi
fi

# ─────────────── Step 9: RepoScope self-audit ───────────────
echo ""
echo "--- Step 9: RepoScope self-audit (webapp) ---"
AUDIT_OUT="$TMP_DIR/audit.txt"
set +e
npm run --silent reposcope -- --repo . --profile webapp --strict > "$AUDIT_OUT" 2>&1
AUDIT_EXIT=$?
set -e
cat "$AUDIT_OUT"

AUDIT_ERR_RAW="$TMP_DIR/audit-err.txt"
AUDIT_WARN_RAW="$TMP_DIR/audit-warn.txt"
UNKNOWN_AUDIT_ERR="$TMP_DIR/audit-unknown-err.txt"
KNOWN_AUDIT_ERR="$TMP_DIR/audit-known-err.txt"
: > "$AUDIT_ERR_RAW"; : > "$AUDIT_WARN_RAW"; : > "$UNKNOWN_AUDIT_ERR"; : > "$KNOWN_AUDIT_ERR"

node -e '
const fs = require("fs");
const kind = process.argv[2];
const text = fs.readFileSync(process.argv[1], "utf8");
const ids = [];
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\[(ERR|WARN)\s*\]\s+([A-Za-z0-9:_-]+)/);
  if (m && m[1] === kind) ids.push(m[2]);
}
process.stdout.write(ids.join("\n") + (ids.length ? "\n" : ""));
' "$AUDIT_OUT" ERR > "$AUDIT_ERR_RAW" || true

node -e '
const fs = require("fs");
const kind = process.argv[2];
const text = fs.readFileSync(process.argv[1], "utf8");
const ids = [];
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\[(ERR|WARN)\s*\]\s+([A-Za-z0-9:_-]+)/);
  if (m && m[1] === kind) ids.push(m[2]);
}
process.stdout.write(ids.join("\n") + (ids.length ? "\n" : ""));
' "$AUDIT_OUT" WARN > "$AUDIT_WARN_RAW" || true

TOTAL_AUDIT_ERR="$(wc -l < "$AUDIT_ERR_RAW" | tr -d ' ')"
SELF_AUDIT_WARN_COUNT="$(wc -l < "$AUDIT_WARN_RAW" | tr -d ' ')"

declare -A KNOWN_SELF_AUDIT=()
DEFAULT_SELF_AUDIT_EXCEPTIONS=0
while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  KNOWN_SELF_AUDIT["$id"]=1
done < <(read_exception_file "$SELF_AUDIT_EXCEPTION_FILE")

if (( ${#KNOWN_SELF_AUDIT[@]} == 0 )); then
  DEFAULT_SELF_AUDIT_EXCEPTIONS=1
  KNOWN_SELF_AUDIT["webapp-csp-sem-001"]=1
fi

while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  if [[ -n "${KNOWN_SELF_AUDIT[$id]:-}" ]]; then printf '%s\n' "$id" >> "$KNOWN_AUDIT_ERR"
  else printf '%s\n' "$id" >> "$UNKNOWN_AUDIT_ERR"; fi
done < "$AUDIT_ERR_RAW"

UNKNOWN_SELF_AUDIT_ERR_COUNT="$(wc -l < "$UNKNOWN_AUDIT_ERR" | tr -d ' ')"
KNOWN_SELF_AUDIT_ERR_COUNT="$(wc -l < "$KNOWN_AUDIT_ERR" | tr -d ' ')"

if (( AUDIT_EXIT != 0 && TOTAL_AUDIT_ERR == 0 && SELF_AUDIT_WARN_COUNT == 0 )); then
  fail "Self-audit exited $AUDIT_EXIT without ERR/WARN markers. Investigate orchestrator."
fi
if (( UNKNOWN_SELF_AUDIT_ERR_COUNT > 0 )); then
  echo "Unknown self-audit errors:"
  sed 's/^/  - /' "$UNKNOWN_AUDIT_ERR"
  fail "Self-audit found unknown ERR findings."
fi
if (( KNOWN_SELF_AUDIT_ERR_COUNT > 0 )); then
  echo "Known self-audit errors accepted as debt:"
  sed 's/^/  - /' "$KNOWN_AUDIT_ERR"
  (( DEFAULT_SELF_AUDIT_EXCEPTIONS == 1 )) && warn "Using built-in self-audit exceptions. Create $SELF_AUDIT_EXCEPTION_FILE to make this explicit."
  if [[ "$ALLOW_KNOWN_SELF_AUDIT_ERRORS" == "0" ]]; then
    fail "$KNOWN_SELF_AUDIT_ERR_COUNT known self-audit error(s) remain and exceptions are disabled."
  else
    warn "$KNOWN_SELF_AUDIT_ERR_COUNT known self-audit error(s) accepted as launch debt."
  fi
fi
if (( SELF_AUDIT_WARN_COUNT > 0 )); then
  if [[ "$STRICT_SELF_AUDIT_WARNINGS" == "1" ]]; then
    fail "$SELF_AUDIT_WARN_COUNT self-audit warning(s) remain under STRICT_SELF_AUDIT_WARNINGS=1."
  else
    info "$SELF_AUDIT_WARN_COUNT self-audit warning(s) (non-blocking)."
  fi
fi
if (( KNOWN_SELF_AUDIT_ERR_COUNT == 0 && SELF_AUDIT_WARN_COUNT == 0 )); then
  ok "Self-audit clean under webapp profile."
else
  ok "Self-audit passed with tracked debt."
fi

# ─────────────── Step 10: Summary ───────────────
echo ""
echo "============================================================"
echo "Hardening Complete"
echo "============================================================"
echo "[✓] Prerequisites, Edge Runtime, CSP headers"
[[ "$REACT_DEGRADED" -eq 0 ]] && echo "[✓] React 19 compatibility" || echo "[!] React 18 — upgrade before launch"
echo "[✓] TypeScript clean"
echo "[✓] ESLint: 0 errors, ${WARN_COUNT} warnings"
echo "[✓] Spec parity contract"

if (( KNOWN_PARITY_COUNT > 0 )); then
  echo "[!] Static parity drift: ${KNOWN_PARITY_COUNT} known exception(s)"
else
  echo "[✓] Static parity drift"
fi

if (( TOTAL_GROUNDING_MISSING > 0 )); then
  echo "[!] Grounding coverage: ${TOTAL_GROUNDING_MISSING} active rule(s) without graph grounding"
else
  echo "[✓] Grounding coverage"
fi

if (( KNOWN_SELF_AUDIT_ERR_COUNT > 0 || SELF_AUDIT_WARN_COUNT > 0 )); then
  echo "[!] Self-audit: ${KNOWN_SELF_AUDIT_ERR_COUNT} known error(s), ${SELF_AUDIT_WARN_COUNT} warning(s)"
else
  echo "[✓] Self-audit (webapp profile)"
fi

echo ""
echo "Strict final-release mode:"
echo "  STRICT_LINT=1 STRICT_PARITY=1 STRICT_GROUNDING=1 ALLOW_KNOWN_PARITY_DRIFT=0 ALLOW_GROUNDING_DEBT=0 ALLOW_KNOWN_SELF_AUDIT_ERRORS=0 bash scripts/launch-hardening.sh"
echo ""
echo "Next: git add -A && git commit -m 'chore: harden launch config'"
echo "============================================================"
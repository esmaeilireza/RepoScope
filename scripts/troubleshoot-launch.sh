#!/usr/bin/env bash
set -uo pipefail
export LC_ALL=C

# =============================================================================
# RepoScope Launch Troubleshooter
# Usage:
#   bash scripts/troubleshoot-launch.sh
#   bash scripts/troubleshoot-launch.sh --apply
#   RUN_CONTRACT=0 bash scripts/troubleshoot-launch.sh --apply
# =============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT INT TERM

APPLY=0
RUN_CONTRACT="${RUN_CONTRACT:-1}"
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --skip-contract) RUN_CONTRACT=0 ;;
  esac
done

section() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

fail() { printf '[FAIL] %s\n' "$1" >&2; }
info() { printf '[INFO] %s\n' "$1"; }
ok()   { printf '[OK]   %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }

run_cmd() {
  printf '[RUN] '; printf '%q ' "$@"; printf '\n'
  "$@" || warn "command failed: $*"
}

validate_package_json() {
  node -e 'JSON.parse(require("fs").readFileSync("package.json","utf8"))' >/dev/null 2>&1
}

repair_package_json() {
  node -e '
const fs = require("fs");
const raw = fs.readFileSync("package.json", "utf8");
const start = raw.indexOf("{");
if (start < 0) process.exit(1);
let depth = 0, inString = false, escape = false, end = -1;
for (let i = start; i < raw.length; i += 1) {
  const ch = raw.charCodeAt(i);
  if (escape) { escape = false; continue; }
  if (inString) {
    if (ch === 92) escape = true;
    else if (ch === 34) inString = false;
    continue;
  }
  if (ch === 34) { inString = true; continue; }
  if (ch === 123) depth += 1;
  else if (ch === 125) { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
if (end < 0) process.exit(1);
const json = raw.slice(start, end);
JSON.parse(json);
fs.writeFileSync("package.json", json + "\n", "utf8");
'
}

add_missing_npm_scripts() {
  node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts = pkg.scripts || {};
const want = { "check:spec-parity": "tsx scripts/check-spec-parity.ts" };
let changed = false;
for (const [k, v] of Object.entries(want)) {
  if (!pkg.scripts[k]) { pkg.scripts[k] = v; changed = true; }
}
if (changed) fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf8");
process.stdout.write(changed ? "updated\n" : "ok\n");
'
}

clean_stale_backups() {
  local dirs=("$@"); (( ${#dirs[@]} > 0 )) || return 0
  mapfile -d '' -t baks < <(find "${dirs[@]}" \
    \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' \) -prune -o \
    -type f \( -name '*.bak' -o -name '*.bak.*' -o -name '*.orig' -o -name '*~' \) -print0)
  if (( ${#baks[@]} > 0 )); then
    warn "Stale backups: ${#baks[@]}"
    printf '%s\n' "${baks[@]}" | sed 's/^/  - /'
    if (( APPLY == 1 )); then
      find "${dirs[@]}" \
        \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' \) -prune -o \
        -type f \( -name '*.bak' -o -name '*.bak.*' -o -name '*.orig' -o -name '*~' \) -delete
      ok "Deleted stale backups."
    else
      info "Re-run with --apply to delete."
    fi
  else
    ok "No stale backups."
  fi
}

fix_edge_runtime_exports() {
  local dirs=("$@"); (( ${#dirs[@]} > 0 )) || return 0
  local pattern='export[[:space:]]+const[[:space:]]+runtime[[:space:]]*=[[:space:]]*(\x27|\x22)edge(\x27|\x22)'
  mapfile -d '' -t files < <(find "${dirs[@]}" \
    \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' \) -prune -o \
    -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.cjs' \) \
    ! -name '*.bak*' ! -name '*.orig' ! -name '*~' -print0 |
    xargs -0 -r grep -lZE "$pattern" --)
  if (( ${#files[@]} > 0 )); then
    warn "Edge Runtime exports: ${#files[@]}"
    printf '%s\n' "${files[@]}" | sed 's/^/  - /'
    if (( APPLY == 1 )); then
      for f in "${files[@]}"; do
        node -e '
const fs = require("fs");
const f = process.argv[1];
const src = fs.readFileSync(f, "utf8");
const testRe = /^[ \t]*export[ \t]+const[ \t]+runtime[ \t]*=[ \t]*(\x27|\x22)edge\1[ \t]*;?[ \t]*$/m;
if (!testRe.test(src)) process.exit(0);
fs.writeFileSync(f, src.replace(/^[ \t]*export[ \t]+const[ \t]+runtime[ \t]*=[ \t]*(\x27|\x22)edge\1[ \t]*;?[ \t]*$/gm, ""), "utf8");
' "$f"
        ok "Removed from $f"
      done
    fi
  else
    ok "No Edge Runtime exports."
  fi
}

section "T0. Environment"
printf 'pwd: %s\n' "$PWD"
printf 'bash: %s\n' "${BASH_VERSION:-unknown}"
command -v node >/dev/null && node --version || warn "node missing"
command -v npm  >/dev/null && npm --version  || warn "npm missing"
command -v npx  >/dev/null && npx --version  || warn "npx missing"
command -v python >/dev/null && python --version || info "python not on PATH"

section "T1. package.json integrity"
if validate_package_json; then
  ok "package.json is valid JSON."
else
  fail "package.json invalid JSON."
  if (( APPLY == 1 )); then
    cp package.json "$TMP_DIR/package.json.corrupt" 2>/dev/null || true
    repair_package_json && ok "Recovered first valid JSON object." || fail "Automatic repair failed. Run: git restore package.json"
  else
    info "Re-run with --apply to attempt repair."
  fi
fi

if validate_package_json; then
  node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
const want = ["reposcope","test","check:spec-parity"];
const missing = want.filter(k => !pkg.scripts || typeof pkg.scripts[k] !== "string");
if (missing.length) { process.stderr.write(missing.join(",") + "\n"); process.exit(1); }
' 2>"$TMP_DIR/missing.txt" || true
  if [[ -s "$TMP_DIR/missing.txt" ]]; then
    warn "Missing npm scripts: $(cat "$TMP_DIR/missing.txt")"
    if (( APPLY == 1 )); then
      add_missing_npm_scripts >/dev/null && ok "Added missing npm scripts."
    fi
  else
    ok "Required npm scripts present."
  fi
fi

section "T2. Stale backups and Edge Runtime"
SCAN_DIRS=()
for d in app lib src pages scripts components; do [[ -d "$d" ]] && SCAN_DIRS+=("$d"); done
clean_stale_backups "${SCAN_DIRS[@]}"
fix_edge_runtime_exports "${SCAN_DIRS[@]}"

section "T3. specs.json sanity"
if [[ -f public/knowledge/specs.json ]]; then
  node -e '
const fs = require("fs");
const s = JSON.parse(fs.readFileSync("public/knowledge/specs.json","utf8"));
let rules = 0, active = 0;
for (const b of Object.values(s)) for (const r of b.rules ?? []) {
  rules += 1; if ((r.status ?? "active") === "active") active += 1;
}
process.stdout.write(`rules=${rules} active=${active}\n`);
' || fail "specs.json invalid."
else
  fail "public/knowledge/specs.json missing."
fi

section "T4. Discovery — what knowledge pipeline scripts exist?"
for p in \
  scripts/build_knowledge.py \
  scripts/kg/seed.py \
  scripts/kg/assemble_graph.py \
  scripts/kg/build_graph.py \
  scripts/extract_pdf.py \
  scripts/citation-gate.ts \
  scripts/check-spec-parity.ts
do
  [[ -f "$p" ]] && ok "found: $p" || info "absent: $p"
done

section "T5. Exception files"
mkdir -p docs/architecture
PARITY_EX="docs/architecture/parity-exceptions.txt"
GROUND_EX="docs/architecture/grounding-exceptions.txt"
SELF_EX="docs/architecture/self-audit-exceptions.txt"

if (( APPLY == 1 )); then
  if [[ ! -f "$PARITY_EX" ]]; then
    cat > "$PARITY_EX" <<'PARITY_EOF'
# Legacy DataOps emitters not yet in docs/specs/*.yaml.
# Remove an ID only after migrating the TS emitter or adding the YAML rule.
PARITY_EOF
    ok "Created $PARITY_EX"
  else ok "$PARITY_EX exists"; fi

  if [[ ! -f "$GROUND_EX" ]]; then
    cat > "$GROUND_EX" <<'GROUND_EOF'
# Accepted grounding debt. Prefer rebuilding graph.json over extending this file.
GROUND_EOF
    ok "Created $GROUND_EX"
  else ok "$GROUND_EX exists"; fi

  if [[ ! -f "$SELF_EX" ]]; then
    cat > "$SELF_EX" <<'SELF_EOF'
# Accepted self-audit debt (e.g., webapp-csp-sem-001 until CSP is tightened).
SELF_EOF
    ok "Created $SELF_EX"
  else ok "$SELF_EX exists"; fi
else
  for f in "$PARITY_EX" "$GROUND_EX" "$SELF_EX"; do
    [[ -f "$f" ]] && ok "$f exists" || info "$f missing (run --apply)"
  done
fi

section "T6. Static parity drift"
TS_IDS="$TMP_DIR/ts-ids.txt"; SPEC_IDS="$TMP_DIR/spec-ids.txt"
TS_ID_PATTERN='(\x27|\x22)(dataops|iiot|webapp|cross|general)-[a-z0-9-]+(\x27|\x22)'
SOURCE_DIRS=()
for d in scripts lib src app pages; do [[ -d "$d" ]] && SOURCE_DIRS+=("$d"); done
if (( ${#SOURCE_DIRS[@]} > 0 )); then
  { find "${SOURCE_DIRS[@]}" \
      \( -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/.venv/*' -o -path '*/dist/*' -o -path '*/build/*' -o -path '*/.git/*' -o -path '*/__tests__/*' -o -path '*/tests/*' -o -path '*/fixtures/*' \) -prune -o \
      -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.bak*' ! -name '*.orig' ! -name '*~' -print0 |
    xargs -0 -r grep -hoE "$TS_ID_PATTERN" -- | tr -d "'\"" | sort -u > "$TS_IDS"; } || true
else : > "$TS_IDS"; fi
node -e '
const fs = require("fs");
const out = process.argv[1];
const specs = JSON.parse(fs.readFileSync("public/knowledge/specs.json","utf8"));
const ids = new Set();
for (const b of Object.values(specs)) for (const r of b.rules ?? []) if (r && typeof r.id === "string") ids.add(r.id);
fs.writeFileSync(out, [...ids].sort().join("\n") + "\n");
' "$SPEC_IDS"
DRIFT="$(comm -23 "$TS_IDS" "$SPEC_IDS" || true)"
if [[ -n "$DRIFT" ]]; then
  warn "TS-emitted IDs absent from specs.json:"
  printf '%s\n' "$DRIFT" | sed 's/^/  - /'
else
  ok "No static parity drift."
fi

section "T7. Grounding coverage (the 37-item debt)"
if [[ -f public/knowledge/graph.json ]]; then
  MISSING="$TMP_DIR/missing-ground.txt"
  node -e '
const fs = require("fs");
const specs = JSON.parse(fs.readFileSync("public/knowledge/specs.json","utf8"));
const graph = fs.readFileSync("public/knowledge/graph.json","utf8");
const out = [];
for (const b of Object.values(specs)) for (const r of b.rules ?? []) {
  if (!r || typeof r.id !== "string") continue;
  const s = r.status ?? "active";
  if (s !== "active" && s !== "implemented") continue;
  if (!graph.includes(`"${r.id}"`)) out.push(r.id);
}
process.stdout.write(out.join("\n"));
' > "$MISSING"
  N="$(wc -l < "$MISSING" | tr -d ' ')"
  if (( N > 0 )); then
    warn "$N active rule(s) missing grounding:"
    head -n 15 "$MISSING" | sed 's/^/  - /'
    (( N > 15 )) && info "  ... $((N-15)) more"
    info "Full list saved to $MISSING (this run only)."
  else
    ok "All active rules grounded."
  fi
else
  warn "public/knowledge/graph.json missing."
fi

section "T8. ESLint"
ESLINT_OUT="$TMP_DIR/eslint.txt"
set +e; npx eslint . > "$ESLINT_OUT" 2>&1; ESLINT_EXIT=$?; set -e
node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
const lines = text.split(/\r?\n/);
let summary = "";
for (let i = lines.length - 1; i >= 0; i -= 1) if (/\b\d+ problems? \(/.test(lines[i])) { summary = lines[i]; break; }
const err = (summary.match(/(\d+) errors?[,)]/) || [])[1] || "0";
const warn = (summary.match(/(\d+) warnings?[,)]/) || [])[1] || "0";
process.stdout.write(`ESLint exit=${process.argv[2]} errors=${err} warnings=${warn}\n`);
' "$ESLINT_OUT" "$ESLINT_EXIT"
(( ESLINT_EXIT != 0 )) && tail -n 40 "$ESLINT_OUT" || true

section "T9. Spec parity contract"
if [[ "$RUN_CONTRACT" == "1" && -f __tests__/contract/spec-parity.test.ts ]]; then
  run_cmd npx jest __tests__/contract/spec-parity.test.ts --ci --runInBand
else
  info "Contract test skipped."
fi

section "T10. Self-audit webapp"
AUDIT_OUT="$TMP_DIR/audit.txt"
set +e; npm run --silent reposcope -- --repo . --profile webapp --strict > "$AUDIT_OUT" 2>&1; AUDIT_EXIT=$?; set -e
node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
let err = 0, warn = 0; const errIds = [], warnIds = [];
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\[(ERR|WARN)\s*\]\s+([A-Za-z0-9:_-]+)/);
  if (!m) continue;
  if (m[1] === "ERR") { err += 1; errIds.push(m[2]); }
  else { warn += 1; warnIds.push(m[2]); }
}
process.stdout.write(`Self-audit exit=${process.argv[2]} errors=${err} warnings=${warn}\n`);
if (errIds.length) process.stdout.write("ERR IDs: " + [...new Set(errIds)].join(", ") + "\n");
if (warnIds.length) process.stdout.write("WARN IDs: " + [...new Set(warnIds)].join(", ") + "\n");
' "$AUDIT_OUT" "$AUDIT_EXIT"
(( AUDIT_EXIT != 0 )) && tail -n 60 "$AUDIT_OUT" || true

section "T11. CSP static inspection"
NEXT_CONFIG=""
for c in next.config.ts next.config.mjs next.config.js; do [[ -f "$c" ]] && NEXT_CONFIG="$c" && break; done
if [[ -n "$NEXT_CONFIG" ]]; then
  node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
const unsafe = text.match(/[^\n]*unsafe-(?:inline|eval)[^\n]*/g) || [];
if (!unsafe.length) process.stdout.write("No unsafe-inline/unsafe-eval in " + process.argv[1] + "\n");
else { process.stdout.write("Unsafe CSP literals in " + process.argv[1] + ":\n"); for (const l of unsafe) process.stdout.write("  - " + l.trim() + "\n"); }
' "$NEXT_CONFIG"
else warn "No next.config.* found."; fi

section "T12. Recommended next commands"
cat <<'EOF'
1. Apply safe repairs + exception scaffolding:
     bash scripts/troubleshoot-launch.sh --apply

2. Re-run debt-tolerant hardening:
     bash scripts/launch-hardening.sh

3. Before final release, run strict mode:
     STRICT_LINT=1 STRICT_PARITY=1 STRICT_GROUNDING=1 \
     ALLOW_KNOWN_PARITY_DRIFT=0 ALLOW_GROUNDING_DEBT=0 ALLOW_KNOWN_SELF_AUDIT_ERRORS=0 \
     bash scripts/launch-hardening.sh
EOF
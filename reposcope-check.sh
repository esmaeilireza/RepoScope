#!/usr/bin/env bash
# =============================================================================
# reposcope-check.sh
# RepoScope comprehensive health gate.
#
# Usage:
#   bash reposcope-check.sh [REPO_ROOT] [options]
#
# Options:
#   --strict              Exit 1 if any violation exists, including warnings.
#   --repo PATH           Target repository root. Default: current directory.
#   --skip-cli            Skip CLI self-audit and negative control.
#   --skip-negative       Skip negative control test.
#   --skip-kg             Skip knowledge graph checks.
#   --skip-citation       Skip citation gate / markdown grounding checks.
#   --run-node-tests      Run package test script if present.
#   --run-pytest          Run offline Python spec test if present.
#   --llm-command CMD     Run an optional local LLM smoke test through CMD.
#   --help                Show help.
#
# Notes:
#   - This script intentionally does not use set -e.
#   - It uses explicit exit-code handling and guarded commands.
#   - Dangerous literals used for negative control are split to avoid
#     self-triggering RepoScope rules when this script is scanned.
# =============================================================================

set -uo pipefail

# -----------------------------------------------------------------------------
# Temporary cleanup
# -----------------------------------------------------------------------------
TMPFILES=()

cleanup() {
  if ((${#TMPFILES[@]} > 0)); then
    for f in "${TMPFILES[@]}"; do
      if [[ -n "$f" ]]; then
        rm -rf "$f" 2>/dev/null || true
      fi
    done
  fi
}

trap cleanup EXIT

# -----------------------------------------------------------------------------
# Usage
# -----------------------------------------------------------------------------
usage() {
  cat <<'USAGE'
reposcope-check.sh — RepoScope comprehensive health gate

Usage:
  bash reposcope-check.sh [REPO_ROOT] [options]

Options:
  --strict              Exit 1 if any violation exists, including warnings.
  --repo PATH           Target repository root. Default: current directory.
  --skip-cli            Skip CLI self-audit and negative control.
  --skip-negative       Skip negative control test.
  --skip-kg             Skip knowledge graph checks.
  --skip-citation       Skip citation gate / markdown grounding checks.
  --run-node-tests      Run package test script if present.
  --run-pytest          Run offline Python spec test if present.
  --llm-command CMD     Run optional local LLM smoke test through CMD.
  --help                Show this help.

Examples:
  bash reposcope-check.sh .
  bash reposcope-check.sh . --strict
  bash reposcope-check.sh /d/path/to/repo --skip-negative
  bash reposcope-check.sh . --run-node-tests --run-pytest
USAGE
}

# -----------------------------------------------------------------------------
# Defaults
# -----------------------------------------------------------------------------
REPO="."
REPO_SET=false

STRICT=false
SKIP_CLI=false
SKIP_NEGATIVE=false
SKIP_KG=false
SKIP_CITATION=false
RUN_NODE_TESTS=false
RUN_PYTEST=false
LLM_CMD=""

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT=true
      ;;

    --repo)
      if [[ $# -lt 2 ]]; then
        echo "--repo requires a value" >&2
        exit 2
      fi
      REPO="$2"
      REPO_SET=true
      shift
      ;;

    --skip-cli)
      SKIP_CLI=true
      ;;

    --skip-negative)
      SKIP_NEGATIVE=true
      ;;

    --skip-kg)
      SKIP_KG=true
      ;;

    --skip-citation)
      SKIP_CITATION=true
      ;;

    --run-node-tests)
      RUN_NODE_TESTS=true
      ;;

    --run-pytest)
      RUN_PYTEST=true
      ;;

    --llm-command)
      if [[ $# -lt 2 ]]; then
        echo "--llm-command requires a value" >&2
        exit 2
      fi
      LLM_CMD="$2"
      shift
      ;;

    --help|-h)
      usage
      exit 0
      ;;

    *)
      if [[ "$REPO_SET" == false && "$1" != --* ]]; then
        REPO="$1"
        REPO_SET=true
      else
        echo "Unknown argument: $1" >&2
        usage >&2
        exit 2
      fi
      ;;
  esac
  shift
done

# -----------------------------------------------------------------------------
# Validate repository root
# -----------------------------------------------------------------------------
if [[ ! -d "$REPO" ]]; then
  echo "Repository root does not exist or is not a directory: $REPO" >&2
  exit 2
fi

ROOT="$(cd "$REPO" && pwd -P)"
cd "$ROOT" || exit 2

# -----------------------------------------------------------------------------
# Colors
# -----------------------------------------------------------------------------
if [[ -t 1 ]]; then
  RED=$'\033[0;31m'
  GREEN=$'\033[0;32m'
  YELLOW=$'\033[1;33m'
  CYAN=$'\033[0;36m'
  BLUE=$'\033[0;34m'
  BOLD=$'\033[1m'
  RESET=$'\033[0m'
else
  RED=""
  GREEN=""
  YELLOW=""
  CYAN=""
  BLUE=""
  BOLD=""
  RESET=""
fi

SEP="------------------------------------------------------------------------------"

# -----------------------------------------------------------------------------
# Counters
# -----------------------------------------------------------------------------
CRITICALS=0
ERRORS=0
WARNINGS=0
INFOS=0

# -----------------------------------------------------------------------------
# Output helpers
# -----------------------------------------------------------------------------
pass() {
  printf ' %sPASS%s %s\n' "$GREEN" "$RESET" "$*"
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf ' %sWARN%s %s\n' "$YELLOW" "$RESET" "$*"
}

fail() {
  ERRORS=$((ERRORS + 1))
  printf ' %sFAIL%s %s\n' "$RED" "$RESET" "$*"
}

crit() {
  CRITICALS=$((CRITICALS + 1))
  printf ' %sCRIT%s %s\n' "$RED" "$RESET" "$*"
}

info() {
  INFOS=$((INFOS + 1))
  printf ' %sINFO%s %s\n' "$CYAN" "$RESET" "$*"
}

section() {
  printf '\n%s%s%s\n%s\n' "$BOLD" "$*" "$RESET" "$SEP"
}

require_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    pass "$path present"
  else
    fail "$path missing"
  fi
}

require_dir() {
  local path="$1"
  if [[ -d "$path" ]]; then
    pass "$path present"
  else
    fail "$path missing"
  fi
}

strip_ansi() {
  sed 's/\x1b\[[0-9;]*m//g'
}

is_number() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

# -----------------------------------------------------------------------------
# Environment detection
# -----------------------------------------------------------------------------
section "Environment"

HAVE_NODE=false
HAVE_PNPM=false
HAVE_NPX=false
HAVE_GIT=false
HAVE_PYTHON=false
PYTHON_BIN=""

NODE_VER="$(node --version 2>/dev/null || true)"
if [[ -n "$NODE_VER" ]]; then
  HAVE_NODE=true
  pass "node $NODE_VER"
else
  crit "node not found"
fi

PNPM_VER="$(pnpm --version 2>/dev/null || true)"
if [[ -n "$PNPM_VER" ]]; then
  HAVE_PNPM=true
  pass "pnpm $PNPM_VER"
else
  fail "pnpm not found"
fi

NPX_VER="$(npx --version 2>/dev/null || true)"
if [[ -n "$NPX_VER" ]]; then
  HAVE_NPX=true
  pass "npx $NPX_VER"
else
  fail "npx not found"
fi

GIT_VER="$(git --version 2>/dev/null | head -n 1 || true)"
if [[ -n "$GIT_VER" ]]; then
  HAVE_GIT=true
  pass "$GIT_VER"
else
  warn "git not found; some checks may be less precise"
fi

if command -v python >/dev/null 2>&1; then
  HAVE_PYTHON=true
  PYTHON_BIN="python"
  PY_VER="$(python --version 2>&1 | head -n 1 || true)"
  pass "python $PY_VER"
elif command -v python3 >/dev/null 2>&1; then
  HAVE_PYTHON=true
  PYTHON_BIN="python3"
  PY_VER="$(python3 --version 2>&1 | head -n 1 || true)"
  pass "python3 $PY_VER"
else
  info "python not found; draft YAML status detection and pytest checks may be limited"
fi

# -----------------------------------------------------------------------------
# Core files
# -----------------------------------------------------------------------------
section "Core files"

CORE_FILES=(
  "lib/audit.ts"
  "lib/types.ts"
  "lib/iiot-audit.ts"
  "scripts/reposcope-audit.ts"
  "bin/reposcope"
  "public/knowledge/specs.json"
  "package.json"
  "tsconfig.json"
)

for f in "${CORE_FILES[@]}"; do
  require_file "$f"
done

# -----------------------------------------------------------------------------
# CLI binary wiring
# -----------------------------------------------------------------------------
section "CLI binary wiring"

if [[ -f bin/reposcope ]]; then
  pass "bin/reposcope present"

  if [[ -x bin/reposcope ]]; then
    pass "bin/reposcope executable bit set"
  else
    warn "bin/reposcope is not executable; attempting chmod +x"
    if chmod +x bin/reposcope 2>/dev/null; then
      pass "chmod +x bin/reposcope succeeded"
    else
      fail "chmod +x bin/reposcope failed"
    fi
  fi

  printf ' %sbin/reposcope head:%s\n' "$BLUE" "$RESET"
  head -n 4 bin/reposcope 2>/dev/null | sed 's/^/      /' || true
else
  fail "bin/reposcope missing"
fi

# -----------------------------------------------------------------------------
# package.json
# -----------------------------------------------------------------------------
section "package.json"

PKG_BIN=""
PKG_REPOS_SCOPE_SCRIPT=""
PKG_TYPECHECK=""
PKG_TEST=""

if [[ ! -f package.json ]]; then
  fail "package.json missing; cannot inspect scripts/bin"
elif [[ "$HAVE_NODE" == false ]]; then
  fail "node missing; cannot parse package.json"
else
  PKG_PROBE="$(
    node -e '
      const fs = require("fs");
      try {
        const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
        console.log("BIN=" + ((p.bin && p.bin.reposcope) || ""));
        console.log("SCRIPT=" + ((p.scripts && p.scripts.reposcope) || ""));
        console.log("TYPECHECK=" + ((p.scripts && p.scripts.typecheck) || ""));
        console.log("TEST=" + ((p.scripts && p.scripts.test) || ""));
      } catch (e) {
        console.log("PARSE_ERROR=" + e.message);
      }
    ' 2>&1
  )" || true

  if [[ "$PKG_PROBE" == *PARSE_ERROR=* ]]; then
    crit "package.json is not valid JSON"
    printf '%s\n' "$PKG_PROBE" | sed 's/^/      /'
  else
    while IFS='=' read -r k v; do
      case "$k" in
        BIN) PKG_BIN="$v" ;;
        SCRIPT) PKG_REPOS_SCOPE_SCRIPT="$v" ;;
        TYPECHECK) PKG_TYPECHECK="$v" ;;
        TEST) PKG_TEST="$v" ;;
      esac
    done <<< "$PKG_PROBE"

    if [[ "$PKG_BIN" == "./bin/reposcope" ]]; then
      pass "package.json bin.reposcope points to ./bin/reposcope"
    else
      fail "package.json bin.reposcope is missing or wrong: '$PKG_BIN'"
    fi

    if [[ -n "$PKG_REPOS_SCOPE_SCRIPT" ]] && printf '%s' "$PKG_REPOS_SCOPE_SCRIPT" | grep -q "reposcope-audit"; then
      pass "package.json scripts.reposcope references reposcope-audit.ts"
    else
      fail "package.json scripts.reposcope is missing or does not reference reposcope-audit.ts"
    fi

    if [[ -n "$PKG_TYPECHECK" ]]; then
      pass "package.json scripts.typecheck present: $PKG_TYPECHECK"
    else
      fail "package.json scripts.typecheck missing"
    fi

    if [[ -n "$PKG_TEST" ]]; then
      info "package.json scripts.test present: $PKG_TEST"
    else
      warn "package.json scripts.test missing"
    fi
  fi
fi

# -----------------------------------------------------------------------------
# specs.json structure
# -----------------------------------------------------------------------------
section "specs.json structure"

SPECS="public/knowledge/specs.json"

SPEC_RULES=0
SPEC_DUPLICATES=""
SPEC_SAMPLE_IDS=""
SPEC_IIOT_COUNT=0
SPEC_IIOT_IDS=""

if [[ ! -f "$SPECS" ]]; then
  fail "public/knowledge/specs.json missing; cannot inspect rule contract"
elif [[ "$HAVE_NODE" == false ]]; then
  fail "node missing; cannot parse public/knowledge/specs.json"
else
  SPEC_PROBE="$(
    node -e '
      const fs = require("fs");
      const p = process.argv[1];

      let raw;
      try {
        raw = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch (e) {
        console.log("PARSE_ERROR=" + e.message);
        process.exit(0);
      }

      const seen = Object.create(null);
      const ids = [];
      const dupSet = Object.create(null);

      function isRule(o) {
        return (
          o &&
          typeof o === "object" &&
          !Array.isArray(o) &&
          (
            typeof o.id === "string" ||
            Object.prototype.hasOwnProperty.call(o, "checks") ||
            Object.prototype.hasOwnProperty.call(o, "profile") ||
            Object.prototype.hasOwnProperty.call(o, "severity") ||
            Object.prototype.hasOwnProperty.call(o, "title")
          )
        );
      }

      function add(id) {
        if (typeof id !== "string" || !id) return;

        if (seen[id]) {
          dupSet[id] = true;
        } else {
          seen[id] = true;
          ids.push(id);
        }
      }

      function walk(node, keyHint) {
        if (Array.isArray(node)) {
          for (const x of node) walk(x, keyHint);
          return;
        }

        if (node && typeof node === "object") {
          if (isRule(node)) {
            add(typeof node.id === "string" && node.id ? node.id : keyHint);
          } else {
            for (const [k, v] of Object.entries(node)) {
              const nextHint =
                typeof k === "string" && /^[a-z][a-z0-9_-]*$/.test(k) ? k : keyHint;
              walk(v, nextHint);
            }
          }
        }
      }

      walk(raw, null);

      const iiot = ids
        .filter(function (id) {
          return id.indexOf("iiot-") === 0;
        })
        .sort();

      const dups = Object.keys(dupSet);

      console.log("RULES_COUNT=" + ids.length);
      console.log("DUPLICATES=" + dups.join(","));
      console.log("SAMPLE_IDS=" + ids.slice(0, 12).join(","));
      console.log("IIOT_COUNT=" + iiot.length);
      console.log("IIOT_IDS=" + iiot.join(","));
    ' "$SPECS" 2>&1
  )" || true

  if [[ "$SPEC_PROBE" == *PARSE_ERROR=* ]]; then
    crit "public/knowledge/specs.json is not valid JSON"
    printf '%s\n' "$SPEC_PROBE" | sed 's/^/      /'
  else
    while IFS='=' read -r k v; do
      case "$k" in
        RULES_COUNT) SPEC_RULES="$v" ;;
        DUPLICATES) SPEC_DUPLICATES="$v" ;;
        SAMPLE_IDS) SPEC_SAMPLE_IDS="$v" ;;
        IIOT_COUNT) SPEC_IIOT_COUNT="$v" ;;
        IIOT_IDS) SPEC_IIOT_IDS="$v" ;;
      esac
    done <<< "$SPEC_PROBE"

    if ! is_number "$SPEC_RULES"; then
      SPEC_RULES=0
    fi

    if ! is_number "$SPEC_IIOT_COUNT"; then
      SPEC_IIOT_COUNT=0
    fi

    if (( SPEC_RULES >= 40 )); then
      pass "specs.json contains $SPEC_RULES rules"
    else
      fail "specs.json contains only $SPEC_RULES rules; expected at least 40"
    fi

    if [[ -n "$SPEC_DUPLICATES" ]]; then
      fail "Duplicate rule IDs in specs.json: $SPEC_DUPLICATES"
    else
      pass "No duplicate rule IDs in specs.json"
    fi

    if [[ -n "$SPEC_SAMPLE_IDS" ]]; then
      info "Sample IDs: $SPEC_SAMPLE_IDS"
    fi

    if (( SPEC_IIOT_COUNT >= 9 )); then
      pass "specs.json contains $SPEC_IIOT_COUNT IIoT rule IDs"
    else
      fail "specs.json contains only $SPEC_IIOT_COUNT IIoT rule IDs; expected at least 9"
    fi
  fi
fi

# -----------------------------------------------------------------------------
# ID parity: specs.json <-> lib/iiot-audit.ts, draft-aware
# -----------------------------------------------------------------------------
section "IIoT rule ID parity"

IIOT_AUDIT_SRC="lib/iiot-audit.ts"
IIOT_YAML="docs/specs/iiot.yaml"

DRAFT_OR_SPECONLY_IDS=""

if [[ -f "$IIOT_YAML" && -n "$PYTHON_BIN" ]]; then
  DRAFT_OR_SPECONLY_IDS="$(
    "$PYTHON_BIN" - "$IIOT_YAML" <<'PYEOF'
import sys
import re

path = sys.argv[1]

ids = []
current_id = None
current_status = None
in_rule = False

id_re = re.compile(r'^\s*(?:-\s+)?id:\s*["\']?([^"\'\s]+)', re.MULTILINE)
status_re = re.compile(r'^\s*status:\s*["\']?([^"\'\s]+)', re.MULTILINE)

with open(path, encoding="utf-8") as fh:
    for line in fh:
        m = id_re.match(line)
        if m:
            if current_id and current_status in ("draft", "spec-only"):
                ids.append(current_id)

            current_id = m.group(1)
            current_status = None
            in_rule = True
            continue

        if in_rule:
            m = status_re.match(line)
            if m:
                current_status = m.group(1)

if current_id and current_status in ("draft", "spec-only"):
    ids.append(current_id)

seen = set()
out = []
for i in ids:
    if i not in seen:
        seen.add(i)
        out.append(i)

print("\n".join(out))
PYEOF
  )" || DRAFT_OR_SPECONLY_IDS=""
elif [[ -f "$IIOT_YAML" ]]; then
  info "Python not available; draft/spec-only IDs cannot be detected from iiot.yaml"
fi

SRC_IIOT_IDS="$(
  grep -oE '\biiot-[A-Za-z0-9]+(-[A-Za-z0-9]+)*\b' "$IIOT_AUDIT_SRC" 2>/dev/null |
    grep -vE '^iiot-audit$' |
    sort -u || true
)"

SPECS_IIOT_LIST="$(
  printf '%s' "$SPEC_IIOT_IDS" |
    tr ',' '\n' |
    sed '/^$/d' |
    sort -u || true
)"

if [[ -z "$SPECS_IIOT_LIST" && -f "$SPECS" && "$HAVE_NODE" == true ]]; then
  SPECS_IIOT_LIST="$(
    node -e '
      const fs = require("fs");
      const p = process.argv[1];

      let raw;
      try {
        raw = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch (e) {
        process.exit(0);
      }

      const ids = new Set();

      function isRule(o) {
        return (
          o &&
          typeof o === "object" &&
          !Array.isArray(o) &&
          (
            typeof o.id === "string" ||
            Object.prototype.hasOwnProperty.call(o, "checks") ||
            Object.prototype.hasOwnProperty.call(o, "profile") ||
            Object.prototype.hasOwnProperty.call(o, "severity") ||
            Object.prototype.hasOwnProperty.call(o, "title")
          )
        );
      }

      function add(id) {
        if (typeof id === "string" && id.startsWith("iiot-")) {
          ids.add(id);
        }
      }

      function walk(node, keyHint) {
        if (Array.isArray(node)) {
          for (const x of node) walk(x, keyHint);
          return;
        }

        if (node && typeof node === "object") {
          if (isRule(node)) {
            add(typeof node.id === "string" && node.id ? node.id : keyHint);
          } else {
            for (const [k, v] of Object.entries(node)) {
              const nextHint =
                typeof k === "string" && /^[a-z][a-z0-9_-]*$/.test(k) ? k : keyHint;
              walk(v, nextHint);
            }
          }
        }
      }

      walk(raw, null);

      const out = Array.from(ids).sort();
      console.log(out.join("\n"));
    ' "$SPECS" 2>/dev/null
  )" || SPECS_IIOT_LIST=""
fi

if [[ -z "$SRC_IIOT_IDS" && -z "$SPECS_IIOT_LIST" ]]; then
  fail "No IIoT IDs found in either lib/iiot-audit.ts or specs.json"
else
  PARITY_ERRORS=0
  UNIMPLEMENTED_WARN=0

  while IFS= read -r id; do
    [[ -z "$id" ]] && continue

    if ! printf '%s\n' "$SPECS_IIOT_LIST" | grep -qxF "$id"; then
      fail "IIoT ID '$id' implemented in lib/iiot-audit.ts but absent from specs.json"
      PARITY_ERRORS=$((PARITY_ERRORS + 1))
    fi
  done <<< "$SRC_IIOT_IDS"

  while IFS= read -r id; do
    [[ -z "$id" ]] && continue

    if printf '%s\n' "$SRC_IIOT_IDS" | grep -qxF "$id"; then
      continue
    fi

    if printf '%s\n' "$DRAFT_OR_SPECONLY_IDS" | grep -qxF "$id"; then
      info "IIoT ID '$id' is draft/spec-only in iiot.yaml — not yet implemented (expected)"
    else
      warn "IIoT ID '$id' in specs.json has no implementation in lib/iiot-audit.ts"
      UNIMPLEMENTED_WARN=$((UNIMPLEMENTED_WARN + 1))
    fi
  done <<< "$SPECS_IIOT_LIST"

  if (( PARITY_ERRORS == 0 && UNIMPLEMENTED_WARN == 0 )); then
    pass "All production IIoT IDs in specs.json are implemented in lib/iiot-audit.ts"
  fi
fi

# -----------------------------------------------------------------------------
# YAML rule manifests
# -----------------------------------------------------------------------------
section "YAML rule manifests"

SPECS_DIR="docs/specs"
require_dir "$SPECS_DIR"

SCHEMA_FILE="$SPECS_DIR/_schema.yaml"

if [[ -f "$SCHEMA_FILE" ]]; then
  pass "docs/specs/_schema.yaml present"

  REQUIRED_SCHEMA_FIELDS=(
    "id"
    "profile"
    "severity"
    "status"
    "title"
    "rationale"
    "checks"
    "fix"
    "references"
  )

  for field in "${REQUIRED_SCHEMA_FIELDS[@]}"; do
    SCHEMA_FIELD_PATTERN="(^|[[:space:]])-[[:space:]]+['\"]?${field}['\"]?([[:space:]]|$)|(^|[[:space:]])${field}[[:space:]]*:|['\"]${field}['\"]"

    if grep -Eiq "$SCHEMA_FIELD_PATTERN" "$SCHEMA_FILE" 2>/dev/null; then
      pass "_schema.yaml contains field: $field"
    else
      fail "_schema.yaml missing field: $field"
    fi
  done
else
  fail "docs/specs/_schema.yaml missing"
fi

YAML_DOMAINS=(
  "iiot"
  "dataops"
  "webapp"
  "cross"
  "general"
)

YAML_PREFIXES=(
  "iiot-"
  "dataops-"
  "webapp-"
  "cross-"
  "general-"
)

for i in "${!YAML_DOMAINS[@]}"; do
  domain="${YAML_DOMAINS[i]}"
  prefix="${YAML_PREFIXES[i]}"
  yfile="$SPECS_DIR/${domain}.yaml"

  if [[ -f "$yfile" ]]; then
    pass "docs/specs/${domain}.yaml present"

    if grep -Eiq "^[[:space:]]*(-[[:space:]]+)?id:[[:space:]]*['\"]?${prefix}" "$yfile" 2>/dev/null; then
      pass "docs/specs/${domain}.yaml contains IDs with prefix ${prefix}"
    else
      fail "docs/specs/${domain}.yaml has no IDs with prefix ${prefix}"
    fi
  else
    fail "docs/specs/${domain}.yaml missing"
  fi
done

# -----------------------------------------------------------------------------
# Knowledge graph artifacts
# -----------------------------------------------------------------------------
section "Knowledge graph artifacts"

if [[ "$SKIP_KG" == true ]]; then
  info "Skipping knowledge graph checks (--skip-kg)"
else
  KG_FILES=(
    "scripts/build_knowledge.py"
    "scripts/kg/extract.py"
    "scripts/kg/assemble_graph.py"
    "scripts/kg/validate_graph.py"
    "public/knowledge/graph.json"
  )

  for f in "${KG_FILES[@]}"; do
    require_file "$f"
  done

  GRAPH_FILE="public/knowledge/graph.json"
  GRAPH_NODES=0
  GRAPH_EDGES=0

  if [[ -f "$GRAPH_FILE" && "$HAVE_NODE" == true ]]; then
    GRAPH_PROBE="$(
      node -e '
        const fs = require("fs");
        const p = process.argv[1];

        let g;
        try {
          g = JSON.parse(fs.readFileSync(p, "utf8"));
        } catch (e) {
          console.log("PARSE_ERROR=" + e.message);
          process.exit(0);
        }

        let nodes = 0;
        let edges = 0;

        if (g && typeof g === "object") {
          if (Array.isArray(g.nodes)) {
            nodes = g.nodes.length;
          } else if (g.nodes && typeof g.nodes === "object") {
            nodes = Object.keys(g.nodes).length;
          }

          if (Array.isArray(g.edges)) {
            edges = g.edges.length;
          } else if (Array.isArray(g.links)) {
            edges = g.links.length;
          } else if (g.edges && typeof g.edges === "object") {
            edges = Object.keys(g.edges).length;
          } else if (g.links && typeof g.links === "object") {
            edges = Object.keys(g.links).length;
          }
        }

        console.log("NODES=" + nodes);
        console.log("EDGES=" + edges);
      ' "$GRAPH_FILE" 2>&1
    )" || true

    if [[ "$GRAPH_PROBE" == *PARSE_ERROR=* ]]; then
      crit "public/knowledge/graph.json is not valid JSON"
      printf '%s\n' "$GRAPH_PROBE" | sed 's/^/      /'
    else
      while IFS='=' read -r k v; do
        case "$k" in
          NODES) GRAPH_NODES="$v" ;;
          EDGES) GRAPH_EDGES="$v" ;;
        esac
      done <<< "$GRAPH_PROBE"

      if ! is_number "$GRAPH_NODES"; then
        GRAPH_NODES=0
      fi

      if ! is_number "$GRAPH_EDGES"; then
        GRAPH_EDGES=0
      fi

      if (( GRAPH_NODES > 0 )); then
        pass "graph.json contains $GRAPH_NODES nodes"
      else
        fail "graph.json contains 0 nodes"
      fi

      if (( GRAPH_EDGES > 0 )); then
        pass "graph.json contains $GRAPH_EDGES edges"
      else
        warn "graph.json contains 0 edges"
      fi
    fi
  elif [[ -f "$GRAPH_FILE" && "$HAVE_NODE" == false ]]; then
    fail "node missing; cannot validate graph.json"
  fi
fi

# -----------------------------------------------------------------------------
# Citation gate and markdown grounding
# -----------------------------------------------------------------------------
section "Citation gate and markdown grounding"

if [[ "$SKIP_CITATION" == true ]]; then
  info "Skipping citation gate checks (--skip-citation)"
else
  CITATION_FILES=(
    "lib/knowledge/graph.ts"
    "lib/knowledge/books.ts"
    "lib/knowledge/citation-gate.ts"
    "lib/insight.ts"
    "app/api/insight/route.ts"
  )

  for f in "${CITATION_FILES[@]}"; do
    require_file "$f"
  done

  GATE_FILE="lib/knowledge/citation-gate.ts"
  if [[ -f "$GATE_FILE" ]]; then
    if grep -Eiq "unverified[[:space:]]*source|source[[:space:]]*unverified|unverified_source|\[source unverified\]" "$GATE_FILE" 2>/dev/null; then
      pass "citation-gate.ts contains unverified-source marker"
    else
      fail "citation-gate.ts does not contain expected unverified-source marker"
    fi
  fi

  BOOKS_FILE="lib/knowledge/books.ts"
  if [[ -f "$BOOKS_FILE" ]]; then
    if grep -Eiq "(isbn|title|author|publisher|books?[[:space:]]*[:=])" "$BOOKS_FILE" 2>/dev/null; then
      pass "books.ts appears to contain a book/reference registry"
    else
      warn "books.ts does not obviously contain book/reference metadata"
    fi
  fi

  INSIGHT_FILE="lib/insight.ts"
  ROUTE_FILE="app/api/insight/route.ts"

  if [[ -f "$INSIGHT_FILE" || -f "$ROUTE_FILE" ]]; then
    if grep -Eiq "citation[-_]?gate" "$INSIGHT_FILE" "$ROUTE_FILE" 2>/dev/null; then
      pass "Insight layer references citation gate"
    else
      fail "Insight layer does not reference citation gate"
    fi
  fi

  NOTES_DIR="docs/notes"
  require_dir "$NOTES_DIR"

  if [[ -d "$NOTES_DIR" ]]; then
    NOTE_COUNT=0
    UNCITED_COUNT=0

    while IFS= read -r -d '' note; do
      NOTE_COUNT=$((NOTE_COUNT + 1))

      if ! grep -Eiq \
        '(>[[:space:]]*\*\*Source|(^|[[:space:]])sources?[[:space:]]*:|<!--[^>]*ref:|\[\^|(^|[[:space:]])citation[[:space:]]*:|^#+[[:space:]]*References?)' \
        "$note" 2>/dev/null; then
        UNCITED_COUNT=$((UNCITED_COUNT + 1))
        printf '      %s\n' "$note"
      fi
    done < <(find "$NOTES_DIR" -type f -name '*.md' -print0 2>/dev/null | sort -z)

    if (( NOTE_COUNT > 0 )); then
      pass "docs/notes contains $NOTE_COUNT markdown note(s)"
    else
      fail "docs/notes exists but contains no markdown notes"
    fi

    if (( UNCITED_COUNT > 0 )); then
      fail "$UNCITED_COUNT markdown note(s) lack citation markers"

      printf ' %sFIX%s: Add one of the following to each uncited note:\n' "$CYAN" "$RESET"
      printf '      ## References\n'
      printf '      > **Source:** Book Title — Chapter N\n'
      printf '      <!-- ref: Book Title -->\n'
      printf '      citation: Book Title\n'
    else
      pass "All markdown notes contain citation markers"
    fi
  fi
fi

# -----------------------------------------------------------------------------
# Marketing claim hygiene
# -----------------------------------------------------------------------------
section "Marketing claim hygiene"

OUTDATED_PHRASES=(
  "markdown checklists"
  "Data Architecture Gate"
  "compliance gates"
  "shift-left security practices"
  "automated telemetry markers"
)

OUTDATED_FOUND=0

for doc in README.md docs/methodology.md; do
  if [[ -f "$doc" ]]; then
    for phrase in "${OUTDATED_PHRASES[@]}"; do
      if grep -Fiq "$phrase" "$doc" 2>/dev/null; then
        OUTDATED_FOUND=$((OUTDATED_FOUND + 1))
        warn "$doc contains outdated phrase: $phrase"
      fi
    done
  else
    info "$doc not present; skipped phrase scan"
  fi
done

if (( OUTDATED_FOUND == 0 )); then
  pass "No outdated marketing phrases detected in checked documents"
fi

# -----------------------------------------------------------------------------
# TypeScript compilation
# -----------------------------------------------------------------------------
section "TypeScript compilation"

TSC_RC=0
TSC_OUT=""

if [[ ! -f tsconfig.json ]]; then
  fail "tsconfig.json missing; cannot run typecheck"
elif [[ -n "$PKG_TYPECHECK" && "$HAVE_PNPM" == true ]]; then
  TSC_OUT="$(pnpm run typecheck 2>&1)" || TSC_RC=$?
elif [[ "$HAVE_NPX" == true ]]; then
  TSC_OUT="$(npx --no-install tsc --noEmit -p tsconfig.json 2>&1)" || TSC_RC=$?
else
  fail "No TypeScript runner available: pnpm typecheck or npx tsc"
fi

if [[ -n "${TSC_OUT:-}" || "$TSC_RC" -ne 0 ]]; then
  TSC_ERRORS="$(printf '%s' "$TSC_OUT" | grep -c "error TS" || true)"

  if ! is_number "$TSC_ERRORS"; then
    TSC_ERRORS=0
  fi

  if (( TSC_RC == 0 && TSC_ERRORS == 0 )); then
    pass "TypeScript compilation succeeded with 0 errors"
  else
    fail "TypeScript compilation failed (exit=$TSC_RC, error_lines=$TSC_ERRORS)"
    printf ' %sFirst TypeScript errors:%s\n' "$BLUE" "$RESET"
    printf '%s\n' "$TSC_OUT" | grep "error TS" | head -n 20 | sed 's/^/      /' || true
  fi
fi

# -----------------------------------------------------------------------------
# CLI self-audit
# -----------------------------------------------------------------------------
section "CLI self-audit"

CLI_MODE="none"
CLI_CMD=()
CLI_FINDINGS=-1
CLI_STRICT_RC=0

if [[ "$SKIP_CLI" == true ]]; then
  info "Skipping CLI self-audit (--skip-cli)"
else
  if [[ -x bin/reposcope ]]; then
    CLI_MODE="bin"
    CLI_CMD=(./bin/reposcope)
  elif [[ "$HAVE_NPX" == true ]] && npx --no-install reposcope --repo . --help >/dev/null 2>&1; then
    CLI_MODE="npx-reposcope"
    CLI_CMD=(npx --no-install reposcope)
  elif [[ "$HAVE_NPX" == true && -f scripts/reposcope-audit.ts ]] && npx --no-install tsx --version >/dev/null 2>&1; then
    CLI_MODE="tsx-script"
    CLI_CMD=(npx --no-install tsx scripts/reposcope-audit.ts)
  fi

  if [[ "$CLI_MODE" == "none" ]]; then
    fail "No runnable CLI path found: bin/reposcope, npx reposcope, or tsx scripts/reposcope-audit.ts"
  else
    pass "CLI execution mode: $CLI_MODE"

    CLI_RAW="$("${CLI_CMD[@]}" --repo . 2>&1)" || true
    CLI_CLEAN="$(printf '%s' "$CLI_RAW" | strip_ansi)"

    SUMMARY_LINE="$(printf '%s' "$CLI_CLEAN" | grep '\[SUMMARY\]' | tail -n 1 || true)"

    if [[ -n "$SUMMARY_LINE" ]]; then
      pass "CLI produced a summary line"
      printf '      %s\n' "$SUMMARY_LINE"

      CLI_FINDINGS="$(
        printf '%s' "$SUMMARY_LINE" |
          sed -n 's/.*\[SUMMARY\][^0-9]*\([0-9][0-9]*\).*/\1/p'
      )"

      if [[ -z "$CLI_FINDINGS" ]]; then
        CLI_FINDINGS=-1
      fi

      if is_number "$CLI_FINDINGS"; then
        info "CLI reported finding count: $CLI_FINDINGS"
      else
        warn "CLI summary found, but finding count could not be parsed"
      fi
    else
      fail "CLI did not produce a [SUMMARY] line"
      printf '%s\n' "$CLI_CLEAN" | sed -n '1,40p' | sed 's/^/      /' || true
    fi

    CLI_STRICT_RC=0
    "${CLI_CMD[@]}" --repo . --strict >/dev/null 2>&1 || CLI_STRICT_RC=$?

    if is_number "$CLI_FINDINGS"; then
      if (( CLI_FINDINGS > 0 )); then
        if (( CLI_STRICT_RC != 0 )); then
          pass "CLI strict mode correctly exited with code $CLI_STRICT_RC despite $CLI_FINDINGS finding(s)"
        else
          fail "CLI strict mode exited 0 despite $CLI_FINDINGS finding(s)"
        fi
      else
        if (( CLI_STRICT_RC == 0 )); then
          pass "CLI strict mode clean"
        else
          fail "CLI strict mode exited with code $CLI_STRICT_RC despite 0 findings"
        fi
      fi
    else
      if (( CLI_STRICT_RC == 0 )); then
        info "CLI strict mode exited 0; finding count could not be parsed"
      else
        warn "CLI strict mode exited $CLI_STRICT_RC; finding count could not be parsed"
      fi
    fi
  fi
fi

# -----------------------------------------------------------------------------
# Negative control
# -----------------------------------------------------------------------------
section "Negative control"

if [[ "$SKIP_CLI" == true || "$SKIP_NEGATIVE" == true ]]; then
  info "Skipping negative control"
elif [[ "$CLI_MODE" == "none" ]]; then
  fail "Cannot run negative control because CLI mode is unavailable"
else
  TMPDIR_NEG="$(mktemp -d 2>/dev/null || echo "/tmp/reposcope-negative-$$")"
  mkdir -p "$TMPDIR_NEG"
  TMPFILES+=("$TMPDIR_NEG")

  cat > "$TMPDIR_NEG/package.json" <<'EOF'
{
  "name": "reposcope-negative-control",
  "version": "0.0.0",
  "private": true
}
EOF

  mkdir -p "$TMPDIR_NEG/src"

  # Split literals so this shell script does not trigger RepoScope IIoT rules.
  IP_A="192.168"
  IP_B=".1.10"
  PORT_A="50"
  PORT_B="2"

  MOD_PKG_A="pymod"
  MOD_PKG_B="bus"

  MOD_CLIENT_A="Modbus"
  MOD_CLIENT_B="TcpClient"

  cat > "$TMPDIR_NEG/src/plc_client.py" <<EOF
"""PLC client — negative control fixture."""

from ${MOD_PKG_A}${MOD_PKG_B}.client import ${MOD_CLIENT_A}${MOD_CLIENT_B}

PLC_HOST = "${IP_A}${IP_B}"
MODBUS_PORT = ${PORT_A}${PORT_B}

client = ${MOD_CLIENT_A}${MOD_CLIENT_B}(PLC_HOST, port=MODBUS_PORT)

# legacy endpoint ${IP_A}${IP_B}:${PORT_A}${PORT_B}
client.connect()
EOF

  echo "${MOD_PKG_A}${MOD_PKG_B}==3.6.3" > "$TMPDIR_NEG/requirements.txt"

  NEG_RAW="$("${CLI_CMD[@]}" --repo "$TMPDIR_NEG" 2>&1)" || true
  NEG_CLEAN="$(printf '%s' "$NEG_RAW" | strip_ansi)"

  if printf '%s' "$NEG_CLEAN" | grep -q '\[SUMMARY\]'; then
    pass "Negative control CLI produced a summary"
  else
    fail "Negative control CLI did not produce a summary"
    printf '%s\n' "$NEG_CLEAN" | sed -n '1,40p' | sed 's/^/      /' || true
  fi

  if printf '%s' "$NEG_CLEAN" | grep -qi 'iiot-002'; then
    pass "Negative control triggered iiot-002"
  else
    fail "Negative control did not trigger iiot-002"
  fi

  if printf '%s' "$NEG_CLEAN" | grep -qi 'iiot-007'; then
    pass "Negative control triggered iiot-007"
  else
    fail "Negative control did not trigger iiot-007"
  fi
fi

# -----------------------------------------------------------------------------
# Optional tests
# -----------------------------------------------------------------------------
if [[ "$RUN_NODE_TESTS" == true || "$RUN_PYTEST" == true || -n "$LLM_CMD" ]]; then
  section "Optional tests"
fi

if [[ "$RUN_NODE_TESTS" == true ]]; then
  if [[ "$HAVE_PNPM" == false ]]; then
    warn "pnpm missing; cannot run Node tests"
  elif [[ -z "$PKG_TEST" ]]; then
    warn "package.json has no test script; skipping Node tests"
  else
    NODE_TEST_RC=0
    NODE_TEST_OUT="$(pnpm test 2>&1)" || NODE_TEST_RC=$?

    if (( NODE_TEST_RC == 0 )); then
      pass "Node test suite passed"
    else
      fail "Node test suite failed"
      printf '%s\n' "$NODE_TEST_OUT" | tail -n 40 | sed 's/^/      /' || true
    fi
  fi
fi

if [[ "$RUN_PYTEST" == true ]]; then
  if [[ "$HAVE_PYTHON" == false ]]; then
    warn "python missing; cannot run pytest"
  elif [[ ! -f __tests__/test_specs.py ]]; then
    warn "__tests__/test_specs.py missing; skipping pytest"
  else
    PYTEST_RC=0
    PYTEST_OUT="$("$PYTHON_BIN" -m pytest __tests__/test_specs.py -q 2>&1)" || PYTEST_RC=$?

    if (( PYTEST_RC == 0 )); then
      pass "Python spec test passed"
    else
      fail "Python spec test failed"
      printf '%s\n' "$PYTEST_OUT" | tail -n 40 | sed 's/^/      /' || true
    fi
  fi
fi

if [[ -n "$LLM_CMD" ]]; then
  section "Local LLM citation smoke test"

  PROMPT="Reply with one sentence about RepoScope citation gating. If you cannot cite a registered book reference, include [source unverified]."

  LLM_OUT="$(printf '%s' "$PROMPT" | bash -lc "$LLM_CMD" 2>&1)" || true

  if printf '%s' "$LLM_OUT" | grep -Eqi 'source unverified|reference|book|citation'; then
    pass "LLM response contains citation-aware wording"
  else
    fail "LLM response did not contain citation-aware wording"
  fi

  printf ' %sLLM output preview:%s\n' "$BLUE" "$RESET"
  printf '%s\n' "$LLM_OUT" | sed -n '1,15p' | sed 's/^/      /' || true
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
section "Summary"

VIOLATIONS=$((CRITICALS + ERRORS + WARNINGS))
TOTAL_FINDINGS=$((CRITICALS + ERRORS + WARNINGS + INFOS))
DEDUCTIONS=$((CRITICALS * 20 + ERRORS * 15 + WARNINGS * 10))
SCORE=$((100 - DEDUCTIONS))

if (( SCORE < 0 )); then
  SCORE=0
fi

if (( SCORE >= 90 )); then
  SCORE_COLOR="$GREEN"
elif (( SCORE >= 70 )); then
  SCORE_COLOR="$YELLOW"
else
  SCORE_COLOR="$RED"
fi

printf ' Critical  : %s%d%s\n' "$RED" "$CRITICALS" "$RESET"
printf ' Errors    : %s%d%s\n' "$RED" "$ERRORS" "$RESET"
printf ' Warnings  : %s%d%s\n' "$YELLOW" "$WARNINGS" "$RESET"
printf ' Info      : %s%d%s\n' "$CYAN" "$INFOS" "$RESET"
printf ' Violations: %d\n' "$VIOLATIONS"
printf ' Findings  : %d\n' "$TOTAL_FINDINGS"
printf ' Deducted  : %d points\n' "$DEDUCTIONS"
printf '\n%sHealth Score: %s%d/100%s\n' "$BOLD" "$SCORE_COLOR" "$SCORE" "$RESET"

# -----------------------------------------------------------------------------
# Exit policy
# -----------------------------------------------------------------------------
# Normal mode:
#   exit 1 if critical or error findings exist.
#
# Strict mode:
#   exit 1 if any violation exists, including warnings.
#
# Info findings never fail the gate.
# -----------------------------------------------------------------------------
if (( CRITICALS + ERRORS > 0 )); then
  printf '\n%sGate failed: critical/error findings exist.%s\n' "$RED" "$RESET"
  exit 1
fi

if [[ "$STRICT" == true && "$VIOLATIONS" -gt 0 ]]; then
  printf '\n%sStrict gate failed: violations exist.%s\n' "$RED" "$RESET"
  exit 1
fi

printf '\n%sGate passed.%s\n' "$GREEN" "$RESET"
exit 0
#!/usr/bin/env bash
# ============================================================================
# RepoScope — Next Steps: diagnose Ollama, author first semantic rule,
# extend types.ts to accept semantic_eval, verify readiness.
# Idempotent. Safe to re-run.
# ============================================================================
set -euo pipefail

if [[ -n "${REPOSCOPE_ROOT:-}" ]]; then ROOT="$REPOSCOPE_ROOT"
elif [[ -f "./package.json" && -d "./lib" && -d "./docs" ]]; then ROOT="$(pwd)"
else echo "ERROR: run from repo root or set REPOSCOPE_ROOT" >&2; exit 1; fi
cd "$ROOT"
echo "==> Repo root: $ROOT"

OLLAMA_HOST="${REPOSCOPE_OLLAMA_HOST:-http://localhost:11434}"
MODEL_TAG="${REPOSCOPE_OLLAMA_MODEL:-qwen2.5:7b}"

# ============================================================================
# 1. Diagnose Ollama
# ============================================================================
echo ""
echo "==> [1/4] Diagnosing Ollama at $OLLAMA_HOST ..."

if ! command -v curl >/dev/null; then
  echo "ERROR: curl not on PATH" >&2; exit 1
fi

set +e
HTTP_BODY=$(curl -sS --max-time 5 "$OLLAMA_HOST/api/tags" 2>/tmp/ollama_err.txt)
HTTP_CODE=$?
set -e

if [[ $HTTP_CODE -ne 0 ]]; then
  echo "    [FAIL] curl exited with code $HTTP_CODE"
  echo "           stderr: $(cat /tmp/ollama_err.txt 2>/dev/null | head -3)"
  echo ""
  echo "    Ollama is not reachable. Try one of:"
  echo "      a) Start the desktop app:   open 'Ollama' from Start Menu"
  echo "      b) Start the CLI server:    ollama serve"
  echo "      c) Check the port:          netstat -ano | grep 11434"
  echo "      d) If Docker:               docker ps | grep ollama"
  echo ""
  echo "    Once Ollama responds, re-run: ./scripts/next-steps.sh"
  exit 1
fi

if [[ -z "$HTTP_BODY" ]]; then
  echo "    [FAIL] curl succeeded (exit 0) but returned empty body."
  echo "           This usually means the server accepted the connection"
  echo "           but the endpoint returned nothing — most often because"
  echo "           Ollama is starting up. Wait 5 seconds and retry:"
  echo "             sleep 5 && curl -sS $OLLAMA_HOST/api/tags"
  exit 1
fi

echo "    [OK] Ollama responded"
echo "    Models registered:"
echo "$HTTP_BODY" | node -e '
  let buf = "";
  process.stdin.on("data", c => buf += c);
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(buf);
      const names = (data.models || []).map(m => m.name);
      if (names.length === 0) { console.log("      (none)"); }
      else { names.forEach(n => console.log("      - " + n)); }
    } catch { console.log("      (could not parse JSON)"); }
  });
'

# Check that the model we want is present
MODEL_PRESENT=$(echo "$HTTP_BODY" | node -e '
  let buf = "";
  process.stdin.on("data", c => buf += c);
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(buf);
      const names = (data.models || []).map(m => m.name);
      const want = process.argv[1];
      // Match either exact tag or base name
      const found = names.some(n => n === want || n.split(":")[0] === want.split(":")[0]);
      console.log(found ? "yes" : "no");
    } catch { console.log("no"); }
  });
' "$MODEL_TAG")

if [[ "$MODEL_PRESENT" != "yes" ]]; then
  echo ""
  echo "    [WARN] '$MODEL_TAG' is not registered on Ollama."
  echo "           Either pull it:"
  echo "             ollama pull $MODEL_TAG"
  echo "           Or edit MODEL in scripts/semantic-calibrate.ts to match"
  echo "           one of the models listed above."
  echo ""
  echo "           After fixing the model, re-run: ./scripts/next-steps.sh"
  exit 1
fi

echo "    [OK] '$MODEL_TAG' is registered"

# ============================================================================
# 2. Extend lib/types.ts with semantic_eval
# ============================================================================
echo ""
echo "==> [2/4] Checking lib/types.ts for semantic_eval ..."
TYPES_TS="lib/types.ts"
if [[ ! -f "$TYPES_TS" ]]; then
  echo "    [FAIL] $TYPES_TS not found" >&2; exit 1
fi

if grep -q '"semantic_eval"' "$TYPES_TS"; then
  echo "    [skip] semantic_eval already declared in RuleCheckType"
else
  echo "    Patching RuleCheckType to include semantic_eval ..."
  node <<'PATCH_TYPES_EOF'
const fs = require("fs");
const file = "lib/types.ts";
let src = fs.readFileSync(file, "utf8");

// Find the RuleCheckType union and add semantic_eval
const m = src.match(/(export\s+type\s+RuleCheckType\s*=\s*)([^;]+);/);
if (!m) {
  console.error("    ERROR: could not find RuleCheckType union");
  process.exit(1);
}
const body = m[2];
if (body.includes('"semantic_eval"')) {
  console.log("    [skip] already present inside union");
  process.exit(0);
}
const newBody = body.replace(/(\|\s*"file_absent")/, '$1\n  | "semantic_eval"');
if (!newBody.includes('"semantic_eval"')) {
  console.error("    ERROR: patch regex did not match");
  process.exit(1);
}
src = src.replace(m[0], m[1] + newBody + ";");

// Ensure RuleCheck has the three new optional fields
if (!/evaluation_prompt\s*\?:/.test(src)) {
  src = src.replace(
    /export\s+interface\s+RuleCheck\s*\{/,
    `export interface RuleCheck {\n  /** semantic_eval ONLY — instruction sent to the local LLM. */\n  evaluation_prompt?: string;\n  /** Pass threshold in [0,1]. Default 0.7. */\n  threshold?: number;\n  /** Max characters fed to the LLM. Default 8000. */\n  max_input_chars?: number;`
  );
}

fs.writeFileSync(file, src);
console.log("    [OK] RuleCheckType + RuleCheck patched");
PATCH_TYPES_EOF
fi

# ============================================================================
# 3. Author first semantic rule in docs/specs/dataops.yaml
# ============================================================================
echo ""
echo "==> [3/4] Checking docs/specs/dataops.yaml for semantic rules ..."
DATAOPS_YAML="docs/specs/dataops.yaml"
if [[ ! -f "$DATAOPS_YAML" ]]; then
  echo "    [FAIL] $DATAOPS_YAML not found — create it first" >&2; exit 1
fi

RULE_ID="dataops-runbook-sem-001"
if grep -q "id: \"$RULE_ID\"\\|id: $RULE_ID" "$DATAOPS_YAML"; then
  echo "    [skip] $RULE_ID already declared"
else
  echo "    Appending $RULE_ID (status: draft) ..."
  # Detect if the file has a top-level `rules:` key; if not, error
  if ! grep -qE '^rules:' "$DATAOPS_YAML"; then
    echo "    [FAIL] $DATAOPS_YAML has no top-level 'rules:' key" >&2
    echo "           Inspect the file and add 'rules:' before retrying" >&2
    exit 1
  fi

  cat >> "$DATAOPS_YAML" <<'RULE_EOF'

  # =================================================================
  # SEMANTIC EVALUATION — Layer 3 (LLM content scoring)
  # Calibrated against __tests__/fixtures/semantic/dataops-runbook-sem-001/
  # =================================================================
  - id: "dataops-runbook-sem-001"
    profile: "dataops"
    severity: "error"
    title: "Runbook lacks actionable triage structure"
    rationale: >
      A runbook must contain detection criteria, triage commands, escalation
      path, and postmortem template. Mere existence of the file is not enough.
    status: "draft"
    checks:
      - type: "semantic_eval"
        file_glob: "docs/runbooks/*.md"
        threshold: 0.7
        max_input_chars: 8000
        evaluation_prompt: |
          You are a senior SRE reviewing an incident runbook.
          Score from 0.0 to 1.0 based on presence and quality of:
          1. Detection criteria — how to know the incident occurred
          2. Triage steps — ordered, actionable commands (not prose)
          3. Escalation path — who to contact, when, with what info
          4. Postmortem template — required sections (timeline, root cause, action items)
          5. Runbook-specific commands — not generic troubleshooting advice
          Respond ONLY in JSON: {"score": <0..1>, "missing": [<strings>], "reasoning": <string>}
        message: "Runbook lacks actionable triage structure"
    fix: |
      Add explicit escalation contacts with phone/on-call rotation.
      Add numbered triage commands (not prose).
      Include postmortem template section with timeline, root cause, action items.
    references:
      - book: "Site Reliability Engineering: How Google Runs Production Systems"
        concept: "on-call-and-incident-management"
RULE_EOF
  echo "    [OK] $RULE_ID appended with status: draft"
fi

# ============================================================================
# 4. Verify readiness
# ============================================================================
echo ""
echo "==> [4/4] Verifying readiness ..."
fail=0

# YAML parses + rule is present + has semantic_eval
node -e '
const fs = require("fs");
const yaml = require("js-yaml");
const doc = yaml.load(fs.readFileSync("docs/specs/dataops.yaml", "utf8"));
const rules = doc.rules || [];
const sem = rules.filter(r => (r.checks || []).some(c => c.type === "semantic_eval"));
if (sem.length === 0) { console.error("no semantic rules"); process.exit(1); }
console.log(`    [OK] ${sem.length} semantic rule(s) in dataops.yaml`);
' || fail=1

# Types accept semantic_eval
grep -q '"semantic_eval"' lib/types.ts \
  && echo "    [OK] lib/types.ts RuleCheckType includes semantic_eval" \
  || { echo "    [FAIL] semantic_eval missing from types.ts" >&2; fail=1; }

# Fixtures present
meta=$(find __tests__/fixtures/semantic -name meta.json 2>/dev/null | wc -l | tr -d ' ')
[[ "$meta" == "5" ]] \
  && echo "    [OK] $meta meta.json fixture contracts" \
  || { echo "    [FAIL] expected 5 meta.json, found $meta" >&2; fail=1; }

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "==> NOT READY — see [FAIL] lines above." >&2
  exit 1
fi

cat <<'DONE_EOF'

============================================================
READY. Run calibration now:
============================================================
    npm run semantic:calibrate

Expected first run: most rows FAIL_SCORE. For each failing row:

  1. Read the "reasoning" field printed beside it.
  2. If model detected the right deficit but scored outside the band:
       -> adjust the band in __tests__/fixtures/semantic/<rule>/meta.json
  3. If model flagged a deficit the fixture doesn't contain:
       -> the evaluation_prompt is under-specified; sharpen it in
          docs/specs/dataops.yaml, then re-run
  4. If model returns no recognizable deficit:
       -> fixture is too generic; rewrite the offending fixture
          (usually borderline.md) with a sharper contrast

Stop when `npm run semantic:calibrate` exits 0. Only then flip
status: "draft" -> "active" in docs/specs/dataops.yaml.

The other four rules (dataops-data-product, dataops-kimball,
iiot-loto, webapp-csp) are NOT yet in their YAML files. Author
them one at a time after dataops-runbook-sem-001 is calibrated.
============================================================
DONE_EOF
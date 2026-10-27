#!/usr/bin/env bash
# Lock RepoScope's semantic calibration to reposcope-mistral:latest
# (mistral-7b-instruct-v0.2.Q4_K_M.gguf). Idempotent.
set -euo pipefail

if [[ -n "${REPOSCOPE_ROOT:-}" ]]; then ROOT="$REPOSCOPE_ROOT"
elif [[ -f "./package.json" && -d "./lib" ]]; then ROOT="$(pwd)"
else echo "ERROR: run from repo root or set REPOSCOPE_ROOT" >&2; exit 1; fi
cd "$ROOT"
echo "==> Repo root: $ROOT"

TARGET_TAG="reposcope-mistral:latest"
# GGUF directory. Override with REPOSCOPE_GGUF_DIR for non-Windows or
# non-default install locations.
GGUF_DIR="${REPOSCOPE_GGUF_DIR:-$HOME/.ollama/models/mistral-7b-instruct-v0.2.Q4_K_M}"
if [[ ! -d "$GGUF_DIR" ]]; then
  echo "ERROR: GGUF_DIR=$GGUF_DIR not found. Set REPOSCOPE_GGUF_DIR to override." >&2
  exit 1
fi
GGUF_DIR_GITBASH='/d/Machine learning/Ollama Models/mistral-7b-instruct-v0.2.Q4_K_M'

# ============================================================================
# 1. Verify Ollama is up
# ============================================================================
echo ""
echo "==> [1/5] Checking Ollama ..."
TAGS=$(curl -sS --max-time 5 http://localhost:11434/api/tags 2>/dev/null || true)
if [[ -z "$TAGS" ]]; then
  echo "ERROR: Ollama not responding at :11434" >&2
  echo "       Start it with: ollama serve" >&2
  exit 1
fi
echo "    [OK] Ollama responded"

# ============================================================================
# 2. Ensure $TARGET_TAG is registered
# ============================================================================
echo ""
echo "==> [2/5] Checking $TARGET_TAG ..."
REGISTERED=$(echo "$TAGS" | node -e '
  let buf = "";
  process.stdin.on("data", c => buf += c);
  process.stdin.on("end", () => {
    const names = (JSON.parse(buf).models || []).map(m => m.name);
    console.log(names.includes(process.argv[1]) ? "yes" : "no");
  });
' "$TARGET_TAG")

if [[ "$REGISTERED" == "yes" ]]; then
  echo "    [OK] $TARGET_TAG is registered"
else
  echo "    [WARN] $TARGET_TAG is not registered — attempting to create it"
  if [[ ! -d "$GGUF_DIR_GITBASH" ]]; then
    echo "    ERROR: GGUF dir not found: $GGUF_DIR_GITBASH" >&2
    echo "           Expected path (Windows): $GGUF_DIR" >&2
    exit 1
  fi
  GGUF_FILE=$(find "$GGUF_DIR_GITBASH" -maxdepth 1 -name "*.gguf" | head -1)
  if [[ -z "$GGUF_FILE" ]]; then
    echo "    ERROR: no .gguf in $GGUF_DIR_GITBASH" >&2
    exit 1
  fi
  echo "    Found GGUF: $(basename "$GGUF_FILE")"

  MODELFILE="$GGUF_DIR_GITBASH/Modelfile"
  if [[ ! -f "$MODELFILE" ]]; then
    echo "    Creating Modelfile ..."
    cat > "$MODELFILE" <<'MODELFILE_EOF'
FROM mistral-7b-instruct-v0.2.Q4_K_M.gguf
PARAMETER temperature 0
PARAMETER num_predict 512
PARAMETER stop [INST]
PARAMETER stop [/INST]
MODELFILE_EOF
  fi

  ( cd "$GGUF_DIR_GITBASH" && ollama create reposcope-mistral -f Modelfile )
  echo "    [OK] $TARGET_TAG registered"
fi

# ============================================================================
# 3. Smoke-test: does mistral honour format: "json"?
# ============================================================================
echo ""
echo "==> [3/5] Smoke-testing JSON mode on $TARGET_TAG ..."
SMOKE=$(curl -sS --max-time 30 http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d "{\"model\":\"$TARGET_TAG\",\"prompt\":\"Reply with exactly this JSON and nothing else: {\\\"ok\\\":true}\",\"format\":\"json\",\"stream\":false,\"options\":{\"temperature\":0,\"num_predict\":32}}" 2>/dev/null || true)

if [[ -z "$SMOKE" ]]; then
  echo "    [FAIL] Ollama did not respond to /api/generate" >&2
  exit 1
fi

SMOKE_VALID=$(echo "$SMOKE" | node -e '
  let buf = "";
  process.stdin.on("data", c => buf += c);
  process.stdin.on("end", () => {
    try {
      const outer = JSON.parse(buf);
      JSON.parse(outer.response);
      console.log("yes");
    } catch (e) {
      console.log("no: " + (e.message || "unknown"));
    }
  });
')

if [[ "$SMOKE_VALID" == "yes" ]]; then
  echo "    [OK] $TARGET_TAG honours format:\"json\""
else
  echo "    [FAIL] $TARGET_TAG does NOT return valid JSON with format:\"json\"" >&2
  echo "           detail: $SMOKE_VALID" >&2
  echo "           raw response: $(echo "$SMOKE" | head -c 300)" >&2
  echo "" >&2
  echo "           This is a hard blocker — the calibration loop cannot run." >&2
  echo "           Options:" >&2
  echo "             a) Re-create $TARGET_TAG from the GGUF with an explicit template" >&2
  echo "             b) Fall back to qwen2.5:latest if it honours JSON mode" >&2
  exit 1
fi

# ============================================================================
# 4. Update MODEL in calibration + preference order in diagnostics
# ============================================================================
echo ""
echo "==> [4/5] Pinning scripts/semantic-calibrate.ts to $TARGET_TAG ..."
CALIB=scripts/semantic-calibrate.ts
[[ -f "$CALIB" ]] || { echo "ERROR: $CALIB missing" >&2; exit 1; }

node -e '
  const fs = require("fs");
  const file = process.argv[1];
  const want = process.argv[2];
  let src = fs.readFileSync(file, "utf8");
  if (!/const MODEL = "[^"]+";/.test(src)) {
    console.error("ERROR: no `const MODEL = \"...\";` in " + file);
    process.exit(1);
  }
  src = src.replace(/const MODEL = "[^"]+";/, `const MODEL = "${want}";`);
  fs.writeFileSync(file, src);
  console.log("    [OK] MODEL -> " + want);
' "$CALIB" "$TARGET_TAG"

# Belt-and-suspenders: also patch next-steps.sh preference list if it exists
NEXT=scripts/next-steps.sh
if [[ -f "$NEXT" ]] && grep -q 'const prefer = \[' "$NEXT"; then
  echo "==> Patching preference order in $NEXT ..."
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const want = process.argv[2];
    let src = fs.readFileSync(file, "utf8");
    src = src.replace(/const prefer = \[[^\]]*\];/, `const prefer = ["${want}"];`);
    fs.writeFileSync(file, src);
    console.log("    [OK] prefer -> [" + want + "]");
  ' "$NEXT" "$TARGET_TAG"
fi

# ============================================================================
# 5. Harden ollama.ts error body (same as before; skip if already done)
# ============================================================================
echo ""
echo "==> [5/5] Hardening lib/llm/ollama.ts error reporting ..."
OLLAMA_TS=lib/llm/ollama.ts
[[ -f "$OLLAMA_TS" ]] || { echo "ERROR: $OLLAMA_TS missing" >&2; exit 1; }

if grep -q "Ollama error body" "$OLLAMA_TS"; then
  echo "    [skip] already hardened"
else
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    let src = fs.readFileSync(file, "utf8");
    const before = src;
    src = src.replace(
      /if \(!res\.ok\) \{\s*throw new Error\(`Ollama HTTP \$\{res\.status\} \$\{res\.statusText\}`\);\s*\}/,
      `if (!res.ok) {\n      const errBody = await res.text().catch(() => "");\n      throw new Error(\`Ollama HTTP \${res.status} \${res.statusText} — Ollama error body: \${errBody.slice(0, 300)}\`);\n    }`
    );
    if (src === before) {
      console.error("    ERROR: could not locate !res.ok block");
      process.exit(1);
    }
    fs.writeFileSync(file, src);
    console.log("    [OK] error body will now be surfaced");
  ' "$OLLAMA_TS"
fi

# ============================================================================
# Verify
# ============================================================================
echo ""
echo "==> Verifying ..."
grep -q "const MODEL = \"$TARGET_TAG\"" "$CALIB" \
  && echo "    [OK] $CALIB uses $TARGET_TAG" \
  || { echo "    [FAIL] MODEL not updated" >&2; exit 1; }

cat <<'WARN'

============================================================
  Locked to reposcope-mistral:latest
  (mistral-7b-instruct-v0.2.Q4_K_M.gguf)
============================================================

IMPORTANT — model changed from the qwen2.5 baseline:

  The fixture bands in __tests__/fixtures/semantic/*/meta.json
  were authored against qwen2.5. Mistral-7B-Instruct-Q4_K_M is a
  different architecture. Expect score drift.

Next:
  1. npm run semantic:calibrate
  2. Read the reasoning: field on each row — it names the model's
     interpretation, which tells you which of the three fixes applies
     (band / prompt / fixture — see the (c) section).
  3. Watch specifically for the "no gradient" failure mode:
     if good, borderline, AND bad all score within 0.10 of each
     other, mistral is not discriminating — either it isn't reading
     the criteria, or the evaluation_prompt is too vague. If that
     happens on dataops-runbook-sem-001, sharpen criterion #2 from
     "ordered, actionable commands" to "numbered shell commands".
  4. If mistral cannot produce gradient scores after two rounds of
     prompt-sharpening, that is a signal about model capability for
     this task, not a fixable bug. The decision then is:
       a) accept lower precision from mistral (adjust bands down)
       b) fall back to qwen2.5:latest for this rule set only
       c) keep mistral but split the rule into narrower criteria
     Do not silently widen bands to make mistral "pass" — that
     destroys the discrimination property the bands exist to protect.
============================================================
WARN
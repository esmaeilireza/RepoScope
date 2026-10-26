#!/usr/bin/env bash
set +e

print_file() {
  local f="$1"
  printf '\n===== FILE: %s =====\n' "$f"
  if [ -f "$f" ]; then
    cat -- "$f"
  else
    printf 'MISSING\n'
  fi
  printf '\n===== END FILE: %s =====\n' "$f"
}

print_file_if_small() {
  local f="$1"
  local max="${2:-500000}"
  printf '\n===== OPTIONAL FILE: %s =====\n' "$f"
  if [ -f "$f" ]; then
    local size
    size="$(wc -c < "$f" 2>/dev/null | tr -d '[:space:]')"
    if [ -n "$size" ] && [ "$size" -le "$max" ]; then
      cat -- "$f"
    else
      printf 'SKIPPED_LARGE size=%s max=%s\n' "$size" "$max"
    fi
  else
    printf 'MISSING\n'
  fi
  printf '\n===== END OPTIONAL FILE: %s =====\n' "$f"
}

printf '===== REPOSCOPE CONTEXT BUNDLE =====\n'
printf 'Generated: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'PWD: %s\n' "$(pwd)"
printf 'Git root: %s\n' "$(git rev-parse --show-toplevel 2>/dev/null || echo not-a-git-repo)"

printf '\n##### GROUP 1: CORE SPECS, CONFIG, LIB, TESTS, SCRIPTS #####\n'
for f in \
  docs/specs/webapp.yaml \
  docs/specs/_schema.yaml \
  docs/specs/dataops.yaml \
  docs/specs/dataops/lockfile-parity.yaml \
  docs/specs/iiot.yaml \
  docs/specs/cross.yaml \
  docs/specs/graph.yaml \
  package.json \
  tsconfig.json \
  pytest.ini \
  lib/types.ts \
  lib/knowledge/books.ts \
  lib/knowledge/graph.ts \
  lib/knowledge/citation-gate.ts \
  lib/knowledge/standards.ts \
  lib/llm/providers.ts \
  lib/llm/adapters.ts \
  lib/llm/client.ts \
  app/api/insight/route.ts \
  __tests__/llm-layer.test.ts \
  __tests__/specs.test.ts \
  __tests__/graph-grounding.test.ts \
  __tests__/graph-spec.test.ts \
  __tests__/test_specs.py \
  scripts/verify-knowledge-registry.ts \
  scripts/build_knowledge.py
do
  print_file "$f"
done

printf '\n##### GROUP 2: NOTE CONTRACT FILES #####\n'
for f in \
  docs/notes/webapp/the-devops-handbook.md \
  docs/notes/dataops/data-management-at-scale.md \
  docs/notes/dataops/fundamentals-of-data-engineering.md \
  docs/notes/dataops/the-data-warehouse-toolkit.md \
  docs/notes/iiot/industrial-network-security.md \
  docs/notes/dataops/analytics-engineering-with-sql-and-dbt.md \
  docs/notes/dataops/data-quality-fundamentals.md \
  docs/notes/dataops/designing-data-intensive-applications.md \
  docs/notes/dataops/practical-dataops.md \
  docs/notes/iiot/automating-manufacturing-systems-with-plcs.md \
  docs/notes/iiot/opc-unified-architecture.md \
  docs/notes/iiot/plc-controls-with-structured-text.md \
  docs/notes/iiot/practical-industrial-data-networks.md \
  docs/notes/industrial-ml/01-realtime-streams/designing-event-driven-systems.md \
  docs/notes/industrial-ml/01-realtime-streams/streaming-systems.md \
  docs/notes/industrial-ml/04-industrial-mlops/industrial-machine-learning.md \
  docs/notes/industrial-ml/04-industrial-mlops/outlier-analysis.md \
  docs/notes/webapp/api-design-patterns.md \
  docs/notes/webapp/web-application-security.md \
  docs/notes/webapp/building-microservices.md \
  docs/notes/webapp/clean-architecture.md \
  docs/notes/webapp/continuous-delivery.md \
  docs/notes/webapp/designing-web-apis.md \
  docs/notes/webapp/production-ready-microservices.md \
  docs/notes/webapp/site-reliability-engineering.md
do
  print_file "$f"
done

printf '\n##### GROUP 3: ROUTER / KNOWLEDGE BUNDLE / CONTEXT #####\n'
for f in \
  lib/knowledge/router.ts \
  lib/knowledge/bundle.ts \
  lib/knowledge/context.ts \
  lib/knowledge/notes.ts \
  lib/knowledge/profiles.ts \
  lib/knowledge/index.ts \
  scripts/kg/assemble_graph.py \
  scripts/kg/validate_graph.py \
  scripts/kg/extract.py
do
  print_file "$f"
done

printf '\n##### GROUP 4: TEST RUNNER CONFIG AND UI COMPONENTS #####\n'
for f in \
  jest.config.ts \
  jest.config.js \
  vitest.config.ts \
  vitest.config.js \
  vitest.setup.ts \
  .gitignore \
  components/Board.tsx \
  components/ScoreBoard.tsx
do
  print_file "$f"
done

printf '\n##### GROUP 5: GENERATED KNOWLEDGE, ONLY IF SMALL #####\n'
print_file_if_small public/knowledge/specs.json 500000
print_file_if_small public/knowledge/graph.json 500000

printf '\n##### DIAGNOSTICS #####\n'

printf '\n===== DIAG: lib casing =====\n'
ls -la lib 2>/dev/null | grep -i llm || true

printf '\n===== DIAG: lib/llm contents =====\n'
ls -la lib/llm 2>/dev/null || true

printf '\n===== DIAG: lib/LLM contents =====\n'
ls -la lib/LLM 2>/dev/null || true

printf '\n===== DIAG: find lib/knowledge =====\n'
find lib/knowledge -maxdepth 2 -type f -print 2>/dev/null || true

printf '\n===== DIAG: find scripts =====\n'
find scripts -maxdepth 3 -type f -print 2>/dev/null || true

printf '\n===== DIAG: find docs/specs =====\n'
find docs/specs -maxdepth 2 -type f -print 2>/dev/null || true

printf '\n===== DIAG: find docs/notes markdown =====\n'
find docs/notes -maxdepth 3 -type f -name '*.md' -print 2>/dev/null || true

printf '\n===== DIAG: package.json test/Jest/Vitest lines =====\n'
grep -nE "jest|vitest|@types/jest|@types/vitest|\"test\"" package.json 2>/dev/null || true

printf '\n===== DIAG: js-yaml dependency/types =====\n'
grep -n "js-yaml" package.json 2>/dev/null || true
ls node_modules/js-yaml 2>/dev/null | head -20 || true
ls node_modules/@types/js-yaml 2>/dev/null | head -20 || true

printf '\n===== DIAG: pytest markers/live =====\n'
grep -nE "markers|live" pytest.ini setup.cfg pyproject.toml 2>/dev/null || true

printf '\n===== DIAG: FindingSeverity export/usage =====\n'
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.venv --exclude-dir=build-artifacts --exclude-dir=.git "FindingSeverity" lib components __tests__ 2>/dev/null | head -120 || true

printf '\n===== DIAG: detectCrossDomain export/usage =====\n'
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.venv --exclude-dir=build-artifacts --exclude-dir=.git "detectCrossDomain" lib __tests__ 2>/dev/null | head -120 || true

printf '\n===== DIAG: KNOWN_STANDARDS export/usage =====\n'
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.venv --exclude-dir=build-artifacts --exclude-dir=.git "KNOWN_STANDARDS" lib scripts __tests__ 2>/dev/null | head -120 || true

printf '\n===== DIAG: lib/LLM import occurrences =====\n'
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.venv --exclude-dir=build-artifacts --exclude-dir=.git "lib/LLM" . 2>/dev/null | head -120 || true

printf '\n===== DIAG: lib/llm import occurrences =====\n'
grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.venv --exclude-dir=build-artifacts --exclude-dir=.git "lib/llm" . 2>/dev/null | head -120 || true

printf '\n===== END REPOSCOPE CONTEXT BUNDLE =====\n'

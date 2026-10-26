#!/usr/bin/env python3
"""
scripts/build_knowledge.py

YAML specs -> public/knowledge/specs.json

Usage:
    python scripts/build_knowledge.py                 # write specs.json
    python scripts/build_knowledge.py --check         # validate only, no write
    python scripts/build_knowledge.py --strict        # exit 1 if any warning
    python scripts/build_knowledge.py --check --strict  # CI validation gate

Validation warnings are printed but do not fail the build unless --strict is
passed. This is deliberate: you can delete a field, see the warning, and still
inspect the generated JSON.

Canonical profiles:
  - iiot
  - dataops
  - webapp
  - cross
  - graph
  - general

Rule ID convention:
  iiot-001
  iiot-modbus-001
  dataops-002
  webapp-001
  general-docs-001
  cross-001
  graph-001
  graph-grounding-001
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    sys.exit("[ERROR] pyyaml missing. Run: pip install pyyaml")


ROOT = Path(__file__).resolve().parents[1]
SPECS_DIR = ROOT / "docs" / "specs"
OUTPUT_FILE = ROOT / "public" / "knowledge" / "specs.json"

REQUIRED_FIELDS = (
    "id",
    "profile",
    "severity",
    "title",
    "rationale",
    "checks",
    "fix",
    "references",
)

VALID_SEVERITIES = {"critical", "error", "warning", "info"}

# FIX 1: previously missing "cross", "graph", "general". The module docstring
# already declared these as canonical — the constant disagreed with it, so
# every cross-domain rule emitted "[WARN] invalid profile 'cross'" and every
# graph rule would emit the same. The warning was real; the constant was wrong.
VALID_PROFILES = {
    "iiot",
    "dataops",
    "webapp",
    "cross",
    "graph",
    "general",
}

# FIX 2: previously missing "semantic_eval". Without it, every semantic rule
# emitted "[WARN] unknown check type" and the per-check field validation was
# skipped entirely — meaning a semantic rule missing evaluation_prompt or
# threshold passed the build silently and dropped to skipped:true at runtime.
#
# FIX 5: added "structural_ast". AST/structural checks are emitted by the
# Python extraction pipeline into the property graph; without this entry every
# structural rule was rejected as "unknown check type".
#
# FIX 6: added _validate_structural_check(). Now that dataops-kimball-ast-001
# declares parser: "sql" and file_glob, the check has structural-specific
# required fields. Without a dedicated validator, a future structural_ast
# check that omits parser or file_glob would pass the build silently — the
# same class of bug _validate_semantic_check was added to close for
# semantic_eval.
VALID_CHECK_TYPES = {
    "pattern_match",
    "file_exists",
    "file_absent",
    "semantic_eval",
    "structural_ast",
}

VALID_ID_RE = re.compile(
    r"^(iiot|dataops|webapp|cross|general|graph)(-[a-z0-9]+)*-\d{3}[a-z]?$"
)

# Semantic-eval thresholds — mirror lib/semantic/runner.ts constants.
SEMANTIC_PROMPT_MIN_LEN = 50
SEMANTIC_MAX_INPUT_MIN = 100
SEMANTIC_DEFAULT_THRESHOLD = 0.7

# Structural-AST parser identifiers — mirror lib/knowledge/structural.ts.
# Extend as parsers are wired; the validator does not gate on membership
# (that would false-warn on legitimate future parsers before the runner
# knows about them), but documenting the known set here keeps the constant
# discoverable in one place.
STRUCTURAL_KNOWN_PARSERS = {"sql", "typescript", "python"}


def _as_list(value: Any) -> list:
    """Return `value` if it is a list, otherwise an empty list."""
    return value if isinstance(value, list) else []


def _validate_semantic_check(
    yaml_name: str, rule_id: str, idx: int, check: dict
) -> list[str]:
    """
    FIX 3: semantic_eval-specific validation. Runs after the generic
    check-type validation in validate_rule(). Every field the runner reads
    is validated here, so a malformed rule surfaces at build time rather
    than as a silent skipped:true at runtime.

    Contract mirrors lib/semantic/runner.ts:
      - evaluation_prompt: string, >= 50 chars
      - threshold: number in [0, 1] (default 0.7)
      - max_input_chars: int >= 100 (optional; NOT max_tokens)
      - file_glob or path_glob required (target resolution)
      - error_when is redundant (threshold is the failure signal)
    """
    warnings: list[str] = []
    prefix = f"{yaml_name}/{rule_id} check[{idx}]"

    prompt = check.get("evaluation_prompt")
    if not isinstance(prompt, str):
        warnings.append(
            f"{prefix}: semantic_eval missing 'evaluation_prompt'"
        )
    elif len(prompt.strip()) < SEMANTIC_PROMPT_MIN_LEN:
        warnings.append(
            f"{prefix}: evaluation_prompt too short "
            f"({len(prompt)} < {SEMANTIC_PROMPT_MIN_LEN}) — likely vague"
        )

    if "max_tokens" in check:
        warnings.append(
            f"{prefix}: uses deprecated 'max_tokens' — "
            f"rename to 'max_input_chars' (the runner slices by characters)"
        )

    if "error_when" in check:
        warnings.append(
            f"{prefix}: 'error_when' is redundant for semantic_eval — "
            f"'threshold' is the failure signal; remove from YAML"
        )

    threshold = check.get("threshold", SEMANTIC_DEFAULT_THRESHOLD)
    if not isinstance(threshold, (int, float)) or isinstance(threshold, bool):
        warnings.append(
            f"{prefix}: threshold not numeric ({threshold!r})"
        )
    elif not (0.0 <= float(threshold) <= 1.0):
        warnings.append(
            f"{prefix}: threshold {threshold} outside [0, 1]"
        )

    mic = check.get("max_input_chars")
    if mic is not None:
        if not isinstance(mic, int) or isinstance(mic, bool):
            warnings.append(
                f"{prefix}: max_input_chars not int ({mic!r})"
            )
        elif mic < SEMANTIC_MAX_INPUT_MIN:
            warnings.append(
                f"{prefix}: max_input_chars {mic} < {SEMANTIC_MAX_INPUT_MIN}"
            )

    if not check.get("file_glob") and not check.get("path_glob"):
        warnings.append(
            f"{prefix}: semantic_eval requires file_glob or path_glob "
            f"so the runner can resolve a target file"
        )

    return warnings


def _validate_structural_check(
    yaml_name: str, rule_id: str, idx: int, check: dict
) -> list[str]:
    """
    FIX 6: structural_ast-specific validation. Mirrors _validate_semantic_check:
    every field the AST runner reads is validated at build time so a malformed
    check surfaces here, not as a silent skip at runtime.

    Contract mirrors lib/knowledge/structural.ts (Week 3 target):
      - parser: non-empty string identifying the AST backend (e.g. "sql")
      - file_glob or path_glob required (target resolution)
      - message required (already enforced by the generic pass)

    Deliberately does NOT whitelist parser values against
    STRUCTURAL_KNOWN_PARSERS. That constant is documentation; gating on it
    here would false-warn on a legitimate parser added to a YAML before the
    runner is wired to consume it, which inverts the fail-open posture of
    this build script.
    """
    warnings: list[str] = []
    prefix = f"{yaml_name}/{rule_id} check[{idx}]"

    parser = check.get("parser")
    if not isinstance(parser, str) or not parser.strip():
        warnings.append(
            f"{prefix}: structural_ast missing 'parser' "
            f"(expected one of {sorted(STRUCTURAL_KNOWN_PARSERS)})"
        )

    if not check.get("file_glob") and not check.get("path_glob"):
        warnings.append(
            f"{prefix}: structural_ast requires file_glob or path_glob "
            f"so the runner can resolve a target file"
        )

    return warnings


def validate_rule(yaml_name: str, rule: dict, seen_ids: set[str]) -> list[str]:
    """
    Return a list of warning strings for a single rule.

    This function never raises. Warnings are informational unless --strict
    is passed to main(), in which case they become a non-zero exit code.

    This function does NOT modify `rule`. Fields inside `checks` pass through
    to specs.json unchanged — a check field like `parser` survives verbatim
    even when no validator inspects it. Validation and serialization are
    separate concerns by design: a warning does not strip a field.
    """
    warnings: list[str] = []

    rule_id = str(rule.get("id", "?"))

    for field in REQUIRED_FIELDS:
        if field not in rule or rule[field] in (None, "", []):
            warnings.append(f"{yaml_name}/{rule_id}: missing field '{field}'")

    if not VALID_ID_RE.match(rule_id):
        warnings.append(
            f"{yaml_name}/{rule_id}: id does not match convention "
            f"(domain-...-###)"
        )

    if rule_id in seen_ids:
        warnings.append(f"{yaml_name}/{rule_id}: duplicate id")
    seen_ids.add(rule_id)

    if rule.get("severity") not in VALID_SEVERITIES:
        warnings.append(
            f"{yaml_name}/{rule_id}: invalid severity "
            f"'{rule.get('severity')}'"
        )

    if rule.get("profile") not in VALID_PROFILES:
        warnings.append(
            f"{yaml_name}/{rule_id}: invalid profile "
            f"'{rule.get('profile')}'"
        )

    for ref in _as_list(rule.get("references")):
        if not isinstance(ref, dict) or not (
            ref.get("book") or ref.get("standard")
        ):
            warnings.append(
                f"{yaml_name}/{rule_id}: reference needs 'book' or "
                f"'standard': {ref}"
            )

    for idx, check in enumerate(_as_list(rule.get("checks"))):
        if not isinstance(check, dict):
            warnings.append(
                f"{yaml_name}/{rule_id}: check[{idx}] is not a mapping: {check}"
            )
            continue

        check_type = check.get("type")
        if check_type not in VALID_CHECK_TYPES:
            warnings.append(
                f"{yaml_name}/{rule_id}: unknown check type '{check_type}'"
            )
            continue

        if not check.get("message"):
            warnings.append(
                f"{yaml_name}/{rule_id}: check[{idx}] without 'message'"
            )

        if check_type == "semantic_eval":
            warnings.extend(
                _validate_semantic_check(yaml_name, rule_id, idx, check)
            )
        elif check_type == "structural_ast":
            warnings.extend(
                _validate_structural_check(yaml_name, rule_id, idx, check)
            )

    return warnings


def build_full_text(rule: dict) -> str:
    """
    Compact plain-text view used for RAG prompt injection.

    This is intentionally small and deterministic. It is not a substitute for
    the graph, but it helps when a rule must be injected into a prompt without
    loading the full graph traversal.
    """
    refs = ", ".join(
        (r.get("book") or r.get("standard") or "?")
        for r in _as_list(rule.get("references"))
        if isinstance(r, dict)
    )

    return (
        f"Rule: {rule.get('title', '')}\n"
        f"ID: {rule.get('id', '')}\n"
        f"Profile: {rule.get('profile', '')}\n"
        f"Severity: {rule.get('severity', '')}\n"
        f"Why it matters: {rule.get('rationale', '')}\n"
        f"How to fix: {rule.get('fix', '')}\n"
        f"References: {refs}"
    )


def load_specs() -> tuple[dict[str, dict], list[str]]:
    """
    Load every *.yaml in docs/specs/ and return (bundle, warnings).

    Files beginning with underscore are skipped, e.g.:
      - _schema.yaml
      - _template.yaml

    FIX 4: rules are bucketed by their OWN `profile`, not the file-level
    `profile`. Previously a rule with `profile: "cross"` inside dataops.yaml
    was silently mis-bucketed under `dataops`, so downstream runtime checks
    filtering by profile never found it.

    Note on serialization: this function does not rebuild `checks` arrays.
    The `rule` dict is the raw YAML object with one added key (`full_text`)
    and is appended to the bucket as-is. Every field inside each check —
    `parser`, `threshold`, `file_glob`, anything — passes through to
    specs.json unchanged. Validation and serialization are separate.
    """
    bundle: dict[str, dict] = {}
    seen_ids: set[str] = set()
    all_warnings: list[str] = []

    if not SPECS_DIR.exists():
        return bundle, [f"Specs directory not found: {SPECS_DIR}"]

    for yaml_file in sorted(SPECS_DIR.glob("*.yaml")):
        if yaml_file.name.startswith("_"):
            continue

        try:
            raw = yaml_file.read_text(encoding="utf-8")
            data = yaml.safe_load(raw) or {}
        except yaml.YAMLError as exc:
            all_warnings.append(f"{yaml_file.name}: YAML parse error: {exc}")
            continue

        if not isinstance(data, dict):
            all_warnings.append(
                f"{yaml_file.name}: file root is not a mapping, skipping"
            )
            continue

        file_profile = data.get("profile")
        if file_profile not in VALID_PROFILES:
            all_warnings.append(
                f"{yaml_file.name}: missing/invalid file-level 'profile' "
                f"({file_profile!r}), skipping"
            )
            continue

        rules = _as_list(data.get("rules"))
        file_version = data.get("version", "1.0")
        accepted = 0
        rejected = 0

        for rule in rules:
            if not isinstance(rule, dict):
                all_warnings.append(
                    f"{yaml_file.name}: rule is not a mapping: {rule!r}"
                )
                rejected += 1
                continue

            # Inherit the file-level profile only when the rule does not
            # declare one. Cross-domain rules (cross-001, cross-002) can
            # therefore live in dataops.yaml and still bucket under 'cross'.
            rule.setdefault("profile", file_profile)

            all_warnings.extend(validate_rule(yaml_file.name, rule, seen_ids))
            rule["full_text"] = build_full_text(rule)

            # FIX 4: bucket by rule-level profile, not file-level profile.
            rule_profile = rule.get("profile", file_profile)
            if rule_profile not in VALID_PROFILES:
                all_warnings.append(
                    f"{yaml_file.name}/{rule.get('id', '?')}: "
                    f"unknown bucket profile '{rule_profile}', dropped"
                )
                rejected += 1
                continue

            bucket = bundle.setdefault(
                rule_profile,
                {"version": file_version, "rules": []},
            )
            bucket["rules"].append(rule)
            accepted += 1

        status = f"[OK]   {yaml_file.name} -> {accepted} rules ({file_profile})"
        if rejected:
            status += f", {rejected} rejected"
        print(status)

    return bundle, all_warnings


def parse_args(argv: list[str]) -> argparse.Namespace:
    """
    FIX: previously the script had no argument parser. `python
    scripts/build_knowledge.py --check` was silently accepted because Python
    ignores argv, and the script wrote specs.json anyway. The roadmap's
    Phase 0 command F was reading a flag that did not exist as a real flag.
    This parser makes --check and --strict real.
    """
    parser = argparse.ArgumentParser(
        description="Build public/knowledge/specs.json from docs/specs/*.yaml"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate only; do not write specs.json",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero if any validation warning is emitted",
    )
    return parser.parse_args(argv)


def _count_semantic_rules(bundle: dict[str, dict]) -> int:
    """Count semantic_eval checks across all rules for the summary line."""
    total = 0
    for bucket in bundle.values():
        for rule in bucket.get("rules", []):
            for check in _as_list(rule.get("checks")):
                if isinstance(check, dict) and check.get("type") == "semantic_eval":
                    total += 1
    return total


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])

    if not SPECS_DIR.exists():
        print(f"[ERROR] Specs directory not found: {SPECS_DIR}")
        return 1

    bundle, warnings = load_specs()

    for warning in warnings:
        print(f"[WARN] {warning}")

    if not bundle:
        print("[ERROR] No specs loaded. Check docs/specs/ directory.")
        return 1

    total_rules = sum(len(v["rules"]) for v in bundle.values())
    semantic_count = _count_semantic_rules(bundle)

    if args.check:
        print()
        print(f"[CHECK] Would write {OUTPUT_FILE}")
        print(f"  Profiles: {sorted(bundle.keys())}")
        print(f"  Total rules: {total_rules}")
        print(f"  Semantic rules: {semantic_count}")
        print(f"  Validation warnings: {len(warnings)}")
        if args.strict and warnings:
            print("[FAIL] --strict: warnings present")
            return 1
        return 0

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print()
    print(f"Built {OUTPUT_FILE}")
    print(f"  Profiles: {sorted(bundle.keys())}")
    print(f"  Total rules: {total_rules}")
    print(f"  Semantic rules: {semantic_count}")
    print(f"  Validation warnings: {len(warnings)} (informational)")

    if args.strict and warnings:
        print("[FAIL] --strict: warnings present")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
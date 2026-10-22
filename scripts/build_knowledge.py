#!/usr/bin/env python3
"""
scripts/build_knowledge.py

YAML specs -> public/knowledge/specs.json

Runs locally via `pnpm build:knowledge`.

Validation warnings are printed but do not fail the build. This is deliberate:
you can delete a field, see the warning, and still inspect the generated JSON.

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

VALID_PROFILES = {
    "iiot",
    "dataops",
    "webapp",
}

VALID_CHECK_TYPES = {
    "pattern_match",
    "file_exists",
    "file_absent",
}

VALID_ID_RE = re.compile(
    r"^(iiot|dataops|webapp|cross|general|graph)(-[a-z0-9]+)*-\d{3}[a-z]?$"
)


def _as_list(value: Any) -> list:
    """Return `value` if it is a list, otherwise an empty list."""
    return value if isinstance(value, list) else []


def validate_rule(yaml_name: str, rule: dict, seen_ids: set[str]) -> list[str]:
    """
    Return a list of warning strings for a single rule.

    This function never raises. Warnings are informational and allow the build
    to continue while still surfacing schema problems.
    """
    warnings: list[str] = []

    rule_id = str(rule.get("id", "?"))

    for field in REQUIRED_FIELDS:
        if field not in rule or rule[field] in (None, "", []):
            warnings.append(f"{yaml_name}/{rule_id}: missing field '{field}'")

    if not VALID_ID_RE.match(rule_id):
        warnings.append(
            f"{yaml_name}/{rule_id}: id does not match convention " "(domain-...-###)"
        )

    if rule_id in seen_ids:
        warnings.append(f"{yaml_name}/{rule_id}: duplicate id")

    seen_ids.add(rule_id)

    if rule.get("severity") not in VALID_SEVERITIES:
        warnings.append(
            f"{yaml_name}/{rule_id}: invalid severity '{rule.get('severity')}'"
        )

    if rule.get("profile") not in VALID_PROFILES:
        warnings.append(
            f"{yaml_name}/{rule_id}: invalid profile '{rule.get('profile')}'"
        )

    for ref in _as_list(rule.get("references")):
        if not isinstance(ref, dict) or not (ref.get("book") or ref.get("standard")):
            warnings.append(
                f"{yaml_name}/{rule_id}: reference needs 'book' or 'standard': {ref}"
            )

    for check in _as_list(rule.get("checks")):
        if not isinstance(check, dict):
            warnings.append(f"{yaml_name}/{rule_id}: check is not a mapping: {check}")
            continue

        if check.get("type") not in VALID_CHECK_TYPES:
            warnings.append(
                f"{yaml_name}/{rule_id}: unknown check type " f"'{check.get('type')}'"
            )

        if not check.get("message"):
            warnings.append(f"{yaml_name}/{rule_id}: check without 'message'")

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

        profile = data.get("profile")

        if profile not in VALID_PROFILES:
            all_warnings.append(
                f"{yaml_file.name}: missing/invalid 'profile' "
                f"({profile!r}), skipping"
            )
            continue

        rules = _as_list(data.get("rules"))

        for rule in rules:
            if not isinstance(rule, dict):
                all_warnings.append(
                    f"{yaml_file.name}: rule is not a mapping: {rule!r}"
                )
                continue

            # Inject the file-level profile into each rule if absent.
            # This keeps YAML files clean while still allowing per-rule override.
            rule.setdefault("profile", profile)

            all_warnings.extend(validate_rule(yaml_file.name, rule, seen_ids))

            rule["full_text"] = build_full_text(rule)

            bucket = bundle.setdefault(
                profile,
                {
                    "version": data.get("version", "1.0"),
                    "rules": [],
                },
            )

            bucket["rules"].append(rule)

        print(f"[OK]   {yaml_file.name} -> {len(rules)} rules " f"({profile})")

    return bundle, all_warnings


def main() -> None:
    if not SPECS_DIR.exists():
        print(f"[ERROR] Specs directory not found: {SPECS_DIR}")
        sys.exit(1)

    bundle, warnings = load_specs()

    for warning in warnings:
        print(f"[WARN] {warning}")

    if not bundle:
        print("[ERROR] No specs loaded. Check docs/specs/ directory.")
        sys.exit(1)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    total_rules = sum(len(v["rules"]) for v in bundle.values())

    print(f"\nBuilt {OUTPUT_FILE}")
    print(f"  Profiles: {sorted(bundle.keys())}")
    print(f"  Total rules: {total_rules}")
    print(f"  Validation warnings: {len(warnings)} (informational)")


if __name__ == "__main__":
    main()

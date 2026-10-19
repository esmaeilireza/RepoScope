#!/usr/bin/env python3
"""Verify every claim in docs/claims.yaml against the actual repository."""
from __future__ import annotations
import sys, yaml, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIMS = ROOT / "docs" / "claims.yaml"


def verify_yaml_rule_present(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"].split("#")[0]
    if not spec_path.exists():
        return False, f"{spec_path} missing"
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    ids = {r.get("id") for r in data.get("rules", [])}
    required = set(claim["verification"]["must_contain_rule_ids"])
    missing = required - ids
    return (not missing), f"missing: {missing}" if missing else "all present"


def verify_rule_checks_pattern(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"].split("#")[0]
    rule_id = claim["verification"]["rule_id"]
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    rule = next((r for r in data.get("rules", []) if r.get("id") == rule_id), None)
    if not rule:
        return False, f"rule {rule_id} not found"
    blob = yaml.safe_dump(rule).lower()
    needles = claim["verification"]["expected_checks_contain"]
    found = [n for n in needles if n.lower() in blob]
    return (len(found) == len(needles)), f"found: {found}, expected: {needles}"


def verify_any_rule_matches(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"]
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    pattern = claim["verification"]["pattern"]
    blob = yaml.safe_dump(data.get("rules", []))
    hit = re.search(pattern, blob, re.IGNORECASE)
    return bool(hit), f"pattern {pattern!r} {'found' if hit else 'NOT found'}"


VERIFIERS = {
    "yaml_rule_present": verify_yaml_rule_present,
    "rule_checks_pattern": verify_rule_checks_pattern,
    "any_rule_matches": verify_any_rule_matches,
}


def main() -> int:
    if not CLAIMS.exists():
        print(f"[ERROR] {CLAIMS} not found")
        return 1
    claims = yaml.safe_load(CLAIMS.read_text(encoding="utf-8"))
    fails = 0
    for c in claims["claims"]:
        vtype = c["verification"]["type"]
        verifier = VERIFIERS.get(vtype)
        if not verifier:
            print(f"  [SKIP] {c['id']}: no verifier for {vtype!r}")
            continue
        ok, msg = verifier(c)
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {c['id']}: {msg}")
        if not ok:
            fails += 1
    print(f"\n{len(claims['claims'])} claims, {fails} failed")
    return 0 if fails == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
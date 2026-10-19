#!/usr/bin/env python3
"""Verify every claim in docs/claims.yaml against the actual repository."""
from __future__ import annotations
import sys
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_FILE = ROOT / "docs" / "claims.yaml"

def verify_yaml_rule_present(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"]
    if not spec_path.exists():
        return False, f"{spec_path} missing"
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    ids = {r.get("id") for r in data.get("rules", [])}
    required = set(claim["verification"]["rule_ids"])
    missing = required - ids
    return (not missing), f"missing: {missing}" if missing else "all present"

def verify_rule_checks_pattern(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"]
    rule_id = claim["verification"]["rule_id"]
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    rule = next((r for r in data.get("rules", []) if r.get("id") == rule_id), None)
    if not rule:
        return False, f"rule {rule_id} not found"
    
    blob = yaml.safe_dump(rule).lower()
    patterns = claim["verification"]["expected_patterns"]
    found = [p for p in patterns if p.lower() in blob]
    return (len(found) > 0), f"found: {found}, expected any of: {patterns}"

def verify_yaml_rule_count_min(claim: dict) -> tuple[bool, str]:
    spec_path = ROOT / claim["implementation"]
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    count = len(data.get("rules", []))
    min_count = claim["verification"]["min_count"]
    return (count >= min_count), f"found {count} rules, expected at least {min_count}"

def verify_total_yaml_rule_count(claim: dict) -> tuple[bool, str]:
    specs_dir = ROOT / claim["implementation"]
    total = 0
    for f in specs_dir.glob("*.yaml"):
        if f.name.startswith("_"): continue
        data = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        total += len(data.get("rules", []))
    expected = claim["verification"]["expected_count"]
    return (total == expected), f"found {total} rules, expected {expected}"

def verify_files_exist(claim: dict) -> tuple[bool, str]:
    missing = []
    for p in claim["verification"]["paths"]:
        if not (ROOT / p).exists():
            missing.append(p)
    return (not missing), f"missing: {missing}" if missing else "all files present"

VERIFIERS = {
    "yaml_rule_present": verify_yaml_rule_present,
    "rule_checks_pattern": verify_rule_checks_pattern,
    "yaml_rule_count_min": verify_yaml_rule_count_min,
    "total_yaml_rule_count": verify_total_yaml_rule_count,
    "files_exist": verify_files_exist,
}

def main() -> int:
    if not CLAIMS_FILE.exists():
        print(f"[FATAL] {CLAIMS_FILE} not found")
        return 1
    
    claims = yaml.safe_load(CLAIMS_FILE.read_text(encoding="utf-8")).get("claims", [])
    failed = 0
    
    for claim in claims:
        vtype = claim["verification"]["type"]
        verifier = VERIFIERS.get(vtype)
        
        if not verifier:
            print(f"  [FAIL] {claim['id']}: no verifier implemented for type {vtype!r}")
            failed += 1
            continue
            
        ok, msg = verifier(claim)
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {claim['id']}: {msg}")
        if not ok:
            failed += 1
            
    print(f"\n{len(claims)} claims, {failed} failed")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
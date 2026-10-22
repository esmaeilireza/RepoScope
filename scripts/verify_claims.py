#!/usr/bin/env python3
"""Verify every claim in docs/claims.yaml against the actual repository.

Tolerates both schema variants:
  verification.type  OR  verification.method
  implementation: "docs/specs/foo.yaml"  OR  {profile: "...", ...}
"""
from __future__ import annotations
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_FILE = ROOT / "docs" / "claims.yaml"


def _verifier_key(claim: dict) -> str | None:
    v = claim.get("verification") or {}
    return v.get("method") or v.get("type") or v.get("kind")


def _resolve_spec_file(claim: dict) -> Path:
    impl = claim.get("implementation")
    if isinstance(impl, str) and impl:
        p = ROOT / impl
        if p.exists():
            return p
        p2 = ROOT / "docs" / impl.lstrip("/\\")
        if p2.exists():
            return p2
        return p  # return broken path for accurate error
    if isinstance(impl, dict):
        for k in ("spec_file", "file", "path"):
            if impl.get(k):
                return ROOT / impl[k]
        profile = impl.get("profile") or claim.get("profile")
        if profile:
            return ROOT / "docs" / "specs" / f"{profile}.yaml"
    return ROOT / "docs" / "specs" / "unknown.yaml"


def _resolve_spec_dir(claim: dict) -> Path:
    impl = claim.get("implementation")
    if isinstance(impl, str) and impl:
        p = ROOT / impl
        if p.is_dir():
            return p
        p2 = ROOT / "docs" / impl.lstrip("/\\")
        if p2.is_dir():
            return p2
        return p
    if isinstance(impl, dict):
        for k in ("specs_dir", "dir", "path"):
            if impl.get(k):
                return ROOT / impl[k]
    return ROOT / "docs" / "specs"


def _ver(claim: dict) -> dict:
    return claim.get("verification") or {}


def verify_yaml_rule_present(claim: dict) -> tuple[bool, str]:
    spec_path = _resolve_spec_file(claim)
    if not spec_path.exists():
        return False, f"{_rel(spec_path)} missing"
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    ids = {r.get("id") for r in data.get("rules", [])}
    required = set(_ver(claim).get("rule_ids") or [])
    missing = required - ids
    return (not missing), f"missing: {sorted(missing)}" if missing else "all present"


def verify_rule_checks_pattern(claim: dict) -> tuple[bool, str]:
    spec_path = _resolve_spec_file(claim)
    if not spec_path.exists():
        return False, f"{_rel(spec_path)} missing"
    v = _ver(claim)
    rule_id = v.get("rule_id")
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    rule = next((r for r in data.get("rules", []) if r.get("id") == rule_id), None)
    if not rule:
        return False, f"rule {rule_id} not found"
    blob = yaml.safe_dump(rule).lower()
    patterns = v.get("patterns") or v.get("expected_patterns") or []
    found = [p for p in patterns if p.lower() in blob]
    return bool(found), f"found: {found}"


def verify_yaml_rule_count_min(claim: dict) -> tuple[bool, str]:
    spec_path = _resolve_spec_file(claim)
    if not spec_path.exists():
        return False, f"{_rel(spec_path)} missing"
    data = yaml.safe_load(spec_path.read_text(encoding="utf-8")) or {}
    count = len(data.get("rules", []))
    min_count = _ver(claim).get("min_count", 0)
    return (count >= min_count), f"found {count} rules, expected ≥ {min_count}"


def verify_total_yaml_rule_count(claim: dict) -> tuple[bool, str]:
    specs_dir = _resolve_spec_dir(claim)
    if not specs_dir.is_dir():
        return False, f"{_rel(specs_dir)} directory missing"
    total = 0
    for f in sorted(specs_dir.glob("*.yaml")):
        if f.name.startswith("_"):
            continue
        data = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        total += len(data.get("rules", []))
    expected = _ver(claim).get("expected_count", 0)
    return (total == expected), f"found {total} rules, expected {expected}"


def verify_files_exist(claim: dict) -> tuple[bool, str]:
    paths = _ver(claim).get("paths") or []
    missing = [p for p in paths if not (ROOT / p).exists()]
    return (not missing), f"missing: {missing}" if missing else "all present"


def _rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


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

    raw = yaml.safe_load(CLAIMS_FILE.read_text(encoding="utf-8")) or {}
    claims = raw.get("claims", [])
    failed = 0

    for claim in claims:
        cid = claim.get("id", "<no-id>")
        vtype = _verifier_key(claim)
        verifier = VERIFIERS.get(vtype) if vtype else None

        if not verifier:
            print(f"  [FAIL] {cid}: no verifier for type={vtype!r}")
            failed += 1
            continue

        try:
            ok, msg = verifier(claim)
        except (KeyError, TypeError) as exc:
            print(f"  [FAIL] {cid}: schema error — {exc}")
            failed += 1
            continue

        print(f"  [{'PASS' if ok else 'FAIL'}] {cid}: {msg}")
        if not ok:
            failed += 1

    print(f"\n{len(claims)} claims, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
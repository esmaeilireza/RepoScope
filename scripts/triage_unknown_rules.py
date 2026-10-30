#!/usr/bin/env python3
"""Triage unknown-status rules in specs.json against lib/ implementations.

Usage:
  python scripts/triage_unknown_rules.py            # dry-run: report only
  python scripts/triage_unknown_rules.py --apply    # patch YAML sources
  python scripts/triage_unknown_rules.py --json     # machine-readable
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


STATUS_OK = {"active", "draft"}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_unknown_rules(specs_path: Path) -> list[dict]:
    specs = json.loads(specs_path.read_text(encoding="utf-8"))
    out: list[dict] = []
    for profile, bundle in specs.items():
        for rule in bundle.get("rules", []):
            rid = rule.get("id")
            if not rid:
                continue
            st = rule.get("status")
            if st not in STATUS_OK:
                out.append({"id": rid, "profile": profile, "current": st})
    return out


def grep_quoted(rule_id: str, directory: Path, suffix: str = "*.ts") -> list[str]:
    pattern = re.compile(rf'["\']' + re.escape(rule_id) + r'["\']')
    hits: list[str] = []
    if not directory.exists():
        return hits
    for path in directory.rglob(suffix):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if pattern.search(text):
            hits.append(str(path.relative_to(directory.parent)))
    return hits


def find_yaml_for_rule(rule_id: str, specs_dir: Path) -> Path | None:
    line = re.compile(rf'^\s*-\s*id:\s*["\']?{re.escape(rule_id)}["\']?\s*$')
    for path in sorted(specs_dir.glob("*.yaml")):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for ln in text.splitlines():
            if line.match(ln):
                return path
    return None


def apply_status(yaml_path: Path, rule_id: str, new_status: str) -> bool:
    text = yaml_path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    id_line = re.compile(rf'^(\s*)-\s*id:\s*["\']?{re.escape(rule_id)}["\']?\s*$')
    id_idx: int | None = None
    for i, ln in enumerate(lines):
        if id_line.match(ln.rstrip("\r\n")):
            id_idx = i
            break
    if id_idx is None:
        return False

    status_idx: int | None = None
    for j in range(id_idx + 1, len(lines)):
        stripped = lines[j].lstrip()
        if stripped.startswith("- id:"):
            break
        if re.match(r'^\s+status\s*:', lines[j]):
            status_idx = j
            break

    m = id_line.match(lines[id_idx].rstrip("\r\n"))
    base = m.group(1) if m else "  "
    new_line = f"{base}  status: {new_status}\n"

    if status_idx is not None:
        lines[status_idx] = new_line
    else:
        lines.insert(id_idx + 1, new_line)

    yaml_path.write_text("".join(lines), encoding="utf-8", newline="\n")
    return True


def main() -> int:
    args = set(sys.argv[1:])
    root = repo_root()
    specs_path = root / "public" / "knowledge" / "specs.json"
    specs_dir = root / "docs" / "specs"
    lib_dir = root / "lib"
    tests_dir = root / "__tests__"

    if not specs_path.exists():
        print(f"[fail] {specs_path} not found. Run: python scripts/build_knowledge.py", file=sys.stderr)
        return 1

    unknowns = load_unknown_rules(specs_path)
    if not unknowns:
        print("[ok] No unknown-status rules. Nothing to triage.")
        return 0

    report = []
    for rule in unknowns:
        rid = rule["id"]
        lib_hits = grep_quoted(rid, lib_dir)
        test_hits = grep_quoted(rid, tests_dir)
        rec = "active" if lib_hits else "draft"
        yaml_path = find_yaml_for_rule(rid, specs_dir)
        report.append({
            "id": rid,
            "profile": rule["profile"],
            "current": rule["current"],
            "lib_hits": lib_hits,
            "test_hits": test_hits,
            "recommendation": rec,
            "yaml": str(yaml_path.relative_to(root)) if yaml_path else None,
        })

    if "--json" in args:
        print(json.dumps(report, indent=2))
        return 0

    print(f"{'rule_id':<32} {'current':<12} {'lib':>3} {'test':>4}  {'→ status':<8} {'yaml'}")
    print("-" * 100)
    for r in report:
        print(
            f"{r['id']:<32} {str(r['current'] or '-'):<12} "
            f"{len(r['lib_hits']):>3} {len(r['test_hits']):>4}  "
            f"{r['recommendation']:<8} {r['yaml'] or '???'}"
        )

    n_active = sum(1 for r in report if r["recommendation"] == "active")
    n_draft = len(report) - n_active
    print("-" * 100)
    print(f"Total unknown: {len(report)}   → active: {n_active}   → draft: {n_draft}")

    if "--apply" not in args:
        print()
        print("Dry-run only. To apply: python scripts/triage_unknown_rules.py --apply")
        return 0

    print()
    print("Applying status fixes to YAML sources ...")
    applied = 0
    for r in report:
        if not r["yaml"]:
            print(f"  [skip] {r['id']:<32} no source YAML found")
            continue
        path = root / r["yaml"]
        if apply_status(path, r["id"], r["recommendation"]):
            print(f"  [ok]   {r['id']:<32} {path.name:<22} → {r['recommendation']}")
            applied += 1
        else:
            print(f"  [warn] {r['id']:<32} could not locate rule in {path.name}")

    print()
    print(f"Applied {applied}/{len(report)} fixes.")
    print()
    print("Next:")
    print("  python scripts/build_knowledge.py")
    print("  pnpm readme:status")
    print("  pnpm readme:check")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Render docs/checklists/<profile>.md from docs/specs/*.yaml."""
from __future__ import annotations
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / "docs" / "specs"
OUT   = ROOT / "docs" / "checklists"

def render(profile: str, data: dict) -> str:
    lines = [f"# {profile.title()} checklist", "",
             f"_Generated from `docs/specs/{profile}.yaml` — do not edit by hand._", ""]
    for r in data.get("rules", []):
        status = r.get("status", "active")
        box = "- [ ]" if status == "active" else "- [~]"
        lines.append(f"{box} **`{r['id']}`** — {r['title']}  ")
        lines.append(f"  _{r['severity']} · profile: {r.get('profile', profile)}_")
        lines.append("")
    return "\n".join(lines) + "\n"

def main() -> int:
    check = "--check" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    failed = 0
    for yml in sorted(SPECS.glob("*.yaml")):
        if yml.name.startswith("_"):
            continue
        profile = yml.stem
        data = yaml.safe_load(yml.read_text(encoding="utf-8")) or {}
        new = render(profile, data)
        target = OUT / f"{profile}.md"
        if check:
            old = target.read_text(encoding="utf-8") if target.exists() else ""
            if old != new:
                print(f"[FAIL] {target} out of date")
                failed += 1
            else:
                print(f"[PASS] {target}")
        else:
            target.write_text(new, encoding="utf-8")
            print(f"[WRITE] {target}")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
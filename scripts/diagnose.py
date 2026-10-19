#!/usr/bin/env python3
"""scripts/diagnose.py — preflight for the RepoScope pipeline."""
from __future__ import annotations
import sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "kg"))

def check(label: str, ok: bool, fix: str = "") -> bool:
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}")
    if not ok and fix:
        print(f"         → {fix}")
    return ok

def main() -> int:
    fails = 0
    try:
        import route_knowledge as R
    except Exception as e:
        print(f"[FATAL] cannot import route_knowledge: {e}")
        return 1

    src = (ROOT / "scripts/kg/route_knowledge.py").read_text(encoding="utf-8")
    if not check("route() has corpus_root parameter", "corpus_root" in src,
                 "add: corpus_root: Path | str | None = None"):
        fails += 1

    # Regression check for the fixture-routing bug
    with tempfile.TemporaryDirectory() as td:
        fixture = Path(td)
        (fixture / "package.json").write_text('{"dependencies":{"next":"14"}}')
        bundle = R.route(fixture)
        if not check(
            f"fixture routing attaches full corpus (global={len(bundle.global_notes)}, grounding={len(bundle.grounding_notes)})",
            len(bundle.global_notes) == 10 and len(bundle.grounding_notes) == 5,
            "corpus_root not wired correctly",
        ):
            fails += 1

    # Budget check
    if hasattr(R, "render_context"):
        bundle = R.route(ROOT)
        ctx = R.render_context(bundle, budget=4000)
        if not check(f"render_context(4000) ≤ 4400 (got {len(ctx)})",
                     len(ctx) <= 4400, "budget-first packing missing"):
            fails += 1

    print("\n" + ("ALL CHECKS PASSED" if fails == 0 else f"{fails} check(s) failed"))
    return 0 if fails == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
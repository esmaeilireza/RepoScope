#!/usr/bin/env python3
"""
scripts/kg/validate_graph.py — integrity checks on public/knowledge/graph.json.
Exit code 1 on critical issues (dangling edges, duplicate ids), 0 otherwise.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

GRAPH_FILE = Path(__file__).resolve().parents[2] / "public" / "knowledge" / "graph.json"


def main() -> None:
    if not GRAPH_FILE.exists():
        sys.exit("[ERROR] graph.json not found — run assemble_graph.py first")

    graph = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    ids = [n["id"] for n in nodes]
    id_set = set(ids)

    critical = 0
    warnings = 0

    # duplicate ids
    dupes = [i for i, c in Counter(ids).items() if c > 1]
    if dupes:
        critical += 1
        print(f"[CRITICAL] duplicate node ids: {dupes[:5]}")

    # dangling edges
    dangling = [e for e in edges if e["source"] not in id_set or e["target"] not in id_set]
    if dangling:
        critical += 1
        print(f"[CRITICAL] {len(dangling)} dangling edges, e.g. {dangling[:3]}")

    # orphan nodes (no edges at all)
    touched: set[str] = set()
    for e in edges:
        touched.add(e["source"])
        touched.add(e["target"])
    orphans = [i for i in ids if i not in touched]
    if orphans:
        warnings += 1
        print(f"[WARN] {len(orphans)} orphan nodes (no edges): {orphans[:10]}")

    # concepts without a source book
    unsourced = [n["id"] for n in nodes
                 if n["type"] == "concept" and not (n.get("source") or {}).get("book")]
    if unsourced:
        warnings += 1
        print(f"[WARN] {len(unsourced)} concepts without source book: {unsourced[:10]}")

    # rules with zero grounded_by edges
    grounded = {e["source"] for e in edges if e["type"] == "grounded_by"}
    ungrounded = [n["id"] for n in nodes
                  if n["type"] == "rule" and n["id"] not in grounded]
    if ungrounded:
        warnings += 1
        print(f"[WARN] {len(ungrounded)} ungrounded rules: {ungrounded[:10]}")

    print(f"\n[REPORT] nodes={len(nodes)} edges={len(edges)} "
          f"critical={critical} warnings={warnings}")
    sys.exit(1 if critical else 0)


if __name__ == "__main__":
    main()
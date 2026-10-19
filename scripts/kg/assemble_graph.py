#!/usr/bin/env python3
"""
scripts/kg/assemble_graph.py
  scripts/kg/output/<domain>/*.json  +  public/knowledge/specs.json
    -> public/knowledge/graph.json  +  docs/knowledge-index.md

Node types: rule | concept | book
Edge types: grounded_by (rule->concept, rule->book), cited_in (concept->book),
            relates_to (concept->concept)
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

KG_DIR = Path(__file__).resolve().parent
REPO_ROOT = KG_DIR.parents[1]
SPECS_FILE = REPO_ROOT / "public" / "knowledge" / "specs.json"
OUTPUT_DIR = KG_DIR / "output"
GRAPH_FILE = REPO_ROOT / "public" / "knowledge" / "graph.json"
INDEX_FILE = REPO_ROOT / "docs" / "knowledge-index.md"
ALIASES_FILE = KG_DIR / "aliases.json"

SEVERITY_WEIGHTS = {"critical": 4, "error": 3, "warning": 2, "info": 1}


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z]{4,}", text.lower()))


def load_aliases() -> dict:
    if ALIASES_FILE.exists():
        return json.loads(ALIASES_FILE.read_text(encoding="utf-8"))
    return {"concept_aliases": {}, "book_aliases": {}}


def load_all_concepts(aliases: dict) -> list[dict]:
    concepts: list[dict] = []
    for domain_dir in sorted(OUTPUT_DIR.iterdir()):
        if not domain_dir.is_dir():
            continue
        for chunk_file in sorted(domain_dir.glob("*.json")):
            if chunk_file.name.startswith("."):
                continue
            data = json.loads(chunk_file.read_text(encoding="utf-8"))
            for c in data:
                c["concept"] = aliases["concept_aliases"].get(c["concept"], c["concept"])
                book = c.get("source", {}).get("book")
                if book:
                    c["source"]["book"] = aliases["book_aliases"].get(book, book)
                concepts.append(c)
    return concepts


def dedup_concepts(concepts: list[dict]) -> dict[str, dict]:
    """Fuzzy dedup: normalized concept name -> merged concept."""
    merged: dict[str, dict] = {}
    for c in concepts:
        key = slug(c["concept"])
        if key not in merged:
            merged[key] = c
            continue
        m = merged[key]
        if c.get("definition") and c["definition"] not in m.get("definition", ""):
            m["definition"] = (m.get("definition", "") + " " + c["definition"]).strip()
        if c.get("source", {}).get("book") and c["source"]["book"] != m.get("source", {}).get("book"):
            m.setdefault("other_sources", []).append(c["source"])
        for rel in c.get("relates_to", []):
            m.setdefault("relates_to", []).append(rel)
    return merged


def load_rules() -> list[dict]:
    specs = json.loads(SPECS_FILE.read_text(encoding="utf-8"))
    rules: list[dict] = []
    for profile, bundle in specs.items():
        for rule in bundle.get("rules", []):
            rule["_profile"] = profile
            rules.append(rule)
    return rules


def build_graph(concepts: dict[str, dict], rules: list[dict]) -> dict:
    nodes: list[dict] = []
    edges: list[dict] = []
    node_ids: set[str] = set()

    def add_node(node: dict) -> None:
        if node["id"] not in node_ids:
            nodes.append(node)
            node_ids.add(node["id"])

    def add_edge(source: str, target: str, etype: str, weight: float = 1.0) -> None:
        if source == target:
            return
        edges.append({"source": source, "target": target, "type": etype, "weight": weight})

    # ---- concept nodes + concept->concept edges + concept->book edges ----
    book_nodes: dict[str, dict] = {}
    for key, c in concepts.items():
        cid = f"concept:{key}"
        add_node({
            "id": cid,
            "type": "concept",
            "label": c["concept"],
            "definition": c.get("definition", ""),
            "domain": c.get("domain", "general"),
            "source": c.get("source", {}),
        })
        book = (c.get("source") or {}).get("book")
        if book:
            bid = f"book:{slug(book)}"
            if bid not in book_nodes:
                book_nodes[bid] = {"id": bid, "type": "book", "label": book, "kind": "book"}
                add_node(book_nodes[bid])
            add_edge(cid, bid, "cited_in")

        for rel in c.get("relates_to", []):
            target_name = rel.get("concept")
            if not target_name:
                continue
            target_name = rel.get("_alias") or target_name
            tid = f"concept:{slug(target_name)}"
            add_edge(cid, tid, rel.get("relation", "relates_to"), float(rel.get("weight", 0.5)))

    # ---- rule nodes + rule->concept / rule->book grounded_by edges ----
    for rule in rules:
        rid = f"rule:{rule['id']}"
        add_node({
            "id": rid,
            "type": "rule",
            "label": rule.get("title", ""),
            "severity": rule.get("severity", "info"),
            "profile": rule.get("_profile", ""),
            "rationale": rule.get("rationale", ""),
            "fix": rule.get("fix", ""),
        })

        rule_tokens = tokens(rule.get("title", "") + " " + rule.get("rationale", ""))
        grounded_any = False

        for ref in rule.get("references", []) or []:
            ref_concept = (ref.get("concept") or "").strip()
            ref_book = (ref.get("book") or ref.get("standard") or "").strip()
            ref_tokens = tokens(ref_concept + " " + ref_book)

            # rule -> concept (token overlap between reference and concept label)
            matched = False
            for key, c in concepts.items():
                if ref_tokens & tokens(c["concept"]):
                    add_edge(rid, f"concept:{key}", "grounded_by", 1.0)
                    matched = True
                    break
            if matched:
                grounded_any = True

            # rule -> book/standard node (always, for direct provenance)
            if ref_book:
                bid = f"book:{slug(ref_book)}"
                add_node({"id": bid, "type": "book", "label": ref_book,
                          "kind": "standard" if "standard" in ref else "book"})
                add_edge(rid, bid, "grounded_by", 1.0)
                grounded_any = True

        if not grounded_any:
            print(f"[WARN] rule {rule['id']} has zero grounded_by edges — check references")

    # ---- standards referenced by book_aliases stay kind:"book"; flag standards ----
    for n in nodes:
        if n["type"] == "book" and re.match(r"^(iec|iso|owasp|nfpa)\b", n["label"].lower()):
            n["kind"] = "standard"

    return {
        "version": "1.0",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "stats": {
            "nodes": len(nodes),
            "edges": len(edges),
            "concepts": sum(1 for n in nodes if n["type"] == "concept"),
            "rules": sum(1 for n in nodes if n["type"] == "rule"),
            "books": sum(1 for n in nodes if n["type"] == "book"),
        },
        "nodes": nodes,
        "edges": edges,
    }


def generate_index(graph: dict) -> None:
    """Auto-generate docs/knowledge-index.md — the five-minute demo artifact."""
    rules_by_book: dict[str, set[str]] = {}
    concept_count_by_book: dict[str, int] = {}
    profile_by_book: dict[str, str] = {}

    for e in graph["edges"]:
        if e["type"] == "grounded_by":
            src, tgt = e["source"], e["target"]
            if src.startswith("rule:") and tgt.startswith("book:"):
                book = next((n["label"] for n in graph["nodes"] if n["id"] == tgt), tgt)
                rules_by_book.setdefault(book, set()).add(src.replace("rule:", ""))

    for n in graph["nodes"]:
        if n["type"] == "concept":
            book = (n.get("source") or {}).get("book")
            if book:
                concept_count_by_book[book] = concept_count_by_book.get(book, 0) + 1
                profile_by_book.setdefault(book, n.get("domain", "general"))

    lines = [
        "# Knowledge Index",
        "",
        "Auto-generated by `scripts/kg/assemble_graph.py` — do not edit by hand.",
        "Shows the reasoning chain: audit rule -> grounded in concept -> source book.",
        "",
        "| Book | Profile | Concepts | Grounded Rules |",
        "|---|---|---|---|",
    ]
    for book in sorted(set(concept_count_by_book) | set(rules_by_book)):
        profile = profile_by_book.get(book, "-")
        count = concept_count_by_book.get(book, 0)
        rules = ", ".join(sorted(rules_by_book.get(book, set()))) or "-"
        lines.append(f"| {book} | {profile} | {count} | {rules} |")

    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    INDEX_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] {INDEX_FILE}")


def main() -> None:
    if not SPECS_FILE.exists():
        raise SystemExit("[ERROR] specs.json missing — run scripts/build_knowledge.py first")

    aliases = load_aliases()
    concepts = dedup_concepts(load_all_concepts(aliases))
    rules = load_rules()

    if not concepts:
        raise SystemExit("[ERROR] No concepts extracted — run scripts/kg/extract.py first")

    graph = build_graph(concepts, rules)

    GRAPH_FILE.parent.mkdir(parents=True, exist_ok=True)
    GRAPH_FILE.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] {GRAPH_FILE}")
    print(f"     {graph['stats']}")

    generate_index(graph)


if __name__ == "__main__":
    main()
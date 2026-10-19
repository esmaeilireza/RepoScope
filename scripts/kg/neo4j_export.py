#!/usr/bin/env python3
"""
scripts/kg/neo4j_export.py

Export the local Neo4j graph back to:
  public/knowledge/graph.json

RepoScope runtime uses this static JSON file.
Neo4j is only the offline authoring/validation workbench.

Environment variables:
  NEO4J_URI=bolt://localhost:7687
  NEO4J_USER=neo4j
  NEO4J_PASSWORD=...
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from neo4j import GraphDatabase
except ImportError:
    sys.exit(
        "[ERROR] neo4j Python driver missing. "
        "Run: pip install neo4j"
    )


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_FILE = REPO_ROOT / "public" / "knowledge" / "graph.json"

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

EDGE_TYPE_MAP = {
    "GROUNDED_IN": "grounded_by",
    "GROUNDED_BY": "grounded_by",
    "CITED_IN": "cited_in",
    "SUPPORTED_BY": "supported_by",
    "RELATES_TO": "relates_to",
}


def require_password() -> None:
    if not NEO4J_PASSWORD:
        sys.exit(
            "[ERROR] NEO4J_PASSWORD is not set.\n"
            "Example PowerShell:\n"
            '  $env:NEO4J_URI="bolt://localhost:7687"\n'
            '  $env:NEO4J_USER="neo4j"\n'
            '  $env:NEO4J_PASSWORD="your-password"'
        )


def fetch_nodes(driver) -> list[dict[str, Any]]:
    query = """
    MATCH (n)
    WHERE n:Rule OR n:Concept OR n:Source
    RETURN properties(n) AS props,
           labels(n) AS labels
    """

    with driver.session() as session:
        result = session.run(query)
        return [
            {
                "props": record["props"],
                "labels": record["labels"],
            }
            for record in result
        ]


def fetch_edges(driver) -> list[dict[str, Any]]:
    query = """
    MATCH (a)-[r]->(b)
    WHERE (a:Rule OR a:Concept OR a:Source)
      AND (b:Rule OR b:Concept OR b:Source)
    RETURN a.id AS source,
           b.id AS target,
           type(r) AS type,
           r.weight AS weight
    """

    with driver.session() as session:
        result = session.run(query)
        return [
            {
                "source": record["source"],
                "target": record["target"],
                "type": record["type"],
                "weight": record["weight"],
            }
            for record in result
        ]


def label_to_type(labels: list[str]) -> str | None:
    if "Rule" in labels:
        return "rule"
    if "Concept" in labels:
        return "concept"
    if "Source" in labels:
        return "book"
    return None


def clean_primitive(value: Any) -> Any:
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, list):
        return [clean_primitive(item) for item in value if item is not None]

    return str(value)


def build_concept_source(
    props: dict[str, Any],
    concept_id: str,
    edges: list[dict[str, Any]],
    node_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    source: dict[str, Any] = {}

    book = props.get("source_book")
    chapter = props.get("source_chapter")
    page_range = props.get("source_page_range")

    if not book:
        for edge in edges:
            if edge["source"] != concept_id:
                continue

            if edge["type"] not in {"CITED_IN", "SUPPORTED_BY"}:
                continue

            target = node_map.get(edge["target"])

            if not target:
                continue

            book = target.get("title") or target.get("label")

            if book:
                break

    if book:
        source["book"] = book

    if chapter:
        source["chapter"] = chapter

    if page_range:
        source["page_range"] = page_range

    return source


def export_node(
    raw_node: dict[str, Any],
    edges: list[dict[str, Any]],
    node_map: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    props = raw_node["props"]
    labels = raw_node["labels"]

    node_type = label_to_type(labels)

    if not node_type:
        return None

    node_id = props.get("id")

    if not node_id:
        return None

    if node_type == "rule":
        return {
            "id": node_id,
            "type": "rule",
            "label": clean_primitive(
                props.get("label")
                or props.get("title")
                or props.get("rule_id")
                or node_id
            ),
            "severity": clean_primitive(props.get("severity")) or "info",
            "profile": clean_primitive(props.get("profile")),
            "rationale": clean_primitive(props.get("rationale")) or "",
            "fix": clean_primitive(props.get("fix")) or "",
        }

    if node_type == "concept":
        source = build_concept_source(props, node_id, edges, node_map)

        node = {
            "id": node_id,
            "type": "concept",
            "label": clean_primitive(props.get("label") or node_id),
            "definition": clean_primitive(props.get("definition")) or "",
            "domain": clean_primitive(props.get("domain")) or "general",
        }

        if source:
            node["source"] = source

        return node

    if node_type == "book":
        return {
            "id": node_id,
            "type": "book",
            "label": clean_primitive(
                props.get("label")
                or props.get("title")
                or node_id
            ),
            "kind": clean_primitive(props.get("kind")) or "book",
        }

    return None


def export_edge(
    raw_edge: dict[str, Any],
    valid_ids: set[str],
) -> dict[str, Any] | None:
    source = raw_edge.get("source")
    target = raw_edge.get("target")
    rel_type = raw_edge.get("type")

    if not source or not target or not rel_type:
        return None

    if source not in valid_ids or target not in valid_ids:
        return None

    exported_type = EDGE_TYPE_MAP.get(rel_type, str(rel_type).lower())

    weight = raw_edge.get("weight")

    if weight is None:
        weight = 1.0

    try:
        weight = float(weight)
    except Exception:
        weight = 1.0

    return {
        "source": source,
        "target": target,
        "type": exported_type,
        "weight": weight,
    }


def main() -> None:
    require_password()

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD),
    )

    try:
        driver.verify_connectivity()
    except Exception as exc:
        driver.close()
        sys.exit(
            f"[ERROR] Could not connect to Neo4j at {NEO4J_URI}: {exc}"
        )

    print(f"[Neo4j] connected to {NEO4J_URI}")

    raw_nodes = fetch_nodes(driver)
    raw_edges = fetch_edges(driver)

    node_map: dict[str, dict[str, Any]] = {}

    for raw_node in raw_nodes:
        node_id = raw_node["props"].get("id")

        if node_id:
            node_map[node_id] = raw_node["props"]

    nodes: list[dict[str, Any]] = []

    for raw_node in raw_nodes:
        exported = export_node(raw_node, raw_edges, node_map)

        if exported:
            nodes.append(exported)

    valid_ids = {node["id"] for node in nodes}

    edges: list[dict[str, Any]] = []

    for raw_edge in raw_edges:
        exported = export_edge(raw_edge, valid_ids)

        if exported:
            edges.append(exported)

    graph = {
        "version": "1.0",
        "generated_at": datetime.now(timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "stats": {
            "nodes": len(nodes),
            "edges": len(edges),
            "rules": sum(1 for n in nodes if n.get("type") == "rule"),
            "concepts": sum(1 for n in nodes if n.get("type") == "concept"),
            "books": sum(1 for n in nodes if n.get("type") == "book"),
        },
        "nodes": nodes,
        "edges": edges,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(graph, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"[OK] exported {OUTPUT_FILE}")
    print(json.dumps(graph["stats"], ensure_ascii=False, indent=2))

    driver.close()


if __name__ == "__main__":
    main()
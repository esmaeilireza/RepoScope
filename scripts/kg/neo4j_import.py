#!/usr/bin/env python3
"""
scripts/kg/neo4j_import.py

Import public/knowledge/graph.json into a local Neo4j instance.

This is an offline authoring/validation tool.
RepoScope runtime must continue to use static public/knowledge/graph.json.

Environment variables:
  NEO4J_URI=bolt://localhost:7687
  NEO4J_USER=neo4j
  NEO4J_PASSWORD=...

Usage:
  python scripts/kg/neo4j_import.py
"""
from __future__ import annotations

import json
import os
import re
import sys
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
GRAPH_FILE = REPO_ROOT / "public" / "knowledge" / "graph.json"

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

BATCH_SIZE = 500


LABEL_MAP = {
    "rule": "Rule",
    "concept": "Concept",
    "book": "Source",
    "source": "Source",
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


def sanitize_relationship_type(edge_type: str) -> str:
    """
    Convert graph.json edge types into safe Neo4j relationship types.

    Examples:
      grounded_by -> GROUNDED_IN
      cited_in    -> CITED_IN
      relates_to  -> RELATES_TO
      enables     -> ENABLES
    """
    value = str(edge_type or "").strip().upper()
    value = re.sub(r"[^A-Z0-9_]", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")

    if not value:
        return "RELATES_TO"

    # Preserve RepoScope's semantic edge names where possible.
    if value == "GROUNDED_BY":
        return "GROUNDED_IN"

    return value


def flatten_node_properties(node: dict[str, Any]) -> dict[str, Any]:
    """
    Convert a graph.json node into Neo4j-friendly primitive properties.

    Neo4j supports primitives and arrays of primitives. Nested maps are either
    flattened or serialized as JSON strings.
    """
    props: dict[str, Any] = {}

    node_type = str(node.get("type", "")).lower()
    node_id = str(node.get("id", ""))

    for key, value in node.items():
        if key == "type":
            continue

        if value is None:
            continue

        if key == "source" and isinstance(value, dict):
            props["source_book"] = value.get("book")
            props["source_chapter"] = value.get("chapter")
            props["source_page_range"] = (
                value.get("page_range")
                or value.get("pageRange")
                or value.get("page")
            )
            continue

        if isinstance(value, dict):
            props[key] = json.dumps(value, ensure_ascii=False)
            continue

        if isinstance(value, list):
            primitive_list = [
                item
                for item in value
                if isinstance(item, (str, int, float, bool)) or item is None
            ]

            if len(primitive_list) == len(value):
                props[key] = [item for item in primitive_list if item is not None]
            else:
                props[key] = json.dumps(value, ensure_ascii=False)
            continue

        props[key] = value

    # Stable derived fields.
    if node_type == "rule":
        rule_id = node_id.split(":", 1)[1] if ":" in node_id else node_id
        props["rule_id"] = rule_id
        props["title"] = props.get("title") or props.get("label") or rule_id

    elif node_type == "concept":
        props["label"] = props.get("label") or props.get("concept") or node_id

    elif node_type in {"book", "source"}:
        props["title"] = props.get("title") or props.get("label") or node_id
        props["kind"] = props.get("kind") or "book"

    # Remove None values after flattening.
    return {
        key: value
        for key, value in props.items()
        if value is not None
    }


def node_label_for(node: dict[str, Any]) -> str:
    node_type = str(node.get("type", "")).lower()
    return LABEL_MAP.get(node_type, "Node")


def create_constraints_and_indexes(driver) -> None:
    """
    Create deterministic constraints and full-text indexes.

    These are safe to run repeatedly because all statements use IF NOT EXISTS.
    """
    statements = [
        # Uniqueness constraints
        """
        CREATE CONSTRAINT rule_id IF NOT EXISTS
        FOR (r:Rule) REQUIRE r.id IS UNIQUE
        """,
        """
        CREATE CONSTRAINT rule_rule_id IF NOT EXISTS
        FOR (r:Rule) REQUIRE r.rule_id IS UNIQUE
        """,
        """
        CREATE CONSTRAINT concept_id IF NOT EXISTS
        FOR (c:Concept) REQUIRE c.id IS UNIQUE
        """,
        """
        CREATE CONSTRAINT source_id IF NOT EXISTS
        FOR (s:Source) REQUIRE s.id IS UNIQUE
        """,

        # Full-text indexes for offline exploration.
        """
        CREATE FULLTEXT INDEX rule_search IF NOT EXISTS
        FOR (r:Rule) ON EACH [r.title, r.rationale, r.fix]
        """,
        """
        CREATE FULLTEXT INDEX concept_search IF NOT EXISTS
        FOR (c:Concept) ON EACH [c.label, c.definition]
        """,
        """
        CREATE FULLTEXT INDEX source_search IF NOT EXISTS
        FOR (s:Source) ON EACH [s.title, s.author, s.rights_note]
        """,
    ]

    with driver.session() as session:
        for statement in statements:
            session.run(statement)


def import_nodes(driver, nodes: list[dict[str, Any]]) -> int:
    """
    Import nodes grouped by label and batched for performance.
    """
    by_label: dict[str, list[dict[str, Any]]] = {}

    for node in nodes:
        label = node_label_for(node)
        props = flatten_node_properties(node)

        if not props.get("id"):
            continue

        by_label.setdefault(label, []).append(
            {
                "id": props["id"],
                "props": props,
            }
        )

    imported = 0

    with driver.session() as session:
        for label, rows in by_label.items():
            if not rows:
                continue

            query = f"""
            UNWIND $rows AS row
            MERGE (n:{label} {{id: row.id}})
            SET n += row.props
            """

            for start in range(0, len(rows), BATCH_SIZE):
                batch = rows[start : start + BATCH_SIZE]
                session.run(query, rows=batch)
                imported += len(batch)

    return imported


def import_edges(driver, edges: list[dict[str, Any]]) -> int:
    """
    Import edges grouped by relationship type.
    """
    by_type: dict[str, list[dict[str, Any]]] = {}

    for edge in edges:
        source_id = edge.get("source")
        target_id = edge.get("target")

        if not source_id or not target_id:
            continue

        rel_type = sanitize_relationship_type(str(edge.get("type", "RELATES_TO")))

        by_type.setdefault(rel_type, []).append(
            {
                "source_id": source_id,
                "target_id": target_id,
                "weight": float(edge.get("weight", 1.0) or 1.0),
            }
        )

    imported = 0

    with driver.session() as session:
        for rel_type, rows in by_type.items():
            if not rows:
                continue

            query = f"""
            UNWIND $rows AS row
            MATCH (a {{id: row.source_id}})
            MATCH (b {{id: row.target_id}})
            MERGE (a)-[r:{rel_type}]->(b)
            SET r.weight = row.weight
            """

            for start in range(0, len(rows), BATCH_SIZE):
                batch = rows[start : start + BATCH_SIZE]
                session.run(query, rows=batch)
                imported += len(batch)

    return imported


def main() -> None:
    require_password()

    if not GRAPH_FILE.exists():
        sys.exit(
            f"[ERROR] Missing {GRAPH_FILE}. "
            "Run scripts/kg/assemble_graph.py first."
        )

    graph = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))

    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    if not isinstance(nodes, list):
        sys.exit("[ERROR] graph.json nodes is not a list.")

    if not isinstance(edges, list):
        sys.exit("[ERROR] graph.json edges is not a list.")

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD),
    )

    try:
        driver.verify_connectivity()
    except Exception as exc:
        driver.close()
        sys.exit(
            f"[ERROR] Could not connect to Neo4j at {NEO4J_URI}: {exc}\n"
            "Start Neo4j Desktop or Docker, then retry."
        )

    print(f"[Neo4j] connected to {NEO4J_URI}")
    print("[Neo4j] creating constraints and indexes...")
    create_constraints_and_indexes(driver)

    print(
        f"[Neo4j] importing {len(nodes)} nodes "
        f"and {len(edges)} edges..."
    )

    imported_nodes = import_nodes(driver, nodes)
    imported_edges = import_edges(driver, edges)

    print(
        f"[Neo4j] import complete: "
        f"nodes={imported_nodes}, edges={imported_edges}"
    )

    driver.close()


if __name__ == "__main__":
    main()
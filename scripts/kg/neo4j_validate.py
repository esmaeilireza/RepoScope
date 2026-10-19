#!/usr/bin/env python3
"""
scripts/kg/neo4j_validate.py

Validate the local Neo4j graph used for RepoScope GraphRAG authoring.

This is an offline quality gate.

Exit code:
  0 = no critical issues
  1 = critical issues found

Environment variables:
  NEO4J_URI=bolt://localhost:7687
  NEO4J_USER=neo4j
  NEO4J_PASSWORD=...
"""
from __future__ import annotations

import os
import sys
from typing import Any

try:
    from neo4j import GraphDatabase
except ImportError:
    sys.exit(
        "[ERROR] neo4j Python driver missing. "
        "Run: pip install neo4j"
    )


NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

RULE_ID_REGEX = (
    r"^(iiot|dataops|webapp|cross|general|graph)"
    r"(-[a-z0-9]+)*-\d{3}[a-z]?$"
)


def require_password() -> None:
    if not NEO4J_PASSWORD:
        sys.exit(
            "[ERROR] NEO4J_PASSWORD is not set.\n"
            "Example PowerShell:\n"
            '  $env:NEO4J_URI="bolt://localhost:7687"\n'
            '  $env:NEO4J_USER="neo4j"\n'
            '  $env:NEO4J_PASSWORD="your-password"'
        )


def run_query(
    driver,
    query: str,
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    with driver.session() as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]


def print_rows(title: str, rows: list[dict[str, Any]], limit: int = 10) -> None:
    if not rows:
        return

    print(f"\n[{title}]")

    for row in rows[:limit]:
        print(json_dumps_compact(row))

    if len(rows) > limit:
        print(f"... and {len(rows) - limit} more")


def json_dumps_compact(value: Any) -> str:
    import json

    return json.dumps(value, ensure_ascii=False, default=str)


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

    critical = 0
    warnings = 0

    # -------------------------------------------------------------------------
    # 0. Basic counts
    # -------------------------------------------------------------------------
    counts = run_query(
        driver,
        """
        CALL {
          MATCH (r:Rule) RETURN count(r) AS rules
        }
        CALL {
          MATCH (c:Concept) RETURN count(c) AS concepts
        }
        CALL {
          MATCH (s:Source) RETURN count(s) AS sources
        }
        CALL {
          MATCH ()-[r]->() RETURN count(r) AS edges
        }
        RETURN rules, concepts, sources, edges
        """,
    )

    if counts:
        print("[Neo4j] graph counts:")
        print(json_dumps_compact(counts[0]))

    # -------------------------------------------------------------------------
    # 1. Duplicate rule IDs
    # -------------------------------------------------------------------------
    duplicate_rule_ids = run_query(
        driver,
        """
        MATCH (r:Rule)
        WHERE r.rule_id IS NOT NULL
        WITH r.rule_id AS rule_id, count(*) AS cnt
        WHERE cnt > 1
        RETURN rule_id, cnt
        ORDER BY cnt DESC, rule_id ASC
        """,
    )

    if duplicate_rule_ids:
        critical += 1
        print_rows("CRITICAL: duplicate rule IDs", duplicate_rule_ids)

    # -------------------------------------------------------------------------
    # 2. Invalid rule ID convention
    # -------------------------------------------------------------------------
    invalid_rule_ids = run_query(
        driver,
        f"""
        MATCH (r:Rule)
        WHERE r.rule_id IS NULL
           OR NOT r.rule_id =~ '{RULE_ID_REGEX.replace(chr(92), chr(92) + chr(92))}'
        RETURN r.id AS id,
               r.rule_id AS rule_id,
               r.title AS title
        ORDER BY r.id
        """,
    )

    if invalid_rule_ids:
        critical += 1
        print_rows("CRITICAL: invalid rule IDs", invalid_rule_ids)

    # -------------------------------------------------------------------------
    # 3. Rules with no grounding or citation
    # -------------------------------------------------------------------------
    ungrounded_rules = run_query(
        driver,
        """
        MATCH (r:Rule)
        WHERE NOT (r)-[:GROUNDED_IN|CITED_IN|CITES|SUPPORTED_BY]->()
        RETURN r.id AS id,
               r.rule_id AS rule_id,
               r.title AS title
        ORDER BY r.rule_id
        """,
    )

    if ungrounded_rules:
        warnings += 1
        print_rows("WARN: ungrounded rules", ungrounded_rules)

    # -------------------------------------------------------------------------
    # 4. Concepts with no source
    # -------------------------------------------------------------------------
    unsourced_concepts = run_query(
        driver,
        """
        MATCH (c:Concept)
        WHERE NOT (c)-[:CITED_IN|SUPPORTED_BY]->(:Source)
        RETURN c.id AS id,
               c.label AS label
        ORDER BY c.label
        """,
    )

    if unsourced_concepts:
        warnings += 1
        print_rows("WARN: concepts without source", unsourced_concepts)

    # -------------------------------------------------------------------------
    # 5. Sources missing attribution status
    # -------------------------------------------------------------------------
    sources_missing_status = run_query(
        driver,
        """
        MATCH (s:Source)
        WHERE s.status IS NULL OR s.status = ""
        RETURN s.id AS id,
               s.title AS title,
               s.kind AS kind
        ORDER BY s.title
        """,
    )

    if sources_missing_status:
        warnings += 1
        print_rows("WARN: sources missing status", sources_missing_status)

    # -------------------------------------------------------------------------
    # 6. Suspicious page/section/chapter citations without source
    # -------------------------------------------------------------------------
    suspicious_citations = run_query(
        driver,
        """
        MATCH (r:Rule)
        WHERE r.rationale IS NOT NULL
          AND r.rationale =~ '(?i).*(page|pp\\\\.|section|clause|chapter)\\\\s+\\\\d+.*'
          AND NOT (r)-[:CITED_IN|GROUNDED_IN|CITES]->(:Source)
        RETURN r.rule_id AS rule_id,
               r.title AS title,
               r.rationale AS rationale
        ORDER BY r.rule_id
        """,
    )

    if suspicious_citations:
        warnings += 1
        print_rows(
            "WARN: rules with suspicious unverified page/section citations",
            suspicious_citations,
        )

    print(
        f"\n[REPORT] "
        f"critical={critical}, "
        f"warnings={warnings}"
    )

    driver.close()

    if critical:
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
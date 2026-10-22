#!/usr/bin/env python3
"""Given a rule ID, returns the citation chain from Neo4j."""
import os, sys, json
from neo4j import GraphDatabase

def ground(rule_id: str):
    d = GraphDatabase.driver(
        os.getenv("NEO4J_URI",  "bolt://localhost:7687"),
        auth=(os.getenv("NEO4J_USER", "neo4j"),
              os.getenv("NEO4J_PASS", "reposcope")),
    )
    with d.session() as s:
        rows = s.run(
            """
            MATCH (r:Rule {id: $id})-[:GROUNDED_IN]->(c:Concept)-[:CITED_IN]->(b:Book)
            RETURN r.title AS rule, c.name AS concept, b.title AS book
            """,
            id=rule_id,
        ).data()
    d.close()
    return rows

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: python scripts/kg/ground.py <rule-id>")
    print(json.dumps(ground(sys.argv[1]), indent=2, ensure_ascii=False))
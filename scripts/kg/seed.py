#!/usr/bin/env python3
"""
scripts/kg/seed.py
Seeds Neo4j from public/knowledge/specs.json.
Nodes: Rule, Concept, Book, Profile.
Edges: BELONGS_TO, GROUNDED_IN, CITED_IN.
"""
import json, os
from pathlib import Path
from neo4j import GraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "reposcope")

def main():
    specs = json.loads(Path("public/knowledge/specs.json").read_text(encoding="utf-8"))
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

    with driver.session() as s:
        s.run("MATCH (n) DETACH DELETE n")
        for profile, bundle in specs.items():
            s.run("MERGE (:Profile {name: $name})", name=profile)
            for rule in bundle["rules"]:
                s.run(
                    """
                    MERGE (r:Rule {id: $id})
                      SET r.title = $title, r.severity = $severity
                    WITH r
                    MATCH (p:Profile {name: $profile})
                    MERGE (r)-[:BELONGS_TO]->(p)
                    """,
                    id=rule["id"], title=rule.get("title", ""),
                    severity=rule.get("severity", ""), profile=profile,
                )
                for ref in rule.get("references", []):
                    if "book" in ref:
                        s.run(
                            """
                            MERGE (b:Book {title: $title})
                            MERGE (c:Concept {name: $concept})
                            MERGE (c)-[:CITED_IN]->(b)
                            WITH c
                            MATCH (r:Rule {id: $id})
                            MERGE (r)-[:GROUNDED_IN]->(c)
                            """,
                            title=ref["book"],
                            concept=ref.get("concept", "unspecified"),
                            id=rule["id"],
                        )
    driver.close()
    print("[ok] seeded Neo4j from specs.json")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Retrieves citation grounding for a given rule ID from Neo4j.

Returns the citation chain: Rule -> Concept -> Book

Usage:
    python scripts/kg/ground.py <rule_id>
    
Example:
    python scripts/kg/ground.py dataops-runbook-sem-001
"""

import json
import os
import sys

try:
    from neo4j import GraphDatabase
except ImportError:
    print("ERROR: neo4j package not installed. Run: pip install neo4j")
    sys.exit(1)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "reposcope")


def ground_rule(rule_id: str):
    """Query Neo4j for the citation chain of a rule."""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    
    query = """
    MATCH (r:Rule {id: $rule_id})-[:GROUNDED_IN]->(c:Concept)-[:CITED_IN]->(b:Book)
    RETURN 
        r.id AS rule_id,
        r.title AS rule_title,
        r.severity AS severity,
        c.name AS concept,
        b.title AS book
    """
    
    with driver.session() as session:
        result = session.run(query, rule_id=rule_id)
        records = [record.data() for record in result]
    
    driver.close()
    return records


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/kg/ground.py <rule_id>")
        sys.exit(1)
    
    rule_id = sys.argv[1]
    
    try:
        records = ground_rule(rule_id)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    
    if not records:
        print(f"No grounding found for rule: {rule_id}", file=sys.stderr)
        sys.exit(1)
    
    # Output as JSON
    print(json.dumps(records, indent=2))


if __name__ == "__main__":
    main()
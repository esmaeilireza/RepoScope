#!/usr/bin/env python3
"""
Seeds Neo4j with RepoScope rule metadata from specs.json.

Creates a property graph with:
- Rule nodes (id, title, severity, profile)
- Concept nodes (name)
- Book nodes (title)
- Profile nodes (name)
- Relationships: BELONGS_TO, GROUNDED_IN, CITED_IN

Usage:
    python scripts/kg/seed.py
"""

import json
import os
import sys
from pathlib import Path

try:
    from neo4j import GraphDatabase
except ImportError:
    print("ERROR: neo4j package not installed. Run: pip install neo4j")
    sys.exit(1)

# Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "reposcope")
SPECS_PATH = Path("public/knowledge/specs.json")


def create_constraints(session):
    """Create uniqueness constraints for node IDs."""
    constraints = [
        "CREATE CONSTRAINT rule_id IF NOT EXISTS FOR (r:Rule) REQUIRE r.id IS UNIQUE",
        "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
        "CREATE CONSTRAINT book_title IF NOT EXISTS FOR (b:Book) REQUIRE b.title IS UNIQUE",
        "CREATE CONSTRAINT profile_name IF NOT EXISTS FOR (p:Profile) REQUIRE p.name IS UNIQUE",
    ]
    
    for constraint in constraints:
        try:
            session.run(constraint)
        except Exception as e:
            # Constraint might already exist
            if "already exists" not in str(e):
                print(f"Warning: {e}")


def clear_database(session):
    """Remove all existing nodes and relationships."""
    session.run("MATCH (n) DETACH DELETE n")
    print("[ok] Cleared existing graph data")


def seed_rules(session, specs):
    """Seed Rule, Profile, Concept, and Book nodes from specs.json."""
    rule_count = 0
    concept_count = 0
    book_count = 0
    
    for profile_name, bundle in specs.items():
        # Create Profile node
        session.run(
            "MERGE (p:Profile {name: $name})",
            name=profile_name
        )
        
        # Process rules
        for rule in bundle.get("rules", []):
            rule_id = rule.get("id")
            if not rule_id:
                continue
            
            # Create Rule node
            session.run(
                """
                MERGE (r:Rule {id: $id})
                SET r.title = $title,
                    r.severity = $severity,
                    r.rationale = $rationale
                """,
                id=rule_id,
                title=rule.get("title", ""),
                severity=rule.get("severity", "info"),
                rationale=rule.get("rationale", "")
            )
            
            # Create BELONGS_TO relationship
            session.run(
                """
                MATCH (r:Rule {id: $rule_id})
                MATCH (p:Profile {name: $profile})
                MERGE (r)-[:BELONGS_TO]->(p)
                """,
                rule_id=rule_id,
                profile=profile_name
            )
            
            rule_count += 1
            
            # Process references
            for ref in rule.get("references", []):
                if "book" in ref:
                    book_title = ref["book"]
                    concept_name = ref.get("concept", "unspecified")
                    
                    # Create Book node
                    session.run(
                        "MERGE (b:Book {title: $title})",
                        title=book_title
                    )
                    book_count += 1
                    
                    # Create Concept node
                    session.run(
                        "MERGE (c:Concept {name: $name})",
                        name=concept_name
                    )
                    concept_count += 1
                    
                    # Create CITED_IN relationship (Concept -> Book)
                    session.run(
                        """
                        MATCH (c:Concept {name: $concept})
                        MATCH (b:Book {title: $book})
                        MERGE (c)-[:CITED_IN]->(b)
                        """,
                        concept=concept_name,
                        book=book_title
                    )
                    
                    # Create GROUNDED_IN relationship (Rule -> Concept)
                    session.run(
                        """
                        MATCH (r:Rule {id: $rule_id})
                        MATCH (c:Concept {name: $concept})
                        MERGE (r)-[:GROUNDED_IN]->(c)
                        """,
                        rule_id=rule_id,
                        concept=concept_name
                    )
    
    return rule_count, concept_count, book_count


def main():
    """Main entry point."""
    print(f"Connecting to Neo4j at {NEO4J_URI}...")
    
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    except Exception as e:
        print(f"ERROR: Failed to connect to Neo4j: {e}")
        print("Make sure Neo4j is running: neo4j start")
        sys.exit(1)
    
    # Verify specs.json exists
    if not SPECS_PATH.exists():
        print(f"ERROR: {SPECS_PATH} not found")
        print("Run: python scripts/build_knowledge.py first")
        driver.close()
        sys.exit(1)
    
    # Load specs
    try:
        specs = json.loads(SPECS_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERROR: Failed to parse {SPECS_PATH}: {e}")
        driver.close()
        sys.exit(1)
    
    print(f"Loaded specs from {SPECS_PATH}")
    
    with driver.session() as session:
        # Clear existing data
        clear_database(session)
        
        # Create constraints
        print("[ok] Creating constraints...")
        create_constraints(session)
        
        # Seed data
        print("[ok] Seeding rules, concepts, and books...")
        rule_count, concept_count, book_count = seed_rules(session, specs)
        
        print(f"[ok] Seeded {rule_count} rules, {concept_count} concepts, {book_count} books")
    
    driver.close()
    print("[ok] Neo4j seeding complete")
    print(f"\nVerify at http://localhost:7474 (neo4j/reposcope)")
    print("Run: MATCH (n) RETURN labels(n)[0] AS type, count(n) AS count")


if __name__ == "__main__":
    main()
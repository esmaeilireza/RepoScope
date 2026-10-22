// Nodes
CREATE CONSTRAINT rule_id IF NOT EXISTS FOR (r:Rule) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT book_title IF NOT EXISTS FOR (b:Book) REQUIRE b.title IS UNIQUE;
CREATE CONSTRAINT profile_name IF NOT EXISTS FOR (p:Profile) REQUIRE p.name IS UNIQUE;

// Edges (defined by usage, not declaration, in Neo4j — but document them):
// (:Rule)-[:BELONGS_TO]->(:Profile)
// (:Rule)-[:GROUNDED_IN]->(:Concept)
// (:Concept)-[:CITED_IN]->(:Book)
// (:Profile)-[:USES_CONTEXT]->(:ContextPack)   // industrial-ml, webapp, etc.
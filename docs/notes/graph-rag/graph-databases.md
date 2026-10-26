1. Source Identity
Title: Graph Databases

# Graph Databases: New Opportunities for Connected Data — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Graph Databases: New Opportunities for Connected Data
- **Author(s):** Ian Robinson, Jim Webber, Emil Eifrem
- **Branch:** graph
- **RepoScope profile:** graph
- **Primary source file:** Graph Databases (2nd Edition) — Robinson, Webber, Eifrem — O'Reilly, 2015.pdf
- **Note status:** reviewed-with-candidate-rules


---

## 2. Scope

### In scope

- Principles of property graph modeling: nodes, relationships, labels, properties, direction, and typing.
- Structural guarantees of native graph storage and index-free adjacency.
- Cypher query language syntax, pattern matching, and declarative traversal strategies.
- Architectural comparisons across relational, aggregate/document, and native graph stores.
- Idempotent ingestion, uniqueness constraints, and additive schema evolution.
- Intermediate node reification for `n`-ary and event-centric domain modeling.
- Predictive graph analytics grounded in structural balance and triadic closure.

### Out of scope

- Hardware procurement and OS-kernel tuning parameters.
- Non-deterministic semantic reasoning and probabilistic LLM generation.
- Organizational team structures, human developer training, or enterprise business alignment strategies.
- Vendor-specific pricing, licensing, or commercial terms.
- Vector search and embedding-based retrieval, except where the source explicitly supports them.

---

## 3. Source spirit card

1. **Core intent:** The text establishes property graph database architectures as the optimal paradigm for representing, storing, and querying densely connected domains in real time.
2. **Architectural paradigm:** It advocates for native graph processing where relationships are explicit, double-linked first-class citizens rather than computed joins or foreign-key abstractions.
3. **Primary problem domain:** The book targets relational join penalties, high query latency, and schema rigidity when handling multi-hop connected data structures.
4. **Target system characteristics:** Systems built under this model require millisecond query latency, ACID transaction guarantees, and frictionless schema evolution.
5. **Structural philosophy:** Whiteboard data sketches should map directly to physical database layouts without intermediate relational normalization layers.
6. **Primary trade-offs:** The architecture trades global index lookup overhead for localized pointer-chasing traversals, sacrificing static tabular rigidity to gain structural flexibility.
7. **Data lifecycle perspective:** Data is viewed as continuously evolving connected networks where new facts and relationship types can be added additively without disruptive schema migrations.
8. **Operational governance stance:** Schema-free flexibility shifts data governance from static database constraints to automated test suites and application-level assertion gates.
9. **Verification boundary:** Verification focuses on explicit structural paths, constraint enforcement on key labels, and query traversal depth bounds.
10. **Evolution strategy:** Models evolve by introducing fine-grained relationships or shortcut edges to optimize query paths while retaining complete historical fidelity.

---

## 4. Source-backed structure

### Theme 1 — Connected Data and Native Graph Storage
- **Source:** Graph Databases (2nd Edition)
- **Structural locator:** Chapter 1: Introduction
- **Spirit locator:** Native graph databases leverage index-free adjacency to provide constant-time relationship traversals regardless of total dataset size.

### Theme 2 — Property Graph Data Modeling
- **Source:** Graph Databases (2nd Edition)
- **Structural locator:** Chapter 3: Data Modeling with Graphs
- **Spirit locator:** Mapping domain entities directly to nodes and relationships eliminates relational impedance mismatch and structural dissonance.

### Theme 3 — Graph Application Patterns and Access Control
- **Source:** Graph Databases (2nd Edition)
- **Structural locator:** Chapter 5: Graphs in the Real World
- **Spirit locator:** Expressive Cypher pattern matching enables millisecond traversals over complex social networks, recommendations, and access-control hierarchies.

### Theme 4 — Native Processing Mechanics and Storage Internals
- **Source:** Graph Databases (2nd Edition)
- **Structural locator:** Chapter 6: Graph Database Internals
- **Spirit locator:** Physically linking adjacent node and relationship records on disk turns global join queries into fast localized pointer-chasing operations.

### Theme 5 — Predictive Analysis with Graph Theory
- **Source:** Graph Databases (2nd Edition)
- **Structural locator:** Chapter 7: Predictive Analysis with Graph Theory
- **Spirit locator:** Triadic closure and structural balance provide deterministic, statically expressible graph analytics over signed relationship networks.

---

## 5. Source-backed spirit

1. **Core architectural philosophy:** Connected data is best represented by preserving domain relationships as direct physical pointers rather than reconstructing them through relational joins or aggregate key lookups.
2. **Data relationships view:** Relationships are treated as first-class entities with explicit directions, types, and properties, making them as structurally significant as the nodes they connect.
3. **Performance guarantees:** Native graph processing ensures traversal latency remains proportional only to the size of the traversed subgraph, not the total size of the global dataset.
4. **Schema evolution and governance:** Because graph structures are naturally additive, schema evolution occurs gracefully by introducing new relationship types or nodes, governed programmatically via automated testing rather than rigid DDL locks.
5. **Anti-patterns and pitfalls:** The text explicitly warns against encoding domain entities into relationship strings, denormalizing graphs prematurely for query performance, and relying on global index lookups for multi-hop queries.
6. **Query execution and pattern matching:** Declarative pattern matching via Cypher anchors specific starting nodes and flexes ASCII-art structural patterns across the graph to extract matching subgraphs.

### What kind of engineer does this source try to create?

A graph-literate backend engineer who treats relationships as first-class domain constructs, prefers additive schema evolution over disruptive migrations, and grounds idempotent ingestion in explicit uniqueness constraints enforced at the schema layer rather than at application code.

### What does it treat as a serious failure?

1. Unconstrained `MERGE` operations that produce duplicate nodes.
2. Encoding entities and dynamic attributes into relationship type strings.
3. Simulating relational joins over non-native storage layers.
4. Premature denormalization of graph structures at write time.
5. Anchoring domain queries on transient internal record IDs.

### What does it treat as normal complexity?

1. Multi-hop traversal patterns bounded by explicit path-length constraints.
2. Intermediate-node reification for `n`-ary events.
3. Additive schema evolution with new labels and relationship types.
4. Constraint-backed idempotent ingestion pipelines.

### What does it want the reader to notice before writing code?

1. Which labels serve as canonical entity identifiers.
2. Which properties require uniqueness constraints.
3. Which traversals should be bounded versus unbounded.
4. Which relationships are binary versus reified.
5. Which storage layer is actually being queried.

### What invariants does it protect?

1. **Singleton Entity Invariant:** Each canonical domain entity corresponds to exactly one node.
2. **Explicit Relationship Invariant:** Every relationship has a declared direction and type.
3. **Stable Identifier Invariant:** Domain queries anchor on business keys, never internal record IDs.
4. **Bounded Traversal Invariant:** Multi-hop queries specify explicit or bounded path lengths.
5. **Additive Evolution Invariant:** Schema changes introduce new labels/types rather than mutating existing ones.

### What trade-offs does it force the reader to make explicit?

1. **Native vs non-native storage:** Constant-time traversal versus flexible deployment on relational or aggregate stores.
2. **Binary vs reified relationships:** Simpler queries versus richer event metadata.
3. **Specific vs generic relationship types:** Fine-grained query matching versus schema-cardinality growth.
4. **Constraint-backed writes vs write throughput:** Idempotency guarantees versus marginal write cost.

---

## 6. Key concepts

### Index-Free Adjacency
- **Definition:** A storage property where every node maintains direct memory/disk pointers to its adjacent node records.
- **Why it matters:** Eliminates global index lookups during multi-hop traversals, enabling `O(1)` step execution times.
- **Related concepts:** Native Graph Processing, Micro-indexing, Pointer Chasing.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 1: Introduction | Spirit locator: Localized pointers replace global lookups.
- **Verification status:** source-backed

### Property Graph Model
- **Definition:** A graph data model consisting of nodes, directed labeled relationships, and key-value properties attached to both.
- **Why it matters:** Provides an expressive, whiteboard-friendly abstraction that aligns physical storage with domain modeling.
- **Related concepts:** Labeled Nodes, Directed Relationships, Key-Value Metadata.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Physical layout mirrors domain structure.
- **Verification status:** source-backed

### Cypher Query Language
- **Definition:** A declarative, ASCII-art-based graph query language designed to express visual structural patterns.
- **Why it matters:** Allows developers to specify the subgraph pattern to retrieve without writing low-level traversal code.
- **Related concepts:** Declarative Querying, Structural Pattern Matching, ASCII-Art Syntax.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Declarative structural pattern extraction.
- **Verification status:** source-backed

### Intermediate Node Reification
- **Definition:** Promoting a complex or multi-entity relationship event into a first-class intermediate node.
- **Why it matters:** Enables attaching rich temporal metadata, multi-party connections, and historical tracking to an interaction.
- **Related concepts:** Reification, Hyperedge Modeling, Event Centricity.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 4: Building a Graph Database Application | Spirit locator: First-class events enable rich metadata.
- **Verification status:** source-backed

### Schema-Free Agility
- **Definition:** The capability of a graph database to store heterogeneous nodes and relationships without an upfront rigid database schema.
- **Why it matters:** Allows applications to evolve incrementally alongside changing business requirements without costly migrations.
- **Related concepts:** Structural Additivity, Test-Driven Governance, Frictionless Maintenance.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 1: Introduction | Spirit locator: Additive evolution replaces disruptive migrations.
- **Verification status:** source-backed

### Structural Balance
- **Definition:** A predictive graph analytics principle examining sentiment and relationship signs across triadic social cycles.
- **Why it matters:** Enables algorithmic identification and prediction of stable versus unstable relationship dynamics in networks.
- **Related concepts:** Triadic Closure, Predictive Analysis, Social Network Analysis.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 7: Predictive Analysis with Graph Theory | Spirit locator: Deterministic analytics over signed triads.
- **Verification status:** source-backed

### Uniqueness Constraint
- **Definition:** A schema-level declaration that a given label/property pair must be unique across the database.
- **Why it matters:** Backs idempotent `MERGE` semantics, guaranteeing singleton entity instantiation across concurrent writes and re-ingestion.
- **Related concepts:** Idempotent Ingestion, Constraint-Backed Writes, Entity Identity.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Schema-level uniqueness enables idempotency.
- **Verification status:** source-backed

### Internal Record ID Instability
- **Definition:** The property that a graph database's internal node IDs are transient and reassignable across database restores, imports, or migrations.
- **Why it matters:** Domain queries anchored on internal IDs become silently incorrect after any lifecycle event.
- **Related concepts:** Stable Identifiers, Business Keys, Lifecycle Safety.
- **Citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Anchor queries on business keys, never internal IDs.
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1 — Intermediate Node Reification
- **Problem solved:** Representing complex events or `n`-ary relationships (e.g., employment history, reviews, multi-recipient emails) that binary relationships cannot natively capture.
- **Recommended approach:** Create a dedicated intermediate node representing the event, then connect all participating entities to this node with directed, typed edges.
- **Repository-level manifestation:** Cypher migration scripts creating `:Employment` or `:Transaction` nodes connecting `:Person` and `:Company` nodes.
- **Limitations:** Increases total node count and traversal hops by one step.
- **Source citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 4: Building a Graph Database Application | Spirit locator: Reified events carry rich metadata that binary edges cannot.

### Pattern 2 — Idempotent Graph Ingestion via Uniqueness Constraints
- **Problem solved:** Preventing duplicate node creation and maintaining entity identity during batch or real-time graph writes.
- **Recommended approach:** Assert explicit uniqueness constraints on canonical entity properties before executing `MERGE` or `CREATE UNIQUE` Cypher ingestion statements.
- **Repository-level manifestation:** Database schema setup files containing `CREATE CONSTRAINT ON (p:Person) ASSERT p.id IS UNIQUE;`.
- **Limitations:** Requires maintaining indexes for constrained properties, incurring slight write overhead.
- **Source citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Schema constraints guarantee single-entity instantiation.

### Pattern 3 — Fine-Grained Relationship Specialization
- **Problem solved:** Traversing specific sub-categories of relationships efficiently without filtering large property sets at query time.
- **Recommended approach:** Use specific relationship types (e.g., `:HOME_ADDRESS` versus `:WORK_ADDRESS`) alongside or in place of generic relationships with properties.
- **Repository-level manifestation:** Cypher query templates matching explicit relationship types rather than generic filtering clauses.
- **Limitations:** Increases schema relationship-type cardinality.
- **Source citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 4: Building a Graph Database Application | Spirit locator: Specific types trade schema cardinality for query expressiveness.

### Pattern 4 — Bounded Multi-Hop Traversal
- **Problem solved:** Preventing unbounded recursive traversals that can exceed operational latency budgets or exhaust memory during query execution.
- **Recommended approach:** Bound multi-hop Cypher patterns using explicit path-length limits (e.g., `-[:KNOWS*1..3]->`) rather than unbounded wildcards.
- **Repository-level manifestation:** Cypher files where multi-hop patterns declare upper bounds on relationship repetition.
- **Limitations:** Excessively tight bounds may miss legitimate domain context; excessively loose bounds may recreate the original latency risk.
- **Source citation:** Source: Graph Databases (2nd Edition) | Structural locator: Chapter 3: Data Modeling with Graphs | Spirit locator: Explicit path bounds convert open recursion into bounded work.

---

## 8. Common failure modes and risks

### Failure 1 — Unconstrained Ingestion Data Duplication
- **Why it happens:** Executing Cypher `MERGE` or `CREATE` statements without establishing uniqueness constraints on target node labels.
- **Early warning signs:** Unexpected proliferation of duplicate nodes representing the same physical entity.
- **Repository evidence:** Cypher ingestion scripts containing `MERGE` clauses while schema definition files lack corresponding `CREATE CONSTRAINT` declarations.
- **Severity tendency:** error

### Failure 2 — Encoding Entities into Relationship Types
- **Why it happens:** Attempting to force complex entity metadata or dynamic attributes directly into the relationship type string.
- **Early warning signs:** Explosive growth of unique relationship types in the database schema, complicating query pattern construction.
- **Repository evidence:** Cypher files exhibiting dynamically constructed relationship types such as `-[:LIVES_IN_NEW_YORK]->`.
- **Severity tendency:** warning

### Failure 3 — Relational Join Simulation over Non-Native Stores
- **Why it happens:** Layering a graph API on top of aggregate or relational stores that lack index-free adjacency.
- **Early warning signs:** Exponential latency increases as query traversal depth increases beyond two hops.
- **Repository evidence:** Configuration files targeting non-native storage layers without native pointer indexing.
- **Severity tendency:** error

### Failure 4 — Premature Query Denormalization
- **Why it happens:** Attempting to precompute and flatten graph structures at write time out of relational habit.
- **Early warning signs:** High write latency and loss of raw domain fidelity.
- **Repository evidence:** Complex pre-aggregation pipelines prior to graph insertion.
- **Severity tendency:** warning

### Failure 5 — Internal Record ID Anchoring
- **Why it happens:** Filtering or matching nodes using the database's internal numeric record ID rather than the domain business key.
- **Early warning signs:** Queries that silently return incorrect results after a database restore, import, or migration.
- **Repository evidence:** Cypher files containing clauses such as `WHERE id(n) = 42`.
- **Severity tendency:** warning

---

## 9. Repository-audit translation

### A. General graph database practices

- Maintain strict property-graph integrity with explicit node labels and relationship types.
- Assert uniqueness constraints on all canonical primary keys before executing ingestion queries.
- Rely on native index-free adjacency traversals instead of global secondary-index joins.
- Bound multi-hop traversals explicitly to prevent query runaway.

### B. GraphRAG-specific grounding practices

- Ensure all graph node extractions maintain explicit source provenance properties.
- Bound multi-hop Cypher traversals using explicit path-length limits (e.g., `*1..3`) to prevent query runaway during retrieval.
- Maintain strict alignment between structured graph schema declarations and application retrieval query types.
- Separate retrieval logic from generation logic so grounding chains remain auditable.

### C. RepoScope deterministic audit practices

#### Static checks (automated)

- Detect Cypher files containing `MERGE` statements where label constraints are missing in repository schema specifications.
- Detect missing repository graph specification schema files (`docs/specs/graph.yaml`).
- Verify that Cypher queries do not reference deprecated or non-deterministic internal node lookup methods.

#### Human review (contextual & strategic)

- Evaluate whether the property graph model accurately captures real-world domain entity relationships.
- Review traversal depth bounds to balance domain context retrieval against operational query latency.
- Assess organizational data-governance procedures for test-driven graph schema evolution.
- Review reification decisions to confirm they reflect genuine domain events rather than implementation convenience.

---

## 10. Candidate rules

### Rule candidate: graph-schema-001
- **Title:** Uniqueness Constraint Declaration for Idempotent MERGE Operations
- **Profile:** graph
- **Severity tendency:** error
- **Rationale:** Executing Cypher `MERGE` statements without establishing an underlying uniqueness constraint risks producing duplicate nodes during concurrent writes or re-ingestion passes.
- **Source-backed basis:** Graph Databases emphasizes that idempotent graph updates require backing uniqueness constraints to guarantee entity singletons.
- **Repository evidence to inspect:** Inspect `.cypher` files for `MERGE` statements and cross-reference against constraint definitions in database setup scripts.
- **Pass condition:** Every label and property pair used as a target in a Cypher `MERGE` statement has an associated `CREATE CONSTRAINT` definition in schema scripts.
- **Fail condition:** A `MERGE` statement targets a label/property combination that lacks an explicit uniqueness constraint declaration.
- **Exceptions or limitations:** Static regex check may miss dynamically constructed Cypher strings generated in application code.
- **YAML readiness:** blocked
- **Reason if not ready:** Publication gate unmet (Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:**
  - Source: Graph Databases (2nd Edition)
  - Structural locator: Chapter 3: Data Modeling with Graphs
  - Spirit locator: Idempotent graph modification relies on uniqueness constraints to enforce single-entity instantiation.
- **Verification status:** source-backed

### Rule candidate: graph-001
- **Title:** Repository Graph Specification Schema File Presence
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** A dedicated graph repository specification file guarantees deterministic schema verification and profile validation across build pipelines.
- **Source-backed basis:** Governed graph development requires explicit specification artifacts to drive test assertions and structural verification.
- **Repository evidence to inspect:** Inspect the filesystem path `docs/specs/graph.yaml`.
- **Pass condition:** The file `docs/specs/graph.yaml` exists on the repository filesystem.
- **Fail condition:** The file `docs/specs/graph.yaml` is absent from the repository filesystem.
- **Exceptions or limitations:** None.
- **YAML readiness:** blocked
- **Reason if not ready:** Publication gate unmet (Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:**
  - Source: Graph Databases (2nd Edition)
  - Structural locator: Chapter 1: Introduction
  - Spirit locator: Graph governance requires explicit, testable specification artifacts to validate evolving data models.
- **Verification status:** source-backed

### Rule candidate: graph-cypher-001
- **Title:** Detection of Hardcoded Internal Identity Lookup in Cypher Queries
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** Internal database node IDs are transient and reassignable across database restores or imports; queries must anchor on domain business keys.
- **Source-backed basis:** Graph Databases warns against relying on internal record IDs for domain operations due to identity instability across lifecycles.
- **Repository evidence to inspect:** Inspect `.cypher` files for usage of the internal `id()` function in `WHERE` filtering clauses.
- **Pass condition:** Cypher queries filter starting nodes using business properties or parameters rather than internal `id()` functions.
- **Fail condition:** A Cypher query uses hardcoded internal integer IDs (e.g., `WHERE id(n) = 42`) for node matching.
- **Exceptions or limitations:** Internal ID usage may be acceptable in temporary low-level maintenance scripts.
- **YAML readiness:** needs-review
- **Reason if not ready:** Requires a full AST / semantic Cypher parser to distinguish unsafe domain filtering from legitimate system-maintenance operations without false positives.
- **Source citation:**
  - Source: Graph Databases (2nd Edition)
  - Structural locator: Chapter 3: Data Modeling with Graphs
  - Spirit locator: Domain node lookup must rely on stable business identifiers rather than transient database internal record IDs.
- **Verification status:** source-backed

---

## 11. Suggested YAML fragment

```yaml
# No rules ready for emission under current validator contract.
# All three candidate rules are blocked by the graph publication gate
# or by validator check-type boundaries.
#
# Do not add the rules below to docs/specs/graph.yaml until:
#   - Gate 1: docs/specs/graph.yaml exists
#   - Gate 2: scripts/build_knowledge.py accepts profile: graph
#   - Gate 3: lib/types.ts includes graph or a compatible canonical profile
#   - Gate 4: tests accept graph rule IDs
#   - Gate 5: public/knowledge/specs.json contains graph rules
#   - Gate 6: public/knowledge/graph.json contains matching rule nodes

## 12. Handoff checklist

HANDOFF CHECKLIST
- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use {book|standard, concept}.
- [x] All emitted check types are in {pattern_match, file_exists, file_absent}.
- [x] All "ready" rules appear in Section 11 YAML. (None are ready).
- [x] All "needs-review" / "blocked" rules are absent from Section 11 YAML.
- [x] Section 11 ends with "### Candidates not emitted" or explicit block explanation.
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked "Meaning to be confirmed."
- [x] "Note status" reflects the weakest readiness in Section 10 (`reviewed-with-candidate-rules`).
- [x] Section 9 explicitly separates General Graph, GraphRAG, and RepoScope deterministic practices.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules (3 provided, all correctly blocked/needs-review).

## References

<!-- ref: TODO -->

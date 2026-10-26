1. Source Identity
Title: Graph Algorithms

# Graph Algorithms: Practical Examples in Apache Spark and Neo4j — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Graph Algorithms: Practical Examples in Apache Spark and Neo4j
- **Author(s):** Mark Needham, Amy E. Hodler
- **Branch:** graph
- **RepoScope profile:** graph
- **Primary source file:** Graph Algorithms: Practical Examples in Apache Spark and Neo4j.pdf
- **Note status:** reviewed-with-candidate-rules


---

## 2. Scope

### In scope

- Algorithmic categories:
  - Pathfinding: BFS, DFS, Shortest Path, A*, SSSP, APSP, Minimum Spanning Tree, Random Walk.
  - Centrality: Degree, Closeness, Betweenness, PageRank.
  - Community Detection: Triangle Count, Clustering Coefficient, Strongly Connected Components, Connected Components, Label Propagation, Louvain Modularity.
- Platform trade-offs between scale-out compute engines (Apache Spark / GraphFrames) and transactional database graph analytics (Neo4j / Graph Algorithms Library).
- Graph-enhanced machine learning workflows, connected feature extraction (e.g., triangle counts, preferential attachment, community IDs), and link prediction pipelines.
- Deterministic, statically detectable algorithmic and query patterns.

### Out of scope

- Non-graph relational SQL optimization and traditional tabular data warehousing.
- Probabilistic large language model (LLM) fine-tuning or prompt engineering lacking explicit graph structures.
- Hardware procurement, OS-kernel memory tuning, or human team organizational management strategies.
- Vector search and embedding-based retrieval, except where the source explicitly supports them.
- Vendor-specific pricing, licensing, or commercial terms.

---

## 3. Source spirit card

1. **Core intent:** The text demonstrates how specialized graph algorithms uncover hidden network patterns, centrality, and communities to solve complex analytical and machine learning problems at scale.
2. **Architectural paradigm:** It combines scale-out distributed processing for global batch analytics with native graph-database computation for localized, memory-efficient traversals.
3. **Primary problem domain:** Addressing high-dimensional relationship analysis where traditional relational joins or isolated record aggregation fail to scale or reveal topological insights.
4. **Target system characteristics:** Systems requiring high-throughput batch feature extraction, millisecond transactional path traversals, and scalable graph analytics engines.
5. **Structural philosophy:** Network structures (paths, clusters, hubs) must be evaluated directly on graph representations using dedicated parallelized graph algorithms rather than relational aggregations.
6. **Primary trade-offs:** Scale-out compute engines trade memory locality for distributed parallelism, whereas native graph databases maximize memory locality and traversal performance.
7. **Data lifecycle perspective:** Data moves from transactional property graph stores into projected in-memory subgraphs for iterative algorithm execution and write-back feature enrichment.
8. **Operational governance stance:** Execution parameters, traversal bounds, and schema projections must be verified deterministically to avoid resource exhaustion and non-terminating loops.
9. **Verification boundary:** Verification focuses on projected subgraph definitions, query traversal depth bounds, memory-bounded algorithm execution, and uniqueness constraints.
10. **Evolution strategy:** Models evolve by projecting dynamic subgraphs, computing algorithm metrics (e.g., PageRank, Louvain partitions), and writing back scores additively to enrich graph entities.

---

## 4. Source-backed structure

### Theme 1 — Graph Analytics Platforms and Processing Modes
- **Source:** Graph Algorithms
- **Structural locator:** Chapter 3: Graph Platforms and Processing
- **Spirit locator:** Selecting between scale-out batch processing (Spark) and memory-local database execution (Neo4j) depends on iteration needs, memory locality, and dataset size.

### Theme 2 — Pathfinding and Graph Search Algorithms
- **Source:** Graph Algorithms
- **Structural locator:** Chapter 4: Pathfinding and Graph Search Algorithms
- **Spirit locator:** Pathfinding algorithms establish routing efficiency, traversal distances, and structural availability across connected networks.

### Theme 3 — Centrality Algorithms for Influence Measurement
- **Source:** Graph Algorithms
- **Structural locator:** Chapter 5: Centrality Algorithms
- **Spirit locator:** Centrality metrics quantify node importance, bridge roles, and immediate reach within complex networks.

### Theme 4 — Community Detection and Substructure Identification
- **Source:** Graph Algorithms
- **Structural locator:** Chapter 6: Community Detection Algorithms
- **Spirit locator:** Community detection algorithms partition graphs into densely connected clusters to reveal hidden modularity, cohesive groups, and structural dependencies.

### Theme 5 — Graph-Enhanced Machine Learning and Feature Extraction
- **Source:** Graph Algorithms
- **Structural locator:** Chapter 8: Using Graph Algorithms to Enhance Machine Learning
- **Spirit locator:** Extracting structural and algorithmic features significantly improves predictive accuracy in downstream machine learning tasks such as link prediction.

---

## 5. Source-backed spirit

1. **Core architectural philosophy:** Real-world networks rarely follow average distributions; specialized graph algorithms are essential to evaluate connections and relationships directly.
2. **Data relationships view:** Relationships carry vital contextual signal; analyzing path lengths, relationship weights, and subgraphs reveals structural insights missed by traditional record filtering.
3. **Performance guarantees:** Native graph-database engines optimize memory locality for iterative algorithms, while distributed platforms rely on data partitioning across cluster nodes.
4. **Schema evolution and governance:** Analytical workflows project temporary subgraphs from underlying property schemas, writing back computed metrics additively to enrich node properties.
5. **Anti-patterns and pitfalls:** The authors explicitly warn against executing unbounded path searches that cause query runaway, running unweighted algorithms on distance-weighted networks, and relying on transient internal record IDs.
6. **Query execution and pattern matching:** Algorithmic procedure calls in Cypher stream or write results by projecting specific node labels and relationship types over native or in-memory subgraphs.

### What kind of engineer does this source try to create?

A graph analytics engineer who treats algorithm selection and traversal bounds as first-class design decisions, projects minimal in-memory subgraphs rather than operating on the transactional database, and grounds ML feature extraction in explicit structural graph metrics rather than ad-hoc tabular joins.

### What does it treat as a serious failure?

1. Unbounded multi-hop traversal causing query runaway or server unresponsiveness.
2. Passing transient internal node IDs into algorithm procedure calls or application logic.
3. Running iterative algorithms over unfiltered supernodes without degree-based projection bounds.
4. Training link-prediction models on class-imbalanced datasets generated directly from Cartesian products.
5. Selecting algorithms and platforms without matching them to dataset size and hardware memory bounds.

### What does it treat as normal complexity?

1. Managing platform trade-offs between Spark batch processing and Neo4j in-memory execution.
2. Direction-ignored undirected graph simulation on storage engines that persist directed edges.
3. Down-sampling negative node pairs for balanced link-prediction training sets.
4. Write-back of computed algorithm metrics (PageRank, Louvain partitions) as node properties.

### What does it want the reader to notice before writing code?

1. Which algorithm category (pathfinding, centrality, community detection) matches the analytical question.
2. Which platform (Spark vs Neo4j) suits the dataset's size, memory footprint, and iteration profile.
3. Which traversal bounds apply to any variable-length path pattern.
4. Which projection bounds filter out supernodes and low-signal relationships.
5. Which feature set (triangle count, preferential attachment, community ID) the downstream model expects.

### What invariants does it protect?

1. **Bounded Traversal Invariant:** Every variable-length path pattern specifies an explicit maximum hop count.
2. **Stable Identifier Invariant:** Algorithm inputs reference business keys, never transient internal record IDs.
3. **Bounded Projection Invariant:** Algorithm executions project only the required subgraph, filtered for supernodes where appropriate.
4. **Balanced Training Invariant:** Link-prediction datasets contain balanced positive and negative samples.
5. **Memory-Bounded Execution Invariant:** Algorithm selection accounts for available memory and dataset scale.

### What trade-offs does it force the reader to make explicit?

1. **Spark vs Neo4j:** Distributed scale-out parallelism versus memory-local traversal performance.
2. **Direction-ignored traversal vs storage model:** Undirected analysis on directed storage introduces edge duplication or direction semantics to reconcile.
3. **Algorithmic determinism vs speed:** Deterministic community detection (Louvain) versus non-deterministic alternatives (Label Propagation).
4. **Feature richness vs training-set balance:** Structurally informative features versus class-imbalanced training signals.

---

## 6. Key concepts

### Shortest Path (Dijkstra / A*)
- **Definition:** Algorithms that find the path with the lowest cumulative relationship weight or fewest hops between target nodes.
- **Why it matters:** Essential for route optimization, network latency minimization, and distance-based feature extraction.
- **Related concepts:** Single Source Shortest Path (SSSP), All Pairs Shortest Path (APSP), Yen's k-Shortest Paths.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 4: Pathfinding and Graph Search Algorithms | Spirit locator: Weighted path optimization anchors routing and latency minimization.
- **Verification status:** source-backed

### PageRank
- **Definition:** An iterative centrality algorithm measuring node importance based on the number and quality of incoming connections.
- **Why it matters:** Identifies key influencers, reputable entities, and critical hubs across directed networks.
- **Related concepts:** Random Surfer Model, Damping Factor / Reset Probability, Personalized PageRank.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 5: Centrality Algorithms | Spirit locator: Influence is a weighted function of inbound connection quality.
- **Verification status:** source-backed

### Betweenness Centrality
- **Definition:** A centrality metric measuring how frequently a node falls on the shortest paths between all other node pairs in a network.
- **Why it matters:** Pinpoints bottleneck nodes, information brokers, and critical bridges across distinct subgraphs.
- **Related concepts:** Structural Bridges, Randomized-Approximate Brandes, Flow Control.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 5: Centrality Algorithms | Spirit locator: Bridge position, not just degree, defines structural criticality.
- **Verification status:** source-backed

### Label Propagation Algorithm (LPA)
- **Definition:** A fast, semi-supervised community detection algorithm that infers clusters by propagating node labels through neighborhood majorities.
- **Why it matters:** Rapidly groups large networks into communities without requiring prior threshold parameters.
- **Related concepts:** Seed Labels, Consensus Building, Non-deterministic Clustering.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 6: Community Detection Algorithms | Spirit locator: Neighborhood-majority propagation yields rapid, parameter-free clustering.
- **Verification status:** source-backed

### Louvain Modularity
- **Definition:** An algorithm that detects hierarchical communities by optimizing modularity scores comparing relationship density within clusters against expected random connections.
- **Why it matters:** Reveals multi-level community structures and fine-grained cluster hierarchies in complex datasets.
- **Related concepts:** Modularity Optimization, Supercommunities, Hierarchical Clustering.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 6: Community Detection Algorithms | Spirit locator: Modularity optimization uncovers hierarchical cluster structure.
- **Verification status:** source-backed

### Connected Features for Machine Learning (Link Prediction)
- **Definition:** Extracting structural graph metrics (e.g., triangle counts, preferential attachment, shared community membership) to serve as predictive features in machine learning models.
- **Why it matters:** Dramatically improves classifier accuracy for predicting missing links or future collaborations.
- **Related concepts:** Preferential Attachment, Common Neighbors, Feature Engineering Pipeline.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 8: Using Graph Algorithms to Enhance Machine Learning | Spirit locator: Graph-derived features supply structural signal tabular models cannot express.
- **Verification status:** source-backed

### Internal Record ID Instability
- **Definition:** The property that a graph database's internal node IDs are transient and reassignable across imports, restores, or re-index passes.
- **Why it matters:** Algorithm procedure calls and application queries anchored on internal IDs become silently incorrect after any lifecycle event.
- **Related concepts:** Stable Identifiers, Business Keys, Lifecycle Safety.
- **Citation:** Source: Graph Algorithms | Structural locator: Chapter 3: Graph Platforms and Processing | Spirit locator: Anchor algorithm inputs on domain business keys, never internal IDs.
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1 — Projected In-Memory Graph Procedure Pattern
- **Problem solved:** Executing CPU-intensive iterative algorithms (e.g., PageRank, Louvain) without locking or modifying the transactional database on every iteration.
- **Recommended approach:** Explicitly project required node labels and relationship types into an in-memory graph before invoking procedure calls (`CALL algo.pageRank(...)` or GDS equivalents).
- **Repository-level manifestation:** Cypher script templates defining explicit match projections or GDS graph projection declarations.
- **Limitations:** Memory footprint scales with projected graph size.
- **Source citation:** Source: Graph Algorithms | Structural locator: Chapter 7: Graph Algorithms in Practice | Spirit locator: In-memory projections decouple algorithm iteration from transactional storage.

### Pattern 2 — Direction-Ignored Undirected Graph Simulation Pattern
- **Problem solved:** Running bidirectional graph algorithms (such as transportation or coauthorship analysis) on storage engines that store directed edges.
- **Recommended approach:** Configure Cypher algorithm procedures to ignore relationship direction (`BOTH`) or generate reciprocal edge rows in Spark DataFrames (`src->dst` and `dst->src`).
- **Repository-level manifestation:** Cypher procedure parameters set to `direction: "BOTH"` or PySpark DataFrame transformation code duplicating directional rows.
- **Limitations:** Increases effective edge count by two-fold in Spark data structures.
- **Source citation:** Source: Graph Algorithms | Structural locator: Chapter 4: Pathfinding and Graph Search Algorithms | Spirit locator: Undirected analysis on directed storage requires direction-ignoring projections.

### Pattern 3 — Balanced Link Prediction Feature Pipeline Pattern
- **Problem solved:** Preventing class-imbalance bias when training ML classifiers on sparse link prediction tasks.
- **Recommended approach:** Construct balanced training/testing datasets containing an equal number of positive (collaborated) and down-sampled negative (non-collaborated) node pairs before extracting graph features.
- **Repository-level manifestation:** Data preparation scripts in PySpark/Python enforcing down-sampling on non-connected node-pair sets.
- **Limitations:** Requires generating negative pairs via multi-hop candidate sampling.
- **Source citation:** Source: Graph Algorithms | Structural locator: Chapter 8: Using Graph Algorithms to Enhance Machine Learning | Spirit locator: Balanced sampling prevents classifier bias toward trivial negatives.

### Pattern 4 — Bounded Multi-Hop Traversal Pattern
- **Problem solved:** Preventing variable-length path queries from exploding across dense subgraphs and exhausting memory or exceeding latency budgets.
- **Recommended approach:** Bound every variable-length relationship pattern with an explicit upper hop count (e.g., `-[*1..4]->`) rather than using unbounded wildcards.
- **Repository-level manifestation:** Cypher files where multi-hop patterns declare upper bounds on relationship repetition.
- **Limitations:** Excessively tight bounds may miss legitimate context; excessively loose bounds recreate the original latency risk.
- **Source citation:** Source: Graph Algorithms | Structural locator: Chapter 4: Pathfinding and Graph Search Algorithms | Spirit locator: Explicit path bounds convert open recursion into bounded work.

---

## 8. Common failure modes and risks

### Failure 1 — Unbounded Multi-Hop Traversal Execution
- **Why it happens:** Executing variable-length Cypher path queries (e.g., `-[*]->`) or recursive graph traversals without depth limits on dense graphs.
- **Early warning signs:** Query timeouts, memory exhaustion, and server unresponsiveness during path evaluation.
- **Repository evidence:** Cypher query files containing unconstrained path-match patterns such as `MATCH (a)-[*]->(b)`.
- **Severity tendency:** critical

### Failure 2 — Hardcoded Internal Node ID Dependencies
- **Why it happens:** Passing raw internal database node IDs directly into algorithm procedure calls or application logic instead of business keys.
- **Early warning signs:** Fragile queries breaking after database imports, restores, or node re-index passes.
- **Repository evidence:** Cypher scripts referencing hardcoded integer arguments in procedure calls (e.g., `algo.randomWalk.stream(148, 5, 1)`).
- **Severity tendency:** warning

### Failure 3 — Executing Iterative Algorithms on Unfiltered Supernodes
- **Why it happens:** Running dense centrality or community algorithms over high-degree "supernodes" without filtering or projection bounds.
- **Early warning signs:** Severe iteration latency spikes and out-of-memory errors during algorithm execution.
- **Repository evidence:** Graph projection configurations omitting degree filtering on hub-node labels.
- **Severity tendency:** error

### Failure 4 — Class Imbalance in Link Prediction Training Sets
- **Why it happens:** Training link prediction models on raw sparse node pairs where negative examples outnumber positive examples by orders of magnitude.
- **Early warning signs:** High classifier accuracy metrics masking total failure to predict true positive links.
- **Repository evidence:** ML pipeline scripts generating training DataFrames directly from Cartesian products without down-sampling negative pairs.
- **Severity tendency:** error

### Failure 5 — Algorithm/Platform Mismatch
- **Why it happens:** Selecting Spark or Neo4j without matching the choice to dataset size, memory footprint, and iteration profile.
- **Early warning signs:** Iteration latency far exceeding operational budget; unnecessary cluster scale-out for small graphs; memory exhaustion for large graphs on single-node execution.
- **Repository evidence:** Algorithm invocation files or Spark job configurations that contradict the dataset's operational envelope.
- **Severity tendency:** warning

---

## 9. Repository-audit translation

### A. General graph database practices

- Enforce explicit relationship direction guidelines and property modeling standards.
- Bound Cypher path-matching expressions with upper-limit integer constraints (e.g., `-[*1..4]->`).
- Standardize procedure calls for graph algorithm execution via versioned libraries (GDS / Neo4j Graph Algorithms).
- Filter supernodes or apply degree-based projection bounds before running iterative algorithms.

### B. GraphRAG-specific grounding practices

- Ensure community detection procedures (e.g., Louvain / Leiden) produce deterministic cluster IDs for knowledge-graph summarization.
- Restrict multi-hop reasoning traversals to defined maximum hop counts to control retrieval latency.
- Enforce schema declarations on projected graph entities used for semantic search.
- Separate retrieval-time traversals from batch-computed structural features so that grounding chains remain auditable.

### C. RepoScope deterministic audit practices

#### Static checks (automated)

- Detect unconstrained Cypher path traversals (e.g., `-[*]->`).
- Check for repository graph specification schema presence (`docs/specs/graph.yaml`).
- Flag Cypher queries featuring hardcoded internal node integer lookup arguments.

#### Human review (contextual & strategic)

- Review algorithm selection (Spark vs Neo4j) relative to dataset size and hardware memory bounds.
- Evaluate link prediction down-sampling ratios and feature engineering pipelines.
- Assess operational fallback strategies for non-deterministic algorithms (e.g., Label Propagation).
- Review supernode filtering policy against operational latency and correctness requirements.

---

## 10. Candidate rules

### Rule candidate: graph-cypher-unbounded-traversal
- **Title:** Unbounded Variable-Length Path Matching Detection
- **Profile:** graph
- **Severity tendency:** critical
- **Rationale:** Variable-length path patterns without explicit upper bounds can trigger explosive graph traversals and exhaust memory resources.
- **Source-backed basis:** *Graph Algorithms* highlights that path exploration must be bounded to avoid query runaway on dense subgraphs.
- **Repository evidence to inspect:** Cypher query files (`.cypher`) containing unbounded path patterns like `-[*]->` or `-[*..]->`.
- **Pass condition:** All variable-length relationship patterns specify an explicit maximum hop count (e.g., `-[*1..5]->`).
- **Fail condition:** A Cypher file contains a variable-length path pattern with no upper bound (e.g., `MATCH (a)-[*]->(b)`).
- **Exceptions or limitations:** Static regex scanning may not catch dynamically constructed query strings in application source files.
- **YAML readiness:** blocked
- **Reason if not ready:** Publication gate unmet (Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:**
  - Source: Graph Algorithms
  - Structural locator: Chapter 4: Pathfinding and Graph Search Algorithms
  - Spirit locator: Traversal algorithms must enforce explicit path-length boundaries to ensure deterministic query completion.
- **Verification status:** source-backed

### Rule candidate: graph-001
- **Title:** Repository Graph Specification Schema File Presence
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** A dedicated graph specification schema file enforces structural data governance across CI/CD validation pipelines.
- **Source-backed basis:** Governed graph development requires explicit specification artifacts to drive automated validation gates.
- **Repository evidence to inspect:** Inspect the filesystem path `docs/specs/graph.yaml`.
- **Pass condition:** The file `docs/specs/graph.yaml` exists on the repository filesystem.
- **Fail condition:** The file `docs/specs/graph.yaml` is absent from the repository filesystem.
- **Exceptions or limitations:** None.
- **YAML readiness:** blocked
- **Reason if not ready:** Publication gate unmet (Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:**
  - Source: Graph Algorithms
  - Structural locator: Chapter 3: Graph Platforms and Processing
  - Spirit locator: Schema and graph processing pipelines require explicit specification files to audit model definitions.
- **Verification status:** source-backed

### Rule candidate: graph-cypher-internal-id-usage
- **Title:** Hardcoded Internal Node ID Filtering Detection
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** Relying on transient internal node IDs leads to fragile queries that break when databases are re-indexed or restored.
- **Source-backed basis:** *Graph Algorithms* emphasizes anchoring query start nodes on stable domain business identifiers rather than transient database internal IDs.
- **Repository evidence to inspect:** Cypher `.cypher` files containing `id()` predicate filters or hardcoded procedure arguments.
- **Pass condition:** Queries filter starting nodes using business properties or parameter bindings.
- **Fail condition:** A Cypher query contains hardcoded internal integer node ID lookups (e.g., `WHERE id(n) = 102`).
- **Exceptions or limitations:** Requires AST Cypher parsing to distinguish administrative maintenance scripts from production application queries without false positives.
- **YAML readiness:** needs-review
- **Reason if not ready:** Requires semantic AST Cypher query parsing to eliminate false positives in system-administration scripts.
- **Source citation:**
  - Source: Graph Algorithms
  - Structural locator: Chapter 3: Graph Platforms and Processing
  - Spirit locator: Domain entity lookup must rely on persistent business keys rather than transient internal node identifiers.
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

All emitted rule IDs are unique.
All emitted severities match Section 10.
All emitted references use {book|standard, concept}.
All emitted check types are in {pattern_match, file_exists, file_absent}.
All ready rules appear in Section 11 YAML.
All needs-review / blocked rules are absent from Section 11 YAML.
Section 11 ends with ### Candidates not emitted.
No page numbers anywhere in the note.
No verbatim quotes longer than 15 words.
Every supplied rule ID is either used with a source-backed meaning or explicitly marked Meaning to be confirmed.
Note status reflects the weakest readiness in Section 10.
Section 9 does not smuggle non-static advice into the automated list.
Section 3 has all 10 fields filled.
Section 10 has at least 3 rules (or explicit justification).
Every candidate rule has a readiness label with a reason if not ready.


## References

<!-- ref: TODO -->

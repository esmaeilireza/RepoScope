# Agentic GraphRAG: Integrating Knowledge Graphs, Reasoning, and Agency for Enterprise AI — RepoScope Knowledge Note

## 1. Source identity
- **Title:** Agentic GraphRAG: Integrating Knowledge Graphs, Reasoning, and Agency for Enterprise AI
- **Author(s):** Anthony Alcaraz and Sam Julien
- **Branch:** graph
- **RepoScope profile:** graph
- **Primary source file:** agentic-graphrag.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
- **In scope:**
  - Dual-graph architecture (pairing vertical knowledge graphs for domain representation with horizontal workflow graphs for action planning).
  - Diagnosis and remediation of the five fatal flaws of vector RAG (context amnesia, relationship blindness, temporal ignorance, reasoning paralysis, and tool chaos).
  - Three-graph knowledge architecture (domain graph, lexical graph, and subject graph) for provenance-aware LLM extractions.
  - Graph memory architectures (episodic, semantic, procedural memory, bitemporal modeling, and context graphs).
  - Multi-hop reasoning, structural protection against the distracting effect via PathRAG, R3-RAG adaptive retrieval, and execution graph evaluation loops.
- **Out of scope:**
  - Traditional flat vector-only retrieval lacking relational, topological, or bitemporal graph constraints.
  - Unconstrained LLM prompt engineering without explicit workflow structures or schema validation.
  - Hardware procurement, OS kernel memory tuning, or human organizational chart restructuring.

---

## 3. Source spirit card
1. **Core intent:** The text establishes that transforming enterprise AI from passive Q&A tools into reliable autonomous agents requires replacing flat vector retrieval with a dual-graph architecture that combines structured knowledge with inspectable action workflows.
2. **Architectural paradigm:** It advocates for a dual-graph architecture that pairs a vertical knowledge graph (what the agent knows) with a horizontal workflow graph (how the agent acts).
3. **Primary problem domain:** Addressing the five fatal flaws of traditional vector RAG—context amnesia, relationship blindness, temporal ignorance, reasoning paralysis, and tool chaos—in complex enterprise environments.
4. **Target system characteristics:** Enterprise agentic systems requiring bitemporal memory awareness, multi-hop reasoning, inspectable decision traces, and grammar-constrained tool orchestration.
5. **Structural philosophy:** Enterprise knowledge, memory, and operational workflows must be represented as explicit, queryable graph structures (DAGs, property graphs, context graphs) rather than unstructured prompt context or flat vector embeddings.
6. **Primary trade-offs:** Trades upfront ontology design and schema extraction pipeline effort for deterministic multi-hop accuracy, context control, and complete auditability.
7. **Data lifecycle perspective:** Data is ingested into a three-graph architecture (domain, lexical, subject), enriched via bitemporal memory updates, and continuously improved through execution graph diagnostic loops.
8. **Operational governance stance:** Enforces strict Pydantic tool boundaries, bitemporal invalidation (`t_valid`/`t_invalid`), and schema validation gates instead of destructive record updates or prompt bloat.
9. **Verification boundary:** Verification focuses on valid relational traversal paths (PathRAG), Pydantic schema boundaries, execution graph traces, and bitemporal validity windows.
10. **Evolution strategy:** Agents evolve self-correctively via semantic backpropagation over execution graph traces, adjusting prompt templates and knowledge subgraphs without suffering entropy collapse or catastrophic forgetting.

---

## 4. Source-backed structure
- **Theme 1: The Crisis of Enterprise Agentic AI and the Dual-Graph Architecture**
  - **Source:** Agentic GraphRAG
  - **Structural locator:** Part I: Foundations of Graph-Based Agentic Systems (Chapters 1 & 2)
  - **Spirit locator:** Overcoming the five flaws of vector RAG requires separating domain understanding (vertical knowledge graph) from action planning (horizontal workflow graph).
- **Theme 2: Graph-Based Knowledge Modeling and the Three-Graph Architecture**
  - **Source:** Agentic GraphRAG
  - **Structural locator:** Chapter 3: Graph-Based Knowledge Modeling for Agentic Systems
  - **Spirit locator:** Separating trusted domain data, raw textual evidence, and extracted LLM interpretations into distinct graph layers preserves provenance and prevents ground truth contamination.
- **Theme 3: Graph Memory Systems and Bitemporal Modeling**
  - **Source:** Agentic GraphRAG
  - **Structural locator:** Chapter 4: Agentic Graph Memory Systems
  - **Spirit locator:** Incorporating bitemporal metadata (valid time vs. transaction time) across episodic, semantic, and procedural networks eliminates context amnesia and drift.
- **Theme 4: Multi-Hop Reasoning, PathRAG, and Execution Graph Evaluation**
  - **Source:** Agentic GraphRAG
  - **Structural locator:** Part III & IV: Reasoning, Tool Orchestration, and Self-Evolution (Chapters 5, 6, & 7)
  - **Spirit locator:** Replacing flat retrieval with PathRAG-verified relational paths protects agents against the distracting effect, while execution graphs enable structured self-evolution.

---

## 5. Source-backed spirit
1. **Core Architectural Philosophy:** Autonomous enterprise AI behaves like process engineering; system reliability requires explicit graph representations of both domain knowledge and execution workflows.
2. **Data Relationships View:** Relationships are explicit, first-class structural entities with bitemporal properties and typing, serving as traversable evidence paths rather than statistical vector inferences.
3. **Performance Guarantees:** Dual-graph architectures enforce deterministic step transitions, bounded traversal depths, and state-specific context windows that prevent context rot and prompt bloat.
4. **Schema Evolution and Governance:** Knowledge schemas evolve additively through bitemporal invalidation (`t_valid` and `t_invalid` timestamps) and coordinated deployment manifests rather than destructive record deletion.
5. **Anti-Patterns and Pitfalls:** The authors explicitly warn against unconstrained prompt expansions, uncoordinated multi-agent swarms lacking workflow DAGs, polluting trusted domain graphs with raw LLM extractions, and overwriting historical records.
6. **Query Execution and Pattern Matching:** Reasoning occurs via multi-hop traversals across vertical knowledge paths, guided by horizontal workflow DAG execution nodes and constrained by Pydantic schema boundaries.

---

## 6. Key concepts
1. **Dual-Graph Architecture**
   - **Definition:** An architectural pattern pairing a vertical knowledge graph (representing domain entities and relationships) with a horizontal workflow graph (a DAG representing reasoning and execution steps).
   - **Why it matters:** Solves the representation gap by providing grounded domain knowledge alongside inspectable, state-aware action workflows.
   - **Related concepts:** Vertical Knowledge Graph, Horizontal Workflow Graph, Process Engineering for AI.
   - **Citation:** Chapter 2: Agentic Graph Architecture Foundations
   - **Verification status:** source-backed
2. **Bitemporal Modeling (Valid Time vs. Transaction Time)**
   - **Definition:** A memory representation tracking both when a fact was true in the real world (valid time) and when the system recorded it (transaction time).
   - **Why it matters:** Enables point-in-time queries (e.g., system state right before an outage) and prevents context drift without deleting historical data.
   - **Related concepts:** Valid Time, Transaction Time, Temporal Invalidation, Context Drift.
   - **Citation:** Chapter 4: Agentic Graph Memory Systems
   - **Verification status:** source-backed
3. **Three-Graph Architecture (Domain, Lexical, Subject)**
   - **Definition:** A knowledge design pattern separating trusted curated data (domain graph), immutable source text chunks (lexical graph), and uncertain LLM-extracted entities/triples (subject graph).
   - **Why it matters:** Preserves strict provenance, prevents unverified extractions from contaminating ground truth, and supports explicit confidence tracking.
   - **Related concepts:** Domain Graph, Lexical Graph, Subject Graph, Provenance Isolation.
   - **Citation:** Chapter 3: Graph-Based Knowledge Modeling for Agentic Systems
   - **Verification status:** source-backed
4. **PathRAG (Path-Based Relational Retrieval)**
   - **Definition:** A retrieval method that extracts and evaluates verified relational paths through a knowledge graph rather than retrieving isolated document passages.
   - **Why it matters:** Protects agents against the distracting effect by requiring explicit, structurally verified relationships before injecting context into prompts.
   - **Related concepts:** Distracting Effect, Relational Path Verification, Flow-Based Pruning.
   - **Citation:** Chapter 5: Reasoning and Planning
   - **Verification status:** source-backed
5. **The Distracting Effect**
   - **Definition:** A phenomenon where semantically similar but structurally irrelevant passages mislead language models into generating incorrect, confident answers.
   - **Why it matters:** Demonstrates that upgrading vector retrievers or expanding context windows can worsen agent reliability without structural filtering.
   - **Related concepts:** Context Pollution, Error Amplification, Semantic Similarity Pitfall.
   - **Citation:** Chapter 5: Reasoning and Planning
   - **Verification status:** source-backed
6. **Execution Graph (Agent Autobiography)**
   - **Definition:** An immutable trace recording every decision, retrieval, tool invocation, input/output payload, and latency metric for a specific query execution.
   - **Why it matters:** Turns opaque model behavior into a queryable artifact that drives multi-layered evaluation, cognitive autopsies, and semantic backpropagation.
   - **Related concepts:** Multi-Layered Evaluation Framework, Cognitive Autopsy, Semantic Backpropagation.
   - **Citation:** Chapter 7: Self-Evolution and Evaluation
   - **Verification status:** source-backed

---

## 7. Practical patterns and examples
1. **Three-Graph Provenance Separation Pattern**
   - **Problem solved:** Preventing unverified LLM extractions or noisy document processing from corrupting trusted domain data while retaining full passage provenance.
   - **Recommended approach:** Maintain a curated Domain Graph for trusted entities, a Lexical Graph for immutable text chunks, and a Subject Graph for LLM-extracted candidates, using candidate links to bridge them.
   - **Repository-level manifestation:** Graph database setup scripts declaring separate named graphs or label sets for `:DomainEntity`, `:LexicalChunk`, and `:ExtractedFact`.
   - **Limitations:** Requires cross-graph candidate linking queries during entity resolution.
   - **Source citation:** Chapter 3: Graph-Based Knowledge Modeling for Agentic Systems
2. **Bitemporal Relationship Invalidation Pattern**
   - **Problem solved:** Tracking evolving service configurations and infrastructure dependencies without destroying historical state needed for root-cause diagnosis.
   - **Recommended approach:** Attach `t_valid` and `t_invalid` temporal properties to relationship edges; when dependencies change, set `t_invalid = datetime()` on the old edge rather than deleting it.
   - **Repository-level manifestation:** Cypher update scripts using `ON CREATE SET d.t_valid = datetime(), d.t_invalid = null` and setting `t_invalid` on superseded edges.
   - **Limitations:** Increases total edge count in the graph over time, requiring temporal filtering predicates in queries.
   - **Source citation:** Chapter 4: Agentic Graph Memory Systems
3. **PathRAG Structural Traversal Guard Pattern**
   - **Problem solved:** Preventing agents from hallucinating false dependencies or being misled by semantically similar but disconnected documentation chunks.
   - **Recommended approach:** Replace passage search with Cypher path matching that verifies contiguous paths between query entities and target candidate nodes within a maximum hop count.
   - **Repository-level manifestation:** Cypher retrieval functions matching explicit path patterns (e.g., `MATCH path = (src:Service)-[:DEPENDS_ON*1..3]->(dst:Dependency) RETURN path`).
   - **Limitations:** Computational cost scales with graph density if hop bounds are omitted.
   - **Source citation:** Chapter 5: Reasoning and Planning

---

## 8. Common failure modes and risks
1. **Unconstrained Context Expansion (Context Rot)**
   - **Why it happens:** Cramming massive unstructured document chunks into large LLM context windows in an attempt to solve retrieval gaps.
   - **Early warning signs:** Increasing query latency, degraded retrieval precision ("lost in the middle"), and hallucinated relationships.
   - **Repository evidence:** Pipeline code passing full document texts into prompts without graph path filtering or state-specific node context constraints.
   - **Severity tendency:** critical
2. **Unverified Subject Extraction Contamination**
   - **Why it happens:** Writing LLM-extracted entities and triples directly into production domain graphs without confidence scoring or provenance isolation.
   - **Early warning signs:** Proliferation of duplicate entities, contradictory relationship types, and corrupted business rules.
   - **Repository evidence:** Ingestion scripts inserting extracted triples directly into primary domain labels without intermediate subject graph staging.
   - **Severity tendency:** error
3. **Uncoordinated Multi-Agent Swarm Parallelism (Tool Chaos)**
   - **Why it happens:** Deploying autonomous multi-agent loops without a structured horizontal workflow graph or schema-validated communication boundaries.
   - **Early warning signs:** Inter-agent communication breakdowns, infinite tool invocation loops, and non-deterministic execution paths.
   - **Repository evidence:** Multi-agent frameworks invoking arbitrary tool calls without Pydantic output validation or execution graph tracking.
   - **Severity tendency:** critical
4. **Destructive Record Updates (Temporal Ignorance)**
   - **Why it happens:** Overwriting or deleting modified node/edge properties in place when configurations change.
   - **Early warning signs:** Inability of DevOps or diagnostic agents to reconstruct system state prior to an incident or outage.
   - **Repository evidence:** Cypher or SQL statements executing `DELETE` or unversioned `SET` operations on infrastructure dependency edges.
   - **Severity tendency:** error

---

## 9. Repository-audit translation

### A. General graph database practices
- Maintain strict property graph integrity with explicit node labels, relationship types, and directional edges.
- Enforce primary key uniqueness constraints on all canonical business identifiers (`:Service(id)`, `:User(id)`, `:Incident(id)`).
- Bound multi-hop Cypher path traversals with explicit maximum hop limits (e.g., `*1..4`).

### B. GraphRAG-specific grounding practices
- Ensure all extracted entities in the subject graph carry provenance properties linking back to lexical text chunks.
- Apply bitemporal metadata (`t_valid`, `t_invalid`) to dynamic relationship edges subject to configuration drift.
- Enforce Pydantic schema validation at tool execution boundaries within workflow graph nodes.

### C. RepoScope deterministic audit practices

#### Static checks (automated)
- Detect Cypher ingestion queries containing `MERGE` or `CREATE` statements where corresponding schema uniqueness constraints are missing.
- Check for repository graph specification schema file presence (`docs/specs/graph.yaml`).
- Detect unconstrained Cypher path traversals (e.g., `-[*]->`) in application query templates.

#### Human review (contextual & strategic)
- Review dual-graph architecture design to confirm clear separation between knowledge graphs and workflow DAGs.
- Evaluate bitemporal retention policies to balance historical diagnostic needs against graph storage growth.
- Assess Pydantic tool registry schemas and information flow controls across agent execution boundaries.

---

## 10. Candidate rules

- **Rule ID:** `graph-schema-001`
- **Title:** Uniqueness Constraint Declaration for Idempotent Ingestion
- **Profile:** graph
- **Severity tendency:** error
- **Rationale:** Executing Cypher `MERGE` or ingestion queries without underlying uniqueness constraints causes duplicate entity node creation during pipeline re-runs.
- **Source-backed basis:** *Agentic GraphRAG* emphasizes that building reliable vertical knowledge graphs requires backing uniqueness constraints to maintain entity identity.
- **Repository evidence to inspect:** Inspect `.cypher` files for `MERGE` statements and cross-reference against constraint definitions in database setup scripts.
- **Pass condition:** Every label/property pair targeted by a Cypher `MERGE` statement has an associated `CREATE CONSTRAINT` definition in schema scripts.
- **Fail condition:** A `MERGE` statement targets a label/property combination that lacks an explicit uniqueness constraint declaration.
- **Exceptions or limitations:** Static regex check may miss dynamically constructed Cypher strings in application code.
- **YAML readiness:** blocked
- **Reason if not ready:** publication gate unmet (Publication Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:** Chapter 3: Graph-Based Knowledge Modeling for Agentic Systems
- **Source:** Agentic GraphRAG
- **Structural locator:** Chapter 3: Graph-Based Knowledge Modeling for Agentic Systems
- **Spirit locator:** Knowledge representation requires explicit uniqueness constraints to enforce entity identity across ingestion passes.
- **Verification status:** source-backed

---

- **Rule ID:** `graph-001`
- **Title:** Repository Graph Specification Schema File Presence
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** A dedicated repository graph specification file ensures reproducible schema verification across CI/CD build pipelines.
- **Source-backed basis:** Governed agentic graph development requires explicit specification artifacts to drive test assertions and structural verification.
- **Repository evidence to inspect:** Inspect the filesystem path `docs/specs/graph.yaml`.
- **Pass condition:** The file `docs/specs/graph.yaml` exists on the repository filesystem.
- **Fail condition:** The file `docs/specs/graph.yaml` is absent from the repository filesystem.
- **Exceptions or limitations:** None.
- **YAML readiness:** blocked
- **Reason if not ready:** publication gate unmet (Publication Gate 1: `docs/specs/graph.yaml` missing in repository environment).
- **Source citation:** Chapter 2: Agentic Graph Architecture Foundations
- **Source:** Agentic GraphRAG
- **Structural locator:** Chapter 2: Agentic Graph Architecture Foundations
- **Spirit locator:** Agentic graph systems require explicit specification artifacts to govern dual-graph architectures and schema evolution.
- **Verification status:** source-backed

---

- **Rule ID:** `graph-bitemporal-schema-check`
- **Title:** Enforcement of Bitemporal Metadata Properties on Dynamic Edges
- **Profile:** graph
- **Severity tendency:** warning
- **Rationale:** Dynamic infrastructure or state relationships created without `t_valid` and `t_invalid` properties prevent point-in-time state reconstruction and cause temporal ignorance.
- **Source-backed basis:** *Agentic GraphRAG* specifies that dynamic memory and configuration relationships must carry bitemporal metadata to support historical root-cause analysis.
- **Repository evidence to inspect:** Cypher schema setup scripts or application migration files defining dynamic relationship edge types.
- **Pass condition:** Cypher relationship creation statements for dynamic edges set explicit `t_valid` temporal properties.
- **Fail condition:** Dynamic relationship edges are created without temporal validity metadata.
- **Exceptions or limitations:** Static property keys require AST Cypher parsing to distinguish static domain definitions from dynamic temporal state edges.
- **YAML readiness:** needs-review
- **Reason if not ready:** Requires semantic AST Cypher query parsing to differentiate static ontology edges from dynamic temporal relationship edges.
- **Source citation:** Chapter 4: Agentic Graph Memory Systems
- **Source:** Agentic GraphRAG
- **Structural locator:** Chapter 4: Agentic Graph Memory Systems
- **Spirit locator:** Dynamic memory and dependency relationships must maintain bitemporal metadata to enable point-in-time temporal queries.
- **Verification status:** source-backed

---

## 11. Suggested YAML fragment

No rules ready for emission under current validator contract.

### Candidates not emitted
- `graph-schema-001`: Non-emission due to unmet publication gate (Gate 1: `docs/specs/graph.yaml` missing).
- `graph-001`: Non-emission due to unmet publication gate (Gate 1: `docs/specs/graph.yaml` missing).
- `graph-bitemporal-schema-check`: Non-emission due to validator check-type boundary (`needs-review`: requires semantic AST parser).

---

## 12. Handoff checklist
- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use {book|standard, concept}.
- [x] All emitted check types are in {pattern_match, file_exists, file_absent}.
- [x] All "ready" rules appear in Section 11 YAML.
- [x] All "needs-review" / "blocked" rules are absent from Section 11 YAML.
- [x] Section 11 ends with "### Candidates not emitted".
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked "Meaning to be confirmed."
- [x] "Note status" reflects the weakest readiness in Section 10.
- [x] Section 9 does not smuggle non-static advice into the automated list.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules (or explicit justification).

---

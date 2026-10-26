1. Source Identity
Title: Essential Graphrag

# Essential GraphRAG: Knowledge Graph–Enhanced RAG — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Essential GraphRAG: Knowledge Graph–Enhanced RAG
- **Author(s):** Tomaž Bratanič and Oskar Hane (Foreword by Paco Nathan)
- **Branch:** graph
- **RepoScope profile:** graph
- **Primary source file:** Essential GraphRAG.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope

### In scope

- Hybrid retrieval architectures combining statistical vector embeddings, full-text search, and graph database traversals.
- Text2Cypher natural language query translation, schema-injected prompting, terminology mapping, and few-shot in-context learning.
- Agentic RAG patterns featuring specialized retriever tools, retriever routers, and answer critics.
- Automated knowledge graph construction from unstructured text using LLM Structured Outputs, Pydantic schemas, and entity resolution.
- Microsoft's GraphRAG architecture: entity/relationship extraction and summarization, Louvain community detection, and dual Global/Local Search retrievers.
- RAG system evaluation methodologies using the RAGAS framework (context recall, faithfulness, answer correctness) and Cypher-anchored ground-truth benchmarking.

### Out of scope

- Non-graph relational SQL optimization and traditional data warehousing lacking vector or graph indexing.
- Pretraining large language base models from scratch or low-level CUDA kernel execution.
- Hardware procurement, OS kernel memory tuning, and enterprise human organizational management strategies.

---

## 3. Source spirit card

1. **Core intent:** The text demonstrates how integrating knowledge graphs into Retrieval-Augmented Generation (RAG) pipelines overcomes LLM limitations (hallucinations, knowledge cutoffs, context amnesia) to deliver accurate, explainable, and context-rich AI systems.
2. **Architectural paradigm:** It advocates for a multi-layered hybrid retrieval architecture that pairs statistical vector similarity search with structured graph database traversals and hierarchical community summarization.
3. **Primary problem domain:** Addressing flat vector RAG failures when handling complex queries that require multi-hop reasoning, attribute filtering, global dataset aggregation, or narrative summarization.
4. **Target system characteristics:** Systems requiring high retrieval precision, verifiable source provenance, dynamic query flexibility, and continuous automated evaluation.
5. **Structural philosophy:** Unstructured text should be progressively structured into graph entities, typed relationships, and community clusters, creating a unified semantic substrate for local and global retrieval.
6. **Primary trade-offs:** Trades upfront LLM-based graph indexing and community summarization compute cost for vastly superior global query answerability, multi-hop reasoning accuracy, and structural explainability.
7. **Data lifecycle perspective:** Data moves from raw text chunking and vector indexing to automated LLM entity/relationship extraction, graph-based entity resolution, hierarchical community detection, and multi-modal query serving.
8. **Operational governance stance:** Enforces strict Pydantic schemas during extraction, schema-guided Cypher query generation, and Cypher-anchored ground-truth benchmarks rather than unguided text generation.
9. **Verification boundary:** Verification focuses on graph schema compliance, Cypher query execution validity, community summary relevance, and RAGAS evaluation metrics (context recall, faithfulness, correctness).
10. **Evolution strategy:** Knowledge graphs evolve additively by ingesting new text chunks, extracting structured triples using Structured Outputs, resolving candidate entities against existing nodes, and incrementally updating community summaries.

---

## 4. Source-backed structure

### Theme 1: Foundations of RAG and Vector/Hybrid Search

- **Source:** Essential GraphRAG
- **Structural locator:** Chapter 1: Improving LLM accuracy & Chapter 2: Vector similarity search and hybrid search
- **Spirit locator:** Grounding LLMs with external data via RAG overcomes knowledge cutoffs, while pairing vector similarity with full-text search establishes the foundational hybrid retrieval pipeline.

### Theme 2: Query Translation via Text2Cypher and Advanced Retrieval

- **Source:** Essential GraphRAG
- **Structural locator:** Chapter 3: Advanced vector retrieval strategies & Chapter 4: Generating Cypher queries from natural language questions
- **Spirit locator:** Injecting graph database schemas and terminology mappings into LLM prompts converts natural language queries into precise Cypher graph traversals for structured data access.

### Theme 3: Agentic RAG and Knowledge Graph Construction

- **Source:** Essential GraphRAG
- **Structural locator:** Chapter 5: Agentic RAG & Chapter 6: Constructing knowledge graphs with LLMs
- **Spirit locator:** Autonomous agentic RAG routes queries across specialized retrieval tools, while LLM Structured Outputs convert unstructured text into validated property graph entities and relationships.

### Theme 4: Microsoft's GraphRAG Implementation and Global/Local Search

- **Source:** Essential GraphRAG
- **Structural locator:** Chapter 7: Microsoft’s GraphRAG implementation
- **Spirit locator:** Detecting hierarchical graph communities using the Louvain algorithm and precalculating community summaries enables Map-Reduce Global Search for broad thematic queries alongside entity-focused Local Search.

### Theme 5: RAG System Evaluation and Benchmarking

- **Source:** Essential GraphRAG
- **Structural locator:** Chapter 8: RAG application evaluation
- **Spirit locator:** Evaluating RAG systems requires benchmarking context recall, faithfulness, and answer correctness using dynamic Cypher queries as durable ground truth rather than static text answers.

---

## 5. Source-backed spirit

1. **Core Architectural Philosophy:** The book contends that generative AI applications must bridge structured and unstructured data; knowledge graphs serve as the critical semantic substrate that organizes text chunks into interconnected, queryable concepts.
2. **Data Relationships View:** Relationships are treated as explicit, first-class structural entities that connect fragmented text chunks into a cohesive network, enabling multi-hop traversals and hierarchical summarization.
3. **Performance Guarantees:** Hybrid search ensures fast initial candidate retrieval via vector/full-text indexes, while graph database traversals execute in time proportional only to local neighborhood depth rather than total database size.
4. **Schema Evolution and Governance:** Graph models evolve gracefully by defining Pydantic schemas for extraction, applying entity resolution to merge duplicate nodes, and asserting uniqueness constraints on core business identifiers.
5. **Anti-Patterns and Pitfalls:** The authors explicitly warn against relying on vector similarity search alone for aggregate or filtering queries, generating Cypher without schema injection, and evaluating RAG applications using static text answers that stale as data updates.
6. **Query Execution and Pattern Matching:** Retrieval spans multiple operational tiers: direct Cypher pattern matching for structured queries, vector-guided entity entry points for local search, and Map-Reduce summaries over community subgraphs for global search.

---

## 6. Key concepts

### 6.1 Vector-Graph Hybrid Search

- **Definition:** A retrieval technique that combines statistical vector similarity search, full-text keyword search, and graph relationship traversals to fetch context.
- **Why it matters:** Combines the semantic breadth of embeddings with the structural precision and filtering capabilities of property graphs.
- **Related concepts:** Full-Text Indexing, Reciprocal Rank Fusion, Context Synthesis.
- **Citation:** Chapter 2: Vector similarity search and hybrid search
- **Verification status:** source-backed

### 6.2 Text2Cypher Query Generation

- **Definition:** Using a language model to translate natural language user questions directly into executable Cypher graph database queries.
- **Why it matters:** Enables flexible, ad-hoc querying of structured graph databases without forcing users to learn formal query syntaxes.
- **Related concepts:** Schema Injection, Terminology Mapping, Few-Shot In-Context Learning.
- **Citation:** Chapter 4: Generating Cypher queries from natural language questions
- **Verification status:** source-backed

### 6.3 Agentic RAG (Retriever Routers & Answer Critics)

- **Definition:** An autonomous RAG architecture where an LLM router dynamically selects among specialized retriever tools (e.g., vector search, Text2Cypher, parent-document retriever) and an answer critic verifies response quality.
- **Why it matters:** Prevents one-size-fits-all retrieval failures by matching specific query types to optimal retrieval paradigms.
- **Related concepts:** Specialized Retrievers, Query Routing, Answer Verification.
- **Citation:** Chapter 5: Agentic RAG
- **Verification status:** source-backed

### 6.4 Structured Outputs Knowledge Graph Extraction

- **Definition:** Using LLM function calling or structured response formats (e.g., Pydantic model definitions) to extract typed entities, attributes, and relationships from raw text.
- **Why it matters:** Guarantees that extracted data strictly adheres to target graph ontologies prior to database ingestion.
- **Related concepts:** Pydantic Schema, Entity Resolution, Relation Extraction.
- **Citation:** Chapter 6: Constructing knowledge graphs with LLMs
- **Verification status:** source-backed

### 6.5 Microsoft GraphRAG (Global vs. Local Search)

- **Definition:** A two-stage GraphRAG pipeline that extracts entities/relationships, detects communities via graph clustering (Louvain), generates community summaries, and serves queries via Global (Map-Reduce) or Local Search.
- **Why it matters:** Solves sensemaking and broad dataset summarization questions that traditional chunk-based vector RAG cannot answer.
- **Related concepts:** Louvain Community Detection, Community Summaries, Map-Reduce Retrieval.
- **Citation:** Chapter 7: Microsoft’s GraphRAG implementation
- **Verification status:** source-backed

### 6.6 RAGAS Evaluation Framework & Cypher Ground Truth

- **Definition:** An evaluation framework assessing RAG performance across Context Recall, Faithfulness, and Answer Correctness, using dynamic Cypher queries as durable ground truth.
- **Why it matters:** Provides objective, repeatable metrics for measuring RAG retrieval and generation quality without manual test review.
- **Related concepts:** Context Recall, Faithfulness, Answer Correctness, Benchmark Datasets.
- **Citation:** Chapter 8: RAG application evaluation
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1 — Schema-Injected Text2Cypher Prompting Pattern

- **Problem solved:** Translating natural language questions into valid Cypher queries without generating nonexistent node labels or relationship types.
- **Recommended approach:** Dynamically inspect the graph database schema (node labels, relationship types, property keys) and inject the structural schema declaration alongside terminology mappings into the system prompt.
- **Repository-level manifestation:** Python function calling `db.get_schema()` and formatting the output string into the Text2Cypher LLM prompt template.
- **Limitations:** Large graph schemas with hundreds of labels can consume significant prompt context tokens.
- **Source citation:** Chapter 4: Generating Cypher queries from natural language questions

### Pattern 2 — Community-Detection Global Search Map-Reduce Pattern

- **Problem solved:** Answering broad, holistic dataset queries (e.g., "What are the main themes in this document collection?") that exceed individual vector chunk relevance.
- **Recommended approach:** Partition the knowledge graph into communities using the Louvain algorithm, generate LLM community summaries at indexing time, execute Map prompts across community summaries during queries, and execute a Reduce prompt to synthesize the final response.
- **Repository-level manifestation:** Python orchestration script generating intermediate community point lists (`Map step`) and aggregating them into a final response (`Reduce step`).
- **Limitations:** Incurs higher indexing and query LLM token costs compared to simple vector search.
- **Source citation:** Chapter 7: Microsoft’s GraphRAG implementation

### Pattern 3 — Cypher-Anchored Ground-Truth Evaluation Pattern

- **Problem solved:** Evaluating RAG accuracy against underlying data repositories that frequently change or update.
- **Recommended approach:** Define benchmark evaluation datasets where expected answers are represented as Cypher queries rather than static text strings; execute the Cypher query at test time to fetch live ground truth.
- **Repository-level manifestation:** RAGAS evaluation notebooks storing test dataset JSON records with `"ground_truth_cypher"` fields executed against Neo4j during benchmark runs.
- **Limitations:** Requires writing canonical Cypher queries for all benchmark test cases.
- **Source citation:** Chapter 8: RAG application evaluation

---

## 8. Common failure modes and risks

### Failure 1 — Unguided Text2Cypher Schema Hallucination

- **Why it happens:** Prompting an LLM to generate Cypher graph queries without providing explicit graph schema definitions or property constraints.
- **Early warning signs:** Cypher query execution errors returning `Unknown Label` or syntax failures.
- **Repository evidence:** Text2Cypher prompt templates lacking `{schema}` variable placeholders or schema context injection functions.
- **Severity tendency:** error

### Failure 2 — Token Limit Exhaustion in Large Community Summarization

- **Why it happens:** Including all entities and relationships from massive, densely connected graph communities directly inside community summarization prompts.
- **Early warning signs:** Context length errors during indexing or truncated community summary generation.
- **Repository evidence:** GraphRAG community summarization functions lacking node/edge degree ranking or truncation mechanisms prior to LLM calls.
- **Severity tendency:** error

### Failure 3 — Vector-Only Context Fragmentation in Aggregate Queries

- **Why it happens:** Relying exclusively on vector similarity search to answer global summary, counting, or filtering queries across unstructured documents.
- **Early warning signs:** Incomplete or misleading RAG responses that retrieve isolated chunks while missing dataset-wide context.
- **Repository evidence:** RAG pipelines consisting solely of vector indexes without full-text, graph traversal, or community summary fallback retrievers.
- **Severity tendency:** warning

### Failure 4 — Unresolved Entity Duplication in Automated Graph Construction

- **Why it happens:** Ingesting LLM-extracted entities directly into the graph database without executing entity resolution or applying property normalization.
- **Early warning signs:** Proliferation of duplicate nodes representing the same real-world concept (e.g., "Neo4j", "Neo4j Inc.", "Neo4j, Inc.").
- **Repository evidence:** Graph construction scripts omitting post-extraction similarity clustering (e.g., Jaro-Winkler or vector distance merging) prior to database insertion.
- **Severity tendency:** warning

---

## 9. Repository-audit translation

### A. General graph database practices

- Maintain strict property graph integrity with explicit node labels, relationship types, and property keys.
- Enforce uniqueness constraints on all primary business identifiers (`:Entity(id)`, `:Document(id)`).
- Standardize Cypher query execution via parameter binding rather than string concatenation.

### B. GraphRAG-specific grounding practices

- Ensure all extracted graph nodes preserve provenance links (`:Chunk`) back to original source documents.
- Inject database schema declarations into all natural language query translation prompts (Text2Cypher).
- Evaluate RAG retrieval accuracy using standard metrics (Context Recall, Faithfulness, Correctness).

### C. RepoScope deterministic audit practices

#### Static checks (automated)

- Check for repository graph specification schema file presence (`docs/specs/graph.yaml`).
- Detect Cypher ingestion scripts executing `MERGE` or `CREATE` operations where backing uniqueness constraints are missing.
- Inspect Text2Cypher prompt files to verify schema context variable bindings (`{schema}`).

#### Human review (contextual & strategic)

- Evaluate community detection parameters and community summary generation prompts for global search.
- Review entity resolution threshold selection (e.g., similarity distance cutoff) during knowledge graph construction.
- Assess retriever routing logic and critic evaluation thresholds in agentic RAG workflows.

---

## 10. Candidate rules

### Rule candidate: `graph-schema-001`

| Field | Value |
|---|---|
| **Rule ID** | `graph-schema-001` |
| **Title** | Uniqueness Constraint Declaration for Idempotent Ingestion |
| **Profile** | graph |
| **Severity tendency** | error |
| **Rationale** | Executing Cypher `MERGE` or graph ingestion queries without underlying uniqueness constraints causes duplicate entity node creation during pipeline re-runs. |
| **Source-backed basis** | *Essential GraphRAG* emphasizes that knowledge graph construction requires backing uniqueness constraints to guarantee entity identity during data import. |
| **Repository evidence to inspect** | Inspect `.cypher` files for `MERGE` statements and cross-reference against constraint definitions in database setup scripts. |
| **Pass condition** | Every label/property pair targeted by a Cypher `MERGE` statement has an associated `CREATE CONSTRAINT` definition in schema scripts. |
| **Fail condition** | A `MERGE` statement targets a label/property combination that lacks an explicit uniqueness constraint declaration. |
| **Exceptions or limitations** | Static regex check may miss dynamically constructed Cypher strings in application code. |
| **YAML readiness** | blocked |
| **Reason if not ready** | publication gate unmet (Publication Gate 1: `docs/specs/graph.yaml` missing in repository environment). |
| **Source citation** | Chapter 6: Constructing knowledge graphs with LLMs |
| **Source** | Essential GraphRAG |
| **Structural locator** | Chapter 6: Constructing knowledge graphs with LLMs |
| **Spirit locator** | Knowledge graph construction relies on uniqueness constraints to enforce single-entity instantiation. |
| **Verification status** | source-backed |

---

### Rule candidate: `graph-001`

| Field | Value |
|---|---|
| **Rule ID** | `graph-001` |
| **Title** | Repository Graph Specification Schema File Presence |
| **Profile** | graph |
| **Severity tendency** | warning |
| **Rationale** | A dedicated repository graph specification file ensures reproducible schema verification across CI/CD build pipelines. |
| **Source-backed basis** | Governed GraphRAG development requires explicit specification artifacts to drive test assertions and structural verification. |
| **Repository evidence to inspect** | Inspect the filesystem path `docs/specs/graph.yaml`. |
| **Pass condition** | The file `docs/specs/graph.yaml` exists on the repository filesystem. |
| **Fail condition** | The file `docs/specs/graph.yaml` is absent from the repository filesystem. |
| **Exceptions or limitations** | None. |
| **YAML readiness** | blocked |
| **Reason if not ready** | publication gate unmet (Publication Gate 1: `docs/specs/graph.yaml` missing in repository environment). |
| **Source citation** | Chapter 4: Generating Cypher queries from natural language questions |
| **Source** | Essential GraphRAG |
| **Structural locator** | Chapter 4: Generating Cypher queries from natural language questions |
| **Spirit locator** | GraphRAG pipelines require explicit schema specification artifacts to guide query generation and validation. |
| **Verification status** | source-backed |

---

### Rule candidate: `graphrag-text2cypher-schema-prompt`

| Field | Value |
|---|---|
| **Rule ID** | `graphrag-text2cypher-schema-prompt` |
| **Title** | Detection of Schema Context Injection in Text2Cypher Prompts |
| **Profile** | graph |
| **Severity tendency** | error |
| **Rationale** | Prompts generating Cypher queries without schema context injection produce hallucinated labels, invalid relationships, and database runtime errors. |
| **Source-backed basis** | *Essential GraphRAG* highlights that showing the database schema in the system prompt is mandatory for reliable Text2Cypher generation. |
| **Repository evidence to inspect** | Inspect Python source files and prompt templates for Text2Cypher generators. |
| **Pass condition** | Text2Cypher prompt templates include explicit schema context placeholders (e.g., `{schema}` or `database_schema`). |
| **Fail condition** | A Text2Cypher prompt template requests Cypher query generation without incorporating schema context. |
| **Exceptions or limitations** | Requires AST/prompt template parsing to verify dynamic string formatting bindings. |
| **YAML readiness** | needs-review |
| **Reason if not ready** | Requires semantic AST analysis of prompt formatting functions to distinguish schema-injected templates from raw prompts without false positives. |
| **Source citation** | Chapter 4: Generating Cypher queries from natural language questions |
| **Source** | Essential GraphRAG |
| **Structural locator** | Chapter 4: Generating Cypher queries from natural language questions |
| **Spirit locator** | Text2Cypher generation requires explicit database schema context injection in prompts to prevent label hallucination. |
| **Verification status** | source-backed |

---

## 11. Suggested YAML fragment

```yaml
# No rules ready for emission under current validator contract.
#
# All three candidate rules are either blocked by the graph publication gate
# or by validator check-type boundaries.
#
# Do not add the rules below to docs/specs/graph.yaml until:
#   - Gate 1: docs/specs/graph.yaml exists
#   - Gate 2: scripts/build_knowledge.py accepts profile: graph
#   - Gate 3: lib/types.ts includes graph or a compatible canonical profile
#   - Gate 4: tests accept graph rule IDs
#   - Gate 5: public/knowledge/specs.json contains graph rules
#   - Gate 6: public/knowledge/graph.json contains matching rule nodes

### Candidates not emitted

# graph-schema-001                  (blocked — publication gate)
# graph-001                         (blocked — publication gate)
# graphrag-text2cypher-schema-prompt (needs-review — check-type boundary)
```

---

## 12. Handoff checklist

- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use `{book|standard, concept}`.
- [x] All emitted check types are in `{pattern_match, file_exists, file_absent}`.
- [x] All "ready" rules appear in Section 11 YAML.
- [x] All "needs-review" / "blocked" rules are absent from Section 11 YAML.
- [x] Section 11 ends with `### Candidates not emitted`.
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked "Meaning to be confirmed."
- [x] "Note status" reflects the weakest readiness in Section 10.
- [x] Section 9 does not smuggle non-static advice into the automated list.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules (or explicit justification).

---


## References

<!-- ref: TODO -->

# RepoScope Knowledge-Grounded AI — Methodology

## Decision

RepoScope's AI insight layer is grounded in a **structured knowledge graph**
committed to Git (`public/knowledge/graph.json`), not in embedding-based
vector search.

## Why GraphRAG over embeddings?

For a domain whose rules are deterministic — IEC 62443, OWASP, Kimball —
graph traversal wins on three counts:

1. **Full explainability.** Every insight traces to a chain:
   `finding -> YAML rule -> concept -> book chapter`.
   Embeddings provide no such chain.
2. **Zero running cost.** A JSON file served statically by Vercel.
   No Pinecone, no Weaviate, no subscription.
3. **Higher precision on small structured corpora.** With a few thousand
   concepts whose relations are defined up front, explicit traversal
   outperforms embedding recall.

## Architecture
Layer 1: Source truth (21 books + standards)
| Ollama qwen2.5:7b, format:json, temperature 0 — fully offline
Layer 2: Knowledge graph (graph.json in Git, served statically)
| one-hop traversal per rule (bounded BFS)
Layer 3: Grounded insight + Citation Gate

text

## Citation Gate

LLM output is scanned sentence-by-sentence. Any "page N", "section X.Y", or
"according to <Name>" claim in a sentence that does not also cite a
registered book/standard is replaced with `[source unverified]`. Cited rule
IDs are validated against the graph. Responses carry machine-readable
metadata: `{grounded, citations, stripped}`.

## Cross-domain reasoning

When findings span multiple audit profiles (e.g. IIoT + DataOps), both
subgraphs merge into the prompt context and cross-rules (`cross-001`,
`cross-002`) activate — the structured equivalent of hybrid-mode routing.

## Freshness protocol

Every prompt carries a UTC date anchor. Every response carries
`{provider, model, generatedAt}`. The provider model registry is refreshed
quarterly (recurring maintenance issue).

## Honest limitations

- This is structured GraphRAG with explicit relations — not embedding-based
  semantic search. Concepts the extraction missed will not be found.
- Extraction quality depends on the local model; all chunk outputs are
  retained per-chunk and spot-verified by hand.
- The graph is regenerated from sources by deterministic scripts; it is
  reproducible, versioned, and fully auditable in Git.
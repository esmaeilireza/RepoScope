RepoScope KG CLI — reusable knowledge-graph pipeline
Works for ANY project: point it at a folder of PDFs, get a knowledge graph.

Setup (once)
pip install pymupdfollama pull qwen2.5:7b        # during a stable-connectivity window
Extract (checkpointed — safe to interrupt, resumes exactly where it stopped)
python scripts/kg/extract.py --source "/path/to/your/books" --domain dataopspython scripts/kg/extract.py --source "<folder>" --domain iiot --limit-chunks 5   # smoke test
Domains: dataops | iiot | webapp | ml (extend choices in extract.py)

Assemble + validate
python scripts/build_knowledge.py     # YAML rules -> specs.jsonpython scripts/kg/assemble_graph.py   # concepts + rules -> graph.json + knowledge-index.mdpython scripts/kg/validate_graph.py   # integrity report
Manual curation
Edit scripts/kg/aliases.json to merge duplicate concepts(e.g. "Idempotent Consumers" -> "idempotency") or canonicalize book titles,then re-run assemble_graph.py.

Commit artifacts
public/knowledge/graph.json and docs/knowledge-index.md are committed.scripts/kg/output/ is gitignored (intermediate per-chunk state).
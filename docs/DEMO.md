# RepoScope — Demonstration Walkthrough

This document describes the sequence for demonstrating the RepoScope audit
tool. It covers environment preconditions, the eight demonstration stages,
and recovery procedures for the most common failure modes during a live run.

## Environment checklist

Before starting the walkthrough, confirm:

- Neo4j is running (`pnpm neo4j:status`)
- Terminal is cleared, with legible font
- Neo4j Browser is open at `http://localhost:7474` with the audit user
  credentials configured in `scripts/neo4j.bat`
- `docs/architecture/V1_V2.md` is open at the V2 gaps section
- Working directory is the repository root
- Python virtual environment is active (prompt prefix `(.venv)`)

## Stage 1 — Positioning

RepoScope is a CI-gating audit tool. Every finding that a reviewer can act
on resolves to a specific concept in a specific book through a Cypher
traversal of a property graph. The graph holds 34 rules, approximately 50
concepts, and approximately 20 books distributed across three audit
profiles (IIoT, DataOps, Web Application).

The tool is deterministic. There is no model in the execution path.

## Stage 2 — Knowledge graph structure

Query the graph in Neo4j Browser:

    MATCH (r:Rule)-[:GROUNDED_IN]->(c:Concept)-[:CITED_IN]->(b:Book)
    RETURN b.title AS book, count(r) AS rules
    ORDER BY rules DESC

Each rule resolves to a concept, and each concept resolves to a source.
The indirection is intentional: page numbers vary between editions, but
concept names remain stable. The graph stores the concept, not the page.

## Stage 3 — IIoT profile

    pnpm reposcope --repo demo-repos/iiot-demo --strict

The router identifies `pymodbus` in `requirements.txt` and activates the
IIoT profile. Three findings are produced. Each is grounded against a
concept from *Industrial Network Security* or *Automating Manufacturing
Systems with PLCs*. The command exits with a non-zero status, which would
fail a CI gate.

## Stage 4 — DataOps profile

    pnpm reposcope --repo demo-repos/dataops-demo --strict

`dbt_project.yml` activates the DataOps profile. Three findings are
produced, with three citations. The schema-evolution finding resolves to
a concept from *Designing Data-Intensive Applications*, which is the
appropriate source for that rule.

## Stage 5 — Coverage boundary: Web Application profile

    pnpm reposcope --repo demo-repos/webapp-demo --strict

Eleven findings, aggregate score 0/100. Two findings (`webapp-001`,
`webapp-002`) resolve to book concepts from *Site Reliability Engineering*
and *Continuous Delivery*. The remaining nine (`general-docs-001`,
`general-legal-001`, and others) are hygiene rules that were archived
during the Phase 0 consolidation and are tracked on the V2 roadmap for
migration into `webapp.yaml`. They do not currently have Neo4j nodes, so
they do not print a grounding line.

The score reflects the state of the skeleton repository, not a defect in
the tool. The V2 gaps document lists `general-*` migration as a tracked
item.

## Stage 6 — Coverage boundary: Industrial ML signals

    pnpm reposcope --repo demo-repos/iml-demo --strict

This repository contains `pymodbus`, `kafka`, `prophet`, and `mlflow`.
The industrial-ML filter detects all three ML categories and reports them
through `[IML]` output. The router, however, activates the IIoT profile
only — ML signals do not currently feed back into routing. This is a
documented V2 item.

The behavior is intentional and honest: the filter reports what it
detects, and the router reports what it routes.

## Stage 7 — CI gate

    pnpm gate:claims

Five checks, all passing. This is the gate that runs in CI. It catches
four classes of drift:

- Absolute grounding claims in documentation
- `V1_V2.md` not covering all tracked V2 gaps
- `specs.json` drifting from the expected profile and rule count
- `claims.yaml` manifest drift

A concrete instance of the fourth class surfaced when Phase 0 archived
14 rules and left the manifest stale. The gate correctly failed the
build; the claim was corrected, not the code.

## Stage 8 — Summary

The walkthrough covers deterministic routing, profile-gated execution,
and grounded citations produced through Cypher traversal. Findings are
produced by rule-based inspection; citations are produced by graph
traversal. The mapping from rule to source is the system's knowledge
layer.

## Recovery procedures

| Symptom | Procedure |
|---|---|
| Neo4j not running | `pnpm neo4j:up`; wait for status confirmation |
| `gate:claims` fails | Inspect `docs/claims.yaml`; compare with `docs/specs/*.yaml` |
| Neo4j Browser unavailable | Query via CLI: `pnpm kg:ground <rule-id>` |
| Audit command hangs | Terminate; re-run with `--profile <name>` to restrict to one profile |
| Virtual environment lost | `source .venv/Scripts/activate` |
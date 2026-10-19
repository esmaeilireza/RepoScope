# Data Quality Fundamentals — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Data Quality Fundamentals
- Title: Data Quality Fundamentals: A Practitioner's Guide to Building Trustworthy Data Pipelines
- Author(s): Barr Moses, Lior Gavish, Molly Vorwerck
- Branch: dataops
- RepoScope profile: dataops
- Primary source file: Data Quality Fundamentals_ A Practitioner's Guide to Building Trustworthy Data Pipelines.pdf
- Note status: reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - End-to-end data pipeline reliability, observability, and data downtime prevention across data warehouses, lakes, and orchestration layers.
  - The 5 pillars of data observability: Freshness, Volume, Schema, Distribution, and Lineage.
  - Operationalizing SRE principles for data: setting SLAs, SLIs, and SLOs for data assets.
  - Data quality testing assertions, automated anomaly detection, field-level lineage, and data incident management workflows.
- Out of scope:
  - Specific internal implementation details of commercial software platforms beyond standard open-source and architectural integrations.
  - Low-level database storage engine kernel development or hardware tuning.
  - Generic organizational management theories unrelated to version-controlled repository evidence or data product engineering.

## 3. Source spirit card
1. Central thesis: Modern analytical data pipelines require the same operational diligence, automated observability, and structured incident management frameworks as production software applications to eliminate data downtime and maintain trust.
2. Primary problem addressed: Unannounced and undetected "data downtime"—periods where data is missing, erroneous, stale, or structurally broken—resulting in broken downstream executive dashboards, faulty machine learning models, and eroded business confidence.
3. Architectural posture: Proactive, metadata-driven end-to-end observability that combines automated anomaly detection across storage assets with pre-commit and post-load quality assertion gates.
4. Core unit of abstraction: The observable data pipeline node (table, view, or stream) characterized by its freshness, volume metrics, schema contract, value distribution parameters, and field-level lineage graph.
5. Operating model: Continuous automated monitoring and alerting integrated with version-controlled quality tests, automated field-level lineage, and SRE-style incident response workflows.
6. Safety / failure philosophy: Fail-safe containment and early detection; data issues must be caught at ingestion or transformation via circuit breakers and automated alerts before bad data propagates downstream into consumer-facing artifacts.
7. Primary trade-off embraced: Investing engineering resources into automated metadata monitoring, test maintenance, and incident management overhead in exchange for dramatic reductions in Time to Detection (TTD), Time to Resolution (TTR), and data downtime.
8. Invariant / non-negotiable principle: Data trust must be objectively measured through quantifiable Service Level Indicators (SLIs) and Service Level Objectives (SLOs) rather than subjective stakeholder sentiment or anecdotal bug reports.
9. Anti-pattern targeted: Reactive "firefighting" driven by executive Slack messages, reliance on tribal knowledge for debugging, and treating data pipelines as one-off static scripts without observability or versioned quality gates.
10. Target repository profile / ecosystem: DataOps repositories containing dbt projects, data orchestration DAGs (Airflow, Dagster, Prefect), data validation configurations (Great Expectations, Soda, dbt tests), CI/CD pipelines, and versioned runbooks.

## 4. Source-backed structure
### Theme 1: The 5 Pillars of Data Observability
- Source: Data Quality Fundamentals
- Structural locator: Chapter 5: Architecting for Data Reliability -> Measuring and Maintaining Data Quality in the Pipeline
- Spirit locator: Defines the foundational architectural criteria required to evaluate data asset health continuously without extracting or compromising underlying payload data.

### Theme 2: SRE Principles Applied to Data (SLAs, SLOs, SLIs)
- Source: Data Quality Fundamentals
- Structural locator: Chapter 5: Architecting for Data Reliability -> How to Set SLAs, SLOs, and SLIs for Your Data
- Spirit locator: Establishes quantifiable standards for data downtime, incident tracking, and performance targets agreed upon between data producers and business consumers.

### Theme 3: Data Incident Management & The Data Reliability Lifecycle
- Source: Data Quality Fundamentals
- Structural locator: Chapter 6: Fixing Data Quality Issues at Scale -> Data Incident Management
- Spirit locator: Provides a structured, multi-phase feedback loop (Detect, Resolve, Prevent) for triaging pipeline breakages using lineage, code inspection, and blameless postmortems.

### Theme 4: Field-Level Lineage & Root Cause Analysis
- Source: Data Quality Fundamentals
- Structural locator: Chapter 7: Building End-to-End Lineage -> Building End-to-End Field-Level Lineage for Modern Data Systems
- Spirit locator: Maps upstream source dependencies and downstream blast radii down to individual table columns to enable rapid root cause analysis and impact communication.

### Theme 5: Data Quality Testing & Anomaly Detection
- Source: Data Quality Fundamentals
- Structural locator: Chapter 4: Monitoring and Anomaly Detection for Your Data Pipelines -> Knowing Your Known Unknowns and Unknown Unknowns
- Spirit locator: Differentiates between predictable static contract violations (tested via explicit assertions) and unpredictable statistical anomalies (monitored via dynamic ML detectors).

## 5. Source-backed spirit
1. What problem is this source trying to solve?
It solves the pervasive issue of silent data failure and data downtime where advanced data stacks process incorrect, missing, or stale data without warning, wasting engineering hours and damaging business trust.

2. What is its core architectural posture?
A metadata-first, end-to-end data observability posture that integrates passive monitoring across storage systems with active testing at pipeline handoffs.

3. What does it consider a fatal mistake or anti-pattern?
Relying solely on manual stakeholder bug reports ("firefighting"), operating without field-level lineage, or treating data quality as a one-time project rather than an ongoing operational discipline.

4. What does it consider non-negotiable?
Establishing clear, version-controlled definitions for data quality tests, source freshness thresholds, and explicit ownership/SLA commitments for critical data products.

5. How does it balance trade-offs?
It balances absolute precision against false positive alert fatigue by combining deterministic threshold testing for known contract constraints with machine learning anomaly detection for unknown statistical variations.

6. How should an engineer demonstrate compliance in a repository?
By committing dbt/Soda/Great Expectations quality test files, configuring freshness SLA thresholds in YAML, maintaining automated lineage configurations, establishing version-controlled incident runbooks, and maintaining CODEOWNERS mapping for data assets.

## 6. Key concepts
### Concept 1: Data Downtime
- Definition: The total period during which data is missing, erroneous, stale, or otherwise inaccurate across the data lifecycle.
- Why it matters: Quantifies the total financial and operational impact of broken data on the business.
- Related concepts: Time to Detection (TTD), Time to Resolution (TTR), Data Reliability.
- Citation: Chapter 1 -> Understanding the Rise of Data Downtime.
- Verification status: source-backed

### Concept 2: Freshness (Observability Pillar)
- Definition: The measure of how up-to-date a data asset is relative to expected arrival intervals.
- Why it matters: Prevents downstream analytics from consuming stale or delayed operational records.
- Related concepts: Source Freshness, SLA, `loaded_at_field`.
- Citation: Chapter 5 -> Measuring and Maintaining Data Quality in the Pipeline.
- Verification status: source-backed

### Concept 3: Distribution & Volume (Observability Pillars)
- Definition: Statistical metrics measuring whether field data falls within expected value ranges, null-rate bounds, and expected row counts.
- Why it matters: Detects silent corruptions where pipeline execution succeeds but the payload contains invalid or truncated data.
- Related concepts: Anomaly Detection, Null-rate Spikes, Z-score.
- Citation: Chapter 4 -> Monitoring and Anomaly Detection for Your Data Pipelines.
- Verification status: source-backed

### Concept 4: Field-Level Lineage
- Definition: A detailed graph mapping dependencies and transformations between specific fields/columns across upstream sources and downstream consumers.
- Why it matters: Enables instant root cause analysis upstream and precise blast radius calculation downstream during incidents.
- Related concepts: Root Cause Analysis, Dependency Mapping, Operational Analytics.
- Citation: Chapter 7 -> Building End-to-End Field-Level Lineage for Modern Data Systems.
- Verification status: source-backed

### Concept 5: Data SLAs, SLOs, and SLIs
- Definition: Service Level Agreements (formal commitments), Objectives (target reliability thresholds), and Indicators (quantitative measurements) adapted from SRE to govern data pipeline health.
- Why it matters: Aligns technical data teams and business stakeholders on explicit expectations for data availability and freshness.
- Related concepts: TTD, TTR, Data Certification.
- Citation: Chapter 5 -> How to Set SLAs, SLOs, and SLIs for Your Data.
- Verification status: source-backed

### Concept 6: Data Circuit Breaker
- Definition: Automated pipeline logic that halts downstream processing or DAG execution when upstream quality assertions fail.
- Why it matters: Prevents bad or corrupted data from contaminating downstream gold/marts tables and business dashboards.
- Related concepts: Quality Gate, Airflow Operator, Quality Screen.
- Citation: Chapter 3 -> Collecting, Cleaning, Transforming, and Testing Data.
- Verification status: source-backed

## 7. Practical patterns and examples
### Pattern 1: In-Pipeline Quality Gate (Circuit Breaker)
- Problem solved: Contamination of analytical marts when raw or staging data fails quality assertions.
- Recommended approach: Execute deterministic test assertions (e.g. unique, non-null, referential integrity) prior to materializing downstream transformations.
- Repository-level manifestation: dbt test step in CI/CD pipeline or orchestration DAG blocking step (`airflow.operators` executing data tests before model build).
- Limitations: Adds execution latency to pipeline runs and requires maintaining explicit test definitions.
- Source citation: Chapter 3 -> Collecting, Cleaning, Transforming, and Testing Data.

### Pattern 2: Source Freshness Threshold SLA Declaration
- Problem solved: Silent ingestion halts where source database syncs freeze without raising pipeline execution exceptions.
- Recommended approach: Explicitly declare `loaded_at_field` and `freshness` warning/error time periods inside version-controlled dbt source YAML configurations.
- Repository-level manifestation: `warn_after` and `error_after` blocks inside `_sources.yml` or `schema.yml` files.
- Limitations: Requires an accessible timestamp column on source tables.
- Source citation: Chapter 4 -> Monitoring and Anomaly Detection for Your Data Pipelines -> Monitoring for Freshness.

### Pattern 3: Version-Controlled Data Incident Runbooks
- Problem solved: Ad-hoc, frantic debugging dependent on single engineers during high-severity data outages.
- Recommended approach: Document standardized incident response steps, escalation paths, and communication templates directly within the code repository.
- Repository-level manifestation: `RUNBOOK.md` or `docs/runbooks/` files referenced in pipeline repository structures.
- Limitations: Requires periodic human reviews to ensure runbook steps reflect evolving architecture.
- Source citation: Chapter 6 -> Fixing Data Quality Issues at Scale -> Data Incident Management.

## 8. Common failure modes and risks
### Failure Mode 1: Silent Upstream Schema Drift
- Why it happens: Source database migrations add, rename, or drop columns without notifying downstream data engineering teams.
- Early warning signs: Unexplained NULL spikes in downstream marts or query failures in strict SELECT expressions.
- Repository evidence: Missing schema validation tests, raw `SELECT *` usages without explicit column contracts or schema drift assertions.
- Severity tendency: critical

### Failure Mode 2: Pipeline Ingestion Freeze (Freshness Outage)
- Why it happens: Upstream extract jobs or third-party API webhooks fail silently while orchestrators continue reporting success.
- Early warning signs: Stale timestamp values across core transactional tables; zero new rows loaded in daily ingestion windows.
- Repository evidence: Sources configured without `loaded_at_field` declarations or missing freshness SLA checks in orchestration configurations.
- Severity tendency: error

### Failure Mode 3: Alert Fatigue & Noise Overload
- Why it happens: Excessive un-tuned alerting on minor distribution shifts without precision filtering or severity classification.
- Early warning signs: Data engineers ignoring Slack alert channels or silencing automated monitoring notifications.
- Repository evidence: Blanket threshold checks applied without anomaly tuning, missing severity tagging on quality assertions.
- Severity tendency: warning

### Failure Mode 4: Tribal Knowledge Dependence in Root Cause Analysis
- Why it happens: Lack of version-controlled documentation, missing lineage mapping, and absence of standardized triage procedures.
- Early warning signs: High Time to Resolution (TTR) when primary data engineers are unavailable; repeated manual SQL debugging.
- Repository evidence: Absence of `CODEOWNERS` files, missing field-level lineage configurations, and missing repository runbooks.
- Severity tendency: error

## 9. Repository-audit translation
### Static checks (automated)
- Absence of data validation frameworks or quality test configurations (`models/**/_*.yml`, `great_expectations/`, `soda/`).
- Absence of version-controlled incident runbooks or escalation documentation (`RUNBOOK.md` or `docs/runbooks/*.md`).
- Hardcoded non-parameterized connection strings or static schema references in model SQL.

### Needs-review candidates
- Missing source freshness SLA configurations (`loaded_at_field`, `freshness` thresholds in dbt source YAML).
- Missing unique and non-null column assertions on primary keys in dbt model schema YAMLs.
- Missing CODEOWNERS or metadata ownership declarations for critical data products.

### Human review (contextual & organizational)
- Assessing whether chosen SLO target percentages (e.g. 99.9% vs 95%) align with business stakeholder tolerance.
- Evaluating the qualitative effectiveness of blameless postmortems and team communication channels.
- Reviewing whether dimensional model grain choices match business decision-making requirements.

### Organizational artifacts check
- Verifying presence of `CODEOWNERS`, `OWNERS`, `data_product.yml`, or ownership metadata tags within repo configuration files.

## 10. Candidate rules
- Rule ID: dataops-quality-001
- Title: Require Data Quality Testing Configuration
- Profile: dataops
- Severity tendency: warning
- Rationale: Repositories lacking automated data quality test configurations risk silent data corruption in production pipelines.
- Source-backed basis: Data Quality Fundamentals emphasizes that data pipelines must incorporate automated quality checks and circuit breakers at every transformation stage.
- Repository evidence to inspect: Look for presence of `models/**/_*.yml`, `great_expectations.yml`, `soda.yml`, or `tests/` directories.
- Pass condition: Repository contains at least one data quality test file or directory configuration.
- Fail condition: No dbt YAML test files, Great Expectations configs, or Soda YAML files are found.
- Exceptions or limitations: Applies only to repositories containing analytical or data transformation logic.
- YAML readiness: ready
- Source citation:
  - Source: Data Quality Fundamentals
  - Structural locator: Chapter 3: Collecting, Cleaning, Transforming, and Testing Data
  - Spirit locator: Automated quality testing assertions must be version-controlled alongside transformation code to prevent bad data propagation.
- Verification status: source-backed

- Rule ID: dataops-runbook-001
- Title: Require Version-Controlled Incident Runbook
- Profile: dataops
- Severity tendency: info
- Rationale: Standardized incident response documentation reduces Time to Resolution (TTR) and eliminates dependence on tribal knowledge during data outages.
- Source-backed basis: Data Quality Fundamentals states that data incident management requires documented response protocols, escalation paths, and blameless postmortems.
- Repository evidence to inspect: Look for presence of `RUNBOOK.md`, `docs/RUNBOOK.md`, or files under `docs/runbooks/`.
- Pass condition: An incident runbook markdown file exists in the repository.
- Fail condition: No runbook markdown file is present.
- Exceptions or limitations: None.
- YAML readiness: ready
- Source citation:
  - Source: Data Quality Fundamentals
  - Structural locator: Chapter 6: Fixing Data Quality Issues at Scale -> Data Incident Management
  - Spirit locator: Structured incident management requires version-controlled runbooks to guide detection, response, and postmortem workflows.
- Verification status: source-backed

- Rule ID: dataops-freshness-001
- Title: Require Source Freshness SLA Declaration
- Profile: dataops
- Severity tendency: warning
- Rationale: Source declarations without freshness tracking cannot detect silent ingestion freezes before bad data reaches downstream consumers.
- Source-backed basis: Data Quality Fundamentals highlights Freshness as a core pillar of data observability, requiring explicit `loaded_at_field` monitoring.
- Repository evidence to inspect: Inspect dbt source YAML files (`*_sources.yml` or `schema.yml`) for `loaded_at_field` and `freshness` blocks.
- Pass condition: Source definitions include `loaded_at_field` and `freshness` SLA thresholds.
- Fail condition: Source definitions omit `loaded_at_field` or `freshness` declarations.
- Exceptions or limitations: Requires nested YAML-aware structural parsing.
- YAML readiness: needs-review
- Reason if not ready: Requires YAML-aware structural checker to inspect nested properties inside source YAML definitions.
- Source citation:
  - Source: Data Quality Fundamentals
  - Structural locator: Chapter 4: Monitoring and Anomaly Detection for Your Data Pipelines -> Monitoring for Freshness
  - Spirit locator: Source data freshness must be explicitly tracked using timestamp fields and warning/error SLA thresholds.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: dataops-quality-001
    title: "Require Data Quality Testing Configuration"
    severity: warning
    profile: dataops
    references:
      - book: "Data Quality Fundamentals"
        concept: "data-quality-testing"
    check:
      type: pattern_match
      file_glob: "{models/**/_*.yml,great_expectations.yml,soda.yml}"
      pattern: "."
      error_when: pattern_absent
      message: "Repository lacks automated data quality test configurations (dbt tests, Great Expectations, or Soda)."

  - id: dataops-runbook-001
    title: "Require Version-Controlled Incident Runbook"
    severity: info
    profile: dataops
    references:
      - book: "Data Quality Fundamentals"
        concept: "data-incident-management"
    check:
      type: file_exists
      file_glob: "{RUNBOOK.md,docs/RUNBOOK.md,docs/runbooks/*.md}"
      error_when: file_absent
      message: "Repository lacks a version-controlled incident runbook (RUNBOOK.md or docs/runbooks/)."
```

### Candidates not emitted
- `dataops-freshness-001` (Require Source Freshness SLA Declaration): Marked `needs-review` because validating nested `loaded_at_field` and `freshness` properties within source YAML files requires a structural YAML parser beyond the current validator capability.

## 12. Handoff checklist
HANDOFF CHECKLIST
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

# Analytics Engineering with SQL and dbt — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Analytics Engineering with SQL and dbt
- Title: Analytics Engineering with SQL and dbt: Building Meaningful Data Models at Scale
- Author(s): Rui Machado and Hélder Russa
- Branch: dataops
- RepoScope profile: dataops
- Primary source file: Analytics Engineering with SQL and dbt_ Building Meaningful Data Models at Scale.pdf
- Note status: partially-ready-for-YAML

## 2. Scope
- In scope:
  - Transformation layer architecture within the Extract-Load-Transform (ELT) paradigm.
  - Modular SQL data modeling conventions, including staging, intermediate, and marts layers.
  - dbt project organization, Jinja templating, SQL macros, and dbt packages.
  - Automated testing (singular and generic), source freshness monitoring, and Markdown doc blocks.
- Out of scope:
  - Data ingestion engine configurations (e.g., Fivetran or Airbyte connector setup).
  - Cloud data warehouse infrastructure provisioning (e.g., IAM roles, BigQuery dataset creation commands).
  - Business Intelligence (BI) visualization dashboard building in external tools (e.g., Tableau, Looker).

## 3. Source spirit card
- Source title: Analytics Engineering with SQL and dbt: Building Meaningful Data Models at Scale
- Core architectural posture: Treat data transformations as a version-controlled, modular, and testable software platform within an ELT cloud warehouse paradigm.
- Primary operational invariant: Every analytics transformation must be modular, reproducible, testable, and documented in code before deployment to production.
- Default abstraction layer: Modular SQL SELECT models organized across staging, intermediate, and marts layers, connected via explicit DAG references and sources.
- System boundary definition: Bounded strictly within the data transformation and serving layer of the cloud data warehouse platform, downstream of raw ingestion and upstream of BI consumption.
- Target failure model: Undetected schema drift, breaking downstream models, unverified primary key constraints, duplicate metric logic, and stale source data landing silently in production.
- Primary trade-off accepted: Accepts higher storage and compute consumption in cloud data platforms in exchange for modular SQL, rapid iteration, and maintainable transformations.
- Key repository evidence: Presence of dbt_project.yml, structured models directory (staging/intermediate/marts), packages.yml, SQL model files using ref functions, and schema YAML test assertions.
- Anti-pattern rejected: Monolithic multi-thousand-line SQL queries, hardcoded database/schema/table string references, un-versioned stored procedures, and undocumented transformation logic.
- Success criterion: A fully version-controlled, self-documenting dbt project with automated test execution on every build and clear lineage tracking across raw sources to business marts.

## 4. Source-backed structure
- Theme 1: Evolution from ETL to ELT and the Analytics Engineer Role
  - Source: Analytics Engineering with SQL and dbt
  - Structural locator: Chapter 1, Analytics Engineering
  - Spirit locator: Modern data architectures separate raw ingestion from transformation, establishing the analytics engineer role to apply software engineering discipline to SQL modeling.
- Theme 2: Modular Data Modeling Layering
  - Source: Analytics Engineering with SQL and dbt
  - Structural locator: Chapter 2, Data Modeling for Analytics
  - Spirit locator: Decomposing complex queries into staging, intermediate, and dimensional marts layers using the DRY principle isolates source changes and optimizes model reuse.
- Theme 3: dbt Project Structure and Model Execution
  - Source: Analytics Engineering with SQL and dbt
  - Structural locator: Chapter 4, Data Transformation with dbt
  - Spirit locator: Standardizing file system layout, YAML configurations, and Jinja referencing ensures transparent DAG compilation, reproducible builds, and version-controlled transformations.
- Theme 4: Materialization Strategies, Macros, and Semantic Layer
  - Source: Analytics Engineering with SQL and dbt
  - Structural locator: Chapter 5, dbt Advanced Topics
  - Spirit locator: Applying targeted materialization strategies (views, tables, incremental, ephemeral) alongside reusable SQL macros and semantic metrics optimizes query performance and enforces business consistency.
- Theme 5: End-to-End Analytics Engineering Pipeline Implementation
  - Source: Analytics Engineering with SQL and dbt
  - Structural locator: Chapter 6, Building an End-to-End Analytics Engineering Use Case
  - Spirit locator: Integrating data staging, dimensional modeling, generic and singular test execution, and automated documentation generation establishes a resilient production data product pipeline.

## 5. Source-backed spirit
1. What architectural posture does this source assume?
   - The source assumes an ELT posture where transformation logic occurs directly within cloud data warehouses using code-centric, version-controlled SQL and Jinja templating rather than GUI-based ETL tools or opaque stored procedures.
2. What is the fundamental invariant the system must preserve?
   - The fundamental invariant is that all transformations must be deterministic, modular, fully testable, and traceable through a directed acyclic graph (DAG) where every downstream model references upstream dependencies via explicit dbt ref constructs.
3. What operational trade-offs does the source explicitly accept?
   - The source accepts increased warehouse compute costs and temporary storage overhead from staging and intermediate materializations to maximize developer productivity, code reusability, and automated quality verification.
4. How does the source define failure or risk?
   - The source defines failure as unmonitored data quality degradation, circular or broken dependency lineages, hardcoded database paths that prevent multi-environment deployment, silent primary key duplication, and stale data reaching business consumers.
5. What repository-level artifacts demonstrate adherence to this spirit?
   - Adherence is demonstrated by a well-structured repository containing dbt_project.yml, modular SQL models in models/staging/, models/intermediate/, and models/marts/, packages.yml dependency manifests, schema testing YAML files, and singular test SQL queries.
6. What anti-patterns indicate a violation of the source's spirit?
   - Anti-patterns include writing monolithic queries with nested subqueries across thousands of lines, referencing raw target tables directly using hardcoded strings, committing macro directories without package declarations, and running dbt projects without generic schema tests or documentation blocks.

## 6. Key concepts
- Concept 1: Analytics Engineer
  - Definition: A technical role bridging data engineering and data science, responsible for writing clean, version-controlled, testable SQL transformations.
  - Why it matters: Prevents organizational bottlenecks by empowering data teams to deliver self-service data products with software engineering rigor.
  - Related concepts: ELT, Data Mesh, Data Product.
  - Citation: Chapter 1, Analytics Engineering — Analytics engineer role as the bridge between engineering and analytics.
  - Verification status: source-backed
- Concept 2: Modular Data Modeling (Staging, Intermediate, Marts)
  - Definition: Structuring SQL models into distinct layers where staging cleans raw sources, intermediate applies complex joins/business logic, and marts serve domain dimensions and facts.
  - Why it matters: Adheres to the DRY principle, reduces duplicate logic, and isolates downstream models from upstream source schema changes.
  - Related concepts: Staging Layer, Marts Layer, DAG.
  - Citation: Chapter 2, Data Modeling for Analytics — Building modular data models using dbt.
  - Verification status: source-backed
- Concept 3: Model Referencing (ref function)
  - Definition: A Jinja templating function that replaces hardcoded table names with dynamic references, compiling environment-specific database relations and building the project DAG.
  - Why it matters: Enables seamless deployment across development, staging, and production environments while auto-generating lineage dependency graphs.
  - Related concepts: Directed Acyclic Graph, Jinja, Dynamic SQL.
  - Citation: Chapter 2, Data Modeling for Analytics — Modular data models referencing syntax.
  - Verification status: source-backed
- Concept 4: Materialization Strategies (View, Table, Ephemeral, Incremental)
  - Definition: Configuration directives determining how dbt models are persisted in the data warehouse, balancing query runtime against compute build time.
  - Why it matters: Prevents performance bottlenecks and drastically reduces warehouse processing costs for large, high-volume datasets.
  - Related concepts: Incremental Model, Ephemeral Model, Materialized View.
  - Citation: Chapter 5, dbt Advanced Topics — Model materializations and performance optimization.
  - Verification status: source-backed
- Concept 5: Generic and Singular Testing
  - Definition: Generic tests are reusable parameter-driven assertions defined in YAML (e.g., unique, not_null), whereas singular tests are custom SQL queries returning failing rows.
  - Why it matters: Catches data quality anomalies early in the transformation pipeline before flawed data reaches reporting dashboards.
  - Related concepts: Source Freshness, Schema Validation, Data Quality.
  - Citation: Chapter 4, Data Transformation with dbt — Tests and quality verification in dbt.
  - Verification status: source-backed
- Concept 6: Source Freshness Monitoring
  - Definition: An automated audit check comparing a source table's max timestamp against defined warning and error time thresholds.
  - Why it matters: Alerts data operators when upstream ingestion pipelines stall or fail, preventing decisions based on stale information.
  - Related concepts: loaded_at_field, SLA, Data Observability.
  - Citation: Chapter 4, Data Transformation with dbt — Source freshness testing configuration.
  - Verification status: source-backed

## 7. Practical patterns and examples
- Pattern 1: Folder-Based Layering and Configuration Pattern
  - Problem solved: Messy, unstructured dbt projects where model materialization, owner, and access settings are hard to manage and audit.
  - Recommended approach: Organize models into clear subdirectories (staging/, intermediate/, marts/) and configure default materialization hierarchies in dbt_project.yml using layer-level config blocks.
  - Repository-level manifestation: models/ directory containing staging/, intermediate/, and marts/ subfolders, with matching configuration blocks in dbt_project.yml.
  - Limitations: Requires disciplined adherence across the data team; mislocated SQL files bypass folder-level configuration defaults.
  - Source citation: Chapter 4, Data Transformation with dbt — Structure of a dbt project and directory organization.
- Pattern 2: Dynamic Incremental Filtering Pattern
  - Problem solved: Exorbitant query compute costs and long build times caused by repeatedly re-transforming full historical tables on every run.
  - Recommended approach: Configure materialized='incremental' in the model config block and append an is_incremental() Jinja conditional filter against the target table's max timestamp.
  - Repository-level manifestation: SQL files in models/ containing config materialized='incremental' and Jinja conditional checks against the target table max timestamp.
  - Limitations: Requires a reliable, monotonically increasing timestamp column in the source table and handling of late-arriving data.
  - Source citation: Chapter 5, dbt Advanced Topics — Incremental models and optimization.
- Pattern 3: Reusable SQL Macro Abstraction Pattern
  - Problem solved: Duplicated SQL transformation snippet logic (such as monetary conversions or custom surrogate key hashing) repeated across multiple models.
  - Recommended approach: Extract repeated SQL constructs into Jinja macro files saved in the macros/ folder, parameterize variables, and invoke them across models.
  - Repository-level manifestation: .sql files in macros/ defining custom macro functions and model SQL files invoking those macros.
  - Limitations: Over-macroizing SQL queries can decrease readability for analysts unfamiliar with Jinja templating.
  - Source citation: Chapter 5, dbt Advanced Topics — Dynamic SQL with Jinja and SQL macros.

## 8. Common failure modes and risks
1. Hardcoded Relation References
   - Why it happens: Developers copy-paste legacy SQL queries containing explicit database, schema, and table strings directly into dbt models.
   - Early warning signs: dbt run fails in development or staging environments due to cross-database permission errors or writing to production tables.
   - Repository evidence: SQL model files containing raw string literals in FROM or JOIN clauses instead of ref or source constructs.
   - Severity tendency: critical
2. Unvalidated Primary Key Constraints
   - Why it happens: Assuming raw source data is unique without configuring automated uniqueness and non-null schema assertions in dbt YAML files.
   - Early warning signs: Downstream mart models produce inflated metrics or duplicate rows when joined against unvalidated dimension keys.
   - Repository evidence: Absence of unique and not_null test declarations under columns in model or source YAML schema files.
   - Severity tendency: error
3. Missing Dependency Declarations for Packages/Macros
   - Why it happens: Team members use third-party packages or custom macros without maintaining a versioned packages.yml file.
   - Early warning signs: CI/CD build pipelines fail with compilation errors stating a macro or function cannot be resolved.
   - Repository evidence: A project with files in macros/ or custom package function calls lacking a packages.yml file or missing package installation steps.
   - Severity tendency: warning
4. Silent Source Data Stagnation
   - Why it happens: Ingestion jobs crash or pause without throwing explicit database errors, leaving upstream source tables frozen in time while dbt models continue running successfully.
   - Early warning signs: Business stakeholders notice reporting dashboards displaying static daily figures.
   - Repository evidence: Source definition YAML files omitting loaded_at_field and freshness threshold configurations.
   - Severity tendency: warning

## 9. Repository-audit translation
### Static checks (automated)
- Absence of `dbt_project.yml` at the repository root.
- Absence of `models/` directory when `dbt_project.yml` is present.
- Presence of hardcoded 3-part database table references (e.g., `FROM database.schema.table`) in model SQL files instead of `{{ ref() }}` or `{{ source() }}`.
- Absence of `packages.yml` when `macros/` contains custom macro definitions calling external package functions.
- Absence of `tests/` directory when `models/` directory exists.

### Needs-review candidates
- Verification of generic test configurations (`unique`, `not_null`) across all dimension key columns in schema YAML files.
- Verification of source freshness threshold settings (`loaded_at_field`, `warn_after`, `error_after`) in source YAML declarations.
- Verification that materialization strategies (`view`, `table`, `incremental`) in `dbt_project.yml` align with folder-level performance expectations.

### Human review (contextual & organizational)
- Reviewing whether dimensional model grain definitions match business requirement metrics.
- Evaluating whether surrogate key generation logic in `marts` models correctly handles null business keys.
- Assessing whether dbt semantic layer metric definitions accurately reflect organizational financial KPIs.

### Organizational artifacts check
- CODEOWNERS file asserting data engineering team ownership over `models/marts/core/`.
- Data product contract documentation or README files describing model SLAs and refresh schedules.

## 10. Candidate rules

- Rule ID: dataops-dbt-001
- Title: Hardcoded Relation Reference Detection
- Profile: dataops
- Severity tendency: critical
- Rationale: Hardcoded database relation strings break multi-environment compilation and prevent dbt from constructing accurate lineage graphs.
- Source-backed basis: Models must reference upstream relations via ref or source functions to enable environment-agnostic compilation.
- Repository evidence to inspect: SQL files under models/ containing hardcoded database, schema, or table identifiers in FROM or JOIN clauses.
- Pass condition: All relation targets in SQL model queries are accessed exclusively via {{ ref(...) }} or {{ source(...) }}.
- Fail condition: A model SQL file contains a hardcoded three-part relation string like FROM `project.dataset.table`.
- Exceptions or limitations: None.
- YAML readiness: ready
- Source citation: Chapter 2, Data Modeling for Analytics — Model referencing mechanism.
- Source: Analytics Engineering with SQL and dbt
- Structural locator: Chapter 2, Data Modeling for Analytics
- Spirit locator: Referencing relations dynamically via ref Jinja constructs ensures environment flexibility and accurate lineage DAG generation.
- Verification status: source-backed

- Rule ID: dataops-dbt-002
- Title: Missing dbt Project Configuration File
- Profile: dataops
- Severity tendency: critical
- Rationale: A repository containing dbt models without dbt_project.yml cannot be parsed or executed by dbt CLI or CI tools.
- Source-backed basis: dbt_project.yml is the required root file that identifies a directory as a dbt project and configures execution parameters.
- Repository evidence to inspect: Presence of dbt_project.yml at repository root.
- Pass condition: dbt_project.yml exists at the repository root.
- Fail condition: dbt_project.yml is absent from the repository root.
- Exceptions or limitations: Non-dbt repositories.
- YAML readiness: ready
- Source citation: Chapter 4, Data Transformation with dbt — Structure of a dbt project.
- Source: Analytics Engineering with SQL and dbt
- Structural locator: Chapter 4, Data Transformation with dbt
- Spirit locator: The dbt_project.yml file serves as the core manifest defining project boundaries and configuration settings.
- Verification status: source-backed

- Rule ID: dataops-dbt-003
- Title: Missing Models Directory Structure
- Profile: dataops
- Severity tendency: error
- Rationale: A dbt project without a models directory lacks transformation logic and cannot execute data pipelines.
- Source-backed basis: The models folder is a mandatory directory containing all SQL transformation models.
- Repository evidence to inspect: Presence of models/ directory when dbt_project.yml exists.
- Pass condition: The models/ directory exists in the repository.
- Fail condition: The models/ directory is absent while dbt_project.yml is present.
- Exceptions or limitations: None.
- YAML readiness: ready
- Source citation: Chapter 4, Data Transformation with dbt — Structure of a dbt project.
- Source: Analytics Engineering with SQL and dbt
- Structural locator: Chapter 4, Data Transformation with dbt
- Spirit locator: Models are the primary artifact where analytics engineers encapsulate transformation logic.
- Verification status: source-backed

- Rule ID: dataops-dbt-004
- Title: Missing Package Manifest for Macros Directory
- Profile: dataops
- Severity tendency: warning
- Rationale: Utilizing custom macros or third-party package macros without a packages.yml manifest causes compilation failures in CI/CD.
- Source-backed basis: Packages and macros provide shared logic and must be declared in packages.yml for dependency resolution.
- Repository evidence to inspect: Presence of packages.yml when macros/ folder is present and non-empty.
- Pass condition: packages.yml exists when custom macros or package functions are declared in macros/.
- Fail condition: macros/ directory is non-empty but packages.yml is missing from the repository root.
- Exceptions or limitations: Projects using purely native Jinja without external package dependencies.
- YAML readiness: ready
- Source citation: Chapter 5, dbt Advanced Topics — dbt packages and macros.
- Source: Analytics Engineering with SQL and dbt
- Structural locator: Chapter 5, dbt Advanced Topics
- Spirit locator: Explicit package dependency manifest files ensure reproducible macro compilation across environments.
- Verification status: source-backed

- Rule ID: dataops-dbt-005
- Title: Unconfigured dbt Model Testing Schema
- Profile: dataops
- Severity tendency: error
- Rationale: Models deployed without generic tests (unique, not_null) risk passing duplicate or null primary key records to downstream marts.
- Source-backed basis: Testing is an essential component of analytics engineering to ensure accuracy and data reliability.
- Repository evidence to inspect: YAML schema files in models/ specifying test assertions under column definitions.
- Pass condition: Every model defined in schema YAML files includes unique and not_null test assertions on key columns.
- Fail condition: Model schema YAML files lack test declarations on primary key columns.
- Exceptions or limitations: Staging views on non-unique raw event logs.
- YAML readiness: needs-review
- Reason if not ready: Requires YAML-aware structural checker to inspect nested schema test declarations.
- Source citation: Chapter 4, Data Transformation with dbt — Generic and singular tests.
- Source: Analytics Engineering with SQL and dbt
- Structural locator: Chapter 4, Data Transformation with dbt
- Spirit locator: Automated assertion testing on primary keys prevents data quality degradation in production marts.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: "dataops-dbt-001"
    profile: "dataops"
    severity: "critical"
    description: "Detects hardcoded database.schema.table relation strings in dbt model SQL files."
    check:
      type: "pattern_match"
      file_glob: "models/**/*.sql"
      pattern: "(?i)(from|join)\s+[`'"]?[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+[`'"]?"
      error_when: "pattern_present"
      message: "Hardcoded relation reference found in dbt model. Use {{ ref(...) }} or {{ source(...) }} instead."
    references:
      - book: "Analytics Engineering with SQL and dbt"
        concept: "model-referencing"

  - id: "dataops-dbt-002"
    profile: "dataops"
    severity: "critical"
    description: "Ensures dbt_project.yml exists at the repository root."
    check:
      type: "file_exists"
      file_glob: "dbt_project.yml"
      error_when: "file_absent"
      message: "dbt_project.yml is missing from the repository root."
    references:
      - book: "Analytics Engineering with SQL and dbt"
        concept: "dbt-project-structure"

  - id: "dataops-dbt-003"
    profile: "dataops"
    severity: "error"
    description: "Ensures models/ directory exists when dbt_project.yml is present."
    check:
      type: "file_exists"
      file_glob: "models/"
      error_when: "file_absent"
      message: "models/ directory is missing from the dbt repository."
    references:
      - book: "Analytics Engineering with SQL and dbt"
        concept: "modular-data-modeling"

  - id: "dataops-dbt-004"
    profile: "dataops"
    severity: "warning"
    description: "Ensures packages.yml exists when macros directory is present."
    check:
      type: "file_exists"
      file_glob: "packages.yml"
      error_when: "file_absent"
      message: "packages.yml is missing from repository containing custom macros."
    references:
      - book: "Analytics Engineering with SQL and dbt"
        concept: "dbt-packages"
```

### Candidates not emitted
- `dataops-dbt-005` (Unconfigured dbt Model Testing Schema): Marked `needs-review` because validating nested column test declarations requires a YAML-aware structural parser beyond `pattern_match` or `file_exists`.

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


## References

<!-- ref: TODO -->

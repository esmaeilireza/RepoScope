1. Source Identity
Title: Practical Dataops

# Practical DataOps — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Practical DataOps
- **Author(s):** Harvinder Atwal
- **Branch:** dataops
- **RepoScope profile:** dataops
- **Primary source file:** Harvinder Atwal - Practical DataOps_ Delivering Agile Data Science At Scale (2020, Apress).pdf
- **Note status:** reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - Application of Lean manufacturing, Agile (Scrum, Kanban, XP), and DevOps practices to data engineering and data science lifecycles.
  - Automated continuous integration and continuous delivery (CI/CD) testing pipelines for data validation, code quality, and deployment safety.
  - Operational and business metadata management, lineage tracking, and establishing trust in enterprise data assets.
  - Reproducible pipeline execution through version control, configuration management, containerization, and test data management.
- Out of scope:
  - Manual project management methodologies without repository or software execution evidence.
  - Vendor-specific commercial software purchasing, negotiation, or licensing models.
  - Hardcoded relational database schema designs unlinked to automated pipeline code or version control repository artifacts.

## 3. Source spirit card
- Central thesis: Traditional IT and operational paradigms fail when applied to twenty-first-century data science, requiring DataOps to combine Lean manufacturing, Agile collaboration, and DevOps automation to deliver scalable, reliable data products.
- Operating model: Cross-functional domain teams operate iteratively using automated pipelines, continuous feedback loops, and version-controlled infrastructure to treat data as a first-class production asset.
- Primary architectural posture: Immutable, version-controlled pipelines that separate code from environment configurations and mandate continuous automated validation at every lifecycle transition.
- Primary risk focus: Excessive data downtime, unvalidated production changes, tribal knowledge silos, and poor return on investment stemming from manual, unverified deployment practices.
- Primary audit objective: Confirming that data pipelines, environment dependencies, infrastructure configurations, and test suites are fully declared as code within version control.
- Primary evidence boundary: Repository configuration files, orchestration DAGs, pipeline build scripts, environment lockfiles, test suites, and schema validation manifests.
- Core design philosophy: Eliminating waste and cycle time in data production through reproducible workflows, automated quality gates, and pervasive feedback mechanisms.
- Key technical abstractions: Data product, value stream map, pipeline orchestration DAG, versioned configuration item, and operational metadata store.
- Primary trade-offs/tensions: Balancing rapid exploratory data science experimentation with rigid, production-grade automated deployment controls and governance safeguards.
- Canonical failure mode: Deploying unvalidated pipeline code or manual schema alterations directly into production environments, triggering downstream data corruption and loss of stakeholder trust.

## 4. Source-backed structure
- Theme 1: Agile and Lean Frameworks for Data Delivery
  - Source: Harvinder Atwal - Practical DataOps
  - Structural locator: Chapter 4: Agile Collaboration
  - Spirit locator: Adapting Agile user stories, Kanban WIP limits, and value stream mapping to eliminate bottleneck waste and accelerate iterative data pipeline throughput.
- Theme 2: DevOps Practices for Data Pipelines
  - Source: Harvinder Atwal - Practical DataOps
  - Structural locator: Chapter 7: DevOps for DataOps
  - Spirit locator: Applying version control, configuration management, automated deployment, and environment reproducibility to eliminate production release failures.
- Theme 3: Building Trust Through Metadata and Lineage
  - Source: Harvinder Atwal - Practical DataOps
  - Structural locator: Chapter 6: Building Building Trust
  - Spirit locator: Combining business and operational metadata to make data lineage traceable, access controllable, and quality continuously verifiable.
- Theme 4: Architecture and Tool Selection Principles
  - Source: Harvinder Atwal - Practical DataOps
  - Structural locator: Chapter 8: Tools and Architecture
  - Spirit locator: Selecting technologies grounded in open standards, reusability, and automated testing rather than proprietary lock-in or unverified hype.

## 5. Source-backed spirit
- Q1: How does this source define data system architecture?
  - Answer: The source defines data system architecture as an integrated assembly of code, infrastructure, and operational workflows designed to automate the entire data lifecycle from ingestion to consumption while enforcing quality and reproducibility.
- Q2: What primary architectural invariants or principles govern pipeline execution?
  - Answer: Every pipeline asset must be fully reproducible from version control, configuration items must be decoupled from environment secrets, and changes must pass automated testing prior to production promotion.
- Q3: How should data quality and trustworthiness be verified across lifecycle transitions?
  - Answer: Trust is built by embedding automated data validation gates (file integrity, volume checks, schema assertions) into the continuous delivery pipeline and capturing operational metadata for full lineage traceability.
- Q4: What is the source's approach to failure handling, observability, and incident recovery?
  - Answer: The source advocates statistical process control, automated alerting on anomaly detection, blameless retrospectives, and rapid rollback mechanisms enabled by version-controlled pipeline artifacts.
- Q5: How are operational governance, metadata, and data ownership enforced?
  - Answer: Governance is decentralized into product teams using centralized metadata repositories and explicit ownership declarations to manage access permissions, data glossaries, and compliance rules.
- Q6: What repository evidence or software artifacts prove adherence to the source's philosophy?
  - Answer: Presence of version-controlled pipeline code, automated test directories, explicit dependency lockfiles, container build specifications, and environment configuration templates.

## 6. Key concepts
- Concept 1: DataOps Pipeline Reproducibility
  - Definition: The capability to recreate identical execution environments, data transformations, and system states using version-controlled artifacts.
  - Why it matters: Ensures that pipeline bugs or data anomalies can be reliably diagnosed, debugged, and corrected across development, staging, and production.
  - Related concepts: Configuration Management, Environment Parity, Infrastructure as Code.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Complete configuration items committed to version control guarantee reproducible systems.
  - Verification status: source-backed
- Concept 2: Operational Metadata
  - Definition: System-generated information capturing data lineage, transformation runtime metrics, ingestion timestamps, and quality validation logs.
  - Why it matters: Provides visibility into dataset provenance and execution health, eliminating tribal knowledge dependencies.
  - Related concepts: Data Lineage, Business Metadata, Data Catalog.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 6: Building Trust, Spirit: Operational metadata encapsulates provenance and data processing results.
  - Verification status: source-backed
- Concept 3: Value Stream Mapping
  - Definition: A Lean technique used to analyze and map the sequence of processes and lead times required to bring a data asset from raw capture to consumption.
  - Why it matters: Exposes handoff delays, processing bottlenecks, and unnecessary manual interventions across data teams.
  - Related concepts: Kanban, Work in Progress (WIP) Limits, Lead Time.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 3: Lean DataOps, Spirit: Mapping value streams identifies waste and accelerates throughput.
  - Verification status: source-backed
- Concept 4: Test-Driven Data Development
  - Definition: The practice of authoring automated data assertions and unit/integration tests prior to or alongside pipeline implementation.
  - Why it matters: Prevents silent data corruption from propagating downstream into analytical reports and machine learning models.
  - Related concepts: Continuous Integration, Data Quality Assertion, Test Data Management.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Automated testing guarantees pipeline safety and rapid feedback loops.
  - Verification status: source-backed
- Concept 5: Configuration Management
  - Definition: Systematically tracking, controlling, and versioning all configuration items necessary to execute software and data pipelines.
  - Why it matters: Prevents environment drift, unapproved hotfixes, and deployment crashes caused by undocumented infrastructure changes.
  - Related concepts: Version Control, Artifact Repository, Immutable Infrastructure.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Versioning all configuration items maintains total system integrity.
  - Verification status: source-backed
- Concept 6: Data Product Orientation
  - Definition: Structuring data deliverables as long-lived products managed by cross-functional teams rather than one-off project initiatives.
  - Why it matters: Promotes continuous operational maintenance, documentation quality, and customer-aligned feature enhancements.
  - Related concepts: Domain Orientation, Cross-Functional Teams, Product Owner.
  - Citation: Harvinder Atwal - Practical DataOps, Chapter 8: Tools and Architecture, Spirit: Transitioning from project mindsets to product ownership drives long-term asset value.
  - Verification status: source-backed

## 7. Practical patterns and examples
- Pattern 1: Continuous Integration Pipeline for Data Code
  - Problem solved: Eliminates manual deployment errors and untested code merges in production data environments.
  - Recommended approach: Implement automated CI triggers on git push to run linter checks, unit tests, SQL syntax validation, and dummy dry runs before merging.
  - Repository-level manifestation: CI workflow files (`.github/workflows/*.yml` or `.gitlab-ci.yml`) executing test runners (`pytest`, `dbt test`).
  - Limitations: Requires maintainable mock datasets and well-isolated test execution environments.
  - Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: CI checks enforce quality standards on every commit.
- Pattern 2: Secret Separation and Environment Configuration
  - Problem solved: Prevents plaintext credentials, database passwords, and API keys from leaking into public or shared version control repositories.
  - Recommended approach: Store credentials in secure secret vaults or environment variables, referencing template files (`.env.example`) in version control.
  - Repository-level manifestation: Presence of `.env.example`, `.gitignore` entries for `.env`, and secret fetching code (`os.getenv()`).
  - Limitations: Requires secure credential management infrastructure outside the repository.
  - Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Credentials must never appear in version control code.
- Pattern 3: Automated Test Data Management (TDM)
  - Problem solved: Prevents developers from using sensitive production data or non-deterministic datasets during testing.
  - Recommended approach: Version control sanitized seed datasets or synthetic data generation scripts to supply reliable test fixtures.
  - Repository-level manifestation: Dedicated test fixture directories (`tests/fixtures/`, `seeds/`) containing anonymized CSV/JSON files.
  - Limitations: Synthetic fixtures may fail to replicate edge-case data anomalies found in live production feeds.
  - Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Test data management provides safe, reproducible testing inputs.

## 8. Common failure modes and risks
- Failure 1: Plaintext Credentials Committed to Version Control
  - Why it happens: Developers hardcode API tokens or database passwords into scripts for quick testing and accidentally commit them.
  - Early warning signs: Plaintext passwords visible in code reviews or commit history logs.
  - Repository evidence: String patterns like `password = "..."` or `api_key = "..."` inside Python, SQL, or YAML scripts.
  - Severity tendency: critical
- Failure 2: Unverified Pipeline Code Promoted Without Automated Tests
  - Why it happens: Teams rush feature deliveries and bypass creating automated unit or integration tests for new pipeline modules.
  - Early warning signs: Frequent production data outages following pull request merges; complete lack of a `tests/` directory.
  - Repository evidence: Missing test files or CI workflow definitions that contain no invocation of test frameworks.
  - Severity tendency: error
- Failure 3: Dependency Version Drift Across Execution Environments
  - Why it happens: Package dependencies are specified without exact version pins, causing different environments to pull incompatible package versions.
  - Early warning signs: Pipeline scripts execute successfully in local development but fail in production deployment.
  - Repository evidence: Unpinned dependency manifests (`requirements.txt` without `==` versions) or missing lockfiles (`Pipfile.lock`, `poetry.lock`).
  - Severity tendency: warning
- Failure 4: Monolithic Unversioned Pipeline Orchestration
  - Why it happens: Orchestration DAGs are written as massive, unstructured monolithic scripts with hardcoded system paths.
  - Early warning signs: Inability to run modular sub-sections of a pipeline; failure logs that do not isolate broken tasks.
  - Repository evidence: Monolithic Python orchestration files exceeding hundreds of lines without modular function imports or parameterization.
  - Severity tendency: warning

## 9. Repository-audit translation
### Static checks (automated)
- Detecting hardcoded plaintext credentials, passwords, or access tokens in pipeline scripts.
- Verifying the existence of an automated test directory (`tests/` or `test/`) or framework invocation in CI configurations.
- Checking for dependency lockfiles (`requirements.txt`, `Pipfile.lock`, `poetry.lock`, `package-lock.json`) alongside manifest files.
- Verifying that local environment secret files (`.env`, `credentials.json`) are listed in `.gitignore`.
### Needs-review candidates
- Validating the structural coverage and assertion types of data validation frameworks (e.g., Great Expectations, Soda, dbt tests).
- Checking whether orchestration DAG definitions (e.g., Airflow, Dagster) include proper retry and failure notification handlers.
### Human review (contextual & organizational)
- Evaluating whether cross-functional team roles (Data Product Owners, Data Engineers, Analysts) are effectively aligned around value streams.
- Assessing the quality and business relevance of data glossary definitions and user documentation.
### Organizational artifacts check
- Verifying repository ownership configuration via `CODEOWNERS` or `OWNERS` files against organizational team registries.

## 10. Candidate rules

- Rule ID: dataops-env-001
  Title: Hardcoded plaintext credentials in pipeline code
  Profile: dataops
  Severity tendency: critical
  Rationale: Hardcoding credentials or secret keys in version control introduces severe security vulnerabilities and violates DataOps secret separation principles.
  Source-backed basis: Source mandates storing credentials securely outside version control using environment variables or secret vaults.
  Repository evidence to inspect: `.py`, `.sql`, `.yaml`, `.json`, or `.sh` files in the repository.
  Pass condition: No hardcoded API keys, passwords, or access tokens are present in source files.
  Fail condition: Plaintext credentials match regex patterns in code files.
  Exceptions or limitations: Mock test credentials inside test fixture files are exempt.
  YAML readiness: ready
  Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Credentials must never appear in version control code.
  Verification status: source-backed

- Rule ID: dataops-env-002
  Title: Missing automated test directory or test execution
  Profile: dataops
  Severity tendency: error
  Rationale: Automated testing is essential to DataOps continuous delivery; omitting tests risks releasing corrupt data pipelines into production.
  Source-backed basis: Source highlights automated test-driven development as a core requirement for building trust and reliability.
  Repository evidence to inspect: Presence of `tests/`, `test/`, `models/schema.yml`, or test execution steps in CI workflows.
  Pass condition: At least one recognized test directory, test manifest, or test step is present.
  Fail condition: Neither a test directory nor an automated test invocation is found in the repository.
  Exceptions or limitations: Pure documentation repositories are exempt.
  YAML readiness: ready
  Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Automated testing guarantees pipeline safety and rapid feedback loops.
  Verification status: source-backed

- Rule ID: dataops-env-003
  Title: Missing dependency lockfile for reproducible builds
  Profile: dataops
  Severity tendency: warning
  Rationale: Unpinned dependencies cause environment drift, resulting in non-reproducible pipeline builds across development and production.
  Source-backed basis: Source emphasizes configuration management and environment parity as mandatory for system reproducibility.
  Repository evidence to inspect: Dependency manifest files (`requirements.txt`, `Pipfile`, `pyproject.toml`).
  Pass condition: A corresponding lockfile (`requirements.txt` with pinned versions, `Pipfile.lock`, `poetry.lock`) is present.
  Fail condition: Dependency manifest exists without a corresponding lockfile or pinned version declarations.
  Exceptions or limitations: Standalone scripts with no external package dependencies.
  YAML readiness: ready
  Source citation: Harvinder Atwal - Practical DataOps, Chapter 7: DevOps for DataOps, Spirit: Versioning all configuration items maintains total system integrity.
  Verification status: source-backed

- Rule ID: dataops-atwal-004
  Title: Incomplete metadata tracking in pipeline DAGs
  Profile: dataops
  Severity tendency: warning
  Rationale: Pipelines executed without operational metadata logging prevent lineage tracing and delay root cause analysis during failures.
  Source-backed basis: Source highlights operational metadata as essential for capturing execution provenance and data lineage.
  Repository evidence to inspect: Orchestration DAG files inside `dags/` or `orchestration/`.
  Pass condition: DAG tasks configure explicit metadata logging or audit callbacks.
  Fail condition: DAG tasks omit metadata collection and logging configurations.
  Exceptions or limitations: Simple single-step scripts.
  YAML readiness: needs-review
  Reason if not ready: Requires AST or structural Python parsing to inspect DAG task definitions accurately.
  Source citation: Harvinder Atwal - Practical DataOps, Chapter 6: Building Trust, Spirit: Operational metadata encapsulates provenance and data processing results.
  Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: dataops-env-001
    title: Hardcoded plaintext credentials in pipeline code
    severity: critical
    references:
      - book: "Practical DataOps"
        concept: "secret-separation"
    check:
      type: pattern_match
      file_glob: "**/*.{py,sql,yaml,json,sh}"
      pattern: "(?i)(api_key|aws_secret_access_key|password|db_pass)\s*=\s*['"][A-Za-z0-9/+=]{8,}['"]"
      error_when: pattern_present
      message: "Hardcoded plaintext credentials detected in repository source file."

  - id: dataops-env-002
    title: Missing automated test directory or test execution
    severity: error
    references:
      - book: "Practical DataOps"
        concept: "automated-testing"
    check:
      type: file_absent
      file_glob: "{tests,test,**/tests}/*"
      error_when: file_absent
      message: "Automated test directory is missing from repository."

  - id: dataops-env-003
    title: Missing dependency lockfile for reproducible builds
    severity: warning
    references:
      - book: "Practical DataOps"
        concept: "reproducible-builds"
    check:
      type: file_absent
      file_glob: "{Pipfile.lock,poetry.lock,requirements-lock.txt}"
      error_when: file_absent
      message: "Dependency lockfile is missing, risking non-reproducible pipeline builds across environments."
```

### Candidates not emitted
- `dataops-atwal-004`: Requires AST or structural Python parsing to inspect DAG task definitions accurately for operational metadata callbacks (YAML readiness: needs-review).

## 12. Handoff Checklist

- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use `{book|standard, concept}`.
- [x] All emitted check types are in `{pattern_match, file_exists, file_absent}`.
- [x] All `ready` rules appear in Section 11 YAML.
- [x] All `needs-review` / `blocked` rules are absent from Section 11 YAML.
- [x] Section 11 ends with `### Candidates not emitted` or an explicit block explanation.
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked `Meaning to be confirmed.`
- [x] `Note status` reflects the weakest readiness in Section 10.
- [x] Section 9 explicitly separates automated static checks from human review.
- [x] Section 3 has all required spirit fields filled.
- [x] Section 10 has at least three rules or an explicit justification.

## References

<!-- ref: TODO -->
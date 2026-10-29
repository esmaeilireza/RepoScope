# Designing Data-Intensive Applications — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Designing Data-Intensive Applications
- **Author(s):** Martin Kleppmann
- **Branch:** dataops
- **RepoScope profile:** dataops
- **Primary source file:** Kleppmann, Martin.pdf
- **Note status:** reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - System architecture trade-offs across storage engines (LSM-trees, B-trees), encoding formats (Avro, Protobuf, JSON), and query models (OLTP vs OLAP).
  - Distributed data system invariants including replication (single-leader, multi-leader, leaderless), partition rebalancing, linearizability, and consensus algorithms.
  - Unifying batch and event stream processing via immutable event logs, Event Sourcing, Change Data Capture (CDC), and Command Query Responsibility Segregation (CQRS).
  - Derived data architectures, end-to-end correctness, auditable state generation, and schema evolution rules.
- Out of scope:
  - High-level business organization hierarchy design without technical system evidence.
  - GUI frontend styling or human-computer interaction user interface guidelines.
  - Manual database administrator operational runbooks unrepresented in automation or repository configs.

## 3. Source spirit card
- Central thesis: Data-intensive applications must be built by combining specialized storage, processing, and streaming building blocks using immutable event logs and verifiable abstractions to achieve reliability, scalability, and maintainability.
- Operating model: State changes are captured as an immutable, append-only stream of facts from a canonical system of record, from which downstream read-optimized views and indexes are derived asynchronously.
- Primary architectural posture: Decoupled, event-driven dataflow systems where state computation is deterministic, verifiable, and resilient to hardware or network faults.
- Primary risk focus: Silent data corruption, unhandled network partitions, race conditions under weak isolation levels, and breaking schema changes across service boundaries.
- Primary audit objective: Verifying that data schemas, serializations, replication settings, and stateful transformation logic are strictly declared, versioned, and tested.
- Primary evidence boundary: Schema definition files, serialization IDLs, container orchestration configs, database migration scripts, and consumer idempotency logic.
- Core design philosophy: Embracing immutability, explicit schema evolution, and end-to-end correctness over blind trust in individual infrastructure components.
- Key technical abstractions: Immutable event log, System of Record, Derived Data System, LSM-tree / SSTable, Change Data Capture, and Write-Ahead Log (WAL).
- Primary trade-offs/tensions: Balancing strong consistency and linearizability against fault tolerance, lower latency, and high availability in distributed networks.
- Canonical failure mode: Modifying state in-place without write-ahead logging or versioning, leading to unrecoverable data drift and inability to audit or rebuild system state.

## 4. Source-backed structure
- Theme 1: Foundations of Data Systems: Reliability, Scalability, Maintainability
  - Source: Martin Kleppmann - Designing Data-Intensive Applications
  - Structural locator: Chapter 1: Reliable, Scalable, and Maintainable Applications
  - Spirit locator: Engineering data systems to withstand hardware faults, load spikes, and software evolution through fault tolerance, abstraction, and evolvability.
- Theme 2: Storage Engines and Data Models
  - Source: Martin Kleppmann - Designing Data-Intensive Applications
  - Structural locator: Chapter 3: Storage and Retrieval
  - Spirit locator: Selecting storage formats (LSM-trees vs B-trees, row vs column storage) based on read/write workload characteristics and access patterns.
- Theme 3: Encoding, Schema Evolution, and Distributed Replication
  - Source: Martin Kleppmann - Designing Data-Intensive Applications
  - Structural locator: Chapter 5: Encoding and Evolution
  - Spirit locator: Maintaining backward and forward compatibility across service boundaries using explicit schema definitions and versioned binary encodings.
- Theme 4: Distributed Consistency, Consensus, and Correctness
  - Source: Martin Kleppmann - Designing Data-Intensive Applications
  - Structural locator: Chapter 9: Consistency and Consensus
  - Spirit locator: Navigating consensus, linearizability, and atomic commit protocols to prevent data loss and split-brain states in distributed stores.
- Theme 5: Stream Processing, Event Sourcing, and Derived Data Systems
  - Source: Martin Kleppmann - Designing Data-Intensive Applications
  - Structural locator: Chapter 11: Stream Processing
  - Spirit locator: Unifying data landscapes by treating log-based event streams as the immutable source of truth for deriving state and read views.

## 5. Source-backed spirit
- Q1: How does this source define data system architecture?
  - Answer: The source defines data system architecture as the composition of heterogeneous storage, index, and processing modules bound together by application code and messaging layers to meet functional and non-functional requirements.
- Q2: What primary architectural invariants or principles govern pipeline execution?
  - Answer: Raw inputs must be captured immutably, processing steps must be deterministic and repeatable, and schemas must explicitly manage evolution without breaking existing consumers.
- Q3: How should data quality and trustworthiness be verified across lifecycle transitions?
  - Answer: Trust is established by performing end-to-end integrity checks, validating schemas at boundary entry points, and auditing transformations against append-only event streams.
- Q4: What is the source's approach to failure handling, observability, and incident recovery?
  - Answer: Systems must assume network delays and node crashes, employing crash-recovery logs, idempotent consumer execution, self-auditing integrity checks, and deterministic simulation.
- Q5: How are operational governance, metadata, and data ownership enforced?
  - Answer: Ownership is mapped by designating canonical Systems of Record for authoritative data writes and deriving downstream read models via explicit Change Data Capture pipelines.
- Q6: What repository evidence or software artifacts prove adherence to the source's philosophy?
  - Answer: Presence of explicit schema IDLs (Avro, Protobuf), version-controlled migration scripts, container orchestration configs, and idempotent stream consumer code.

## 6. Key concepts
- Concept 1: System of Record vs. Derived Data System
  - Definition: A System of Record holds the canonical, authoritative state written first; Derived Data Systems are read-optimized representations computed asynchronously from the System of Record.
  - Why it matters: Prevents dual-writing inconsistencies and enables rebuilding read views from raw immutable history.
  - Related concepts: Event Sourcing, CQRS, Change Data Capture (CDC).
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 1: Trade-Offs in Data Systems Architecture, Spirit: Authoritative data lives in systems of record; derived data is regenerated from events.
  - Verification status: source-backed
- Concept 2: Immutable Event Log
  - Definition: An append-only sequence of timestamped records representing immutable historical facts.
  - Why it matters: Serves as the ultimate source of truth, enabling time-travel debugging, auditability, and replayability.
  - Related concepts: Write-Ahead Log (WAL), Event Sourcing, Stream-Table Duality.
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 11: Stream Processing, Spirit: Append-only logs capture facts permanently and drive state derivations.
  - Verification status: source-backed
- Concept 3: Schema Evolution (Forward and Backward Compatibility)
  - Definition: Designing data encodings so new code can read data written by old code (backward compatibility) and old code can read data written by new code (forward compatibility).
  - Why it matters: Enables rolling deployments and decoupled service upgrades without system-wide downtime.
  - Related concepts: Schema Registry, Avro, Protocol Buffers, Thrift.
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: Explicit schemas with evolution rules prevent breaking serialization changes.
  - Verification status: source-backed
- Concept 4: Idempotence
  - Definition: An operational property where executing a processing step multiple times produces the exact same system state as executing it once.
  - Why it matters: Guarantees exact-once semantics and fault recovery in distributed stream and batch processing pipelines.
  - Related concepts: At-Least-Once Processing, Deduplication, Deterministic Execution.
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 11: Stream Processing, Spirit: Idempotent operations allow safe retries during network or node failures.
  - Verification status: source-backed
- Concept 5: Stream-Table Duality
  - Definition: The fundamental relationship where a stream of events represents the changelog of a table, and a table represents the current aggregated state of a stream.
  - Why it matters: Provides the theoretical foundation for materializing stateful views from continuous real-time streams.
  - Related concepts: Change Data Capture (CDC), Materialized View, State Management.
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 11: Stream Processing, Spirit: Streams are tables in motion; tables are streams at rest.
  - Verification status: source-backed
- Concept 6: LSM-Tree vs. B-Tree Storage
  - Definition: Storage engine designs optimized either for write-heavy workloads via sequential append-only SSTables (LSM-Tree) or read-heavy random access via in-place page updates (B-Tree).
  - Why it matters: Dictates database I/O performance, write amplification, and hardware wear characteristics.
  - Related concepts: Write-Ahead Log (WAL), SSTable, Memtable, Compaction.
  - Citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 3: Storage and Retrieval, Spirit: Storage structures must align with write vs. read access patterns.
  - Verification status: source-backed

## 7. Practical patterns and examples
- Pattern 1: Schema-First API and Stream Interfaces
  - Problem solved: Prevents runtime serialization errors and breaking data type mismatches across distributed microservices.
  - Recommended approach: Define interface payloads using explicit IDL schemas (`.proto`, `.avsc`) stored in repository code and validated during build time.
  - Repository-level manifestation: Schema files inside `schemas/`, `proto/`, or `avro/` directories.
  - Limitations: Requires schema registry deployment and discipline in managing field default values.
  - Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: IDL schema specifications guarantee interface safety across releases.
- Pattern 2: Log-Based Change Data Capture (CDC)
  - Problem solved: Synchronizes search indexes, caches, and analytical warehouses without risky dual-writing in application code.
  - Recommended approach: Capture raw database transaction log mutations and stream them into message brokers for asynchronous consumption.
  - Repository-level manifestation: CDC connector configs (e.g., Debezium YAML files) and stream consumer handlers.
  - Limitations: Requires database transaction log retention and ordering guarantees.
  - Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 11: Stream Processing, Spirit: CDC extracts state changes directly from transaction logs cleanly.
- Pattern 3: Idempotent Consumer with Unique Message Keys
  - Problem solved: Eliminates duplicate record creation when network retries replay event messages.
  - Recommended approach: Assign deterministic unique IDs to incoming events and use atomic database conditional inserts or deduplication keys.
  - Repository-level manifestation: SQL statements utilizing `ON CONFLICT DO NOTHING` or unique key constraints in stream consumer code.
  - Limitations: Requires primary key index overhead on destination storage tables.
  - Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 11: Stream Processing, Spirit: Deterministic keying guarantees idempotent record updates.

## 8. Common failure modes and risks
- Failure 1: Dual Writing Across Storage Systems
  - Why it happens: Developers write code that updates two databases sequentially in an application layer without distributed transactions or event logs.
  - Early warning signs: Data inconsistency and drift between relational primary databases and search/cache indexes.
  - Repository evidence: Application handlers invoking sequential `db.save()` and `cache.put()` calls without transaction wrappers or CDC.
  - Severity tendency: error
- Failure 2: Unversioned In-Place Schema Modifications
  - Why it happens: Fields are deleted or renamed in data structures without managing backward/forward compatibility.
  - Early warning signs: Serialization crashes in old consumer services when parsing new payload messages.
  - Repository evidence: Removing fields from `.proto` or `.avsc` files without assigning deprecated tag numbers or default values.
  - Severity tendency: critical
- Failure 3: Plaintext Unencrypted Connection Strings in Stream Configs
  - Why it happens: Database or message broker URIs containing plaintext credentials are hardcoded into deployment scripts.
  - Early warning signs: Exposed credentials in repository search results or git logs.
  - Repository evidence: Connection strings containing `amqp://user:pass@host` or `postgres://user:pass@host` in config files.
  - Severity tendency: critical
- Failure 4: Non-Idempotent Stream Processing Handlers
  - Why it happens: Consumers perform side-effects (e.g., sending emails, incrementing counters) without checking if an event was already processed.
  - Early warning signs: Duplicate records or inflated aggregation totals after network restarts or pod rebalances.
  - Repository evidence: Consumer execution loops lacking state deduplication or atomic unique key assertions.
  - Severity tendency: error

## 9. Repository-audit translation
### Static checks (automated)
- Detecting hardcoded plaintext database connection strings or unencrypted connection URIs in configuration files.
- Verifying the presence of explicit schema specification files (`.proto`, `.avsc`, `.thrift`, `.json`) in event-driven streaming repositories.
- Checking for the existence of database migration tooling configuration (e.g., Flyway, Liquibase, Alembic) in relational database projects.
- Ensuring that environment credential configurations are excluded via `.gitignore`.
### Needs-review candidates
- Checking whether schema evolution settings in Schema Registry configurations enforce `BACKWARD` or `FULL` compatibility modes.
- Inspecting stream consumer code for idempotent retry and deduplication mechanisms.
### Human review (contextual & organizational)
- Evaluating whether system boundaries correctly isolate Systems of Record from Derived Data Systems.
- Reviewing distributed system partition tolerance and consistency trade-off decisions under fault scenarios.
### Organizational artifacts check
- Verifying code ownership and repository domain boundary assignments via `CODEOWNERS` files.

## 10. Candidate rules

- Rule ID: dataops-schema-001
  Title: Hardcoded unencrypted connection URIs in configuration files
  Profile: dataops
  Severity tendency: critical
  Rationale: Hardcoding connection strings with embedded plaintext passwords in code or config files violates basic security and secret separation principles.
  Source-backed basis: Source highlights the necessity of secure credential handling and environment decoupling in data systems.
  Repository evidence to inspect: `.py`, `.yaml`, `.json`, `.properties`, or `.env.example` files.
  Pass condition: Connection strings utilize environment variable substitution rather than embedded credentials.
  Fail condition: Connection strings contain hardcoded `user:pass@host` credentials.
  Exceptions or limitations: Test configuration files using local dummy credentials.
  YAML readiness: ready
  Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: Environment parameters must be decoupled from code.
  Verification status: source-backed

- Rule ID: dataops-stream-001
  Title: Missing schema definition files in event-driven streaming repositories
  Profile: dataops
  Severity tendency: error
  Rationale: Operating event-driven messaging without explicit schema definition files leads to untyped payloads, silent data corruption, and breaking changes.
  Source-backed basis: Source emphasizes schema-first design and IDLs as essential for data encoding and evolution.
  Repository evidence to inspect: Presence of `.proto`, `.avsc`, `.thrift`, or `.json` schema files in repositories containing stream consumer/producer code.
  Pass condition: Repository contains at least one formal schema IDL file.
  Fail condition: Stream producers/consumers exist without any formal schema definition files.
  Exceptions or limitations: Pure analytical SQL query repositories without custom event serializers.
  YAML readiness: ready
  Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: IDL schema specifications guarantee interface safety across releases.
  Verification status: source-backed

- Rule ID: dataops-migrate-001
  Title: Missing database migration tool configuration
  Profile: dataops
  Severity tendency: warning
  Rationale: Modifying database schemas manually without version-controlled migration scripts causes environment schema drift and deployment failures.
  Source-backed basis: Source mandates explicit versioning and evolvability for database storage schemas.
  Repository evidence to inspect: Directories for migration tools (`migrations/`, `db/migrate/`, `flyway/`, `alembic/`).
  Pass condition: Repository includes a recognized database migration directory and configuration.
  Fail condition: Relational database application repository lacks database migration scripts.
  Exceptions or limitations: NoSQL schema-on-read database repositories.
  YAML readiness: ready
  Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: Schema evolution must be systematically versioned and executed.
  Verification status: source-backed

- Rule ID: dataops-kleppmann-004
  Title: Unverified Schema Registry compatibility mode
  Profile: dataops
  Severity tendency: warning
  Rationale: Disabling compatibility checks in schema registries allows breaking schema changes to be published, crashing downstream event consumers.
  Source-backed basis: Source identifies backward and forward compatibility as mandatory for independent service evolvability.
  Repository evidence to inspect: Schema registry configuration files or deployment manifests.
  Pass condition: Compatibility mode is explicitly set to `BACKWARD`, `FORWARD`, or `FULL`.
  Fail condition: Compatibility mode is set to `NONE` or omitted.
  Exceptions or limitations: Local development test registries.
  YAML readiness: needs-review
  Reason if not ready: Requires YAML-aware or API-level structural configuration checking.
  Source citation: Martin Kleppmann - Designing Data-Intensive Applications, Chapter 5: Encoding and Evolution, Spirit: Compatibility enforcement prevents serialization breakage.
  Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: dataops-schema-001
    title: Hardcoded unencrypted connection URIs in configuration files
    severity: critical
    references:
      - book: "Designing Data-Intensive Applications"
        concept: "secret-separation"
    check:
      type: pattern_match
      file_glob: "**/*.{py,yaml,yml,json,properties,ini}"
      pattern: "(?i)(postgres|mysql|amqp|mongodb|redis)://[^:]+:[^@]+@"
      error_when: pattern_present
      message: "Hardcoded connection string containing plaintext password detected in configuration file."

  - id: dataops-stream-001
    title: Missing schema definition files in event-driven streaming repositories
    severity: error
    references:
      - book: "Designing Data-Intensive Applications"
        concept: "schema-evolution"
    check:
      type: file_absent
      file_glob: "**/*.{proto,avsc,thrift}"
      error_when: file_absent
      message: "Explicit schema definition files (.proto, .avsc, .thrift) are missing from event-driven project."

  - id: dataops-migrate-001
    title: Missing database migration tool configuration
    severity: warning
    references:
      - book: "Designing Data-Intensive Applications"
        concept: "schema-evolution"
    check:
      type: file_absent
      file_glob: "{migrations,db/migrate,flyway,alembic,sql}/*"
      error_when: file_absent
      message: "Database migration directory is missing, risking unversioned database schema drift."
```

### Candidates not emitted
- `dataops-kleppmann-004`: Requires YAML-aware structural configuration inspection to verify Schema Registry compatibility parameters (YAML readiness: needs-review).

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
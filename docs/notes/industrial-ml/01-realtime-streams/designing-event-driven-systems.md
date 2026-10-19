# Designing Event-Driven Systems — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Designing Event-Driven Systems
- Title: Designing Event-Driven Systems
- Author(s): Ben Stopford
- Branch: dataops
- RepoScope profile: dataops
- Primary source file: Designing-Event-Driven-Systems.pdf
- Note status: reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - Core architecture and principles for building asynchronous, event-driven microservice ecosystems with Apache Kafka.
  - Distributed log mechanics, partition scalability, topic compaction, and consumer group rebalancing.
  - Messaging collaboration patterns: Event Collaboration, Event Sourcing, CQRS, and Memory Images.
  - Data governance, transactional atomicity (Exactly-Once processing), and backward-compatible schema evolution using Schema Registry.
- Out of scope:
  - Operating system kernel network tuning or hardware-level storage benchmarking.
  - Alternative non-Kafka streaming engines such as Apache Flink, Apache Spark, or Google Cloud Dataflow.
  - Frontend user interface frameworks and client-side web application state rendering.

## 3. Source spirit card
1. Core philosophy: Centralize an immutable stream of core business facts while decentralizing the freedom for autonomous services to act, adapt, and evolve.
2. Primary problem solved: Eliminates the tight spatial and temporal coupling created by cascading synchronous request-response chains and shared central databases.
3. Architectural posture: Asynchronous event-driven publish-subscribe architecture backed by persistent, replayable distributed logs.
4. Primary tradeoff: Accepts eventual consistency and increased asynchronous system topology in exchange for linear scalability, fault isolation, and independent team cadences.
5. Definition of success: An adaptable enterprise service estate where teams publish standardized events and deploy new microservices without cross-team deployment locks.
6. Definition of failure: Cascading system outages caused by synchronous RPC chains, data loss from non-atomic dual writes, or uncoordinated breaking schema changes.
7. Preferred abstraction level: Distributed append-only partitioned log functioning as a shared enterprise source of truth.
8. Attitude toward state: State should be internalized locally within each service as materialized views rederived directly from the immutable event stream.
9. Attitude toward schema/contracts: Event schemas are mandatory, version-controlled public APIs that must maintain backward compatibility through explicit registry contracts.
10. Operational expectation: Continuous, highly available stream processing with automated failover, partition load balancing, and rapid local state store recovery.

## 4. Source-backed structure
- Theme 1: Foundations of Streaming and the Kafka Platform
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 3. Is Kafka What You Think It Is?
  - Spirit locator: Defines Apache Kafka as a distributed, replayable streaming platform that combines the scale of storage systems with the streaming capabilities of data pipelines.
- Theme 2: Event Collaboration and Loose Service Coupling
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 5. Events: A Basis for Collaboration
  - Spirit locator: Replaces command-driven orchestration with event notifications and state transfers to establish receiver-driven routing and loose architectural coupling.
- Theme 3: Event Sourcing, CQRS, and Turning the Database Inside Out
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 7. Event Sourcing, CQRS, and Other Stateful Patterns
  - Spirit locator: Decouples write models from read models by storing raw events immutably in the log and asynchronously populating specialized local state stores.
- Theme 4: Shared Facts and Lean Data Across Enterprise Scales
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 9. Event Streams as a Shared Source of Truth
  - Spirit locator: Uses centralized immutable event topics as the single source of truth across teams while allowing services to manufacture lightweight, single-purpose data views.
- Theme 5: Consistency, Transactions, and Schema Evolution
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 11. Consistency and Concurrency in Event-Driven Systems
  - Spirit locator: Enforces localized consistency via the single writer principle, transactional atomic commits, and version-controlled schema compatibility.
- Theme 6: Stateful Stream Processing and Ecosystem Architecture
  - Source: Designing-Event-Driven-Systems.pdf
  - Structural locator: Chapter 15. Building Streaming Services
  - Spirit locator: Embeds stateful stream transformations directly inside microservices using key-partitioned state stores and transactional execution streams.

## 5. Source-backed spirit
1. What is the fundamental worldview of this source? Software systems and enterprise data flows can be unified into a single distributed database turned inside out, where immutable event streams represent shared business history and services materialize local views for processing logic.
2. What does this source consider the greatest architectural risk? Direct coupling via synchronous REST/RPC calls or shared database access across service boundaries, which creates fragile, interconnected dependency chains prone to widespread outages.
3. How does this source view centralized vs decentralized control? Centralize the immutable event stream and storage infrastructure as a shared source of truth, but decentralize service implementation, data processing, and deployment freedom.
4. How does this source treat data ownership and state? Microservices must fully encapsulate their internal state behind service boundaries, consuming public event streams and building private, queryable materialized views.
5. What is the source's attitude toward schema changes and evolution? Schema change is an inevitable characteristic of aging software systems; non-backward-compatible updates must be carefully managed using backward-compatible Avro contracts or dual-topic upgrade windows.
6. How should failures be handled according to this source? Systems must expect continuous failure and recover automatically via log replayability, single-writer partition guarantees, idempotent producers, and transactional atomic commits rather than distributed locks.

## 6. Key concepts
1. Replayable Partitioned Log
   - Definition: A distributed, append-only, ordered sequence of records stored sequentially on disk and partitioned across cluster nodes for scale and fault tolerance.
   - Why it matters: Delivers high sequential disk throughput, decouples producer write performance from consumer read speed, and allows services to rewind and replay historic data.
   - Related concepts: Kafka Broker, Compacted Topics, Consumer Group Offsets.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
2. Event Collaboration Pattern
   - Definition: An architectural pattern where autonomous services communicate by publishing facts (events) describing business state changes without instructing downstream services what action to take.
   - Why it matters: Flips routing responsibility to the receiver, eliminating direct RPC service dependencies and enabling pluggable system capabilities.
   - Related concepts: Receiver-Driven Routing, State Transfer, Loose Coupling.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
3. Single Writer Principle
   - Definition: A design rule stating that only a single designated service instance or process is permitted to write state transitions for a given entity or partition key.
   - Why it matters: Prevents concurrent write collisions and race conditions without relying on expensive distributed locks.
   - Related concepts: Command/Entity Topic Split, Key-Based Partitioning, Optimistic Concurrency.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
4. Event Sourcing & CQRS
   - Definition: Event Sourcing persists state changes as an immutable sequence of events; CQRS separates the write model (event log) from query-optimized local read models.
   - Why it matters: Ensures complete historical auditability, supports total state rederivation, and allows read and write paths to scale independently.
   - Related concepts: Materialized Views, Memory Images, Change Data Capture.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
5. Stateful Stream Processing & State Stores
   - Definition: Stream processing APIs that embed localized disk-resident data tables inside microservice processes, backed durably by Kafka changelog topics.
   - Why it matters: Eliminates external database lookups during stream processing, executing high-throughput local joins and aggregations at low latency.
   - Related concepts: Kafka Streams, KTable, RocksDB, Standby Replicas.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
6. Dual Schema Upgrade Window
   - Definition: A schema migration strategy where data in a new non-backward-compatible schema is routed to a parallel topic alongside a stream transformer bridging old and new formats during a migration period.
   - Why it matters: Permits independent microservice teams to upgrade producers and consumers without forcing synchronized, company-wide releases.
   - Related concepts: Schema Registry, Avro Backward Compatibility, Single Message Transforms.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed
7. Transactions API (Atomic Commits)
   - Definition: A Kafka framework feature allowing messages across multiple topics and state stores to be produced and committed as a single atomic unit.
   - Why it matters: Guarantees exactly-once processing semantics across read-process-write stream cycles, eliminating duplicates and preventing partial state failures.
   - Related concepts: Exactly-Once Semantics, Transaction Coordinator, Marker Messages.
   - Citation: Designing-Event-Driven-Systems.pdf
   - Verification status: source-backed

## 7. Practical patterns and examples
1. Command / Entity Topic Split
   - Problem solved: Enforces the Single Writer Principle while allowing external services to submit state update requests asynchronously.
   - Recommended approach: Create a public `Commands` topic writable by any client service, and a restricted `Entities` topic writable exclusively by the owning validation service.
   - Repository-level manifestation: Topic configuration manifests defining `order-commands` with open producer access and `orders` restricted to the Order Service identity via ACLs.
   - Limitations: Introduces asynchronous latency between command submission and final entity state confirmation.
   - Source citation: Designing-Event-Driven-Systems.pdf
2. Change Data Capture (CDC) Outbox Integration
   - Problem solved: Unlocks database mutations from legacy applications and streams them into event topics without risking dual-write inconsistencies.
   - Recommended approach: Utilize a CDC connector (e.g., Debezium via Kafka Connect) to tail the database transaction log and publish changes directly into Kafka event streams.
   - Repository-level manifestation: Kafka Connect JSON or YAML configuration manifests defining database log-tailing parameters and table-to-topic mappings.
   - Limitations: Dependent on internal database transaction log formats and requires post-processing transforms to standardize public payloads.
   - Source citation: Designing-Event-Driven-Systems.pdf
3. Dual-Topic Down-Converter (Dual Schema Upgrade Window)
   - Problem solved: Manages breaking, non-backward-compatible event schema changes across independently updated microservice applications.
   - Recommended approach: Publish new schema events to a `v2` topic, run a Kafka Streams down-converter microservice to populate the `v1` topic, and retire `v1` once all consumers migrate.
   - Repository-level manifestation: Kafka Streams microservice codebase or deployment manifest containing a stream transformer bridging `orders-v2` and `orders-v1`.
   - Limitations: Temporarily duplicates topic storage footprint and network bandwidth during the co-existence window.
   - Source citation: Designing-Event-Driven-Systems.pdf
4. Materialized Event-Sourced View via Kafka Streams KTable
   - Problem solved: Delivers rapid, queryable read endpoints for microservices without making remote HTTP calls or hitting shared databases.
   - Recommended approach: Consume an event stream in Kafka Streams, project records into a local RocksDB state store (`KTable`), and expose it over local REST endpoints.
   - Repository-level manifestation: Application Java/Scala source code instantiating a `KTable` from an input topic and binding interactive query endpoints.
   - Limitations: Requires local disk allocation for state store persistence and bootstrapping time when initializing a cold node.
   - Source citation: Designing-Event-Driven-Systems.pdf

## 8. Common failure modes and risks
1. Dual-Write Non-Atomic Inconsistency
   - Why it happens: A service updates its local database and publishes an event to Kafka in separate un-transactional operations, encountering network failure between calls.
   - Early warning signs: Unexplained data inconsistencies between service databases and downstream event streams; missing notification events despite database records existing.
   - Repository evidence: Application code executing database commits followed by independent `kafkaProducer.send()` invocations without transactional outbox or CDC patterns.
   - Severity tendency: critical
2. Uncontrolled Breaking Schema Changes
   - Why it happens: A producer application alters an event payload format (e.g., deleting fields or renaming keys) without verifying backward compatibility.
   - Early warning signs: Spikes in consumer deserialization exceptions, poison-pill messages halting partition processing, and crashing downstream microservices.
   - Repository evidence: Missing Schema Registry plugin integration in build pipelines and lack of Avro/Protobuf compatibility tasks in CI workflows.
   - Severity tendency: critical
3. Shared Database Access Across Service Boundaries
   - Why it happens: Developers bypass event streams and query or mutate another service's internal database directly to save initial implementation effort.
   - Early warning signs: Schema refactoring in one service breaking unrelated downstream applications; database lock contention and unpredictable performance degradation.
   - Repository evidence: Database connection strings sharing credentials or schemas across multiple repository microservices.
   - Severity tendency: error
4. Unbounded Local State Rebuild Lag
   - Why it happens: A stateful stream processing node crashes and must rebuild its multi-gigabyte local state store from an uncompacted, full-history topic.
   - Early warning signs: Extended service cold-start delays, consumer group rebalance timeouts, and high consumer lag during node deployment.
   - Repository evidence: State store changelog topics configured with retention-based deletion policy (`cleanup.policy=delete`) instead of compaction (`cleanup.policy=compact`).
   - Severity tendency: warning

## 9. Repository-audit translation
### Static checks (automated)
- Audit build files and CI pipelines for Schema Registry compatibility plugins (e.g., `schema-registry-maven-plugin` or Gradle Avro plugins).
- Check repository configuration for Kafka producer settings enforcing idempotence (`enable.idempotence=true`) and transactional IDs during read-process-write loops.
- Verify that event schema definition files (e.g., `.avsc`, `.proto`, `.json`) exist in repository source paths whenever event producers or consumers are present.
- Scan application configuration for Dead-Letter Queue (DLQ) topic references and error-handler recovery definitions in consumer classes.
- Detect pattern matches for hardcoded topic name strings or shared cross-service database credentials in configuration manifests.

### Human review (contextual)
- Evaluate whether microservice bounded context boundaries align with domain business entities rather than arbitrary technical layers.
- Assess architectural trade-offs when selecting between lightweight Event Notification versus replicated Event-Driven State Transfer.
- Review operational runbooks and disaster recovery strategy for rebuilding large stateful stream processing local state stores.
- Validate team communication channels and pull-request sign-off workflows for proposed event schema modifications.

## 10. Candidate rules
- Rule ID: dataops-schema-001
- Title: Kafka Event Schema Compatibility Verification
- Profile: dataops
- Severity tendency: critical
- Rationale: Event-driven systems rely on shared event contracts. Modifying event schemas without compatibility verification causes deserialization errors and breaks downstream consumers.
- Source-backed basis: Designing-Event-Driven-Systems.pdf emphasizes build-time and runtime schema validation via Confluent Schema Registry to enforce backward compatibility across independently deployed services.
- Repository evidence to inspect: Build definition files (`pom.xml`, `build.gradle`), CI workflow YAMLs, or Schema Registry plugin configs.
- Pass condition: CI workflow or build file includes an automated task executing schema compatibility validation against Schema Registry before merging code.
- Fail condition: Repository defines Avro or Protobuf event schemas but includes no automated schema compatibility test step in build or CI workflows.
- Exceptions or limitations: Applies only to repositories that produce or consume structured, schema-governed event streams.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Designing-Event-Driven-Systems.pdf
- Source: Designing-Event-Driven-Systems.pdf
- Structural locator: Chapter 13. Evolving Schemas and Data over Time
- Spirit locator: Automated build-time and runtime compatibility checks ensure independent team releases cannot break downstream message deserialization.
- Verification status: source-backed

- Rule ID: dataops-stream-001
- Title: Idempotent Producer Configuration Enforcer
- Profile: dataops
- Severity tendency: error
- Rationale: Non-idempotent event producers create duplicate messages during network retries, causing state corruption in downstream stream processing pipelines.
- Source-backed basis: Designing-Event-Driven-Systems.pdf specifies that enabling producer idempotence and transactional IDs ensures exactly-once delivery guarantees across network retries and atomic write cycles.
- Repository evidence to inspect: Kafka producer properties files (`application.properties`, `application.yml`, code constants).
- Pass condition: Producer configuration explicitly specifies `enable.idempotence=true` or defines a valid `transactional.id`.
- Fail condition: Kafka producer configuration sets `enable.idempotence=false` or omits idempotence settings when retries are enabled.
- Exceptions or limitations: Applies to Kafka Java, Python, or Go producer configurations within repository codebases.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Designing-Event-Driven-Systems.pdf
- Source: Designing-Event-Driven-Systems.pdf
- Structural locator: Chapter 12. Transactions, but Not as We Know Them
- Spirit locator: Idempotent producer configurations prevent message duplication at the broker level during network retries.
- Verification status: source-backed

- Rule ID: dataops-dlq-001
- Title: Dead-Letter Queue Error Recovery Configuration
- Profile: dataops
- Severity tendency: warning
- Rationale: Unhandleable or malformed poison-pill records cause infinite retry loops, halting partition consumption for the entire consumer group.
- Source-backed basis: Designing-Event-Driven-Systems.pdf highlights the necessity of routing unparseable or failed messages to error topics/DLQs to preserve consumer group progress.
- Repository evidence to inspect: Kafka consumer listener code, error handler configuration files, or stream framework properties.
- Pass condition: Consumer configuration or code explicitly defines a DeadLetterPublishingRecoverer or DLQ error topic handler.
- Fail condition: Consumer error handling configuration uses infinite retry loops without a DLQ or fallback routing step.
- Exceptions or limitations: Applies to stream consumer service repositories.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Designing-Event-Driven-Systems.pdf
- Source: Designing-Event-Driven-Systems.pdf
- Structural locator: Chapter 13. Evolving Schemas and Data over Time
- Spirit locator: Redirecting unprocessable messages to a dedicated dead-letter queue isolates bad data while preserving stream processing continuity.
- Verification status: source-backed

- Rule ID: dataops-event-001
- Title: Single Writer Boundary Enforcers for Domain Topics
- Profile: dataops
- Severity tendency: error
- Rationale: Allowing multiple services to write directly to an entity topic violates the Single Writer Principle, causing race conditions and inconsistent state.
- Source-backed basis: Designing-Event-Driven-Systems.pdf details the Single Writer Principle, mandating that entity topics have a single owning service while other services write to command topics.
- Repository evidence to inspect: Topic ACL manifests, Kafka IaC definitions (Terraform/Kubernetes CRDs), or topic routing configurations.
- Pass condition: Infrastructure-as-code manifests restrict write access for entity topics to a single service principal.
- Fail condition: Infrastructure-as-code grants write access to multiple distinct service roles for the same domain entity topic.
- Exceptions or limitations: Requires static inspection of IaC manifests or Kafka ACL security manifests within the repository.
- YAML readiness: needs-review
- Reason if not ready: Validating multi-service ACL assignments requires semantic parsing of external infrastructure-as-code files beyond simple pattern matching.
- Source citation: Designing-Event-Driven-Systems.pdf
- Source: Designing-Event-Driven-Systems.pdf
- Structural locator: Chapter 11. Consistency and Concurrency in Event-Driven Systems
- Spirit locator: Restricting write privileges to a single owning service prevents non-deterministic state mutations on entity topics.
- Verification status: source-backed

- Rule ID: dataops-replay-001
- Title: Compacted Topic Policy for State Store Changelogs
- Profile: dataops
- Severity tendency: warning
- Rationale: Setting retention-based deletion on state store changelog topics leads to data loss when rebuilding local state stores from offset zero.
- Source-backed basis: Designing-Event-Driven-Systems.pdf notes that state store changelog topics and key-value state backing topics must use topic compaction (`cleanup.policy=compact`) to retain the latest value per key indefinitely.
- Repository evidence to inspect: Kafka topic configuration files, IaC manifests, or Kafka Streams state store definitions.
- Pass condition: Topic configuration manifests for state store changelogs specify `cleanup.policy=compact`.
- Fail condition: Topic configuration sets `cleanup.policy=delete` for a topic backing a state store or materialized view.
- Exceptions or limitations: Applies to topic creation manifests and stream processing configuration.
- YAML readiness: blocked
- Reason if not ready: Current validator lacks semantic property graph analysis to correlate a stream processing state store with its corresponding infrastructure topic manifest.
- Source citation: Designing-Event-Driven-Systems.pdf
- Source: Designing-Event-Driven-Systems.pdf
- Structural locator: Chapter 4. Beyond Messaging: An Overview of the Kafka Broker
- Spirit locator: Topic compaction preserves the latest state for every key, enabling efficient and complete state store recovery.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: dataops-schema-001
    profile: dataops
    severity: critical
    message: "Kafka event schema compatibility test task is missing in repository build or CI pipeline configuration."
    references:
      - book: "Designing Event-Driven Systems"
        concept: "schema-compatibility"
    check:
      type: pattern_match
      file_glob: ".github/workflows/*.yml"
      pattern: 'schema-registry|avro-compatibility|checkSchema'
      must_exist: true
      error_when: pattern_absent
      message: "No schema compatibility check step found in CI workflows."

  - id: dataops-stream-001
    profile: dataops
    severity: error
    message: "Kafka producer configuration must explicitly enable idempotence to prevent duplicate messages."
    references:
      - book: "Designing Event-Driven Systems"
        concept: "idempotent-producer"
    check:
      type: pattern_match
      file_glob: "**/application*.yml"
      pattern: 'enable\.idempotence:\s*true'
      must_exist: true
      error_when: pattern_absent
      message: "Kafka producer configuration does not set enable.idempotence to true."

  - id: dataops-dlq-001
    profile: dataops
    severity: warning
    message: "Kafka consumer configuration missing Dead-Letter Queue or error recovery handler."
    references:
      - book: "Designing Event-Driven Systems"
        concept: "dead-letter-queue"
    check:
      type: pattern_match
      file_glob: "**/*Consumer*.java"
      pattern: 'DeadLetterPublishingRecoverer|DefaultErrorHandler|DLQ'
      must_exist: true
      error_when: pattern_absent
      message: "Kafka consumer code lacks DLQ or error recovery handler pattern."
```

### Candidates not emitted
- dataops-event-001: Marked `needs-review`. Reason: Validating multi-service ACL assignments requires semantic parsing of external infrastructure-as-code files beyond simple pattern matching.
- dataops-replay-001: Marked `blocked`. Reason: Current validator lacks semantic property graph analysis to correlate a stream processing state store with its corresponding infrastructure topic manifest.

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

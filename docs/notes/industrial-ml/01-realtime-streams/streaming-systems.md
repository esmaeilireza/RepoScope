# Streaming Systems — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Streaming Systems
- Title: Streaming Systems: The What, Where, When, and How of Large-Scale Data Processing
- Author(s): Tyler Akidau, Slava Chernyak, Reuven Lax
- Branch: dataops
- RepoScope profile: dataops
- Primary source file: Streaming Systems- The What, Where, When, and How of Large-Scale Data Processing.pdf
- Note status: reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - Unified batch and stream processing semantics defined by the Beam Model across four questions: What, Where, When, and How.
  - Distinction between Event Time and Processing Time domains, including event-time skew and processing-time lag.
  - Temporal progress metrics via Watermarks (perfect vs. heuristic, source watermarks, input/output watermark propagation, percentile watermarks, and processing-time watermarks).
  - Event-time windowing strategies (fixed, sliding, sessions, dynamic merging windows, and custom windowing).
  - Triggering mechanics (early, on-time, and late firings) and accumulation modes (discarding, accumulating, accumulating and retracting).
  - Window lifetime bounds, allowed lateness, and state garbage collection.
  - End-to-end exactly-once processing guarantees, shuffle deduplication catalog with Bloom filters, deterministic checkpointing, and side-effect sink idempotency.
  - General theory of Stream and Table Relativity (tables as data at rest, streams as data in motion) and time-varying relations in Streaming SQL.
  - Low-level persistent state, state specs, timers, and dynamic session merging with retractions.
- Out of scope:
  - Low-level network interface hardware driver configuration, TCP socket tuning, or physical NIC benchmarking.
  - Frontend web framework user interface rendering or browser DOM state management.
  - Storage engine physical block layout optimization on bare-metal disk controllers.

## 3. Source spirit card
1. Core philosophy: Unbounded out-of-order data processing must be decoupled into four distinct questions: what is computed, where in event time it is windowed, when in processing time it is materialized, and how results relate.
2. Primary problem solved: Replaces fragile, dual-codebase Lambda Architectures by providing unified, strongly consistent, and low-latency processing over unbounded, unordered data streams.
3. Architectural posture: Unified dataflow pipeline model backed by replayable source logs, deterministic state checkpointing, and temporal progress metrics.
4. Primary tradeoff: Accepts increased state tracking storage overhead and complex retraction semantics in exchange for absolute processing correctness, low latency, and event-time accuracy.
5. Definition of success: A single streaming codebase that produces accurate, windowed, and eventually complete results regardless of network delay, out-of-order delivery, or worker crash retries.
6. Definition of failure: Data loss or double-counting from non-idempotent retries, silent dropping of un-windowed late events, or reliance on unreliable processing-time clocks for event-time business logic.
7. Preferred abstraction level: Declarative pipeline transformations operating on immutable event streams and materialized state tables (`PCollection` and `PTransform` abstractions).
8. Attitude toward state: State is an essential first-class primitive in stream processing that must be persistently checkpointed, key-partitioned, and garbage-collected via explicit allowed lateness bounds.
9. Attitude toward schema/contracts: Event schemas and record payload structures must be explicitly defined and held stable across shuffle boundaries to preserve deterministic replay and deduplication.
10. Operational expectation: Continuous, fault-tolerant execution where machine crashes trigger automatic state rollbacks or deduplicated shuffle retries without human intervention.

## 4. Source-backed structure
- Theme 1: Foundations of Streaming and Time Domains
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 1. Streaming 101
  - Spirit locator: Establishes the distinction between event time and processing time, demonstrating that modern streaming engines with strong consistency can supersede legacy batch engines and Lambda Architectures.
- Theme 2: The Core Beam Model Framework (What, Where, When, How)
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 2. The What, Where, When, and How of Data Processing
  - Spirit locator: Unbundles data processing into four distinct dimensions: transformations (what), event-time windowing (where), trigger materialization with watermarks (when), and accumulation modes (how).
- Theme 3: Watermarks and Temporal Progress Tracking
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 3. Watermarks
  - Spirit locator: Formalizes watermarks as monotonically increasing metrics of input completeness, tracing source creation, stage propagation, and percentile/processing-time variants.
- Theme 4: Advanced Windowing, Triggers, and Sessions
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 4. Advanced Windowing
  - Spirit locator: Explores dynamic session window merging, processing-time windowing via ingress time, and custom window assignment strategies.
- Theme 5: End-to-End Exactly-Once Semantics and Side Effects
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 5. Exactly-Once and Side Effects
  - Spirit locator: Details mechanisms for exactly-once shuffle deduplication, Bloom filter memory optimization, deterministic checkpointing, and idempotent side-effect sinks.
- Theme 6: General Theory of Stream and Table Relativity
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 6. Streams and Tables
  - Spirit locator: Synthesizes stream/table duality into a comprehensive theory where tables represent data at rest (grouping) and streams represent data in motion (ungrouping triggers).
- Theme 7: Persistent State and Timers
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 7. The Practicalities of Persistent State
  - Spirit locator: Defines key-scoped state abstractions (`ValueState`, `BagState`) and event-time timers to enable flexible stateful calculations like advertising conversion attribution.
- Theme 8: Streaming SQL and Time-Varying Relations
  - Source: Streaming Systems- The What, Where, When, and How.pdf
  - Structural locator: Chapter 8. Streaming SQL
  - Spirit locator: Extends relational algebra to time-varying relations (TVRs), defining stream/table selection keywords and SQL triggering extensions.

## 5. Source-backed spirit
1. What is the fundamental worldview of this source? All data processing can be unified under a single model where batch is merely a subset of streaming, and unbounded streams can be accurately processed by separating transformation logic from time semantics and state materialization.
2. What does this source consider the greatest architectural risk? Relying on processing time or best-effort streaming systems for event-time business logic, or deploying dual-codebase Lambda Architectures that introduce inconsistency, maintenance friction, and delayed correctness.
3. How does this source view centralized vs decentralized control? Centralize temporal progress metrics (watermarks) and execution graph management, but decentralize state processing across key-partitioned worker nodes that maintain independent local state stores.
4. How does this source treat data ownership and state? State is a fundamental primitive tied strictly to keys and windows; it must be stored durably, updated atomically during pipeline processing, and garbage-collected once watermark progress exceeds allowed lateness horizons.
5. What is the source's attitude toward schema changes and evolution? Record structures and serialization contracts must remain deterministic across shuffle and checkpoint boundaries, ensuring that replayable sources and deduplication catalogs can correctly identify duplicate payloads.
6. How should failures be handled according to this source? Systems must implement strongly consistent checkpointing, upstream backup retries, and receiver deduplication so that worker failures trigger transparent recovery without record loss or double counting.

## 6. Key concepts
1. Event Time versus Processing Time
   - Definition: Event time is the time at which an event actually occurred on the client/source device; processing time is the clock time at which the processing engine observes the event.
   - Why it matters: Real-world network delays and offline client caching create variable event-time skew, making processing time unreliable for event-timestamped business logic like billing or sessions.
   - Related concepts: Event-Time Skew, Processing-Time Lag, Ingress Timestamping.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
2. Watermark (Input and Output Watermark)
   - Definition: A monotonically increasing metric of input completeness in the event-time domain, asserting that no further events with timestamps earlier than time X will be observed.
   - Why it matters: Provides a principled mechanism for determining window completeness, allowing the engine to close windows, emit on-time panes, and detect late data.
   - Related concepts: Perfect Watermark, Heuristic Watermark, Watermark Lag, Output Timestamp.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
3. Triggers & Panes (Early, On-Time, Late Firings)
   - Definition: Declarative triggers specify when in processing time output results for a window are materialized as panes; firings are categorized as early (speculative), on-time (watermark completion), or late (late data updates).
   - Why it matters: Solves the latency vs. correctness dilemma by emitting rapid speculative results before window completion while still finalizing exact outputs once the watermark advances.
   - Related concepts: Repeated Update Triggers, Watermark Triggers, Panes, Speculative Results.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
4. Accumulation Modes (Discarding, Accumulating, Retracting)
   - Definition: Specifies how multiple materialized output panes for the same window relate: discarding drops state after firing, accumulating retains state to emit updated totals, and accumulating & retracting emits explicit retractions for prior outputs alongside new values.
   - Why it matters: Allows downstream sinks or services to correctly incorporate updated window results, especially when downstream stores require deltas or explicit key deletions.
   - Related concepts: Retractions, Delta Mode, Revisions, Dynamic Window Merging.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
5. Exactly-Once Shuffle Deduplication
   - Definition: An engine mechanism that tags every shuffled record with a unique identifier and checks an in-memory or disk-backed catalog (accelerated by time-bounded Bloom filters) to drop duplicate records sent via upstream retries.
   - Why it matters: Guarantees that network retries or worker crashes never cause record duplication or distorted aggregation statistics.
   - Related concepts: Upstream Backup, Bloom Filters, Catalog Garbage Collection, Deterministic Checkpointing.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
6. General Theory of Stream and Table Relativity
   - Definition: The fundamental duality where tables represent data at rest (resulting from grouping operations) and streams represent data in motion (resulting from ungrouping trigger operations).
   - Why it matters: Unifies relational database concepts, MapReduce batch jobs, and real-time streaming topologies into a single coherent framework.
   - Related concepts: Time-Varying Relations (TVRs), Grouping Operations, Ungrouping Operations, Materialized Views.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed
7. Allowed Lateness & State Garbage Collection
   - Definition: A configurable event-time duration defining how long after the watermark passes a window's end the engine must retain window state to accept late-arriving events.
   - Why it matters: Prevents infinite disk/memory growth in long-running streaming pipelines by bounding state retention and establishing an explicit horizon for dropping late records.
   - Related concepts: Window Expiry, State GC, Late Data Dropping, Horizon.
   - Citation: Streaming Systems- The What, Where, When, and How.pdf
   - Verification status: source-backed

## 7. Practical patterns and examples
1. Early / On-Time / Late Triggering Pattern
   - Problem solved: Eliminates output latency for long windows while maintaining correctness in the presence of heuristic watermark delays and late-arriving records.
   - Recommended approach: Configure windows with an `AfterWatermark()` trigger combined with periodic early firings (e.g., aligned processing-time delay) and per-record late firings bounded by allowed lateness.
   - Repository-level manifestation: Pipeline Java/Python code specifying `.triggering(AfterWatermark().withEarlyFirings(...).withLateFirings(...)).withAllowedLateness(...)`.
   - Limitations: Increases output messaging volume downstream due to multiple speculative and late pane firings.
   - Source citation: Streaming Systems- The What, Where, When, and How.pdf
2. Two-Phase Reshuffle for Non-Idempotent External Sinks
   - Problem solved: Prevents duplicate side effects or partial output writes when executing non-idempotent operations (such as external HTTP API calls or database inserts) during worker retries.
   - Recommended approach: Insert a `Reshuffle` transform (or `@RequiresStableInput` annotation) between the stateful processing transform and the side-effect sink transform to enforce a deterministic barrier.
   - Repository-level manifestation: Pipeline code applying `Reshuffle.of()` prior to sink invocation, or annotated custom `DoFn` classes with `@RequiresStableInput`.
   - Limitations: Introduces a shuffle stage serialization boundary, incurring minor I/O overhead.
   - Source citation: Streaming Systems- The What, Where, When, and How.pdf
3. Dynamic Session Merging with Retractions
   - Problem solved: Accurately tracks user activity session windows across out-of-order event streams where new records bridge previously separate session windows.
   - Recommended approach: Utilize session windowing with `accumulatingAndRetractingFiredPanes()` mode to automatically merge overlapping proto-sessions and emit explicit undo/retraction records for old session keys.
   - Repository-level manifestation: Stream processing code configuring `.apply(Window.into(Sessions.withGapDuration(...)).accumulatingAndRetractingFiredPanes())`.
   - Limitations: Downstream storage systems must be capable of processing retraction/tombstone records to delete previous state entries.
   - Source citation: Streaming Systems- The What, Where, When, and How.pdf

## 8. Common failure modes and risks
1. Missing Allowed Lateness Leading to Unbounded Memory Growth
   - Why it happens: Developers instantiate stateful event-time windows on unbounded streams without configuring an explicit allowed lateness or state GC horizon.
   - Early warning signs: Out-of-memory errors on streaming worker nodes, monotonically increasing disk usage for local state stores, and degraded checkpointing speeds.
   - Repository evidence: Window definitions in pipeline code using custom or heuristic triggers without invoking `.withAllowedLateness(...)` or setting global state expiry.
   - Severity tendency: critical
2. Non-Idempotent Side Effects in Sink Transforms
   - Why it happens: Side-effect code (e.g., direct REST calls, email notifications, database appends) is executed inside `DoFn` transforms without idempotent key deduplication or stable input reshuffling.
   - Early warning signs: Duplicate records in external databases, repeated third-party API invocations during worker crash recoveries, and inconsistent downstream counts.
   - Repository evidence: `DoFn` implementation classes making external un-checkpointed network writes without `@RequiresStableInput` or preceding `Reshuffle` steps.
   - Severity tendency: critical
3. Unintended Late Data Loss from Overly Aggressive Watermarks
   - Why it happens: Heuristic source watermark algorithms advance too quickly due to misconfigured estimation bounds, misclassifying valid out-of-order events as late data.
   - Early warning signs: Spikes in dropped-data metrics (`droppedDueToLateness`), unexpected zero counts in window aggregations, and disparity between batch and streaming run outputs.
   - Repository evidence: Custom source watermark generator configurations setting zero estimation bands or tight out-of-order delays on unpredictable network sources.
   - Severity tendency: error
4. Silent Processing-Time Fallback for Event-Time Business Logic
   - Why it happens: Developers default to processing-time windowing or system ingress time for business metrics that strictly depend on event timestamps.
   - Early warning signs: Window aggregation metrics fluctuating wildly based on network congestion or batch ingestion schedules rather than actual user activity.
   - Repository evidence: Code explicitly using `ProcessingTime.now()` or setting global processing-time windowing triggers for time-sensitive domain calculations.
   - Severity tendency: error

## 9. Repository-audit translation
### Static checks (automated)
- Audit pipeline source code for event-time window definitions and verify that `withAllowedLateness(...)` is explicitly configured on unbounded stream sources.
- Verify that custom sink transforms making external RPCs/writes utilize `Reshuffle` or carry the `@RequiresStableInput` annotation.
- Scan pipeline configuration manifests for explicit checkpointing interval settings (`enableCheckpointing`, `checkpointInterval`) and state backend persistence parameters.
- Inspect source connector definitions to ensure watermark estimation bands and out-of-order thresholds are set in configuration properties.
- Check build definitions and pipeline options classes for required serializable schema and coder registrations on custom PCollection payloads.

### Human review (contextual)
- Evaluate whether business domain window choices (e.g., fixed vs. sliding vs. sessions) correctly reflect user activity patterns.
- Review downstream database compatibility with retraction records when choosing `accumulatingAndRetractingFiredPanes()` mode.
- Assess operational runbooks for handling sustained upstream pipeline backpressure and dead-letter queue (DLQ) processing.
- Validate trade-offs between trigger firing frequency, speculative update latency, and downstream system throughput cost.

## 10. Candidate rules
- Rule ID: dataops-watermark-001
- Title: Event-Time Window Allowed Lateness Enforcer
- Profile: dataops
- Severity tendency: critical
- Rationale: Unbounded event-time windows without explicit allowed lateness bounds retain state indefinitely, leading to worker memory exhaustion and pipeline crashes.
- Source-backed basis: Streaming Systems emphasizes that real-world out-of-order processing systems must define an explicit allowed lateness horizon to bound window lifetimes and garbage-collect persistent state.
- Repository evidence to inspect: Stream processing pipeline source files (`.java`, `.py`, `.scala`) defining event-time windowing transforms (`Window.into(...)`).
- Pass condition: Windowing pipeline code explicitly calls `withAllowedLateness` or specifies a valid bounded lateness duration.
- Fail condition: Windowing transform is defined on an unbounded stream without configuring allowed lateness or state expiry parameters.
- Exceptions or limitations: Applies to stateful event-time windowing pipelines operating on unbounded input streams.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Streaming Systems- The What, Where, When, and How.pdf
- Source: Streaming Systems- The What, Where, When, and How.pdf
- Structural locator: Chapter 2. The What, Where, When, and How of Data Processing
- Spirit locator: Bounding allowed lateness establishes a clear horizon for state garbage collection, preventing infinite memory usage in long-running pipelines.
- Verification status: source-backed

- Rule ID: dataops-sink-001
- Title: Stable Input Enforcer for Non-Idempotent Side-Effect Sinks
- Profile: dataops
- Severity tendency: critical
- Rationale: Executing non-idempotent side effects during pipeline transforms without a stable input barrier causes duplicate operations during worker retries.
- Source-backed basis: Streaming Systems specifies that side-effect transforms must be protected by a `Reshuffle` stage or `@RequiresStableInput` annotation to ensure input stability across retries.
- Repository evidence to inspect: Custom sink DoFn classes and pipeline transformation chains.
- Pass condition: Sink DoFn classes making external calls are annotated with `@RequiresStableInput` or preceded by a `Reshuffle.of()` transform.
- Fail condition: Custom sink DoFn executes external writes without stable input annotations or shuffle barriers.
- Exceptions or limitations: Applies to custom non-idempotent side-effect sinks in stream processing codebases.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Streaming Systems- The What, Where, When, and How.pdf
- Source: Streaming Systems- The What, Where, When, and How.pdf
- Structural locator: Chapter 5. Exactly-Once and Side Effects
- Spirit locator: Stable input barriers prevent non-deterministic user code from generating duplicate external side effects during retry attempts.
- Verification status: source-backed

- Rule ID: dataops-checkpoint-001
- Title: Streaming Pipeline Checkpoint Interval Configuration
- Profile: dataops
- Severity tendency: error
- Rationale: Unbounded streaming jobs running without active checkpointing cannot guarantee fault tolerance or state recovery during worker failure.
- Source-backed basis: Streaming Systems highlights that strong consistency and exactly-once processing rely on periodic, durable state checkpointing.
- Repository evidence to inspect: Pipeline configuration files (`application.properties`, `application.yml`, pipeline options source code).
- Pass condition: Pipeline execution options explicitly enable state checkpointing and specify a positive checkpointing interval.
- Fail condition: Streaming pipeline options explicitly disable checkpointing or omit checkpointing configuration for stateful jobs.
- Exceptions or limitations: Applies to streaming job configuration files and execution runner option setup.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Streaming Systems- The What, Where, When, and How.pdf
- Source: Streaming Systems- The What, Where, When, and How.pdf
- Structural locator: Chapter 1. Streaming 101
- Spirit locator: Consistent checkpointing of persistent state is a fundamental prerequisite for correctness and failure recovery in streaming systems.
- Verification status: source-backed

- Rule ID: dataops-trigger-001
- Title: Retraction Mode Verification for Session Windows
- Profile: dataops
- Severity tendency: warning
- Rationale: Merging session windows without retraction support causes stale session entries to remain in downstream state stores.
- Source-backed basis: Streaming Systems notes that merging dynamic session windows requires `accumulatingAndRetractingFiredPanes()` to emit explicit retractions for superseded sessions.
- Repository evidence to inspect: Session window definition code and accumulation mode settings.
- Pass condition: Session window definition includes retraction accumulation mode when output is written to key-value sinks.
- Fail condition: Session windowing uses simple accumulation without retractions when writing to downstream key-value stores.
- Exceptions or limitations: Requires semantic analysis of downstream sink types.
- YAML readiness: needs-review
- Reason if not ready: Validating compatibility between accumulation mode and downstream sink type requires semantic dataflow graph analysis beyond simple regex checks.
- Source citation: Streaming Systems- The What, Where, When, and How.pdf
- Source: Streaming Systems- The What, Where, When, and How.pdf
- Structural locator: Chapter 4. Advanced Windowing
- Spirit locator: Explicit retractions allow downstream stores to erase superseded session records when dynamic windows merge.
- Verification status: source-backed

- Rule ID: dataops-watermark-lag-001
- Title: Pub/Sub Source Estimation Band Configuration
- Profile: dataops
- Severity tendency: warning
- Rationale: Setting an estimation band of zero on out-of-order Pub/Sub streams causes premature watermark advancement and excessive late data dropping.
- Source-backed basis: Streaming Systems details how source watermarks for Pub/Sub require an adequate estimation band (e.g., 10 seconds) to account for out-of-order arrival without discarding data.
- Repository evidence to inspect: Source reader configuration properties and Pub/Sub watermark setup code.
- Pass condition: Source watermark properties set a non-zero estimation band duration for out-of-order stream readers.
- Fail condition: Source watermark configuration sets an estimation band of zero on non-strictly-ordered stream sources.
- Exceptions or limitations: Applies to Pub/Sub source reader configuration.
- YAML readiness: blocked
- Reason if not ready: Current static validator lacks property graph capabilities to differentiate ordered versus out-of-order source topic topologies.
- Source citation: Streaming Systems- The What, Where, When, and How.pdf
- Source: Streaming Systems- The What, Where, When, and How.pdf
- Structural locator: Chapter 3. Watermarks
- Spirit locator: Source estimation bands provide a necessary safety margin for heuristic watermarks to accommodate out-of-order events.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: dataops-watermark-001
    profile: dataops
    severity: critical
    message: "Event-time windowing transform missing explicit allowed lateness configuration for state garbage collection."
    references:
      - book: "Streaming Systems"
        concept: "allowed-lateness"
    check:
      type: pattern_match
      file_glob: "**/*Pipeline*.java"
      pattern: 'withAllowedLateness|allowed_lateness'
      must_exist: true
      error_when: pattern_absent
      message: "Pipeline windowing transform does not specify withAllowedLateness."

  - id: dataops-sink-001
    profile: dataops
    severity: critical
    message: "Side-effect sink transform missing @RequiresStableInput annotation or Reshuffle barrier."
    references:
      - book: "Streaming Systems"
        concept: "stable-input-sink"
    check:
      type: pattern_match
      file_glob: "**/*Sink*.java"
      pattern: '@RequiresStableInput|Reshuffle'
      must_exist: true
      error_when: pattern_absent
      message: "Custom sink DoFn lacks @RequiresStableInput or Reshuffle barrier."

  - id: dataops-checkpoint-001
    profile: dataops
    severity: error
    message: "Streaming job configuration missing active state checkpointing setup."
    references:
      - book: "Streaming Systems"
        concept: "checkpointing"
    check:
      type: pattern_match
      file_glob: "**/application*.yml"
      pattern: 'enableCheckpointing:\s*true|checkpointInterval'
      must_exist: true
      error_when: pattern_absent
      message: "Streaming application configuration does not enable state checkpointing."
```

### Candidates not emitted
- dataops-trigger-001: Marked `needs-review`. Reason: Validating compatibility between accumulation mode and downstream sink type requires semantic dataflow graph analysis beyond simple regex checks.
- dataops-watermark-lag-001: Marked `blocked`. Reason: Current static validator lacks property graph capabilities to differentiate ordered versus out-of-order source topic topologies.

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


## References

<!-- ref: TODO -->

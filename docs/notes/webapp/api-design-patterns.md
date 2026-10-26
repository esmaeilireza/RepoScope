# RepoScope Knowledge Note: API Design Patterns

## 1. Source identity

- **Title:** API Design Patterns
- **Author(s):** JJ Geewax
- **Branch:** webapp
- **RepoScope profile:** webapp
- **Primary source file:** API Design Patterns.pdf
- **Note status:** reviewed-with-candidate-rules

## 2. Scope
- In scope: Resource identification, naming conventions, standard method definitions, field mask structures for partial updates/retrievals, custom methods, request validation, and idempotent operation handling.
- In scope: Contract definitions, schema declarations, error payload standardization, and request deduplication patterns.
- In scope: Long-running operation metadata definitions, batch request syntax, and filtering/pagination parameter formats.
- In scope: Deprecation signaling and revision tracking in web application API surfaces.
- Out of scope: Database storage engine optimization and SQL indexing strategies.
- Out of scope: Network infrastructure routing, firewall rule configurations, and load balancer IP allocation.
- Out of scope: Organizational developer hiring, API team staffing models, and sales pricing strategies.

## 3. Source spirit card
1. Core thesis: Predictable, resource-oriented web APIs are built on standardized behavioral primitives, explicit schemas, and strict operational invariants rather than ad-hoc remote procedure calls.
2. Architectural stance: The API boundary is a immutable public contract that must isolate internal domain models from external consumer representations.
3. Primary trade-off embraced: Accepting additional structural boilerplate and interface verbosity in exchange for strict backward compatibility, clear client expectations, and long-term maintainability.
4. Primary risk feared: Accidental breaking changes caused by uncoordinated payload mutations, implicit field modifications, or unversioned resource transformations.
5. Definition of quality: Consistency across resource names, predictable response schemas, deterministic error structures, and strict adherence to HTTP method semantics.
6. View on automation: Automated validation of request parameters, contract schemas, and field masks is essential to prevent invalid state transitions before execution.
7. View on human process: API design reviews must evaluate resource hierarchy and domain abstractions before code implementation begins.
8. Ideal repository posture: The repository contains explicit OpenAPI/JSON-Schema specifications, field mask helper definitions, and strict request validation rules checked during continuous integration.
9. Anti-pattern priority: Eliminating non-standard custom methods, deep resource hierarchies, and unpaginated collection endpoints.
10. Long-term lifecycle vision: APIs evolve gracefully through additive schema changes, explicit field masks, and revision-tracked resources without disrupting existing integrations.

## 4. Source-backed structure
### Theme 1: Resource Naming and Identification
- Source: API Design Patterns
- Structural locator: Chapter 3: Naming
- Spirit locator: Resource identifiers and field names must be explicit, human-readable, and unambiguous, incorporating physical units directly into field identifiers to prevent misinterpretation.

### Theme 2: Standard Methods and Partial Operations
- Source: API Design Patterns
- Structural locator: Chapter 7: Standard methods
- Spirit locator: Core CRUD operations must strictly map to standard methods, using query-based field masks for partial retrievals and updates rather than full object replacements.

### Theme 3: Custom Methods and Long-Running Operations
- Source: API Design Patterns
- Structural locator: Chapter 9: Custom methods
- Spirit locator: Specialized business logic that cannot fit standard CRUD operations must use custom methods separated by a colon, returning long-running operation handles for asynchronous execution.

### Theme 4: Request Validation and Safety
- Source: API Design Patterns
- Structural locator: Chapter 27: Request validation
- Spirit locator: High-risk operations must support dry-run validation flags allowing clients to verify request correctness without mutating server state.

## 5. Source-backed spirit
1. What does this source consider the most dangerous form of technical debt or architectural drift?
Uncoordinated schema changes and inconsistent resource representations that break client contracts and force emergency downstream refactoring.

2. How does this source balance automated verification against human judgment?
Automated tools must strictly enforce structural contracts, field mask validation, and schema presence, while human review must assess domain modeling, resource scoping, and abstraction boundaries.

3. What is the source's stance on standardization versus local autonomy?
Standardization across naming, error formats, and standard methods is non-negotiable across the entire engineering organization to ensure a unified developer experience.

4. What runtime or operational failure modes does the source trace back to repository-level static structure?
Missing pagination parameters cause memory exhaustion during large collection queries, and missing validation schemas allow malformed payloads to corrupt persistent storage.

5. What repository artifacts does the source treat as non-negotiable proof of health?
Machine-readable API specifications (OpenAPI/JSON Schema), deterministic route definitions, and automated contract test suites.

6. How does the source handle evolution, versioning, and change over time?
APIs must preserve backward compatibility by restricting changes to purely additive modifications and using resource revision metadata for historical tracking.

## 6. Key concepts
### Concept 1: Field Mask
- Definition: A list of string paths indicating specific fields to retrieve or modify in a resource payload.
- Why it matters: Enables partial updates and retrievals, drastically reducing network bandwidth and preventing race conditions during concurrent updates.
- Related concepts: Partial Updates, Implicit Field Mask, Read Mask.
- Citation: Chapter 8: Partial updates and retrievals
- Verification status: source-backed

### Concept 2: Resource Identifier
- Definition: A unique, permanent, and readable string that addresses a specific resource within an API layout.
- Why it matters: Provides permanent referencing across collections without exposing internal database auto-incrementing integers.
- Related concepts: Resource Layout, Hierarchy Scope, URI Path.
- Citation: Chapter 6: Resource identification
- Verification status: source-backed

### Concept 3: Custom Method
- Definition: An API method used for custom actions when standard CRUD methods do not fit the business domain, syntax-separated by a colon.
- Why it matters: Prevents overloading standard update or delete semantics with complex state machine side-effects.
- Related concepts: Standard Methods, Long-Running Operations, Imperative Actions.
- Citation: Chapter 9: Custom methods
- Verification status: source-backed

### Concept 4: Long-Running Operation (LRO)
- Definition: A handle returned by an API when a request cannot complete synchronously, tracking progress and status over time.
- Why it matters: Prevents HTTP connection timeouts and allows clients to poll or receive callbacks on lengthy background tasks.
- Related concepts: Asynchronous Processing, Operation Metadata, Polling.
- Citation: Chapter 10: Long-running operations
- Verification status: source-backed

### Concept 5: Request Validation (validateOnly)
- Definition: A boolean request parameter specifying that an API call should validate inputs without committing changes.
- Why it matters: Gives clients a safe preview mechanism to catch validation errors prior to execution.
- Related concepts: Dry Run, Idempotency, Input Sanitization.
- Citation: Chapter 27: Request validation
- Verification status: source-backed

### Concept 6: Resource Revisions
- Definition: Immutable snapshots of a resource stored over time, referenced with a revision identifier.
- Why it matters: Allows auditing historical changes, restoring previous states, and managing document versions cleanly.
- Related concepts: Soft Delete, Audit Logs, Time Travel.
- Citation: Chapter 28: Resource revisions
- Verification status: source-backed

## 7. Practical patterns and examples
### Pattern 1: Partial Update with Field Masks
- Problem solved: Overwriting concurrent modifications when updating specific fields of a complex resource.
- Recommended approach: Pass a string array of modified field paths alongside the resource payload in PATCH requests.
- Repository-level manifestation: Route definitions and controller signatures taking explicit field mask parameters or inferring them from JSON keys.
- Limitations: Cannot update items inside repeated array fields by positional index.
- Source citation: Chapter 8: Partial updates and retrievals

### Pattern 2: Explicit Naming with Units
- Problem solved: Misinterpretation of numerical fields (e.g., duration or file size) leading to incorrect calculations.
- Recommended approach: Append exact unit suffixes to field names (e.g., `sizeBytes`, `timeoutSeconds`, `dimensionsPixels`).
- Repository-level manifestation: Interface definitions and database schemas using explicit unit-suffixed property names.
- Limitations: Requires disciplined code reviews to prevent brief non-suffixed name additions.
- Source citation: Chapter 3: Naming

### Pattern 3: Dry-Run Request Validation
- Problem solved: Accidental execution of destructive or irreversible custom operations due to malformed payloads.
- Recommended approach: Support a `validateOnly` field in request schemas to execute validation logic without side effects.
- Repository-level manifestation: Request schema interfaces including `validateOnly?: boolean`.
- Limitations: Backend logic must explicitly guard state-mutating code paths when `validateOnly` is true.
- Source citation: Chapter 27: Request validation

## 8. Common failure modes and risks
### Failure Mode 1: Unpaginated Collection Endpoint
- Why it happens: Developers query database tables directly and return all rows in a single JSON response array.
- Early warning signs: High memory usage on GET collection endpoints as database row counts grow.
- Repository evidence: Collection handlers lacking `pageSize` and `pageToken` parameters in OpenAPI specs or route controllers.
- Severity tendency: critical

### Failure Mode 2: Overloading Standard UPDATE with Side Effects
- Why it happens: Coupling external side-effects (e.g. sending emails or triggering external builds) directly into standard REST update calls.
- Early warning signs: Unpredictable API updates and unexpected background jobs running during bulk data Syncs.
- Repository evidence: Update request handlers calling third-party notification or external queue services.
- Severity tendency: error

### Failure Mode 3: Missing Field Units in API Payload Schemas
- Why it happens: Using generic field names like `size` or `duration` without defining whether units represent bytes, seconds, or milliseconds.
- Early warning signs: Client-side bugs where values are scaled incorrectly by orders of magnitude.
- Repository evidence: Interface schemas containing numeric fields named `size` or `time` without unit suffixes.
- Severity tendency: warning

### Failure Mode 4: Destructive Replace Semantics on Partial Modification
- Why it happens: Using HTTP PUT to replace an entire resource when clients only intended to modify a single field.
- Early warning signs: Unintentional deletion of newly added resource fields when updated by older API clients.
- Repository evidence: Absence of PATCH endpoints or field mask handling logic in API route declarations.
- Severity tendency: error

## 9. Repository-audit translation
### Static checks (automated via RepoScope)
- Presence of an OpenAPI or JSON Schema specification file in repository docs or root.
- Absence of unversioned public API route declarations.
- Presence of package manifest and associated lockfile.
- Absence of hardcoded secret tokens in configuration or environment template files.

### Human review (contextual & strategic)
- Evaluation of domain model boundaries and resource layout hierarchy.
- Verification that custom methods are justified and cannot be modeled as standard methods.
- Assessment of field mask granularity and error handling semantics.
- Evaluation of rate-limiting policies and quota allocation strategy.

## 10. Candidate rules

- Rule ID: webapp-api-001
- Title: Missing API Specification File
- Profile: webapp
- Severity tendency: warning
- Rationale: Repositories providing web APIs must maintain an explicit OpenAPI or schema specification for contract auditing.
- Source-backed basis: The source emphasizes machine-readable API contracts to guarantee predictable response shapes.
- Repository evidence to inspect: Absence of `openapi.json`, `openapi.yaml`, or `swagger.json` in the codebase.
- Pass condition: At least one API specification file exists in the repository.
- Fail condition: No API specification file is present in the repository.
- Exceptions or limitations: Repositories that do not expose public HTTP endpoints.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Chapter 5: Design in Practice
- Source: API Design Patterns
- Structural locator: Chapter 5: Design in Practice
- Spirit locator: API schemas must be formally defined to ensure predictable client consumption.
- Verification status: source-backed

- Rule ID: webapp-api-002
- Title: Absence of Validation Parameter in High-Risk API Schema
- Profile: webapp
- Severity tendency: info
- Rationale: High-risk state-mutating requests should support preview validation via a `validateOnly` field.
- Source-backed basis: The source specifies dry-run request validation patterns for safe operation previews.
- Repository evidence to inspect: Route controllers or schema files matching request parameters for `validateOnly`.
- Pass condition: Route schemas or request interfaces include `validateOnly` pattern match.
- Fail condition: Request interfaces omit `validateOnly` validation flags.
- Exceptions or limitations: Cannot verify runtime execution logic using static regex.
- YAML readiness: needs-review
- Reason if not ready: Requires AST parsing of route schemas to reliably identify high-risk state-mutating handlers.
- Source citation: Chapter 27: Request validation
- Source: API Design Patterns
- Structural locator: Chapter 27: Request validation
- Spirit locator: Validation preview parameters protect clients from accidental side effects.
- Verification status: source-backed

- Rule ID: webapp-api-003
- Title: Incorrect Architectural Domain Boundary Placement
- Profile: webapp
- Severity tendency: error
- Rationale: Service boundaries must align cleanly with bounded contexts rather than arbitrary database tables.
- Source-backed basis: The source cautions against making every internal database table an exposed public resource.
- Repository evidence to inspect: Domain service boundaries and controller layouts.
- Pass condition: Service boundaries reflect domain contexts.
- Fail condition: Microservices mirror database schemas 1-to-1.
- Exceptions or limitations: Cannot be statically verified without domain modeling context.
- YAML readiness: blocked
- Reason if not ready: Requires high-level human architectural judgment and organizational domain knowledge.
- Source citation: Chapter 4: Resource scope and hierarchy
- Source: API Design Patterns
- Structural locator: Chapter 4: Resource scope and hierarchy
- Spirit locator: Resource boundaries must reflect functional abstractions rather than raw database schemas.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
version: "1"
profile: webapp
rules:
  - id: webapp-api-001
    severity: warning
    checks:
      - type: file_exists
        file_glob: "{openapi.json,openapi.yaml,swagger.json,docs/openapi.yaml}"
        error_when: file_absent
        message: "Repository exposes web endpoints but lacks an explicit OpenAPI or Swagger contract specification file."
    references:
      - book: "API Design Patterns"
        concept: "api-specification"
```

### Candidates not emitted
- webapp-api-002: Needs AST or schema parser to identify high-risk endpoints without false positives; marked needs-review.
- webapp-api-003: Evaluates domain boundary modeling which requires human architectural judgment; marked blocked.

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

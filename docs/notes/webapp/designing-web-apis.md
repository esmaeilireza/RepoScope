# RepoScope Knowledge Note: Designing Web APIs

## 1. Source identity

- **Title:** Designing Web APIs: Building APIs That Developers Love
- **Author(s):** Brenda Jin, Saurabh Sahni, Amir Shevat
- **Branch:** webapp
- **RepoScope profile:** webapp
- **Primary source file:** Designing Web APIs_ Building APIs That Developers Love.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
* **In-Scope**:
  * API paradigm evaluation (REST, RPC, GraphQL, WebHooks, WebSockets).
  * HTTP method semantics, URL design, and status code standardization.
  * API Security: OAuth 2.0 framework, HMAC signature validation for WebHooks, and rate limiting.
  * API design workflows, OpenAPI/Swagger specification definitions, and developer documentation.
  * Change management, API versioning strategies, and deprecation lifecycles.
* **Out-of-Scope**:
  * Lower-level network protocol details (e.g., TCP/IP packet optimization, TLS handshake cipher suites).
  * Vendor-specific cloud infrastructure setup (e.g., AWS API Gateway specific IAM policies).
  * Database schema indexing and query tuning internals behind API handlers.

---

## 3. Source Spirit Card
1. **Core Architectural Thesis**: Web APIs are primary developer products; their design must prioritize clarity, predictability, security, and developer experience to drive platform adoption and maintain long-term stability.
2. **Primary Optimization Objective**: Minimize integration friction and developer cognitive load while ensuring backward compatibility and operational resilience.
3. **Primary System Quality Attribute**: Predictability and Usability (Developer Experience).
4. **Primary Failure Metric**: Breaking API changes that silently corrupt client integrations or unhandled rate limits leading to cascading system outages.
5. **Architectural Style / Paradigm**: Pragmatic Resource-Oriented REST, Event-Driven WebHooks, and Structured RPC/GraphQL where appropriate.
6. **Coupling Philosophy**: Loose coupling through strict adherence to standardized HTTP protocols, open API specifications, and explicit scope-based authorization.
7. **Change Management Principle**: Non-breaking additive changes preferred; explicit URL or header versioning for breaking structural shifts with deprecation headers.
8. **Security Stance**: Defense-in-depth with centralized OAuth 2.0 access tokens, cryptographic WebHook signatures, and strict per-client rate limiting.
9. **Observability Approach**: Comprehensive API usage logging, rate-limit header exposure, and centralized API documentation portals.
10. **Trade-off Philosophy**: Prefer standardized consistency and explicit contracts over clever, bespoke protocol optimizations.

---

## 4. Source-Backed Structure
The core themes established throughout the text include:

1. **API Paradigms and Protocol Selection**: Evaluating REST, RPC, GraphQL, WebHooks, and WebSockets based on communication patterns, payload efficiency, and event handling requirements.
2. **Resource Design and URL Hierarchy**: Structuring intuitive endpoint hierarchies, mapping business domain entities to plural nouns, and standardizing HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
3. **API Security and Access Control**: Implementing token-based authentication (OAuth 2.0), granular scopes, rate limiting counters, and HMAC request validation.
4. **API Lifecycle, Specifications, and Documentation**: Establishing machine-readable API contracts (OpenAPI/Swagger), mocking endpoints, versioning models, and managing deprecation timelines.

---

## 5. Source-Backed Spirit
1. **What is the central problem this source attempts to solve?**
   * The proliferation of ad-hoc, inconsistent, and poorly documented HTTP endpoints that cause integration bugs, break consumer applications during updates, and introduce security vulnerabilities.
2. **How does this source define architectural success?**
   * Success is an API that developers can integrate intuitively without reading long documentation, backed by explicit machine-readable specifications, robust rate limiting, and zero unannounced breaking changes.
3. **What trade-offs does this source explicitly advocate?**
   * Prefers protocol standardization (e.g., OpenAPI specs, OAuth 2.0) over custom internal frameworks, even if custom frameworks appear faster to build initially.
4. **What practices does this source consider fundamentally harmful?**
   * Introducing breaking schema shifts on existing endpoints without versioning, relying on undocumented side effects, and failing to sign outgoing WebHook payloads.
5. **How should systems evolve over time according to this source?**
   * Evolve additively by introducing optional fields and new endpoints. When breaking changes are unavoidable, introduce a new API version path and run deprecation windows with HTTP warnings.
6. **What is the source's attitude toward developer ergonomics vs. operational convenience?**
   * Developer ergonomics take precedence in contract design; the internal server implementation must adapt to provide a clean, predictable API surface for the client.

---

## 6. Key Concepts
1. **OpenAPI Specification (OAS)**:
   * *Definition*: A vendor-neutral, machine-readable format (YAML/JSON) for describing RESTful APIs, enabling automated documentation, client SDK generation, and mock servers.
   * *Manifestation*: Central spec file (e.g., `openapi.yaml`) stored in the repository root or contract directory.
2. **OAuth 2.0 Scopes**:
   * *Definition*: Fine-grained access permissions attached to OAuth access tokens that restrict a client's access to specific API endpoints or resources.
   * *Manifestation*: Authorization middleware validating `scope` claims on HTTP request context (e.g., `read:users`, `write:orders`).
3. **HMAC WebHook Signatures**:
   * *Definition*: A cryptographic message authentication code computed using a shared secret and request payload to ensure WebHook authenticity and integrity.
   * *Manifestation*: Request headers containing SHA-256 signatures (e.g., `X-Signature-256`) verified by client receiver endpoints.
4. **Rate Limiting and Throttling**:
   * *Definition*: Mechanism to control the rate of incoming API traffic per client key or IP address to prevent service abuse and denial-of-service conditions.
   * *Manifestation*: Middleware exposing standard response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) and returning status `429 Too Many Requests`.
5. **Idempotency Keys**:
   * *Definition*: Unique headers passed with non-idempotent HTTP requests (`POST`) allowing servers to recognize duplicate operations safely without repeating execution.
   * *Manifestation*: Middleware checking `Idempotency-Key` headers against a distributed key-value store before handler invocation.
6. **API Versioning Strategies**:
   * *Definition*: Explicit mechanisms (URL path `/v1/`, custom media types, or headers) used to route clients to specific API schema versions.
   * *Manifestation*: Versioned router mounts or controller directory structures (`/api/v1/`, `/api/v2/`).

---

## 7. Practical Patterns and Examples
1. **Standardized Resource Endpoint Hierarchy**:
   * *Description*: Modeling domain resources with plural nouns and nesting child resources logically while limiting URI nesting depth to at most two levels.
   * *Example Pattern*:
     * `GET /v1/organizations` (List organizations)
     * `POST /v1/organizations` (Create organization)
     * `GET /v1/organizations/{org_id}/members` (List members within an organization)
2. **WebHook Delivery with Exponential Backoff**:
   * *Description*: Retrying failed outgoing WebHook deliveries with exponential backoff delays and cryptographic signature headers.
   * *Example Pattern*:
     * WebHook payloads include `X-Hub-Signature-256: sha256=<hmac_hex>`.
     * Worker queue retries failed `5xx` deliveries at intervals: 10s, 30s, 2m, 10m, 1h.
3. **Deprecation Header and Sunsetting Pattern**:
   * *Description*: Communicating upcoming endpoint deprecation using standard HTTP headers without immediately disabling the endpoint.
   * *Example Pattern*:
     * HTTP response headers include `Deprecation: true` and `Sunset: Wed, 11 Nov 2026 00:00:00 GMT`.

---

## 8. Common Failure Modes and Risks
1. **Breaking Schema Changes in Minor Releases**:
   * *Risk*: Removing fields, changing data types, or adding required request parameters to existing endpoints breaks existing client applications.
   * *Impact*: High client outage risk and damaged API reputation.
2. **Missing Rate Limiting**:
   * *Risk*: Endpoints exposed to the internet without request counters are vulnerable to brute-force attacks and resource exhaustion.
   * *Impact*: Service instability and unexpected infrastructure cost spikes.
3. **Unsigned WebHook Callbacks**:
   * *Risk*: Sending WebHook events without HMAC signatures allows attackers to spoof events and trigger unauthorized actions in client applications.
   * *Impact*: Severe security vulnerabilities in downstream integrated systems.
4. **Monolithic Undocumented Endpoints**:
   * *Risk*: Building ad-hoc endpoints without an OpenAPI spec leads to drift between server code, SDKs, and developer documentation.
   * *Impact*: Increased integration friction, developer frustration, and high support overhead.

---

## 9. Repository-Audit Translation

### Static Checks
* **OpenAPI Spec Presence**: Verify the existence of `openapi.yaml` or `swagger.json` in contract or repository root directories.
* **Route Path Structure**: Audit API router definition files for explicit versioning prefixes (e.g., `/v1/` or `/v2/`).
* **Rate Limiting Middleware Registration**: Inspect HTTP router setup files to confirm rate limiting middleware is mounted on public routes.
* **WebHook Signature Handlers**: Check outgoing WebHook dispatch code for HMAC key signature calculation.

### Human Review
* **API Domain Model Ergonomics**: Evaluate whether URI resource names accurately reflect business domain concepts rather than underlying database table structures.
* **Error Message Usability**: Review API error response payloads to ensure they provide helpful human-readable guidance and machine-readable error codes without leaking system stack traces.
* **Granular Scope Design**: Assess whether OAuth scope definitions provide sufficient isolation between read, write, and administrative actions.

---

## 10. Candidate Rules

| Rule ID | Rule Description | Check Type | Target Artifacts | Status |
| :--- | :--- | :--- | :--- | :--- |
| `api_spec_file_exists` | Require an OpenAPI / Swagger specification file in the codebase. | `file_exists` | `openapi.yaml`, `openapi.json`, `swagger.yaml` | `ready` |
| `api_versioning_in_routes` | Require API route paths or controllers to include version prefix patterns. | `pattern_match` | `src/routes/**`, `src/controllers/**` | `ready` |
| `rate_limiting_middleware_present` | Ensure rate limiting middleware or annotations are configured on public HTTP endpoints. | `pattern_match` | `src/app.*`, `src/main.*`, `src/routes/**` | `ready` |
| `webhook_hmac_signing_present` | Require outgoing WebHook delivery code to compute and attach HMAC signatures. | `pattern_match` | `src/services/webhook*`, `src/jobs/webhook*` | `ready` |
| `no_raw_stacktrace_in_responses` | Prohibit printing raw exception stack traces in API response handlers. | `pattern_match` | `src/controllers/**`, `src/middleware/error.*` | `ready` |
| `oauth_scope_validation_check` | Verify that access tokens are validated for scope permissions in route handlers. | `pattern_match` | `src/middleware/auth.*`, `src/routes/**` | `needs-review` |

---

## 11. Suggested YAML Fragment

```yaml
rules:
  - id: api_spec_file_exists
    description: "Verify that an OpenAPI specification file exists in the repository."
    severity: "error"
    check:
      type: "file_exists"
      paths:
        - "openapi.yaml"
        - "openapi.json"
        - "swagger.yaml"
        - "docs/openapi.yaml"
        - "api/openapi.yaml"

  - id: api_versioning_in_routes
    description: "Ensure API endpoints incorporate explicit version prefixes (e.g., /v1/ or /v2/)."
    severity: "warning"
    check:
      type: "pattern_match"
      files:
        - "src/routes/**/*.js"
        - "src/routes/**/*.ts"
        - "src/controllers/**/*.go"
        - "src/api/**/*.py"
      pattern: "(/api/v[0-9]+|/v[0-9]+)"

  - id: rate_limiting_middleware_present
    description: "Ensure rate limiting middleware is mounted on public API route handlers."
    severity: "error"
    check:
      type: "pattern_match"
      files:
        - "src/app.ts"
        - "src/app.js"
        - "src/server.go"
        - "src/main.py"
      pattern: "(rateLimit|RateLimiter|throttle|ThrottleRequests)"

  - id: webhook_hmac_signing_present
    description: "Verify that WebHook dispatchers compute HMAC signatures for payload integrity."
    severity: "error"
    check:
      type: "pattern_match"
      files:
        - "src/**/*.ts"
        - "src/**/*.js"
        - "src/**/*.go"
        - "src/**/*.py"
      pattern: "(createHmac|hmac\.New|X-Signature|X-Hub-Signature)"

  - id: no_raw_stacktrace_in_responses
    description: "Prohibit returning raw internal error stack traces in API responses."
    severity: "error"
    check:
      type: "pattern_match"
      files:
        - "src/middleware/error.*"
        - "src/controllers/**/*"
      pattern: "(err\.stack|traceback\.format_exc|debug_backtrace)"
```

---

## 12. Handoff Checklist
* [x] **Source Identity**: Complete document title, authors, and publication metadata provided.
* [x] **Scope Boundaries**: In-scope topics and explicit out-of-scope technical bounds defined.
* [x] **Source Spirit Card**: All 10 mandatory spirit fields fully populated.
* [x] **Structure & Spirit**: 4 core structural themes and 6 fundamental spirit questions detailed without forbidden quotes or page locators.
* [x] **Concepts, Patterns & Failure Modes**: At least 6 key concepts, 3 practical patterns, and 4 failure modes fully defined.
* [x] **Audit Translation**: Clearly split into static automated checks and human contextual reviews.
* [x] **Candidate Rules & YAML**: Rules assigned readiness status, with only `ready` rules emitted into valid YAML using `file_exists`, `file_absent`, or `pattern_match`.


## References

<!-- ref: TODO -->

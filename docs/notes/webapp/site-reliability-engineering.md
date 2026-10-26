# RepoScope Knowledge Note: Site Reliability Engineering 

## 1. Source identity

- **Title:** Site Reliability Engineering: How Google Runs Production Systems
- **Author(s):** Betsy Beyer, Chris Jones, Jennifer Petoff, and Niall Richard Murphy
- **Branch:** webapp
- **RepoScope profile:** webapp
- **Primary source file:** Site Reliability Engineering_ How Google Runs Production Systems.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
This Knowledge Note distills the operational, architectural, and organizational principles of Site Reliability Engineering (SRE) as practiced at Google. It translates SRE philosophy—treating operational engineering as a software problem—into actionable repository-level static checks and human review guidelines. The scope encompasses service level management (SLIs, SLOs, Error Budgets), toil reduction through automation, distributed systems monitoring and alerting, emergency response, release engineering, and failure mode mitigation (circuit breaking, load shedding, cascading failure prevention).

---

## 3. Source Spirit Card
| Field | Value / Principle |
| :--- | :--- |
| **Target Architecture** | Highly Distributed, Scalable Service Ecosystems & Infrastructure Platforms |
| **Core Architectural Thesis** | SRE is what happens when a software engineer is tasked with designing an operations function; operational workloads must be capped via automation and error budgets to maximize feature velocity safely. |
| **Chief Architectural Value** | Reliability via Software Automation and Rigorous Reliability Budgeting |
| **Chief Anti-Pattern / Failure Mode** | Operational Toil Overload & Alert Fatigue (manual, repetitive, unscalable operational overhead leading to burnout and system fragility) |
| **Primary Boundary Principle** | 50% Cap on Operational Workload (Toil/On-Call); remaining >=50% engineering time dedicated to permanent software fixes and automation. |
| **Static Audit Suitability** | High for SLO/SLI definition files, alert configurations, health endpoints, graceful shutdown hooks, andIaC manifests; Low for organizational culture and post-mortem review dynamics. |
| **Dominant Code-Level Smell** | Missing network timeouts, unhandled retries without exponential backoff/jitter, hardcoded infrastructure endpoints, lack of structured health metrics. |
| **Dominant Repo-Level Smell** | Missing alerting rules, absent SLO tracking configs, lack of runbooks/playbooks in codebase, missing automated deployment rollback hooks. |
| **Primary Human Review Focus** | Blameless post-mortem quality, SLO target selection sanity, on-call rotation fairness, operational risk acceptance, and architectural error budget alignment. |
| **Key Engineering Metric / Trade-off** | Error Budget (100% - SLO Target Reliability) vs. Feature Velocity; Operational Toil Percentage (<50%). |

---

## 4. Source-Backed Structure
The architectural and operational framework of Site Reliability Engineering is structured across four core themes:

1. **Service Level Management & Reliability Budgeting**: Establishing quantitative measurements (SLIs), setting user-centric reliability targets (SLOs), and utilizing Error Budgets as the neutral arbiter for balancing product feature velocity with operational stability.
2. **Automation & Toil Reduction**: Engineering software solutions to eliminate repetitive, manual, non-creative operational work ("toil"), enforcing a hard 50% limit on operational overhead.
3. **Distributed Systems Resilience & Overload Protection**: Designing systems to withstand infrastructure failures through graceful degradation, load shedding, traffic throttling, exponential backoff with jitter, and circuit breaking.
4. **Monitoring, Emergency Response & Incident Management**: Transitioning from reactive, symptomatic host-level checking to white-box monitoring, alert suppression/grouping, structured runbooks, blameless post-mortems, and standardized incident command structures.

---

## 5. Source-Backed Spirit
1. **What is the fundamental problem this architecture solves?**
   It solves the fundamental conflict between product developers (who want to push new features rapidly) and operations teams (who want to preserve stability by minimizing changes), while preventing operational labor costs from growing linearly with system scale.
2. **What trade-offs does this architecture explicitly accept?**
   It explicitly accepts that 100% uptime is almost always the wrong target (due to economic infeasibility and diminishing returns to end users), accepting planned unreliability within an Error Budget in exchange for rapid feature deployment and operational agility.
3. **Where does this architecture draw hard boundaries?**
   It draws a hard boundary at 50% operational workload (toil and ticket handling). If toil exceeds 50%, operational work is handed back to product engineering teams until software mitigations reduce the burden.
4. **What happens when teams violate these principles?**
   Violating SRE principles leads to operational burnout, high turnover, "toil sinks" where engineers spend all their time manually maintaining systems, alert fatigue, and catastrophic cascading outages due to missing circuit breakers and improper load management.
5. **What can be checked automatically versus manually?**
   *Automated*: Presence of SLO definitions, alerting threshold configs, health check handlers, runbook links in alert rules, structured logging formats, and deployment pipeline manifests.
   *Manual*: Quality of post-mortem root-cause analysis, realism of SLO targets relative to user expectations, organizational blamelessness culture, and architectural review of failure domains.
6. **How does this architecture evolve over time?**
   As services mature, manual operational tasks are iteratively encapsulated into automated self-healing software platforms (e.g., automated cluster management, automated canary analysis, self-remediating infrastructure).

---

## 6. Key Concepts

### Concept 1: Service Level Indicator (SLI)
- **Definition**: A carefully defined quantitative measure of a service's performance or availability at a point in time (e.g., request latency, error rate, throughput).
- **Repo-Level Manifestation**: Defined in monitoring configuration files (e.g., Prometheus rules, Datadog metric manifests) as structured queries computing good events divided by total events.

### Concept 2: Service Level Objective (SLO)
- **Definition**: A target percentage or range for a Service Level Indicator specified over a set time window (e.g., 99.9% request latency < 200ms over 30 days).
- **Repo-Level Manifestation**: Configured in service metadata manifests, YAML monitoring specs, or deployment policy definitions.

### Concept 3: Error Budget
- **Definition**: The mathematical room for failure calculated as `100% - SLO`. It represents the allowable unreliability that product teams can spend on risky deployments, experiments, and feature launches.
- **Repo-Level Manifestation**: Integrated into release pipeline gating files, CI/CD scripts, or deployment policy manifests that freeze deployments when the error budget is exhausted.

### Concept 4: Toil
- **Definition**: The kind of operational work that tends to be manual, repetitive, automatable, tactical, devoid of enduring value, and scales linearly as a service grows.
- **Repo-Level Manifestation**: Absence of manual shell scripts or ticket-driven tasks; presence of infrastructure-as-code and self-healing automation scripts.

### Concept 5: White-Box Monitoring
- **Definition**: Monitoring based on internal telemetry exposed by the application (e.g., request counters, queue depths, internal latencies) rather than external ping tests.
- **Repo-Level Manifestation**: Instrumentation libraries imported in code exposing `/metrics` or `/health` endpoints with four golden signals (Latency, Traffic, Errors, Saturation).

### Concept 6: Blameless Post-Mortem
- **Definition**: A structured post-incident investigation document that focuses on systemic failures, process gaps, and missing safeguards rather than individual human error.
- **Repo-Level Manifestation**: A mandatory `postmortems/` directory or template markdown file in repository root, linked in incident documentation.

---

## 7. Practical Patterns and Examples

### Pattern 1: The Four Golden Signals Monitoring Pattern
Every production service must expose and monitor the four golden signals:
- **Latency**: Time taken to serve a request (differentiating successful requests from errors).
- **Traffic**: A measure of demand on the system (e.g., HTTP requests/sec).
- **Errors**: Rate of requests that fail (explicit 5xx status codes, implicit failures, or policy timeouts).
- **Saturation**: How "full" the service is (CPU usage, memory footrpint, thread pool exhaustion).

*Implementation Example*: Exposing a standard `/metrics` endpoint using Prometheus instrumentation libraries in code, configured with alert manifests alerting on high error rates or saturation limits.

### Pattern 2: Graceful Degradation & Load Shedding Pattern
When incoming traffic exceeds capacity or downstream dependencies fail, services must drop low-priority requests or disable non-essential features rather than crashing entirely.

*Implementation Example*: Middleware checking saturation metrics or thread pool capacity and returning HTTP 503 (or HTTP 429) immediately for non-critical endpoints, while shielding critical paths.

### Pattern 3: Exponential Backoff with Jitter Pattern
Client calls to downstream services must avoid synchronized retry storms ("thundering herd") during recovery by introducing randomized exponential delays between retry attempts.

*Implementation Example*: Network client library configurations enforcing `delay = min(cap, base * 2 ^ attempt) + random_jitter`.

---

## 8. Common Failure Modes and Risks

### Failure Mode 1: Cascading Failure via Unbounded Retries
- **Risk**: A minor transient slowdown in a downstream database causes upstream callers to retry aggressively without backoff or limit, creating a feedback loop that completely overwhelms and crashes the database.
- **Mitigation**: Enforce client-side retry budgets (e.g., maximum 10% retry traffic allowance), exponential backoff with random jitter, and deadline/timeout propagation across service boundaries.

### Failure Mode 2: Toil Sink & Operational Burnout
- **Risk**: Operational tasks are performed manually via SSH/CLI commands without automation, causing operational overhead to grow linearly with user scale until engineering capacity is consumed entirely by operational firefighting.
- **Mitigation**: Enforce the 50% SRE toil cap; mandate that every manual operational task performed twice must yield an automated script or self-healing platform feature.

### Failure Mode 3: Alert Fatigue & Symptom-Based Paging
- **Risk**: On-call engineers receive dozens of non-actionable or transient alerts per shift (e.g., high CPU on a single host), causing desensitization and missed critical outage alerts.
- **Mitigation**: Configure alerts exclusively on SLO-impacting symptoms (e.g., high user-visible error rates) rather than causes; ensure every page links directly to an actionable runbook.

### Failure Mode 4: Deploying without Error Budget Tracking
- **Risk**: Teams deploy risky features continuously without measuring reliability impact, leading to extended service degradation with no objective mechanism to pause deployments.
- **Mitigation**: Implement automated CI/CD release gating that checks error budget depletion and halts non-emergency deployments when budgets are exhausted.

---

## 9. Repository-Audit Translation

### Static Checks (Automated in Repository)
- **SLO/SLI Spec Files**: Verify presence of declarative monitoring and SLO definition files (e.g., `slo.yaml`, `alerts.yaml`).
- **Health Check Handlers**: Verify HTTP/gRPC services implement standard `/healthz` or `/livez`/`/readyz` endpoints.
- **Runbook Anchors**: Verify alert rule files contain valid `runbook_url` or `summary` annotations.
- **Timeout & Retry Limits**: Verify network clients configure explicit timeouts and retry backoff settings.
- **Deployment & Rollback Manifests**: Verify presence of automated canary deployment or health-gated pipeline configurations (`Dockerfile`, Kubernetes manifests, Terraform configs).

### Human Review (Contextual / Architecture)
- **SLO Target Realism**: Review whether the configured SLO targets align with true user perception and business impact.
- **Blameless Culture & Post-Mortem Quality**: Evaluate post-mortem records for actionable systemic remedies rather than human blame.
- **Capacity Planning & Saturation Models**: Review load test results and capacity forecasts against growth projections.
- **Toil Audit**: Periodically review on-call ticket logs to identify repetitive tasks requiring software automation.

---

## 10. Candidate Rules

| Rule ID | Rule Name | Target / Scope | Readiness |
| :--- | :--- | :--- | :--- |
| `SRE-001` | Service Health Endpoint Presence | HTTP/gRPC Service Routers | `ready` |
| `SRE-002` | Alert Rule Runbook URL Attachment | Monitoring Configs (`*.yaml`, `*.yml`) | `ready` |
| `SRE-003` | Prohibition of Unbounded Retries | Network/HTTP Client Configs | `ready` |
| `SRE-004` | SLO Definition File Presence | Project Root / Infra Configs | `ready` |
| `SRE-005` | Post-Mortem Template File Presence | Repository Root (`.github/`, `docs/`) | `ready` |
| `SRE-006` | Post-Incident Root Cause Fairness | Human Post-Mortem Documents | `needs-review` |
| `SRE-007` | Operational Toil Workload Ratio | Team Ticket Tracking Systems | `blocked` |

---

## 11. Suggested YAML Fragment

```yaml
rules:
  - id: SRE-001
    name: Service Health Endpoint Presence
    severity: ERROR
    description: "Every web service or API must expose a dedicated health check endpoint (/healthz, /livez, or /readyz)."
    check_type: pattern_match
    file_pattern: "**/*.{js,ts,go,py,java,rs}"
    pattern: "(healthz|readyz|livez|/health)"

  - id: SRE-002
    name: Alert Rule Runbook URL Attachment
    severity: WARNING
    description: "All alerting rule definitions must include a runbook_url annotation to ensure actionable emergency response."
    check_type: pattern_match
    file_pattern: "**/alerts/*.{yaml,yml}"
    pattern: "runbook_url:"

  - id: SRE-003
    name: Prohibition of Unbounded Retries
    severity: ERROR
    description: "Network requests and client calls must specify explicit max_retries or retry policy limits to prevent cascading failures."
    check_type: pattern_match
    file_pattern: "**/*.{js,ts,go,py,java,rs}"
    pattern: "(max_retries|retry_limit|RetryPolicy|maxAttempts)"

  - id: SRE-004
    name: SLO Definition File Presence
    severity: WARNING
    description: "Repositories must include a declarative SLO/SLI definition file (e.g., slo.yaml or prometheus-rules.yaml)."
    check_type: file_exists
    files:
      - "slo.yaml"
      - "slo.yml"
      - "prometheus-rules.yaml"
      - "monitoring/slo.yaml"

  - id: SRE-005
    name: Post-Mortem Template File Presence
    severity: INFO
    description: "Repository should contain a post-mortem template to encourage structured blameless incident reviews."
    check_type: file_exists
    files:
      - "PULL_REQUEST_TEMPLATE.md"
      - "docs/postmortem_template.md"
      - ".github/postmortem_template.md"
```

---

## 12. Handoff Checklist
- [x] Processed exactly **one** source document (*Site Reliability Engineering: How Google Runs Production Systems*).
- [x] Created all **12 required sections** in exact sequence.
- [x] Formatted Section 3 as a 10-field key/value table with non-empty values.
- [x] Defined at least 4 core themes in Section 4.
- [x] Answered all 6 core questions in Section 5.
- [x] Defined at least 6 key concepts with definition and repo-level manifestation in Section 6.
- [x] Included at least 3 concrete patterns with code/repo examples in Section 7.
- [x] Detailed at least 4 failure modes with risks and mitigations in Section 8.
- [x] Separated static checkability from human review in Section 9.
- [x] Formatted Section 10 as a table with Rule ID, Name, Target, and Readiness status (`ready`, `needs-review`, `blocked`).
- [x] Emitted valid YAML in Section 11 containing ONLY `ready` rules using supported check types (`pattern_match`, `file_exists`, `file_absent`).
- [x] Verified zero page numbers, zero paragraph locators, and zero verbatim quotes longer than 15 words.


## References

<!-- ref: TODO -->

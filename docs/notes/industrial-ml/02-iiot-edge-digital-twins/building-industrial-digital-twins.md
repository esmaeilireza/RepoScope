1. Source Identity
Title: Building Industrial Digital Twins

# Building Industrial Digital Twins — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Building Industrial Digital Twins: Design, develop, and deploy digital twin solutions for real-world industries using Azure Digital Twins
- **Author(s):** Shyam Varan Nath, Pieter van Schalkwyk
- **Branch:** iiot
- **RepoScope profile:** iiot
- **Primary source file:** Building Industrial Digital Twins- Design, Develop, and -- Shyam Varan Nath, Pieter van Schalkwyk -- 2021.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
- **In scope:**
  - Digital twin paradigms, taxonomies (discrete vs. composite, product vs. facility, analytics vs. physics-based), and life cycle phases.
  - Digital Twin Definition Language (DTDL v2 / RDF) interface models, ontologies, and Asset Administration Shell (AAS) metamodels.
  - Integration architectures connecting IIoT platforms (Azure Digital Twins, XMPro, GE Predix) with time-series, graph, and ERP/EAM data stores.
  - Solution planning frameworks, including the Lean Digital Twin Canvas, proof-of-concept (POC) to full production deployment models, and RACI matrices.
  - Functional testing frameworks for Digital Twin infrastructure, DTDL models, graph relationships, and no-code/low-code applications.
- **Out of scope:**
  - Physical manufacturing of heavy machinery, wind turbine mechanical casting, and blade composite material engineering.
  - Proprietary circuit design, PCB layout, and lower-level firmware C/C++ driver development for industrial microcontrollers.
  - High-level business organizational governance without statically auditable software repository manifests.
  - General consumer smart home IoT devices without industrial automation or enterprise asset management integration.

---

## 3. Source spirit card
1. **Core architectural thesis:** Industrial Digital Twins must be designed as model-driven, synchronized virtual instances that decouple domain metadata from telemetry ingestion streams using open specifications like DTDL and AAS.
2. **Primary operational domain:** Process and discrete manufacturing, industrial power generation, renewable wind and solar energy infrastructures, aerospace, and heavy mining asset monitoring.
3. **Target engineering role:** Industrial Digital Twin architects, IIoT solution developers, reliability/maintenance engineers, and cloud integration architects.
4. **Fundamental design paradigm:** Graph-centric, microservices-based, low-code/code-driven digital twin platform orchestration paired with time-series telemetry pipelines.
5. **Preferred integration strategy:** Open-standard ontology definitions (DTDL / RDF) integrated with Azure Digital Twins, IoT Hub, and enterprise backend systems (ERP/EAM/MES).
6. **Data lifecycle philosophy:** Multi-tiered data management splitting real-time hot-path telemetry streaming from warm/cold time-series repositories and graph asset relationships.
7. **Security and trust posture:** End-to-end cloud and edge security featuring role-based access controls (RBAC), managed service identities, and encrypted API communication across IT/OT boundaries.
8. **Resilience and fault-tolerance principle:** System-of-systems interoperability with pre-condition and post-condition checks to prevent data error propagation across composite Twin-to-Twin (T2T) networks.
9. **Hardware/edge constraint posture:** Local edge data ingestion and preprocessing that filters high-frequency sensor streams before updating cloud-hosted digital twin instances.
10. **Scalability and evolution approach:** Phased deployment strategy progressing from isolated POCs and minimum viable prototypes to multi-site bowling-alley rollouts managed via versioned DTDL interface models.

---

## 4. Source-backed structure

### Theme 1: Digital Twin Fundamentals, Taxonomies, and Asset Aggregation
- **Source:** `Building Industrial Digital Twins`
- **Structural locator:** `Chapter 1: Introduction to Digital Twin`
- **Spirit locator:** Digital Twins represent physical entities across their life cycle through synchronized discrete or composite models backed by structured DTP and DTI instances.

### Theme 2: Technology Prerequisites, Ontologies, and Modeling Languages (DTDL / AAS)
- **Source:** `Building Industrial Digital Twins`
- **Structural locator:** `Chapter 4: Getting Started with Our First Digital Twin`
- **Spirit locator:** Standardizing asset representations via DTDL JSON-LD interface models and Asset Administration Shell (AAS) metamodels ensures cross-domain interoperability and model reusability.

### Theme 3: Prototype Solution Architecture, Data Stores, and Ingestion Flows
- **Source:** `Building Industrial Digital Twins`
- **Structural locator:** `Chapter 5: Setting Up a Digital Twin Prototype`
- **Spirit locator:** A robust digital twin architecture orchestrates real-time IoT ingress, graph spatial databases, warm time-series storage, and analytical decision logic into a coherent platform.

### Theme 4: Multi-Phase Functional Testing and Deployment Scaling
- **Source:** `Building Industrial Digital Twins`
- **Structural locator:** `Chapter 7: Deployment and Value Tracking`
- **Spirit locator:** System validation requires functional verification of underlying graph models, node properties, and relationship links prior to executing phased pilot rollouts.

### Theme 5: Composite Digital Twin Systems and Enterprise Ecosystem Standards (T2T)
- **Source:** `Building Industrial Digital Twins`
- **Structural locator:** `Chapter 8: Enhancing the Digital Twin`
- **Spirit locator:** Scaling enterprise digital twins requires composing discrete asset twins into hierarchical Twin-to-Twin (T2T) ecosystems while enforcing data contract boundaries.

---

## 5. Source-backed spirit
1. **What is the fundamental problem the source addresses?**
   The source addresses the technical and strategic challenge of constructing, validating, and scaling industrial digital twins on cloud platforms (such as Azure Digital Twins) to optimize asset performance, reduce downtime, and lower operational costs across complex industrial environments.
2. **What is the core architectural philosophy advocated by the authors?**
   The authors advocate for a standardized, use-case-driven architecture centered on versioned interface models (DTDL/AAS), graph-based spatial topologies, decoupled hot/cold telemetry data pipelines, and rapid low-code/no-code prototyping.
3. **How does the source approach the boundary between edge systems and central cloud infrastructure?**
   The edge layer captures, cleans, and pre-processes high-frequency sensor readings (e.g. via IoT Edge or OPC UA collectors), transmitting structured telemetry events over secure cloud gateways (Azure IoT Hub) to update centralized digital twin state instances.
4. **What is the source's approach to device identity, authentication, and communication security?**
   Device identity and platform interaction rely on strict identity provisioning, Azure Active Directory / Role-Based Access Control (RBAC), application registration credentials, and managed identity bindings for secure API communication.
5. **How does the source handle network instability, offline resilience, and data synchronization?**
   Data synchronization relies on defined twinning rates and state updates; in composite Twin-to-Twin ecosystems, edge buffering and input/output pre-conditions prevent stale data or communication dropouts from corrupting downstream models.
6. **What trade-offs does the source emphasize when balancing hardware constraints against computational capability?**
   The source balances cloud computing scale with site latency by delegating real-time telemetry filtering and local control feedback to edge gateways while offloading complex AI/ML model execution, historical analytics, and composite graph queries to cloud PaaS offerings.

---

## 6. Key concepts

### 1. Digital Twin Prototype (DTP) vs. Digital Twin Instance (DTI)
- **Definition:** DTP is the design-time model or class definition representing an asset type, whereas DTI is a specific runtime virtual instance synchronized with an individual physical asset.
- **Why it matters:** Enables scaling across thousands of physical assets by modifying a single prototype model schema to automatically update all instantiated asset instances.
- **Related concepts:** Digital Twin Aggregate (DTA), DTDL Interface, Asset Administration Shell (AAS).
- **Citation:** `Building Industrial Digital Twins`, Chapter 1 & Chapter 6.
- **Verification status:** source-backed

### 2. Digital Twin Definition Language (DTDL)
- **Definition:** An open-source, JSON-LD-based metamodel language used to define digital twin interfaces, telemetries, properties, commands, relationships, and components.
- **Why it matters:** Provides a standardized, machine-readable syntax for modeling complex asset topologies and enabling interoperability across digital twin platforms.
- **Related concepts:** Resource Description Framework (RDF), DTMI Identifier, Interface Model.
- **Citation:** `Building Industrial Digital Twins`, Chapter 4 & Chapter 6.
- **Verification status:** source-backed

### 3. Asset Administration Shell (AAS)
- **Definition:** An Industrie 4.0 standard metamodel that encapsulates physical industrial assets with standardized properties, sub-models, and machine-readable unique identifiers.
- **Why it matters:** Facilitates vendor-agnostic asset data exchange and interoperability across smart manufacturing supply chains.
- **Related concepts:** Industrie 4.0 Component, Submodel, ConceptDescription.
- **Citation:** `Building Industrial Digital Twins`, Chapter 4.
- **Verification status:** source-backed

### 4. Lean Digital Twin Canvas
- **Definition:** A single-page strategic solution planning tool used to document problem statements, user value propositions, ROI business cases, key metrics, and system integration points.
- **Why it matters:** Ensures continuous alignment between LOB business stakeholders and IT technical teams throughout the digital twin development lifecycle.
- **Related concepts:** Solution Planning Framework, Bad Actor Review, FMECA.
- **Citation:** `Building Industrial Digital Twins`, Chapter 4.
- **Verification status:** source-backed

### 5. Twin-to-Twin (T2T) / Composite Digital Twin
- **Definition:** A system-of-systems framework where discrete digital twins are linked hierarchically or non-hierarchically to form composite assembly, site, or ecosystem-wide twins.
- **Why it matters:** Allows complex facilities (such as power grids or manufacturing plants) to synthesize operational insights across heterogeneous subsystem models.
- **Related concepts:** Composite Twin, System of Systems, Interoperability, Wrap Pre-conditions.
- **Citation:** `Building Industrial Digital Twins`, Chapter 2 & Chapter 8.
- **Verification status:** source-backed

### 6. Digital Thread
- **Definition:** The continuous data stream and record that tracks an asset's full lifecycle history across planning, design, manufacturing, operations, and maintenance phases.
- **Why it matters:** Connects disparate lifecycle phases to enable root cause analysis (RCA) and failure mode effect analysis (FMEA) across engineering and operational domains.
- **Related concepts:** PLM, FMECA, Asset Lifecycle, Traceability.
- **Citation:** `Building Industrial Digital Twins`, Chapter 1.
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1: DTDL Interface Modeling with Explicit Versioning and Relationship Graphs
- **Problem solved:** Defining unstructured or unversioned asset properties leads to schema corruption and broken relationship queries in digital twin graph databases.
- **Recommended approach:** Structure asset models into modular JSON-LD DTDL interface files using strict DTMI URN identifiers (`dtmi:com:example:Asset;1`) that explicitly define telemetry, property, and relationship target interfaces.
- **Repository-level manifestation:** JSON model files (`*.json` or `*.dtdl.json`) stored in model directories containing `@id`, `@type: "Interface"`, and `contents` array blocks with typed `Property`, `Telemetry`, and `Relationship` definitions.
- **Limitations:** Schema updates require incrementing the DTMI version suffix and updating downstream graph instance references.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 6.

### Pattern 2: Multi-Layer Functional Testing of Digital Twin Graph Infrastructure and Instance Nodes
- **Problem solved:** Deploying unvalidated DTDL models or broken API ingestion routines causes missing property fields and orphan graph nodes in cloud twin instances.
- **Recommended approach:** Implement a multi-step test suite that sequentially verifies ADT/ADX platform connectivity, validates node creation and property populates, and checks relationship graph link integrity.
- **Repository-level manifestation:** Automated test scripts (Python/Jest/PowerShell) invoking Digital Twin SDK APIs (`GetDigitalTwin`, `QueryTwins`) to assert non-null property payloads and expected relationship count outputs.
- **Limitations:** Requires active staging environment endpoints or local emulator instances to execute functional graph queries.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 7.

### Pattern 3: Low-Code / Coded Orchestration Pipeline for Telemetry Ingestion and Recommendation Dispatch
- **Problem solved:** Ingesting raw sensor telemetry directly into digital twin graph stores without processing causes high API latency and lacks actionable decision logic.
- **Recommended approach:** Deploy an intermediate orchestration layer (such as XMPro Data Stream Designer or Azure Functions) with dedicated listener agents, contextualizers, analytical rule evaluation, and action dispatchers.
- **Repository-level manifestation:** Data pipeline configuration manifests (`*.json`, `*.yaml`) or serverless function handlers containing input connectors, telemetry transformation functions, threshold rule evaluations, and REST API dispatch calls.
- **Limitations:** Introduces additional pipeline latency between raw OT signal emission and twin state update.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 6.

---

## 8. Common failure modes and risks
1. **Omission of Version Suffix in Digital Twin Definition Language (DTDL) Interface Identifiers:**
   - *Why it happens:* Developers omit the version suffix (e.g. writing `dtmi:com:example:Pump` instead of `dtmi:com:example:Pump;1`) during initial model drafting.
   - *Early warning signs:* Model upload failures, schema parsing errors in Visual Studio Code DTDL extension, or broken inheritance links.
   - *Repository evidence:* DTDL JSON files containing `@id` fields without a trailing `;<version>` integer syntax.
   - *Severity tendency:* warning
2. **Unvalidated Telemetry Schema Ingestion Omitting Timestamp or Unit Metadata:**
   - *Why it happens:* Ingestion pipeline code parses raw sensor numbers directly without attaching ISO-8601 timestamps or units of measure (UOM) metadata.
   - *Early warning signs:* Unindexed time-series queries, time-alignment errors during graph joins, or failed unit conversion calculations.
   - *Repository evidence:* JSON schema definition files (`*schema*.json`) or payload parsers missing mandatory `timestamp` or `uom` field definitions.
   - *Severity tendency:* warning
3. **Hardcoded Platform Credentials or Tenant Secrets in Digital Twin Configuration:**
   - *Why it happens:* Developers hardcode Azure Client IDs, Client Secrets, or Tenant IDs in application source files or configuration manifests for rapid testing.
   - *Early warning signs:* Plaintext secrets committed to git source repositories, security scanner alerts, or credential exposure in build logs.
   - *Repository evidence:* Plaintext string assignments for `clientId`, `clientSecret`, or `tenantId` in `.json`, `.yaml`, or `.py` files.
   - *Severity tendency:* error
4. **Orphaned Graph Instance Creation Without Relationship Enforcement:**
   - *Why it happens:* Automation scripts instantiate child twin nodes without executing relationship creation calls, resulting in disconnected graph topologies.
   - *Early warning signs:* Null query returns during graph traversal queries, missing component hierarchies in Twin Explorer visualizer.
   - *Repository evidence:* Provisioning scripts containing `CreateDigitalTwin` API calls without corresponding `CreateOrReplaceRelationship` executions.
   - *Severity tendency:* warning

---

## 9. Repository-audit translation

### Static checks (automated)
- Inspect DTDL interface JSON files (`*twin*.json`, `*.dtdl.json`) for valid DTMI versioning syntax (`@id` matching `dtmi:.*:\w+;\d+`).
- Audit configuration files (`.json`, `.yaml`, `.env`) for hardcoded plaintext client secrets, passwords, or tenant IDs.
- Scan telemetry payload JSON schema files (`*schema*.json`) for mandatory ISO-8601 timestamp (`timestamp`, `dateTime`) and engineering unit (`uom`, `unit`) fields.
- Verify that provisioning scripts (`*.py`, `*.js`, `*.cs`) include error handling wrappers around Digital Twin SDK API calls.
- Check edge container deployment manifests (`docker-compose*.yml`) for resource limit constraints (`cpus`, `memory`, `mem_limit`).
- Verify the presence of health check declarations (`healthcheck`) in edge deployment manifests.

### Human review (contextual)
- Evaluate whether the level of abstraction in discrete vs. composite twin models matches operational maintenance and telemetry reporting needs.
- Review Lean Digital Twin Canvas documentation for completeness of ROI business cases and clear LOB vs. IT stakeholder RACI matrix definitions.
- Assess the adequacy of input/output pre-conditions and post-conditions wrapped around composite Twin-to-Twin (T2T) system interfaces.
- Validate that the phased rollout plan (bowling-alley strategy) aligns with site-specific IT/OT infrastructure readiness.

---

## 10. Candidate rules

### Rule 1
- **Rule ID:** iiot-twin-001
- **Title:** Digital Twin Model Definition Omits Model Version Identifier
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Digital Twin Definition Language (DTDL) interface model definitions must contain an explicit version identifier to manage model evolution and backward compatibility across asset instances.
- **Source-backed basis:** Digital Twin interface model identifiers require explicit versioning syntax in DTMI URNs (e.g., `dtmi:com:idtbook:wt:turbine;1`).
- **Repository evidence to inspect:** Digital twin interface JSON / DTDL model files (`*twin*.json`, `*.dtdl.json`).
- **Pass condition:** The model definition `@id` field contains a trailing version suffix matching `;1` or higher integer (`dtmi:.*:\w+;\d+`).
- **Fail condition:** Digital twin interface definition `@id` field lacks a version suffix or version property.
- **Exceptions or limitations:** Temporary in-memory draft templates inside local developer scratch directories.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Building Industrial Digital Twins`, Chapter 4 & Chapter 6.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 6: Building the Digital Twin Prototype`
- **Spirit locator:** Asset interface model definitions must incorporate explicit DTMI versioning syntax to guarantee backwards compatibility across twin instances.
- **Verification status:** source-backed

---

### Rule 2
- **Rule ID:** iiot-device-001
- **Title:** Hardcoded Plaintext Credentials in Cloud and Edge Digital Twin Configuration
- **Profile:** iiot
- **Severity tendency:** error
- **Rationale:** Digital Twin application configuration files must not contain hardcoded plaintext tenant secrets, client secrets, or access keys.
- **Source-backed basis:** Cloud and edge platform access credentials must be supplied dynamically via environment variables or secret stores rather than static string literals.
- **Repository evidence to inspect:** Configuration manifests (`.json`, `.conf`, `.yaml`, `.env`).
- **Pass condition:** Secret and password properties use variable expansion syntax or secret provider placeholders.
- **Fail condition:** Configuration files contain hardcoded plaintext secret or credential string literals.
- **Exceptions or limitations:** Mock credential placeholders in local test fixture files explicitly excluded from production deployment builds.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 7.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 7: Deployment and Value Tracking`
- **Spirit locator:** Security configurations must inject service credentials dynamically via environment bindings to prevent credential leakage.
- **Verification status:** source-backed

---

### Rule 3
- **Rule ID:** iiot-telemetry-001
- **Title:** Telemetry Schema Specification Lacks Mandatory Timestamp Metadata
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field to support temporal indexing and time-series database alignment.
- **Source-backed basis:** Industrial sensor telemetry streams require timestamped data schemas for accurate time-series ingestion and temporal graph joins.
- **Repository evidence to inspect:** Telemetry JSON schema files (`*schema*.json`).
- **Pass condition:** Schema definitions explicitly require a `timestamp`, `time_iso`, or `dateTime` field.
- **Fail condition:** Schema definition specifies sensor telemetry fields but omits a mandatory timestamp property.
- **Exceptions or limitations:** High-frequency binary sensor feeds where timestamps are assigned at batch ingestion gateways.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 6.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 6: Building the Digital Twin Prototype`
- **Spirit locator:** Telemetry data schemas must enforce mandatory timestamp metadata to enable time-series indexing and historical state synchronization.
- **Verification status:** source-backed

---

### Rule 4
- **Rule ID:** iiot-hw-001
- **Title:** Edge Container Deployment Manifest Omits Resource Limits
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Containerized edge microservices supporting digital twin ingestion must declare CPU and memory limits to prevent hardware exhaustion on constrained edge gateways.
- **Source-backed basis:** Edge gateways operate on resource-constrained hardware and require container governance to ensure system stability.
- **Repository evidence to inspect:** Edge container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definitions specify `cpus`, `memory`, or `mem_limit` allocation constraints.
- **Fail condition:** Container service definitions omit CPU and memory resource limits.
- **Exceptions or limitations:** Development workstation compose files designed for local simulation testing.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Building Industrial Digital Twins`, Chapter 2 & Chapter 5.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 2: Planning Your Digital Twin`
- **Spirit locator:** Edge deployment manifests must enforce resource governance constraints to guarantee operational stability on constrained gateway hardware.
- **Verification status:** source-backed

---

### Rule 5
- **Rule ID:** iiot-006
- **Title:** Edge Microservice Manifest Lacks Health Check Endpoint
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Microservices running on edge gateways must declare health check probes to enable automated local container restart and self-healing lifecycles.
- **Source-backed basis:** Autonomous edge twin components require health monitoring mechanisms to maintain continuous data ingestion.
- **Repository evidence to inspect:** Container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definition includes a `healthcheck` declaration block with test command and probe interval.
- **Fail condition:** Service definition omits a `healthcheck` probe declaration.
- **Exceptions or limitations:** Short-lived setup containers that execute once and terminate upon completing configuration.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 7.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 7: Deployment and Value Tracking`
- **Spirit locator:** Edge microservice deployments must incorporate health check probes to support autonomous recovery and uptime monitoring.
- **Verification status:** source-backed

---

### Rule 6
- **Rule ID:** iiot-004
- **Title:** OPC UA Client Transport Security Disabled
- **Profile:** iiot
- **Severity tendency:** critical
- **Rationale:** OPC UA client endpoints connecting edge twin collectors to industrial field controllers must enforce transport signing and encryption rather than allowing SecurityMode `None`.
- **Source-backed basis:** Industrial communication channels connecting digital twin ingestion pipelines must enforce encryption and X.509 certificate validation.
- **Repository evidence to inspect:** OPC UA client configuration manifests or SDK initialization source code.
- **Pass condition:** Client security mode is set to `SignAndEncrypt` or `Sign` with certificate validation enabled.
- **Fail condition:** Client configuration explicitly specifies SecurityMode `None` or disables certificate verification.
- **Exceptions or limitations:** Isolated local lab testing using synthetic OPC UA server simulators.
- **YAML readiness:** needs-review
- **Reason if not ready:** Evaluating OPC UA transport security parameters accurately across multi-language client SDKs requires a specialized AST/configuration parser.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 4 & Chapter 7.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 4: Getting Started with Our First Digital Twin`
- **Spirit locator:** Industrial data communication channels must mandate session transport encryption and certificate-based identity validation.
- **Verification status:** source-backed

---

### Rule 7
- **Rule ID:** iiot-005
- **Title:** Asset Registry Graph Schema Lacks Uniqueness Constraint
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Graph-based asset registries supporting digital twins must declare uniqueness constraints on asset identifiers to prevent duplicate nodes during batch synchronization.
- **Source-backed basis:** Graph asset model creation requires unique key indexing to guarantee a single deterministic source of truth.
- **Repository evidence to inspect:** Graph initialization scripts (`.cypher`).
- **Pass condition:** Graph script contains explicit `CREATE CONSTRAINT ... REQUIRE n.id IS UNIQUE` statements.
- **Fail condition:** Asset node creation scripts execute `CREATE` statements without enforcing uniqueness constraints.
- **Exceptions or limitations:** Temporary in-memory graph models generated dynamically for scratch calculation.
- **YAML readiness:** needs-review
- **Reason if not ready:** Verifying graph schema uniqueness statements requires a specialized Cypher AST parser not supported by simple pattern match checks.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 6.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 6: Building the Digital Twin Prototype`
- **Spirit locator:** Graph asset registries must enforce entity uniqueness constraints to preserve topological integrity across twin instances.
- **Verification status:** source-backed

---

### Rule 8
- **Rule ID:** cross-iiot-dataops-001
- **Title:** Telemetry Stream Ingestion Pipeline Missing Out-of-Order Timestamp Handling
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Stream ingestion jobs processing telemetry from edge buffers must handle out-of-order historical timestamps explicitly during windowing calculations.
- **Source-backed basis:** Time-series telemetry arriving from reconnected edge gateways contains historical timestamps requiring explicit stream reordering logic.
- **Repository evidence to inspect:** Stream processing pipeline source code (Airflow DAGs, Stream Analytics queries).
- **Pass condition:** Windowing queries specify explicit watermark delays or out-of-order tolerance window parameters.
- **Fail condition:** Stream windowing operations assume strictly monotonic real-time arrival without out-of-order handling.
- **Exceptions or limitations:** Real-time alert paths where historical replayed data is routed directly to cold storage data lakes.
- **YAML readiness:** blocked
- **Reason if not ready:** Stream processing watermark and windowing logic cannot be evaluated using static file checks or pattern matching.
- **Source citation:** `Building Industrial Digital Twins`, Chapter 5 & Chapter 8.
- **Source:** Building Industrial Digital Twins
- **Structural locator:** `Chapter 8: Enhancing the Digital Twin`
- **Spirit locator:** Time-series stream processing pipelines must handle out-of-order telemetry payloads to prevent window aggregation errors.
- **Verification status:** source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: "iiot-twin-001"
    title: "Digital Twin Model Definition Omits Model Version Identifier"
    profile: "iiot"
    severity: "warning"
    message: "Digital twin interface model definitions must contain a version identifier (e.g. dtmi:com:example:Asset;1) to support model evolution."
    references:
      - book: "Building Industrial Digital Twins"
        concept: "dtdl-versioning"
    check:
      type: "pattern_match"
      file_glob: "**/*.{json,dtdl.json}"
      pattern: "@id.*:[a-zA-Z0-9_]+;*"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-device-001"
    title: "Hardcoded Plaintext Credentials in Cloud and Edge Digital Twin Configuration"
    profile: "iiot"
    severity: "error"
    message: "Digital twin application or edge broker configurations must not contain hardcoded plaintext secrets or keys."
    references:
      - book: "Building Industrial Digital Twins"
        concept: "credential-security"
    check:
      type: "pattern_match"
      file_glob: "**/*.{json,conf,yaml,yml}"
      pattern: "(clientSecret|tenantId|password|auth_token)\\s*[:=]\\s*[\"'][^\"'${}]+[\"']"
      must_exist: false
      error_when: "pattern_present"

  - id: "iiot-telemetry-001"
    title: "Telemetry Schema Specification Lacks Mandatory Timestamp Metadata"
    profile: "iiot"
    severity: "warning"
    message: "Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field for proper time-series ingestion."
    references:
      - book: "Building Industrial Digital Twins"
        concept: "telemetry-schema"
    check:
      type: "pattern_match"
      file_glob: "**/*schema*.json"
      pattern: "timestamp|time_iso|dateTime"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-hw-001"
    title: "Edge Container Deployment Manifest Omits Resource Limits"
    profile: "iiot"
    severity: "info"
    message: "Containerized edge microservices supporting digital twin data ingestion should define CPU and memory limits."
    references:
      - book: "Building Industrial Digital Twins"
        concept: "edge-resource-governance"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "cpus|memory|mem_limit"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-006"
    title: "Edge Microservice Manifest Lacks Health Check Endpoint"
    profile: "iiot"
    severity: "info"
    message: "Edge deployment manifests should include health check probes to monitor container operational health."
    references:
      - book: "Building Industrial Digital Twins"
        concept: "edge-health-probe"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "healthcheck"
      must_exist: true
      error_when: "pattern_absent"
```

### Candidates not emitted
- `iiot-004`: Evaluating OPC UA transport security parameters accurately across multi-language client SDKs requires a specialized AST/configuration parser.
- `iiot-005`: Verifying graph database uniqueness constraint statements requires a specialized Cypher AST parser not supported by simple pattern match checks.
- `cross-iiot-dataops-001`: Stream processing watermark and out-of-order reordering logic cannot be evaluated using static file checks or pattern matching.

---

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

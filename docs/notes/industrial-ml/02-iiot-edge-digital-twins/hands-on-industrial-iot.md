# Hands-On Industrial Internet of Things, Second Edition — RepoScope Knowledge Note

## 1. Source identity
- **Title:** Hands-On Industrial Internet of Things, Second Edition
- **Author(s):** Giacomo Veneri, Antonio Capasso
- **Branch:** iiot
- **RepoScope profile:** iiot
- **Primary source file:** Hands-On Industrial Internet of Things.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
- **In scope:**
  - Architecture of Industrial Internet of Things (IIoT) systems across field, control, edge, and cloud tiers.
  - IIoT edge gateway responsibilities, protocol adaptation (OPC UA, MQTT, Modbus), and store-and-forward spooling mechanisms.
  - Asset modeling, graph-based asset registries (ISA-95 / Neo4j), and time-series database (TSDB) integration.
  - Operational technology (OT) cybersecurity, Defense-in-Depth (DiD), network segmentation, DMZ proxies, and transport encryption.
  - Digital twin paradigms, physics-informed vs. data-driven surrogate models, and remaining useful life (RUL) predictive analytics.
- **Out of scope:**
  - Consumer-focused IoT applications, smart home wearables, and commercial appliance design.
  - Physical circuit board design, microcontroller pin layout, and manual hardware soldering procedures.
  - Human architectural decisions, organizational governance policies, and non-statically verifiable runtime choices.
  - Proprietary vendor-locked cloud infrastructure without standardized interface abstraction.

---

## 3. Source spirit card
1. **Core architectural thesis:** Industrial IoT systems must decouple high-velocity operational telemetry from hierarchical asset metadata through layered edge-to-cloud pipelines and standardized communication protocols.
2. **Primary operational domain:** Brownfield and greenfield industrial manufacturing, process automation, predictive asset maintenance, and distributed energy infrastructures.
3. **Target engineering role:** IIoT systems architects, edge software engineers, automation control engineers, and data engineers building industrial pipelines.
4. **Fundamental design paradigm:** Microservices-based, containerized edge gateway architectures coupled with event-driven message brokers and model-driven analytics platforms.
5. **Preferred integration strategy:** Open, service-oriented protocol abstraction using OPC UA and MQTT on the edge, backed by graph registries and cloud-native time-series data stores.
6. **Data lifecycle philosophy:** Hot-path real-time stream processing for immediate site alerts combined with cold-path batch analytics into time-series repositories for predictive digital twins.
7. **Security and trust posture:** Strict operational technology Defense-in-Depth featuring dual-firewall DMZs, certificate-backed transport encryption, and zero-trust edge proxy isolation.
8. **Resilience and fault-tolerance principle:** Autonomous edge operation with local persistent store-and-forward spooling to guarantee zero telemetry loss during WAN outages.
9. **Hardware/edge constraint posture:** Containerized resource isolation accounting for CPU, memory, and bandwidth limits on edge gateways through deterministic sampling and compression.
10. **Scalability and evolution approach:** Standardized asset inheritance models and decoupled microservice components enabling seamless scaling from single-component prototypes to multi-site enterprise fleets.

---

## 4. Source-backed structure

### Theme 1: Industrial Automation Hierarchy and CIM Pyramid Integration
- **Source:** `Hands-On Industrial Internet of Things, Second Edition`
- **Structural locator:** `Chapter 2: Understanding the Industrial Process and Devices`
- **Spirit locator:** Industrial automation structures physical process controls into deterministic operational layers across the computer-integrated manufacturing hierarchy.

### Theme 2: Edge Gateway and Communication Flow Protocol Translation
- **Source:** `Hands-On Industrial Internet of Things, Second Edition`
- **Structural locator:** `Chapter 4: Implementing the Industrial IoT Data Flow`
- **Spirit locator:** The edge gateway bridges operational field networks and cloud message brokers by performing protocol translation, local buffering, and secure data forwarding.

### Theme 3: Defense-in-Depth Cybersecurity Architecture for Operational Technology
- **Source:** `Hands-On Industrial Internet of Things, Second Edition`
- **Structural locator:** `Chapter 5: Applying Cybersecurity`
- **Spirit locator:** Protecting industrial control systems requires multi-layered network segmentation, DMZ firewalls, certificate-based authentication, and encrypted transport tunnels.

### Theme 4: Graph-Based Asset Registry and Time-Series Data Management
- **Source:** `Hands-On Industrial Internet of Things, Second Edition`
- **Structural locator:** `Chapter 7: Developing Industrial IoT and Architecture`
- **Spirit locator:** Decoupling hierarchical asset metadata stored in graph registries from high-velocity telemetry stored in time-series databases ensures scalable model-driven analytics.

### Theme 5: Advanced Predictive Analytics and Digital Twin Implementation
- **Source:** `Hands-On Industrial Internet of Things, Second Edition`
- **Structural locator:** `Chapter 14: Implementing a Digital Twin – Advanced Analytics`
- **Spirit locator:** Combining physics-informed models and data-driven machine learning inside digital twin frameworks enables real-time anomaly detection and remaining useful life estimation.

---

## 5. Source-backed spirit
1. **What is the fundamental problem the source addresses?**
   The source addresses the technical complexity of connecting heterogeneous operational technology (OT) assets to modern cloud platforms without compromising industrial safety, network security, or data integrity.
2. **What is the core architectural philosophy advocated by the authors?**
   The authors advocate for an open-standards, service-oriented architecture centered on containerized edge devices, OPC UA and MQTT messaging, graph-based asset registries, and time-series databases.
3. **How does the source approach the boundary between edge systems and central cloud infrastructure?**
   The edge system acts as an autonomous intermediary that ingests high-frequency OT signals, performs protocol conversion and localized analytics, and forwards structured telemetry to cloud platforms.
4. **What is the source's approach to device identity, authentication, and communication security?**
   Security requires a Defense-in-Depth strategy featuring X.509 device certificates, encrypted transport (TLS/SSL), role-based policies, and dual-proxy configurations across DMZ firewalls.
5. **How does the source handle network instability, offline resilience, and data synchronization?**
   Edge systems must incorporate local persistent store-and-forward spoolers to buffer incoming telemetry during network disconnections and replay data upon link restoration without generating duplicate or out-of-order state corruption.
6. **What trade-offs does the source emphasize when balancing hardware constraints against computational capability?**
   The source balances edge hardware constraints against cloud scale by delegating latency-critical anomaly checks to edge microservices while offloading heavy model training and historical batch analytics to cloud data lakes.

---

## 6. Key concepts

### 1. OPC UA (Open Platform Communications Unified Architecture)
- **Definition:** An open, independent, service-oriented communication framework for industrial automation that provides standardized data modeling, security, and publish/subscribe notification mechanisms.
- **Why it matters:** It abstracts proprietary fieldbus protocols (Modbus, Profibus) into unified semantic nodes across the automation pyramid.
- **Related concepts:** OPC Classic, Information Model, Monitored Items, DCOM Proxy.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 4.
- **Verification status:** source-backed

### 2. IIoT Edge Gateway
- **Definition:** A dedicated physical or virtual node situated at the junction between industrial field networks and cloud networks responsible for protocol adaptation, telemetry ingestion, and security isolation.
- **Why it matters:** Prevents direct cloud exposure of PLCs and SCADA controllers while managing high-volume sensor signals locally.
- **Related concepts:** Edge Computing, Fog Computing, Edge Tools, Protocol Proxy.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 4.
- **Verification status:** source-backed

### 3. Store-and-Forward Spooling
- **Definition:** A persistent local disk buffering mechanism on edge gateways or Historians that queues telemetry messages when internet or cloud connectivity is disrupted.
- **Why it matters:** Guarantees zero data loss across intermittent WAN links and restores chronological continuity upon reconnection.
- **Related concepts:** Local Buffering, Reconnect Logic, Disk Spooler, Historian Replication.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 3 & Chapter 9.
- **Verification status:** source-backed

### 4. Asset Registry (Graph Asset Model)
- **Definition:** A centralized repository—typically built on a graph database—that stores hierarchical equipment entities, parent-child relationships, and sensor tag metadata.
- **Why it matters:** Provides necessary operational context (location, engineering units, threshold limits) to contextualize raw time-series telemetry streams.
- **Related concepts:** ISA-95 Hierarchy, Neo4j, AWS SiteWise, Equipment Entities.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 7 & Chapter 8.
- **Verification status:** source-backed

### 5. Time-Series Database (TSDB)
- **Definition:** A specialized append-only database engineered specifically to ingest, index, and query timestamped numerical telemetry at high write speeds.
- **Why it matters:** Enables efficient temporal aggregation, downsampling, and windowing queries across millions of industrial datapoints.
- **Related concepts:** InfluxDB, AWS Timestream, Historian, Hot/Cold Path.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 7 & Chapter 8.
- **Verification status:** source-backed

### 6. Digital Twin (Operational / Predictive)
- **Definition:** An integrated virtual representation of a physical asset or industrial process that updates state continuously via sensor telemetry to simulate past, present, and future behavior.
- **Why it matters:** Enables predictive maintenance, virtual prototyping, and remaining useful life (RUL) estimation without disrupting live plant operations.
- **Related concepts:** Surrogate Model, RUL Estimation, Physics-Informed ML, Asset Administration Shell.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 14.
- **Verification status:** source-backed

### 7. Defense-in-Depth (DiD)
- **Definition:** A multi-layered security strategy for industrial control systems encompassing physical security, network firewalls, DMZ segmentation, encrypted transport, and policy enforcement.
- **Why it matters:** Protects critical operational technology from unauthorized access, cyberattacks, and malware propagation.
- **Related concepts:** Network Segmentation, DMZ, OPC Proxy, X.509 Certificates.
- **Citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 5.
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1: Edge-to-Cloud Store-and-Forward Spooling Pattern
- **Problem solved:** Network instability between field edge gateways and cloud brokers causes lost telemetry during WAN disconnections.
- **Recommended approach:** Configure a local persistent spool directory on the edge gateway container and attach a spooler service to buffer telemetry messages to disk during connection dropouts.
- **Repository-level manifestation:** Docker Compose manifests (`docker-compose.yml`) defining persistent volume mounts mapped to edge spool directories (`/var/spool/edge/`) alongside reconnect configuration flags in MQTT/edge client initialization code.
- **Limitations:** Local disk space on constrained hardware can fill up during extended network disconnections.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 9.

### Pattern 2: Graph-Driven Telemetry Contextualization Pattern
- **Problem solved:** Raw numerical sensor telemetry payloads lack asset metadata, engineering units, and threshold definitions necessary for downstream analytics.
- **Recommended approach:** Maintain a graph-based asset registry (e.g. Cypher/Neo4j or AWS SiteWise) that maps incoming MQTT topics or OPC node IDs to physical asset entities and metadata parameters.
- **Repository-level manifestation:** Cypher migration scripts (`.cypher`) creating asset nodes, measure nodes, and `BELONGING_OF` / `MEASURE_OF` relationships alongside graph query parser modules in data ingestion pipelines.
- **Limitations:** Requires synchronized updates between physical plant asset changes and graph database schema entries.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.

### Pattern 3: Dual-Proxy OPC UA Tunneling across Network Firewalls
- **Problem solved:** DCOM-based OPC Classic protocols cannot cross corporate firewalls securely without exposing vulnerable RPC ports.
- **Recommended approach:** Deploy an internal OPC Proxy inside the control network to convert DCOM traffic into an encrypted, single-port TCP tunnel that terminates at an external OPC Proxy inside the corporate DMZ.
- **Repository-level manifestation:** Architecture-as-code manifests defining dual OPC Proxy container definitions with single-port TCP firewall rules and X.509 certificate bindings.
- **Limitations:** Adds extra network hop latency between field controllers and edge clients.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 5.

### Pattern 4: Containerized Edge Deployment Manifest with Isolated Docker Networks
- **Problem solved:** Unisolated microservices running on edge gateways can interfere with each other or expose vulnerable admin ports to field networks.
- **Recommended approach:** Deploy edge services (Mosquitto, Telegraf, InfluxDB) within dedicated internal Docker bridge networks with explicit resource limits and restricted port exposure.
- **Repository-level manifestation:** Docker Compose manifests (`docker-compose.yml`) specifying `networks:` isolation, `cpus:`/`mem_limit:` definitions, and `healthcheck:` probes.
- **Limitations:** Requires proper volume configuration to persist database states across container restarts.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.

---

## 8. Common failure modes and risks
1. **Hardcoded Plaintext Secrets and Endpoints in Edge Configurations:**
   - *Why it happens:* Developers hardcode MQTT passwords, AWS access keys, or OPC security credentials directly inside configuration files or container environment blocks for rapid testing.
   - *Early warning signs:* Credentials committed to version control, unencrypted passwords visible in plaintext configuration files.
   - *Repository evidence:* Plaintext string assignments for `password`, `secret_key`, or `client_secret` in `.yaml`, `.json`, or `.env` files.
   - *Severity tendency:* error
2. **Unbuffered Direct Telemetry Egress Over Unstable WAN Connections:**
   - *Why it happens:* Edge gateways forward incoming sensor streams directly to remote cloud brokers without a persistent local queue or spool directory.
   - *Early warning signs:* Telemetry data gaps during network latency spikes or router disconnections.
   - *Repository evidence:* Absence of local file volume mounts or spool directory definitions in edge service deployment manifests.
   - *Severity tendency:* warning
3. **Schema Drift between Asset Registry Graph and Edge Telemetry Payloads:**
   - *Why it happens:* Field technicians update sensor tag names or MQTT topics on edge gateways without updating node properties in the graph asset registry.
   - *Early warning signs:* Unmapped sensor topics, NULL metadata query returns, or failed analytics pipeline joins.
   - *Repository evidence:* Hardcoded topic string literals in edge code that do not match Cypher database seed scripts.
   - *Severity tendency:* warning
4. **Permissive Security Policies in Edge Messaging Brokers:**
   - *Why it happens:* Edge MQTT or OPC UA brokers are deployed with wildcards (`*` or `#`) in pub/sub permissions or anonymous access enabled to bypass certificate setup.
   - *Early warning signs:* Unauthorized client connections, full-broker topic sniffing, or unauthenticated write commands.
   - *Repository evidence:* Policy JSON files containing `"Action": "iot:*"` or `"Resource": "*"` without granular topic restrictions.
   - *Severity tendency:* critical
5. **Unbounded Local Disk Accumulation on Constrained Edge Hardware:**
   - *Why it happens:* Local time-series database or log files accumulate without retention policies or log rotation rules on constrained gateway storage.
   - *Early warning signs:* Disk space exhaustion, edge container crashes, or corrupted local databases.
   - *Severity tendency:* warning

---

## 9. Repository-audit translation

### Static checks (automated)
- Inspect Docker Compose files (`docker-compose*.yml`) for missing volume mounts designated for store-and-forward disk spooling (`/var/spool` or `spool`).
- Scan edge configuration files (`.json`, `.yaml`, `.conf`, `.env`) for hardcoded plaintext passwords, secret keys, or AWS access tokens.
- Verify that telemetry JSON schemas (`*schema*.json`) enforce mandatory timestamp (`timestamp`), unit (`uom`), and quality metadata fields.
- Audit Digital Twin model files (`*twin*.json` or DTDL models) for explicit model version identifiers (`@id` or `version`).
- Check edge client source code (`.py`, `.js`, `.go`) for explicit automatic reconnect and retry configuration settings.
- Check Docker Compose manifests for CPU and memory resource limit definitions (`cpus`, `mem_limit`) on edge containers.
- Verify the presence of health check probe declarations (`healthcheck`) in edge container manifests.

### Human review (contextual)
- Evaluate whether the boundary between edge-processed analytics and cloud-processed analytics aligns with network bandwidth constraints and site latency requirements.
- Review OPC UA node tree structures and ISA-95 asset hierarchy depth to ensure accurate representation of physical plant equipment.
- Assess the operational resilience of failover and fallback procedures during multi-day network disconnections.
- Verify that X.509 certificate provisioning and rotation procedures comply with organizational zero-trust cybersecurity policies.

---

## 10. Candidate rules

### Rule 1
- **Rule ID:** iiot-edge-001
- **Title:** Edge Container Manifest Missing Store-and-Forward Spool Directory
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Edge gateway containers forwarding telemetry over WAN connections must define a local persistent volume mount for spooling to prevent telemetry loss during network disconnections.
- **Source-backed basis:** Store-and-forward spoolers buffer messages locally on persistent storage during network disconnections.
- **Repository evidence to inspect:** Docker Compose files (`docker-compose*.yml`) defining edge services.
- **Pass condition:** The container manifest defines a volume mount mapped to a spool, buffer, or local storage directory.
- **Fail condition:** The edge container manifest defines no persistent volume mount for message buffering.
- **Exceptions or limitations:** Edge containers operating on hardware with read-only root filesystems using external hardware buffers.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 9.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 9: Building an AWS Industrial IoT Solution`
- **Spirit locator:** Local spooling components buffer outgoing telemetry messages locally during disconnections to ensure zero data loss.
- **Verification status:** source-backed

---

### Rule 2
- **Rule ID:** iiot-device-001
- **Title:** Hardcoded Plaintext Credentials in Edge Broker Configuration
- **Profile:** iiot
- **Severity tendency:** error
- **Rationale:** Edge messaging configuration files must not contain hardcoded plaintext passwords or keys to prevent credential leaks.
- **Source-backed basis:** Security credentials must be provided securely via environment variables or secret stores rather than hardcoded strings.
- **Repository evidence to inspect:** Edge configuration files (`.json`, `.conf`, `.yaml`, `.env`).
- **Pass condition:** Password and secret fields use variable expansion or secret store placeholders.
- **Fail condition:** Configuration files contain hardcoded plaintext password string literals.
- **Exceptions or limitations:** Mock credential values in local test fixture files explicitly excluded from production builds.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 9.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 9: Building an AWS Industrial IoT Solution`
- **Spirit locator:** Credentials for edge devices must be managed dynamically using IAM policies and secret stores.
- **Verification status:** source-backed

---

### Rule 3
- **Rule ID:** iiot-telemetry-001
- **Title:** Telemetry Schema Specification Lacks Mandatory Timestamp Metadata
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field to support chronological indexing in time-series databases.
- **Source-backed basis:** Time-series datapoints require timestamped raw data streams for proper time-series indexing and interpolation.
- **Repository evidence to inspect:** Telemetry JSON schema files (`*schema*.json`).
- **Pass condition:** The schema explicitly requires a `timestamp`, `time_iso`, or `dateTime` field.
- **Fail condition:** The schema specifies sensor value fields but omits a mandatory timestamp field.
- **Exceptions or limitations:** High-frequency binary streams where timestamps are implicitly derived at batch header level.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 8: Implementing a Custom Industrial IoT Platform`
- **Spirit locator:** Industrial measures must carry timestamp metadata to allow accurate time-series queries and graph joins.
- **Verification status:** source-backed

---

### Rule 4
- **Rule ID:** iiot-twin-001
- **Title:** Digital Twin Model Definition Omits Model Version Identifier
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Digital Twin interface model definitions must contain an explicit version identifier to manage model evolution and backward compatibility.
- **Source-backed basis:** Digital twin models require explicit versioning syntax in interface identifiers (e.g., `dtmi:com:example:Pump;1`).
- **Repository evidence to inspect:** Digital twin interface JSON / DTDL model files (`*twin*.json`).
- **Pass condition:** Model definition `@id` or `version` field includes an explicit numeric version suffix.
- **Fail condition:** Digital Twin interface definition lacks a version suffix or version property.
- **Exceptions or limitations:** Unversioned experimental draft templates inside local developer scratch directories.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 8: Implementing a Custom Industrial IoT Platform`
- **Spirit locator:** Asset model definitions must support explicit versioning to enable compatibility across evolving software tools.
- **Verification status:** source-backed

---

### Rule 5
- **Rule ID:** iiot-offline-001
- **Title:** Edge MQTT Client Missing Automatic Reconnect Configuration
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Edge messaging client initialization code must specify automatic reconnect logic to resume session communication after disconnections.
- **Source-backed basis:** Clients must manage network disconnections gracefully by re-establishing sessions automatically.
- **Repository evidence to inspect:** Edge MQTT client initialization source code (`.py`, `.js`, `.ts`, `.go`).
- **Pass condition:** Client setup explicitly enables reconnect options, retry intervals, or keepalive parameters.
- **Fail condition:** Client initialization disables automatic reconnect or sets retry count to zero.
- **Exceptions or limitations:** One-shot CLI utility scripts designed for manual diagnostics.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 9.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 9: Building an AWS Industrial IoT Solution`
- **Spirit locator:** Edge connections must implement automated reconnection logic to maintain resilience over unstable networks.
- **Verification status:** source-backed

---

### Rule 6
- **Rule ID:** iiot-hw-001
- **Title:** Edge Container Manifest Omits Resource Limits
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Containerized edge services must define CPU and memory constraints to prevent resource starvation on constrained gateway hardware.
- **Source-backed basis:** Edge gateways operate on constrained resources and require explicit resource governance.
- **Repository evidence to inspect:** Edge container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definitions specify `cpus`, `memory`, or `mem_limit` constraints.
- **Fail condition:** Container service definitions omit CPU and memory resource limits.
- **Exceptions or limitations:** Development environment configurations running on high-performance desktop workstations.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 8: Implementing a Custom Industrial IoT Platform`
- **Spirit locator:** Containerized edge services must enforce resource limits to ensure system stability on gateway devices.
- **Verification status:** source-backed

---

### Rule 7
- **Rule ID:** iiot-006
- **Title:** Edge Microservice Manifest Lacks Health Check Endpoint
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Microservices running on edge gateways should declare local health check probes to allow local container orchestrators to restart failed services automatically.
- **Source-backed basis:** Edge microservices require automated health monitoring mechanisms for autonomous local recovery.
- **Repository evidence to inspect:** Container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definition includes a `healthcheck` block with test command and interval.
- **Fail condition:** Service definition lacks a `healthcheck` probe declaration.
- **Exceptions or limitations:** Ephemeral init-containers that run once and exit upon completing initialization tasks.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 8: Implementing a Custom Industrial IoT Platform`
- **Spirit locator:** Autonomous edge microservices must provide local health checks to support self-healing deployment lifecycles.
- **Verification status:** source-backed

---

### Rule 8
- **Rule ID:** iiot-004
- **Title:** OPC UA Client Transport Security Disabled
- **Profile:** iiot
- **Severity tendency:** critical
- **Rationale:** OPC UA client endpoints connecting field gateways to controllers must enforce transport security (signing and encryption) rather than allowing SecurityMode `None`.
- **Source-backed basis:** OPC UA security specifications require validation of application instance certificates and encrypted secure channels.
- **Repository evidence to inspect:** OPC UA client endpoint configuration files or initialization scripts.
- **Pass condition:** Client security mode is configured to `SignAndEncrypt` or `Sign` with X.509 certificate validation.
- **Fail condition:** Client configuration explicitly specifies SecurityMode `None` or disables certificate checking.
- **Exceptions or limitations:** Isolated sandbox testing environments using local simulated OPC UA servers.
- **YAML readiness:** needs-review
- **Reason if not ready:** Evaluating OPC UA security modes accurately across multi-language client SDKs requires an AST/configuration parser to prevent false positives.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 4.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 4: Implementing the Industrial IoT Data Flow`
- **Spirit locator:** Industrial data communication over OPC UA must enforce session encryption and certificate-based identity validation.
- **Verification status:** source-backed

---

### Rule 9
- **Rule ID:** iiot-005
- **Title:** Asset Registry Graph Schema Lacks Uniqueness Constraint
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Graph-based asset registries must declare uniqueness constraints on asset identifiers to prevent duplicate nodes during synchronization runs.
- **Source-backed basis:** Cypher asset model creation requires unique name/ID indexing to guarantee a single source of truth.
- **Repository evidence to inspect:** Neo4j Cypher initialization scripts (`.cypher`).
- **Pass condition:** Cypher script contains `CREATE CONSTRAINT ... REQUIRE n.name IS UNIQUE` or `REQUIRE n.id IS UNIQUE`.
- **Fail condition:** Asset node creation scripts define `CREATE` statements without enforcing uniqueness constraints on asset keys.
- **Exceptions or limitations:** Transient in-memory graph models generated dynamically for temporary batch calculations.
- **YAML readiness:** needs-review
- **Reason if not ready:** Verifying Cypher schema uniqueness statements requires a specialized Cypher AST parser not supported by simple pattern match checks.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 8.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 8: Implementing a Custom Industrial IoT Platform`
- **Spirit locator:** Graph asset models must maintain unique entity keys to ensure deterministic mapping between physical assets and digital twins.
- **Verification status:** source-backed

---

### Rule 10
- **Rule ID:** cross-iiot-dataops-001
- **Title:** Ingestion Pipeline Job Missing Out-of-Order Timestamp Handling
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Telemetry ingestion pipelines ingesting store-and-forward batches must handle out-of-order timestamps explicitly during windowing calculations.
- **Source-backed basis:** Time-series data arriving from reconnected edge gateways contains historical timestamps requiring out-of-order stream reordering.
- **Repository evidence to inspect:** Stream processing pipeline source code (Airflow DAGs, Stream Analytics queries).
- **Pass condition:** Windowing queries specify explicit watermark delays or out-of-order tolerance parameters.
- **Fail condition:** Stream windowing operations assume strictly monotonic real-time arrival without out-of-order handling.
- **Exceptions or limitations:** Real-time alerting pipelines where historical replayed data is routed directly to cold storage.
- **YAML readiness:** blocked
- **Reason if not ready:** Stream processing watermark and windowing logic cannot be evaluated using static file checks or pattern matching.
- **Source citation:** `Hands-On Industrial Internet of Things, Second Edition`, Chapter 12.
- **Source:** Hands-On Industrial Internet of Things, Second Edition
- **Structural locator:** `Chapter 12: Implementing an Industrial IOT Data Flow with Azure`
- **Spirit locator:** Time-series ingestion streams must accommodate delayed store-and-forward telemetry payloads without corrupting window aggregations.
- **Verification status:** source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: "iiot-edge-001"
    title: "Edge Container Manifest Missing Store-and-Forward Spool Directory"
    profile: "iiot"
    severity: "warning"
    message: "Edge deployment manifests should configure a local volume mount for store-and-forward spooling to survive network disconnections."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "store-and-forward"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "spool|buffer|storage"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-device-001"
    title: "Hardcoded Plaintext Credentials in Edge Broker Configuration"
    profile: "iiot"
    severity: "error"
    message: "Edge broker or client configurations must not contain hardcoded plaintext passwords or keys."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "device-security"
    check:
      type: "pattern_match"
      file_glob: "**/*.{json,conf,yaml,yml}"
      pattern: "(password|secret|auth_token)\\s*[:=]\\s*[\"'][^\"'${}]+[\"']"
      must_exist: false
      error_when: "pattern_present"

  - id: "iiot-telemetry-001"
    title: "Telemetry Schema Specification Lacks Mandatory Timestamp Metadata"
    profile: "iiot"
    severity: "warning"
    message: "Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field for proper time-series ingestion."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "telemetry-metadata"
    check:
      type: "pattern_match"
      file_glob: "**/*schema*.json"
      pattern: "timestamp|time_iso|dateTime"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-twin-001"
    title: "Digital Twin Model Definition Omits Model Version Identifier"
    profile: "iiot"
    severity: "warning"
    message: "Digital twin interface model definitions must contain a version identifier to support model evolution."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "twin-versioning"
    check:
      type: "pattern_match"
      file_glob: "**/*twin*.json"
      pattern: "@id.*:+|version"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-offline-001"
    title: "Edge MQTT Client Missing Automatic Reconnect Configuration"
    profile: "iiot"
    severity: "warning"
    message: "Edge MQTT client initialization must configure automatic reconnect logic for offline resilience."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "offline-resilience"
    check:
      type: "pattern_match"
      file_glob: "**/*.{py,js,ts,go,c,cpp}"
      pattern: "reconnect|retry|keepalive"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-hw-001"
    title: "Edge Container Manifest Omits Resource Limits"
    profile: "iiot"
    severity: "info"
    message: "Edge container services should define CPU and memory limits to prevent hardware exhaustion."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "hardware-constraints"
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
    message: "Edge service deployment definitions should include health check probes to monitor container health locally."
    references:
      - book: "Hands-On Industrial Internet of Things, Second Edition"
        concept: "edge-health-monitoring"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "healthcheck"
      must_exist: true
      error_when: "pattern_absent"
```

### Candidates not emitted
- `iiot-004` (Requires AST or structured configuration parser to verify OPC UA transport security settings without false positives).
- `iiot-005` (Requires AST parser for Cypher query syntax to verify uniqueness constraints).
- `cross-iiot-dataops-001` (Cannot evaluate stream watermark and out-of-order reordering logic using static pattern checks).

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

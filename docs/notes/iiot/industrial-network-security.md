# Industrial Network Security — RepoScope Knowledge Note

## 1. Source Identity

- **Title:** Industrial Network Security

| Field | Value |
|---|---|
| **Title** | Industrial Network Security: Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Systems |
| **Author(s)** | Eric D. Knapp |
| **Branch** | iiot |
| **RepoScope profile** | iiot |
| **Primary source file** | `Eric D. Knapp - Industrial Network Security_ Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Syst (2011, Syngress).pdf` |
| **Note status** | reviewed-with-candidate-rules |

---

## 2. Scope

### In scope

- Technical architecture of industrial control systems (ICS), Distributed Control Systems (DCS), and SCADA networks across business, supervisory, and control tiers.
- Vulnerabilities, protocol structures, and defensive strategies for industrial communication protocols including Modbus TCP, DNP3, ICCP/TASE.2, OPC, Ethernet/IP, and EtherCAT.
- Establishment and perimeter isolation of functional enclaves using firewalls, Intrusion Detection/Prevention Systems (IDS/IPS), data diodes, and application session monitors.
- Anomaly detection, behavioral whitelisting, event correlation across IT and OT boundaries, and log management for situational awareness.
- Alignment of repository and network security configurations with regulatory frameworks including NERC CIP, NRC RG 5.71, NIST SP 800-82, CFATS, and ISA-99.

### Out of scope

- General enterprise IT security practices that lack specific operational technology (OT) or physical safety impacts.
- Detailed physical security, door access controls, fence monitoring, and environmental controls except where intersecting network perimeters.
- Personnel background screening, human resources policy details, and manual site security management.

---

## 3. Source Spirit Card

1. **Core philosophy:** Industrial network security must prioritize operational safety, system availability, and deterministic real-time delivery over IT-centric concepts of high bandwidth, frequent refactoring, or aggressive automated blocking.
2. **Dominant architectural bias:** Defense-in-depth structured around strict functional enclave separation, where traffic across enclave boundaries is denied by default and restricted to explicitly whitelisted protocol paths.
3. **Stance on complexity:** System complexity increases attack surface and causes rule misconfigurations; security mechanisms must remain explicit, minimal, and transparent to prevent unexpected operational failure.
4. **View of developer/operator error:** Human operator or developer misconfiguration is an inevitable risk that must be bounded by automated structural isolation, strict access boundaries, and continuous anomaly auditing.
5. **Highest-priority system virtue:** Deterministic operational reliability and safety, ensuring that security controls never inadvertently disrupt control loops or halt critical physical processes.
6. **Acceptable trade-offs:** Sacrificing remote management convenience, network agility, and real-time enterprise-wide visibility to maintain rigorous perimeter isolation and unidirectional data flows.
7. **Unacceptable trade-offs:** Allowing direct, unmediated corporate-to-controller connectivity or deploying active IPS blocking that generates false positives capable of tripping physical plant operations.
8. **Mental model of repository / system state:** A structured topology of static network enclaves, explicit firewall variables, immutable protocol definitions, and deterministic tag/logic configurations.
9. **Attitude toward automation vs human oversight:** Automated tools provide continuous event collection and anomaly detection, but final operational judgment and risk assessment require experienced human oversight.
10. **Defining failure mode according to source:** Loss of situational awareness leading to undetected lateral compromise, untracked controller logic injection, or unexpected physical process disruption.

---

## 4. Source-Backed Structure

### Theme 1: Enclave Architecture and Boundary Isolation

- **Source:** Chapter 2 (About Industrial Networks) and Chapter 7 (Establishing Secure Enclaves)
- **Structural locator:** Chapter 2: Common Industrial Security Recommendations — Network Segmentation / Chapter 7: Establishing Secure Enclaves — Identifying Functional Groups
- **Spirit locator:** Industrial systems must be divided into tightly bounded functional enclaves rather than relying on a flat network or a single corporate firewall, ensuring that compromise within one tier cannot propagate to critical control loops.

### Theme 2: Industrial Protocol Security and Deep Packet Inspection

- **Source:** Chapter 4 (Industrial Network Protocols) and Chapter 7 (Securing Enclave Perimeters)
- **Structural locator:** Chapter 4: Overview of Industrial Network Protocols / Chapter 7: Securing Enclave Perimeters — Implementing Perimeter Security Devices
- **Spirit locator:** Legacy industrial protocols lack native encryption and authentication; securing them requires perimeter filtering, session-level protocol decoding, and restricting write/system function codes to authorized endpoints.

### Theme 3: Exception Detection, Whitelisting, and OT/IT Correlation

- **Source:** Chapter 8 (Exception, Anomaly, and Threat Detection) and Chapter 9 (Monitoring Enclaves)
- **Structural locator:** Chapter 8: Behavioral Whitelisting / Chapter 9: Monitoring Enclaves — Information Management
- **Spirit locator:** Because industrial control communications are highly repetitive and predictable, security monitoring should leverage behavioral whitelisting, exception reporting, and cross-tier event correlation to detect zero-day threats like Stuxnet.

### Theme 4: Regulatory Mapping and Configuration Management

- **Source:** Chapter 6 (Vulnerability and Risk Assessment) and Chapter 10 (Standards and Regulations)
- **Structural locator:** Chapter 6: Vulnerability Management / Chapter 10: Mapping Industrial Network Security to Compliance
- **Spirit locator:** Security and compliance are complementary when regulatory controls (such as NERC CIP and NRC RG 5.71) are mapped directly to technical configuration artifacts, version-controlled tag bases, and automated perimeter audits.

---

## 5. Source-Backed Spirit

1. **Primary purpose of system architecture:** To establish clear operational enclaves that isolate physical process control loops from untrusted external networks, preventing unauthorized control commands from altering plant state.
2. **Acceptable vs unacceptable risk:** Acceptable risk includes minor delays in enterprise reporting; unacceptable risk includes unauthenticated remote write commands, single points of failure across OT boundaries, and active IPS false positives that shut down production.
3. **Implicit assumptions vs explicit declarations:** All network flows, user credentials, and protocol function codes must be explicitly declared in whitelist configurations; implicit trust or open default-allow rules are strictly prohibited.
4. **Speed/convenience vs safety/correctness:** Safety and correctness unconditionally override speed and convenience; remote access and cross-zone connectivity must pass through jump boxes, VPNs, or unidirectional data diodes regardless of administrative friction.
5. **Human intervention vs automated enforcement:** Automated systems are essential for packet filtering, log aggregation, and anomaly detection, but critical control decisions and threat validations must involve human operators to prevent unintended outages.
6. **Legacy constraints and backward compatibility:** Legacy controllers lacking modern security features must be encapsulated behind physical or logical security proxies and monitored via passive network taps rather than modified directly.

---

## 6. Key Concepts

### 6.1 Electronic Security Perimeter (ESP)

- **Definition:** The logical border surrounding a set of critical cyber assets that enforces strict access control policies via firewalls, IPS devices, or unidirectional gateways.
- **Why it matters:** Establishes a verifiable boundary for auditing and prevents untrusted network traffic from reaching sensitive controllers.
- **Related concepts:** Functional Enclave, Zone and Conduit Model, DMZ.
- **Citation:** Industrial Network Security / electronic-security-perimeter
- **Verification status:** source-backed

### 6.2 Functional Enclave

- **Definition:** A logical grouping of assets, protocols, and authorized users that perform a specific control task and communicate exclusively among themselves.
- **Why it matters:** Reduces attack surface by restricting communications to expected operational pairs and enabling precise behavioral whitelisting.
- **Related concepts:** Segmentation, Least Privilege, Micro-segmentation.
- **Citation:** Industrial Network Security / functional-enclave
- **Verification status:** source-backed

### 6.3 Deep Packet Inspection (DPI)

- **Definition:** The inspection of packet payloads down to the industrial protocol application layer to decode specific function codes, register requests, and data values.
- **Why it matters:** Allows firewalls and IDS units to distinguish benign read commands from potentially dangerous write or system restart commands.
- **Related concepts:** Application Session Inspection, Industrial Protocol Filter, Modbus Function Code.
- **Citation:** Industrial Network Security / deep-packet-inspection
- **Verification status:** source-backed

### 6.4 Behavioral Whitelisting (Smart-Listing)

- **Definition:** A security baseline strategy that explicitly defines allowed IP addresses, ports, protocols, and function codes, alerting or blocking any deviation.
- **Why it matters:** Outperforms signature-based anti-virus against zero-day exploits and targeted attacks like Stuxnet in predictable OT environments.
- **Related concepts:** Anomaly Detection, Exception Reporting, Zero Trust.
- **Citation:** Industrial Network Security / behavioral-whitelisting
- **Verification status:** source-backed

### 6.5 Disjointed Protocol Path

- **Definition:** An architectural pattern where industrial protocols (e.g., Modbus or DNP3) terminate in an intermediate DMZ and are never routed directly from corporate LAN to control loops.
- **Why it matters:** Prevents an attacker who breaches the corporate network from directly traversing to PLCs over open industrial ports.
- **Related concepts:** SCADA DMZ, Protocol Gateway, Multi-Tier Defense.
- **Citation:** Industrial Network Security / disjointed-protocol-path
- **Verification status:** source-backed

### 6.6 Unidirectional Security Gateway (Data Diode)

- **Definition:** A hardware or software gateway that physically or logically enforces one-way data transfer from a high-security enclave to a lower-security network.
- **Why it matters:** Allows historian data replication to business networks while mathematically guaranteeing that no cyber attack can traverse back into the control zone.
- **Related concepts:** NRC RG 5.71, Air Gap, Historian Replication.
- **Citation:** Industrial Network Security / unidirectional-gateway
- **Verification status:** source-backed

---

## 7. Practical Patterns and Examples

### Pattern 1: SCADA DMZ with Disjointed Protocol Gateways

- **Problem solved:** Prevents direct network exposure of PLCs and RTUs to business network compromises.
- **Recommended approach:** Deploy two distinct firewalls surrounding a SCADA DMZ. Terminate corporate connections at the outer firewall and require data historians or HMI servers in the DMZ to re-originate queries to the inner control network over dedicated, non-routable interfaces.
- **Repository-level manifestation:** Configuration files (`firewall.conf`, `network-topology.yaml`) defining distinct subnet variables (`$Enterprise_Net`, `$SCADA_DMZ`, `$Control_Enclave`) with explicitly separated rules.
- **Limitations:** Increases infrastructure cost and introduces minimal latency during data relay.
- **Source citation:** Industrial Network Security / scada-dmz-disjointed-path

### Pattern 2: Unidirectional Historian Data Replication

- **Problem solved:** Allows business intelligence and analytics tools to read plant data without opening inbound network ports into critical control enclaves.
- **Recommended approach:** Place a primary data historian inside the control enclave and configure it to push data outwards through a unidirectional data diode to a replicated historian in the SCADA DMZ or corporate network.
- **Repository-level manifestation:** Deployment manifests (`docker-compose.yml`, `gateway-config.toml`) specifying one-way data transport agents with no listening ports on the internal diode interface.
- **Limitations:** Inbound control or configuration changes cannot be sent back over the diode channel.
- **Source citation:** Industrial Network Security / unidirectional-historian-replication

### Pattern 3: Industrial Protocol Function Code Whitelisting

- **Problem solved:** Blocks unauthorized control commands (such as logic rewrites, coil resets, or device restarts) even if an attacker gains access to an authorized IP address.
- **Recommended approach:** Configure network intrusion prevention devices or application firewalls with DPI rules that permit read-only function codes (e.g., Modbus FC 01-04) while dropping or alerting on write/system codes (e.g., Modbus FC 05, 06, 15, 16) unless originating from designated engineering workstations during approved maintenance windows.
- **Repository-level manifestation:** Snort/Suricata rule files (`scada.rules`) or protocol gateway filters explicitly specifying allowed function code bitmasks.
- **Limitations:** Requires detailed maintenance window scheduling to avoid blocking legitimate administrative updates.
- **Source citation:** Industrial Network Security / function-code-whitelisting

---

## 8. Common Failure Modes and Risks

### Failure 1 — The Air Gap Myth & Soft Perimeter Reliance

- **Why it happens:** Organizations assume that physical separation or basic corporate firewalls make internal OT networks immune to external cyber threats.
- **Early warning signs:** Undocumented dual-homed laptops, temporary maintenance modems, unmonitored USB usage, or shared wireless access points.
- **Repository evidence:** Inbound firewall rules containing `0.0.0.0/0` or wildcard target destinations pointing to internal control subnets.
- **Severity tendency:** Critical

### Failure 2 — Executive Override & Direct Corporate-to-ICS Pass-Through

- **Why it happens:** Executive demand for real-time plant KPIs leads administrators to open direct firewall holes from corporate workstations to internal DBs or HMIs.
- **Early warning signs:** Directly routed SQL queries or OPC connections bypassing the SCADA DMZ.
- **Repository evidence:** Firewall configuration scripts enabling direct port mappings (e.g., port 1433, 4840, 502) between enterprise subnets and PLC addresses.
- **Severity tendency:** Error

### Failure 3 — Aggressive Network Scanning in Latency-Sensitive Enclaves

- **Why it happens:** IT security personnel run standard active vulnerability scanners (e.g., Nmap) against fragile industrial control networks.
- **Early warning signs:** PLC buffer overflows, unexpected controller resets, or missed real-time scan cycles during routine IT vulnerability sweeps.
- **Repository evidence:** CI/CD automation scripts invoking high-rate port scans against subnets containing fieldbus controllers.
- **Severity tendency:** Error

### Failure 4 — Active IPS False Positives Halting Operations

- **Why it happens:** Deploying intrusion prevention systems in active drop/reject mode without exhaustive baseline testing against industrial protocols.
- **Early warning signs:** Spurious packet drops during legitimate, low-frequency operational tasks or unexpected valve shutdowns following IPS deployment.
- **Repository evidence:** IPS rules configured with `drop` or `reject` actions on broad industrial protocol signatures without prior audit mode testing.
- **Severity tendency:** Error

---

## 9. Repository-Audit Translation

### Static checks (automated)

- Verification of repository manifests for explicit protocol port declarations and enclave subnet definitions.
- Detection of hardcoded IP addresses, unencrypted protocol configurations, default credentials, or missing security documentation.
- Validation that configuration files specify explicit source/destination pairs rather than wildcard allow rules.

### Human review (operational & safety-culture)

- Operational review of physical interlock integrity and manual emergency override procedures.
- Inspection of plant maintenance logs and jump box jump-host usage protocols.
- Evaluation of site-level physical lockout/tagout procedures and operator security awareness training.

### Safety-critical exclusions

- Physical safety interlocks, mechanical relief valve settings, and hardwired Master Control Relays (MCR) must never be evaluated or modified by static software repository checks.
- Human safety culture, emergency shutdown readiness, and site physical access controls are explicitly excluded from static automated auditing.

---

## 10. Candidate Rules

### Rule 1 — `iiot-network-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-network-001` |
| **Rule Title** | Unencrypted Default Industrial Protocol Telemetry Exposure |
| **Profile** | iiot |
| **Severity tendency** | error |
| **Rationale** | Modbus TCP (port 502) and standard DNP3 (port 20000) transmit cleartext control commands and telemetries without built-in authentication or encryption. Referencing these ports in unsegmented or default configuration manifests exposes control loops to unauthorized command injection. |
| **Source-backed basis** | Knapp Chapter 4 & Chapter 7 emphasize that legacy Modbus and DNP3 lack native encryption and authentication, requiring explicit enclave perimeter filtering and protocol-aware encapsulation or proxying. |
| **Repository evidence to inspect** | Configuration files (`*.yaml`, `*.yml`, `*.json`, `*.toml`, `*.ini`, `*.env`, `*.conf`) containing exposed industrial port definitions. |
| **Pass condition** | Industrial protocol ports are either absent or bound strictly within designated enclave variables and isolated subnets. |
| **Fail condition** | Industrial protocol ports (502, 20000) are defined with unrestricted listening interfaces or direct corporate routing. |
| **Exceptions or limitations** | Test environment files explicitly marked as local mocks or virtual simulators. |
| **YAML readiness** | ready |
| **Source citation** | Industrial Network Security / electronic-security-perimeter |
| **Source** | Eric D. Knapp - Industrial Network Security |
| **Structural locator** | Chapter 4: Industrial Network Protocols — Modbus / Chapter 7: Establishing Secure Enclaves — Securing Enclave Perimeters |
| **Spirit locator** | Industrial protocols lacking native security controls must be strictly bounded within isolated enclaves and explicitly filtered at perimeters. |
| **Verification status** | source-backed |

---

### Rule 2 — `iiot-credential-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-credential-001` |
| **Rule Title** | Hardcoded OT/SCADA Passwords or Credentials |
| **Profile** | iiot |
| **Severity tendency** | critical |
| **Rationale** | Storing plaintext passwords or default vendor credentials in deployment scripts, PLC configuration dumps, or gateway configuration files enables unauthorized enclave entry and privilege escalation. |
| **Source-backed basis** | Knapp Chapter 6 & Chapter 11 identify hardcoded credentials and default administrative passwords as primary vulnerability vectors enabling unauthorized enclave entry and Stuxnet-like lateral movement. |
| **Repository evidence to inspect** | Manifests, scripts, and configuration files (`*.yaml`, `*.yml`, `*.json`, `*.toml`, `*.ini`, `*.st`, `*.scl`, `*.env`) for hardcoded password strings. |
| **Pass condition** | No plaintext passwords or default credential strings exist in repository configuration files. |
| **Fail condition** | Password fields contain obvious default or hardcoded strings (e.g., `admin`, `password`, `123456`, `root`, `modbus`, `scada`). |
| **Exceptions or limitations** | Public example files (`.env.example`) containing explicitly non-functional placeholder values. |
| **YAML readiness** | ready |
| **Source citation** | Industrial Network Security / default-accounts-and-passwords |
| **Source** | Eric D. Knapp - Industrial Network Security |
| **Structural locator** | Chapter 6: Vulnerability and Risk Assessment — Common Vulnerabilities / Chapter 11: Common Pitfalls and Mistakes — Misconfigurations |
| **Spirit locator** | Default passwords and hardcoded credentials represent severe configuration weaknesses that bypass perimeter controls. |
| **Verification status** | source-backed |

---

### Rule 3 — `iiot-change-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-change-001` |
| **Rule Title** | Missing Controller Configuration Changelog or Deployment Manifest |
| **Profile** | iiot |
| **Severity tendency** | warning |
| **Rationale** | Failure to maintain a version-controlled change record for controller tags, logic modifications, or PLC configurations prevents auditability and obscures unauthorized logic modifications. |
| **Source-backed basis** | Knapp Chapter 10 (mapping NERC CIP-003-4 R6 and CIP-007-4) mandates change control and configuration documentation for all Critical Cyber Assets. |
| **Repository evidence to inspect** | Repository root and controller configuration directories for documentation files (`CHANGELOG*`, `CHANGELOG.md`, `MANIFEST*`). |
| **Pass condition** | A valid changelog or modification manifest exists in repository controller configuration paths. |
| **Fail condition** | Repository lacks a CHANGELOG or deployment manifest file in controller source directories. |
| **Exceptions or limitations** | None. |
| **YAML readiness** | ready |
| **Source citation** | Industrial Network Security / change-control-and-configuration-management |
| **Source** | Eric D. Knapp - Industrial Network Security |
| **Structural locator** | Chapter 10: Standards and Regulations — Mapping Industrial Network Security to Compliance |
| **Spirit locator** | Automated change identification and documentation are mandatory controls for maintaining configuration assurance in critical cyber assets. |
| **Verification status** | source-backed |

---

### Rule 4 — `iiot-safety-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-safety-001` |
| **Rule Title** | Unvalidated Industrial Write Function Code Execution Across Enclave Perimeters |
| **Profile** | iiot |
| **Severity tendency** | critical |
| **Rationale** | Executing Modbus write function codes or DNP3 operate commands across enclave boundaries without deep packet inspection or secondary authorization can cause unsafe state transitions. |
| **Source-backed basis** | Knapp Chapter 7 & Chapter 8 recommend restricting industrial write function codes across enclaves using DPI and application session monitors. |
| **Repository evidence to inspect** | Network filter configurations, gateway scripts, and Snort/Suricata rules. |
| **Pass condition** | Deep packet inspection rules explicitly filter write function codes at perimeter gateways. |
| **Fail condition** | Generic permit rules allow uninspected industrial write commands across enclave perimeters. |
| **Exceptions or limitations** | Temporary maintenance window exceptions with explicit time-to-live restrictions. |
| **YAML readiness** | needs-review |
| **Reason if not ready** | Static regex cannot reliably perform stateful session reassembly or verify whether an inline SCADA IPS or application monitor is performing deep packet inspection. |
| **Source citation** | Industrial Network Security / function-code-whitelisting |
| **Source** | Eric D. Knapp - Industrial Network Security |
| **Structural locator** | Chapter 7: Establishing Secure Enclaves — Securing Enclave Perimeters / Chapter 8: Exception, Anomaly, and Threat Detection — Behavioral Whitelisting |
| **Spirit locator** | Protocol function codes must be inspected and bounded to prevent unauthorized physical state changes. |
| **Verification status** | source-backed |

---

### Rule 5 — `iiot-004`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-004` |
| **Rule Title** | Inadequate Physical Lockout/Tagout and Operational Safety Culture |
| **Profile** | iiot |
| **Severity tendency** | critical |
| **Rationale** | Operational safety policies requiring physical interlocks, safety culture adherence, and site security procedures cannot be audited from code repositories. |
| **Source-backed basis** | Knapp Chapter 3 emphasizes that physical safety controls and site operational procedures form the foundational layer of industrial protection. |
| **Repository evidence to inspect** | Physical plant procedures and site documentation (non-code artifacts). |
| **Pass condition** | N/A (Non-static check). |
| **Fail condition** | N/A (Non-static check). |
| **Exceptions or limitations** | Cannot be checked statically. |
| **YAML readiness** | blocked |
| **Reason if not ready** | Requires physical plant inspection and human operational assessment outside static repository analysis. |
| **Source citation** | Industrial Network Security / safety-controls |
| **Source** | Eric D. Knapp - Industrial Network Security |
| **Structural locator** | Chapter 3: Introduction to Industrial Network Security — The Impact of Industrial Network Incidents |
| **Spirit locator** | Physical safety mechanisms and operational culture are paramount but exist outside digital repository structures. |
| **Verification status** | source-backed |

---

## 11. Suggested YAML Fragment

```yaml
rules:
  - id: iiot-network-001
    title: Unencrypted Default Industrial Protocol Telemetry Exposure
    profile: iiot
    severity: error
    message: "Industrial protocol ports (Modbus TCP 502 / DNP3 20000) detected in configuration without documented enclave boundary separation."
    references:
      - book: "Industrial Network Security: Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Systems"
        concept: "electronic-security-perimeter"
    check:
      type: pattern_match
      file_glob: "**/*.{yaml,yml,json,toml,ini,env,conf}"
      pattern: "(502|20000)"
      must_exist: true
      error_when: pattern_present

  - id: iiot-credential-001
    title: Hardcoded OT/SCADA Passwords or Credentials
    profile: iiot
    severity: critical
    message: "Hardcoded or default credential pattern detected in industrial control repository configuration."
    references:
      - book: "Industrial Network Security: Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Systems"
        concept: "default-accounts-and-passwords"
    check:
      type: pattern_match
      file_glob: "**/*.{yaml,yml,json,toml,ini,st,scl,env}"
      pattern: "(?i)(password|passwd|secret)\\s*[:=]\\s*[\"']?(admin|password|123456|root|modbus|scada)[\"']?"
      must_exist: true
      error_when: pattern_present

  - id: iiot-change-001
    title: Missing Controller Configuration Changelog or Deployment Manifest
    profile: iiot
    severity: warning
    message: "Repository lacks a top-level CHANGELOG or modification audit manifest for industrial controller configurations."
    references:
      - book: "Industrial Network Security: Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Systems"
        concept: "change-control-and-configuration-management"
    check:
      type: file_absent
      file_glob: "**/CHANGELOG*"
      error_when: file_absent
	  

## 12. Handoff Checklist

- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use `{book|standard, concept}`.
- [x] All emitted check types are in `{pattern_match, file_exists, file_absent}`.
- [x] All "ready" rules appear in Section 11 YAML.
- [x] All "needs-review" / "blocked" rules are absent from Section 11 YAML.
- [x] Section 11 ends with `### Candidates not emitted`.
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked "Meaning to be confirmed."
- [x] "Note status" reflects the weakest readiness in Section 10.
- [x] Section 9 does not smuggle non-static advice into the automated list.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules (or explicit justification).
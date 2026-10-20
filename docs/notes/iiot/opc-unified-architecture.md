# OPC Unified Architecture — RepoScope Knowledge Note

## 1. Source identity

- **Title:** OPC Unified Architecture
- Title: OPC Unified Architecture
- Author(s): Wolfgang Mahnke, Stefan-Helmut Leitner, Matthias Damm
- Branch: iiot
- RepoScope profile: iiot
- Primary source file: OPC Unified Architecture.pdf
- Note status: reviewed-with-candidate-rules

---

## 2. Scope
- In scope:
  - OPC UA Unified Address Space meta-model, NodeClasses (Object, ObjectType, Variable, VariableType, Method, ReferenceType, DataType, View), Attributes, and typed References.
  - Layered software architecture separating abstract Services (Part 4) from encoding (UA Binary, XML), security (UA-SecureConversation, WS-SecureConversation), and transport mappings (UA TCP, SOAP/HTTP) (Part 6).
  - Security model encompassing Application Instance Certificates (X.509v3), Security Policies, Security Modes (None, Sign, SignAndEncrypt), Secure Channel establishment, Session activation, and PKI trust models.
  - Information modeling mechanisms, object-oriented type hierarchies, ModellingRules, InstanceDeclarations, and domain-specific models (Data Access, Alarms & Conditions, Historical Access, Programs, PLCopen, FDI).
  - Migration strategies for Classic OPC (DA, A&E, HDA) using wrappers, proxies, and native SDK integration.
- Out of scope:
  - Vendor-specific fieldbus hardware drivers or low-level physical wiring implementations.
  - General enterprise IT web application security lacking industrial control or SCADA integration.
  - Operating system patching, general network router maintenance, or manual plant physical access controls.

---

## 3. Source spirit card
1. Core philosophy: Platform-independent, unified, and secure industrial data communications that decouple semantic object modeling from concrete wire encodings and transport mechanisms.
2. Dominant architectural bias: Strongly typed, object-oriented address space model connecting nodes in rich hierarchical and non-hierarchical mesh networks across all tiers of the automation pyramid.
3. Stance on complexity: Hide protocol serialization and cryptographic handshake complexity inside standard communication stacks and SDKs while presenting abstract, data-agnostic Services to application developers.
4. View of developer/operator error: Misconfigured endpoints (e.g., SecurityMode "None", auto-accepting untrusted certificates) represent severe security hazards that must be prevented via explicit security policies and automated validation gates.
5. Highest-priority system virtue: Deterministic, interoperable data semantics combined with robust message-level authentication, encryption, and availability across distributed operational tiers.
6. Acceptable trade-offs: Slightly higher computational overhead for asymmetric certificate handshaking and metadata exposure in exchange for complete vendor neutrality, scalability, and strong end-to-end security.
7. Unacceptable trade-offs: Depending on legacy Windows-bound COM/DCOM technology, transmitting unauthenticated control commands across plant networks, or breaking backward migration compatibility for Classic OPC installations.
8. Mental model of repository / system state: A full-meshed directed graph of Nodes (Objects, Variables, Methods) governed by object-oriented type definitions, Namespace-qualified NodeIds, and formal XML information models.
9. Attitude toward automation vs human oversight: Stacks automate chunking, encryption, and session maintenance, while administrators manage PKI trust stores, endpoint security policies, and domain-specific information model bindings.
10. Defining failure mode according to source: Exposing OPC UA endpoints with SecurityMode `None` or disabled certificate validation, enabling unauthorized remote write injection, eavesdropping, or loss of industrial process state integrity.

---

## 4. Source-backed structure

### Theme 1: Unified Address Space and Object-Oriented Meta-Model
- Source: Chapter 2 (Information Modeling: Concepts) and Chapter 3 (Information Modeling: Example and Best Practice)
- Structural locator: Chapter 2: Nodes and References / Chapter 3: Best Practices
- Spirit locator: OPC UA unifies fragmented Classic OPC interfaces into a single address space where data, alarms, and history are exposed as typed Nodes connected by semantic References.

### Theme 2: Layered Architecture, Encoding, and Transport Mappings
- Source: Chapter 5 (Services) and Chapter 6 (Technology Mapping)
- Structural locator: Chapter 5: Services Overview / Chapter 6: Data Encodings & Transport Protocols
- Spirit locator: Abstract UA Services are completely decoupled from wire transport, allowing high-performance UA TCP with binary encoding on plant floors and firewall-friendly SOAP/HTTP XML at enterprise boundaries.

### Theme 3: Defense-in-Depth Security Model and PKI Life-Cycle
- Source: Chapter 7 (Security)
- Structural locator: Chapter 7: The OPC UA Security Model & Public Key Infrastructure for OPC UA
- Spirit locator: OPC UA mandates multi-layered security using X.509 Application Instance Certificates, mutual authentication, and short-lived symmetric keys derived over asymmetric secure channels.

### Theme 4: Standard Information Models, Profiles, and Migration
- Source: Chapter 4 (Standard Information Models), Chapter 10 (Mapping of COM OPC to OPC UA), and Chapter 11 (Migration)
- Structural locator: Chapter 4: Base OPC UA Information Model / Chapter 10: Overview / Chapter 11: Proxies and Wrappers
- Spirit locator: Reusability and interoperability are achieved through standardized domain information models, certified client/server Profiles, and transparent wrapper/proxy migration bridges for legacy Classic OPC assets.

---

## 5. Source-backed spirit
1. Primary purpose of system architecture: To establish a vendor-neutral, scalable, and secure communication infrastructure that seamlessly exchanges rich object-oriented data from field sensors up to enterprise ERP systems.
2. Acceptable vs unacceptable risk: Acceptable risk includes moderate initial setup overhead for PKI certificate distribution; unacceptable risk includes unauthenticated write operations, cleartext telemetry over untrusted subnets, and unvalidated endpoint certificates.
3. Implicit assumptions vs explicit declarations: All security modes, user authentication tokens, data encodings, and node type definitions must be explicitly declared in endpoint configurations and XML information models.
4. Speed/convenience vs safety/correctness: Security and structural correctness unconditionally supersede administrative convenience; bypassing certificate validation or using unencrypted endpoints to speed up deployment violates core architectural rules.
5. Human intervention vs automated enforcement: Communication stacks automate symmetric encryption, message chunking, and session renewal, but human administrators must govern certificate issuing, trust store population, and security policy selection.
6. Legacy constraints and backward compatibility: Legacy DCOM-based Classic OPC systems must be integrated through standard OPC Foundation wrappers and proxies or mapped natively without breaking existing operational interfaces.

---

## 6. Key concepts

### 1. Address Space Model & NodeClasses
- Definition: The fundamental meta-model of OPC UA consisting of Nodes (classified into Object, ObjectType, Variable, VariableType, Method, ReferenceType, DataType, and View) and directed References between them.
- Why it matters: Provides a standardized, object-oriented framework for representing process data, complex metadata, methods, and alarms in a single navigable graph.
- Related concepts: NodeId, QualifiedName, InstanceDeclaration, HasTypeDefinition.
- Citation: OPC Unified Architecture / address-space-model
- Verification status: source-backed

### 2. UA-SecureConversation & Secure Channel
- Definition: A security layer protocol combining symmetric and asymmetric cryptographic techniques to secure message streams between OPC UA applications over UA TCP or HTTP.
- Why it matters: Negotiates short-lived symmetric keys via asymmetric handshakes, offering high-speed encryption and signature verification for real-time telemetry.
- Related concepts: OpenSecureChannel, Symmetric Key Derivation, TokenId.
- Citation: OPC Unified Architecture / ua-secure-conversation
- Verification status: source-backed

### 3. Application Instance Certificate
- Definition: An X.509v3 digital certificate uniquely assigned to a specific installed instance of an OPC UA client or server application.
- Why it matters: Enables mutual application authentication, ensuring that only trusted software instances can negotiate secure channels and exchange data.
- Related concepts: Public Key Infrastructure (PKI), Trust Store, Direct Trust.
- Citation: OPC Unified Architecture / application-instance-certificate
- Verification status: source-backed

### 4. Binary Encoding (UA Binary) vs. XML Encoding
- Definition: Serialization specifications defining how built-in and structured data types are converted into compact binary streams or XML documents for network transport.
- Why it matters: UA Binary eliminates XML parsing overhead for resource-constrained controllers, while XML offers generic human-readable interoperability for MES/ERP systems.
- Related concepts: ExtensionObject, Built-In DataTypes, Variant.
- Citation: OPC Unified Architecture / data-encodings
- Verification status: source-backed

### 5. Security Policy & Security Mode
- Definition: Configurations defining the cryptographic algorithms (e.g., Basic128Rsa15, Basic256) and message protection levels (`None`, `Sign`, `SignAndEncrypt`) supported by an endpoint.
- Why it matters: Dictates the exact cryptographic strength required for client-server communication and prevents downgrade attacks to weak encryptions.
- Related concepts: GetEndpoints, CreateSession, EndpointDescription.
- Citation: OPC Unified Architecture / security-policy-and-mode
- Verification status: source-backed

### 6. Information Model & NodeId Namespace
- Definition: A domain-specific specification (e.g., DI, ADI, PLCopen) that defines structured types and standard nodes using unique NamespaceURIs to prevent collisions.
- Why it matters: Enables generic clients to interpret complex domain semantics without prior proprietary knowledge.
- Related concepts: NamespaceIndex, NamespaceArray, Companion Specification.
- Citation: OPC Unified Architecture / information-models-and-namespaces
- Verification status: source-backed

---

## 7. Practical patterns and examples

### Pattern 1: Secure Channel & Session Handshake with Dual-Token Derivation
- Problem solved: Eliminates heavy public key cryptography overhead for routine telemetry while guaranteeing robust mutual authentication.
- Recommended approach: Client sends `GetEndpoints` to identify available endpoints, issues `OpenSecureChannel` signed/encrypted with asymmetric keys to exchange nonces, derives symmetric keys, and then issues `CreateSession` / `ActivateSession` using user identity tokens.
- Repository-level manifestation: Client/Server configuration files (`Opc.Ua.Server.Config.xml`, `appsettings.json`) specifying explicit `ServerSecurityPolicies` and `UserTokenPolicies`.
- Limitations: Requires initial distribution of trusted X.509 certificates to client and server trust stores.
- Source citation: OPC Unified Architecture / secure-channel-session-handshake

### Pattern 2: High-Performance Local Telemetry via UA TCP / UA Binary
- Problem solved: Minimizes bandwidth and CPU consumption for embedded PLCs and controllers communicating on plant floor subnets.
- Recommended approach: Configure embedded servers to expose endpoints bound to `opc.tcp://` transport with `UA Binary` encoding and `SignAndEncrypt` security mode.
- Repository-level manifestation: Deployment manifests and stack initialization code specifying `opc.tcp` binding URLs and binary encoding profiles.
- Limitations: Binary streams cannot be parsed directly by standard web browsers without an OPC UA client stack or gateway.
- Source citation: OPC Unified Architecture / ua-tcp-binary-pattern

### Pattern 3: Chained Chaining-Server / Gateway Translation
- Problem solved: Bridges isolated network segments or translates communication protocols across firewalls without degrading security.
- Recommended approach: Deploy a chaining server acting simultaneously as an OPC UA server to corporate clients (over HTTPS/XML) and an OPC UA client to plant-floor PLCs (over UA TCP/Binary).
- Repository-level manifestation: Gateway configuration manifests detailing dual endpoint mappings and isolated session forwarding rules.
- Limitations: Introduces minimal latency during message deserialization and re-encryption at the gateway.
- Source citation: OPC Unified Architecture / chaining-server-gateway

---

## 8. Common failure modes and risks

### 1. Exposing Unsecured Endpoints (`SecurityMode: None`) in Production
- Why it happens: Developers or field engineers enable `SecurityMode: None` during testing to bypass certificate setup and forget to disable it before production deployment.
- Early warning signs: Network scans reveal endpoints accepting unencrypted TCP connections on port 4840 without requiring valid certificates.
- Repository evidence: Server XML or YAML configuration manifests containing `<SecurityMode>None</SecurityMode>` or `SecurityPolicies` with `None` enabled in non-test profiles.
- Severity tendency: Critical

### 2. Auto-Accepting Unvalidated Application Instance Certificates
- Why it happens: Application developers implement custom certificate validation callbacks that unconditionally return `True` or automatically save unknown certificates to the trusted store.
- Early warning signs: The OPC UA client connects to untrusted or spoofed servers without raising certificate validation errors or prompt warnings.
- Repository evidence: C# or ANSI C SDK callback code containing `event.Accept = true;` or `AutoAcceptUntrustedCertificates = true`.
- Severity tendency: Critical

### 3. Excessive Asymmetric Cryptographic Operations on Low-Power Controllers
- Why it happens: Misconfiguring short `SecureChannelLifetime` values forces resource-constrained PLCs to execute frequent asymmetric RSA handshakes, causing CPU spikes.
- Early warning signs: High PLC scan time jitter or missed communication deadlines during periodic secure channel renewals.
- Repository evidence: Configuration manifests setting `RequestedLifetime` to excessively low values (e.g., < 60,000 ms).
- Severity tendency: Warning

### 4. Hardcoded OPC UA Server User Credentials
- Why it happens: User authentication configuration files contain plaintext usernames and passwords for `UserNameIdentityToken` validation.
- Early warning signs: Version-controlled repository files contain unencrypted administrative credentials for OPC UA user authentication.
- Repository evidence: Configuration files containing plaintext user credential mappings (e.g., `<User>admin</User><Password>secret</Password>`).
- Severity tendency: Critical

---

## 9. Repository-audit translation

### Static checks (automated)
- Parsing XML/JSON/YAML configuration manifests for OPC UA server endpoints to detect `SecurityMode: None` or insecure `SecurityPolicy` URIs.
- Scanning client and server code for flags enabling `AutoAcceptUntrustedCertificates` or bypassed certificate validation logic.
- Inspecting configuration files for plaintext hardcoded usernames, passwords, or private key file paths.
- Verifying the presence of top-level change control records and deployment manifests for OPC UA information models.

### Human review (operational & safety-culture)
- Operational review of physical PKI Certificate Authority (CA) private key storage and distribution procedures.
- Inspection of plant floor certificate revocation list (CRL) update mechanisms and OCSP responder availability.
- Evaluation of site-level procedures for managing user access role assignments within ActiveDirectory or LDAP integrations.

### Safety-critical exclusions
- Physical plant safety interlocks, hardwired emergency stop circuits, and mechanical overpressure valves are explicitly excluded from static software configuration audits.
- PKI root CA physical security, smartcard storage procedures, and operator background checks cannot be evaluated via static code inspection.

---

## 10. Candidate rules

### Candidate Rule 1
- Rule ID: iiot-opcua-001
- Title: Insecure OPC UA Endpoint SecurityMode None Selection
- Profile: iiot
- Severity tendency: error
- Rationale: OPC UA endpoints configured with `SecurityMode: None` transmit telemetry and control operations in cleartext without authentication or encryption, exposing the system to eavesdropping and unauthorized command injection.
- Source-backed basis: OPC UA Part 2 & Part 6 dictate that production endpoints must enforce message integrity and confidentiality via `Sign` or `SignAndEncrypt` security modes.
- Repository evidence to inspect: OPC UA configuration files (`*.xml`, `*.json`, `*.yaml`, `*.config`) specifying endpoint security modes.
- Pass condition: Endpoints specify `Sign` or `SignAndEncrypt` security modes and disable `None`.
- Fail condition: Endpoint configurations contain `<SecurityMode>None</SecurityMode>` or equivalent setting in non-test profiles.
- Exceptions or limitations: Isolated local development or unit test configuration manifests explicitly designated as mock environments.
- YAML readiness: ready
- Source citation: OPC Unified Architecture / security-policy-and-mode
- Source: Wolfgang Mahnke et al. - OPC Unified Architecture
- Structural locator: Chapter 6: Technology Mapping — Security Protocols / Chapter 7: Security — Security Policies and Profiles
- Spirit locator: Insecure endpoints exposing cleartext communication without authentication violate core OPC UA defense-in-depth principles.
- Verification status: source-backed

### Candidate Rule 2
- Rule ID: iiot-opcua-002
- Title: Auto-Accepting Unvalidated Application Instance Certificates
- Profile: iiot
- Severity tendency: critical
- Rationale: Automatically accepting untrusted X.509 certificates during connection handshakes bypasses mutual application authentication, enabling Man-in-the-Middle (MitM) attacks and unauthorized client connections.
- Source-backed basis: OPC UA Part 4 & Chapter 7 require strict validation of Application Instance Certificates against trusted certificate stores or Validation Authorities before establishing secure channels.
- Repository evidence to inspect: Source code files (`*.cs`, `*.cpp`, `*.c`, `*.java`, `*.py`) and configuration manifests (`*.xml`, `*.json`).
- Pass condition: Certificate validation logic explicitly verifies issuer signatures, revocation status, and trust store membership.
- Fail condition: Code contains `AutoAcceptUntrustedCertificates = true` or callback handlers that unconditionally accept unverified certificates.
- Exceptions or limitations: Explicit local mock test harnesses designed solely for automated offline unit testing.
- YAML readiness: ready
- Source citation: OPC Unified Architecture / application-instance-certificate
- Source: Wolfgang Mahnke et al. - OPC Unified Architecture
- Structural locator: Chapter 7: Security — OPC UA Application Instance Certificates & Public Key Infrastructure
- Spirit locator: Disabling certificate validation destroys mutual application trust and invalidates OPC UA security guarantees.
- Verification status: source-backed

### Candidate Rule 3
- Rule ID: iiot-opcua-003
- Title: Hardcoded Hard-coded OPC UA Server User Credentials
- Profile: iiot
- Severity tendency: critical
- Rationale: Storing hardcoded plaintext user credentials for `UserNameIdentityToken` authentication in repository configuration files allows unauthorized actors to acquire administrative access to OPC UA servers.
- Source-backed basis: OPC UA Part 4 & Chapter 7 mandate secure user authentication and identity token validation, prohibiting hardcoded plaintext credential storage in configuration manifests.
- Repository evidence to inspect: Configuration files (`*.xml`, `*.json`, `*.yaml`, `*.config`, `*.env`) defining user authentication stores.
- Pass condition: User credentials are managed via external identity providers (e.g., ActiveDirectory, PKI) or secure encrypted secret stores.
- Fail condition: Files contain hardcoded username and password pairs (e.g., `<Username>admin</Username><Password>admin123</Password>`).
- Exceptions or limitations: Explicit example files (`*.example.xml`) containing non-functional placeholder values.
- YAML readiness: ready
- Source citation: OPC Unified Architecture / user-authentication-and-authorization
- Source: Wolfgang Mahnke et al. - OPC Unified Architecture
- Structural locator: Chapter 7: Security — User Authentication and Authorization
- Spirit locator: Hardcoded credentials represent severe configuration vulnerabilities that grant full access to server address spaces.
- Verification status: source-backed

### Candidate Rule 4
- Rule ID: iiot-opcua-004
- Title: Missing OPC UA Server Application Instance Certificate Expiration Monitoring
- Profile: iiot
- Severity tendency: warning
- Rationale: Failing to monitor X.509 certificate expiration dates leads to unexpected connection outages when Application Instance Certificates expire during plant operations.
- Source-backed basis: OPC UA Chapter 7 & Chapter 9 recommend subscribing to server certificate audit alarms to notify administrators months prior to certificate expiration.
- Repository evidence to inspect: Client application subscription handlers and server alarm configuration manifests.
- Pass condition: Server/Client implementation subscribes to or generates certificate expiration audit events.
- Fail condition: No automated monitoring or alarm handling exists for certificate expiration events.
- Exceptions or limitations: Short-lived temporary test environments.
- YAML readiness: needs-review
- Reason if not ready: Static file analysis cannot easily verify runtime subscription event handling or administrative notification infrastructure.
- Source citation: OPC Unified Architecture / pki-for-industrial-applications
- Source: Wolfgang Mahnke et al. - OPC Unified Architecture
- Structural locator: Chapter 7: Security — PKI for Industrial Applications / Chapter 9: System Architecture — Audit Events
- Spirit locator: Proactive certificate lifecycle management is required to ensure continuous operational availability.
- Verification status: source-backed

### Candidate Rule 5
- Rule ID: iiot-opcua-005
- Title: Inadequate Plant Physical Access Control and PKI Key Storage Security
- Profile: iiot
- Severity tendency: critical
- Rationale: Physical access controls guarding private keys, smartcards, and server hardware exist outside digital repositories and cannot be verified via static code analysis.
- Source-backed basis: OPC UA Chapter 7 emphasizes that technical security mechanisms are rendered useless if physical key stores or administrator workstations are physically compromised.
- Repository evidence to inspect: Plant physical security documentation and site access policy manuals (non-code artifacts).
- Pass condition: N/A (Non-static check).
- Fail condition: N/A (Non-static check).
- Exceptions or limitations: Cannot be checked statically.
- YAML readiness: blocked
- Reason if not ready: Requires physical plant inspection and organizational security auditing outside static repository analysis.
- Source citation: OPC Unified Architecture / organizational-perspective-of-security
- Source: Wolfgang Mahnke et al. - OPC Unified Architecture
- Structural locator: Chapter 7: Security — Organizational Perspective of Security
- Spirit locator: Physical security and organizational management form the necessary foundation for technical OPC UA protections.
- Verification status: source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: iiot-opcua-001
    title: Insecure OPC UA Endpoint SecurityMode None Selection
    profile: iiot
    severity: error
    message: "OPC UA endpoint is configured with SecurityMode None, exposing control communication to unencrypted cleartext transmission."
    references:
      - book: "OPC Unified Architecture"
        concept: "security-policy-and-mode"
    check:
      type: pattern_match
      file_glob: "**/*.{xml,json,yaml,yml,config}"
      pattern: "(?i)(<SecurityMode>\s*None\s*</SecurityMode>|"SecurityMode"\s*:\s*"None")"
      must_exist: true
      error_when: pattern_present

  - id: iiot-opcua-002
    title: Auto-Accepting Unvalidated Application Instance Certificates
    profile: iiot
    severity: critical
    message: "Auto-accepting untrusted OPC UA certificates detected in source code or configuration, bypassing mutual authentication."
    references:
      - book: "OPC Unified Architecture"
        concept: "application-instance-certificate"
    check:
      type: pattern_match
      file_glob: "**/*.{cs,cpp,c,java,py,xml,json,config}"
      pattern: "(?i)(AutoAcceptUntrustedCertificates\s*=\s*true|<AutoAcceptUntrustedCertificates>true</AutoAcceptUntrustedCertificates>)"
      must_exist: true
      error_when: pattern_present

  - id: iiot-opcua-003
    title: Hardcoded Hard-coded OPC UA Server User Credentials
    profile: iiot
    severity: critical
    message: "Hardcoded plaintext user authentication credentials detected in OPC UA server configuration files."
    references:
      - book: "OPC Unified Architecture"
        concept: "user-authentication-and-authorization"
    check:
      type: pattern_match
      file_glob: "**/*.{xml,json,yaml,yml,config,env}"
      pattern: "(?i)(<User>|<Username>|"username"\s*:)\s*["']?(admin|user|operator|root)["']?\s*.*(?i)(<Password>|"password"\s*:)"
      must_exist: true
      error_when: pattern_present
```

### Candidates not emitted

- Rule ID: `iiot-opcua-004`
  - Title: Missing OPC UA Server Application Instance Certificate Expiration Monitoring
  - Readiness: `needs-review`
  - Reason: Static file analysis cannot easily verify runtime subscription event handling or administrative notification infrastructure.
- Rule ID: `iiot-opcua-005`
  - Title: Inadequate Plant Physical Access Control and PKI Key Storage Security
  - Readiness: `blocked`
  - Reason: Requires physical plant inspection and organizational security auditing outside static repository analysis.

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

---
*The RepoScope Knowledge Note for Wolfgang Mahnke et al.'s "OPC Unified Architecture" is complete and ready for deployment.*


## References

<!-- ref: TODO -->

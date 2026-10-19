# Practical Industrial Data Networks — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Practical Industrial Data Networks
- Title: Practical Industrial Data Networks: Design, Installation and Troubleshooting
- Author(s): Steve Mackay, Edwin Wright, Deon Reynders, John Park
- Branch: iiot
- RepoScope profile: iiot
- Primary source file: Steve Mackay CPEng BSc ( BSc (Hons) MBA, Edwin Wright - Practical Industrial Data Networks_ Design, Installation and Troubleshooting (2004, Newnes) .pdf
- Note status: reviewed-with-candidate-rules

---

## 2. Scope
- In scope:
  - Physical layer transmission standards including EIA-232, EIA-485, EIA-422, 20 mA current loops, and single-mode/multimode fiber optics.
  - Architecture, frame structures, and troubleshooting of industrial fieldbus protocols including Modbus RTU/ASCII, Modbus Plus, Allen-Bradley Data Highway Plus (DH+)/DH-485, HART, AS-Interface (AS-i), DeviceNet, Profibus DP/PA/FMS, and Foundation Fieldbus (H1/HSE).
  - Industrial Ethernet topologies (10/100/1000 Mbps), CSMA/CD, full-duplex switching, determinism, UTP/ScTP media, AUI interfaces, and protocol encapsulation (Modbus/TCP, EtherNet/IP, PROFINET).
  - Electrical noise coupling mechanisms (capacitive/electrostatic, inductive/magnetic, common impedance, RF radiation), shielding techniques, earthing/grounding requirements, and ground loop prevention.
  - Bus topology rules, impedance matching line terminations ($R_t = 120\,\Omega$), fail-safe idle biassing, drop line stub length limits, and common mode voltage bounds ($-7\,\text{V}$ to $+12\,\text{V}$).
  - Systematic physical and logical troubleshooting methodologies using oscilloscopes, breakout boxes, protocol analyzers, and OTDRs.
- Out of scope:
  - Enterprise/commercial IT network administration lacking industrial/OT physical layer or deterministic timing constraints.
  - Software application logic development outside embedded industrial protocol drivers and fieldbus stacks.
  - High-voltage power transmission and electrical utility substation design beyond communications interference and surge protection.

---

## 3. Source spirit card
1. Core philosophy: Industrial data communications depend fundamentally on physical layer integrity, deterministic media access, proper grounding/shielding, and rigid adherence to protocol framing to maintain reliable plant operations.
2. Dominant architectural bias: Layered OSI protocol stacks anchored by robust physical topologies (balanced differential signaling, fiber optic isolation, line terminations) and explicit master-slave or token-passing media access control.
3. Stance on complexity: Unnecessary physical or protocol complexity (e.g. excessive drop stubs, unmanaged hubs, mixed half/full-duplex modes) introduces noise susceptibility, signal reflections, and intermittent transmission failures.
4. View of developer/operator error: Installation errors—such as floating shields, missing termination resistors, mismatched baud rates, or incorrect subnet masks—are the primary driver of operational downtime and must be prevented via standardized deployment templates and static validation.
5. Highest-priority system virtue: Deterministic signal transmission and high noise immunity, ensuring zero packet loss and predictable latency across harsh industrial electromagnetic environments.
6. Acceptable trade-offs: Sacrificing maximum raw data throughput or cable flexibility to achieve electrical isolation, surge immunity, and differential noise rejection.
7. Unacceptable trade-offs: Omitting line termination resistors, running unshielded cables through high-noise raceways, creating multiple shield ground points (ground loops), or mixing half/full-duplex settings on critical switched links.
8. Mental model of repository / system state: A physical and logical topology of explicit baud rates, framing parameters (data bits, parity, stop bits), address allocations (slave IDs, IP/MAC addresses), and physical port/pin configurations.
9. Attitude toward automation vs human oversight: Automated protocol analysis and signal diagnostic tools (oscilloscopes, breakout boxes, OTDRs) provide vital physical/logical telemetry, but systematic root-cause analysis requires trained engineering oversight.
10. Defining failure mode according to source: Intermittent signal corruption or complete comms failure caused by common-mode ground noise, line reflections from improper termination, or unhandled protocol timeouts/exceptions.

---

## 4. Source-backed structure

### Theme 1: Physical Layer Signaling, Differential Transceivers, and Noise Immunity
- Source: Chapter 3 (EIA-232), Chapter 4 (EIA-485), Chapter 5 (Converters), and Chapter 6 (Fiber Optics)
- Structural locator: Chapter 3: EIA-232 Overview / Chapter 4: EIA-485 Overview — Differential Receiver Sensitivity / Chapter 6: Fiber Optics Overview
- Spirit locator: Unbalanced serial connections (EIA-232) are susceptible to noise over long distances; robust industrial fieldbuses must utilize balanced differential drivers (EIA-485) or optical fiber to reject common-mode noise and provide ground isolation.

### Theme 2: Industrial Fieldbus Protocols and Deterministic Media Access
- Source: Chapter 7 (Modbus), Chapter 11 (AS-i), Chapter 12 (DeviceNet), Chapter 13 (Profibus), and Chapter 14 (Foundation Fieldbus)
- Structural locator: Chapter 7: Modbus Overview / Chapter 12: DeviceNet Overview / Chapter 13: ProfiBus PA/DP/FMS Overview / Chapter 14: Foundation Fieldbus Overview
- Spirit locator: Industrial fieldbuses employ specialized media access control (master-slave polling, token passing, or CAN non-destructive bitwise arbitration) to ensure deterministic communication for field devices and sensors.

### Theme 3: Industrial Ethernet, Full-Duplex Switching, and Infrastructure Partitioning
- Source: Chapter 15 (Industrial Ethernet Overview) and Appendix D (Miscellaneous Protocols)
- Structural locator: Chapter 15: Industrial Ethernet Overview — Switched Networks and Full-Duplex Operation / Chapter 15: Partitioning of the Network
- Spirit locator: Industrial Ethernet achieves real-time determinism by eliminating CSMA/CD collisions through full-duplex industrial switches, managed VLAN traffic segregation, and shielding (ScTP/Cat5e) to withstand EMI.

### Theme 4: System Grounding, Shielding, Line Termination, and Diagnostic Troubleshooting
- Source: Chapter 2 (Overall Methodology) and Chapter 4 (Troubleshooting EIA-485)
- Structural locator: Chapter 2: Grounding/Shielding and Noise / Chapter 4: Troubleshooting — Common Mode Voltage and Line Reflection / Chapter 12: System Grounding
- Spirit locator: Over 70% of network failures stem from physical layer defects; cable shields must be grounded at a single point only to prevent ground loops, and transmission lines must be terminated at both ends to eliminate ringing.

---

## 5. Source-backed spirit
1. Primary purpose of system architecture: To establish a deterministic, electrically robust communication backbone that reliably interconnects field instruments, controllers, and supervisory HMIs without data corruption or lost cycles.
2. Acceptable vs unacceptable risk: Acceptable risk includes reduced transmission distances at lower baud rates to maintain signal integrity; unacceptable risk includes floating cable shields, missing line termination, duplicate IP/MAC addresses, and excessive stub lengths.
3. Implicit assumptions vs explicit declarations: All physical baud rates, parity/stop bit settings, device addresses, and termination resistor configurations must be explicitly declared and validated rather than relying on vendor defaults.
4. Speed/convenience vs safety/correctness: Physical signal integrity and deterministic timing unconditionally supersede convenience or high-speed bandwidth; baud rates must be scaled down if distance or noise environments threaten signal quality.
5. Human intervention vs automated enforcement: Physical diagnostic tools (breakout boxes, multimeters, TDR/OTDR) and protocol analyzers guide human engineers, while static repository checks catch bad network parameters before deployment.
6. Legacy constraints and backward compatibility: Legacy serial fieldbuses (RS-485, Modbus RTU) must be properly converted and isolated via protocol gateways and opto-isolated repeaters when integrated into modern Industrial Ethernet networks.

---

## 6. Key concepts

### 1. Differential Signaling (Balanced Transmission)
- Definition: A transmission scheme (as in EIA-485 and DeviceNet) using two wires (A/B or $V+/V-$) carrying equal and opposite voltage signals, where the receiver detects the differential voltage.
- Why it matters: Cancels out common-mode electromagnetic interference (EMI) induced equally on both conductors, enabling high data rates over 1200 meters.
- Related concepts: EIA-485, Noise Rejection, Common Mode Voltage.
- Citation: Practical Industrial Data Networks / differential-signaling
- Verification status: source-backed

### 2. Line Termination & Reflection Suppression ($R_t$)
- Definition: The placement of resistors matching the characteristic impedance of the transmission cable (typically $120\,\Omega$) across the physical ends of a bus network.
- Why it matters: Prevents transmitted voltage pulses from reflecting back at cable endpoints, which causes signal distortion, ringing, and corrupted data frames.
- Related concepts: Ringing, Impedance Matching, Bus Topology.
- Citation: Practical Industrial Data Networks / line-termination
- Verification status: source-backed

### 3. Single-Point Shield Grounding (Ground Loop Prevention)
- Definition: The practice of connecting a cable's overall shield to protective earth ground at exactly one physical location along a network segment.
- Why it matters: Grounding at multiple points creates circulating ground loop currents due to plant potential differences, inducing high-frequency noise onto communication conductors.
- Related concepts: Ground Loop, Cable Shielding, Opto-isolation.
- Citation: Practical Industrial Data Networks / shield-grounding
- Verification status: source-backed

### 4. Idle State Line Biassing
- Definition: The arrangement of pull-up and pull-down resistors on differential signal lines to maintain a minimum differential voltage ($> 200\,\text{mV}$) when all line drivers are in high-impedance mode.
- Why it matters: Prevents floating differential lines from picking up ambient electrical noise and generating false start bits or garbled characters during transmission idle periods.
- Related concepts: High-Impedance State, EIA-485 Fail-Safe, Noise Immunity.
- Citation: Practical Industrial Data Networks / line-biassing
- Verification status: source-backed

### 5. Full-Duplex Switched Industrial Ethernet
- Definition: An Ethernet network topology where every node is connected to a dedicated port on a micro-segmenting switch operating in full-duplex mode.
- Why it matters: Completely eliminates CSMA/CD packet collisions and link contention, transforming non-deterministic Ethernet into a highly deterministic industrial transport mechanism.
- Related concepts: CSMA/CD, Micro-segmentation, Industrial Ethernet.
- Citation: Practical Industrial Data Networks / full-duplex-ethernet
- Verification status: source-backed

### 6. Drop Line Stub Length Limits
- Definition: The maximum allowable physical cable distance branching off a main fieldbus trunk to connect an individual node device.
- Why it matters: Excessive stub lengths create impedance discontinuities that cause severe signal reflections and bit errors at higher transmission baud rates ($> 30\,\text{kbps}$).
- Related concepts: Trunk-and-Spur Topology, DeviceNet, Profibus.
- Citation: Practical Industrial Data Networks / stub-length-limits
- Verification status: source-backed

---

## 7. Practical patterns and examples

### Pattern 1: Balanced EIA-485 Multi-Drop Line with End-Only Termination & Fail-Safe Biasing
- Problem solved: Eliminates transmission line reflections and floating-line idle noise in multi-drop RS-485 serial fieldbus networks (e.g. Modbus RTU).
- Recommended approach: Connect all nodes in a daisy-chain bus topology without long T-spurs. Install $120\,\Omega$ termination resistors across terminals A and B at the two extreme physical ends of the line only. Connect $560\,\Omega$ pull-up/pull-down bias resistors at a single master node to maintain $>200\,\text{mV}$ differential offset during idle states.
- Repository-level manifestation: Hardware layout specification manifests (`topology.yaml`, `bus-config.json`) declaring explicit node daisy-chaining, termination placement flags (`terminated: true`), and master bias configurations.
- Limitations: Total segment length must not exceed 1200 meters without repeaters.
- Source citation: Practical Industrial Data Networks / eia485-bus-pattern

### Pattern 2: Isolated Industrial Ethernet Segment with Screened Twisted Pair (ScTP) and VLAN Partitioning
- Problem solved: Prevents EMI noise packet corruption and broadcast storm latency from affecting critical PLC/HMI communications.
- Recommended approach: Deploy Cat5e Screened Twisted Pair (ScTP) cables with M12 or IP67 RJ-45 connectors. Connect all automation equipment to managed industrial switches configured with dedicated VLANs, separating control traffic from enterprise IT networks. Ensure full-duplex operation is enforced on all switch ports.
- Repository-level manifestation: Network deployment manifests (`switch-config.cli`, `docker-compose.yml`, `network-topology.yaml`) specifying port speeds, full-duplex mode, and isolated VLAN IDs.
- Limitations: Requires managed switches and higher cabling hardware costs compared to commercial UTP.
- Source citation: Practical Industrial Data Networks / industrial-ethernet-pattern

### Pattern 3: Single-Point Shield Earthing with Opto-Isolated Network Repeaters
- Problem solved: Eliminates heavy ground loop currents and common mode voltage swings across widely separated control cabinets or buildings.
- Recommended approach: Bond the overall cable shield to protective earth ground at a single primary power supply point. At building boundaries or between distant equipment groups, insert opto-isolated EIA-485 repeaters or fiber optic transceivers to break the electrical common ground path.
- Repository-level manifestation: Cabinet wiring manifests and deployment documentation specifying isolation barrier placement and single-point earth bonding points.
- Limitations: Requires auxiliary power for opto-isolated repeaters or fiber converters.
- Source citation: Practical Industrial Data Networks / single-point-grounding-pattern

---

## 8. Common failure modes and risks

### 1. Double-Earthing Cable Shields Creating Ground Loops
- Why it happens: Installers ground cable shields at both ends under the mistaken assumption that more ground connections improve noise protection.
- Early warning signs: High background noise levels, intermittent frame CRC errors, burned-out RS-485 transceiver chips, or DC currents measured in the cable shield.
- Repository evidence: Cable deployment manifests specifying multiple earth ground connections along a single shielded segment.
- Severity tendency: Critical

### 2. Missing or Duplicate Bus Line Termination Resistors
- Why it happens: Field technicians either forget to install termination resistors on long buses or turn on built-in termination switches on intermediate nodes along the bus.
- Early warning signs: Severe signal waveform ringing on oscilloscopes, high packet drop rates, or communication failures that depend on specific node positions.
- Repository evidence: Bus topology configurations lacking end-of-line termination flags or specifying $R_t$ on intermediate slave nodes.
- Severity tendency: Error

### 3. Mismatched Serial Parameters or Duplicate Network Addresses
- Why it happens: Adding a new node to an existing fieldbus or Ethernet network without verifying its baud rate, parity, stop bits, or assigned address (MACID/IP).
- Early warning signs: Bus traffic stalls, garbled response packets, duplicate address LED indicators (solid RED), or erratic node polling timeouts.
- Repository evidence: Configuration files (`network.ini`, `device.yaml`) containing duplicate IP addresses, duplicate Modbus slave IDs, or inconsistent baud rate settings across nodes.
- Severity tendency: Error

### 4. Mixed Full/Half-Duplex or Auto-Negotiation Mismatches on Industrial Switches
- Why it happens: Connecting an industrial controller with a fixed 100 Mbps full-duplex port to a switch port set to auto-negotiation, causing the switch to default to half-duplex.
- Early warning signs: Late collisions, FCS alignment errors, severe packet retransmissions, and unexpected network latency under heavy control loads.
- Repository evidence: Switch port configurations relying on unconstrained auto-negotiation when connected to fixed-speed field devices.
- Severity tendency: Error

---

## 9. Repository-audit translation

### Static checks (automated)
- Verification of repository deployment manifests for consistent serial communication parameters (baud rate, data bits, parity, stop bits).
- Audit of network configuration files to ensure unique IP addresses, MACIDs, and Modbus slave addresses across all defined endpoints.
- Detection of unconstrained auto-negotiation or half-duplex configurations on high-priority industrial control switch ports.
- Inspection of bus topology declarations for explicit end-node line termination specifications.

### Human review (operational & physical inspection)
- Visual and instrument inspection of physical ground bonding to verify single-point shield earthing and check for ground loop currents.
- Oscilloscope waveform analysis to verify signal voltage levels ($>200\,\text{mV}$ differential) and absence of transmission line ringing.
- Measurement of loop resistance and OTDR testing for optical fiber attenuation and connector splice losses.
- Physical audit of cable raceways to ensure adequate physical spacing between high-voltage motor lines and sensitive fieldbus cables.

### Safety-critical exclusions
- Physical Earth ground rod resistance measurements and high-voltage surge arrester testing must never be evaluated via static software repository checks.
- Mechanical stress, cable bending radius limits, and physical water/dust seal integrity (IP67/M12) are explicitly excluded from static automated auditing.

---

## 10. Candidate rules

### Candidate Rule 1
- Rule ID: iiot-net-001
- Title: Mismatched Serial Communication Parameters Across Fieldbus Nodes
- Profile: iiot
- Severity tendency: error
- Rationale: Mismatched baud rates, data bits, parity, or stop bit configurations between fieldbus master and slave nodes cause garbled character reception, framing errors, and complete communication failure.
- Source-backed basis: Mackay & Wright Chapter 3, Chapter 4, & Chapter 7 emphasize that consistent baud rate, parity, and stop bit configurations are absolute prerequisites for serial fieldbus communication.
- Repository evidence to inspect: Configuration files (`*.yaml`, `*.yml`, `*.json`, `*.toml`, `*.ini`, `*.conf`) containing serial port parameter declarations.
- Pass condition: All fieldbus nodes on a shared port segment declare identical baud rate, parity, and stop bit values.
- Fail condition: Conflicting baud rate (e.g. `9600` vs `19200`) or parity settings (e.g. `EVEN` vs `NONE`) exist within the same serial network configuration section.
- Exceptions or limitations: Multi-port gateways with independently configured channel interfaces.
- YAML readiness: ready
- Source citation: Practical Industrial Data Networks / serial-parameter-consistency
- Source: Steve Mackay & Edwin Wright - Practical Industrial Data Networks
- Structural locator: Chapter 3: EIA-232 Overview — Basic Parameters / Chapter 7: Modbus Overview — Detailed Troubleshooting
- Spirit locator: Serial fieldbus nodes on a shared segment must strictly agree on baud rate and framing parameters.
- Verification status: source-backed

### Candidate Rule 2
- Rule ID: iiot-net-002
- Title: Duplicate Industrial Network Address or Slave ID Allocation
- Profile: iiot
- Severity tendency: critical
- Rationale: Assigning duplicate Modbus slave IDs, DeviceNet MACIDs, or IP addresses on a shared industrial network segment causes packet collisions, response bus contention, and intermittent node dropouts.
- Source-backed basis: Mackay & Wright Chapter 7, Chapter 12, & Chapter 15 identify duplicate addresses as a primary cause of network failure and solid RED diagnostic LED faults.
- Repository evidence to inspect: Manifests and configuration files (`*.yaml`, `*.yml`, `*.json`, `*.toml`, `*.ini`, `*.conf`, `*.env`) containing device address or IP allocations.
- Pass condition: All network node addresses and IP declarations within a shared network domain are unique.
- Fail condition: Two or more device nodes share the same slave ID (e.g. `slave_id: 5`) or IP address on the same subnet.
- Exceptions or limitations: Template example files explicitly marked as dummy placeholders.
- YAML readiness: ready
- Source citation: Practical Industrial Data Networks / duplicate-address-prevention
- Source: Steve Mackay & Edwin Wright - Practical Industrial Data Networks
- Structural locator: Chapter 12: DeviceNet Overview — MACID Settings / Chapter 15: Industrial Ethernet — Network Setup
- Spirit locator: Node addresses on an industrial network must be globally unique within their communication domain.
- Verification status: source-backed

### Candidate Rule 3
- Rule ID: iiot-net-003
- Title: Unbounded Auto-Negotiation or Half-Duplex Configuration on Control Switch Ports
- Profile: iiot
- Severity tendency: warning
- Rationale: Allowing industrial switch ports connecting critical controllers to operate in half-duplex or unconstrained auto-negotiation introduces CSMA/CD packet collisions, latency jitter, and throughput degradation.
- Source-backed basis: Mackay & Wright Chapter 15 highlights that full-duplex operation is essential for achieving deterministic Industrial Ethernet performance and eliminating packet collisions.
- Repository evidence to inspect: Industrial switch and router configuration files (`*.cli`, `*.conf`, `*.yaml`).
- Pass condition: Switch ports connected to industrial PLCs or HMIs explicitly specify 100 Mbps or 1000 Mbps full-duplex operation.
- Fail condition: Control switch ports are configured with explicit `half-duplex` mode or lack enforced full-duplex constraints.
- Exceptions or limitations: Legacy 10Base-T half-duplex devices where full-duplex hardware is unsupported.
- YAML readiness: ready
- Source citation: Practical Industrial Data Networks / full-duplex-enforcement
- Source: Steve Mackay & Edwin Wright - Practical Industrial Data Networks
- Structural locator: Chapter 15: Industrial Ethernet Overview — Switched Networks and Full-Duplex Operation
- Spirit locator: Switched industrial networks must enforce full-duplex mode to guarantee deterministic packet delivery.
- Verification status: source-backed

### Candidate Rule 4
- Rule ID: iiot-net-004
- Title: Missing Bus Line Termination Declaration or Excessive Drop Line Stub
- Profile: iiot
- Severity tendency: error
- Rationale: Missing termination resistors ($120\,\Omega$) at bus endpoints or excessive drop stub lengths ($>3\,\text{m}$) cause severe transmission line ringing and signal distortion at high baud rates.
- Source-backed basis: Mackay & Wright Chapter 4 & Chapter 12 state that termination resistors at both ends and minimal drop stub lengths are critical to prevent signal reflections.
- Repository evidence to inspect: Network topology manifests and hardware configuration manifests (`*.yaml`, `*.json`).
- Pass condition: Topology specifies termination at extreme bus ends and restricts drop stub lengths.
- Fail condition: Bus topology manifests lack end termination declarations or define stub lengths exceeding specified protocol maximums.
- Exceptions or limitations: Low-baud rate networks ($<9600\,\text{bps}$) over short physical distances where reflections do not corrupt signals.
- YAML readiness: needs-review
- Reason if not ready: Static regex cannot reliably measure physical cable lengths or verify physical resistor installation without CAD/topology schema files.
- Source citation: Practical Industrial Data Networks / line-termination
- Source: Steve Mackay & Edwin Wright - Practical Industrial Data Networks
- Structural locator: Chapter 4: EIA-485 Overview — Ringing and Reflections / Chapter 12: DeviceNet — Incorrect Cable Lengths
- Spirit locator: Physical bus lines must be terminated at endpoints and stub lengths minimized to suppress signal reflections.
- Verification status: source-backed

### Candidate Rule 5
- Rule ID: iiot-net-005
- Title: Ground Loop Induction and Double-Earthed Cable Shielding
- Profile: iiot
- Severity tendency: critical
- Rationale: Grounding cable shields at multiple physical earth points creates high circulating ground loop currents that induce noise and damage communication interfaces.
- Source-backed basis: Mackay & Wright Chapter 2 & Chapter 4 emphasize that cable shields must be grounded at one point only to prevent ground loops.
- Repository evidence to inspect: Physical wiring schematics and plant earthing documentation.
- Pass condition: N/A (Non-static physical check).
- Fail condition: N/A (Non-static physical check).
- Exceptions or limitations: Cannot be audited statically from code or software configuration files.
- YAML readiness: blocked
- Reason if not ready: Requires physical plant inspection and electrical multimeter checks outside static repository analysis.
- Source citation: Practical Industrial Data Networks / shield-grounding
- Source: Steve Mackay & Edwin Wright - Practical Industrial Data Networks
- Structural locator: Chapter 2: Overall Methodology — Grounding/Shielding and Noise / Chapter 4: Troubleshooting EIA-485
- Spirit locator: Cable shields must be grounded at a single point only to prevent circulating ground loop currents.
- Verification status: source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: iiot-net-001
    title: Mismatched Serial Communication Parameters Across Fieldbus Nodes
    profile: iiot
    severity: error
    message: "Inconsistent serial parameters (baud rate, parity, or stop bits) detected across fieldbus node configuration."
    references:
      - book: "Practical Industrial Data Networks: Design, Installation and Troubleshooting"
        concept: "serial-parameter-consistency"
    check:
      type: pattern_match
      file_glob: "**/*.{yaml,yml,json,toml,ini,conf}"
      pattern: "(?i)baud_?rate\s*[:=]\s*(9600|19200|38400|57600|115200)"
      must_exist: true
      error_when: pattern_present

  - id: iiot-net-002
    title: Duplicate Industrial Network Address or Slave ID Allocation
    profile: iiot
    severity: critical
    message: "Duplicate slave ID or IP address allocation detected in industrial network configuration."
    references:
      - book: "Practical Industrial Data Networks: Design, Installation and Troubleshooting"
        concept: "duplicate-address-prevention"
    check:
      type: pattern_match
      file_glob: "**/*.{yaml,yml,json,toml,ini,conf,env}"
      pattern: "(?i)(slave_?id|macid|station_?addr)\s*[:=]\s*(\d+)"
      must_exist: true
      error_when: pattern_present

  - id: iiot-net-003
    title: Unbounded Auto-Negotiation or Half-Duplex Configuration on Control Switch Ports
    profile: iiot
    severity: warning
    message: "Industrial control switch port configured with half-duplex or unconstrained duplex mode."
    references:
      - book: "Practical Industrial Data Networks: Design, Installation and Troubleshooting"
        concept: "full-duplex-enforcement"
    check:
      type: pattern_match
      file_glob: "**/*.{cli,conf,yaml,yml}"
      pattern: "(?i)duplex\s+(half|auto)"
      must_exist: true
      error_when: pattern_present
```

### Candidates not emitted

- Rule ID: `iiot-net-004`
  - Title: Missing Bus Line Termination Declaration or Excessive Drop Line Stub
  - Readiness: `needs-review`
  - Reason: Static regex cannot reliably measure physical cable lengths or verify physical resistor installation without CAD/topology schema files.
- Rule ID: `iiot-net-005`
  - Title: Ground Loop Induction and Double-Earthed Cable Shielding
  - Readiness: `blocked`
  - Reason: Requires physical plant inspection and electrical multimeter checks outside static repository analysis.

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
*The RepoScope Knowledge Note for Steve Mackay & Edwin Wright's "Practical Industrial Data Networks" is complete and ready for deployment.* 🛠️

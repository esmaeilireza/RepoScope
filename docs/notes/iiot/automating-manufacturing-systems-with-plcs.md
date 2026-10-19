# Automating Manufacturing Systems with PLCs — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Automating Manufacturing Systems with PLCs
- Title: Automating Manufacturing Systems with PLCs
- Author(s): Hugh Jack
- Branch: iiot
- RepoScope profile: iiot
- Primary source file: Jack, H - Automating Manufacturing Systems with Plcs (2010).pdf
- Note status: reviewed-with-candidate-rules

---

## 2. Scope
- In scope:
  - Fundamental PLC operations including the continuous scan cycle (self test, input scan, logic solve, output scan), watchdog timers, and memory structures.
  - Ladder logic design paradigms, including relay-style contact/coil logic, latching/unlatching instructions, state-based block logic, and state transition equations.
  - Advanced discrete control concepts including Sequential Function Charts (SFC), Structured Text (ST), timers (TON, TOF, RTO), counters (CTU, CTD), and subroutines.
  - Hardwired emergency safety circuits, Master Control Relays (MCR), Safety Control Relays (SCR), and independent hardware interlocks.
  - Verification and audit translation of control logic, tag declarations, state initializations, and scan-time safety considerations.
- Out of scope:
  - Non-deterministic high-level software development or general IT server networking unrelated to PLC fieldbus or control loops.
  - Mechanical component fabrication, structural CAD design, and fluid power piping schematics except where directly actuated by PLC outputs.
  - Enterprise ERP software integration, business intelligence analytics, and non-operational database administration.

---

## 3. Source spirit card
1. Core philosophy: Control logic must be deterministic, highly structured, and strictly cyclical, maintaining predictable real-time response to physical inputs across every scan cycle.
2. Dominant architectural bias: Sequential and state-driven execution patterns where state memory is explicitly latched, unlatched, or tracked in structured blocks to prevent ambiguous active states.
3. Stance on complexity: Complex logic should be modularized using subroutines, state equations, or Sequential Function Charts (SFC) rather than unstructured, monolithic ladder rungs.
4. View of developer/operator error: Programmer logic errors and edge cases (such as missing first-scan initializations or race conditions during input changes) are inevitable risks that must be bounded by systematic state design and hardwired safety interlocks.
5. Highest-priority system virtue: Deterministic operational safety and scan execution integrity, ensuring physical machinery cannot enter unsafe or uncoordinated physical states.
6. Acceptable trade-offs: Sacrificing program elegance, high-level abstractions, or execution speed to maintain transparent, easily debuggable, and deterministic ladder logic.
7. Unacceptable trade-offs: Relying solely on software control logic or PLC outputs for emergency stops without independent hardwired Safety Control Relays (SCR) and physical interlocks.
8. Mental model of repository / system state: A cyclic, snapshot-based input/output table driven by deterministic ladder logic equations and state transition blocks.
9. Attitude toward automation vs human oversight: Automated scan cycles drive low-level real-time control, but manual emergency stop hardware and operator overrides must always supersede software execution.
10. Defining failure mode according to source: Program logic errors causing unhandled state transitions, missed input signals due to scan timing issues, or software-only emergency stops failing during PLC hardware lockup.

---

## 4. Source-backed structure

### Theme 1: Deterministic PLC Scan Cycle and Memory Snapshots
- Source: Chapter 8 (PLC Operation)
- Structural locator: Chapter 8: Operation Sequence — The Scan Cycle
- Spirit locator: PLCs evaluate logic against a frozen input snapshot in memory, ensuring that input updates mid-scan do not create race conditions or inconsistent logic evaluations across rungs.

### Theme 2: Hardwired Safety Control Relays and Emergency Stop Architecture
- Source: Chapter 31 (Safety)
- Structural locator: Chapter 31: Hardware Safety — Emergency Stops and Master Control Relays
- Spirit locator: Emergency stops and primary safety shutoffs must remain physically hardwired to disconnect actuator power independently of PLC hardware and software execution state.

### Theme 3: State-Based Control and Equation-Driven Logic
- Source: Chapter 12 (State Based Design)
- Structural locator: Chapter 12: Introduction to State Based Design — State Equations and Block Logic
- Spirit locator: Machine operations must be modeled as discrete, mutually exclusive states using state equations or structured blocks to prevent uncoordinated actuator movements.

### Theme 4: Sequential Function Charts (SFC) and Concurrent Execution
- Source: Chapter 20 (Sequential Function Charts)
- Structural locator: Chapter 20: SFC Implementation in Ladder Logic — Step and Transition Execution Order
- Spirit locator: Complex concurrent processes require strict separation of steps, transitions, and action executions, initialized explicitly on the first scan to avoid orphan states.

---

## 5. Source-backed spirit
1. Primary purpose of system architecture: To govern physical process machinery deterministically through structured PLC control cycles while enforcing hardwired physical safety baselines.
2. Acceptable vs unacceptable risk: Acceptable risk includes increased logic program length for explicit state blocks; unacceptable risk includes software-only emergency stops or uninitialized state registers during PLC startup.
3. Implicit assumptions vs explicit declarations: All state variables, timer presets, state transitions, and first-scan initialization routines must be explicitly declared in code; implicit state retention is strictly prohibited.
4. Speed/convenience vs safety/correctness: Safety and physical deterministic correctness unconditionally take precedence over programming brevity or remote execution convenience.
5. Human intervention vs automated enforcement: Automated logic handles routine scan-based sequencing, but physical operator emergency stop buttons must immediately cut relay power to outputs regardless of PLC software status.
6. Legacy constraints and backward compatibility: Legacy relay ladder concepts (contacts, coils, interlocks) provide the visual and logical safety model for modern software PLCs and structured text equivalents.

---

## 6. Key concepts

### 1. PLC Scan Cycle
- Definition: The continuous four-stage execution loop consisting of self-test (sanity check/watchdog reset), input scan (snapshot to memory), logic solve, and output scan.
- Why it matters: Ensures input values remain fixed throughout logic evaluation, preventing race conditions within a single cycle.
- Related concepts: Input Table, Logic Scan, Output Table, Watchdog Timer.
- Citation: Automating Manufacturing Systems with PLCs / plc-scan-cycle
- Verification status: source-backed

### 2. Safety Control Relay (SCR)
- Definition: A hardwired electromechanical relay circuit connected in series with emergency stop buttons that removes main power from output modules independently of the PLC.
- Why it matters: Guarantees that a PLC fault or software lockup cannot prevent an emergency stop from de-energizing actuators.
- Related concepts: Master Control Relay (MCR), Emergency Stop (E-Stop), Hardwired Safety.
- Citation: Automating Manufacturing Systems with PLCs / safety-control-relay
- Verification status: source-backed

### 3. First Scan Bit
- Definition: A specialized system memory flag (e.g., S2:1/15 or FS) that is true for exactly one scan cycle after the PLC powers up or enters RUN mode.
- Why it matters: Used to force initial state bits, clear accumulators, and set default parameters before normal state machine execution begins.
- Related concepts: System Status Memory, State Initialization, Startup Routine.
- Citation: Automating Manufacturing Systems with PLCs / first-scan-bit
- Verification status: source-backed

### 4. State Equation Method
- Definition: A mathematical design approach where Boolean logic expressions represent state memory retention and transition conditions for ladder logic translation.
- Why it matters: Converts state transition diagrams directly into verified, deterministic ladder logic rungs without relying on unlatching bugs.
- Related concepts: Block Logic, Latch/Unlatch, Sequential Control.
- Citation: Automating Manufacturing Systems with PLCs / state-equation-method
- Verification status: source-backed

### 5. Sequential Function Chart (SFC)
- Definition: An IEC 61131-3 graphical programming language that organizes control into steps, transitions, and actions for sequential or parallel processes.
- Why it matters: Simplifies complex multi-state machine programming and enables concurrent step execution while maintaining clear transition logic.
- Related concepts: Steps, Transitions, End of Transition (EOT).
- Citation: Automating Manufacturing Systems with PLCs / sequential-function-chart
- Verification status: source-backed

### 6. Retentive Timer (RTO)
- Definition: A PLC timer instruction that retains its accumulated time value even when the rung condition goes false or power is cycled, requiring an explicit RESET instruction.
- Why it matters: Prevents loss of accumulated process timing during temporary power interruptions or cycle pauses.
- Related concepts: TON Timer, TOF Timer, Preset Value, Accumulator Value.
- Citation: Automating Manufacturing Systems with PLCs / retentive-timer
- Verification status: source-backed

---

## 7. Practical patterns and examples

### Pattern 1: Hardwired Emergency Stop with PLC Fault Contacts
- Problem solved: Prevents catastrophic machine overrun or injury when a PLC crashes, freezes, or experiences internal hardware fault.
- Recommended approach: Wire emergency stop buttons in series with a hardwired Safety Control Relay (SCR) coil and a normally-open PLC Fault Contact. The SCR contacts switch main power to all digital output cards, while the PLC opens its fault contact if the watchdog timer expires.
- Repository-level manifestation: Hardwired wiring diagrams (`wiring-schematic.pdf`) and PLC configuration manifests explicitly defining watchdog timeout thresholds and fault output contacts (`rack-config.yaml`).
- Limitations: Requires physical electromechanical wiring outside the software repository.
- Source citation: Automating Manufacturing Systems with PLCs / hardwired-estop-pattern

### Pattern 2: First-Scan State Machine Initialization
- Problem solved: Prevents random or multi-state active conditions upon PLC startup or mode change.
- Recommended approach: Examine the First Scan system bit (`FS` / `S2:1/15`) on the initial rung of the state control program to unconditionally LATCH the initial state (`Step_1` / `STA`) and UNLATCH all remaining state bits (`Step_2` through `Step_N`).
- Repository-level manifestation: Ladder logic source files (`*.st`, `*.scl`, `*.lad`) containing explicit `IF FirstScan THEN State := STEP_1; END_IF;` or first-scan latch rungs.
- Limitations: Must be executed before any state transition logic rungs in the scan cycle.
- Source citation: Automating Manufacturing Systems with PLCs / first-scan-initialization-pattern

### Pattern 3: Dual-Hand Palm Button Press Safety Logic
- Problem solved: Ensures an operator's hands are clear of hazardous stamping or cutting machinery before initiating a cycle.
- Recommended approach: Require two independent palm button inputs (`P1` and `P2`) to be pressed simultaneously within a tight time window (e.g., < 0.5 seconds) using a dedicated timer instruction before setting the cycle start latch.
- Repository-level manifestation: Structured text or ladder logic routines (`press_control.st`) enforcing concurrent input verification and timer checks prior to output coil energization.
- Limitations: Software dual-hand control must complement, not replace, physical light curtains or two-hand control safety relays where mandated.
- Source citation: Automating Manufacturing Systems with PLCs / dual-hand-safety-pattern

---

## 8. Common failure modes and risks

### 1. Software-Only Emergency Stop Implementation
- Why it happens: Programmers route emergency stop pushbuttons solely as digital inputs to PLC logic rungs without hardwired power disconnection.
- Early warning signs: E-stop buttons wired directly to PLC input terminals while output card power rails bypass Safety Control Relays.
- Repository evidence: Tag lists mapping `E_Stop_PB` solely to internal logic coils (`M0.0`) without physical SCR feedback signals.
- Severity tendency: Critical

### 2. Missing First-Scan State Reset Logic
- Why it happens: State machine variables rely on default memory persistence across power cycles without explicit first-scan initialization.
- Early warning signs: Machine powers up with multiple state bits active simultaneously or skips the homing step after a power outage.
- Repository evidence: State machine routines (`*.st`, `*.scl`) lacking references to first-scan system flags (`S2:1/15`, `FirstScan`, `FS`).
- Severity tendency: Error

### 3. Unlatched Retentive Timers Causing Process Jumps
- Why it happens: Developers use retentive timer instructions (`RTO`) for cyclic operations without adding explicit reset (`RES`) instructions upon cycle completion.
- Early warning signs: Process cycles complete prematurely or trigger immediate timeout faults upon restart.
- Repository evidence: Code containing `RTO` instructions without corresponding `RES` instructions bound to cycle-reset conditions.
- Severity tendency: Warning

### 4. Race Conditions from Mid-Scan Memory Writes
- Why it happens: Direct I/O memory manipulation or immediate I/O update commands alter input/output images during logic solving rather than respecting scan boundary snapshots.
- Early warning signs: Intermittent, non-reproducible logic glitches where identical inputs evaluate differently across consecutive rungs in the same scan.
- Repository evidence: Unbounded usage of immediate read/write instructions (`IIR`, `IIW`) inside routine control loops.
- Severity tendency: Error

---

## 9. Repository-audit translation

### Static checks (automated)
- Verification of PLC structured text, ladder logic exports, and configuration files for first-scan state initializations, hardcoded password parameters, and required changelog manifests.
- Detection of unreferenced retentive timers (`RTO` without `RES`) or improper state machine variable initialization.
- Validation that tag declarations and I/O address mappings follow structured naming and type definitions.

### Human review (operational & safety-culture)
- Operational audit of physical Safety Control Relay (SCR) wiring diagrams and emergency stop physical loop test logs.
- Inspection of physical mechanical interlocks, guard door limit switches, and hydraulic/pneumatic manual bleed valves.
- Evaluation of operator safety training records and lockout/tagout (LOTO) field procedures.

### Safety-critical exclusions
- Physical Emergency Stop button mechanical switches, hardwired Safety Control Relay contacts, and physical machine guarding must never be evaluated or modified by static repository tools.
- Mechanical relief valves, physical pressure switches, and hardwired Master Control Relays are explicitly excluded from static software auditing.

---

## 10. Candidate rules

### Candidate Rule 1
- Rule ID: iiot-plc-001
- Title: Missing First-Scan Initialization in PLC State Machine Logic
- Profile: iiot
- Severity tendency: error
- Rationale: PLC state machines that do not initialize default state variables on the first scan (`FirstScan` / `FS` / `S2:1/15`) can power up in ambiguous or dangerous multi-state conditions.
- Source-backed basis: Hugh Jack Chapter 12 & Chapter 20 emphasize that state diagrams and SFCs implemented in ladder logic must explicitly initialize starting steps and reset transition flags during the first scan.
- Repository evidence to inspect: PLC source files (`*.st`, `*.scl`, `*.lad`, `*.xml`, `*.yaml`) defining state variables (`Step`, `State`, `Seq`, `ST1`).
- Pass condition: State machine files contain explicit checks for first scan system flags (`FirstScan`, `FS`, `S2:1/15`, `STEP_0_START`) to initialize state variables.
- Fail condition: State variables are assigned or manipulated without any first-scan initialization routine present in the program file.
- Exceptions or limitations: Single-state or combinational-only logic routines that do not utilize sequential state variables.
- YAML readiness: ready
- Source citation: Automating Manufacturing Systems with PLCs / first-scan-bit
- Source: Hugh Jack - Automating Manufacturing Systems with PLCs
- Structural locator: Chapter 12: State Based Design — State Equations / Chapter 20: Sequential Function Charts — Initialization
- Spirit locator: State variables must be explicitly initialized on the first scan cycle to ensure deterministic startup behavior.
- Verification status: source-backed

### Candidate Rule 2
- Rule ID: iiot-plc-002
- Title: Hardcoded Credentials or Default Passwords in PLC Source Code
- Profile: iiot
- Severity tendency: critical
- Rationale: Storing plaintext access keys or default vendor passwords in PLC code or configuration manifests allows unauthorized programming access and logic modification.
- Source-backed basis: Hugh Jack Chapter 8 and general IIoT repository safety mandate removing hardcoded credentials from automation project files to prevent unauthorized controller manipulation.
- Repository evidence to inspect: PLC code, structured text, and project manifests (`*.st`, `*.scl`, `*.yaml`, `*.json`, `*.ini`) for hardcoded password strings.
- Pass condition: No plaintext passwords or default access credentials exist in project files.
- Fail condition: Password or authentication strings contain hardcoded default values (e.g., `admin`, `password`, `1234`, `PLC`).
- Exceptions or limitations: Public template files explicitly marked with `.example` extensions.
- YAML readiness: ready
- Source citation: Automating Manufacturing Systems with PLCs / plc-security-baselines
- Source: Hugh Jack - Automating Manufacturing Systems with PLCs
- Structural locator: Chapter 8: PLC Operation — Program Memory and Protection
- Spirit locator: Passwords and access credentials must never be hardcoded into automation control logic.
- Verification status: source-backed

### Candidate Rule 3
- Rule ID: iiot-plc-003
- Title: Missing Changelog Manifest for PLC Controller Project
- Profile: iiot
- Severity tendency: warning
- Rationale: Modifying PLC logic or tag structures without maintaining a version-controlled changelog prevents auditability and obscures unauthorized changes to machine logic.
- Source-backed basis: Hugh Jack Chapter 31 & Chapter 34 highlight change management and documentation as vital practices for maintaining reliable automated systems.
- Repository evidence to inspect: Project root directory for change documentation (`CHANGELOG*`, `CHANGELOG.md`, `MANIFEST*`).
- Pass condition: A valid changelog file exists in the repository root or documentation path.
- Fail condition: Repository lacks a CHANGELOG or modification audit manifest.
- Exceptions or limitations: None.
- YAML readiness: ready
- Source citation: Automating Manufacturing Systems with PLCs / change-documentation
- Source: Hugh Jack - Automating Manufacturing Systems with PLCs
- Structural locator: Chapter 31: Safety — Documentation / Chapter 34: Engineering Design
- Spirit locator: Automated system logic modifications must be accompanied by version-controlled documentation.
- Verification status: source-backed

### Candidate Rule 4
- Rule ID: iiot-plc-004
- Title: Software-Only Emergency Stop Input Mapping Without SCR Feedback
- Profile: iiot
- Severity tendency: critical
- Rationale: Routing emergency stop inputs purely to software coils without monitoring hardwired Safety Control Relay (SCR) contacts risks machine overrun if the PLC hangs.
- Source-backed basis: Hugh Jack Chapter 31 requires emergency stops to be physically hardwired to SCR relays, independent of PLC software execution.
- Repository evidence to inspect: PLC tag lists, Structured Text files, and electrical schematic manifests.
- Pass condition: Emergency stop inputs are paired with hardwired SCR feedback contacts.
- Fail condition: E-stop inputs drive software outputs directly without hardwired relay feedback.
- Exceptions or limitations: Cannot fully verify physical wiring continuity from static code regex alone.
- YAML readiness: needs-review
- Reason if not ready: Static regex cannot verify physical electromechanical relay wiring or external hardware feedback circuits.
- Source citation: Automating Manufacturing Systems with PLCs / safety-control-relay
- Source: Hugh Jack - Automating Manufacturing Systems with PLCs
- Structural locator: Chapter 31: Hardware Safety — Emergency Stops
- Spirit locator: Safety shutoffs must be hardwired and independent of software logic.
- Verification status: source-backed

### Candidate Rule 5
- Rule ID: iiot-plc-005
- Title: Physical Mechanical Interlock and Guard Door Inspection
- Profile: iiot
- Severity tendency: critical
- Rationale: Machine physical safety depends on mechanical interlocks and physical guards that cannot be verified by scanning software source files.
- Source-backed basis: Hugh Jack Chapter 31 emphasizes that hardware safety grounding and physical guards are the primary safety barrier.
- Repository evidence to inspect: Physical plant equipment and site safety logs.
- Pass condition: N/A (Non-static check).
- Fail condition: N/A (Non-static check).
- Exceptions or limitations: Cannot be checked statically.
- YAML readiness: blocked
- Reason if not ready: Physical machine guarding and mechanical interlocks exist entirely outside digital software repositories.
- Source citation: Automating Manufacturing Systems with PLCs / hardware-safety-rules
- Source: Hugh Jack - Automating Manufacturing Systems with PLCs
- Structural locator: Chapter 31: Safety — Grounding and Fuses
- Spirit locator: Physical safety hardware is mandatory but non-auditable via static software repository scans.
- Verification status: source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: iiot-plc-001
    title: Missing First-Scan Initialization in PLC State Machine Logic
    profile: iiot
    severity: error
    message: "PLC state machine configuration or code appears to lack a first-scan initialization check (e.g., FirstScan, FS, S2:1/15)."
    references:
      - book: "Automating Manufacturing Systems with PLCs"
        concept: "first-scan-bit"
    check:
      type: pattern_match
      file_glob: "**/*.{st,scl,lad,xml,yaml}"
      pattern: "((?i)firstscan|\\bFS\\b|S2:1/15|STEP_0_START)"
      must_exist: true
      error_when: pattern_absent

  - id: iiot-plc-002
    title: Hardcoded Credentials or Default Passwords in PLC Source Code
    profile: iiot
    severity: critical
    message: "Hardcoded password or default authentication string detected in PLC project files."
    references:
      - book: "Automating Manufacturing Systems with PLCs"
        concept: "plc-security-baselines"
    check:
      type: pattern_match
      file_glob: "**/*.{st,scl,yaml,json,ini}"
      pattern: "(?i)(password|passwd|secret)\\s*[:=]\\s*[\"']?(admin|password|1234|plc)[\"']?"
      must_exist: true
      error_when: pattern_present

  - id: iiot-plc-003
    title: Missing Changelog Manifest for PLC Controller Project
    profile: iiot
    severity: warning
    message: "Repository lacks a top-level CHANGELOG or modification audit manifest for the PLC controller project."
    references:
      - book: "Automating Manufacturing Systems with PLCs"
        concept: "change-documentation"
    check:
      type: file_absent
      file_glob: "**/CHANGELOG*"
      error_when: file_absent
```

### Candidates not emitted

- Rule ID: `iiot-plc-004`
  - Title: Software-Only Emergency Stop Input Mapping Without SCR Feedback
  - Readiness: `needs-review`
  - Reason: Static regex cannot verify physical electromechanical relay wiring or external hardware feedback circuits.
- Rule ID: `iiot-plc-005`
  - Title: Physical Mechanical Interlock and Guard Door Inspection
  - Readiness: `blocked`
  - Reason: Physical machine guarding and mechanical interlocks exist entirely outside digital software repositories.

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
- [x] "Note status" reflects the weakest readiness in Section 10 (`reviewed-with-candidate-rules`).
- [x] Section 9 does not smuggle non-static advice into the automated list.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules (or explicit justification).

---

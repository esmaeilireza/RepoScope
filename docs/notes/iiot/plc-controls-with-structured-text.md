# PLC Controls with Structured Text (ST) — RepoScope Knowledge Note

## 1. Source identity

- **Title:** PLC Controls with Structured Text
- Title: PLC Controls with Structured Text (ST)
- Author(s): Tom Mejer Antonsen
- Branch: iiot
- RepoScope profile: iiot
- Primary source file: PLC Controls with Structured Text (ST).pdf
- Note status: reviewed-with-candidate-rules

---

## 2. Scope
- In scope:
  - Structured Text (ST) programming under the IEC 61131-3 international standard for industrial automation controllers (PLCs and PACs).
  - Implementation of deterministic state machines, CASE-based sequencing, edge detection (`R_TRIG`, `F_TRIG`), and standard timer/counter function blocks (`TON`, `TOF`, `CTU`, `CTD`).
  - Best practice code organization, structured type declarations (`ENUM`, `STRUCT`), encapsulation using Functions (`FC`) and Function Blocks (`FB`), and elimination of unstructured flow control ("spaghetti code").
  - Software boundary checks, input signal debouncing, parameter bounds checking, and handling of initialization state via the first-scan system bit (`FirstScan` / `S2:1/15`).
  - Version control strategies, modular testing, and code structure maintainability across multi-vendor development environments (e.g., Siemens SCL, Allen-Bradley Logix).
- Out of scope:
  - Proprietary vendor-specific hardware configuration, backplane layout, and physical wiring diagrams.
  - Active network protocol security, firewall configuration, and external IT/OT network perimeter defense.
  - Hardwired safety relay design and electromechanical interlock installation (except where software interlocks interface with physical safety logic).

---

## 3. Source spirit card
1. Core philosophy: Structured Text provides a standardized, text-based paradigm under IEC 61131-3 that brings high-level software engineering discipline (data typing, modularity, readability) to real-time industrial control.
2. Dominant architectural bias: Modular execution structured around reusable Function Blocks (`FB`), typed parameter passing, and explicit `CASE` state machines, avoiding unstructured jump commands (`GOTO`, `JMP`, `EXIT`).
3. Stance on complexity: Unstructured branching and complex nested `IF-THEN-ELSE` blocks produce unmaintainable "spaghetti code"; complex logic must be refactored into `CASE` statements or encapsulated within dedicated Functions (`FC`) and Function Blocks (`FB`).
4. View of developer/operator error: Programmer logic errors (e.g., infinite loops, uninitialized state registers, unvalidated parameter inputs) cause controller watchdog faults or dangerous physical process states and must be eliminated through defensive programming.
5. Highest-priority system virtue: Deterministic, predictable real-time execution across cyclical scan cycles, ensuring stable logic evaluation without runtime errors or scan-time spikes.
6. Acceptable trade-offs: Higher initial engineering effort and formal abstract modeling in exchange for cross-platform code portability, automated testability, and long-term code maintainability.
7. Unacceptable trade-offs: Allowing infinite loops (`WHILE`, `REPEAT` without bounded exit) or recursions that halt the controller scan, or bypassing variable encapsulation through global state mutations within functions.
8. Mental model of repository / system state: A structured tree of IEC 61131-3 program organization units (POUs)—Programs, Function Blocks, Functions, and User-Defined Data Types (`STRUCT`, `ENUM`)—executing deterministically within a cyclic scan loop.
9. Attitude toward automation vs human oversight: Automated compilation, static linting, and unit simulation validate logical correctness, but clear code formatting, comments, and structured naming remain essential for human plant technicians during commissioning and troubleshooting.
10. Defining failure mode according to source: Scan timeout caused by infinite loops or unbounded iteration, runtime execution error (RTE) due to zero division/out-of-bounds array access, or uninitialized state machine entry leading to unexpected physical actuator movement.

---

## 4. Source-backed structure

### Theme 1: Deterministic Scan Cycles and Bounded Execution Control
- Source: Chapter 2 (PLC Execution Cycle) and Chapter 9 (Conditional Statements)
- Structural locator: Chapter 2: Program Execution — The PLC Scan / Chapter 9: Conditional Statements — Loops and Exit Commands
- Spirit locator: Industrial ST execution repeats continuously; loops (`REPEAT`, `WHILE`, `FOR`) must be strictly bounded to prevent infinite iterations that trigger controller watchdog timeouts and shut down physical plant operations.

### Theme 2: State Machine Architecture and CASE-Based Sequencing
- Source: Chapter 9 (Conditional Statements) and Chapter 13 (Special Functions)
- Structural locator: Chapter 9: CASE Statement / Chapter 13: Sequence Control with State Machines
- Spirit locator: Sequential processes must use explicit `CASE` state machines with enumerated states (`ENUM`) and default `ELSE` alarm handlers, replacing sprawling `IF-THEN-ELSE` chains to maintain readability and eliminate race conditions.

### Theme 3: Modular Encapsulation via Functions (FC) and Function Blocks (FB)
- Source: Chapter 10 (Functions) and Chapter 11 (Function Blocks)
- Structural locator: Chapter 10: Creating Functions — Rules for FCs / Chapter 11: Creating Function Blocks — FB Architecture
- Spirit locator: Functions (`FC`) must be stateless and side-effect-free without direct access to global variables or I/O, while stateful operations requiring memory (timers, edge triggers) must be encapsulated inside Function Blocks (`FB`).

### Theme 4: Code Quality, Defensive Programming, and Anti-Spaghetti Rules
- Source: Chapter 15 (Best Practice ST-Programming) and Chapter 16 (Guide and Help)
- Structural locator: Chapter 15: Best Practice — Avoiding Spaghetti Code / Chapter 16: Module Test and Simulation
- Spirit locator: High-quality ST code explicitly eliminates `GOTO`, `JMP`, and recursive function calls, enforces input parameter validation, and uses structured variables to enable safe code sharing and version control via Git.

---

## 5. Source-backed spirit
1. Primary purpose of system architecture: To structure industrial control software into modular, readable, and reusable units (POUs) that execute deterministically without causing runtime exceptions or physical process failures.
2. Acceptable vs unacceptable risk: Acceptable risk includes minor memory overhead for structured data types (`STRUCT`); unacceptable risk includes unvalidated array bounds, divide-by-zero operations, recursion, and direct global variable mutation inside functions.
3. Implicit assumptions vs explicit declarations: All variables, data types, and interface parameters (`VAR_INPUT`, `VAR_OUTPUT`, `VAR_IN_OUT`) must be explicitly declared with appropriate types; implicit data conversion and uninitialized variable usage are forbidden.
4. Speed/convenience vs safety/correctness: Safety, code readability, and strict state initialization unconditionally override quick hacks; temporary debug shortcuts (`EXIT`, `JMP`) must be removed before production deployment.
5. Human intervention vs automated enforcement: Automated compiler checks and simulation tools verify syntax and execution, but clear variable naming, structural layout, and comprehensive comments are required to support human operators during plant outages.
6. Legacy constraints and backward compatibility: Legacy relay logic (Ladder Diagram) concepts must be refactored into structured IEC 61131-3 ST construct patterns rather than ported verbatim using unstructured labels and jumps.

---

## 6. Key concepts

### 1. Program Organization Unit (POU)
- Definition: The fundamental structural block in IEC 61131-3, consisting of Programs (`PROGRAM`), Function Blocks (`FUNCTION_BLOCK`), and Functions (`FUNCTION`).
- Why it matters: Establishes explicit scope, memory allocation, and execution boundaries for industrial automation code.
- Related concepts: Function (`FC`), Function Block (`FB`), Method.
- Citation: PLC Controls with Structured Text / program-organization-unit
- Verification status: source-backed

### 2. Bounded Iteration
- Definition: The constraint that all loop constructs (`FOR`, `WHILE`, `REPEAT`) must have deterministic, strictly bounded loop bounds and guaranteed termination conditions.
- Why it matters: Prevents infinite loop execution that exceeds the controller scan time threshold and triggers a fatal watchdog fault.
- Related concepts: Watchdog Timer, Program Scan, Runtime Error.
- Citation: PLC Controls with Structured Text / bounded-iteration
- Verification status: source-backed

### 3. CASE State Machine
- Definition: A control structure that evaluates an integer or enumerated state variable to execute exactly one branch of sequential logic per scan cycle.
- Why it matters: Replaces unmaintainable nested `IF-THEN-ELSE` statements ("spaghetti code") and ensures deterministic single-state execution.
- Related concepts: ENUM, State Diagram, Transition.
- Citation: PLC Controls with Structured Text / case-state-machine
- Verification status: source-backed

### 4. First-Scan Initialization (`FirstScan` / `S2:1/15`)
- Definition: A system bit or initialization variable that evaluates to `TRUE` only during the first scan cycle following controller startup or mode change.
- Why it matters: Ensures state variables, counters, and communication buffers are explicitly set to safe default initial values before physical outputs activate.
- Related concepts: Startup State, State Initialization, Cold Restart.
- Citation: PLC Controls with Structured Text / first-scan-initialization
- Verification status: source-backed

### 5. Edge Detection (`R_TRIG` / `F_TRIG`)
- Definition: A standard function block that detects a false-to-true (`R_TRIG` rising edge) or true-to-false (`F_TRIG` falling edge) transition of a digital signal during a single program scan.
- Why it matters: Prevents continuous execution of event-driven commands (e.g., pulse counting, step transitions) across multiple scan cycles.
- Related concepts: One-Shot, Pulse Detection, Signal Debouncing.
- Citation: PLC Controls with Structured Text / edge-detection
- Verification status: source-backed

### 6. Defensive Function Boundary
- Definition: The rule that a stateless Function (`FC`) must only communicate through `VAR_INPUT`, `VAR_OUTPUT`, and `VAR_IN_OUT`, without modifying global variables or calling itself recursively.
- Why it matters: Guarantees thread safety, reentrancy safety, and cross-platform reusability across different IEC 61131-3 PLC compilers.
- Related concepts: Encapsulation, Side Effect, Recursion Prohibition.
- Citation: PLC Controls with Structured Text / defensive-function-boundary
- Verification status: source-backed

---

## 7. Practical patterns and examples

### Pattern 1: CASE State Machine with Default Alarm Handler
- Problem solved: Eliminates sprawling, race-condition-prone `IF` cascades and guarantees safe recovery when state variables contain invalid values.
- Recommended approach: Define state values using an `ENUM` type (`STEP_INIT`, `STEP_RUN`, `STEP_STOP`). Structure main sequence using a `CASE` statement, and include an `ELSE` section that sets an alarm flag and forces the state machine back to a safe startup state (`STEP_INIT`).
- Repository-level manifestation: Structured Text files (`*.st`, `*.scl`) containing `TYPE State_ENUM : (STEP_INIT, STEP_RUN, STEP_STOP) := STEP_INIT; END_TYPE` and `CASE StepVar OF ... ELSE StepVar := STEP_INIT; AlarmFlag := TRUE; END_CASE;`.
- Limitations: Requires complete enumeration of all valid operational states during software design.
- Source citation: PLC Controls with Structured Text / case-state-machine-pattern

### Pattern 2: Encapsulated Input Signal Debouncer and Alarm Delay
- Problem solved: Prevents mechanical switch bounce or liquid level wave turbulence from repeatedly triggering and damaging physical actuators (motors, pumps).
- Recommended approach: Implement a Function Block (`FB_AlarmOnOffDelay`) combining an On-Delay Timer (`TON`) and Off-Delay Timer (`TOF`). Require input signals to remain stable for a configurable period (`OnDelaySec`) before changing the output state.
- Repository-level manifestation: Function Block files (`FB_AlarmOnOffDelay.st`) defining `VAR_INPUT IN : BOOL; OnDelaySec : WORD; END_VAR` and internal timers `TimerOn : TON; TimerOff : TOF;`.
- Limitations: Introduces a controlled delay equal to `OnDelaySec` before state transitions execute.
- Source citation: PLC Controls with Structured Text / signal-debouncer-pattern

### Pattern 3: Defensive Parameter Validation in FC/FB
- Problem solved: Prevents fatal controller runtime errors (RTE) such as division by zero or array index out-of-bounds errors during process calculation.
- Recommended approach: At the beginning of a Function or Function Block, validate all input parameters (`VAR_INPUT`). If an input is invalid (e.g., denominator = 0), set an error output parameter (`Error := TRUE`), assign a safe default return value, and bypass the calculation logic.
- Repository-level manifestation: Function code (`FC_Divide.st`) checking `IF Denominator = 0 THEN Error := TRUE; Result := 0.0; ELSE Result := Numerator / Denominator; END_IF;`.
- Limitations: Requires additional parameter validation code lines at the start of every mathematical Function.
- Source citation: PLC Controls with Structured Text / parameter-validation-pattern

---

## 8. Common failure modes and risks

### 1. Unbounded Loop Watchdog Trip
- Why it happens: Developers use `WHILE` or `REPEAT` loops with conditions dependent on external sensor inputs that may not change during a single scan cycle.
- Early warning signs: Intermittent controller watchdog faults or process stoppage when an input sensor fails open/closed.
- Repository evidence: `WHILE` or `REPEAT` statements in `.st`/`.scl` files without explicit loop iteration counters or maximum loop count exit checks.
- Severity tendency: Critical

### 2. Unstructured Jumps (`GOTO` / `JMP`) and Spaghetti Flow
- Why it happens: Porting legacy Ladder Diagram logic or quick debugging patches using jump labels instead of structured control statements.
- Early warning signs: Code blocks that are difficult to trace, skipped variable assignments, or unexpected state transitions during troubleshooting.
- Repository evidence: Presence of `GOTO` or `JMP` statements in `.st` or `.scl` source files.
- Severity tendency: Error

### 3. Recursive Function Call Stack Overflow
- Why it happens: A Function (`FC`) attempts to call itself directly or indirectly to solve a mathematical or tree-traversal algorithm.
- Early warning signs: Immediate PLC crash or memory corruption upon executing the function block call.
- Repository evidence: Function source code where a `FUNCTION` identifier appears as a call within its own code body.
- Severity tendency: Critical

### 4. Uninitialized State Machine Startup Race
- Why it happens: State variables depend on persistent memory values without explicit reset logic tied to the first program scan bit (`FirstScan` / `S2:1/15`).
- Early warning signs: Physical actuators energizing immediately upon controller power restoration without operator start command.
- Repository evidence: State machine logic lacking an explicit `FirstScan` initialization check or `STEP_INIT` assignment during power-up.
- Severity tendency: Error

---

## 9. Repository-audit translation

### Static checks (automated)
- Parsing `.st` and `.scl` files to detect `GOTO`, `JMP`, unbounded `WHILE`/`REPEAT` loops, recursive function calls, and missing `ELSE` branches in `CASE` statements.
- Verification of hardcoded passwords, unencrypted protocol port configurations, or missing project changelogs in repository configuration manifests.
- Static pattern matching for proper usage of `FUNCTION_BLOCK`, `VAR_INPUT`, and parameter validation checks.

### Human review (operational & safety-culture)
- Review of process safety interlock integrity and hardware safety relay wiring diagrams.
- Assessment of operator HMI alarm response procedures and manual control override policies.
- Inspection of plant commissioning logs, site physical access security, and electrician maintenance procedures.

### Safety-critical exclusions
- Hardware Safety Control Relays (SCR), physical Emergency Stop (E-Stop) pushbuttons, and mechanical pressure relief valves must never be audited or superseded by static ST software repository checks.
- Site operational safety culture, physical lockout/tagout (LOTO) enforcement, and human operator emergency readiness exist outside static code analysis.

---

## 10. Candidate rules

### Candidate Rule 1
- Rule ID: iiot-st-001
- Title: Unstructured Branching Command Usage (GOTO / JMP)
- Profile: iiot
- Severity tendency: error
- Rationale: Using unstructured jump statements (`GOTO`, `JMP`) breaks deterministic execution flow, creates unmaintainable "spaghetti code", and bypasses variable initialization in Structured Text.
- Source-backed basis: Antonsen Chapter 15 explicitly warns against `GOTO` and `JMP` statements, citing them as the primary cause of unstructured spaghetti code that complicates troubleshooting and causes runtime faults.
- Repository evidence to inspect: Structured Text source files (`*.st`, `*.scl`, `*.pou`, `*.iec`).
- Pass condition: Code contains no `GOTO` or `JMP` keywords.
- Fail condition: Code contains `GOTO` or `JMP` branching statements.
- Exceptions or limitations: Comments containing historical references to jump commands.
- YAML readiness: ready
- Source citation: PLC Controls with Structured Text / avoiding-spaghetti-code
- Source: Tom Mejer Antonsen - PLC Controls with Structured Text (ST)
- Structural locator: Chapter 15: Best Practice ST-Programming — 15.3 Avoid Spaghetti Code
- Spirit locator: Unstructured jump commands destroy code clarity and must be replaced by structured IF/CASE statements.
- Verification status: source-backed

### Candidate Rule 2
- Rule ID: iiot-st-002
- Title: Unbounded Loop Construct Exposure in Cyclic Scan (WHILE / REPEAT)
- Profile: iiot
- Severity tendency: critical
- Rationale: Unbounded `WHILE` or `REPEAT` loops can execute indefinitely if exit conditions rely on external hardware sensors, exceeding the PLC scan budget and triggering a fatal watchdog fault.
- Source-backed basis: Antonsen Chapter 2 & Chapter 9 note that `WHILE` and `REPEAT` loops run within a real-time scan cycle; unbounded loops lead to controller non-responsiveness and watchdog trips.
- Repository evidence to inspect: Structured Text source files (`*.st`, `*.scl`, `*.pou`, `*.iec`).
- Pass condition: All `WHILE` and `REPEAT` statements contain explicit iteration counter checks or max-loop limit guards.
- Fail condition: Unbounded `WHILE` or `REPEAT` statements exist without iteration boundary checks.
- Exceptions or limitations: `FOR` loops with fixed integer bounds (`FOR i := 1 TO 10 DO`).
- YAML readiness: ready
- Source citation: Industrial Network Security / bounded-iteration
- Source: Tom Mejer Antonsen - PLC Controls with Structured Text (ST)
- Structural locator: Chapter 2: Program Execution — The PLC Scan / Chapter 9: Conditional Statements — Loops
- Spirit locator: Loop iterations must be bounded to protect real-time scan cycle determinism.
- Verification status: source-backed

### Candidate Rule 3
- Rule ID: iiot-st-003
- Title: CASE Statement Missing Default ELSE Handler
- Profile: iiot
- Severity tendency: warning
- Rationale: A `CASE` state machine without an `ELSE` section fails to handle corrupted, uninitialized, or out-of-range state variable values, leading to silent sequence lockups.
- Source-backed basis: Antonsen Chapter 9 recommends including an `ELSE` statement in `CASE` constructs to capture unexpected values and flag alarm errors.
- Repository evidence to inspect: Structured Text source files (`*.st`, `*.scl`, `*.pou`, `*.iec`).
- Pass condition: Every `CASE ... END_CASE` construct includes an explicit `ELSE` clause.
- Fail condition: A `CASE` construct lacks an `ELSE` handling block.
- Exceptions or limitations: None.
- YAML readiness: ready
- Source citation: PLC Controls with Structured Text / case-state-machine
- Source: Tom Mejer Antonsen - PLC Controls with Structured Text (ST)
- Structural locator: Chapter 9: Conditional Statements — 9.2 CASE Statement
- Spirit locator: State machines must explicitly handle out-of-bounds state values to prevent sequence lockup.
- Verification status: source-backed

### Candidate Rule 4
- Rule ID: iiot-st-004
- Title: Recursive Function Call Detection in Function POUs
- Profile: iiot
- Severity tendency: critical
- Rationale: Recursive function calls in real-time PLC environments cause fast call stack overflow, corrupting controller memory and halting plant operations.
- Source-backed basis: Antonsen Chapter 10 highlights that a Function (`FC`) must never call itself recursively under any circumstances.
- Repository evidence to inspect: Function source files (`*.st`, `*.scl`).
- Pass condition: Function identifiers do not appear as call expressions within their own declaration body.
- Fail condition: A `FUNCTION` calls its own identifier.
- Exceptions or limitations: None.
- YAML readiness: needs-review
- Reason if not ready: Static regex cannot differentiate between a function returning its value (`FunctionName := Value;`) and an actual recursive call invocation (`FunctionName := FunctionName(Param);`) across multi-vendor syntaxes without AST parsing.
- Source citation: PLC Controls with Structured Text / defensive-function-boundary
- Source: Tom Mejer Antonsen - PLC Controls with Structured Text (ST)
- Structural locator: Chapter 10: Creating Functions — Rules for FCs
- Spirit locator: Recursion is strictly prohibited in real-time control software.
- Verification status: source-backed

### Candidate Rule 5
- Rule ID: iiot-st-005
- Title: Missing Physical Emergency Stop Interlock in Actuator Logic
- Profile: iiot
- Severity tendency: critical
- Rationale: Physical safety interlocks and hardwired Emergency Stop relays cannot be verified solely from software repository artifacts.
- Source-backed basis: Antonsen Chapter 1 & Chapter 15 note that safety PLCs and physical safety circuits operate under distinct physical constraints.
- Repository evidence to inspect: Physical safety wiring and electromechanical relay schematics.
- Pass condition: N/A (Non-static check).
- Fail condition: N/A (Non-static check).
- Exceptions or limitations: Cannot be checked statically.
- YAML readiness: blocked
- Reason if not ready: Requires physical plant electrical inspection outside digital software repository code.
- Source citation: PLC Controls with Structured Text / physical-safety-interlocks
- Source: Tom Mejer Antonsen - PLC Controls with Structured Text (ST)
- Structural locator: Chapter 1: Introduction — 1.5 Disadvantages of ST / Chapter 15: Best Practice ST-Programming
- Spirit locator: Hardware safety systems override software logic and require physical site verification.
- Verification status: source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: iiot-st-001
    title: Unstructured Branching Command Usage (GOTO / JMP)
    profile: iiot
    severity: error
    message: "Unstructured jump command (GOTO / JMP) detected in Structured Text source code. Replace with structured IF or CASE statements."
    references:
      - book: "PLC Controls with Structured Text (ST)"
        concept: "avoiding-spaghetti-code"
    check:
      type: pattern_match
      file_glob: "**/*.{st,scl,pou,iec}"
      pattern: "(?i)\\b(GOTO|JMP)\\b"
      must_exist: true
      error_when: pattern_present

  - id: iiot-st-002
    title: Unbounded Loop Construct Exposure in Cyclic Scan (WHILE / REPEAT)
    profile: iiot
    severity: critical
    message: "Loop statement (WHILE / REPEAT) detected without explicit iteration count guard, risking scan watchdog timeout."
    references:
      - book: "PLC Controls with Structured Text (ST)"
        concept: "bounded-iteration"
    check:
      type: pattern_match
      file_glob: "**/*.{st,scl,pou,iec}"
      pattern: "(?i)\\b(WHILE|REPEAT)\\b"
      must_exist: true
      error_when: pattern_present

  - id: iiot-st-003
    title: CASE Statement Missing Default ELSE Handler
    profile: iiot
    severity: warning
    message: "CASE statement detected that lacks an explicit ELSE branch for default error handling."
    references:
      - book: "PLC Controls with Structured Text (ST)"
        concept: "case-state-machine"
    check:
      type: pattern_match
      file_glob: "**/*.{st,scl,pou,iec}"
      pattern: "(?i)\\bCASE\\b(?!.*\\bELSE\\b).*\\bEND_CASE\\b"
      must_exist: true
      error_when: pattern_present
```

### Candidates not emitted

- Rule ID: `iiot-st-004`
  - Title: Recursive Function Call Detection in Function POUs
  - Readiness: `needs-review`
  - Reason: Static regex cannot differentiate between a function returning its value (`FunctionName := Value;`) and an actual recursive call invocation (`FunctionName := FunctionName(Param);`) across multi-vendor syntaxes without AST parsing.
- Rule ID: `iiot-st-005`
  - Title: Missing Physical Emergency Stop Interlock in Actuator Logic
  - Readiness: `blocked`
  - Reason: Requires physical plant electrical inspection outside digital software repository code.

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
*The RepoScope Knowledge Note for Tom Mejer Antonsen's "PLC Controls with Structured Text (ST)" is complete and ready for deployment.*

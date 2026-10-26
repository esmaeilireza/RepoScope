# RepoScope Knowledge Note: Web Application Security

## 1. Source identity

- **Title:** Web Application Security
- **Author(s):** Andrew Hoffman
- **Branch:** webapp
- **RepoScope profile:** webapp
- **Primary source file:** Andrew Hoffman - Web Application Security_ Exploitation and Countermeasures for Modern Web Applications (2024, O'Reilly Media).pdf
- **Note status:** reviewed-with-candidate-rules

## 2. Scope
- In scope: Web application security posture, defense-in-depth countermeasures, security headers (CSP, HSTS, COOP, CORP, CORS), input validation and output encoding patterns.
- In scope: Static security auditing, dependency management hygiene, CSRF defense mechanisms, and secret leakage prevention in repositories.
- In scope: Cross-Site Scripting (XSS) mitigations, XML External Entity (XXE) protections, and rate-limiting patterns.
- In scope: Reconnaissance surface minimization and security policy file presence.
- Out of scope: Physical server datacenter security and hardware lockbox access control.
- Out of scope: Network layer BGP routing security and telecom hardware configuration.
- Out of scope: General corporate employee security awareness training and HR policy enforcement.

## 3. Source spirit card
1. Core thesis: Robust web security requires combining offensive vulnerability analysis with defensive architectural countermeasures embedded directly into application code and configuration.
2. Architectural stance: Security must be engineered into every layer of the web application stack as an active, defense-in-depth posture rather than an afterthought.
3. Primary trade-off embraced: Adding strict browser security policies and enforcement overhead to prevent entire classes of client-side exploitation.
4. Primary risk feared: Silent remote code execution, session hijacking, and catastrophic data exfiltration resulting from unmitigated injection flaws.
5. Definition of quality: Codebases that systematically enforce secure defaults, eliminate dangerous DOM sinks, and contain hardened HTTP security headers.
6. View on automation: Automated security scanners and CI static analysis checks are essential for detecting vulnerable dependencies and misconfigured headers early.
7. View on human process: Threat modeling, security architecture reviews, and developer security champions are required for complex authorization logic.
8. Ideal repository posture: The repository contains explicit security header configurations, automated dependency audit steps in CI, strict CSP declarations, and an up-to-date SECURITY.md file.
9. Anti-pattern priority: Eliminating inline script execution, unescaped DOM insertions, wildcard CORS origins, and unmaintained third-party dependencies.
10. Long-term lifecycle vision: Continuous security integration where every code commit is automatically audited for vulnerabilities, secrets, and policy regressions.

## 4. Source-backed structure
### Theme 1: Web Application Reconnaissance and Dependency Tracking
- Source: Web Application Security
- Structural locator: Chapter 2: Introduction to Web Application Reconnaissance
- Spirit locator: Mapping application endpoints and auditing third-party dependencies is essential to understand the application's attack surface and supply chain risks.

### Theme 2: Cross-Site Scripting and Client-Side Mitigations
- Source: Web Application Security
- Structural locator: Chapter 10: Cross-Site Scripting
- Spirit locator: Preventing client-side code injection requires eliminating unsafe DOM sinks and enforcing context-aware output encoding.

### Theme 3: Content Security Policy and Browser Controls
- Source: Web Application Security
- Structural locator: Chapter 18: Content Security Policy
- Spirit locator: Restricting resource loading origins via a strict Content Security Policy neutralizes XSS and unauthorized script execution.

### Theme 4: HTTP Security Headers and Cross-Origin Controls
- Source: Web Application Security
- Structural locator: Chapter 22: HTTP Security Headers
- Spirit locator: Hardening HTTP responses with transport security and cross-origin policies protects user sessions and isolates browsing contexts.

## 5. Source-backed spirit
1. What does this source consider the most dangerous form of technical debt or architectural drift?
Unmonitored third-party dependencies and legacy unhardened HTTP endpoints that expose the application to known exploits.

2. How does this source balance automated verification against human judgment?
Automated tools must continuously inspect static artifacts, dependencies, and headers, while human security engineers conduct threat modeling and manual penetration testing.

3. What is the source's stance on standardization versus local autonomy?
Centralized security libraries and standardized header configurations must be used across all applications to eliminate custom, flawed security implementations.

4. What runtime or operational failure modes does the source trace back to repository-level static structure?
Missing security header configurations allow clickjacking and XSS attacks, while committed `.env` files lead to credential theft and cloud takeover.

5. What repository artifacts does the source treat as non-negotiable proof of health?
A clear `SECURITY.md` contact policy, explicit header configurations (including CSP and HSTS), and dependency manifest lockfiles.

6. How does the source handle evolution, versioning, and change over time?
Security posture must evolve alongside web browser standards, regularly updating security headers, dependency versions, and isolation policies.

## 6. Key concepts
### Concept 1: Content Security Policy (CSP)
- Definition: An HTTP header allowing site operators to restrict the resources (such as JavaScript, CSS, Images) that the browser is allowed to load.
- Why it matters: Serves as a primary defense-in-depth layer against Cross-Site Scripting (XSS) and data injection attacks.
- Related concepts: Directives, Nonce, Strict Dynamic, Report-URI.
- Citation: Chapter 18: Content Security Policy
- Verification status: source-backed

### Concept 2: Cross-Origin Resource Sharing (CORS)
- Definition: A browser mechanism that uses HTTP headers to tell browsers if a web application running at one origin has permission to access resources from a different origin.
- Why it matters: Misconfigured wildcard CORS allows unauthorized third-party sites to read sensitive user data via authenticated AJAX requests.
- Related concepts: Same-Origin Policy, Access-Control-Allow-Origin, Preflight Request.
- Citation: Chapter 22: HTTP Security Headers
- Verification status: source-backed

### Concept 3: HTTP Strict Transport Security (HSTS)
- Definition: A header forcing browsers to communicate with the server exclusively over encrypted HTTPS connections.
- Why it matters: Prevents man-in-the-middle SSL-stripping attacks during initial connection negotiation.
- Related concepts: HTTPS, Max-Age, IncludeSubDomains, Preload.
- Citation: Chapter 22: HTTP Security Headers
- Verification status: source-backed

### Concept 4: DOM-Based XSS Sink
- Definition: A JavaScript function or DOM object (e.g. `innerHTML`, `eval`, `document.write`) that executes untrusted input as code.
- Why it matters: Unsanitized data reaching a DOM sink allows attackers to execute arbitrary JavaScript in the context of the victim's browser session.
- Related concepts: XSS Source, Sanitization, Context-Aware Encoding.
- Citation: Chapter 10: Cross-Site Scripting
- Verification status: source-backed

### Concept 5: Dependency Supply Chain Vulnerability
- Definition: A security flaw introduced into an application through third-party open-source libraries or package manager dependencies.
- Why it matters: Malicious or outdated third-party packages can compromise the entire server or client environment.
- Related concepts: Software Bill of Materials (SBOM), Package Lockfile, CVE.
- Citation: Chapter 6: Identifying Third-Party Dependencies
- Verification status: source-backed

### Concept 6: Cross-Site Request Forgery (CSRF)
- Definition: An attack that forces an authenticated user to execute unwanted actions on a web application in which they are currently authenticated.
- Why it matters: Allows malicious sites to state-mutate user accounts without their knowledge or consent.
- Related concepts: Anti-CSRF Token, SameSite Cookie Attribute, Double-Submit Cookie.
- Citation: Chapter 11: Cross-Site Request Forgery
- Verification status: source-backed

## 7. Practical patterns and examples
### Pattern 1: Strict Content Security Policy Header Configuration
- Problem solved: Neutralizing unauthorized script execution caused by XSS flaws.
- Recommended approach: Configure HTTP response headers with `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...'`.
- Repository-level manifestation: Server configuration files, framework header middleware, or `next.config.js` declaring strict CSP directives.
- Limitations: Requires dynamic nonce generation for inline scripts or strict adherence to external script files.
- Source citation: Chapter 18: Content Security Policy

### Pattern 2: Security Vulnerability Reporting Policy
- Problem solved: Inability of external security researchers to responsibly report discovered vulnerabilities to maintainers.
- Recommended approach: Maintain a dedicated `SECURITY.md` file in the repository root or `.github/` folder detailing disclosure channels.
- Repository-level manifestation: Presence of `SECURITY.md` file in root or `.github/SECURITY.md`.
- Limitations: Does not guarantee that incoming reports will be triaged promptly by maintainers.
- Source citation: Chapter 2: Introduction to Web Application Reconnaissance

### Pattern 3: Lockfile Preservation for Supply Chain Auditing
- Problem solved: Inconsistent dependency builds introducing unvetted or compromised package versions.
- Recommended approach: Always commit dependency lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `poetry.lock`) alongside package manifests.
- Repository-level manifestation: Presence of lockfile in version control alongside `package.json` or `pyproject.toml`.
- Limitations: Requires automated CI audit steps (`npm audit`) to catch newly disclosed vulnerabilities in locked packages.
- Source citation: Chapter 6: Identifying Third-Party Dependencies

## 8. Common failure modes and risks
### Failure Mode 1: Committed Secret Environment File
- Why it happens: Developers accidentally commit populated `.env` files containing live API keys, database credentials, or secret keys to version control.
- Early warning signs: Unprotected AWS credentials or database connection strings visible in git commit history.
- Repository evidence: `.env` file committed without being matched in `.gitignore`.
- Severity tendency: critical

### Failure Mode 2: Missing Security Contact Policy in Public API Repository
- Why it happens: Project maintainers omit a `SECURITY.md` file, forcing security researchers to publish vulnerabilities publicly or contact random maintainers.
- Early warning signs: Vulnerabilities being reported publicly in open GitHub issues.
- Repository evidence: Absence of `SECURITY.md` and `.github/SECURITY.md`.
- Severity tendency: warning

### Failure Mode 3: Absence of HTTP Strict Transport Security
- Why it happens: Server configuration fails to set the `Strict-Transport-Security` header on production HTTPS responses.
- Early warning signs: Application allows plain HTTP requests without forcing immediate permanent redirect and HSTS caching.
- Repository evidence: Header configuration scripts missing `Strict-Transport-Security` directives.
- Severity tendency: error

### Failure Mode 4: Wildcard CORS Configuration
- Why it happens: Setting `Access-Control-Allow-Origin: *` to solve cross-origin development issues and leaving it in production.
- Early warning signs: Authenticated API endpoints accessible to arbitrary third-party web domains.
- Repository evidence: Configuration files containing pattern `Access-Control-Allow-Origin: "*"`.
- Severity tendency: critical

## 9. Repository-audit translation
### Static checks (automated via RepoScope)
- Presence of `SECURITY.md` or `.github/SECURITY.md`.
- Presence of a dependency lockfile alongside package manifest files.
- Absence of plaintext `.env` files committed to version control.
- Pattern match verification for Content-Security-Policy header declarations in web application configuration files.

### Human review (contextual & strategic)
- Evaluation of CSRF protection token validation logic on state-mutating requests.
- Audit of custom authentication and session token storage strategy.
- Assessment of DOM data flows to ensure untrusted user inputs do not reach dangerous sinks.
- Review of threat modeling documents and SSDL process compliance.

## 10. Candidate rules

- Rule ID: webapp-security-001
- Title: Missing Security Policy File
- Profile: webapp
- Severity tendency: warning
- Rationale: Repositories providing web application services must contain a `SECURITY.md` file to guide responsible vulnerability disclosure.
- Source-backed basis: The source highlights the importance of established reporting channels for application security findings.
- Repository evidence to inspect: Absence of `SECURITY.md` and `.github/SECURITY.md`.
- Pass condition: `SECURITY.md` exists in root or `.github/`.
- Fail condition: Neither `SECURITY.md` nor `.github/SECURITY.md` is present.
- Exceptions or limitations: None for public or enterprise web applications.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Chapter 2: Introduction to Web Application Reconnaissance
- Source: Web Application Security
- Structural locator: Chapter 2: Introduction to Web Application Reconnaissance
- Spirit locator: Responsible vulnerability disclosure requires clear repository security contact policies.
- Verification status: source-backed

- Rule ID: webapp-security-002
- Title: Missing Package Lockfile
- Profile: webapp
- Severity tendency: error
- Rationale: Repositories with package manifests must commit lockfiles to ensure deterministic and supply-chain-auditable builds.
- Source-backed basis: The source emphasizes supply chain security and strict dependency version controls.
- Repository evidence to inspect: Presence of `package.json` without `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`.
- Pass condition: A corresponding lockfile exists alongside package manifest.
- Fail condition: Package manifest exists but lockfile is absent.
- Exceptions or limitations: None.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Chapter 6: Identifying Third-Party Dependencies
- Source: Web Application Security
- Structural locator: Chapter 6: Identifying Third-Party Dependencies
- Spirit locator: Supply chain integrity relies on locked, reproducible dependency manifests.
- Verification status: source-backed

- Rule ID: webapp-security-003
- Title: Absence of Content Security Policy Header Declaration
- Profile: webapp
- Severity tendency: error
- Rationale: Web application header configurations must explicitly define a Content-Security-Policy to mitigate client-side script injection.
- Source-backed basis: The source identifies Content Security Policy as a primary browser defense against XSS.
- Repository evidence to inspect: Header configuration files (`next.config.*`, `server.js`, `nginx.conf`) matching `Content-Security-Policy`.
- Pass condition: Header configuration contains `Content-Security-Policy` pattern.
- Fail condition: Header configuration omits `Content-Security-Policy`.
- Exceptions or limitations: Applies when header configuration files are detected.
- YAML readiness: ready
- Reason if not ready: N/A
- Source citation: Chapter 18: Content Security Policy
- Source: Web Application Security
- Structural locator: Chapter 18: Content Security Policy
- Spirit locator: Browser isolation and XSS mitigation require explicit Content Security Policy headers.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
version: "1"
profile: webapp
rules:
  - id: webapp-security-001
    severity: warning
    checks:
      - type: file_exists
        file_glob: "{SECURITY.md,.github/SECURITY.md,docs/SECURITY.md}"
        error_when: file_absent
        message: "Repository lacks a SECURITY.md file for responsible security disclosure."

  - id: webapp-security-002
    severity: error
    checks:
      - type: file_exists
        file_glob: "{package-lock.json,pnpm-lock.yaml,yarn.lock,poetry.lock,Pipfile.lock}"
        error_when: file_absent
        message: "Dependency manifest exists but no deterministic lockfile is committed to version control."

  - id: webapp-security-003
    severity: error
    checks:
      - type: pattern_match
        file_glob: "{next.config.*,server.js,express.js,nginx.conf,headers.json}"
        pattern: "Content-Security-Policy"
        must_exist: true
        error_when: pattern_absent
        message: "Web application header configuration lacks a Content-Security-Policy header declaration."
    references:
      - book: "Web Application Security"
        concept: "content-security-policy"
```

### Candidates not emitted
No rules ready for emission under current validator contract.

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

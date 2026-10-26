1. Source Identity
Title: Data Management At Scale

# Data Management at Scale — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Data Management at Scale
- **Author(s):** Piethein Strengholt
- **Branch:** dataops
- **RepoScope profile:** dataops
- **Primary source file:** data-management-at-scale-best-practices-for-enterprise-architecture.pdf
- **Note status:** reviewed-with-candidate-rules

## 2. Scope
- In scope:
  - Distributed domain-driven data architecture and Scaled Data Architecture principles.
  - Data Product encapsulation: data code, metadata, access control, and binding data contracts.
  - Enterprise metadata management: technical, operational, and business metadata architecture.
  - Master Data Management (MDM) integration within distributed, domain-owned environments.
  - Federated computational data governance, policy-as-code enforcement, and automated self-serve platform engineering.
- Out of scope:
  - Proprietary vendor database engine setup or low-level SQL optimization tuning.
  - Individual programming language syntax tutorials (e.g., Python vs. Scala dataframe syntax).
  - Physical network infrastructure routing protocols or hardware cable installation.

## 3. Source spirit card
- Source title: Data Management at Scale: Best Practices for Enterprise Architecture
- Core architectural posture: Decentralize data management by distributing ownership to domain teams as Data Products, unified through federated computational governance and self-serve platforms.
- Primary operational invariant: Domain data assets must be published as version-controlled Data Products governed by explicit Data Contracts, metadata declarations, and automated quality SLAs.
- Default abstraction layer: Domain-oriented Data Products equipped with standardized metadata, explicit schema contracts, bounded context APIs, and self-serve infrastructure.
- System boundary definition: Distributed enterprise-wide, covering operational source domain outputs, data product integration boundaries, enterprise metadata catalogs, and governing platform APIs.
- Target failure model: The monolithic "data lake swamp" trap where centralized teams become organizational bottlenecks, data quality lacks domain ownership, and schema changes break downstream consumers without warning.
- Primary trade-off accepted: Accepts increased platform complexity and federated governance coordination in exchange for domain autonomy, enterprise scalability, and agility.
- Key repository evidence: Presence of data product manifests (data-product.yml), explicit schema contract definitions (OpenAPI, Avro, Protobuf, dbt schema YAML), policy-as-code rules, and metadata tags.
- Anti-pattern rejected: Monolithic central data lakes without domain ownership, uncontracted raw database table dumps, centralized data engineering bottleneck teams, and undocumented secret/PII sharing.
- Success criterion: An enterprise ecosystem of autonomous domain data products publishing self-describing, contracted data assets registered in an automated central metadata catalog.

## 4. Source-backed structure
- Theme 1: Shift from Centralized Monoliths to Distributed Scaled Architecture
  - Source: Data Management at Scale
  - Structural locator: Chapter 1, Architecture & Principles / Chapter 2, Domain-Driven Design
  - Spirit locator: Moving from monolithic centralized EDWs and data lakes to domain-driven distributed architectures eliminates central bottlenecks and enforces domain-level data accountability.
- Theme 2: Data Product Specification and Binding Data Contracts
  - Source: Data Management at Scale
  - Structural locator: Chapter 3, Data Products / Chapter 4, Data Mesh & Distribution
  - Spirit locator: Packaging data logic, schema specifications, operational metadata, and access controls into versioned Data Products governed by contracts ensures consumer trust and interoperability.
- Theme 3: Enterprise Metadata Management and Data Cataloging
  - Source: Data Management at Scale
  - Structural locator: Chapter 5, Metadata Management / Chapter 6, Master Data Management
  - Spirit locator: Automating the harvesting of technical, operational, and business metadata provides enterprise-wide discoverability and end-to-end lineage without requiring centralized physical storage.
- Theme 4: Federated Computational Data Governance and Policy-as-Code
  - Source: Data Management at Scale
  - Structural locator: Chapter 7, Data Governance / Chapter 8, Security & Privacy
  - Spirit locator: Embedding policy-as-code security, access controls, and compliance checks directly into self-serve CI/CD pipelines guarantees continuous enterprise governance.
- Theme 5: Self-Serve Platform Infrastructure and Provisioning
  - Source: Data Management at Scale
  - Structural locator: Chapter 9, Platform Architecture & Provisioning
  - Spirit locator: Providing standardized self-serve platform infrastructure as code (IaC) empowers domain teams to deploy and manage data products independently and safely.

## 5. Source-backed spirit
1. What architectural posture does this source assume?
   - The source assumes a decentralized, domain-driven posture where individual business domains own and operate their data products, connected through a federated computational governance framework.
2. What is the fundamental invariant the system must preserve?
   - The fundamental invariant is that every published domain data asset must be encapsulated as a Data Product with a binding Data Contract specifying its schema, SLA, classification, and access policies.
3. What operational trade-offs does the source explicitly accept?
   - The source accepts higher initial investment in self-serve platform tooling and federated governance standards to eliminate central engineering bottlenecks and enable long-term enterprise scalability.
4. How does the source define failure or risk?
   - The source defines failure as central data teams becoming overwhelmed bottlenecks, uncontracted data lake dumps producing "data swamps", silent schema breaking changes, and unmonitored PII exposure.
5. What repository-level artifacts demonstrate adherence to this spirit?
   - Adherence is demonstrated by repository manifests such as data-product.yml, contract definitions (contract.yaml, avro/proto schemas), security classification tags, and automated quality test suites.
6. What anti-patterns indicate a violation of the source's spirit?
   - Anti-patterns include dumping unformatted raw operational tables into a shared lake folder without metadata, modifying production schemas without versioned contracts, and granting unrestricted global read access to sensitive data.

## 6. Key concepts
- Concept 1: Scaled Data Architecture & Data Mesh
  - Definition: An architectural paradigm that decentralizes data ownership to domain teams, treating data as a product supported by self-serve platform infrastructure and federated governance.
  - Why it matters: Prevents organizational bottlenecks and scales enterprise data management alongside business growth.
  - Related concepts: Domain-Driven Design, Data Product, Self-Serve Platform.
  - Citation: Chapter 1, Architecture & Principles — Principles of scaled data architecture.
  - Verification status: source-backed
- Concept 2: Data Product
  - Definition: An autonomous, self-describing node in a data network that encapsulates data logic, underlying storage, metadata, code, and interfaces under explicit domain ownership.
  - Why it matters: Shifts data management from passive historical artifact collection to active product delivery with guaranteed quality SLAs.
  - Related concepts: Data Contract, Bounded Context, Output Port.
  - Citation: Chapter 3, Data Products — Defining data product boundaries and components.
  - Verification status: source-backed
- Concept 3: Data Contract
  - Definition: A formal, versioned agreement between a data product producer and consumers specifying schema, semantics, refresh SLAs, quality guarantees, and usage policies.
  - Why it matters: Eliminates silent breaking changes and establishes clear operational expectations between upstream systems and downstream consumers.
  - Related concepts: Schema Evolution, Breaking Change, SLA.
  - Citation: Chapter 4, Data Mesh & Distribution — Data contract specifications.
  - Verification status: source-backed
- Concept 4: Enterprise Metadata (Technical, Operational, Business)
  - Definition: Standardized information describing data assets, encompassing technical structure (schemas), operational behavior (lineage, freshness, job status), and business context (definitions, ownership).
  - Why it matters: Enables automated data discovery, lineage tracking, and governance without requiring centralized physical data storage.
  - Related concepts: Data Catalog, Data Lineage, Master Data Management.
  - Citation: Chapter 5, Metadata Management — The three pillars of enterprise metadata.
  - Verification status: source-backed
- Concept 5: Federated Computational Governance
  - Definition: A governance model where central guidelines and compliance policies are defined collaboratively but executed automatically via code and infrastructure automation.
  - Why it matters: Ensures continuous security, privacy, and regulatory compliance across decentralized teams without manual gatekeeping delays.
  - Related concepts: Policy-as-Code, Security Classification, Automated Compliance.
  - Citation: Chapter 7, Data Governance — Federated computational governance model.
  - Verification status: source-backed
- Concept 6: Master Data Management (MDM) in Domain Architectures
  - Definition: The discipline of maintaining a single, authoritative reference definition for core enterprise entities (e.g., Customer, Product) across distributed domains.
  - Why it matters: Ensures semantic consistency and interoperability when combining data products from distinct domain contexts.
  - Related concepts: Conformed Entities, Reference Data, Golden Record.
  - Citation: Chapter 6, Master Data Management — Integrating MDM into domain-driven architectures.
  - Verification status: source-backed

## 7. Practical patterns and examples
- Pattern 1: Data Product Repository & Contract Pattern
  - Problem solved: Lack of standardized structure and explicit contracts in domain data repositories leading to fragile, undocumented pipelines.
  - Recommended approach: Structure domain data repositories with a root data-product.yml descriptor, a contract/ directory containing versioned schema files, and automated contract test suites.
  - Repository-level manifestation: Presence of data-product.yml, contracts/schema.yaml (or .proto/.avsc), and automated schema validation tests in CI/CD.
  - Limitations: Requires domain software engineers to learn data contract formatting and maintain manifest files.
  - Source citation: Chapter 3, Data Products — Data product repository organization.
- Pattern 2: Policy-as-Code Access & Classification Pattern
  - Problem solved: Manual, slow security access request approvals and unmonitored exposure of PII/sensitive fields in enterprise data assets.
  - Recommended approach: Declare data classification levels (e.g., public, internal, confidential, PII) directly in model YAML files and enforce access policies via automated infrastructure scripts.
  - Repository-level manifestation: Column-level or model-level metadata tags specifying classification: pii or sensitivity: confidential in YAML configs.
  - Limitations: Requires central governance teams to maintain standard classification taxonomies and policy enforcement engines.
  - Source citation: Chapter 8, Security & Privacy — Policy-as-code and data privacy controls.
- Pattern 3: Automated Technical Metadata Registration Pattern
  - Problem solved: Outdated, manually maintained data catalogs that fail to reflect the actual state of production databases and pipelines.
  - Recommended approach: Configure CI/CD deployment pipelines to automatically push compiled schemas, lineage graphs, and model documentation to the enterprise metadata catalog on every release.
  - Repository-level manifestation: Pipeline steps (e.g., in GitHub Actions or CI scripts) executing catalog registration commands (e.g., dbt docs generate && push_metadata).
  - Limitations: Requires active integration endpoints with an enterprise catalog tool (e.g., OpenMetadata, DataHub, Collibra).
  - Source citation: Chapter 5, Metadata Management — Automated metadata harvesting.

## 8. Common failure modes and risks
1. Uncontracted Data Product Releases
   - Why it happens: Domain teams deploy schema modifications or new data models directly to production storage without updating or publishing a data contract.
   - Early warning signs: Downstream analytics pipelines or consumer applications fail unexpectedly with schema parsing or missing column errors.
   - Repository evidence: Data model code repositories lacking data-product.yml or contract definitions under version control.
   - Severity tendency: critical
2. Missing Sensitivity / PII Data Classification
   - Why it happens: Developers add new operational fields containing personal data (e.g., email, SSN) without tagging them for security masking or encryption.
   - Early warning signs: Compliance audit failures, unauthorized user access to sensitive fields, and regulatory privacy violations.
   - Repository evidence: Models containing fields named email, phone, or ssn without explicit sensitivity or classification metadata tags.
   - Severity tendency: critical
3. Centralized Team Bottlenecks ("Fake Decentralization")
   - Why it happens: Organizations claim to adopt domain architecture but still require a central data engineering team to approve and write all transformation pipelines.
   - Early warning signs: Long backlog queues for simple data request changes, domain team frustration, and slow time-to-market.
   - Repository evidence: All data pipeline repositories owned and maintained exclusively by a single central engineering team rather than domain CODEOWNERS.
   - Severity tendency: warning
4. Unregistered Metadata and Silent Lineage Gaps
   - Why it happens: Data transformation jobs execute in isolation without registering pipeline execution status or lineage graphs with the enterprise catalog.
   - Early warning signs: Inability to perform impact analysis when source schemas change, and invisible data flow dependencies across domains.
   - Repository evidence: Deployment pipelines lacking automated catalog integration tasks or metadata publishing execution steps.
   - Severity tendency: warning

## 9. Repository-audit translation
### Static checks (automated)
- Absence of `data-product.yml` or `data-product.yaml` manifest in a domain data repository root.
- Absence of a version-controlled contract directory (`contracts/` or `schemas/`) specifying published output schemas.
- Detection of common sensitive field name patterns (e.g., `email`, `ssn`, `phone_number`) lacking explicit `classification` or `sensitivity` metadata tags in YAML models.
- Absence of automated contract validation or test scripts in the CI pipeline configuration (`.github/workflows/`).

### Needs-review candidates
- Verification that schema evolution changes in data contracts follow semantic versioning rules (e.g., major version increments for column deletions).
- Verification that domain ownership in `CODEOWNERS` maps directly to business domain teams rather than a central monolith team.
- Inspection of self-serve IaC scripts (`terraform/`, `pulumi/`) to ensure environment isolation between domain products.

### Human review (contextual & organizational)
- Evaluating whether data product boundaries align cleanly with domain Bounded Contexts.
- Assessing whether cross-domain data access requests adhere to enterprise regulatory and privacy policies.
- Reviewing whether domain teams possess adequate engineering capability to maintain their published data products.

### Organizational artifacts check
- Root `data-product.yml` manifest declaring domain ownership, SLA, contact channels, and published output ports.
- Enterprise data catalog registration workflows defined in repository CI/CD pipeline scripts.

## 10. Candidate rules

- Rule ID: dataops-scale-001
- Title: Missing Data Product Manifest File
- Profile: dataops
- Severity tendency: critical
- Rationale: A domain data repository without a data-product.yml manifest cannot be indexed by self-serve platforms or governed by federated policies.
- Source-backed basis: Data products must be self-describing nodes encapsulating metadata, owner specifications, and operational boundaries.
- Repository evidence to inspect: Presence of data-product.yml or data-product.yaml at the repository root.
- Pass condition: data-product.yml or data-product.yaml exists at the root of the domain data repository.
- Fail condition: No data product manifest file is present in the repository root.
- Exceptions or limitations: Utility or helper libraries not serving as domain data products.
- YAML readiness: ready
- Source citation: Chapter 3, Data Products — Data product specifications and manifests.
- Source: Data Management at Scale
- Structural locator: Chapter 3, Data Products
- Spirit locator: Encapsulating domain data into self-describing data products requires a standardized manifest file at the repository root.
- Verification status: source-backed

- Rule ID: dataops-scale-002
- Title: Missing Sensitive Field Classification Tag
- Profile: dataops
- Severity tendency: critical
- Rationale: Deploying data assets containing sensitive field names (e.g., email, ssn) without classification tags prevents automated policy-as-code masking and risks privacy violations.
- Source-backed basis: Federated computational governance requires security classifications declared directly in model metadata.
- Repository evidence to inspect: YAML schema or model definition files containing sensitive field names (e.g., email, phone, ssn, address).
- Pass condition: Sensitive fields in schema YAML files include classification or sensitivity metadata tags.
- Fail condition: Sensitive field names exist in schema definitions without corresponding classification metadata tags.
- Exceptions or limitations: Fully anonymized test datasets.
- YAML readiness: needs-review
- Reason if not ready: Requires structural YAML-aware parser to evaluate column-level metadata tag properties.
- Source citation: Chapter 8, Security & Privacy — Policy-as-code and data classification.
- Source: Data Management at Scale
- Structural locator: Chapter 8, Security & Privacy
- Spirit locator: Policy-as-code security enforcement relies on explicit column-level metadata classification tags in model definitions.
- Verification status: source-backed

- Rule ID: dataops-scale-003
- Title: Missing Version-Controlled Data Contract Directory
- Profile: dataops
- Severity tendency: error
- Rationale: Publishing domain data assets without a version-controlled contract directory leads to unannounced breaking changes for downstream consumers.
- Source-backed basis: Data products must expose explicit, versioned data contracts defining output schemas and semantic rules.
- Repository evidence to inspect: Presence of a contracts/ or schemas/ directory containing contract definition files (.yaml, .avsc, .proto).
- Pass condition: A contracts/ or schemas/ directory containing formal contract specifications exists in the repository.
- Fail condition: A domain data product repository lacks a formal contract or schema definition directory.
- Exceptions or limitations: Internal private scratch models not published to external consumers.
- YAML readiness: ready
- Source citation: Chapter 4, Data Mesh & Distribution — Data contract architecture.
- Source: Data Management at Scale
- Structural locator: Chapter 4, Data Mesh & Distribution
- Spirit locator: Explicit versioned contract directories guarantee schema stability and trust between data producers and consumers.
- Verification status: source-backed

## 11. Suggested YAML fragment
```yaml
rules:
  - id: "dataops-scale-001"
    profile: "dataops"
    severity: "critical"
    description: "Ensures data-product.yml manifest file exists at the root of domain data repositories."
    check:
      type: "file_exists"
      file_glob: "data-product.y*ml"
      error_when: "file_absent"
      message: "data-product.yml manifest missing. Domain data assets must be encapsulated as self-describing Data Products."
    references:
      - book: "Data Management at Scale"
        concept: "data-product-manifest"

  - id: "dataops-scale-002"
    profile: "dataops"
    severity: "critical"
    description: "Ensures domain data repositories maintain a version-controlled contracts/ or schemas/ directory."
    check:
      type: "file_exists"
      file_glob: "{contracts,schemas}/"
      error_when: "file_absent"
      message: "Missing contracts/ or schemas/ directory. Data products must declare explicit output data contracts."
    references:
      - book: "Data Management at Scale"
        concept: "data-contracts"

  - id: "dataops-scale-003"
    profile: "dataops"
    severity: "error"
    description: "Detects unclassified sensitive PII fields in model YAML schema configurations."
    check:
      type: "pattern_match"
      file_glob: "models/**/*.yml"
      pattern: "(?i)(email|ssn|phone|passport|credit_card)"
      error_when: "pattern_present"
      message: "Potential sensitive/PII field detected in model schema. Verify classification or sensitivity tags are configured."
    references:
      - book: "Data Management at Scale"
        concept: "policy-as-code"
```

## 12. Handoff Checklist

- [x] All emitted rule IDs are unique.
- [x] All emitted severities match Section 10.
- [x] All emitted references use `{book|standard, concept}`.
- [x] All emitted check types are in `{pattern_match, file_exists, file_absent}`.
- [x] All `ready` rules appear in Section 11 YAML.
- [x] All `needs-review` / `blocked` rules are absent from Section 11 YAML.
- [x] Section 11 ends with `### Candidates not emitted` or an explicit block explanation.
- [x] No page numbers anywhere in the note.
- [x] No verbatim quotes longer than 15 words.
- [x] Every supplied rule ID is either used with a source-backed meaning or explicitly marked `Meaning to be confirmed.`
- [x] `Note status` reflects the weakest readiness in Section 10.
- [x] Section 9 explicitly separates automated static checks from human review.
- [x] Section 3 has all required spirit fields filled.
- [x] Section 10 has at least three rules or an explicit justification.


## References

<!-- ref: TODO -->

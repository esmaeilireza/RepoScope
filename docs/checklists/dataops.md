# Dataops checklist

_Generated from `docs/specs/dataops.yaml` — do not edit by hand._

- [ ] **`dataops-sec-001`** — Hardcoded secret in pipeline code  
  _critical · profile: dataops_

- [ ] **`dataops-sec-002`** — Database password embedded in connection string  
  _critical · profile: dataops_

- [ ] **`dataops-infra-001`** — No Infrastructure-as-Code definition found  
  _warning · profile: dataops_

- [ ] **`dataops-dbt-001`** — Hardcoded relation reference in dbt model  
  _error · profile: dataops_

- [ ] **`dataops-dbt-002`** — Missing dbt_project.yml root manifest  
  _error · profile: dataops_

- [ ] **`dataops-dbt-003`** — Missing models directory in dbt project  
  _error · profile: dataops_

- [ ] **`dataops-dbt-004`** — Missing packages.yml for macros directory  
  _warning · profile: dataops_

- [ ] **`dataops-quality-001`** — No automated data quality tests detected  
  _error · profile: dataops_

- [ ] **`dataops-runbook-001`** — No data incident runbook found  
  _info · profile: dataops_

- [ ] **`dataops-atwal-002`** — No automated test suite found  
  _error · profile: dataops_

- [ ] **`dataops-fde-001`** — Pipeline orchestration not defined as code  
  _error · profile: dataops_

- [ ] **`dataops-atwal-003`** — Missing dependency lockfile  
  _warning · profile: dataops_

- [ ] **`dataops-kleppmann-002`** — No schema IDL for streaming events  
  _error · profile: dataops_

- [ ] **`dataops-kleppmann-003`** — No database migration tooling detected  
  _warning · profile: dataops_

- [ ] **`dataops-kimball-001`** — Fact model joins on natural key instead of surrogate key  
  _error · profile: dataops_

- [ ] **`dataops-kimball-002`** — SCD Type 2 dimension lacks effective-date tracking  
  _error · profile: dataops_

- [ ] **`dataops-kimball-003`** — Missing enterprise bus matrix document  
  _warning · profile: dataops_

- [ ] **`dataops-scale-001`** — Missing data product manifest  
  _error · profile: dataops_

- [ ] **`dataops-scale-003`** — No version-controlled data contracts found  
  _warning · profile: dataops_

- [ ] **`dataops-004`** — No data lineage manifest found  
  _warning · profile: dataops_

- [ ] **`dataops-005`** — No data catalog reference found  
  _warning · profile: dataops_

- [ ] **`dataops-006`** — PII columns not tagged in dataset schema  
  _error · profile: dataops_


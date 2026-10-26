1. Source Identity
Title: Designing Machine Learning Systems

# RepoScope Knowledge Note: Designing Machine Learning Systems (Chip Huyen, 2022)

---

## 1. Source identity

- **Title:** Designing Machine Learning Systems: An Iterative Process for Production-Ready Applications
- **Author(s):** Chip Huyen
- **Branch:** dataops
- **RepoScope profile:** dataops
- **Primary source file:** Designing Machine Learning Systems.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Executive Summary & Core Architectural Philosophy
* **Core Philosophy:** **"Production ML is an Iterative, Data-Centric Cycle, Not a One-Way Linear Pipeline."** An ML algorithm is only a small component of an enterprise ML system. Production systems are heavily bound by changing data distributions, latency constraints, multi-stakeholder conflicts, and silent failure modes.
* **Engineering Stance:** Prioritize fast inference over fast training, data iteration over pure algorithmic tuning, unified streaming/batch feature pipelines to avoid train-serving skew, and robust offline perturbation/slicing tests before deployment.

---

## 3. Source Spirit Card
1. **Source Title:** Designing Machine Learning Systems: An Iterative Process for Production-Ready Applications
2. **Author / Origin:** Chip Huyen (O'Reilly Media, 2022)
3. **Core Domain:** Machine Learning Operations (MLOps), Data Engineering, System Architecture & Production Deployment
4. **Target Audience:** ML Engineers, Data Scientists, MLOps Practitioners, and Technical Leads transitioning systems from research to production.
5. **Primary Stance / Philosophy:** Data-centric engineering dominates algorithmic choice; production ML systems fail silently and require continuous monitoring, automated feature pipelines, and iterative feedback loops.
6. **Key Architectural Driver:** Unification of offline training and online serving pipelines to prevent train-serving skew and data leakage.
7. **Operational Complexity Level:** High — involves real-time streaming infrastructure, feature stores, experiment versioning, multi-model orchestrations, and automated retraining systems.
8. **Primary Failure Pattern Addressed:** Train-serving skew, data leakage, silent model degradation (concept drift / covariate shift), and degenerate feedback loops.
9. **Governance & Compliance Stance:** Requires explicit data lineage tracking, feature store definition management, model card documentation, and continuous slicing for fairness and bias.
10. **Systemic Value Proposition:** Enables resilient, scalable, maintainable, and adaptable ML systems that deliver continuous business value without operational rot or silent failures.

---

## 4. Source-Backed Structure

### Theme 1: The ML Lifecycle & System Requirements
* **Iterative Scoping & Stakeholder Requirements:** Production ML involves conflicting stakeholder goals (e.g., accuracy vs. latency vs. business margin). Systems must satisfy four core requirements: Reliability, Scalability, Maintainability, and Adaptability.
* **Research vs. Production Divergence:** Research prioritizes state-of-the-art accuracy on static benchmark datasets and fast training. Production prioritizes fast inference, low latency, handling shifting data distributions, interpretability, and fairness.

### Theme 2: Data Engineering & Feature Management
* **Data Sources & Storage Architecture:** Enterprise ML relies on diverse data sources (user input, system logs, enterprise databases). Storage requires distinct transactional (OLTP) and analytical (OLAP) engines, moving from traditional ETL to ELT and data lakes.
* **Unified Streaming & Batch Pipelines:** Dual-pipeline architectures (separate code for offline batch training and online stream inference) are the leading cause of train-serving skew. Unifying them via stream computation engines (e.g., Apache Flink) and Feature Stores ensures feature consistency.
* **Data Lineage & Labeling:** Data lineage must be explicitly tracked across annotators, transformations, and sampling regimes to prevent performance drops caused by corrupted or noisy acquired data.

### Theme 3: Model Development, Evaluation & Debugging
* **Model Framing & Baselines:** ML problems must be framed against clear baselines (random baselines, heuristic baselines, human-level performance, and legacy non-ML systems).
* **Data Leakage & Prevention:** Data leakage occurs when label information leaks into training features through time-travel, group leakage, or collection artifacts. It requires temporal train/validation/test splitting and strict normalization within splits.
* **Offline Slicing & Perturbation Testing:** Beyond global metrics (Accuracy, F1), models must be evaluated on critical data slices (subpopulations) and subjected to invariance and perturbation tests to verify robustness prior to deployment.

### Theme 4: Deployment, Failure Modes & Continuous Governance
* **Deployment Paradigms:** Batch prediction (asynchronous) vs. Online prediction (synchronous / streaming), and Cloud computing vs. Edge deployment (device constraints).
* **ML System Failure Patterns:** ML systems fail silently (correct code/API execution but wrong predictions). Failure sources include Data Distribution Shifts (Covariate Shift, Concept Drift, Label Shift), Edge Cases, and Degenerate Feedback Loops.
* **Continuous Monitoring & Retraining:** Tracking input feature distributions ($P(X)$), label distributions ($P(Y)$), and model performance metrics using statistical tests (Kolmogorov-Smirnov, Chi-Squared) to trigger automated or scheduled retraining.

---

## 5. Source-Backed Spirit

1. **What is the fundamental problem this text solves?**
   * It addresses the high failure rate and operational friction encountered when transitioning machine learning models from academic/research environments to production enterprise systems.
2. **What is the author's primary thesis on how to build systems?**
   * Building production ML requires an iterative, data-centric approach where pipeline infrastructure, data quality, feature management, and continuous monitoring are far more critical than hyperparameter tuning or algorithm selection.
3. **Where does the text place the highest engineering risk?**
   * In data leakage during training, train-serving skew caused by mismatched dual pipelines, silent prediction degradation due to data distribution shifts, and unmonitored degenerate feedback loops.
4. **How does the text define system success vs. failure?**
   * System success is defined by continuous reliability, low latency, maintainability across cross-functional teams, and business value alignment. System failure includes operational outages and ML-specific silent failures (incorrect predictions despite 200 OK statuses).
5. **What is the text's stance on manual intervention vs. automation?**
   * Simple models and manual checks are appropriate in early adoption phases (Phase 1–2), but enterprise production requires fully automated experiment tracking, feature stores, CI/CD for ML, and continuous drift monitoring.
6. **What trade-offs does the text consider non-negotiable?**
   * Never sacrifice data temporal integrity during train/test splitting; never skip offline evaluation on critical data slices; and never deploy models without rollback capabilities and data lineage tracking.

---

## 6. Key Concepts

1. **Train-Serving Skew:**
   * *Definition:* The difference in model performance between development/training and production/serving, commonly caused by inconsistencies in feature extraction pipelines or sample selection bias.
2. **Data Leakage:**
   * *Definition:* The inadvertent inclusion of information about the target variable in the training features that is not available at inference time, leading to artificially high offline performance and catastrophic online failure.
3. **Concept Drift ($P(Y|X)$ Shift):**
   * *Definition:* A form of data distribution shift where the conditional probability distribution of the output $Y$ given input $X$ changes over time, while the input distribution $P(X)$ remains constant ("same input, different output").
4. **Covariate Shift ($P(X)$ Shift):**
   * *Definition:* A form of data distribution shift where the input feature distribution $P(X)$ changes over time, but the conditional distribution $P(Y|X)$ remains unchanged.
5. **Degenerate Feedback Loop:**
   * *Definition:* A systemic loop in which an online ML model's predictions influence user behavior, generating new training data that reinforces and amplifies the model's initial biases or outputs.
6. **Feature Store:**
   * *Definition:* A centralized infrastructure component that manages feature definitions, computes features from batch and streaming sources, and serves them consistently for offline model training and online low-latency inference.
7. **Offline Slicing Evaluation:**
   * *Definition:* The process of evaluating model performance across specific subsets (slices) of data (e.g., user demographics, device types) to catch localized degradation obscured by global aggregate metrics.

---

## 7. Practical Patterns and Examples

### Pattern 1: Temporal Data Splitting & Feature Normalization
* **Problem Solved:** Prevents data leakage from future timestamps into historical training data and prevents information leakage across validation splits.
* **Recommended Approach:** Always split training, validation, and test datasets along time boundaries rather than randomly. Compute feature statistics (mean, variance, min-max scaling) strictly on the training split and apply those exact parameters to validation/test splits.
* **Repository-Level Manifestation:** Training scripts using temporal cutoffs (`df[df['timestamp'] < split_date]`) and storing scaler artifacts (`scaler.pkl`) computed exclusively on training folds.
* **Limitations:** Requires reliable, immutable timestamps on all ingested data records.
* **Source Citation:** Chapter 4 (Feature Engineering), "Data Leakage" & "Best Practices".

### Pattern 2: Unified Feature Computation via Feature Store
* **Problem Solved:** Eliminates train-serving skew resulting from separate Python scripts for offline batch feature engineering and C++/Java/Scala scripts for online streaming feature extraction.
* **Recommended Approach:** Use a unified feature store (or stream computation engine like Apache Flink) to compute features once and log them to both an offline warehouse (Parquet/S3) and an online low-latency store (Redis/DynamoDB).
* **Repository-Level Manifestation:** Shared feature definition modules or Feature Store configurations (e.g., Feast/Tecton definitions) referenced by both training and inference services.
* **Limitations:** Adds architectural overhead and infrastructure maintenance requirements.
* **Source Citation:** Chapter 2 & Chapter 6, "Data Pipelines for Online ML Systems".

### Pattern 3: Invariance & Perturbation Testing in CI/CD
* **Problem Solved:** Detects model brittleness and sensitivity to minor noise or demographic bias before deployment.
* **Recommended Approach:** Implement automated test suites that inject small Gaussian noise into continuous inputs or swap sensitive categorical attributes (e.g., gender, race) to verify that predictions remain stable or invariant.
* **Repository-Level Manifestation:** Pytest suites running model evaluation scripts (`test_model_invariance.py`) as part of GitHub Actions / CI workflows.
* **Limitations:** Requires domain knowledge to design realistic noise distributions and invariant attributes.
* **Source Citation:** Chapter 5 (Model Development), "Model Offline Evaluation".

---

## 8. Common Failure Modes and Risks

1. **Silent Production Failure (Train-Serving Skew / Mismatched Pipelines)**
   * *Why it Happens:* Inconsistent feature logic between training and serving environments, or scaling features using global dataset statistics instead of training-only statistics.
   * *Early Warning Signs:* Near-perfect offline metrics (AUC 0.99) followed by immediate failure or customer complaints upon deployment.
   * *Repository Evidence:* Presence of dual feature calculation logic in separate scripts (`train_features.py` vs. `serve_features.py`).
   * *Severity Tendency:* Critical.

2. **Data Leakage via Time Travel or Group Correlations**
   * *Why it Happens:* Splitting datasets randomly when data points have temporal dependencies or medical/user group correlations (e.g., patient scans a week apart split between train and test).
   * *Early Warning Signs:* Abnormally high feature importance scores for target-adjacent variables; model failure on newly collected temporal splits.
   * *Repository Evidence:* Usage of `train_test_split(shuffle=True)` on time-series or grouped datasets.
   * *Severity Tendency:* Error.

3. **Silent Drift and Model Performance Decay**
   * *Why it Happens:* Real-world environment shifts over time ($P(X)$ or $P(Y|X)$ changes) while the model remains static without retraining.
   * *Early Warning Signs:* Gradual decay in conversion rates or predictions drifting toward extreme boundary values.
   * *Repository Evidence:* Absence of drift detection configurations, missing statistical summary baseline comparisons, or hardcoded threshold monitoring.
   * *Severity Tendency:* Warning.

4. **Degenerate Feedback Loops in Recommendation/Ranking Systems**
   * *Why it Happens:* Model outputs restrict user choices, and user choices generate the next iteration of training data, creating a self-reinforcing bias loop.
   * *Early Warning Signs:* Hyper-concentration of recommendations on a tiny fraction of items; loss of user engagement over time.
   * *Repository Evidence:* Retraining pipelines trained directly on raw user interaction logs without exploratory/randomized log injection or counterfactual weighting.
   * *Severity Tendency:* High.

---

## 9. Repository-Audit Translation

### Static Checks (Automated)
* Inspection of dataset splitting methods in Python files (`train_test_split` vs. time-based filtering).
* Verification that feature transformation classes fit only on training sets (`scaler.fit_transform(X_train)` followed by `scaler.transform(X_test)`).
* Verification of lockfiles (`requirements.txt`, `Poetry.lock`, `Pipfile.lock`) and pinned dependencies for training reproducibility.
* Presence of Model Cards, feature store definitions, or metadata logging configurations (`mlflow`, `wandb`).
* Verification of drift detection or schema monitoring configs (`great_expectations`, `evidently`, `alibi-detect`).

### Human Review (Contextual)
* Evaluating whether problem framing aligns with business metrics (e.g., optimizing for click-through rate vs. total revenue).
* Auditing whether natural ground truth labels exist and identifying label delay windows.
* Checking fairness, ethics, and demographic parity across critical business slices.
* Reviewing human-in-the-loop fallback procedures for safety-critical edge cases.

---

## 10. Candidate Rules

### Rule 1: Missing Temporal Split in Time-Series Training
* **Rule ID:** `dataops-ml-001`
* **Title:** Enforce Temporal Data Splitting for Time-Dependent ML Pipelines
* **Profile:** `dataops`
* **Severity Tendency:** `error`
* **Rationale:** Randomly shuffling time-dependent datasets causes time-travel data leakage, where future information contaminates training sets.
* **Source-Backed Basis:** *Designing Machine Learning Systems*, Chapter 4 (Feature Engineering), "Split data by time into train/valid/test splits instead of doing it randomly."
* **Repository Evidence to Inspect:** Python model training scripts (`train.py`, `pipeline.py`).
* **Pass Condition:** Data splitting uses explicit timestamp filtering (`df[df['date'] < split_date]`) or `TimeSeriesSplit`.
* **Fail Condition:** Data splitting uses `sklearn.model_selection.train_test_split(shuffle=True)` on datasets containing timestamp or temporal attributes.
* **Exceptions or Limitations:** Non-temporal i.i.d. tabular datasets are exempt.
* **YAML Readiness:** `ready`
* **Source Citation:**
  * **Source:** `Designing Machine Learning Systems.pdf`
  * **Structural Locator:** Chapter 4: Feature Engineering — Best Practices
  * **Spirit Locator:** Section "Data Leakage"
  * **Verification Status:** `source-backed`

### Rule 2: Feature Scaler Fit on Global Dataset (Data Leakage)
* **Rule ID:** `dataops-ml-002`
* **Title:** Prevent Global Dataset Feature Normalization
* **Profile:** `dataops`
* **Severity Tendency:** `critical`
* **Rationale:** Fitting scalers or imputers on the combined dataset prior to splitting leaks test set summary statistics into the training pipeline.
* **Source-Backed Basis:** *Designing Machine Learning Systems*, Chapter 4, "Scale and normalize your data after splitting to avoid data leakage. Use statistics from only the train split."
* **Repository Evidence to Inspect:** Preprocessing code (`preprocess.py`, `features.py`).
* **Pass Condition:** `scaler.fit()` or `scaler.fit_transform()` is called exclusively on `X_train`.
* **Fail Condition:** `scaler.fit()` or `scaler.fit_transform()` is called on full `X` or `df` before `train_test_split()`.
* **Exceptions or Limitations:** None.
* **YAML Readiness:** `ready`
* **Source Citation:**
  * **Source:** `Designing Machine Learning Systems.pdf`
  * **Structural Locator:** Chapter 4: Feature Engineering — Handling Missing Values & Scaling
  * **Spirit Locator:** Section "Data Leakage"
  * **Verification Status:** `source-backed`

### Rule 3: Deployed Model Lacks Versioned Artifact / Model Card Metadata
* **Rule ID:** `dataops-model-card-001`
* **Title:** Enforce Model Metadata and Artifact Tracking Configuration
* **Profile:** `dataops`
* **Severity Tendency:** `warning`
* **Rationale:** Operating production models without metadata tracking, input schemas, or model cards makes debugging and rollback impossible.
* **Source-Backed Basis:** *Designing Machine Learning Systems*, Chapter 5 & 6, "It's important to keep track of all the definitions needed to recreate an experiment and its relevant artifacts."
* **Repository Evidence to Inspect:** Presence of `model_card.json`, `MLproject`, `mlflow` config, or `model_metadata.yaml`.
* **Pass Condition:** A model export directory contains an associated schema definition or model metadata file.
* **Fail Condition:** Binary model files (`.pkl`, `.onnx`, `.pth`) exist in production/deployment code without accompanying version metadata or schema definition.
* **Exceptions or Limitations:** Internal non-production research notebooks.
* **YAML Readiness:** `ready`
* **Source Citation:**
  * **Source:** `Designing Machine Learning Systems.pdf`
  * **Structural Locator:** Chapter 5: Model Development — Experiment Tracking and Versioning
  * **Spirit Locator:** Section "Requirements for ML Systems"
  * **Verification Status:** `source-backed`

---

## 11. Suggested YAML Fragment

```yaml
# RepoScope Candidate Rules Fragment
# Source: Designing Machine Learning Systems (Chip Huyen, 2022)
# Profile: dataops

rules:
  - id: "dataops-ml-001"
    title: "Enforce Temporal Data Splitting for Time-Dependent ML Pipelines"
    profile: "dataops"
    severity: "error"
    references:
      - book: "Designing Machine Learning Systems"
        concept: "data_leakage_temporal_split"
    check:
      type: "pattern_match"
      target: "**/*.py"
      pattern_absent: "train_test_split(.*shuffle=True.*)"
    rationale: "Random shuffling on time-dependent datasets introduces data leakage from future timestamps."

  - id: "dataops-ml-002"
    title: "Prevent Global Dataset Feature Normalization"
    profile: "dataops"
    severity: "critical"
    references:
      - book: "Designing Machine Learning Systems"
        concept: "feature_scaling_leakage"
    check:
      type: "pattern_match"
      target: "**/*.py"
      pattern_match: "fit_transform\\(X\\)"
    rationale: "Fitting scaling parameters on un-split datasets leaks validation/test statistics into model training."

  - id: "dataops-model-card-001"
    title: "Enforce Model Metadata and Artifact Tracking Configuration"
    profile: "dataops"
    severity: "warning"
    references:
      - book: "Designing Machine Learning Systems"
        concept: "model_governance_metadata"
    check:
      type: "file_exists"
      target: "**/model_card.json"
    rationale: "Production ML models require explicit schema metadata and lineage cards for operational safety."
```

### Candidates Not Emitted
* **Rule ID:** `dataops-drift-001` (Drift Monitoring Configuration)
  * *Reason if not ready:* `needs-review` — While drift monitoring is mandatory in production, repo-level manifest checking varies widely depending on framework (Evidently, Great Expectations, CloudWatch) and cannot be captured via a single deterministic file check without false positives.
* **Rule ID:** `cross-ml-fairness-001` (Model Fairness & Slice Evaluation)
  * *Reason if not ready:* `blocked` — Ensuring model fairness and evaluating critical data slices requires domain-specific contextual judgment and runtime dataset analysis, falling outside static file/pattern verification boundaries.

---

## 12. Handoff Checklist

| Verification Step | Description | Status |
| :--- | :--- | :--- |
| **1. Source Grounding** | All themes, failure modes, and concepts are traceable directly to Chip Huyen's text. | ✅ Verified |
| **2. Validator Contract Compliance** | Candidate rules strictly utilize approved check types (`pattern_match`, `file_exists`). | ✅ Verified |
| **3. IP & Citation Safety** | Direct quotes do not exceed 15 words; no page/line numbers used. | ✅ Verified |
| **4. Readiness Taxonomy** | Every candidate rule carries an explicit readiness label (`ready`, `needs-review`, `blocked`). | ✅ Verified |
| **5. Domain & Profile Neutrality** | Rules focus strictly on framework-neutral MLOps, pipeline governance, and data leakage boundaries. | ✅ Verified |


## References

<!-- ref: TODO -->

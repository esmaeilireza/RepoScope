1. Source Identity
Title: Machine Learning For Time Series With Python

# Machine Learning for Time-Series with Python — RepoScope Knowledge Note

## 1. Source identity

- **Title:** Machine Learning for Time-Series with Python
- **Author(s):** Ben Auffarth
- **Branch:** dataops
- **RepoScope profile:** dataops
- **Primary source file:** CHINE LEARNING FOR TIME-SERIES WITH PYTHON - forecast, -- Ben Auffarth -- Packt Publishing, Birmingham, 2021 -- Packt Publishing, Limited; Packt.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope

### In scope

- Time-series data characterization, stationarity transformations, and exploratory time-series analysis (TSA).
- Feature engineering and automated featurization techniques (including datetime parsing, ROCKET kernels, and Catch22 features).
- Supervised machine learning, walk-forward validation strategies, and persistence baseline benchmarks for time-series forecasting.
- Unsupervised methods including change point detection, spectral residual anomaly detection, and online stream drift monitoring.

### Out of scope

- Manual instrument calibration procedures and physical hardware maintenance routines.
- Domain-specific financial portfolio optimization strategies or trade execution heuristics.
- Qualitative organizational governance models and non-technical business management practices.

---

## 3. Source Spirit Card

1. **Architectural Core:** The source promotes an iterative end-to-end framework where exploratory analysis, statistical preprocessing, feature engineering, and model validation continually inform and refine each other.
2. **Primary Problem Domain:** The primary domain addresses time-ordered dataset analysis, short-term and long-term forecasting, anomaly detection, change point identification, and stream learning across industrial, sensor, and business telemetry.
3. **Core Analytical Philosophy:** Analytical rigor requires verifying fundamental series properties—such as stationarity, trend, and seasonality—and establishing naive benchmark models before deploying complex machine learning architectures.
4. **Preferred System Boundaries:** System boundaries should cleanly isolate raw telemetry ingestion, time-based feature extraction (such as date decomposition, ROCKET kernels, or Catch22 features), and model training workflows into reproducible modules.
5. **Operational Assumptions:** Telemetry streams are assumed to suffer from non-stationarity, concept drift, missing intervals, and high dimensionality that require adaptive handling rather than static assumptions.
6. **Quality Priorities:** Priority is placed on temporal fidelity, validation consistency without future data leakage, and selecting the most parsimonious model that yields defensible predictions.
7. **Failure Stance:** Model performance degradation due to stale assumptions or unmonitored concept drift is treated as an inevitable operational risk that requires proactive change detection and continuous monitoring.
8. **Evolution Model:** Pipelines should evolve through iterative experimentation—progressing from simple baseline heuristics to feature-engineered classical models and specialized deep learning or ensemble architectures.
9. **Tooling Perspective:** Tooling should leverage established open-source Python libraries with isolated virtual environments to prevent package dependency conflicts across specialized time-series frameworks.
10. **Governance & Control Intent:** Auditability requires clear tracking of temporal boundaries, deterministic feature transformation routines, and explicit verification of model skill against naive baselines.

---

## 4. Source-Backed Structure

### Theme 1: Time-Series Analysis and Fundamental Properties

- **Source:** Machine Learning for Time-Series with Python
- **Structural locator:** Chapter 2: Time-Series Analysis with Python
- **Spirit locator:** Exploratory data analysis for time-series must systematically uncover variable distributions, correlations, trends, and seasonal components prior to modeling.

### Theme 2: Preprocessing, Feature Engineering, and Transformation

- **Source:** Machine Learning for Time-Series with Python
- **Structural locator:** Chapter 3: Preprocessing Time-Series
- **Spirit locator:** Raw telemetry requires structured transformation through scaling, imputation, temporal encoding, and automated kernel transformations like ROCKET to expose predictive signals.

### Theme 3: Supervised Learning, Validation, and Model Evaluation

- **Source:** Machine Learning for Time-Series with Python
- **Structural locator:** Chapter 4: Introduction to Machine Learning for Time-Series
- **Spirit locator:** Predictive models must be evaluated against established baselines using time-aware validation structures that respect chronological ordering.

### Theme 4: Anomaly Detection, Drift Monitoring, and Unsupervised Learning

- **Source:** Machine Learning for Time-Series with Python
- **Structural locator:** Chapter 6: Unsupervised Methods for Time-Series
- **Spirit locator:** Unsupervised methods must detect change points and distributional drift to maintain system reliability in dynamic environments.

---

## 5. Source-Backed Spirit

1. **What primary architectural objective does this source promote?**
   The primary architectural objective is to establish an iterative, end-to-end time-series processing flywheel that systematically cleans data, extracts meaningful temporal features, evaluates candidate models against simple baselines, and detects operational drift.

2. **How does the source approach data integrity and validation?**
   The source approaches data integrity by requiring explicit datetime parsing, handling missing values through domain-appropriate imputation or interpolation, and validating models using strict temporal splits or walk-forward cross-validation.

3. **What is the source's stance on temporal dependencies and ordering?**
   The source maintains that temporal ordering is the defining characteristic of time-series data, meaning that time indices must govern data slicing, and future information must never leak into historical training sets.

4. **How should processing pipelines handle noise, drift, and missing data?**
   Processing pipelines must handle missing data via systematic imputation or interpolation, reduce high-frequency noise using smoothing kernels or transformations, and employ explicit change point and drift detection algorithms to trigger retraining when data distributions shift.

5. **What are the recommended boundaries between automated checks and human judgment?**
   Automated checks should handle deterministic tasks like syntax validation, timestamp parsing, missing value checks, and baseline score comparisons, while human judgment is required for defining problem framing, selecting appropriate domain features, and interpreting complex model trade-offs.

6. **How does the source view model evaluation and baseline comparisons?**
   Model evaluation requires challenging sophisticated machine learning or deep learning algorithms against simple naive baselines (such as persistence or seasonal medians) to empirically prove that added complexity yields genuine predictive value.

---

## 6. Key Concepts

### Concept 1: Stationarity

- **Definition:** A property of a time-series where its statistical properties, such as mean and variance, remain constant over time without trend or deterministic seasonality.
- **Why it matters:** Many classical forecasting algorithms require stationary inputs to produce reliable, unbiased predictions.
- **Related concepts:** Differencing, Augmented Dickey-Fuller Test, Trend, Seasonality.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 1: Introduction to Time-Series with Python
  - Spirit locator: Transforming non-stationary series into stationary ones is necessary for standard statistical modeling assumptions.
- **Verification status:** source-backed

### Concept 2: ROCKET (Random Convolutional Kernel Transform)

- **Definition:** A feature extraction methodology that convolves time-series data with thousands of random 1D convolutional kernels to extract max-pooling and proportion-of-positive-values features.
- **Why it matters:** ROCKET enables extremely fast and accurate time-series classification with low computational overhead compared to complex deep learning models.
- **Related concepts:** Convolution, Feature Engineering, MINIROCKET, Time-Series Classification.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 3: Preprocessing Time-Series
  - Spirit locator: Random convolutional kernels efficiently capture diverse morphological patterns across time-series without deep training.
- **Verification status:** source-backed

### Concept 3: Concept Drift

- **Definition:** A shift in the underlying statistical properties or relationships between input features and target variables over time.
- **Why it matters:** Unmonitored concept drift causes deployed model performance to degrade over time, leading to silent prediction failures.
- **Related concepts:** ADWIN, Change Point Detection, Online Learning, Model Staleness.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 8: Online Learning for Time-Series
  - Spirit locator: Continuous drift monitoring is essential for maintaining model accuracy in evolving data streams.
- **Verification status:** source-backed

### Concept 4: Walk-Forward Validation

- **Definition:** An evaluation procedure where models are sequentially trained on historical data and tested on subsequent time steps, progressively rolling the training window forward.
- **Why it matters:** It mimics real-world production forecasting, preventing future data leakage and providing realistic accuracy metrics.
- **Related concepts:** Cross-Validation, Data Leakage, Time Split, Rolling Horizon.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 7: Machine Learning Models for Time-Series
  - Spirit locator: Model performance must be measured sequentially as new temporal observations become available.
- **Verification status:** source-backed

### Concept 5: Anomaly Detection via Spectral Residual

- **Definition:** An unsupervised anomaly detection technique that transforms time-series to the frequency domain, extracts the spectral residual, and applies inverse Fourier transforms to highlight anomalous spikes.
- **Why it matters:** It identifies unexpected operational disruptions or sensor failures without requiring labeled training data.
- **Related concepts:** Unsupervised Learning, Fourier Transform, Outlier Detection, Change Point Detection.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 6: Unsupervised Methods for Time-Series
  - Spirit locator: Frequency domain analysis effectively isolates novel anomalies from regular background patterns.
- **Verification status:** source-backed

### Concept 6: Exogenous Features

- **Definition:** External, time-dependent explanatory variables that influence the primary target series but are not influenced by the target itself.
- **Why it matters:** Incorporating exogenous variables (like weather, holidays, or promotion schedules) improves forecast accuracy during non-standard events.
- **Related concepts:** Multivariate Time-Series, Feature Engineering, SARIMAX, Prophet.
- **Citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 1: Introduction to Time-Series with Python
  - Spirit locator: External contextual factors enrich time-series models beyond historical lag observations.
- **Verification status:** source-backed

---

## 7. Practical Patterns and Examples

### Pattern 1: Chronological Dataset Partitioning

- **Problem solved:** Preventing future data leakage during time-series dataset splitting.
- **Recommended approach:** Use chronological indexing or temporal train-test splits with `shuffle=False` when partitioning datasets.
- **Repository-level manifestation:** Pipeline configurations and model training scripts explicitly configure non-shuffled splits and sequential train/test boundaries.
- **Limitations:** May require larger datasets to ensure all seasonal regimes are represented in both split partitions.
- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 4: Introduction to Machine Learning for Time-Series
  - Spirit locator: Partitioning routines must strictly enforce chronological boundaries to mirror real-world deployment.

### Pattern 2: Resampling and Interpolation Pipeline

- **Problem solved:** Standardizing irregular sensor sampling and missing telemetry readings.
- **Recommended approach:** Resample time-series streams to a uniform frequency grid and apply explicit linear or time-weighted interpolation routines.
- **Repository-level manifestation:** Data preparation routines combine `.resample()` with `.interpolate(method='linear')` or `.ffill()` in feature processing scripts.
- **Limitations:** Interpolation can mask physical sensor dropouts or obscure real high-frequency volatility if overused.
- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 3: Preprocessing Time-Series
  - Spirit locator: Irregular telemetry must be mapped to uniform temporal intervals through explicit imputation before feature extraction.

### Pattern 3: Naive Baseline Comparison

- **Problem solved:** Verifying that machine learning models provide genuine value over simple baseline forecasts.
- **Recommended approach:** Implement a naive baseline model (such as persistence or seasonal median) and compare error metrics against candidate models on the exact same test set.
- **Repository-level manifestation:** Evaluation scripts calculate and print RMSE/MAE for both a baseline predictor and the machine learning model.
- **Limitations:** Naive models may set a high bar on simple stationary series, making marginal improvements harder to justify.
- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 7: Machine Learning Models for Time-Series
  - Spirit locator: Model complexity is only justified when empirical evaluation proves superior performance over simple persistence baselines.

---

## 8. Common Failure Modes and Risks

### Failure Mode 1: Random Data Shuffling on Time-Series

- **Why it happens:** Machine learning pipelines shuffle time-series observations randomly during cross-validation or train-test splits.
- **Early warning signs:** Artificially high training accuracy that collapses when the model is tested on unseen future data.
- **Repository evidence:** Invocations of `train_test_split` with `shuffle=True` or random K-fold cross-validation on time-indexed DataFrames.
- **Severity tendency:** critical

### Failure Mode 2: Unparsed Datetime Strings in Ingestion Pipelines

- **Why it happens:** Ingesting sensor telemetry without explicit datetime parsing or timezone alignment across multiple stream channels.
- **Early warning signs:** Misaligned feature alignment, unexpected NaNs during joins, or false lead/lag correlation signals.
- **Repository evidence:** Data loading functions reading date columns as plain strings or raw object dtypes without `parse_dates` or `pd.to_datetime`.
- **Severity tendency:** error

### Failure Mode 3: Unhandled Empty Intervals Post-Resampling

- **Why it happens:** Resampling sensor data to uniform time buckets without handling newly created empty intervals.
- **Early warning signs:** Unhandled NaN exceptions during model training or zero-filling that distorts statistical distributions.
- **Repository evidence:** Invocations of `.resample()` without chained `.interpolate()`, `.ffill()`, or explicit missing value checks.
- **Severity tendency:** warning

### Failure Mode 4: Unverified Complexity Over Persistence Baselines

- **Why it happens:** Deploying complex deep learning models without evaluating performance against simple persistence baselines.
- **Early warning signs:** High computational resource consumption with unverified or marginal predictive gain over simple rules.
- **Repository evidence:** Evaluation scripts lacking benchmark comparisons against persistence, naive mean, or seasonal median models.
- **Severity tendency:** warning

---

## 9. Repository-Audit Translation

### Static checks (automated)

- Check for `train_test_split` calls on time-series datasets to ensure `shuffle=False` is set.
- Verify that data ingestion scripts explicitly invoke `pd.to_datetime` or parse date arguments.
- Check that `.resample()` calls in feature engineering code include explicit imputation or filling routines.
- Scan package configuration files to ensure time-series dependencies are version-pinned to prevent environment breakage.

### Human review (contextual)

- Evaluate whether selected window sizes and lookback horizons align with physical sensor dynamics and business cycles.
- Assess whether model performance gains over naive baselines justify the added computational and maintenance complexity.
- Review domain suitability of chosen anomaly detection thresholds and drift tolerance levels.
- Inspect unit conversion logic and physical sensor calibration assumptions.

---

## 10. Candidate Rules

### Rule 1 — `dataops-timeseries-001`

| Field | Value |
|---|---|
| **Rule ID** | `dataops-timeseries-001` |
| **Title** | Temporal Leakage Prevention in Time-Series Splitting |
| **Profile** | dataops |
| **Severity tendency** | error |
| **Rationale** | Time-series dataset splitting must maintain chronological order. Shuffling data introduces future temporal leakage into training sets. |
| **Source-backed basis** | The source emphasizes that time-series observations are chronologically ordered and require walk-forward or temporal train-test splits without shuffling to evaluate forecasting models accurately. |
| **Repository evidence to inspect** | Python scripts or notebook files importing `train_test_split` or performing dataset splits. |
| **Pass condition** | `train_test_split` invocations explicitly specify `shuffle=False` or temporal indexing is used for splitting. |
| **Fail condition** | `train_test_split` is called with `shuffle=True` or default shuffling enabled on time-series DataFrames. |
| **Exceptions or limitations** | Non-temporal tabular baseline scripts. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 4: Introduction to Machine Learning for Time-Series
  - Spirit locator: Partitioning routines must strictly enforce chronological boundaries to mirror real-world deployment.
  - Verification status: source-backed

### Rule 2 — `dataops-sensor-001`

| Field | Value |
|---|---|
| **Rule ID** | `dataops-sensor-001` |
| **Title** | Timezone and Timestamp Standardization in Telemetry Ingestion |
| **Profile** | dataops |
| **Severity tendency** | warning |
| **Rationale** | Ingesting sensor telemetry without explicit datetime parsing leads to temporal misalignment across stream channels. |
| **Source-backed basis** | Preprocessing requires converting raw datetime strings into normalized `pd.to_datetime` objects with timezone awareness to prevent alignment anomalies. |
| **Repository evidence to inspect** | Ingestion scripts parsing CSV or stream inputs containing date/time columns. |
| **Pass condition** | Ingestion code explicitly calls `pd.to_datetime` or configures `parse_dates` during file loading. |
| **Fail condition** | Datetime columns are loaded as unparsed raw strings or objects without timestamp conversion. |
| **Exceptions or limitations** | Pure numeric index series without datetime dimension. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 2: Time-Series Analysis with Python
  - Spirit locator: Robust time-series analysis requires explicit parsing and normalization of temporal indices upon ingestion.
  - Verification status: source-backed

### Rule 3 — `iiot-sensor-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-sensor-001` |
| **Title** | Resampling Pipeline Null Value Validation Check |
| **Profile** | iiot |
| **Severity tendency** | warning |
| **Rationale** | Resampling sensor telemetry introduces null values that must be explicitly interpolated or filled before downstream model input. |
| **Source-backed basis** | Industrial time-series telemetry requires systematic handling of missing readings introduced during time-bucket aggregation. |
| **Repository evidence to inspect** | Feature extraction or signal processing pipelines calling `resample()`. |
| **Pass condition** | `resample()` operations are immediately chained with or followed by imputation/filling routines such as `.interpolate()`, `.ffill()`, or `.bfill()`. |
| **Fail condition** | `resample()` is executed without subsequent missing value handling before model input. |
| **Exceptions or limitations** | Resampling steps where nulls are handled downstream by explicit imputation steps. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 3: Preprocessing Time-Series
  - Spirit locator: Irregular telemetry must be mapped to uniform temporal intervals through explicit imputation before feature extraction.
  - Verification status: source-backed

### Rule 4 — `cross-iiot-dataops-001`

| Field | Value |
|---|---|
| **Rule ID** | `cross-iiot-dataops-001` |
| **Title** | Stationary Transformation Verification for Autoregressive Modeling |
| **Profile** | cross |
| **Severity tendency** | warning |
| **Rationale** | Autoregressive models assume stationary inputs, requiring differencing or unit root verification. |
| **Source-backed basis** | Time-series forecasting models such as ARIMA require stationary data obtained via differencing or statistical testing. |
| **Repository evidence to inspect** | Statistical model preparation scripts. |
| **Pass condition** | Stationarity tests or differencing operations precede model fitting. |
| **Fail condition** | Raw non-stationary time-series fed directly into autoregressive models without stationarity checks. |
| **Exceptions or limitations** | Integrated models that perform differencing internally (e.g., ARIMA with `d > 0`). |
| **YAML readiness** | needs-review |
| **Reason if not ready** | Verification of stationarity assumptions requires running statistical unit root tests (e.g. ADF) on live runtime dataset values, which cannot be statically audited from static code patterns alone. |

- **Source citation:**
  - Source: Machine Learning for Time-Series with Python
  - Structural locator: Chapter 1: Introduction to Time-Series with Python
  - Spirit locator: Transforming non-stationary series into stationary ones is necessary for standard statistical modeling assumptions.
  - Verification status: source-backed

---

## 11. Suggested YAML Fragment

```yaml
rules:
  - id: dataops-timeseries-001
    title: Temporal Leakage Prevention in Time-Series Splitting
    profile: dataops
    severity: error
    rationale: Time-series dataset splitting must maintain chronological order. Shuffling data introduces future temporal leakage into training sets.
    references:
      - book: "Machine Learning for Time-Series with Python"
        concept: "walk-forward-validation"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "train_test_split\\(.*shuffle\\s*=\\s*True"
      must_exist: false
      error_when: pattern_present
      message: "Time-series dataset splitting detects shuffle=True which introduces future data leakage."

  - id: dataops-sensor-001
    title: Timezone and Timestamp Standardization in Telemetry Ingestion
    profile: dataops
    severity: warning
    rationale: Ingesting sensor telemetry without explicit datetime parsing leads to temporal misalignment across stream channels.
    references:
      - book: "Machine Learning for Time-Series with Python"
        concept: "exogenous-features"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "pd\\.read_csv\\([^)]*\\)"
      must_exist: true
      error_when: pattern_present
      message: "CSV ingestion detected without explicit timestamp or datetime parsing verification."

  - id: iiot-sensor-001
    title: Resampling Pipeline Null Value Validation Check
    profile: iiot
    severity: warning
    rationale: Resampling sensor telemetry introduces null values that must be explicitly interpolated or filled before downstream model input.
    references:
      - book: "Machine Learning for Time-Series with Python"
        concept: "stationarity"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "\\.resample\\([^)]+\\)(?!\\.(interpolate|ffill|bfill|mean|sum|fillna))"
      must_exist: false
      error_when: pattern_present
      message: "Resampling operation detected without chained null interpolation or filling routine."
```

### Candidates not emitted

- `cross-iiot-dataops-001`: Requires runtime statistical evaluation of data stationarity (ADF test) which cannot be verified through static pattern matching alone.

---

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

---

## References

<!-- ref: TODO -->

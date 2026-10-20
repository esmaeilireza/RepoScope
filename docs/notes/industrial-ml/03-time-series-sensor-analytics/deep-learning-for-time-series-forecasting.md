# Deep Learning for Time Series Forecasting — RepoScope Knowledge Note

## 1. Source Identity

| Field | Value |
|---|---|
| **Title** | Deep Learning for Time Series Forecasting |
| **Author(s)** | Jason Brownlee |
| **Branch** | dataops |
| **RepoScope profile** | dataops |
| **Primary source file** | `Deep Learning for Time Series Forecasting- Predict the -- Jason Brownlee -- Machine Learning Mastery, 2019` |
| **Note status** | reviewed-with-candidate-rules |

---

## 2. Scope

### In scope

- Problem taxonomy and supervised learning framing for time-series forecasting (univariate, multivariate, multi-step, and multi-output).
- Data preparation and 3D tensor reshaping (`[samples, timesteps, features]`) for Multilayer Perceptrons (MLPs), 1D Convolutional Neural Networks (CNNs), and Long Short-Term Memory (LSTM) networks.
- Hybrid neural network architectures including CNN-LSTM and ConvLSTM models for automatic feature extraction and sequence modeling.
- Systematic model evaluation frameworks using walk-forward validation and empirical benchmarking against naive and classical baselines (persistence, ETS, SARIMA).

### Out of scope

- Hardware-level sensor firmware development and real-time embedded driver programming.
- Qualitatively driven qualitative economic policy modeling without quantitative telemetry.
- Non-sequential image classification, standard computer vision object detection, or general natural language translation without temporal dimensions.

---

## 3. Source Spirit Card

1. **Architectural Core:** The source promotes an automated, systematic experimental framework that reframes temporal sequence data into supervised learning datasets for deep neural network modeling.
2. **Primary Problem Domain:** The primary problem domain spans univariate, multivariate, multi-step, and parallel time-series forecasting, as well as complex sequence classification tasks like human activity recognition.
3. **Core Analytical Philosophy:** Analytical progress relies on rigorous empirical validation, where complex deep learning models must continuously clear performance bars established by simple naive and classical statistical baselines.
4. **Preferred System Boundaries:** System boundaries explicitly separate raw telemetry loading, supervised sliding-window transformations, 3D tensor reshaping, model construction, and walk-forward evaluation harnesses into distinct, reusable functional blocks.
5. **Operational Assumptions:** Time-series telemetry possesses non-linear, temporal, and multi-variate dependencies that neural networks can learn automatically without requiring handcrafted feature engineering or prior stationarity transformations.
6. **Quality Priorities:** High priority is placed on temporal fidelity, strict prevention of future data leakage during evaluation, and reproducible walk-forward error estimation.
7. **Failure Stance:** Deploying complex deep neural networks without verifying superiority over simple naive baselines or classical linear algorithms is treated as an invalid modeling decision.
8. **Evolution Model:** Modeling pipelines evolve systematically—starting with naive persistence baselines, moving to linear and classical models, and progressing to MLPs, CNNs, LSTMs, and hybrid architectures.
9. **Tooling Perspective:** Tooling centers on standard Python open-source data science libraries (NumPy, Pandas, Scikit-Learn) and high-level deep learning abstractions (Keras/TensorFlow) configured via command-line execution.
10. **Governance & Control Intent:** Control relies on isolated, repeatable test harnesses, fixed temporal train/test split boundaries, and multi-run repeated evaluation to account for stochastic neural network optimization.

---

## 4. Source-Backed Structure

### Theme 1: Problem Definition and Structured Taxonomy

- **Source:** Deep Learning for Time Series Forecasting
- **Structural locator:** Chapter 2: Framework for Time Series Forecasting
- **Spirit locator:** Time-series forecasting problems must be systematically categorized across key structural dimensions—such as inputs/outputs, endogenous/exogenous variables, and single-step/multi-step horizons—prior to model selection.

### Theme 2: Supervised Learning Framing and 3D Input Data Preparation

- **Source:** Deep Learning for Time Series Forecasting
- **Structural locator:** Chapter 6: How to Prepare Time Series Data for CNNs and LSTMs
- **Spirit locator:** Raw sequence observations must be transformed into sliding-window supervised samples and reshaped into 3D tensors (`[samples, timesteps, features]`) required by convolutional and recurrent layers.

### Theme 3: Deep Learning Architectures (MLP, CNN, LSTM, Hybrid CNN-LSTM)

- **Source:** Deep Learning for Time Series Forecasting
- **Structural locator:** Chapter 14: How to Develop MLPs, CNNs and LSTMs for Univariate Forecasting
- **Spirit locator:** Neural network architectures (MLPs, 1D CNNs, LSTMs, and hybrid CNN-LSTMs) extract temporal features and learn non-linear mappings directly from raw sequence data.

### Theme 4: Baseline Models, Walk-Forward Validation, and Model Skill

- **Source:** Deep Learning for Time Series Forecasting
- **Structural locator:** Chapter 10: Review of Top Methods For Univariate Time Series Forecasting
- **Spirit locator:** Empirical evaluation requires walk-forward validation and strict benchmark comparisons against simple naive baselines and classical statistical methods to justify neural network complexity.

---

## 5. Source-Backed Spirit

1. **What primary architectural objective does this source promote?**
   The primary architectural objective is to establish a systematic four-step process (Define Problem, Design Test Harness, Test Models, Finalize Model) that transforms raw sequence data into 3D supervised tensors and evaluates deep learning architectures against baseline skill thresholds.

2. **How does the source approach data integrity and validation?**
   The source approaches data integrity by structuring sequence observations into strict input/output sliding windows (`split_sequence`) and validating model skill using walk-forward validation that mirrors real-world sequential decision-making.

3. **What is the source's stance on temporal dependencies and ordering?**
   The source maintains that temporal ordering is the critical defining characteristic of time-series data, requiring that training/testing splits and evaluation harness iterations preserve chronological sequencing without random shuffling.

4. **How should processing pipelines handle noise, drift, and missing data?**
   Processing pipelines should leverage the inherent robustness of neural networks to noise and non-linearities, while using explicit differencing or power transforms when grid searching data preparation configurations to handle trend and structural instability.

5. **What are the recommended boundaries between automated checks and human judgment?**
   Automated checks should handle dataset reshaping, grid searching hyperparameter combinations, and walk-forward error scoring, whereas human judgment is required for defining problem taxonomy, selecting loss metrics, and deciding whether model accuracy improvements justify neural network deployment.

6. **How does the source view model evaluation and baseline comparisons?**
   The source holds that sophisticated deep learning models must always be evaluated against simple naive baselines (such as persistence or seasonal medians) and classical statistical methods (SARIMA, ETS) to empirically prove that added model complexity provides genuine forecasting skill.

---

## 6. Key Concepts

### Concept 1: Supervised Learning Framing (Sliding Window)

- **Definition:** The process of restructuring a time-ordered sequence of observations into overlapping samples containing explicit input features (\(X\), lag observations) and target outputs (\(y\), future time steps).
- **Why it matters:** It enables standard machine learning algorithms and deep neural networks to learn mapping functions directly on sequence data.
- **Related concepts:** Lag Framing, Sliding Window, Sample Window, Input Horizon.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 4: How to Transform Time Series to a Supervised Learning Problem
  - Spirit locator: Time-series datasets must be re-framed as supervised learning pairs to train neural networks.
- **Verification status:** source-backed

### Concept 2: 3D Data Preparation (`[samples, timesteps, features]`)

- **Definition:** Transforming 2D supervised matrices into a 3D tensor shape defined by the number of samples, the length of the lookback sequence (time steps), and the number of parallel variables (features).
- **Why it matters:** 1D Convolutional (Conv1D) and Recurrent (LSTM) layers in frameworks like Keras strictly require 3D input tensor formatting.
- **Related concepts:** Tensor Reshaping, Conv1D Input Shape, LSTM Input Layer, Feature Dimensions.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 6: How to Prepare Time Series Data for CNNs and LSTMs
  - Spirit locator: Convolutional and recurrent layers require 3D tensor representation of sequence samples.
- **Verification status:** source-backed

### Concept 3: Walk-Forward Validation

- **Definition:** An evaluation procedure where a model makes a forecast for one step (or horizon) ahead, after which the actual observation is added to the historical context before predicting the subsequent step.
- **Why it matters:** It simulates real-world production deployment, prevents future temporal data leakage, and provides realistic error estimates.
- **Related concepts:** Out-of-Sample Testing, Rolling Context, Test Harness, RMSE.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 11: How to Develop Baseline Models for Univariate Forecasting
  - Spirit locator: Walk-forward validation provides realistic out-of-sample skill assessment without future leakage.
- **Verification status:** source-backed

### Concept 4: Hybrid CNN-LSTM Architecture

- **Definition:** A neural network architecture where 1D convolutional layers sub-sample and extract spatial/temporal feature representations from input subsequences, which are then passed into an LSTM layer to interpret sequence order.
- **Why it matters:** It combines automatic feature distillation from raw signals with the long-term context learning of recurrent layers.
- **Related concepts:** TimeDistributed Wrapper, Conv1D, Feature Extraction, Sequence Modeling.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 9: How to Develop LSTMs for Time Series Forecasting
  - Spirit locator: Combining 1D convolutions with recurrent layers enables hierarchical feature extraction over sequence blocks.
- **Verification status:** source-backed

### Concept 5: Naive Persistence Benchmark

- **Definition:** A non-learned baseline model that predicts the value at a future time step by simply persisting the most recent observation or seasonal lag.
- **Why it matters:** It establishes the absolute minimum skill threshold that any complex machine learning or deep learning model must surpass to justify its use.
- **Related concepts:** Skill Score, Baseline Comparison, Persistence Model, Seasonal Persistence.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 10: Review of Top Methods For Univariate Time Series Forecasting
  - Spirit locator: Deep learning models must clear the performance threshold set by naive persistence baselines.
- **Verification status:** source-backed

### Concept 6: Multi-Step Forecasting Framing (Vector Output vs. Encoder-Decoder)

- **Definition:** The formulation of multi-step predictions either via a direct vector output dense layer or via an Encoder-Decoder recurrent architecture that generates sequence outputs step-by-step.
- **Why it matters:** Vector outputs offer simplicity and speed, while Encoder-Decoder structures support variable input/output sequence lengths and accumulated internal state.
- **Related concepts:** Vector Output Model, RepeatVector, TimeDistributed Dense, Multi-Horizon Forecast.
- **Citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 20: How to Develop LSTMs for Multi-step Energy Usage Forecasting
  - Spirit locator: Multi-step forecasting can be achieved via direct vector regression or iterative encoder-decoder sequence generation.
- **Verification status:** source-backed

---

## 7. Practical Patterns and Examples

### Pattern 1: 3D Tensor Reshaping for Convolutional and Recurrent Layers

- **Problem solved:** Transforming 2D tabular supervised datasets into the 3D tensor structure required by Keras `Conv1D` and `LSTM` layers.
- **Recommended approach:** Convert univariate or multivariate sequences using a sliding window function, then apply NumPy `.reshape((samples, timesteps, features))` prior to model training.
- **Repository-level manifestation:** Data preparation functions or pipeline transformers invoke `.reshape()` on input matrices before calling `model.fit()`.
- **Limitations:** Requires careful alignment of input dimension arguments in Keras layer declarations.
- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 6: How to Prepare Time Series Data for CNNs and LSTMs
  - Spirit locator: Input matrices must be explicitly transformed into 3D shapes corresponding to samples, time steps, and features.

### Pattern 2: Systematic Walk-Forward Model Evaluation Harness

- **Problem solved:** Evaluating sequence prediction models without causing temporal data leakage or optimistic out-of-sample bias.
- **Recommended approach:** Partition datasets into train and test windows, iterate through test observations one by one, fit or evaluate the model on historical observations, and record RMSE scores.
- **Repository-level manifestation:** Evaluation harness scripts implement `walk_forward_validation(data, n_test, cfg)` loops that update historical context arrays sequentially.
- **Limitations:** Re-fitting deep neural networks at every walk-forward step is computationally expensive; evaluation often relies on pre-fit static models.
- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 11: How to Develop Baseline Models for Univariate Forecasting
  - Spirit locator: Test harnesses must sequentially evaluate models on expanding context windows to mimic production deployment.

### Pattern 3: Naive Baseline Verification Prior to Neural Network Modeling

- **Problem solved:** Preventing the deployment of unnecessarily complex neural networks that perform worse than simple rules.
- **Recommended approach:** Implement simple persistence or seasonal median functions, calculate RMSE on the exact same walk-forward test split, and compare neural network error against this baseline.
- **Repository-level manifestation:** Benchmark scripts or unit tests run a `persistence_forecast` function and assert that deep learning model RMSE is lower than the persistence RMSE.
- **Limitations:** Persistence models set a high benchmark on simple series, making marginal neural network gains harder to demonstrate.
- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 14: How to Develop MLPs, CNNs and LSTMs for Univariate Forecasting
  - Spirit locator: Simple naive models must be evaluated first to establish the baseline error that deep neural networks must beat.

---

## 8. Common Failure Modes and Risks

### Failure Mode 1: Random Shuffling during Train/Test Splitting on Sequence Data

- **Why it happens:** Machine learning pipelines default to `shuffle=True` during dataset partitioning or cross-validation.
- **Early warning signs:** Artificially low validation loss during training that severely degrades when deployed on unseen future time steps.
- **Repository evidence:** Invocations of `train_test_split` with `shuffle=True` or random K-Fold cross-validation on sequence DataFrames.
- **Severity tendency:** critical

### Failure Mode 2: Unverified Deep Learning Deployment Over Classical Baselines

- **Why it happens:** Training complex neural networks (MLPs, LSTMs) without calculating benchmark error metrics from naive persistence or SARIMA models.
- **Early warning signs:** High computational resource consumption and potential overfitting on training sets without demonstrated forecast skill gains.
- **Repository evidence:** Deep learning training scripts lacking comparative baseline calculation blocks or naive RMSE printouts.
- **Severity tendency:** warning

### Failure Mode 3: Dimension Mismatch in 3D Recurrent/Convolutional Inputs

- **Why it happens:** Passing 2D supervised matrices directly into Keras `Conv1D` or `LSTM` layers without adding the 3D feature dimension.
- **Early warning signs:** Keras runtime `ValueError` exceptions reporting expected 3D array input but receiving 2D array.
- **Repository evidence:** Keras `Sequential` models containing `Conv1D` or `LSTM` input layers fed directly by 2D arrays without a prior `.reshape()` call.
- **Severity tendency:** error

### Failure Mode 4: Future Temporal Leakage via Improper Sliding Window Boundary Construction

- **Why it happens:** Constructing sliding window slices where target variable indices overlap with or precede input feature indices.
- **Early warning signs:** Unusually perfect evaluation metrics or zero error during model testing.
- **Repository evidence:** Custom sequence splitting functions missing index bounds checks (`end_ix > len(sequence)-1`) or referencing future target offsets.
- **Severity tendency:** critical

---

## 9. Repository-Audit Translation

### Static checks (automated)

- Check for `train_test_split` calls on time-series sequence data to ensure `shuffle=False` or explicit chronological slicing is used.
- Verify that sequence transformation routines explicitly invoke 3D array reshaping (`.reshape(...)`) before passing input tensors into `Conv1D` or `LSTM` layers.
- Scan for the presence of baseline calculation routines (e.g. persistence or naive mean RMSE) in model evaluation scripts.
- Check that custom sliding window functions include boundary checking logic (e.g. `end_ix > len(...)`) to prevent index overflow or leakage.

### Human review (contextual)

- Evaluate whether selected lookback window lengths (`n_steps`) capture domain-relevant periodicities or seasonal cycles.
- Assess whether the accuracy improvement of deep neural network models over naive persistence justifies added training complexity and maintenance cost.
- Review whether vector output vs. Encoder-Decoder architectures are appropriately selected for multi-step forecasting horizons.
- Inspect whether model evaluation metrics (RMSE, MAE, MAPE) align with domain operational objectives.

---

## 10. Candidate Rules

### Rule 1 — `dataops-timeseries-001`

| Field | Value |
|---|---|
| **Rule ID** | `dataops-timeseries-001` |
| **Title** | Temporal Leakage Prevention in Time-Series Splitting |
| **Profile** | dataops |
| **Severity tendency** | error |
| **Rationale** | Time-series sequence data must maintain temporal ordering during train/test splits. Randomly shuffling dataset rows introduces future data leakage into training sets. |
| **Source-backed basis** | The source emphasizes that time-series sequence data requires chronological partitioning or walk-forward evaluation without random shuffling to measure forecast skill accurately. |
| **Repository evidence to inspect** | Python scripts or notebook files importing `train_test_split` or performing sequence splits. |
| **Pass condition** | `train_test_split` invocations explicitly specify `shuffle=False` or use sequential slicing (e.g., `data[:-n_test], data[-n_test:]`). |
| **Fail condition** | `train_test_split` is called with `shuffle=True` or default shuffling enabled on time-series arrays. |
| **Exceptions or limitations** | Non-temporal tabular data preparation scripts. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 3: How to Develop a Skillful Forecasting Model
  - Spirit locator: Time-series evaluation requires strict chronological data partitioning to avoid future leakage.
  - Verification status: source-backed

### Rule 2 — `dataops-sensor-001`

| Field | Value |
|---|---|
| **Rule ID** | `dataops-sensor-001` |
| **Title** | 3D Input Tensor Reshaping for Convolutional and Recurrent Layers |
| **Profile** | dataops |
| **Severity tendency** | warning |
| **Rationale** | Keras `Conv1D` and `LSTM` layers require a 3D input shape `[samples, timesteps, features]`. Passing 2D matrices causes runtime architecture exceptions. |
| **Source-backed basis** | The source explicitly details that 2D supervised datasets must be reshaped into 3D structures before being fit into CNN or LSTM models. |
| **Repository evidence to inspect** | Model building scripts creating `Sequential` Keras models with `Conv1D` or `LSTM` input layers. |
| **Pass condition** | Input feature matrices are reshaped with `.reshape((..., ..., ...))` or explicitly formatted into 3D arrays prior to `model.fit()`. |
| **Fail condition** | Unreshaped 2D arrays `[samples, features]` are fed directly to `Conv1D` or `LSTM` input layers without a 3D reshaping step. |
| **Exceptions or limitations** | MLP models taking 2D vectors directly. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 6: How to Prepare Time Series Data for CNNs and LSTMs
  - Spirit locator: 2D supervised sequence data must be converted into 3D tensors before feeding into deep learning layers.
  - Verification status: source-backed

### Rule 3 — `iiot-sensor-001`

| Field | Value |
|---|---|
| **Rule ID** | `iiot-sensor-001` |
| **Title** | Baseline Model Benchmark Verification Check |
| **Profile** | iiot |
| **Severity tendency** | warning |
| **Rationale** | Complex deep learning models often perform worse than simple persistence or naive baselines on time-series forecasting. Benchmark comparisons ensure added complexity provides genuine value. |
| **Source-backed basis** | Empirical studies in the source demonstrate that simple classical and naive persistence baselines often outperform complex deep learning models, making baseline comparison essential. |
| **Repository evidence to inspect** | Model training and evaluation scripts. |
| **Pass condition** | Scripts calculate and report baseline metrics (e.g. naive persistence, mean, or SARIMA RMSE) alongside neural network evaluation. |
| **Fail condition** | Deep learning model evaluation scripts lack baseline or naive persistence comparison calculations. |
| **Exceptions or limitations** | Exploratory proof-of-concept scripts without model validation. |
| **YAML readiness** | ready |

- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 10: Review of Top Methods For Univariate Time Series Forecasting
  - Spirit locator: Deep learning model performance must clear the skill threshold established by simple naive baselines.
  - Verification status: source-backed

### Rule 4 — `cross-iiot-dataops-001`

| Field | Value |
|---|---|
| **Rule ID** | `cross-iiot-dataops-001` |
| **Title** | Dynamic Loss Monitoring and Early Stopping Integration |
| **Profile** | cross |
| **Severity tendency** | info |
| **Rationale** | Training deep neural networks for time series without early stopping or loss monitoring leads to overfitting on training sets while degrading out-of-sample forecast accuracy. |
| **Source-backed basis** | The source notes that complex models like LSTMs tend to overfit time-series training sets and require loss monitoring callback mechanisms. |
| **Repository evidence to inspect** | Model training invocations (`model.fit`). |
| **Pass condition** | `model.fit()` includes `callbacks=[EarlyStopping(...)]` or loss monitoring routines. |
| **Fail condition** | `model.fit()` is executed for large numbers of epochs (e.g. >100) without early stopping callbacks or loss monitoring. |
| **Exceptions or limitations** | Small fixed-epoch training runs or grid searches where epoch count is an explicit search parameter. |
| **YAML readiness** | needs-review |
| **Reason if not ready** | Static regex cannot deterministically verify whether custom callback lists or external training loops monitor training loss without potential false positives across diverse execution patterns. |

- **Source citation:**
  - Source: Deep Learning for Time Series Forecasting
  - Structural locator: Chapter 14: How to Develop MLPs, CNNs and LSTMs for Univariate Forecasting
  - Spirit locator: Training deep neural networks requires monitoring validation loss to prevent overfitting on temporal patterns.
  - Verification status: source-backed

---

## 11. Suggested YAML Fragment

```yaml
rules:
  - id: dataops-timeseries-001
    title: Temporal Leakage Prevention in Time-Series Splitting
    profile: dataops
    severity: error
    rationale: Time-series sequence data must maintain temporal ordering during train/test splits. Randomly shuffling dataset rows introduces future data leakage into training sets.
    references:
      - book: "Deep Learning for Time Series Forecasting"
        concept: "walk-forward-validation"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "train_test_split\\(.*shuffle\\s*=\\s*True"
      must_exist: false
      error_when: pattern_present
      message: "Time-series dataset splitting detects shuffle=True which introduces future data leakage."

  - id: dataops-sensor-001
    title: 3D Input Tensor Reshaping for Convolutional and Recurrent Layers
    profile: dataops
    severity: warning
    rationale: Keras Conv1D and LSTM layers require a 3D input shape [samples, timesteps, features]. Passing 2D matrices causes runtime architecture exceptions.
    references:
      - book: "Deep Learning for Time Series Forecasting"
        concept: "3d-data-preparation"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "Sequential\\(\\).*(Conv1D|LSTM)"
      must_exist: false
      error_when: pattern_present
      message: "Sequential model contains Conv1D or LSTM layers requiring 3D input reshaped tensors."

  - id: iiot-sensor-001
    title: Baseline Model Benchmark Verification Check
    profile: iiot
    severity: warning
    rationale: Complex deep learning models often perform worse than simple persistence or naive baselines on time-series forecasting. Benchmark comparisons ensure added complexity provides genuine value.
    references:
      - book: "Deep Learning for Time Series Forecasting"
        concept: "naive-baseline-comparison"
    check:
      type: pattern_match
      file_glob: "**/*.py"
      pattern: "model\\.fit\\("
      must_exist: true
      error_when: pattern_present
      message: "Deep learning model fitting detected; ensure naive persistence baseline benchmark is calculated."
```

### Candidates not emitted

- `cross-iiot-dataops-001`: Static regex cannot deterministically verify whether custom callback lists or external training loops monitor training loss without potential false positives across diverse execution patterns.

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

# Hands-On Artificial Intelligence for IoT, Second Edition — RepoScope Knowledge Note

## 1. Source identity
- **Title:** Hands-On Artificial Intelligence for IoT, Second Edition: Expert machine learning and deep learning techniques for developing smarter IoT systems
- **Author(s):** Dr. Amita Kapoor
- **Branch:** iiot
- **RepoScope profile:** iiot
- **Primary source file:** Hands-On Artificial Intelligence for IoT, Second Edition- -- Amita Kapoor , 2025.pdf
- **Note status:** reviewed-with-candidate-rules

---

## 2. Scope
- **In scope:**
  - Applied machine learning and deep learning architectures (MLP, CNN, RNN, LSTM, VAE, GAN, ViT, Transformers) for IoT data streams (time-series, computer vision, audio, text).
  - Edge AI deployment, lightweight inference frameworks (TinyML, OpenVINO, Keras 3 multi-backend distribution, Edge Impulse), and hardware optimization (quantization, pruning, genetic algorithms).
  - Multi-modal sensor data processing pipelines, distributed AI training, and cloud platform integrations (AWS Rekognition, Azure Speech SDK, Google Vertex AI, SageMaker).
  - Anomaly detection, predictive maintenance, Remaining Useful Life (RUL) estimation using LSTMs, and privacy-preserving AI practices in personal, home, industrial, and smart city IoT environments.
- **Out of scope:**
  - Physical semiconductor layout, microcontroller pin soldering, and low-level hardware circuit design.
  - Manual, non-automated hyperparameter guessing without programmatic search routines or scripts.
  - Organizational business management strategies, non-statically verifiable runtime decisions, and pure consumer sales marketing.
  - Proprietary closed-source cloud platforms lacking open API/SDK integration interfaces.

---

## 3. Source spirit card
1. **Core architectural thesis:** Embedding intelligence across IoT ecosystems requires lightweight, optimized machine learning and deep learning models deployed at the edge to process high-velocity multi-modal data while offloading heavy training to cloud and distributed infrastructures.
2. **Primary operational domain:** Personal health wearables, smart home automation, industrial predictive maintenance (IIoT), precision agriculture, and smart city urban analytics.
3. **Target engineering role:** Embedded AI developers, IIoT software engineers, edge ML practitioners, and cloud-edge data platform architects.
4. **Fundamental design paradigm:** Containerized and microservice-driven edge ML deployment utilizing multi-backend Keras 3 frameworks, ONNX, TinyML, and serverless cloud AI SDKs.
5. **Preferred integration strategy:** Multi-modal edge-to-cloud data pipelines processing time-series telemetry, visual streams, and text/audio commands via REST, MQTT, and AMQP APIs into machine learning platforms.
6. **Data lifecycle philosophy:** Multi-tiered data management separating real-time hot-path local edge inference from warm/cold path batch training, anomaly detection, and cloud-based time-series forecasting.
7. **Security and trust posture:** Privacy-by-design incorporating local edge data processing, feature anonymization, secure credential storage via environment variables, and encrypted transport across IoT channels.
8. **Resilience and fault-tolerance principle:** Autonomous edge operation capable of running local inference models during network disconnections and recovering session state through automated reconnection and retry routines.
9. **Hardware/edge constraint posture:** Hardware-aware neural network design enforcing strict memory, CPU, GPU, and power limits via pruning, quantization, lightweight backbones (MobileNet, TinyBERT, YOLO), and batching rules.
10. **Scalability and evolution approach:** Distributed data and model parallel strategies using the Keras 3 Distribution API alongside versioned model artifacts managed through automated MLOps platforms (SageMaker, Vertex AI, MLflow).

---

## 4. Source-backed structure

### Theme 1: Principles of IoT-AI Convergence, CRISP-DM, and Edge Reference Models
- **Source:** `Hands-On Artificial Intelligence for IoT, Second Edition`
- **Structural locator:** `Chapter 1: Principles and Foundations of IoT and AI`
- **Spirit locator:** Unlocking actionable value from continuous IoT telemetry streams requires structuring data science workflows through CRISP-DM and distributing analytical tasks across device, network, service, and application layers.

### Theme 2: Classical Machine Learning, Feature Scaling, and Model Optimization
- **Source:** `Hands-On Artificial Intelligence for IoT, Second Edition`
- **Structural locator:** `Chapter 3: Machine Learning for IoT`
- **Spirit locator:** Applying classical supervised and unsupervised ML algorithms to sensor data requires feature scaling, cross-validation, and hyperparameter tuning to prevent overfitting on noisy field readings.

### Theme 3: Deep Learning, Lightweight Neural Networks, and Evolutionary Optimization
- **Source:** `Hands-On Artificial Intelligence for IoT, Second Edition`
- **Structural locator:** `Chapter 4: Deep Learning for IoT` & `Chapter 5: Optimization Techniques in IoT`
- **Spirit locator:** Deploying deep neural networks to resource-constrained edge hardware mandates lightweight model architectures, optimization via evolutionary algorithms, and TinyML quantization techniques.

### Theme 4: Generative Models and Variational Autoencoders for Anomaly Detection
- **Source:** `Hands-On Artificial Intelligence for IoT, Second Edition`
- **Structural locator:** `Chapter 7: Generative Models for IoT`
- **Spirit locator:** Detecting subtle operational anomalies in multi-dimensional IoT data relies on reconstruction error metrics evaluated by Variational Autoencoders (VAEs) trained on normal operating distributions.

### Theme 5: Industrial AIoT, Predictive Maintenance, and Remaining Useful Life (RUL) Forecasting
- **Source:** `Hands-On Artificial Intelligence for IoT, Second Edition`
- **Structural locator:** `Chapter 14: AI for IIoT`
- **Spirit locator:** Transforming industrial operations from reactive to proactive maintenance requires coupling sensor streams with recurrent LSTM models to forecast remaining useful equipment life and trigger automated alerts.

---

## 5. Source-backed spirit
1. **What is the fundamental problem the source addresses?**
   The source addresses the technical challenge of converting continuous, high-volume, multi-modal IoT data streams (time-series, visual, audio, text) into intelligent insights by applying machine learning and deep learning algorithms across resource-constrained edge devices and cloud environments.
2. **What is the core architectural philosophy advocated by the author?**
   The author advocates for a modular, hardware-aware AIoT architecture centered on multi-backend Keras 3, open-source ML frameworks (Scikit-Learn, PyTorch, TensorFlow, SparkML), lightweight edge models (MobileNet, TinyBERT, TinyML), and distributed training pipelines.
3. **How does the source approach the boundary between edge systems and central cloud infrastructure?**
   Edge systems execute low-latency inference, localized filtering, and immediate anomaly detection, while central cloud platforms ingest aggregated telemetry for heavy model training, complex time-series forecasting, and fleet-wide management.
4. **What is the source's approach to device identity, authentication, and communication security?**
   Security and cloud platform interactions rely on dynamic credential management using environment variables, secret managers, IAM role bindings, and encrypted transport protocols (TLS/SSL) to protect against static password leaks.
5. **How does the source handle network instability, offline resilience, and data synchronization?**
   Edge systems must operate autonomously by executing local inference models during network disconnections, buffering telemetry locally, and implementing automated reconnect and retry logic upon link restoration.
6. **What trade-offs does the source emphasize when balancing hardware constraints against computational capability?**
   The source emphasizes balancing model accuracy against hardware resource limits by employing lightweight neural architectures, model pruning, integer quantization, and feature selection to minimize memory footprint and execution latency on constrained microcontrollers and edge gateways.

---

## 6. Key concepts

### 1. TinyML & OpenVINO
- **Definition:** Lightweight machine learning inference frameworks optimized to execute quantized deep learning models on low-power microcontrollers and edge processors without cloud connectivity.
- **Why it matters:** Enables real-time, low-latency AI inference directly on constrained field devices while preserving battery life and bandwidth.
- **Related concepts:** Quantization, Pruning, Edge Impulse, Model Compression.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 4.
- **Verification status:** source-backed

### 2. Variational Autoencoder (VAE) Anomaly Detection
- **Definition:** An explicit generative neural network model that learns the latent probability distribution of normal sensor telemetry and flags anomalies when reconstruction error exceeds a set threshold.
- **Why it matters:** Provides unsupervised anomaly detection capabilities for complex multi-sensor industrial equipment where failure labels are rare or absent.
- **Related concepts:** Reconstruction Error, Latent Space, Generative Models, Outlier Detection.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 7.
- **Verification status:** source-backed

### 3. Remaining Useful Life (RUL) Estimation
- **Definition:** A predictive maintenance modeling methodology using recurrent neural networks (such as LSTMs) trained on historical sensor telemetry sequences to estimate the number of operational cycles remaining before asset failure.
- **Why it matters:** Shifts maintenance strategies from reactive repairs or fixed schedules to proactive, condition-based interventions that prevent catastrophic equipment failure.
- **Related concepts:** Predictive Maintenance, LSTM, NASA Turbofan Engine Dataset, Degradation Model.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 14.
- **Verification status:** source-backed

### 4. Distributed Learning & Keras 3 Distribution API
- **Definition:** A framework mechanism that parallelizes model training across multiple compute nodes or GPUs using data parallelism (e.g., `DataParallel`) or model parallelism (e.g., `ModelParallel` and `LayoutMap`).
- **Why it matters:** Allows scaling neural network training to massive IoT datasets that exceed the memory and processing capacity of a single machine.
- **Related concepts:** Multi-backend Keras 3, Data Parallelism, Model Parallelism, TensorLayout.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 8.
- **Verification status:** source-backed

### 5. CRISP-DM (Cross-Industry Standard Process for Data Mining)
- **Definition:** A vendor-independent, iterative six-phase data science process model encompassing Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, and Deployment.
- **Why it matters:** Establishes a structured engineering lifecycle for developing, validating, and retraining AI models on non-stationary IoT sensor streams.
- **Related concepts:** Data Pipeline, Model Evaluation, Feature Engineering, MLOps.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 1.
- **Verification status:** source-backed

### 6. Lightweight Visual Backbones (MobileNet / YOLO)
- **Definition:** Streamlined convolutional neural network architectures designed with depthwise separable convolutions or single-stage detection grids to process visual IoT data streams in real time.
- **Why it matters:** Enables high-speed object detection and classification on resource-constrained edge hardware like Raspberry Pi or mobile edge gateways.
- **Related concepts:** Depthwise Separable Convolution, Edge Computer Vision, MediaPipe, Ultralytics.
- **Citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 11.
- **Verification status:** source-backed

---

## 7. Practical patterns and examples

### Pattern 1: LSTM-Based Remaining Useful Life (RUL) Predictive Maintenance Pipeline
- **Problem solved:** Equipment failure in industrial assets causes unexpected downtime and costly emergency repairs.
- **Recommended approach:** Preprocess multi-sensor time-series sequences using min-max scaling, construct sliding window sequences, and train a multi-layer LSTM model to predict equipment RUL.
- **Repository-level manifestation:** Python training scripts (`train_rul.py`) defining `Sequential([LSTM(...), Dropout(...), Dense(1)])` architectures, feature scaling routines (`StandardScaler`), and sliding window creation functions.
- **Limitations:** Requires labeled historical run-to-failure dataset sequences for model training.
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 14.

### Pattern 2: Secure Cloud AI SDK Credentials Management with Environment Variables
- **Problem solved:** Hardcoding cloud API access keys (e.g., AWS Access Keys, Azure Speech Keys) inside IoT edge code leads to credential leaks in source code repositories.
- **Recommended approach:** Retrieve access credentials dynamically at runtime using `os.getenv()` or secure input prompts (`getpass`), instantiating cloud SDK clients (Boto3, Azure Speech SDK) without static string literals.
- **Repository-level manifestation:** Python source files (`cloud_vision.py`) invoking `os.getenv("AWS_ACCESS_KEY_ID")` or `boto3.Session(...)` with environment variable bindings.
- **Limitations:** Requires underlying container runtime environment or OS secrets manager to populate variables securely at startup.
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 9.

### Pattern 3: Unsupervised VAE Anomaly Detection on Industrial Sensor Streams
- **Problem solved:** Detecting novel operational anomalies in unlabeled high-dimensional sensor data streams.
- **Recommended approach:** Train a Variational Autoencoder on normal baseline operating data and compute the mean squared reconstruction error between input sensor vectors and VAE output vectors during inference.
- **Repository-level manifestation:** Python model modules (`vae_anomaly.py`) defining encoder/decoder neural network layers, custom loss functions combining reconstruction loss and KL divergence, and threshold comparison checks (`if reconstruction_loss > threshold`).
- **Limitations:** Threshold tuning requires validation against known anomaly reference data to minimize false alarms.
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 7.

---

## 8. Common failure modes and risks
1. **Hardcoded Cloud Access Keys and API Secrets in Edge AI Source Code:**
   - *Why it happens:* Developers hardcode AWS access key IDs, secret access keys, or Azure API tokens directly in Python scripts during quick prototyping.
   - *Early warning signs:* Plaintext secrets visible in version control commits, static security analysis flags.
   - *Repository evidence:* String literals matching AWS/Azure secret key patterns inside Python or configuration files (`.py`, `.env`, `.json`).
   - *Severity tendency:* error
2. **Unscaled Sensor Feature Data Ingested into Gradient-Based Neural Networks:**
   - *Why it happens:* Sensor readings with vastly different measurement scales (e.g., RPM vs Temperature) are fed directly into ML/DL models without normalization.
   - *Early warning signs:* Slow gradient descent convergence, exploding/vanishing gradients, model bias toward high-magnitude features.
   - *Repository evidence:* Absence of `StandardScaler`, `MinMaxScaler`, or equivalent preprocessing steps in ML model training pipelines.
   - *Severity tendency:* warning
3. **Telemetry Schema Specifications Lacking Mandatory Timestamp Metadata:**
   - *Why it happens:* Data ingestion scripts parse sensor values without attaching explicit ISO-8601 timestamps, causing loss of temporal context.
   - *Early warning signs:* Time-series joining errors, failure in sliding window calculations, unindexed database queries.
   - *Repository evidence:* JSON schema definitions (`*schema*.json`) missing mandatory `timestamp` or `dateTime` properties.
   - *Severity tendency:* warning
4. **Edge Container Deployment Manifest Omitting Resource Limits:**
   - *Why it happens:* Docker Compose files for edge containers omit CPU and memory resource constraints, leading to host resource starvation.
   - *Early warning signs:* Edge gateway system crashes, memory exhaustion kills (OOM-killer), dropped telemetry packets.
   - *Repository evidence:* Docker Compose manifests (`docker-compose*.yml`) lacking `cpus`, `memory`, or `mem_limit` blocks under service definitions.
   - *Severity tendency:* info

---

## 9. Repository-audit translation

### Static checks (automated)
- Audit source code files (`.py`, `.js`, `.json`, `.yaml`) for hardcoded cloud credentials or API secret string literals.
- Inspect telemetry JSON schema files (`*schema*.json`) for mandatory ISO-8601 timestamp (`timestamp`, `dateTime`) fields.
- Scan edge deployment manifests (`docker-compose*.yml`) for resource limit constraints (`cpus`, `memory`, `mem_limit`).
- Verify edge deployment manifests for health check declarations (`healthcheck`).
- Inspect Python training scripts (`.py`) for feature scaling / normalization transformations (`StandardScaler`, `MinMaxScaler`) prior to model fitting.
- Check edge MQTT/HTTP client initialization code for automatic reconnect and retry logic flags.

### Human review (contextual)
- Evaluate whether the choice of edge vs cloud model placement aligns with network bandwidth costs and inference latency requirements.
- Review feature engineering choices and domain-specific sensor transformations for physics-based plausibility.
- Assess the adequacy of VAE reconstruction error thresholds for anomaly detection to balance precision against recall.
- Verify that data privacy protection measures (e.g., face blurring, local anonymization) comply with regional data governance regulations.

---

## 10. Candidate rules

### Rule 1
- **Rule ID:** iiot-device-001
- **Title:** Hardcoded Plaintext Credentials in Edge AI Application Code
- **Profile:** iiot
- **Severity tendency:** error
- **Rationale:** Edge AI applications connecting to cloud services must not contain hardcoded plaintext access keys or secret tokens to prevent credential exposure.
- **Source-backed basis:** Credentials for cloud platforms and edge devices must be supplied dynamically via environment variables or secret stores rather than static string literals.
- **Repository evidence to inspect:** Edge Python scripts and configuration files (`.py`, `.json`, `.yaml`, `.env`).
- **Pass condition:** Secret and key parameters utilize `os.getenv()`, `getpass`, or environment variable placeholders.
- **Fail condition:** Files contain hardcoded plaintext access key or secret string literals.
- **Exceptions or limitations:** Mock credential placeholders in local test fixture files explicitly excluded from production builds.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 9.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 9: AI Cloud Platforms for IoT`
- **Spirit locator:** Edge applications interacting with cloud AI services must inject access credentials dynamically via environment bindings to prevent security breaches.
- **Verification status:** source-backed

---

### Rule 2
- **Rule ID:** iiot-telemetry-001
- **Title:** Telemetry Schema Specification Lacks Mandatory Timestamp Metadata
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field to support chronological indexing in time-series databases.
- **Source-backed basis:** Time-series datapoints require timestamped raw data streams for proper time-series indexing and interpolation.
- **Repository evidence to inspect:** Telemetry JSON schema files (`*schema*.json`).
- **Pass condition:** The schema explicitly requires a `timestamp`, `time_iso`, or `dateTime` field.
- **Fail condition:** The schema specifies sensor value fields but omits a mandatory timestamp field.
- **Exceptions or limitations:** High-frequency binary streams where timestamps are implicitly derived at batch header level.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 2 & Chapter 10.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 10: Deep Learning for Time-Series Data from IoT`
- **Spirit locator:** Industrial sensor streams must carry explicit timestamp metadata to enable time-series indexing and temporal model training.
- **Verification status:** source-backed

---

### Rule 3
- **Rule ID:** iiot-hw-001
- **Title:** Edge Container Manifest Omits Resource Limits
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Containerized edge microservices running AI models must define CPU and memory constraints to prevent hardware exhaustion on constrained gateway devices.
- **Source-backed basis:** Edge gateways operate on constrained hardware and require explicit resource governance.
- **Repository evidence to inspect:** Edge container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definitions specify `cpus`, `memory`, or `mem_limit` constraints.
- **Fail condition:** Container service definitions omit CPU and memory resource limits.
- **Exceptions or limitations:** Development environment configurations running on high-performance desktop workstations.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 4 & Chapter 11.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 4: Deep Learning for IoT`
- **Spirit locator:** Edge microservice deployment manifests must enforce CPU and memory constraints to preserve system stability on resource-limited devices.
- **Verification status:** source-backed

---

### Rule 4
- **Rule ID:** iiot-006
- **Title:** Edge Microservice Manifest Lacks Health Check Endpoint
- **Profile:** iiot
- **Severity tendency:** info
- **Rationale:** Edge microservices running AI workloads must declare health check probes to enable automated container recovery and uptime management.
- **Source-backed basis:** Autonomous edge components require health monitoring mechanisms for self-healing deployment lifecycles.
- **Repository evidence to inspect:** Container Compose manifests (`docker-compose*.yml`).
- **Pass condition:** Service definition includes a `healthcheck` block with test command and probe interval.
- **Fail condition:** Service definition omits a `healthcheck` probe declaration.
- **Exceptions or limitations:** Ephemeral init-containers that run once and exit upon completing initialization tasks.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 1 & Chapter 2.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 2: Data Access and Distributed Processing for IoT`
- **Spirit locator:** Autonomous edge services must incorporate local health checks to support self-healing operational lifecycles.
- **Verification status:** source-backed

---

### Rule 5
- **Rule ID:** iiot-offline-001
- **Title:** Edge MQTT Client Missing Automatic Reconnect Configuration
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Edge messaging client initialization code must specify automatic reconnect logic to resume session communication after network disconnections.
- **Source-backed basis:** Clients must manage network disconnections gracefully by re-establishing sessions automatically.
- **Repository evidence to inspect:** Edge MQTT client initialization source code (`.py`, `.js`, `.go`).
- **Pass condition:** Client setup explicitly enables reconnect options, retry intervals, or keepalive parameters.
- **Fail condition:** Client initialization disables automatic reconnect or sets retry count to zero.
- **Exceptions or limitations:** One-shot CLI utility scripts designed for manual diagnostics.
- **YAML readiness:** ready
- **Reason if not ready:** N/A
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 12.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 12: AI for Text, Audio and Speech Data from IoT`
- **Spirit locator:** Edge communication clients must implement automated reconnection logic to maintain operational resilience over unstable networks.
- **Verification status:** source-backed

---

### Rule 6
- **Rule ID:** cross-iiot-dataops-001
- **Title:** ML Feature Processing Pipeline Missing Feature Scaling Transformation
- **Profile:** iiot
- **Severity tendency:** warning
- **Rationale:** Neural network feature processing pipelines must apply feature scaling or normalization transformations before model training to prevent numerical instability.
- **Source-backed basis:** Sensor data features with uneven numerical scales cause slow gradient convergence and biased model weights unless scaled.
- **Repository evidence to inspect:** Machine learning preprocessing code (`.py`).
- **Pass condition:** Preprocessing code includes `StandardScaler`, `MinMaxScaler`, or equivalent normalization scaling steps.
- **Fail condition:** Neural network training pipeline feeds unscaled multi-sensor features directly into model fitting calls.
- **Exceptions or limitations:** Tree-based ensemble models (e.g. Random Forest, XGBoost) that are invariant to monotonic feature scaling.
- **YAML readiness:** needs-review
- **Reason if not ready:** Detecting whether an ML pipeline requires feature scaling based on the underlying model family requires an AST parser to prevent false positives.
- **Source citation:** `Hands-On Artificial Intelligence for IoT, Second Edition`, Chapter 3.
- **Source:** Hands-On Artificial Intelligence for IoT, Second Edition
- **Structural locator:** `Chapter 3: Machine Learning for IoT`
- **Spirit locator:** Sensor streams with heterogeneous numerical ranges must undergo feature normalization to ensure stable model training and convergence.
- **Verification status:** source-backed

---

## 11. Suggested YAML fragment

```yaml
rules:
  - id: "iiot-device-001"
    title: "Hardcoded Plaintext Credentials in Edge AI Application Code"
    profile: "iiot"
    severity: "error"
    message: "Edge AI applications connecting to cloud services must not contain hardcoded plaintext access keys or secret tokens."
    references:
      - book: "Hands-On Artificial Intelligence for IoT, Second Edition"
        concept: "credential-security"
    check:
      type: "pattern_match"
      file_glob: "**/*.{py,json,conf,yaml,yml}"
      pattern: "(AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|secret_key|api_key)\\s*[:=]\\s*[\"'][^\"'${}]+[\"']"
      must_exist: false
      error_when: "pattern_present"

  - id: "iiot-telemetry-001"
    title: "Telemetry Schema Specification Lacks Mandatory Timestamp Metadata"
    profile: "iiot"
    severity: "warning"
    message: "Telemetry payload schemas must mandate an explicit ISO-8601 timestamp field for time-series indexing."
    references:
      - book: "Hands-On Artificial Intelligence for IoT, Second Edition"
        concept: "telemetry-schema"
    check:
      type: "pattern_match"
      file_glob: "**/*schema*.json"
      pattern: "timestamp|time_iso|dateTime"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-hw-001"
    title: "Edge Container Manifest Omits Resource Limits"
    profile: "iiot"
    severity: "info"
    message: "Containerized edge microservices running AI models should define CPU and memory limits."
    references:
      - book: "Hands-On Artificial Intelligence for IoT, Second Edition"
        concept: "hardware-constraints"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "cpus|memory|mem_limit"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-006"
    title: "Edge Microservice Manifest Lacks Health Check Endpoint"
    profile: "iiot"
    severity: "info"
    message: "Edge microservice deployment definitions should include health check probes to monitor operational health."
    references:
      - book: "Hands-On Artificial Intelligence for IoT, Second Edition"
        concept: "edge-health-probe"
    check:
      type: "pattern_match"
      file_glob: "**/docker-compose*.yml"
      pattern: "healthcheck"
      must_exist: true
      error_when: "pattern_absent"

  - id: "iiot-offline-001"
    title: "Edge MQTT Client Missing Automatic Reconnect Configuration"
    profile: "iiot"
    severity: "warning"
    message: "Edge messaging client initialization must configure automatic reconnect logic for offline resilience."
    references:
      - book: "Hands-On Artificial Intelligence for IoT, Second Edition"
        concept: "offline-resilience"
    check:
      type: "pattern_match"
      file_glob: "**/*.{py,js,ts,go}"
      pattern: "reconnect|retry|keepalive"
      must_exist: true
      error_when: "pattern_absent"
```

### Candidates not emitted
- `cross-iiot-dataops-001`: Detecting whether an ML pipeline requires feature scaling based on the underlying model family requires an AST parser to prevent false positives.

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


## References

<!-- ref: TODO -->

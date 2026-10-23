#!/usr/bin/env python3
"""
scripts/industrial_ml_filter.py <repo-path>

Detects industrial-ML signals in a repo. When any are present, prints the
categories of industrial-ML context from docs/notes/industrial-ml/ that
should be attached to the evaluation.

Deterministic: library-name matching in dependency manifests. No LLM, no
fuzzy matching. Reproducible.
"""
import json
import sys
from pathlib import Path

NOTES = Path("docs/notes/industrial-ml")

SIGNALS = {
    "01-realtime-streams": [
        "kafka", "pulsar", "flink", "kinesis", "event_hub", "mqtt",
        "confluent-kafka", "faust", "bytewax",
    ],
    "02-iiot-edge-digital-twins": [
        "digital_twin", "azure_iot", "aws_iot", "opcua", "asyncua",
        "edge_sdk", "aws-iot-device-sdk", "azure-iot-device",
    ],
    "03-time-series-sensor-analytics": [
        "prophet", "statsmodels", "neuralprophet", "sklearn", "torch",
        "tensorflow", "keras", "pyts", "tslearn", "sktime",
    ],
    "04-industrial-mlops": [
        "mlflow", "wandb", "bentoml", "evidently", "feast", "kedro",
        "metaflow", "zenml",
    ],
}


def detect(root: Path) -> dict:
    hit = {}
    all_text = ""
    for f in ("requirements.txt", "pyproject.toml", "package.json", "docker-compose.yml"):
        p = root / f
        if p.exists():
            all_text += p.read_text(encoding="utf-8", errors="ignore").lower()

    for category, keywords in SIGNALS.items():
        matched = [k for k in keywords if k in all_text]
        if matched:
            notes_dir = NOTES / category
            notes = [str(p) for p in notes_dir.glob("*.md")] if notes_dir.exists() else []
            hit[category] = {"signals": matched, "notes": notes}

    return hit


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    print(json.dumps(detect(root), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

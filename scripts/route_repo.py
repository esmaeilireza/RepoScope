#!/usr/bin/env python3
"""
scripts/route_repo.py <repo-path>

Classifies a repo into one or more of {iiot, dataops, webapp}.
Prints JSON: {"profiles": [...], "evidence": {profile: [...]}}
Exits 0 always; caller decides what to do with the result.
"""
import json
import sys
from pathlib import Path


def detect(root: Path) -> dict:
    evidence = {"iiot": [], "dataops": [], "webapp": []}

    # ── webapp signals ────────────────────────────────────────────
    for f in (
        "package.json",
        "next.config.js", "next.config.mjs", "next.config.ts",
        "app/api", "pages/api", "tsconfig.json",
    ):
        if (root / f).exists():
            evidence["webapp"].append(f)

    # ── dataops signals ───────────────────────────────────────────
    for f in (
        "dbt_project.yml", "profiles.yml",
        "great_expectations.yml", "soda.yml",
        "airflow.cfg", "dagster.yaml", "prefect.yaml",
    ):
        if (root / f).exists():
            evidence["dataops"].append(f)

    for f in ("requirements.txt", "pyproject.toml", "Pipfile"):
        p = root / f
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="ignore").lower()
            for lib in ("pandas", "polars", "dbt", "pyspark", "duckdb",
                        "great_expectations", "apache-airflow", "dagster", "prefect"):
                if lib in txt:
                    evidence["dataops"].append(f"{f}::{lib}")

    # ── iiot signals ──────────────────────────────────────────────
    for f in ("requirements.txt", "pyproject.toml"):
        p = root / f
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="ignore").lower()
            for lib in ("pymodbus", "opcua", "asyncua", "pymcprotocol",
                        "python-snap7", "pycomm3", "pylogix"):
                if lib in txt:
                    evidence["iiot"].append(f"{f}::{lib}")

    for ext in ("*.st", "*.scl", "*.lad", "*.fbd", "*.sfc", "*.ap16", "*.L5X"):
        if any(root.rglob(ext)):
            evidence["iiot"].append(f"files::{ext}")

    profiles = [p for p, ev in evidence.items() if ev]
    if not profiles:
        profiles = ["webapp"]
        evidence["webapp"] = ["fallback"]

    return {"profiles": profiles, "evidence": evidence}


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not root.exists():
        print(json.dumps({"profiles": ["webapp"], "evidence": {"webapp": ["fallback"]}}))
        return
    print(json.dumps(detect(root), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
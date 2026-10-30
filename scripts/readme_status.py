#!/usr/bin/env python3
"""Generate or verify the README implementation-status block."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Literal, TypedDict

Status = Literal["active", "draft", "unknown"]
README_START = "<!-- README_STATUS_START -->"
README_END = "<!-- README_STATUS_END -->"
DOMAIN_ORDER = ("general", "dataops", "iiot", "webapp", "cross")
DOMAIN_LABELS = {
    "general": "General (WebApp baseline)",
    "dataops": "DataOps",
    "iiot": "IIoT",
    "webapp": "WebApp",
    "cross": "Cross-Domain",
    "unknown": "Unknown",
}

# Closed map. Every accepted alias must be listed here explicitly.
# A status value not in VALID_STATUSES and not in STATUS_ALIASES is "unknown".
VALID_STATUSES: tuple[Status, ...] = ("active", "draft")
STATUS_ALIASES: dict[str, Status] = {
    "implemented": "active",
    "spec-only": "draft",
    "planned": "draft",
    "wip": "draft",
}


class Rule(TypedDict, total=False):
    id: str
    status: str


class Bundle(TypedDict, total=False):
    rules: list[Rule]


Specs = dict[str, Bundle]
Counts = dict[str, dict[Status, int]]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def normalize_status(value: object) -> Status:
    if not isinstance(value, str):
        return "unknown"
    v = value.strip().lower()
    if v in VALID_STATUSES:
        return v  # type: ignore[return-value]
    if v in STATUS_ALIASES:
        return STATUS_ALIASES[v]
    return "unknown"


def domain_for_rule_id(rule_id: str) -> str:
    if rule_id.startswith("general-"):
        return "general"
    head, separator, _ = rule_id.partition("-")
    if separator and head:
        return head
    return "unknown"


def empty_counts() -> Counts:
    return {
        domain: {"active": 0, "draft": 0, "unknown": 0}
        for domain in (*DOMAIN_ORDER, "unknown")
    }


def load_specs(path: Path) -> Specs:
    parsed: object = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(parsed, dict):
        raise TypeError(f"{path} must contain a JSON object")

    specs: Specs = {}
    for profile, bundle in parsed.items():
        if not isinstance(profile, str) or not isinstance(bundle, dict):
            raise TypeError(f"invalid profile entry in {path}: {profile!r}")

        rules_raw: object = bundle.get("rules", [])
        if not isinstance(rules_raw, list):
            raise TypeError(f"profile {profile!r} has non-list rules")

        rules: list[Rule] = []
        for item in rules_raw:
            if not isinstance(item, dict):
                continue

            rule_id = item.get("id")
            if not isinstance(rule_id, str) or not rule_id:
                continue

            rule_entry: Rule = {"id": rule_id}
            status = item.get("status")
            if isinstance(status, str):
                rule_entry["status"] = status
            rules.append(rule_entry)

        specs[profile] = {"rules": rules}

    return specs


def compute_counts(specs: Specs) -> Counts:
    counts = empty_counts()
    for bundle in specs.values():
        for rule in bundle.get("rules", []):
            rule_id = rule.get("id")
            if not isinstance(rule_id, str) or not rule_id:
                continue

            domain = domain_for_rule_id(rule_id)
            if domain not in counts:
                counts[domain] = {"active": 0, "draft": 0, "unknown": 0}

            counts[domain][normalize_status(rule.get("status"))] += 1

    return counts


def render_block(counts: Counts) -> str:
    totals: dict[Status, int] = {"active": 0, "draft": 0, "unknown": 0}
    lines = [
        README_START,
        "## Implementation Status (generated)",
        "",
        "Generated from `public/knowledge/specs.json`. Do not edit this block by hand.",
        "",
        "| Domain | Active | Draft | Unknown | Total |",
        "|---|---:|---:|---:|---:|",
    ]

    seen: set[str] = set()
    ordered_domains = [
        *DOMAIN_ORDER,
        *[domain for domain in counts if domain not in DOMAIN_ORDER],
    ]

    for domain in ordered_domains:
        if domain in seen:
            continue
        seen.add(domain)

        row = counts.get(domain, {"active": 0, "draft": 0, "unknown": 0})
        total = row["active"] + row["draft"] + row["unknown"]

        if total == 0 and domain == "unknown":
            continue

        label = DOMAIN_LABELS.get(domain, domain)
        lines.append(
            f"| {label} | {row['active']} | {row['draft']} | {row['unknown']} | {total} |"
        )

        for status in totals:
            totals[status] += row[status]

    grand_total = totals["active"] + totals["draft"] + totals["unknown"]
    lines.append(
        f"| **Total** | **{totals['active']}** | **{totals['draft']}** | "
        f"**{totals['unknown']}** | **{grand_total}** |"
    )
    lines.extend(["", README_END])
    return "\n".join(lines)


def replace_block(readme_text: str, block: str) -> str:
    start = readme_text.find(README_START)
    end = readme_text.find(README_END)

    if start == -1 or end == -1 or end < start:
        raise ValueError(
            "README.md must contain README_STATUS_START and README_STATUS_END markers. "
            "Add them once around the old Implementation Status section, then run pnpm readme:status."
        )

    return readme_text[:start] + block + readme_text[end + len(README_END):]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if README is stale or contains unknown statuses.",
    )
    args = parser.parse_args()

    root = repo_root()
    specs_path = root / "public" / "knowledge" / "specs.json"
    readme_path = root / "README.md"

    specs = load_specs(specs_path)
    counts = compute_counts(specs)
    block = render_block(counts)

    if args.check:
        readme_text = readme_path.read_text(encoding="utf-8")
        if block not in readme_text:
            print("README status block is stale. Run: pnpm readme:status", file=sys.stderr)
            return 1

        unknown_total = sum(row["unknown"] for row in counts.values())
        if unknown_total:
            print(
                f"specs.json contains {unknown_total} rule(s) with unknown status.",
                file=sys.stderr,
            )
            return 1

        print("README status block is current.")
        return 0

    readme_text = readme_path.read_text(encoding="utf-8")
    updated = replace_block(readme_text, block)
    readme_path.write_text(updated, encoding="utf-8", newline="\n")

    totals = {"active": 0, "draft": 0, "unknown": 0}
    for row in counts.values():
        for status in totals:
            totals[status] += row[status]

    print(
        "Updated README status block: "
        f"active={totals['active']}, draft={totals['draft']}, unknown={totals['unknown']}, "
        f"total={totals['active'] + totals['draft'] + totals['unknown']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
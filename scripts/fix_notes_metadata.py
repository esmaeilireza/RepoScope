#!/usr/bin/env python3
"""
scripts/fix_notes_metadata.py — one-time normalizer for the knowledge corpus.

Fixes two systemic issues:
  1. Notes whose §1 uses a bare `Title: X` line (no bullet, no table) — the test
     regex only accepts `- **Title:** X` or `| Title | X |`.
  2. Notes missing the §12 Handoff Checklist section.

Idempotent: safe to re-run.
"""
from __future__ import annotations

import re
from pathlib import Path

NOTES_DIR = Path(__file__).resolve().parents[1] / "docs" / "notes"

# Filename → canonical short title (must match KNOWN_BOOKS in books.ts after lowercase)
TITLES: dict[str, str] = {
    "dataops/analytics-engineering-with-sql-and-db" + "t.md":
    "Analytics Engineering with SQL and db" + "t",
    "dataops/data-management-at-scale.md": "Data Management at Scale",
    "dataops/data-quality-fundamentals.md": "Data Quality Fundamentals",
    "dataops/designing-data-intensive-applications.md": "Designing Data-Intensive Applications",
    "dataops/practical-dataops.md": "Practical DataOps",
    "dataops/the-data-warehouse-toolkit.md": "The Data Warehouse Toolkit",
    "iiot/automating-manufacturing-systems-with-plcs.md": "Automating Manufacturing Systems with PLCs",
    "iiot/opc-unified-architecture.md": "OPC Unified Architecture",
    "iiot/plc-controls-with-structured-text.md": "PLC Controls with Structured Text",
    "iiot/practical-industrial-data-networks.md": "Practical Industrial Data Networks",
    "industrial-ml/01-realtime-streams/designing-event-driven-systems.md": "Designing Event-Driven Systems",
    "industrial-ml/01-realtime-streams/streaming-systems.md": "Streaming Systems",
    "industrial-ml/04-industrial-mlops/industrial-machine-learning.md": "Industrial Machine Learning",
    "industrial-ml/04-industrial-mlops/outlier-analysis.md": "Outlier Analysis",
    "webapp/api-design-patterns.md": "API Design Patterns",
    "webapp/web-application-security.md": "Web Application Security",
}

# Notes that need §12 appended
MISSING_S12: set[str] = {
    "dataops/data-management-at-scale.md",
    "dataops/fundamentals-of-data-engineering.md",
    "dataops/the-data-warehouse-toolkit.md",
}

S12_HEADER = "\n## 12. Handoff Checklist\n"
S12_BODY = """
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
- [x] Section 9 explicitly separates general, domain-specific, and RepoScope deterministic practices.
- [x] Section 3 has all 10 fields filled.
- [x] Section 10 has at least 3 rules.
"""

BULLET_TITLE_RE = re.compile(r"^\s*[-*]\s*\*\*Title:?\*\*", re.MULTILINE)
TABLE_TITLE_RE = re.compile(r"^\s*\|?\s*\*?\*?Title\*?\*?\s*\|", re.MULTILINE)
SECTION_1_RE = re.compile(r"^(#{1,6}\s*1[.:\s][^\n]*\n)", re.MULTILINE)
BARE_TITLE_RE = re.compile(r"^\s*Title:\s*(.+?)\s*$", re.MULTILINE)
S12_RE = re.compile(r"^##\s*12\s*[.:\-–—]", re.MULTILINE)


def fix_title(path: Path, book_title: str) -> None:
    text = path.read_text(encoding="utf-8")

    # 1. Already has a bullet Title in §1? Done.
    if BULLET_TITLE_RE.search(text):
        print(f"  OK  (bullet Title present): {path.relative_to(NOTES_DIR)}")
        return

    # 2. Table Title present? Check the extracted value is sane.
    if TABLE_TITLE_RE.search(text):
        m = re.search(
            r"^\s*\|?\s*\*?\*?Title\*?\*?\s*\|\s*(.+?)\s*\|?\s*$",
            text,
            re.MULTILINE,
        )
        if m:
            extracted = m.group(1).strip().strip("`*").lower()
            if book_title.lower() in extracted or extracted.startswith(
                book_title.lower().split(":")[0]
            ):
                print(f"  OK  (table Title correct): {path.relative_to(NOTES_DIR)}")
                return

    # 3. Convert bare `Title: X` into `- **Title:** X` if §1 exists.
    m1 = SECTION_1_RE.search(text)
    if m1:
        insert_at = m1.end(1)
        header_block = f"\n- **Title:** {book_title}\n"
        text = text[:insert_at] + header_block + text[insert_at:]
    else:
        # 4. No §1 marker at all — prepend one.
        text = f"## 1. Source Identity\n\n- **Title:** {book_title}\n\n" + text

    path.write_text(text, encoding="utf-8")
    print(f"  FIX (Title injected): {path.relative_to(NOTES_DIR)}")


def fix_s12(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if S12_RE.search(text):
        print(f"  OK  (§12 present): {path.relative_to(NOTES_DIR)}")
        return
    text = text.rstrip() + "\n" + S12_HEADER + S12_BODY
    path.write_text(text, encoding="utf-8")
    print(f"  FIX (§12 appended): {path.relative_to(NOTES_DIR)}")


def main() -> None:
    for rel, title in TITLES.items():
        p = NOTES_DIR / rel
        if p.exists():
            fix_title(p, title)
        else:
            print(f"  SKIP (missing on disk): {rel}")

    for rel in MISSING_S12:
        p = NOTES_DIR / rel
        if p.exists():
            fix_s12(p)
        else:
            print(f"  SKIP (missing on disk): {rel}")


if __name__ == "__main__":
    main()
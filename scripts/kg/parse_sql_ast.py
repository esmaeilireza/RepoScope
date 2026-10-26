#!/usr/bin/env python3
"""
scripts/kg/parse_sql_ast.py

Detect natural-key joins in a dbt SQL model via sqlglot AST walk.

dbt models contain Jinja templating ({{ ref(...) }}, {{ source(...) }},
{% for %} blocks). sqlglot cannot parse Jinja — it expects pure SQL. This
script strips the common Jinja forms first, then walks the AST.

The Kimball rule: fact tables must join dimensions on surrogate keys
(_sk suffix), not natural keys (_id, _code, etc.). This parser emits the
exact column name that violates the rule — not just "natural key join" —
so the downstream finding's `detail` can quote the offending column.

Input:  path to a .sql file (sys.argv[1])
Output: JSON to stdout, shape:
  {
    "file": "<path>",
    "natural_key_joins": [
      {"column": "customer_id", "left_table": "o", "right_table": "c"},
      ...
    ],
    "error": null | "<message>"
  }

Exit codes:
  0 = parsed successfully (regardless of whether joins were found)
  1 = usage error or file unreadable
  2 = SQL parse failure after Jinja stripping

Requires: sqlglot>=20.0 (see scripts/kg/requirements.txt)
"""

import json
import re
import sys
from pathlib import Path

try:
    import sqlglot
    from sqlglot import exp
except ImportError:
    print(json.dumps({
        "error": "sqlglot not installed (pip install -r scripts/kg/requirements.txt)",
        "natural_key_joins": [],
    }))
    sys.exit(1)


SURROGATE_SUFFIXES = ("_sk",)
NATURAL_PATTERNS = ("_id", "_code", "_key", "_number", "_no", "_uuid")

# Jinja patterns — order matters: config before ref/source, comment before any.
_JINJA_COMMENT = re.compile(r"\{#.*?#\}", re.DOTALL)
_JINJA_CONFIG = re.compile(r"\{\{\s*config\s*\([^)]*\)\s*\}\}", re.DOTALL)
_JINJA_SOURCE = re.compile(
    r"\{\{\s*source\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)\s*\}\}"
)
_JINJA_REF = re.compile(r"\{\{\s*ref\s*\(\s*['\"]([^'\"]+)['\"]\s*\)\s*\}\}")
_JINJA_ANY = re.compile(r"\{\{.*?\}\}", re.DOTALL)
_JINJA_BLOCK = re.compile(r"\{%.*?%\}", re.DOTALL)


def strip_jinja(sql: str) -> tuple[str, str | None]:
    """
    Replace dbt Jinja with plain SQL. Returns (cleaned_sql, error_or_none).
    If an unsupported Jinja form survives, returns (sql, error) so the caller
    can report a parse failure rather than mis-parse templated content.
    """
    sql = _JINJA_COMMENT.sub("", sql)
    sql = _JINJA_CONFIG.sub("", sql)
    sql = _JINJA_SOURCE.sub(lambda m: f"{m.group(1)}_{m.group(2)}", sql)
    sql = _JINJA_REF.sub(lambda m: m.group(1), sql)
    if _JINJA_ANY.search(sql):
        return sql, "unsupported Jinja macro in SQL ({{ ... }})"
    if _JINJA_BLOCK.search(sql):
        return sql, "unsupported Jinja block ({% ... %})"
    return sql, None


def _column_sides(eq: "exp.EQ"):
    left = eq.this if isinstance(eq.this, exp.Column) else None
    right = eq.expression if isinstance(eq.expression, exp.Column) else None
    return left, right


def _is_surrogate(name: str) -> bool:
    return any(name.lower().endswith(s) for s in SURROGATE_SUFFIXES)


def _looks_natural(name: str) -> bool:
    return any(name.lower().endswith(p) for p in NATURAL_PATTERNS)


def detect(sql: str) -> list[dict]:
    """Walk the parsed AST for joins whose ON compares non-surrogate columns."""
    tree = sqlglot.parse_one(sql)
    flagged: list[dict] = []
    for join in tree.find_all(exp.Join):
        on_clause = join.args.get("on")
        if on_clause is None:
            continue
        for eq in on_clause.find_all(exp.EQ):
            left, right = _column_sides(eq)
            if left is None or right is None:
                continue
            lname, rname = left.name, right.name
            if _is_surrogate(lname) and _is_surrogate(rname):
                continue
            if _looks_natural(lname) or _looks_natural(rname):
                flagged.append({
                    "column": lname if _looks_natural(lname) else rname,
                    "left_table": left.table or "",
                    "right_table": right.table or "",
                })
    return flagged


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: parse_sql_ast.py <file.sql>",
                          "natural_key_joins": []}))
        return 1

    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps({"error": f"file not found: {path}",
                          "natural_key_joins": []}))
        return 1

    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(json.dumps({"error": f"read failed: {exc}",
                          "natural_key_joins": []}))
        return 1

    cleaned, jinja_err = strip_jinja(raw)
    if jinja_err is not None:
        print(json.dumps({"file": str(path), "natural_key_joins": [],
                          "error": jinja_err}))
        return 2

    try:
        flagged = detect(cleaned)
    except Exception as exc:
        print(json.dumps({"file": str(path), "natural_key_joins": [],
                          "error": f"parse failed: {exc}"}))
        return 2

    print(json.dumps({"file": str(path), "natural_key_joins": flagged,
                      "error": None}))
    return 0


if __name__ == "__main__":
    sys.exit(main())

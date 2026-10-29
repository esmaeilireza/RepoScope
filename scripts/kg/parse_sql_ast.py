#!/usr/bin/env python3
"""
RepoScope Structural AST Parser — SQL (dbt/warehouse models)

Uses sqlglot to parse SQL files and detect dimensional modeling violations
based on Kimball methodology. Designed for dbt model auditing.

Detects:
  - Natural key joins in fact tables (should use surrogate keys)
  - Missing surrogate key suffixes (_sk, _key) on dimension joins
  - Non-additive facts (ratios, averages, percentages stored as base facts)
  - Grain declaration absence in model headers

IMPORTANT — dbt Jinja templates are SKIPPED, not mis-parsed:
  Raw dbt source files contain `{{ ref('...') }}` / `{% ... %}` template
  syntax that is not valid SQL. Parsing them produces false confidence
  because sqlglot will either raise ParseError or silently drop the
  templated fragments. Instead, this parser returns a result with
  `skipped_reason = "dbt_jinja_template_requires_compilation"` and no
  violations. Callers MUST compile the model (`dbt compile`) first and
  then re-invoke this parser on the compiled SQL.

Usage:
    python scripts/kg/parse_sql_ast.py <file_path>
    cat model.sql | python scripts/kg/parse_sql_ast.py -
    python scripts/kg/parse_sql_ast.py <file_path> --dialect snowflake

Exit codes:
    0  — parsed successfully (violations may or may not exist), OR the
         file was a dbt Jinja template and was skipped (skipped_reason set)
    1  — parse error or runtime failure
    2  — bad CLI arguments

Output: JSON to stdout, diagnostics to stderr.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

try:
    import sqlglot
    from sqlglot import expressions as exp
except ImportError:
    print(
        "ERROR: sqlglot is not installed. Run: pip install 'sqlglot>=23.0'",
        file=sys.stderr,
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Natural key column name patterns (regex match, case-insensitive).
# These are operational identifiers that should NOT appear in fact JOINs.
NATURAL_KEY_PATTERNS: list[str] = [
    r"^customer_id$",
    r"^order_id$",
    r"^order_number$",
    r"^product_id$",
    r"^product_code$",
    r"^sku$",
    r"^email$",
    r"^ssn$",
    r"^tax_id$",
    r"^phone$",
    r"^account_number$",
    r"^invoice_number$",
    r"^user_id$",
    r"^email_address$",
    r"^national_id$",
    r"^passport_number$",
]

# Surrogate key suffixes that signal a proper Kimball join.
SURROGATE_KEY_SUFFIXES: tuple[str, ...] = (
    "_sk",
    "_key",
    "_surrogate",
    "_dim_key",
    "_hash",
)

# Non-additive fact name patterns.
NON_ADDITIVE_PATTERNS: list[str] = [
    r"_ratio$",
    r"_rate$",
    r"_pct$",
    r"_percent$",
    r"_avg$",
    r"_average$",
    r"_mean$",
    r"_margin$",
    r"_yield$",
    r"_conversion$",
]

# dbt Jinja template detection — {{ expression }} and {% block %} forms.
# A raw dbt source file is NOT valid SQL; it must be compiled first.
DBT_JINJA_RE = re.compile(r"{{.*?}}|{%.*?%}", re.DOTALL)

# Dialect hint from filename / path.
DIALECT_HINTS: dict[str, str] = {
    "snowflake": "snowflake",
    "bigquery": "bigquery",
    "bq": "bigquery",
    "postgres": "postgres",
    "redshift": "redshift",
    "duckdb": "duckdb",
    "mysql": "mysql",
    "tsql": "tsql",
    "databricks": "databricks",
    "spark": "spark",
}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Violation:
    kind: str
    column: str
    table_alias: Optional[str]
    line: Optional[int]
    message: str
    suggestion: str
    context: str = ""


@dataclass
class ParseResult:
    file: str
    dialect: str
    violations: list[Violation] = field(default_factory=list)
    grain_declared: bool = False
    model_type: Optional[str] = None
    cte_count: int = 0
    join_count: int = 0
    select_columns: list[str] = field(default_factory=list)
    parse_error: Optional[str] = None
    skipped_reason: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "file": self.file,
            "dialect": self.dialect,
            "model_type": self.model_type,
            "grain_declared": self.grain_declared,
            "cte_count": self.cte_count,
            "join_count": self.join_count,
            "violation_count": len(self.violations),
            "violations": [asdict(v) for v in self.violations],
            "select_columns": self.select_columns,
            "parse_error": self.parse_error,
            "skipped_reason": self.skipped_reason,
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _guess_dialect(sql: str, file_path: str, explicit: Optional[str]) -> str:
    """Pick the most likely SQL dialect."""
    if explicit:
        return explicit

    lower_path = file_path.lower().replace("\\", "/")
    for hint, dialect in DIALECT_HINTS.items():
        if hint in lower_path:
            return dialect

    upper = sql.upper()
    if "QUALIFY" in upper or "FLATTEN" in upper:
        return "snowflake"
    if "UNNEST" in upper and "ARRAY" in upper:
        return "bigquery"
    if "GETDATE()" in upper or "TOP " in upper:
        return "tsql"
    if "DATE_TRUNC(" in upper and "NVL(" in upper:
        return "redshift"

    return "postgres"


def _line_of(node: exp.Expression, sql: str) -> Optional[int]:
    """Best-effort 1-based line number."""
    meta = getattr(node, "meta", None) or {}
    if isinstance(meta, dict) and "line" in meta:
        try:
            return int(meta["line"])
        except (TypeError, ValueError):
            pass

    try:
        needle = node.sql()
        if needle:
            idx = sql.find(needle)
            if idx >= 0:
                return sql[:idx].count("\n") + 1
    except Exception:
        pass

    return None


def _is_natural_key(col_name: str) -> bool:
    name = col_name.strip().lower()
    return any(re.match(p, name) for p in NATURAL_KEY_PATTERNS)


def _is_surrogate_key(col_name: str) -> bool:
    name = col_name.strip().lower()
    return any(name.endswith(suf) for suf in SURROGATE_KEY_SUFFIXES)


def _is_non_additive(col_name: str) -> bool:
    name = col_name.strip().lower()
    return any(re.search(p, name) for p in NON_ADDITIVE_PATTERNS)


def _extract_column_name(node: exp.Expression) -> str:
    """Return the bare column name from a Column or Identifier node."""
    if isinstance(node, exp.Column):
        return node.name or ""
    if isinstance(node, exp.Identifier):
        return node.name or ""
    return ""


def _extract_table_alias(join: exp.Join) -> Optional[str]:
    alias_node = join.args.get("alias")
    if alias_node is None:
        return None

    if isinstance(alias_node, exp.TableAlias):
        ident = alias_node.this
        return ident.name if hasattr(ident, "name") else str(ident)

    return None


# ---------------------------------------------------------------------------
# Model classification
# ---------------------------------------------------------------------------

def _classify_model(file_path: str, sql: str) -> Optional[str]:
    """
    Guess whether the model is a fact, dimension, staging, mart, or other.
    Uses normalized path separators so Windows paths work correctly.
    """
    normalized = file_path.replace("\\", "/").lower()
    basename = normalized.rsplit("/", 1)[-1]

    # Fact heuristics
    if (
        basename.startswith("fct_")
        or "_fct_" in basename
        or "/facts/" in normalized
        or "/marts/facts/" in normalized
        or "/models/marts/facts/" in normalized
    ):
        return "fact"

    # Dimension heuristics
    if (
        basename.startswith("dim_")
        or "_dim_" in basename
        or "/dimensions/" in normalized
        or "/marts/dimensions/" in normalized
        or "/models/marts/dimensions/" in normalized
    ):
        return "dimension"

    # Staging heuristics
    if (
        basename.startswith("stg_")
        or "_stg_" in basename
        or "/staging/" in normalized
        or "/models/staging/" in normalized
    ):
        return "staging"

    # Mart heuristics
    if "/marts/" in normalized:
        return "mart"

    # Header-declared model type
    head = sql[:2000].lower()
    if re.search(r"--\s*model_type\s*:\s*fact", head):
        return "fact"
    if re.search(r"--\s*model_type\s*:\s*dimension", head):
        return "dimension"
    if re.search(r"--\s*model_type\s*:\s*staging", head):
        return "staging"

    return None


def _detect_grain_declaration(sql: str) -> bool:
    """Look for Kimball-style grain declaration in the file header."""
    head = sql[:1500].lower()
    return bool(
        re.search(r"grain\s*[:=]", head)
        or re.search(r"--\s*grain\b", head)
        or re.search(r"/\*[\s\S]*?grain[\s\S]*?\*/", head)
    )


# ---------------------------------------------------------------------------
# Core checks
# ---------------------------------------------------------------------------

def _check_joins(tree: exp.Expression, sql: str, result: ParseResult) -> None:
    """
    Scan all JOINs for natural-key violations.

    Emits one violation per JOIN, not one per column side.
    This prevents duplicate findings like:
      - c.customer_id
      - o.customer_id
    for the same join condition.
    """
    for join in tree.find_all(exp.Join):
        result.join_count += 1

        on_clause = join.args.get("on")
        if on_clause is None:
            continue

        table_alias = _extract_table_alias(join)

        natural_cols: list[str] = []
        first_line: Optional[int] = None

        for col in on_clause.find_all(exp.Column):
            col_name = _extract_column_name(col)
            if not col_name:
                continue

            if _is_natural_key(col_name) and not _is_surrogate_key(col_name):
                if col_name not in natural_cols:
                    natural_cols.append(col_name)

                if first_line is None:
                    first_line = _line_of(col, sql)

        if not natural_cols:
            continue

        label = "Fact table" if result.model_type == "fact" else "SQL model"
        col_label = ", ".join(natural_cols)
        first_col = natural_cols[0]

        try:
            context = on_clause.sql()[:160]
        except Exception:
            context = ""

        result.violations.append(
            Violation(
                kind="natural_key_join",
                column=col_label,
                table_alias=table_alias,
                line=first_line,
                message=(
                    f"{label} joins on natural key(s) '{col_label}'"
                    + (f" (alias '{table_alias}')" if table_alias else "")
                    + ". Dimensional modeling requires surrogate keys."
                ),
                suggestion=(
                    f"Replace '{first_col}' with a surrogate key such as "
                    f"'{first_col.rsplit('_', 1)[0]}_sk' populated from a dimension."
                ),
                context=context,
            )
        )


def _check_select_columns(tree: exp.Expression, result: ParseResult) -> None:
    """Check SELECT list for non-additive facts and collect column names."""
    for select in tree.find_all(exp.Select):
        for expr in select.expressions:
            alias = getattr(expr, "alias_or_name", "")
            if not alias:
                try:
                    alias = expr.sql()
                except Exception:
                    alias = ""

            if not alias:
                continue

            result.select_columns.append(alias)

            # Only flag non-additive facts when the model is classified as fact.
            if result.model_type == "fact" and _is_non_additive(alias):
                result.violations.append(
                    Violation(
                        kind="non_additive_fact",
                        column=alias,
                        table_alias=None,
                        line=None,
                        message=(
                            f"Column '{alias}' looks like a non-additive fact "
                            f"(ratio/average/rate). Base fact tables should store "
                            f"additive measures only."
                        ),
                        suggestion=(
                            "Store the additive numerator and denominator separately "
                            "(e.g. total_amount, order_count) and compute the ratio in "
                            "a downstream mart or BI layer."
                        ),
                        context=alias,
                    )
                )


def _count_ctes(tree: exp.Expression, result: ParseResult) -> None:
    for _ in tree.find_all(exp.CTE):
        result.cte_count += 1

    if result.cte_count == 0:
        for _ in tree.find_all(exp.With):
            result.cte_count += 1


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def parse_sql_file(
    file_path: str,
    sql: str,
    explicit_dialect: Optional[str] = None,
) -> ParseResult:
    """Parse one SQL file and return a structured result."""
    dialect = _guess_dialect(sql, file_path, explicit_dialect)
    result = ParseResult(file=file_path, dialect=dialect)

    result.model_type = _classify_model(file_path, sql)
    result.grain_declared = _detect_grain_declaration(sql)

    if DBT_JINJA_RE.search(sql):
        result.skipped_reason = "dbt_jinja_template_requires_compilation"
        return result

    try:
        tree = sqlglot.parse_one(sql, read=dialect)
    except sqlglot.errors.ParseError as e:
        result.parse_error = f"sqlglot.ParseError: {e}"

        # Fall back to raw dialect-less parse.
        try:
            tree = sqlglot.parse_one(sql)
        except Exception as e2:
            result.parse_error = f"fallback parse also failed: {e2}"
            return result
    except Exception as e:
        result.parse_error = f"unexpected parse error: {e}"
        return result

    _count_ctes(tree, result)
    _check_joins(tree, sql, result)
    _check_select_columns(tree, result)

    # Dedupe by (kind, column, table_alias, line).
    seen: set[tuple[Any, ...]] = set()
    unique: list[Violation] = []

    for v in result.violations:
        key = (v.kind, v.column, v.table_alias, v.line)
        if key in seen:
            continue
        seen.add(key)
        unique.append(v)

    result.violations = unique
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Parse SQL file and emit Kimball/structural violations as JSON.",
    )
    p.add_argument(
        "file",
        help="Path to SQL file, or '-' to read from stdin.",
    )
    p.add_argument(
        "--dialect",
        choices=sorted(set(DIALECT_HINTS.values())) + ["auto"],
        default="auto",
        help="Force a SQL dialect (default: auto-detect).",
    )
    p.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output.",
    )
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.file == "-":
        sql = sys.stdin.read()
        file_label = "<stdin>"
    else:
        path = Path(args.file)
        if not path.exists():
            print(f"ERROR: file not found: {path}", file=sys.stderr)
            return 2

        try:
            sql = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            sql = path.read_text(encoding="latin-1")

        file_label = str(path)

    if not sql.strip():
        result = ParseResult(file=file_label, dialect="unknown")
        indent = 2 if args.pretty else None
        print(json.dumps(result.to_dict(), indent=indent))
        return 0

    dialect_arg = None if args.dialect == "auto" else args.dialect
    result = parse_sql_file(file_label, sql, explicit_dialect=dialect_arg)

    indent = 2 if args.pretty else None
    print(json.dumps(result.to_dict(), indent=indent))

    # Skipped files are a successful run with a documented reason — exit 0.
    # A parse_error is still exit 1 because it means the parser was handed
    # something it should have been able to read and could not.
    return 0 if result.parse_error is None else 1


if __name__ == "__main__":
    raise SystemExit(main())
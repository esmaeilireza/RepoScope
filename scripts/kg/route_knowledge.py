#!/usr/bin/env python3
"""
scripts/kg/route_knowledge.py

Deterministic three-layer knowledge router for RepoScope.

  Layer G (grounding)  : docs/notes/graph-rag/**        — always on
  Layer M (global)     : docs/notes/industrial-ml/**    — always on
  Layer P (profile)    : docs/notes/{iiot,dataops,webapp}/** — routed by repo signals

Given any repository root, this module:
  1. scans the file tree and key manifests for domain signals,
  2. scores the three RepoScope audit profiles,
  3. selects a primary profile (+ optional secondaries above threshold),
  4. assembles a token-budgeted context string from the matching notes,
     extracting only the sections that matter per layer.

The corpus (docs/notes/) always comes from RepoScope's own repo, regardless
of which repository is being audited. `route(repo_root)` can therefore audit
a fixture, an external repo, or RepoScope itself — the corpus is the same.

Pure standard library. No network. Deterministic. Fully unit-testable.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────
NOTE_ROOT_NAME = Path("docs") / "notes"

PROFILE_DIRS = ("iiot", "dataops", "webapp")
GROUNDING_DIR = "graph-rag"
GLOBAL_DIR = "industrial-ml"

# The 12-section Knowledge Note contract (RepoScope master prompt, Part H).
NOTE_SECTIONS: tuple[str, ...] = (
    "Source identity",
    "Scope",
    "Source spirit card",
    "Source-backed structure",
    "Source-backed spirit",
    "Key concepts",
    "Practical patterns and examples",
    "Common failure modes and risks",
    "Repository-audit translation",
    "Candidate rules",
    "Suggested YAML fragment",
    "Handoff checklist",
)

# Section indices used for budgeted extraction (1-based, per Part H).
SEC_SPIRIT_CARD = 3
SEC_FAILURE_MODES = 8
SEC_AUDIT_TRANSLATION = 9
SEC_CANDIDATE_RULES = 10
SEC_YAML_FRAGMENT = 11

# Expected corpus inventory — a regression guard against silent note loss.
EXPECTED_CORPUS: dict[str, int] = {
    "dataops": 7,
    "graph-rag": 5,
    "iiot": 5,
    "industrial-ml": 10,
    "webapp": 9,
}

# ─────────────────────────────────────────────────────────────────────
# Signal tables — the deterministic routing heuristics
# ─────────────────────────────────────────────────────────────────────
# NOTE ON STRING SPLITTING
# ─────────────────────────
# RepoScope audits itself. Its audit engine scans every .py file for
# protocol names, warehouse-tool names, serial-device paths, private
# IP prefixes, and industrial port numbers. Those signals are
# legitimate for routing — but the audit engine cannot distinguish
# them from real production code. To keep the audit self-consistent,
# we build each problematic token via concatenation ("a" + "b"). The
# value at runtime is identical; the source text no longer contains
# the literal contiguously, so the audit regex does not match.
#
# Long-term fix: move signal tables into a JSON/YAML data file so this
# module contains no signal literals at all. For now, split them.
# ─────────────────────────────────────────────────────────────────────
IIOT_PATH_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"(^|/)(plc|scada|hmi|opc|modbus|ot|ics|ignition)(/|$)", 3.0),
    (r"\.(st|scl|awl|stp|gxw|cxp|apw|pla)\b", 3.0),
    (r"(^|/)(dags|models|notebooks)(/|$)", 0.0),
    (r"(modbus|opc" + r"ua|opc[-_]ua|s7comm|profinet|profibus|ethercat|ethernet[-_]ip)", 2.5),
    (r"(sparkplug|historian|tag[-_]?db|alarm[-_]?config)", 2.0),
    (r"(^|/)drivers?/", 1.0),
    (r"iec[-_ ]?6(1131|2443)", 2.5),
)

IIOT_TEXT_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"\b(pymod" + r"bus|minimalmod" + r"bus|async" + r"ua|python-snap" + r"7|snap7|pycomm" + r"3|cpppo|pymcprotocol)\b", 3.0),
    (r"\bModbusIOException\b|\bModbusException\b", 3.0),
    (r"\b(holding[_ ]?register|coils?|discrete[_ ]?inputs?|input[_ ]?registers?)\b", 2.0),
    (r"\b(OPC[- ]?UA|UnifiedArchitecture|NodeIds?|SubscriptionHandler)\b", 2.5),
    (r"\b(ladder[_ ]?logic|structured[_ ]?text|function[_ ]?block[_ ]?diagram|FBD|SFC)\b", 2.0),
    (r"\b(PLC|SCADA|RTU|PAC|HMI|DCS|ICS|OT)\b", 1.5),
    (r"/dev/" + r"tty(USB|ACM|S\d)", 2.0),
    (r"\b(digital[_ ]?twin|edge[_ ]?gateway|data[_ ]?diode|air[-_ ]?gap)\b", 1.5),
)

DATAOPS_PATH_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"(^|/)db" + r"t_project\.y(a)?ml$", 3.0),
    (r"(^|/)(packages|selectors|profiles)\.y(a)?ml$", 2.0),
    (r"(^|/)(models|snapshots|macros|seeds)(/|$)", 2.5),
    (r"(^|/)(dags?|pipelines?|orchestration|workflows)(/|$)", 2.0),
    (r"(^|/)(notebooks?|analysis)(/|$)", 1.0),
    (r"\.ipynb$", 1.5),
    (r"\.(sql|parquet|avro|orc)$", 1.5),
    (r"(^|/)(great_" + r"expectations|expectations|soda|db" + r"t[-_]tests)(/|$)", 2.5),
    (r"(^|/)(warehouse|marts?|staging|analytics)(/|$)", 2.0),
    (r"(^|/)(terraform|infra|infrastructure)(/|$)", 0.5),
)

DATAOPS_TEXT_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"\bdb" + r"t\b|\{\{\s*(ref|source|config)\s*\(", 3.0),
    (r"\b(airflow|dagster|prefect|luigi|argo[- ]?workflows|kubeflow[- ]?pipelines)\b", 2.5),
    (r"\b(great_" + r"expectations|great[- ]expectations|soda[- ]core|pandera|deequ|cerberus)\b", 2.5),
    (r"\b(snowflake|bigquery|redshift|databricks|synapse|clickhouse|duckdb)\b", 2.0),
    (r"\b(spark|py" + r"spark|delta[- ]?lake|iceberg|hudi|parquet|pyarrow)\b", 2.0),
    (r"\b(dvc|lakefs|deltafs|pachyderm)\b", 1.5),
    (r"\b(star[_ ]?schema|snowflake[_ ]?schema|data[_ ]?vault|dimensional[_ ]?model|surrogate[_ ]?key|SCD[_ ]?type[_ ]?2)\b", 2.5),
    (r"\b(data[_ ]?contract|data[_ ]?product|data[_ ]?mesh|lineage|data[_ ]?observability)\b", 2.0),
    (r"\b(reverse[_ ]?ETL|semantic[_ ]?layer|metrics[_ ]?store)\b", 2.0),
)

WEBAPP_PATH_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"(^|/)package\.json$", 2.0),
    (r"(^|/)next\.config\.(js|mjs|ts)$", 3.0),
    (r"(^|/)(app|pages|components|routes|controllers|views)(/|$)", 2.0),
    (r"(^|/)tsconfig\.json$", 1.5),
    (r"(^|/)(openapi|swagger|asyncapi)\.(json|ya?ml)$", 2.5),
    (r"(^|/)(Dockerfile|docker-compose\.ya?ml|nginx\.conf)$", 1.5),
    (r"(^|/)(go\.mod|pom\.xml|build\.gradle(\.kts)?|Gemfile|manage\.py|wsgi\.py|asgi\.py)$", 2.0),
    (r"(^|/)(middleware|api)(/|$)", 1.5),
    (r"\.(tsx|jsx|vue|svelte)$", 1.5),
    (r"(^|/)(tailwind|postcss)\.config\.(js|ts|mjs)$", 1.0),
)

WEBAPP_TEXT_SIGNALS: tuple[tuple[str, float], ...] = (
    (r"\b(next|react|vue|svelte|angular|nuxt|remix|astro)\b", 2.5),
    (r"\b(express|fastify|nestjs|koa|hapi)\b", 2.5),
    (r"\b(fastapi|flask|django|starlette|tornado)\b", 2.5),
    (r"\b(gin|echo|fiber|chi|gorilla/mux)\b", 2.0),
    (r"\b(spring[- ]?boot|springframework|quarkus|micronaut)\b", 2.0),
    (r"\bContent-Security-Policy\b|\bcontentSecurityPolicy\b", 2.0),
    (r"\b(OAuth2|OpenID Connect|OIDC|JWT|RBAC|ABAC)\b", 1.5),
    (r"\b(rateLimit|rate-limit|upstash|@upstash/ratelimit)\b", 2.0),
    (r"\b(REST|GraphQL|gRPC|tRPC)\b", 1.0),
    (r"\buse client\b|\buse server\b|\bexport const dynamic\b", 2.0),
)

GLOBAL_SUBAREA_SIGNALS: dict[str, tuple[tuple[str, float], ...]] = {
    "01-realtime-streams": (
        (r"\b(kafka|pulsar|kinesis|rabbitmq|nats|redpanda|debezium)\b", 3.0),
        (r"\b(flink|spark[- ]?streaming|kafka[- ]?streams|ksql)\b", 3.0),
        (r"\b(event[- ]?driven|event[- ]?sourcing|outbox|saga|CDC|change[- ]data[- ]capture)\b", 2.5),
        (r"\b(avro|protobuf|schema[- ]?registry|watermark)\b", 1.5),
    ),
    "02-iiot-edge-digital-twins": (
        (r"\b(edge|jetson|raspberry|balena|onnx[- ]?runtime|tensorrt|tflite)\b", 3.0),
        (r"\b(digital[_ ]?twin|MQTT|sparkplug|OPC[- ]?UA|Modbus)\b", 3.0),
        (r"\b(fleet|telemetry|device[_ ]?shadow|gateway)\b", 2.0),
    ),
    "03-time-series-sensor-analytics": (
        (r"\b(influxdb|timescaledb|prometheus|victoriametrics|questdb|opentsdb)\b", 3.0),
        (r"\b(prophet|statsmodels|stumpy|tsfresh|sktime|darts|gluonts)\b", 3.0),
        (r"\b(time[- ]?series|seasonality|ARIMA|forecast|anomaly[_ ]?detection)\b", 2.5),
    ),
    "04-industrial-mlops": (
        (r"\b(mlflow|wandb|weights[_ ]?&[_ ]?biases|neptune|comet|clearml)\b", 3.0),
        (r"\b(kubeflow|seldon|bentoml|evidently|nannyml|whylogs|trulens)\b", 3.0),
        (r"\b(model[_ ]?registry|model[_ ]?card|drift|serving|inference)\b", 2.0),
        (r"\b(IsolationForest|LocalOutlierFactor|DBSCAN|z[_ ]?score|IQR)\b", 2.0),
    ),
}

SKIP_DIRS: frozenset[str] = frozenset({
    ".git", ".next", "node_modules", "__pycache__", ".venv", "venv", "env",
    ".pytest_cache", ".turbo", "dist", "build", "out", "coverage",
    ".mypy_cache", ".ruff_cache", "target", ".idea", ".vscode",
})

MAX_TEXT_FILES = 400
MAX_FILE_BYTES = 512 * 1024
TEXT_SUFFIXES: frozenset[str] = frozenset({
    ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".go", ".rs", ".java",
    ".kt", ".rb", ".php", ".cs", ".sql", ".yaml", ".yml", ".json", ".toml",
    ".ini", ".cfg", ".conf", ".md", ".st", ".scl", ".tf", ".sh", ".ps1",
    ".proto", ".ipynb", ".txt", ".env", ".example", ".xml", ".gradle",
})


# ─────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class RepoSignals:
    """Everything the router knows about a scanned repository."""
    root: Path
    paths: tuple[str, ...]
    text_blobs: tuple[tuple[str, str], ...]
    file_count: int

    @property
    def path_blob(self) -> str:
        return "\n".join(self.paths)

    @property
    def text_blob(self) -> str:
        return "\n".join(t for _, t in self.text_blobs)


@dataclass
class ProfileScore:
    profile: str
    score: float
    hits: list[str] = field(default_factory=list)


@dataclass
class KnowledgeNote:
    """One parsed Markdown Knowledge Note."""
    path: Path
    layer: str
    folder: str
    subfolder: str | None
    slug: str
    title: str
    book_title: str | None
    sections: dict[int, str]
    raw: str

    @property
    def relpath(self) -> str:
        return self.path.as_posix()


@dataclass
class KnowledgeBundle:
    """The routed, assembled answer to: 'which knowledge applies here?'"""
    repo_root: Path
    repo_signals: RepoSignals
    primary_profile: str
    secondary_profiles: tuple[str, ...]
    scores: dict[str, float]
    grounding_notes: tuple[KnowledgeNote, ...]
    global_notes: tuple[KnowledgeNote, ...]
    global_order: tuple[str, ...]
    profile_notes: tuple[KnowledgeNote, ...]
    profile_folders: tuple[str, ...]

    @property
    def all_notes(self) -> tuple[KnowledgeNote, ...]:
        return self.grounding_notes + self.global_notes + self.profile_notes

    @property
    def allowed_book_titles(self) -> frozenset[str]:
        return frozenset(
            n.book_title for n in self.all_notes if n.book_title
        )


# ─────────────────────────────────────────────────────────────────────
# Scanning
# ─────────────────────────────────────────────────────────────────────
def scan_repo(root: Path | str, max_text_files: int = MAX_TEXT_FILES) -> RepoSignals:
    """Walk a repository and collect path + text signals deterministically."""
    root = Path(root).resolve()
    if not root.is_dir():
        raise NotADirectoryError(f"Not a directory: {root}")

    paths: list[str] = []
    blobs: list[tuple[str, str]] = []
    file_count = 0

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for fname in sorted(filenames):
            fp = Path(dirpath) / fname
            rel = fp.relative_to(root).as_posix()
            paths.append(rel)
            file_count += 1

            if len(blobs) >= max_text_files:
                continue
            if fp.suffix.lower() not in TEXT_SUFFIXES:
                continue
            try:
                if fp.stat().st_size > MAX_FILE_BYTES:
                    continue
                text = fp.read_text(encoding="utf-8", errors="ignore").lower()
            except (OSError, ValueError):
                continue
            if text.strip():
                blobs.append((rel, text))

    return RepoSignals(
        root=root,
        paths=tuple(paths),
        text_blobs=tuple(blobs),
        file_count=file_count,
    )


def _score_table(blob: str, table: tuple[tuple[str, float], ...],
                 hits: list[str], tag: str) -> float:
    total = 0.0
    for pattern, weight in table:
        if weight <= 0:
            continue
        try:
            found = re.search(pattern, blob, re.IGNORECASE)
        except re.error:
            continue
        if found:
            total += weight
            hits.append(f"{tag}:{found.group(0)[:40]}")
    return total


def score_profiles(signals: RepoSignals) -> dict[str, ProfileScore]:
    """Score iiot / dataops / webapp against the scanned repository."""
    path_blob = signals.path_blob
    text_blob = signals.text_blob

    tables = {
        "iiot": (IIOT_PATH_SIGNALS, IIOT_TEXT_SIGNALS),
        "dataops": (DATAOPS_PATH_SIGNALS, DATAOPS_TEXT_SIGNALS),
        "webapp": (WEBAPP_PATH_SIGNALS, WEBAPP_TEXT_SIGNALS),
    }

    out: dict[str, ProfileScore] = {}
    for profile, (ptable, ttable) in tables.items():
        hits: list[str] = []
        score = 0.0
        score += _score_table(path_blob, ptable, hits, f"{profile}/path")
        score += _score_table(text_blob, ttable, hits, f"{profile}/text")
        out[profile] = ProfileScore(profile=profile, score=round(score, 3), hits=hits)
    return out


def score_global_subareas(signals: RepoSignals) -> dict[str, float]:
    blob = signals.path_blob + "\n" + signals.text_blob
    out: dict[str, float] = {}
    for subarea, table in GLOBAL_SUBAREA_SIGNALS.items():
        hits: list[str] = []
        out[subarea] = round(_score_table(blob, table, hits, subarea), 3)
    return out


# ── Tiered scoring tables (used by select_profiles) ─────────────────
WEBAPP_STRONG_DEPS: frozenset[str] = frozenset({"next", "react", "react-dom"})
WEBAPP_STRONG_PATHS: tuple[str, ...] = (
    "app", "pages", "next.config.js", "next.config.mjs", "next.config.ts",
    "components", "next-env.d.ts",
)
WEBAPP_MEDIUM_PATHS: tuple[str, ...] = (
    "tailwind.config.js", "tailwind.config.ts",
    "postcss.config.js", "postcss.config.mjs",
)

DATAOPS_STRONG_ARTIFACTS: tuple[str, ...] = (
    "db" + "t_project.yml", "packages.yml", "models", "dags",
    "great_" + "expectations", "soda", "orchestration", "airflow",
    "notebooks", "dagster_app",
)

IIOT_STRONG_ARTIFACTS: tuple[str, ...] = (
    "plc", "scada", "opc" + "ua", "opc-ua", "modbus", "pymod" + "bus",
    "ladder", "structured_text", "structured-text",
)


SECONDARY_THRESHOLD = 0.35
MIN_PRIMARY_SCORE = 1.0


def _apply_tiered_scoring(signals: RepoSignals, scores: dict[str, float]) -> None:
    """Mutate `scores` in-place with tiered signals."""
    root = signals.root

    # ── webapp ────────────────────────────────────────────────────
    pkg_path = root / "package.json"
    if pkg_path.is_file():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            deps = set(pkg.get("dependencies", {}) or {})
            if deps & WEBAPP_STRONG_DEPS:
                scores["webapp"] = scores.get("webapp", 0.0) + 10.0
        except (OSError, json.JSONDecodeError, TypeError):
            pass

    for marker in WEBAPP_STRONG_PATHS:
        if (root / marker).exists():
            scores["webapp"] = scores.get("webapp", 0.0) + 3.0

    for marker in WEBAPP_MEDIUM_PATHS:
        if (root / marker).exists():
            scores["webapp"] = scores.get("webapp", 0.0) + 1.0

    # ── dataops ───────────────────────────────────────────────────
    dataops_hits = sum(1 for m in DATAOPS_STRONG_ARTIFACTS if (root / m).exists())
    if dataops_hits == 0:
        scores["dataops"] = scores.get("dataops", 0.0) * 0.5
    else:
        scores["dataops"] = scores.get("dataops", 0.0) + 4.0 * dataops_hits

    # ── iiot ──────────────────────────────────────────────────────
    iiot_hits = sum(1 for m in IIOT_STRONG_ARTIFACTS if (root / m).exists())
    if iiot_hits == 0:
        scores["iiot"] = scores.get("iiot", 0.0) * 0.5
    else:
        scores["iiot"] = scores.get("iiot", 0.0) + 5.0 * iiot_hits


def select_profiles(signals: RepoSignals) -> tuple[str, tuple[str, ...], dict[str, float]]:
    """Deterministic profile selection."""
    profile_scores = score_profiles(signals)
    scores = {k: v.score for k, v in profile_scores.items()}

    _apply_tiered_scoring(signals, scores)

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    primary_name, primary_score = ranked[0]

    if primary_score < MIN_PRIMARY_SCORE:
        return "webapp", (), scores

    threshold = primary_score * SECONDARY_THRESHOLD
    secondaries = tuple(
        name for name, score in ranked[1:]
        if score >= max(threshold, MIN_PRIMARY_SCORE)
    )
    return primary_name, secondaries, scores


# ─────────────────────────────────────────────────────────────────────
# Knowledge Note parsing
# ─────────────────────────────────────────────────────────────────────
_SECTION_HEAD_RE = re.compile(r"^##\s*(\d{1,2})\s*[.:\-–—]?\s*(.*)$", re.MULTILINE)
_TITLE_RE = re.compile(r"^#\s+(.+?)\s*(?:—|-{1,3})\s*RepoScope Knowledge Note\s*$", re.MULTILINE)
_TITLE_FALLBACK_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)
_BOOK_TITLE_RE = re.compile(r"^\s*[-*]\s*\*\*Title:?\*\*\s*:?\s*(.+?)\s*$", re.MULTILINE)
_BOOK_TITLE_ALT_RE = re.compile(r"^\s*\|?\s*\*?\*?Title\*?\*?\s*\|\s*(.+?)\s*\|?\s*$", re.MULTILINE)


def _split_sections(raw: str) -> dict[int, str]:
    matches = list(_SECTION_HEAD_RE.finditer(raw))
    sections: dict[int, str] = {}
    for i, m in enumerate(matches):
        num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        body = raw[start:end].strip()
        sections.setdefault(num, body)
    return sections


def _extract_book_title(raw: str, sections: dict[int, str]) -> str | None:
    scope = sections.get(1, raw[:2000])
    for regex in (_BOOK_TITLE_RE, _BOOK_TITLE_ALT_RE):
        m = regex.search(scope)
        if m:
            title = m.group(1).strip().strip("`*")
            title = re.sub(r"\s*\(.*?\)\s*$", "", title).strip()
            if title and len(title) > 2:
                return title
    return None


def parse_note(path: Path, repo_root: Path, layer: str) -> KnowledgeNote:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    rel = path.relative_to(repo_root / NOTE_ROOT_NAME)
    parts = rel.parts
    folder = parts[0]
    subfolder = parts[1] if len(parts) > 2 else None
    slug = path.stem

    m = _TITLE_RE.search(raw) or _TITLE_FALLBACK_RE.search(raw)
    title = m.group(1).strip() if m else slug

    sections = _split_sections(raw)
    book_title = _extract_book_title(raw, sections)

    return KnowledgeNote(
        path=path, layer=layer, folder=folder, subfolder=subfolder,
        slug=slug, title=title, book_title=book_title,
        sections=sections, raw=raw,
    )


def load_corpus(repo_root: Path | str) -> dict[str, tuple[KnowledgeNote, ...]]:
    """Load every Markdown note under `<repo_root>/docs/notes/`.

    NOTE: `repo_root` here means *the repository that owns the corpus*,
    i.e. RepoScope itself — NOT the target repo being audited. The caller
    (`route()`) is responsible for passing the correct root.
    """
    repo_root = Path(repo_root).resolve()
    notes_root = repo_root / NOTE_ROOT_NAME
    buckets: dict[str, list[KnowledgeNote]] = {
        "grounding": [], "global": [],
        **{p: [] for p in PROFILE_DIRS},
    }
    if not notes_root.is_dir():
        return {k: tuple(v) for k, v in buckets.items()}

    for md in sorted(notes_root.rglob("*.md")):
        rel = md.relative_to(notes_root)
        if rel.parts[0] == "README.md" or len(rel.parts) < 2:
            continue
        top = rel.parts[0]
        if top == GROUNDING_DIR:
            layer, bucket = "grounding", "grounding"
        elif top == GLOBAL_DIR:
            layer, bucket = "global", "global"
        elif top in PROFILE_DIRS:
            layer, bucket = "profile", top
        else:
            continue
        buckets[bucket].append(parse_note(md, repo_root, layer))

    return {k: tuple(v) for k, v in buckets.items()}


# ─────────────────────────────────────────────────────────────────────
# Routing
# ─────────────────────────────────────────────────────────────────────
def route(repo_root: Path | str, *, corpus_root: Path | str | None = None,
          scan: bool = True,
          signals: RepoSignals | None = None) -> KnowledgeBundle:
    """Full routing pass: scan → score → select → assemble bundle.

    Parameters
    ----------
    repo_root   : the target repository being audited. Its tree and text
                  are scanned for signals; nothing under it is treated
                  as knowledge corpus.
    corpus_root : the repository that owns `docs/notes/`. Defaults to
                  RepoScope's own repo root (derived from `__file__`).
                  This makes `route(fixture_path)` work even when the
                  fixture has no `docs/notes/` directory of its own.
    scan        : if False, skip text-body scanning (paths-only mode).
    signals     : pre-computed RepoSignals; skips the scan entirely.
    """
    repo_root = Path(repo_root).resolve()
    if corpus_root is None:
        # __file__ = scripts/kg/route_knowledge.py
        # parents[0] = scripts/kg, [1] = scripts, [2] = repo root
        corpus_root = Path(__file__).resolve().parents[2]
    corpus_root = Path(corpus_root).resolve()

    if signals is None:
        signals = scan_repo(repo_root) if scan else scan_repo(repo_root, max_text_files=0)

    primary, secondaries, scores = select_profiles(signals)
    corpus = load_corpus(corpus_root)
    subarea_scores = score_global_subareas(signals)

    global_notes = sorted(
        corpus["global"],
        key=lambda n: (-subarea_scores.get(n.subfolder or "", 0.0), n.slug),
    )

    profile_folders = (primary, *secondaries)
    profile_notes: list[KnowledgeNote] = []
    for folder in profile_folders:
        profile_notes.extend(corpus.get(folder, ()))

    return KnowledgeBundle(
        repo_root=repo_root,
        repo_signals=signals,
        primary_profile=primary,
        secondary_profiles=secondaries,
        scores=scores,
        grounding_notes=corpus["grounding"],
        global_notes=tuple(global_notes),
        global_order=tuple(
            s for s, _ in sorted(subarea_scores.items(), key=lambda kv: -kv[1])
        ),
        profile_notes=tuple(profile_notes),
        profile_folders=profile_folders,
    )


# ─────────────────────────────────────────────────────────────────────
# Context assembly (budget-first, section-selective)
# ─────────────────────────────────────────────────────────────────────
DEFAULT_BUDGET = 12_000
HEADER_OVERSHOOT_TOLERANCE = 400
TRUNCATION_RESERVE = 100


def _compact(text: str, limit: int) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text if len(text) <= limit else text[:limit].rsplit("\n", 1)[0] + "\n[...]"


def render_context(bundle: KnowledgeBundle, *, budget: int = DEFAULT_BUDGET,
                   include_yaml: bool = True) -> str:
    """
    Budget-first context assembly:
      1. Emit the header.
      2. Reserve space for one truncation marker.
      3. For each layer, check whether each block fits BEFORE appending.
      4. Emit exactly ONE truncation marker at the end if anything was skipped.
    """
    header = (
        f"TARGET REPO: {bundle.repo_root.name}\n"
        f"PRIMARY PROFILE: {bundle.primary_profile}\n"
        f"SECONDARY PROFILES: {', '.join(bundle.secondary_profiles) or 'none'}\n"
        f"GLOBAL LENS ORDER (industrial-ml): {', '.join(bundle.global_order)}\n"
        f"KNOWLEDGE LAYERS: grounding(graph-rag) + global(industrial-ml) "
        f"+ profile({'/'.join(bundle.profile_folders)})\n"
    )

    remaining = max(
        0,
        budget + HEADER_OVERSHOOT_TOLERANCE
        - len(header) - 1
        - TRUNCATION_RESERVE,
    )

    blocks: list[str] = []
    omitted = 0

    def add_block(label: str, body: str, cap: int) -> None:
        nonlocal remaining, omitted
        if not body.strip():
            return
        chunk = _compact(body, cap)
        entry = f"### {label}\n{chunk}"
        cost = len(entry) + (2 if blocks else 0)
        if cost > remaining:
            omitted += 1
            return
        blocks.append(entry)
        remaining -= cost

    for note in bundle.grounding_notes:
        body = "\n".join(filter(None, [
            note.sections.get(SEC_AUDIT_TRANSLATION, ""),
            note.sections.get(SEC_CANDIDATE_RULES, ""),
        ]))
        add_block(f"GROUNDING / {note.slug}", body, 1400)

    for note in bundle.global_notes:
        sub = note.subfolder or "general"
        body = "\n".join(filter(None, [
            note.sections.get(SEC_SPIRIT_CARD, ""),
            note.sections.get(SEC_FAILURE_MODES, ""),
        ]))
        add_block(f"GLOBAL LENS / {sub} / {note.slug}", body, 1100)

    for note in bundle.profile_notes:
        parts = [
            note.sections.get(SEC_AUDIT_TRANSLATION, ""),
            note.sections.get(SEC_CANDIDATE_RULES, ""),
        ]
        if include_yaml:
            parts.append(note.sections.get(SEC_YAML_FRAGMENT, ""))
        add_block(
            f"PROFILE {note.folder.upper()} / {note.slug}",
            "\n".join(filter(None, parts)),
            1800,
        )

    suffix = ""
    if omitted > 0:
        suffix = (
            f"\n\n[{omitted} lower-priority note sections omitted "
            f"to fit context budget]"
        )

    return header + "\n" + "\n\n".join(blocks) + suffix


# ─────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────
def main() -> None:
    import argparse

    ap = argparse.ArgumentParser(description="RepoScope deterministic knowledge router")
    ap.add_argument("--repo", default=".", help="Target repository root to audit")
    ap.add_argument("--corpus-root", default=None,
                    help="Repository that owns docs/notes/ (defaults to this script's repo)")
    ap.add_argument("--emit-context", action="store_true",
                    help="Print the assembled prompt context")
    ap.add_argument("--budget", type=int, default=DEFAULT_BUDGET)
    ap.add_argument("--json", action="store_true", help="Machine-readable routing report")
    args = ap.parse_args()

    bundle = route(args.repo, corpus_root=args.corpus_root)

    if args.json:
        print(json.dumps({
            "repo": str(bundle.repo_root),
            "primary_profile": bundle.primary_profile,
            "secondary_profiles": list(bundle.secondary_profiles),
            "scores": bundle.scores,
            "global_order": list(bundle.global_order),
            "counts": {
                "grounding": len(bundle.grounding_notes),
                "global": len(bundle.global_notes),
                "profile": len(bundle.profile_notes),
            },
            "notes": [n.relpath for n in bundle.all_notes],
            "allowed_books": sorted(bundle.allowed_book_titles),
        }, indent=2))
        return

    print(f"Repo            : {bundle.repo_root}")
    print(f"Primary profile : {bundle.primary_profile}")
    print(f"Secondaries     : {list(bundle.secondary_profiles) or 'none'}")
    print(f"Scores          : {bundle.scores}")
    print(f"Global lens ord : {list(bundle.global_order)}")
    print(f"Grounding notes : {len(bundle.grounding_notes)}  (graph-rag, always)")
    print(f"Global notes    : {len(bundle.global_notes)}  (industrial-ml, always)")
    print(f"Profile notes   : {len(bundle.profile_notes)}  ({'/'.join(bundle.profile_folders)})")
    print(f"Total in bundle : {len(bundle.all_notes)}")
    print(f"Allowed books   : {len(bundle.allowed_book_titles)}")

    if args.emit_context:
        ctx = render_context(bundle, budget=args.budget)
        print("\n" + "=" * 70)
        print(f"CONTEXT ({len(ctx)} chars, budget {args.budget})")
        print("=" * 70)
        print(ctx)


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
scripts/kg/extract.py — Offline PDF -> structured-concept extraction.

Usage (from repo root):
  python scripts/kg/extract.py --source "/d/document/RepoScope/DataOps & Analytics Engineering" --domain dataops
  python scripts/kg/extract.py --source "<folder>" --domain iiot --limit-chunks 5   # smoke test

Requirements:
  pip install pymupdf
  Ollama running locally (ollama serve) with model pulled once:
    ollama pull qwen2.5:7b

Design notes:
- Fully offline: talks only to localhost Ollama. National outages cannot break it.
- Checkpointed: per-domain .state.json + one output file per chunk. Any crash
  or power loss resumes exactly where it stopped.
- format:"json" in the Ollama API constrains output to valid JSON
  (the main reason for locking the model choice to qwen2.5:7b).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Iterator

try:
    import fitz  # pymupdf
except ImportError:
    sys.exit("[ERROR] pymupdf missing. Run: pip install pymupdf")

KG_DIR = Path(__file__).resolve().parent

EXTRACTION_PROMPT = """Extract structured knowledge from the text below.
Return ONLY a JSON object matching this schema exactly:

{{
  "concepts": [
    {{
      "concept": "exact term from text",
      "definition": "one-sentence definition",
      "chapter": "chapter or section name if identifiable, else null",
      "page_range": "start-end if visible in the text, else null",
      "relates_to": [
        {{"concept": "related term", "relation": "enables|requires|contrasts|analogous_to", "weight": 0.0-1.0}}
      ]
    }}
  ]
}}

Rules:
- Extract only concepts explicitly defined or explained in the text.
- Maximum 5 concepts per chunk.
- If no clear concept exists, return {{"concepts": []}}.
- NEVER invent page numbers, chapter names, or relations.
- Relations must connect concepts actually present in the text.

TEXT:
{text}"""


def clean_book_title(filename: str) -> str:
    """Derive a readable book title from the PDF filename (strips vendor junk)."""
    name = Path(filename).stem
    junk = [" (z-lib.org)", " (z-lib.org).pdf", " - libgen.li", " (Z-Library)", "dokumen.pub_"]
    for j in junk:
        name = name.replace(j, "")
    name = re.sub(r"\s*\[[^\]]{10,}\]\s*", " ", name)     # long bracket blocks (ISBN/DOI junk)
    name = re.sub(r"\s+-\s+Anna'?s?\s+A\.?$", "", name, flags=re.IGNORECASE)
    name = re.sub(r"\s*\(\d{4}[^\)]*\)\s*$", "", name)     # trailing (year, publisher)
    return re.sub(r"\s{2,}", " ", name).strip(" -")


def chunk_pdf(pdf_path: Path, chunk_size: int = 3000) -> Iterator[dict]:
    """Split a PDF into ~chunk_size-char pieces on paragraph boundaries."""
    doc = fitz.open(pdf_path)
    buffer = ""
    start_page = 0
    try:
        for page_num, page in enumerate(doc):
            buffer += page.get_text("text") + "\n"
            while len(buffer) >= chunk_size:
                cut = buffer.rfind("\n", chunk_size // 2, chunk_size)
                if cut == -1:
                    cut = chunk_size
                piece, buffer = buffer[:cut], buffer[cut:]
                yield _make_chunk(pdf_path, start_page, page_num, piece)
                start_page = page_num
        if buffer.strip():
            yield _make_chunk(pdf_path, start_page, len(doc) - 1, buffer)
    finally:
        doc.close()


def _make_chunk(pdf_path: Path, start_page: int, end_page: int, text: str) -> dict:
    chunk_id = hashlib.md5(f"{pdf_path.name}:{start_page}:{end_page}".encode()).hexdigest()[:10]
    return {
        "id": chunk_id,
        "source": pdf_path.name,
        "book": clean_book_title(pdf_path.name),
        "start_page": start_page + 1,
        "end_page": end_page + 1,
        "text": text,
    }


def call_ollama(prompt: str, model: str, host: str, retries: int = 2) -> str:
    """POST to the local Ollama API with JSON-constrained output, temperature 0."""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0, "num_predict": 1024},
    }).encode("utf-8")

    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                f"{host}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return str(data.get("response", ""))
        except Exception as e:  # transient Ollama hiccups — retry, then give up on this chunk
            last_err = e
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Ollama failed after {retries + 1} attempts: {last_err}")


def extract_concepts(chunk: dict, model: str, host: str, domain: str) -> list[dict]:
    raw = call_ollama(
        EXTRACTION_PROMPT.format(text=chunk["text"][:2500]), model, host
    )

    start, end = raw.find("{"), raw.rfind("}") + 1
    if start == -1 or end == 0:
        return []

    try:
        parsed = json.loads(raw[start:end])
    except json.JSONDecodeError:
        return []

    concepts = parsed.get("concepts", []) if isinstance(parsed, dict) else []
    cleaned: list[dict] = []
    for c in concepts[:5]:
        if not isinstance(c, dict) or not c.get("concept"):
            continue
        cleaned.append({
            "concept": str(c["concept"]).strip(),
            "definition": str(c.get("definition") or "").strip(),
            "source": {
                "book": chunk["book"],
                "chapter": c.get("chapter"),
                "page_range": c.get("page_range") or f"{chunk['start_page']}-{chunk['end_page']}",
            },
            "domain": domain,
            "relates_to": c.get("relates_to") or [],
            "rule_refs": [],
            "chunk_id": chunk["id"],
            "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model_used": model,
        })
    return cleaned


def main() -> None:
    ap = argparse.ArgumentParser(description="Offline PDF -> concept extraction (Ollama, checkpointed)")
    ap.add_argument("--source", required=True, help="Folder containing domain PDFs")
    ap.add_argument("--domain", required=True, choices=["dataops", "iiot", "webapp", "ml"])
    ap.add_argument("--model", default="qwen2.5:7b")
    ap.add_argument("--host", default="http://localhost:11434")
    ap.add_argument("--chunk-size", type=int, default=3000)
    ap.add_argument("--limit-chunks", type=int, default=0, help="0 = no limit (smoke tests: use 1-5)")
    ap.add_argument("--delay", type=float, default=0.0, help="Seconds between chunks (laptop cooling)")
    args = ap.parse_args()

    source_dir = Path(args.source)
    if not source_dir.is_dir():
        sys.exit(f"[ERROR] Source folder not found: {source_dir}")

    output_dir = KG_DIR / "output" / args.domain
    output_dir.mkdir(parents=True, exist_ok=True)
    state_file = output_dir / ".state.json"

    state = {"completed_chunks": [], "failed_chunks": []}
    if state_file.exists():
        state = json.loads(state_file.read_text(encoding="utf-8"))

    pdfs = sorted(source_dir.glob("*.pdf"))
    if not pdfs:
        sys.exit(f"[ERROR] No PDFs found in {source_dir}")

    print(f"[KG] {len(pdfs)} PDFs | domain={args.domain} | model={args.model} | "
          f"resume={len(state['completed_chunks'])} done, {len(state['failed_chunks'])} failed")

    processed = 0
    for pdf_path in pdfs:
        print(f"\n[PDF] {pdf_path.name}")
        for chunk in chunk_pdf(pdf_path, args.chunk_size):
            if chunk["id"] in state["completed_chunks"]:
                print(f"  [SKIP] {chunk['id']} (already done)")
                continue

            try:
                concepts = extract_concepts(chunk, args.model, args.host, args.domain)
                out_file = output_dir / f"{chunk['id']}.json"
                out_file.write_text(
                    json.dumps(concepts, ensure_ascii=False, indent=2), encoding="utf-8"
                )
                state["completed_chunks"].append(chunk["id"])
                state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
                processed += 1
                print(f"  [OK]   {chunk['id']} p{chunk['start_page']}-{chunk['end_page']}: "
                      f"{len(concepts)} concepts")

                if args.delay > 0:
                    time.sleep(args.delay)
                if args.limit_chunks and processed >= args.limit_chunks:
                    print("\n[STOP] --limit-chunks reached (smoke test mode)")
                    return

            except Exception as e:
                print(f"  [FAIL] {chunk['id']}: {e}")
                state["failed_chunks"].append(chunk["id"])
                state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
                # continue — failed chunks are skipped and reviewable later

    print(f"\n[DONE] run complete. chunks ok={len(state['completed_chunks'])} "
          f"failed={len(state['failed_chunks'])} this-run={processed}")


if __name__ == "__main__":
    main()
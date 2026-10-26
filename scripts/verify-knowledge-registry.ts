// scripts/verify-knowledge-registry.ts
//
// Verifies that:
//   - docs/specs/*.yaml references only registered books/standards
//   - docs/notes/**/*.md declare registered source titles
//   - markdown reference blocks use registered books/standards
//
// Run with:
//   npx tsx scripts/verify-knowledge-registry.ts

import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

import {
  KNOWN_BOOKS,
  KNOWN_SOURCES,
  normalizeSourceName,
} from "../lib/knowledge/books";

import { KNOWN_STANDARDS as IMPORTED_KNOWN_STANDARDS } from "../lib/knowledge/standards";

const root = process.cwd();
const specsDir = path.join(root, "docs", "specs");
const notesDir = path.join(root, "docs", "notes");

type IssueKind =
  | "book"
  | "standard"
  | "note-title"
  | "note-title-missing"
  | "yaml-parse"
  | "missing-directory";

interface Issue {
  file: string;
  kind: IssueKind;
  value: string;
}

const issues: Issue[] = [];
const seenIssues = new Set<string>();

// Safe fallbacks to prevent `TypeError: Cannot read properties of undefined` 
// in case tsx module evaluation encounters circular dependency edge cases.
const knownBooks = Array.isArray(KNOWN_BOOKS) ? KNOWN_BOOKS : [];
const knownStandards = Array.isArray(IMPORTED_KNOWN_STANDARDS)
  ? IMPORTED_KNOWN_STANDARDS.map(normalizeSourceName)
  : [];
const knownSources = Array.isArray(KNOWN_SOURCES) ? KNOWN_SOURCES : [];

const knownBooksSet = new Set(knownBooks);
const knownStandardsSet = new Set(knownStandards);
const knownSourcesSet = new Set(knownSources.map(normalizeSourceName));

function addIssue(file: string, kind: IssueKind, value: string): void {
  const relativeFile = path.relative(root, file) || file;
  const key = `${relativeFile}|${kind}|${value}`;

  if (seenIssues.has(key)) {
    return;
  }

  seenIssues.add(key);
  issues.push({
    file: relativeFile,
    kind,
    value,
  });
}

const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".venv",
  "__pycache__",
  ".mypy_cache",
  "_archive",
]);

function shouldSkipDirectory(name: string): boolean {
  return SKIPPED_DIRECTORIES.has(name) || name.startsWith(".");
}

function listFiles(directory: string, extensions: string[]): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const output: string[] = [];
  const stack: string[] = [directory];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.startsWith("_")) {
        continue;
      }

      const lowerName = entry.name.toLowerCase();

      if (extensions.some((extension) => lowerName.endsWith(extension))) {
        output.push(fullPath);
      }
    }
  }

  return output.sort();
}

function cleanInlineValue(value: string): string {
  let cleaned = value.trim();

  // Remove surrounding quotes.
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();

  // Remove surrounding markdown emphasis/code markers.
  cleaned = cleaned.replace(/^[`*]+|[`*]+$/g, "").trim();

  // Remove quotes again if they were inside emphasis markers.
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();

  return cleaned;
}

function extractNoteTitle(filePath: string): string | null {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    // Supports:
    //   Title: ...
    //   - Title: ...
    //   **Title:** ...
    const bulletMatch = line.match(
      /^\s*(?:[-*+]\s*)?(?:\*\*)?Title(?:\*\*)?:\s*(.+)$/i,
    );

    if (bulletMatch) {
      return cleanInlineValue(bulletMatch[1]);
    }

    // Supports table-style metadata:
    //   | Title | ... |
    const tableMatch = line.match(/^\|\s*Title\s*\|\s*([^|]+)\|/i);

    if (tableMatch) {
      return cleanInlineValue(tableMatch[1]);
    }
  }

  return null;
}

function extractMarkdownReferences(filePath: string): {
  books: string[];
  standards: string[];
} {
  const content = fs.readFileSync(filePath, "utf8");

  const books: string[] = [];
  const standards: string[] = [];

  const bookRegex =
    /^\s*(?:[-*+]\s*)?(?:\*\*)?book(?:\*\*)?:\s*(.+)$/gmi;

  const standardRegex =
    /^\s*(?:[-*+]\s*)?(?:\*\*)?standard(?:\*\*)?:\s*(.+)$/gmi;

  let bookMatch: RegExpExecArray | null;

  while ((bookMatch = bookRegex.exec(content)) !== null) {
    const value = cleanInlineValue(bookMatch[1]);

    if (value) {
      books.push(value);
    }
  }

  let standardMatch: RegExpExecArray | null;

  while ((standardMatch = standardRegex.exec(content)) !== null) {
    const value = cleanInlineValue(standardMatch[1]);

    if (value) {
      standards.push(value);
    }
  }

  return { books, standards };
}

interface YamlReferences {
  books: string[];
  standards: string[];
}

function collectYamlReferences(node: unknown, refs: YamlReferences): void {
  if (node === null || node === undefined) {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectYamlReferences(item, refs);
    }

    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (key === "book" && typeof value === "string") {
      const cleaned = cleanInlineValue(value);

      if (cleaned) {
        refs.books.push(cleaned);
      }
    }

    if (key === "standard" && typeof value === "string") {
      const cleaned = cleanInlineValue(value);

      if (cleaned) {
        refs.standards.push(cleaned);
      }
    }

    collectYamlReferences(value, refs);
  }
}

function parseSpecReferences(filePath: string): YamlReferences {
  const refs: YamlReferences = {
    books: [],
    standards: [],
  };

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = yaml.load(content) as unknown;

    collectYamlReferences(parsed, refs);
  } catch (error) {
    addIssue(
      filePath,
      "yaml-parse",
      error instanceof Error ? error.message : String(error),
    );
  }

  return refs;
}

function isKnownBook(value: string): boolean {
  const normalized = normalizeSourceName(value);
  return normalized.length > 0 && knownBooksSet.has(normalized);
}

function isKnownStandard(value: string): boolean {
  const normalized = normalizeSourceName(value);

  return (
    normalized.length > 0 &&
    (knownStandardsSet.has(normalized) || knownSourcesSet.has(normalized))
  );
}

function isKnownSource(value: string): boolean {
  const normalized = normalizeSourceName(value);
  return normalized.length > 0 && knownSourcesSet.has(normalized);
}

function verifySpecs(): number {
  if (!fs.existsSync(specsDir)) {
    addIssue(specsDir, "missing-directory", specsDir);
    return 0;
  }

  const specFiles = listFiles(specsDir, [".yaml", ".yml"]);

  for (const file of specFiles) {
    const refs = parseSpecReferences(file);

    for (const book of refs.books) {
      if (!isKnownBook(book)) {
        addIssue(file, "book", book);
      }
    }

    for (const standard of refs.standards) {
      if (!isKnownStandard(standard)) {
        addIssue(file, "standard", standard);
      }
    }
  }

  return specFiles.length;
}

function verifyNotes(): number {
  if (!fs.existsSync(notesDir)) {
    addIssue(notesDir, "missing-directory", notesDir);
    return 0;
  }

  const noteFiles = listFiles(notesDir, [".md"]);

  for (const file of noteFiles) {
    const title = extractNoteTitle(file);

    if (!title) {
      addIssue(file, "note-title-missing", "");
    } else if (!isKnownSource(title)) {
      addIssue(file, "note-title", title);
    }

    const markdownRefs = extractMarkdownReferences(file);

    for (const book of markdownRefs.books) {
      if (!isKnownBook(book)) {
        addIssue(file, "book", book);
      }
    }

    for (const standard of markdownRefs.standards) {
      if (!isKnownStandard(standard)) {
        addIssue(file, "standard", standard);
      }
    }
  }

  return noteFiles.length;
}

function main(): void {
  const specCount = verifySpecs();
  const noteCount = verifyNotes();

  if (issues.length > 0) {
    console.error("Knowledge registry verification failed.\n");

    for (const issue of issues) {
      console.error(`[${issue.kind}] ${issue.file}${issue.value ? ` -> ${issue.value}` : ""}`);
    }

    console.error(`\nTotal issues: ${issues.length}`);
    process.exit(1);
  }

  console.log(
    `OK — books: ${knownBooks.length}, standards: ${knownStandards.length}, sources: ${knownSources.length}`,
  );
  console.log(`Scanned specs: ${specCount}`);
  console.log(`Scanned notes: ${noteCount}`);
}

main();
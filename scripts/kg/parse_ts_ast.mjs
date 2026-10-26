#!/usr/bin/env node
// scripts/kg/parse_ts_ast.mjs
//
// Detect `any` type usages in a TypeScript file via @typescript-eslint/parser.
//
// The RepoScope code standard is "Explicitly prohibit any". TypeScript's
// compiler will accept `as any`, `: any`, and generic `<any>` casts; only an
// AST walk can enumerate them. This parser emits every occurrence with
// line/column/snippet so a downstream finding can quote the location.
//
// Input:  path to a .ts/.tsx file (argv[1])
// Output: JSON to stdout, shape:
//   {
//     "file": "<path>",
//     "occurrences": [
//       {"line": 42, "column": 15, "snippet": "const x: any = ..."},
//       ...
//     ],
//     "error": null | "<message>"
//   }
//
// Exit codes: 0 = parsed; 1 = usage or read failure; 2 = parse failure.
//
// Requires: @typescript-eslint/parser in node_modules (present via pnpm).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "@typescript-eslint/parser";

const ANY_NODE_TYPE = "TSAnyKeyword";
const SKIP_KEYS = new Set(["parent", "loc", "range", "tokens", "comments"]);

function walk(node, out, sourceLines) {
  if (!node || typeof node !== "object") return;

  if (node.type === ANY_NODE_TYPE && node.loc) {
    const line = node.loc.start.line;
    const column = node.loc.start.column + 1;
    const lineText = sourceLines[line - 1] ?? "";
    const start = Math.max(0, column - 8);
    const end = Math.min(lineText.length, column + 20);
    out.push({ line, column, snippet: lineText.slice(start, end).trim() });
  }

  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) walk(c, out, sourceLines);
    } else if (child && typeof child === "object") {
      walk(child, out, sourceLines);
    }
  }
}

function detect(source, filePath) {
  const ast = parse(source, {
    ecmaVersion: 2022,
    sourceType: "module",
    loc: true,
    range: false,
    comments: false,
    allowAwaitOutsideFunction: true,
  });
  const occurrences = [];
  walk(ast, occurrences, source.split("\n"));
  return { file: filePath, occurrences, error: null };
}

function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.log(JSON.stringify({ error: "usage: parse_ts_ast.mjs <file.ts>", occurrences: [] }));
    process.exit(1);
  }
  const filePath = resolve(argPath);
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch (err) {
    console.log(JSON.stringify({ error: `read failed: ${err.message}`, occurrences: [] }));
    process.exit(1);
  }
  try {
    const result = detect(source, filePath);
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.log(JSON.stringify({ file: filePath, occurrences: [], error: `parse failed: ${err.message}` }));
    process.exit(2);
  }
}

main();

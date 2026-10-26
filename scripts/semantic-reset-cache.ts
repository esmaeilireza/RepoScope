#!/usr/bin/env tsx
// scripts/semantic-reset-cache.ts
//
// Clears .reposcope-cache/semantic/. Idempotent — safe to run whether or
// not the cache directory exists. `force: true` closes the race window
// between existsSync and rmSync (e.g. CI clearing cache concurrently).

import * as fs from "node:fs";
import * as path from "node:path";

const cacheDir = path.join(process.cwd(), ".reposcope-cache", "semantic");

if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log("Cache cleared.");
} else {
  console.log("Cache already empty.");
}
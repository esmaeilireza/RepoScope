import { existsSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED = [
  "app/page.tsx",
  "app/api/github/route.ts",
  "lib/audit.ts",
  "lib/utils.ts",
  "README.md",
  "LICENSE",
  ".env.example",
];

const missing = REQUIRED.filter((p) => !existsSync(resolve(process.cwd(), p)));

if (missing.length) {
  console.error("Missing required files:");
  for (const m of missing) console.error("  - " + m);
  process.exit(1);
}

console.log(`Structure OK (${REQUIRED.length} files).`);

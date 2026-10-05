import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('❌ package.json not found at:', pkgPath);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  serialNumber: `urn:uuid:${crypto.randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [
      {
        vendor: "RepoScope",
        name: "RepoScope Supply Chain Gate",
        version: "1.0.0"
      }
    ],
    component: {
      type: "application",
      name: pkg.name || "my-reposcope-app",
      version: pkg.version || "0.1.0",
      purl: `pkg:npm/${pkg.name || "my-reposcope-app"}@${pkg.version || "0.1.0"}`
    }
  },
  components: Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
    type: "library",
    name,
    version: version.replace(/[\^~]/g, ''),
    purl: `pkg:npm/${name}@${version.replace(/[\^~]/g, '')}`,
    scope: "required"
  }))
};

const outDir = path.join(rootDir, 'build-artifacts');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outputPath = path.join(outDir, 'bom.json');
fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2), 'utf8');
console.log(`✅ [SLSA L2 / CycloneDX 1.6] SBOM generated successfully at: ${outputPath}`);

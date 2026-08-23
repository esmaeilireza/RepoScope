// lib/anomaly-detector.ts
/**
 * Static analysis-based anomaly detector.
 * Scans repository tree for signs of compromised code, credential leaks,
 * obfuscation, and CI/CD tampering — WITHOUT burning rate limit on commit history.
 */

export interface Anomaly {
  type: 
    | 'suspicious_binary' 
    | 'private_key' 
    | 'obfuscated_code' 
    | 'ci_tampering' 
    | 'credential_leak'
    | 'large_blob';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  reason: string;
  recommendation: string;
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  totalAnomalies: number;
  criticalCount: number;
  riskScore: number; // 0-100 (lower = safer)
}

// ─── Suspicious file patterns ───
const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.msi', '.dmg',
  '.class', '.jar', '.war', '.pyc', '.pyo',
]);

const PRIVATE_KEY_PATTERNS = [
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/i,
  /-----BEGIN CERTIFICATE-----/i,
];

const OBFUSCATION_SIGNALS = [
  /\beval\s*\(/,                           // eval()
  /\bnew\s+Function\s*\(/,                 // new Function()
  /atob\s*\(/,                             // base64 decode
  /\\x[0-9a-fA-F]{2}/g,                    // hex escapes
  /\\u[0-9a-fA-F]{4}/g,                    // unicode escapes
  /[A-Za-z0-9+/=]{80,}/,                   // very long base64 strings
];

const CI_SUSPICIOUS_PATTERNS = [
  /curl\s+.*\$\{\{/,                       // curl with secrets
  /wget\s+.*\$\{\{/,                       // wget with secrets
  /eval\s*\(.*\$\{\{/,                     // eval with secrets
  /secrets\.GITHUB_TOKEN.*curl/,           // token exfiltration
  /base64\s*\|\s*(bash|sh|powershell)/i,   // encoded shell
];

const CREDENTIAL_PATTERNS = [
  /(password|passwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{16,}['"]/i,
  /AKIA[0-9A-Z]{16}/,                     // AWS access key
  /ghp_[A-Za-z0-9]{36}/,                   // GitHub PAT
  /sk-[A-Za-z0-9]{32,}/,                   // OpenAI key
  /xox[baprs]-[A-Za-z0-9-]+/,              // Slack token
];

export function detectAnomalies(
  tree: Array<{ path: string; type: string; size?: number }>,
  fileContents?: Record<string, string>
): AnomalyReport {
  const anomalies: Anomaly[] = [];

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const path = item.path.toLowerCase();

    // 1. Suspicious binary files
    const ext = '.' + path.split('.').pop();
    if (BINARY_EXTENSIONS.has(ext)) {
      anomalies.push({
        type: 'suspicious_binary',
        severity: 'high',
        file: item.path,
        reason: `Binary file (${ext}) committed to source control`,
        recommendation: 'Move binaries to a release asset store or .gitignore them.',
      });
    }

    // 2. Very large files (>5MB in source)
    if (item.size && item.size > 5 * 1024 * 1024) {
      anomalies.push({
        type: 'large_blob',
        severity: 'medium',
        file: item.path,
        reason: `Large file (${(item.size / 1024 / 1024).toFixed(2)} MB) in source`,
        recommendation: 'Use Git LFS or move to external storage.',
      });
    }

    // 3. Analyze file content (if available)
    const content = fileContents?.[item.path];
    if (!content) continue;

    // 3a. Private keys
    if (PRIVATE_KEY_PATTERNS.some(p => p.test(content))) {
      anomalies.push({
        type: 'private_key',
        severity: 'critical',
        file: item.path,
        reason: 'Private key or certificate committed to source',
        recommendation: 'REVOKE this key immediately and rotate credentials. Add to .gitignore.',
      });
    }

    // 3b. Obfuscated code (only in .js/.ts/.py files)
    if (/\.(js|ts|py|mjs|cjs)$/.test(path)) {
      let obfuscationScore = 0;
      for (const signal of OBFUSCATION_SIGNALS) {
        const matches = content.match(signal);
        if (matches) obfuscationScore += matches.length;
      }
      
      // Normalize: >5 obfuscation signals = suspicious
      if (obfuscationScore > 5) {
        anomalies.push({
          type: 'obfuscated_code',
          severity: 'high',
          file: item.path,
          reason: `High obfuscation signal count (${obfuscationScore})`,
          recommendation: 'Review this file for potentially malicious encoded payloads.',
        });
      }
    }

    // 3c. CI/CD workflow tampering
    if (/\.github\/workflows\/.*\.ya?ml$/.test(path)) {
      if (CI_SUSPICIOUS_PATTERNS.some(p => p.test(content))) {
        anomalies.push({
          type: 'ci_tampering',
          severity: 'critical',
          file: item.path,
          reason: 'Workflow contains suspicious patterns (secret exfiltration risk)',
          recommendation: 'Audit this workflow carefully. Check for encoded shell commands.',
        });
      }
    }

    // 3d. Credential leaks
    for (const pattern of CREDENTIAL_PATTERNS) {
      if (pattern.test(content)) {
        anomalies.push({
          type: 'credential_leak',
          severity: 'critical',
          file: item.path,
          reason: 'Possible hardcoded credential or API key',
          recommendation: 'Remove immediately, rotate the credential, use environment variables.',
        });
        break; // One per file is enough
      }
    }
  }

  // Calculate risk score
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const mediumCount = anomalies.filter(a => a.severity === 'medium').length;
  const lowCount = anomalies.filter(a => a.severity === 'low').length;

  const riskScore = Math.min(100, 
    criticalCount * 40 + highCount * 20 + mediumCount * 5 + lowCount * 1
  );

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    criticalCount,
    riskScore,
  };
}
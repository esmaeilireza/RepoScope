// lib/audit.ts

import type { Finding, ScoredFinding, AuditScore } from './types';

// ═══════════════════════════════════════════════════════════════
// Structural pattern-based detection for ANY repository.
// No hardcoded whitelists of specific words/domains.
// ═══════════════════════════════════════════════════════════════

// ─── File extensions (stable standards, not overfitting) ───
const FILE_EXTENSIONS = new Set([
  'md', 'markdown', 'txt', 'rst', 'adoc',
  'py', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'java', 'kt', 'scala', 'go', 'rs', 'rb', 'php', 'cs', 'cpp', 'c', 'h', 'hpp',
  'swift', 'dart', 'lua', 'pl', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env',
  'xml', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'rar', '7z',
  'mp3', 'mp4', 'avi', 'mov', 'wav', 'flac', 'ogg', 'webm',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'sql', 'db', 'sqlite',
  'ipynb', 'r', 'jl', 'm',
  'gitignore', 'gitattributes', 'editorconfig', 'dockerignore',
  'lock', 'sum', 'mod',
  'pt', 'pth', 'onnx', 'h5', 'pb', 'tflite', 'safetensors', 'gguf',
]);

const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins', 'kbd',
  'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot',
  'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
]);

const HTML_CLASSES = new Set([
  'notranslate', 'no-translate', 'highlight', 'badge', 'label',
  'align-center', 'align-left', 'align-right', 'text-center',
  'sr-only', 'visually-hidden',
]);

const PLACEHOLDER_WORDS = new Set([
  'path', 'your', 'example', 'sample', 'placeholder', 'todo', 'fixme',
  'chapter-number', 'lang-id', 'section-name', 'file-name', 'dir-name',
  'username', 'password', 'token', 'apikey', 'api-key', 'secret',
  'xxx', 'aaaa', 'bbbb', 'cccc',
]);

// ─── Docker/Container absolute paths ───
const DOCKER_PATH_PATTERNS = [
  /^\/usr\/src\//,
  /^\/usr\/local\//,
  /^\/var\/lib\//,
  /^\/var\/log\//,
  /^\/opt\/apps?\//,
  /^\/opt\/srv\//,
  /^\/app\/?/,
  /^\/srv\/?/,
  /^\/home\/[^/]+\//,
  /^\/data\/?/,
  /^\/config\/?/,
  /^\/run\/?/,
];

function isDockerPath(target: string): boolean {
  return DOCKER_PATH_PATTERNS.some((pattern) => pattern.test(target));
}

// ─── Technical acronyms ───
function isTechnicalAcronym(target: string): boolean {
  const clean = target.replace(/^\/+|\/+$/g, '');
  if (clean.includes('/')) return false;
  if (clean.length < 2 || clean.length > 8) return false;
  if (/^[A-Z][A-Z0-9]*$/.test(clean)) return true;
  if (/^[a-z]{2,4}$/.test(clean) && clean.length <= 4) {
    return true;
  }
  return false;
}

// ─── npm package references ───
const NPM_PACKAGE_PATTERN = /^\/?@[a-z0-9-]+\/[a-z0-9_.-]+$|^\/?[a-z0-9-]+$/i;

function isLikelyNpmPackage(target: string, context: string): boolean {
  const clean = target.replace(/^\/+|\/+$/g, '');
  if (!NPM_PACKAGE_PATTERN.test(clean)) return false;
  if (clean.length > 40) return false;

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length !== 2 || !parts[0].startsWith('@')) return false;
    return true;
  }

  const contextLower = context.toLowerCase();
  const packageIndicators = [
    /\bnpm\b/, /\byarn\b/, /\bpnpm\b/, /\bpip\b/, /\bcargo\b/,
    /\binstall\b/, /\bpackage\b/, /\bdependency\b/, /\bmodule\b/,
    /\bregistry\b/, /\bbinary\b/, /\bprebuilt\b/, /\brelease\b/,
  ];

  return packageIndicators.some((pattern) => pattern.test(contextLower));
}

// ─── Hardware paths ───
const HARDWARE_PATTERNS = [
  /^\/dev\/tty/i,
  /^\/dev\/serial/i,
  /^\/dev\/usb/i,
  /^COM[1-9]\d*/i,
  /^\/proc\//i,
  /^\/sys\//i,
  /\/dev\/ttyUSB/i,
  /\/dev\/ttyACM/i,
  /\/dev\/tty\.usb/i,
  /\/dev\/cu\./i,
  /^LPT[1-9]/i,
];

function isHardwarePath(target: string): { isHardware: boolean; confidence: number } {
  const clean = target.replace(/^\/+/, '');
  for (const pattern of HARDWARE_PATTERNS) {
    if (pattern.test(clean)) {
      return { isHardware: true, confidence: 0.95 };
    }
  }
  return { isHardware: false, confidence: 0 };
}

// ─── GitHub User/Repo References ───
function isGitHubReference(
  target: string,
  context: string = ''
): { isGitHub: boolean; confidence: number } {
  const clean = target.replace(/^\/+/, '');
  const parts = clean.split('/').filter((p) => p.length > 0);

  if (parts.length === 1 && /^[a-zA-Z0-9_-]{1,39}$/.test(parts[0])) {
    const contextLower = context.toLowerCase();
    const hasGitHubContext =
      contextLower.includes('github') ||
      contextLower.includes('contributor') ||
      contextLower.includes('author') ||
      contextLower.includes('team') ||
      contextLower.includes('maintainer') ||
      contextLower.includes('@');

    if (hasGitHubContext) {
      return { isGitHub: true, confidence: 0.85 };
    }
  }

  if (
    parts.length === 2 &&
    /^[a-zA-Z0-9_-]{1,39}$/.test(parts[0]) &&
    /^[a-zA-Z0-9_.-]{1,100}$/.test(parts[1])
  ) {
    return { isGitHub: true, confidence: 0.75 };
  }

  return { isGitHub: false, confidence: 0 };
}

// ─── API Endpoint Detection ───
function isAPIEndpoint(
  target: string,
  context: string = ''
): { isAPI: boolean; confidence: number; score: number; reasons: string[] } {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const apiVerbPattern =
    /^(predict|auth|admin|health|api|v[0-9]+|login|logout|register|verify|validate|check|status|info|metrics|monitor|create|update|delete|list|get|post|put|patch|users|posts|comments|search|upload|download|webhook|callback|notify|feedback|history|access|response|setup|config|keys|token|session|profile|account|dashboard|settings)/i;
  if (apiVerbPattern.test(clean)) {
    score += 0.5;
    reasons.push('Starts with API verb');
  }

  const hasExtension = /\.[a-z0-9]+$/i.test(clean);
  if (!hasExtension) {
    score += 0.2;
    reasons.push('No file extension');
  }

  const contextLower = context.toLowerCase();
  const apiKeywords = [
    'endpoint', 'route', 'method', 'api', 'request', 'response',
    'post', 'get', 'put', 'delete', 'http', 'json', 'rest', 'service',
  ];
  const keywordCount = apiKeywords.filter((kw) => contextLower.includes(kw)).length;

  if (keywordCount >= 2) {
    score += 0.3;
    reasons.push(`${keywordCount} API keywords in context`);
  }

  if (/\|.+\|/.test(context) && /\|.*method.*\|/i.test(context)) {
    score += 0.2;
    reasons.push('In API documentation table');
  }

  if (/^\/?(api|v[0-9]+)\//i.test(clean)) {
    score += 0.4;
    reasons.push('Versioned API path');
  }

  if (/^\/?[a-z]+(s|es)\//i.test(clean) && !hasExtension) {
    score += 0.15;
    reasons.push('REST resource pattern');
  }

  const confidence = Math.min(score, 0.95);
  return { isAPI: score >= 0.6, confidence, score, reasons };
}

// ─── Domain detection (structural, no whitelist) ───
function isLikelyDomain(target: string): boolean {
  const clean = target.replace(/^\.?\//, '').replace(/^www\./i, '');
  const firstSegment = clean.split('/')[0].toLowerCase();

  if (!firstSegment.includes('.')) return false;

  const parts = firstSegment.split('.');
  if (parts.length < 2) return false;

  const tld = parts[parts.length - 1];

  if (tld.length < 2 || tld.length > 24) return false;
  if (!/^[a-z]+$/.test(tld)) return false;
  if (FILE_EXTENSIONS.has(tld)) return false;

  if (parts.length >= 3) return true;
  if (tld.length <= 4) return true;
  if (clean.includes('/') && parts.length >= 2) return true;

  const domainPart = parts.slice(0, -1).join('.');
  if (domainPart.includes('-') || domainPart.length > 3) return true;

  return false;
}

// ─── Placeholder detection ───
function isPlaceholder(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter((p) => p.length > 0);

  if (/^\d{1,4}[-\/]\d{1,4}([-\/]\d{1,4})?$/.test(clean)) return true;
  if (/^\d{1,6}$/.test(clean)) return true;
  if (/^[#]?[0-9a-f]{3,8}$/.test(clean)) return true;

  if (
    parts.length >= 2 &&
    parts.length <= 3 &&
    parts.every((p) => p.length <= 3 && /^[a-z0-9-]+$/i.test(p)) &&
    parts.some((p) => p.length === 1)
  ) {
    return true;
  }

  if (parts.some((p) => PLACEHOLDER_WORDS.has(p))) return true;

  if (
    /\b(chapter|lesson|section|lang|id|number|name|type)\b/i.test(clean) &&
    /\b(\d+|number|id|name|type|x|y|z)\b/i.test(clean)
  ) {
    return true;
  }

  return false;
}

// ─── HTML artifacts ───
function isHtmlArtifact(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter((p) => p.length > 0);

  if (parts.length === 1 && HTML_TAGS.has(parts[0])) return true;
  if (parts.length === 1 && HTML_CLASSES.has(parts[0])) return true;
  if (parts.length <= 2 && parts.every((p) => HTML_TAGS.has(p))) return true;

  return false;
}

// ─── Suspicious patterns ───
function isSuspicious(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(clean)) return true;
  if (/^localhost/.test(clean)) return true;
  if (/^(mailto:|tel:|#)/.test(target)) return true;
  return false;
}

// ─── Context validation ───
function isValidPathContext(target: string, context: string): boolean {
  const clean = target.replace(/^\//, '').toLowerCase();

  if (!clean.includes('/') && !clean.includes('.')) {
    const commaCount = (context.match(/,/g) || []).length;
    if (commaCount >= 2) return false;

    if (/^[a-z]+[A-Z]/.test(clean) || /^[A-Z][a-z]/.test(clean)) {
      return false;
    }

    if (/^[A-Z][A-Z0-9]*$/.test(clean) && clean.length <= 6) {
      return false;
    }

    if (/\([^)]*\)/.test(context)) {
      const parenContent = context.match(/\(([^)]+)\)/);
      if (parenContent && parenContent[1].toLowerCase().includes(clean)) {
        return false;
      }
    }

    if (target.startsWith('/')) {
      const beforeTarget = context.slice(0, Math.max(0, context.indexOf(target)));
      if (/[a-zA-Z0-9]$/.test(beforeTarget.trim())) {
        return false;
      }
    }
  }

  if (context.includes('[') && context.includes(']') && context.includes('(')) {
    const escaped = escapeRegex(target);
    const linkPattern = new RegExp(`\\]\\(${escaped}[^)]*\\)`, 'i');
    if (linkPattern.test(context)) {
      return true;
    }
  }

  if (target.startsWith('./') || target.startsWith('../')) {
    return true;
  }

  if (/\.[a-z0-9]{1,10}$/i.test(clean)) {
    return true;
  }

  const segments = clean.split('/').filter((s) => s.length > 0);
  if (segments.length >= 2) {
    return true;
  }

  if (target.startsWith('/') && segments.length === 1) {
    const beforeTarget = context.slice(0, Math.max(0, context.indexOf(target)));
    const linkVerbs = /\b(see|visit|check|open|read|navigate|goto|run|execute)\s*$/i;

    if (linkVerbs.test(beforeTarget.trim())) {
      return true;
    }

    return false;
  }

  return true;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── CONTEXT-AWARE CLASSIFIER ───
function classifyTarget(
  target: string,
  context: string = ''
): {
  category: 'not-link' | 'external' | 'suspicious' | 'internal';
  subCategory?: string;
  confidence: number;
  reason: string;
} {
  if (isHtmlArtifact(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'HTML tag or class' };
  }

  if (/^https?:\/\//i.test(target)) {
    return { category: 'external', confidence: 0.99, reason: 'HTTP/HTTPS URL' };
  }
  if (/^(mailto:|tel:|ftp:|ssh:)/i.test(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'Protocol reference' };
  }

  if (target.startsWith('#')) {
    return { category: 'not-link', confidence: 0.95, reason: 'Anchor link' };
  }

  if (isPlaceholder(target)) {
    return { category: 'not-link', confidence: 0.9, reason: 'Placeholder value' };
  }

  if (isDockerPath(target)) {
    return { category: 'not-link', confidence: 0.9, reason: 'Docker/container runtime path' };
  }

  if (isTechnicalAcronym(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'Technical acronym / protocol name' };
  }

  if (isLikelyNpmPackage(target, context)) {
    return { category: 'not-link', confidence: 0.85, reason: 'npm package reference' };
  }

  const hardware = isHardwarePath(target);
  if (hardware.isHardware) {
    return {
      category: 'suspicious',
      subCategory: 'hardware',
      confidence: hardware.confidence,
      reason: 'Hardware/device path',
    };
  }

  const github = isGitHubReference(target, context);
  if (github.isGitHub) {
    return {
      category: 'suspicious',
      subCategory: 'github',
      confidence: github.confidence,
      reason: 'GitHub user/repo reference',
    };
  }

  if (isLikelyDomain(target)) {
    return { category: 'external', confidence: 0.85, reason: 'Likely external domain' };
  }

  const api = isAPIEndpoint(target, context);
  if (api.isAPI) {
    return {
      category: 'suspicious',
      subCategory: 'api',
      confidence: api.confidence,
      reason: `API endpoint (${api.reasons.join(', ')})`,
    };
  }

  if (isSuspicious(target)) {
    return { category: 'suspicious', confidence: 0.9, reason: 'IP/localhost/protocol' };
  }

  if (!isValidPathContext(target, context)) {
    return {
      category: 'not-link',
      confidence: 0.85,
      reason: 'Word in text, not a file path (structural analysis)',
    };
  }

  return { category: 'internal', confidence: 0.7, reason: 'Assumed file path' };
}

// ─── Fuzzy matching for internal paths ───
function normalizeAndDecode(path: string): string {
  try {
    const decoded = decodeURIComponent(path);
    return decoded.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
  } catch {
    return path.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
  }
}

function fuzzyMatch(target: string, tree: any[]): boolean {
  const normalized = normalizeAndDecode(target);
  if (normalized.length < 2) return false;

  return tree.some((item) => {
    const itemPath = item.path.toLowerCase();

    if (itemPath === normalized) return true;
    if (itemPath.startsWith(normalized + '/')) return true;
    if (normalized.startsWith(itemPath + '/')) return true;
    if (itemPath.endsWith('/' + normalized)) return true;
    if (itemPath.includes('/' + normalized)) return true;

    const targetParts = normalized.split('/').filter((p) => p.length > 0);
    if (targetParts.length >= 2) {
      const itemParts = itemPath.split('/');
      let idx = 0;
      for (const part of itemParts) {
        if (part === targetParts[idx]) {
          idx++;
          if (idx === targetParts.length) return true;
        }
      }
    }

    return false;
  });
}

// ─── EXPORT: Evaluate a single link target ───
export function evaluateTarget(
  target: string,
  tree: any[],
  context: string = ''
): {
  status: string;
  detail: string;
  category: string;
  subCategory?: string;
  confidence: number;
} {
  const classification = classifyTarget(target, context);

  switch (classification.category) {
    case 'not-link':
      return {
        status: 'skip',
        detail: classification.reason,
        category: classification.category,
        confidence: classification.confidence,
      };

    case 'external':
      return {
        status: 'external',
        detail: classification.reason,
        category: classification.category,
        confidence: classification.confidence,
      };

    case 'suspicious':
      return {
        status: 'suspicious',
        detail: `${classification.reason} (confidence: ${classification.confidence.toFixed(2)})`,
        category: classification.category,
        subCategory: classification.subCategory,
        confidence: classification.confidence,
      };

    case 'internal':
      if (fuzzyMatch(target, tree)) {
        return {
          status: 'verified',
          detail: 'Found in repository',
          category: classification.category,
          confidence: classification.confidence,
        };
      }
      return {
        status: 'broken',
        detail: `Internal link not found (${classification.reason})`,
        category: classification.category,
        confidence: classification.confidence,
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Generate audit findings
// Every `ruleId` MUST match a YAML spec `id` in docs/specs/.
// Naming convention: `<domain>-<topic>-<NNN>`
// ═══════════════════════════════════════════════════════════════

/**
 * Generate audit findings for a repository.
 *
 * @param meta          repository metadata (currently unused; reserved)
 * @param tree          the repository file tree
 * @param claims        link-verification claims (from evaluateTarget)
 * @param diffs         diffs (reserved)
 * @param pulls         PR list (reserved)
 * @param defaultBranch default branch name (reserved)
 * @param fileContents  OPTIONAL map of relative path → file text. If
 *                      provided, cross-002 / webapp-001 / webapp-002
 *                      content checks fire. If omitted, those rules
 *                      skip silently (they produce no finding).
 */
export function generateFindings(
  meta: any,
  tree: any[],
  claims: any[],
  diffs: any[],
  pulls: any[],
  defaultBranch: string,
  fileContents?: Record<string, string>
): Finding[] {
  const findings: Finding[] = [];

  // ─── Critical ───
  const hasReadme = tree.some((item) => item.path.toLowerCase() === 'readme.md');
  if (!hasReadme) {
    findings.push({
      ruleId: 'general-docs-001',
      severity: 'critical',
      title: 'No README',
      detail: 'Missing README.md',
      fix: 'Add README.md',
      weight: 20,
    });
  }

  // ─── License detection ───
  const licenseFilePattern =
    /^(?:licen[cs]e|copying|notice)(?:\..+)?$|^(?:gpl|lgpl|agpl|mit|apache|bsd)(?:[-_.].*)?\.(?:txt|md)$/i;

  const licenseFiles = tree
    .map((item) => item.path)
    .filter((path) => {
      const filename = path.split('/').pop() ?? '';
      return licenseFilePattern.test(filename);
    });

  const hasLicense = licenseFiles.length > 0;

  const hasConventionalLicense = licenseFiles.some((path) => {
    const filename = path.split('/').pop() ?? '';
    return /^(?:licen[cs]e|copying|notice)(?:\..+)?$/i.test(filename);
  });

  if (!hasLicense) {
    findings.push({
      ruleId: 'general-legal-001',
      severity: 'critical',
      title: 'No LICENSE',
      detail: 'No license text or conventional license file was detected.',
      fix: 'Add a LICENSE file that states the applicable license.',
      weight: 15,
    });
  } else if (!hasConventionalLicense) {
    findings.push({
      ruleId: 'general-legal-002',
      severity: 'info',
      title: 'Non-standard license filename',
      detail: `License text detected in: ${licenseFiles.join(', ')}.`,
      fix: 'Consider adding a conventional LICENSE file and clarify the applicable license in README.',
      weight: 0,
    });
  }

  // ─── Important ───
  const hasCI = tree.some(
    (item) =>
      item.path.startsWith('.github/workflows/') &&
      (item.path.endsWith('.yml') || item.path.endsWith('.yaml'))
  );
  if (!hasCI) {
    findings.push({
      ruleId: 'general-cicd-001',
      severity: 'error',
      title: 'No CI/CD',
      detail: 'Missing GitHub Actions workflows',
      fix: 'Add .github/workflows/ci.yml',
      weight: 15,
    });
  }

  const hasTests = tree.some(
    (item) =>
      item.path.includes('tests/') ||
      item.path.includes('test/') ||
      item.path.includes('__tests__/') ||
      item.path.includes('.test.') ||
      item.path.includes('.spec.')
  );
  if (!hasTests) {
    findings.push({
      ruleId: 'general-quality-001',
      severity: 'error',
      title: 'No tests',
      detail: 'No test files found',
      fix: 'Add test files',
      weight: 15,
    });
  }

  // ─── Medium ───
  const hasSecurity = tree.some(
    (item) =>
      item.path.toLowerCase().includes('security.md') ||
      item.path.toLowerCase().includes('.env.example') ||
      item.path.toLowerCase().includes('security/')
  );
  if (!hasSecurity) {
    findings.push({
      ruleId: 'general-security-001',
      severity: 'warning',
      title: 'No security practices',
      detail: 'No SECURITY.md or .env.example found',
      fix: 'Add SECURITY.md or .env.example',
      weight: 10,
    });
  }

  // ─── Low priority ───
  const hasDependabot = tree.some(
    (item) =>
      item.path.includes('.github/dependabot.yml') ||
      item.path.includes('.github/dependabot.yaml')
  );
  if (!hasDependabot) {
    findings.push({
      ruleId: 'general-deps-001',
      severity: 'info',
      title: 'No Dependabot',
      detail: 'No automated dependency updates',
      fix: 'Enable Dependabot',
      weight: 2,
    });
  }

  const hasContributing = tree.some((item) =>
    item.path.toLowerCase().includes('contributing')
  );
  if (!hasContributing) {
    findings.push({
      ruleId: 'general-docs-002',
      severity: 'info',
      title: 'No CONTRIBUTING',
      detail: 'Missing contribution guide',
      fix: 'Add CONTRIBUTING.md',
      weight: 2,
    });
  }

  // ─── Changelog detection ───
  const changelogFilePattern =
    /^(?:changelog|changes?|history|news|release[-_ ]?notes)(?:\..+)?$/i;

  const changelogFiles = tree
    .map((item) => item.path)
    .filter((path) => {
      const filename = path.split('/').pop() ?? '';
      return changelogFilePattern.test(filename);
    });

  const hasChangelog = changelogFiles.length > 0;

  const hasConventionalChangelog = changelogFiles.some((path) => {
    const filename = path.split('/').pop() ?? '';
    return /^changelog(?:\..+)?$/i.test(filename);
  });

  if (!hasChangelog) {
    findings.push({
      ruleId: 'general-docs-003',
      severity: 'info',
      title: 'No change history',
      detail: 'No CHANGELOG, HISTORY, NEWS, CHANGES, or release-notes file was detected.',
      fix: 'Add a CHANGELOG.md or another documented change-history file.',
      weight: 1,
    });
  } else if (!hasConventionalChangelog) {
    findings.push({
      ruleId: 'general-docs-004',
      severity: 'info',
      title: 'Non-standard change-history filename',
      detail: `Change history detected in: ${changelogFiles.join(', ')}.`,
      fix: 'Consider documenting this file in README or using a conventional CHANGELOG filename.',
      weight: 0,
    });
  }

  // ─── Editorconfig ───
  const hasEditorconfig = tree.some(
    (item) => item.path === '.editorconfig' || item.path.endsWith('/.editorconfig')
  );
  if (!hasEditorconfig) {
    findings.push({
      ruleId: 'general-config-001',
      severity: 'info',
      title: 'No .editorconfig',
      detail: 'Missing editor config',
      fix: 'Add .editorconfig',
      weight: 1,
    });
  }

  // ─── README links ───
  const brokenInternal = claims.filter(
    (c) => c.status === 'broken' && c.category === 'internal'
  );
  const suspicious = claims.filter((c) => c.status === 'suspicious');

  const apiEndpoints = suspicious.filter((c) => c.subCategory === 'api');
  const hardwarePaths = suspicious.filter((c) => c.subCategory === 'hardware');

  if (brokenInternal.length > 10) {
    findings.push({
      ruleId: 'general-links-001',
      severity: 'error',
      title: `${brokenInternal.length} broken internal links`,
      detail: 'Many internal links point to missing files',
      fix: 'Fix broken internal links in README.md',
      weight: Math.min(brokenInternal.length, 10),
    });
  } else if (brokenInternal.length > 0) {
    findings.push({
      ruleId: 'general-links-001',
      severity: 'warning',
      title: `${brokenInternal.length} broken internal links`,
      detail: 'Some internal links point to missing files',
      fix: 'Fix broken internal links in README.md',
      weight: Math.min(brokenInternal.length, 5),
    });
  }

  if (apiEndpoints.length > 5) {
    findings.push({
      ruleId: 'general-api-001',
      severity: 'info',
      title: `${apiEndpoints.length} API endpoints referenced`,
      detail: 'README references API endpoints (informational)',
      fix: 'Consider using proper URL formatting',
      weight: 1,
    });
  }

  if (hardwarePaths.length > 0) {
    findings.push({
      ruleId: 'iiot-hw-001',
      severity: 'info',
      title: `${hardwarePaths.length} hardware paths referenced`,
      detail: 'README references device/hardware paths',
      fix: 'Document hardware requirements clearly',
      weight: 1,
    });
  }

  // ─── PR backlog ───
  const openPRs = pulls.filter((pr) => pr.state === 'open');
  if (openPRs.length > 15) {
    findings.push({
      ruleId: 'general-maint-001',
      severity: 'warning',
      title: `${openPRs.length} open PRs`,
      detail: 'Large PR backlog may indicate maintenance issues',
      fix: 'Review and merge or close stale PRs',
      weight: 5,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: cross-domain + webapp rules (require fileContents)
  // ═══════════════════════════════════════════════════════════════

  // ─── cross-002: IIoT control plane exposed via web API ───
  // Only fires when an API route under app/api/ or pages/api/
  // actually imports or references an industrial protocol keyword.
  const apiRoutesWithPlc = tree.filter((item) => {
    if (item.type !== 'blob') return false;
    if (!/\.(ts|tsx|js|jsx)$/i.test(item.path)) return false;
    const isApiRoute =
      item.path.startsWith('app/api/') ||
      item.path.startsWith('pages/api/') ||
      item.path.startsWith('src/app/api/') ||
      item.path.startsWith('src/pages/api/');
    if (!isApiRoute) return false;
    const content = fileContents?.[item.path];
    if (!content) return false;
    return /\b(modbus|plc|scada|opcua|opc-ua|s7comm|profinet)\b/i.test(content);
  });

  if (apiRoutesWithPlc.length > 0) {
    findings.push({
      ruleId: 'cross-002',
      severity: 'warning',
      title: 'IIoT control plane exposed via web API',
      detail: `${apiRoutesWithPlc.length} API route(s) reference OT control keywords. Verify authentication and network segmentation.`,
      fix: 'Require authentication for API routes that reach PLC/OT devices. Enforce network segmentation (DMZ) between IT and OT.',
      weight: 10,
      profile: 'cross',
      file: apiRoutesWithPlc[0].path,
    });
  }

  // ─── webapp-001: rate limiting on API routes ───
  // Only fires if the repo has API routes AND no rate-limiting pattern is found.
  const hasApiRoutes = tree.some(
    (item) =>
      item.type === 'blob' &&
      (item.path.startsWith('app/api/') ||
        item.path.startsWith('pages/api/') ||
        item.path.startsWith('src/app/api/') ||
        item.path.startsWith('src/pages/api/') ||
        item.path.startsWith('api/') ||
        item.path.startsWith('src/api/') ||
        item.path.includes('/routes/') ||
        item.path.includes('/controllers/'))
  );

  if (hasApiRoutes) {
    const hasRateLimiting = tree.some((item) => {
      if (item.type !== 'blob') return false;
      if (!/\.(ts|tsx|js|jsx)$/i.test(item.path)) return false;
      const content = fileContents?.[item.path];
      if (!content) return false;
      return /rateLimit|rate-limit|@upstash\/ratelimit|\bthrottle\b|\bupstash\b/i.test(
        content
      );
    });

    if (!hasRateLimiting) {
      findings.push({
        ruleId: 'webapp-001',
        severity: 'warning',
        title: 'No rate limiting on API routes',
        detail:
          'Repository defines API routes but no rate-limiting library or middleware pattern was detected.',
        fix:
          'Add @upstash/ratelimit with Vercel KV, or apply middleware rate limiting on public API routes.',
        weight: 10,
        profile: 'webapp',
      });
    }
  }

  // ─── webapp-002: Content Security Policy ───
  // Only fires if the repo uses a recognised web framework.
  const pkgContent = fileContents?.['package.json'];
  const hasWebFramework =
    tree.some((item) => /^next\.config\.(js|mjs|ts)$/.test(item.path)) ||
    tree.some((item) => {
      if (item.path !== 'package.json') return false;
      return (
        !!pkgContent &&
        /"(next|express|fastify|koa|@nestjs\/core|hapi)"/.test(pkgContent)
      );
    });

  if (hasWebFramework) {
    const hasCsp = tree.some((item) => {
      if (item.type !== 'blob') return false;
      const basename = item.path.split('/').pop() ?? '';
      const isConfigFile = [
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
        'middleware.ts',
        'middleware.js',
        'middleware.mjs',
      ].includes(basename);
      if (!isConfigFile) return false;
      const content = fileContents?.[item.path];
      if (!content) return false;
      return /Content-Security-Policy|contentSecurityPolicy|\bcsp\b/i.test(content);
    });

    if (!hasCsp) {
      findings.push({
        ruleId: 'webapp-002',
        severity: 'error',
        title: 'Missing Content Security Policy',
        detail:
          'No Content-Security-Policy header configured in next.config or middleware.',
        fix:
          'Add a Content-Security-Policy header in next.config.js (headers()) or in middleware.ts.',
        weight: 15,
        profile: 'webapp',
      });
    }
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Calculate score
// Returns the same shape as before, but every item carries `ruleId`
// so the Week-4 Citation Gate can match it against YAML specs.
// ═══════════════════════════════════════════════════════════════
export function scoreAndExplain(findings: Finding[]): AuditScore {
  let score = 100;
  let critical = 0;
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  const items: ScoredFinding[] = [];

  findings.forEach((finding) => {
    const weight = finding.weight || 0;
    score -= weight;

    if (finding.severity === 'critical') critical++;
    else if (finding.severity === 'error') errors++;
    else if (finding.severity === 'warning') warnings++;
    else infos++;

    items.push({
      ...finding,
      points: weight,
    });
  });

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    critical,
    errors,
    warnings,
    infos,
    findings,
    items,
    counts: { critical, error: errors, warning: warnings, info: infos },
    summary: `${score}/100`,
  };
}
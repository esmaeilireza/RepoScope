// lib/audit.ts

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

// ─── HTML tags (HTML5 spec - stable standard) ───
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

// ─── HTML classes that appear as tokens ───
const HTML_CLASSES = new Set([
  'notranslate', 'no-translate', 'highlight', 'badge', 'label',
  'align-center', 'align-left', 'align-right', 'text-center',
  'sr-only', 'visually-hidden',
]);

// ─── Placeholder indicators (universal placeholder patterns) ───
const PLACEHOLDER_WORDS = new Set([
  'path', 'your', 'example', 'sample', 'placeholder', 'todo', 'fixme',
  'chapter-number', 'lang-id', 'section-name', 'file-name', 'dir-name',
  'username', 'password', 'token', 'apikey', 'api-key', 'secret',
  'xxx', 'aaaa', 'bbbb', 'cccc',
]);

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] Docker/Container absolute paths
// Pattern-based detection using OS standard directories
// ═══════════════════════════════════════════════════════════════
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
  return DOCKER_PATH_PATTERNS.some(pattern => pattern.test(target));
}

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] Technical acronyms
// Detects short all-uppercase tokens (structure-based, not content whitelist)
// Stable because industry protocols (TCP, IP, MQTT) rarely change
// ═══════════════════════════════════════════════════════════════
function isTechnicalAcronym(target: string): boolean {
  const clean = target.replace(/^\/+|\/+$/g, '');
  
  // Multi-segment paths aren't acronyms
  if (clean.includes('/')) return false;
  
  // Must be short (2-8 chars) - structural check
  if (clean.length < 2 || clean.length > 8) return false;
  
  // All uppercase letters (possibly with numbers like HTML5)
  if (/^[A-Z][A-Z0-9]*$/.test(clean)) return true;
  
  // Lowercase but very short (2-4 chars) and looks like protocol
  // e.g., 'tcp', 'ip', 'udp', 'mqtt'
  if (/^[a-z]{2,4}$/.test(clean) && clean.length <= 4) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] npm package references
// Detects scoped packages (@scope/pkg) and short single-segment names
// in package-related context
// ═══════════════════════════════════════════════════════════════
const NPM_PACKAGE_PATTERN = /^\/?@[a-z0-9-]+\/[a-z0-9_.-]+$|^\/?[a-z0-9-]+$/i;

function isLikelyNpmPackage(target: string, context: string): boolean {
  const clean = target.replace(/^\/+|\/+$/g, '');
  if (!NPM_PACKAGE_PATTERN.test(clean)) return false;
  
  // Must be short (not a long path)
  if (clean.length > 40) return false;
  
  // Scoped packages: @scope/package (always valid)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length !== 2 || !parts[0].startsWith('@')) return false;
    return true; // Scoped packages are always package refs
  }
  
  // Single-segment: check context for package-related keywords
  const contextLower = context.toLowerCase();
  const packageIndicators = [
    /\bnpm\b/, /\byarn\b/, /\bpnpm\b/, /\bpip\b/, /\bcargo\b/,
    /\binstall\b/, /\bpackage\b/, /\bdependency\b/, /\bmodule\b/,
    /\bregistry\b/, /\bbinary\b/, /\bprebuilt\b/, /\brelease\b/,
  ];
  
  return packageIndicators.some(pattern => pattern.test(contextLower));
}

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] Hardware paths
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] GitHub User/Repo References
// ═══════════════════════════════════════════════════════════════
function isGitHubReference(target: string, context: string = ''): { isGitHub: boolean; confidence: number } {
  const clean = target.replace(/^\/+/, '');
  const parts = clean.split('/').filter(p => p.length > 0);
  
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
  
  if (parts.length === 2 && 
      /^[a-zA-Z0-9_-]{1,39}$/.test(parts[0]) &&
      /^[a-zA-Z0-9_.-]{1,100}$/.test(parts[1])) {
    return { isGitHub: true, confidence: 0.75 };
  }
  
  return { isGitHub: false, confidence: 0 };
}

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] API Endpoint Detection
// ═══════════════════════════════════════════════════════════════
// FIX: Added reasons to return type and return statement
function isAPIEndpoint(target: string, context: string = ''): { isAPI: boolean; confidence: number; score: number; reasons: string[] } {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const apiVerbPattern = /^(predict|auth|admin|health|api|v[0-9]+|login|logout|register|verify|validate|check|status|info|metrics|monitor|create|update|delete|list|get|post|put|patch|users|posts|comments|search|upload|download|webhook|callback|notify|feedback|history|access|response|setup|config|keys|token|session|profile|account|dashboard|settings)/i;
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
  const apiKeywords = ['endpoint', 'route', 'method', 'api', 'request', 'response', 'post', 'get', 'put', 'delete', 'http', 'json', 'rest', 'service'];
  const keywordCount = apiKeywords.filter(kw => contextLower.includes(kw)).length;
  
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
  // FIX: Added reasons to return object
  return { isAPI: score >= 0.6, confidence, score, reasons };
}

// ═══════════════════════════════════════════════════════════════
// [STRUCTURAL] Domain detection - NO whitelist
// Uses structural properties only (subdomain structure, TLD length,
// path depth) so it works for ANY domain including unknown TLDs
// ═══════════════════════════════════════════════════════════════
function isLikelyDomain(target: string): boolean {
  const clean = target.replace(/^\.?\//, '').replace(/^www\./i, '');
  const firstSegment = clean.split('/')[0].toLowerCase();
  
  // Must contain at least one dot
  if (!firstSegment.includes('.')) return false;
  
  const parts = firstSegment.split('.');
  if (parts.length < 2) return false;
  
  const tld = parts[parts.length - 1];
  
  // TLD validation: 2-24 chars, alphabetic only
  if (tld.length < 2 || tld.length > 24) return false;
  if (!/^[a-z]+$/.test(tld)) return false;
  
  // If TLD is a known file extension, it's a file not a domain
  if (FILE_EXTENSIONS.has(tld)) return false;
  
  // STRUCTURAL CHECK 1: Has subdomain structure (sub.domain.tld)
  if (parts.length >= 3) return true;
  
  // STRUCTURAL CHECK 2: Short TLD (typical for domains: com, org, io, sh)
  if (tld.length <= 4) return true;
  
  // STRUCTURAL CHECK 3: Has path after domain (domain.com/path)
  if (clean.includes('/') && parts.length >= 2) return true;
  
  // STRUCTURAL CHECK 4: Domain part has hyphen or is long
  const domainPart = parts.slice(0, -1).join('.');
  if (domainPart.includes('-') || domainPart.length > 3) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// Placeholder detection
// ═══════════════════════════════════════════════════════════════
function isPlaceholder(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter(p => p.length > 0);
  
  if (/^\d{1,4}[-\/]\d{1,4}([-\/]\d{1,4})?$/.test(clean)) return true;
  if (/^\d{1,6}$/.test(clean)) return true;
  if (/^[#]?[0-9a-f]{3,8}$/.test(clean)) return true;
  
  if (parts.length >= 2 && parts.length <= 3 &&
      parts.every(p => p.length <= 3 && /^[a-z0-9-]+$/i.test(p)) &&
      parts.some(p => p.length === 1)) {
    return true;
  }
  
  if (parts.some(p => PLACEHOLDER_WORDS.has(p))) return true;
  
  if (/\b(chapter|lesson|section|lang|id|number|name|type)\b/i.test(clean) &&
      /\b(\d+|number|id|name|type|x|y|z)\b/i.test(clean)) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// HTML artifacts
// ═══════════════════════════════════════════════════════════════
function isHtmlArtifact(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter(p => p.length > 0);
  
  if (parts.length === 1 && HTML_TAGS.has(parts[0])) return true;
  if (parts.length === 1 && HTML_CLASSES.has(parts[0])) return true;
  if (parts.length <= 2 && parts.every(p => HTML_TAGS.has(p))) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// Suspicious patterns
// ═══════════════════════════════════════════════════════════════
function isSuspicious(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(clean)) return true;
  if (/^localhost/.test(clean)) return true;
  if (/^(mailto:|tel:|#)/.test(target)) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// [NEW] Context validation - STRUCTURAL heuristics
// Detects when a "path" is actually just a word in text
// This is the KEY function that eliminates false positives
// ═══════════════════════════════════════════════════════════════
function isValidPathContext(target: string, context: string): boolean {
  const clean = target.replace(/^\//, '').toLowerCase();
  
  // ─── Rule 1: Single segment without extension → scrutinize ───
  if (!clean.includes('/') && !clean.includes('.')) {
    // List context: "SVG, HTML5, JavaScript, PHP"
    const commaCount = (context.match(/,/g) || []).length;
    if (commaCount >= 2) return false;
    
    // camelCase/PascalCase: "JavaScript", "TypeScript", "PostgreSQL"
    if (/^[a-z]+[A-Z]/.test(clean) || /^[A-Z][a-z]/.test(clean)) {
      return false;
    }
    
    // All uppercase short token: "HTML5", "API", "SDK"
    if (/^[A-Z][A-Z0-9]*$/.test(clean) && clean.length <= 6) {
      return false;
    }
    
    // Parentheses: "(TCP)" or "acknowledgement/elimination"
    if (/\([^)]*\)/.test(context)) {
      const parenContent = context.match(/\(([^)]+)\)/);
      if (parenContent && parenContent[1].toLowerCase().includes(clean)) {
        return false;
      }
    }
    
    // Compound term: "acknowledgement/elimination"
    if (target.startsWith('/')) {
      const beforeTarget = context.slice(0, Math.max(0, context.indexOf(target)));
      if (/[a-zA-Z0-9]$/.test(beforeTarget.trim())) {
        return false;
      }
    }
  }
  
  // ─── Rule 2: Markdown link context [text](url) ───
  if (context.includes('[') && context.includes(']') && context.includes('(')) {
    const escaped = escapeRegex(target);
    const linkPattern = new RegExp(`\\]\\(${escaped}[^)]*\\)`, 'i');
    if (linkPattern.test(context)) {
      return true;
    }
  }
  
  // ─── Rule 3: Relative paths are always valid ───
  if (target.startsWith('./') || target.startsWith('../')) {
    return true;
  }
  
  // ─── Rule 4: Has file extension → likely valid ───
  if (/\.[a-z0-9]{1,10}$/i.test(clean)) {
    return true;
  }
  
  // ─── Rule 5: Multiple path segments → likely valid ───
  const segments = clean.split('/').filter(s => s.length > 0);
  if (segments.length >= 2) {
    return true;
  }
  
  // ─── Rule 6: Single /word → check for link verbs ───
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

// Helper to escape regex special chars
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT-AWARE CLASSIFIER - Enhanced with structural validation
// ═══════════════════════════════════════════════════════════════
function classifyTarget(target: string, context: string = ''): {
  category: 'not-link' | 'external' | 'suspicious' | 'internal';
  subCategory?: string;
  confidence: number;
  reason: string;
} {
  // Step 1: HTML artifacts
  if (isHtmlArtifact(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'HTML tag or class' };
  }
  
  // Step 2: Explicit protocols
  if (/^https?:\/\//i.test(target)) {
    return { category: 'external', confidence: 0.99, reason: 'HTTP/HTTPS URL' };
  }
  if (/^(mailto:|tel:|ftp:|ssh:)/i.test(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'Protocol reference' };
  }
  
  // Step 3: Anchors
  if (target.startsWith('#')) {
    return { category: 'not-link', confidence: 0.95, reason: 'Anchor link' };
  }
  
  // Step 4: Placeholders
  if (isPlaceholder(target)) {
    return { category: 'not-link', confidence: 0.9, reason: 'Placeholder value' };
  }
  
  // Step 5: Docker paths
  if (isDockerPath(target)) {
    return { category: 'not-link', confidence: 0.9, reason: 'Docker/container runtime path' };
  }
  
  // Step 6: Technical acronyms (STRUCTURAL)
  if (isTechnicalAcronym(target)) {
    return { category: 'not-link', confidence: 0.95, reason: 'Technical acronym / protocol name' };
  }
  
  // Step 7: npm packages
  if (isLikelyNpmPackage(target, context)) {
    return { category: 'not-link', confidence: 0.85, reason: 'npm package reference' };
  }
  
  // Step 8: Hardware paths
  const hardware = isHardwarePath(target);
  if (hardware.isHardware) {
    return { 
      category: 'suspicious', 
      subCategory: 'hardware',
      confidence: hardware.confidence, 
      reason: 'Hardware/device path' 
    };
  }
  
  // Step 9: GitHub references
  const github = isGitHubReference(target, context);
  if (github.isGitHub) {
    return { 
      category: 'suspicious', 
      subCategory: 'github',
      confidence: github.confidence, 
      reason: 'GitHub user/repo reference' 
    };
  }
  
  // Step 10: Domain detection (STRUCTURAL, no whitelist)
  if (isLikelyDomain(target)) {
    return { category: 'external', confidence: 0.85, reason: 'Likely external domain' };
  }
  
  // Step 11: API endpoints
  const api = isAPIEndpoint(target, context);
  if (api.isAPI) {
    return { 
      category: 'suspicious', 
      subCategory: 'api',
      confidence: api.confidence, 
      reason: `API endpoint (${api.reasons.join(', ')})` 
    };
  }
  
  // Step 12: Suspicious patterns (IPs, localhost)
  if (isSuspicious(target)) {
    return { category: 'suspicious', confidence: 0.9, reason: 'IP/localhost/protocol' };
  }
  
  // Step 13: Context validation - structural check
  if (!isValidPathContext(target, context)) {
    return { 
      category: 'not-link', 
      confidence: 0.85, 
      reason: 'Word in text, not a file path (structural analysis)' 
    };
  }
  
  // Step 14: Everything else is internal
  return { category: 'internal', confidence: 0.7, reason: 'Assumed file path' };
}

// ═══════════════════════════════════════════════════════════════
// Fuzzy matching for internal paths
// ═══════════════════════════════════════════════════════════════
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
  
  return tree.some(item => {
    const itemPath = item.path.toLowerCase();
    
    if (itemPath === normalized) return true;
    if (itemPath.startsWith(normalized + '/')) return true;
    if (normalized.startsWith(itemPath + '/')) return true;
    if (itemPath.endsWith('/' + normalized)) return true;
    if (itemPath.includes('/' + normalized)) return true;
    
    const targetParts = normalized.split('/').filter(p => p.length > 0);
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

// ═══════════════════════════════════════════════════════════════
// EXPORT: Evaluate a single link target
// ═══════════════════════════════════════════════════════════════
export function evaluateTarget(
  target: string,
  tree: any[],
  context: string = ''
): { status: string; detail: string; category: string; subCategory?: string; confidence: number } {
  const classification = classifyTarget(target, context);

  switch (classification.category) {
    case 'not-link':
      return { 
        status: 'skip', 
        detail: classification.reason, 
        category: classification.category,
        confidence: classification.confidence
      };
    
    case 'external':
      return { 
        status: 'external', 
        detail: classification.reason, 
        category: classification.category,
        confidence: classification.confidence
      };
    
    case 'suspicious':
      return { 
        status: 'suspicious', 
        detail: `${classification.reason} (confidence: ${classification.confidence.toFixed(2)})`, 
        category: classification.category,
        subCategory: classification.subCategory,
        confidence: classification.confidence
      };
    
    case 'internal':
      if (fuzzyMatch(target, tree)) {
        return { 
          status: 'verified', 
          detail: 'Found in repository', 
          category: classification.category,
          confidence: classification.confidence
        };
      }
      return { 
        status: 'broken', 
        detail: `Internal link not found (${classification.reason})`, 
        category: classification.category,
        confidence: classification.confidence
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Generate audit findings
// ═══════════════════════════════════════════════════════════════
export function generateFindings(
  meta: any,
  tree: any[],
  claims: any[],
  diffs: any[],
  pulls: any[],
  defaultBranch: string
) {
  const findings: any[] = [];

  // ─── Critical ───
  const hasReadme = tree.some(item => item.path.toLowerCase() === 'readme.md');
  if (!hasReadme) {
    findings.push({
      severity: 'critical', title: 'No README',
      detail: 'Missing README.md', fix: 'Add README.md', weight: 20,
    });
  }

  const hasLicense = tree.some(item => item.path.toLowerCase().includes('license'));
  if (!hasLicense) {
    findings.push({
      severity: 'critical', title: 'No LICENSE',
      detail: 'Missing license file', fix: 'Add LICENSE', weight: 15,
    });
  }

  // ─── Important ───
  const hasCI = tree.some(item =>
    item.path.startsWith('.github/workflows/') &&
    (item.path.endsWith('.yml') || item.path.endsWith('.yaml'))
  );
  if (!hasCI) {
    findings.push({
      severity: 'error', title: 'No CI/CD',
      detail: 'Missing GitHub Actions workflows',
      fix: 'Add .github/workflows/ci.yml', weight: 15,
    });
  }

  const hasTests = tree.some(item =>
    item.path.includes('tests/') || item.path.includes('test/') ||
    item.path.includes('__tests__/') || item.path.includes('.test.') ||
    item.path.includes('.spec.')
  );
  if (!hasTests) {
    findings.push({
      severity: 'error', title: 'No tests',
      detail: 'No test files found',
      fix: 'Add test files', weight: 15,
    });
  }

  // ─── Medium ───
  const hasSecurity = tree.some(item =>
    item.path.toLowerCase().includes('security.md') ||
    item.path.toLowerCase().includes('.env.example') ||
    item.path.toLowerCase().includes('security/')
  );
  if (!hasSecurity) {
    findings.push({
      severity: 'warning', title: 'No security practices',
      detail: 'No SECURITY.md or .env.example found',
      fix: 'Add SECURITY.md or .env.example', weight: 10,
    });
  }

  // ─── Low priority ───
  const hasDependabot = tree.some(item =>
    item.path.includes('.github/dependabot.yml') ||
    item.path.includes('.github/dependabot.yaml')
  );
  if (!hasDependabot) {
    findings.push({
      severity: 'info', title: 'No Dependabot',
      detail: 'No automated dependency updates',
      fix: 'Enable Dependabot', weight: 2,
    });
  }

  const hasContributing = tree.some(item =>
    item.path.toLowerCase().includes('contributing')
  );
  if (!hasContributing) {
    findings.push({
      severity: 'info', title: 'No CONTRIBUTING',
      detail: 'Missing contribution guide',
      fix: 'Add CONTRIBUTING.md', weight: 2,
    });
  }

  const hasChangelog = tree.some(item =>
    item.path.toLowerCase().includes('changelog')
  );
  if (!hasChangelog) {
    findings.push({
      severity: 'info', title: 'No CHANGELOG',
      detail: 'Missing changelog',
      fix: 'Add CHANGELOG.md', weight: 1,
    });
  }

  const hasEditorconfig = tree.some(item => 
    item.path === '.editorconfig' || 
    item.path.endsWith('/.editorconfig')
  );
  if (!hasEditorconfig) {
    findings.push({
      severity: 'info', title: 'No .editorconfig',
      detail: 'Missing editor config',
      fix: 'Add .editorconfig', weight: 1,
    });
  }

  // ─── README links ───
  const brokenInternal = claims.filter(c =>
    c.status === 'broken' && c.category === 'internal'
  );
  const suspicious = claims.filter(c => c.status === 'suspicious');
  
  const apiEndpoints = suspicious.filter(c => c.subCategory === 'api');
  const hardwarePaths = suspicious.filter(c => c.subCategory === 'hardware');

  if (brokenInternal.length > 10) {
    findings.push({
      severity: 'error',
      title: `${brokenInternal.length} broken internal links`,
      detail: 'Many internal links point to missing files',
      fix: 'Fix broken internal links in README.md',
      weight: Math.min(brokenInternal.length, 10),
    });
  } else if (brokenInternal.length > 0) {
    findings.push({
      severity: 'warning',
      title: `${brokenInternal.length} broken internal links`,
      detail: 'Some internal links point to missing files',
      fix: 'Fix broken internal links in README.md',
      weight: Math.min(brokenInternal.length, 5),
    });
  }

  if (apiEndpoints.length > 5) {
    findings.push({
      severity: 'info',
      title: `${apiEndpoints.length} API endpoints referenced`,
      detail: 'README references API endpoints (informational)',
      fix: 'Consider using proper URL formatting',
      weight: 1,
    });
  }

  if (hardwarePaths.length > 0) {
    findings.push({
      severity: 'info',
      title: `${hardwarePaths.length} hardware paths referenced`,
      detail: 'README references device/hardware paths',
      fix: 'Document hardware requirements clearly',
      weight: 1,
    });
  }

  // ─── PR backlog ───
  const openPRs = pulls.filter(pr => pr.state === 'open');
  if (openPRs.length > 15) {
    findings.push({
      severity: 'warning',
      title: `${openPRs.length} open PRs`,
      detail: 'Large PR backlog may indicate maintenance issues',
      fix: 'Review and merge or close stale PRs',
      weight: 5,
    });
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: Calculate score
// ═══════════════════════════════════════════════════════════════
export function scoreAndExplain(findings: any[]) {
  let score = 100;
  let critical = 0, errors = 0, warnings = 0, infos = 0;
  const items: any[] = [];

  findings.forEach(finding => {
    const weight = finding.weight || 0;
    score -= weight;

    if (finding.severity === 'critical') critical++;
    else if (finding.severity === 'error') errors++;
    else if (finding.severity === 'warning') warnings++;
    else infos++;

    items.push({
      severity: finding.severity,
      title: finding.title,
      detail: finding.detail,
      fix: finding.fix,
      points: weight,
    });
  });

  score = Math.max(0, Math.min(100, score));

  return {
    score, critical, errors, warnings, infos,
    findings, items,
    counts: { critical, error: errors, warning: warnings, info: infos },
    summary: `${score}/100`,
  };
}
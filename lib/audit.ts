// ═══════════════════════════════════════════════════════════════
// FINAL STABLE VERSION - Heuristic-based classification
// No domain whitelists. Works for ANY GitHub repository.
// ═══════════════════════════════════════════════════════════════

// ─── File extensions that indicate a FILE PATH, not a domain ───
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

// ─── HTML tags (complete HTML5) ───
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

// ─── Common HTML classes/attributes that appear as tokens ───
const HTML_CLASSES = new Set([
  'notranslate', 'no-translate', 'highlight', 'badge', 'label',
  'align-center', 'align-left', 'align-right', 'text-center',
  'sr-only', 'visually-hidden',
]);

// ─── Placeholder indicators ───
const PLACEHOLDER_WORDS = new Set([
  'path', 'your', 'example', 'sample', 'placeholder', 'todo', 'fixme',
  'chapter-number', 'lang-id', 'section-name', 'file-name', 'dir-name',
  'username', 'password', 'token', 'apikey', 'api-key', 'secret',
  'xxx', 'aaaa', 'bbbb', 'cccc',
]);

// ═══════════════════════════════════════════════════════════════
// CORE HEURISTIC: Is this a domain?
// Rule: First path segment contains a dot AND doesn't end with
// a known file extension → it's a domain (external)
// ═══════════════════════════════════════════════════════════════
function isLikelyDomain(target: string): boolean {
  const clean = target.replace(/^\.?\//, '').replace(/^www\./i, '');
  const firstSegment = clean.split('/')[0].toLowerCase();
  
  // Must contain at least one dot
  if (!firstSegment.includes('.')) return false;
  
  // Must have at least 2 chars after the last dot (TLD)
  const lastDotIndex = firstSegment.lastIndexOf('.');
  const tld = firstSegment.slice(lastDotIndex + 1);
  if (tld.length < 2 || tld.length > 24) return false;
  
  // TLD must be alphabetic (no numbers, no special chars)
  if (!/^[a-z]+$/.test(tld)) return false;
  
  // If it ends with a known FILE extension, it's a file, not a domain
  // Example: "readme.md" → file, not domain
  if (FILE_EXTENSIONS.has(tld)) return false;
  
  // Single-label domains like "localhost" are handled elsewhere
  // If we reach here, it looks like a domain
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Is this a placeholder (not a real link)?
// ═══════════════════════════════════════════════════════════════
function isPlaceholder(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter(p => p.length > 0);
  
  // Date patterns: MM/YYYY, YYYY-MM-DD, DD/MM/YYYY
  if (/^\d{1,4}[-\/]\d{1,4}([-\/]\d{1,4})?$/.test(clean)) return true;
  
  // Pure numbers (reference numbers, issue numbers)
  if (/^\d{1,6}$/.test(clean)) return true;
  
  // Hex color codes: FBBF24, #FFFFFF
  if (/^[#]?[0-9a-f]{3,8}$/.test(clean)) return true;
  
  // Very short uppercase/mixed segments (Y/Z, X/Y/Z, A/B)
  if (parts.length >= 2 && parts.length <= 3 &&
      parts.every(p => p.length <= 3 && /^[a-z0-9-]+$/i.test(p)) &&
      parts.some(p => p.length === 1)) {
    return true;
  }
  
  // Contains placeholder words
  if (parts.some(p => PLACEHOLDER_WORDS.has(p))) return true;
  
  // Pattern like "CHAPTER-NUMBER", "LANG-ID"
  if (/\b(chapter|lesson|section|lang|id|number|name|type)\b/i.test(clean) &&
      /\b(\d+|number|id|name|type|x|y|z)\b/i.test(clean)) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// Is this an HTML tag/class (not a link at all)?
// ═══════════════════════════════════════════════════════════════
function isHtmlArtifact(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  const parts = clean.split('/').filter(p => p.length > 0);
  
  // Single HTML tag
  if (parts.length === 1 && HTML_TAGS.has(parts[0])) return true;
  
  // Single HTML class
  if (parts.length === 1 && HTML_CLASSES.has(parts[0])) return true;
  
  // Short sequences of HTML tags (td/tr/table combinations)
  if (parts.length <= 2 && parts.every(p => HTML_TAGS.has(p))) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// Suspicious patterns (API endpoints, localhost)
// ═══════════════════════════════════════════════════════════════
function isSuspicious(target: string): boolean {
  const clean = target.replace(/^\/+/, '').toLowerCase();
  
  // IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(clean)) return true;
  
  // Localhost
  if (/^localhost/.test(clean)) return true;
  
  // Mailto, tel, anchors
  if (/^(mailto:|tel:|#)/.test(target)) return true;
  
  // Common API endpoint words (single word, no extension, no dot)
  const apiWords = /^(predict|chat|auth|login|logout|register|signup|signin|api|health|status|ping|info|version|metrics|admin|dashboard|settings|profile|account|users|posts|comments|search|upload|download|webhook|callback|notify|feedback|history|access|response|setup|config)$/i;
  if (apiWords.test(clean)) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLASSIFIER - The heart of the system
// ═══════════════════════════════════════════════════════════════
function classifyTarget(target: string): 'not-link' | 'external' | 'suspicious' | 'internal' {
  // Step 1: HTML artifacts (tags, classes) → skip
  if (isHtmlArtifact(target)) return 'not-link';
  
  // Step 2: Explicit protocols → external
  if (/^https?:\/\//i.test(target)) return 'external';
  if (/^(mailto:|tel:|ftp:|ssh:)/i.test(target)) return 'not-link';
  
  // Step 3: Anchors → skip
  if (target.startsWith('#')) return 'not-link';
  
  // Step 4: Placeholders → skip
  if (isPlaceholder(target)) return 'not-link';
  
  // Step 5: THE KEY HEURISTIC - looks like a domain → external
  if (isLikelyDomain(target)) return 'external';
  
  // Step 6: Suspicious (API endpoints, IPs) → suspicious
  if (isSuspicious(target)) return 'suspicious';
  
  // Step 7: Everything else is internal
  return 'internal';
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
  
  // Too short to be meaningful
  if (normalized.length < 2) return false;
  
  return tree.some(item => {
    const itemPath = item.path.toLowerCase();
    
    // Exact match
    if (itemPath === normalized) return true;
    
    // Prefix matches
    if (itemPath.startsWith(normalized + '/')) return true;
    if (normalized.startsWith(itemPath + '/')) return true;
    
    // Suffix match
    if (itemPath.endsWith('/' + normalized)) return true;
    
    // Contains match
    if (itemPath.includes('/' + normalized)) return true;
    
    // Multi-part sequential match
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
  tree: any[]
): { status: string; detail: string; category: string } {
  const category = classifyTarget(target);

  switch (category) {
    case 'not-link':
      return { status: 'skip', detail: 'Not a link (HTML/tag/placeholder)', category };
    
    case 'external':
      return { status: 'external', detail: 'External URL', category };
    
    case 'suspicious':
      return { status: 'suspicious', detail: 'API endpoint or local address', category };
    
    case 'internal':
      if (fuzzyMatch(target, tree)) {
        return { status: 'verified', detail: 'Found in repository', category };
      }
      return { status: 'broken', detail: 'Internal link not found', category };
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

  const hasEditorconfig = tree.some(item => item.path === '.editorconfig');
  if (!hasEditorconfig) {
    findings.push({
      severity: 'info', title: 'No .editorconfig',
      detail: 'Missing editor config',
      fix: 'Add .editorconfig', weight: 1,
    });
  }

  // ─── README links: ONLY broken INTERNAL links count ───
  const brokenInternal = claims.filter(c =>
    c.status === 'broken' && c.category === 'internal'
  );
  const suspicious = claims.filter(c => c.status === 'suspicious');

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

  if (suspicious.length > 5) {
    findings.push({
      severity: 'info',
      title: `${suspicious.length} API endpoints referenced`,
      detail: 'README references API endpoints (informational)',
      fix: 'Consider using proper URL formatting',
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
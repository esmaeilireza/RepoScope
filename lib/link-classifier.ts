// lib/link-classifier.ts

export type LinkType = 
  | 'FILE_PATH'
  | 'API_ENDPOINT'
  | 'HARDWARE_PATH'
  | 'GITHUB_USER'
  | 'ANCHOR'
  | 'UNKNOWN';

export interface LinkClassification {
  type: LinkType;
  confidence: number; // 0 to 1
  reason: string;
  shouldValidate: boolean; // whether it should be reported as a broken link
}

// Common file extensions (including DataOps & IIoT specific ones)
const KNOWN_EXTENSIONS = [
  '.md', '.txt', '.pdf', '.doc', '.docx', '.ipynb', '.csv', '.parquet', '.db', '.pkl',
  '.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java', '.cpp', '.c', '.h',
  '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.env', '.sh', '.bash', '.zsh',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.html', '.css', '.scss', '.sql'
];

/**
 * Intelligent classification of README links using heuristics and context analysis
 */
export function classifyLink(
  linkPath: string,
  surroundingContext: string = ''
): LinkClassification {
  const normalizedPath = linkPath.trim();
  const lowerPath = normalizedPath.toLowerCase();
  
  let score = 0;
  let reasons: string[] = [];

  // ─────────────────────────────────────────────
  // Layer 1: Hardware Paths (High Confidence)
  // ─────────────────────────────────────────────
  const hardwarePatterns = [
    /^\/dev\/tty/i, /^\/dev\/serial/i, /^\/dev\/usb/i, /^COM[1-9]\d*/i,
    /^\/proc\//i, /^\/sys\//i, /\/dev\/ttyUSB/i, /\/dev\/ttyACM/i,
  ];

  for (const pattern of hardwarePatterns) {
    if (pattern.test(normalizedPath)) {
      return {
        type: 'HARDWARE_PATH',
        confidence: 0.95,
        reason: `Matches hardware path pattern: ${pattern.source}`,
        shouldValidate: false,
      };
    }
  }

  // ─────────────────────────────────────────────
  // Layer 2: Explicit File Extensions (Highest Priority)
  // ─────────────────────────────────────────────
  // If it ends with a known file extension, it is a FILE PATH. Period.
  const hasKnownExtension = KNOWN_EXTENSIONS.some(ext => lowerPath.endsWith(ext));
  
  if (hasKnownExtension) {
    return {
      type: 'FILE_PATH',
      confidence: 0.95,
      reason: 'Has known file extension',
      shouldValidate: true,
    };
  }

  // ─────────────────────────────────────────────
  // Layer 3: Common Directory Structures
  // ─────────────────────────────────────────────
  const dirPatterns = [
    /^\/(docs|src|lib|test|tests|public|assets|images|static|app|components|scripts|\.github)\//i,
    /^(docs|src|lib|test|tests|public|assets|images|static|app|components|scripts|\.github)\//i,
  ];

  for (const pattern of dirPatterns) {
    if (pattern.test(normalizedPath)) {
      return {
        type: 'FILE_PATH',
        confidence: 0.85,
        reason: 'Matches common directory structure',
        shouldValidate: true,
      };
    }
  }

  // ─────────────────────────────────────────────
  // Layer 4: API Endpoint Detection
  // ─────────────────────────────────────────────
  const apiVerbs = [
    'predict', 'auth', 'admin', 'health', 'api', 'v[0-9]+',
    'login', 'logout', 'register', 'verify', 'validate',
    'check', 'status', 'info', 'metrics', 'monitor',
    'create', 'update', 'delete', 'list', 'get', 'post'
  ];
  
  const apiVerbPattern = new RegExp(`^/(${apiVerbs.join('|')})`, 'i');
  if (apiVerbPattern.test(normalizedPath)) {
    score += 0.6;
    reasons.push('Starts with API verb');
  }

  // Context indicates API documentation
  const contextKeywords = ['endpoint', 'route', 'method', 'api', 'request', 'response', 'http', 'json'];
  const contextMatchCount = contextKeywords.filter(keyword => surroundingContext.toLowerCase().includes(keyword)).length;
  if (contextMatchCount >= 2) {
    score += 0.3;
    reasons.push(`Context contains ${contextMatchCount} API-related keywords`);
  }

  // Versioned API paths are highly likely to be endpoints
  if (/^\/(api|v[0-9]+)\//i.test(normalizedPath)) {
    score += 0.5;
    reasons.push('Versioned API path structure');
  }

  if (score >= 0.7) {
    return {
      type: 'API_ENDPOINT',
      confidence: Math.min(score, 0.95),
      reason: reasons.join(', '),
      shouldValidate: false, // API endpoints should not be validated against the file tree
    };
  }

  // ─────────────────────────────────────────────
  // Layer 5: GitHub User/Repo Links (Strict)
  // ─────────────────────────────────────────────
  // Only trigger this if it strongly looks like a GitHub reference and has NO extension.
  if (/^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)?$/.test(normalizedPath)) {
    const parts = normalizedPath.split('/').filter(p => p);
    
    if (parts.length === 1 && /^[a-zA-Z0-9_-]+$/.test(parts[0])) {
      if (/github\.com|@|profile|user/i.test(surroundingContext)) {
        return {
          type: 'GITHUB_USER',
          confidence: 0.85,
          reason: 'Likely GitHub username reference',
          shouldValidate: false,
        };
      }
    }
    
    if (parts.length === 2) {
      return {
        type: 'GITHUB_USER',
        confidence: 0.75,
        reason: 'Likely GitHub user/repo reference',
        shouldValidate: false,
      };
    }
  }

  // ─────────────────────────────────────────────
  // Layer 6: Anchors & Technical Acronyms
  // ─────────────────────────────────────────────
  if (normalizedPath.startsWith('#')) {
    return {
      type: 'ANCHOR',
      confidence: 0.95,
      reason: 'Anchor link',
      shouldValidate: false,
    };
  }

  // If it's a short, single-word path without slashes (e.g., "/LFS", "/CD")
  if (/^\/[A-Z]{2,8}$/.test(normalizedPath)) {
    return {
      type: 'UNKNOWN',
      confidence: 0.8,
      reason: 'Technical acronym / protocol name',
      shouldValidate: false,
    };
  }

  // ─────────────────────────────────────────────
  // Layer 7: Fallback
  // ─────────────────────────────────────────────
  return {
    type: 'UNKNOWN',
    confidence: 0.3,
    reason: 'No clear classification pattern detected',
    shouldValidate: false, // Validate cautiously; default to false to prevent false positives
  };
}

/**
 * Batch analysis of links with statistics
 */
export function classifyLinks(
  links: Array<{ path: string; line: number; context?: string }>
): {
  classifications: Array<LinkClassification & { path: string; line: number }>;
  stats: Record<LinkType, number>;
} {
  const classifications = links.map(link => ({
    ...classifyLink(link.path, link.context || ''),
    path: link.path,
    line: link.line,
  }));

  const stats = classifications.reduce((acc, cls) => {
    acc[cls.type] = (acc[cls.type] || 0) + 1;
    return acc;
  }, {} as Record<LinkType, number>);

  return { classifications, stats };
}
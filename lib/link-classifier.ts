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

/**
 * Intelligent classification of README links using heuristics and context analysis
 */
export function classifyLink(
  linkPath: string,
  surroundingContext: string = ''
): LinkClassification {
  const normalizedPath = linkPath.trim();
  let score = 0;
  let reasons: string[] = [];
  let type: LinkType = 'UNKNOWN';

  // ─────────────────────────────────────────────
  // Layer 1: Hardware Paths (High Confidence)
  // ─────────────────────────────────────────────
  const hardwarePatterns = [
    /^\/dev\/tty/i,
    /^\/dev\/serial/i,
    /^\/dev\/usb/i,
    /^COM[1-9]\d*/i,
    /^\/proc\//i,
    /^\/sys\//i,
    /\/dev\/ttyUSB/i,
    /\/dev\/ttyACM/i,
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
  // Layer 2: GitHub User/Repo Links
  // ─────────────────────────────────────────────
  // Links like /esmaeilireza or /user/repo
  if (/^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.-]+)?$/.test(normalizedPath)) {
    const parts = normalizedPath.split('/').filter(p => p);
    
    // If it's only one part and looks like a username
    if (parts.length === 1 && /^[a-zA-Z0-9_-]+$/.test(parts[0])) {
      // Check context for GitHub
      if (/github\.com|@|profile|user/i.test(surroundingContext)) {
        return {
          type: 'GITHUB_USER',
          confidence: 0.85,
          reason: 'Likely GitHub username reference',
          shouldValidate: false,
        };
      }
    }
    
    // If it's two parts and looks like user/repo
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
  // Layer 3: API Endpoint Detection (Heuristic)
  // ─────────────────────────────────────────────
  
  // Pattern 1: Starts with API verbs
  const apiVerbs = [
    'predict', 'auth', 'admin', 'health', 'api', 'v[0-9]+',
    'login', 'logout', 'register', 'verify', 'validate',
    'check', 'status', 'info', 'metrics', 'monitor',
    'create', 'update', 'delete', 'list', 'get', 'post',
  ];
  
  const apiVerbPattern = new RegExp(`^/(${apiVerbs.join('|')})`, 'i');
  if (apiVerbPattern.test(normalizedPath)) {
    score += 0.6;
    reasons.push('Starts with API verb');
  }

  // Pattern 2: No file extension
  const hasExtension = /\.[a-z0-9]+$/i.test(normalizedPath);
  if (!hasExtension) {
    score += 0.2;
    reasons.push('No file extension');
  }

  // Pattern 3: Context indicates API documentation
  const contextKeywords = [
    'endpoint', 'route', 'method', 'api', 'request', 'response',
    'post', 'get', 'put', 'delete', 'http', 'json',
  ];
  
  const contextMatchCount = contextKeywords.filter(keyword => 
    surroundingContext.toLowerCase().includes(keyword)
  ).length;
  
  if (contextMatchCount >= 2) {
    score += 0.3;
    reasons.push(`Context contains ${contextMatchCount} API-related keywords`);
  }

  // Pattern 4: In a table structure (Markdown tables)
  if (/\|.+\|/.test(surroundingContext)) {
    score += 0.15;
    reasons.push('Appears in table context');
  }

  // Pattern 5: Common API path structures
  if (/^\/(api|v[0-9]+)\//.test(normalizedPath)) {
    score += 0.4;
    reasons.push('Versioned API path structure');
  }

  // Decision: API Endpoint
  if (score >= 0.7) {
    return {
      type: 'API_ENDPOINT',
      confidence: Math.min(score, 0.95),
      reason: reasons.join(', '),
      shouldValidate: false, // API endpoints should not be reported as broken file links
    };
  }

  // ─────────────────────────────────────────────
  // Layer 4: File Path Detection
  // ─────────────────────────────────────────────
  
  // Common file extensions
  const fileExtensions = [
    '.md', '.txt', '.pdf', '.doc', '.docx',
    '.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java', '.cpp', '.c',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.html', '.css', '.scss',
    '.sh', '.bash', '.zsh',
    '.sql', '.db', '.sqlite',
  ];

  const hasKnownExtension = fileExtensions.some(ext => 
    normalizedPath.toLowerCase().endsWith(ext)
  );

  if (hasKnownExtension) {
    return {
      type: 'FILE_PATH',
      confidence: 0.9,
      reason: 'Has known file extension',
      shouldValidate: true,
    };
  }

  // Common directory patterns
  const dirPatterns = [
    /^\/(docs|src|lib|test|tests|public|assets|images|static)/i,
    /^(docs|src|lib|test|tests|public|assets|images|static)\//i,
  ];

  for (const pattern of dirPatterns) {
    if (pattern.test(normalizedPath)) {
      return {
        type: 'FILE_PATH',
        confidence: 0.8,
        reason: 'Matches common directory structure',
        shouldValidate: true,
      };
    }
  }

  // ─────────────────────────────────────────────
  // Layer 5: Fallback with Low Confidence
  // ─────────────────────────────────────────────
  
  // If no known pattern matched
  return {
    type: 'UNKNOWN',
    confidence: 0.3,
    reason: 'No clear classification pattern detected',
    shouldValidate: true, // Validate cautiously
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
export function parseRepo(input: string) {
  let s = String(input || '').trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  s = s.replace(/\.git$/, '').replace(/\/+$/, '');
  const parts = s.split('/').slice(0, 2);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function decodeBase64Utf8(b64: any): string {
  if (b64 === undefined || b64 === null || typeof b64 !== 'string') return '';
  if (!b64.trim()) return '';
  try {
    if (typeof window !== 'undefined') {
      const bin = atob(String(b64).replace(/\s/g, ''));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    }
    return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}
// ── Deterministic glob matching ──────────────────────────────────────────────

const SEGMENT_CACHE = new Map<string, RegExp>();

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function segmentRegExp(pattern: string): RegExp {
  const cached = SEGMENT_CACHE.get(pattern);
  if (cached !== undefined) {
    return cached;
  }

  let source = "^";

  for (const char of pattern) {
    if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += escapeRegExp(char);
    }
  }

  source += "$";

  const compiled = new RegExp(source);
  SEGMENT_CACHE.set(pattern, compiled);
  return compiled;
}

function matchSegment(pattern: string, value: string): boolean {
  return segmentRegExp(pattern).test(value);
}

function matchSegments(
  patternSegments: readonly string[],
  pathSegments: readonly string[],
): boolean {
  if (patternSegments.length === 0) {
    return pathSegments.length === 0;
  }

  const [pattern, ...remainingPattern] = patternSegments;

  if (pattern === "**") {
    if (remainingPattern.length === 0) {
      return true;
    }

    for (let skip = 0; skip <= pathSegments.length; skip += 1) {
      if (matchSegments(remainingPattern, pathSegments.slice(skip))) {
        return true;
      }
    }

    return false;
  }

  if (pathSegments.length === 0) {
    return false;
  }

  const [value, ...remainingPath] = pathSegments;

  if (!matchSegment(pattern, value)) {
    return false;
  }

  return matchSegments(remainingPattern, remainingPath);
}

function findClosingBrace(pattern: string, start: number): number {
  let depth = 0;

  for (let index = start; index < pattern.length; index += 1) {
    const char = pattern[index];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function splitTopLevel(value: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }

    if (char === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  parts.push(current);
  return parts;
}

function expandBraces(pattern: string): string[] {
  const start = pattern.indexOf("{");

  if (start === -1) {
    return [pattern];
  }

  const end = findClosingBrace(pattern, start);

  if (end === -1) {
    return [pattern];
  }

  const prefix = pattern.slice(0, start);
  const suffix = pattern.slice(end + 1);
  const choices = splitTopLevel(pattern.slice(start + 1, end), ",");

  return choices.flatMap((choice) => expandBraces(prefix + choice + suffix));
}

export function matchesGlob(glob: string, filePath: string): boolean {
  const normalizedGlob = normalizePath(glob);
  const normalizedPath = normalizePath(filePath);

  const pathSegments = normalizedPath
    .split("/")
    .filter((segment) => segment.length > 0);

  return expandBraces(normalizedGlob).some((expanded) => {
    const patternSegments = expanded
      .split("/")
      .filter((segment) => segment.length > 0);

    return matchSegments(patternSegments, pathSegments);
  });
}

export function matchesAnyGlob(
  filePath: string,
  globs: readonly string[],
): boolean {
  return globs.some((glob) => matchesGlob(glob, filePath));
}
// app/api/github/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auditDataOpsRepository } from '@/lib/dataops-audit';
import { auditIIoTRepository } from '@/lib/iiot-audit';
import { generateSBOM } from '@/lib/sbom-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GitHubTreeItem {
  path: string;
  mode?: string;
  type: 'blob' | 'tree';
  sha?: string;
  size?: number;
  url?: string;
}

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

// ─── Enhanced fetch with retry and configurable timeout ───
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Fetch attempt ${attempt}/${maxRetries} failed for ${url}:`, errorMsg);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawEndpoint = searchParams.get('endpoint');
  const tokenFromHeader = request.headers.get('x-github-token');

  if (!rawEndpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  const endpoint = decodeURIComponent(rawEndpoint).trim();

  // Basic SSRF & Path traversal protection
  if (!endpoint.startsWith('/') || endpoint.includes('://')) {
    return NextResponse.json({ error: 'Invalid API endpoint format' }, { status: 400 });
  }

  const authSuffix = tokenFromHeader ? 'auth' : 'anon';
  const cacheKey = `${authSuffix}_${endpoint}`;
  const cached = CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (typeof cached.data === 'string') {
      return new NextResponse(cached.data, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return NextResponse.json(cached.data);
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoScope-Smart-IDE',
  };

  if (tokenFromHeader && tokenFromHeader.trim().length > 10) {
    headers['Authorization'] = `Bearer ${tokenFromHeader.trim()}`;
  }

  try {
    const response = await fetchWithRetry(
      `https://api.github.com${endpoint}`,
      { headers, redirect: 'follow' },
      3,
      30000
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Fallback
      }

      if (response.status === 401) {
        errorMessage = tokenFromHeader
          ? 'Your GitHub token is invalid or expired.'
          : 'This repository is private or requires authorization. Please provide a valid GitHub token.';
      }

      if (response.status === 403) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (remaining === '0' || errorMessage.toLowerCase().includes('rate limit')) {
          errorMessage = 'GitHub API rate limit reached. Please authenticate with a token or wait 1 hour.';
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const text = await response.text();

    try {
      const data = text ? JSON.parse(text) : {};

      // ──────────────────────────────────────────────
      // DataOps, IIoT Audit & SBOM Integration
      // ──────────────────────────────────────────────
      if (endpoint.includes('/git/trees/') && Array.isArray(data.tree)) {
        // فیلتر کردن موارد commit/submodule تا تایپ کاملاً 'blob' | 'tree' باشد
        const treeItems = (data.tree as any[]).filter(
          (item) => item.type === 'blob' || item.type === 'tree'
        ) as GitHubTreeItem[];

        // 1. Run specialized audits
        const dataOpsReport = auditDataOpsRepository(treeItems);
        const iiotReport = auditIIoTRepository(treeItems);

        // 2. Fetch dependency files for SBOM generation
        const depFileNames = ['package.json', 'requirements.txt', 'pyproject.toml'];
        const depFiles: Record<string, string> = {};

        const depPaths = treeItems
          .filter(
            (item) =>
              item.type === 'blob' &&
              depFileNames.some((name) => item.path.toLowerCase().endsWith(name.toLowerCase()))
          )
          .slice(0, 5);

        const endpointParts = endpoint.split('/');
        const owner = endpointParts[2];
        const repo = endpointParts[3];

        if (owner && repo && depPaths.length > 0) {
          await Promise.all(
            depPaths.map(async (item) => {
              try {
                const fileResp = await fetchWithRetry(
                  `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
                  { headers },
                  2,
                  10000
                );

                if (fileResp.ok) {
                  const fileData = await fileResp.json();
                  if (fileData.content) {
                    depFiles[item.path] = Buffer.from(fileData.content, 'base64').toString('utf-8');
                  }
                }
              } catch (e) {
                console.warn(`Failed to fetch dependency file ${item.path}:`, e);
              }
            })
          );
        }

        // 3. Generate SBOM
        const sbom = Object.keys(depFiles).length > 0 ? generateSBOM(depFiles) : null;

        // 4. Return enriched payload
        const enrichedData = {
          ...data,
          dataOpsReport,
          iiotReport,
          sbom,
        };

        CACHE.set(cacheKey, { data: enrichedData, timestamp: Date.now() });
        return NextResponse.json(enrichedData);
      }
      // ──────────────────────────────────────────────

      CACHE.set(cacheKey, { data, timestamp: Date.now() });
      return NextResponse.json(data);
    } catch {
      CACHE.set(cacheKey, { data: text, timestamp: Date.now() });
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        },
      });
    }
  } catch (err: unknown) {
    console.error('API route execution error:', err);

    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.includes('UND_ERR_CONNECT_TIMEOUT'));

    if (isAbort) {
      return NextResponse.json(
        {
          error: 'GitHub API connection timed out. Please try again.',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 504 }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: `Network error: ${message}` }, { status: 500 });
  }
}

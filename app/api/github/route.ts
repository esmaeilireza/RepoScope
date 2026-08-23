// app/api/github/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auditDataOpsRepository } from '@/lib/dataops-audit';
import { auditIIoTRepository } from '@/lib/iiot-audit';
import { generateSBOM } from '@/lib/sbom-generator';

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

// ─── Enhanced fetch with retry and longer timeout ───
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds (از 10 به 30 افزایش دادیم)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt}/${maxRetries} failed for ${url}:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
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
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const endpoint = decodeURIComponent(rawEndpoint);
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
    // استفاده از fetchWithRetry به جای fetch معمولی
    const response = await fetchWithRetry(
      `https://api.github.com${endpoint}`,
      { headers, redirect: 'follow' },
      3 // حداکثر ۳ تلاش
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {}

      if (response.status === 401) {
        errorMessage = tokenFromHeader
          ? 'Your GitHub token is invalid or expired.'
          : 'This repository is private. Please provide a valid GitHub token.';
      }

      if (response.status === 403) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (remaining === '0' || errorMessage.includes('rate limit')) {
          errorMessage = 'GitHub API rate limit reached (429). Please wait 1 hour and try again.';
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const text = await response.text();

    try {
      const data = text ? JSON.parse(text) : {};

      // ──────────────────────────────────────────────
      // DataOps, IIoT Audit & SBOM Integration
      // Only runs when the endpoint is a Git Tree API call
      // ──────────────────────────────────────────────
      if (endpoint.includes('/git/trees/') && Array.isArray(data.tree)) {
        // 1. Run specialized audits
        const dataOpsReport = auditDataOpsRepository(data.tree);
        const iiotReport = auditIIoTRepository(data.tree);

        // 2. Fetch dependency files for SBOM generation
        const depFileNames = ['package.json', 'requirements.txt', 'pyproject.toml'];
        const depFiles: Record<string, string> = {};
        
        const depPaths = data.tree
          .filter((item: any) => 
            item.type === 'blob' && 
            depFileNames.some(name => item.path.toLowerCase().endsWith(name.toLowerCase()))
          )
          .slice(0, 5); // Limit to 5 files max to avoid rate limit abuse

        // Parse owner/repo from endpoint for fetching file contents
        // endpoint format: /repos/owner/repo/git/trees/branch?recursive=1
        const endpointParts = endpoint.split('/');
        const owner = endpointParts[2];
        const repo = endpointParts[3];

        // Fetch each dependency file in parallel using fetchWithRetry for reliability
        await Promise.all(
          depPaths.map(async (item: any) => {
            try {
              const fileResp = await fetchWithRetry(
                `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
                { headers },
                2 // Fewer retries for file contents (non-critical)
              );
              
              if (fileResp.ok) {
                const fileData = await fileResp.json();
                if (fileData.content) {
                  depFiles[item.path] = Buffer.from(fileData.content, 'base64').toString('utf-8');
                }
              }
            } catch (e) {
              // Silently fail — SBOM is non-critical
              console.warn(`Failed to fetch dependency file ${item.path}:`, e);
            }
          })
        );

        // 3. Generate SBOM if we got any dependency files
        const sbom = Object.keys(depFiles).length > 0 
          ? generateSBOM(depFiles) 
          : null;

        // 4. Return enriched data with all three additions
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
  } catch (err: any) {
    console.error('API error:', err);
    
    // پیام خطای دقیق‌تر برای مشکلات شبکه
    if (err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'GitHub API connection timed out after 30 seconds. This usually indicates a temporary network issue. Please try again in a few moments.',
          details: err.message 
        },
        { status: 504 } // 504 Gateway Timeout
      );
    }
    
    return NextResponse.json({ error: 'Network error: ' + err.message }, { status: 500 });
  }
}
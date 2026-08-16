import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let endpoint = searchParams.get('endpoint');
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  // If no endpoint, fallback to repo info if owner/repo provided
  if (!endpoint) {
    if (owner && repo) {
      endpoint = `repos/${owner}/${repo}`;
    } else {
      return NextResponse.json(
        { error: 'Missing endpoint or owner/repo' },
        { status: 400 }
      );
    }
  }

  // Replace placeholder if owner/repo are present
  let apiPath = endpoint;
  if (owner && repo) {
    apiPath = apiPath.replace(/\{owner\}/g, owner).replace(/\{repo\}/g, repo);
  }

  // Ensure no leading slash (GitHub API expects path without leading slash)
  if (apiPath.startsWith('/')) {
    apiPath = apiPath.slice(1);
  }

  // Build cache key from the full path (including query params? For simplicity, we only cache by path)
  // But we should also consider the token? Different tokens might return different results (private repos).
  // We'll ignore token in cache key for simplicity; could be enhanced.
  const cacheKey = apiPath;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  // Headers
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RepoScope-Next',
  };

  // Use client token if provided, otherwise env token
  const clientToken = req.headers.get('authorization');
  if (clientToken) {
    headers['Authorization'] = clientToken;
  } else if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const res = await fetch(`${BASE}/${apiPath}`, {
      headers,
      next: { revalidate: 60 }, // Next.js built‑in cache
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'GitHub API error' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Proxy error', details: err.message },
      { status: 502 }
    );
  }
}
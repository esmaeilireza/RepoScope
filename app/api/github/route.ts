import { NextRequest, NextResponse } from 'next/server';

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache (was 2 minutes)

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
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoScope-Smart-IDE',
  };

  if (tokenFromHeader && tokenFromHeader.trim().length > 10) {
    headers['Authorization'] = `Bearer ${tokenFromHeader.trim()}`;
  }

  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers,
      redirect: 'follow',
    });

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
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Network error' }, { status: 500 });
  }
}

// app/api/github/route.ts - Complete corrected version

import { NextRequest, NextResponse } from 'next/server';

const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for actions data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawEndpoint = searchParams.get('endpoint');
  const token = request.headers.get('x-github-token');
  
  if (!rawEndpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }
  
  // Decode the endpoint
  const endpoint = decodeURIComponent(rawEndpoint);
  
  // Rate limiting check
  const rateLimitKey = `rate_${token.slice(0, 10)}`;
  const rateData = CACHE.get(rateLimitKey);
  if (rateData) {
    const { remaining } = rateData.data as { remaining: number };
    if (remaining < 100) {
      return NextResponse.json({
        error: 'Rate limit approaching',
        remaining,
      }, { status: 429 });
    }
  }
  
  // Check cache
  const cacheKey = `${token.slice(0, 10)}_${endpoint}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'RepoScope-Smart-IDE',
      },
    });
    
    // Update rate limit cache
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) {
      CACHE.set(rateLimitKey, {
        data: { remaining: parseInt(remaining) },
        timestamp: Date.now(),
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {}
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    // Handle empty responses
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    // Cache successful responses
    CACHE.set(cacheKey, { data, timestamp: Date.now() });
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Network error' },
      { status: 500 }
    );
  }
}
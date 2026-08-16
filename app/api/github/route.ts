import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';

export async function GET(req: NextRequest) {
  const endpoint = new URL(req.url).searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'RepoScope-Next' };
  const client = req.headers.get('authorization');
  if (client) headers['Authorization'] = client;
  else if (TOKEN) headers['Authorization'] = 'token ' + TOKEN;
  try {
    const res = await fetch(BASE + endpoint, { headers, next: { revalidate: 60 } });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return NextResponse.json({ error: e.message || 'GitHub error' }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', details: err.message }, { status: 502 });
  }
}
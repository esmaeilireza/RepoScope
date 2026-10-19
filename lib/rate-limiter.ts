// lib/rate-limiter.ts — in-memory daily limiter (zero deps).
// Applies ONLY to server-provided keys; BYOK users bypass by design.
// Swap with Vercel KV later for strict cross-instance enforcement.

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 5);
const hits = new Map<string, { count: number; day: string }>();

export function checkAIRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const day = new Date().toISOString().split("T")[0];
  const entry = hits.get(ip);

  if (!entry || entry.day !== day) {
    hits.set(ip, { count: 1, day });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - entry.count),
  };
}
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
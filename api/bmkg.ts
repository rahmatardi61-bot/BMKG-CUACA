// Vercel serverless (edge): proxy same-origin → upstream BMKG.
// Bentuk panggilan: /api-bmkg?path=<path-upstream>&<query-asli>
//   contoh: /api-bmkg?path=api%2Fdf%2Fv1%2Fforecast%2Fcoord&lat=-6.2&lon=106.8
//
// Kenapa path lewat query, bukan /api-bmkg/<path>: catch-all [...path] tidak
// reliabel di Vercel Functions — saat tidak terpasang, request jatuh ke SPA
// rewrite (vercel.json) dan balik index.html (dokumen, bukan JSON). Route
// polos "/api-bmkg" selalu terdeteksi dan lebih diutamakan dari rewrite.
//
// Logika sama dengan proxy dev di vite.config.ts:
// - inject Referer + Origin (wajib untuk /api/df/* — header terlarang di browser)
// - inject X-API-KEY (untuk /api/v1/*)
// - inject x-public-token fresh (cache ~25 menit) untuk /api/public/*, /v1/public/*, /v1/user/*
// - path `alerts/*` (nowcast RSS) diarahkan ke www.bmkg.go.id (tanpa CORS di sana)
// Dipakai di Vercel (folder api/ terdeteksi otomatis) dan server.mjs (Docker).
export const config = { runtime: 'edge' };

const UPSTREAM = 'https://cuaca.bmkg.go.id';
const NOWCAST_UPSTREAM = 'https://www.bmkg.go.id';
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

// ponytail: cache token global per-instance edge (cold start jarang, TTL 25m < exp 30m)
const tokenState: { value: string; exp: number } = { value: '', exp: 0 };

async function getPubTok(): Promise<string> {
  if (tokenState.value && Date.now() < tokenState.exp) return tokenState.value;
  try {
    const html = await (await fetch(UPSTREAM + '/', { headers: { 'User-Agent': UA, Accept: 'text/html' } })).text();
    const seg = html.slice(html.indexOf('publicToken'));
    const tok = seg.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
    if (tok) Object.assign(tokenState, { value: tok, exp: Date.now() + 25 * 60 * 1000 });
  } catch {
    /* biarkan tanpa token → upstream 401 → client fallback mock */
  }
  return tokenState.value;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') ?? '';
  if (!path) return new Response(JSON.stringify({ error: 'parameter path wajib' }), { status: 400, headers: JSON_HEADERS });

  const isNowcast = path.startsWith('alerts/');
  const own = new URLSearchParams(url.search);
  own.delete('path');
  const target = `${isNowcast ? NOWCAST_UPSTREAM : UPSTREAM}/${path}${own.size ? `?${own}` : ''}`;

  const headers: Record<string, string> = isNowcast
    ? { 'User-Agent': UA, Accept: 'application/xml' }
    : { Referer: UPSTREAM + '/', Origin: UPSTREAM, 'User-Agent': UA, Accept: 'application/json' };
  if (!isNowcast && path.includes('api/v1/')) headers['X-API-KEY'] = API_KEY;
  if (!isNowcast && (path.includes('api/public/') || path.includes('v1/public/') || path.includes('v1/user/'))) {
    const tok = await getPubTok();
    if (tok) headers['x-public-token'] = tok;
  }

  try {
    const res = await fetch(target, { headers });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

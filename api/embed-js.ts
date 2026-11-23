// ═══════════════════════════════════════════════════════════════════════════
// EMBED JS (dijaga token) — sumber script loader widget
// ---------------------------------------------------------------------------
// GET /api/embed-js      header: Authorization: Bearer <jwt>
//   200 → isi javascript (text/javascript) untuk di-eval partner
//   401 → { error, reason }  → tidak ada iframe yang dibuat
//
// Tanpa token yang sah, script ini tidak bisa didapat. Itu kunci pertama:
// `<script src=".../embed.js">` polos tidak akan pernah menghasilkan widget.
// ═══════════════════════════════════════════════════════════════════════════
import { bearer, verifyJwt } from '../lib/jwt.js';
import { EMBED_SOURCE } from '../lib/embedSource.js';

export const config = { runtime: 'nodejs' };

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = bearer(req) || new URL(req.url).searchParams.get('token') || '';
  if (!token) return json({ error: 'Tidak diotorisasi', reason: 'header Authorization: Bearer <jwt> wajib' }, 401);

  const res = await verifyJwt(token);
  if (!res.ok) return json({ error: 'Token tidak sah', reason: res.reason ?? 'ditolak' }, 401);

  // Origin di-inject karena script hasil eval kehilangan document.currentScript.
  // Ambil dari header host (port ikut terbawa), bukan req.url yang bisa kehilangan port.
  const u = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? u.host;
  const origin = `${proto}://${host}`;
  return new Response(EMBED_SOURCE.replace('__BMKG_ORIGIN__', origin), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/javascript; charset=utf-8' },
  });
}

// Vercel: web handler (semua method masuk ke sini). Bentuk resmi di Node runtime.
export default { fetch: handle };

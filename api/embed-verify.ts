// ═══════════════════════════════════════════════════════════════════════════
// EMBED VERIFY — "apakah token ini sah?" untuk partner & widget
// ---------------------------------------------------------------------------
// GET /api/embed-verify            header: Authorization: Bearer <jwt>
// GET /api/embed-verify?token=<jwt>   (untuk iframe — shortcut, lihat docs)
// Balasan: { valid, reason, exp, iat, azp, iss, sub, expires_in }
//
// Ini gerbang resmi: yang menentukan boleh/tidaknya sebuah token adalah
// verifikasi tanda tangan (JWKS), bukan decode di browser.
// ═══════════════════════════════════════════════════════════════════════════
import { bearer, verifyJwt } from '../lib/jwt.js';

export const config = { runtime: 'nodejs' };

const CORS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const reply = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const token = bearer(req) || url.searchParams.get('token') || '';
  if (!token) return reply({ valid: false, reason: 'token tidak ada' }, 401);

  const res = await verifyJwt(token);
  const c = (res.claims ?? {}) as Record<string, any>;
  const now = Math.floor(Date.now() / 1000);

  return reply(
    {
      valid: res.ok,
      reason: res.reason ?? null,
      sub: c.sub ?? null,
      azp: c.azp ?? null,
      iss: c.iss ?? null,
      iat: c.iat ?? null,
      exp: c.exp ?? null,
      expires_in: typeof c.exp === 'number' ? Math.max(0, c.exp - now) : 0,
      roles: c.realm_access?.roles ?? [],
    },
    res.ok ? 200 : 401,
  );
}

// Vercel: web handler (semua method masuk ke sini). Bentuk resmi di Node runtime.
export default { fetch: handle };

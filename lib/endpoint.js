// ═══════════════════════════════════════════════════════════════════════════
// Bungkus handler endpoint: preflight, gerbang token, validasi koordinat,
// bentuk error seragam. Tiap endpoint jadi ±15 baris: apa yang diambil, dari
// mana, dan dinormalkan oleh fungsi apa.
//
// Gerbangnya SAMA dengan widget (/api/bmkg, /api/widget-catalog): token
// Keycloak sah. Opsi A — satu model auth untuk semua pemanggil.
// ═══════════════════════════════════════════════════════════════════════════
import { coordsOf, fail, json, preflight, requireAuth } from './http.js';

/**
 * @param {{
 *   coords?: boolean,                                  // wajib ?lat=&lon=
 *   coordsOptional?: boolean,                          // boleh ada, boleh tidak
 *   run: (ctx: { req: Request, lat?: number, lon?: number, query: URLSearchParams }) => Promise<object>
 * }} def
 */
export function defineEndpoint({ coords = false, coordsOptional = false, run }) {
  const fetch = async (req) => {
    if (req.method === 'OPTIONS') return preflight();

    const auth = await requireAuth(req);
    if (!auth.ok) return fail(401, 'UNAUTHORIZED', 'Tidak diotorisasi', auth.reason);

    const query = new URL(req.url).searchParams;
    /** @type {{ req: Request, query: URLSearchParams, lat?: number, lon?: number }} */
    const ctx = { req, query };

    if (coords || coordsOptional) {
      const c = coordsOf(req);
      if (c.ok) {
        ctx.lat = c.lat;
        ctx.lon = c.lon;
      } else if (coords) {
        return fail(400, 'BAD_REQUEST', 'Parameter tidak lengkap', c.reason);
      }
    }

    try {
      return json(await run(ctx));
    } catch (e) {
      // upstreamFail() membawa status/code sendiri; sisanya dianggap 502
      if (e && e.status) return fail(e.status, e.code ?? 'UPSTREAM_ERROR', e.message, String(e.reason ?? '').slice(0, 200));
      return fail(502, 'UPSTREAM_ERROR', 'Gagal memproses permintaan', String(e).slice(0, 160));
    }
  };
  return { fetch };
}

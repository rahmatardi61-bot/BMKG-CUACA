// GET /api/weather/current?lat=&lon=
// → { region, observation }  (kondisi saat ini)
//
// `observation.derived` berisi nilai yang BUKAN dari BMKG (feelLike, uvIndex).
// Sumber upstream: cuaca.bmkg.go.id/api/presentwx/coord
import { bmkgFetch } from '../../lib/upstream.js';
import { normalizeCurrent } from '../../lib/normalize.js';
import { coordsOf, fail, json, preflight, requireAuth } from '../../lib/http.js';

export const config = { runtime: 'nodejs' };

async function handle(req) {
  if (req.method === 'OPTIONS') return preflight();
  const auth = await requireAuth(req);
  if (!auth.ok) return fail(401, 'UNAUTHORIZED', 'Tidak diotorisasi', auth.reason);

  const c = coordsOf(req);
  if (!c.ok) return fail(400, 'BAD_REQUEST', 'Parameter tidak lengkap', c.reason);

  try {
    const up = await bmkgFetch('api/presentwx/coord', { lat: c.lat, lon: c.lon });
    if (!up.ok) return fail(502, 'UPSTREAM_ERROR', 'BMKG menolak permintaan', `HTTP ${up.status}`);
    return json(normalizeCurrent(JSON.parse(up.body)));
  } catch (e) {
    return fail(502, 'UPSTREAM_ERROR', 'Gagal mengambil data BMKG', String(e).slice(0, 160));
  }
}

export default { fetch: handle };

// GET /api/geo/region?lat=&lon=
// → { region }  (provinsi/kotkab/kecamatan/desa + kode adm1..adm4)
//
// Sumber upstream: cuaca.bmkg.go.id/api/df/v1/adm/coord
import { bmkgFetch } from '../../lib/upstream.js';
import { normalizeAdm } from '../../lib/normalize.js';
import { coordsOf, fail, json, preflight, requireAuth } from '../../lib/http.js';

export const config = { runtime: 'nodejs' };

async function handle(req) {
  if (req.method === 'OPTIONS') return preflight();
  const auth = await requireAuth(req);
  if (!auth.ok) return fail(401, 'UNAUTHORIZED', 'Tidak diotorisasi', auth.reason);

  const c = coordsOf(req);
  if (!c.ok) return fail(400, 'BAD_REQUEST', 'Parameter tidak lengkap', c.reason);

  try {
    const up = await bmkgFetch('api/df/v1/adm/coord', { lat: c.lat, lon: c.lon });
    if (!up.ok) return fail(502, 'UPSTREAM_ERROR', 'BMKG menolak permintaan', `HTTP ${up.status}`);
    return json(normalizeAdm(JSON.parse(up.body)));
  } catch (e) {
    return fail(502, 'UPSTREAM_ERROR', 'Gagal mengambil data BMKG', String(e).slice(0, 160));
  }
}

export default { fetch: handle };

// GET /api/weather/forecast?lat=&lon=
// → { region, hours[] }  (prakiraan per jam, hari ini + 9 hari, rata & urut)
//
// Sumber upstream: cuaca.bmkg.go.id/api/df/v1/forecast/coord
import { bmkgFetch } from '../../lib/upstream.js';
import { normalizeForecast } from '../../lib/normalize.js';
import { coordsOf, fail, json, preflight, requireAuth } from '../../lib/http.js';

export const config = { runtime: 'nodejs' };

async function handle(req) {
  if (req.method === 'OPTIONS') return preflight();
  const auth = await requireAuth(req);
  if (!auth.ok) return fail(401, 'UNAUTHORIZED', 'Tidak diotorisasi', auth.reason);

  const c = coordsOf(req);
  if (!c.ok) return fail(400, 'BAD_REQUEST', 'Parameter tidak lengkap', c.reason);

  try {
    const up = await bmkgFetch('api/df/v1/forecast/coord', { lat: c.lat, lon: c.lon });
    if (!up.ok) return fail(502, 'UPSTREAM_ERROR', 'BMKG menolak permintaan', `HTTP ${up.status}`);
    const out = normalizeForecast(JSON.parse(up.body));
    if (!out.hours.length) return fail(502, 'UPSTREAM_ERROR', 'BMKG mengembalikan data kosong', 'hours kosong');
    return json(out);
  } catch (e) {
    return fail(502, 'UPSTREAM_ERROR', 'Gagal mengambil data BMKG', String(e).slice(0, 160));
  }
}

export default { fetch: handle };

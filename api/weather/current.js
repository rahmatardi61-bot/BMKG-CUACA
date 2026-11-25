// GET /api/weather/current?lat=&lon=
// → { region, observation }  (kondisi saat ini)
//
// `observation.derived` berisi nilai yang BUKAN dari BMKG (feelLike, uvIndex).
// Sumber: cuaca.bmkg.go.id/api/presentwx/coord
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeCurrent } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/presentwx/coord', { lat, lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeCurrent(JSON.parse(up.body));
  },
});

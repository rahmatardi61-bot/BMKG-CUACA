// GET /api/marine/nearest?lat=&lon=
// → { marine: { code, name, wilayah, geometry } }  (wilayah perairan terdekat)
// Sumber: cuaca.bmkg.go.id/api/v1/public/maritim/nearest-location
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeMarineNearest } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/v1/public/maritim/nearest-location', { lat, long: lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeMarineNearest(JSON.parse(up.body));
  },
});

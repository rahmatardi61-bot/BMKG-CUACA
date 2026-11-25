// GET /api/weather/amendment?lat=&lon=
// → { region, count, items[] }  (perubahan/pemutakhiran prakiraan)
//
// Hampir selalu { count: 0 } — artinya tidak ada perubahan, bukan error.
// Sumber: cuaca.bmkg.go.id/api/df/v1/amandemen/coord
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeAmendment } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/df/v1/amandemen/coord', { lat, lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeAmendment(JSON.parse(up.body));
  },
});

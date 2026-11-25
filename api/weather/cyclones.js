// GET /api/weather/cyclones
// → { cyclones[] }  (siklon tropis aktif; kosong = tidak ada siklon)
// Sumber: cuaca.bmkg.go.id/api/v1/tcwc/cyclone/all
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeCyclones } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  async run() {
    const up = await bmkgFetch('api/v1/tcwc/cyclone/all');
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeCyclones(JSON.parse(up.body));
  },
});

// GET /api/weather/alerts?lat=&lon=
// → { alerts[] }  (peringatan dini per wilayah)
//
// Sering kosong ({ alerts: [] }) — itu BUKAN error, memang tidak ada peringatan.
// Untuk feed yang hampir selalu terisi, pakai /api/weather/nowcast.
// Sumber: cuaca.bmkg.go.id/api/public/weather/warning
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeAlerts } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/public/weather/warning', { lat, long: lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeAlerts(JSON.parse(up.body));
  },
});

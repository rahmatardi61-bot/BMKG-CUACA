// GET /api/weather/weekly-temperature?lat=&lon=
// → { daily[], weekly[] }
// Sumber: cuaca.bmkg.go.id/api/public/weather/weekly-temperature
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeWeeklyTemp } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/public/weather/weekly-temperature', { lat, long: lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeWeeklyTemp(JSON.parse(up.body));
  },
});

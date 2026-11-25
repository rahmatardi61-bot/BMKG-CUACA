// GET /api/weather/forecast?lat=&lon=
// → { region, hours[] }  (prakiraan per jam, hari ini + 9 hari, rata & urut)
// Sumber: cuaca.bmkg.go.id/api/df/v1/forecast/coord
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeForecast } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/df/v1/forecast/coord', { lat, lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    const out = normalizeForecast(JSON.parse(up.body));
    if (!out.hours.length) throw upstreamFail('BMKG mengembalikan data kosong', 'hours kosong');
    return out;
  },
});

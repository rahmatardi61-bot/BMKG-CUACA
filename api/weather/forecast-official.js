// GET /api/weather/forecast-official?adm4=31.73.07.1002
// → { region, hours[] }  (prakiraan dari Open Data resmi, jalur cadangan)
//
// Kenapa terpisah dari /api/weather/forecast: sumbernya beda host dan beda
// struktur (di sini `cuaca` sudah rata). Dipakai saat prakiraan internal
// kosong/gagal — lihat useBmkgWeather.loadCity().
// Sumber: api.bmkg.go.id/publik/prakiraan-cuaca?adm4=
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeOfficialForecast } from '../../lib/normalize.js';
import { bmkgFetch, OFFICIAL_UPSTREAM } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  async run({ query }) {
    const adm4 = (query.get('adm4') ?? '').trim();
    if (!adm4) throw Object.assign(new Error('Parameter adm4 wajib'), { status: 400, code: 'BAD_REQUEST' });

    const up = await bmkgFetch('publik/prakiraan-cuaca', { adm4 }, OFFICIAL_UPSTREAM);
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    const out = normalizeOfficialForecast(JSON.parse(up.body));
    if (!out.hours.length) throw upstreamFail('BMKG mengembalikan data kosong', 'hours kosong');
    return out;
  },
});

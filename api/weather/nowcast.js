// GET /api/weather/nowcast?province=Jawa Barat
// → { total, alerts[] }  (feed RSS nowcast nasional, opsional disaring provinsi)
//
// Sumber: www.bmkg.go.id/alerts/nowcast/id (RSS, bukan JSON — di-parse di sini
// supaya pemanggil tidak perlu parser XML).
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeNowcast } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  async run({ query }) {
    const up = await bmkgFetch('alerts/nowcast/id');
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeNowcast(up.body, query.get('province') ?? '');
  },
});

// GET /api/sky/sun-times?lat=&lon=
// → { date, sunrise, sunset, firstLight, lastLight, moonrise, moonset, moonPhase, moonIllumination }
// Waktu 24 jam ("05:49:22"), bukan "5:49:22 AM".
// Sumber: cuaca.bmkg.go.id/api/v1/sunset/json
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeSunTimes } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    // upstream memakai nama parameter 'lng' untuk bujur (beda dari endpoint lain)
    const up = await bmkgFetch('api/v1/sunset/json', { lat, lng: lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeSunTimes(JSON.parse(up.body));
  },
});

// GET /api/geo/region?lat=&lon=
// → { region }  (provinsi/kotkab/kecamatan/desa + kode adm1..adm4)
// Sumber: cuaca.bmkg.go.id/api/df/v1/adm/coord
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeAdm } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coords: true,
  async run({ lat, lon }) {
    const up = await bmkgFetch('api/df/v1/adm/coord', { lat, lon });
    if (!up.ok) throw upstreamFail('BMKG menolak permintaan', `HTTP ${up.status}`);
    return normalizeAdm(JSON.parse(up.body));
  },
});

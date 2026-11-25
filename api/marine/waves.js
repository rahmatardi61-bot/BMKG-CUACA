// GET /api/marine/waves
// → { zones: [{ code, issued, today, tomorrow, h2, h3 }] }  kategori gelombang
//
// Sumber: maritim.bmkg.go.id/public_api/overview/gelombang.json
// CATATAN: host ini sedang 503 (diuji 25 Nov 2026) — tidak ada data contoh.
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeWaves } from '../../lib/normalize.js';
import { maritimFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  async run() {
    const up = await maritimFetch('overview/gelombang.json');
    if (!up.ok) throw upstreamFail('Layanan maritim BMKG tidak tersedia', `HTTP ${up.status}`);
    return normalizeWaves(JSON.parse(up.body));
  },
});

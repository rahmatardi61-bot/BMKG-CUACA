// GET /api/marine/ports              → { ports[] }        daftar pelabuhan
// GET /api/marine/ports?lat=&lon=    → { port: {…, slots[]} }  pelabuhan terdekat + pasut
//
// Sumber: maritim.bmkg.go.id/public_api/pelabuhan_list (+ /pelabuhan/<file>)
// CATATAN: host ini sedang 503 (diuji 25 Nov 2026). Endpoint sengaja TIDAK
// memakai data contoh — kalau upstream mati, jawabannya 502 apa adanya.
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizePortDoc, normalizePorts } from '../../lib/normalize.js';
import { maritimFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coordsOptional: true,
  async run({ lat, lon }) {
    const list = await maritimFetch('pelabuhan_list');
    if (!list.ok) throw upstreamFail('Layanan maritim BMKG tidak tersedia', `HTTP ${list.status}`);

    const files = (JSON.parse(list.body)?.files ?? [])
      .filter((f) => f?.name && Array.isArray(f.coor))
      .map((f) => ({ file: String(f.name), portname: String(f.portname ?? ''), type: f.type, lat: f.coor[0], lon: f.coor[1] }));

    if (lat === undefined) return { ports: normalizePorts(files) };

    let best = null;
    let bestD = Infinity;
    for (const p of files) {
      const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) throw upstreamFail('Tidak ada pelabuhan di daftar BMKG', 'files kosong');

    const doc = await maritimFetch(`pelabuhan/${encodeURIComponent(best.file)}`);
    if (!doc.ok) throw upstreamFail('Detail pelabuhan tidak tersedia', `HTTP ${doc.status}`);
    return { ...normalizePortDoc(JSON.parse(doc.body)), distanceKm: Math.round(Math.sqrt(bestD) * 111) };
  },
});

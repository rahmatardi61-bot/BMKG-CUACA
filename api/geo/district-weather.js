// GET /api/geo/district-weather            → { file, stations[] }  semua stasiun terbaru
// GET /api/geo/district-weather?lat=&lon=  → stasiun terdekat saja (+ distanceKm)
//
// Sumber: publik.bmkg.go.id/event/source/dwt/apiDF_Darat/manifest_times.json
//         lalu apiDF_Darat/<file terbaru>
// CATATAN: manifest sedang 404 (diuji 25 Nov 2026) — tidak ada data contoh.
// Bentuk upstream berupa baris array tanpa nama field; diterjemahkan di
// normalizeDistrictRows (lihat lib/normalize.js).
import { defineEndpoint } from '../../lib/endpoint.js';
import { upstreamFail } from '../../lib/http.js';
import { normalizeDistrictRows } from '../../lib/normalize.js';
import { bmkgFetch } from '../../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  coordsOptional: true,
  async run({ lat, lon }) {
    const manifest = await bmkgFetch('event/source/dwt/apiDF_Darat/manifest_times.json');
    if (!manifest.ok) throw upstreamFail('Open Data DWT tidak tersedia', `HTTP ${manifest.status}`);

    const file = (JSON.parse(manifest.body)?.files ?? []).at(-1);
    if (!file) throw upstreamFail('Manifest DWT kosong', 'files[] kosong');

    const rows = await bmkgFetch(`event/source/dwt/apiDF_Darat/${encodeURIComponent(file)}`);
    if (!rows.ok) throw upstreamFail('Data DWT tidak tersedia', `HTTP ${rows.status}`);

    const { stations } = normalizeDistrictRows(JSON.parse(rows.body));
    if (lat === undefined) return { file, stations };

    let best = null;
    let bestD = Infinity;
    for (const s of stations) {
      const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) throw upstreamFail('Tidak ada stasiun di data BMKG', 'stations kosong');
    return { file, station: { ...best, distanceKm: Math.round(Math.sqrt(bestD) * 111) } };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// BENTUK NORMAL — satu-satunya tempat response mentah BMKG diterjemahkan.
//
// Dipakai dua lapis:
//   api/{weather,geo,marine,sky,news}/*.js  → JSON untuk partner & tim mobile
//   src/services/bmkg/adapters.ts           → menambah lapisan UI (nama ikon)
//
// Aturan yang dipegang di sini:
//   - Nama field mengikuti ARTINYA, bukan nama asli BMKG ('t' → 'temp').
//   - `icon` TIDAK ada di sini: nama ikon itu urusan UI, bukan kontrak.
//   - `precipitation` 0–100 adalah INTENSITAS hujan (tp mm × 20), BUKAN peluang
//     hujan. Keputusan produk; jangan diubah tanpa memberi tahu tim mobile.
//   - Nilai yang bukan dari BMKG ditaruh di `derived` supaya kelihatan.
// ═══════════════════════════════════════════════════════════════════════════

/** "2026-09-08 15:00:00" (waktu lokal dari API) → { date, time: '15:00' } */
function splitLocal(iso) {
  const [date, clock] = String(iso ?? '').split(' ');
  return { date: date ?? '', time: (clock || '00:00').slice(0, 5) };
}

/**
 * Lokasi/kode wilayah. Sumber: `lokasi` di forecast/adm/presentwx.
 * @param {Record<string, any>} l
 */
export function normalizeRegion(l = {}) {
  return {
    province: l.provinsi ?? l.adm1 ?? '',
    city: l.kotkab ?? l.adm2 ?? '',
    district: l.kecamatan ?? l.adm3 ?? '',
    village: l.desa ?? l.adm4 ?? '',
    codes: { adm1: l.adm1 ?? '', adm2: l.adm2 ?? '', adm3: l.adm3 ?? '', adm4: l.adm4 ?? '' },
    lat: Number(l.lat),
    lon: Number(l.lon),
    ...(l.timezone ? { timezone: l.timezone } : {}),
    ...(typeof l.distance === 'number' ? { distanceKm: l.distance } : {}),
  };
}

/**
 * Satu langkah waktu (jam) dari `BMKG item` (forecast) atau `cuaca` (presentwx).
 * @param {Record<string, any>} it
 */
export function normalizeHour(it = {}) {
  const { date, time } = splitLocal(it.local_datetime);
  const mm = Number(it.tp ?? 0);
  return {
    date,
    time,
    temp: Math.round(Number(it.t ?? 0)),
    // ponytail: intensitas 0–100 dari mm (5mm≈100). Nama field dipertahankan
    // 'precipitation' atas keputusan produk — didokumentasikan sebagai intensitas.
    precipitation: mm <= 0 ? 0 : Math.min(100, Math.round(mm * 20)),
    condition: it.weather_desc ?? '',
    humidity: Number(it.hu ?? 0),
    windSpeed: Number(it.ws ?? 0),
    windDirection: it.wd ?? '',
    // meter → km (1 desimal). Upstream kadang mengirim null: jangan diklaim 0 km,
    // itu artinya "tidak ada data" — beda dengan "jarak pandang nol".
    visibility: Number.isFinite(it.vs) ? Math.round(it.vs / 100) / 10 : null,
  };
}

/**
 * Respons /api/df/v1/forecast/coord → { region, hours[] }.
 * `cuaca` adalah array of array (hari 1, hari 2, …) — diratakan dan diurutkan.
 */
export function normalizeForecast(res = {}) {
  const lokasi = res?.data?.[0]?.lokasi ?? res?.lokasi ?? {};
  const items = res?.data?.[0]?.cuaca?.flat?.() ?? [];
  const hours = items
    .map(normalizeHour)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { region: normalizeRegion(lokasi), hours };
}

/**
 * Respons /api/presentwx/coord → { region, observation }.
 * `derived` = nilai yang BUKAN dari BMKG (lihat adapters.ts, disepakati tetap dipakai).
 */
export function normalizeCurrent(res = {}) {
  const lokasi = res?.data?.lokasi ?? {};
  const it = res?.data?.cuaca ?? {};
  const temp = Number(it.t ?? 0);
  const humidity = Number(it.hu ?? 0);
  const cloud = Number(it.tcc ?? 0);
  return {
    region: normalizeRegion(lokasi),
    observation: {
      ...normalizeHour(it),
      derived: {
        // ponytail: API tidak punya feels-like. Aproksimasi heat index kasar.
        feelLike: Math.round(temp + Math.max(0, (humidity - 50) / 10)),
        // ponytail: API tidak punya UV. Estimasi kasar dari tutupan awan saja —
        // tidak memperhitungkan jam maupun lintang. Jangan dipakai untuk klaim resmi.
        uvIndex: cloud > 70 ? 2 : cloud > 40 ? 5 : 8,
      },
    },
  };
}

/**
 * Respons /api/df/v1/adm/coord → region saja.
 */
export function normalizeAdm(res = {}) {
  return { region: normalizeRegion(res) };
}

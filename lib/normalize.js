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

// ── Peringatan dini (api/public/weather/warning) ───────────────────────────
// Catatan: response ini SERING kosong ({today:{}, tomorrow:null}) — itu bukan
// error, artinya memang tidak ada peringatan. nowcast RSS yang hampir selalu terisi.
export function normalizeAlerts(res = {}) {
  const out = [];
  for (const [day, payload] of Object.entries({ today: res?.data?.today, tomorrow: res?.data?.tomorrow })) {
    if (!payload || typeof payload !== 'object' || !Object.keys(payload).length) continue;
    const level = String(payload.warning_level ?? payload.level ?? payload.status ?? 'Waspada');
    const severity = ['Awas', 'Siaga', 'Waspada'].includes(level) ? level : 'Waspada';
    const description =
      [payload.impact, payload.warning, payload.description, payload.keterangan]
        .filter(Boolean)
        .map(String)
        .join('. ') || `Peringatan cuaca untuk wilayah ini (${day}).`;
    out.push({ day, severity, description });
  }
  return { alerts: out };
}

// ── Nowcast RSS (www.bmkg.go.id/alerts/nowcast/id) ─────────────────────────
// ponytail: severity tidak ada di RSS (hanya di CAP XML per item) → dipetakan
// kasar dari judul. Upgrade: ambil CAP lewat <link> kalau butuh yang resmi.
const SEVERITY_RULES = [
  [/puting beliung|sangat lebat|badai|es\b/i, 'Awas'],
  [/petir|lebat|kencang|hujan es/i, 'Waspada'],
];

function decodeXml(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function xmlTag(body, name) {
  const m = body.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decodeXml(m[1]) : '';
}

/** Parse feed nowcast. `province` opsional: feed bersifat nasional. */
export function normalizeNowcast(xml, province = '') {
  const items = String(xml).split(/<item(?:\s[^>]*)?>/).slice(1).map((s) => s.split('</item>')[0]);
  const alerts = [];
  items.forEach((body, i) => {
    const title = xmlTag(body, 'title');
    if (!title) return;
    const desc = xmlTag(body, 'description').replace(/\s+/g, ' ');
    const pub = xmlTag(body, 'pubDate');
    alerts.push({
      id: `nowcast-${xmlTag(body, 'guid') || i}`,
      severity: SEVERITY_RULES.find(([re]) => re.test(title))?.[1] ?? 'Waspada',
      title,
      // buang daftar kecamatan (ratusan nama)
      description: desc.split(/khususnya\s+di/i)[0].trim().slice(0, 400) || desc.slice(0, 400),
      region: title.match(/\bdi\s+(.+)$/)?.[1]?.trim() || '',
      date: pub && !Number.isNaN(Date.parse(pub)) ? new Date(pub).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  });
  const key = String(province).toLowerCase().replace(/^(dki|di|daerah istimewa)\s+/, '').trim();
  const filtered = key ? alerts.filter((a) => `${a.title} ${a.description} ${a.region}`.toLowerCase().includes(key)) : alerts;
  return { total: alerts.length, alerts: filtered };
}

// ── Suhu mingguan (api/public/weather/weekly-temperature) ──────────────────
export function normalizeWeeklyTemp(res = {}) {
  const d = res?.data ?? {};
  const pick = (arr) => (Array.isArray(arr) ? arr.map((x) => ({ date: x.date, temperature: x.temperature })) : []);
  return { daily: pick(d.daily), weekly: pick(d.weekly) };
}

// ── Siklon tropis (api/v1/tcwc/cyclone/all) ────────────────────────────────
export function normalizeCyclones(res = {}) {
  const docs = res?.data?.docs ?? [];
  return {
    cyclones: docs.map((c) => ({
      id: c._id ?? null,
      title: c.title ?? c.name ?? null,
      // bulletin berisi HTML/teks panjang dari BMKG — diteruskan apa adanya
      bulletin: c.technical_bulletin ?? c.public_bulletin ?? null,
      gale: Array.isArray(c.ocean_gale) ? c.ocean_gale : [],
    })),
  };
}

// ── Terbit/terbenam + bulan (api/v1/sunset/json) ───────────────────────────
/** "5:49:22 AM" → "05:49:22" (24 jam) */
function to24h(t) {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (!m) return String(t ?? '');
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[4])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}${m[3] ? `:${m[3]}` : ''}`;
}

export function normalizeSunTimes(res = {}) {
  const r = res?.results ?? {};
  return {
    date: r.date ?? '',
    timezone: res?.tzid ?? '',
    sunrise: to24h(r.sunrise),
    sunset: to24h(r.sunset),
    firstLight: r.first_light ? to24h(r.first_light) : null,
    lastLight: r.last_light ? to24h(r.last_light) : null,
    moonrise: r.moonrise ? to24h(r.moonrise) : null,
    moonset: r.moonset ? to24h(r.moonset) : null,
    moonPhase: r.moon_phase ? String(r.moon_phase) : null,
    moonIllumination: r.moon_illumination ? String(r.moon_illumination) : null,
  };
}

// ── Maritim: perairan terdekat (api/v1/public/maritim/nearest-location) ────
export function normalizeMarineNearest(res = {}) {
  const d = res?.data ?? {};
  return {
    marine: {
      code: d.code ?? '',
      name: d.name ?? '',
      wilayah: d.wilpel ?? '',
      // geojson polygon wilayah perairan — diteruskan supaya peta partner bisa memakainya
      geometry: d.geometry ?? null,
    },
  };
}

// ── Maritim: daftar pelabuhan (maritim.bmkg.go.id/public_api/pelabuhan_list) ─
export function normalizePorts(list = []) {
  return list.map((p) => ({ file: p.file, name: p.portname ?? '', type: p.type ?? '', lat: p.lat, lon: p.lon }));
}

/** Doc pelabuhan (public_api/pelabuhan/<file>) → slot pasut ringkas */
export function normalizePortDoc(doc = {}) {
  const slots = Array.isArray(doc.data) ? doc.data : [];
  return {
    port: {
      id: doc.port_id ?? null,
      name: doc.name ?? '',
      lat: doc.latitude ?? null,
      lon: doc.longitude ?? null,
      slots: slots.map((s) => ({
        time: s.time ?? s.datetime ?? '',
        height: Number(s.height ?? s.water_level ?? 0),
        type: s.type ?? s.condition ?? '',
      })),
    },
  };
}

// ── Maritim: tinggi gelombang per wilayah (overview/gelombang.json) ────────
export function normalizeWaves(raw = {}) {
  const entries = Object.entries(raw ?? {});
  return {
    zones: entries.map(([code, e]) => ({
      code,
      issued: e.issued ?? null,
      today: e.today ?? null,
      tomorrow: e.tomorrow ?? null,
      h2: e.h2 ?? null,
      h3: e.h3 ?? null,
    })),
  };
}

// ── Geo: cuaca kecamatan DWT (publik.bmkg.go.id/event/source/dwt/…) ────────
// Bentuk upstream berupa baris array tanpa nama field:
//   [prov, wilayah, kecamatan, lat, lon, kode, waktu, [hu, temp, kode, arah, ws], flag]
export function normalizeDistrictRows(rows = []) {
  const stations = [];
  for (const r of rows) {
    if (!Array.isArray(r) || typeof r[3] !== 'number' || !Array.isArray(r[7])) continue;
    const slot = r[7];
    stations.push({
      province: String(r[0] ?? ''),
      wilayah: String(r[1] ?? ''),
      district: String(r[2] ?? ''),
      lat: r[3],
      lon: r[4],
      observation: {
        humidity: parseFloat(slot[0]) || 0,
        temp: parseFloat(slot[1]) || 0,
        conditionCode: String(slot[2] ?? ''),
        windDirection: String(slot[3] ?? ''),
        windSpeed: parseFloat(slot[4]) || 0,
      },
    });
  }
  return { stations };
}

// ── Berita & video (blog/wp-json + api/public/weather/video-latest) ────────
export function normalizeVideos(items = []) {
  return {
    videos: (Array.isArray(items) ? items : []).map((v) => {
      const ytId = String(v.videoUrl ?? '').match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
      return { title: v.title ?? '', url: v.videoUrl ?? '', thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null };
    }),
  };
}

export function normalizeWpPosts(posts = []) {
  return {
    posts: (Array.isArray(posts) ? posts : []).map((p) => ({
      id: p?.id ?? null,
      date: String(p?.date ?? '').slice(0, 10),
      category: p?._embedded?.['wp:term']?.[0]?.[0]?.name ?? 'Berita',
      title: String(p?.title?.rendered ?? '').replace(/&#\d+;|<[^>]*>/g, '').trim(),
      summary: String(p?.excerpt?.rendered ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200),
      imageUrl: p?._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
      link: p?.link ?? null,
    })),
  };
}

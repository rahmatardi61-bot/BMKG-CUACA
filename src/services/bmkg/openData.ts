// BMKG Open Data resmi (11 Sep 2026) — knowledge base partner:
//   - maritim.bmkg.go.id/public_api/*  → CORS * (direct dari browser)
//   - publik.bmkg.go.id/event/source/dwt/* → tanpa CORS (dev lewat proxy vite /event)
// Semua fetch module-cached; dipakai TransportWeather/LandBased/WaveRadar/MarineMap/Advisor.

const MARITIM = 'https://maritim.bmkg.go.id/public_api';
const DWT = '/event/source/dwt';

const CACHE_TTL = 30 * 60 * 1000; // 30 menit (slot maritim per 3 jam, DWT per jam)
const cache = new Map<string, { data: unknown; at: number }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data as T;
  try {
    const data = await load();
    cache.set(key, { data, at: Date.now() });
    return data;
  } catch {
    return null; // caller handles fallback
  }
}

// ── MARITIM public_api ──────────────────────────────────────────────────────

export interface PerairanSlot {
  valid_from?: string;
  valid_to?: string;
  time_desc?: string;    // 'Hari ini' | 'Besok' | 'H+2' | 'H+3'
  weather?: string;
  weather_desc?: string;
  warning_desc?: string; // 'NIL' = tanpa peringatan
  wind_from?: string;
  wind_speed_min?: number;
  wind_speed_max?: number;
  wave_cat?: string;     // 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi' | ...
  wave_desc?: string;    // '0.5 - 1.25 m'
}

export interface PerairanDoc {
  code?: string;
  name?: string;
  issued?: string;
  wilpel?: string;
  slots?: PerairanSlot[];
  /** array slot dari API resmi (4 slot: Hari ini/Besok/H+2/H+3) */
  data?: PerairanSlot[];
  [k: string]: unknown;
}

/** daftar file perairan: 'F.09_Teluk Jakarta.json' … (code = prefix sebelum '_') */
export async function getPerairanFiles(): Promise<string[] | null> {
  return cached<string[]>(`${MARITIM}/perairan_list`, async () => {
    const res = await fetch(`${MARITIM}/perairan_list`);
    if (!res.ok) throw new Error(`perairan list ${res.status}`);
    const json = (await res.json()) as { files?: { name?: string }[] };
    return (json.files ?? []).map(f => String(f.name)).filter(Boolean);
  });
}

/** doc perairan terkini untuk satu kode wilayah (mis. 'F.09'), cached 30 menit */
export async function getPerairanByCode(code: string): Promise<PerairanDoc | null> {
  const files = await getPerairanFiles();
  if (!files?.length) return null;
  const file = files.find(f => f.startsWith(code));
  if (!file) return null;
  return cached<PerairanDoc>(`${MARITIM}/perairan/${file}`, async () => {
    const res = await fetch(`${MARITIM}/perairan/${encodeURIComponent(file)}`);
    if (!res.ok) throw new Error(`perairan ${res.status}`);
    return res.json();
  });
}

export async function getOverviewGelombang(): Promise<Record<string, unknown> | null> {
  return cached(`${MARITIM}/overview/gelombang.json`, async () => {
    const res = await fetch(`${MARITIM}/overview/gelombang.json`);
    if (!res.ok) throw new Error(`overview ${res.status}`);
    return res.json();
  });
}

/** geojson 232 polygon wilayah perairan (cached sesi penuh) */
let wilayahGeo: unknown | null = null;
export async function getWilayahPerairanGeo(): Promise<unknown | null> {
  if (wilayahGeo) return wilayahGeo;
  // ponytail: path benar ada di /static/wilayah_perairan.json — versi `.geojson`
  // selalu 404 (bug lama), sehingga overlay peta maritim tidak pernah muncul.
  const data = await cached(`${MARITIM}/static/wilayah_perairan.json`, async () => {
    const res = await fetch(`${MARITIM}/static/wilayah_perairan.json`);
    if (!res.ok) throw new Error(`wilayah ${res.status}`);
    return res.json();
  });
  wilayahGeo = data;
  return data;
}

/** kode wilayah ('U.04') & nama ('Samudera Hindia selatan Banten') dari properties geojson resmi */
export interface WilayahPerairanFeature {
  type: 'Feature';
  properties: { WP_1?: string; WP_IMM?: string; WilPel?: string; simbol?: string };
  geometry: unknown;
}

/** kategori gelombang per kode wilayah: { 'U.04': { issued, today, tomorrow, h2, h3 } } */
export interface WaveOverviewEntry {
  issued?: string;
  today?: string;
  tomorrow?: string;
  h2?: string;
  h3?: string;
}

export async function getOverviewGelombangTyped(): Promise<Record<string, WaveOverviewEntry> | null> {
  const raw = await getOverviewGelombang();
  return (raw as Record<string, WaveOverviewEntry>) ?? null;
}

/** parse '0.5 - 1.25 m' → {min, max} */
export function parseWaveRange(desc: string | undefined): { min: number; max: number } | null {
  const nums = (desc || '').match(/[\d.,]+/g)?.map(n => parseFloat(n.replace(',', '.'))) ?? [];
  return nums.length >= 2 ? { min: nums[0], max: nums[1] } : null;
}

export const WAVE_CAT_MID: Record<string, number> = {
  'tenang': 0.3, 'rendah': 0.9, 'sedang': 1.9, 'tinggi': 3.2,
  'sangat tinggi': 5.0, 'ekstrem': 7.5, 'sangat ekstrem': 10.0,
};

/**
 * slot perairan "hari ini" (slot terawal yang masih berlaku).
 * ponytail: API resmi mengirim array di `data` (bukan `slots`) — dulu bug di sini
 * membuat seluruh integrasi maritim live tidak pernah kepakai (selalu null).
 */
export function currentSlot(doc: PerairanDoc | null): PerairanSlot | null {
  const slots = doc?.data || doc?.slots || (doc as { slot?: PerairanSlot[] } | null)?.slot || [];
  return slots[0] ?? null;
}

// ─ MARITIM pelabuhan (public_api, 294 pelabuhan) ───────────────────────────

/** satu baris dari `pelabuhan_list` — sudah ada koordinat, jadi tidak perlu fetch detail utk cari terdekat */
export interface PelabuhanInfo {
  file: string;
  portname: string;
  type?: string;
  lat: number;
  lon: number;
}

/** slot pelabuhan: semua field perairan + arus, pasut, suhu/kelembapan, jarak pandang */
export interface PelabuhanSlot extends PerairanSlot {
  current_from?: string;
  current_speed_min?: number;
  current_speed_max?: number;
  visibility?: number; // meter
  rh_min?: number;
  rh_max?: number;
  temp_min?: number;
  temp_max?: number;
  low_tide?: number;
  low_tide_time?: string;
  high_tide?: number;
  high_tide_time?: string;
}

export interface PelabuhanDoc {
  port_id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  data?: PelabuhanSlot[];
}

export async function getPelabuhanList(): Promise<PelabuhanInfo[] | null> {
  return cached<PelabuhanInfo[]>(`${MARITIM}/pelabuhan_list`, async () => {
    const res = await fetch(`${MARITIM}/pelabuhan_list`);
    if (!res.ok) throw new Error(`pelabuhan list ${res.status}`);
    const json = (await res.json()) as { files?: Array<{ name?: string; portname?: string; type?: string; coor?: [number, number] }> };
    return (json.files ?? [])
      .filter(f => f.name && Array.isArray(f.coor))
      .map(f => ({ file: String(f.name), portname: String(f.portname ?? ''), type: f.type, lat: f.coor![0], lon: f.coor![1] }));
  });
}

/** doc pelabuhan terkini dari nama file (mis. '0088_Sintete.json') */
export async function getPelabuhanByFile(file: string): Promise<PelabuhanDoc | null> {
  return cached<PelabuhanDoc>(`${MARITIM}/pelabuhan/${file}`, async () => {
    const res = await fetch(`${MARITIM}/pelabuhan/${encodeURIComponent(file)}`);
    if (!res.ok) throw new Error(`pelabuhan ${res.status}`);
    return res.json();
  });
}

/** pelabuhan terdekat dari satu titik (cari di list dulu, baru fetch detailnya) */
export async function getNearestPelabuhan(lat: number, lon: number): Promise<PelabuhanDoc | null> {
  const list = await getPelabuhanList();
  if (!list?.length) return null;
  let best: PelabuhanInfo | null = null;
  let bestD = Infinity;
  for (const p of list) {
    const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best ? getPelabuhanByFile(best.file) : null;
}

// ── DWT (angin/cuaca per kecamatan & stasiun kereta) ────────────────────────

type DwtRow = unknown[]; // [prov, wilayah, kecamatan, lat, lon, kode, waktu, [hu,temp,kode,arah,ws], flag]

export interface DwtWeather {
  lat: number; lng: number; kecamatan: string; wilayah: string;
  humidity: number; temp: number; kodeCuaca: string; windSpeed: number; windDir: string;
}

async function fetchDwtRows(kind: 'Darat' | 'Kereta'): Promise<DwtRow[] | null> {
  return cached(`dwt-${kind}-${new Date().toISOString().slice(0, 13)}`, async () => {
    const manifest = await (await fetch(`${DWT}/apiDF_${kind}/manifest_times.json`)).json();
    const file = (manifest.files || []).at(-1) as string | undefined;
    if (!file) throw new Error('manifest kosong');
    const rows = await (await fetch(`${DWT}/apiDF_${kind}/${file}`)).json();
    return rows as DwtRow[];
  });
}

/** cuaca DWT stasiun terdekat dari titik (jarak maks 2°) */
export async function dwtWeatherAt(lat: number, lng: number): Promise<DwtWeather | null> {
  const rows = await fetchDwtRows('Darat');
  if (!rows?.length) return null;
  let best: { row: DwtRow; d: number } | null = null;
  for (const row of rows) {
    const rLat = row[3] as number, rLng = row[4] as number;
    if (typeof rLat !== 'number' || typeof rLng !== 'number' || !Array.isArray(row[7])) continue;
    const d = (rLat - lat) ** 2 + (rLng - lng) ** 2;
    if (!best || d < best.d) best = { row, d };
  }
  if (!best || best.d > 4) return null;
  const r = best.row;
  const slot = r[7] as string[];
  return {
    lat: r[3] as number, lng: r[4] as number,
    kecamatan: String(r[2] ?? ''), wilayah: String(r[1] ?? ''),
    humidity: parseFloat(slot[0]) || 0, temp: parseFloat(slot[1]) || 0,
    kodeCuaca: String(slot[2] ?? ''),
    windSpeed: parseFloat(slot[4]) || 0, windDir: String(slot[3] ?? ''),
  };
}

/** status transport dari kode cuaca DWT */
export function kodeToStatus(kode: string): 'Aman' | 'Waspada' | 'Awas' {
  const k = parseInt(kode) || 0;
  if (k <= 4) return 'Aman';      // cerah - berawan tebal
  if (k <= 8) return 'Waspada';   // kabut/gerimis (visibilitas ↓)
  return 'Awas';                  // hujan lokal ke atas
}

/** doc perairan stasiun kereta terdekat (178 stasiun, hanya Jawa) */
export async function dwtKeretaAt(lat: number, lng: number): Promise<DwtWeather | null> {
  const rows = await fetchDwtRows('Kereta');
  if (!rows?.length) return null;
  let best: { row: DwtRow; d: number } | null = null;
  for (const row of rows) {
    const rLat = row[3] as number, rLng = row[4] as number;
    if (typeof rLat !== 'number' || typeof rLng !== 'number' || !Array.isArray(row[7])) continue;
    const d = (rLat - lat) ** 2 + (rLng - lng) ** 2;
    if (!best || d < best.d) best = { row, d };
  }
  if (!best || best.d > 0.3) return null; // stasiun kereta jarak maks ~0.5°
  const r = best.row;
  const slot = r[7] as string[];
  return {
    lat: r[3] as number, lng: r[4] as number,
    kecamatan: String(r[2] ?? ''), wilayah: String(r[1] ?? ''),
    humidity: parseFloat(slot[0]) || 0, temp: parseFloat(slot[1]) || 0,
    kodeCuaca: String(slot[2] ?? ''),
    windSpeed: parseFloat(slot[4]) || 0, windDir: String(slot[3] ?? ''),
  };
}

/** centroid polygon geojson (rata-rata titik ring pertama) — cukup untuk peta zona */
export function geoCentroid(feature: { geometry: { coordinates: unknown } }): { lat: number; lng: number } | null {
  const c = feature.geometry.coordinates as unknown;
  // Polygon: [[ring]]; MultiPolygon: [[[ring]]]
  const first = Array.isArray(c) ? (c as unknown[])[0] : null;
  const second = Array.isArray(first) ? (first as unknown[])[0] : null;
  const ring = (Array.isArray(second) && Array.isArray((second as unknown[])[0]) ? second : first) as number[][] | null;
  if (!ring?.length || typeof ring[0][0] !== 'number') return null;
  let sx = 0, sy = 0;
  for (const p of ring) { sx += p[0]; sy += p[1]; }
  return { lat: sy / ring.length, lng: sx / ring.length };
}

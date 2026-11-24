// ═══════════════════════════════════════════════════════════════════════════
// WIDGET CATALOG (dijaga token) — daftar widget + kota, untuk diprogram partner
// ---------------------------------------------------------------------------
// GET /api/widget-catalog            Authorization: Bearer <jwt>
// → { widgets: [...], cities: [{name,lat,lon}], search: {...} }
//
// Kenapa ada endpoint ini: halaman partner tidak boleh menyalin daftar widget
// kita ke kode mereka (pasti basi). Semua yang mereka butuhkan untuk membangun
// UI sendiri — id widget, butuh kota atau tidak, datanya MOCK atau live — ada
// di sini, satu sumber dengan yang dipakai widget kita sendiri.
// ═══════════════════════════════════════════════════════════════════════════
import { bearer, verifyJwt } from '../lib/jwt.js';
import { CITIES } from '../lib/cities.js';

export const config = { runtime: 'nodejs' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });

// id + nama + sifat data. `live: false` = selalu MOCK, harus diberi label oleh
// halaman pemasang. `needsCity` = menerima ?city= atau ?lat=&lon=.
const WIDGETS = [
  { id: 'current', name: 'Kondisi Cuaca Saat Ini', needsCity: true, live: true, mock: null },
  { id: 'forecast', name: 'Prakiraan Cuaca Per Jam', needsCity: true, live: true, mock: null },
  { id: 'alerts', name: 'Peringatan Dini Cuaca', needsCity: true, live: true, mock: null },
  { id: 'earthquake', name: 'Gempa Bumi Terkini', needsCity: true, live: true, mock: null },
  { id: 'satellite', name: 'Citra Satelit Himawari-9', needsCity: false, live: true, mock: null },
  { id: 'port-tide', name: 'Pasang Surut Pelabuhan', needsCity: true, live: true, mock: null },
  { id: 'wave', name: 'Radar Tinggi Gelombang', needsCity: true, live: true, mock: null },
  { id: 'marine', name: 'Peta Meteorologi Maritim', needsCity: true, live: true, mock: null },
  { id: 'news', name: 'Berita & Pengumuman BMKG', needsCity: false, live: true, mock: 'gagal 502 → artikel contoh' },
  { id: 'air-quality', name: 'Kualitas Udara (ISPU)', needsCity: true, live: false, mock: 'selalu MOCK (BMKG tak punya API ISPU)' },
  { id: 'transport', name: 'Transportasi & Rute', needsCity: true, live: false, mock: 'selalu MOCK' },
  { id: 'major-cities', name: 'Kota-Kota Besar', needsCity: false, live: false, mock: 'statis, tidak memuat data' },
  { id: 'search', name: 'Pencarian Lokasi', needsCity: false, live: true, mock: null, helper: true },
];

async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = bearer(req);
  if (!token) return json({ error: 'Tidak diotorisasi', reason: 'header Authorization: Bearer <jwt> wajib' }, 401);
  const res = await verifyJwt(token);
  if (!res.ok) return json({ error: 'Token tidak sah', reason: res.reason ?? 'ditolak' }, 401);

  return json({
    widgets: WIDGETS,
    cities: CITIES,
    // petunjuk pemakaian, supaya partner tidak perlu menebak
    usage: {
      widget: 'GET /api/embed-js (Bearer) → eval → <div data-bmkg-widget="ID" data-city="Bandung">',
      place: 'widget menerima ?city=Nama (dari cities[]) ATAU ?lat=&lon= (hasil /api/widget-search)',
      search: 'GET /api/widget-search?q=... (Bearer) → { items: [{name, region, lat, lon}] }',
    },
  });
}

export default { fetch: handle };

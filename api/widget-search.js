// ═══════════════════════════════════════════════════════════════════════════
// PENCARIAN LOKASI (dijaga token) — sumber: API BMKG sendiri
// ---------------------------------------------------------------------------
// GET /api/widget-search?q=sleman        Authorization: Bearer <jwt>
// → { items: [{ name, region, lat, lon, adm4, source }] }
//
// Sumber: https://www.bmkg.go.id/api/cuaca/search?q=…  (desa/kelurahan resmi
// BMKG, lengkap dengan kode adm4). Menggantikan Nominatim/OpenStreetMap.
//
// Kenapa tetap diproksi dan bukan dipanggil browser langsung:
// endpoint itu menolak (401) tanpa header `x-api-key`, dan nilainya token
// sesi yang hanya ada di HTML www.bmkg.go.id — tidak bisa dibuat browser
// partner. Server kita yang mengambil & menyimpannya (cache di memori).
//
// Kalau BMKG gagal, daftar kota kita (lib/cities.js) tetap dijadikan hasil
// supaya kolom pencarian tidak mati total.
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

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const BMKG_PAGE = 'https://www.bmkg.go.id/cuaca/prakiraan-cuaca'; // /cuaca/ → 301 ke sini
const BMKG_SEARCH = 'https://www.bmkg.go.id/api/cuaca/search';

/** Cache kecil di memori instance: query sama tidak menembak BMKG dua kali. */
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

// Token x-api-key situs BMKG. Skemanya tidak didokumentasikan, jadi kita
// perlakukan sebagai barang rapuh: simpan singkat + buang saat ditolak.
const keyState = { value: '', exp: 0 };
const KEY_TTL_MS = 3 * 60 * 1000;

async function getApiKey() {
  if (keyState.value && Date.now() < keyState.exp) return keyState.value;
  const html = await (await fetch(BMKG_PAGE, { headers: { 'User-Agent': UA, Accept: 'text/html' } })).text();
  // bentuk: S4H53-cB.eyJleHAi….IDO7WS5t…  (prefix acak + payload + tanda tangan).
  // Prefix boleh mengandung '-', jadi jangan disempitkan ke alnum saja.
  const tok = html.match(/[A-Za-z0-9_-]{6,12}\.eyJleHAi[A-Za-z0-9_=-]*\.[A-Za-z0-9_-]+/)?.[0];
  if (!tok) throw new Error('token x-api-key BMKG tidak ditemukan di halaman /cuaca/');
  Object.assign(keyState, { value: tok, exp: Date.now() + KEY_TTL_MS });
  return tok;
}

function dropApiKey() {
  Object.assign(keyState, { value: '', exp: 0 });
}

async function fromBmkg(q) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const key = await getApiKey();
    const res = await fetch(`${BMKG_SEARCH}?q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json', 'x-api-key': key },
    });
    if (res.status === 401 || res.status === 403) {
      // token kedaluwarsa/ditolak → ambil baru, coba sekali lagi
      dropApiKey();
      continue;
    }
    if (!res.ok) throw new Error(`BMKG search ${res.status}`);
    const rows = await res.json();
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      name: r.desa || r.kecamatan || r.kotkab || q,
      region: [r.kecamatan, r.kotkab, r.provinsi].filter(Boolean).join(', '),
      lat: Number(r.lat),
      lon: Number(r.lon),
      adm4: r.adm4 || null,
      source: 'bmkg',
    }));
  }
  throw new Error('token x-api-key BMKG ditolak (401) dua kali');
}

function fromLocal(q) {
  const needle = q.toLowerCase();
  return CITIES.filter((c) => c.name.toLowerCase().includes(needle)).map((c) => ({
    name: c.name,
    region: 'Kota yang didukung widget',
    lat: c.lat,
    lon: c.lon,
    adm4: null,
    source: 'bmkg-cities',
  }));
}

async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = bearer(req);
  if (!token) return json({ error: 'Tidak diotorisasi', reason: 'header Authorization: Bearer <jwt> wajib' }, 401);
  const res = await verifyJwt(token);
  if (!res.ok) return json({ error: 'Token tidak sah', reason: res.reason ?? 'ditolak' }, 401);

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
  if (q.length < 2) return json({ items: [], reason: 'query minimal 2 karakter' });

  const local = fromLocal(q);
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < TTL_MS) return json({ items: [...local, ...hit.items] });

  try {
    const online = await fromBmkg(q);
    // buang duplikat nama yang sudah ada di daftar lokal
    const seen = new Set(local.map((i) => i.name.toLowerCase()));
    const items = online.filter((i) => i.name && !seen.has(i.name.toLowerCase()));
    cache.set(q, { at: Date.now(), items });
    return json({ items: [...local, ...items] });
  } catch (e) {
    // Jangan gagal total: daftar kota kita tetap berguna walau BMKG menolak.
    return json({
      items: local,
      warning: `pencarian BMKG gagal: ${String(e instanceof Error ? e.message : e).slice(0, 120)}`,
    });
  }
}

export default { fetch: handle };

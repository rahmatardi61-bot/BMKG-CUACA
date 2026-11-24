// ═══════════════════════════════════════════════════════════════════════════
// WIDGET SEARCH (dijaga token) — cari nama daerah untuk widget
// ---------------------------------------------------------------------------
// GET /api/widget-search?q=bandung        Authorization: Bearer <jwt>
// → { items: [{ name, region, lat, lon, source }] }
//
// Ini fungsi yang dibutuhkan widget ber-`?city=`: pengguna memilih tempat,
// lalu pilihannya diteruskan ke widget sebagai ?lat=&lon=.
//
// Selalu mencoba dua lapis:
//   1. daftar kota kita (instan, offline, 10 kota) — selalu jadi hasil teratas
//   2. Nominatim/OpenStreetMap untuk kelurahan/kecamatan di seluruh Indonesia
//
// Kenapa diproksi lewat server: Nominatim meminta User-Agent yang jelas dan ada
// batas 1 req/detik. Kalau dipanggil dari browser partner, UA-nya jadi UA
// browser mereka dan kita tidak bisa menegakkan batas itu.
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

/** Cache kecil di memori instance: query sama tidak menembak Nominatim dua kali. */
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

function fromLocal(q) {
  const needle = q.toLowerCase();
  return CITIES.filter((c) => c.name.toLowerCase().includes(needle)).map((c) => ({
    name: c.name,
    region: 'Kota yang didukung widget',
    lat: c.lat,
    lon: c.lon,
    source: 'bmkg-cities',
  }));
}

async function fromNominatim(q) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=6&addressdetails=1&q=' +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: {
      // kebijakan Nominatim: UA harus menyebut aplikasi + kontak
      'User-Agent': 'BMKG-Widget/1.0 (widget embed; kontak: admin@vedata.online)',
      Accept: 'application/json',
      'Accept-Language': 'id',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows = await res.json();
  return (rows ?? []).map((r) => {
    const a = r.address ?? {};
    const region = [a.village ?? a.suburb ?? a.town ?? a.city, a.city_district ?? a.county, a.state]
      .filter(Boolean)
      .join(', ');
    return {
      name: r.name || String(r.display_name ?? '').split(',')[0],
      region: region || r.display_name || '',
      lat: Number(r.lat),
      lon: Number(r.lon),
      source: 'nominatim',
    };
  });
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
    const online = await fromNominatim(q);
    // buang duplikat nama yang sudah ada di daftar lokal
    const seen = new Set(local.map((i) => i.name.toLowerCase()));
    const items = online.filter((i) => i.name && !seen.has(i.name.toLowerCase()));
    cache.set(q, { at: Date.now(), items });
    return json({ items: [...local, ...items] });
  } catch (e) {
    // Jangan gagal total: daftar kota kita tetap berguna walau Nominatim mati.
    return json({
      items: local,
      warning: `pencarian daring gagal: ${String(e instanceof Error ? e.message : e).slice(0, 120)}`,
    });
  }
}

export default { fetch: handle };

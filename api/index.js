// GET /api
// → katalog endpoint (mesin, bukan halaman). Dokumen .md dan halaman /api-docs
// boleh basi; JSON ini tidak — isinya dibaca dari daftar di bawah, satu tempat.
//
// Kenapa ada: tim mobile / AI yang membaca repo ini bisa menanyakan "endpoint
// apa saja yang ada" langsung ke server, bukan menebak dari dokumentasi.
import { preflight } from '../lib/http.js';

export const config = { runtime: 'nodejs' };

const ENDPOINTS = [
  { path: '/api/weather/current', query: ['lat', 'lon'], returns: '{ region, observation }', live: true, note: 'observation.derived = feelLike & uvIndex, BUKAN dari BMKG' },
  { path: '/api/weather/forecast', query: ['lat', 'lon'], returns: '{ region, hours[] }', live: true, note: 'hours diratakan dari cuaca[][] dan diurutkan' },
  { path: '/api/weather/alerts', query: ['lat', 'lon'], returns: '{ alerts[] }', live: true, note: 'sering kosong = memang tak ada peringatan' },
  { path: '/api/weather/nowcast', query: ['province?'], returns: '{ total, alerts[] }', live: true, note: 'dari RSS; severity dipetakan dari judul' },
  { path: '/api/weather/weekly-temperature', query: ['lat', 'lon'], returns: '{ daily[], weekly[] }', live: true },
  { path: '/api/weather/cyclones', query: [], returns: '{ cyclones[] }', live: true, note: 'kosong = tidak ada siklon aktif' },
  { path: '/api/weather/amendment', query: ['lat', 'lon'], returns: '{ region, count }', live: true, note: 'count 0 = tidak ada perubahan prakiraan' },
  { path: '/api/weather/forecast-official', query: ['adm4'], returns: '{ region, hours[] }', live: true, note: 'jalur cadangan dari api.bmkg.go.id' },
  { path: '/api/sky/sun-times', query: ['lat', 'lon'], returns: '{ sunrise, sunset, moonPhase, … }', live: true, note: 'waktu 24 jam' },
  { path: '/api/marine/nearest', query: ['lat', 'lon'], returns: '{ marine }', live: true },
  { path: '/api/marine/ports', query: ['lat?', 'lon?'], returns: '{ ports[] } atau { port }', live: false, note: 'maritim.bmkg.go.id sedang 503' },
  { path: '/api/marine/waves', query: [], returns: '{ zones[] }', live: false, note: 'maritim.bmkg.go.id sedang 503' },
  { path: '/api/geo/region', query: ['lat', 'lon'], returns: '{ region }', live: true },
  { path: '/api/geo/district-weather', query: ['lat?', 'lon?'], returns: '{ file, stations[] } atau { file, station }', live: false, note: 'manifest DWT sedang 404' },
  { path: '/api/news', query: [], returns: '{ videos[], posts[], warnings[] }', live: true, note: 'WP sering 502 → bagian posts kosong + warnings' },
];

export default {
  fetch(req) {
    if (req.method === 'OPTIONS') return preflight();
    const body = {
      name: 'BMKG Cuaca — API gateway',
      note: 'Semua endpoint wajib Authorization: Bearer <jwt>. Tidak ada data contoh: bila BMKG gagal, jawabannya error.',
      errors: { UNAUTHORIZED: 401, BAD_REQUEST: 400, UPSTREAM_ERROR: 502, NOT_FOUND: 404 },
      endpoints: ENDPOINTS,
    };
    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },
};

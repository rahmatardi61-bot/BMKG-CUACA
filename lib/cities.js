// ═══════════════════════════════════════════════════════════════════════════
// KOTA YANG DIDUKUNG — satu sumber untuk app, widget, dan API katalog.
// ---------------------------------------------------------------------------
// Sengaja JS murni (bukan .ts) supaya bisa diimpor dari dua dunia sekaligus:
//   - src/ (Vue, Vite)              : import dari '../lib/cities.js'
//   - api/ + lib/ (Node/Vercel)     : import dari './cities.js'
// Duplikasi daftar kota pernah jadi sumber bug ("kotanya ada di widget tapi
// tidak di API"), jadi hanya ada satu array di bawah ini.
// ═══════════════════════════════════════════════════════════════════════════

/** @type {Array<{name: string, lat: number, lon: number}>} */
export const CITIES = [
  { name: 'DKI Jakarta', lat: -6.2, lon: 106.816666 },
  { name: 'Surabaya', lat: -7.257472, lon: 112.752083 },
  { name: 'Bandung', lat: -6.917464, lon: 107.619123 },
  { name: 'Medan', lat: 3.595196, lon: 98.672226 },
  { name: 'Semarang', lat: -6.966667, lon: 110.416664 },
  { name: 'Makassar', lat: -5.147665, lon: 119.432731 },
  { name: 'Palembang', lat: -2.976073, lon: 104.775427 },
  { name: 'Batam', lat: 1.130102, lon: 104.05304 },
  { name: 'Pekanbaru', lat: 0.507068, lon: 101.447777 },
  { name: 'Denpasar', lat: -8.65, lon: 115.216667 },
];
// upgrade: daftar ini masih 10 kota besar. Widget sudah menerima ?lat=&lon=
// arbitrer, jadi sumbernya bisa diganti pencarian (lihat api/widget-search.js)
// tanpa mengubah satu widget pun.

/** @type {Record<string, {lat: number, lon: number}>} */
export const CITY_COORDS = Object.fromEntries(CITIES.map((c) => [c.name, { lat: c.lat, lon: c.lon }]));

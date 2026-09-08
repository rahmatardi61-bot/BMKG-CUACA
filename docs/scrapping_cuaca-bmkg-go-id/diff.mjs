// diff.mjs — re-fetch endpoint kunci & bandingkan STRUKTUR response vs baseline/api_probes
// Untuk pencocokan data saat situs live berubah. Nilai (suhu, jam) diabaikan, struktur dibandingkan.
// Usage: node diff.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'baseline', 'api_probes');
const APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';
const CITIES = { Jakarta: { lat: -6.2, lon: 106.816666 }, Denpasar: { lat: -8.65, lon: 115.216667 } };

// fresh publicToken (exp 30 menit)
const html = await (await fetch('https://cuaca.bmkg.go.id/', { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', Accept: 'text/html' } })).text();
const seg = html.slice(html.indexOf('publicToken'));
const PUBTOK = seg.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)[0];

const H = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://cuaca.bmkg.go.id/',
  Origin: 'https://cuaca.bmkg.go.id',
  'X-API-KEY': APIKEY,
  'x-public-token': PUBTOK,
};

const jobs = [];
for (const [city, c] of Object.entries(CITIES)) {
  jobs.push([`forecast_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/forecast/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`adm_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/adm/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`amandemen_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/amandemen/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`presentwx_${city}.json`, `https://cuaca.bmkg.go.id/api/presentwx/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`warning_${city}.json`, `https://cuaca.bmkg.go.id/api/public/weather/warning?lat=${c.lat}&long=${c.lon}`]);
  jobs.push([`weekly-temp_${city}.json`, `https://cuaca.bmkg.go.id/api/public/weather/weekly-temperature?lat=${c.lat}&long=${c.lon}`]);
  jobs.push([`sunset_${city}.json`, `https://cuaca.bmkg.go.id/api/v1/sunset/json?lat=${c.lat}&lng=${c.lon}`]);
  jobs.push([`maritim-nearest_${city}.json`, `https://cuaca.bmkg.go.id/api/v1/public/maritim/nearest-location?lat=${c.lat}&long=${c.lon}`]);
}
jobs.push(['find-code_active.json', 'https://cuaca.bmkg.go.id/api/v1/setting/find-code?code=active']);
jobs.push(['banners.json', 'https://cuaca.bmkg.go.id/api/public/banners']);

// bentuk struktur: rekursif jadi tree "key:type" tanpa nilai
const shape = (v, depth = 0) => {
  if (depth > 4) return '...';
  if (Array.isArray(v)) return v.length ? [shape(v[0], depth + 1)] : [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)]));
  return typeof v;
};

let changed = 0;
for (const [name, url] of jobs) {
  const base = path.join(OUT, name);
  if (!fs.existsSync(base)) { console.log(`NEW  ${name} (tidak ada baseline)`); continue; }
  const res = await fetch(url, { headers: H, signal: AbortSignal.timeout(30000) });
  const now = await res.json().catch(() => null);
  const oldTxt = fs.readFileSync(base, 'utf8');
  const old = JSON.parse(oldTxt.slice(oldTxt.indexOf('\n') + 1));
  const sNow = JSON.stringify(shape(now));
  const sOld = JSON.stringify(shape(old));
  if (sNow === sOld) console.log(`SAME ${name}`);
  else { changed++; console.log(`DIFF ${name} — struktur berubah!`); }
}
console.log(changed ? `\n${changed} endpoint berubah struktur — cek detail manual atau re-run scrape/api_probe.mjs` : '\nSemua struktur endpoint stabil vs baseline.');

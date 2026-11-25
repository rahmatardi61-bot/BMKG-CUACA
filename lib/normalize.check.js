// ═══════════════════════════════════════════════════════════════════════════
// UJI KESETARAAN: lib/normalize.js + adapters.ts  vs  patokan sebelum refactor
//
// Cara kerja:
//   1. lib/fixtures/raw/*.json  = respons MENTAH BMKG (direkam sekali)
//   2. lib/fixtures/expected.json = hasil adapters.ts LAMA untuk data itu
//   3. di sini: normalize(raw) → adapters → harus sama dengan expected
//
// Kalau uji ini lolos, memindahkan dashboard & widget ke endpoint /api/*
// tidak mengubah satu angka pun yang dilihat pengguna.
//
// Jalankan: node lib/normalize.check.js
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import {
  normalizeAdm, normalizeAmendment, normalizeCurrent, normalizeAlerts, normalizeForecast,
  normalizeMarineNearest, normalizeNowcast, normalizeOfficialForecast, normalizeSunTimes, normalizeVideos,
  normalizeWpPosts, normalizeForecast as normalizeForecastAlias,
} from './normalize.js';
import {
  alertsToPanel, currentToWeatherData, forecastToHourly, newsToArticles, nowcastToAlerts,
  regionToAddress, sunTimesToAdditional,
} from '../src/services/bmkg/adapters.ts';

const raw = (name) => JSON.parse(readFileSync(new URL(`fixtures/raw/${name}.json`, import.meta.url), 'utf8'));
const expected = JSON.parse(readFileSync(new URL('fixtures/expected.json', import.meta.url), 'utf8'));

let checks = 0;
let failures = 0;
function eq(label, a, b) {
  checks++;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures++;
    console.log(`  GAGAL ${label}\n        baru : ${JSON.stringify(a)}\n        patokan: ${JSON.stringify(b)}`);
  }
}

// ── 1. Prakiraan ───────────────────────────────────────────────────────────
{
  const hourly = forecastToHourly(normalizeForecast(raw('forecast')));
  console.log(`prakiraan: ${hourly.length} jam (patokan ${expected.hourly.length})`);
  eq('jumlah jam', hourly.length, expected.hourly.length);
  hourly.forEach((h, i) => eq(`hourly[${i}]`, h, expected.hourly[i]));
}

// ── 2. Kondisi saat ini ────────────────────────────────────────────────────
{
  const hourly = forecastToHourly(normalizeForecast(raw('forecast')));
  const weather = currentToWeatherData(normalizeCurrent(raw('presentwx')), 'Kota Adm. Jakarta Barat', hourly);
  console.log('kondisi saat ini:');
  for (const k of Object.keys(expected.weather)) eq(`weather.${k}`, weather[k], expected.weather[k]);
}

// ── 3. Peringatan internal ─────────────────────────────────────────────────
{
  const alerts = alertsToPanel(normalizeAlerts(raw('warning')), 'Kota Adm. Jakarta Barat');
  eq('alerts (warning)', alerts, expected.alerts);
}

// ── 4. Terbit/terbenam ─────────────────────────────────────────────────────
{
  const wx = raw('presentwx').data.cuaca;
  const additional = sunTimesToAdditional(normalizeSunTimes(raw('sunset')), { wd: wx.wd, wd_deg: wx.wd_deg });
  console.log('  additional:', JSON.stringify(additional));
  for (const k of Object.keys(expected.additional)) eq(`additional.${k}`, additional[k], expected.additional[k]);
}

// ── 5. Berita (video; artikel WP kosong saat direkam) ─────────────────────
{
  const news = newsToArticles({ videos: normalizeVideos(raw('videos')).videos, posts: [], warnings: [] });
  console.log(`  video: ${news.length} (patokan ${expected.videos.length})`);
  eq('jumlah video', news.length, expected.videos.length);
  eq('video[0].title', news[0]?.title, expected.videos[0]?.title);
  eq('video[0].imageUrl', news[0]?.imageUrl, expected.videos[0]?.imageUrl);
}

// ── 6. Alamat ──────────────────────────────────────────────────────────────
eq('alamat', regionToAddress(normalizeAdm(raw('adm')).region), expected.address);

// ── 7. Amandemen, maritim, prakiraan resmi: bentuknya saja ─────────────────
{
  const am = normalizeAmendment(raw('amandemen'));
  eq('amandemen.count', am.count, raw('amandemen').amandemen.length);

  const marine = normalizeMarineNearest(raw('maritim')).marine;
  eq('maritim.code', marine.code, raw('maritim').data.code);

  const official = normalizeOfficialForecast(raw('official'));
  const flat = raw('official').data[0].cuaca.flat();
  eq('official.hours > 0', official.hours.length > 0, true);
  eq('official.total (semua grup hari diratakan)', official.hours.length, flat.length);
  eq('official jam pertama', official.hours[0]?.time, flat[0].local_datetime.split(' ')[1].slice(0, 5));
}

// ── 8. Nowcast: parser server vs jumlah item RSS ────────────────────────────
{
  const xml = readFileSync(new URL('fixtures/raw/nowcast.xml', import.meta.url), 'utf8');
  const now = normalizeNowcast(xml);
  const ui = nowcastToAlerts(now);
  eq('nowcast.total == alerts UI', ui.length, now.total);
  eq('nowcast.severity sah', ui.every((a) => ['Awas', 'Siaga', 'Waspada'].includes(a.severity)), true);
  void normalizeForecastAlias; // dipakai di atas dengan nama lain; jaga dari unused
}

console.log(`\n${failures ? '✗' : '✓'} ${checks - failures}/${checks} pemeriksaan lolos`);
process.exit(failures ? 1 : 0);

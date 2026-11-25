// ═══════════════════════════════════════════════════════════════════════════
// UJI KESETARAAN: lib/normalize.js  vs  src/services/bmkg/adapters.ts
//
// Tujuan: memastikan bentuk normal yang dikirim /api/* menghasilkan angka yang
// SAMA dengan yang selama ini dipakai 22 widget. Tanpa ini, kita menukar satu
// sumber kebenaran dengan dua yang belum terbukti sama.
//
// Jalankan: node lib/normalize.check.js
// Butuh: token diambil langsung dari /api/embed-token (dev server 5173 hidup).
// ═══════════════════════════════════════════════════════════════════════════
import { normalizeForecast, normalizeCurrent } from './normalize.js';
import { forecastToHourly, presentWxToWeatherData } from '../src/services/bmkg/adapters.ts';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:5173';
const LAT = -6.2;
const LON = 106.8;

let checks = 0;
let failures = 0;

function eq(label, a, b) {
  checks++;
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (!same) {
    failures++;
    console.log(`  GAGAL ${label}\n        normalize: ${JSON.stringify(a)}\n        adapters : ${JSON.stringify(b)}`);
  }
  return same;
}

const { token } = await (await fetch(`${ORIGIN}/api/embed-token`)).json();
const auth = { Authorization: `Bearer ${token}` };

// ── 1. Prakiraan: bentuk normal vs adapters.forecastToHourly ────────────────
{
  const raw = await (await fetch(`${ORIGIN}/api/bmkg?path=api%2Fdf%2Fv1%2Fforecast%2Fcoord&lat=${LAT}&lon=${LON}`, { headers: auth })).json();
  const normal = normalizeForecast(raw);
  const legacy = forecastToHourly(raw);

  console.log(`prakiraan: ${normal.hours.length} jam (normal) vs ${legacy.length} jam (adapters)`);
  eq('jumlah jam', normal.hours.length, legacy.length);
  eq('region.city', normal.region.city, raw.data[0].lokasi.kotkab);
  eq('region.codes.adm4', normal.region.codes.adm4, raw.data[0].lokasi.adm4);

  let mismatch = 0;
  normal.hours.forEach((n, i) => {
    const l = legacy[i];
    // icon sengaja tidak ada di bentuk normal (urusan UI), status → condition
    const before = failures;
    eq(`hours[${i}].date`, n.date, l.date);
    eq(`hours[${i}].time`, n.time, l.time);
    eq(`hours[${i}].temp`, n.temp, l.temp);
    eq(`hours[${i}].precipitation`, n.precipitation, l.precipitation);
    eq(`hours[${i}].condition`, n.condition, l.status);
    eq(`hours[${i}].humidity`, n.humidity, l.humidity);
    eq(`hours[${i}].windSpeed`, n.windSpeed, l.windSpeed);
    if (failures > before) mismatch++;
  });
  console.log(`  ${mismatch ? `✗ ${mismatch} jam berbeda` : '✓ semua jam identik (temp, precipitation, condition, humidity, windSpeed, date, time)'}`);
}

// ── 2. Kondisi saat ini: bentuk normal vs adapters.presentWxToWeatherData ───
{
  const raw = await (await fetch(`${ORIGIN}/api/bmkg?path=api%2Fpresentwx%2Fcoord&lat=${LAT}&lon=${LON}`, { headers: auth })).json();
  const normal = normalizeCurrent(raw);
  const hourlyRaw = await (await fetch(`${ORIGIN}/api/bmkg?path=api%2Fdf%2Fv1%2Fforecast%2Fcoord&lat=${LAT}&lon=${LON}`, { headers: auth })).json();
  const legacy = presentWxToWeatherData(raw, 'Uji', forecastToHourly(hourlyRaw));
  const o = normal.observation;

  console.log('\nkondisi saat ini:');
  eq('observation.temp', o.temp, legacy.temp);
  eq('observation.humidity', o.humidity, legacy.humidity);
  eq('observation.windSpeed', o.windSpeed, legacy.windSpeed);
  eq('observation.condition', o.condition, legacy.status);
  eq('observation.derived.feelLike', o.derived.feelLike, legacy.feelLike);
  eq('observation.derived.uvIndex', o.derived.uvIndex, legacy.uvIndex);
  eq('observation.date+time', `${o.date} ${o.time}`, raw.data.cuaca.local_datetime.slice(0, 16));

  // Perbedaan yang SENGAJA: upstream mengirim vs=null.
  // adapters lama menghitung Math.round(null/100)/10 = 0 → klaim "0 km".
  // Bentuk normal mengirim null → artinya "tidak ada data".
  console.log(
    `  perbedaan sengaja: visibility="${o.visibility}" (normal, null = tak ada data) vs ${legacy.visibility} (adapters, klaim 0 km) — upstream vs=${raw.data.cuaca.vs}`,
  );
}

console.log(`\n${failures ? '✗' : '✓'} ${checks - failures}/${checks} pemeriksaan lolos`);
process.exit(failures ? 1 : 0);

// ═══════════════════════════════════════════════════════════════════════════
// Screenshot semua component/card + dump data API (untuk sheet
// "Audit Card + Screenshot" di docs/bmkg-api-mapping.xlsx).
//
// Prasyarat: `npm run build && node server.mjs` (prod-sim :8080, data live).
// Jalankan dari root repo: node docs/scrapping_cuaca-bmkg-go-id/capture_card_screenshots.js
// (skrip di folder ini supaya import 'playwright' ketemu di node_modules lokal)
// Output:   docs/screenshots/cards/<cardId>.png + dump.json
// Catatan:  card drawer dibuka otomatis (Darat=nth0, Pelayaran=nth1, Penerbangan=nth3).
// ═══════════════════════════════════════════════════════════════════════════
import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.env.APP_URL || 'http://localhost:8080/?apimarker=1';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(1500);
if (await p.$('#login-username')) {
  await p.fill('#login-username', 'bmkg'); await p.fill('#login-password', 'demo2026');
  await p.click('button[type=submit]'); await p.waitForTimeout(18000);
}
await p.reload(); await p.waitForTimeout(15000);
const hidePanel = () => p.evaluate(() => {
  document.querySelectorAll('body > div').forEach(d => {
    if (d.textContent?.includes('API BOX MARKER') && getComputedStyle(d).position === 'fixed') d.style.display = 'none';
  });
});
await hidePanel();
const status = {};
const shot = async (id) => {
  const loc = p.locator(`[data-api-box="${id}"]`).first();
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
    if (!(await loc.isVisible())) { status[id] = 'hidden'; return; }
    await loc.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    await loc.screenshot({ path: `docs/screenshots/cards/${id}.png`, animations: 'disabled' });
    status[id] = 'ok';
  } catch (e) { status[id] = 'missing: ' + String(e).slice(0, 60); }
};
for (const id of ['hero','current-weather','forecast-panel','alerts','news','earthquake','satellite','major-cities','transport','weather-activity','marine-map','port-tide','around-activity','location-search'])
  await shot(id);
for (const [id, nth] of [['land-based', 0], ['maritime-advisor', 1], ['aviation-advisor', 3]]) {
  try {
    const cards = p.locator('[data-api-box="weather-activity"] div.cursor-pointer:has(.card-illustration)');
    await cards.nth(nth).scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await cards.nth(nth).click();
    await p.waitForTimeout(2500);
    await hidePanel();
    await shot(id);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(600);
    if (await p.locator(`[data-api-box="${id}"]`).isVisible().catch(() => false)) {
      await p.goto(URL); await p.waitForTimeout(8000);
    }
  } catch (e) { status[id] = 'drawer-fail: ' + String(e).slice(0, 60); }
}
const dump = await p.evaluate(() => ({
  cards: window.__apiBox.cards, defs: window.__apiBox.defs,
  calls: window.__apiBox.calls(), totals: window.__apiBox.totals(),
}));
// decode URL proxy (/api/bmkg?path=…, /api-bmkgapi/…, path-style dev) → URL upstream asli
// — biar sheet menampilkan API aslinya + flag proxied (marker *(proxy))
function decodeProxyUrl(u) {
  try {
    const abs = new globalThis.URL(u, 'http://x'); // globalThis: const URL (target deploy) menimpa global URL!
    const p = abs.searchParams.get('path');
    if (p) {
      const rest = new URLSearchParams(abs.search); rest.delete('path');
      const q = rest.toString();
      const host = p.startsWith('alerts/') ? 'www.bmkg.go.id' : p.startsWith('event/') ? 'publik.bmkg.go.id' : 'cuaca.bmkg.go.id';
      return { url: `https://${host}/${decodeURIComponent(p)}${q ? '?' + q : ''}`, proxied: true };
    }
    if (!abs.hostname || abs.hostname === 'x') { // path-style dev / display proxy: /api/bmkg/api/df/…, /event/…, /alerts/…
      const pth = abs.pathname.replace(/^\//, '').replace(/^(api\/bmkg|api-bmkg|api-bmkgapi)\//, '');
      const host = pth.startsWith('alerts/') ? 'www.bmkg.go.id' : pth.startsWith('event/') ? 'publik.bmkg.go.id' : 'cuaca.bmkg.go.id';
      return { url: `https://${host}/${pth}${abs.search}`, proxied: true };
    }
    return { url: abs.href, proxied: false };
  } catch { return { url: u, proxied: false }; }
}
for (const id of Object.keys(dump.calls)) {
  dump.calls[id] = dump.calls[id].map(c => {
    const d = decodeProxyUrl(c.url);
    return { ...c, url: d.url, proxied: d.proxied };
  });
}

// refill server-side: endpoint yang TIDAK terekam patch fetch (img/interaksi/belum dibuka)
// di-fetch ulang langsung (node fetch — tanpa CORS) supaya sheet punya sample-nya juga
const UA = { 'User-Agent': 'bmkg-redesign-capture/1.0 (docs)', Referer: 'https://cuaca.bmkg.go.id/' };
const OVERPASS_Q = '[out:json][timeout:25];node(around:5000,-6.2088,106.8456)["amenity"="restaurant"];out 10;';
const REFILL = [
  ['tews', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'],
  ['tews', 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'],
  ['satelit', 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png'],
  ['satellite-modelrun', 'https://satellite.bmkg.go.id/api22/modelrun'],
  ['nominatim', 'https://nominatim.openstreetmap.org/search?format=json&q=Monumen%20Nasional&countrycodes=id&limit=8&addressdetails=1'],
  ['overpass', 'https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: OVERPASS_Q }) }],
  ['osrm', 'https://router.project-osrm.org/route/v1/driving/106.8456,-6.2088;106.8166,-6.1754?overview=full&geometries=geojson&alternatives=true&steps=true'],
  ['official-forecast', 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.01.1001'],
  ['maritim-wilayah', 'https://maritim.bmkg.go.id/public_api/static/wilayah_perairan.json'],
  ['maritim-overview', 'https://maritim.bmkg.go.id/public_api/overview/gelombang.json'],
];
for (const [id, url, opts] of REFILL) {
  const existing = (dump.calls[id] || []).filter(c => !(c.refill && c.status >= 400)); // buang refill lama yang gagal
  if (existing.some(c => c.sample && c.sample.length > 2 && (c.status || 200) < 400)) continue; // sudah ada sample asli → jangan ganggu
  const [u, init] = [url, opts || {}];
  try {
    const res = await fetch(u, { ...init, headers: { ...UA, ...(init.headers || {}) }, signal: AbortSignal.timeout(30000) });
    const ct = res.headers.get('content-type') || '';
    let sample;
    if (ct.startsWith('image/')) {
      const buf = await res.arrayBuffer();
      sample = `[(binary ${ct} — ${(buf.byteLength / 1024).toFixed(1)} KB; gambar Himawari-9, bukan JSON)]`;
    } else {
      sample = await res.text();
    }
    existing.push({ url, method: init.method || 'GET', status: res.status, sample, at: new Date().toISOString(), proxied: false, refill: true });
    dump.calls[id] = existing;
    console.error(`refill ${id}: ${res.status} (${sample.length} char)`);
  } catch (e) {
    console.error(`refill ${id} GAGAL: ${String(e).slice(0, 80)}`);
  }
}
fs.writeFileSync('docs/screenshots/cards/dump.json', JSON.stringify(dump, null, 1));
console.log(JSON.stringify(status));
await b.close();

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
fs.writeFileSync('docs/screenshots/cards/dump.json', JSON.stringify(dump, null, 1));
console.log(JSON.stringify(status));
await b.close();

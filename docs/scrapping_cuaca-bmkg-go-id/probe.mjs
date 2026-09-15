// Interaction probe: klik semua elemen interaktif per route, catat API baru yang terpicu
// Usage: node probe.mjs [route ...]  (default: /)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://cuaca.bmkg.go.id';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const TRACKING = /cdn-cgi|tawk|doubleclick|google|zaraz|challenge-platform|circlegeo|_nuxt|fonts|gstatic/i;
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];

const browser = await chromium.launch();
const results = {};
for (const route of routes) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const seen = new Set();
  const apiLog = [];
  let allowRecord = true;
  let currentTrigger = 'initial-load';
  page.on('response', async (res) => {
    if (!allowRecord) return;
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    if (!/json|text\/plain/.test((res.request().resourceType() === 'fetch' || res.request().resourceType() === 'xhr') ? ct : '')) return;
    if (TRACKING.test(res.url())) return;
    if (seen.has(res.url())) return;
    seen.add(res.url());
    const body = await res.text().catch(() => '');
    apiLog.push({ trigger: currentTrigger, url: res.url(), status: res.status(), size: body.length });
  });
  allowRecord = true;
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // ambil innerText utk dokumentasi UI
  const text = await page.evaluate(() => document.body.innerText).catch(() => '');
  fs.mkdirSync(path.join(OUT, 'baseline', 'text'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'baseline', 'text', (route === '/' ? 'home' : route.replace(/\//g, '_')) + '.txt'), text);

  // klik semua tombol/link/tab terlihat, atribusikan API baru
  const els = await page.$$('button, [role=button], [role=tab]');
  const clicked = new Set();
  for (let i = 0; i < els.length && i < 60; i++) {
    const el = els[i];
    const label = ((await el.textContent().catch(() => '')) || '').trim().slice(0, 50);
    const key = label + i;
    if (!label || clicked.has(label)) continue;
    clicked.add(label);
    currentTrigger = `click#${i}: "${label}"`;
    const before = apiLog.length;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(1800);
    if (apiLog.length > before) console.log(`  [${route}] ${currentTrigger} -> ${apiLog.length - before} API baru`);
  }
  // teks ulang setelah semua interaksi (drawer terbuka dll)
  const textAfter = await page.evaluate(() => document.body.innerText).catch(() => '');
  fs.writeFileSync(path.join(OUT, 'baseline', 'text', (route === '/' ? 'home' : route.replace(/\//g, '_')) + '_after.txt'), textAfter);
  results[route] = apiLog;
  await ctx.close();
  console.log(`${route}: ${apiLog.length} API terpicu dari interaksi`);
}
fs.writeFileSync(path.join(OUT, 'interaction_report.json'), JSON.stringify(results, null, 1));
await browser.close();

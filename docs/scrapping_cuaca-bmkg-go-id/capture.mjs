// Playwright capture harness untuk https://cuaca.bmkg.go.id/
// Modes:
//   node capture.mjs discover                 -> hanya cari routes
//   node capture.mjs capture [route ...]      -> capture (default: semua routes dari routes.json)
// Output: baseline/ + screenshots/ (di direktori ini)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://cuaca.bmkg.go.id';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASELINE = path.join(OUT, 'baseline');
const SHOTS = path.join(OUT, 'screenshots');
const slug = (r) => r === '/' ? 'home' : r.replace(/^\//, '').replace(/[/?=&#]+/g, '_').slice(0, 80) || 'home';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const MAX_BODY = 3_000_000; // ponytail: cap simpan response 3MB; tile raksasa skip

const safeJson = (s) => { try { return JSON.parse(s); } catch { return null; } };

async function newPage(browser, onResp) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('response', async (res) => {
    try {
      const req = res.request();
      const rt = req.resourceType();
      if (!['xhr', 'fetch'].includes(rt)) return;
      const ct = (res.headers()['content-type'] || '').toLowerCase();
      if (!/json|text\/plain/.test(ct)) return; // hanya API JSON
      const url = new URL(res.url());
      if (/\.(png|jpg|webp|woff|js|css|svg)(\?|$)/.test(url.pathname)) return;
      const body = await res.text().catch(() => null);
      if (body == null || body.length > MAX_BODY) return;
      await onResp({ url: res.url(), method: req.method(), status: res.status(),
        postData: req.postData() || null, contentType: ct, body });
    } catch { /* abaikan error response individual */ }
  });
  return { ctx, page };
}

// ---- Phase 1: route discovery (BFS internal link, depth 2) ----
async function discover(browser) {
  const routes = new Set(['/']);
  let frontier = ['/'];
  for (let depth = 0; depth < 2; depth++) {
    const next = [];
    for (const route of frontier) {
      const { ctx, page } = await newPage(browser, () => {});
      try {
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(2500);
        const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
        for (const h of hrefs) {
          if (!h || !h.startsWith('/')) continue;
          const clean = h.split('#')[0].split('?')[0];
          if (clean && !routes.has(clean) && !/\.(js|css|png|jpg|webp|svg|ico|json|xml|txt)$/i.test(clean)) {
            routes.add(clean); next.push(clean);
          }
        }
      } catch (e) { console.error(`  discover gagal ${route}: ${e.message.split('\n')[0]}`); }
      await ctx.close();
    }
    frontier = [...new Set(next)];
    console.log(`depth ${depth}: total routes ${routes.size}`);
  }
  return [...routes].sort();
}

// ---- Phase 2: capture per route ----
async function captureRoute(browser, route) {
  const dir = path.join(BASELINE, slug(route));
  fs.mkdirSync(dir, { recursive: true });
  const apis = [];
  let n = 0;
  const { ctx, page } = await newPage(browser, async (rec) => {
    // nama file: host + path + hash param singkat
    const u = new URL(rec.url);
    const params = [...u.searchParams.entries()].map(([k, v]) => `${k}_${v}`).join('-').slice(0, 60);
    const fname = `${String(++n).padStart(2, '0')}_${u.host.replace(/\./g, '_')}${u.pathname.replace(/[/_-]+$/, '').replace(/[/?=&#]+/g, '_')}${params ? '__' + params : ''}`.slice(0, 120) + '.json';
    const parsed = safeJson(rec.body);
    fs.writeFileSync(path.join(dir, fname), parsed ? JSON.stringify(parsed, null, 1) : rec.body);
    apis.push({ ...rec, file: fname, params: Object.fromEntries(u.searchParams.entries()) });
  });
  const result = { route, capturedAt: new Date().toISOString(), apis };
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    // trigger drawer/tabs umum: klik semua tombol/tab terlihat yang mengandung teks
    const clickables = await page.$$('button, [role="tab"], .tab');
    for (const el of clickables.slice(0, 40)) {
      const txt = (await el.textContent().catch(() => ''))?.trim().slice(0, 40) || '';
      if (!txt) continue;
      await el.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1200);
    }
    await page.waitForTimeout(2000);
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, slug(route) + '.png'), fullPage: true });
    // teks per section
    result.sections = await page.$$eval('h1,h2,h3', hs => hs.map(h =>
      ({ tag: h.tagName, text: h.textContent.trim().slice(0, 120) })));
    result.title = await page.title();
    result.ok = true;
  } catch (e) { result.ok = false; result.error = e.message.split('\n')[0]; }
  fs.writeFileSync(path.join(dir, '_route.json'), JSON.stringify(result, null, 1));
  await ctx.close();
  console.log(`${result.ok ? 'OK' : 'FAIL'} ${route} (${apis.length} API calls)`);
  return result;
}

const mode = process.argv[2];
const browser = await chromium.launch();
if (mode === 'discover') {
  const routes = await discover(browser);
  fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(routes, null, 1));
  console.log(routes.join('\n'));
} else if (mode === 'capture') {
  const args = process.argv.slice(3);
  const routes = args.length ? args : JSON.parse(fs.readFileSync(path.join(OUT, 'routes.json'), 'utf8'));
  const results = [];
  for (const r of routes) results.push(await captureRoute(browser, r));
  fs.writeFileSync(path.join(OUT, 'capture_report.json'), JSON.stringify(results.map(r =>
    ({ route: r.route, ok: r.ok, title: r.title, error: r.error, apiCount: r.apis.length, sections: r.sections })), null, 1));
  console.log('selesai. routes:', routes.length);
}
await browser.close();

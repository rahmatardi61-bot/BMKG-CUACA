import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126'});
p.on('request', req => {
  if (req.url().includes('/api/public/weather/warning')) {
    console.log('\n>>>', req.url());
    console.log(JSON.stringify(req.headers(), null, 1));
  }
});
await p.goto('https://cuaca.bmkg.go.id/', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(8000);
await b.close();

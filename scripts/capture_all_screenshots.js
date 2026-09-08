import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:4173/';
const OUT_DIR = path.resolve('output_screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function preparePage(page, isMobile, isDark) {
  if (isMobile) {
    await page.setViewport({
      width: 412,
      height: 645,
      deviceScaleFactor: 1.5,
      isMobile: true,
      hasTouch: true
    });
  } else {
    await page.setViewport({
      width: 1920,
      height: 960,
      deviceScaleFactor: 1
    });
  }

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await delay(1000);

  // Set Theme mode
  await page.evaluate((dark) => {
    const root = document.documentElement;
    root.classList.remove('no-transitions', 'theme-morning', 'theme-day', 'theme-evening', 'theme-night', 'theme-rainy', 'theme-stormy', 'theme-cloudy', 'dark');
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('bmkg-theme', 'dark');
    } else {
      root.classList.add('light');
      localStorage.setItem('bmkg-theme', 'light');
    }
  }, isDark);

  await delay(600);
  await removeToasts(page);
}

async function removeToasts(page) {
  await page.evaluate(() => {
    const alerts = document.querySelectorAll('.toast, [role="alert"], .fixed.top-4, .fixed.top-5, .fixed.top-6, .fixed.bottom-6');
    alerts.forEach(el => el.remove());
  });
}

async function selectCity(page, cityName) {
  await page.evaluate((cName) => {
    const btn = document.getElementById('landmark-card-' + cName.toLowerCase()) ||
                Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes(cName));
    if (btn) {
      btn.click();
    }
  }, cityName);
  await delay(1000);
  await removeToasts(page);
}

async function captureScreenshots() {
  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ['geolocation']);

  const page = await browser.newPage();
  await page.setGeolocation({ latitude: -7.834, longitude: 110.339 });

  const modes = [
    { name: 'Desktop Light', isMobile: false, isDark: false, getIndex: (sec) => (sec - 1) * 4 + 1 },
    { name: 'Mobile Light', isMobile: true, isDark: false, getIndex: (sec) => (sec - 1) * 4 + 2 },
    { name: 'Desktop Dark', isMobile: false, isDark: true, getIndex: (sec) => (sec - 1) * 4 + 3 },
    { name: 'Mobile Dark', isMobile: true, isDark: true, getIndex: (sec) => (sec - 1) * 4 + 4 }
  ];

  for (const mode of modes) {
    console.log(`\n========================================`);
    console.log(`Starting Mode: ${mode.name}`);
    console.log(`========================================`);

    // ─────────────────────────────────────────────────────────────
    // 2.1 Dashboard Utama & Wilayah Aktif (Section 1)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.1 (${mode.name})...`);
    await preparePage(page, mode.isMobile, mode.isDark);
    await removeToasts(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(600);
    await removeToasts(page);

    const img1Path = path.join(OUT_DIR, `image${mode.getIndex(1)}.png`);
    await page.screenshot({ path: img1Path });
    console.log(`Saved ${img1Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.2 Panel Peringatan Dini (Alerts Panel) (Section 2)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.2 (${mode.name})...`);
    await selectCity(page, 'medan');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(600);
    await removeToasts(page);

    const img2Path = path.join(OUT_DIR, `image${mode.getIndex(2)}.png`);
    await page.screenshot({ path: img2Path });
    console.log(`Saved ${img2Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.3 Kartu Kondisi Cuaca Terkini (Current Weather) (Section 3)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.3 (${mode.name})...`);
    await selectCity(page, 'makassar');
    await delay(800);
    await removeToasts(page);

    const img3Path = path.join(OUT_DIR, `image${mode.getIndex(3)}.png`);
    if (mode.isMobile) {
      const cwHandle = await page.evaluateHandle(() => {
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
        const metricCard = document.querySelector('.weather-metric-card');
        return metricCard ? metricCard.closest('.space-y-6') : null;
      });
      const el = cwHandle.asElement();
      if (el) {
        await el.screenshot({ path: img3Path });
      } else {
        await page.evaluate(() => window.scrollTo(0, 450));
        await delay(500);
        await page.screenshot({ path: img3Path });
      }
      await page.evaluate(() => {
        const header = document.querySelector('header');
        if (header) header.style.display = '';
      });
    } else {
      await page.evaluate(() => {
        const metricCard = document.querySelector('.weather-metric-card');
        const container = metricCard ? metricCard.closest('.space-y-6') : null;
        if (container) {
          container.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollBy(0, -85);
        } else {
          window.scrollTo(0, 480);
        }
      });
      await delay(600);
      await page.screenshot({ path: img3Path });
    }
    console.log(`Saved ${img3Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.4 Grafik Prakiraan Cuaca Per Jam (Forecast Panel) (Section 4)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.4 (${mode.name})...`);
    await page.evaluate(() => {
      const forecastH4 = Array.from(document.querySelectorAll('*')).find(e => /^h[1-6]$/i.test(e.tagName) && /prakiraan\s*per\s*jam/i.test(e.textContent));
      const forecastCard = forecastH4 ? forecastH4.closest('.rounded-3xl') : null;
      if (forecastCard) {
        forecastCard.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -75);
      } else {
        window.scrollTo(0, 1100);
      }
    });
    await delay(800);
    await removeToasts(page);

    const img4Path = path.join(OUT_DIR, `image${mode.getIndex(4)}.png`);
    await page.screenshot({ path: img4Path });
    console.log(`Saved ${img4Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.5 Pemantau Gempa Terdekat (Seismic Monitor) (Section 5)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.5 (${mode.name})...`);
    // First scroll down to trigger LazyCardLoader IntersectionObserver
    await page.evaluate(() => window.scrollTo(0, 3500));
    await delay(1500);
    await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('*')).find(e => /^h[1-6]$/i.test(e.tagName) && /risiko\s*&?\s*riwayat\s*seismik/i.test(e.textContent));
      const card = h ? h.closest('.rounded-3xl') || h : null;
      if (card) {
        card.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -75);
      } else {
        window.scrollTo(0, 2400);
      }
    });
    await delay(1000);
    await removeToasts(page);

    const img5Path = path.join(OUT_DIR, `image${mode.getIndex(5)}.png`);
    await page.screenshot({ path: img5Path });
    console.log(`Saved ${img5Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.6 Modul Aktivitas & Analisis Cuaca Sektoral (Section 6)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.6 (${mode.name})...`);
    await page.evaluate(() => {
      const h4 = Array.from(document.querySelectorAll('h4')).find(e => /aktivitas darat/i.test(e.textContent));
      if (h4) {
        h4.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -80);
      } else {
        window.scrollTo(0, 750);
      }
    });
    await delay(800);
    await removeToasts(page);

    const img6Path = path.join(OUT_DIR, `image${mode.getIndex(6)}.png`);
    await page.screenshot({ path: img6Path });
    console.log(`Saved ${img6Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.7 Rute Cuaca Transportasi Darat (Land Advisor) (Section 7)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.7 (${mode.name})...`);
    await preparePage(page, mode.isMobile, mode.isDark);
    await selectCity(page, 'makassar');
    await delay(600);
    await page.evaluate(() => {
      const h4 = Array.from(document.querySelectorAll('h4')).find(e => /aktivitas darat/i.test(e.textContent));
      if (h4) {
        const card = h4.closest('.gpu-card') || h4;
        card.click();
      }
    });
    await delay(2500);
    await removeToasts(page);

    const img7Path = path.join(OUT_DIR, `image${mode.getIndex(7)}.png`);
    await page.screenshot({ path: img7Path });
    console.log(`Saved ${img7Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.8 Layanan Panduan Kemaritiman (Maritime Advisor) (Section 8)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.8 (${mode.name})...`);
    await preparePage(page, mode.isMobile, mode.isDark);
    await page.evaluate(() => {
      const h4 = Array.from(document.querySelectorAll('h4')).find(e => /aktivitas pesisir|pelayaran/i.test(e.textContent));
      if (h4) {
        const card = h4.closest('.gpu-card') || h4;
        card.click();
      }
    });
    await delay(2200);
    await removeToasts(page);

    const img8Path = path.join(OUT_DIR, `image${mode.getIndex(8)}.png`);
    await page.screenshot({ path: img8Path });
    console.log(`Saved ${img8Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.9 Prakiraan Cuaca Penerbangan (Aviation Advisor) (Section 9)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.9 (${mode.name})...`);
    await preparePage(page, mode.isMobile, mode.isDark);
    await page.evaluate(() => {
      const h4 = Array.from(document.querySelectorAll('h4')).find(e => /penerbangan/i.test(e.textContent));
      if (h4) {
        const card = h4.closest('.gpu-card') || h4;
        card.click();
      }
    });
    await delay(2200);
    await removeToasts(page);

    const img9Path = path.join(OUT_DIR, `image${mode.getIndex(9)}.png`);
    await page.screenshot({ path: img9Path });
    console.log(`Saved ${img9Path}`);

    // ─────────────────────────────────────────────────────────────
    // 2.10 Cities Carousel & App Download CTA (Section 10)
    // ─────────────────────────────────────────────────────────────
    console.log(`Capturing Section 2.10 (${mode.name})...`);
    await preparePage(page, mode.isMobile, mode.isDark);
    await selectCity(page, 'surabaya');
    await delay(800);
    await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => /kondisi terkini/i.test(h.textContent));
      const card = h3 ? h3.closest('.rounded-3xl') || h3 : null;
      if (card) {
        card.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -75);
      } else {
        window.scrollTo(0, 400);
      }
    });
    await delay(800);
    await removeToasts(page);

    const img10Path = path.join(OUT_DIR, `image${mode.getIndex(10)}.png`);
    await page.screenshot({ path: img10Path });
    console.log(`Saved ${img10Path}`);
  }

  console.log('\nAll 40 screenshots captured successfully!');
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Failed capturing screenshots:', err);
  process.exit(1);
});

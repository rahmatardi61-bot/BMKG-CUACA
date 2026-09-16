import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ── BMKG proxy (dev) ────────────────────────────────────────────────────────
// /api/df/* butuh Referer cuaca.bmkg.go.id, /api/public/* butuh Origin sama +
// x-public-token fresh (JWT 30 menit) — semuanya di-set server-side di sini.
// Prod: api/bmkg/[...path].ts (Vercel function) dengan logika setara.
const BMKG_UPSTREAM = 'https://cuaca.bmkg.go.id';
const BMKG_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
let pubTok = { value: '', exp: 0 };
async function getPubTok(): Promise<string> {
  if (pubTok.value && Date.now() < pubTok.exp) return pubTok.value;
  try {
    const html = await (await fetch(BMKG_UPSTREAM + '/', { headers: { 'User-Agent': UA, Accept: 'text/html' } })).text();
    const seg = html.slice(html.indexOf('publicToken'));
    const tok = seg.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
    if (tok) pubTok = { value: tok, exp: Date.now() + 25 * 60 * 1000 }; // refresh sebelum exp 30m
  } catch (e) {
    console.error('[bmkg-proxy] gagal ambil publicToken:', e);
  }
  return pubTok.value;
}
getPubTok(); // warm saat dev server start

// path proxy = PERSIS path upstream (tanpa alias) — devtools menampilkan /api/df/... seperti API aslinya.
// Header khusus (Referer/Origin/X-API-KEY/x-public-token) di-inject di sini, transparan bagi client.
// DWT (publik.bmkg.go.id) tidak punya CORS → lewat proxy juga (tanpa header khusus)
const DWT_PROXY = ['/event', {
  target: 'https://publik.bmkg.go.id',
  changeOrigin: true,
  configure(proxy: any) {
    proxy.on('proxyReq', (proxyReq: any) => proxyReq.setHeader('User-Agent', UA));
  },
}];

// Nowcast RSS (www.bmkg.go.id) — tanpa header CORS → lewat proxy (tanpa header khusus)
const NOWCAST_PROXY = ['/alerts', {
  target: 'https://www.bmkg.go.id',
  changeOrigin: true,
  configure(proxy: any) {
    proxy.on('proxyReq', (proxyReq: any) => proxyReq.setHeader('User-Agent', UA));
  },
}];

const PROXY_ENTRIES: Array<[string, { pubtok?: boolean }]> = [
  ['/api/df', {}],
  ['/api/public', { pubtok: true }],
  ['/api/v1/public', { pubtok: true }],
  ['/api/v1/user', { pubtok: true }],
  ['/blog', {}],
];
const bmkgProxy = Object.fromEntries(PROXY_ENTRIES.map(([prefix, flags]) => [prefix, {
  target: BMKG_UPSTREAM,
  changeOrigin: true,
  headers: { Referer: BMKG_UPSTREAM + '/', Origin: BMKG_UPSTREAM },
  configure(proxy: any) {
    proxy.on('proxyReq', (proxyReq: any, req: any) => {
      proxyReq.setHeader('User-Agent', UA);
      if (req.url && req.url.includes('/api/v1/')) proxyReq.setHeader('X-API-KEY', BMKG_API_KEY);
      if (flags.pubtok && pubTok.value) proxyReq.setHeader('x-public-token', pubTok.value);
    });
  },
}]));

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: { ...bmkgProxy, '/event': DWT_PROXY[1], '/alerts': NOWCAST_PROXY[1] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('src/data/mockData.ts') || id.includes('src/data/cityThemes.ts')) {
            return 'mock-data';
          }
        }
      }
    }
  }
})

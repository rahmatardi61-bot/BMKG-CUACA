import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, relative } from 'node:path'
import { existsSync } from 'node:fs'

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

// .env dibaca Vite untuk variabel VITE_*, tapi handler server (api/*.ts) butuh
// variabel non-VITE (KEYCLOAK_*). Muat manual supaya dev server setara runtime.
import { readFileSync } from 'node:fs'
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* .env tidak ada — pakai env platform (Vercel) */
}

// Route function Vercel (/api/*.ts) tidak otomatis jalan di `vite dev`.
// Plugin kecil ini meneruskan /api/embed-token ke handler yang sama, supaya
// dev server (5173) & server.mjs (8080) berperilaku identik.
const apiRoutes: Plugin = {
  name: 'vercel-api-dev',
  configureServer(server) {
    // Semua handler di api/** bisa dipanggil di dev (5173) sama seperti di
    // Vercel/server.mjs. Rutenya DIPINDAI dari folder api/, bukan daftar
    // hardcoded — menambah endpoint cukup menambah file.
    const API_DIR = resolve(__dirname, 'api');
    // Folder handler tingkat-atas lain (bukan /api/*): sekarang /v3 — supaya
    // OpenAPI bisa dipasang di URL yang biasa dibuka orang (/v3/api-docs),
    // bukan /api/v3/api-docs yang aneh.
    // '/v3/api-docs' → api/v3/api-docs.js (nama file di api/ supaya Vercel
    // mengenalinya sebagai function; URL-nya gaya springdoc)
    const EXTRA_DIRS = ['v3'];
    const extra = new Map(EXTRA_DIRS.map((d) => [`/${d}`, resolve(__dirname, 'api', d)]));

    function fileFor(rel: string, dir = API_DIR): string | null {
      const base = resolve(dir, rel);
      if (!base.startsWith(dir)) return null; // tolak path traversal
      const candidates = /\.[jt]s$/.test(rel)
        ? [base]
        : [`${base}.js`, `${base}.ts`, `${base}/index.js`, `${base}/index.ts`];
      return candidates.find((f) => existsSync(f)) ?? null;
    }

    server.middlewares.use(async (req, res, next) => {
      const pathname = (req.originalUrl ?? req.url ?? '').split('?')[0];
      const extraKey = EXTRA_DIRS.map((d) => `/${d}`).find((p) => pathname === p || pathname.startsWith(`${p}/`));
      const isApi = pathname === '/api' || pathname.startsWith('/api/') || pathname === '/api-bmkg' || extraKey;
      if (!isApi) return next();

      // '/api' → katalog (api/index.js); legacy '/api-bmkg' → api/bmkg
      // '/v3/...' → v3/<rel>
      const rel = pathname === '/api-bmkg' ? 'bmkg'
        : pathname === '/api' ? 'index'
        : extraKey ? pathname.slice(extraKey.length + 1)
        : pathname.slice('/api/'.length);
      const file = fileFor(rel.replace(/\/$/, 'index'), extraKey ? extra.get(extraKey)! : API_DIR);
      // Bukan file handler? Bisa jadi path upstream BMKG yang diteruskan ke
      // server.proxy di bawah (/api/df/*, /api/public/*, …). Jangan ditelan di sini,
      // kalau ditelan widget kehilangan datanya (regresi: 404 untuk semua widget).
      if (!file) return next();

      try {
        // ssrLoadModule memakai path relatif root (bukan absolut di Windows/mac)
        const { default: mod } = await server.ssrLoadModule(`/${relative(__dirname, file)}`);
        const handler = typeof mod === 'function' ? mod : mod.fetch;
        // Base URL memakai Host asli, bukan 'http://localhost': handler yang
        // membaca new URL(req.url).origin (mis. /v3/api-docs) harus melihat
        // http://localhost:5173, bukan http://localhost tanpa port.
        const host = req.headers.host ?? 'localhost';
        const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http';
        const url = new URL(req.originalUrl ?? req.url ?? '/', `${proto}://${host}`);
        const out = await handler(
          new Request(url, { method: req.method, headers: req.headers as Record<string, string> }),
        );
        const body = Buffer.from(await out.arrayBuffer());
        res.writeHead(out.status, { ...Object.fromEntries(out.headers), 'Content-Length': String(body.length) });
        res.end(req.method === 'HEAD' ? undefined : body);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Handler gagal', detail: String(e).slice(0, 300) }));
      }
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), apiRoutes],
  server: {
    // Port dipin jauh dari 5173 supaya tidak tertukar dengan proyek lain
    // (bmkg-embed-examples berjalan di 4477). strictPort: gagal terang-terangan
    // kalau bentrok, bukan diam-diam pindah ke port lain.
    port: 5173,
    strictPort: true,
    proxy: { ...bmkgProxy, '/event': DWT_PROXY[1], '/alerts': NOWCAST_PROXY[1] },
  },
  build: {
    rollupOptions: {
      // Dua entry: app utama (index.html) + widget embed (embed.html, dipakai iframe)
      input: {
        main: resolve(__dirname, 'index.html'),
        embed: resolve(__dirname, 'embed.html'),
      },
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

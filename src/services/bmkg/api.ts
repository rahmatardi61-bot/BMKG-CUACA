// Klien API cuaca.bmkg.go.id
// - /api/df/* WAJIB proxy: tanpa CORS (+butuh Referer yang terlarang di-set browser)
// - /api/public/* + /api/v1/public/* WAJIB proxy: 401 tanpa x-public-token, dan token
//   hanya bisa diekstrak server-side dari HTML upstream (diblok CORS di browser)
// - /blog/wp-json/* + /alerts (RSS www.bmkg.go.id) WAJIB proxy: tanpa CORS
// - /api/presentwx/*, /api/v1/sunset, /api/v1/tcwc/*, maritim.bmkg.go.id, api.bmkg.go.id
//   → direct (ACAO *), sudah diverifikasi

// Mode akses via env VITE_BMKG_PROXY (build-time):
//   (kosong)          → otomatis: dev = path-style (vite proxy), prod = '/api/bmkg' (function)
//   '/api/bmkg' dsb.  → paksa base proxy tertentu
//   'direct'          → TANPA proxy: langsung https://cuaca.bmkg.go.id/<path>
//                       (host khusus tetap diarahkan: alerts→www., event→publik.
//                        — sama seperti routing di api/bmkg.ts).
//                       Catatan: df/public/blog/alerts tidak punya CORS / butuh header
//                       khusus → gagal di browser → fallback mock (untuk eksperimen,
//                       bukan produksi).
const PROXY_RAW = import.meta.env.VITE_BMKG_PROXY || (import.meta.env.DEV ? 'dev' : '');
const PROXY_MODE = PROXY_RAW.toLowerCase();
// base default = route function /api/bmkg; env berawalan '/' dipakai apa adanya
const PROXY_BASE = PROXY_MODE === 'dev' || PROXY_MODE === 'direct' ? ''
  : PROXY_RAW.startsWith('/') ? PROXY_RAW : '/api/bmkg';
export const BMKG_BASE = 'https://cuaca.bmkg.go.id';

/** Static client key (dari __NUXT_DATA__ baseline — publik milik situs BMKG) */
export const BMKG_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';

const TIMEOUT_MS = 10000;

async function request(url: string, headers: Record<string, string> = {}): Promise<Response> {
  // dev-only: permudah membaca — request via proxy localhost dicetak sebagai URL upstream aslinya
  if (import.meta.env.DEV && url.startsWith('/')) {
    console.info(`[BMKG API] ${BMKG_BASE}${url}`);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`BMKG ${res.status} ${url}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** GET dengan retry sekali (network flake) */
async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  try {
    return (await (await request(url, headers)).json()) as T;
  } catch (e) {
    return (await (await request(url, headers)).json()) as T;
  }
}

const qs = (params: Record<string, string | number | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

/**
 * URL lewat proxy.
 * - dev   → path-style: `/api/df/...` (prefix vite proxy = segmen pertama path)
 * - prod  → `/api/bmkg?path=<encoded>&<query>` → Vercel function api/bmkg.ts / server.mjs
 *   (route polos sesuai nama file, tanpa catch-all)
 */
/** Host upstream untuk sebuah path — cerminan routing di api/bmkg.ts. */
function upstreamUrl(p: string): string {
  const host = p.startsWith('alerts/') ? 'https://www.bmkg.go.id'
    : p.startsWith('event/') ? 'https://publik.bmkg.go.id'
    : 'https://cuaca.bmkg.go.id';
  return `${host}/${p}`;
}

/**
 * URL untuk family yang butuh proxy.
 * - 'dev'    → `/event/...` (prefix = segmen pertama path, ditangani vite proxy)
 * - 'proxy'  → `/api/bmkg?path=<encoded>` (api/bmkg.ts di Vercel / server.mjs)
 * - 'direct' → langsung upstream, tanpa header khusus (lihat komentar di atas)
 */
export function bmkgProxied(path: string): string {
  const p = path.replace(/^\//, '');
  if (PROXY_MODE === 'direct') return upstreamUrl(p);
  if (PROXY_MODE === 'dev') return `/${p}`;
  return `${PROXY_BASE}?path=${encodeURIComponent(p)}`;
}

function proxiedUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const base = bmkgProxied(path);
  const q = qs(params);
  return q ? `${base}${base.includes('?') ? '&' : '?'}${q}` : base;
}

/**
 * Lewat proxy — dipakai untuk family yang butuh header khusus:
 * /api/df/*, /api/public/*, /api/v1/public/*, /blog/wp-json/*, /alerts
 */
export function bmkgProxy<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  return getJson<T>(proxiedUrl(path, params));
}

/**
 * Direct dari browser (ACAO *): /api/presentwx/* dan /api/v1/* (butuh X-API-KEY).
 */
export function bmkgDirect<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const q = qs(params);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (path.startsWith('api/v1/')) headers['X-API-KEY'] = BMKG_API_KEY;
  return getJson<T>(`${BMKG_BASE}/${path.replace(/^\//, '')}${q ? `?${q}` : ''}`, headers);
}

/**
 * Nowcast RSS (peringatan dini cuaca) — host `www.bmkg.go.id`, TIDAK punya header
 * CORS → lewat proxy (dev: vite `/alerts`; prod: api/bmkg.ts?path=alerts/…).
 */
export function bmkgNowcastRss(): Promise<string> {
  return request(bmkgProxied('alerts/nowcast/id')).then(r => r.text());
}

/**
 * BMKG Open Data RESMI (ACAO `*` → direct, tanpa proxy).
 * Bentuk item-nya identik dengan `forecast/coord` internal → `forecastToHourly` bisa dipakai ulang.
 */
export const bmkgOfficial = {
  prakiraanCuacaAdm4: (adm4: string) =>
    getJson<BmkgForecastResponse>(
      `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`,
    ),
};

// ── Endpoint helpers (typed) ──────────────────────────────────────────────────
import type {
  BmkgAdmResponse,
  BmkgAmandemenResponse,
  BmkgCycloneResponse,
  BmkgForecastResponse,
  BmkgMaritimNearestResponse,
  BmkgPresentWxResponse,
  BmkgSunsetResponse,
  BmkgVideoItem,
  BmkgWarningResponse,
  BmkgWeeklyTempResponse,
} from '../../types/bmkg';

export const bmkg = {
  forecast: (lat: number, lon: number) =>
    bmkgProxy<BmkgForecastResponse>('api/df/v1/forecast/coord', { lat, lon }),
  adm: (lat: number, lon: number) => bmkgProxy<BmkgAdmResponse>('api/df/v1/adm/coord', { lat, lon }),
  amandemen: (lat: number, lon: number) =>
    bmkgProxy<BmkgAmandemenResponse>('api/df/v1/amandemen/coord', { lat, lon }),
  warning: (lat: number, lon: number) =>
    bmkgProxy<BmkgWarningResponse>('api/public/weather/warning', { lat, long: lon }),
  weeklyTemp: (lat: number, lon: number) =>
    bmkgProxy<BmkgWeeklyTempResponse>('api/public/weather/weekly-temperature', { lat, long: lon }),
  maritimNearest: (lat: number, lon: number) =>
    bmkgProxy<BmkgMaritimNearestResponse>('api/v1/public/maritim/nearest-location', { lat, long: lon }),
  blogPosts: (perPage = 4) =>
    bmkgProxy<unknown[]>('blog/wp-json/wp/v2/posts', { per_page: perPage, _embed: 1 }),
  presentWx: (lat: number, lon: number) => bmkgDirect<BmkgPresentWxResponse>('api/presentwx/coord', { lat, lon }),
  sunset: (lat: number, lon: number) => bmkgDirect<BmkgSunsetResponse>('api/v1/sunset/json', { lat, lng: lon }),
  cyclone: () => bmkgDirect<BmkgCycloneResponse>('api/v1/tcwc/cyclone/all'),
  videos: (hashtag = 'infobmkgpws') =>
    bmkgProxy<BmkgVideoItem[]>('api/public/weather/video-latest', { hashtag }),
};

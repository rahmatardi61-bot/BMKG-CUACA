// Klien API cuaca.bmkg.go.id
// - /api/df/* + /api/public/* WAJIB lewat proxy (butuh Referer/Origin cuaca.bmkg.go.id
//   yang tidak bisa di-set dari browser — lihat docs/api-mapping/IMPLEMENTATION-PLAN.md)
// - /api/presentwx/* + /api/v1/* terbuka CORS (ACAO *) → direct, tapi tetap bisa lewat proxy
// - /blog/wp-json/* → lewat proxy (tanpa CORS)

// dev: '' → path persis seperti upstream (/api/df/...) biar devtools mudah dibaca.
// prod (Vercel): set VITE_BMKG_PROXY=/api/bmkg → lewat api/bmkg/[...path].ts
const PROXY = import.meta.env.VITE_BMKG_PROXY || '';
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
 * Lewat proxy (`/api-bmkg/*`):
 * - dev   → Vite dev proxy (vite.config.ts) yang inject Referer + x-public-token
 * - prod  → Vercel function api/bmkg/[...path].ts yang setara
 * Dipakai untuk family yang butuh header khusus: /api/df/*, /api/public/*, /blog/wp-json/*
 */
export function bmkgProxy<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const q = qs(params);
  return getJson<T>(`${PROXY}/${path.replace(/^\//, '')}${q ? `?${q}` : ''}`);
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
 * CORS → tetap lewat proxy (dev: vite `/alerts`; prod: api/bmkg/[...path].ts).
 */
export function bmkgNowcastRss(): Promise<string> {
  return request(`${PROXY}/alerts/nowcast/id`).then(r => r.text());
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

// ═══════════════════════════════════════════════════════════════════════════
// AKSES UPSTREAM BMKG — satu tempat untuk semua trik yang tidak boleh dilakukan
// browser: pilih host yang benar, suntik Referer/Origin, X-API-KEY, dan
// x-public-token yang diambil dari HTML beranda (di-cache 25 menit).
//
// Dipakai dua lapis:
//   api/bmkg.ts                  → proxy mentah (?path=…), dipakai widget
//   api/{weather,geo,…}/*.js     → bentuk normal, dipakai partner & mobile
//
// Kembalian sengaja "mentah" (status + body teks + content-type): pemanggil
// yang memutuskan mau di-parse atau diteruskan apa adanya.
// ═══════════════════════════════════════════════════════════════════════════

import { span } from './observability.js';

export const UPSTREAM = 'https://cuaca.bmkg.go.id';
export const NOWCAST_UPSTREAM = 'https://www.bmkg.go.id';
export const DWT_UPSTREAM = 'https://publik.bmkg.go.id';
export const MARITIM_UPSTREAM = 'https://maritim.bmkg.go.id/public_api';
/** Open Data resmi (prakiraan per adm4) — CORS `*`, tanpa header khusus. */
export const OFFICIAL_UPSTREAM = 'https://api.bmkg.go.id';

// ponytail: kunci publik yang tertanam di JS cuaca.bmkg.go.id, bukan rahasia kita.
// Kalau BMKG merotasinya, ganti di sini (satu tempat, bukan dua).
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// ponytail: cache token per-instance, TTL 25m < exp 30m. Cold start = ambil ulang.
const tokenState = { value: '', exp: 0 };

async function getPubTok() {
  if (tokenState.value && Date.now() < tokenState.exp) return tokenState.value;
  try {
    const html = await (
      await fetch(UPSTREAM + '/', { headers: { 'User-Agent': UA, Accept: 'text/html' } })
    ).text();
    const seg = html.slice(html.indexOf('publicToken'));
    const tok = seg.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
    if (tok) Object.assign(tokenState, { value: tok, exp: Date.now() + 25 * 60 * 1000 });
  } catch {
    /* biarkan tanpa token → upstream 401 → pemanggil menjawab error jujur */
  }
  return tokenState.value;
}

/** Header yang disuntikkan per jenis path. Diekspor supaya bisa diuji. */
export async function headersFor(path) {
  const isNowcast = path.startsWith('alerts/');
  const isDwt = path.startsWith('event/');

  const headers = isNowcast
    ? { 'User-Agent': UA, Accept: 'application/xml' }
    : isDwt
      ? { 'User-Agent': UA, Accept: 'application/json' }
      : { Referer: UPSTREAM + '/', Origin: UPSTREAM, 'User-Agent': UA, Accept: 'application/json' };

  if (!isNowcast && !isDwt && path.includes('api/v1/')) headers['X-API-KEY'] = API_KEY;
  if (
    !isNowcast &&
    !isDwt &&
    (path.includes('api/public/') || path.includes('v1/public/') || path.includes('v1/user/'))
  ) {
    const tok = await getPubTok();
    if (tok) headers['x-public-token'] = tok;
  }
  return headers;
}

/** Host upstream yang tepat untuk sebuah path. */
export function hostFor(path) {
  if (path.startsWith('alerts/')) return NOWCAST_UPSTREAM;
  if (path.startsWith('event/')) return DWT_UPSTREAM;
  return UPSTREAM;
}

/**
 * Panggil upstream BMKG.
 * @param {string} path path upstream, mis. 'api/df/v1/forecast/coord'
 * @param {Record<string, string|number>|URLSearchParams} [params] query asli
 * @param {string} [host] paksa host (dipakai api/weather/forecast-official.js)
 * @returns {Promise<{ status: number, ok: boolean, body: string, contentType: string }>}
 */
export async function bmkgFetch(path, params, host) {
  const qs =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        );

  const target = `${host ?? hostFor(path)}/${path}${qs.size ? `?${qs}` : ''}`;
  const res = await span('upstream.bmkg', { host: new URL(target).host, path }, async () =>
    fetch(target, { headers: await headersFor(path) }));
  return {
    status: res.status,
    ok: res.ok,
    body: await res.text(),
    contentType: res.headers.get('content-type') || 'application/json',
  };
}

/**
 * Maritim Open Data — host lain, CORS `*`, tanpa header khusus. Dipisah dari
 * bmkgFetch karena aturan headernya memang berbeda (bukan bagian cuaca.bmkg).
 * @param {string} path mis. 'pelabuhan_list'
 */
export async function maritimFetch(path) {
  const res = await fetch(`${MARITIM_UPSTREAM}/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  return {
    status: res.status,
    ok: res.ok,
    body: await res.text(),
    contentType: res.headers.get('content-type') || 'application/json',
  };
}

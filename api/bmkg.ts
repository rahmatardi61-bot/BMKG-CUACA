// Vercel serverless (edge): proxy same-origin → upstream BMKG.
// Bentuk panggilan: /api/bmkg?path=<path-upstream>&<query-asli>
//   contoh: /api-bmkg?path=api%2Fdf%2Fv1%2Fforecast%2Fcoord&lat=-6.2&lon=106.8
//
// Kenapa path lewat query, bukan /api/bmkg/<path>: catch-all [...path] tidak
// reliabel di Vercel Functions — saat tidak terpasang, request jatuh ke SPA
// rewrite (vercel.json) dan balik index.html (dokumen, bukan JSON). Route
// polos "/api-bmkg" selalu terdeteksi dan lebih diutamakan dari rewrite.
//
// Logika sama dengan proxy dev di vite.config.ts:
// - inject Referer + Origin (wajib untuk /api/df/* — header terlarang di browser)
// - inject X-API-KEY (untuk /api/v1/*)
// - inject x-public-token fresh (cache ~25 menit) untuk /api/public/*, /v1/public/*, /v1/user/*
// - path `alerts/*` (nowcast RSS) diarahkan ke www.bmkg.go.id (tanpa CORS di sana)
// Dipakai di Vercel (folder api/ terdeteksi otomatis) dan server.mjs (Docker).
import { bearer, verifyJwt } from '../lib/jwt.js';
import { bmkgFetch } from '../lib/upstream.js';

export const config = { runtime: 'nodejs' };

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Gerbang: hanya pemegang token Keycloak sah yang boleh memakai proxy ini.
  // Diletakkan SEBELUM apa pun supaya request tanpa token tidak membebani upstream.
  const token = bearer(req) || url.searchParams.get('token') || '';
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Tidak diotorisasi', reason: 'header Authorization: Bearer <jwt> wajib' }),
      { status: 401, headers: JSON_HEADERS },
    );
  }
  const verdict = await verifyJwt(token);
  if (!verdict.ok) {
    return new Response(
      JSON.stringify({ error: 'Token tidak sah', reason: verdict.reason ?? 'ditolak' }),
      { status: 401, headers: JSON_HEADERS },
    );
  }

  const path = url.searchParams.get('path') ?? '';
  if (!path) return new Response(JSON.stringify({ error: 'parameter path wajib' }), { status: 400, headers: JSON_HEADERS });

  const own = new URLSearchParams(url.search);
  own.delete('path');

  try {
    // Host, header, dan cache token upstream semuanya di lib/upstream.js —
    // endpoint /api/* (bentuk normal) memakai modul yang sama.
    const up = await bmkgFetch(path, own);
    return new Response(up.body, {
      status: up.status,
      headers: { 'Content-Type': up.contentType, 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Vercel: web handler (semua method masuk ke sini). Bentuk resmi di Node runtime.
export default { fetch: handle };

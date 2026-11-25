// ═══════════════════════════════════════════════════════════════════════════
// PERKAKAS HTTP untuk endpoint /api/* (bentuk normal).
// Semua endpoint memakai gerbang yang sama dengan widget: token Keycloak sah.
//
// Bentuk error (dipakai semua endpoint, jangan diubah tanpa memperbarui
// docs/api-contract.md):
//   { error: '<pesan manusia>', code: 'UNAUTHORIZED|BAD_REQUEST|UPSTREAM_ERROR|INTERNAL', reason: '<detail>' }
// ═══════════════════════════════════════════════════════════════════════════
import { bearer, verifyJwt } from './jwt.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

export function fail(status, code, error, reason) {
  return json({ error, code, reason }, status);
}

/** Gerbang token — sama dengan /api/bmkg dan /api/widget-catalog. */
export async function requireAuth(req) {
  const token = bearer(req) ?? '';
  if (!token) return { ok: false, reason: 'header Authorization: Bearer <jwt> wajib' };
  const verdict = await verifyJwt(token);
  return verdict.ok ? { ok: true, claims: verdict.claims } : { ok: false, reason: verdict.reason ?? 'ditolak' };
}

/**
 * Baca & validasi lat/lon (keduanya wajib, WGS84, batas Indonesia dilewatkan
 * saja supaya tetap bisa dipakai untuk koordinat luar).
 */
export function coordsOf(req) {
  const p = new URL(req.url).searchParams;
  const lat = Number(p.get('lat'));
  const lon = Number(p.get('lon') ?? p.get('long')); // sebagian upstream memakai 'long'
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: 'query lat & lon wajib berupa angka (contoh: ?lat=-6.2&lon=106.8)' };
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { ok: false, reason: 'lat harus -90..90, lon -180..180' };
  }
  return { ok: true, lat, lon };
}

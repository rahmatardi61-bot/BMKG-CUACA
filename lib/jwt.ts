// ═══════════════════════════════════════════════════════════════════════════
// VERIFIKASI JWT KEYCLOAK lewat JWKS (RS256) — gerbang semua endpoint embed
// ---------------------------------------------------------------------------
// Tanpa dependency: pakai WebCrypto (crypto.subtle), jalan di Vercel Edge
// maupun Node 18+. Yang diperiksa:
//   - tanda tangan RS256 dengan public key dari JWKS (bukan cuma decode!)
//   - exp (kedaluwarsa, toleransi 10 detik untuk beda jam)
//   - iss (harus realm kita)
//
// Kenapa JWKS, bukan introspect: introspect butuh client_secret di server kita
// tiap request. JWKS cuma public key — tidak ada rahasia yang lewat.
//
// JWKS di-cache 10 menit per instance. Kalau Keycloak mati, key lama di cache
// masih bisa memverifikasi → widget tidak ikut mati.
// ═══════════════════════════════════════════════════════════════════════════

export const REALM_URL =
  process.env.KEYCLOAK_REALM_URL ?? 'https://auth-dev-bmkg.vedata.online/realms/bmkg-partner';

export type VerifyResult = {
  ok: boolean;
  reason?: string;
  claims?: Record<string, unknown>;
};

type Jwks = { keys: Record<string, CryptoKey>; exp: number };
const jwks: Jwks = { keys: {}, exp: 0 };

function b64ToBytes(input: string): Uint8Array<ArrayBuffer> {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64ToJson(part: string): Record<string, any> {
  return JSON.parse(new TextDecoder().decode(b64ToBytes(part)));
}

async function loadKeys(force = false): Promise<Record<string, CryptoKey>> {
  if (!force && Date.now() < jwks.exp && Object.keys(jwks.keys).length) return jwks.keys;
  const res = await fetch(`${REALM_URL}/protocol/openid-connect/certs`);
  if (!res.ok) throw new Error(`JWKS ${res.status}`);
  const body = (await res.json()) as { keys?: Array<{ kty: string; kid: string; n: string; e: string }> };
  const keys: Record<string, CryptoKey> = {};
  for (const k of body.keys ?? []) {
    if (k.kty !== 'RSA' || !k.kid) continue;
    keys[k.kid] = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: k.n, e: k.e },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  }
  Object.assign(jwks, { keys, exp: Date.now() + 10 * 60 * 1000 });
  return keys;
}

/** Verifikasi tanda tangan + klaim. Tidak pernah throw. */
export async function verifyJwt(token: string): Promise<VerifyResult> {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'bukan JWT (3 segmen)' };

  let header: Record<string, any>;
  let claims: Record<string, any>;
  try {
    header = b64ToJson(parts[0]);
    claims = b64ToJson(parts[1]);
  } catch {
    return { ok: false, reason: 'header/payload tidak terbaca' };
  }
  if (header.alg !== 'RS256') return { ok: false, reason: `alg ${header.alg} tidak didukung` };

  let keys: Record<string, CryptoKey>;
  try {
    keys = await loadKeys();
    // kid tak dikenal → mungkin key baru dirotasi, ambil ulang sekali
    if (!keys[header.kid]) keys = await loadKeys(true);
  } catch (e) {
    return { ok: false, reason: `JWKS gagal: ${String(e).slice(0, 80)}` };
  }

  const key = keys[header.kid];
  if (!key) return { ok: false, reason: 'kid tidak ada di JWKS' };

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let valid = false;
  try {
    valid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, b64ToBytes(parts[2]), signed);
  } catch (e) {
    return { ok: false, reason: `verifikasi gagal: ${String(e).slice(0, 80)}` };
  }
  if (!valid) return { ok: false, reason: 'tanda tangan tidak cocok' };

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === 'number' && claims.exp + 10 < now) {
    return { ok: false, reason: 'token kedaluwarsa', claims };
  }
  if (claims.iss && claims.iss !== REALM_URL) {
    return { ok: false, reason: 'issuer tidak cocok', claims };
  }
  return { ok: true, claims };
}

/** Ambil token dari `Authorization: Bearer …` */
export function bearer(req: Request): string {
  const h = req.headers.get('authorization') ?? '';
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
}

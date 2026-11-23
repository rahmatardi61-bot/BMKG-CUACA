// ═══════════════════════════════════════════════════════════════════════════
// TOKEN AKSES WIDGET — sisi klien
// ---------------------------------------------------------------------------
// Di POC ini, "backend partner" disimulasikan oleh server kita sendiri lewat
// /api/embed-token (yang memegang client_secret di .env). Di produksi, partner
// WAJIB mint token dari backend mereka sendiri — rahasia tidak boleh di browser.
//
// Token disimpan di memori (bukan localStorage) dan diperbarui otomatis
// sebelum kedaluwarsa.
// ═══════════════════════════════════════════════════════════════════════════

type State = { token: string; exp: number }; // exp = epoch ms

const state: State = { token: '', exp: 0 };
let inflight: Promise<string> | null = null;

export type JwtParts = { header: Record<string, any>; claims: Record<string, any> };

function b64Json(part: string): Record<string, any> {
  const s = part.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(s + '='.repeat((4 - (s.length % 4)) % 4)))));
}

/** Decode saja — BUKAN verifikasi. Tanda tangan hanya diperiksa server (JWKS). */
export function decodeJwt(token: string): JwtParts | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return { header: b64Json(parts[0]), claims: b64Json(parts[1]) };
  } catch {
    return null;
  }
}

/** Sisa umur token (detik) menurut klaim exp; 0 kalau tidak terbaca. */
export function secondsLeft(token: string): number {
  const claims = decodeJwt(token)?.claims;
  if (!claims || typeof claims.exp !== 'number') return 0;
  return Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
}

/** Pakai token yang diberikan partner (iframe) — jangan mint sendiri. */
export function adoptToken(token: string): void {
  const left = secondsLeft(token);
  Object.assign(state, { token, exp: Date.now() + Math.max(5, left - 5) * 1000 });
}

export function currentToken(): string {
  return Date.now() < state.exp ? state.token : '';
}

/** Ambil token (cache memori). force=true untuk mint ulang. */
export async function getToken(force = false): Promise<string> {
  if (!force && currentToken()) return state.token;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch('/api/embed-token', { headers: { Accept: 'application/json' } });
    const json = (await res.json().catch(() => ({}))) as { token?: string; expires_in?: number; detail?: string; error?: string };
    if (!res.ok || !json.token) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
    // buang 15 detik dari umur server supaya tidak kedaluwarsa di tengah request
    const ttl = Math.max(10, (json.expires_in ?? 240) - 15) * 1000;
    Object.assign(state, { token: json.token, exp: Date.now() + ttl });
    return state.token;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Hasil verifikasi server (JWKS) — satu-satunya penentu sah/tidaknya token. */
export async function verifyOnServer(token: string): Promise<{ valid: boolean; reason: string | null; expires_in: number; roles: string[] }> {
  try {
    const res = await fetch('/api/embed-verify', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    const json = (await res.json()) as { valid?: boolean; reason?: string | null; expires_in?: number; roles?: string[] };
    return { valid: !!json.valid, reason: json.reason ?? null, expires_in: json.expires_in ?? 0, roles: json.roles ?? [] };
  } catch (e) {
    return { valid: false, reason: String(e).slice(0, 120), expires_in: 0, roles: [] };
  }
}

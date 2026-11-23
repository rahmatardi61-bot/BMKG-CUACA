// ═══════════════════════════════════════════════════════════════════════════
// EMBED TOKEN — ambil access_token Keycloak untuk widget embed (POC)
// ---------------------------------------------------------------------------
// Bentuk panggilan: GET /api/embed-token
// Balasan: { token, expires_in, expires_at }
//
// Kenapa lewat server, bukan browser: grant client_credentials butuh
// client_secret. Kalau di-fetch dari browser, secret terbaca siapa pun.
// Di sini secret hanya ada di env server (Vercel / .env lokal).
//
// POC: token dipakai untuk membuktikan alur, bukan gerbang keamanan keras.
// Kalau ada penyalahgunaan → blok manual (rotasi client_secret / hapus izin).
// upgrade: kalau sudah produksi, ganti ke validasi JWT per-request + allowlist
// IP/domain per partner (lihat docs/widget-embed.md).
// ═══════════════════════════════════════════════════════════════════════════
export const config = { runtime: 'edge' };

const REALM_URL =
  process.env.KEYCLOAK_REALM_URL ??
  'https://auth-dev-bmkg.vedata.online/realms/bmkg-partner';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? 'partner-widget-service';
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? '';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

// cache per-instance edge: token umur 300s, simpan 240s supaya tak kedaluwarsa di tengah jalan
const state: { token: string; exp: number } = { token: '', exp: 0 };
let inflight: Promise<string> | null = null;

async function fetchToken(): Promise<string> {
  if (!CLIENT_SECRET) throw new Error('KEYCLOAK_CLIENT_SECRET belum di-set di env server');
  const res = await fetch(`${REALM_URL}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Keycloak ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('Keycloak tidak mengembalikan access_token');
  const ttl = Math.max(30, (json.expires_in ?? 300) - 60) * 1000;
  Object.assign(state, { token: json.access_token, exp: Date.now() + ttl });
  return state.token;
}

async function getToken(): Promise<string> {
  if (state.token && Date.now() < state.exp) return state.token;
  // satukan permintaan bersamaan supaya tidak menembak Keycloak berkali-kali
  if (!inflight) inflight = fetchToken().finally(() => { inflight = null; });
  return inflight;
}

// Endpoint ini adalah KERAN TOKEN, jadi ia sendiri harus dijaga: kalau siapa pun
// boleh memanggilnya, semua gerbang di atas jadi sia-sia.
// Aturan POC: hanya boleh dipanggil dari origin kita sendiri (browser partner akan
// ditolak karena mengirim Origin lain). Panggilan tanpa Origin (curl/server-ke-server)
// tetap lolos — pencabutan untuk itu masih manual (rotasi secret).
function sameOrigin(req: Request): boolean {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const src = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
  if (!src || src === 'null') return true; // bukan dari browser
  try {
    return new URL(src).host === host;
  } catch {
    return false;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...JSON_HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
    });
  }
  if (!sameOrigin(req)) {
    return new Response(
      JSON.stringify({ error: 'Tidak diotorisasi', reason: 'endpoint token hanya untuk origin sendiri' }),
      { status: 403, headers: JSON_HEADERS },
    );
  }
  try {
    const token = await getToken();
    return new Response(
      JSON.stringify({ token, expires_in: Math.round((state.exp - Date.now()) / 1000), expires_at: state.exp }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Gagal mendapatkan token', detail: String(e).slice(0, 300) }),
      { status: 502, headers: JSON_HEADERS }
    );
  }
}

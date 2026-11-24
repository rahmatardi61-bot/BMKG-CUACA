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
export const config = { runtime: 'nodejs' };

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

// Origin yang boleh meminta token lewat `?origin=` (browser lintas-origin).
// Hanya untuk halaman contoh: perkakas demo memanggil endpoint ini dari
// localhost:<port lain>. Tanpa ini sample embed di port berbeda kena 403.
// upgrade: produksi → hapus default & isi lewat env EMBED_ALLOWED_ORIGINS,
//          satu domain per partner (lihat docs/widget-embed.md).
const ALLOWED_ORIGINS = new Set(
  (process.env.EMBED_ALLOWED_ORIGINS ??
    'http://localhost:8099,http://127.0.0.1:8099,http://localhost:8098,http://127.0.0.1:8098')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

/**
 * true bila pemanggil boleh memakai keran token.
 * `?origin=` TIDAK dipakai sebagai izin — itu bisa dikarang siapa pun lewat curl.
 * Yang dipercaya hanya header Origin yang dikirim browser.
 */
function originAllowed(req: Request): boolean {
  if (sameOrigin(req)) return true;
  const from = (req.headers.get('origin') ?? req.headers.get('referer') ?? '').replace(/\/$/, '');
  if (!from || from === 'null') return true; // bukan dari browser (curl/server)
  return ALLOWED_ORIGINS.has(from) || ALLOWED_ORIGINS.has(new URL(from).origin);
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...JSON_HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
    });
  }
  if (!originAllowed(req)) {
    return new Response(
      JSON.stringify({
        error: 'Tidak diotorisasi',
        reason:
          'endpoint token hanya untuk origin sendiri atau origin di EMBED_ALLOWED_ORIGINS',
      }),
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

// Vercel: web handler (semua method masuk ke sini). Bentuk resmi di Node runtime.
export default { fetch: handle };

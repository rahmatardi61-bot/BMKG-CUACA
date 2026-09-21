// ═══════════════════════════════════════════════════════════════════════════
// AUTH — gate sementara (branch `api-box-marker`)
// ---------------------------------------------------------------------------
// Login page resmi untuk menahan akses publik selama fitur dev dipakai tim &
// partner. Kredensial masih DI-HARDCODE di sini.
//
// TITUKAR KE AUTH RESMI NANTI (titik integrasinya sudah disiapkan):
//   1. ganti isi `login()` → POST ke endpoint backend (kirim username/password,
//      terima token/sesi);
//   2. simpan token itu (bukan flag) di `persist()`;
//   3. `isAuthenticated()` → validasi kedaluwarsa token (sudah ada);
//   4. bila mau server-enforced, pasang kembali middleware Vercel yang cek
//      cookie/token (file `middleware.ts` pernah ada di commit 5c197cd).
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_KEY = 'bmkg.auth.session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // sesi 7 hari di browser ini

/** user → password (HARDCODE, sementara). Ganti saat auth resmi tersedia. */
const USERS: Record<string, string> = {
  bmkg: 'demo2026',
};

export type Session = { user: string; exp: number };
export type LoginResult = { ok: true; user: string } | { ok: false; error: string };

function read(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (typeof s.exp === 'number' && Date.now() < s.exp && s.user) return s;
    localStorage.removeItem(SESSION_KEY); // kedaluwarsa → buang
    return null;
  } catch {
    return null;
  }
}

function persist(user: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, exp: Date.now() + SESSION_TTL_MS } satisfies Session));
}

export function session(): Session | null {
  return read();
}

export function isAuthenticated(): boolean {
  return read() !== null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Validasi kredensial. Nanti: ganti body fungsi ini dengan panggilan API. */
export async function login(username: string, password: string): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 400)); // UX: jangan instan (anti brute-feel)
  const pass = USERS[username];
  if (!pass || pass !== password) {
    return { ok: false, error: 'Username atau password salah.' };
  }
  persist(username);
  return { ok: true, user: username };
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE SEMENTARA — branch `api-box-marker` (BUKAN untuk go-public)
// ---------------------------------------------------------------------------
// Tujuan: menahan akses publik ke deployment Vercel ini selama fitur dev
// (API BOX MARKER) dipakai bersama partner. Kredensial DI-HARDCODE sesuai
// keputusan — ganti di dua konstanta di bawah, atau hapus file ini saat
// go-public. Jangan pakai password asli di tempat lain.
//
// Cara kerja: HTTP Basic Auth di edge (popup login bawaan browser) SEBELUM
// CDN cache — melindungi halaman DAN route /api/bmkg/* sekaligus.
// Hanya berlaku di Vercel: `npm run dev` lokal & Docker (server.mjs) tidak
// terpengaruh karena file ini diabaikan di luar runtime Vercel.
// ═══════════════════════════════════════════════════════════════════════════

const USERNAME = 'bmkg';
const PASSWORD = 'demo2026';

function unauthorized(): Response {
  return new Response('Autentikasi diperlukan.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="API Box Marker (dev)", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export default function middleware(request: Request): Response {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme?.toLowerCase() === 'basic' && encoded) {
    try {
      const [user, pass] = atob(encoded).split(':');
      // lolos: fetch(request) meneruskan ke origin TANPA menjalankan
      // middleware lagi (pola resmi Vercel untuk framework non-Next)
      if (user === USERNAME && pass === PASSWORD) return fetch(request);
    } catch {
      /* header rusak → jatuh ke 401 */
    }
  }
  return unauthorized();
}

// Lindungi halaman & route tanpa ekstensi (/, /api/bmkg/*). Aset hashed
// (*.js/css/png/json) sengaja tidak dilindungi — percuma tanpa index.html,
// dan cache CDN aset tetap efisien.
export const config = { matcher: ['/((?!_vercel|.*\\..*).*)'] };

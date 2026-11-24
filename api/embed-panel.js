// ═══════════════════════════════════════════════════════════════════════════
// EMBED PANEL — loader + panel token dalam SATU file publik
// ---------------------------------------------------------------------------
// GET /api/embed-panel.js  (publik, tanpa token)
//
// Kenapa file terpisah dari /api/embed-js:
//   /api/embed-js adalah script INTI (dijaga token, di-eval partner).
//   File ini publik dan TIDAK berbahaya — isinya hanya: minta token ke
//   /api/embed-token, lalu muat script inti dengan token itu. Persis alur yang
//   dilakukan /widgets, tapi dibungkus supaya halaman contoh cukup 2 baris:
//
//     <div data-bmkg-widget="current"></div>
//     <script src="http://HOST:5173/api/embed-panel.js" data-origin="http://HOST:4477"></script>
//
// Halaman contoh berjalan di origin lain (port 8099). Server mengizinkannya lewat
// EMBED_ALLOWED_ORIGINS, dan yang diperiksa adalah header Origin dari browser —
// bukan parameter URL, supaya tidak bisa dikarang.
//
// Token TIDAK PERNAH ditulis ke HTML di sini — diambil saat runtime, di-cache
// di memori halaman (expires_at dari server), dan disegarkan sendiri selama tab
// terbuka. Page Visibility: saat tab kembali aktif, token yang tinggal <60 detik
// langsung diperbarui.
// ═══════════════════════════════════════════════════════════════════════════
export const config = { runtime: 'nodejs' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/javascript; charset=utf-8',
};

// Tag <script> yang sedang berjalan — sumber host server + data-origin.
const BOOT = `(function () {
  var s = document.currentScript;
  var ORIGIN = (s && s.getAttribute('data-origin')) || (s ? new URL(s.src).origin : location.origin);
  var BASE = s ? new URL(s.src).origin : location.origin;

  var state = { token: '', exp: 0, timer: null };
  var waiters = [];
  var subs = [];

  // Status disiarkan ke halaman. Vanilla cukup pakai #bmkg-token-panel; Vue/React
  // berlangganan lewat onStatus() karena elemennya baru ada setelah komponen mount.
  state.status = { ok: false, message: 'memuat…', left: 0, expiresAt: 0 };
  function emit(patch) {
    for (var k in patch) state.status[k] = patch[k];
    var box = document.getElementById('bmkg-token-panel');
    if (box) {
      box.style.color = state.status.ok ? '#0f766e' : '#e11d48';
      box.textContent = 'Token: ' + state.status.message;
    }
    for (var i = 0; i < subs.length; i++) subs[i](state.status);
  }

  function jwt(payload) {
    try {
      var part = payload.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch (e) { return {}; }
  }

  // Ambil token baru dari server widget (server yang pegang client_secret).
  function refresh(force) {
    if (!force && state.token && Date.now() < state.exp - 60000) return Promise.resolve(state.token);
    return fetch(BASE + '/api/embed-token', { credentials: 'omit' })
      .then(function (r) {
        // 403 = origin halaman ini tidak ada di EMBED_ALLOWED_ORIGINS server widget
        return r.json().catch(function () { return {}; }).then(function (j) {
          return { ok: r.ok, status: r.status, j: j || {} };
        });
      })
      .then(function (res) {
        if (!res.ok || !res.j.token) {
          var why = res.j.reason || res.j.error;
          if (res.status === 403) {
            why = 'origin ' + location.origin + ' tidak diizinkan server widget '
              + '(tambahkan ke EMBED_ALLOWED_ORIGINS)';
          }
          throw new Error(why || ('HTTP ' + res.status));
        }
        state.token = res.j.token;
        var c = jwt(state.token);
        // Acuan kedaluwarsa = klaim "exp" di dalam JWT, bukan expires_at server:
        // server memberi token dari cache, jadi expires_at bisa lebih panjang
        // daripada umur token yang sebenarnya. Kalau memakai yang optimistis,
        // refresh datang terlambat → widget sempat kena 401.
        var jwtExp = (c.exp || 0) * 1000;
        var serverExp = res.j.expires_at || Date.now() + ((res.j.expires_in || 300) * 1000);
        state.exp = jwtExp ? Math.min(jwtExp, serverExp + 5000) : serverExp;
        var left = Math.max(0, Math.round((c.exp * 1000 - Date.now()) / 1000));
        if (window.BmkgWidget) window.BmkgWidget.setToken(state.token, left);
        if (window.BMKGWidgets) window.BMKGWidgets.scan();
        emit({ ok: true, left: left, expiresAt: state.exp, message: 'aktif · berlaku ' + left + 's · diperbarui otomatis' });
        var fs = waiters; waiters = [];
        for (var i = 0; i < fs.length; i++) fs[i](state.token);
        schedule();
        return state.token;
      })
      .catch(function (e) {
        var msg = String((e && e.message) || e);
        emit({ ok: false, message: msg });
        console.warn('[bmkg-panel] ' + msg);
        var fs = waiters; waiters = [];
        for (var i = 0; i < fs.length; i++) fs[i]('');
        throw e;
      });
  }

  // Segarkan 60 detik sebelum kedaluwarsa (token Keycloak 300s → tiap ~4 menit).
  function schedule() {
    if (state.timer) clearTimeout(state.timer);
    var inMs = Math.max(15000, state.exp - Date.now() - 60000);
    state.timer = setTimeout(function () { refresh(true).catch(function () {}); }, inMs);
  }

  // Tab kembali aktif → jangan tunggu timer, kalau tipis langsung segarkan.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && state.exp - Date.now() < 60000) {
      refresh(true).catch(function () {});
    }
  });

  // API yang dipakai loader inti: tunggu token siap sebelum eval.
  window.BMKGPanel = {
    origin: ORIGIN,
    ready: function () {
      if (state.token && Date.now() < state.exp - 5000) return Promise.resolve(state.token);
      return new Promise(function (resolve, reject) {
        waiters.push(resolve);
        refresh(true).catch(reject);
      });
    },
    refresh: refresh,
    // berlangganan status token; cb dipanggil langsung dengan status terakhir
    onStatus: function (cb) {
      subs.push(cb);
      cb(state.status);
      return function () { subs = subs.filter(function (f) { return f !== cb; }); };
    },
    status: function () { return state.status; },
  };

  // Boot: ambil token pertama, lalu muat script inti (/api/embed-js) & eval.
  window.BMKGPanel.ready()
    .then(function (token) {
      return fetch(BASE + '/api/embed-js?token=' + encodeURIComponent(token), { credentials: 'omit' })
        .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error('script inti ditolak (HTTP ' + res.status + ')');
          window.BMKG_EMBED_TOKEN = token;
          (0, eval)(res.t);
        });
    })
    .catch(function (e) {
      var msg = String((e && e.message) || e);
      emit({ ok: false, message: msg });
      console.warn('[bmkg-panel] ' + msg);
    });
})();`;

async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  return new Response(BOOT, { status: 200, headers: CORS });
}

// Vercel: web handler (semua method masuk ke sini). Bentuk resmi di Node runtime.
export default { fetch: handle };

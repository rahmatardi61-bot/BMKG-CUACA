/*! BMKG widget — loader publik (tanpa rahasia apa pun).
 *
 * File ini sengaja publik & tidak berbahaya: isinya hanya "ambil script inti
 * lalu jalankan". Tanpa token Keycloak yang sah, server menolak (401) dan
 * tidak ada satu pun widget yang muncul.
 *
 * Pemakaian di sisi partner:
 *   <div data-bmkg-widget="current" data-city="Bandung"></div>
 *   <script src="https://DOMAIN/bmkg-embed.js"></script>
 *   <script>
 *     BmkgWidget.init({
 *       token: '<JWT dari backend partner>',   // wajib
 *       origin: 'https://DOMAIN'               // opsional, default: asal script ini
 *     });
 *   </script>
 *
 * Atau manual tanpa file ini (fetch + eval):
 *   window.BMKG_EMBED_TOKEN = token;
 *   fetch(origin + '/api/embed-js', { headers: { Authorization: 'Bearer ' + token } })
 *     .then(r => r.ok ? r.text() : Promise.reject('HTTP ' + r.status))
 *     .then(code => (0, eval)(code));
 */
(function () {
  var scriptSrc = document.currentScript ? document.currentScript.src : '';
  var DEFAULT_ORIGIN = scriptSrc.replace(/\/bmkg-embed\.js.*$/, '') || window.location.origin;

  function failAll(message) {
    var nodes = document.querySelectorAll('[data-bmkg-widget]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = '<div style="padding:14px 16px;border:1px dashed #f43f5e;border-radius:12px;'
        + 'background:rgba(244,63,94,.07);color:#e11d48;font:600 12px/1.5 system-ui,sans-serif">'
        + message + '</div>';
    }
  }

  function init(opts) {
    var o = opts || {};
    var token = String(o.token || '');
    var origin = String(o.origin || DEFAULT_ORIGIN).replace(/\/$/, '');

    if (!token) {
      failAll('Widget BMKG belum diotorisasi: token Keycloak tidak diberikan.');
      return Promise.resolve(false);
    }

    // Token disimpan di variabel global supaya script inti bisa membacanya
    window.BMKG_EMBED_TOKEN = token;

    return fetch(origin + '/api/embed-js', {
      headers: { Authorization: 'Bearer ' + token },
      // jangan kirim cookie ke server widget
      credentials: 'omit',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (code) {
        // eval manual: disengaja (permintaan partner). Catatan: CSP ketat
        // (tanpa 'unsafe-eval') akan memblokir ini — lihat docs/widget-embed.md
        (0, eval)(code);
        return true;
      })
      .catch(function (err) {
        var raw = String((err && err.message) || err);
        var msg;
        if (raw === 'HTTP 401' || raw === 'HTTP 403') {
          msg = 'Token ditolak server (' + raw + ') — periksa masa berlaku token Anda.';
        } else if (raw === 'Failed to fetch') {
          // Penyebab tersering: (a) halaman https memanggil localhost → Chrome
          // blokir "private network access"; (b) server mati; (c) CSP memblokir.
          msg = 'Gagal memuat widget: Failed to fetch. Penyebab tersering: halaman https '
            + 'memanggil server localhost (diblokir Chrome), server mati, atau CSP situs '
            + 'memblokir. Uji dulu dari halaman http:// atau domain publik.';
        } else {
          msg = 'Gagal memuat widget: ' + raw;
        }
        failAll(msg);
        return false;
      });
  }

  window.BmkgWidget = { init: init };
})();

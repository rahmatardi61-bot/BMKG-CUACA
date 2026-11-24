// ═══════════════════════════════════════════════════════════════════════════
// ISI SCRIPT EMBED — dikirim oleh /api/embed-js HANYA bila token sah.
// ---------------------------------------------------------------------------
// File ini tidak ada di `public/`, jadi tidak bisa diambil lewat URL statis.
// Satu-satunya jalan mendapatkannya: fetch('/api/embed-js') + header
// `Authorization: Bearer <jwt>`, lalu eval di sisi partner.
//
// Token untuk iframe dikirim lewat postMessage, BUKAN di URL — supaya tidak
// tertinggal di log akses/Referer. Handshake:
//   iframe → {type:'bmkg-embed-ready'}       (widget sudah siap menerima)
//   parent → {type:'bmkg-embed-token', token}
//
// Placeholder __BMKG_ORIGIN__ diganti origin server saat script dikirim,
// karena script hasil eval tidak punya document.currentScript.
// ═══════════════════════════════════════════════════════════════════════════

/** Isi script loader (string JS). */
export const EMBED_SOURCE = `(function () {
  var ORIGIN = '__BMKG_ORIGIN__';
  var TOKEN = String(window.BMKG_EMBED_TOKEN || '');

  function blocked(el, text) {
    el.innerHTML = '<div style="padding:14px 16px;border:1px dashed #f43f5e;border-radius:12px;'
      + 'background:rgba(244,63,94,.07);color:#e11d48;font:600 12px/1.5 system-ui,sans-serif">'
      + text + '</div>';
  }

  function mount(el) {
    var widget = el.getAttribute('data-bmkg-widget');
    if (!widget || el.dataset.bmkgMounted) return;
    el.dataset.bmkgMounted = '1';

    if (!TOKEN) {
      blocked(el, 'Widget BMKG belum diotorisasi: token Keycloak tidak ada. '
        + 'Set window.BMKG_EMBED_TOKEN sebelum memuat script ini.');
      return;
    }

    var qs = new URLSearchParams({ widget: widget });
    var city = el.getAttribute('data-city');
    if (city) qs.set('city', city);
    var theme = el.getAttribute('data-theme');
    if (theme) qs.set('theme', theme);

    var h = parseInt(el.getAttribute('data-height'), 10) || 420;

    var frame = document.createElement('iframe');
    frame.src = ORIGIN + '/embed.html?' + qs.toString();
    frame.title = 'BMKG ' + widget;
    frame.loading = 'lazy';
    frame.style.cssText = 'width:100%;height:' + h + 'px;border:0;border-radius:12px;display:block;overflow:hidden';
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('data-bmkg-frame', widget);
    el.appendChild(frame);

    // Auto-resize + serahkan token setelah widget siap
    window.addEventListener('message', function (ev) {
      if (ev.source !== frame.contentWindow) return;
      var d = ev.data || {};
      if (d.type === 'bmkg-embed-ready') {
        frame.contentWindow.postMessage({ type: 'bmkg-embed-token', token: TOKEN }, '*');
      }
      if (d.type === 'bmkg-widget-height' && d.height > 0 && !el.getAttribute('data-height')) {
        frame.style.height = Math.min(Math.max(d.height, 200), 1400) + 'px';
      }
    });
  }

  function scan() {
    var nodes = document.querySelectorAll('[data-bmkg-widget]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  // Token diperbarui induk (refresh): teruskan ke semua iframe yang sudah terpasang.
  // Widget memakai token baru untuk semua fetch berikutnya, tanpa reload halaman.
  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (d.type !== 'bmkg-embed-token' || typeof d.token !== 'string' || !d.token) return;
    TOKEN = d.token;
    var frames = document.querySelectorAll('iframe[data-bmkg-frame]');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow) frames[i].contentWindow.postMessage(d, '*');
    }
  });

  // Pindah lokasi: halaman pemasang (atau widget pencarian) mengirim
  // 'bmkg-widget-place' → teruskan ke SEMUA iframe supaya halaman ikut pindah.
  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (d.type !== 'bmkg-widget-place') return;
    // dari iframe pencarian: punya ev.source; dari halaman: tidak. Keduanya sah.
    var frames = document.querySelectorAll('iframe[data-bmkg-frame]');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow && frames[i].contentWindow !== ev.source) {
        frames[i].contentWindow.postMessage(d, '*');
      }
    }
    // simpan supaya iframe yang dipasang belakangan ikut memakai lokasi terakhir
    window.__bmkgPlace = { label: d.label, lat: d.lat, lon: d.lon };
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  window.BMKGWidgets = { scan: scan };
})();`;

/*! BMKG widget embed loader — LAMA, sudah tidak dipakai.
 *
 * Sejak fitur embed dijaga token Keycloak, /embed.js tidak lagi bisa memuat
 * widget: script inti sekarang hanya bisa diambil lewat
 *   GET /api/embed-js   dengan header  Authorization: Bearer <jwt>
 *
 * File ini sengaja ditinggal sebagai stub supaya snippet lama tidak mati
 * senyap — pemasang langsung diberi tahu apa yang harus diganti.
 *
 * Ganti dengan:
 *   <script src="https://DOMAIN/bmkg-embed.js"></script>
 *   <script>BmkgWidget.init({ token: '<JWT>' })</script>
 * Lihat /widgets untuk panduan lengkap.
 */
(function () {
  var msg = 'Script embed.js sudah tidak dipakai. Pakai bmkg-embed.js + '
    + 'BmkgWidget.init({ token }) — lihat /widgets.';

  function paint(el, text) {
    el.innerHTML = '<div style="padding:14px 16px;border:1px dashed #f59e0b;border-radius:12px;'
      + 'background:rgba(245,158,11,.08);color:#b45309;font:600 12px/1.5 system-ui,sans-serif">'
      + text + '</div>';
  }

  if (typeof console !== 'undefined') console.warn('[BMKG] ' + msg);
  var nodes = document.querySelectorAll('[data-bmkg-widget]');
  for (var i = 0; i < nodes.length; i++) paint(nodes[i], msg);
})();

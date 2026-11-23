/*! BMKG widget embed loader — tempel 1 script, widget muncul.
 * Pemakaian:
 *   <div data-bmkg-widget="satellite"></div>
 *   <div data-bmkg-widget="earthquake" data-city="Jakarta" data-height="480"></div>
 *   <script async src="https://DOMAIN/embed.js"></script>
 * Script ini hanya memasang <iframe> ke /embed.html — supaya CSS/JS situs host
 * tidak menabrak widget (Tailwind, Leaflet, z-index), dan sebaliknya.
 */
(function () {
  var ORIGIN = (document.currentScript && document.currentScript.src
    ? document.currentScript.src.replace(/\/embed\.js.*$/, '')
    : window.location.origin) || '';

  function mount(el) {
    var widget = el.getAttribute('data-bmkg-widget');
    if (!widget || el.dataset.bmkgMounted) return;
    el.dataset.bmkgMounted = '1';

    var qs = new URLSearchParams({ widget: widget });
    var city = el.getAttribute('data-city');
    if (city) qs.set('city', city);

    var h = parseInt(el.getAttribute('data-height'), 10) || 420;

    var frame = document.createElement('iframe');
    frame.src = ORIGIN + '/embed.html?' + qs.toString();
    frame.title = 'BMKG ' + widget;
    frame.loading = 'lazy';
    frame.style.cssText = 'width:100%;height:' + h + 'px;border:0;border-radius:12px;display:block;overflow:hidden';
    frame.setAttribute('scrolling', 'no');
    el.appendChild(frame);

    // Auto-resize: widget melaporkan tinggi aslinya lewat postMessage
    if (!el.getAttribute('data-height')) {
      window.addEventListener('message', function (ev) {
        if (ev.source !== frame.contentWindow) return;
        var d = ev.data || {};
        if (d.type === 'bmkg-widget-height' && d.height > 0) {
          frame.style.height = Math.min(Math.max(d.height, 200), 1400) + 'px';
        }
      });
    }
  }

  function scan() {
    var nodes = document.querySelectorAll('[data-bmkg-widget]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  window.BMKGWidgets = { scan: scan }; // untuk konten yang dimuat dinamis (SPA)
})();

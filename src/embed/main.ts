// Entry terpisah untuk widget embed (di-serve di /embed.html, dipakai via iframe).
// Tanpa auth, tanpa apiMarker, tanpa App.vue — supaya kecil & tidak menabrak host.
import { createApp } from 'vue';
import '../style.css';
import EmbedApp from './EmbedApp.vue';

createApp(EmbedApp).mount('#embed');

// Kirim tinggi ke parent supaya iframe bisa auto-resize (lihat public/embed.js)
const reportHeight = () => {
  const h = Math.ceil(document.body.scrollHeight || document.documentElement.scrollHeight);
  if (h && window.parent !== window) window.parent.postMessage({ type: 'bmkg-widget-height', height: h }, '*');
};
new ResizeObserver(reportHeight).observe(document.documentElement);
window.addEventListener('load', reportHeight);
reportHeight();

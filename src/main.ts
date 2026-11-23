import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import LoginPage from './pages/LoginPage.vue'
import WidgetsPage from './pages/WidgetsPage.vue'
import { isAuthenticated } from './services/auth'
import { apiMarkerDirective, initApiMarkerDevTools } from './dev/apiMarker'

// Route berbasis path (tanpa vue-router — cuma 2 halaman tambahan):
//   /widgets → dokumentasi embed (publik, ini materi presentasi ke klien)
//   /embed   → halaman widget (dipakai embed.js; TIDAK di-gate login,
//              kalau di-gate iframe di web klien akan tampil halaman login)
const path = window.location.pathname.replace(/\/+$/, '')
const isWidgetDocs = path === '/widgets'
const isEmbed = path === '/embed' || path === '/embed.html'

const app = createApp(isWidgetDocs ? WidgetsPage : isEmbed ? () => null : isAuthenticated() ? App : LoginPage)

// API BOX MARKER — alat dev (branch api-box-marker). No-op di build prod
// (guard import.meta.env.DEV ada di dalam modul). Tidak dipasang di /widgets:
// halaman itu materi presentasi publik — panel dev hanya jadi noise.
if (!isEmbed && !isWidgetDocs) {
  initApiMarkerDevTools()
  app.directive('api-marker', apiMarkerDirective)
}

// /embed dilayani embed.html (entry terpisah, lihat vite.config.ts) — jangan mount
if (!isEmbed) app.mount('#app')

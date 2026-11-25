import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import LoginPage from './pages/LoginPage.vue'
import WidgetsPage from './pages/WidgetsPage.vue'
import ComparePage from './pages/ComparePage.vue'
import ApiDocsPage from './pages/ApiDocsPage.vue'
import { isAuthenticated } from './services/auth'
import { apiMarkerDirective, initApiMarkerDevTools } from './dev/apiMarker'

// Route berbasis path (tanpa vue-router — cuma 2 halaman tambahan):
//   /widgets → dokumentasi embed (DI-GATE login yang sama dengan dashboard,
//              supaya materi presentasi tidak terbuka untuk publik)
//   /embed   → halaman widget (dipakai embed.js; TIDAK di-gate login,
//              kalau di-gate iframe di web klien akan tampil halaman login)
const path = window.location.pathname.replace(/\/+$/, '')
const isWidgetDocs = path === '/widgets'
const isCompare = path === '/compare'
const isApiDocs = path === '/api-docs'
const isEmbed = path === '/embed' || path === '/embed.html'

// Satu gerbang untuk semua halaman non-embed: belum login → LoginPage.
// LoginPage memakai location.reload() sehingga URL asal (/widgets) terbuka lagi.
const gate = () => (isAuthenticated() ? null : LoginPage)
const app = createApp(
  isEmbed
    ? () => null
    : isWidgetDocs ? (gate() ?? WidgetsPage)
    : isCompare ? (gate() ?? ComparePage)
    : isApiDocs ? (gate() ?? ApiDocsPage)
    : (gate() ?? App),
)

// API BOX MARKER — alat dev (branch api-box-marker). No-op di build prod
// (guard import.meta.env.DEV ada di dalam modul). Tidak dipasang di /widgets:
// halaman itu materi presentasi publik — panel dev hanya jadi noise.
if (!isEmbed && !isWidgetDocs && !isCompare && !isApiDocs) {
  initApiMarkerDevTools()
  app.directive('api-marker', apiMarkerDirective)
}

// /embed dilayani embed.html (entry terpisah, lihat vite.config.ts) — jangan mount
if (!isEmbed) app.mount('#app')

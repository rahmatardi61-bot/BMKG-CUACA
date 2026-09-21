import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import LoginPage from './pages/LoginPage.vue'
import { isAuthenticated } from './services/auth'
import { apiMarkerDirective, initApiMarkerDevTools } from './dev/apiMarker'

// Gate sementara: tanpa sesi → root = halaman login. Setelah login sukses,
// LoginPage me-reload halaman dan root menjadi aplikasi (URL & query tetap).
const app = createApp(isAuthenticated() ? App : LoginPage)

// API BOX MARKER — alat dev (branch api-box-marker). No-op di build prod
// (guard import.meta.env.DEV ada di dalam modul).
initApiMarkerDevTools()
app.directive('api-marker', apiMarkerDirective)

app.mount('#app')
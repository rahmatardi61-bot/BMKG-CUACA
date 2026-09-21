import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { apiMarkerDirective, initApiMarkerDevTools } from './dev/apiMarker'

const app = createApp(App)

// API BOX MARKER — alat dev (branch api-box-marker). Keduanya no-op di build prod
// (guard import.meta.env.DEV ada di dalam modul) — tidak ada border/chip/patch fetch.
initApiMarkerDevTools()
app.directive('api-marker', apiMarkerDirective)

app.mount('#app')
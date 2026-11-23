<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// EMBED APP — host widget untuk iframe (widget BMKG di web pihak lain)
// ---------------------------------------------------------------------------
// Semua opsi STATIS (keputusan: tidak ada kustom warna/UI, tidak ada kota bebas):
//   ?widget=satellite                → peta satelit Himawari-9 (mandiri, nol props)
//   ?widget=earthquake&city=Jakarta  → gempa live TEWS (kota = penentu "terdekat")
//   ?widget=coming                   → placeholder resmi utk kartu yang belum siap
// Kota dibatasi daftar tertutup + fallback Jakarta: kota tak dikenal diabaikan
// (jangan pernah tampil kosong/rusak di web orang lain).
// ═══════════════════════════════════════════════════════════════════════════
import { defineAsyncComponent, ref, onMounted } from 'vue';
import { useBmkgWeather, CITY_COORDS } from '../composables/useBmkgWeather';
import type { WarningAlert, NewsArticle } from '../types/weather';
import { MapPin, Construction, ExternalLink } from 'lucide-vue-next';

const SatelliteMap = defineAsyncComponent(() => import('../components/SatelliteMap.vue'));
const EarthquakeHistory = defineAsyncComponent(() => import('../components/EarthquakeHistory.vue'));
const AlertsPanel = defineAsyncComponent(() => import('../components/AlertsPanel.vue'));
const NewsSection = defineAsyncComponent(() => import('../components/NewsSection.vue'));

const params = new URLSearchParams(window.location.search);
const widget = params.get('widget') || 'coming';

// Tema widget — komponen punya varian dark:, jadi cukup class 'dark' di <html>.
// 'auto' = ikut preferensi sistem; default dark (gaya visual BMKG).
const themeParam = (params.get('theme') || 'dark').toLowerCase();
const wantsDark = themeParam === 'auto'
  ? !window.matchMedia('(prefers-color-scheme: light)').matches
  : themeParam !== 'light';
document.documentElement.classList.toggle('dark', wantsDark);
document.body.style.background = wantsDark ? '#070c19' : '#eef5ff';

// Hanya kota yang koordinatnya tersedia (CITY_COORDS) — kunci resminya 'DKI Jakarta'
const CITIES = Object.keys(CITY_COORDS).filter(c => !c.startsWith('Tamanan'));
const ALIAS: Record<string, string> = { jakarta: 'DKI Jakarta', 'dki jakarta': 'DKI Jakarta' };
const requestedCity = (params.get('city') || 'DKI Jakarta').trim();
const city = ALIAS[requestedCity.toLowerCase()]
  ?? CITIES.find(c => c.toLowerCase() === requestedCity.toLowerCase())
  ?? 'DKI Jakarta';

// Kartu yang sudah siap di-embed
const READY = ['satellite', 'earthquake', 'alerts', 'news'];
const isReady = READY.includes(widget);
const needCity = ['earthquake', 'alerts'].includes(widget);

// Widget berbasis data (alerts/news) menyiapkan datanya sendiri — komponennya
// murni presentasional (props), pola sama seperti dashboard.
const bmkg = useBmkgWeather();
const alerts = ref<WarningAlert[]>([]);
const articles = ref<NewsArticle[]>([]);

async function loadData() {
  if (widget === 'news') {
    await bmkg.loadNews();
    articles.value = bmkg.liveNews.value;
  } else if (widget === 'alerts') {
    await bmkg.loadCity(city, CITY_COORDS[city]);
    alerts.value = bmkg.liveAlerts.value;
  }
}
onMounted(loadData); // city statis per page-load — tidak perlu watch
</script>

<template>
  <div class="min-h-full bg-[#eef5ff] dark:bg-[#070c19] text-slate-900 dark:text-white">
    <!-- Widget siap -->
    <template v-if="isReady">
      <div v-if="needCity" class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800/60">
        <MapPin class="w-3 h-3 text-brand-cyan" />
        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">{{ city }}</span>
        <span class="ml-auto text-[9px] font-bold tracking-wider text-slate-500">BMKG</span>
      </div>
      <SatelliteMap v-if="widget === 'satellite'" />
      <AlertsPanel v-else-if="widget === 'alerts'" :alerts="alerts" />
      <NewsSection v-else-if="widget === 'news'" :articles="articles" />
      <EarthquakeHistory v-else-if="widget === 'earthquake'" :selected-city="city" />
    </template>

    <!-- Placeholder: kartu belum siap di-embed -->
    <div v-else class="p-5 flex flex-col items-center text-center gap-2">
      <Construction class="w-6 h-6 text-amber-400" />
      <p class="text-[11px] font-black text-slate-900 dark:text-white">Widget belum tersedia</p>
      <p class="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[240px]">
        Widget <code class="text-brand-cyan">{{ widget }}</code> belum siap untuk di-embed.
        Lihat daftar widget yang tersedia di halaman dokumentasi.
      </p>
      <a
        :href="'/' + 'widgets'"
        target="_blank"
        class="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-brand-cyan hover:underline"
      >
        Dokumentasi widget <ExternalLink class="w-2.5 h-2.5" />
      </a>
    </div>
  </div>
</template>

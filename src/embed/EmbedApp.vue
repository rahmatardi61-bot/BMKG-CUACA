<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// EMBED APP — host widget untuk iframe (widget BMKG di web pihak lain)
// ---------------------------------------------------------------------------
// Semua opsi STATIS (keputusan: tidak ada kustom warna/UI, tidak ada kota bebas):
//   ?widget=satellite                → peta satelit Himawari-9 (mandiri, nol props)
//   ?widget=earthquake&city=Jakarta  → gempa live TEWS (kota = penentu "terdekat")
//   ?widget=current&city=Bandung     → kartu cuaca saat ini (suhu, angin, kelembapan)
//   ?widget=forecast|alerts|air-quality|transport|port-tide  → data per kota
//   ?widget=wave|marine              → peta maritim (Leaflet, live BMKG)
//   ?widget=major-cities             → 10 kota besar (statis, tanpa fetch)
//   ?widget=activity                 → aktivitas & rekomendasi per kota
//   ?widget=current-detail           → rincian kondisi (angin, lembap, visibilitas)
//   ?widget=app-download             → kartu ajakan unduh aplikasi (statis)
//   ?widget=radar                    → peta lapisan radar/satelit/angin (MOCK sintetis)
//   ?widget=maritime-advisor&sector=shipping   → saran maritim (default: shipping)
//   ?widget=aviation-advisor&sector=commercial → saran penerbangan (default: commercial)
//   ?widget=land-activity&dest=…     → aktivitas darat (default: destinasi contoh)
//   ?widget=around                   → detail aktivitas sekitar (contoh: taman kota)
//   ?widget=report                   → form laporan cuaca pengunjung
// Kartu yang butuh pilihan pengunjung (sector, destinasi) memakai DEFAULT di atas:
// partner belum bisa mengoper pilihannya, jadi ditampilkan versi paling wajar.
//   ?widget=coming                   → placeholder resmi utk kartu yang belum siap
// Kota dibatasi daftar tertutup + fallback Jakarta: kota tak dikenal diabaikan
// (jangan pernah tampil kosong/rusak di web orang lain).
// ═══════════════════════════════════════════════════════════════════════════
import { defineAsyncComponent, computed, ref, onMounted } from 'vue';
import { useBmkgWeather, CITY_COORDS } from '../composables/useBmkgWeather';
import { adoptToken } from '../services/embedToken';
import type { WarningAlert, NewsArticle, HourlyForecast } from '../types/weather';
import { newsArticles, transportStatusesMap } from '../data/mockData';
import type { WeatherData } from '../types/weather';
import { MapPin, Construction, ExternalLink, ShieldCheck, FlaskConical, ShieldAlert, Sun, Cloud, CloudRain, CloudSun, Wind } from 'lucide-vue-next';
import { buildCityAnalysis } from '../services/analysisNarrative';
import { cityLandmarks } from '../data/cityLandmarks';
import { getAdditionalWeatherData } from '../data/weatherHelpers';

const SatelliteMap = defineAsyncComponent(() => import('../components/SatelliteMap.vue'));
const EarthquakeHistory = defineAsyncComponent(() => import('../components/EarthquakeHistory.vue'));
const AlertsPanel = defineAsyncComponent(() => import('../components/AlertsPanel.vue'));
const NewsSection = defineAsyncComponent(() => import('../components/NewsSection.vue'));
const ForecastPanel = defineAsyncComponent(() => import('../components/ForecastPanel.vue'));
const HeroWeatherCard = defineAsyncComponent(() => import('../components/HeroWeatherCard.vue'));
const PortTideCard = defineAsyncComponent(() => import('../components/PortTideCard.vue'));
const AirQualityCard = defineAsyncComponent(() => import('../components/AirQualityCard.vue'));
const TransportWeather = defineAsyncComponent(() => import('../components/TransportWeather.vue'));
const MajorCitiesCarousel = defineAsyncComponent(() => import('../components/MajorCitiesCarousel.vue'));
// Leaflet dimuat hanya bila widget peta dipilih (jangan bebankan widget teks)
const WaveRadarMap = defineAsyncComponent(() => import('../components/WaveRadarMap.vue'));
const MarineMap = defineAsyncComponent(() => import('../components/MarineMap.vue'));
const EmbedSearch = defineAsyncComponent(() => import('./EmbedSearch.vue'));
const WeatherActivity = defineAsyncComponent(() => import('../components/WeatherActivity.vue'));
const CurrentWeather = defineAsyncComponent(() => import('../components/CurrentWeather.vue'));
const AppDownloadCTA = defineAsyncComponent(() => import('../components/AppDownloadCTA.vue'));
const WeatherRadarMap = defineAsyncComponent(() => import('../components/WeatherRadarMap.vue'));
const MaritimeAdvisorDrawer = defineAsyncComponent(() => import('../components/MaritimeAdvisorDrawer.vue'));
const AviationAdvisorDrawer = defineAsyncComponent(() => import('../components/AviationAdvisorDrawer.vue'));
const LandBasedActivities = defineAsyncComponent(() => import('../components/LandBasedActivities.vue'));
const AroundActivityDrawer = defineAsyncComponent(() => import('../components/AroundActivityDrawer.vue'));
const EmbedWeatherReport = defineAsyncComponent(() => import('./EmbedWeatherReport.vue'));

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

// ── LOKASI ────────────────────────────────────────────────────────────────
// Widget menerima dua bentuk lokasi:
//   ?city=Bandung            → nama dari daftar kota (paling umum, pendek)
//   ?lat=-6.9&lon=107.6&label=Bandung  → titik arbitrer (hasil /api/widget-search)
// Kota/koordinat dibuat reaktif karena halaman pemasang bisa memindahkan widget
// saat pengunjung memilih lokasi lain (pesan `bmkg-widget-place`).
const CITIES = Object.keys(CITY_COORDS).filter(c => !c.startsWith('Tamanan'));
const ALIAS: Record<string, string> = { jakarta: 'DKI Jakarta', 'dki jakarta': 'DKI Jakarta' };

function resolvePlace(search: URLSearchParams): { label: string; coords?: { lat: number; lon: number } } {
  const label = (search.get('label') || '').trim();
  const lat = Number(search.get('lat'));
  const lon = Number(search.get('lon'));
  if (Number.isFinite(lat) && Number.isFinite(lon) && search.get('lat') !== null && search.get('lon') !== null) {
    return { label: label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`, coords: { lat, lon } };
  }
  const asked = (search.get('city') || 'DKI Jakarta').trim();
  const name = ALIAS[asked.toLowerCase()]
    ?? CITIES.find(c => c.toLowerCase() === asked.toLowerCase())
    ?? 'DKI Jakarta';
  return { label: name, coords: undefined };
}

const initialPlace = resolvePlace(params);
const city = ref(initialPlace.label);
const placeCoords = ref<{ lat: number; lon: number } | undefined>(initialPlace.coords);

// Kartu yang sudah siap di-embed
const READY = [
  'satellite', 'earthquake', 'alerts', 'news', 'forecast',
  'current', 'port-tide', 'air-quality', 'transport', 'major-cities',
  'wave', 'marine', 'search',
  'activity', 'current-detail', 'app-download', 'radar',
  'maritime-advisor', 'aviation-advisor', 'land-activity', 'around', 'report',
];
const isReady = READY.includes(widget);
// Widget yang butuh kota: semua yang menampilkan nama/titik wilayah
const CITY_WIDGETS = [
  'earthquake', 'alerts', 'forecast', 'current', 'port-tide',
  'air-quality', 'transport', 'wave', 'marine',
  'activity', 'current-detail', 'radar',
  'maritime-advisor', 'aviation-advisor', 'land-activity', 'around', 'report',
];
const needCity = CITY_WIDGETS.includes(widget);
// Widget yang datanya bergantung pada loadCity (satu fetch dipakai bersama)
const FETCH_WIDGETS = [
  'alerts', 'forecast', 'current', 'port-tide', 'air-quality', 'transport',
  'activity', 'current-detail',
];

// Widget berbasis data (alerts/news) menyiapkan datanya sendiri — komponennya
// murni presentasional (props), pola sama seperti dashboard.
const bmkg = useBmkgWeather();
const alerts = ref<WarningAlert[]>([]);
const articles = ref<NewsArticle[]>([]);
const forecasts = ref<HourlyForecast[]>([]);
const weather = ref<WeatherData | null>(null);
const loading = ref(false);
// true bila widget menampilkan data MOCK/fallback — ditandai di UI (bukan disembunyikan)
const isMock = ref(widget === 'radar'); // peta layer memakai field sintetis

// Alasan MOCK berbeda per widget — jangan menyalahkan "layanan mati" untuk data
// yang memang tidak pernah ada (ISPU, status transportasi, medan sintetis).
const MOCK_NOTE: Record<string, string> = {
  radar: 'Data contoh (MOCK) — medan angin & suhu dihitung sintetis, bukan radar BMKG',
  'air-quality': 'Data contoh (MOCK) — BMKG tidak menyediakan API ISPU',
  transport: 'Data contoh (MOCK) — status transportasi tidak tersedia resmi',
  news: 'Data contoh (MOCK) — berita BMKG sedang tidak dapat dimuat',
};
const mockNote = computed(() => MOCK_NOTE[widget] ?? 'Data contoh (MOCK)');

// ── Token Keycloak (POC) ───────────────────────────────────────────────────
// ── TOKEN ─────────────────────────────────────────────────────────────────
// Widget TIDAK lagi memintakan token untuk dirinya sendiri. Token harus datang
// dari partner: dikirim lewat postMessage oleh script embed (jalur normal),
// atau lewat ?token= (shortcut/demo — terlihat di URL, lihat docs).
// Setelah dapat, token diverifikasi ke server (JWKS). Server tetap gerbang
// sebenarnya: tanpa token sah, data BMKG tidak bisa diambil.
const authState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const authMessage = ref('');
const urlToken = params.get('token') || '';
const authSource = ref<'' | 'parent' | 'url'>('');
const authExpiresIn = ref(0);
const debugAuth = params.get('debug') === '1';
let receivedToken = '';

// Buang token dari URL secepat mungkin supaya tidak tertinggal di riwayat/Referer
if (urlToken) {
  const clean = new URL(window.location.href);
  clean.searchParams.delete('token');
  history.replaceState(null, '', clean.toString());
}

function waitForParentToken(timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('token tidak diterima dari halaman pemasang'));
    }, timeoutMs);
    function onMessage(ev: MessageEvent) {
      const d = ev.data as { type?: string; token?: string } | null;
      if (!d || d.type !== 'bmkg-embed-token' || typeof d.token !== 'string' || !d.token) return;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(d.token);
    }
    window.addEventListener('message', onMessage);
    // beri tahu parent bahwa widget siap menerima token
    try {
      window.parent.postMessage({ type: 'bmkg-embed-ready' }, '*');
    } catch {
      /* di luar iframe: tidak ada parent */
    }
  });
}

async function ensureToken(): Promise<boolean> {
  authState.value = 'loading';
  try {
    if (urlToken) {
      receivedToken = urlToken;
      authSource.value = 'url';
    } else {
      receivedToken = await waitForParentToken();
      authSource.value = 'parent';
    }
    // Verifikasi ke server — decode di browser saja tidak cukup
    const res = await fetch('/api/embed-verify', {
      headers: { Authorization: `Bearer ${receivedToken}`, Accept: 'application/json' },
    });
    const json = (await res.json().catch(() => ({}))) as { valid?: boolean; reason?: string; expires_in?: number };
    if (!res.ok || !json.valid) throw new Error(json.reason || `token ditolak (HTTP ${res.status})`);
    authExpiresIn.value = json.expires_in ?? 0;
    // semua fetch data di dalam widget memakai token ini (tidak mint sendiri)
    adoptToken(receivedToken);
    authState.value = 'ready';
    console.log(`[bmkg-widget] auth OK (sumber=${authSource.value}, berlaku=${authExpiresIn.value}s)`);
    return true;
  } catch (e) {
    authState.value = 'error';
    authMessage.value = String(e instanceof Error ? e.message : e).slice(0, 140);
    console.warn('[bmkg-widget] auth GAGAL:', authMessage.value);
    return false;
  }
}

async function loadData() {
  if (!(await ensureToken())) return; // gagal token → tampilkan layar error, bukan data
  loading.value = true;
  try {
    if (widget === 'news') {
      await bmkg.loadNews();
      // WP BMKG sering 502 → pakai artikel mock seperti dashboard (App.vue activeArticles)
      isMock.value = !bmkg.liveNews.value.length;
      articles.value = isMock.value ? newsArticles.slice(0, 4) : bmkg.liveNews.value;
    } else if (FETCH_WIDGETS.includes(widget)) {
      // coords dari ?lat/?lon bila ada; kalau tidak, loadCity memakai CITY_COORDS
      await bmkg.loadCity(city.value, placeCoords.value);
      if (widget === 'alerts') {
        alerts.value = bmkg.liveAlerts.value;
      } else if (widget === 'forecast') {
        forecasts.value = bmkg.liveHourly.value.slice(0, 12);
        isMock.value = false; // prakiraan kosong → pesan jujur, bukan angka karangan
      } else if (widget === 'current' || widget === 'current-detail' || widget === 'activity') {
        weather.value = bmkg.liveWeather.value;
      } else if (widget === 'port-tide') {
        // loadCity memicu loadPort fire & forget — di sini ditunggu agar tidak kosong
        const c = placeCoords.value ?? CITY_COORDS[city.value];
        await bmkg.loadPort(c.lat, c.lon);
      } else if (widget === 'air-quality') {
        weather.value = bmkg.liveWeather.value;
        // kartu ISPU menghitung nilai deterministik per kota (bukan data resmi) → selalu MOCK
        isMock.value = true;
      } else if (widget === 'transport') {
        weather.value = bmkg.liveWeather.value;
        isMock.value = true; // status transportasi BMKG tidak tersedia via API publik
      }
    }
  } finally {
    loading.value = false;
  }
}
// ── PILIHAN DEFAULT UNTUK KARTU INTERAKTIF ────────────────────────────────
// Di dashboard, kartu ini dibuka dari klik (pilih sektor, pilih destinasi).
// Di embed belum ada jalur untuk mengoper pilihan itu, jadi dipakai default
// paling wajar. Nanti bisa ditambah `?sector=` / `?dest=` tanpa ubah kontrak.
const SECTOR_MARITIM = params.get('sector') || 'shipping';
const SECTOR_AVIASI = params.get('sector') || 'commercial';

// Destinasi contoh untuk aktivitas darat: titik dekat kota terpilih (±4 km),
// supaya rutenya masuk akal. Partner belum bisa mengoper destinasi sendiri;
// `?destLat=&destLng=` disediakan kalau nanti dibutuhkan.
const DEST_OVERRIDE = {
  lat: Number(params.get('destLat')),
  lng: Number(params.get('destLng')),
};

// Satu aktivitas sekitar contoh (taman kota) — AroundActivityDrawer butuh objek
// lengkap: koordinat, indeks kenyamanan, dan prakiraan 4 jam.
const AROUND_ACTIVITY = {
  id: 1,
  name: 'Taman Kota',
  distance: '1,2 km',
  location: 'Pusat kota',
  lat: 0,
  lng: 0,
  comfortEmoji: '🙂',
  comfortIndex: 'Nyaman',
  rainWarning: 'Risiko hujan rendah.',
  uvWarning: 'UV sedang, gunakan tabir surya.',
  colorKey: 'emerald',
  category: 'park',
  tags: ['keluarga', 'jalan kaki'],
  hourly: [
    { time: 'Sekarang', isCurrent: true, temp: 29, windSpeed: 8, windDirIcon: Wind, rain: 0.1, icon: CloudSun },
    { time: '+1 j', temp: 30, windSpeed: 10, windDirIcon: Wind, rain: 0.2, icon: Sun },
    { time: '+2 j', temp: 29, windSpeed: 9, windDirIcon: Wind, rain: 0.3, icon: Cloud },
    { time: '+3 j', temp: 27, windSpeed: 12, windDirIcon: Wind, rain: 0.6, icon: CloudRain },
  ],
};

// ── TURUNAN UNTUK KARTU YANG BUTUH ANALISIS ───────────────────────────────
// MainDashboard menghitung ini di halamannya. Di embed dihitung di sini supaya
// komponen tetap presentasional (props masuk, tidak fetch sendiri).
const activityAdditional = computed(() =>
  bmkg.liveAdditional.value ?? getAdditionalWeatherData(city.value),
);
const activityAnalysis = computed(() =>
  buildCityAnalysis(weather.value as WeatherData, city.value, bmkg.liveHourly.value, activityAdditional.value),
);
const activityLandmark = computed(() => {
  const match = cityLandmarks.find(
    l => l.fullName === city.value || l.name === city.value.split(',')[0].trim(),
  );
  return match?.svg ?? '';
});
const activityShortName = computed(() => city.value.split(',')[0].trim());
const landDestination = computed(() => {
  const c = placeCoords.value ?? CITY_COORDS[city.value] ?? CITY_COORDS['DKI Jakarta'];
  const lat = Number.isFinite(DEST_OVERRIDE.lat) && DEST_OVERRIDE.lat !== 0 ? DEST_OVERRIDE.lat : c.lat + 0.03;
  const lng = Number.isFinite(DEST_OVERRIDE.lng) && DEST_OVERRIDE.lng !== 0 ? DEST_OVERRIDE.lng : c.lon + 0.03;
  return { name: 'Taman Kota', lat, lng, location: city.value };
});

const aroundActivity = computed(() => {
  const c = placeCoords.value ?? CITY_COORDS[city.value] ?? CITY_COORDS['DKI Jakarta'];
  return { ...AROUND_ACTIVITY, location: city.value, lat: c.lat + 0.01, lng: c.lon + 0.01 };
});

onMounted(loadData); // city statis per page-load — tidak perlu watch

// ── REFRESH TOKEN (induk memperbarui) ─────────────────────────────────────
// Halaman pemasang menyegarkan token sebelum kedaluwarsa lalu mengirim
// `{type:'bmkg-embed-token'}` lagi. Widget memakai token baru untuk semua fetch
// berikutnya — tanpa reload, tanpa kehilangan tampilan yang sudah ada.
// Halaman pemasang memindahkan widget: {type:'bmkg-widget-place', label, lat, lon}
window.addEventListener('message', (ev: MessageEvent) => {
  const d = ev.data as { type?: string; label?: string; lat?: number; lon?: number } | null;
  if (!d || d.type !== 'bmkg-widget-place') return;
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  city.value = d.label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  placeCoords.value = { lat, lon };
  if (needCity && authState.value === 'ready') void loadData(); // muat ulang data lokasi baru
});

window.addEventListener('message', (ev: MessageEvent) => {
  const d = ev.data as { type?: string; token?: string } | null;
  if (!d || d.type !== 'bmkg-embed-token' || typeof d.token !== 'string' || !d.token) return;
  if (d.token === receivedToken) return; // sama → abaikan
  receivedToken = d.token;
  adoptToken(d.token);
  console.log('[bmkg-widget] token diperbarui induk');
  // Hanya widget yang sedang error yang perlu memuat ulang; yang sudah tampil
  // cukup memakai token baru untuk fetch berikutnya (tidak berkedip).
  if (authState.value === 'error') loadData();
});
</script>

<template>
  <div class="min-h-full bg-[#eef5ff] dark:bg-[#070c19] text-slate-900 dark:text-white">
    <!-- Menunggu token (Keycloak) — animasi, bukan layar kosong -->
    <div
      v-if="isReady && authState === 'loading'"
      class="flex flex-col items-center justify-center gap-3 py-16"
    >
      <div class="relative w-9 h-9">
        <div class="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-slate-700"></div>
        <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-cyan animate-spin"></div>
      </div>
      <p class="text-[11px] font-bold text-slate-500">Menyiapkan widget…</p>
      <p class="text-[10px] text-slate-400">Menghubungkan ke layanan BMKG</p>
    </div>

    <!-- Token gagal → jelaskan, jangan tampil kosong -->
    <div
      v-else-if="isReady && authState === 'error'"
      class="p-6 flex flex-col items-center text-center gap-2"
    >
      <ShieldAlert class="w-6 h-6 text-rose-500" />
      <p class="text-[12px] font-bold text-slate-800 dark:text-slate-200">Tidak diotorisasi</p>
      <p class="text-[10.5px] text-slate-500 leading-relaxed max-w-[260px]">
        Widget ini butuh token Keycloak yang sah. Muat lewat
        <code class="font-mono">bmkg-embed.js</code> → <code class="font-mono">BmkgWidget.init({ token })</code>,
        atau hubungi penyedia layanan BMKG.
      </p>
      <code class="text-[9px] text-slate-400 break-all max-w-[260px]">{{ authMessage }}</code>
    </div>

    <!-- Widget siap -->
    <template v-else-if="isReady">
      <!-- Indikator auth (?debug=1) — untuk memastikan token benar-benar didapat -->
      <div
        v-if="debugAuth"
        :class="['flex items-center gap-1.5 px-3 py-1 font-mono text-[9.5px] border-b',
          authState === 'ready' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
          : authState === 'error' ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
          : 'bg-slate-500/10 border-slate-500/25 text-slate-500']"
      >
        <span>auth:</span>
        <span class="font-black">
          {{ authState === 'ready' ? 'OK' : authState === 'error' ? 'GAGAL' : authState.toUpperCase() }}
        </span>
        <span v-if="authSource">· sumber={{ authSource }}</span>
        <span v-if="authState === 'ready'">· berlaku={{ authExpiresIn }}s</span>
        <span v-if="authState === 'error'" class="truncate">· {{ authMessage }}</span>
      </div>
      <div
        v-if="needCity"
        class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800/60"
      >
        <MapPin class="w-3 h-3 text-brand-cyan" />
        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">{{ city }}</span>
        <span class="ml-auto text-[9px] font-bold tracking-wider text-slate-500">BMKG</span>
      </div>
      <!-- Badge MOCK: widget yang bisa jatuh ke data statis wajib jujur soal sumbernya -->
      <div
        v-if="isMock"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/25 text-amber-600 dark:text-amber-400"
      >
        <FlaskConical class="w-3 h-3 shrink-0" />
        <span class="text-[9.5px] font-bold leading-snug">{{ mockNote }}</span>
      </div>
      <EmbedSearch v-if="widget === 'search'" />
    <SatelliteMap v-else-if="widget === 'satellite'" />
      <!-- alerts: sering kosong bila tak ada peringatan aktif → tampilkan status, bukan blank -->
      <template v-else-if="widget === 'alerts'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat peringatan…</div>
        <div v-else-if="!alerts.length" class="p-6 flex flex-col items-center text-center gap-1.5">
          <ShieldCheck class="w-6 h-6 text-emerald-500" />
          <p class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Tidak ada peringatan dini aktif</p>
          <p class="text-[11px] text-slate-500 leading-relaxed max-w-[260px]">
            Wilayah {{ city }} saat ini tanpa peringatan cuaca ekstrem dari BMKG.
          </p>
        </div>
        <AlertsPanel v-else :alerts="alerts" />
      </template>
      <template v-else-if="widget === 'news'">
        <div v-if="loading || !articles.length" class="p-6 text-center text-[12px] text-slate-500">Memuat berita…</div>
        <NewsSection v-else :articles="articles" />
      </template>
      <template v-else-if="widget === 'forecast'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat prakiraan…</div>
        <div v-else-if="!forecasts.length" class="p-6 flex flex-col items-center text-center gap-1.5">
          <ShieldCheck class="w-6 h-6 text-slate-400" />
          <p class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Prakiraan tidak tersedia</p>
          <p class="text-[11px] text-slate-500 leading-relaxed max-w-[260px]">
            Data prakiraan untuk {{ city }} belum dapat dimuat. Silakan coba lagi nanti.
          </p>
        </div>
        <ForecastPanel v-else :forecasts="forecasts" />
      </template>
      <EarthquakeHistory v-else-if="widget === 'earthquake'" :selected-city="city" />

      <!-- Cuaca saat ini: kartu hero dashboard, tanpa dropdown kota (1 kota per widget) -->
      <template v-else-if="widget === 'current'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat cuaca…</div>
        <HeroWeatherCard
          v-else-if="weather"
          :weather-data="weather"
          :cities="[city]"
          :selected-city="city"
          :additional-info="bmkg.liveAdditional.value ?? undefined"
          :forecasts="bmkg.liveHourly.value"
        />
        <div v-else class="p-6 flex flex-col items-center text-center gap-1.5">
          <ShieldCheck class="w-6 h-6 text-slate-400" />
          <p class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Cuaca tidak tersedia</p>
          <p class="text-[11px] text-slate-500 leading-relaxed max-w-[260px]">
            Data cuaca terkini untuk {{ city }} belum dapat dimuat.
          </p>
        </div>
      </template>

      <!-- Pasut pelabuhan: data resmi Open Data, tidak pernah mock -->
      <template v-else-if="widget === 'port-tide'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat data pasut…</div>
        <div v-else-if="!bmkg.livePort.value" class="p-6 flex flex-col items-center text-center gap-1.5">
          <ShieldCheck class="w-6 h-6 text-slate-400" />
          <p class="text-[13px] font-bold text-slate-800 dark:text-slate-200">Data pasut tidak tersedia</p>
          <p class="text-[11px] text-slate-500 leading-relaxed max-w-[260px]">
            Tidak ada pelabuhan terdekat dengan data pasut untuk {{ city }}.
          </p>
        </div>
        <PortTideCard v-else :port="bmkg.livePort.value" :selected-city="city" />
      </template>

      <!-- Kualitas udara: nilai dihitung deterministik per kota → selalu berlabel MOCK -->
      <template v-else-if="widget === 'air-quality'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat kualitas udara…</div>
        <AirQualityCard v-else-if="weather" :weather-data="weather" :selected-city="city" />
        <div v-else class="p-6 text-center text-[11px] text-slate-500">Data cuaca kota {{ city }} belum tersedia.</div>
      </template>

      <!-- Transportasi: status contoh (tidak ada API resmi) → selalu berlabel MOCK -->
      <template v-else-if="widget === 'transport'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat status transportasi…</div>
        <div v-else class="p-4">
          <TransportWeather :statuses="transportStatusesMap[city] ?? transportStatusesMap['DKI Jakarta']" />
        </div>
      </template>

      <!-- Aktivitas & rekomendasi: angka live, narasi dihitung dari data yang sama -->
      <template v-else-if="widget === 'activity'">
        <div v-if="loading || !weather" class="p-6 text-center text-[12px] text-slate-500">
          Memuat rekomendasi aktivitas…
        </div>
        <WeatherActivity
          v-else
          :weather-data="weather"
          :current-analysis="activityAnalysis"
          :additional-info="activityAdditional"
          :selected-city="city"
          slide-direction="slide-right"
          :current-city-landmark-svg="activityLandmark"
          :current-city-short-name="activityShortName"
          :maritim-live="null"
        />
      </template>

      <!-- Rincian kondisi: angin, kelembapan, visibilitas, tekanan, dst. -->
      <template v-else-if="widget === 'current-detail'">
        <div v-if="loading" class="p-6 text-center text-[12px] text-slate-500">Memuat rincian cuaca…</div>
        <CurrentWeather
          v-else-if="weather"
          :weather-data="weather"
          :cities="[city]"
          :selected-city="city"
          :additional-info="bmkg.liveAdditional.value ?? undefined"
        />
        <div v-else class="p-6 text-center text-[11px] text-slate-500">
          Rincian cuaca {{ city }} belum tersedia.
        </div>
      </template>

      <!-- Kartu unduh aplikasi: murni statis, tanpa token & tanpa kota -->
      <div v-else-if="widget === 'app-download'" class="p-4">
        <AppDownloadCTA class="h-full" />
      </div>

      <!-- Peta lapisan (radar/satelit/angin): data field SINTETIS → selalu MOCK -->
      <WeatherRadarMap
        v-else-if="widget === 'radar'"
        :selected-city="city"
        :weather-data="weather ?? undefined"
      />

      <!-- Saran maritim: inline + sektor default (partner belum bisa memilih) -->
      <MaritimeAdvisorDrawer
        v-else-if="widget === 'maritime-advisor'"
        inline
        :is-open="true"
        :initial-sector-id="SECTOR_MARITIM as 'shipping' | 'fishery' | 'oilgas' | 'tourism' | 'public'"
        :selected-city="city"
        @close="() => {}"
      />

      <!-- Saran penerbangan: inline + sektor default -->
      <AviationAdvisorDrawer
        v-else-if="widget === 'aviation-advisor'"
        inline
        :is-open="true"
        :initial-sector-id="SECTOR_AVIASI as 'commercial' | 'cargo' | 'sigmet' | 'pirep'"
        :selected-city="city"
        @close="() => {}"
      />

      <!-- Aktivitas darat: rute ke destinasi contoh (Monas) -->
      <LandBasedActivities
        v-else-if="widget === 'land-activity'"
        inline
        :is-open="true"
        :selected-city="city"
        :initial-destination="landDestination"
        @close="() => {}"
      />

      <!-- Detail aktivitas sekitar: contoh taman kota -->
      <AroundActivityDrawer
        v-else-if="widget === 'around'"
        inline
        :is-open="true"
        :activity="aroundActivity"
        :selected-city="city"
        @close="() => {}"
      />

      <!-- Lapor cuaca: form + riwayat, dirender inline -->
      <EmbedWeatherReport
        v-else-if="widget === 'report'"
        :selected-city="city"
        :weather-temp="weather?.temp"
      />

      <!-- 10 kota besar: kartu statis (landmark + nama), tanpa fetch -->
      <div v-else-if="widget === 'major-cities'" class="p-4 overflow-hidden">
        <MajorCitiesCarousel :selected-city="city" :show-activities="false" />
      </div>

      <!-- Peta maritim: Leaflet + data wilayah perairan resmi BMKG -->
      <!-- Peta memuat datanya sendiri (live BMKG) + tinggi tetap, jadi render langsung -->
      <WaveRadarMap v-else-if="widget === 'wave'" :selected-city="city" />
      <MarineMap v-else-if="widget === 'marine'" :selected-city="city" />
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

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
//   ?widget=coming                   → placeholder resmi utk kartu yang belum siap
// Kota dibatasi daftar tertutup + fallback Jakarta: kota tak dikenal diabaikan
// (jangan pernah tampil kosong/rusak di web orang lain).
// ═══════════════════════════════════════════════════════════════════════════
import { defineAsyncComponent, ref, onMounted } from 'vue';
import { useBmkgWeather, CITY_COORDS } from '../composables/useBmkgWeather';
import type { WarningAlert, NewsArticle, HourlyForecast } from '../types/weather';
import { newsArticles, transportStatusesMap } from '../data/mockData';
import type { WeatherData } from '../types/weather';
import { MapPin, Construction, ExternalLink, ShieldCheck, FlaskConical, ShieldAlert } from 'lucide-vue-next';

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
const READY = [
  'satellite', 'earthquake', 'alerts', 'news', 'forecast',
  'current', 'port-tide', 'air-quality', 'transport', 'major-cities',
  'wave', 'marine',
];
const isReady = READY.includes(widget);
// Widget yang butuh kota: semua yang menampilkan nama/titik wilayah
const CITY_WIDGETS = [
  'earthquake', 'alerts', 'forecast', 'current', 'port-tide',
  'air-quality', 'transport', 'wave', 'marine',
];
const needCity = CITY_WIDGETS.includes(widget);
// Widget yang datanya bergantung pada loadCity (satu fetch dipakai bersama)
const FETCH_WIDGETS = ['alerts', 'forecast', 'current', 'port-tide', 'air-quality', 'transport'];

// Widget berbasis data (alerts/news) menyiapkan datanya sendiri — komponennya
// murni presentasional (props), pola sama seperti dashboard.
const bmkg = useBmkgWeather();
const alerts = ref<WarningAlert[]>([]);
const articles = ref<NewsArticle[]>([]);
const forecasts = ref<HourlyForecast[]>([]);
const weather = ref<WeatherData | null>(null);
const loading = ref(false);
// true bila widget menampilkan data MOCK/fallback — ditandai di UI (bukan disembunyikan)
const isMock = ref(false);

// ── Token Keycloak (POC) ───────────────────────────────────────────────────
// Widget menunggu token dulu, baru memuat data. Kalau partner sudah mengirim
// ?token=… (server-side mereka), pakai itu; kalau tidak, ambil ke server kita
// (secret Keycloak tidak boleh ada di browser).
const authState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const authMessage = ref('');
const externalToken = params.get('token') || '';
// Info ringkas untuk indikator: dari mana tokennya & berapa lama berlaku
const authSource = ref<'' | 'partner' | 'server'>('')
const authExpiresIn = ref(0);
// ?debug=1 → tampilkan strip status auth (untuk dev/POC)
const debugAuth = params.get('debug') === '1';

async function ensureToken(): Promise<boolean> {
  if (externalToken) {
    authState.value = 'ready';
    authSource.value = 'partner';
    return true;
  }
  authState.value = 'loading';
  try {
    const res = await fetch('/api/embed-token', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { token?: string; expires_in?: number };
    if (!json.token) throw new Error('token kosong');
    authState.value = 'ready';
    authSource.value = 'server';
    authExpiresIn.value = json.expires_in ?? 0;
    console.log('[bmkg-widget] auth OK via server, token berlaku ~' + authExpiresIn.value + 's');
    return true;
  } catch (e) {
    authState.value = 'error';
    authMessage.value = String(e).slice(0, 120);
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
      const coords = CITY_COORDS[city];
      await bmkg.loadCity(city, coords);
      if (widget === 'alerts') {
        alerts.value = bmkg.liveAlerts.value;
      } else if (widget === 'forecast') {
        forecasts.value = bmkg.liveHourly.value.slice(0, 12);
        isMock.value = false; // prakiraan kosong → pesan jujur, bukan angka karangan
      } else if (widget === 'current') {
        weather.value = bmkg.liveWeather.value;
      } else if (widget === 'port-tide') {
        // loadCity memicu loadPort fire & forget — di sini ditunggu agar tidak kosong
        await bmkg.loadPort(coords.lat, coords.lon);
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
onMounted(loadData); // city statis per page-load — tidak perlu watch
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
      <p class="text-[12px] font-bold text-slate-800 dark:text-slate-200">Gagal menyiapkan widget</p>
      <p class="text-[10.5px] text-slate-500 leading-relaxed max-w-[260px]">
        Token akses tidak dapat diperoleh. Hubungi penyedia layanan BMKG bila masalah berlanjut.
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
        <span v-if="authState === 'ready' && authSource === 'server'">· berlaku={{ authExpiresIn }}s</span>
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
        <span class="text-[9.5px] font-bold leading-snug">Data contoh (MOCK) — layanan BMKG sedang tidak tersedia</span>
      </div>
      <SatelliteMap v-if="widget === 'satellite'" />
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

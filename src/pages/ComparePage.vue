<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// PERBANDINGAN — kartu yang SAMA, dua arsitektur, satu halaman.
// ---------------------------------------------------------------------------
// Kiri  : Vue asli — impor komponen langsung, data mengalir lewat props.
// Kanan : iframe embed — server kita yang mengirim widget; kode halaman ini
//         tidak tahu apa pun soal Vue di dalamnya (persis seperti partner).
//
// Semua data di kiri & kanan berasal dari API yang sama, jadi perbedaan yang
// terlihat (kalau ada) bukan karena sumber datanya berbeda.
// ═══════════════════════════════════════════════════════════════════════════
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Search, Loader2, ShieldCheck, Code2, Boxes } from 'lucide-vue-next';
import CurrentWeather from '../components/CurrentWeather.vue';
import ForecastPanel from '../components/ForecastPanel.vue';
import AlertsPanel from '../components/AlertsPanel.vue';
import { useBmkgWeather, CITY_COORDS } from '../composables/useBmkgWeather';
import { getToken } from '../services/embedToken';
import { CITIES as CITY_LIST } from '../../lib/cities.js';

const bmkg = useBmkgWeather();
const city = ref('DKI Jakarta');
const loading = ref(true);
const token = ref('');
const tokenMsg = ref('');
const q = ref('');

const cityNames = computed(() => CITY_LIST.map((c: { name: string }) => c.name));
const filtered = computed(() => {
  const n = q.value.trim().toLowerCase();
  return n ? cityNames.value.filter((c: string) => c.toLowerCase().includes(n)) : cityNames.value;
});

const forecasts = computed(() => bmkg.liveHourly.value.slice(0, 12));
const weather = computed(() => bmkg.liveWeather.value);

async function loadTok(): Promise<void> {
  try {
    const t = await getToken();
    token.value = t;
    const res = await fetch('/api/embed-verify', { headers: { Authorization: `Bearer ${t}` } });
    const j = (await res.json().catch(() => ({}))) as { valid?: boolean; expires_in?: number; reason?: string };
    tokenMsg.value = j.valid ? `token sah · berlaku ${j.expires_in ?? '?'}s` : `token ditolak: ${j.reason ?? res.status}`;
  } catch (e) {
    tokenMsg.value = String(e instanceof Error ? e.message : e).slice(0, 100);
  }
}

async function loadCity(): Promise<void> {
  loading.value = true;
  try {
    await bmkg.loadCity(city.value, CITY_COORDS[city.value]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadTok();
  void loadCity();
});
watch(city, () => void loadCity());

// Token diserahkan lewat postMessage, BUKAN URL.
// Dua jalur, keduanya perlu:
//   - `bmkg-embed-ready` dari iframe → jalur normal (iframe sudah mendengarkan)
//   - @load → jaring pengaman kalau pesan ready terlewat
// Tanpa yang pertama, token kadang terkirim sebelum iframe siap (race) dan
// widget berakhir "token tidak diterima dari halaman pemasang".
function send(win: Window | null | undefined): void {
  if (!token.value || !win) return;
  win.postMessage({ type: 'bmkg-embed-token', token: token.value }, '*');
}

function passToken(ev: Event): void {
  send((ev.target as HTMLIFrameElement).contentWindow);
}

function onMessage(ev: MessageEvent): void {
  if ((ev.data as { type?: string } | null)?.type === 'bmkg-embed-ready') {
    send(ev.source as Window | null);
  }
}

// Kalau iframe minta token SEBELUM token kita siap, permintaannya hilang.
// Jadi setiap kali token berubah, tawarkan lagi ke semua iframe.
watch(token, (t) => {
  if (!t) return;
  for (const el of document.querySelectorAll('iframe')) send(el.contentWindow);
});

onMounted(() => window.addEventListener('message', onMessage));
onUnmounted(() => window.removeEventListener('message', onMessage));
</script>

<template>
  <div class="min-h-dvh bg-slate-50 dark:bg-[#070c19] text-slate-900 dark:text-white">
    <div class="max-w-[1500px] mx-auto px-4 py-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-black tracking-tight">Perbandingan: komponen Vue vs widget embed</h1>
          <p class="text-[12px] text-slate-500 mt-0.5">
            Kartu dan data yang sama. Kiri memakai komponen kita, kanan memakai iframe dari server widget.
          </p>
        </div>
        <span
          :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10.5px] font-bold',
            token ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/12 text-rose-600']"
        >
          <ShieldCheck class="w-3 h-3" />{{ tokenMsg || 'memeriksa token…' }}
        </span>
      </header>

      <!-- Pemilih kota: satu kontrol untuk kedua sisi -->
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="q"
            placeholder="Saring kota…"
            class="pl-8 pr-3 py-1.5 w-52 rounded-[4px] text-[12px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>
        <button
          v-for="c in filtered"
          :key="c"
          type="button"
          :class="['px-2.5 py-1.5 rounded-[4px] text-[11.5px] font-semibold border transition-colors',
            city === c
              ? 'bg-brand-navy-900 text-white border-brand-navy-900 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-500'
              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-cyan-500/50']"
          @click="city = c"
        >{{ c }}</button>
        <span v-if="loading" class="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <Loader2 class="w-3 h-3 animate-spin" /> memuat data
        </span>
      </div>

      <!-- Dua kolom: arsitektur berbeda, isi sama -->
      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <!-- KIRI -->
        <section>
          <h2 class="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <Code2 class="w-3.5 h-3.5" /> Vue — impor komponen ({{ city }})
          </h2>
          <div class="space-y-3 rounded-[6px] border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-white/[0.02]">
            <pre class="text-[10px] leading-relaxed bg-slate-900 text-slate-300 rounded-[4px] p-2.5 overflow-x-auto">import CurrentWeather from '../components/CurrentWeather.vue'
&lt;CurrentWeather :weather-data="weather" :selected-city="city" /&gt;</pre>
            <AlertsPanel v-if="bmkg.liveAlerts.value.length" :alerts="bmkg.liveAlerts.value" />
            <CurrentWeather v-if="weather" :weather-data="weather" :cities="[city]" :selected-city="city" />
            <p v-else class="text-[11px] text-slate-500 py-6 text-center">Data cuaca {{ city }} belum tersedia.</p>
            <ForecastPanel v-if="forecasts.length" :forecasts="forecasts" />
          </div>
        </section>

        <!-- KANAN -->
        <section>
          <h2 class="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <Boxes class="w-3.5 h-3.5" /> Embed — iframe dari server widget ({{ city }})
          </h2>
          <div class="space-y-3 rounded-[6px] border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-white/[0.02]">
            <pre class="text-[10px] leading-relaxed bg-slate-900 text-slate-300 rounded-[4px] p-2.5 overflow-x-auto">&lt;div data-bmkg-widget="current" data-city="Bandung"&gt;&lt;/div&gt;
&lt;script src="…/bmkg-embed.js"&gt;&lt;/script&gt;  &lt;!-- BmkgWidget.init({token}) --&gt;</pre>
            <iframe
              :key="'alerts-' + city"
              :src="`/embed.html?widget=alerts&city=${encodeURIComponent(city)}`"
              class="w-full border-0 rounded-[4px]" style="height: 340px" title="embed alerts"
              @load="passToken"
            ></iframe>
            <iframe
              :key="'current-' + city"
              :src="`/embed.html?widget=current&city=${encodeURIComponent(city)}`"
              class="w-full border-0 rounded-[4px]" style="height: 520px" title="embed current"
              @load="passToken"
            ></iframe>
            <iframe
              :key="'forecast-' + city"
              :src="`/embed.html?widget=forecast&city=${encodeURIComponent(city)}`"
              class="w-full border-0 rounded-[4px]" style="height: 540px" title="embed forecast"
              @load="passToken"
            ></iframe>
          </div>
        </section>
      </div>

      <p class="mt-5 text-[11px] text-slate-500">
        Catatan: kolom kanan memakai token yang sama (dikirim lewat <code>postMessage</code>, tidak lewat URL).
        Isi iframe tidak bisa disentuh kode halaman ini — itu justru intinya.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Radar, 
  Activity,
  Play,
  Pause,
  ChevronDown,
  Thermometer,
  Cloud,
  Droplet,
  Wind
} from 'lucide-vue-next';



const emit = defineEmits<{
  (e: 'select-city', city: string): void;
}>();

const activeTab = ref('suhu');

const tabs = [
  { id: 'suhu', label: 'Suhu Permukaan', icon: Thermometer },
  { id: 'awan', label: 'Citra Awan', icon: Cloud },
  { id: 'hujan', label: 'Curah Hujan', icon: Droplet },
  { id: 'angin', label: 'Kec. Angin', icon: Wind }
];

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const activeTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.label : '';
});

const activeTabIcon = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.icon : Thermometer;
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectTab = (id: string) => {
  activeTab.value = id;
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

// ── Tile API satellite.bmkg.go.id (CORS *, 18 frame, interval 10 menit) ──
// docs: docs/satellite-himawari.md — tms:true wajib, maxZoom 8, 204 = di luar cakupan (skip)
const SATELLITE = 'https://satellite.bmkg.go.id';
const PARAM_BY_TAB: Record<string, string> = { suhu: 'EH', awan: 'NC', hujan: 'RP', angin: 'WV' };

const frames = ref<string[]>([]);          // baserun ISO 8601 UTC, terbaru di index 0
const frameIndex = ref(0);
const satError = ref(false);
const isPlaying = ref(false);
const cacheBuster = ref(Date.now());       // cache-killer untuk fallback statis inderaja

let map: L.Map | null = null;
let himaLayer: L.TileLayer | null = null;
let playIntervalId: any = null;
let refreshId: any = null;

const tileUrl = (baserun: string) =>
  `${SATELLITE}/api22/tile/{z}/{x}/{y}.png?tiletype=himawari9&modelname=himawari9` +
  `&param=${PARAM_BY_TAB[activeTab.value] ?? 'EH'}&baserun=${encodeURIComponent(baserun)}`;

const frameLabel = (iso: string) =>
  iso ? `${new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB` : '—';

const detectionText = computed(() =>
  frames.value.length ? `Deteksi: ${frameLabel(frames.value[frameIndex.value])}` : 'Deteksi: memuat frame…'
);

const isStale = computed(() =>
  frames.value.length > 0 && Date.now() - new Date(frames.value[0]).getTime() > 3_600_000
);

// Fallback statis: gambar inderaja (dipakai hanya saat Tile API gagal)
const imageUrls: Record<string, string> = {
  suhu: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
  awan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png',
  hujan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
  angin: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_WV_Indonesia.png'
};

const activeImageUrl = computed(() => imageUrls[activeTab.value]);

// Fallback statis (inderaja <img>) bila Tile API gagal
const mapBgStyle = computed(() => ({
  backgroundImage: `url(${activeImageUrl.value}?t=${cacheBuster.value})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}));

async function loadFrames() {
  try {
    const res = await fetch(`${SATELLITE}/api22/modelrun`);
    if (!res.ok) throw new Error(`modelrun ${res.status}`);
    const list = (await res.json()).himawari9 ?? [];
    if (!list.length) throw new Error('frame kosong');
    const prevNewest = frames.value[0];
    frames.value = list;
    if (prevNewest && prevNewest !== list[0]) {
      frameIndex.value = Math.min(frameIndex.value + 1, list.length - 1); // ikut frame baru, jaga posisi slider
    }
    satError.value = false;
  } catch {
    satError.value = true;
  }
}

function applyFrame() {
  const baserun = frames.value[frameIndex.value];
  if (!map || !himaLayer || !baserun) return;
  himaLayer.setUrl(tileUrl(baserun)); // ganti frame tanpa flicker
}

watch(activeTab, () => {
  if (himaLayer) himaLayer.setUrl(tileUrl(frames.value[frameIndex.value] ?? ''));
});
watch(frameIndex, applyFrame);

// Playback slider controls
const startPlayback = () => {
  stopPlayback();
  playIntervalId = setInterval(() => {
    frameIndex.value = frames.value.length ? (frameIndex.value + 1) % frames.value.length : 0;
  }, 1500);
};

const stopPlayback = () => {
  if (playIntervalId) {
    clearInterval(playIntervalId);
    playIntervalId = null;
  }
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startPlayback();
  } else {
    stopPlayback();
  }
};

const selectTime = (index: number) => {
  frameIndex.value = index;
  isPlaying.value = false;
  stopPlayback();
};

onMounted(async () => {
  await loadFrames();
  if (!satError.value) {
    await nextTick();
    map = L.map('satellite-leaflet', {
      center: [-2.5, 118],
      zoom: 5,
      maxZoom: 8, // data Himawari habis ~z=8 (docs/satellite-himawari.md)
      attributionControl: false
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: '' }).addTo(map);
    himaLayer = L.tileLayer(tileUrl(frames.value[frameIndex.value] ?? ''), {
      tms: true,          // skema TMS — wajib
      crossOrigin: true,  // canvas tidak tainted
      opacity: 0.9,
      maxNativeZoom: 8,
      maxZoom: 8
    }).addTo(map);
  }

  // polling modelrun — situs BMKG 30 detik; 60 detik cukup sopan
  refreshId = setInterval(loadFrames, 60_000);
  // cache buster fallback statis tiap 5 menit
  setInterval(() => { cacheBuster.value = Date.now(); }, 300_000);

  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (refreshId) clearInterval(refreshId);
  map?.remove();
  map = null;
  himaLayer = null;
  window.removeEventListener('click', handleClickOutside);
  stopPlayback();
});
</script>

<template>
  <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-[4px] p-6 shadow-sm backdrop-blur-md" v-api-marker:satellite>
    <!-- Header Area -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Radar class="w-4 h-4 text-blue-500 dark:text-brand-cyan animate-spin" style="animation-duration: 6s;" />
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Citra Satelit Himawari-9</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time Advanced Imager Overlay</p>
      </div>

      <!-- Map Subtabs Dropdown -->
      <div ref="dropdownRef" class="relative z-50 shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] border transition-all cursor-pointer select-none
            bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700
            dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component 
            :is="activeTabIcon" 
            class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan"
          />
          <span class="text-xs tracking-wide">{{ activeTabLabel }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="isDropdownOpen"
            class="absolute right-0 mt-2 w-48 rounded-[4px] shadow-lg border overflow-hidden py-1.5 z-50
              bg-white/95 border-slate-100 backdrop-blur-md
              dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="selectTab(tab.id)"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activeTab === tab.id ? 'font-bold text-blue-600 dark:text-brand-cyan' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                {{ tab.label }}
              </span>
              <span v-if="activeTab === tab.id" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Map container -->
    <div class="relative w-full h-[280px] rounded-[4px] overflow-hidden bg-slate-900 select-none shadow-inner border border-transparent">
      <!-- Peta Leaflet interaktif + tile Himawari asli (Tile API, CORS *) -->
      <div v-if="!satError" id="satellite-leaflet" class="absolute inset-0 z-0"></div>

      <!-- Fallback statis: gambar inderaja via background <img> bila Tile API gagal -->
      <div v-else class="absolute inset-0 bg-slate-950 transition-all duration-700" :style="mapBgStyle">
        <div class="absolute inset-0 bg-brand-navy-950/15 dark:bg-brand-navy-950/40 mix-blend-multiply"></div>
        <div class="absolute top-2 left-2 z-20 bg-amber-500/90 text-slate-950 text-[8px] font-bold px-2 py-0.5 rounded-[4px]">MODE STATIS — Tile API tidak tersedia</div>
      </div>

      <!-- Banner data tertunda (frame terakhir > 1 jam) -->
      <div
        v-if="!satError && isStale"
        class="absolute top-3 left-3 z-20 bg-amber-500/90 text-slate-950 text-[8px] font-bold px-2 py-1 rounded-[4px] flex items-center gap-1 pointer-events-none"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
        DATA BMKG TERTUNDA
      </div>

      <!-- Floating Metadata Corner Badge (bottom-left) -->
      <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/30 rounded-[4px] p-2.5 text-white font-medium flex items-center gap-2 max-w-[170px] pointer-events-none z-20">
        <Activity class="w-3.5 h-3.5 text-brand-cyan animate-pulse shrink-0" />
        <div class="min-w-0">
          <p class="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none">Satelit Aktif</p>
          <p class="text-[9px] font-black text-slate-100 mt-1 truncate">HIMAWARI-9 (AHI)</p>
          <p class="text-[7px] text-slate-400 leading-none mt-0.5">{{ detectionText }}</p>
        </div>
      </div>

      <!-- Live / Playback badge (top-right) -->
      <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/30 rounded-[4px] px-2.5 py-1 text-white font-medium flex items-center gap-1.5 pointer-events-none text-[8px] z-20">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="satError || frameIndex === 0 ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'"
        ></span>
        <span class="font-bold tracking-widest text-slate-300">
          {{ satError || frameIndex === 0 ? 'LIVE FEED' : 'PLAYBACK' }}
        </span>
      </div>

      <!-- Atribusi wajib -->
      <div class="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 text-[7px] font-semibold text-slate-400 pointer-events-none">
        Sumber citra: BMKG Himawari-9
      </div>

      <!-- Floating Timeline Controller (bottom-right): 18 frame asli, interval 10 menit -->
      <div class="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/40 rounded-[4px] p-1.5 text-white flex items-center gap-2 z-20 shadow-lg">
        <div class="relative group flex-shrink-0">
          <button
            @click="togglePlay"
            class="w-6 h-6 flex items-center justify-center bg-blue-600 dark:bg-brand-cyan hover:bg-blue-500 dark:hover:bg-brand-cyan/80 active:scale-95 text-white dark:text-brand-navy-950 rounded-lg transition-all cursor-pointer"
          >
            <Play v-if="!isPlaying" class="w-3 h-3 fill-current" />
            <Pause v-else class="w-3 h-3 fill-current" />
          </button>

          <!-- Premium Tooltip -->
          <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
            <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>
              <span>Putar animasi 18 frame</span>
            </div>
          </div>
        </div>

        <input
          v-if="frames.length"
          type="range"
          :min="0"
          :max="frames.length - 1"
          :value="frameIndex"
          @input="selectTime(+($event.target as HTMLInputElement).value)"
          class="w-24 h-1 accent-blue-500 dark:accent-brand-cyan cursor-pointer"
        />
        <span class="text-[7.5px] font-bold tracking-wider text-slate-300 whitespace-nowrap tabular-nums">
          {{ frames.length ? `${frameLabel(frames[frameIndex])} · ${frames.length}fr` : 'memuat…' }}
        </span>
      </div>
    </div>
  </div>
</template>

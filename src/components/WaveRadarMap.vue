<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ChevronDown, Radar, Waves, Wind, Activity } from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  selectedCity: string;
}>();

type Mode = 'gelombang' | 'angin';
const activeMode = ref<Mode>('gelombang');
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const mapEl = ref<HTMLElement | null>(null);

const modes = [
  { id: 'gelombang' as Mode, label: 'Tinggi Gelombang', icon: Waves },
  { id: 'angin' as Mode, label: 'Kecepatan Angin', icon: Wind },
];
const activeModeInfo = computed(() => modes.find(m => m.id === activeMode.value) || modes[0]);

// Zona perairan Indonesia — awal mock, di-overlay data LIVE maritim public_api
// (centroid geojson wilayah + kategori gelombang overview). Angin mode tetap mock.
import { getWilayahPerairanGeo, getOverviewGelombang, getPerairanFiles, geoCentroid, WAVE_CAT_MID } from '../services/bmkg/openData';

interface Zone { name: string; lat: number; lng: number; wave: number; wind: number; }

/** Zona LIVE: centroid polygon wilayah (geojson resmi) + kategori gelombang overview.
 *  Wind mode: overview tak punya angin per-wilayah → angka ilustratif (mid ×6). */
async function loadLiveZones(): Promise<Zone[] | null> {
  try {
    const [geo, overview, files] = await Promise.all([
      getWilayahPerairanGeo(), getOverviewGelombang(), getPerairanFiles(),
    ]);
    if (!geo || !overview || !files?.length) return null;
    const names = new Map<string, string>();
    for (const n of files.map(String)) {
      names.set(n.split('_')[0], n.replace(/^[^.]+_/, '').replace(/\.json$/, ''));
    }
    const live: Zone[] = [];
    for (const f of (geo as { features: { properties: Record<string, unknown>; geometry: unknown }[] }).features) {
      const code = String(f.properties?.code ?? f.properties?.kode ?? '');
      const cen = geoCentroid(f as never);
      const ov = (overview as Record<string, Record<string, string>>)[code];
      if (!cen || !ov) continue;
      const cat = String(ov.today || '').toLowerCase();
      const wave = Object.entries(WAVE_CAT_MID).find(([k]) => cat.includes(k))?.[1] ?? 1;
      live.push({ name: names.get(code) || code, lat: cen.lat, lng: cen.lng, wave, wind: wave * 6 });
    }
    return live.length >= 20 ? live : null;
  } catch { return null; }
}

// fallback mock (dipakai bila data live gagal)
const zones: Zone[] = [
  { name: 'Perairan Utara Aceh', lat: 5.5, lng: 96.0, wave: 2.4, wind: 22 },
  { name: 'Perairan Sumatera Utara', lat: 3.6, lng: 98.5, wave: 1.8, wind: 18 },
  { name: 'Perairan Kep. Riau', lat: 1.5, lng: 105.0, wave: 1.1, wind: 12 },
  { name: 'Selat Sunda', lat: -5.9, lng: 105.5, wave: 0.9, wind: 10 },
  { name: 'Teluk Jakarta', lat: -5.9, lng: 106.8, wave: 0.4, wind: 8 },
  { name: 'Perairan Selatan Jawa', lat: -8.6, lng: 110.5, wave: 2.8, wind: 24 },
  { name: 'Selat Bali', lat: -8.5, lng: 115.4, wave: 2.2, wind: 20 },
  { name: 'Perairan Sulawesi Selatan', lat: -4.5, lng: 119.5, wave: 3.2, wind: 26 },
  { name: 'Perairan Maluku', lat: -3.5, lng: 128.0, wave: 1.6, wind: 15 },
  { name: 'Laut Arafura', lat: -7.0, lng: 135.0, wave: 2.6, wind: 23 },
];

const waveLevel = (w: number) => {
  if (w < 1) return { label: 'Rendah', color: '#34d399', level: 0 };
  if (w < 2) return { label: 'Sedang', color: '#fbbf24', level: 1 };
  if (w < 3) return { label: 'Tinggi', color: '#fb923c', level: 2 };
  return { label: 'Sangat Tinggi', color: '#f87171', level: 3 };
};

const windLevel = (w: number) => {
  if (w < 15) return { label: 'Rendah', color: '#34d399', level: 0 };
  if (w < 25) return { label: 'Sedang', color: '#fbbf24', level: 1 };
  if (w < 35) return { label: 'Tinggi', color: '#fb923c', level: 2 };
  return { label: 'Sangat Tinggi', color: '#f87171', level: 3 };
};

const valueOf = (zone: Zone, mode: Mode) => mode === 'gelombang' ? zone.wave : zone.wind;
const levelOf = (zone: Zone, mode: Mode) => mode === 'gelombang' ? waveLevel(zone.wave) : windLevel(zone.wind);
const unitOf = (mode: Mode) => mode === 'gelombang' ? ' m' : ' kt';

// ── Leaflet map ─────────────────────────────────────────────────────────────
let map: L.Map | null = null;
let zoneLayer: L.LayerGroup | null = null;

const selectedZone = computed(() => {
  const lc = props.selectedCity.toLowerCase();
  return (
    zones.find(z => {
      const n = z.name.toLowerCase();
      return lc.includes('jakarta') ? n.includes('teluk jakarta')
        : lc.includes('surabaya') || lc.includes('bali') || lc.includes('denpasar') ? n.includes('selat bali')
        : lc.includes('medan') ? n.includes('sumatera utara')
        : lc.includes('makassar') ? n.includes('sulawesi selatan')
        : lc.includes('semarang') || lc.includes('yogyakarta') ? n.includes('selatan jawa')
        : lc.includes('palembang') || lc.includes('batam') ? n.includes('kep. riau')
        : lc.includes('bandung') ? n.includes('selat sunda')
        : lc.includes('aceh') ? n.includes('utara aceh')
        : n.includes(lc.split(',')[0].trim());
    }) || zones[4]
  );
});

function renderZones() {
  if (!map || !zoneLayer) return;
  zoneLayer.clearLayers();
  const mode = activeMode.value;

  zones.forEach(zone => {
    const isSel = zone.name === selectedZone.value.name;
    const val = valueOf(zone, mode);
    const lvl = levelOf(zone, mode);
    const radius = Math.max(6, Math.min(22, (mode === 'gelombang' ? val * 4 : val * 0.6) + 4));

    const marker = L.circleMarker([zone.lat, zone.lng], {
      radius: isSel ? radius + 4 : radius,
      color: isSel ? '#e2e8f0' : lvl.color,
      weight: isSel ? 2.5 : 1.5,
      fillColor: lvl.color,
      fillOpacity: isSel ? 0.85 : 0.5,
    });

    marker.bindTooltip(
      `<div class="wave-tip ${isSel ? 'wave-tip-sel' : ''}">
        <span class="wave-tip-name">${zone.name}</span>
        <span class="wave-tip-val">${val.toFixed(mode === 'gelombang' ? 1 : 0)}${unitOf(mode)}</span>
        <span class="wave-tip-lvl" style="color:${lvl.color}">${lvl.label}</span>
      </div>`,
      { permanent: true, direction: 'top', offset: [0, -6], className: 'wave-tip-wrap' }
    );

    marker.on('click', () => {
      map?.flyTo([zone.lat, zone.lng], 6, { duration: 0.8 });
      renderZones();
    });

    marker.addTo(zoneLayer!);
  });
}

function initMap() {
  if (!mapEl.value || map) return;
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: true,
    minZoom: 4,
    maxZoom: 10,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO • Data: cuaca.bmkg.go.id/map#Maritim',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);
  map.setView([selectedZone.value.lat, selectedZone.value.lng], 6);
  zoneLayer = L.layerGroup().addTo(map);
  renderZones();
}

const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value; };
const selectMode = (id: Mode) => { activeMode.value = id; isDropdownOpen.value = false; };

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

watch(activeMode, () => renderZones());

watch(() => props.selectedCity, () => {
  nextTick(() => {
    if (map) {
      map.flyTo([selectedZone.value.lat, selectedZone.value.lng], 6, { duration: 0.8 });
      renderZones();
    }
  });
});

onMounted(async () => {
  window.addEventListener('click', handleClickOutside);
  // Muat zona LIVE dulu (centroid wilayah + gelombang resmi) sebelum peta digambar
  const live = await loadLiveZones();
  if (live) zones.splice(0, zones.length, ...live);
  initMap();
  // Card masuk via lazy-load: pastikan ukuran container sudah benar
  setTimeout(() => map?.invalidateSize(), 150);
  setTimeout(() => map?.invalidateSize(), 600);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  if (map) { map.remove(); map = null; }
  zoneLayer = null;
});
</script>

<template>
  <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-6 shadow-sm backdrop-blur-md">
    <!-- Header Area -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Radar class="w-4 h-4 text-cyan-500 dark:text-brand-cyan animate-spin" style="animation-duration: 6s;" />
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Radar Tinggi Gelombang</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Peta Maritim Perairan Indonesia
          <a href="https://cuaca.bmkg.go.id/map#Maritim" target="_blank" rel="noopener" class="text-cyan-500 dark:text-brand-cyan hover:underline font-bold ml-1">cuaca.bmkg.go.id/map#Maritim ↗</a>
        </p>
      </div>

      <!-- Mode dropdown -->
      <div ref="dropdownRef" class="relative z-[500] shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer select-none bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700 dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component :is="activeModeInfo.icon" class="w-3.5 h-3.5 text-cyan-500 dark:text-brand-cyan" />
          <span class="text-xs tracking-wide">{{ activeModeInfo.label }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
        </button>
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
            class="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden py-1.5 z-50 bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="mode in modes"
              :key="mode.id"
              @click="selectMode(mode.id)"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activeMode === mode.id ? 'font-bold text-cyan-600 dark:text-brand-cyan' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="mode.icon" class="w-3.5 h-3.5" />
                {{ mode.label }}
              </span>
              <span v-if="activeMode === mode.id" class="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-brand-cyan"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Map container (Leaflet) -->
    <div class="relative w-full h-[360px] rounded-2xl overflow-hidden border border-slate-200/50 dark:border-brand-navy-800/40 shadow-inner">
      <div ref="mapEl" class="absolute inset-0 z-0"></div>

      <!-- Floating metadata badge -->
      <div class="absolute bottom-3 left-3 z-[400] bg-slate-950/85 backdrop-blur-sm border border-slate-800/40 rounded-xl p-2.5 text-white font-medium flex items-center gap-2 max-w-[180px] pointer-events-none">
        <Activity class="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
        <div class="min-w-0">
          <p class="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none">Data Maritim</p>
          <p class="text-[9px] font-black text-slate-100 mt-1 truncate">BMKG WaveWatch III</p>
          <p class="text-[7px] text-slate-400 leading-none mt-0.5 truncate">{{ selectedZone.name }}</p>
        </div>
      </div>

      <!-- Legend -->
      <div class="absolute bottom-3 right-3 z-[400] bg-slate-950/85 backdrop-blur-md border border-slate-800/40 rounded-xl px-2.5 py-2 flex items-center gap-2.5 shadow-lg">
        <span v-for="lvl in ['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi']" :key="lvl" class="flex items-center gap-1 text-[8px] font-bold text-slate-300">
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-emerald-400': lvl === 'Rendah',
            'bg-amber-400': lvl === 'Sedang',
            'bg-orange-400': lvl === 'Tinggi',
            'bg-red-400': lvl === 'Sangat Tinggi',
          }"></span>
          {{ lvl }}
        </span>
      </div>

      <!-- Mode indicator (top-left) -->
      <div class="absolute top-3 left-3 z-[400] bg-slate-950/85 backdrop-blur-sm border border-slate-800/40 rounded-full px-2.5 py-1 text-white font-medium flex items-center gap-1.5 pointer-events-none text-[8px]">
        <component :is="activeModeInfo.icon" class="w-3 h-3 text-cyan-400" />
        <span class="font-bold tracking-widest text-slate-300">{{ activeModeInfo.label }} • {{ selectedZone.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.wave-tip-wrap) {
  background: transparent;
  border: none;
  box-shadow: none;
}
:deep(.wave-tip) {
  background: rgba(2, 6, 23, 0.92);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 10px;
  padding: 5px 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 86px;
  text-align: center;
}
:deep(.wave-tip-sel) {
  border-color: rgba(34, 211, 238, 0.8);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.35);
}
:deep(.wave-tip-name) {
  font-size: 8px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.95);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.wave-tip-val) {
  font-size: 12px;
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
}
:deep(.wave-tip-lvl) {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { 
  X, 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  Compass, 
  AlertTriangle,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  activity: any | null;
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

void ArrowDown;
void ArrowDownLeft;
void ArrowDownRight;

let map: L.Map | null = null;
let marker: L.Marker | null = null;
let tileLayer: L.TileLayer | null = null;
let themeObserver: MutationObserver | null = null;

const mapEl = ref<HTMLElement | null>(null);

const updateMapTheme = () => {
  if (!map) return;
  const isDarkMode = document.documentElement.classList.contains('dark');
  const lightUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  const selectedUrl = isDarkMode ? darkUrl : lightUrl;

  if (tileLayer) {
    map.removeLayer(tileLayer);
  }

  tileLayer = L.tileLayer(selectedUrl, {
    maxZoom: 18,
    minZoom: 5,
    attribution: ''
  }).addTo(map);
};

const initMap = () => {
  if (!mapEl.value || !props.activity) return;
  if (map) {
    map.setView([props.activity.lat, props.activity.lng], 14);
    updateMarker();
    return;
  }

  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([props.activity.lat, props.activity.lng], 14);

  updateMapTheme();

  if (window.matchMedia('(min-width: 768px)').matches) {
    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }

  updateMarker();

  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      updateMapTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  map.whenReady(() => {
    map?.invalidateSize();
    if (window.innerWidth >= 1024) {
      map?.panBy([-100, 0], { animate: false });
    }
  });
};

const updateMarker = () => {
  if (!map || !props.activity) return;
  if (marker) {
    map.removeLayer(marker);
  }

  const markerColor = props.activity.colorKey === 'emerald' ? '#10b981' : (props.activity.colorKey === 'purple' ? '#a855f7' : '#3b82f6');
  
  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-75" style="background-color: ${markerColor}"></span>
      <div class="relative flex items-center justify-center w-6 h-6 rounded-full border border-white shadow-md text-white font-bold text-xs" style="background-color: ${markerColor}">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `;

  const markerIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  marker = L.marker([props.activity.lat, props.activity.lng], { icon: markerIcon }).addTo(map);
};

const destroyMap = () => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
  marker = null;
  tileLayer = null;
};

watch(
  () => [props.isOpen, props.activity],
  ([isOpenVal, actVal]) => {
    if (isOpenVal && actVal) {
      document.body.classList.add('drawer-open');
      nextTick(() => {
        setTimeout(() => {
          initMap();
        }, 150);
      });
    } else {
      document.body.classList.remove('drawer-open');
      destroyMap();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  document.body.classList.remove('drawer-open');
  destroyMap();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="map-fade" appear>
      <div v-if="isOpen && activity" class="fixed inset-0 z-[9999] bg-slate-900 overflow-hidden text-slate-100 font-sans flex flex-col justify-between fullscreen-map-container">
        <!-- Background Map -->
        <div class="absolute inset-0 w-full h-full z-0 bg-slate-800">
          <div ref="mapEl" class="w-full h-full"></div>
        </div>

        <!-- Floating Close button top right on map -->
        <button
          type="button"
          @click="emit('close')"
          class="absolute right-4 top-4 z-50 w-10 h-10 rounded-full bg-slate-900/95 text-white flex items-center justify-center border border-slate-700/40 backdrop-blur-md shadow-lg hover:bg-slate-850 active:scale-95 transition-all cursor-pointer map-close-btn"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Sidebar / Drawer overlay -->
        <Transition name="drawer-slide" appear>
          <div
            v-if="isOpen"
            class="relative z-45 w-[calc(100%-24px)] mx-3 mb-3 md:w-[420px] md:ml-6 md:my-6 bg-white dark:bg-[#182232] border border-slate-200/60 dark:border-slate-800/40 shadow-2xl rounded-[4px] flex flex-col overflow-hidden text-left mt-auto md:h-[calc(100vh-48px)] md:max-h-[calc(100vh-48px)] land-route-drawer"
          >
            <!-- Drag handle -->
            <div class="py-3 flex items-center justify-center shrink-0">
              <div class="w-16 h-1 rounded-full bg-slate-300 dark:bg-slate-500/90"></div>
            </div>

            <!-- Activity Details Content (Scrollable) -->
            <div class="flex-grow overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar">
              
              <!-- Category badge and back button -->
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10">
                  {{ activity.category === 'golf' ? 'Golf & Country' : (activity.category === 'beach' ? 'Wisata Pantai' : (activity.category === 'park' ? 'Taman Kota' : 'Aktivitas Rekreasi')) }}
                </span>
                
                <span class="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
                  Detail Lokasi
                </span>
              </div>

              <!-- Primary Name -->
              <div class="space-y-1">
                <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                  {{ activity.name }}
                </h2>
                <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <MapPin class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ activity.location }}</span>
                </div>
              </div>

              <!-- Quick action bar (Like, Share, Focus Map) -->
              <div class="flex items-center gap-2 border-y border-slate-100 dark:border-slate-800/50 py-3">
                <div class="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <Compass class="w-4 h-4 text-blue-500" />
                  <span>{{ activity.distance }}</span>
                </div>
                <div class="ml-auto flex items-center gap-1.5">
                  <button class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                    <Heart class="w-4 h-4" />
                  </button>
                  <button class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                    <Share2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Comfort Index Card -->
              <div class="p-4 rounded-[4px] bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-brand-navy-900/40 dark:to-brand-navy-800/20 border border-blue-100/40 dark:border-brand-navy-700/20 shadow-sm flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-[4px] bg-white dark:bg-brand-navy-950 flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-800/40 shrink-0">
                  {{ activity.comfortEmoji }}
                </div>
                <div class="text-left">
                  <span class="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Indeks Kenyamanan Aktivitas</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-sm font-extrabold text-slate-800 dark:text-white">{{ activity.comfortIndex }}</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
              </div>

              <!-- Weather Recommendations Text Card -->
              <div class="p-4 rounded-[4px] border text-[11px] font-bold leading-relaxed shadow-sm bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03] border-amber-500/10 text-amber-800 dark:text-amber-300 dark:border-amber-500/20">
                <div class="flex gap-2.5">
                  <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {{ activity.rainWarning }} {{ activity.uvWarning }}
                  </span>
                </div>
              </div>

              <!-- Hourly Weather Section Header -->
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
                  <Clock class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span class="text-[8.5px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Prakiraan 4 Jam Terdekat</span>
                </div>
                <div class="flex-grow h-px bg-gradient-to-r from-indigo-200/60 dark:from-indigo-800/40 to-transparent"></div>
              </div>

              <!-- Hourly Weather Display (Timeline Cards) -->
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="hour in activity.hourly"
                  :key="hour.time"
                  class="p-3.5 rounded-[4px] border bg-slate-50/50 dark:bg-brand-navy-900/40 border-slate-100/60 dark:border-brand-navy-800/50 text-left relative flex flex-col justify-between min-h-[92px]"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-slate-400 dark:text-slate-500">{{ hour.time }}</span>
                    <span v-if="hour.isCurrent" class="px-1.5 py-0.5 rounded-md text-[7px] font-black tracking-widest uppercase bg-blue-500 text-white dark:bg-brand-cyan dark:text-slate-950 scale-90">Sekarang</span>
                  </div>
                  
                  <div class="flex items-center gap-2 mt-2">
                    <component :is="hour.icon" class="w-6 h-6 text-blue-500 dark:text-brand-cyan shrink-0" />
                    <div>
                      <div class="text-sm font-black text-slate-800 dark:text-white leading-none">{{ hour.temp }}°</div>
                      <div class="text-[8.5px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 leading-none">Suhu</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-2 mt-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                    <div class="flex items-center gap-0.5">
                      <component :is="hour.windDirIcon" class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{{ hour.windSpeed }} km/h</span>
                    </div>
                    <div>Hujan: {{ (hour.rain * 100).toFixed(0) }}%</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { 
  Activity, 
  Compass, 
  Waves, 
  ShieldCheck, 
  ChevronDown, 
  BookOpen, 
  Clock, 
  MapPin,
  X,
  Globe
} from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  getSeismicZoneInfo, 
  getEarthquakeHistoryFromList, 
  fetchRealtimeEarthquakes,
  calculateDistance,
  getCityCoordinates,
  type HistoryEvent,
  type EarthquakeEvent
} from '../data/earthquakeData';

const props = defineProps<{
  selectedCity: string;
  userLat?: number | null;
  userLng?: number | null;
}>();

// Real-time API States
const isLoading = ref(true);
const earthquakesList = ref<EarthquakeEvent[]>([]);

onMounted(async () => {
  try {
    isLoading.value = true;
    earthquakesList.value = await fetchRealtimeEarthquakes();
  } catch (error) {
    console.error("Failed loading earthquakes:", error);
  } finally {
    isLoading.value = false;
  }
});

// Latest Global/National Earthquake
const latestGlobalEvent = computed<HistoryEvent | null>(() => {
  if (earthquakesList.value.length === 0) return null;
  const latest = earthquakesList.value[0];
  const cityCoords = getCityCoordinates(props.selectedCity, props.userLat, props.userLng);
  const dist = calculateDistance(cityCoords.lat, cityCoords.lng, latest.lat, latest.lng);
  return {
    ...latest,
    distance: dist
  };
});

// Dynamic hazard zone info based on city
const seismicInfo = computed(() => {
  return getSeismicZoneInfo(props.selectedCity);
});

// Dynamic closest earthquakes list
const historyEvents = computed(() => {
  return getEarthquakeHistoryFromList(earthquakesList.value, props.selectedCity, props.userLat, props.userLng).slice(0, 3);
});

// Modal state
const isModalOpen = ref(false);
const selectedEvent = ref<HistoryEvent | null>(null);
const showSafety = ref(false);

// Map Modal state
const isMapModalOpen = ref(false);
const isDrawerMinimized = ref(true);
let leafletMap: L.Map | null = null;
let tileLayer: L.TileLayer | null = null;
let themeObserver: MutationObserver | null = null;
const markerMap = new Map<string, L.CircleMarker>();

const openDetailModal = (event: HistoryEvent) => {
  selectedEvent.value = event;
  isModalOpen.value = true;
  showSafety.value = false;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedEvent.value = null;
};

const openMapModal = async () => {
  isMapModalOpen.value = true;
  isDrawerMinimized.value = true;
  await nextTick();
  initLeafletMap();
};

const closeMapModal = () => {
  destroyLeafletMap();
  isMapModalOpen.value = false;
};

// --- Detail Drawer Map State & Handlers ---
const detailMapEl = ref<HTMLElement | null>(null);
let detailMap: L.Map | null = null;
let detailTileLayer: L.TileLayer | null = null;
let detailMarker: L.Marker | null = null;

const initDetailMap = () => {
  if (!detailMapEl.value || !selectedEvent.value) return;
  
  if (detailMap) {
    detailMap.setView([selectedEvent.value.lat, selectedEvent.value.lng], 9);
    updateDetailMarker();
    return;
  }

  detailMap = L.map(detailMapEl.value, {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    touchZoom: false
  }).setView([selectedEvent.value.lat, selectedEvent.value.lng], 9);

  updateDetailMapTheme();
  updateDetailMarker();

  detailMap.whenReady(() => {
    detailMap?.invalidateSize();
  });
};

const updateDetailMarker = () => {
  if (!detailMap || !selectedEvent.value) return;
  if (detailMarker) {
    detailMap.removeLayer(detailMarker);
  }

  const markerColor = selectedEvent.value.magnitude >= 6 ? '#ef4444' : (selectedEvent.value.magnitude >= 5 ? '#f59e0b' : '#3b82f6');
  const pulseHtml = `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-75" style="background-color: ${markerColor}"></span>
      <div class="relative w-4 h-4 rounded-full border border-white shadow-md" style="background-color: ${markerColor}"></div>
    </div>
  `;
  const detailIcon = L.divIcon({
    html: pulseHtml,
    className: 'custom-detail-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  detailMarker = L.marker([selectedEvent.value.lat, selectedEvent.value.lng], { icon: detailIcon }).addTo(detailMap);
};

const updateDetailMapTheme = () => {
  if (!detailMap) return;
  const isDarkMode = document.documentElement.classList.contains('dark');
  const lightUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const darkUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  const selectedUrl = isDarkMode ? darkUrl : lightUrl;

  if (detailTileLayer) {
    detailMap.removeLayer(detailTileLayer);
  }

  detailTileLayer = L.tileLayer(selectedUrl, {
    maxZoom: 18
  }).addTo(detailMap);
};

const destroyDetailMap = () => {
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
  }
  detailTileLayer = null;
  detailMarker = null;
};

watch(
  () => [isModalOpen.value, selectedEvent.value] as const,
  async ([isOpenVal, eventVal]) => {
    if (isOpenVal && eventVal) {
      await nextTick();
      setTimeout(() => {
        initDetailMap();
      }, 350); // Matches the drawer right slide animation duration
    } else {
      destroyDetailMap();
    }
  }
);

const updateMapTheme = () => {
  if (!leafletMap) return;
  const isDarkMode = document.documentElement.classList.contains('dark');
  const lightUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  const selectedUrl = isDarkMode ? darkUrl : lightUrl;

  if (tileLayer) {
    leafletMap.removeLayer(tileLayer);
  }

  tileLayer = L.tileLayer(selectedUrl, {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors &copy; ESRI'
  }).addTo(leafletMap);
};

const initLeafletMap = () => {
  if (leafletMap) return;

  // Always use CITY coordinates for map center (not GPS) — so "Medan" centers on Medan
  const cityCoords = getCityCoordinates(props.selectedCity);
  
  // GPS coords exist separately — only used if user selected "Lokasi Saya"
  const isRealLocation = !!(props.userLat && props.userLng);
  const hasGPSDifferentFromCity = isRealLocation && (
    Math.abs((props.userLat ?? 0) - cityCoords.lat) > 0.1 ||
    Math.abs((props.userLng ?? 0) - cityCoords.lng) > 0.1
  );

  // Initialize Map — always center on selected city
  const mapInstance = L.map('eq-leaflet-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([cityCoords.lat, cityCoords.lng], 5);

  leafletMap = mapInstance;

  // Apply active theme layer
  updateMapTheme();

  // Listen for live theme switching
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      updateMapTheme();
      updateDetailMapTheme();
      // Close any open popup so next open picks up the new theme colors
      if (leafletMap) leafletMap.closePopup();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Zoom control at bottom right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(mapInstance);

  // --- Marker 1: Selected City (always shown) ---
  const cityIcon = L.divIcon({
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; gap:3px;">
        <div style="position:relative; width:22px; height:22px;">
          <span style="position:absolute; inset:0; border-radius:50%; background:#06b6d4; opacity:0.3; animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <span style="position:absolute; inset:3px; border-radius:50%; background:#06b6d4; border: 2.5px solid white; box-shadow: 0 0 0 2px #06b6d4, 0 2px 8px rgba(6,182,212,0.5);"></span>
        </div>
        <span style="background:#06b6d4; color:white; font-size:8px; font-weight:900; padding:1.5px 6px; border-radius:20px; white-space:nowrap; box-shadow:0 1px 4px rgba(6,182,212,0.4); letter-spacing:0.4px; text-transform:uppercase; max-width:90px; overflow:hidden; text-overflow:ellipsis;">${props.selectedCity.split(',')[0]}</span>
      </div>
    `,
    className: '',
    iconSize: [100, 44],
    iconAnchor: [50, 11]
  });

  const isDarkMap = document.documentElement.classList.contains('dark');
  const mapTextPrimary = isDarkMap ? '#f1f5f9' : '#1e293b';
  const mapTextMuted   = isDarkMap ? '#94a3b8' : '#64748b';
  const mapCardBg      = isDarkMap ? 'rgba(15,23,42,0.98)' : '#ffffff';
  const mapCardBorder  = isDarkMap ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const mapCardShadow  = isDarkMap ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15,23,42,0.10)';

  const cityMarker = L.marker([cityCoords.lat, cityCoords.lng], { icon: cityIcon }).addTo(mapInstance);
  cityMarker.bindPopup(`
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; padding: 10px 12px; min-width:160px; background:${mapCardBg}; border:1px solid ${mapCardBorder}; border-radius:12px; box-shadow:${mapCardShadow};">
      <div style="display:flex; align-items:center; gap:5px; margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid ${mapCardBorder};">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#06b6d4; flex-shrink:0; box-shadow:0 0 6px rgba(6,182,212,0.5);"></span>
        <b style="color:#06b6d4; font-size:9.5px; text-transform:uppercase; letter-spacing:0.5px;">🏙️ Kota Terpilih</b>
      </div>
      <div style="color:${mapTextPrimary}; font-weight:800; font-size:11.5px; margin-bottom:3px;">${props.selectedCity}</div>
      <div style="color:${mapTextMuted}; font-size:9px;">${cityCoords.lat.toFixed(4)}°, ${cityCoords.lng.toFixed(4)}°</div>
    </div>
  `);

  // --- Marker 2: Real GPS Location (only if different from selected city) ---
  if (hasGPSDifferentFromCity && props.userLat && props.userLng) {
    const gpsIcon = L.divIcon({
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; gap:3px;">
          <div style="position:relative; width:18px; height:18px;">
            <span style="position:absolute; inset:0; border-radius:50%; background:#f59e0b; opacity:0.3; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <span style="position:absolute; inset:3px; border-radius:50%; background:#f59e0b; border: 2px solid white; box-shadow: 0 0 0 2px #f59e0b, 0 2px 6px rgba(245,158,11,0.5);"></span>
          </div>
          <span style="background:#f59e0b; color:white; font-size:7.5px; font-weight:900; padding:1px 5px; border-radius:20px; white-space:nowrap; box-shadow:0 1px 3px rgba(245,158,11,0.4); letter-spacing:0.3px; text-transform:uppercase;">GPS Anda</span>
        </div>
      `,
      className: '',
      iconSize: [80, 38],
      iconAnchor: [40, 9]
    });

    const gpsMarker = L.marker([props.userLat, props.userLng], { icon: gpsIcon }).addTo(mapInstance);
    gpsMarker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; padding: 10px 12px; min-width:170px; background:${mapCardBg}; border:1px solid ${mapCardBorder}; border-radius:12px; box-shadow:${mapCardShadow};">
        <div style="display:flex; align-items:center; gap:5px; margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid ${mapCardBorder};">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f59e0b; flex-shrink:0; box-shadow:0 0 6px rgba(245,158,11,0.5);"></span>
          <b style="color:#f59e0b; font-size:9.5px; text-transform:uppercase; letter-spacing:0.5px;">📍 Lokasi GPS Anda</b>
        </div>
        <div style="color:${mapTextPrimary}; font-weight:800; font-size:11.5px; margin-bottom:3px;">Posisi Anda Sekarang</div>
        <div style="color:${mapTextMuted}; font-size:9px;">${props.userLat.toFixed(6)}°, ${props.userLng.toFixed(6)}°</div>
      </div>
    `);
  }


  // Draw earthquake markers and polylines from the earthquakesList
  earthquakesList.value.forEach(eq => {
    let color = '#0ea5e9'; // sky/blue
    if (eq.magnitude >= 6) {
      color = '#ef4444'; // red
    } else if (eq.magnitude >= 5) {
      color = '#f59e0b'; // orange/amber
    }

    const radius = Math.max(5, eq.magnitude * 2);
    const dist = calculateDistance(cityCoords.lat, cityCoords.lng, eq.lat, eq.lng);

    // Epicenter marker
    const eqMarker = L.circleMarker([eq.lat, eq.lng], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.7,
      weight: 1.5
    }).addTo(mapInstance);

    // --- Theme-aware popup colors ---
    const isDark = document.documentElement.classList.contains('dark');
    const popupBg      = isDark ? 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' : 'linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)';
    const popupBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)';
    const popupShadow  = isDark ? '0 20px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.05) inset'
                                : '0 8px 30px rgba(15,23,42,0.12),0 0 0 1px rgba(15,23,42,0.04) inset';
    const textPrimary  = isDark ? '#f8fafc' : '#0f172a';
    const textSecond   = isDark ? '#cbd5e1' : '#475569';
    const textMuted    = isDark ? '#64748b' : '#94a3b8';
    const dividerClr   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)';
    const statBg       = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
    const statBorder   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)';
    const distValueClr = dist < 100 ? '#f87171' : textPrimary;
    const distBg       = dist < 100 ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)') : statBg;
    const distBorder   = dist < 100 ? (isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)') : statBorder;

    eqMarker.bindPopup(`
      <div style="
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: ${popupBg};
        border: 1px solid ${popupBorder};
        border-radius: 16px;
        padding: 14px 16px;
        min-width: 210px;
        box-shadow: ${popupShadow};
        color: ${textSecond};
        position: relative;
        overflow: hidden;
      ">
        <!-- Top accent line -->
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${color},transparent);border-radius:16px 16px 0 0;"></div>

        <!-- Header row: badge + label -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="
            background: ${color}22;
            border: 1px solid ${color}55;
            border-radius: 10px;
            padding: 5px 9px;
            display:flex;flex-direction:column;align-items:center;
            box-shadow: 0 0 12px ${color}33;
            min-width: 44px;
          ">
            <span style="font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:${color};line-height:1;">Mag</span>
            <span style="font-size:15px;font-weight:900;color:${color};line-height:1.1;">${eq.magnitude.toFixed(1)}</span>
          </div>
          <div>
            <div style="font-size:8px;font-weight:800;text-transform:uppercase;color:${color};letter-spacing:0.6px;">Gempa Bumi Dirasakan</div>
            <div style="font-size:11px;font-weight:900;color:${textPrimary};margin-top:2px;">${eq.date}</div>
          </div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,${dividerClr},transparent);margin-bottom:10px;"></div>

        <!-- Epicenter -->
        <div style="font-size:10.5px;font-weight:700;color:${textSecond};margin-bottom:8px;line-height:1.4;">
          📍 ${eq.epicenter}
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div style="background:${statBg};border:1px solid ${statBorder};border-radius:8px;padding:6px 8px;">
            <div style="font-size:7.5px;font-weight:700;color:${textMuted};text-transform:uppercase;letter-spacing:0.4px;">Kedalaman</div>
            <div style="font-size:11px;font-weight:900;color:${textPrimary};margin-top:2px;">${eq.depth} km</div>
          </div>
          <div style="background:${distBg};border:1px solid ${distBorder};border-radius:8px;padding:6px 8px;">
            <div style="font-size:7.5px;font-weight:700;color:${textMuted};text-transform:uppercase;letter-spacing:0.4px;">Jarak</div>
            <div style="font-size:11px;font-weight:900;color:${distValueClr};margin-top:2px;">${dist} km</div>
          </div>
        </div>
      </div>
    `, {
      className: 'premium-eq-popup',
      maxWidth: 260
    });

    // Cache the marker reference
    markerMap.set(eq.id, eqMarker);

    // Polyline connector (dashed line from user coordinates to epicenter)
    const polyline = L.polyline([[cityCoords.lat, cityCoords.lng], [eq.lat, eq.lng]], {
      color: color,
      weight: 1,
      dashArray: '4, 6',
      opacity: 0.4
    }).addTo(mapInstance);

    polyline.bindTooltip(`${dist} km dari Anda`, {
      sticky: true,
      className: 'custom-polyline-tooltip'
    });
  });

  // Force Leaflet container resizing invalidate size
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize();
  }, 250);
};

const destroyLeafletMap = () => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (leafletMap) {
    leafletMap.off();
    leafletMap.remove();
    leafletMap = null;
  }
  tileLayer = null;
  markerMap.clear();
  destroyDetailMap();
};

const flyToEpicenter = (eq: EarthquakeEvent) => {
  if (leafletMap) {
    leafletMap.flyTo([eq.lat, eq.lng], 7, {
      animate: true,
      duration: 1.5
    });
    
    // Open marker popup after camera movement completes
    setTimeout(() => {
      const marker = markerMap.get(eq.id);
      if (marker && leafletMap) {
        marker.openPopup();
      }
    }, 1500);
  }
};

onUnmounted(() => {
  destroyLeafletMap();
});

// Map warning status classes
const getHazardBadgeClass = (status: 'Tinggi' | 'Sedang' | 'Rendah') => {
  switch (status) {
    case 'Tinggi':
      return 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400';
    case 'Sedang':
      return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
    case 'Rendah':
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-450';
  }
};

const getHazardPulseClass = (status: 'Tinggi' | 'Sedang' | 'Rendah') => {
  switch (status) {
    case 'Tinggi': return 'bg-red-500';
    case 'Sedang': return 'bg-amber-400';
    case 'Rendah': return 'bg-emerald-400';
  }
};

const getMmiWidth = (mmi: string) => {
  if (mmi.includes('V')) return 'w-5/6 bg-red-500';
  if (mmi.includes('IV')) return 'w-4/6 bg-orange-500';
  if (mmi.includes('III')) return 'w-3/6 bg-amber-500';
  return 'w-2/6 bg-yellow-500';
};
</script>

<template>
  <div 
    class="relative w-full rounded-3xl p-5 overflow-hidden border border-white/10 dark:border-brand-navy-800/40 backdrop-blur-xl text-left bg-white/80 dark:bg-brand-navy-900/60 transition-all duration-300 hover:border-white/15 dark:hover:border-brand-navy-850/50"
  >
    <!-- Top Glow Border Line -->
    <div 
      class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent rounded-t-2xl"
      :class="{
        'via-red-500/50 dark:via-red-500/40': seismicInfo.status === 'Tinggi',
        'via-amber-500/50 dark:via-amber-500/40': seismicInfo.status === 'Sedang',
        'via-emerald-500/50 dark:via-emerald-500/40': seismicInfo.status === 'Rendah',
      }"
    ></div>

    <!-- Seismic Ambient Wave Overlay -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]" aria-hidden="true">
      <svg viewBox="0 0 100 100" class="w-full h-full" preserveAspectRatio="none">
        <path d="M0,50 Q10,40 20,60 T40,50 T60,30 T80,70 T100,50" fill="none" stroke="currentColor" stroke-width="0.8" />
        <path d="M0,60 Q15,45 30,55 T60,45 T75,65 T100,60" fill="none" stroke="currentColor" stroke-width="0.5" />
      </svg>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-brand-navy-800/60 relative z-20">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-red-500/10 text-red-500 dark:text-red-400">
          <Activity class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase">
            Risiko &amp; Riwayat Seismik
          </h4>
          <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
            Analisis Kerawanan Wilayah Terdekat
          </p>
        </div>
      </div>

      <!-- Right side: Hazard badge + Map icon button -->
      <div class="flex items-center gap-2">
        <span 
          class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all duration-300"
          :class="getHazardBadgeClass(seismicInfo.status)"
        >
          Kerawanan {{ seismicInfo.status }}
        </span>
        <div class="premium-tooltip-container">
          <button
            type="button"
            @click="openMapModal"
            class="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/30 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50"
          >
            <Globe class="w-4 h-4" />
          </button>
          <div class="premium-tooltip tooltip-bottom tooltip-right">
            <span>Lihat Peta Seismik</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Gempa Terakhir Nasional Banner -->
    <div 
      v-if="latestGlobalEvent"
      class="bg-slate-50/70 dark:bg-brand-navy-950/30 border border-slate-100 dark:border-brand-navy-800/30 hover:border-red-500/20 dark:hover:border-red-500/30 rounded-2xl p-3.5 mb-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-brand-navy-850/30 transition-all duration-300 relative z-10 group active:scale-[0.99]"
      @click="openDetailModal(latestGlobalEvent)"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-[8.5px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5 leading-none">
          <span class="relative flex h-1.5 w-1.5 shrink-0">
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          Gempa Bumi Terkini (Nasional)
        </span>
        <span class="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">
          {{ latestGlobalEvent.time }} • {{ latestGlobalEvent.date }}
        </span>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- magnitude badge -->
        <div class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 border bg-red-500/5 border-red-500/25 text-red-500 dark:text-red-400">
          <span class="text-[7.5px] font-black leading-none uppercase tracking-wider">Mag</span>
          <span class="text-xs font-black tracking-tight mt-0.5">{{ latestGlobalEvent.magnitude.toFixed(1) }}</span>
        </div>
        
        <div class="min-w-0 flex-1">
          <p class="text-[10.5px] font-extrabold text-slate-800 dark:text-white truncate">
            {{ latestGlobalEvent.epicenter }}
          </p>
          <p class="text-[9px] font-bold text-slate-400 dark:text-slate-550 mt-0.5 flex items-center gap-1.5 leading-none">
            <span>Kedalaman: {{ latestGlobalEvent.depth }} km</span>
            <span>•</span>
            <span class="text-blue-600 dark:text-cyan-400 font-black tracking-wide uppercase text-[7.5px]">Detail Parameter &rarr;</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Hazard Zone Description Banner -->
    <div 
      class="flex gap-2.5 p-3.5 rounded-2xl border mb-5 transition-all duration-300 relative z-10"
      :class="getHazardBadgeClass(seismicInfo.status)"
    >
      <div class="relative flex h-2.5 w-2.5 mt-1 shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="getHazardPulseClass(seismicInfo.status)"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="getHazardPulseClass(seismicInfo.status)"></span>
      </div>
      <div class="space-y-1">
        <h5 class="text-[10px] font-black tracking-wide leading-none uppercase">
          Struktur Geologi: {{ seismicInfo.faultLine }}
        </h5>
        <p class="text-[10.5px] font-medium leading-relaxed opacity-90">
          {{ seismicInfo.description }}
        </p>
      </div>
    </div>

    <!-- History list section -->
    <div class="relative z-10">
      <h5 class="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 block">
        Gempa Terdekat dari Koordinat Kota
      </h5>
      
      <!-- Premium loading skeleton for earthquake list -->
      <div v-if="isLoading" class="space-y-2.5 py-1">
        <!-- Animated BMKG connecting indicator -->
        <div class="flex items-center gap-2 mb-3 px-1">
          <div class="relative flex h-4 w-4 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500/20 text-red-500 items-center justify-center">
              <Activity class="w-2.5 h-2.5" />
            </span>
          </div>
          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase" style="animation: shimmer 1.6s ease-in-out infinite; background: linear-gradient(90deg, #94a3b8 0%, #64748b 50%, #94a3b8 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Menghubungkan ke BMKG...
          </span>
        </div>

        <!-- Skeleton rows mimicking earthquake list items -->
        <div
          v-for="i in 3" :key="i"
          class="flex items-center gap-3 py-2.5 px-2 rounded-2xl"
          :style="{ animationDelay: `${(i - 1) * 150}ms` }"
        >
          <!-- Dot / icon placeholder -->
          <div class="sk-block skeleton-shimmer w-9 h-9 rounded-xl shrink-0" :style="{ animationDelay: `${(i - 1) * 150}ms` }"></div>
          <!-- Text lines -->
          <div class="flex-1 space-y-2">
            <div class="sk-bar skeleton-shimmer h-2.5" :class="i === 1 ? 'w-3/4' : i === 2 ? 'w-2/3' : 'w-1/2'" :style="{ animationDelay: `${(i - 1) * 150 + 60}ms` }"></div>
            <div class="sk-bar skeleton-shimmer h-2 w-1/3" :style="{ animationDelay: `${(i - 1) * 150 + 120}ms` }"></div>
          </div>
          <!-- Badge placeholder -->
          <div class="sk-bar skeleton-shimmer h-5 w-10 rounded-lg shrink-0" :style="{ animationDelay: `${(i - 1) * 150 + 80}ms` }"></div>
        </div>
      </div>

      <!-- Premium earthquake list with timeline -->
      <div v-else class="relative flex flex-col">
        <!-- Timeline vertical connector line -->
        <div class="absolute left-[19px] top-5 bottom-5 w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent dark:from-brand-navy-700/60 dark:via-brand-navy-800/30 dark:to-transparent z-0 pointer-events-none"></div>

        <button 
          v-for="(eq, idx) in historyEvents" 
          :key="eq.id"
          type="button"
          @click="openDetailModal(eq)"
          class="eq-list-item relative w-full flex items-center gap-3 py-2.5 px-2 rounded-2xl text-left cursor-pointer group active:scale-[0.99] transition-all duration-300"
          :class="[
            'hover:bg-slate-50/80 dark:hover:bg-brand-navy-800/30',
            idx === 0 ? 'eq-item-1' : idx === 1 ? 'eq-item-2' : 'eq-item-3'
          ]"
          :style="{ animationDelay: `${idx * 90}ms` }"
        >
          <!-- Left accent bar (color by magnitude) -->
          <div 
            class="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            :class="[
              eq.magnitude >= 6 ? 'bg-gradient-to-b from-red-500 to-red-300'
              : eq.magnitude >= 5 ? 'bg-gradient-to-b from-amber-500 to-amber-300'
              : eq.magnitude >= 4 ? 'bg-gradient-to-b from-orange-400 to-orange-200'
              : 'bg-gradient-to-b from-sky-400 to-sky-200'
            ]"
          ></div>

          <!-- Magnitude badge with glow -->
          <div 
            class="relative w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 z-10"
            :class="[
              eq.magnitude >= 6 
                ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]' 
              : eq.magnitude >= 5 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              : eq.magnitude >= 4
                ? 'bg-orange-400/10 border-orange-400/30 text-orange-500 dark:text-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.15)] group-hover:shadow-[0_0_18px_rgba(251,146,60,0.3)]'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)] group-hover:shadow-[0_0_18px_rgba(14,165,233,0.3)]'
            ]"
          >
            <!-- Pulse ring for high magnitude -->
            <span 
              v-if="eq.magnitude >= 5" 
              class="absolute inset-0 rounded-2xl animate-ping opacity-20"
              :class="eq.magnitude >= 6 ? 'bg-red-500' : 'bg-amber-500'"
            ></span>
            <span class="text-[7px] font-black leading-none uppercase tracking-wider">Mag</span>
            <span class="text-[13px] font-black tracking-tight mt-0.5">{{ eq.magnitude.toFixed(1) }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-[10.5px] font-extrabold text-slate-800 dark:text-white truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {{ eq.epicenter }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5 text-[8.5px] font-bold text-slate-400 dark:text-slate-500">
              <span class="flex items-center gap-0.5"><Clock class="w-2.5 h-2.5" />{{ eq.time }}</span>
              <span>•</span>
              <span>{{ eq.date }}</span>
            </div>
            <!-- Distance mini bar -->
            <div class="mt-1.5 flex items-center gap-2">
              <div class="flex-1 h-[3px] rounded-full bg-slate-100 dark:bg-brand-navy-800/60 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-700 ease-out"
                  :class="[
                    eq.distance < 100 ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : eq.distance < 300 ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                    : 'bg-gradient-to-r from-sky-400 to-cyan-300'
                  ]"
                  :style="{ width: Math.min((eq.distance / 1000) * 100, 100) + '%' }"
                ></div>
              </div>
              <span 
                class="text-[8px] font-extrabold shrink-0"
                :class="[
                  eq.distance < 100 ? 'text-red-500 dark:text-red-400'
                  : eq.distance < 300 ? 'text-amber-500 dark:text-amber-400'
                  : 'text-sky-500 dark:text-sky-400'
                ]"
              >{{ eq.distance }} km</span>
            </div>
          </div>

          <!-- Chevron -->
          <ChevronDown class="w-4 h-4 text-slate-300 dark:text-slate-600 -rotate-90 group-hover:translate-x-0.5 group-hover:text-slate-400 transition-all shrink-0" />
        </button>
      </div>

    </div>

    <!-- ─── Leaflet Map Drawer Overlay ─── -->
    <Teleport to="body">
      <Transition name="map-fade" appear>
        <div v-if="isMapModalOpen" class="fixed inset-0 z-[9999] bg-slate-900 overflow-hidden text-slate-100 font-sans flex flex-col justify-between fullscreen-map-container">
          
          <!-- Background Leaflet Map -->
          <div class="absolute inset-0 w-full h-full z-0 bg-slate-855">
            <div id="eq-leaflet-map" class="w-full h-full"></div>
          </div>

          <div class="absolute right-4 top-4 z-50 premium-tooltip-container map-close-btn">
            <button 
              type="button"
              @click="closeMapModal"
              class="w-10 h-10 rounded-full bg-slate-900/95 text-white flex items-center justify-center border border-slate-700/40 backdrop-blur-md shadow-lg hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
            <div class="premium-tooltip tooltip-bottom">
              <span>Tutup Peta</span>
            </div>
          </div>
          
          <!-- Left Side Column: Slide-out Drawer Panel + Legend Card -->
          <div 
            v-if="isMapModalOpen"
            class="absolute left-4 bottom-4 top-4 md:left-6 md:bottom-6 md:top-6 z-45 flex flex-col justify-end gap-3 w-[calc(100%-32px)] md:w-[420px] pointer-events-none"
          >
            <!-- Slide-out Side Drawer Panel -->
            <Transition name="drawer-slide" appear>
              <div 
                v-if="isMapModalOpen"
                :class="[
                  isDrawerMinimized ? 'h-[88px] max-h-[88px]' : 'h-[75vh] max-h-[75vh]',
                  'w-full bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-xl border border-white/10 dark:border-brand-navy-850/50 shadow-2xl rounded-3xl flex flex-col overflow-hidden text-left pointer-events-auto md:h-full md:max-h-[calc(100vh-140px)] animate-fade-in transition-all duration-300'
                ]"
              >
                <!-- Drag Handle / Visual top line -->
                <div 
                  @click="isDrawerMinimized = !isDrawerMinimized"
                  class="py-3 flex items-center justify-center shrink-0 cursor-pointer select-none hover:bg-slate-500/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div class="w-16 h-1 rounded-full bg-slate-300 dark:bg-slate-500/90"></div>
                </div>

                <!-- Sticky Header -->
                <div 
                  @click="isDrawerMinimized ? (isDrawerMinimized = false) : null"
                  :class="[
                    isDrawerMinimized ? 'cursor-pointer hover:bg-slate-500/5 dark:hover:bg-white/5 transition-colors' : '',
                    'px-5 pb-3.5 border-b border-slate-100/50 dark:border-brand-navy-800/40 flex items-center justify-between gap-2 shrink-0 select-none'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <div class="p-2 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/10">
                      <Globe class="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">
                        Peta Seismik Nasional
                      </h4>
                      <div class="flex items-center gap-1 mt-0.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                        <MapPin class="w-3 h-3 text-brand-cyan" />
                        <span>Posisi Episentrum Relatif ke {{ props.selectedCity }}</span>
                      </div>
                    </div>
                  </div>
                  <!-- Mini chevron indicator for state (mobile only) -->
                  <button 
                    type="button"
                    @click.stop="isDrawerMinimized = !isDrawerMinimized"
                    class="md:hidden p-1.5 rounded-lg bg-slate-50 dark:bg-brand-navy-800/60 border border-slate-200/40 dark:border-brand-navy-700/30 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer active:scale-95 transition-all"
                  >
                    <ChevronDown 
                      class="w-3.5 h-3.5 transition-transform duration-300"
                      :class="{ 'rotate-180': isDrawerMinimized }"
                    />
                  </button>
                </div>

                <!-- Content Area (Scrollable List Only) -->
                <div class="flex-grow overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
                  <!-- List of Earthquakes for FlyTo interaction -->
                  <!-- Premium earthquake list -->
                  <div class="relative flex flex-col gap-1.5">
                    <!-- Timeline spine -->
                    <div class="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-slate-200/80 via-slate-100/40 to-transparent dark:from-brand-navy-700/50 dark:via-brand-navy-800/20 dark:to-transparent pointer-events-none z-0"></div>

                    <button 
                      v-for="(eq, idx) in earthquakesList" 
                      :key="eq.id"
                      type="button"
                      @click="flyToEpicenter(eq)"
                      class="map-eq-item relative w-full flex items-center gap-3 py-2.5 px-2 rounded-2xl text-left cursor-pointer group active:scale-[0.99] transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-brand-navy-800/30"
                      :style="{ animationDelay: `${idx * 60}ms` }"
                    >
                      <!-- Left accent bar -->
                      <div 
                        class="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        :class="[
                          eq.magnitude >= 6 ? 'bg-gradient-to-b from-red-500 to-red-300'
                          : eq.magnitude >= 5 ? 'bg-gradient-to-b from-amber-500 to-amber-300'
                          : eq.magnitude >= 4 ? 'bg-gradient-to-b from-orange-400 to-orange-200'
                          : 'bg-gradient-to-b from-sky-400 to-sky-200'
                        ]"
                      ></div>

                      <!-- Magnitude badge with glow -->
                      <div 
                        class="relative w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 z-10"
                        :class="[
                          eq.magnitude >= 6 
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)] group-hover:shadow-[0_0_18px_rgba(239,68,68,0.30)]' 
                          : eq.magnitude >= 5 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_18px_rgba(245,158,11,0.30)]'
                          : eq.magnitude >= 4
                            ? 'bg-orange-400/10 border-orange-400/30 text-orange-500 dark:text-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.10)] group-hover:shadow-[0_0_16px_rgba(251,146,60,0.25)]'
                          : 'bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.10)] group-hover:shadow-[0_0_16px_rgba(14,165,233,0.25)]'
                        ]"
                      >
                        <!-- Pulse ring for M≥5 -->
                        <span 
                          v-if="eq.magnitude >= 5" 
                          class="absolute inset-0 rounded-2xl animate-ping opacity-15"
                          :class="eq.magnitude >= 6 ? 'bg-red-500' : 'bg-amber-500'"
                        ></span>
                        <span class="text-[7px] font-black leading-none uppercase tracking-wider">Mag</span>
                        <span class="text-[13px] font-black tracking-tight mt-0.5 leading-none">{{ eq.magnitude.toFixed(1) }}</span>
                      </div>

                      <!-- Content -->
                      <div class="flex-1 min-w-0">
                        <!-- Index + epicenter row -->
                        <div class="flex items-start gap-1.5">
                          <span class="text-[8px] font-black text-slate-300 dark:text-slate-600 shrink-0 mt-[1px] tabular-nums">#{{ idx + 1 }}</span>
                          <p class="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                            {{ eq.epicenter }}
                          </p>
                        </div>
                        <div class="flex items-center gap-1 mt-1 text-[8px] font-bold text-slate-400 dark:text-slate-500">
                          <Clock class="w-2.5 h-2.5" />
                          <span>{{ eq.time }}</span>
                          <span>•</span>
                          <span>{{ eq.date }}</span>
                        </div>
                        <!-- Depth indicator strip -->
                        <div class="mt-1.5 h-[2.5px] rounded-full overflow-hidden bg-slate-100 dark:bg-brand-navy-800/50">
                          <div 
                            class="h-full rounded-full"
                            :class="[
                              eq.magnitude >= 6 ? 'bg-gradient-to-r from-red-500 to-red-300'
                              : eq.magnitude >= 5 ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                              : eq.magnitude >= 4 ? 'bg-gradient-to-r from-orange-400 to-amber-200'
                              : 'bg-gradient-to-r from-sky-400 to-cyan-300'
                            ]"
                            :style="{ width: Math.min(eq.magnitude * 12, 100) + '%' }"
                          ></div>
                        </div>
                      </div>

                      <!-- Chevron -->
                      <ChevronDown class="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 -rotate-90 group-hover:translate-x-0.5 group-hover:text-slate-400 transition-all shrink-0" />
                    </button>
                  </div>

                </div>
              </div>
            </Transition>

            <!-- Floating Map Legend Card (Outside & Below Drawer) -->
            <Transition name="fade-scale" appear>
              <div 
                v-if="isMapModalOpen"
                class="w-full bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-xl border border-white/20 dark:border-brand-navy-850/50 shadow-xl rounded-2xl p-3.5 text-slate-800 dark:text-slate-100 transition-all duration-300 pointer-events-auto shrink-0"
                :class="[isDrawerMinimized ? 'hidden md:block' : 'block']"
              >
                <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2.5">
                  Legenda Kekuatan Gempa
                </span>
                <div class="grid grid-cols-3 gap-2">
                  <!-- Kuat -->
                  <div class="flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl bg-gradient-to-b from-red-500/10 to-red-500/5 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.08)]">
                    <div class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span class="text-[8.5px] font-black text-red-600 dark:text-red-400 leading-none">M ≥ 6.0</span>
                    <span class="text-[7px] font-bold text-red-400/70 dark:text-red-500/60 leading-none uppercase tracking-wide">Kuat</span>
                  </div>
                  <!-- Sedang -->
                  <div class="flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.08)]">
                    <div class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    <span class="text-[8.5px] font-black text-amber-600 dark:text-amber-400 leading-none">M ≥ 5.0</span>
                    <span class="text-[7px] font-bold text-amber-400/70 dark:text-amber-500/60 leading-none uppercase tracking-wide">Sedang</span>
                  </div>
                  <!-- Kecil -->
                  <div class="flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl bg-gradient-to-b from-sky-500/10 to-sky-500/5 border border-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.08)]">
                    <div class="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
                    <span class="text-[8.5px] font-black text-sky-600 dark:text-sky-400 leading-none">M &lt; 5.0</span>
                    <span class="text-[7px] font-bold text-sky-400/70 dark:text-sky-500/60 leading-none uppercase tracking-wide">Kecil</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Modal Detail Popup ─── -->
    <Teleport to="body">
      <div v-if="isModalOpen && selectedEvent" class="fixed inset-0 z-[9999] overflow-hidden flex flex-col justify-end md:flex-row md:justify-end">
        <!-- Backdrop -->
        <Transition name="drawer-fade" appear>
          <div
            v-if="isModalOpen && selectedEvent"
            class="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm cursor-default"
            @click="closeModal"
          />
        </Transition>

        <!-- Drawer Panel -->
        <Transition name="drawer-slide" appear>
          <div
            v-if="isModalOpen && selectedEvent"
            class="relative w-full h-full md:max-w-lg bg-white/95 dark:bg-brand-navy-950/95 md:border-l border-none shadow-2xl text-slate-800 dark:text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+20px)] px-5 pb-safe md:pt-6 md:px-6 md:pb-0 flex flex-col justify-between overflow-hidden rounded-none side-advisor-drawer"
          >
            <!-- Ambient glow -->
            <div 
              class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              :class="selectedEvent.magnitude >= 6 ? 'bg-red-500/10' : (selectedEvent.magnitude >= 5 ? 'bg-amber-500/10' : 'bg-blue-500/10')"
            />

            <!-- Close button -->
            <button
              @click="closeModal"
              class="absolute top-[calc(env(safe-area-inset-top,16px)+4px)] right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10 md:top-4"
            >
              <X class="w-4 h-4" />
            </button>

            <!-- Header -->
            <div class="mb-4 pr-8 text-left">
              <!-- Title & Icon Row -->
              <div class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-brand-navy-900/30">
                <div 
                  class="p-2.5 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm"
                  :class="selectedEvent.magnitude >= 6 
                    ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 dark:from-red-400/20 dark:to-orange-400/10 border-red-500/25 dark:border-red-400/25 text-red-500' 
                    : 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 dark:from-amber-400/20 dark:to-yellow-400/10 border-amber-500/25 dark:border-amber-400/25 text-amber-500'"
                >
                  <Activity class="w-5 h-5 animate-pulse" />
                </div>
                <div class="text-left min-w-0 flex-grow">
                  <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-red-500 dark:text-red-400 block">Laporan Parameter Gempa</span>
                  <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                    BMKG Pusat • Jarak {{ selectedEvent.distance }} km dari Anda
                  </h3>
                </div>
              </div>
            </div>

            <!-- Scrollable Content -->
            <div
              class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 pb-12 text-left no-scrollbar"
              style="will-change: scroll-position; -webkit-overflow-scrolling: touch;"
            >
              <!-- 3-Column stats -->
              <div class="grid grid-cols-3 gap-3">
                <!-- Magnitude -->
                <div class="bg-slate-50/50 dark:bg-brand-navy-900/40 border border-slate-100/50 dark:border-brand-navy-850/20 rounded-2xl p-3 flex flex-col items-center text-center justify-between">
                  <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Kekuatan</span>
                  <div class="my-1.5 flex items-center justify-center relative w-12 h-12">
                    <div 
                      class="absolute inset-0 rounded-full border-2 border-slate-200/50 dark:border-brand-navy-800/40 flex items-center justify-center"
                      :class="selectedEvent.magnitude >= 6 ? 'border-red-500/20 animate-pulse' : 'border-amber-500/20'"
                    ></div>
                    <span 
                      class="text-sm font-black tracking-tight"
                      :class="selectedEvent.magnitude >= 6 ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'"
                    >
                      M {{ selectedEvent.magnitude.toFixed(1) }}
                    </span>
                  </div>
                  <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400">Skala Richter</span>
                </div>

                <!-- Depth -->
                <div class="bg-slate-50/50 dark:bg-brand-navy-900/40 border border-slate-100/50 dark:border-brand-navy-850/20 rounded-2xl p-3 flex flex-col items-center text-center justify-between">
                  <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Kedalaman</span>
                  <div class="my-1.5 flex flex-col items-center gap-0.5 justify-center h-12">
                    <Compass class="w-5 h-5 text-indigo-400 dark:text-brand-cyan" />
                    <span class="text-[11px] font-black text-slate-800 dark:text-white tracking-tight mt-0.5">{{ selectedEvent.depth }} Km</span>
                  </div>
                  <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400">
                    {{ selectedEvent.depth <= 70 ? 'Dangkal' : 'Menengah' }}
                  </span>
                </div>

                <!-- Tsunami -->
                <div class="bg-slate-50/50 dark:bg-brand-navy-900/40 border border-slate-100/50 dark:border-brand-navy-850/20 rounded-2xl p-3 flex flex-col items-center text-center justify-between">
                  <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Tsunami</span>
                  <div class="my-1.5 flex flex-col items-center gap-0.5 justify-center h-12">
                    <ShieldCheck v-if="!selectedEvent.tsunamiPotential" class="w-5 h-5 text-emerald-500" />
                    <Waves v-else class="w-5 h-5 text-red-500 animate-bounce" />
                    <span 
                      class="text-[8px] font-black uppercase tracking-tight mt-0.5"
                      :class="selectedEvent.tsunamiPotential ? 'text-red-500' : 'text-emerald-500 dark:text-emerald-400'"
                    >
                      {{ selectedEvent.tsunamiPotential ? 'WASPADA' : 'AMAN' }}
                    </span>
                  </div>
                  <span class="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 max-w-[50px] truncate">
                    {{ selectedEvent.tsunamiPotential ? 'Berpotensi' : 'Tidak Berpotensi' }}
                  </span>
                </div>
              </div>

              <!-- Epicenter and Coordinates Info -->
              <div class="flex items-center gap-3 bg-slate-50/50 dark:bg-brand-navy-900/40 border border-slate-100/50 dark:border-brand-navy-850/20 rounded-2xl p-3">
                <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 dark:text-brand-cyan flex items-center justify-center shrink-0">
                  <MapPin class="w-4.5 h-4.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-1">Pusat Episentrum</p>
                  <p class="text-[10px] font-black text-slate-800 dark:text-white truncate">{{ selectedEvent.epicenter }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5 text-[8px] font-semibold text-slate-500 dark:text-slate-400">
                    <span class="flex items-center gap-0.5"><Clock class="w-2.5 h-2.5 text-slate-400" />{{ selectedEvent.time }}</span>
                    <span>•</span>
                    <span>{{ selectedEvent.date }}</span>
                  </div>
                </div>
              </div>

              <!-- MMI felt list -->
              <div class="bg-slate-50/50 dark:bg-brand-navy-900/40 border border-slate-100/50 dark:border-brand-navy-850/20 rounded-2xl p-3 flex flex-col">
                <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                  Daftar Wilayah Dirasakan (Skala MMI)
                </span>
                <div class="flex flex-col gap-2.5 justify-center">
                  <div 
                    v-for="felt in selectedEvent.feltMmi" 
                    :key="felt.area"
                    class="flex items-center justify-between text-[10px] font-semibold"
                  >
                    <span class="text-slate-700 dark:text-slate-350 font-extrabold truncate w-32">{{ felt.area }}</span>
                    <div class="flex-1 mx-2.5 h-1 bg-slate-200 dark:bg-brand-navy-850 rounded-full overflow-hidden flex justify-start">
                      <div class="h-full rounded-full" :class="getMmiWidth(felt.mmi)"></div>
                    </div>
                    <span class="text-slate-850 dark:text-white font-black shrink-0">{{ felt.mmi }} MMI</span>
                  </div>
                </div>
              </div>

              <!-- Safety accordion -->
              <div class="relative">
                <button 
                  type="button"
                  @click="showSafety = !showSafety"
                  class="w-full h-9 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-850 border border-slate-800 dark:border-brand-navy-800/40 shadow-sm flex items-center justify-between px-3.5 transition-all cursor-pointer text-xs font-black tracking-wide"
                >
                  <span class="flex items-center gap-1.5">
                    <BookOpen class="w-3.5 h-3.5 text-brand-cyan" />
                    Siaga Gempa BMKG
                  </span>
                  <ChevronDown class="w-4 h-4 transition-transform duration-300 text-slate-400" :class="{ 'rotate-180': showSafety }" />
                </button>

                <!-- Expanded safety guides -->
                <div 
                  v-if="showSafety" 
                  class="absolute bottom-full left-0 right-0 mb-2 bg-[#0f172a]/95 border border-slate-800/60 backdrop-blur-md text-slate-300 rounded-2xl p-4 text-[9.5px] font-normal leading-relaxed shadow-2xl z-20 flex flex-col gap-2.5 animate-fade-in"
                >
                  <h6 class="text-[10px] font-black text-cyan-400 dark:text-brand-cyan border-b border-slate-800 pb-1 leading-none uppercase">
                    Petunjuk Siaga Gempa Bumi
                  </h6>
                  
                  <div class="space-y-2">
                    <div>
                      <span class="font-extrabold text-white">1. Di Dalam Ruangan:</span>
                      <span class="text-slate-400"> Segera merunduk di bawah meja kokoh, lindungi kepala dan leher Anda, serta hindari lemari tinggi/kaca jendela.</span>
                    </div>
                    <div>
                      <span class="font-extrabold text-white">2. Di Luar Ruangan:</span>
                      <span class="text-slate-400"> Lari ke area terbuka yang bebas dari papan reklame, tiang listrik, pohon, maupun bangunan yang rawan roboh.</span>
                    </div>
                    <div>
                      <span class="font-extrabold text-white">3. Pasca Gempa:</span>
                      <span class="text-slate-400"> Ikuti jalur evakuasi resmi, periksa kondisi kompor/gas, dan waspadai potensi runtuhan serta gempa susulan.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Map Card View at the very bottom -->
            <div class="p-4 border-t border-slate-100 dark:border-brand-navy-800/40 bg-slate-50/50 dark:bg-brand-navy-950/20 shrink-0">
              <p class="text-[8.5px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 block mb-2 leading-none">
                Peta Lokasi Episentrum
              </p>
              <div class="h-[180px] w-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-brand-navy-800/40 relative shadow-inner">
                <div ref="detailMapEl" class="w-full h-full z-10 bg-slate-800"></div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes eq-item-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.eq-list-item {
  opacity: 0;
  animation: eq-item-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.eq-item-1 { animation-delay: 0ms; }
.eq-item-2 { animation-delay: 90ms; }
.eq-item-3 { animation-delay: 180ms; }

.map-eq-item {
  opacity: 0;
  animation: eq-item-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Drawer transitions matching Aviation/Maritime advisors */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.28s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  /* Mobile: slide up from bottom */
  transform: translateY(100%);
  opacity: 0.9;
}
@media (min-width: 768px) {
  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    /* Desktop: slide in from right */
    transform: translateX(100%);
    opacity: 0.9;
  }
}
</style>

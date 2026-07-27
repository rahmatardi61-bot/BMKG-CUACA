<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  X, 
  Navigation, 
  Compass, 
  Sun,
  CloudRain,
  Clock,
  Map as MapIcon,
  ChevronLeft,
  Search,
  CloudLightning,
  Cloud,
  Eye,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  MapPin,
  Mic,
  History,
  Trash2,
  Locate
} from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  type LocationData, 
  locationsList, 
  routesCoordinates,
  routesCheckpoints
} from '../data/landBasedActivitiesData';
import { hourlyForecastsMap } from '../data/mockData';

const props = defineProps<{
  isOpen: boolean;
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

void Cloud;

// ── "Cuaca Hari Ini" reactive state ────────────────────────────────────────
const weatherNow = ref(new Date());

// Compute current hour string 'HH:00'
const currentHourStr = computed(() => {
  const h = String(weatherNow.value.getHours()).padStart(2, '0');
  return `${h}:00`;
});

// ISO date of today 'YYYY-MM-DD'
const todayIso = computed(() => weatherNow.value.toISOString().slice(0, 10));

// Forecasts for the active city (fallback DKI Jakarta)
const cityForecasts = computed(() => {
  return hourlyForecastsMap[props.selectedCity] || hourlyForecastsMap['DKI Jakarta'] || [];
});

// Grouped by date: [{ date, slots }]
const dayGroups = computed(() => {
  const map = new Map<string, typeof cityForecasts.value>();
  for (const f of cityForecasts.value) {
    if (!map.has(f.date)) map.set(f.date, []);
    map.get(f.date)!.push(f);
  }
  return Array.from(map.entries()).map(([date, slots]) => ({ date, slots }));
});

// Selected date (defaults to today)
const selectedWeatherDate = ref('');

// Slots for selected date (24 hourly entries)
const selectedDaySlots = computed(() => {
  const targetDate = selectedWeatherDate.value || todayIso.value;
  return cityForecasts.value.filter(f => f.date === targetDate);
});

// Centered view: prev, current, next slots around the current hour
const visibleHourSlots = computed(() => {
  const slots = selectedDaySlots.value;
  if (!slots.length) return [];
  return slots;
});

// Index of the current/closest active hour within selected day
const activeHourIndex = computed(() => {
  const slots = visibleHourSlots.value;
  if (!slots.length) return 0;
  const isToday = selectedWeatherDate.value === todayIso.value || selectedWeatherDate.value === '';
  if (!isToday) return 0;
  const idx = slots.findIndex(s => s.time === currentHourStr.value);
  return idx >= 0 ? idx : 0;
});

// Wind direction angle helper (pseudo from time)
const getWindAngle = (timeStr: string) => {
  const [h] = timeStr.split(':').map(Number);
  return Math.round(45 + Math.sin(h * 0.5) * 60);
};

// Precipitation rate mm/h from probability %
const toRainRate = (pct: number) => parseFloat(((pct / 100) * 12).toFixed(2));

// Max precip % for bar chart scale
const maxPrecipForDay = computed(() => {
  const slots = selectedDaySlots.value;
  return Math.max(...slots.map(s => s.precipitation ?? 0), 1);
});

// Scroll container ref for weather table
const weatherScrollRef = ref<HTMLElement | null>(null);

const scrollWeatherToNow = async () => {
  await nextTick();
  if (!weatherScrollRef.value) return;
  const idx = activeHourIndex.value;
  // each column is 64px wide
  const colW = 64;
  weatherScrollRef.value.scrollLeft = Math.max(0, (idx - 1) * colW);
};

onMounted(() => {
  selectedWeatherDate.value = todayIso.value;
  scrollWeatherToNow();
});

// Clock interval to keep currentHourStr live
let _weatherClockInterval: ReturnType<typeof setInterval> | null = null;

// Steps & Interactive states
const currentStep = ref<'overview' | 'search' | 'selected' | 'directions'>('overview');
const searchQuery = ref('');
const startLocation = ref<LocationData>(locationsList.find(c => c.id === 'bangunjiwo') || locationsList[0]);
const destinationLocation = ref<LocationData | null>(null);
const activeTravelMode = ref('car');
const isLocating = ref(false);

// Haversine distance in km between two lat/lng pairs
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Update startLocation to user's real GPS coords (via Reverse Geocoding)
const updateStartLocationFromCoords = async (lat: number, lng: number) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const name = addr.village || addr.suburb || addr.neighbourhood || addr.city_district || addr.road || addr.municipality || 'Lokasi Saya';
      const region = [addr.city || addr.regency || addr.county || '', addr.state || ''].filter(Boolean).join(', ');
      
      startLocation.value = {
        id: 'real-gps-start',
        name: name,
        type: 'Desa',
        region: region || 'Indonesia',
        lat: lat,
        lng: lng,
        temp: 30,
        weather: 'Cerah Berawan',
        uv: 5,
        condition: 'cerah',
        tips: 'Berkendara dengan aman.'
      };
      
      startCityId.value = 'real-gps-start';
      startQuery.value = name;
      
      if (map && currentStep.value === 'overview') renderMarkersForCurrentStep(false);
      return;
    }
  } catch (e) {
    console.warn('Reverse geocoding failed, falling back to nearest preset location', e);
  }

  // Fallback: nearest mock location
  let nearest = locationsList[0];
  let minDist = Infinity;
  for (const loc of locationsList) {
    const d = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (d < minDist) { minDist = d; nearest = loc; }
  }
  startLocation.value = { ...nearest };
  startCityId.value = nearest.id;
  startQuery.value = nearest.name;
  if (map && currentStep.value === 'overview') renderMarkersForCurrentStep(false);
};

// Request real-time GPS location from browser
const tryGetUserLocation = () => {
  if (!navigator.geolocation) return;
  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false;
      updateStartLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => { isLocating.value = false; }, // fallback: keep default
    { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
  );
};

// Center map view back to user's starting location with a single-pass offset animation
const centerMapToStartLocation = () => {
  // Query fresh GPS coordinates in the background
  tryGetUserLocation();

  if (!map || !startLocation.value) return;

  const zoom = 13;
  const point = map.project([startLocation.value.lat, startLocation.value.lng], zoom);
  const dx = isMobile.value ? 0 : -210;
  const dy = isMobile.value ? 160 : 0;
  const offsetPoint = L.point(point.x + dx, point.y + dy);
  const targetLatLng = map.unproject(offsetPoint, zoom);

  map.setView(targetLatLng, zoom, { animate: true });
};

watch([selectedWeatherDate, cityForecasts, () => props.isOpen, currentStep], scrollWeatherToNow);

// Bottom sheet drag state
const sheetExpanded = ref(false);
let dragStartY = 0;
let dragStartTime = 0;
let isDraggingSheet = false;

const onSheetDragStart = (e: PointerEvent) => {
  isDraggingSheet = true;
  dragStartY = e.clientY;
  dragStartTime = Date.now();
  window.addEventListener('pointermove', onSheetDragMove, { passive: true });
  window.addEventListener('pointerup', onSheetDragEnd, { once: true });
};

const onSheetDragMove = (_e: PointerEvent) => {
  if (!isDraggingSheet) return;
  // Visual feedback while dragging handled by end only
};

const onSheetDragEnd = (e: PointerEvent) => {
  isDraggingSheet = false;
  window.removeEventListener('pointermove', onSheetDragMove);
  const deltaY = e.clientY - dragStartY;
  const elapsed = Date.now() - dragStartTime;
  const isFlick = elapsed < 300 && Math.abs(deltaY) > 30;
  // Drag down (positive deltaY) → minimize; drag up → expand
  if (deltaY > 60 || (isFlick && deltaY > 0)) {
    sheetExpanded.value = false;
  } else if (deltaY < -40 || (isFlick && deltaY < 0)) {
    sheetExpanded.value = true;
  }
};

const toggleSheetExpanded = () => {
  sheetExpanded.value = !sheetExpanded.value;
};

const travelModes = [
  { id: 'car', icon: Car },
  { id: 'moto', icon: Bike },
  { id: 'transit', icon: Bus },
  { id: 'train', icon: Train },
  { id: 'plane', icon: Plane }
];

// Form States
const startCityId = ref('');
const endCityId = ref('');
const isRouting = ref(false);

const isMobile = ref(false);
const mapEl = ref<HTMLElement | null>(null);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
};

const moveMapElement = () => {
  // Double invalidate — pertama saat transisi setengah jalan, kedua saat selesai
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 300);
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 650);
};

const handleResize = () => {
  checkMobile();
  moveMapElement();
};

const startQuery = ref('');
const endQuery = ref('');

const nominatimResults = ref<any[]>([]);
const isSearching = ref(false);
let searchDebounce: any = null;

// Search History list (defaults to first 8 items)
const searchHistory = ref<LocationData[]>(locationsList.slice(0, 8));

const clearSearchHistory = () => {
  searchHistory.value = [];
};

// Search suggestions for the full-screen search step
const searchSuggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return searchHistory.value;

  if (searchQuery.value.trim() && nominatimResults.value.length > 0) {
    return nominatimResults.value;
  }
  return locationsList.filter(loc =>
    loc.name.toLowerCase().includes(query) ||
    loc.region.toLowerCase().includes(query) ||
    loc.type.toLowerCase().includes(query)
  ).slice(0, 10);
});

watch(searchQuery, (newVal) => {
  if (!newVal.trim()) {
    nominatimResults.value = [];
    return;
  }
  if (searchDebounce) clearTimeout(searchDebounce);
  isSearching.value = true;
  searchDebounce = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newVal)}&format=json&countrycodes=id&limit=8&addressdetails=1`;
      const res = await fetch(url);
      const data = await res.json();
      nominatimResults.value = data.map((item: any, idx: number) => {
        const address = item.address || {};
        const district = address.district || address.city_district || address.municipality || '';
        const city = address.city || address.regency || address.county || '';
        const state = address.state || '';
        
        let typeStr: 'Desa' | 'Kecamatan' | 'Kabupaten' | 'Kota' | 'Tempat Wisata' = 'Desa';
        if (item.type === 'city' || item.type === 'administrative') typeStr = 'Kota';
        else if (item.type === 'attraction' || item.type === 'tourism') typeStr = 'Tempat Wisata';
        
        let displayName = item.name || item.display_name.split(',')[0];
        let regionName = [district, city, state].filter(Boolean).join(', ');
        
        return {
          id: `nom-${item.place_id}-${idx}`,
          name: displayName,
          type: typeStr,
          region: regionName || 'Indonesia',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          temp: 28 + Math.round(Math.random() * 6),
          weather: 'Berawan',
          uv: 4,
          condition: 'berawan',
          tips: 'Kondisi aspal normal.'
        };
      });
    } catch (e) {
      console.warn('Nominatim search failed:', e);
    } finally {
      isSearching.value = false;
    }
  }, 400);
});

// Leaflet Map instance references
let map: L.Map | null = null;
let tileLayer: L.TileLayer | null = null;
let routePolyline: L.Polyline | null = null;
let alternativePolylines: L.Polyline[] = [];
let mapMarkers: L.Marker[] = [];
let currentRouteTaskId = 0;
let themeObserver: MutationObserver | null = null;

// Alternative Routes State
interface AlternativeRoute {
  id: 'fastest' | 'safest' | 'least_rain';
  label: string;
  distance: number;
  duration: string;
  coords: [number, number][];
  checkpoints: Array<{
    id?: string;
    name: string;
    lat: number;
    lng: number;
    temp: number;
    weather: string;
    condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
    tips: string;
    eta: string;
  }>;
}

const alternativeRoutes = ref<AlternativeRoute[]>([]);
const selectedRouteId = ref<'fastest' | 'safest' | 'least_rain'>('fastest');

// Results State
const routeDistance = ref(0);
const routeDuration = ref('');
const routeCheckpoints = ref<Array<{
  id?: string;
  name: string;
  lat: number;
  lng: number;
  temp: number;
  weather: string;
  condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
  tips: string;
  eta: string;
}>>([]);

// Proper weather SVG icons per condition (20×20 viewBox, self-contained)
const WEATHER_ICONS: Record<string, string> = {
  // ☀️ Cerah — sun with bold rays
  cerah: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="4" fill="white" fill-opacity="0.95"/>
    <!-- 8 rays -->
    <line x1="10" y1="1.5" x2="10" y2="3.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="10" y1="16.5" x2="10" y2="18.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="1.5" y1="10" x2="3.5" y2="10" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="16.5" y1="10" x2="18.5" y2="10" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="14.36" y1="14.36" x2="15.78" y2="15.78" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="15.78" y1="4.22" x2="14.36" y2="5.64" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="5.64" y1="14.36" x2="4.22" y2="15.78" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 🌤️ Berawan — clean double-cloud (partly cloudy)
  berawan: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Sun dot top-right -->
    <circle cx="14.5" cy="5.5" r="2.5" fill="white" fill-opacity="0.85"/>
    <line x1="14.5" y1="1.5" x2="14.5" y2="2.8" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="18" y1="5.5" x2="19" y2="5.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="16.7" y1="3.3" x2="17.5" y2="2.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="16.7" y1="7.7" x2="17.5" y2="8.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <!-- Main cloud -->
    <path d="M14.5 16H5A3 3 0 0 1 2 13a3 3 0 0 1 3-3q.3 0 .6.06A3.5 3.5 0 0 1 12.5 11 3 3 0 0 1 14.5 16Z" fill="white" fill-opacity="0.95"/>
  </svg>`,

  // 🌧️ Hujan — dark cloud with distinct rain drops
  hujan: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Cloud body -->
    <path d="M15.5 12.5H5.5A3.5 3.5 0 0 1 2 9c0-1.93 1.57-3.5 3.5-3.5c.28 0 .55.04.8.1A4 4 0 0 1 14 7a3.5 3.5 0 0 1 1.5 6.5Z" fill="white" fill-opacity="0.95"/>
    <!-- Rain drops (3 lines) -->
    <line x1="7" y1="14.5" x2="6" y2="17.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="10" y1="15" x2="9" y2="18.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="13" y1="14.5" x2="12" y2="17.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // ⛈️ Badai — storm cloud with lightning bolt + rain
  badai: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Dark storm cloud -->
    <path d="M15.5 11H5.5A3.5 3.5 0 0 1 2 7.5C2 5.57 3.57 4 5.5 4c.28 0 .55.04.8.1A4 4 0 0 1 14 5.5a3.5 3.5 0 0 1 1.5 5.5Z" fill="white" fill-opacity="0.95"/>
    <!-- Lightning bolt -->
    <path d="M11 11.5 L8.5 15.5 L10.5 15.5 L8 19.5 L13.5 13.5 L11 13.5 Z" fill="white" fill-opacity="0.95" stroke="white" stroke-width="0.3" stroke-linejoin="round"/>
    <!-- Rain drops (sides) -->
    <line x1="5.5" y1="13" x2="4.5" y2="15.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="16" y1="13" x2="15" y2="15.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
};

// Custom dynamic HTML markers for OpenStreetMap
const createCustomMarker = (condition: 'cerah' | 'berawan' | 'hujan' | 'badai', label: string, isEnd = false) => {
  const iconHtml = WEATHER_ICONS[condition] ?? WEATHER_ICONS.cerah;

  const markerColorMap: Record<string, string> = {
    cerah:   'from-amber-400 to-orange-500 shadow-[0_4px_14px_rgba(251,146,60,0.55)]',
    berawan: 'from-slate-400 to-slate-500 shadow-[0_4px_12px_rgba(100,116,139,0.40)]',
    hujan:   'from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(59,130,246,0.50)]',
    badai:   'from-violet-600 to-red-600 shadow-[0_4px_16px_rgba(124,58,237,0.55)]',
  };
  const markerColor = markerColorMap[condition] ?? markerColorMap.cerah;

  const borderClass = isEnd ? 'border-red-500 ring-2 ring-red-300 dark:ring-red-900/50' : 'border-white dark:border-slate-800';

  return L.divIcon({
    className: 'custom-osm-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <!-- Pulse ring for end destination or active storms -->
        ${isEnd || condition === 'badai' ? `<span class="absolute top-0 w-9 h-9 rounded-full bg-current ${condition === 'badai' ? 'text-red-500' : 'text-red-650'} animate-ping opacity-30"></span>` : ''}
        
        <!-- Badge -->
        <div class="flex items-center justify-center w-9 h-9 rounded-full border-2 ${borderClass} bg-gradient-to-br ${markerColor} text-white transition-all duration-300 transform hover:scale-115 relative z-20">
          <span class="flex items-center justify-center">${iconHtml}</span>
        </div>
        
        <!-- Arrow Tail (rotates/shapes pointer) -->
        <div class="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-r border-b border-slate-200/80 dark:border-slate-800/40 transform rotate-45 -mt-1.5 z-10 shadow-[2px_2px_4px_rgba(0,0,0,0.04)]"></div>

        <!-- Tooltip Label (Modern capsule pill) -->
        <div class="absolute top-[38px] px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/45 text-slate-800 dark:text-slate-250 text-[9px] font-black tracking-tight whitespace-nowrap shadow-md z-30 transition-transform">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 56],
    iconAnchor: [18, 38]
  });
};

// Update Leaflet tile layers based on dark/light mode
const updateMapTheme = () => {
  if (!map) return;

  const isDarkMode = document.documentElement.classList.contains('dark');
  const lightUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const darkUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  const selectedUrl = isDarkMode ? darkUrl : lightUrl;

  if (tileLayer) {
    map.removeLayer(tileLayer);
  }

  tileLayer = L.tileLayer(selectedUrl, {
    maxZoom: 18,
    minZoom: 5
  }).addTo(map);
};

// Initialize Leaflet Map
const initMap = () => {
  if (!mapEl.value) return;
  if (map) return; // already initialized

  // Center around Java Island
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([-7.0, 110.0], 7);

  // Set the theme tiles dynamically
  updateMapTheme();

  // Only show zoom control on desktop
  if (window.matchMedia('(min-width: 768px)').matches) {
    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }

  // whenReady: only invalidate size — marker placement is handled separately
  // to avoid being overridden by tile layer initialization
  map.whenReady(() => {
    map?.invalidateSize();
  });

  // Place marker after map + tiles are mounted (delay covers tile layer init)
  setTimeout(() => {
    renderMarkersForCurrentStep();
  }, 300);

  calculateRoute();

  // Initialize theme MutationObserver to watch html class changes
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      updateMapTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
};


// Clear map drawings helper
const clearMapDrawings = () => {
  if (routePolyline) {
    map?.removeLayer(routePolyline);
    routePolyline = null;
  }
  alternativePolylines.forEach(poly => map?.removeLayer(poly));
  alternativePolylines = [];
  mapMarkers.forEach(marker => map?.removeLayer(marker));
  mapMarkers = [];
};

// Render the active selected route and update reactive states for sidebar binding
const renderActiveRoute = () => {
  if (!map) return;

  clearMapDrawings();

  const selectedRoute = alternativeRoutes.value.find(r => r.id === selectedRouteId.value);
  if (!selectedRoute) return;

  routeDistance.value = selectedRoute.distance;
  routeDuration.value = selectedRoute.duration;
  routeCheckpoints.value = selectedRoute.checkpoints;

  // 1. Draw inactive alternatives in grey
  alternativeRoutes.value.forEach(routeOpt => {
    if (routeOpt.id === selectedRouteId.value) return;

    const poly = L.polyline(routeOpt.coords, {
      color: '#94a3b8',
      weight: 4.5,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map!);

    // Click to select route
    poly.on('click', () => {
      selectedRouteId.value = routeOpt.id;
    });

    alternativePolylines.push(poly);
  });

  // 2. Draw active route
  let routeColor = '#3b82f6'; // Terdekat (blue)
  if (selectedRoute.id === 'safest') routeColor = '#10b981'; // Cuaca Aman (emerald green)
  else if (selectedRoute.id === 'least_rain') routeColor = '#f59e0b'; // Minim Hujan (amber orange)

  routePolyline = L.polyline(selectedRoute.coords, {
    color: routeColor,
    weight: 6,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // 3. Add markers
  selectedRoute.checkpoints.forEach((step, index) => {
    const isEnd = index === selectedRoute.checkpoints.length - 1;
    const marker = L.marker([step.lat, step.lng], {
      icon: createCustomMarker(step.condition, step.name, isEnd)
    }).addTo(map!);

    marker.bindPopup(`
      <div class="text-left font-sans text-xs p-1">
        <strong class="text-slate-800 dark:text-white block text-[11px] font-black">${step.name}</strong>
        <span class="text-slate-500 dark:text-slate-400 block mt-0.5">${step.weather} — ${step.temp}°C</span>
        <p class="text-slate-600 dark:text-slate-350 text-[10px] mt-1 italic leading-normal border-t pt-1 border-slate-100">${step.tips}</p>
      </div>
    `);

    mapMarkers.push(marker);
  });

  // 4. Fit bounds
  map.fitBounds(routePolyline.getBounds(), {
    paddingTopLeft: isMobile.value ? [40, 40] : [480, 40],
    paddingBottomRight: [40, 40],
    animate: true,
    duration: 1.2
  });
};

const fetchOverpassCheckpoints = async (coords: [number, number][]) => {
  if (coords.length < 5) return [];
  const sampled: [number, number][] = [];
  const count = 4;
  const step = Math.floor(coords.length / (count + 1));
  for (let i = 1; i <= count; i++) {
    sampled.push(coords[i * step]);
  }
  
  const arounds = sampled.map(p => `node(around:5000, ${p[0]}, ${p[1]})["amenity"~"rest_area|fuel"];\n  node(around:5000, ${p[0]}, ${p[1]})["barrier"="toll_booth"];`).join('\n  ');
  const query = `[out:json][timeout:8];
(
  ${arounds}
);
out body 6;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    const data = await res.json();
    return (data.elements || []).map((el: any) => {
      const name = el.tags.name || (el.tags.amenity === 'fuel' ? 'SPBU Pertamina' : el.tags.barrier === 'toll_booth' ? 'Gerbang Tol' : 'Rest Area');
      return {
        name: name,
        lat: el.lat,
        lng: el.lon,
        type: el.tags.amenity === 'fuel' ? 'fuel' : el.tags.barrier === 'toll_booth' ? 'toll' : 'rest_area'
      };
    });
  } catch (e) {
    console.warn('Overpass API failed:', e);
    return [];
  }
};

// Calculate coordinates along the route and simulate driving conditions
const calculateRoute = async () => {
  if (!map) return;

  const taskId = ++currentRouteTaskId;
  isRouting.value = true;

  clearMapDrawings();
  routeDistance.value = 0;
  routeDuration.value = '';
  routeCheckpoints.value = [];
  alternativeRoutes.value = [];

  if (!startLocation.value || !destinationLocation.value) {
    isRouting.value = false;
    return;
  }

  const startCity = startLocation.value;
  const endCity = destinationLocation.value;

  // Render start and destination markers immediately to keep pins visible during loading
  const startMarker = L.marker([startCity.lat, startCity.lng], {
    icon: createCustomMarker(startCity.condition, startCity.name, false)
  }).addTo(map);
  mapMarkers.push(startMarker);

  const destMarker = L.marker([endCity.lat, endCity.lng], {
    icon: createCustomMarker(endCity.condition, endCity.name, true)
  }).addTo(map);
  mapMarkers.push(destMarker);

  // Fit bounds to keep both start and destination in view during loading
  const group = L.featureGroup([startMarker, destMarker]);
  map.fitBounds(group.getBounds(), {
    paddingTopLeft: isMobile.value ? [40, 40] : [480, 40],
    paddingBottomRight: [40, 40],
    maxZoom: 12,
    animate: true
  });

  const getSimulatedDuration = (dist: number) => {
    const totalHours = dist / 60;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  };

  let primaryCoords: [number, number][] = [];
  let roadDist = 0;
  let durationText = '';
  let primaryDurationSeconds = 0;
  let osrmSteps: any[] = [];

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      primaryCoords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      roadDist = Math.round(route.distance / 1000);
      primaryDurationSeconds = route.duration;
      
      const hours = Math.floor(primaryDurationSeconds / 3600);
      const minutes = Math.round((primaryDurationSeconds % 3600) / 60);
      durationText = hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
      
      osrmSteps = route.legs?.[0]?.steps || [];
    } else {
      throw new Error('No route found from OSRM');
    }
  } catch (error) {
    console.warn('OSRM routing failed, falling back to mock routing database:', error);
    const routeKey = [startCity.id, endCity.id].sort().join('-');
    if (routesCoordinates[routeKey]) {
      primaryCoords = routesCoordinates[routeKey];
    } else {
      const stepsCount = 20;
      for (let i = 0; i <= stepsCount; i++) {
        const ratio = i / stepsCount;
        let lat = startCity.lat + (endCity.lat - startCity.lat) * ratio;
        let lng = startCity.lng + (endCity.lng - startCity.lng) * ratio;
        primaryCoords.push([lat, lng]);
      }
    }
    let totalDist = 0;
    for (let i = 0; i < primaryCoords.length - 1; i++) {
      totalDist += map.distance(primaryCoords[i], primaryCoords[i + 1]);
    }
    roadDist = Math.round(totalDist / 1000);
    primaryDurationSeconds = (roadDist / 60) * 3600;
    durationText = getSimulatedDuration(roadDist);
  }

  if (taskId !== currentRouteTaskId) return;

  let overpassPOIs: any[] = [];
  try {
    overpassPOIs = await fetchOverpassCheckpoints(primaryCoords);
  } catch (e) {
    console.warn('Overpass failed', e);
  }

  const safestCoords = primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.04;
    return [coord[0] + offset, coord[1] - offset] as [number, number];
  });

  const leastRainCoords = primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.025;
    return [coord[0] - offset, coord[1] + offset] as [number, number];
  });

  const dist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
  };

  const generateCheckpointsForOption = (_coords: [number, number][], weatherMode: 'standard' | 'safe' | 'dry', totalSecs: number) => {
    const list: AlternativeRoute['checkpoints'] = [];
    const startTime = new Date();

    let waypoints = osrmSteps
      .filter((step: any) => step.name && step.name.trim() !== '' && step.distance > 2000)
      .map((step: any) => ({
        name: step.name.startsWith('Jalan') || step.name.startsWith('Jl') ? step.name : `Jl. ${step.name}`,
        lat: step.maneuver.location[1],
        lng: step.maneuver.location[0],
        type: 'waypoint'
      }));

    let merged = [...waypoints, ...overpassPOIs];

    merged.sort((a, b) => {
      return dist(a.lat, a.lng, startCity.lat, startCity.lng) - dist(b.lat, b.lng, startCity.lat, startCity.lng);
    });

    const filtered: any[] = [];
    for (const item of merged) {
      if (dist(item.lat, item.lng, startCity.lat, startCity.lng) < 0.08) continue;
      if (dist(item.lat, item.lng, endCity.lat, endCity.lng) < 0.08) continue;
      
      const tooClose = filtered.some(f => dist(f.lat, f.lng, item.lat, item.lng) < 0.1);
      if (!tooClose) {
        filtered.push(item);
      }
    }

    const finalIntermediates = filtered.slice(0, 4);

    const allCheckpoints = [
      { name: startCity.name, lat: startCity.lat, lng: startCity.lng, type: 'depart' },
      ...finalIntermediates,
      { name: endCity.name, lat: endCity.lat, lng: endCity.lng, type: 'arrive' }
    ];

    const totalDistToLast = dist(endCity.lat, endCity.lng, startCity.lat, startCity.lng) || 1;

    allCheckpoints.forEach((cp, index) => {
      const isStart = index === 0;
      const isEnd = index === allCheckpoints.length - 1;

      const checkpointDist = dist(cp.lat, cp.lng, startCity.lat, startCity.lng);
      const ratio = checkpointDist / totalDistToLast;
      const segmentSecs = Math.round(totalSecs * ratio);
      const segmentTime = new Date(startTime.getTime() + segmentSecs * 1000);
      const hh = String(segmentTime.getHours()).padStart(2, '0');
      const mm = String(segmentTime.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm} WIB`;

      const elapsedHours = Math.floor(segmentSecs / 3600);
      const elapsedMins = Math.round((segmentSecs % 3600) / 60);
      const elapsedStr = elapsedHours > 0 ? `+${elapsedHours}j ${elapsedMins}m` : `+${elapsedMins}m`;
      const etaText = isStart ? `Berangkat: ${timeStr}` : `Tiba: ${timeStr} (${elapsedStr})`;

      const nameHash = cp.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      let condition: LocationData['condition'] = 'cerah';

      if (weatherMode === 'dry') {
        condition = nameHash % 2 === 0 ? 'cerah' : 'berawan';
      } else if (weatherMode === 'safe') {
        const available: Array<LocationData['condition']> = ['cerah', 'berawan', 'hujan'];
        condition = available[nameHash % 3];
      } else {
        const conditions: Array<LocationData['condition']> = ['cerah', 'berawan', 'hujan', 'badai'];
        condition = conditions[nameHash % 4];
      }

      const weatherText = condition === 'cerah' ? 'Cerah Berawan' : condition === 'berawan' ? 'Berawan Tebal' : condition === 'hujan' ? 'Hujan Sedang' : 'Hujan Petir';
      const temperature = 27 + (nameHash % 6);
      const tipsText = condition === 'cerah' ? 'Kondisi jalan kondusif.' : condition === 'berawan' ? 'Mendung, pandangan stabil.' : condition === 'hujan' ? 'Jalan basah. Reduksi kecepatan berkendara.' : 'Angin kencang & jalan licin. Hati-hati hydroplaning!';

      list.push({
        id: `cp-${index}-${cp.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: cp.name,
        lat: cp.lat,
        lng: cp.lng,
        temp: temperature,
        weather: weatherText,
        condition: condition,
        tips: isStart ? `Titik Keberangkatan: ${startCity.tips || 'Perjalanan dimulai.'}` : isEnd ? `Titik Tujuan: ${endCity.tips || 'Tiba di tujuan.'}` : tipsText,
        eta: etaText
      });
    });

    return list;
  };


  alternativeRoutes.value = [
    {
      id: 'fastest',
      label: 'Terdekat',
      distance: roadDist,
      duration: durationText || getSimulatedDuration(roadDist),
      coords: primaryCoords,
      checkpoints: generateCheckpointsForOption(primaryCoords, 'standard', primaryDurationSeconds)
    },
    {
      id: 'safest',
      label: 'Cuaca Aman',
      distance: Math.round(roadDist * 1.05),
      duration: getSimulatedDuration(Math.round(roadDist * 1.05)),
      coords: safestCoords,
      checkpoints: generateCheckpointsForOption(safestCoords, 'safe', primaryDurationSeconds * 1.05)
    },
    {
      id: 'least_rain',
      label: 'Minim Hujan',
      distance: Math.round(roadDist * 1.08),
      duration: getSimulatedDuration(Math.round(roadDist * 1.08)),
      coords: leastRainCoords,
      checkpoints: generateCheckpointsForOption(leastRainCoords, 'dry', primaryDurationSeconds * 1.08)
    }
  ];

  selectedRouteId.value = 'fastest';
  renderActiveRoute();
  isRouting.value = false;
};

// Map markers and routing renderer based on step
const renderMarkersForCurrentStep = (shouldCenter = true) => {
  if (!map) return;
  // Keep existing markers visible during search — no clearing
  if (currentStep.value === 'search') return;
  clearMapDrawings();

  if (currentStep.value === 'overview') {
    const marker = L.marker([startLocation.value.lat, startLocation.value.lng], {
      icon: createCustomMarker(startLocation.value.condition, startLocation.value.name, false)
    }).addTo(map);
    
    if (shouldCenter) {
      map.setView([startLocation.value.lat, startLocation.value.lng], 13, { animate: false });
      setTimeout(() => {
        if (!map) return;
        if (isMobile.value) {
          map.panBy([0, 160], { animate: false });
        } else {
          map.panBy([-210, 0], { animate: false });
        }
      }, 50);
    }
    mapMarkers.push(marker);
  } else if (currentStep.value === 'selected' && destinationLocation.value) {
    // 1. Render start location marker (Lokasi Saya / Asal)
    const startMarker = L.marker([startLocation.value.lat, startLocation.value.lng], {
      icon: createCustomMarker(startLocation.value.condition, startLocation.value.name, false)
    }).addTo(map);
    mapMarkers.push(startMarker);

    // 2. Render destination marker (Tujuan)
    const destMarker = L.marker([destinationLocation.value.lat, destinationLocation.value.lng], {
      icon: createCustomMarker(destinationLocation.value.condition, destinationLocation.value.name, true)
    }).addTo(map);
    mapMarkers.push(destMarker);

    // 3. Center view strictly on the destination marker with offset pan
    if (shouldCenter) {
      map.setView([destinationLocation.value.lat, destinationLocation.value.lng], 11, { animate: false });
      setTimeout(() => {
        if (!map) return;
        if (isMobile.value) {
          map.panBy([0, 160], { animate: false });
        } else {
          map.panBy([-210, 0], { animate: false });
        }
      }, 50);
    }
  } else if (currentStep.value === 'directions' && destinationLocation.value) {
    calculateRoute();
  }
};

watch([currentStep, destinationLocation], () => {
  renderMarkersForCurrentStep();
});

const startSearch = () => {
  currentStep.value = 'search';
  searchQuery.value = '';
};

const selectLocation = (loc: LocationData) => {
  destinationLocation.value = loc;
  endCityId.value = loc.id;
  endQuery.value = loc.name;
  currentStep.value = 'selected';

  // Add to search history if not already present, otherwise move to top
  const existsIdx = searchHistory.value.findIndex(item => item.id === loc.id);
  if (existsIdx !== -1) {
    searchHistory.value.splice(existsIdx, 1);
  }
  searchHistory.value.unshift(loc);
  if (searchHistory.value.length > 8) {
    searchHistory.value.pop();
  }
};

// Expanded state for collapsible checkpoint cards (Set of indices)
const expandedCheckpoints = ref<Set<number>>(new Set([0]));

const toggleCheckpoint = (idx: number) => {
  const s = new Set(expandedCheckpoints.value);
  if (s.has(idx)) s.delete(idx); else s.add(idx);
  expandedCheckpoints.value = s;
};

// Intermediate checkpoint list based on selected route
const getDetailedCheckpoint = (cp: any, index: number, isDestination: boolean) => {
  const iconMap: Record<string, string> = {
    cerah: '🌤️',
    berawan: '🌥️',
    hujan: '🌧️',
    badai: '⛈️'
  };
  
  let etaHour = 14;
  const etaMatch = cp.eta.match(/(\d{2}):(\d{2})/);
  if (etaMatch) {
    etaHour = parseInt(etaMatch[1]);
  }
  
  const times = [
    `${String((etaHour - 1 + 24) % 24).padStart(2, '0')}:00`,
    etaMatch ? etaMatch[0] : `${String(etaHour).padStart(2, '0')}:00`,
    `${String((etaHour + 1) % 24).padStart(2, '0')}:00`,
    `${String((etaHour + 2) % 24).padStart(2, '0')}:00`
  ];

  let suhu = [30, 30, 28, 27];
  let angin = [8, 8, 6, 5];
  let hujan = [0, 0, 0, 0];
  let rainBars = Array.from({ length: 20 }, () => Math.round(5 + Math.random() * 15));
  
  if (cp.condition === 'hujan') {
    suhu = [28, 28, 26, 25];
    hujan = [0.1, 0.4, 0.8, 1.2];
    rainBars = Array.from({ length: 20 }, () => Math.round(30 + Math.random() * 50));
  } else if (cp.condition === 'badai') {
    suhu = [27, 26, 25, 24];
    hujan = [0.5, 1.8, 2.5, 1.5];
    rainBars = Array.from({ length: 20 }, () => Math.round(50 + Math.random() * 45));
  } else if (cp.condition === 'berawan') {
    suhu = [29, 29, 28, 27];
    hujan = [0, 0.05, 0.1, 0.1];
    rainBars = Array.from({ length: 20 }, () => Math.round(10 + Math.random() * 20));
  }

  const alertMap: Record<string, string[]> = {
    cerah: ['Suhu cukup panas.', 'Pandangan sangat jelas (15km).', 'Tidak ada potensi hujan.'],
    berawan: ['Mendung tipis, pandangan stabil.', 'Tidak ada potensi hujan lebat.'],
    hujan: ['Jalanan basah dan licin.', 'Kurangi kecepatan berkendara.', 'Potensi genangan air.'],
    badai: ['Badai petir aktif!', 'Hati-hati angin kencang.', 'Disarankan berteduh jika perlu.']
  };

  return {
    id: cp.id || `cp-${index}-${cp.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: cp.name,
    region: isDestination ? (destinationLocation.value?.region || '') : 'Rute Perjalanan',
    eta: etaMatch ? etaMatch[0] : '12:00',
    weather: cp.weather,
    condition: cp.condition as 'cerah' | 'berawan' | 'hujan' | 'badai',
    icon: iconMap[cp.condition] || '🌤️',
    tempHigh: cp.temp + 2,
    tempLow: cp.temp - 2,
    alerts: alertMap[cp.condition] || ['Kondisi normal.'],
    grid: {
      times: times,
      nowIdx: 1,
      suhu: suhu,
      angin: angin,
      hujan: hujan,
      dirs: ['↙', '↙', '↙', '↙']
    },
    rainBars: rainBars
  };
};

const selectedRoute = computed(() => {
  return alternativeRoutes.value.find(r => r.id === selectedRouteId.value) || alternativeRoutes.value[0];
});

const directionsCheckpoints = computed(() => {
  const route = selectedRoute.value;
  if (!route || !route.checkpoints || route.checkpoints.length === 0) return [];
  
  const destCp = route.checkpoints[route.checkpoints.length - 1];
  const intermediates = route.checkpoints.slice(1, route.checkpoints.length - 1);
  
  const mappedDest = getDetailedCheckpoint(destCp, route.checkpoints.length - 1, true);
  const mappedIntermediates = intermediates.map((cp, idx) => getDetailedCheckpoint(cp, idx + 1, false));
  
  return [mappedDest, ...mappedIntermediates];
});

const getDirections = () => {
  currentStep.value = 'directions';
  expandedCheckpoints.value = new Set([0]);
};

const goBack = () => {
  if (currentStep.value === 'directions') {
    currentStep.value = 'selected';
  } else if (currentStep.value === 'selected') {
    currentStep.value = 'overview';
    destinationLocation.value = null;
  } else if (currentStep.value === 'search') {
    currentStep.value = 'overview';
  } else {
    emit('close');
  }
};

// Map init on drawer open or selectedCity change
watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');

      // Match dashboard selectedCity first (case-insensitive)
      const queryCity = props.selectedCity || '';
      const matchedLoc = locationsList.find(c => 
        c.id.toLowerCase() === queryCity.toLowerCase() ||
        c.name.toLowerCase().includes(queryCity.toLowerCase())
      ) || locationsList.find(c => c.id === 'bangunjiwo') || locationsList[0];

      startLocation.value = { ...matchedLoc };
      startCityId.value = startLocation.value.id;
      startQuery.value = startLocation.value.name;
      destinationLocation.value = null;
      searchQuery.value = '';

      // Immediately query browser GPS geolocation
      tryGetUserLocation();

      // Init map after Vue has flushed DOM (nextTick) then wait for
      // the drawer CSS transition to finish (≈500ms) before mounting Leaflet.
      // Multiple progressive invalidateSize calls ensure tiles render even if
      // the container is still settling (animated resize / mobile reflow).
      nextTick(() => {
        // Fast initial mount right after DOM paint
        setTimeout(() => { initMap(); }, 150);

        // Progressive invalidations to recover from any pending reflows
        [350, 600, 900, 1400].forEach(delay => {
          setTimeout(() => { if (map) map.invalidateSize(); }, delay);
        });
      });
    } else {
      document.body.classList.remove('drawer-open');
      if (map) {
        clearMapDrawings();
        map.remove();
        map = null;
        tileLayer = null;
      }
    }
  },
  { immediate: true }
);

watch(selectedRouteId, () => {
  renderActiveRoute();
});

// Cleanup maps instances safely
onMounted(() => {
  window.addEventListener('resize', handleResize);
  checkMobile();
  // Keep weatherNow live so currentHourStr refreshes each minute
  _weatherClockInterval = setInterval(() => { weatherNow.value = new Date(); }, 60000);
  // Try to detect user's real location
  tryGetUserLocation();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.body.classList.remove('drawer-open');
  if (_weatherClockInterval) clearInterval(_weatherClockInterval);
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="map-fade" appear>
      <div v-if="isOpen" class="fixed inset-0 z-[9999] bg-slate-900 overflow-hidden text-slate-100 font-sans flex flex-col justify-between">
        
        <!-- The Background Map -->
        <div ref="desktopSlot" class="absolute inset-0 w-full h-full z-0 bg-slate-800">
          <div ref="mapEl" id="land-map" class="w-full h-full"></div>
        </div>

        <!-- Floating Close X Button on Map -->
        <button 
          v-if="currentStep !== 'search'"
          type="button"
          @click="emit('close')"
          class="absolute right-4 top-4 z-50 w-10 h-10 rounded-full bg-slate-900/95 text-white flex items-center justify-center border border-slate-700/40 backdrop-blur-md shadow-lg hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
          title="Tutup Rute"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- ─────────────────────────────────────────────────────────────────────────
             2. BOTTOM SHEET: Drawer content for all steps
             ───────────────────────────────────────────────────────────────────────── -->
        <Transition name="drawer-slide" appear>
          <div 
            v-if="isOpen"
            class="relative z-45 w-[calc(100%-24px)] mx-3 mb-3 md:w-[420px] md:ml-6 md:my-6 bg-white/95 dark:bg-[#182232]/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/40 shadow-2xl rounded-3xl flex flex-col overflow-hidden text-left mt-auto select-none transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-[calc(100vh-48px)] md:max-h-[calc(100vh-48px)]"
            :class="sheetExpanded ? 'max-h-[88vh]' : 'max-h-[56vh]'"
          >
            <!-- Drag Handle / Bar at the top of the sheet -->
            <div 
              class="py-3 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
              @pointerdown.prevent="onSheetDragStart"
              @click="toggleSheetExpanded"
              title="Seret untuk minimize/expand"
            >
              <div 
                class="h-1 rounded-full transition-all duration-300"
                :class="sheetExpanded ? 'w-11 bg-slate-300/60 dark:bg-slate-600/70' : 'w-16 bg-slate-300 dark:bg-slate-500/90'"
              ></div>
            </div>

            <!-- Search Bar inside Bottom Sheet -->
            <div v-if="currentStep !== 'directions'" class="px-4 pb-3 flex items-center gap-2 shrink-0">
              <!-- Back button circle -->
              <button 
                type="button"
                @click="goBack"
                class="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              
              <!-- Search input container -->
              <div class="flex-grow relative flex items-center bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 rounded-full pl-3.5 pr-1 py-1 transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-500 dark:focus-within:border-brand-cyan/50 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:ring-brand-cyan/15 focus-within:shadow-sm">
                <Search class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Cari di peta" 
                  v-model="searchQuery"
                  @focus="startSearch"
                  class="w-full bg-transparent border-none outline-none text-sm placeholder:text-xs text-slate-700 dark:text-slate-150 placeholder-slate-400 dark:placeholder-slate-500 pl-2 pr-1 py-1"
                  style="font-size: 14px !important; line-height: 1.2;"
                />
                <!-- Clear / X button -->
                <button 
                  v-if="currentStep === 'search' || currentStep === 'selected'"
                  @click="goBack" 
                  class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50 transition-all shrink-0 cursor-pointer"
                >
                  <X class="w-3 h-3" />
                </button>
                <!-- Mic icon (overview only) -->
                <button
                  v-else
                  class="p-1.5 rounded-full text-slate-400 hover:text-blue-500 dark:hover:text-brand-cyan hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all shrink-0 cursor-pointer"
                >
                  <Mic class="w-3.5 h-3.5" />
                </button>

              </div>
              
              <!-- Layer/Map Button (only shown in overview step) -->
              <button 
                v-if="currentStep === 'overview'"
                type="button"
                @click="centerMapToStartLocation"
                class="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80 text-blue-500 dark:text-brand-cyan flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                title="Pusatkan ke lokasi saya"
              >
                <Locate class="w-4 h-4" :class="{'animate-spin text-blue-500 dark:text-brand-cyan': isLocating}" />
              </button>
            </div>

            <!-- Scrollable Content Area -->
            <div class="flex-grow overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar">

              <!-- =================================================================
                   STEP 1: DEFAULT OVERVIEW (Bangunjiwo details)
                   ================================================================= -->
              <div v-if="currentStep === 'overview'" class="space-y-4">
                <!-- Location Header -->
                <div class="flex items-center justify-between">
                  <div class="text-left">
                    <h3 class="text-[17px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">{{ startLocation.name }}</h3>
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin class="w-2.5 h-2.5" />
                      {{ startLocation.region }}
                    </p>
                  </div>
                  <!-- Live badge — loading state while GPS is active -->
                  <span
                    v-if="isLocating"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8.5px] font-black uppercase tracking-widest text-blue-400"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                    GPS...
                  </span>
                  <span
                    v-else
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] font-black uppercase tracking-widest text-emerald-500"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>

                <!-- Custom Alerts Box -->
                <div class="space-y-2">
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-blue-500 bg-blue-50 dark:bg-slate-950/20 text-blue-700 dark:text-slate-300">
                    <CloudRain class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak ada curah hujan setidaknya selama 1 jam.</span>
                  </div>
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-amber-500 bg-amber-50 dark:bg-slate-950/20 text-amber-700 dark:text-slate-300">
                    <Sun class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak direkomendasikan untuk aktivitas luar ruangan</span>
                  </div>
                </div>

                <!-- Section Heading -->
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
                    <Clock class="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    <span class="text-[8.5px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Cuaca Hari Ini</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-indigo-200/60 dark:from-indigo-800/40 to-transparent"></div>
                </div>

                <!-- Weather Timeline Grid — Reactive 10-day + Scrollable Hourly -->
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl overflow-hidden">
                  <!-- Day Selector Strip -->
                  <div class="flex gap-1.5 overflow-x-auto no-scrollbar px-3 pt-3 pb-2">
                    <button
                      v-for="group in dayGroups"
                      :key="group.date"
                      @click="selectedWeatherDate = group.date"
                      class="flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center cursor-pointer transition-all duration-200 border select-none"
                      :class="selectedWeatherDate === group.date
                        ? 'bg-blue-500/15 dark:bg-blue-500/20 border-blue-400/50 dark:border-blue-400/30 shadow-sm'
                        : 'bg-white/60 dark:bg-brand-navy-800/30 border-slate-100/60 dark:border-slate-700/20 hover:bg-blue-50/40 dark:hover:bg-slate-700/30'"
                    >
                      <span
                        class="text-[8.5px] font-black uppercase tracking-wider leading-none"
                        :class="selectedWeatherDate === group.date ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"
                      >{{ new Date(group.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}</span>
                      <span
                        class="text-sm font-black mt-0.5 leading-none"
                        :class="selectedWeatherDate === group.date ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'"
                      >{{ new Date(group.date).getDate() }}</span>
                      <!-- mini precip bar sparkline -->
                      <div class="flex gap-px items-end mt-1" style="height:10px;">
                        <div
                          v-for="(s, si) in group.slots.filter((_, i) => i % 6 === 0)"
                          :key="si"
                          class="w-1 rounded-sm transition-all"
                          :class="selectedWeatherDate === group.date ? 'bg-blue-400/70 dark:bg-blue-400/60' : 'bg-slate-300/60 dark:bg-slate-600/50'"
                          :style="{ height: Math.max(2, ((s.precipitation ?? 0) / 100) * 10) + 'px' }"
                        />
                      </div>
                    </button>
                  </div>

                  <!-- Scrollable Hourly Table -->
                  <div class="relative">
                    <!-- Frozen label column -->
                    <div class="flex">
                      <!-- Labels (fixed left) -->
                      <div class="flex-shrink-0 w-14 text-[9px] font-bold text-slate-500 dark:text-slate-400 flex flex-col border-r border-slate-200/50 dark:border-slate-700/30 bg-slate-50 dark:bg-[#1e293b]/75">
                        <div class="h-7 flex items-center pl-2">Jam</div>
                        <div class="h-6 flex items-center pl-2">Suhu</div>
                        <div class="h-5 flex items-center pl-2">Angin</div>
                        <div class="h-5 flex items-center pl-2">Arah</div>
                        <div class="h-5 flex items-center pl-2">Hujan</div>
                      </div>
                      <div
                        ref="weatherScrollRef"
                        class="flex-grow overflow-x-auto no-scrollbar"
                        style="will-change: transform; transform: translate3d(0,0,0);"
                      >
                        <div class="flex" :style="{ width: (visibleHourSlots.length * 64) + 'px' }">
                          <div
                            v-for="(slot, idx) in visibleHourSlots"
                            :key="slot.time"
                            class="flex-shrink-0 flex flex-col items-center"
                            :style="{ width: '64px' }"
                            :class="idx === activeHourIndex ? 'bg-blue-500/10 dark:bg-blue-500/15' : ''"
                          >
                            <!-- Time -->
                            <div class="h-7 flex flex-col items-center justify-center">
                              <span v-if="idx === activeHourIndex" class="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mb-0.5 uppercase tracking-wide">Skrng</span>
                              <span
                                class="text-[10px] font-bold leading-none"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'"
                              >{{ slot.time }}</span>
                            </div>
                            <!-- Suhu -->
                            <div class="h-6 flex items-center justify-center">
                              <span
                                class="font-black text-[11px]"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'"
                              >{{ slot.temp }}°</span>
                            </div>
                            <!-- Angin -->
                            <div class="h-5 flex items-center justify-center">
                              <span
                                class="text-[10px] font-semibold"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'"
                              >{{ slot.windSpeed ?? '—' }}</span>
                            </div>
                            <!-- Arah Angin -->
                            <div class="h-5 flex items-center justify-center">
                              <Navigation
                                class="w-2.5 h-2.5 transition-transform"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"
                                :style="{ transform: `rotate(${getWindAngle(slot.time)}deg)` }"
                              />
                            </div>
                            <!-- Hujan (mm/j) -->
                            <div class="h-5 flex items-center justify-center">
                              <span
                                class="text-[9px] font-bold"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'"
                              >{{ toRainRate(slot.precipitation ?? 0) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Precipitation Bar Chart (real data) -->
                  <div class="px-3 pt-2 pb-3 flex flex-col gap-1.5">
                    <div class="h-10 flex items-end gap-px bg-slate-100 dark:bg-slate-950/30 rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
                      <div
                        v-for="(slot, idx) in visibleHourSlots"
                        :key="'bar-' + idx"
                        class="flex-1 rounded-t transition-all duration-300"
                        :class="[
                          idx === activeHourIndex ? 'bg-blue-400 animate-pulse' :
                          (slot.precipitation ?? 0) > 50 ? 'bg-blue-500' :
                          (slot.precipitation ?? 0) > 20 ? 'bg-blue-400/80' : 'bg-blue-300/60 dark:bg-blue-500/40'
                        ]"
                        :style="{ height: Math.max(4, ((slot.precipitation ?? 0) / maxPrecipForDay) * 100) + '%' }"
                      />
                    </div>
                    <div class="flex justify-between px-1 text-slate-400">
                      <Sun class="w-3.5 h-3.5 text-amber-500" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-400" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- =================================================================
                   STEP 2: SEARCH INPUT ACTIVE / SUGGESTIONS
                   ================================================================= -->
              <div v-else-if="currentStep === 'search'" class="space-y-3 pt-1">

                <!-- Header row -->
                <div class="flex items-center justify-between px-0.5">
                  <div class="flex items-center gap-2">
                    <History class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {{ searchQuery.trim() ? 'Hasil Pencarian' : 'Riwayat Pencarian' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div v-if="isSearching" class="flex items-center gap-1.5 text-[9px] font-bold text-blue-500 dark:text-brand-cyan animate-pulse">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
                      Mencari...
                    </div>
                    <button
                      v-if="!searchQuery.trim() && searchHistory.length > 0"
                      @click="clearSearchHistory"
                      class="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer py-1 px-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Hapus riwayat"
                    >
                      <Trash2 class="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </div>

                <!-- List -->
                <div v-if="searchSuggestions.length > 0" class="flex flex-col gap-1">
                  <button
                    v-for="loc in searchSuggestions"
                    :key="'sug-' + loc.id"
                    @click="selectLocation(loc)"
                    class="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-sm transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <!-- Icon bubble -->
                    <span class="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/40 flex items-center justify-center text-[11px] group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30 transition-all">
                      {{ loc.condition === 'cerah' ? '☀️' : loc.condition === 'berawan' ? '☁️' : loc.condition === 'hujan' ? '🌧️' : '⛈️' }}
                    </span>
                    <!-- Text -->
                    <div class="flex-grow min-w-0">
                      <div class="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">{{ loc.name }}</div>
                      <div class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">{{ loc.type }} — {{ loc.region }}</div>
                    </div>
                    <!-- Temp badge -->
                    <span class="shrink-0 text-[10px] font-black text-slate-500 dark:text-slate-400">{{ loc.temp }}°</span>
                  </button>
                </div>

                <!-- Empty state -->
                <div v-else class="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 dark:text-slate-600">
                  <History class="w-8 h-8 opacity-40" />
                  <p class="text-xs font-semibold">Belum ada riwayat pencarian</p>
                </div>

              </div>

              <!-- =================================================================
                   STEP 3: LOCATION SELECTED (Ready for Directions)
                   ================================================================= -->
              <div v-else-if="currentStep === 'selected' && destinationLocation" class="space-y-4">
                <!-- Selected Location Header -->
                <div class="flex items-center justify-between">
                  <div class="text-left min-w-0">
                    <h3 class="text-[17px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">{{ destinationLocation.name }}</h3>
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin class="w-2.5 h-2.5 shrink-0" />
                      179 km • {{ destinationLocation.region }}
                    </p>
                  </div>
                  <span class="p-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/30 rounded-xl text-lg shrink-0">🏢</span>
                </div>

                <!-- Custom Alerts Box -->
                <div class="space-y-2">
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-blue-500 bg-blue-50 dark:bg-slate-950/20 text-blue-700 dark:text-slate-300">
                    <CloudRain class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak ada curah hujan setidaknya selama 1 jam.</span>
                  </div>
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-amber-500 bg-amber-50 dark:bg-slate-950/20 text-amber-700 dark:text-slate-300">
                    <Sun class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak direkomendasikan untuk aktivitas luar ruangan</span>
                  </div>
                </div>

                <!-- Weather Timeline Grid — Reactive 10-day + Scrollable Hourly -->
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl overflow-hidden">
                  <!-- Day Selector Strip -->
                  <div class="flex gap-1.5 overflow-x-auto no-scrollbar px-3 pt-3 pb-2">
                    <button
                      v-for="group in dayGroups"
                      :key="'sel-' + group.date"
                      @click="selectedWeatherDate = group.date"
                      class="flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center cursor-pointer transition-all duration-200 border select-none"
                      :class="selectedWeatherDate === group.date
                        ? 'bg-blue-500/15 dark:bg-blue-500/20 border-blue-400/50 dark:border-blue-400/30 shadow-sm'
                        : 'bg-white/60 dark:bg-brand-navy-800/30 border-slate-100/60 dark:border-slate-700/20 hover:bg-blue-50/40 dark:hover:bg-slate-700/30'"
                    >
                      <span
                        class="text-[8.5px] font-black uppercase tracking-wider leading-none"
                        :class="selectedWeatherDate === group.date ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"
                      >{{ new Date(group.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}</span>
                      <span
                        class="text-sm font-black mt-0.5 leading-none"
                        :class="selectedWeatherDate === group.date ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'"
                      >{{ new Date(group.date).getDate() }}</span>
                      <div class="flex gap-px items-end mt-1" style="height:10px;">
                        <div
                          v-for="(s, si) in group.slots.filter((_, i) => i % 6 === 0)"
                          :key="'sp2-' + si"
                          class="w-1 rounded-sm transition-all"
                          :class="selectedWeatherDate === group.date ? 'bg-blue-400/70 dark:bg-blue-400/60' : 'bg-slate-300/60 dark:bg-slate-600/50'"
                          :style="{ height: Math.max(2, ((s.precipitation ?? 0) / 100) * 10) + 'px' }"
                        />
                      </div>
                    </button>
                  </div>

                  <!-- Scrollable Hourly Table -->
                  <div class="relative">
                    <div class="flex">
                      <div class="flex-shrink-0 w-14 text-[9px] font-bold text-slate-500 dark:text-slate-400 flex flex-col border-r border-slate-200/50 dark:border-slate-700/30 bg-slate-50 dark:bg-[#1e293b]/75">
                        <div class="h-7 flex items-center pl-2">Jam</div>
                        <div class="h-6 flex items-center pl-2">Suhu</div>
                        <div class="h-5 flex items-center pl-2">Angin</div>
                        <div class="h-5 flex items-center pl-2">Arah</div>
                        <div class="h-5 flex items-center pl-2">Hujan</div>
                      </div>
                      <div
                        ref="weatherScrollRef"
                        class="flex-grow overflow-x-auto no-scrollbar"
                        style="will-change: transform; transform: translate3d(0,0,0);"
                      >
                        <div class="flex" :style="{ width: (visibleHourSlots.length * 64) + 'px' }">
                          <div
                            v-for="(slot, idx) in visibleHourSlots"
                            :key="'d-' + slot.time"
                            class="flex-shrink-0 flex flex-col items-center"
                            :style="{ width: '64px' }"
                            :class="idx === activeHourIndex ? 'bg-blue-500/10 dark:bg-blue-500/15' : ''"
                          >
                            <div class="h-7 flex flex-col items-center justify-center">
                              <span v-if="idx === activeHourIndex" class="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mb-0.5 uppercase tracking-wide">Skrng</span>
                              <span class="text-[10px] font-bold leading-none" :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'">{{ slot.time }}</span>
                            </div>
                            <div class="h-6 flex items-center justify-center">
                              <span class="font-black text-[11px]" :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'">{{ slot.temp }}°</span>
                            </div>
                            <div class="h-5 flex items-center justify-center">
                              <span class="text-[10px] font-semibold" :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'">{{ slot.windSpeed ?? '—' }}</span>
                            </div>
                            <div class="h-5 flex items-center justify-center">
                              <Navigation
                                class="w-2.5 h-2.5 transition-transform"
                                :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"
                                :style="{ transform: `rotate(${getWindAngle(slot.time)}deg)` }"
                              />
                            </div>
                            <div class="h-5 flex items-center justify-center">
                              <span class="text-[9px] font-bold" :class="idx === activeHourIndex ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'">{{ toRainRate(slot.precipitation ?? 0) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Precipitation Bar Chart -->
                  <div class="px-3 pt-2 pb-3 flex flex-col gap-1.5">
                    <div class="h-10 flex items-end gap-px bg-slate-100 dark:bg-slate-950/30 rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-800/40 overflow-hidden">
                      <div
                        v-for="(slot, idx) in visibleHourSlots"
                        :key="'b2-' + idx"
                        class="flex-1 rounded-t transition-all duration-300"
                        :class="[
                          idx === activeHourIndex ? 'bg-blue-400 animate-pulse' :
                          (slot.precipitation ?? 0) > 50 ? 'bg-blue-500' :
                          (slot.precipitation ?? 0) > 20 ? 'bg-blue-400/80' : 'bg-blue-300/60 dark:bg-blue-500/40'
                        ]"
                        :style="{ height: Math.max(4, ((slot.precipitation ?? 0) / maxPrecipForDay) * 100) + '%' }"
                      />
                    </div>
                    <div class="flex justify-between px-1 text-slate-400">
                      <Sun class="w-3.5 h-3.5 text-amber-500" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-400" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <!-- Action Button: Petunjuk Arah -->
                <button 
                  type="button" 
                  @click="getDirections"
                  class="w-full bg-[#1b5ebd] hover:bg-blue-600 active:scale-[0.98] py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
                >
                  Petunjuk Arah
                </button>
              </div>

              <!-- =================================================================
                   STEP 4: DIRECTIONS / ROUTE PLAN — Full-screen checkpoint list
                   ================================================================= -->
              <div v-else-if="currentStep === 'directions' && destinationLocation" class="space-y-3.5">
                <!-- Directions Mode Header -->
                <div class="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div class="flex items-center gap-2">
                    <button 
                      type="button"
                      @click="goBack"
                      class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <ChevronLeft class="w-4 h-4" />
                    </button>
                    <div class="flex flex-col text-left">
                      <h3 class="text-sm font-black text-slate-900 dark:text-white leading-none">Petunjuk Arah</h3>
                      <p class="text-[9px] font-bold mt-1.5 flex items-center gap-1.5 leading-none max-w-[270px]" :title="`${startLocation.name} ke ${destinationLocation.name}`">
                        <span class="truncate bg-slate-100/80 dark:bg-slate-800/70 px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/30">{{ startLocation.name }}</span>
                        <span class="text-slate-300 dark:text-slate-650 shrink-0 font-normal">→</span>
                        <span class="truncate bg-blue-50/60 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md text-blue-600 dark:text-brand-cyan border border-blue-100/40 dark:border-brand-cyan/20">{{ destinationLocation.name }}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Travel Mode Selector Tabs -->
                <div class="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl">
                  <button 
                    v-for="mode in travelModes" 
                    :key="mode.id"
                    @click="activeTravelMode = mode.id"
                    class="flex-1 py-2 text-center rounded-xl transition-all cursor-pointer flex justify-center items-center"
                    :class="activeTravelMode === mode.id ? 'bg-[#2f3d53] dark:bg-[#2f3d53] text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'"
                  >
                    <component :is="mode.icon" class="w-4 h-4 shrink-0" />
                  </button>
                </div>

                <!-- ── CHECKPOINT CARDS LIST ── -->
                <div v-if="isRouting" class="space-y-4 pt-1 animate-pulse">
                  <!-- Header skeleton -->
                  <div class="flex items-center justify-between px-1">
                    <div class="h-3 w-1/3 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                    <div class="h-3 w-1/4 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                  </div>

                  <!-- Destination Overview Card Skeleton -->
                  <div class="bg-slate-100/70 dark:bg-[#1c2d3f]/40 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-4 space-y-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-slate-250 dark:bg-slate-700/80 shrink-0"></div>
                      <div class="flex-grow space-y-2">
                        <div class="h-3.5 w-2/3 bg-slate-250 dark:bg-slate-700/80 rounded-full"></div>
                        <div class="h-2.5 w-1/2 bg-slate-250 dark:bg-slate-700/80 rounded-full"></div>
                      </div>
                    </div>
                    <!-- Mock alert block -->
                    <div class="h-10 bg-slate-200/40 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300/40 dark:border-slate-700/30 flex items-center px-3.5 gap-2">
                      <div class="w-3.5 h-3.5 rounded-full bg-slate-250 dark:bg-slate-700/80"></div>
                      <div class="h-2 w-3/4 bg-slate-250 dark:bg-slate-700/80 rounded-full"></div>
                    </div>
                    <!-- Detailed stats shimmer -->
                    <div class="bg-white/50 dark:bg-[#111e2b]/40 border border-slate-200/50 dark:border-slate-800/30 rounded-xl p-3 space-y-3">
                      <div class="grid grid-cols-4 gap-2">
                        <div v-for="j in 4" :key="j" class="h-3 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                      </div>
                      <div class="h-8 bg-slate-250 dark:bg-slate-700/60 rounded-lg"></div>
                    </div>
                  </div>

                  <!-- Intermediate Cards Skeletons -->
                  <div v-for="i in 3" :key="'skel-'+i" class="bg-slate-100/50 dark:bg-[#1c2d3f]/30 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex-grow space-y-2">
                        <div class="h-3 w-1/3 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                        <div class="h-2 w-1/2 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                      </div>
                      <div class="w-4 h-4 bg-slate-250 dark:bg-slate-700/60 rounded-full shrink-0"></div>
                    </div>
                    <div class="h-px bg-slate-200/60 dark:bg-slate-800/40"></div>
                    <div class="flex justify-between items-center">
                      <div class="h-2.5 w-3/5 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                      <div class="h-2 w-1/6 bg-slate-250 dark:bg-slate-700/60 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Actual Checkpoint Cards List -->
                <div v-else class="space-y-3.5">
                  
                  <!-- 1. DESTINATION OVERVIEW CARD -->
                  <div 
                    v-if="directionsCheckpoints.length > 0"
                    class="bg-slate-100 dark:bg-[#1c2d3f]/80 border border-slate-200/60 dark:border-slate-700/30 rounded-2xl p-4 space-y-3.5"
                  >
                    <div class="flex items-start gap-3">
                      <!-- Icon building circle -->
                      <div class="p-2 bg-slate-200 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/30 rounded-xl text-sm leading-none shrink-0">
                        🏢
                      </div>
                      <div class="min-w-0">
                        <h4 class="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {{ directionsCheckpoints[0].name }} • <span class="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">ETA {{ directionsCheckpoints[0].eta }}</span>
                        </h4>
                        <p class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold mt-0.5">
                          248 km • {{ directionsCheckpoints[0].region }}
                        </p>
                      </div>
                    </div>

                    <!-- Warning alert inside destination card -->
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5 text-red-400 text-[10px] font-semibold leading-relaxed">
                      <CloudLightning class="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                      <span>Badai Petir diprakirakan akan terjadi pada saat Anda tiba.</span>
                    </div>

                    <!-- Weather Grid -->
                    <div class="bg-white/80 dark:bg-[#111e2b]/70 border border-slate-200/80 dark:border-slate-800/40 rounded-xl p-3 text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                      <!-- Grid rows -->
                      <div class="grid grid-cols-6 items-center gap-y-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/50">
                        <!-- JAM ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Jam</div>
                        <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                        <div 
                          v-for="(t, ti) in directionsCheckpoints[0].grid.times" 
                          :key="'t-dest-'+ti"
                          class="text-center"
                          :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center' : 'font-bold text-slate-700 dark:text-slate-200'"
                        >
                          <span v-if="ti === directionsCheckpoints[0].grid.nowIdx" class="text-[7px] uppercase tracking-wide opacity-80 block mb-0.5">Sekarang</span>
                          {{ t }}
                        </div>

                        <!-- SUHU ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Suhu</div>
                        <div class="text-center text-slate-400">°C</div>
                        <div 
                          v-for="(s, si) in directionsCheckpoints[0].grid.suhu" 
                          :key="'s-dest-'+si"
                          class="text-center font-black relative"
                          :class="si === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 py-0.5' : 'text-slate-800 dark:text-slate-100'"
                        >
                          {{ s }}°
                          <div v-if="si === directionsCheckpoints[0].grid.nowIdx" class="absolute top-[22px] left-1/2 -translate-x-1/2 h-[78px] border-l border-dashed border-blue-500/35 pointer-events-none z-10"></div>
                        </div>

                        <!-- ANGIN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Angin</div>
                        <div class="text-center text-slate-400">km/j</div>
                        <div 
                          v-for="(a, ai2) in directionsCheckpoints[0].grid.angin" 
                          :key="'a-dest-'+ai2"
                          class="text-center"
                          :class="ai2 === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                        >{{ a }}</div>

                        <!-- ARAH ANGIN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Arah</div>
                        <div class="flex justify-center"><Compass class="w-3 h-3 text-slate-400 dark:text-slate-550" /></div>
                        <div 
                          v-for="(d, di) in directionsCheckpoints[0].grid.dirs" 
                          :key="'d-dest-'+di"
                          class="text-center"
                          :class="di === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'"
                        >{{ d }}</div>

                        <!-- HUJAN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Hujan</div>
                        <div class="text-center text-slate-400">mm/j</div>
                        <div 
                          v-for="(h, hi) in directionsCheckpoints[0].grid.hujan" 
                          :key="'h-dest-'+hi"
                          class="text-center"
                          :class="hi === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                        >{{ h }}</div>
                      </div>

                      <!-- Rain bar chart + weather icons -->
                      <div class="pt-2.5 space-y-1.5">
                        <div class="h-8 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-lg px-1.5 py-1 border border-slate-200/80 dark:border-slate-800/40">
                          <div 
                            v-for="(bar, bi) in directionsCheckpoints[0].rainBars" 
                            :key="bi"
                            class="flex-1 rounded-t transition-all"
                            :style="{ height: bar + '%' }"
                            :class="bar > 40 ? 'bg-blue-500' : bar > 20 ? 'bg-blue-500/60' : 'bg-blue-500/20'"
                          ></div>
                        </div>
                        <!-- Weather icons below chart -->
                        <div class="flex justify-between px-1 text-slate-400">
                          <span class="text-xs">🌤️</span>
                          <span class="text-xs">🌧️</span>
                          <span class="text-xs">⛅</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2. COLLAPSIBLE INTERMEDIATE CHECKPOINTS -->
                  <div 
                    v-for="(cp, idx) in directionsCheckpoints.slice(1)" 
                    :key="cp.id"
                    class="bg-slate-100 dark:bg-[#1c2d3f]/80 border border-slate-200/60 dark:border-slate-700/30 rounded-2xl overflow-hidden text-left"
                  >
                    <!-- Card Header (always visible) -->
                    <div class="p-4 space-y-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-grow">
                          <!-- Name + ETA + Region -->
                          <div class="flex items-baseline gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-slate-900 dark:text-white leading-tight">{{ cp.name }}</span>
                            <span class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">• ETA {{ cp.eta }} • {{ cp.region }}</span>
                          </div>
                          <!-- Weather summary row -->
                          <div class="flex items-center gap-2 mt-1.5">
                            <span class="text-base leading-none">{{ cp.icon }}</span>
                            <span class="text-[11px] font-extrabold text-slate-800 dark:text-white">{{ cp.weather }}</span>
                            <span class="text-[9px] text-slate-500 dark:text-slate-400 font-semibold ml-1">Tinggi: {{ cp.tempHigh }}°  Rendah: {{ cp.tempLow }}°</span>
                          </div>
                        </div>
                      </div>

                      <!-- Warning Bullets -->
                      <div class="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/40 mt-1">
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <Sun class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Sangat Tinggi tidak disarankan untuk aktivitas luar ruangan.</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <Eye class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Jarak Pandang 13.8km</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <CloudRain class="w-3.5 h-3.5 text-blue-450 shrink-0" />
                            <span>Tidak ada curah hujan setidaknya 2 jam</span>
                          </div>
                          <!-- Accordion toggle button -->
                          <button 
                            @click="toggleCheckpoint(idx + 1)"
                            class="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 p-1 cursor-pointer transition-transform duration-300"
                            :class="expandedCheckpoints.has(idx + 1) ? 'rotate-180' : 'rotate-0'"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Expanded: Full 4-col weather grid + bar chart -->
                    <Transition name="expand">
                      <div v-if="expandedCheckpoints.has(idx + 1)" class="px-4 pb-4">
                        <div class="bg-white/80 dark:bg-[#111e2b]/70 border border-slate-200/80 dark:border-slate-800/40 rounded-xl p-3 text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                          <!-- Grid rows -->
                          <div class="grid grid-cols-6 items-center gap-y-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/50">
                            <!-- JAM ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Jam</div>
                            <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                            <div 
                              v-for="(t, ti) in cp.grid.times" 
                              :key="'t'+ti"
                              class="text-center"
                              :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center' : 'font-bold text-slate-700 dark:text-slate-200'"
                            >
                              <span v-if="ti === cp.grid.nowIdx" class="text-[7px] uppercase tracking-wide opacity-80 block mb-0.5">Sekarang</span>
                              {{ t }}
                            </div>

                            <!-- SUHU ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Suhu</div>
                            <div class="text-center text-slate-400">°C</div>
                            <div 
                              v-for="(s, si) in cp.grid.suhu" 
                              :key="'s'+si"
                              class="text-center font-black relative"
                              :class="si === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 py-0.5' : 'text-slate-800 dark:text-slate-100'"
                            >
                              {{ s }}°
                              <div v-if="si === cp.grid.nowIdx" class="absolute top-[22px] left-1/2 -translate-x-1/2 h-[78px] border-l border-dashed border-blue-500/35 pointer-events-none z-10"></div>
                            </div>

                            <!-- ANGIN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Angin</div>
                            <div class="text-center text-slate-400">km/jam</div>
                            <div 
                              v-for="(a, ai2) in cp.grid.angin" 
                              :key="'a'+ai2"
                              class="text-center"
                              :class="ai2 === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                            >
                              {{ a }}
                            </div>

                            <!-- ARAH ANGIN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Arah Angin</div>
                            <div class="flex justify-center"><Compass class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                            <div 
                              v-for="(d, di) in cp.grid.dirs" 
                              :key="'d'+di"
                              class="text-center"
                              :class="di === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'"
                            >
                              {{ d }}
                            </div>

                            <!-- HUJAN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Hujan</div>
                            <div class="text-center text-slate-400">mm/jam</div>
                            <div 
                              v-for="(h, hi) in cp.grid.hujan" 
                              :key="'h'+hi"
                              class="text-center"
                              :class="hi === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                            >
                              {{ h }}
                            </div>
                          </div>

                          <!-- Rain bar chart + weather icons -->
                          <div class="pt-2.5 space-y-1.5">
                            <div class="h-8 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-lg px-1.5 py-1 border border-slate-200/80 dark:border-slate-800/40">
                              <div 
                                v-for="(bar, bi) in cp.rainBars" 
                                :key="bi"
                                class="flex-1 rounded-t transition-all"
                                :style="{ height: bar + '%' }"
                                :class="bar > 40 ? 'bg-blue-400' : bar > 20 ? 'bg-blue-500/60' : 'bg-blue-500/20'"
                              ></div>
                            </div>
                            <!-- Weather icons below chart -->
                            <div class="flex justify-between px-1 text-slate-400">
                              <span class="text-xs">{{ cp.condition === 'cerah' ? '🌤️' : '🌧️' }}</span>
                              <span class="text-xs">{{ cp.condition === 'badai' ? '⛈️' : cp.condition === 'hujan' ? '🌧️' : '🌤️' }}</span>
                              <span class="text-xs">{{ cp.condition === 'badai' ? '🌩️' : cp.condition === 'hujan' ? '⛈️' : '⛅' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Transition>
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

<style>
/* Leaflet Map Overrides to fit premium UI dashboard */
.leaflet-container {
  font-family: inherit;
  background-color: #f1f5f9 !important;
}
.leaflet-bar {
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  border-radius: 12px !important;
  overflow: hidden;
}
.leaflet-bar a {
  background-color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(8px);
  color: #1e293b !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}
.leaflet-bar a:hover {
  background-color: #f8fafc !important;
}
.leaflet-popup-content-wrapper {
  border-radius: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background-color: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px);
}
.leaflet-popup-tip {
  background-color: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
}
.custom-osm-marker {
  background: none !important;
  border: none !important;
}

/* Animations */
.map-fade-enter-active,
.map-fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.map-fade-enter-from,
.map-fade-leave-to {
  opacity: 0;
}

/* Drawer slide transition (Mobile: slide up from bottom | Desktop: slide in from right) */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
  opacity: 0.95;
}
@media (min-width: 768px) {
  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    transform: translateX(100%);
  }
}

/* Custom scrollbar hiding */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Expand/collapse transition for checkpoint cards */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  overflow: hidden;
  max-height: 600px;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

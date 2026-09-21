<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  X, 
  Navigation, 
  Sun,
  CloudRain,
  Clock,
  ChevronLeft,
  Search,
  CloudLightning,
  Cloud,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  MapPin,
  Mic,
  History,
  Trash2,
  Locate,
  Anchor,
  CornerUpRight,
  Info,
  Moon,
  SunDim
} from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  type LocationData, 
  locationsList, 
  routesCoordinates,
} from '../data/landBasedActivitiesData';
import { hourlyForecastsMap } from '../data/mockData';
import { bmkg } from '../services/bmkg/api';
import { forecastToHourly } from '../services/bmkg/adapters';
import type { HourlyForecast } from '../types/weather';
import { getCityCoordinates } from '../data/earthquakeData';

const props = defineProps<{
  isOpen: boolean;
  selectedCity: string;
  initialDestination?: { name: string; lat: number; lng: number; location: string } | null;
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
const todayIso = computed(() => {
  const d = weatherNow.value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

// ── Generate realistic hourly data from a LocationData condition ─────────────
// ── State dasar: HARUS di atas computed di bawah, karena `activeWeatherLocation`
// dibaca watcher ber-`immediate: true` saat setup. Kalau dideklarasikan belakangan,
// setup gagal dengan "Cannot access 'currentStep' before initialization".
const currentStep = ref<'overview' | 'search' | 'selected' | 'directions'>('overview');
const startLocation = ref<LocationData>(locationsList.find(c => c.id === 'bangunjiwo') || locationsList[0]);
const destinationLocation = ref<LocationData | null>(null);

// Active location for weather table (destination when selected, else start)
const activeWeatherLocation = computed(() => {
  if (currentStep.value === 'selected' && destinationLocation.value) return destinationLocation.value;
  return startLocation.value;
});

// Forecast LIVE (df/forecast/coord internal) per titik lokasi aktif — fallback: peta kota mock
const liveRouteForecast = ref<HourlyForecast[]>([]);
const liveRouteKey = ref('');
watch(activeWeatherLocation, async (loc) => {
  if (!loc || typeof loc.lat !== 'number') return;
  const key = `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
  if (key === liveRouteKey.value) return;
  liveRouteKey.value = key;
  try {
    const res = await bmkg.forecast(loc.lat, loc.lng);
    const hourly = forecastToHourly(res);
    if (hourly.length) liveRouteForecast.value = hourly;
  } catch {
    /* fallback mock di bawah */
  }
}, { immediate: true });

// Forecasts: LIVE per koordinat menang; fallback map lokasi → kota regional mockData
const cityForecasts = computed(() => {
  const loc = activeWeatherLocation.value;
  if (!loc) {
    return hourlyForecastsMap[props.selectedCity] || hourlyForecastsMap['DKI Jakarta'] || [];
  }
  if (liveRouteForecast.value.length && liveRouteKey.value) {
    return liveRouteForecast.value;
  }

  // 1. Map to closest regional city in hourlyForecastsMap
  const region = loc.region.toLowerCase();
  let key = 'DKI Jakarta';
  if (region.includes('yogyakarta') || region.includes('bantul') || region.includes('sleman') || region.includes('diy') || region.includes('magelang') || region.includes('purworejo') || region.includes('jawa tengah') || region.includes('brebes')) {
    key = 'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta';
  } else if (region.includes('jawa barat') || region.includes('bandung') || region.includes('bogor') || region.includes('sukabumi') || region.includes('cirebon')) {
    key = 'Bandung';
  } else if (region.includes('jawa timur') || region.includes('surabaya') || region.includes('malang') || region.includes('batu') || region.includes('bromo') || region.includes('banyuwangi')) {
    key = 'Surabaya';
  } else if (region.includes('bali') || region.includes('denpasar') || region.includes('kuta') || region.includes('ubud')) {
    key = 'Denpasar';
  } else if (region.includes('jakarta') || region.includes('dki')) {
    key = 'DKI Jakarta';
  }

  const baseForecasts = hourlyForecastsMap[key] || hourlyForecastsMap['DKI Jakarta'] || [];
  const cond = loc.condition || 'cerah';

  // 2. Adjust base forecasts to match loc.temp and condition
  return baseForecasts.map(slot => {
    let icon = slot.icon;
    let precipitation = slot.precipitation ?? 0;
    let status = slot.status;
    
    const [hStr] = slot.time.split(':');
    const h = parseInt(hStr) || 0;

    if (cond === 'cerah') {
      if (icon === 'CloudRain' || icon === 'CloudLightning') {
        icon = (h < 6 || h > 18) ? 'Moon' : 'Sun';
      }
      precipitation = Math.min(precipitation, 15);
      status = 'Cerah';
    } else if (cond === 'berawan') {
      if (icon === 'Sun' || icon === 'Moon') {
        icon = (h < 6 || h > 18) ? 'Cloud' : 'SunDim';
      } else if (icon === 'CloudRain' || icon === 'CloudLightning') {
        icon = 'Cloud';
      }
      precipitation = Math.max(15, Math.min(precipitation, 40));
      status = 'Berawan';
    } else if (cond === 'hujan') {
      icon = 'CloudRain';
      precipitation = Math.max(55, Math.min(precipitation + 45, 90));
      status = 'Hujan Ringan';
    } else if (cond === 'badai') {
      icon = 'CloudLightning';
      precipitation = Math.max(80, Math.min(precipitation + 65, 100));
      status = 'Hujan Petir';
    }

    // Offset temperature based on location's base temp (Yogya/Jakarta base ref is ~31)
    const tempOffset = loc.temp - 31;
    const finalTemp = Math.round(slot.temp + tempOffset);

    return {
      ...slot,
      icon,
      precipitation,
      status,
      temp: finalTemp
    };
  });
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
  if (!slots.length) return -1;
  const isToday = selectedWeatherDate.value === todayIso.value || selectedWeatherDate.value === '';
  if (!isToday) return -1;
  const idx = slots.findIndex(s => s.time === currentHourStr.value);
  return idx >= 0 ? idx : -1;
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
const userRequestedRoute = ref(false); // Only true when user explicitly clicks Petunjuk Arah
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const activeTravelMode = ref('car');
const isLocating = ref(false);

const alertDetails = computed(() => {
  const loc = currentStep.value === 'selected' && destinationLocation.value
    ? destinationLocation.value
    : startLocation.value;

  if (!loc) return null;

  const cond = loc.condition || 'cerah';
  
  if (cond === 'cerah') {
    return {
      icon: Sun,
      iconColor: 'text-amber-500 dark:text-amber-400',
      borderColor: 'border-amber-200/60 dark:border-amber-500/20',
      bgColor: 'bg-gradient-to-br from-amber-50/90 to-amber-100/40 dark:from-slate-900/60 dark:to-slate-900/30',
      textColor: 'text-amber-900 dark:text-slate-200',
      boldTextColor: 'text-amber-950 dark:text-amber-300',
      decorColor: 'bg-amber-400/25 dark:bg-amber-400/10',
      messageSuffix: 'terpantau sangat baik untuk beraktivitas di luar ruangan. Pastikan tubuh tetap terhidrasi dengan baik.'
    };
  } else if (cond === 'berawan') {
    return {
      icon: Cloud,
      iconColor: 'text-sky-500 dark:text-sky-400',
      borderColor: 'border-sky-200/60 dark:border-sky-500/20',
      bgColor: 'bg-gradient-to-br from-sky-50/90 to-sky-100/40 dark:from-slate-900/60 dark:to-slate-900/30',
      textColor: 'text-sky-900 dark:text-slate-200',
      boldTextColor: 'text-sky-950 dark:text-sky-300',
      decorColor: 'bg-sky-400/25 dark:bg-sky-400/10',
      messageSuffix: 'terpantau cukup baik untuk beraktivitas di luar ruangan. Waspadai awan tebal yang berpotensi membawa hujan.'
    };
  } else if (cond === 'hujan') {
    return {
      icon: CloudRain,
      iconColor: 'text-blue-500 dark:text-blue-400',
      borderColor: 'border-blue-200/60 dark:border-blue-500/20',
      bgColor: 'bg-gradient-to-br from-blue-50/90 to-blue-100/40 dark:from-slate-900/60 dark:to-slate-900/30',
      textColor: 'text-blue-900 dark:text-slate-200',
      boldTextColor: 'text-blue-950 dark:text-blue-300',
      decorColor: 'bg-blue-400/25 dark:bg-blue-400/10',
      messageSuffix: 'terpantau hujan. Kurang direkomendasikan untuk beraktivitas di luar ruangan tanpa pelindung air.'
    };
  } else {
    return {
      icon: CloudLightning,
      iconColor: 'text-red-500 dark:text-red-400',
      borderColor: 'border-red-200/60 dark:border-red-500/20',
      bgColor: 'bg-gradient-to-br from-red-50/90 to-red-100/40 dark:from-slate-900/60 dark:to-slate-900/30',
      textColor: 'text-red-900 dark:text-slate-200',
      boldTextColor: 'text-red-950 dark:text-red-300',
      decorColor: 'bg-red-400/25 dark:bg-red-400/10',
      messageSuffix: 'terpantau buruk/badai petir. Sangat tidak direkomendasikan untuk beraktivitas di luar ruangan demi keselamatan.'
    };
  }
});

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
  const dy = isMobile.value ? 180 : 0;
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

// ── Transport Hub Quick-Filter ──────────────────────────────────────────────
type TransportType = 'terminal' | 'stasiun' | 'bandara' | 'pelabuhan';
const activeTransportFilter = ref<TransportType | null>(null);
let transportMarkers: L.Marker[] = [];

interface TransportHub {
  name: string;
  lat: number;
  lng: number;
  type: TransportType;
  condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
  weather: string;
  temp: number;
  tips: string;
}

const transportHubsData: TransportHub[] = [
  // === YOGYAKARTA / DIY ===
  { name: 'Terminal Giwangan', lat: -7.8280, lng: 110.3848, type: 'terminal', condition: 'cerah', weather: 'Cerah Berawan', temp: 31, tips: 'Terminal utama Yogyakarta Selatan.' },
  { name: 'Terminal Jombor', lat: -7.7446, lng: 110.3582, type: 'terminal', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Akses bus antar-kota wilayah utara.' },
  { name: 'Stasiun Tugu Yogyakarta', lat: -7.7894, lng: 110.3649, type: 'stasiun', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Stasiun Utama DIY, keberangkatan kereta eksekutif.' },
  { name: 'Stasiun Lempuyangan', lat: -7.7919, lng: 110.3756, type: 'stasiun', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Stasiun kereta api kelas ekonomi.' },
  { name: 'Bandara YIA Kulon Progo', lat: -7.9002, lng: 110.0570, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Bandara Internasional Yogyakarta.' },
  { name: 'Bandara Adisutjipto', lat: -7.7880, lng: 110.4318, type: 'bandara', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Bandara domestik dan militer DIY.' },
  { name: 'Pelabuhan Sadeng', lat: -8.1637, lng: 110.7742, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Pelabuhan nelayan Gunungkidul. Ombak selatan tenang.' },
  { name: 'Pel. Tanjung Adikarta', lat: -7.9134, lng: 110.1058, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Pelabuhan Kulon Progo, angin barat daya 15 km/jam.' },
  { name: 'Pelabuhan Gesing', lat: -7.9720, lng: 110.1780, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah Berawan', temp: 31, tips: 'Pelabuhan nelayan pantai selatan.' },
  { name: 'Pelabuhan Cilacap', lat: -7.7276, lng: 108.9939, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Pelabuhan niaga utama Jateng selatan.' },
  { name: 'Pelabuhan Karangwuni', lat: -7.9014, lng: 110.0810, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Akses pantai nelayan.' },

  // === JAKARTA ===
  { name: 'Stasiun Gambir Jakarta', lat: -6.1763, lng: 106.8307, type: 'stasiun', condition: 'cerah', weather: 'Cerah Berawan', temp: 33, tips: 'Stasiun utama dekat Monas. Sedia air minum.' },
  { name: 'Stasiun Palmerah', lat: -6.2071, lng: 106.7975, type: 'stasiun', condition: 'cerah', weather: 'Cerah Berawan', temp: 32, tips: 'Stasiun commuter line terdekat dari Senayan Park.' },
  { name: 'Stasiun MRT Senayan', lat: -6.2256, lng: 106.8015, type: 'stasiun', condition: 'cerah', weather: 'Cerah Berawan', temp: 32, tips: 'Akses MRT bawah tanah dekat Senayan.' },
  { name: 'Stasiun LRT Sudirman', lat: -6.2018, lng: 106.8242, type: 'stasiun', condition: 'cerah', weather: 'Cerah', temp: 33, tips: 'Akses integrasi LRT Jabodebek.' },
  { name: 'Terminal Pulogadung', lat: -6.1853, lng: 106.9019, type: 'terminal', condition: 'cerah', weather: 'Cerah', temp: 33, tips: 'Akses bus luar kota wilayah Jakarta Timur.' },
  { name: 'Terminal Kampung Rambutan', lat: -6.3094, lng: 106.8831, type: 'terminal', condition: 'cerah', weather: 'Cerah Berawan', temp: 32, tips: 'Hub bus antar kota Jakarta Selatan.' },
  { name: 'Bandara Soekarno-Hatta', lat: -6.1256, lng: 106.6558, type: 'bandara', condition: 'berawan', weather: 'Berawan', temp: 32, tips: 'Bandara Internasional Soetta, akses via tol bandara.' },
  { name: 'Bandara Halim Perdanakusuma', lat: -6.2687, lng: 106.8920, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 33, tips: 'Bandara domestik komersial & militer.' },
  { name: 'Pelabuhan Tanjung Priok', lat: -6.1033, lng: 106.8814, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 31, tips: 'Pelabuhan penumpang & barang utama Jakarta.' },

  // === SURABAYA ===
  { name: 'Stasiun Wonokromo', lat: -7.3015, lng: 112.7372, type: 'stasiun', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Dekat dengan Kebun Binatang & Taman Bungkul.' },
  { name: 'Stasiun Gubeng Surabaya', lat: -7.2648, lng: 112.7467, type: 'stasiun', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Stasiun utama Surabaya Timur.' },
  { name: 'Stasiun Pasar Turi', lat: -7.2482, lng: 112.7303, type: 'stasiun', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Akses kereta api jalur utara Jawa.' },
  { name: 'Terminal Purabaya (Bungurasih)', lat: -7.3497, lng: 112.7383, type: 'terminal', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Terminal tersibuk di Indonesia.' },
  { name: 'Bandara Juanda Surabaya', lat: -7.3798, lng: 112.7869, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Penerbangan berjalan normal.' },
  { name: 'Pelabuhan Tanjung Perak', lat: -7.2013, lng: 112.7317, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Penyeberangan Madura & kapal laut nasional.' },

  // === BANDUNG ===
  { name: 'Stasiun Bandung', lat: -6.9124, lng: 107.6097, type: 'stasiun', condition: 'berawan', weather: 'Berawan Tebal', temp: 24, tips: 'Suhu sejuk, bawa jaket.' },
  { name: 'Terminal Leuwipanjang', lat: -6.9458, lng: 107.5925, type: 'terminal', condition: 'berawan', weather: 'Berawan', temp: 25, tips: 'Terminal bus arah barat.' },
  { name: 'Bandara Husein Sastranegara', lat: -6.9009, lng: 107.5796, type: 'bandara', condition: 'berawan', weather: 'Berawan', temp: 24, tips: 'Penerbangan charter & militer.' },

  // === MEDAN ===
  { name: 'Stasiun Medan', lat: 3.5923, lng: 98.6791, type: 'stasiun', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Stasiun utama terintegrasi kereta bandara ARS.' },
  { name: 'Terminal Terpadu Amplas', lat: 3.5358, lng: 98.7186, type: 'terminal', condition: 'hujan', weather: 'Hujan Ringan', temp: 27, tips: 'Sediakan jas hujan / payung.' },
  { name: 'Bandara Kualanamu', lat: 3.6422, lng: 98.8852, type: 'bandara', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Bandara Kualanamu Deli Serdang.' },
  { name: 'Pelabuhan Belawan', lat: 3.7853, lng: 98.6917, type: 'pelabuhan', condition: 'hujan', weather: 'Hujan Sedang', temp: 28, tips: 'Aktivitas bongkar muat laut.' },

  // === SEMARANG ===
  { name: 'Stasiun Semarang Tawang', lat: -6.9644, lng: 110.4278, type: 'stasiun', condition: 'cerah', weather: 'Cerah Berawan', temp: 31, tips: 'Dekat kawasan Kota Lama.' },
  { name: 'Stasiun Semarang Poncol', lat: -6.9728, lng: 110.4149, type: 'stasiun', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Akses kereta ekonomi & komuter.' },
  { name: 'Terminal Terboyo', lat: -6.9587, lng: 110.4611, type: 'terminal', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Terminal kawasan timur Semarang.' },
  { name: 'Bandara Ahmad Yani', lat: -6.9726, lng: 110.3752, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Bandara terapung Ahmad Yani.' },
  { name: 'Pelabuhan Tanjung Emas', lat: -6.9645, lng: 110.4196, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 32, tips: 'Waspadai banjir rob musiman.' },

  // === MAKASSAR ===
  { name: 'Terminal Daya', lat: -5.1118, lng: 119.5083, type: 'terminal', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Terminal bus utama Makassar.' },
  { name: 'Bandara Sultan Hasanuddin', lat: -5.0616, lng: 119.5539, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Hub penerbangan Indonesia Timur.' },
  { name: 'Pelabuhan Soekarno-Hatta', lat: -5.1226, lng: 119.4078, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Pelabuhan laut utama Sulawesi Selatan.' },

  // === PALEMBANG ===
  { name: 'Stasiun LRT Ampera', lat: -2.9912, lng: 104.7618, type: 'stasiun', condition: 'cerah', weather: 'Cerah Berawan', temp: 32, tips: 'LRT stasiun terdekat Ampera.' },
  { name: 'Stasiun Kertapati', lat: -3.0233, lng: 104.7297, type: 'stasiun', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Hub kereta api jalur Divre III.' },
  { name: 'Terminal Alang-Alang Lebar', lat: -2.9094, lng: 104.6789, type: 'terminal', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Terminal antar kota Sumsel.' },
  { name: 'Bandara Sultan Mahmud Badaruddin II', lat: -2.9009, lng: 104.7007, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Penerbangan normal.' },
  { name: 'Pelabuhan Boom Baru', lat: -2.9739, lng: 104.7812, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Pelabuhan sungai Musi Palembang.' },

  // === BATAM ===
  { name: 'Pelabuhan Batam Centre', lat: 1.1278, lng: 104.0538, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Ferry penyeberangan ke Singapura.' },
  { name: 'Pelabuhan Harbor Bay', lat: 1.1511, lng: 103.9967, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Penyeberangan ferry internasional.' },
  { name: 'Pelabuhan Sekupang', lat: 1.1239, lng: 103.9292, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Ferry domestik dan internasional.' },
  { name: 'Bandara Hang Nadim', lat: 1.1211, lng: 104.1189, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Bandara Internasional Batam.' },
  { name: 'Terminal Jodoh', lat: 1.1442, lng: 104.0153, type: 'terminal', condition: 'berawan', weather: 'Berawan', temp: 29, tips: 'Terminal angkutan kota Batam.' },

  // === PEKANBARU ===
  { name: 'Bandara Sultan Syarif Kasim II', lat: 0.4611, lng: 101.4489, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 32, tips: 'Akses dekat dari Labersa Golf.' },
  { name: 'Terminal Bandar Raya Payung Sekaki', lat: 0.5392, lng: 101.3853, type: 'terminal', condition: 'cerah', weather: 'Cerah Berawan', temp: 31, tips: 'Terminal utama Pekanbaru.' },
  { name: 'Pelabuhan Sungai Duku', lat: 0.5383, lng: 101.4647, type: 'pelabuhan', condition: 'berawan', weather: 'Berawan', temp: 30, tips: 'Pelabuhan sungai Siak.' },

  // === BALI / DENPASAR ===
  { name: 'Bandara I Gusti Ngurah Rai', lat: -8.7481, lng: 115.1671, type: 'bandara', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Dekat dengan Kuta dan Beachwalk.' },
  { name: 'Pelabuhan Benoa', lat: -8.7453, lng: 115.2120, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 30, tips: 'Pelabuhan kapal pesiar & marina.' },
  { name: 'Pelabuhan Sanur', lat: -8.6744, lng: 115.2631, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah Berawan', temp: 30, tips: 'Pelabuhan fast boat ke Nusa Penida.' },
  { name: 'Pelabuhan Ketapang', lat: -8.1529, lng: 114.3840, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Penyeberangan utama Jawa-Bali.' },
  { name: 'Pelabuhan Gilimanuk', lat: -8.1633, lng: 114.4372, type: 'pelabuhan', condition: 'cerah', weather: 'Cerah Berawan', temp: 30, tips: 'Penyeberangan Bali-Jawa.' },
  { name: 'Terminal Ubung', lat: -8.6253, lng: 115.2078, type: 'terminal', condition: 'cerah', weather: 'Cerah', temp: 31, tips: 'Akses angkutan pulau Bali.' }
];

const transportFilterOptions: { id: TransportType; label: string; icon: any; activeColor: string; hoverColor: string; markerColor: string }[] = [
  { id: 'terminal',  label: 'Terminal',   icon: Bus,    activeColor: 'bg-orange-50 border-orange-300 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400', hoverColor: 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:border-orange-500/30 dark:hover:text-orange-400', markerColor: 'from-orange-400 to-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.5)]' },
  { id: 'stasiun',   label: 'Stasiun KA', icon: Train,  activeColor: 'bg-blue-50   border-blue-300   text-blue-600   dark:bg-blue-500/10   dark:border-blue-500/30   dark:text-blue-400',   hoverColor: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:border-blue-500/30 dark:hover:text-blue-400',   markerColor: 'from-blue-400 to-blue-600 shadow-[0_4px_14px_rgba(59,130,246,0.5)]' },
  { id: 'bandara',   label: 'Bandara',    icon: Plane,  activeColor: 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400', hoverColor: 'hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/30 dark:hover:text-indigo-400', markerColor: 'from-indigo-400 to-indigo-600 shadow-[0_4px_14px_rgba(99,102,241,0.5)]' },
  { id: 'pelabuhan', label: 'Pelabuhan',  icon: Anchor, activeColor: 'bg-sky-50    border-sky-300    text-sky-600    dark:bg-sky-500/10    dark:border-sky-500/30    dark:text-sky-400',    hoverColor: 'hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 dark:hover:bg-sky-500/10 dark:hover:border-sky-500/30 dark:hover:text-sky-400',    markerColor: 'from-sky-400 to-sky-600 shadow-[0_4px_14px_rgba(14,165,233,0.5)]' },
];

const clearTransportMarkers = () => {
  transportMarkers.forEach(m => map?.removeLayer(m));
  transportMarkers = [];
};

const showTransportHubs = (type: TransportType) => {
  if (!map) return;

  // Toggle off if already active
  if (activeTransportFilter.value === type) {
    activeTransportFilter.value = null;
    clearTransportMarkers();
    // Restore start location marker
    renderMarkersForCurrentStep(false);
    return;
  }

  activeTransportFilter.value = type;
  clearTransportMarkers();
  // Also clear and re-render the start marker so it stays visible
  clearMapDrawings();
  const startMarker = L.marker([startLocation.value.lat, startLocation.value.lng], {
    icon: createCustomMarker(startLocation.value.condition, startLocation.value.name, false)
  }).addTo(map);
  mapMarkers.push(startMarker);

  const option = transportFilterOptions.find(o => o.id === type)!;
  const MAX_RADIUS_KM = 70;
  
  // Use destination location if in selected step, otherwise start location
  const referenceLoc = (currentStep.value === 'selected' && destinationLocation.value) 
    ? destinationLocation.value 
    : startLocation.value;

  // Render the reference marker so it remains visible
  if (currentStep.value === 'selected' && destinationLocation.value) {
    const destMarker = L.marker([destinationLocation.value.lat, destinationLocation.value.lng], {
      icon: createCustomMarker(destinationLocation.value.condition, destinationLocation.value.name, true)
    }).addTo(map);
    mapMarkers.push(destMarker);
  }

  const hubs = transportHubsData.filter(h => {
    if (h.type !== type) return false;
    const dist = haversineDistance(referenceLoc.lat, referenceLoc.lng, h.lat, h.lng);
    return dist <= MAX_RADIUS_KM;
  });
  const bounds: [number, number][] = [];

  hubs.forEach(hub => {
    const iconHtml = WEATHER_ICONS[hub.condition] ?? WEATHER_ICONS.cerah;
    const markerIcon = L.divIcon({
      className: 'custom-osm-marker',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br ${option.markerColor} text-white z-20">
            <span class="flex items-center justify-center">${iconHtml}</span>
          </div>
          <div class="w-2.5 h-2.5 bg-white/75 dark:bg-slate-900/75 border-r border-b border-slate-200/80 dark:border-slate-800/40 transform rotate-45 -mt-1.5 z-10 backdrop-blur-md"></div>
          <div class="absolute top-[38px] px-2 py-0.5 rounded-full bg-white/75 dark:bg-slate-900/75 border border-white/30 dark:border-white/10 text-slate-800 dark:text-slate-200 text-[9px] font-black tracking-tight whitespace-nowrap shadow-md z-30 backdrop-blur-md">
            ${hub.name}
          </div>
        </div>
      `,
      iconSize: [36, 56],
      iconAnchor: [18, 38]
    });

    const marker = L.marker([hub.lat, hub.lng], { icon: markerIcon }).addTo(map!);
    const emojiMap: Record<string, string> = { cerah: '☀️', berawan: '☁️', hujan: '🌧️', badai: '⛈️' };
    const emoji = emojiMap[hub.condition] || '☀️';

    marker.bindPopup(`
      <div class="text-left font-sans select-none min-w-[200px] py-0.5">
        <div class="flex items-center justify-between gap-3 border-b border-slate-500/10 dark:border-white/10 pb-1.5 mb-2">
          <span class="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight tracking-tight">${hub.name}</span>
        </div>
        <div class="flex items-center gap-2.5 mb-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-500/10 dark:bg-white/5 text-lg shrink-0">
            ${emoji}
          </div>
          <div>
            <span class="text-[13px] font-extrabold text-slate-850 dark:text-slate-100 leading-none block">${hub.temp}°C</span>
            <span class="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 leading-none mt-0.5 block">${hub.weather}</span>
          </div>
        </div>
        <div class="bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/15 dark:border-blue-400/10 rounded-xl p-2 flex items-start gap-1.5">
          <svg class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-[9px] font-bold text-slate-600 dark:text-slate-350 leading-normal m-0">${hub.tips}</p>
        </div>
      </div>
    `, {
      maxWidth: 240
    });
    transportMarkers.push(marker);
    bounds.push([hub.lat, hub.lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds as L.LatLngBoundsExpression, {
      paddingTopLeft: isMobile.value ? [20, 20] : [480, 40],
      paddingBottomRight: isMobile.value ? [20, 360] : [40, 60],
      animate: true,
      maxZoom: 12
    });
  } else {
    // No hubs within 70km — zoom to reference location so user understands the empty area
    map.setView([referenceLoc.lat, referenceLoc.lng], 10, { animate: true });
    if (isMobile.value) {
      setTimeout(() => {
        map?.panBy([0, 180], { animate: true });
      }, 300);
    }
  }
};


const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
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
        <div class="w-2.5 h-2.5 bg-white/90 dark:bg-slate-950/90 border-r border-b border-slate-200 dark:border-slate-800 transform rotate-45 -mt-1.5 z-10 shadow-[2px_2px_4px_rgba(0,0,0,0.04)] backdrop-blur-md"></div>

        <!-- Tooltip Label (Modern capsule pill) -->
        <div class="absolute top-[38px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-[9px] font-black tracking-tight whitespace-nowrap shadow-md z-30 transition-transform backdrop-blur-md">
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

// Initialize Leaflet Map
const initMap = () => {
  if (!mapEl.value) return;
  if (map) return; // already initialized

  const cityCoords = getCityCoordinates(props.selectedCity);
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([cityCoords.lat, cityCoords.lng], 8);

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

  // Route is calculated only when user explicitly clicks "Petunjuk Arah" via getDirections()

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

    const emojiMap: Record<string, string> = { cerah: '☀️', berawan: '☁️', hujan: '🌧️', badai: '⛈️' };
    const emoji = emojiMap[step.condition] || '☀️';

    marker.bindPopup(`
      <div class="text-left font-sans select-none min-w-[200px] py-0.5">
        <div class="flex items-center justify-between gap-3 border-b border-slate-500/10 dark:border-white/10 pb-1.5 mb-2">
          <span class="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight tracking-tight">${step.name}</span>
        </div>
        <div class="flex items-center gap-2.5 mb-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-500/10 dark:bg-white/5 text-lg shrink-0">
            ${emoji}
          </div>
          <div>
            <span class="text-[13px] font-extrabold text-slate-850 dark:text-slate-100 leading-none block">${step.temp}°C</span>
            <span class="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 leading-none mt-0.5 block">${step.weather}</span>
          </div>
        </div>
        <div class="bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/15 dark:border-blue-400/10 rounded-xl p-2 flex items-start gap-1.5">
          <svg class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-[9px] font-bold text-slate-600 dark:text-slate-350 leading-normal m-0">${step.tips}</p>
        </div>
      </div>
    `, {
      maxWidth: 240
    });

    mapMarkers.push(marker);
  });

  // 4. Fit bounds
  map.fitBounds(routePolyline.getBounds(), {
    paddingTopLeft: isMobile.value ? [20, 20] : [480, 40],
    paddingBottomRight: isMobile.value ? [20, 360] : [40, 40],
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
    paddingTopLeft: isMobile.value ? [20, 20] : [480, 40],
    paddingBottomRight: isMobile.value ? [20, 360] : [40, 40],
    maxZoom: 12,
    animate: true
  });

  const getSimulatedDuration = (dist: number) => {
    const totalHours = dist / 60;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  };

  const dist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
  };

  const getNearestLocationCondition = (lat: number, lng: number): LocationData['condition'] => {
    let best: LocationData | null = null;
    let bestD = Infinity;
    for (const loc of locationsList) {
      const d = dist(lat, lng, loc.lat, loc.lng);
      if (d < bestD) { bestD = d; best = loc; }
    }
    return best?.condition || 'cerah';
  };

  const findBestDetourCity = (primaryCoordsList: [number, number][], excludedIds: string[] = []) => {
    const dDirect = dist(startCity.lat, startCity.lng, endCity.lat, endCity.lng) || 1;
    let bestLoc: LocationData | null = null;
    let bestScore = -Infinity;

    for (const loc of locationsList) {
      if (loc.id === startCity.id || loc.id === endCity.id || excludedIds.includes(loc.id)) continue;
      
      // We only want clear or cloudy cities for detour
      if (loc.condition !== 'cerah' && loc.condition !== 'berawan') continue;

      const d1 = dist(startCity.lat, startCity.lng, loc.lat, loc.lng);
      const d2 = dist(loc.lat, loc.lng, endCity.lat, endCity.lng);
      const detourRatio = (d1 + d2) / dDirect;

      // Must be a reasonable detour (not too far away, but not straight line)
      if (detourRatio < 1.01 || detourRatio > 1.35) continue;

      // Must not be right on the primary route
      let minRouteDist = Infinity;
      for (const pt of primaryCoordsList) {
        const d = dist(loc.lat, loc.lng, pt[0], pt[1]);
        if (d < minRouteDist) minRouteDist = d;
      }

      if (minRouteDist < 0.1) continue; // Must be at least ~11km away from primary route

      // Score based on weather (prefer 'cerah') and lower detour ratio
      let score = 0;
      if (loc.condition === 'cerah') score += 100;
      else if (loc.condition === 'berawan') score += 50;

      // Prefer midpoints
      score -= Math.abs(detourRatio - 1.15) * 60;

      if (score > bestScore) {
        bestScore = score;
        bestLoc = loc;
      }
    }
    return bestLoc;
  };

  let primaryCoords: [number, number][] = [];
  let roadDist = 0;
  let durationText = '';
  let primaryDurationSeconds = 0;
  let osrmSteps: any[] = [];

  // Store real alternative route data from OSRM
  let secondaryCoords: [number, number][] = [];
  let secondarySteps: any[] = [];
  let secondaryDist = 0;
  let secondaryDurationSecs = 0;

  let tertiaryCoords: [number, number][] = [];
  let tertiarySteps: any[] = [];
  let tertiaryDist = 0;
  let tertiaryDurationSecs = 0;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // --- Route 0: Primary (fastest/shortest) ---
      const route0 = data.routes[0];
      primaryCoords = route0.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      roadDist = Math.round(route0.distance / 1000);
      primaryDurationSeconds = route0.duration;
      const hours = Math.floor(primaryDurationSeconds / 3600);
      const minutes = Math.round((primaryDurationSeconds % 3600) / 60);
      durationText = hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
      osrmSteps = route0.legs?.[0]?.steps || [];

      // --- Dynamic Weather Detouring ---
      let hasBadWeather = false;
      const checkCount = 8;
      for (let i = 1; i <= checkCount; i++) {
        const ratio = i / (checkCount + 1);
        const idx = Math.round(ratio * (primaryCoords.length - 1));
        if (primaryCoords[idx]) {
          const cond = getNearestLocationCondition(primaryCoords[idx][0], primaryCoords[idx][1]);
          if (cond === 'hujan' || cond === 'badai') {
            hasBadWeather = true;
            break;
          }
        }
      }

      let detour1 = hasBadWeather ? findBestDetourCity(primaryCoords, []) : null;
      let detour2 = hasBadWeather && detour1 ? findBestDetourCity(primaryCoords, [detour1.id]) : null;

      // Helper function to fetch with timeout limit
      const fetchWithTimeout = async (resource: string, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout limit
        try {
          const response = await fetch(resource, { ...options, signal: controller.signal });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          throw error;
        }
      };

      // --- Route 1 (Cuaca Aman): Detour via detour1, fallback to standard alternative ---
      if (detour1) {
        try {
          const detourUrl = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${detour1.lng},${detour1.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&steps=true`;
          const detourRes = await fetchWithTimeout(detourUrl);
          const detourData = await detourRes.json();
          if (detourData.code === 'Ok' && detourData.routes && detourData.routes.length > 0) {
            const route1 = detourData.routes[0];
            secondaryCoords = route1.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            secondaryDist = Math.round(route1.distance / 1000);
            secondaryDurationSecs = route1.duration;
            secondarySteps = [];
            for (const leg of route1.legs || []) {
              secondarySteps.push(...(leg.steps || []));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch detour1 route (timeout/offline), using standard fallback', e);
        }
      }

      if (secondaryCoords.length === 0 && data.routes.length > 1) {
        const route1 = data.routes[1];
        secondaryCoords = route1.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        secondaryDist = Math.round(route1.distance / 1000);
        secondaryDurationSecs = route1.duration;
        secondarySteps = route1.legs?.[0]?.steps || [];
      }

      // --- Route 2 (Minim Hujan): Detour via detour2, fallback to standard alternative ---
      if (detour2) {
        try {
          const detourUrl = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${detour2.lng},${detour2.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&steps=true`;
          const detourRes = await fetchWithTimeout(detourUrl);
          const detourData = await detourRes.json();
          if (detourData.code === 'Ok' && detourData.routes && detourData.routes.length > 0) {
            const route2 = detourData.routes[0];
            tertiaryCoords = route2.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            tertiaryDist = Math.round(route2.distance / 1000);
            tertiaryDurationSecs = route2.duration;
            tertiarySteps = [];
            for (const leg of route2.legs || []) {
              tertiarySteps.push(...(leg.steps || []));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch detour2 route (timeout/offline), using standard fallback', e);
        }
      }

      if (tertiaryCoords.length === 0 && data.routes.length > 2) {
        const route2 = data.routes[2];
        tertiaryCoords = route2.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        tertiaryDist = Math.round(route2.distance / 1000);
        tertiaryDurationSecs = route2.duration;
        tertiarySteps = route2.legs?.[0]?.steps || [];
      }
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
    // Apply weather-based speed factor: hujan/badai = slower ETA
    const destCond = endCity.condition || 'cerah';
    const weatherSpeedFactor = destCond === 'badai' ? 0.60 : destCond === 'hujan' ? 0.80 : destCond === 'berawan' ? 0.95 : 1.0;
    primaryDurationSeconds = (roadDist / (60 * weatherSpeedFactor)) * 3600;
    durationText = getSimulatedDuration(roadDist / weatherSpeedFactor);
  }

  // Fallback: generate geometric offsets if OSRM returned fewer than 3 routes
  const safestCoords: [number, number][] = secondaryCoords.length > 0 ? secondaryCoords : primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.04;
    return [coord[0] + offset, coord[1] - offset] as [number, number];
  });

  const leastRainCoords: [number, number][] = tertiaryCoords.length > 0 ? tertiaryCoords : primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.025;
    return [coord[0] - offset, coord[1] + offset] as [number, number];
  });

  // Duration for alternatives: use real OSRM value or estimate
  const safestDurationSecs = secondaryDurationSecs > 0 ? secondaryDurationSecs : primaryDurationSeconds * 1.05;
  const safestDist = secondaryDist > 0 ? secondaryDist : Math.round(roadDist * 1.05);
  const leastRainDurationSecs = tertiaryDurationSecs > 0 ? tertiaryDurationSecs : primaryDurationSeconds * 1.08;
  const leastRainDist = tertiaryDist > 0 ? tertiaryDist : Math.round(roadDist * 1.08);

  // Override osrmSteps for each route option via closure-captured variable trick
  // We pass steps via a helper wrapper
  const makeForOption = (coords: [number, number][], steps: any[], mode: 'standard' | 'safe' | 'dry', secs: number) => {
    const prevSteps = osrmSteps;
    osrmSteps = steps.length > 0 ? steps : prevSteps;
    const result = generateCheckpointsForOption(coords, mode, secs);
    osrmSteps = prevSteps;
    return result;
  };

  if (taskId !== currentRouteTaskId) return;

  let overpassPOIs: any[] = [];
  try {
    overpassPOIs = await fetchOverpassCheckpoints(primaryCoords);
  } catch (e) {
    console.warn('Overpass failed', e);
  }

  // Build cumulative OSRM step distance lookup for accurate road-based ratio
  // Keys: step maneuver coord string => cumulative distance from start (meters)
  const osrmStepCumDist: Map<string, number> = new Map();
  if (osrmSteps.length > 0) {
    let cumDist = 0;
    for (const step of osrmSteps) {
      if (step?.maneuver?.location) {
        const key = `${step.maneuver.location[1].toFixed(5)},${step.maneuver.location[0].toFixed(5)}`;
        osrmStepCumDist.set(key, cumDist);
      }
      cumDist += (step?.distance || 0);
    }
  }
  const osrmTotalRoadDist = osrmSteps.reduce((sum: number, s: any) => sum + (s?.distance || 0), 0) || 1;

  const generateCheckpointsForOption = (coords: [number, number][], weatherMode: 'standard' | 'safe' | 'dry', totalSecs: number) => {
    const list: AlternativeRoute['checkpoints'] = [];
    const startTime = new Date();

    // --- Sample N evenly-spaced points along the actual route polyline ---
    const NUM_INTERMEDIATES = 8;
    const sampledIntermediates: any[] = [];

    if (coords.length >= 3) {
      for (let i = 1; i <= NUM_INTERMEDIATES; i++) {
        const ratio = i / (NUM_INTERMEDIATES + 1);
        const idx = Math.round(ratio * (coords.length - 1));
        const [lat, lng] = coords[idx];

        // Match to nearest locationsList city for a real name
        let bestLoc: any = null;
        let bestD = Infinity;
        for (const loc of locationsList) {
          const d = dist(lat, lng, loc.lat, loc.lng);
          if (d < bestD) { bestD = d; bestLoc = loc; }
        }

        // Only use if not too close to start/end or a previous sample
        if (dist(lat, lng, startCity.lat, startCity.lng) < 0.08) continue;
        if (dist(lat, lng, endCity.lat, endCity.lng) < 0.08) continue;
        const tooClose = sampledIntermediates.some(s => dist(s.lat, s.lng, lat, lng) < 0.05);
        if (tooClose) continue;

        sampledIntermediates.push({
          name: bestLoc ? bestLoc.name : `Titik ${i}`,
          lat,
          lng,
          type: 'waypoint',
          _locCondition: bestLoc ? bestLoc.condition : null,
          _coordRatio: i / (NUM_INTERMEDIATES + 1)
        });
      }
    }

    // Fallback: also include any overpass POIs not already covered
    for (const poi of overpassPOIs) {
      if (dist(poi.lat, poi.lng, startCity.lat, startCity.lng) < 0.08) continue;
      if (dist(poi.lat, poi.lng, endCity.lat, endCity.lng) < 0.08) continue;
      const tooClose = sampledIntermediates.some(s => dist(s.lat, s.lng, poi.lat, poi.lng) < 0.05);
      if (!tooClose) sampledIntermediates.push(poi);
    }

    const finalIntermediates = sampledIntermediates.slice(0, NUM_INTERMEDIATES);

    const allCheckpoints = [
      { name: startCity.name, lat: startCity.lat, lng: startCity.lng, type: 'depart' },
      ...finalIntermediates,
      { name: endCity.name, lat: endCity.lat, lng: endCity.lng, type: 'arrive' }
    ];

    const totalDistToLast = dist(endCity.lat, endCity.lng, startCity.lat, startCity.lng) || 1;

    allCheckpoints.forEach((cp, index) => {
      const isStart = index === 0;
      const isEnd = index === allCheckpoints.length - 1;


      // Ratio from route position: prefer stored _coordRatio (polyline-sampled), then OSRM cumulative, then straight line
      let ratio: number;
      if (isEnd) {
        ratio = 1;
      } else if (isStart) {
        ratio = 0;
      } else if ((cp as any)._coordRatio !== undefined) {
        ratio = (cp as any)._coordRatio;
      } else if (osrmStepCumDist.size > 0) {
        let nearestStepDist = Infinity;
        let nearestCum = 0;
        osrmStepCumDist.forEach((cum, key) => {
          const [sLat, sLng] = key.split(',').map(Number);
          const d = dist(cp.lat, cp.lng, sLat, sLng);
          if (d < nearestStepDist) { nearestStepDist = d; nearestCum = cum; }
        });
        ratio = nearestCum / osrmTotalRoadDist;
      } else {
        ratio = dist(cp.lat, cp.lng, startCity.lat, startCity.lng) / totalDistToLast;
      }

      const segmentSecs = Math.round(totalSecs * ratio);
      const segmentTime = new Date(startTime.getTime() + segmentSecs * 1000);
      const hh = String(segmentTime.getHours()).padStart(2, '0');
      const mm = String(segmentTime.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm} WIB`;

      const elapsedHours = Math.floor(segmentSecs / 3600);
      const elapsedMins = Math.round((segmentSecs % 3600) / 60);
      const elapsedStr = elapsedHours > 0 ? `+${elapsedHours}j ${elapsedMins}m` : `+${elapsedMins}m`;
      const etaText = isStart ? `Berangkat: ${timeStr}` : `Tiba: ${timeStr} (${elapsedStr})`;

      // --- FIX 3: Condition from nearest real location, not nameHash ---
      const nameHash = cp.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      let condition: LocationData['condition'];

      if (isStart) {
        condition = startCity.condition || 'cerah';
      } else if (isEnd) {
        condition = endCity.condition || 'cerah';
      } else {
        // Use nearest location from locationsList as proxy for intermediate point
        const nearestCond = getNearestLocationCondition(cp.lat, cp.lng);
        if (weatherMode === 'dry') {
          condition = (nearestCond === 'hujan' || nearestCond === 'badai') ? 'berawan' : nearestCond;
        } else if (weatherMode === 'safe') {
          condition = nearestCond === 'badai' ? 'hujan' : nearestCond;
        } else {
          condition = nearestCond;
        }
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
      checkpoints: makeForOption(primaryCoords, osrmSteps, 'standard', primaryDurationSeconds)
    },
    {
      id: 'safest',
      label: secondaryCoords.length > 0 ? 'Alt. Rute 2' : 'Cuaca Aman',
      distance: safestDist,
      duration: getSimulatedDuration(safestDist),
      coords: safestCoords,
      checkpoints: makeForOption(safestCoords, secondarySteps, 'safe', safestDurationSecs)
    },
    {
      id: 'least_rain',
      label: tertiaryCoords.length > 0 ? 'Alt. Rute 3' : 'Minim Hujan',
      distance: leastRainDist,
      duration: getSimulatedDuration(leastRainDist),
      coords: leastRainCoords,
      checkpoints: makeForOption(leastRainCoords, tertiarySteps, 'dry', leastRainDurationSecs)
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
          map.panBy([0, 180], { animate: false });
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
          map.panBy([0, 180], { animate: false });
        } else {
          map.panBy([-210, 0], { animate: false });
        }
      }, 50);
    }
  } else if (currentStep.value === 'directions' && destinationLocation.value) {
    if (userRequestedRoute.value) {
      calculateRoute();
    }
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
  searchQuery.value = loc.name;
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
  const elapsedMatch = cp.eta.match(/\(([^)]+)\)/);
  const elapsedStr = elapsedMatch ? elapsedMatch[1] : '';
  if (etaMatch) {
    etaHour = parseInt(etaMatch[1]);
  }
  
  const times: string[] = [];
  const suhu: number[] = [];
  const angin: number[] = [];
  const hujan: number[] = [];
  const dirs: string[] = [];
  const cuaca: string[] = [];

  for (let h = 0; h < 24; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);

    // Generate based on condition
    let baseTemp = 28;
    let baseWind = 6;
    let baseRain = 0;
    let baseCuaca = 'Sun';

    // diurnal temp variation (cooler at night, warmer in afternoon)
    const tempOffset = h >= 10 && h <= 15 ? 4 : h >= 22 || h <= 5 ? -3 : 0;

    if (cp.condition === 'hujan') {
      baseTemp = 25 + tempOffset;
      baseWind = 8 + (h % 3);
      baseRain = Number((0.2 + (h % 5) * 0.3).toFixed(1));
      baseCuaca = h >= 18 || h < 6 ? 'Moon' : (h % 2 === 0 ? 'CloudRain' : 'Cloud');
    } else if (cp.condition === 'badai') {
      baseTemp = 24 + tempOffset;
      baseWind = 12 + (h % 5);
      baseRain = Number((0.5 + (h % 4) * 0.7).toFixed(1));
      baseCuaca = h % 3 === 0 ? 'CloudLightning' : 'CloudRain';
    } else if (cp.condition === 'berawan') {
      baseTemp = 27 + tempOffset;
      baseWind = 7 + (h % 2);
      baseRain = h % 6 === 0 ? 0.1 : 0;
      baseCuaca = h >= 18 || h < 6 ? 'Moon' : 'Cloud';
    } else { // cerah
      baseTemp = 29 + tempOffset;
      baseWind = 5 + (h % 2);
      baseRain = 0;
      baseCuaca = h >= 18 || h < 6 ? 'Moon' : (h >= 10 && h <= 15 ? 'Sun' : 'SunDim');
    }

    suhu.push(baseTemp);
    angin.push(baseWind);
    hujan.push(baseRain);
    dirs.push('↙');
    cuaca.push(baseCuaca);
  }

  // Inject exact ETA time representation at the target slot
  if (etaHour >= 0 && etaHour < 24) {
    times[etaHour] = etaMatch ? etaMatch[0] : `${String(etaHour).padStart(2, '0')}:00`;
  }

  let rainBars = Array.from({ length: 20 }, () => Math.round(5 + Math.random() * 15));
  if (cp.condition === 'hujan') {
    rainBars = Array.from({ length: 20 }, () => Math.round(30 + Math.random() * 50));
  } else if (cp.condition === 'badai') {
    rainBars = Array.from({ length: 20 }, () => Math.round(50 + Math.random() * 45));
  } else if (cp.condition === 'berawan') {
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
    elapsed: elapsedStr,
    weather: cp.weather,
    condition: cp.condition as 'cerah' | 'berawan' | 'hujan' | 'badai',
    icon: iconMap[cp.condition] || '🌤️',
    tempHigh: cp.temp + 2,
    tempLow: cp.temp - 2,
    alerts: alertMap[cp.condition] || ['Kondisi normal.'],
    grid: {
      times: times,
      nowIdx: etaHour,
      suhu: suhu,
      angin: angin,
      hujan: hujan,
      dirs: dirs,
      cuaca: cuaca
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

const toggleCheckpoint = (idx: number) => {
  const s = new Set(expandedCheckpoints.value);
  const isExpanding = !s.has(idx);
  if (s.has(idx)) s.delete(idx); else s.add(idx);
  expandedCheckpoints.value = s;

  if (isExpanding) {
    nextTick(() => {
      const el = document.getElementById(`cp-scroll-${idx}`);
      if (el) {
        const cp = directionsCheckpoints.value[idx];
        const nowIdx = cp?.grid?.nowIdx ?? 14;
        const colW = 56;
        el.scrollLeft = Math.max(0, (nowIdx - 2.5) * colW);
      }
    });
  }
};

watch(directionsCheckpoints, (newVal) => {
  if (newVal && newVal.length > 0) {
    nextTick(() => {
      const el = document.getElementById('cp-scroll-0');
      if (el) {
        const cp = newVal[0];
        const nowIdx = cp?.grid?.nowIdx ?? 14;
        const colW = 56;
        el.scrollLeft = Math.max(0, (nowIdx - 2.5) * colW);
      }
    });
  }
}, { immediate: true });

const getDirections = () => {
  userRequestedRoute.value = true; // Mark that user explicitly requested route
  currentStep.value = 'directions';
  expandedCheckpoints.value = new Set([0]);
};

const goBack = () => {
  if (currentStep.value === 'directions') {
    currentStep.value = 'selected';
  } else if (currentStep.value === 'selected') {
    currentStep.value = 'overview';
    destinationLocation.value = null;
    searchQuery.value = '';
  } else if (currentStep.value === 'search') {
    currentStep.value = 'overview';
    searchQuery.value = '';
  } else {
    emit('close');
  }
};

const clearSearch = () => {
  if ((currentStep.value === 'search' || currentStep.value === 'selected') && searchQuery.value) {
    searchQuery.value = '';
    destinationLocation.value = null;
    currentStep.value = 'search';
    nextTick(() => {
      searchInput.value?.focus();
    });
  } else {
    goBack();
  }
};

// Map init on drawer open or selectedCity change
watch(
  () => [props.isOpen, props.selectedCity, props.initialDestination],
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

      // Check if opened with a specific landmark shortcut from an activity card click
      if (props.initialDestination && props.initialDestination.lat && props.initialDestination.lng) {
        // Build a synthetic LocationData entry using the card's exact coordinates
        const customDest: import('../data/landBasedActivitiesData').LocationData = {
          id: `custom_${props.initialDestination.lat}_${props.initialDestination.lng}`,
          name: props.initialDestination.name,
          type: 'Tempat Wisata',
          region: props.initialDestination.location,
          lat: props.initialDestination.lat,
          lng: props.initialDestination.lng,
          temp: 30,
          weather: 'Cerah Berawan',
          uv: 5,
          condition: 'cerah',
          tips: 'Destinasi pilihan Anda. Gunakan petunjuk arah untuk navigasi ke lokasi ini.',
        };
        destinationLocation.value = customDest;
        currentStep.value = 'selected';
        expandedCheckpoints.value = new Set([0]);
      }

      // Init map after Vue has flushed DOM (nextTick) then wait for
      // the drawer CSS transition to finish (≈500ms) before mounting Leaflet.
      // Multiple progressive invalidateSize calls ensure tiles render even if
      // the container is still settling (animated resize / mobile reflow).
      nextTick(() => {
        // Mobile needs longer delay: CSS transition is ≈400ms
        const initDelay = isMobile.value ? 350 : 150;
        setTimeout(() => { 
          initMap(); 
        }, initDelay);

        // Safety retry: if initMap failed (container not ready), try once more
        setTimeout(() => {
          if (!map && mapEl.value) { 
            initMap(); 
          }
        }, 800);

        // Progressive invalidations to recover from any pending reflows
        [400, 700, 1100, 1600, 2500].forEach(delay => {
          setTimeout(() => { if (map) map.invalidateSize(); }, delay);
        });
      });
    } else {
      document.body.classList.remove('drawer-open');
      // Reset state so next open always starts fresh
      currentStep.value = 'overview';
      destinationLocation.value = null;
      searchQuery.value = '';
      userRequestedRoute.value = false; // Reset route flag
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
      <div v-if="isOpen" class="fixed inset-0 z-[9999] bg-slate-900 overflow-hidden text-slate-100 font-sans flex flex-col justify-between fullscreen-map-container" v-api-marker:land-based>
        
        <!-- The Background Map -->
        <div ref="desktopSlot" class="absolute inset-0 w-full h-full z-0 bg-slate-800">
          <div ref="mapEl" id="land-map" class="w-full h-full"></div>
        </div>

        <!-- Floating Close X Button on Map -->
        <div
          v-if="currentStep !== 'search'"
          class="premium-tooltip-container absolute right-4 top-4 z-50"
        >
          <button 
            type="button"
            @click="emit('close')"
            class="w-10 h-10 rounded-full bg-slate-900/95 text-white flex items-center justify-center border border-slate-700/40 backdrop-blur-md shadow-lg hover:bg-slate-800 active:scale-95 transition-all cursor-pointer map-close-btn"
          >
            <X class="w-5 h-5" />
          </button>
          <div class="premium-tooltip tooltip-bottom tooltip-right">
            <span>Tutup Rute</span>
          </div>
        </div>

        <!-- ─────────────────────────────────────────────────────────────────────────
             2. BOTTOM SHEET: Drawer content for all steps
             ───────────────────────────────────────────────────────────────────────── -->
        <Transition name="drawer-slide" appear>
          <div 
            v-if="isOpen"
            class="relative z-45 w-[calc(100%-24px)] mx-3 mb-3 md:w-[420px] md:ml-6 md:my-6 bg-white dark:bg-[#182232] border border-slate-200/60 dark:border-slate-800/40 shadow-2xl rounded-[4px] flex flex-col overflow-hidden text-left mt-auto select-none transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-[calc(100vh-48px)] md:max-h-[calc(100vh-48px)] land-route-drawer"
            :class="sheetExpanded ? 'max-h-[88vh]' : 'max-h-[56vh]'"
          >
            <!-- Drag Handle / Bar at the top of the sheet -->
            <div 
              class="py-3 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
              @pointerdown.prevent="onSheetDragStart"
              @click="toggleSheetExpanded"

            >
              <div 
                class="h-1 rounded-full transition-all duration-300"
                :class="sheetExpanded ? 'w-11 bg-slate-300/60 dark:bg-slate-600/70' : 'w-16 bg-slate-300 dark:bg-slate-500/90'"
              ></div>
            </div>

            <!-- Hero Title (overview only) -->
            <div v-if="currentStep === 'overview'" class="px-5 pt-1 pb-3 shrink-0">
              <div class="flex items-start gap-3">
                <div class="mt-0.5 w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25">
                  <MapPin class="w-4 h-4 text-white" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-[15px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    Kondisi Jalur &amp; Lokasi Tujuan
                  </h2>
                  <p class="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Cek cuaca real-time di sepanjang rute sebelum kamu berangkat
                  </p>
                </div>
              </div>
            </div>

            <!-- Search Bar inside Bottom Sheet -->
            <div v-if="currentStep !== 'directions'" class="px-4 pb-3 flex items-center gap-2 shrink-0">
              <!-- Back button circle (hidden in default overview) -->
              <button 
                v-if="currentStep !== 'overview'"
                type="button"
                @click="goBack"
                class="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              
              <!-- Search input container -->
              <div class="flex-grow relative flex items-center bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 rounded-full pl-4 pr-1.5 py-1.5 transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-500 dark:focus-within:border-brand-cyan/50 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-brand-cyan/15 focus-within:shadow-md">
                <Search class="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <input 
                  ref="searchInput"
                  type="text" 
                  placeholder="Cari lokasi tujuan" 
                  v-model="searchQuery"
                  @focus="startSearch"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  class="w-full bg-transparent border-none outline-none text-base lg:text-xs placeholder:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-2.5 pr-1.5 py-0.5"
                />
                <!-- Clear / X button -->
                <button 
                  v-if="searchQuery"
                  @click="clearSearch" 
                  class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50 transition-all shrink-0 cursor-pointer"
                >
                  <X class="w-3 h-3" />
                </button>
                <!-- Mic icon -->
                <button
                  v-else
                  class="p-1.5 rounded-full text-slate-400 hover:text-blue-500 dark:hover:text-brand-cyan hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all shrink-0 cursor-pointer"
                >
                  <Mic class="w-3.5 h-3.5" />
                </button>

              </div>

              <!-- Direction Button with Custom Premium Tooltip -->
              <div v-if="currentStep === 'selected'" class="relative group shrink-0">
                <button
                  type="button"
                  @click="getDirections"
                  class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all duration-300 cursor-pointer animate-fade-in group-hover:shadow-[0_0_8px_rgba(27,94,189,0.2)] dark:group-hover:shadow-[0_0_8px_rgba(34,211,238,0.25)]"
                >
                  <div class="w-4.5 h-4.5 bg-[#1b5ebd] dark:bg-brand-cyan rotate-45 flex items-center justify-center rounded-[2.5px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-[50deg] transition-all duration-300">
                    <div class="-rotate-45 flex items-center justify-center">
                      <CornerUpRight class="w-2.5 h-2.5 text-white dark:text-slate-950 stroke-[3.5px]" />
                    </div>
                  </div>
                </button>

                <!-- Premium Tooltip -->
                <div class="absolute right-0 top-full mt-2.5 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out whitespace-nowrap">
                  <!-- Tooltip Card -->
                  <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-1.5 backdrop-blur-sm">
                    <!-- Little arrow pointer pointing up -->
                    <div class="absolute -top-1 right-3.5 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-t border-l border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                    <Navigation class="w-3 h-3 text-brand-cyan animate-pulse shrink-0" />
                    <span>Petunjuk Rute Perjalanan</span>
                  </div>
                </div>
              </div>
              
              <!-- Layer/Map Button (only shown in overview step) -->
              <div v-if="currentStep === 'overview'" class="relative group shrink-0">
                <button 
                  type="button"
                  @click="centerMapToStartLocation"
                  class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 text-blue-500 dark:text-brand-cyan flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Locate class="w-4 h-4" :class="{'animate-spin text-blue-500 dark:text-brand-cyan': isLocating}" />
                </button>

                <!-- Premium Tooltip -->
                <div class="absolute right-0 top-full mt-2.5 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out whitespace-nowrap">
                  <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-1.5 backdrop-blur-sm">
                    <div class="absolute -top-1 right-3.5 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-t border-l border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                    <Locate class="w-3 h-3 text-brand-cyan animate-pulse shrink-0" />
                    <span>Pusatkan ke lokasi saya</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transport Hub Quick Filter (overview or selected step) -->
            <div v-if="currentStep === 'overview' || currentStep === 'selected'" class="px-4 pb-2.5 shrink-0">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Transportasi Publik Terdekat</span>
              </div>
              <div class="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  v-for="opt in transportFilterOptions"
                  :key="opt.id"
                  @click="showTransportHubs(opt.id)"
                  type="button"
                  class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none shadow-sm"
                  :class="activeTransportFilter === opt.id
                    ? opt.activeColor
                    : ('bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/30 text-slate-600 dark:text-slate-300 ' + opt.hoverColor)"
                >
                  <component :is="opt.icon" class="w-3 h-3 shrink-0" />
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Scrollable Content Area -->
            <div class="flex-grow overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar" style="will-change: transform; contain: layout style; -webkit-overflow-scrolling: touch;">

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
                <div v-if="alertDetails" class="relative overflow-hidden p-3.5 rounded-[4px] border text-[10.5px] font-semibold leading-relaxed shadow-sm transition-all duration-300 bg-gradient-to-br" :class="[alertDetails.borderColor, alertDetails.bgColor, alertDetails.textColor]">
                  <div class="flex gap-2.5">
                    <component :is="alertDetails.icon" class="w-4 h-4 shrink-0 mt-0.5 animate-pulse" :class="alertDetails.iconColor" />
                    <span class="flex-grow text-left">
                      Cuaca di <span class="font-bold" :class="alertDetails.boldTextColor">{{ startLocation.name }}</span>, {{ startLocation.region }} {{ alertDetails.messageSuffix }}
                    </span>
                  </div>
                  <!-- Floating decorative background circle at bottom right -->
                  <div class="absolute -bottom-6 -right-6 w-14 h-14 rounded-full blur-md pointer-events-none" :class="alertDetails.decorColor"></div>
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
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-[4px] overflow-hidden">
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
                        <div class="h-6 flex items-center pl-2">Cuaca</div>
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
                              <span v-if="idx === activeHourIndex" class="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mb-0.5 tracking-wide">Sekarang</span>
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
                            <!-- Cuaca (dynamic icon) -->
                            <div class="h-6 flex items-center justify-center">
                              <Sun v-if="slot.icon === 'Sun'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-amber-400' : 'text-amber-400/70'" />
                              <SunDim v-else-if="slot.icon === 'SunDim'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-amber-300' : 'text-amber-300/70'" />
                              <Cloud v-else-if="slot.icon === 'Cloud'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-slate-400' : 'text-slate-400/70'" />
                              <CloudRain v-else-if="slot.icon === 'CloudRain'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-blue-400' : 'text-blue-400/70'" />
                              <CloudLightning v-else-if="slot.icon === 'CloudLightning'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-violet-400' : 'text-violet-400/70'" />
                              <Moon v-else-if="slot.icon === 'Moon'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-indigo-300' : 'text-indigo-300/70'" />
                              <Cloud v-else class="w-3.5 h-3.5 text-slate-400/60" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Precipitation Bar Chart (real data) -->
                  <div class="px-3 pt-2 pb-3 flex flex-col gap-1.5">
                    <div class="h-10 flex items-end gap-px bg-slate-100 dark:bg-slate-950/30 rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-800/40 relative">
                      <div
                        v-for="(slot, idx) in visibleHourSlots"
                        :key="'bar-' + idx"
                        class="flex-1 rounded-t transition-all duration-300 relative group cursor-pointer"
                        :class="[
                          idx === activeHourIndex ? 'bg-blue-400 animate-pulse' :
                          (slot.precipitation ?? 0) > 50 ? 'bg-blue-500' :
                          (slot.precipitation ?? 0) > 20 ? 'bg-blue-400/80' : 'bg-blue-300/60 dark:bg-blue-500/40'
                        ]"
                        :style="{ height: Math.max(4, ((slot.precipitation ?? 0) / maxPrecipForDay) * 100) + '%' }"
                      >
                        <!-- Individual Premium Tooltip -->
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out">
                          <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white rounded-lg px-2 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.25)] backdrop-blur-sm text-center flex flex-col gap-0.5 text-[8px] font-black whitespace-nowrap">
                            <span class="text-slate-400 text-[7px] leading-none">{{ slot.time }}</span>
                            <span class="text-brand-cyan text-[8.5px] leading-tight">{{ toRainRate(slot.precipitation ?? 0) }}</span>
                            <!-- Arrow pointer pointing down -->
                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="flex justify-end items-center px-1 text-slate-400">

                      <!-- Premium Tooltip for Precipitation Explanation -->
                      <div class="relative group">
                        <button 
                          type="button"
                          class="flex items-center justify-center p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Info class="w-3.5 h-3.5" />
                        </button>

                        <!-- Tooltip Card -->
                        <div class="absolute right-0 bottom-full mb-2.5 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out w-64">
                          <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white rounded-xl p-3.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] backdrop-blur-md text-left flex flex-col gap-2">
                            <!-- Arrow pointing down to trigger icon -->
                            <div class="absolute -bottom-1.5 right-2 w-3 h-3 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>

                            <!-- Header -->
                            <div class="flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
                              <span class="text-xs font-black text-brand-cyan tracking-wide">Grafik Curah Hujan</span>
                              <span class="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-black uppercase">Info</span>
                            </div>

                            <!-- Intro -->
                            <p class="text-[10px] leading-relaxed text-slate-300">
                              Memvisualisasikan volume presipitasi (<span class="font-bold text-white">mm/jam</span>) sepanjang rute pada hari yang dipilih.
                            </p>

                            <!-- Legend List -->
                            <div class="flex flex-col gap-1.5 pt-1">
                              <!-- Item 1 -->
                              <div class="flex items-start gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                                <div class="text-[9.5px] leading-snug">
                                  <span class="font-black text-blue-400">Tinggi Batang:</span> Menggambarkan volume curah hujan (makin tinggi, makin lebat).
                                </div>
                              </div>
                              <!-- Item 2 -->
                              <div class="flex items-start gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0 animate-pulse"></span>
                                <div class="text-[9.5px] leading-snug">
                                  <span class="font-black text-blue-400">Batang Berkedip:</span> Menunjukkan jam aktif perjalanan yang sedang Anda sorot.
                                </div>
                              </div>
                              <!-- Item 3 -->
                              <div class="flex items-start gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                                <div class="text-[9.5px] leading-snug">
                                  <span class="font-black text-amber-400">Ikon Bawah:</span> Menunjukkan pergeseran tren cuaca harian (Cerah ke Hujan).
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <div class="premium-tooltip-container">
                      <button
                        v-if="!searchQuery.trim() && searchHistory.length > 0"
                        @click="clearSearchHistory"
                        class="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer py-1 px-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 class="w-3 h-3" />
                        Hapus
                      </button>
                      <div class="premium-tooltip tooltip-bottom">
                        <span>Hapus riwayat pencarian</span>
                      </div>
                    </div>
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
                <div v-if="alertDetails && destinationLocation" class="relative overflow-hidden p-3.5 rounded-[4px] border text-[10.5px] font-semibold leading-relaxed shadow-sm transition-all duration-300 bg-gradient-to-br" :class="[alertDetails.borderColor, alertDetails.bgColor, alertDetails.textColor]">
                  <div class="flex gap-2.5">
                    <component :is="alertDetails.icon" class="w-4 h-4 shrink-0 mt-0.5 animate-pulse" :class="alertDetails.iconColor" />
                    <span class="flex-grow text-left">
                      Cuaca di <span class="font-bold" :class="alertDetails.boldTextColor">{{ destinationLocation.name }}</span>, {{ destinationLocation.region }} {{ alertDetails.messageSuffix }}
                    </span>
                  </div>
                  <!-- Floating decorative background circle at bottom right -->
                  <div class="absolute -bottom-6 -right-6 w-14 h-14 rounded-full blur-md pointer-events-none" :class="alertDetails.decorColor"></div>
                </div>

                <!-- Weather Timeline Grid — Reactive 10-day + Scrollable Hourly -->
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-[4px] overflow-hidden">
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
                        <div class="h-6 flex items-center pl-2">Cuaca</div>
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
                              <span v-if="idx === activeHourIndex" class="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mb-0.5 tracking-wide">Sekarang</span>
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
                            <!-- Cuaca (dynamic icon) -->
                            <div class="h-6 flex items-center justify-center">
                              <Sun v-if="slot.icon === 'Sun'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-amber-400' : 'text-amber-400/70'" />
                              <SunDim v-else-if="slot.icon === 'SunDim'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-amber-300' : 'text-amber-300/70'" />
                              <Cloud v-else-if="slot.icon === 'Cloud'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-slate-400' : 'text-slate-400/70'" />
                              <CloudRain v-else-if="slot.icon === 'CloudRain'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-blue-400' : 'text-blue-400/70'" />
                              <CloudLightning v-else-if="slot.icon === 'CloudLightning'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-violet-400' : 'text-violet-400/70'" />
                              <Moon v-else-if="slot.icon === 'Moon'" class="w-3.5 h-3.5" :class="idx === activeHourIndex ? 'text-indigo-300' : 'text-indigo-300/70'" />
                              <Cloud v-else class="w-3.5 h-3.5 text-slate-400/60" />
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
                  </div>
                </div>

              </div>

              <!-- =================================================================
                   STEP 4: DIRECTIONS / ROUTE PLAN — Full-screen checkpoint list
                   ================================================================= -->
              <div v-else-if="currentStep === 'directions' && destinationLocation" class="space-y-3.5">
                <!-- Directions Mode Header — Premium Card -->
                <div class="relative rounded-[4px] overflow-hidden border border-slate-200/60 dark:border-slate-700/30 bg-gradient-to-br from-[#1e3a5f] via-[#1a3050] to-[#0f2035]">
                  <!-- Decorative glow blobs -->
                  <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-500/20 blur-xl pointer-events-none"></div>
                  <div class="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-cyan-400/10 blur-lg pointer-events-none"></div>

                  <div class="relative px-4 pt-4 pb-3">
                    <!-- Top row: back + title + live badge -->
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2.5">
                        <button
                          type="button"
                          @click="goBack"
                          class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <ChevronLeft class="w-4 h-4" />
                        </button>
                        <div>
                          <h3 class="text-sm font-black text-white leading-none tracking-wide">Rute Perjalanan</h3>
                          <p class="text-[9px] text-blue-200/70 font-semibold mt-0.5 uppercase tracking-widest">Prakiraan Cuaca Perjalanan</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2.5 py-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        <span class="text-[8px] font-black uppercase tracking-widest text-green-300">Live</span>
                      </div>
                    </div>

                    <!-- Route chips -->
                    <div class="flex items-center gap-2 mb-3">
                      <div class="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-blue-200/60 mb-0.5">Dari</p>
                        <p class="text-[11px] font-black text-white truncate">{{ startLocation?.name || '—' }}</p>
                      </div>
                      <div class="flex flex-col items-center gap-0.5 shrink-0">
                        <div class="w-5 h-px bg-blue-300/40"></div>
                        <svg class="w-3 h-3 text-blue-300/70" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                        <div class="w-5 h-px bg-blue-300/40"></div>
                      </div>
                      <div class="flex-1 min-w-0 bg-blue-500/20 border border-blue-400/30 rounded-xl px-2.5 py-1.5">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-cyan-300/70 mb-0.5">Tujuan</p>
                        <p class="text-[11px] font-black text-cyan-200 truncate">{{ destinationLocation?.name || '—' }}</p>
                      </div>
                    </div>

                    <!-- Stats bar -->
                    <div class="flex items-center gap-2 bg-white/[0.08] border border-white/10 rounded-xl px-3 py-2">
                      <div class="flex-1 text-center">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-blue-200/50 mb-0.5">Jarak</p>
                        <p class="text-[11px] font-black text-white">{{ routeDistance > 0 ? routeDistance + ' km' : '—' }}</p>
                      </div>
                      <div class="w-px h-6 bg-white/10"></div>
                      <div class="flex-1 text-center">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-blue-200/50 mb-0.5">Estimasi</p>
                        <p class="text-[11px] font-black text-white">{{ routeDuration || '—' }}</p>
                      </div>
                      <div class="w-px h-6 bg-white/10"></div>
                      <div class="flex-1 text-center">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-blue-200/50 mb-0.5">Rute Alt.</p>
                        <p class="text-[11px] font-black text-white">{{ alternativeRoutes.length || '—' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Travel Mode Tabs (bottom strip inside card) -->
                  <div class="flex items-center gap-1 px-3 pb-3">
                    <button
                      v-for="mode in travelModes"
                      :key="mode.id"
                      @click="activeTravelMode = mode.id"
                      class="flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5"
                      :class="activeTravelMode === mode.id
                        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                        : 'text-white/35 hover:text-white/60 border border-transparent'"
                    >
                      <component :is="mode.icon" class="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>

                <!-- ── CHECKPOINT CARDS LIST ── -->
                <div v-if="isRouting" class="space-y-4 pt-1">
                  <!-- Header skeleton -->
                  <div class="flex items-center justify-between px-1">
                    <div class="sk-bar skeleton-shimmer h-2.5 w-1/3"></div>
                    <div class="sk-bar skeleton-shimmer h-2.5 w-1/4" style="animation-delay:80ms"></div>
                  </div>

                  <!-- Destination Overview Card Skeleton -->
                  <div class="skeleton-card p-4 space-y-4 overflow-hidden">
                    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"></div>
                    <div class="flex items-center gap-3">
                      <div class="sk-block skeleton-shimmer w-9 h-9 rounded-xl shrink-0"></div>
                      <div class="flex-grow space-y-2">
                        <div class="sk-bar skeleton-shimmer h-3 w-2/3"></div>
                        <div class="sk-bar skeleton-shimmer h-2.5 w-1/2" style="animation-delay:60ms"></div>
                      </div>
                    </div>
                    <!-- Mock alert block -->
                    <div class="sk-block skeleton-shimmer h-9 w-full rounded-xl" style="animation-delay:80ms"></div>
                    <!-- Detailed stats shimmer -->
                    <div class="rounded-xl border border-slate-200/30 dark:border-slate-800/20 p-3 space-y-3">
                      <div class="grid grid-cols-4 gap-2">
                        <div v-for="j in 4" :key="j" class="sk-bar skeleton-shimmer h-2.5" :style="{ animationDelay: `${j * 60}ms` }"></div>
                      </div>
                      <div class="sk-block skeleton-shimmer h-7 w-full rounded-lg" style="animation-delay:100ms"></div>
                    </div>
                  </div>

                  <!-- Intermediate Cards Skeletons -->
                  <div
                    v-for="i in 3" :key="'skel-'+i"
                    class="skeleton-card p-4 space-y-3 overflow-hidden"
                    :style="{ animationDelay: `${i * 80}ms` }"
                  >
                    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" :style="{ animationDelay: `${i * 80}ms` }"></div>
                    <div class="flex items-center justify-between">
                      <div class="flex-grow space-y-2">
                        <div class="sk-bar skeleton-shimmer h-2.5 w-1/3" :style="{ animationDelay: `${i * 80}ms` }"></div>
                        <div class="sk-bar skeleton-shimmer h-2 w-1/2" :style="{ animationDelay: `${i * 80 + 60}ms` }"></div>
                      </div>
                      <div class="w-4 h-4 skeleton-shimmer rounded-full shrink-0" :style="{ animationDelay: `${i * 80}ms` }"></div>
                    </div>
                    <div class="h-px bg-slate-200/40 dark:bg-slate-800/30"></div>
                    <div class="flex justify-between items-center">
                      <div class="sk-bar skeleton-shimmer h-2.5 w-3/5" :style="{ animationDelay: `${i * 80 + 40}ms` }"></div>
                      <div class="sk-bar skeleton-shimmer h-2 w-1/6" :style="{ animationDelay: `${i * 80 + 80}ms` }"></div>
                    </div>
                  </div>
                </div>

                <!-- Actual Checkpoint Cards List -->
                <div v-else class="space-y-3">
                  
                  <!-- 1. DESTINATION OVERVIEW CARD -->
                  <div
                    v-if="directionsCheckpoints.length > 0"
                    class="rounded-[4px] overflow-hidden border"
                    :class="directionsCheckpoints[0].condition === 'badai'
                      ? 'border-red-400/30 dark:border-red-500/20'
                      : directionsCheckpoints[0].condition === 'hujan'
                        ? 'border-blue-400/30 dark:border-blue-500/20'
                        : 'border-slate-200/60 dark:border-slate-700/30'"
                  >
                    <!-- Gradient Header Banner -->
                    <div
                      class="px-4 pt-4 pb-3 flex items-start gap-3"
                      :class="directionsCheckpoints[0].condition === 'badai'
                        ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/30'
                        : directionsCheckpoints[0].condition === 'hujan'
                          ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30'
                          : directionsCheckpoints[0].condition === 'berawan'
                            ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-800/40'
                            : 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20'"
                    >
                      <div
                        class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg border"
                        :class="directionsCheckpoints[0].condition === 'badai'
                          ? 'bg-red-100 dark:bg-red-900/30 border-red-200/60 dark:border-red-700/30'
                          : directionsCheckpoints[0].condition === 'hujan'
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200/60 dark:border-blue-700/30'
                            : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/30'"
                      >{{ directionsCheckpoints[0].icon }}</div>
                      <div class="min-w-0 flex-grow">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="text-sm font-black text-slate-900 dark:text-white leading-tight">{{ directionsCheckpoints[0].name }}</h4>
                          <span
                            class="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                            :class="directionsCheckpoints[0].condition === 'badai' ? 'bg-red-500/15 text-red-500 dark:text-red-400' : directionsCheckpoints[0].condition === 'hujan' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : directionsCheckpoints[0].condition === 'berawan' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'"
                          >{{ directionsCheckpoints[0].weather }}</span>
                        </div>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                          <span class="text-[10px] font-bold" :class="directionsCheckpoints[0].condition === 'badai' ? 'text-red-500 dark:text-red-400' : directionsCheckpoints[0].condition === 'hujan' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'">
                            Tiba ~{{ directionsCheckpoints[0].eta }}
                            <span v-if="directionsCheckpoints[0].elapsed" class="font-semibold opacity-70">({{ directionsCheckpoints[0].elapsed }})</span>
                          </span>
                          <span class="text-[9px] text-slate-400">•</span>
                          <span class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold flex items-center gap-1"><MapPin class="w-2.5 h-2.5" />{{ routeDistance }} km • {{ directionsCheckpoints[0].region }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Condition-aware Alert -->
                    <div
                      class="mx-3 mb-3 rounded-xl p-3 flex items-start gap-2.5 text-[10px] font-semibold leading-relaxed border"
                      :class="directionsCheckpoints[0].condition === 'badai' ? 'bg-red-500/8 border-red-400/25 text-red-600 dark:text-red-400' : directionsCheckpoints[0].condition === 'hujan' ? 'bg-blue-500/8 border-blue-400/25 text-blue-600 dark:text-blue-400' : directionsCheckpoints[0].condition === 'berawan' ? 'bg-slate-500/8 border-slate-300/40 text-slate-600 dark:text-slate-400' : 'bg-amber-500/8 border-amber-400/25 text-amber-700 dark:text-amber-400'"
                    >
                      <CloudLightning v-if="directionsCheckpoints[0].condition === 'badai'" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <CloudRain v-else-if="directionsCheckpoints[0].condition === 'hujan'" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <Cloud v-else-if="directionsCheckpoints[0].condition === 'berawan'" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <Sun v-else class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{{ directionsCheckpoints[0].alerts[0] || 'Kondisi cuaca normal saat tiba.' }}</span>
                    </div>

                    <!-- Weather Grid -->
                    <div class="mx-3 mb-3 bg-white/90 dark:bg-[#111e2b]/80 border border-slate-200/60 dark:border-slate-800/40 rounded-xl overflow-hidden text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                      <div class="flex">
                        <!-- Left Labels (Fixed) -->
                        <div class="flex-shrink-0 w-14 border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between text-left text-slate-400 font-bold select-none py-1.5">
                          <div class="h-7 flex items-center pl-2">Jam</div>
                          <div class="h-6 flex items-center pl-2">Suhu</div>
                          <div class="h-5 flex items-center pl-2">Angin</div>
                          <div class="h-5 flex items-center pl-2">Arah</div>
                          <div class="h-5 flex items-center pl-2">Hujan</div>
                          <div class="h-6 flex items-center pl-2">Cuaca</div>
                        </div>
                        <!-- Right Columns (Scrollable) -->
                        <div id="cp-scroll-0" class="flex-grow overflow-x-auto no-scrollbar scroll-smooth" style="will-change: transform; transform: translate3d(0,0,0);">
                          <div class="flex" style="width: 1344px;">
                            <div
                              v-for="(t, ti) in directionsCheckpoints[0].grid.times"
                              :key="'t-dest-'+ti"
                              class="flex-shrink-0 w-14 flex flex-col items-center justify-between py-1.5"
                              :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'bg-blue-500/10 dark:bg-blue-500/15' : ''"
                            >
                              <!-- Jam -->
                              <div class="h-7 flex flex-col items-center justify-center leading-none text-center">
                                <span v-if="ti === directionsCheckpoints[0].grid.nowIdx" class="text-[7px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-0.5">ETA</span>
                                <span class="font-extrabold" :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'">{{ t }}</span>
                              </div>
                              <!-- Suhu -->
                              <div class="h-6 flex items-center justify-center font-black text-[11px] relative" :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'">
                                {{ directionsCheckpoints[0].grid.suhu[ti] }}°
                                <div v-if="ti === directionsCheckpoints[0].grid.nowIdx" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[68px] border-l border-dashed border-blue-400/25 pointer-events-none z-10"></div>
                              </div>
                              <!-- Angin -->
                              <div class="h-5 flex items-center justify-center text-[10px] font-semibold" :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'">
                                {{ directionsCheckpoints[0].grid.angin[ti] }}
                              </div>
                              <!-- Arah -->
                              <div class="h-5 flex items-center justify-center">
                                <Navigation class="w-2.5 h-2.5" :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500' : 'text-slate-450'" />
                              </div>
                              <!-- Hujan -->
                              <div class="h-5 flex items-center justify-center text-[10px] font-semibold" :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black' : 'text-slate-600 dark:text-slate-300'">
                                {{ directionsCheckpoints[0].grid.hujan[ti] }}
                              </div>
                              <!-- Cuaca -->
                              <div class="h-6 flex items-center justify-center">
                                <Sun v-if="directionsCheckpoints[0].grid.cuaca[ti] === 'Sun'" class="w-3.5 h-3.5 text-amber-400" />
                                <SunDim v-else-if="directionsCheckpoints[0].grid.cuaca[ti] === 'SunDim'" class="w-3.5 h-3.5 text-amber-300" />
                                <Cloud v-else-if="directionsCheckpoints[0].grid.cuaca[ti] === 'Cloud'" class="w-3.5 h-3.5 text-slate-400" />
                                <CloudRain v-else-if="directionsCheckpoints[0].grid.cuaca[ti] === 'CloudRain'" class="w-3.5 h-3.5 text-blue-400" />
                                <CloudLightning v-else-if="directionsCheckpoints[0].grid.cuaca[ti] === 'CloudLightning'" class="w-3.5 h-3.5 text-violet-400" />
                                <Moon v-else-if="directionsCheckpoints[0].grid.cuaca[ti] === 'Moon'" class="w-3.5 h-3.5 text-indigo-300" />
                                <Cloud v-else class="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- Rain Sparkline -->
                      <div class="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800/60">
                        <div class="flex items-center gap-1.5 mb-1.5">
                          <CloudRain class="w-2.5 h-2.5 text-blue-400" />
                          <span class="text-[8px] font-black uppercase tracking-wide text-slate-400">Curah Hujan 24 jam</span>
                        </div>
                        <div class="h-8 flex items-end gap-px rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950/30 px-1 py-1">
                          <div v-for="(bar, bi) in directionsCheckpoints[0].rainBars" :key="bi" class="flex-1 rounded-t-sm" :style="{ height: bar + '%' }" :class="bar > 40 ? 'bg-blue-500' : bar > 20 ? 'bg-blue-400/60' : 'bg-blue-400/20'"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ROUTE CHECKPOINT DIVIDER -->
                  <div v-if="directionsCheckpoints.length > 1" class="flex items-center gap-2 px-1">
                    <div class="h-px flex-grow bg-slate-200/80 dark:bg-slate-800/50"></div>
                    <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                      <MapPin class="w-2.5 h-2.5" />Checkpoint Rute
                    </span>
                    <div class="h-px flex-grow bg-slate-200/80 dark:bg-slate-800/50"></div>
                  </div>

                  <!-- 2. COLLAPSIBLE INTERMEDIATE CHECKPOINTS -->
                  <div
                    v-for="(cp, idx) in directionsCheckpoints.slice(1)"
                    :key="cp.id"
                    class="rounded-[4px] overflow-hidden border text-left transition-all duration-200"
                    :class="cp.condition === 'badai'
                      ? 'border-red-300/30 dark:border-red-500/15 bg-red-50/30 dark:bg-red-950/10'
                      : cp.condition === 'hujan'
                        ? 'border-blue-300/30 dark:border-blue-500/15 bg-blue-50/20 dark:bg-blue-950/10'
                        : 'border-slate-200/60 dark:border-slate-700/30 bg-slate-50 dark:bg-[#1c2d3f]/70'"
                  >
                    <!-- Card Header -->
                    <div class="p-3.5 space-y-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-grow">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="w-2 h-2 rounded-full shrink-0" :class="cp.condition === 'badai' ? 'bg-red-500' : cp.condition === 'hujan' ? 'bg-blue-500' : cp.condition === 'berawan' ? 'bg-slate-400' : 'bg-amber-400'"></span>
                            <span class="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{{ cp.name }}</span>
                            <span class="text-[8px] font-black px-1.5 py-0.5 rounded-full" :class="cp.condition === 'badai' ? 'bg-red-500/12 text-red-500 dark:text-red-400' : cp.condition === 'hujan' ? 'bg-blue-500/12 text-blue-600 dark:text-blue-400' : cp.condition === 'berawan' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' : 'bg-amber-500/12 text-amber-600 dark:text-amber-400'">{{ cp.weather }}</span>
                          </div>
                          <div class="flex items-center gap-1.5 mt-1">
                            <span class="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Tiba ~{{ cp.eta }}<span v-if="cp.elapsed" class="opacity-70"> ({{ cp.elapsed }})</span></span>
                            <span class="text-[9px] text-slate-400">•</span>
                            <span class="text-[9px] text-slate-400 dark:text-slate-550 font-medium">{{ cp.region }}</span>
                          </div>
                          <div class="flex items-center gap-2 mt-1.5">
                            <span class="text-sm leading-none">{{ cp.icon }}</span>
                            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{{ cp.tempHigh }}° / {{ cp.tempLow }}°</span>
                          </div>
                        </div>
                        <button
                          @click="toggleCheckpoint(idx + 1)"
                          class="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 border"
                          :class="expandedCheckpoints.has(idx + 1) ? 'bg-blue-500/10 border-blue-400/30 text-blue-500 rotate-180' : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/30 text-slate-400 hover:text-slate-600 dark:hover:text-white'"
                        >
                          <svg class="w-3 h-3 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>
                      <!-- Smart Alert Bullets from real data -->
                      <div class="space-y-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/40">
                        <div v-for="(alert, ai) in cp.alerts.slice(0, 2)" :key="ai" class="flex items-start gap-2 text-[9.5px] font-semibold leading-snug" :class="cp.condition === 'badai' ? 'text-red-600 dark:text-red-400' : cp.condition === 'hujan' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-350'">
                          <CloudLightning v-if="cp.condition === 'badai'" class="w-3 h-3 shrink-0 mt-0.5 text-red-500" />
                          <CloudRain v-else-if="cp.condition === 'hujan'" class="w-3 h-3 shrink-0 mt-0.5 text-blue-400" />
                          <Sun v-else class="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
                          <span>{{ alert }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Expanded weather grid -->
                    <Transition name="expand">
                      <div v-if="expandedCheckpoints.has(idx + 1)" class="px-3.5 pb-3.5">
                        <div class="bg-white/90 dark:bg-[#111e2b]/80 border border-slate-200/60 dark:border-slate-800/40 rounded-xl overflow-hidden text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                          <div class="flex">
                            <!-- Left Labels (Fixed) -->
                            <div class="flex-shrink-0 w-14 border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between text-left text-slate-400 font-bold select-none py-1.5">
                              <div class="h-7 flex items-center pl-2">Jam</div>
                              <div class="h-6 flex items-center pl-2">Suhu</div>
                              <div class="h-5 flex items-center pl-2">Angin</div>
                              <div class="h-5 flex items-center pl-2">Arah</div>
                              <div class="h-5 flex items-center pl-2">Hujan</div>
                              <div class="h-6 flex items-center pl-2">Cuaca</div>
                            </div>
                            <!-- Right Columns (Scrollable) -->
                            <div :id="'cp-scroll-' + (idx + 1)" class="flex-grow overflow-x-auto no-scrollbar scroll-smooth" style="will-change: transform; transform: translate3d(0,0,0);">
                              <div class="flex" style="width: 1344px;">
                                <div
                                  v-for="(t, ti) in cp.grid.times"
                                  :key="'t-cp-'+idx+'-'+ti"
                                  class="flex-shrink-0 w-14 flex flex-col items-center justify-between py-1.5"
                                  :class="ti === cp.grid.nowIdx ? 'bg-blue-500/10 dark:bg-blue-500/15' : ''"
                                >
                                  <!-- Jam -->
                                  <div class="h-7 flex flex-col items-center justify-center leading-none text-center">
                                    <span v-if="ti === cp.grid.nowIdx" class="text-[7px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-0.5">ETA</span>
                                    <span class="font-extrabold" :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'">{{ t }}</span>
                                  </div>
                                  <!-- Suhu -->
                                  <div class="h-6 flex items-center justify-center font-black text-[11px] relative" :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'">
                                    {{ cp.grid.suhu[ti] }}°
                                    <div v-if="ti === cp.grid.nowIdx" class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[68px] border-l border-dashed border-blue-400/25 pointer-events-none z-10"></div>
                                  </div>
                                  <!-- Angin -->
                                  <div class="h-5 flex items-center justify-center text-[10px] font-semibold" :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'">
                                    {{ cp.grid.angin[ti] }}
                                  </div>
                                  <!-- Arah -->
                                  <div class="h-5 flex items-center justify-center">
                                    <Navigation class="w-2.5 h-2.5" :class="ti === cp.grid.nowIdx ? 'text-blue-500' : 'text-slate-450'" />
                                  </div>
                                  <!-- Hujan -->
                                  <div class="h-5 flex items-center justify-center text-[10px] font-semibold" :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black' : 'text-slate-600 dark:text-slate-300'">
                                    {{ cp.grid.hujan[ti] }}
                                  </div>
                                  <!-- Cuaca -->
                                  <div class="h-6 flex items-center justify-center">
                                    <Sun v-if="cp.grid.cuaca[ti] === 'Sun'" class="w-3.5 h-3.5 text-amber-400" />
                                    <SunDim v-else-if="cp.grid.cuaca[ti] === 'SunDim'" class="w-3.5 h-3.5 text-amber-300" />
                                    <Cloud v-else-if="cp.grid.cuaca[ti] === 'Cloud'" class="w-3.5 h-3.5 text-slate-400" />
                                    <CloudRain v-else-if="cp.grid.cuaca[ti] === 'CloudRain'" class="w-3.5 h-3.5 text-blue-400" />
                                    <CloudLightning v-else-if="cp.grid.cuaca[ti] === 'CloudLightning'" class="w-3.5 h-3.5 text-violet-400" />
                                    <Moon v-else-if="cp.grid.cuaca[ti] === 'Moon'" class="w-3.5 h-3.5 text-indigo-300" />
                                    <Cloud v-else class="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <!-- Rain Sparkline -->
                          <div class="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800/60">
                            <div class="h-7 flex items-end gap-px rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950/30 px-1 py-1">
                              <div v-for="(bar, bi) in cp.rainBars" :key="bi" class="flex-1 rounded-t-sm" :style="{ height: bar + '%' }" :class="bar > 40 ? 'bg-blue-500' : bar > 20 ? 'bg-blue-400/60' : 'bg-blue-400/20'"></div>
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

/* Custom Leaflet Popup premium glassmorphism styles */
.leaflet-popup-content-wrapper {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  border: 1px solid rgba(255, 255, 255, 0.45) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04) !important;
  border-radius: 20px !important;
  transition: all 0.3s ease;
}

.dark .leaflet-popup-content-wrapper {
  background: rgba(15, 23, 42, 0.75) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

.leaflet-popup-tip {
  background: rgba(255, 255, 255, 0.75) !important;
  border: 1px solid rgba(255, 255, 255, 0.45) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  box-shadow: none !important;
}

.dark .leaflet-popup-tip {
  background: rgba(15, 23, 42, 0.75) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
}

.leaflet-popup-content {
  margin: 14px 16px !important;
  font-family: inherit !important;
}

.leaflet-popup-close-button {
  top: 8px !important;
  right: 8px !important;
  color: #94a3b8 !important;
  font-size: 14px !important;
  transition: color 0.2s ease !important;
}

.leaflet-popup-close-button:hover {
  color: #475569 !important;
}

.dark .leaflet-popup-close-button:hover {
  color: #f1f5f9 !important;
}
</style>

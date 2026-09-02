<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { 
  Droplets, 
  Wind, 
  Sun, 
  Eye,
  Thermometer,
  Navigation,
  Sunrise,
  Sunset,
  Moon
} from 'lucide-vue-next';
import type { WeatherData } from '../types/weather';
import type { AdditionalWeatherInfo } from '../data/weatherHelpers';
import { 
  getAdditionalWeatherData, 
  getComfortIndex
} from '../data/weatherHelpers';

const props = defineProps<{
  weatherData: WeatherData;
  cities: string[];
  selectedCity: string;
  additionalInfo?: AdditionalWeatherInfo;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
  (e: 'delete-city', city: string): void;
}>();

// Real-time ticking clock state
// ⚡ Perf: interval reduced to 60s — sun/moon positions don't change within a second.
// The display format is HH:MM so 1-minute precision is fully sufficient.
const currentTime = ref(new Date());
let clockIntervalId: ReturnType<typeof setInterval> | null = null;

// Derived minute-level signal — computed properties that depend on time
// (sunPosition, moonPosition) will only re-run when the minute actually changes.
const currentMinute = computed(() => {
  const t = currentTime.value;
  return t.getHours() * 60 + t.getMinutes();
});

onMounted(() => {
  // Align to the next whole minute so the first tick is on a clean boundary
  const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
  const alignTimer = setTimeout(() => {
    currentTime.value = new Date();
    clockIntervalId = setInterval(() => {
      currentTime.value = new Date();
    }, 60000);
  }, msUntilNextMinute);
  // Store alignTimer so we can clear it on unmount if component unmounts before it fires
  (clockIntervalId as any) = alignTimer;
});

onUnmounted(() => {
  if (clockIntervalId) clearInterval(clockIntervalId);
  document.body.classList.remove('drawer-open');
});

// Additional weather details for metric cards
const additionalWeatherData = computed(() => {
  return props.additionalInfo || getAdditionalWeatherData(props.selectedCity);
});

// Dynamic comfort index data based on temperature
const comfortIndex = computed(() => {
  return getComfortIndex(props.weatherData.temp);
});


const sunPosition = computed(() => {
  if (!additionalWeatherData.value) return { x: 50, y: 15, isDay: true };
  // ⚡ Perf: depends on currentMinute (changes every 60s) not currentTime (was every 1s)
  void currentMinute.value;

  const city = props.selectedCity.toLowerCase();
  let offset = 7; // WIB (UTC+7)
  if (city.includes('makassar') || city.includes('denpasar')) {
    offset = 8; // WITA (UTC+8)
  }
  
  const utc = currentTime.value.getTime() + (currentTime.value.getTimezoneOffset() * 60000);
  const cityTime = new Date(utc + (3600000 * offset));
  const currentMinutes = cityTime.getHours() * 60 + cityTime.getMinutes();
  
  // Parse Sunrise
  const [srHour, srMin] = additionalWeatherData.value.sunrise.split(':').map(Number);
  const sunriseMinutes = srHour * 60 + srMin;
  
  // Parse Sunset
  const [ssHour, ssMin] = additionalWeatherData.value.sunset.split(':').map(Number);
  const sunsetMinutes = ssHour * 60 + ssMin;
  
  const isDay = currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
  
  let ratio = 0.5;
  if (isDay) {
    // daytime progression: from sunrise (0) to sunset (1)
    ratio = (currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
  } else {
    // nighttime: anchor sun at the bottom corners
    if (currentMinutes >= sunsetMinutes) {
      ratio = 1.0; // sunset horizon (right side)
    } else {
      ratio = 0.0; // sunrise horizon (left side)
    }
  }
  
  ratio = Math.max(0, Math.min(1, ratio));
  
  // Calculate cx, cy along semi-circle path M 5 45 A 40 40 0 0 1 95 45
  const theta = Math.PI - ratio * Math.PI; // from PI to 0
  const x = 50 + 45 * Math.cos(theta);
  const y = 45 - 45 * Math.sin(theta);
  
  return { x, y, isDay };
});

const moonPosition = computed(() => {
  if (!additionalWeatherData.value) return { x: 50, y: 15, isMoonUp: false };
  // ⚡ Perf: depends on currentMinute (changes every 60s) not currentTime (was every 1s)
  void currentMinute.value;

  const city = props.selectedCity.toLowerCase();
  let offset = 7; // WIB (UTC+7)
  if (city.includes('makassar') || city.includes('denpasar')) {
    offset = 8; // WITA (UTC+8)
  }
  
  const utc = currentTime.value.getTime() + (currentTime.value.getTimezoneOffset() * 60000);
  const cityTime = new Date(utc + (3600000 * offset));
  const currentMinutes = cityTime.getHours() * 60 + cityTime.getMinutes();
  
  // Parse Moonrise
  const [mrHour, mrMin] = additionalWeatherData.value.moonrise.split(':').map(Number);
  const moonriseMinutes = mrHour * 60 + mrMin;
  
  // Parse Moonset
  const [msHour, msMin] = additionalWeatherData.value.moonset.split(':').map(Number);
  const moonsetMinutes = msHour * 60 + msMin;
  
  let isMoonUp = false;
  let ratio = 0.5;
  
  if (moonriseMinutes < moonsetMinutes) {
    isMoonUp = currentMinutes >= moonriseMinutes && currentMinutes < moonsetMinutes;
    if (isMoonUp) {
      ratio = (currentMinutes - moonriseMinutes) / (moonsetMinutes - moonriseMinutes);
    } else {
      // Moon is set or hasn't risen yet
      if (currentMinutes >= moonsetMinutes) {
        ratio = 1.0; // set (right side)
      } else {
        ratio = 0.0; // not risen yet (left side)
      }
    }
  } else {
    isMoonUp = currentMinutes >= moonriseMinutes || currentMinutes < moonsetMinutes;
    if (isMoonUp) {
      if (currentMinutes >= moonriseMinutes) {
        ratio = (currentMinutes - moonriseMinutes) / ((24 * 60 - moonriseMinutes) + moonsetMinutes);
      } else {
        ratio = ((24 * 60 - moonriseMinutes) + currentMinutes) / ((24 * 60 - moonriseMinutes) + moonsetMinutes);
      }
    } else {
      // Moon is set or hasn't risen yet (between moonset and moonrise)
      if (currentMinutes >= moonsetMinutes && currentMinutes < moonriseMinutes) {
        const mid = (moonsetMinutes + moonriseMinutes) / 2;
        ratio = currentMinutes >= mid ? 0.0 : 1.0;
      }
    }
  }
  
  ratio = Math.max(0, Math.min(1, ratio));
  
  // Calculate cx, cy along semi-circle path M 5 45 A 40 40 0 0 1 95 45
  const theta = Math.PI - ratio * Math.PI; // from PI to 0
  const x = 50 + 45 * Math.cos(theta);
  const y = 45 - 45 * Math.sin(theta);
  
  return { x, y, isMoonUp };
});

// ── Dropdown Controls for Other Cities ──
const cityDropdownContainer = ref<HTMLElement | null>(null);
const showCityDropdown = ref(false);

const handleCityClickOutside = (event: MouseEvent) => {
  if (
    showCityDropdown.value &&
    cityDropdownContainer.value &&
    !cityDropdownContainer.value.contains(event.target as Node)
  ) {
    showCityDropdown.value = false;
  }
};

const handleCityScroll = () => {
  if (showCityDropdown.value) {
    showCityDropdown.value = false;
  }
};




onMounted(() => {
  document.addEventListener('click', handleCityClickOutside);
  window.addEventListener('scroll', handleCityScroll, { passive: true });
});

onUnmounted(() => {
  document.removeEventListener('click', handleCityClickOutside);
  window.removeEventListener('scroll', handleCityScroll);
});
</script>
<template>
  <div class="space-y-6">



    <!-- Responsive Weather Grid Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

      <!-- ── Shared mini illustration helper (rendered inside each card) ────── -->
      <!-- Slide transition wrapper: overflow-hidden clips the outgoing/incoming cards -->

      <!-- Card 1: Suhu -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- 🌡️ Temperature Illustration: Village + sun/clouds + thermometer -->
        <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="suhuBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f97316" stop-opacity="0"/>
                <stop offset="100%" stop-color="#f97316" stop-opacity="0.3"/>
              </linearGradient>
            </defs>
            <rect width="200" height="80" fill="url(#suhuBgGrad)"/>
            <!-- Ground -->
            <rect x="0" y="68" width="200" height="12" fill="#84cc16" opacity="0.5"/>
            <!-- Far hills -->
            <path d="M0 64 Q30 48 60 56 Q90 64 120 50 Q150 36 180 52 Q195 58 200 60 L200 80 L0 80Z" fill="#65a30d" opacity="0.35"/>
            <!-- Cottage -->
            <rect x="18" y="52" width="26" height="18" fill="#d97706" opacity="0.75" rx="1"/>
            <polygon points="14,52 31,38 48,52" fill="#b45309" opacity="0.85"/>
            <rect x="27" y="58" width="7" height="12" fill="#1e293b" opacity="0.7"/>
            <rect x="20" y="55" width="5" height="5" fill="#fef08a" opacity="0.9"/>
            <rect x="39" y="55" width="4" height="4" fill="#fef08a" opacity="0.7"/>
            <rect x="30" y="42" width="3" height="10" fill="#d97706" opacity="0.8"/>
            <circle cx="31" cy="39" r="3" fill="#94a3b8" opacity="0.3"/>
            <!-- Pine trees -->
            <g fill="#166534" opacity="0.7">
              <polygon points="60,68 65,52 70,68"/>
              <polygon points="63,62 68,50 73,62"/>
              <rect x="64" y="68" width="3" height="5" fill="#78350f" opacity="0.8"/>
              <polygon points="75,70 80,57 85,70"/>
              <rect x="79" y="70" width="3" height="4" fill="#78350f" opacity="0.8"/>
            </g>
            <!-- Sun (large, top right) -->
            <circle cx="165" cy="18" r="20" fill="#fbbf24" opacity="0.18" class="animate-pulse"/>
            <circle cx="165" cy="18" r="13" fill="#fbbf24" opacity="0.55"/>
            <circle cx="165" cy="18" r="8" fill="#fff" opacity="0.7"/>
            <!-- Sun rays -->
            <g stroke="#fbbf24" stroke-width="1.5" opacity="0.5" stroke-linecap="round">
              <line x1="165" y1="0" x2="165" y2="4"/>
              <line x1="165" y1="32" x2="165" y2="36"/>
              <line x1="147" y1="18" x2="143" y2="18"/>
              <line x1="183" y1="18" x2="187" y2="18"/>
              <line x1="152" y1="5" x2="149" y2="2"/>
              <line x1="178" y1="31" x2="181" y2="34"/>
              <line x1="178" y1="5" x2="181" y2="2"/>
              <line x1="152" y1="31" x2="149" y2="34"/>
            </g>
            <!-- Thermometer -->
            <rect x="128" y="30" width="8" height="30" fill="#e2e8f0" opacity="0.85" rx="4"/>
            <rect x="130" y="42" width="4" height="18" fill="#ef4444" opacity="0.85" rx="2"/>
            <circle cx="132" cy="60" r="6" fill="#ef4444" opacity="0.9"/>
            <!-- Cloud -->
            <path d="M90 22 Q95 14 104 16 Q107 8 116 10 Q125 6 127 14 Q133 12 134 20 Q135 27 127 28 Q113 32 99 30 Q89 29 90 22Z" fill="#f1f5f9" opacity="0.75"/>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Suhu</span>
          <div class="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400 shrink-0">
            <Thermometer class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.temp }}<span class="text-xs font-semibold">°C</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Suhu udara saat ini</p>
        </div>
      </div>

      <!-- Card 2: Angin -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- 💨 Wind Illustration: Turbines + hills + wind lines -->
        <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="anginBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#06b6d4" stop-opacity="0"/>
                <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.25"/>
              </linearGradient>
            </defs>
            <rect width="200" height="80" fill="url(#anginBgGrad)"/>
            <!-- Hills -->
            <path d="M0 70 Q40 52 80 62 Q120 72 160 56 Q180 48 200 58 L200 80 L0 80Z" fill="#4ade80" opacity="0.3"/>
            <path d="M0 76 Q30 68 70 72 Q110 76 150 70 Q175 66 200 72 L200 80 L0 80Z" fill="#16a34a" opacity="0.45"/>
            <!-- Wind Turbine 1 -->
            <line x1="65" y1="78" x2="65" y2="36" stroke="#cbd5e1" stroke-width="2.5" opacity="0.85"/>
            <circle cx="65" cy="36" r="3" fill="#94a3b8" opacity="0.9"/>
            <g class="turbine-blades" :class="weatherData.windSpeed > 15 ? 'turbine-spin-fast' : weatherData.windSpeed > 10 ? 'turbine-spin-medium' : 'turbine-spin-slow'" style="transform-origin:65px 36px">
              <polygon points="65,36 63,12 67,12" fill="#e2e8f0" opacity="0.85"/>
              <polygon points="65,36 86,47 84,51" fill="#e2e8f0" opacity="0.85"/>
              <polygon points="65,36 44,47 46,51" fill="#e2e8f0" opacity="0.85"/>
            </g>
            <!-- Wind Turbine 2 -->
            <line x1="120" y1="78" x2="120" y2="50" stroke="#94a3b8" stroke-width="1.8" opacity="0.7"/>
            <circle cx="120" cy="50" r="2" fill="#64748b" opacity="0.8"/>
            <g class="turbine-blades" :class="weatherData.windSpeed > 15 ? 'turbine-spin-fast' : weatherData.windSpeed > 10 ? 'turbine-spin-medium' : 'turbine-spin-slow'" style="transform-origin:120px 50px">
              <polygon points="120,50 118,32 122,32" fill="#cbd5e1" opacity="0.7"/>
              <polygon points="120,50 136,59 134,63" fill="#cbd5e1" opacity="0.7"/>
              <polygon points="120,50 104,59 106,63" fill="#cbd5e1" opacity="0.7"/>
            </g>
            <!-- Wind flow lines -->
            <path d="M165 14 Q135 19 105 11 T45 17" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5" class="mini-wind-line"/>
            <path d="M175 29 Q145 34 115 26 T55 32" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.4" class="mini-wind-line mini-wind-line2"/>
            <path d="M160 44 Q130 49 100 41 T40 47" stroke="#22d3ee" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.35" class="mini-wind-line mini-wind-line3"/>
            <!-- Grass bending -->
            <path d="M10 76 Q5 66 0 68" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.6"/>
            <path d="M185 76 Q178 66 172 69" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.6"/>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Angin</span>
          <div class="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 dark:bg-teal-500/15 dark:text-teal-400 shrink-0">
            <Wind class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.windSpeed }}<span class="text-xs font-semibold">km/jam</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Hembusan angin rata-rata</p>
        </div>
      </div>

      <!-- Card 3: Arah Angin -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- 🧭 Compass Illustration: Compass rose + countryside -->
        <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="arahBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.2"/>
              </linearGradient>
            </defs>
            <rect width="200" height="80" fill="url(#arahBgGrad)"/>
            <!-- Ground + hills -->
            <path d="M0 68 Q50 58 100 64 Q150 70 200 62 L200 80 L0 80Z" fill="#65a30d" opacity="0.35"/>
            <rect x="0" y="72" width="200" height="8" fill="#84cc16" opacity="0.4"/>
            <!-- Cottage left -->
            <rect x="10" y="55" width="22" height="16" fill="#d97706" opacity="0.7" rx="1"/>
            <polygon points="7,55 21,43 35,55" fill="#b45309" opacity="0.8"/>
            <rect x="19" y="61" width="6" height="10" fill="#1e293b" opacity="0.65"/>
            <!-- Trees right -->
            <g fill="#166534" opacity="0.65">
              <polygon points="150,68 156,52 162,68"/>
              <polygon points="158,70 165,56 172,70"/>
              <rect x="155" y="68" width="3" height="5" fill="#78350f"/>
              <rect x="164" y="70" width="3" height="4" fill="#78350f"/>
            </g>
            <!-- Compass Rose centered -->
            <g transform="translate(100,38)">
              <circle cx="0" cy="0" r="22" stroke="#6366f1" stroke-width="1" opacity="0.4" fill="none"/>
              <circle cx="0" cy="0" r="15" stroke="#a5b4fc" stroke-width="0.5" opacity="0.3" fill="none"/>
              <!-- Diagonal secondary points -->
              <polygon points="0,-10 -4,-4 0,0" fill="#94a3b8" opacity="0.4"/>
              <polygon points="10,0 4,-4 0,0" fill="#94a3b8" opacity="0.4"/>
              <polygon points="0,10 4,4 0,0" fill="#94a3b8" opacity="0.4"/>
              <polygon points="-10,0 -4,4 0,0" fill="#94a3b8" opacity="0.4"/>
              <!-- Cardinal N S E W -->
              <polygon points="0,-22 -3,-8 3,-8" fill="#ef4444" opacity="0.9"/>
              <polygon points="0,22 -3,8 3,8" fill="#475569" opacity="0.75"/>
              <polygon points="22,0 8,-3 8,3" fill="#475569" opacity="0.75"/>
              <polygon points="-22,0 -8,-3 -8,3" fill="#475569" opacity="0.75"/>
              <!-- Dynamic needle -->
              <g :transform="`rotate(${additionalWeatherData.windAngle})`" style="transition: transform 1s ease">
                <polygon points="0,-18 -2,-4 2,-4" fill="#ef4444" opacity="0.95"/>
                <polygon points="0,18 -2,4 2,4" fill="#334155" opacity="0.8"/>
              </g>
              <!-- Center cap -->
              <circle cx="0" cy="0" r="3.5" fill="#fff" stroke="#334155" stroke-width="1"/>
              <circle cx="0" cy="0" r="1" fill="#ef4444"/>
            </g>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Arah Angin</span>
          <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-brand-cyan/15 dark:text-brand-cyan shrink-0">
            <Navigation class="w-4 h-4 transition-transform duration-700" :style="{ transform: `rotate(${additionalWeatherData.windAngle}deg)` }" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ additionalWeatherData.windDir }}
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Arah tiupan angin</p>
        </div>
      </div>

      <!-- Card 4: Kelembapan -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- 💧 Humidity Illustration: Rainforest + water drops -->
        <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="humBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.3"/>
              </linearGradient>
            </defs>
            <rect width="200" height="80" fill="url(#humBgGrad)"/>
            <!-- Ground -->
            <rect x="0" y="70" width="200" height="10" fill="#065f46" opacity="0.5"/>
            <!-- Tropical leaves back-left -->
            <g transform="translate(0,80)" fill="#047857" opacity="0.5">
              <path d="M0 0 L-8 -45 Q5 -65 30 -70 C18 -50 8 -30 0 0Z"/>
              <path d="M0 0 L8 -40 Q20 -58 45 -60 C30 -42 15 -25 0 0Z"/>
              <path d="M0 0 L-20 -30 Q-35 -42 -55 -40 C-38 -30 -20 -18 0 0Z"/>
            </g>
            <!-- Tropical leaves back-right -->
            <g transform="translate(200,80)" fill="#059669" opacity="0.45">
              <path d="M0 0 L8 -45 Q-5 -65 -30 -70 C-18 -50 -8 -30 0 0Z"/>
              <path d="M0 0 L-8 -40 Q-20 -58 -45 -60 C-30 -42 -15 -25 0 0Z"/>
            </g>
            <!-- Mist overlay -->
            <ellipse cx="100" cy="55" rx="80" ry="22" fill="#e0f2fe" opacity="0.2"/>
            <!-- Water drops -->
            <path d="M55 30 C55 30 51 38 51 41 A4 4 0 0 0 59 41 C59 38 55 30 55 30Z" fill="#38bdf8" opacity="0.7" class="mini-drop-float"/>
            <path d="M100 18 C100 18 97 25 97 27 A3 3 0 0 0 103 27 C103 25 100 18 100 18Z" fill="#7dd3fc" opacity="0.6" class="mini-drop-float" style="animation-delay:-0.8s"/>
            <path d="M148 38 C148 38 145 44 145 46 A3 3 0 0 0 151 46 C151 44 148 38 148 38Z" fill="#bae6fd" opacity="0.55" class="mini-drop-float" style="animation-delay:-1.6s"/>
            <path d="M78 50 C78 50 75 56 75 58 A3 3 0 0 0 81 58 C81 56 78 50 78 50Z" fill="#38bdf8" opacity="0.5" class="mini-drop-float" style="animation-delay:-2.4s"/>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Kelembapan</span>
          <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-brand-cyan/15 dark:text-brand-cyan shrink-0">
            <Droplets class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.humidity }}<span class="text-xs font-semibold">%</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Normal &amp; nyaman</p>
        </div>
      </div>

      <!-- Card 5: Indeks UV -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- ☀️ UV Illustration: Beach + palm + umbrella + intense sun -->
        <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="uvBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.35"/>
              </linearGradient>
            </defs>
            <rect width="200" height="80" fill="url(#uvBgGrad)"/>
            <!-- Sea water -->
            <rect x="0" y="62" width="200" height="18" fill="#0ea5e9" opacity="0.35"/>
            <!-- Wave -->
            <path d="M0 62 Q25 56 50 62 Q75 68 100 62 Q125 56 150 62 Q175 68 200 62 L200 80 L0 80Z" fill="#0284c7" opacity="0.35"/>
            <!-- Sand beach -->
            <path d="M0 65 Q50 60 100 63 Q150 66 200 62 L200 80 L0 80Z" fill="#d97706" opacity="0.55"/>
            <!-- Palm tree -->
            <g transform="translate(32,68)" fill="#475569" opacity="0.8">
              <path d="M-2 0 Q5 -20 2 -40 L6 -40 Q9 -20 2 0Z"/>
              <path d="M4 -40 Q18 -50 36 -44 C23 -40 14 -38 4 -40Z"/>
              <path d="M4 -40 Q20 -36 28 -24 C16 -26 9 -33 4 -40Z"/>
              <path d="M4 -40 Q-12 -52 -28 -48 C-15 -42 -6 -38 4 -40Z"/>
              <path d="M4 -40 Q-12 -38 -18 -26 C-7 -28 0 -35 4 -40Z"/>
            </g>
            <!-- Beach umbrella -->
            <g transform="translate(135,63)" opacity="0.9">
              <line x1="0" y1="0" x2="-6" y2="-28" stroke="#475569" stroke-width="2"/>
              <path d="M-22 -26 C-18 -38 4 -38 8 -26Z" fill="#ef4444" opacity="0.75"/>
              <path d="M-22 -26 Q-7 -32 8 -26" stroke="#fff" stroke-width="1" fill="none" opacity="0.35"/>
            </g>
            <!-- Sun -->
            <circle cx="162" cy="16" r="22" fill="#fbbf24" opacity="0.2" class="animate-pulse"/>
            <circle cx="162" cy="16" r="14" fill="#fbbf24" opacity="0.7"/>
            <circle cx="162" cy="16" r="9" fill="#fff" opacity="0.8"/>
            <!-- UV rings -->
            <circle cx="162" cy="16" r="30" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3 5" opacity="0.3" fill="none"/>
            <circle cx="162" cy="16" r="38" stroke="#fbbf24" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.2" fill="none"/>
            <!-- Seagull -->
            <path d="M65 25 Q70 20 75 25" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Indeks UV</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 shrink-0">
            <Sun class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.uvIndex }}
          </p>
          <span 
            class="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider"
            :class="weatherData.uvIndex >= 8 
              ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400' 
              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'"
          >
            {{ weatherData.uvIndex >= 8 ? 'Sangat Tinggi' : 'Sedang' }}
          </span>
        </div>
      </div>

      <!-- Card 6: Visibilitas -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-xl relative overflow-hidden group">
        <!-- 👁️ Visibility Illustration: Mountain road -->
        <div class="card-illustration absolute inset-0 pointer-events-none select-none overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="visBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0"/>
                <stop offset="50%" stop-color="#4f46e5" stop-opacity="0.1"/>
                <stop offset="100%" stop-color="#3730a3" stop-opacity="0.3"/>
              </linearGradient>
            </defs>
            <rect width="200" height="160" fill="url(#visBgGrad)"/>
            <g transform="translate(0, 80)">
              <!-- Far mountains -->
              <path d="M0 60 L18 35 L42 55 L70 28 L98 50 L128 22 L155 48 L180 35 L200 45 L200 80 L0 80Z" fill="#4f46e5" opacity="0.3"/>
              <!-- Near mountains -->
              <path d="M0 72 L25 52 L55 68 L90 46 L125 66 L160 52 L190 62 L200 58 L200 80 L0 80Z" fill="#3730a3" opacity="0.5"/>
              <!-- Road vanishing to horizon -->
              <path d="M100 35 L88 80 L112 80Z" fill="#64748b" opacity="0.65"/>
              <line x1="100" y1="35" x2="100" y2="80" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.7"/>
              <!-- Pine trees roadside -->
              <g fill="#166534" opacity="0.65">
                <polygon points="60,72 66,55 72,72"/>
                <polygon points="64,66 70,53 76,66"/>
                <rect x="65" y="72" width="3" height="5" fill="#78350f"/>
                <polygon points="128,74 134,58 140,74"/>
                <polygon points="132,68 138,55 144,68"/>
                <rect x="133" y="74" width="3" height="5" fill="#78350f"/>
              </g>
            </g>
          </svg>
        </div>

        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Visibilitas</span>
          <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400 shrink-0">
            <Eye class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-20">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.visibility }}<span class="text-xs font-semibold">km</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Udara cerah bersih</p>
        </div>
      </div>

      <!-- Card 7: Fase Bulan -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 col-span-2 md:col-span-3 lg:col-span-2 backdrop-blur-xl relative overflow-hidden group">
        <!-- 🌙 Moon Illustration: Starry night + mountains + crescent moon -->
        <div class="card-illustration absolute inset-0 pointer-events-none select-none overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="moonBgGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#818cf8" stop-opacity="0" />
                <stop offset="50%"  stop-color="#a5b4fc" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.32" />
              </linearGradient>
              <linearGradient id="moonBgGradDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#1e1b4b" stop-opacity="0.6" />
                <stop offset="60%"  stop-color="#312e81" stop-opacity="0.75" />
                <stop offset="100%" stop-color="#09081a" stop-opacity="0.92" />
              </linearGradient>
              <linearGradient id="moonMtnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#818cf8" stop-opacity="0" />
                <stop offset="100%" stop-color="#312e81" stop-opacity="0.18" />
              </linearGradient>
              <radialGradient id="moonHalo4" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stop-color="#38bdf8" stop-opacity="0.6"/>
                <stop offset="50%"  stop-color="#818cf8" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Sky background fill -->
            <rect width="320" height="160" fill="url(#moonBgGradLight)" class="dark:hidden"/>
            <rect width="320" height="160" fill="url(#moonBgGradDark)" class="hidden dark:block"/>

            <!-- Stars (staggered twinkle) -->
            <circle cx="20"  cy="40" r="1.4" fill="#818cf8" class="star-twinkle" style="animation-delay:0s;animation-duration:2.1s"/>
            <circle cx="55"  cy="30" r="2.0" fill="#c7d2fe" class="star-twinkle" style="animation-delay:0.6s;animation-duration:1.7s"/>
            <circle cx="95"  cy="45" r="1.2" fill="#6366f1" class="star-twinkle" style="animation-delay:1.2s;animation-duration:2.5s"/>
            <circle cx="140" cy="35" r="2.2" fill="#38bdf8" class="star-twinkle" style="animation-delay:0.3s;animation-duration:1.9s"/>
            <circle cx="185" cy="40" r="1.8" fill="#818cf8" class="star-twinkle" style="animation-delay:0.9s;animation-duration:2.3s"/>
            <circle cx="230" cy="25" r="1.5" fill="#a5f3fc" class="star-twinkle" style="animation-delay:0.4s;animation-duration:2.8s"/>
            <circle cx="270" cy="35" r="2.0" fill="#6366f1" class="star-twinkle" style="animation-delay:1.5s;animation-duration:1.6s"/>
            <circle cx="310" cy="42" r="1.0" fill="#c7d2fe" class="star-twinkle" style="animation-delay:0.8s;animation-duration:2.0s"/>
            <circle cx="120" cy="20" r="1.3" fill="#fde68a" class="star-twinkle" style="animation-delay:1.8s;animation-duration:2.6s"/>

            <!-- Moon halo glow -->
            <circle cx="272" cy="42" r="30" fill="url(#moonHalo4)"/>
            <!-- Crescent moon -->
            <circle cx="272" cy="42" r="15" fill="#fef3c7" opacity="0.95"/>
            <circle cx="281" cy="38" r="13" fill="#6366f1" class="dark:fill-brand-navy-900" opacity="0.9"/>

            <!-- Bottom vector elements -->
            <g transform="translate(0, 80)">
              <!-- Far mountain ridge -->
              <path d="M0 72 L22 48 L52 64 L85 38 L120 58 L158 32 L195 55 L230 40 L265 58 L295 45 L320 58 L320 80 L0 80Z" fill="#818cf8" class="dark:fill-indigo-600" opacity="0.45"/>
              <!-- Near mountain ridge -->
              <path d="M0 80 L15 65 L45 76 L80 60 L115 72 L155 58 L190 70 L225 62 L260 74 L295 66 L320 74 L320 80Z" fill="#6366f1" class="dark:fill-indigo-700" opacity="0.65"/>
              <!-- Pine trees left -->
              <g fill="#10b981" opacity="0.85">
                <polygon points="5,80 12,62 19,80"/>
                <polygon points="13,80 20,65 27,80"/>
                <polygon points="22,80 30,58 38,80"/>
              </g>
              <!-- Pine trees right -->
              <g fill="#059669" opacity="0.85">
                <polygon points="283,80 290,62 297,80"/>
                <polygon points="292,80 299,65 306,80"/>
                <polygon points="301,80 308,58 315,80"/>
              </g>
            </g>
          </svg>
        </div>


        <!-- Top Title Row -->
        <div class="flex items-start justify-between gap-3 relative z-20">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight block">Fase Bulan</span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-brand-cyan dark:to-indigo-400 bg-clip-text text-transparent tracking-tight leading-none">
                {{ additionalWeatherData.moonPhase }}
              </span>
              <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none">
                • Iluminasi: {{ additionalWeatherData.moonIllumination }}
              </span>
            </div>
          </div>
          <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-brand-cyan/15 dark:text-brand-cyan shrink-0">
            <Moon class="w-4 h-4" />
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between w-full gap-2 sm:gap-4 relative z-20">
          <!-- Moonrise info -->
          <div class="space-y-1 text-left shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Terbit</span>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v8M9 5l3-3 3 3" />
                <path d="M2 22h20" />
                <path d="M12 18a5 5 0 0 0 5-5 4 4 0 0 1-5 5z" fill="currentColor" />
              </svg>
              <p class="text-base sm:text-lg font-bold text-indigo-500 dark:text-indigo-400 leading-none">
                {{ additionalWeatherData.moonrise }}
              </p>
            </div>
          </div>

          <!-- Animated Moon Arc SVG -->
          <div class="flex-1 flex justify-center items-center h-10 overflow-visible min-w-0 max-w-[96px]">
            <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible">
              <path
                d="M 5 45 A 40 40 0 0 1 95 45"
                stroke="#818cf8"
                stroke-opacity="0.55"
                stroke-width="1.5"
                stroke-dasharray="3,3"
                fill="none"
              />
              <g :transform="`translate(${moonPosition.x}, ${moonPosition.y})`">
                <circle cx="0" cy="0" r="6" fill="#a5b4fc" class="animate-pulse" opacity="0.40" />
                <path d="M 0 -5 A 5 5 0 1 1 0 5 A 6 6 0 0 1 0 -5" fill="#e2e8f0" class="dark:fill-slate-100" />
              </g>
            </svg>
          </div>

          <!-- Moonset info -->
          <div class="space-y-1 text-right shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Terbenam</span>
            <div class="flex items-center gap-1.5 justify-end">
              <p class="text-base sm:text-lg font-bold text-teal-500 dark:text-teal-400 leading-none">
                {{ additionalWeatherData.moonset }}
              </p>
              <svg class="w-4 h-4 text-teal-400 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v8M9 7l3 3 3-3" />
                <path d="M2 22h20" />
                <path d="M12 18a5 5 0 0 0 5-5 4 4 0 0 1-5 5z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 8: Matahari -->
      <div class="weather-metric-card bg-white/80 dark:bg-brand-navy-900/75 border border-white/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 col-span-2 md:col-span-3 lg:col-span-2 backdrop-blur-xl relative overflow-hidden group">
        <!-- ☀️ Weather Illustration: Vibrant Golden Sunset / Ocean Bay / Bridge Artwork -->
        <div class="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="sunBgGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffedd5" stop-opacity="0" />
                <stop offset="50%" stop-color="#fed7aa" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#fdba74" stop-opacity="0.45" />
              </linearGradient>
              <linearGradient id="sunBgGradDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f97316" stop-opacity="0.15" />
                <stop offset="40%" stop-color="#9333ea" stop-opacity="0.45" />
                <stop offset="75%" stop-color="#1e1b4b" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0.98" />
              </linearGradient>
              <radialGradient id="sunHorizonGlow2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fde68a" stop-opacity="0.95"/>
                <stop offset="30%" stop-color="#fbbf24" stop-opacity="0.75"/>
                <stop offset="60%" stop-color="#f97316" stop-opacity="0.45"/>
                <stop offset="85%" stop-color="#ea580c" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="#c2410c" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Sky base fill -->
            <rect width="320" height="160" fill="url(#sunBgGradLight)" class="dark:hidden"/>
            <rect width="320" height="160" fill="url(#sunBgGradDark)" class="hidden dark:block"/>

            <!-- Radiant Horizon Sun Aura -->
            <circle cx="160" cy="115" r="88" fill="url(#sunHorizonGlow2)"/>

            <g transform="translate(0, 75)">
              <!-- Far Coastal Hills -->
              <path d="M-20 60 Q40 40 100 52 T220 48 Q270 42 340 55 L340 85 L-20 85Z" fill="#fb923c" class="dark:fill-purple-600" opacity="0.75"/>

              <!-- Ocean / Bay Water -->
              <path d="M0 65 L320 65 L320 85 L0 85Z" fill="#0284c7" class="dark:fill-cyan-600" opacity="0.65"/>

              <!-- Water Reflection Shimmer Lines -->
              <ellipse cx="160" cy="71" rx="55" ry="3.5" fill="#fef08a" opacity="0.85" />
              <ellipse cx="160" cy="77" rx="35" ry="2.5" fill="#fde047" opacity="0.7" />
              <ellipse cx="160" cy="81" rx="18" ry="1.5" fill="#fbbf24" opacity="0.6" />

              <!-- Sailboat in Bay -->
              <g transform="translate(65, 52)" fill="#7c2d12" class="dark:fill-slate-900" opacity="0.95">
                <path d="M0 10 L-4 16 L18 16 L14 10 Z" />
                <polygon points="4,10 13,10 4,1" fill="#fef08a" opacity="0.95"/>
              </g>
            </g>
          </svg>
        </div>

        <!-- Top Title Row matching other cards -->
        <div class="flex items-start justify-between gap-3 relative z-20">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Matahari</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 shrink-0">
            <Sunrise class="w-4 h-4" />
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between w-full gap-2 sm:gap-4 relative z-20">
          <!-- Sunrise info -->
          <div class="space-y-1 text-left shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Terbit</span>
            <div class="flex items-center gap-1.5">
              <Sunrise class="w-4 h-4 text-amber-400 shrink-0" />
              <p class="text-base sm:text-lg font-bold text-amber-500 dark:text-amber-400 leading-none">
                {{ additionalWeatherData.sunrise }}
              </p>
            </div>
          </div>
          
          <!-- Animated Sun Arc SVG (Always visible, clean rendering) -->
          <div class="flex-1 flex justify-center items-center h-10 overflow-visible min-w-0 max-w-[96px]">
            <svg viewBox="0 0 100 50" class="w-full h-full overflow-visible">
              <!-- Sun/Moon path arc – animated flowing dashes -->
              <path 
                d="M 5 45 A 40 40 0 0 1 95 45" 
                :stroke="sunPosition.isDay ? '#fbbf24' : '#818cf8'" 
                :stroke-opacity="sunPosition.isDay ? '0.75' : '0.45'"
                stroke-width="1.8" 
                stroke-dasharray="5,4" 
                class="sun-arc-flow"
                fill="none" 
              />
              
              <!-- Sun (Always visible) -->
              <g :transform="`translate(${sunPosition.x}, ${sunPosition.y})`">
                <!-- Pulsing Outer Glow -->
                <circle cx="0" cy="0" r="7" fill="#f97316" class="animate-pulse" opacity="0.5" />
                <circle cx="0" cy="0" r="4.5" fill="#facc15" />
                <!-- Sun rays -->
                <line x1="0" y1="-8" x2="0" y2="-6" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round" />
                <line x1="0" y1="8" x2="0" y2="6" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round" />
                <line x1="-8" y1="0" x2="-6" y2="0" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round" />
                <line x1="8" y1="0" x2="6" y2="0" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round" />
              </g>
            </svg>
          </div>

          <!-- Sunset info -->
          <div class="space-y-1 text-right shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Terbenam</span>
            <div class="flex items-center gap-1.5 justify-end">
              <p class="text-base sm:text-lg font-bold text-orange-500 dark:text-orange-400 leading-none">
                {{ additionalWeatherData.sunset }}
              </p>
              <Sunset class="w-4 h-4 text-orange-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

    </div>

</div>
</template>
<style scoped>
/* Weather animations styling */
.sunny-aura {
  animation: pulse-slow 8s ease-in-out infinite alternate;
}

@keyframes pulse-slow {
  0% {
    transform: scale(0.9) translate(0px, 0px);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.1) translate(10px, 10px);
    opacity: 0.9;
  }
}

.sun-ray-1, .sun-ray-2 {
  position: absolute;
  top: -50%;
  left: 20%;
  width: 60px;
  height: 200%;
  background: linear-gradient(to right, transparent, rgba(255, 230, 150, 0.20), transparent);
  transform: rotate(-35deg);
  transform-origin: top left;
}
.sun-ray-1 {
  animation: sweep 12s ease-in-out infinite alternate;
}
.sun-ray-2 {
  left: 45%;
  animation: sweep 15s ease-in-out infinite alternate-reverse;
  animation-delay: -3s;
}

@keyframes sweep {
  0% {
    transform: rotate(-38deg) translateX(-15px);
  }
  100% {
    transform: rotate(-32deg) translateX(15px);
  }
}

/* Clouds container & animation */
.cloud-item {
  position: absolute;
  width: 140px;
  height: 90px;
  color: currentColor;
  opacity: 0.24;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.04));
  transition: color 0.5s ease;
}
.dark .cloud-item {
  opacity: 0.18;
  filter: drop-shadow(0 8px 16px rgba(0, 245, 255, 0.04));
}
.cloudy-overcast .cloud-item {
  opacity: 0.38;
}
.dark .cloudy-overcast .cloud-item {
  opacity: 0.28;
}

.cloud-1 {
  top: -10%;
  animation: drift-right 45s linear infinite;
}
.cloud-2 {
  top: 35%;
  animation: drift-right 58s linear infinite;
  animation-delay: -18s;
  transform: scale(0.8);
}
.cloud-3 {
  top: 15%;
  animation: drift-right 52s linear infinite;
  animation-delay: -32s;
  transform: scale(0.65);
}

@keyframes drift-right {
  0% {
    left: -160px;
  }
  100% {
    left: 110%;
  }
}


/* Rain animation */
.rain-drop {
  position: absolute;
  width: 1.8px;
  background: linear-gradient(to bottom, transparent, currentColor);
  opacity: 0.50;
  animation: fall linear infinite;
  transform: rotate(12deg);
  transform-origin: top;
  transition: color 0.5s ease;
}
.dark .rain-drop {
  opacity: 0.60;
}

@keyframes fall {
  0% {
    top: -15%;
    opacity: 0;
  }
  15% {
    opacity: 0.85;
  }
  85% {
    opacity: 0.85;
  }
  100% {
    top: 115%;
    opacity: 0;
  }
}

/* Lightning flash */
.lightning-flash {
  animation: flash 8s infinite;
}

@keyframes flash {
  0%, 94%, 96%, 98%, 100% {
    opacity: 0;
  }
  95% {
    opacity: 0.35;
  }
  97% {
    opacity: 0.1;
  }
  97.5% {
    opacity: 0.45;
  }
}

/* Snow animation */
.snow-flake {
  position: absolute;
  top: -12px;
  background: #ffffff;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  filter: blur(0.3px);
  animation: snow-fall linear infinite, snow-sway ease-in-out infinite alternate;
}
.dark .snow-flake {
  background: #ffffff;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
}

@keyframes snow-fall {
  0% {
    top: -12%;
  }
  100% {
    top: 112%;
  }
}

@keyframes snow-sway {
  0% {
    transform: translateX(-12px);
  }
  100% {
    transform: translateX(12px);
  }
}

/* Modal Drawer Transition effects */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
/* ── Mini Card Illustrations ─────────────────────────────────────────────── */

/* Rotating sun illustration */
.mini-illus-sun {
  animation: mini-sun-spin 30s linear infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes mini-sun-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Turbine blades rotation */
.turbine-blades {
  animation-name: turbine-spin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.turbine-spin-slow {
  animation-duration: 6s;
}
.turbine-spin-medium {
  animation-duration: 3s;
}
.turbine-spin-fast {
  animation-duration: 1.5s;
}
.turbine-spin-extreme {
  animation-duration: 0.7s;
}

@keyframes turbine-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Drifting cloud in mini cards */
.mini-illus-cloud {
  animation: mini-cloud-drift 18s ease-in-out infinite alternate;
}
.mini-illus-cloud2 {
  animation: mini-cloud-drift 22s ease-in-out infinite alternate-reverse;
  animation-delay: -6s;
}
@keyframes mini-cloud-drift {
  0%   { transform: translateX(0px);  }
  100% { transform: translateX(8px);  }
}

/* Lightning bolt flicker */
.mini-illus-bolt {
  animation: mini-bolt-flicker 4s ease-in-out infinite;
}
@keyframes mini-bolt-flicker {
  0%, 85%, 90%, 95%, 100% { opacity: 0.50; }
  87%                     { opacity: 1;    }
  92%                     { opacity: 0.25; }
  97%                     { opacity: 0.90; }
}

/* Floating water droplet / steam bounce */
.mini-drop-float {
  animation: mini-drop-bob 3s ease-in-out infinite alternate;
}
@keyframes mini-drop-bob {
  0%   { transform: translateY(0px);  }
  100% { transform: translateY(-5px); }
}

/* UV glow pulse */
.mini-uv-pulse {
  animation: mini-uv-glow 4s ease-in-out infinite alternate;
}
@keyframes mini-uv-glow {
  0%   { opacity: 0.6; transform: scale(0.95); }
  100% { opacity: 1;   transform: scale(1.1);  }
}

/* Mini rain drops reuse the same .rain-drop animation but scoped to smaller card */
.mini-rain-drop {
  position: absolute;
  width: 1.5px;
  background: linear-gradient(to bottom, transparent, currentColor);
  color: #60a5fa;
  opacity: 0.40;
  animation: fall linear infinite;
  transform: rotate(12deg);
  transform-origin: top;
}
.dark .mini-rain-drop {
  opacity: 0.55;
}

/* Mini snowflakes reuse snow-fall + snow-sway */
.mini-snow-flake {
  position: absolute;
  top: -12px;
  background: #ffffff;
  border-radius: 50%;
  filter: blur(0.3px);
  animation: snow-fall linear infinite, snow-sway ease-in-out infinite alternate;
}

/* Wind line animation */
.mini-wind-line {
  stroke-dasharray: 60 200;
  stroke-dashoffset: 0;
  animation: wind-flow 2.2s linear infinite;
}
.mini-wind-line2 {
  animation-delay: -0.7s;
  stroke-dasharray: 50 200;
}
.mini-wind-line3 {
  animation-delay: -1.4s;
  stroke-dasharray: 40 200;
}
@keyframes wind-flow {
  0%   { stroke-dashoffset: 0;   }
  100% { stroke-dashoffset: -260; }
}

/* ── Weather Metric Card ──────────────────────────────────────────────────────
   Overlay glassmorphism dihapus agar ilustrasi background tampil bersih di
   kedua tema (light & dark). */
.weather-metric-card {
  isolation: isolate;
}
</style>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, defineAsyncComponent, nextTick } from 'vue';

const CurrentWeather = defineAsyncComponent(() => import('../components/CurrentWeather.vue'));
const ForecastPanel = defineAsyncComponent(() => import('../components/ForecastPanel.vue'));
const TransportWeather = defineAsyncComponent(() => import('../components/TransportWeather.vue'));
const AlertsPanel = defineAsyncComponent(() => import('../components/AlertsPanel.vue'));
const AroundActivityPanel = defineAsyncComponent(() => import('../components/AroundActivityPanel.vue'));
const SatelliteMap = defineAsyncComponent(() => import('../components/SatelliteMap.vue'));
const NewsSection = defineAsyncComponent(() => import('../components/NewsSection.vue'));

import type { 
  WeatherData, 
  HourlyForecast, 
  TransportStatus, 
  WarningAlert, 
  NewsArticle 
} from '../types/weather';
import { cityAnalysisMap } from '../data/mockData';
import { 
  Compass, 
  Waves, 
  Plane, 
  Wind,
  Droplets,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Sun,
  Navigation,
  Eye,
  Search
} from 'lucide-vue-next';
import { getAdditionalWeatherData } from '../data/weatherHelpers';

const props = defineProps<{
  weatherData: WeatherData;
  forecasts: HourlyForecast[];
  transportStatuses: TransportStatus[];
  alerts: WarningAlert[];
  articles: NewsArticle[];
  cities: string[];
  selectedCity: string;
  isLocating: boolean;
  isGeolocated?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
  (e: 'delete-city', city: string): void;
  (e: 'detect-location'): void;
}>();

const currentAnalysis = computed(() => {
  return cityAnalysisMap[props.selectedCity] || cityAnalysisMap['Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta'];
});

const additionalInfo = computed(() => {
  return getAdditionalWeatherData(props.selectedCity);
});

// ── Slide transition direction logic ──
const slideDirection = ref('slide-right');
const isCustomGeolocated = computed(() => {
  return !!props.isGeolocated && (props.selectedCity === props.cities[0]);
});

watch(
  () => props.selectedCity,
  (newCity, oldCity) => {
    if (oldCity) {
      const newIdx = props.cities.indexOf(newCity);
      const oldIdx = props.cities.indexOf(oldCity);
      
      if (newIdx !== -1 && oldIdx !== -1) {
        slideDirection.value = newIdx > oldIdx ? 'slide-left' : 'slide-right';
      } else {
        slideDirection.value = 'slide-left';
      }
    }
  },
  { immediate: true }
);

const showDropdown = ref(false);

const cityLandmarks = [
  {
    name: 'Jakarta',
    fullName: 'DKI Jakarta',
    color: 'text-blue-500 dark:text-blue-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <!-- Flame / Api Emas di puncak -->
      <path d="M12 2c0 0 1.2 1.5 1 2.5-.2 1-1 1.2-1 1.2s-.8-.2-1-1.2C10.8 3.5 12 2 12 2z" fill="currentColor" opacity="0.9" stroke="none"/>
      <!-- Obelisk body - tapered -->
      <path d="M11 5.7h2v1.8h-2z"/>
      <path d="M10.5 7.5h3v1.5h-3z"/>
      <path d="M10 9h4l.5 8h-5z"/>
      <!-- Pedestal base -->
      <path d="M8.5 17h7v1.5h-7z"/>
      <path d="M7 18.5h10V21H7z"/>
    </svg>`
  },
  {
    name: 'Surabaya',
    fullName: 'Surabaya',
    color: 'text-cyan-500 dark:text-cyan-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <!-- Jembatan Suramadu (cable-stayed bridge) -->
      <!-- Left tower -->
      <path d="M7 5v10"/>
      <!-- Right tower -->
      <path d="M17 5v10"/>
      <!-- Tower crossbar -->
      <path d="M6 7h2M16 7h2"/>
      <!-- Left cables -->
      <path d="M7 5L2 15M7 5L5 15M7 5L9 15"/>
      <!-- Right cables -->
      <path d="M17 5L22 15M17 5L19 15M17 5L15 15"/>
      <!-- Bridge deck -->
      <path d="M2 15h20"/>
      <!-- Ground/base -->
      <path d="M1 17h22" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'Bandung',
    fullName: 'Bandung',
    color: 'text-emerald-500 dark:text-emerald-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M12 2v5"/>
      <circle cx="12" cy="3" r="0.7" fill="currentColor"/>
      <circle cx="12" cy="4.5" r="0.7" fill="currentColor"/>
      <path d="M6 7h12v3H6z"/>
      <path d="M4 10h16v6H4z"/>
      <path d="M8 10v6M12 10v6M16 10v6"/>
      <path d="M3 16h18v4H3z"/>
    </svg>`
  },
  {
    name: 'Medan',
    fullName: 'Medan',
    color: 'text-amber-500 dark:text-amber-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M3 14h18v6H3z"/>
      <path d="M12 3v3"/>
      <path d="M3 14c2-4 5-6 9-6s7 2 9 6"/>
      <path d="M8 14v6M16 14v6"/>
      <path d="M6 16a2 2 0 0 1 4 0M14 16a2 2 0 0 1 4 0"/>
    </svg>`
  },
  {
    name: 'Semarang',
    fullName: 'Semarang',
    color: 'text-purple-500 dark:text-purple-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <rect x="3" y="10" width="4" height="10" rx="0.5"/>
      <rect x="17" y="10" width="4" height="10" rx="0.5"/>
      <path d="M3 10V8a2 2 0 0 1 4 0v2"/>
      <path d="M17 10V8a2 2 0 0 1 4 0v2"/>
      <path d="M7 14h10"/>
      <path d="M7 17h10"/>
      <path d="M7 14c0-4 10-4 10 0"/>
      <path d="M5 20h14"/>
    </svg>`
  },
  {
    name: 'Makassar',
    fullName: 'Makassar',
    color: 'text-red-500 dark:text-red-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M3 16c4 1 12 1 18 0l-2 5H5l-2-5z" fill="currentColor" opacity="0.15"/>
      <path d="M11 3v13M16 6v10"/>
      <path d="M11 3L3 13h8z" fill="currentColor" opacity="0.1"/>
      <path d="M16 6l-4 8h4z"/>
      <path d="M11 6l-6 7h6z"/>
    </svg>`
  },
  {
    name: 'Palembang',
    fullName: 'Palembang',
    color: 'text-orange-500 dark:text-orange-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 17h20M7 8v9M17 8v9"/>
      <path d="M7 8h10M5 12h14"/>
      <path d="M7 8l-5 4M17 8l5 4"/>
      <path d="M2 21h20" stroke-width="1" opacity="0.6"/>
    </svg>`
  },
  {
    name: 'Batam',
    fullName: 'Batam',
    color: 'text-indigo-500 dark:text-indigo-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 16h20"/>
      <path d="M8 16V8M16 16V8"/>
      <path d="M8 8l-6 8M8 8l8 8M16 8l-8 8M16 8l6 8"/>
      <path d="M2 19h20" stroke-width="1" opacity="0.5"/>
      <path d="M6 19v2M18 19v2"/>
      <rect x="7" y="6" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.7"/>
      <rect x="15" y="6" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.7"/>
    </svg>`
  },
  {
    name: 'Pekanbaru',
    fullName: 'Pekanbaru',
    color: 'text-teal-500 dark:text-teal-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M6 15h12v5H6z"/>
      <path d="M12 4v3"/>
      <path d="M6 15a6 6 0 0 1 12 0H6z" fill="currentColor" opacity="0.2"/>
      <path d="M20 8v12M4 8v12"/>
      <path d="M20 8l-2 3M4 8l2 3"/>
    </svg>`
  },
  {
    name: 'Denpasar',
    fullName: 'Denpasar',
    color: 'text-rose-500 dark:text-rose-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M12 2l-1 2h2l-1-2z" fill="currentColor" opacity="0.8"/>
      <path d="M10 4h4v1.5h-4z"/>
      <path d="M9 5.5h6v2H9z"/>
      <path d="M7.5 7.5h9v2h-9z"/>
      <path d="M6 9.5h12v2H6z"/>
      <path d="M5 11.5h14v2.5H5z"/>
      <path d="M4 14h16v6H4z" rx="0.5"/>
      <path d="M2 20h20"/>
    </svg>`
  }
];

const splitLocation = (fullName: string) => {
  if (!fullName) return { main: '', sub: '' };
  const parts = fullName.split(',');
  const main = parts[0].trim();
  const sub = parts.slice(1).map(p => p.trim()).join(', ');
  return { main, sub };
};

// ── City landmark badge computed ──────────────────────────────────────────────
const currentCityLandmarkSvg = computed(() => {
  const cityName = props.selectedCity;
  const match = cityLandmarks.find(
    l => l.fullName === cityName || l.name === cityName.split(',')[0].trim()
  );
  if (match) return match.svg;
  // Fallback: map-pin icon for personal location
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
});

const currentCityShortName = computed(() => splitLocation(props.selectedCity).main);

// ── Carousel Controls ─────────────────────────────────────────────────────────
const carouselContainer = ref<HTMLElement | null>(null);

const scrollCarousel = (direction: 'left' | 'right') => {
  if (!carouselContainer.value) return;
  const container = carouselContainer.value;
  const scrollAmount = 320;
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
};

const detectLocation = () => {
  emit('detect-location');
};

const majorCitiesList = [
  'DKI Jakarta',
  'Surabaya',
  'Bandung',
  'Medan',
  'Semarang',
  'Makassar',
  'Palenburg',
  'Palembang',
  'Batam',
  'Pekanbaru',
  'Denpasar'
];

const otherCities = computed(() => {
  return props.cities.slice(1).filter(city => {
    return !majorCitiesList.some(major => 
      city.toLowerCase() === major.toLowerCase() || 
      city.toLowerCase().startsWith(major.toLowerCase() + ',')
    );
  });
});

const handleSearchOtherLocation = () => {
  showDropdown.value = false;
  nextTick(() => {
    const isMobile = window.innerWidth < 1024;
    const searchInputId = isMobile ? 'search-input-mobile' : 'search-input-desktop';
    const inputEl = document.getElementById(searchInputId);
    if (inputEl) {
      inputEl.focus();
      inputEl.classList.add('ring-2', 'ring-blue-500', 'dark:ring-brand-cyan');
      setTimeout(() => {
        inputEl.classList.remove('ring-2', 'ring-blue-500', 'dark:ring-brand-cyan');
      }, 1500);
    }
  });
};

// ── Height lock: prevents container collapse when leaving el goes position:absolute ──
function lockHeight(el: Element) {
  const wrapper = (el as HTMLElement).parentElement;
  if (wrapper) wrapper.style.height = (el as HTMLElement).offsetHeight + 'px';
}
function unlockHeight(el: Element) {
  const wrapper = (el as HTMLElement).parentElement;
  if (wrapper) wrapper.style.height = '';
}

// ── Dropdown Close Listeners (Click Outside & Scroll) ──
const dropdownContainer = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (
    showDropdown.value &&
    dropdownContainer.value &&
    !dropdownContainer.value.contains(event.target as Node)
  ) {
    showDropdown.value = false;
  }
};

const handleScroll = () => {
  if (showDropdown.value) {
    showDropdown.value = false;
  }
};

const redirectToMaritime = () => {
  const { protocol, hostname, port, origin } = window.location;
  
  // 1. Check if it's local development
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  
  if (isLocal) {
    let targetUrl = 'http://localhost:5174';
    if (port === '5173') {
      targetUrl = origin.replace(':5173', ':5174');
    } else if (port) {
      const nextPort = parseInt(port) + 1;
      targetUrl = `${protocol}//${hostname}:${nextPort}`;
    }
    window.open(targetUrl, '_blank');
    return;
  }
  
  // 2. Production/Staging domain replacement logic
  const productionUrl = 'https://bmkg-maritim.vercel.app';

  window.open(productionUrl, '_blank');
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- 3 Analysis Cards (Activity Advisories) - Full Width (Col Span 3) -->
      <div class="lg:col-span-3 space-y-4">
        
        <!-- Modern borderless location selector -->
        <div class="flex items-center justify-between pb-1">
          <div class="relative" ref="dropdownContainer">
            <button 
              id="location-dropdown-toggle"
              @click="showDropdown = !showDropdown"
              class="flex flex-col items-start gap-1 py-1.5 text-left transition-all select-none hover:opacity-90 active:scale-[0.98] duration-200 outline-none cursor-pointer group"
            >

              <!-- Location Text - Satu baris nyambung, font-black merata -->
              <div class="text-left space-y-2 min-w-0 max-w-[calc(100vw-110px)] md:max-w-none">
                <!-- Location Text & Chevron Wrapper -->
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-xs sm:text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 normal-case leading-relaxed flex items-baseline flex-wrap gap-x-0.5">
                    <span>{{ splitLocation(selectedCity).main }}</span>
                    <span>, {{ splitLocation(selectedCity).sub || 'Indonesia' }}</span>
                  </h2>
                  
                  <ChevronDown class="w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-350 ml-0.5" :class="{ 'rotate-180': showDropdown }" />

                  <!-- Lokasi Saya Badge (Clickable button) -->
                  <button 
                    type="button"
                    @click.stop="detectLocation"
                    v-if="isCustomGeolocated"
                    class="shrink-0 inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:hover:bg-brand-cyan/30 border border-blue-500/20 dark:border-brand-cyan/30 cursor-pointer transition-all duration-200 outline-none"
                    title="Dapatkan lokasi realtime Anda"
                  >
                    <!-- Live GPS Signal Dot -->
                    <span 
                      class="w-[14px] h-[14px] rounded-full flex items-center justify-center border backdrop-blur-[2px] bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/30"
                    >
                      <span class="relative flex h-1 w-1 shrink-0">
                        <span v-if="isLocating" class="animate-spin h-2 w-2 border border-current rounded-full border-t-transparent"></span>
                        <template v-else>
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-brand-cyan opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-1 w-1 bg-blue-500 dark:bg-brand-cyan"></span>
                        </template>
                      </span>
                    </span>
                    <span>{{ isLocating ? 'Mencari...' : 'Lokasi Saya' }}</span>
                  </button>

                  <!-- Cari Lokasi Saya Button (Clickable button, shown when not geolocated) -->
                  <button 
                    type="button"
                    @click.stop="detectLocation"
                    v-else
                    class="shrink-0 inline-flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:hover:bg-brand-cyan/30 border border-blue-500/20 dark:border-brand-cyan/30 cursor-pointer transition-all duration-200 outline-none"
                    title="Cari lokasi realtime Anda menggunakan GPS"
                  >
                    <!-- GPS Target Dot (pulsing if searching location) -->
                    <span 
                      class="w-[14px] h-[14px] rounded-full flex items-center justify-center border backdrop-blur-[2px] bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/30"
                    >
                      <span class="relative flex h-1 w-1 shrink-0">
                        <span v-if="isLocating" class="animate-spin h-2 w-2 border border-current rounded-full border-t-transparent"></span>
                        <template v-else>
                          <span class="relative inline-flex rounded-full h-1 w-1 bg-blue-500 dark:bg-brand-cyan"></span>
                        </template>
                      </span>
                    </span>
                    <span>{{ isLocating ? 'Mencari...' : 'Cari Lokasi Saya' }}</span>
                  </button>
                </div>
              </div>
            </button>

            <!-- Dropdown List -->
            <div 
              v-if="showDropdown" 
              class="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-xl border overflow-hidden py-2 z-50 animate-fade-in
                bg-white/95 border-slate-100/80 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
            >
              <!-- 1. The Realtime Location (cities[0]) -->
              <button 
                v-for="city in [cities[0]]" 
                :key="city"
                :id="'location-option-' + city.split(',')[0].toLowerCase().replace(/ /g, '-')"
                @click="$emit('select-city', city); showDropdown = false"
                class="w-full text-left px-4 py-2.5 hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-all flex flex-col gap-0.5 cursor-pointer relative"
                :class="[
                  city === selectedCity ? 'bg-slate-50/50 dark:bg-brand-navy-950/20' : '',
                  city === cities[0] ? 'border-l-4 border-blue-500 dark:border-brand-cyan bg-blue-500/5 dark:bg-brand-cyan/5' : ''
                ]"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-1.5">
                    <MapPin 
                      v-if="city === cities[0]" 
                      class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan shrink-0" 
                    />
                    <span 
                      class="text-xs tracking-tight transition-colors"
                      :class="city === selectedCity ? 'font-black text-blue-600 dark:text-brand-cyan' : 'font-bold text-slate-700 dark:text-slate-200'"
                    >
                      {{ splitLocation(city).main }}
                    </span>
                  </div>
                  
                  <span 
                    v-if="isGeolocated && city === cities[0]"
                    class="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-blue-50 text-blue-600 dark:bg-brand-cyan/15 dark:text-brand-cyan"
                  >
                    Lokasi Saya
                  </span>
                  <span v-else-if="city === selectedCity" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
                </div>
                <span v-if="splitLocation(city).sub" class="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate w-full pr-4">
                  {{ splitLocation(city).sub }}
                </span>
              </button>

              <!-- Divider line -->
              <div class="h-px bg-slate-100 dark:bg-brand-navy-800/60 my-1"></div>

              <!-- 2. Other custom cities (if any) -->
              <template v-if="otherCities.length > 0">
                <button 
                  v-for="city in otherCities"
                  :key="city"
                  :id="'location-option-' + city.split(',')[0].toLowerCase().replace(/ /g, '-')"
                  @click="$emit('select-city', city); showDropdown = false"
                  class="w-full text-left px-4 py-2.5 hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-all flex flex-col gap-0.5 cursor-pointer relative"
                  :class="city === selectedCity ? 'bg-slate-50/50 dark:bg-brand-navy-950/20' : ''"
                >
                  <div class="flex items-center justify-between w-full">
                    <span 
                      class="text-xs tracking-tight transition-colors"
                      :class="city === selectedCity ? 'font-black text-blue-600 dark:text-brand-cyan' : 'font-bold text-slate-700 dark:text-slate-200'"
                    >
                      {{ splitLocation(city).main }}
                    </span>
                    <span v-if="city === selectedCity" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
                  </div>
                  <span v-if="splitLocation(city).sub" class="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate w-full pr-4">
                    {{ splitLocation(city).sub }}
                  </span>
                </button>
              </template>

              <!-- 3. Search Dropdown Empty State (if no other custom cities) -->
              <div 
                v-else
                class="px-4 py-4 flex flex-col items-center justify-center text-center gap-2"
              >
                <div class="flex flex-col gap-0.5">
                  <p class="text-[10px] font-black text-slate-700 dark:text-slate-200">Tidak Ada Wilayah Lain</p>
                  <p class="text-[8.5px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed max-w-[210px] uppercase tracking-wider">
                    Simpan kelurahan atau desa favorit Anda untuk akses cepat.
                  </p>
                </div>
                <button
                  @click="handleSearchOtherLocation"
                  class="mt-1 w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider text-white bg-blue-500 hover:bg-blue-600 dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-navy-950 transition-all duration-300 shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search class="w-3.5 h-3.5" />
                  Cari Lokasi Lain
                </button>
              </div>
            </div>
          </div>

          <!-- Section indicator -->
          <div class="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden sm:block">
            Panduan Aktivitas & Analisis Cuaca
          </div>
        </div>

        <!-- Elegant 10 Major Cities Landmark Row with Auto-Slide Carousel with backdrop -->
        <div class="relative w-full mt-4 bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 backdrop-blur-md rounded-3xl p-5 shadow-sm">
          
          <!-- Header Row inside backdrop (Title + App Download) -->
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 text-left">
            <!-- Left: Title & Subtitle -->
            <div class="space-y-0.5">
              <h3 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                Kondisi Terkini
              </h3>
              <p class="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
                10 Kota Besar Indonesia
              </p>
            </div>

            <!-- Right: Mobile App Download CTA -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/10 dark:border-white/5 p-3 rounded-2xl max-w-full lg:max-w-md">
              <div class="min-w-0">
                <h4 class="text-[9px] font-black uppercase tracking-wider text-blue-500 dark:text-brand-cyan">Aplikasi Mobile Resmi</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal mt-0.5">
                  Unduh aplikasi <strong class="text-slate-800 dark:text-white font-extrabold">Info BMKG</strong> untuk mendapatkan <br />
                  notifikasi cuaca & gempa secara realtime.
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <!-- Google Play Button -->
                <a 
                  href="https://play.google.com/store/apps/details?id=id.go.bmkg.infobmkg" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="h-9 px-3.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-750 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-emerald-400">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.58-1.408V3.222c0-.528.22-1.01.58-1.408zM14.5 12.707l2.846 2.846-13.018 7.502a1.99 1.99 0 0 1-.718.131c-.52 0-.996-.2-1.378-.528L14.5 12.707zm7.558-.918l-3.328-1.92-2.176 2.176 2.176 2.176 3.328-1.92a1.144 1.144 0 0 0 0-2.022zM14.5 11.293L2.232 3.223c.382-.328.858-.528 1.378-.528.254 0 .5.048.718.131l13.018 7.502-2.846 2.965z"/>
                  </svg>
                  <div class="text-left leading-none">
                    <div class="text-[8px] uppercase font-bold text-slate-350">Temukan di</div>
                    <div class="text-[11px] font-black text-white">Google Play</div>
                  </div>
                </a>

                <!-- App Store Button -->
                <a 
                  href="https://apps.apple.com/id/app/info-bmkg/id1114372539" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="h-9 px-3.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-750 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-100">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.01.24.02.36.02.94 0 2.01-.54 2.46-1.35z"/>
                  </svg>
                  <div class="text-left leading-none">
                    <div class="text-[8px] uppercase font-bold text-slate-350">Unduh di</div>
                    <div class="text-[11px] font-black text-white">App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Carousel Wrapper (for positioning arrows relative to cards only) -->
          <div class="relative group/carousel w-full">
            <!-- Left Arrow Button -->
          <button 
            @click="scrollCarousel('left')"
            class="absolute -left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
            aria-label="Previous cities"
          >
            <ChevronLeft class="w-4 h-4 text-slate-800 dark:text-white" />
          </button>
          
          <!-- Right Arrow Button -->
          <button 
            @click="scrollCarousel('right')"
            class="absolute -right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
            aria-label="Next cities"
          >
            <ChevronRight class="w-4 h-4 text-slate-800 dark:text-white" />
          </button>

          <!-- Scrollable Row -->
          <div 
            ref="carouselContainer"
            class="flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-0.5"
          >
            <button
              v-for="landmark in cityLandmarks"
              :key="landmark.name"
              :id="'landmark-card-' + landmark.name.toLowerCase()"
              @click="$emit('select-city', landmark.fullName)"
              class="snap-start flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 min-w-[145px] sm:min-w-[155px] select-none active:scale-[0.97] backdrop-blur-md relative overflow-hidden group/card shadow-sm"
              :class="[
                selectedCity === landmark.fullName
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-brand-cyan/15 dark:text-brand-cyan dark:border-brand-cyan/40 shadow-sm shadow-blue-500/5 font-extrabold'
                  : 'bg-white/50 text-slate-600 hover:bg-white/80 border-slate-200/40 dark:bg-brand-navy-900/50 dark:text-slate-300 dark:hover:bg-brand-navy-850/70 dark:border-brand-navy-700/40'
              ]"
            >
              <!-- Animated background pulse highlight on active -->
              <div 
                v-if="selectedCity === landmark.fullName"
                class="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/10 dark:bg-brand-cyan/15 blur-xl animate-pulse"
              ></div>

              <!-- Landmark Icon Container with dynamic background theme -->
              <div 
                class="w-8 h-8 p-1.5 rounded-xl shrink-0 transition-transform duration-300 group-hover/card:scale-110 flex items-center justify-center"
                :class="[
                  selectedCity === landmark.fullName
                    ? 'bg-blue-500/20 text-blue-600 dark:bg-brand-cyan/25 dark:text-brand-cyan'
                    : 'bg-slate-100 dark:bg-brand-navy-800/80 ' + landmark.color
                ]"
                v-html="landmark.svg"
              ></div>

              <!-- Location Label & Indicator -->
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold tracking-tight truncate leading-tight">
                  {{ landmark.name }}
                </span>
                <span 
                  class="text-[9px] font-semibold mt-0.5"
                  :class="selectedCity === landmark.fullName ? 'text-blue-500/80 dark:text-brand-cyan/80' : 'text-slate-400 dark:text-slate-500'"
                >
                  {{ selectedCity === landmark.fullName ? 'Aktif' : 'Pilih Kota' }}
                </span>
              </div>
            </button>
          </div>

          <!-- Dot Navigation -->
          <div class="flex items-center justify-center gap-1.5 mt-3 mb-1">
            <button
              v-for="landmark in cityLandmarks"
              :key="'dot-' + landmark.name"
              @click="$emit('select-city', landmark.fullName)"
              class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              :class="selectedCity === landmark.fullName
                ? 'w-5 bg-blue-500 dark:bg-brand-cyan'
                : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'"
              :aria-label="'Pilih ' + landmark.name"
            ></button>
          </div>
          </div> <!-- End of Carousel Wrapper -->
        </div> <!-- End of backdrop container -->

        <!-- Slide transition wrapper: overflow-hidden clips the outgoing/incoming cards -->
        <div class="relative overflow-hidden">
        <Transition
          :name="slideDirection"
          @before-leave="lockHeight"
          @after-enter="unlockHeight"
        >
        <div :key="selectedCity" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Card 1: Darat -->
          <div class="group relative bg-white/95 dark:bg-brand-navy-900/90 border border-slate-200 dark:border-brand-navy-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-500/40 dark:hover:border-orange-400/40 transition-all duration-500 backdrop-blur-xl flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-orange-500/50 dark:active:border-orange-400/50">
            <!-- Colored Ambient Glow Overlay -->
            <div class="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-orange-500/12 dark:bg-orange-500/18 blur-2xl group-hover:bg-orange-500/30 dark:group-hover:bg-orange-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

            <!-- 🏔️ Land Illustration: City skyline + road + mountains -->
            <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
              <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
                <defs>
                  <linearGradient id="landGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f97316" stop-opacity="0"/>
                    <stop offset="100%" stop-color="#f97316" stop-opacity="0.4"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="320" height="80" fill="url(#landGradA)"/>
                <!-- Mountain range far -->
                <path d="M0 55 Q 30 15, 55 48 Q 80 5, 110 45 Q 135 18, 160 50 Q 187 2, 215 42 Q 240 12, 265 48 Q 292 20, 320 52 L320 80 L0 80Z" fill="#f97316" opacity="0.4"/>
                <!-- Mountain range near -->
                <path d="M0 68 Q 25 38, 50 60 Q 75 30, 100 58 Q 127 34, 155 62 Q 180 26, 210 58 Q 240 38, 270 60 Q 297 42, 320 62 L320 80 L0 80Z" fill="#ea580c" opacity="0.55"/>
                <!-- Ground base -->
                <rect x="0" y="73" width="320" height="7" fill="#9a3412" opacity="0.6"/>
                <!-- Road center line -->
                <line x1="0" y1="76.5" x2="320" y2="76.5" stroke="#fed7aa" stroke-width="0.6" stroke-dasharray="10 7" opacity="0.7"/>
                <!-- Buildings skyline -->
                <rect x="10" y="50" width="12" height="23" fill="#fb923c" opacity="0.75" rx="1"/>
                <rect x="8" y="44" width="6" height="7" fill="#fb923c" opacity="0.7" rx="0.5"/>
                <rect x="25" y="42" width="10" height="31" fill="#f97316" opacity="0.7" rx="1"/>
                <rect x="38" y="53" width="8" height="20" fill="#ea580c" opacity="0.75" rx="1"/>
                <rect x="48" y="46" width="11" height="27" fill="#fb923c" opacity="0.65" rx="1"/>
                <rect x="62" y="55" width="9" height="18" fill="#f97316" opacity="0.6" rx="1"/>
                <!-- Windows -->
                <rect x="12" y="53" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="16" y="53" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="12" y="58" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="16" y="58" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="27" y="46" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="31" y="46" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="27" y="52" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="50" y="50" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <rect x="55" y="50" width="2.5" height="2" fill="#fed7aa" opacity="1" rx="0.3"/>
                <!-- Trees right side -->
                <ellipse cx="265" cy="60" rx="9" ry="12" fill="#16a34a" opacity="0.55"/>
                <rect x="263" y="68" width="4" height="8" fill="#15803d" opacity="0.55" rx="0.5"/>
                <ellipse cx="282" cy="57" rx="10" ry="14" fill="#15803d" opacity="0.5"/>
                <rect x="280" y="66" width="4" height="10" fill="#166534" opacity="0.5" rx="0.5"/>
                <ellipse cx="300" cy="62" rx="8" ry="11" fill="#16a34a" opacity="0.55"/>
                <rect x="298" y="69" width="4" height="8" fill="#15803d" opacity="0.55" rx="0.5"/>
                <!-- Car on road -->
                <rect x="185" y="70" width="20" height="7" fill="#7c3aed" opacity="0.65" rx="2"/>
                <rect x="187" y="67.5" width="14" height="5" fill="#6d28d9" opacity="0.55" rx="1.5"/>
                <circle cx="188.5" cy="77.5" r="2.5" fill="#1e293b" opacity="0.75"/>
                <circle cx="202.5" cy="77.5" r="2.5" fill="#1e293b" opacity="0.75"/>
                <!-- Sun rays top right -->
                <circle cx="295" cy="18" r="10" fill="#fbbf24" opacity="0.3"/>
                <line x1="295" y1="4" x2="295" y2="7" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
                <line x1="307" y1="7" x2="305" y2="9" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
                <line x1="311" y1="18" x2="308" y2="18" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
                <line x1="307" y1="29" x2="305" y2="27" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
              </svg>
            </div>
            
            <div class="flex items-center justify-between z-10">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-orange-500/15 dark:bg-orange-500/25 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 group-active:scale-105 transition-transform duration-350">
                  <Compass class="w-5 h-5 transition-transform duration-700 ease-out group-hover:rotate-[360deg] group-active:rotate-[360deg]" />
                </div>
                <h4 class="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  {{ currentAnalysis.land.title }}
                </h4>
              </div>
              
              <!-- Futuristic City Badge -->
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/8 dark:bg-orange-500/12 border border-orange-500/20 dark:border-orange-500/25 text-[9px] font-black uppercase tracking-wider text-orange-600/80 dark:text-orange-400/80 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-orange-500/15 group-hover:border-orange-500/35">
                <span class="inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 opacity-90" v-html="currentCityLandmarkSvg"></span>
                <span>{{ currentCityShortName }}</span>
              </div>
            </div>
            
            <p class="text-xs leading-relaxed text-slate-800 dark:text-slate-100 font-medium flex-grow z-10">
              {{ currentAnalysis.land.desc }}
            </p>

            <!-- Card Footer Stats Row -->
            <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-200 dark:border-brand-navy-700/40 text-[11px] font-bold text-slate-800 dark:text-slate-100 z-10">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Thermometer class="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{{ weatherData.temp }}°C</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Sun class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>UV {{ weatherData.uvIndex }}</span>
                </div>
              </div>
              <span class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-not-allowed transition-colors font-black" title="Layanan belum tersedia">
                Selengkapnya
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </div>
          </div>

          <!-- Card 2: Pesisir & Laut -->
          <div class="group relative bg-white/95 dark:bg-brand-navy-900/90 border border-slate-200 dark:border-brand-navy-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-all duration-500 backdrop-blur-xl flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-cyan-500/50 dark:active:border-cyan-400/50">
            <!-- Colored Ambient Glow Overlay -->
            <div class="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-cyan-500/12 dark:bg-cyan-500/18 blur-2xl group-hover:bg-cyan-500/30 dark:group-hover:bg-cyan-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

            <!-- 🌊 Sea Illustration: Ocean waves + ship + lighthouse -->
            <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
              <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
                <defs>
                  <linearGradient id="seaGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#06b6d4" stop-opacity="0"/>
                    <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.3"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="320" height="80" fill="url(#seaGradA)"/>
                <!-- Sea base -->
                <rect x="0" y="58" width="320" height="22" fill="#0e7490" opacity="0.5"/>
                <!-- Wave back -->
                <path d="M0 56 Q20 46 40 53 Q60 60 80 52 Q100 44 120 53 Q140 62 160 52 Q180 42 200 53 Q220 63 240 53 Q260 43 280 53 Q300 63 320 56 L320 80 L0 80Z" fill="#0891b2" opacity="0.45"/>
                <!-- Wave mid -->
                <path d="M0 63 Q16 55 32 61 Q48 67 64 60 Q80 53 96 60 Q112 67 128 60 Q144 53 160 61 Q176 69 192 61 Q208 53 224 61 Q240 69 256 61 Q272 53 288 61 Q304 69 320 63 L320 80 L0 80Z" fill="#06b6d4" opacity="0.5"/>
                <!-- Wave front crest -->
                <path d="M0 70 Q10 65 20 68 Q30 71 40 67 Q50 63 60 68 Q70 73 80 68 Q90 63 100 68 Q110 73 120 68 Q130 63 140 68 Q150 73 160 68 Q170 63 180 68 Q190 73 200 68 Q210 63 220 68 Q230 73 240 68 Q250 63 260 68 Q270 73 280 68 Q290 63 300 68 Q310 73 320 70 L320 80 L0 80Z" fill="#22d3ee" opacity="0.55"/>
                <!-- Lighthouse -->
                <rect x="270" y="28" width="10" height="33" fill="#e2e8f0" opacity="0.85" rx="1"/>
                <rect x="267" y="26" width="16" height="4" fill="#cbd5e1" opacity="0.8" rx="1"/>
                <polygon points="275,14 267,26 283,26" fill="#ef4444" opacity="0.75"/>
                <rect x="272.5" y="17" width="5" height="5" fill="#fde68a" opacity="0.95"/>
                <!-- Light beam -->
                <path d="M275 19 L235 52 L252 57 Z" fill="#fde68a" opacity="0.12"/>
                <!-- Cargo ship -->
                <path d="M58 58 L48 66 L128 66 L118 58Z" fill="#475569" opacity="0.75" rx="1"/>
                <rect x="68" y="48" width="16" height="10" fill="#64748b" opacity="0.75" rx="1"/>
                <rect x="87" y="43" width="9" height="15" fill="#94a3b8" opacity="0.7" rx="1"/>
                <!-- Funnel smoke -->
                <circle cx="91" cy="39" r="3.5" fill="#94a3b8" opacity="0.35"/>
                <circle cx="88" cy="34" r="2.5" fill="#94a3b8" opacity="0.22"/>
                <circle cx="93" cy="30" r="2" fill="#94a3b8" opacity="0.14"/>
                <!-- Mast and flag -->
                <line x1="96" y1="30" x2="96" y2="43" stroke="#cbd5e1" stroke-width="1.2" opacity="0.75"/>
                <polygon points="96,30 108,33 96,37" fill="#ef4444" opacity="0.65"/>
                <!-- Containers on ship deck -->
                <rect x="72" y="58" width="8" height="4" fill="#ef4444" opacity="0.5" rx="0.3"/>
                <rect x="81" y="58" width="8" height="4" fill="#3b82f6" opacity="0.5" rx="0.3"/>
                <rect x="90" y="58" width="8" height="4" fill="#22c55e" opacity="0.5" rx="0.3"/>
                <!-- Small fishing boat -->
                <path d="M178 64 L170 70 L205 70 L197 64Z" fill="#92400e" opacity="0.65" rx="1"/>
                <rect x="183" y="57" width="7" height="7" fill="#a16207" opacity="0.6" rx="0.5"/>
                <!-- Fishing rod -->
                <line x1="190" y1="57" x2="205" y2="50" stroke="#a16207" stroke-width="0.8" opacity="0.5"/>
                <line x1="205" y1="50" x2="205" y2="62" stroke="#a16207" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4"/>
                <!-- Seagulls -->
                <path d="M200 30 Q205 25 210 30" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.75"/>
                <path d="M218 22 Q223 17 228 22" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.7"/>
                <path d="M233 35 Q237 31 241 35" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
              </svg>
            </div>

            <div class="flex items-center justify-between z-10">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-600 dark:text-brand-cyan flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 group-active:scale-105 transition-transform duration-350">
                  <Waves class="w-5 h-5 transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-active:-translate-y-0.5 group-active:scale-110" />
                </div>
                <h4 class="text-[11px] font-black uppercase tracking-widest text-cyan-600 dark:text-brand-cyan">
                  {{ currentAnalysis.sea.title }}
                </h4>
              </div>
              
              <!-- Futuristic City Badge -->
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/8 dark:bg-cyan-500/12 border border-cyan-500/20 dark:border-cyan-500/25 text-[9px] font-black uppercase tracking-wider text-cyan-600/80 dark:text-cyan-400/80 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/35">
                <span class="inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 opacity-90" v-html="currentCityLandmarkSvg"></span>
                <span>{{ currentCityShortName }}</span>
              </div>
            </div>
            
            <p class="text-xs leading-relaxed text-slate-800 dark:text-slate-100 font-medium flex-grow z-10">
              {{ currentAnalysis.sea.desc }}
            </p>

            <!-- Card Footer Stats Row -->
            <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-200 dark:border-brand-navy-700/40 text-[11px] font-bold text-slate-800 dark:text-slate-100 z-10">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Wind class="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>{{ weatherData.windSpeed }} km/jam</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Navigation class="w-3.5 h-3.5 text-indigo-500 shrink-0" :style="{ transform: `rotate(${additionalInfo.windAngle}deg)` }" />
                  <span>{{ additionalInfo.windDir }}</span>
                </div>
              </div>
              <span @click.stop="redirectToMaritime" class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-cyan-600 dark:text-brand-cyan hover:text-cyan-750 dark:hover:text-cyan-300 hover:underline transition-colors font-black">
                Selengkapnya
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </div>
          </div>

          <!-- Card 3: Penerbangan -->
          <div class="group relative bg-white/95 dark:bg-brand-navy-900/90 border border-slate-200 dark:border-brand-navy-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-500 backdrop-blur-xl flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-indigo-500/50 dark:active:border-indigo-400/50">
            <!-- Colored Ambient Glow Overlay -->
            <div class="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-indigo-500/12 dark:bg-indigo-500/18 blur-2xl group-hover:bg-indigo-500/30 dark:group-hover:bg-indigo-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

            <!-- ✈️ Aviation Illustration: Runway + sky + flying plane -->
            <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
              <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
                <defs>
                  <linearGradient id="airGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0"/>
                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0.35"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="320" height="80" fill="url(#airGradA)"/>
                <!-- Runway tarmac -->
                <rect x="0" y="73" width="320" height="7" fill="#3730a3" opacity="0.5"/>
                <!-- Runway markings -->
                <rect x="25" y="74.5" width="18" height="2" fill="#a5b4fc" opacity="0.75" rx="0.5"/>
                <rect x="49" y="74.5" width="18" height="2" fill="#a5b4fc" opacity="0.75" rx="0.5"/>
                <rect x="73" y="74.5" width="18" height="2" fill="#a5b4fc" opacity="0.75" rx="0.5"/>
                <rect x="97" y="74.5" width="18" height="2" fill="#a5b4fc" opacity="0.75" rx="0.5"/>
                <line x1="0" y1="77" x2="320" y2="77" stroke="#a5b4fc" stroke-width="0.5" stroke-dasharray="8 6" opacity="0.5"/>
                <!-- Cloud 1 - large -->
                <path d="M18 46 Q23 36 33 38 Q36 28 46 30 Q56 26 60 36 Q68 34 70 42 Q72 50 63 52 Q48 56 33 54 Q20 54 18 46Z" fill="#c7d2fe" opacity="0.65"/>
                <!-- Cloud 2 -->
                <path d="M218 30 Q222 22 230 24 Q233 16 241 18 Q249 14 252 22 Q258 20 260 28 Q262 34 255 36 Q243 40 230 38 Q220 36 218 30Z" fill="#a5b4fc" opacity="0.6"/>
                <!-- Cloud 3 - small -->
                <path d="M142 20 Q145 14 151 16 Q153 10 159 12 Q165 8 167 15 Q172 13 173 19 Q174 24 168 25 Q159 28 150 26 Q143 24 142 20Z" fill="#c7d2fe" opacity="0.55"/>
                <!-- Airplane - main body / fuselage -->
                <path d="M145 41 Q158 37 178 39 L192 40 L192 42 L178 43 Q158 45 145 43Z" fill="#e0e7ff" opacity="0.95" rx="3"/>
                <!-- Nose cone -->
                <path d="M192 40 L207 41 L192 42Z" fill="#c7d2fe" opacity="0.95"/>
                <!-- Tail fin vertical -->
                <path d="M147 41 L145 33 L157 39Z" fill="#a5b4fc" opacity="0.85"/>
                <!-- Tail fin horizontal -->
                <path d="M147 41 L140 45 L155 42Z" fill="#a5b4fc" opacity="0.75"/>
                <!-- Main wings -->
                <path d="M166 39 L154 56 L173 42 L185 42 L192 56 L178 40Z" fill="#818cf8" opacity="0.85"/>
                <!-- Engines -->
                <ellipse cx="163" cy="45" rx="6" ry="2.2" fill="#6366f1" opacity="0.8"/>
                <ellipse cx="182" cy="45" rx="6" ry="2.2" fill="#6366f1" opacity="0.8"/>
                <!-- Engine intake rings -->
                <ellipse cx="157" cy="45" rx="2" ry="2.2" fill="#4338ca" opacity="0.7"/>
                <ellipse cx="176" cy="45" rx="2" ry="2.2" fill="#4338ca" opacity="0.7"/>
                <!-- Contrails - dual -->
                <line x1="145" y1="41" x2="65" y2="50" stroke="#e0e7ff" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
                <line x1="145" y1="43" x2="65" y2="52" stroke="#e0e7ff" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                <line x1="90" y1="48" x2="40" y2="54" stroke="#e0e7ff" stroke-width="1" stroke-linecap="round" opacity="0.18"/>
                <!-- Windows on fuselage -->
                <rect x="155" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <rect x="161" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <rect x="167" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <rect x="173" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <rect x="179" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <rect x="185" y="39.5" width="3" height="2" fill="#a5b4fc" opacity="0.8" rx="0.5"/>
                <!-- Control tower -->
                <rect x="268" y="50" width="9" height="23" fill="#6366f1" opacity="0.65" rx="1"/>
                <rect x="263" y="48" width="19" height="5" fill="#818cf8" opacity="0.7" rx="1"/>
                <rect x="265" y="43" width="15" height="6" fill="#a5b4fc" opacity="0.6" rx="0.5"/>
                <rect x="268" y="41" width="9" height="3" fill="#c7d2fe" opacity="0.55" rx="0.5"/>
                <!-- Radar on tower -->
                <ellipse cx="272" cy="41" rx="6" ry="1.5" fill="#818cf8" opacity="0.6"/>
                <line x1="272" y1="38" x2="272" y2="41" stroke="#a5b4fc" stroke-width="1" opacity="0.5"/>
              </svg>
            </div>

            <div class="flex items-center justify-between z-10">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 group-active:scale-105 transition-transform duration-350">
                  <Plane class="w-5 h-5 transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110 group-active:-rotate-12 group-active:scale-110" />
                </div>
                <h4 class="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {{ currentAnalysis.air.title }}
                </h4>
              </div>
              
              <!-- Futuristic City Badge -->
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/8 dark:bg-indigo-500/12 border border-indigo-500/20 dark:border-indigo-500/25 text-[9px] font-black uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400/80 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-indigo-500/15 group-hover:border-indigo-500/35">
                <span class="inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 opacity-90" v-html="currentCityLandmarkSvg"></span>
                <span>{{ currentCityShortName }}</span>
              </div>
            </div>
            
            <p class="text-xs leading-relaxed text-slate-800 dark:text-slate-100 font-medium flex-grow z-10">
              {{ currentAnalysis.air.desc }}
            </p>

            <!-- Card Footer Stats Row -->
            <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-200 dark:border-brand-navy-700/40 text-[11px] font-bold text-slate-800 dark:text-slate-100 z-10">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Eye class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{{ weatherData.visibility }} km</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <Droplets class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{{ weatherData.humidity }}%</span>
                </div>
              </div>
              <span class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-not-allowed transition-colors font-black" title="Layanan belum tersedia">
                Selengkapnya
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>
        </Transition>
        </div>
      </div>
      
      <!-- Left Column: Primary Weather & Detailed Analytics (Span 2) -->
      <div class="lg:col-span-2 space-y-8 animate-fade-in" style="animation-delay: 100ms;">
        <!-- Current Weather Overview -->
        <CurrentWeather 
          :weather-data="weatherData" 
          :cities="cities"
          :selected-city="selectedCity"
          @select-city="$emit('select-city', $event)"
          @delete-city="$emit('delete-city', $event)"
        />

        <!-- Temperature Trend Line Graph & Hourly Flex -->
        <ForecastPanel :forecasts="forecasts" />

        <!-- Satellite Map Mockup Component -->
        <SatelliteMap :selected-city="selectedCity" @select-city="$emit('select-city', $event)" />

        <!-- Weather & Geophysics News Grid -->
        <NewsSection :articles="articles" class="hidden lg:block" />
      </div>

      <!-- Right Column: Sidebar alerts & Transportation status (Span 1) -->
      <div class="lg:sticky lg:top-20 self-start space-y-8 animate-fade-in" style="animation-delay: 200ms;">
        <!-- Golf Course Weather Index -->
        <AroundActivityPanel v-if="!(isGeolocated && selectedCity === cities[0])" :selected-city="selectedCity" />

        <!-- Emergency Alerts Cards -->
        <AlertsPanel :alerts="alerts" />

        <!-- Traffic & Transport advisories -->
        <TransportWeather :statuses="transportStatuses" />
      </div>

    </div>
  </main>
</template>

<style scoped>
/*
  True carousel slide — all 3 cards move as one unit simultaneously.

  ── SLIDE LEFT  (klik kota di sebelah KANAN tab aktif)
     • Card lama: melesat keluar ke KIRI  (translateX  0 → -100%)
     • Card baru: masuk dari KANAN        (translateX +100% → 0)
*/
.slide-left-enter-active,
.slide-left-leave-active {
  /* Perfectly synchronized — same duration & easing for both */
  transition:
    transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
    opacity   0.28s cubic-bezier(0.4, 0, 0.2, 1),
    filter    0.36s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-leave-active {
  /* Lift out of flow so incoming grid occupies space immediately */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
/* New cards: rush in from the right */
.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0.4;
  filter: blur(6px);
}
.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0px);
}
/* Old cards: blast out to the left */
.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0px);
}
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0.4;
  filter: blur(6px);
}

/*
  ── SLIDE RIGHT (klik kota di sebelah KIRI tab aktif)
     • Card lama: melesat keluar ke KANAN (translateX  0 → +100%)
     • Card baru: masuk dari KIRI         (translateX -100% → 0)
*/
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
    opacity   0.28s cubic-bezier(0.4, 0, 0.2, 1),
    filter    0.36s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
/* New cards: rush in from the left */
.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0.4;
  filter: blur(6px);
}
.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0px);
}
/* Old cards: blast out to the right */
.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0px);
}
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0.4;
  filter: blur(6px);
}
</style>

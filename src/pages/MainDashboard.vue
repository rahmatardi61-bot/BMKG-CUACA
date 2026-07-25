<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, defineAsyncComponent, nextTick } from 'vue';

// ── Skeleton loaders (imported directly — tiny, no lazy needed) ──────────────
import SkeletonWeatherCard from '../components/skeletons/SkeletonWeatherCard.vue';
import SkeletonForecast from '../components/skeletons/SkeletonForecast.vue';
import SkeletonSidebar from '../components/skeletons/SkeletonSidebar.vue';

// ── Heavy components — lazy loaded with skeleton placeholders ─────────────────
const CurrentWeather = defineAsyncComponent({
  loader: () => import('../components/CurrentWeather.vue'),
  loadingComponent: SkeletonWeatherCard,
  delay: 80,
});
const ForecastPanel = defineAsyncComponent({
  loader: () => import('../components/ForecastPanel.vue'),
  loadingComponent: SkeletonForecast,
  delay: 80,
});
const WeatherActivity = defineAsyncComponent({
  loader: () => import('../components/WeatherActivity.vue'),
  loadingComponent: SkeletonSidebar,
  delay: 80,
});
const AroundActivityPanel = defineAsyncComponent({
  loader: () => import('../components/AroundActivityPanel.vue'),
  delay: 80,
});

// ── Lighter components — lazy loaded without skeleton (loads fast enough) ─────
const TransportWeather = defineAsyncComponent(() => import('../components/TransportWeather.vue'));
const AlertsPanel = defineAsyncComponent(() => import('../components/AlertsPanel.vue'));
const MaritimeAdvisorDrawer = defineAsyncComponent(() => import('../components/MaritimeAdvisorDrawer.vue'));
const AviationAdvisorDrawer = defineAsyncComponent(() => import('../components/AviationAdvisorDrawer.vue'));
const LandBasedActivities = defineAsyncComponent(() => import('../components/LandBasedActivities.vue'));

import type { 
  WeatherData, 
  HourlyForecast, 
  TransportStatus, 
  WarningAlert, 
  NewsArticle 
} from '../types/weather';
import { cityAnalysisMap } from '../data/mockData';
import { 
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Smartphone
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
  userLat?: number | null;
  userLng?: number | null;
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
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
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

// ── Advisor Drawer State & Logic ──
const isMaritimeDrawerOpen = ref(false);
const activeMaritimeSector = ref<'shipping' | 'fishery' | 'oilgas' | 'tourism' | 'public'>('shipping');

const openMaritimeAdvisor = (sectorId?: string) => {
  if (sectorId && ['shipping', 'fishery', 'oilgas', 'tourism', 'public'].includes(sectorId)) {
    activeMaritimeSector.value = sectorId as any;
  }
  isMaritimeDrawerOpen.value = true;
};

const isAviationDrawerOpen = ref(false);
const activeAviationSector = ref<'commercial' | 'cargo' | 'sigmet' | 'pirep'>('commercial');

const openAviationAdvisor = (sectorId?: string) => {
  if (sectorId && ['commercial', 'cargo', 'sigmet', 'pirep'].includes(sectorId)) {
    activeAviationSector.value = sectorId as any;
  }
  isAviationDrawerOpen.value = true;
};

const isLandDrawerOpen = ref(false);
const openLandAdvisor = () => {
  isLandDrawerOpen.value = true;
};

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
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- 3 Analysis Cards (Activity Advisories) - Full Width (Col Span 3) -->
      <div class="lg:col-span-3 space-y-4">
        
        <!-- Emergency Alerts Cards -->
        <AlertsPanel :alerts="alerts" />

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
                  <h2 class="text-xs sm:text-sm tracking-tight normal-case leading-relaxed flex items-baseline flex-wrap gap-x-0.5">
                    <span class="font-bold text-slate-800 dark:text-white">{{ splitLocation(selectedCity).main }}, </span>
                    <span class="font-normal text-slate-500 dark:text-slate-400">{{ splitLocation(selectedCity).sub || 'Indonesia' }}</span>
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
        </div>

        <!-- Elegant 10 Major Cities Landmark Row with Auto-Slide Carousel with backdrop -->
        <div class="relative w-full mt-4 bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 backdrop-blur-md rounded-3xl p-5 shadow-sm overflow-hidden">
          <!-- Soft colorful illustrations / gradient glows in background -->
          <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div class="absolute top-0 left-0 w-44 h-44 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-600/10 blur-3xl translate-x-[-30%] translate-y-[-30%]"></div>
            <div class="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 dark:from-cyan-500/10 dark:to-emerald-600/10 blur-3xl translate-x-[30%] translate-y-[30%]"></div>
            <div class="absolute top-1/3 left-1/3 w-36 h-36 rounded-full bg-gradient-to-br from-pink-400/10 to-rose-400/10 dark:from-pink-500/8 dark:to-rose-600/8 blur-3xl"></div>
          </div>
          
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
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-br from-blue-500/[0.04] to-indigo-600/[0.04] dark:from-cyan-500/[0.06] dark:to-blue-600/[0.06] border border-blue-500/10 dark:border-cyan-500/15 p-3 rounded-2xl max-w-full lg:max-w-xl transition-all duration-300 hover:border-blue-500/25 dark:hover:border-cyan-500/30 hover:shadow-sm">
              <div class="flex items-start gap-3 min-w-0">
                <!-- Icon with circular glowing backdrop -->
                <div class="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-cyan-500/15 text-blue-600 dark:text-brand-cyan shrink-0">
                  <Smartphone class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal mt-0.5">
                    Unduh aplikasi <strong class="text-slate-800 dark:text-white font-extrabold">Info BMKG</strong> untuk mendapatkan notifikasi cuaca & gempa secara realtime.
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-center gap-2 shrink-0 sm:ml-auto">
                <!-- Google Play Button -->
                <a 
                  href="https://play.google.com/store/apps/details?id=id.go.bmkg.infobmkg" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="h-9 px-3.5 rounded-xl border flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-800/80 hover:bg-slate-950 dark:bg-slate-900/60 dark:border-white/10 dark:hover:bg-slate-900 dark:hover:border-white/20 text-white shadow-sm"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-emerald-400">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.58-1.408V3.222c0-.528.22-1.01.58-1.408zM14.5 12.707l2.846 2.846-13.018 7.502a1.99 1.99 0 0 1-.718.131c-.52 0-.996-.2-1.378-.528L14.5 12.707zm7.558-.918l-3.328-1.92-2.176 2.176 2.176 2.176 3.328-1.92a1.144 1.144 0 0 0 0-2.022zM14.5 11.293L2.232 3.223c.382-.328.858-.528 1.378-.528.254 0 .5.048.718.131l13.018 7.502-2.846 2.965z"/>
                  </svg>
                  <div class="text-left leading-none">
                    <div class="text-[7.5px] uppercase font-bold text-slate-400 dark:text-slate-450 tracking-wide">Temukan di</div>
                    <div class="text-[11px] font-black text-white mt-0.5">Google Play</div>
                  </div>
                </a>

                <!-- App Store Button -->
                <a 
                  href="https://apps.apple.com/id/app/info-bmkg/id1114372539" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="h-9 px-3.5 rounded-xl border flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-800/80 hover:bg-slate-950 dark:bg-slate-900/60 dark:border-white/10 dark:hover:bg-slate-900 dark:hover:border-white/20 text-white shadow-sm"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-100">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.01.24.02.36.02.94 0 2.01-.54 2.46-1.35z"/>
                  </svg>
                  <div class="text-left leading-none">
                    <div class="text-[7.5px] uppercase font-bold text-slate-400 dark:text-slate-450 tracking-wide">Unduh di</div>
                    <div class="text-[11px] font-black text-white mt-0.5">App Store</div>
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
            class="absolute -left-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
            aria-label="Previous cities"
          >
            <ChevronLeft class="w-4 h-4 text-slate-800 dark:text-white" />
          </button>
          
          <!-- Right Arrow Button -->
          <button 
            @click="scrollCarousel('right')"
            class="absolute -right-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
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
              v-memo="[selectedCity === landmark.fullName]"
              :id="'landmark-card-' + landmark.name.toLowerCase()"
              @click="$emit('select-city', landmark.fullName)"
              class="snap-start flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 min-w-[145px] sm:min-w-[155px] select-none active:scale-[0.97] backdrop-blur-md relative overflow-hidden group/card shadow-sm"
              :class="[
                selectedCity === landmark.fullName
                  ? {
                      'Jakarta': 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/45 shadow-sm shadow-blue-500/5 font-extrabold',
                      'Surabaya': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/45 shadow-sm shadow-cyan-500/5 font-extrabold',
                      'Bandung': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/45 shadow-sm shadow-emerald-500/5 font-extrabold',
                      'Medan': 'bg-amber-500/10 text-amber-600 border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/45 shadow-sm shadow-amber-500/5 font-extrabold',
                      'Semarang': 'bg-purple-500/10 text-purple-600 border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/45 shadow-sm shadow-purple-500/5 font-extrabold',
                      'Makassar': 'bg-red-500/10 text-red-600 border-red-500/40 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/45 shadow-sm shadow-red-500/5 font-extrabold',
                      'Palembang': 'bg-orange-500/10 text-orange-600 border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/45 shadow-sm shadow-orange-500/5 font-extrabold',
                      'Batam': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/45 shadow-sm shadow-indigo-500/5 font-extrabold',
                      'Pekanbaru': 'bg-teal-500/10 text-teal-600 border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/45 shadow-sm shadow-teal-500/5 font-extrabold',
                      'Denpasar': 'bg-rose-500/10 text-rose-600 border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/45 shadow-sm shadow-rose-500/5 font-extrabold'
                    }[landmark.name] || 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-brand-cyan/15 dark:text-brand-cyan dark:border-brand-cyan/40 shadow-sm shadow-blue-500/5 font-extrabold'
                  : 'bg-white/50 text-slate-600 hover:bg-white/80 border-slate-200/40 dark:bg-brand-navy-900/50 dark:text-slate-300 dark:hover:bg-brand-navy-850/70 dark:border-brand-navy-700/40'
              ]"
            >
              <!-- Animated background pulse highlight on active -->
              <div 
                v-if="selectedCity === landmark.fullName"
                class="absolute -right-6 -top-6 w-16 h-16 rounded-full blur-xl animate-pulse"
                :class="[
                  {
                    'Jakarta': 'bg-blue-500/10 dark:bg-blue-500/15',
                    'Surabaya': 'bg-cyan-500/10 dark:bg-cyan-500/15',
                    'Bandung': 'bg-emerald-500/10 dark:bg-emerald-500/15',
                    'Medan': 'bg-amber-500/10 dark:bg-amber-500/15',
                    'Semarang': 'bg-purple-500/10 dark:bg-purple-500/15',
                    'Makassar': 'bg-red-500/10 dark:bg-red-500/15',
                    'Palembang': 'bg-orange-500/10 dark:bg-orange-500/15',
                    'Batam': 'bg-indigo-500/10 dark:bg-indigo-500/15',
                    'Pekanbaru': 'bg-teal-500/10 dark:bg-teal-500/15',
                    'Denpasar': 'bg-rose-500/10 dark:bg-rose-500/15'
                  }[landmark.name] || 'bg-blue-500/10 dark:bg-brand-cyan/15'
                ]"
              ></div>

              <!-- Landmark Icon Container with dynamic background theme -->
              <div 
                class="w-8 h-8 p-1.5 rounded-xl shrink-0 transition-transform duration-300 group-hover/card:scale-110 flex items-center justify-center"
                :class="[
                  selectedCity === landmark.fullName
                    ? {
                        'Jakarta': 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400',
                        'Surabaya': 'bg-cyan-500/20 text-cyan-600 dark:bg-cyan-500/25 dark:text-cyan-400',
                        'Bandung': 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400',
                        'Medan': 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400',
                        'Semarang': 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/25 dark:text-purple-400',
                        'Makassar': 'bg-red-500/20 text-red-600 dark:bg-red-500/25 dark:text-red-400',
                        'Palembang': 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400',
                        'Batam': 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-400',
                        'Pekanbaru': 'bg-teal-500/20 text-teal-600 dark:bg-teal-500/25 dark:text-teal-400',
                        'Denpasar': 'bg-rose-500/20 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400'
                      }[landmark.name] || 'bg-blue-500/20 text-blue-600 dark:bg-brand-cyan/25 dark:text-brand-cyan'
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
                  :class="[
                    selectedCity === landmark.fullName
                      ? {
                          'Jakarta': 'text-blue-500/80 dark:text-blue-400/80',
                          'Surabaya': 'text-cyan-500/80 dark:text-cyan-400/80',
                          'Bandung': 'text-emerald-500/80 dark:text-emerald-400/80',
                          'Medan': 'text-amber-500/80 dark:text-amber-400/80',
                          'Semarang': 'text-purple-500/80 dark:text-purple-400/80',
                          'Makassar': 'text-red-500/80 dark:text-red-400/80',
                          'Palembang': 'text-orange-500/80 dark:text-orange-400/80',
                          'Batam': 'text-indigo-500/80 dark:text-indigo-400/80',
                          'Pekanbaru': 'text-teal-500/80 dark:text-teal-400/80',
                          'Denpasar': 'text-rose-500/80 dark:text-rose-400/80'
                        }[landmark.name] || 'text-blue-500/80 dark:text-brand-cyan/80'
                      : 'text-slate-400 dark:text-slate-500'
                  ]"
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

        <!-- Around Activity -->
        <AroundActivityPanel v-if="!isLocating && !(isGeolocated && selectedCity === cities[0])" :selected-city="selectedCity" />
      </div>
      
      <!-- Left Column: Primary Weather Overview & Forecast (Span 2) -->
      <div class="lg:col-span-2 space-y-8 animate-fade-in" style="animation-delay: 100ms;">
        <!-- Current Weather Overview -->
        <CurrentWeather 
          :weather-data="weatherData" 
          :cities="cities"
          :selected-city="selectedCity"
          :additional-info="additionalInfo"
          @select-city="$emit('select-city', $event)"
          @delete-city="$emit('delete-city', $event)"
        />

        <!-- Temperature Trend Line Graph & Hourly Flex -->
        <ForecastPanel :forecasts="forecasts" />
      </div>

      <!-- Right Column: Sidebar (Weather Activity & Analysis, Alerts, & Transport) (Span 1) -->
      <div class="lg:sticky lg:top-20 self-start space-y-8 animate-fade-in sidebar-contained" style="animation-delay: 200ms;">
        <!-- Weather Activity & Analysis Section -->
        <WeatherActivity
          :weather-data="weatherData"
          :current-analysis="currentAnalysis"
          :additional-info="additionalInfo"
          :selected-city="selectedCity"
          :slide-direction="slideDirection"
          :current-city-landmark-svg="currentCityLandmarkSvg"
          :current-city-short-name="currentCityShortName"
          @open-maritime-advisor="openMaritimeAdvisor"
          @open-aviation-advisor="openAviationAdvisor"
          @open-land-advisor="openLandAdvisor"
        />


        <!-- Traffic & Transport advisories -->
        <TransportWeather :statuses="transportStatuses" />
      </div>

    </div>
  </main>

  <!-- Stands as standalone modal/drawer teleporter -->
  <MaritimeAdvisorDrawer
    :is-open="isMaritimeDrawerOpen"
    :initial-sector-id="activeMaritimeSector"
    :selected-city="selectedCity"
    @close="isMaritimeDrawerOpen = false"
  />
  <AviationAdvisorDrawer
    :is-open="isAviationDrawerOpen"
    :initial-sector-id="activeAviationSector"
    :selected-city="selectedCity"
    :user-lat="props.userLat ?? null"
    :user-lng="props.userLng ?? null"
    @close="isAviationDrawerOpen = false"
  />
  <LandBasedActivities
    :is-open="isLandDrawerOpen"
    :selected-city="selectedCity"
    @close="isLandDrawerOpen = false"
  />
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

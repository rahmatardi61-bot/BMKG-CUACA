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
// ── Lighter components — lazy loaded without skeleton (loads fast enough) ─────
const TransportWeather = defineAsyncComponent(() => import('../components/TransportWeather.vue'));
const AlertsPanel = defineAsyncComponent(() => import('../components/AlertsPanel.vue'));
const MaritimeAdvisorDrawer = defineAsyncComponent(() => import('../components/MaritimeAdvisorDrawer.vue'));
const AviationAdvisorDrawer = defineAsyncComponent(() => import('../components/AviationAdvisorDrawer.vue'));
const LandBasedActivities = defineAsyncComponent(() => import('../components/LandBasedActivities.vue'));
const HeroWeatherCard = defineAsyncComponent(() => import('../components/HeroWeatherCard.vue'));
const AppDownloadCTA = defineAsyncComponent(() => import('../components/AppDownloadCTA.vue'));
const MajorCitiesCarousel = defineAsyncComponent(() => import('../components/MajorCitiesCarousel.vue'));
const AroundActivityDrawer = defineAsyncComponent(() => import('../components/AroundActivityDrawer.vue'));
const SatelliteMap = defineAsyncComponent(() => import('../components/SatelliteMap.vue'));
const MarineMap = defineAsyncComponent(() => import('../components/MarineMap.vue'));
// const WeatherRadarMap = defineAsyncComponent(() => import('../components/WeatherRadarMap.vue'));
const EarthquakeHistory = defineAsyncComponent(() => import('../components/EarthquakeHistory.vue'));
import LazyCardLoader from '../components/LazyCardLoader.vue';

import type { 
  WeatherData, 
  HourlyForecast, 
  TransportStatus, 
  WarningAlert, 
  NewsArticle 
} from '../types/weather';
import { cityLandmarks } from '../data/cityLandmarks';
import { buildCityAnalysis } from '../services/analysisNarrative';
import { 
  MapPin,
  ChevronDown,
  Search
} from 'lucide-vue-next';
import { getAdditionalWeatherData, type AdditionalWeatherInfo } from '../data/weatherHelpers';

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
  additionalInfo?: AdditionalWeatherInfo;
  maritimLive?: { waveDesc: string; waveCat: string; warningDesc: string; wilpel: string } | null;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
  (e: 'delete-city', city: string): void;
  (e: 'detect-location'): void;
}>();

// Narasi dinamis dari data cuaca saat ini (live BMKG atau mock) — menggantikan cityAnalysisMap statis
const currentAnalysis = computed(() => buildCityAnalysis(props.weatherData, props.selectedCity, props.forecasts, props.additionalInfo));

// additionalInfo: bisa dioverride dari App.vue dengan data live API BMKG (useBmkgWeather)
const additionalInfo = computed(() => {
  return props.additionalInfo || getAdditionalWeatherData(props.selectedCity);
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
const initialDestination = ref<{ name: string; lat: number; lng: number; location: string } | null>(null);

const openLandAdvisor = () => {
  initialDestination.value = null; // reset if opened manually
  isLandDrawerOpen.value = true;
};

const isAroundDrawerOpen = ref(false);
const selectedAroundActivity = ref<any | null>(null);

const handleSelectCourse = (course: any) => {
  selectedAroundActivity.value = course;
  isAroundDrawerOpen.value = true;
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
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- 3 Analysis Cards (Activity Advisories) - Full Width (Col Span 3) -->
      <div class="lg:col-span-3 space-y-3">
        
        <!-- Emergency Alerts Cards -->
        <AlertsPanel :alerts="alerts" />

        <!-- Location Bar & Hero Row Section -->
        <div>
          <!-- Modern borderless location selector -->
          <div class="flex items-center justify-between md:justify-start gap-2 mb-2.5 w-full md:w-auto">
            <!-- Left: Location Dropdown Toggle -->
            <div class="relative min-w-0" ref="dropdownContainer">
              <div 
                id="location-dropdown-toggle"
                @click="showDropdown = !showDropdown"
                class="inline-flex items-center gap-1.5 py-1 text-left transition-all select-none hover:opacity-90 active:scale-[0.98] duration-200 outline-none cursor-pointer group max-w-full"
              >
                <h2 class="text-xs sm:text-sm tracking-tight normal-case leading-normal truncate">
                  <span class="font-bold text-slate-800 dark:text-white">{{ splitLocation(selectedCity).main }}, </span>
                  <span class="font-normal text-slate-500 dark:text-slate-400">{{ splitLocation(selectedCity).sub || 'Indonesia' }}</span>
                </h2>
                <ChevronDown class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-300 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-300" :class="{ 'rotate-180': showDropdown }" />
              </div>

              <!-- Dropdown List -->
              <div 
                v-if="showDropdown" 
                class="absolute left-0 mt-2 w-72 sm:w-80 rounded-[4px] shadow-xl border overflow-hidden py-2 z-50 animate-fade-in
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

            <!-- Right: Cari Lokasi Saya / Lokasi Saya Button (Sejajar Kanan di Mobile, Menempel di Desktop) -->
            <div class="shrink-0 flex items-center">
              <!-- Lokasi Saya Badge (Clickable button) -->
              <div v-if="isCustomGeolocated" class="relative group">
                <button 
                  type="button"
                  @click.stop="detectLocation"
                  class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:hover:bg-brand-cyan/30 border border-blue-500/20 dark:border-brand-cyan/30 cursor-pointer transition-all duration-200 outline-none whitespace-nowrap"
                >
                  <!-- Clean Map Icon -->
                  <span v-if="isLocating" class="animate-spin h-3 w-3 border-1.5 border-current rounded-full border-t-transparent shrink-0"></span>
                  <MapPin v-else class="w-3 h-3 text-blue-600 dark:text-brand-cyan shrink-0" />
                  <span>{{ isLocating ? 'Mencari...' : 'Lokasi Saya' }}</span>
                </button>

                <!-- Premium Tooltip -->
                <div class="absolute right-0 md:left-1/2 md:-translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
                  <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
                    <div class="absolute -bottom-1 right-4 md:left-1/2 md:-translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                    <span>Dapatkan lokasi realtime Anda</span>
                  </div>
                </div>
              </div>

              <!-- Cari Lokasi Saya Button (Clickable button, shown when not geolocated) -->
              <div v-else class="relative group">
                <button 
                  type="button"
                  @click.stop="detectLocation"
                  class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:hover:bg-brand-cyan/30 border border-blue-500/20 dark:border-brand-cyan/30 cursor-pointer transition-all duration-200 outline-none whitespace-nowrap"
                >
                  <!-- Clean Map Icon -->
                  <span v-if="isLocating" class="animate-spin h-3 w-3 border-1.5 border-current rounded-full border-t-transparent shrink-0"></span>
                  <MapPin v-else class="w-3 h-3 text-blue-600 dark:text-brand-cyan shrink-0" />
                  <span>{{ isLocating ? 'Mencari...' : 'Cari Lokasi Saya' }}</span>
                </button>

                <!-- Premium Tooltip -->
                <div class="absolute right-0 md:left-1/2 md:-translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
                  <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
                    <div class="absolute -bottom-1 right-4 md:left-1/2 md:-translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                    <span>Cari lokasi realtime Anda menggunakan GPS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero & Download CTA Row (Span 2 + Span 1) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <!-- Large Hero Weather Card (Span 2 - Same width as Carousel below) -->
            <div class="lg:col-span-2 animate-fade-in scroll-section flex flex-col h-full" style="animation-delay: 100ms;">
              <HeroWeatherCard 
                class="h-full flex-1"
                :weather-data="weatherData" 
                :cities="cities"
                :selected-city="selectedCity"
                :additional-info="additionalInfo"
                @select-city="$emit('select-city', $event)"
                @delete-city="$emit('delete-city', $event)"
              />
            </div>

            <!-- Mobile App Download CTA Card (Span 1 - Same height as HeroWeatherCard) -->
            <div class="lg:col-span-1 animate-fade-in scroll-section flex flex-col h-full" style="animation-delay: 150ms;">
              <AppDownloadCTA class="h-full flex-1" />
            </div>
          </div>
        </div>

      </div>

      <!-- Left Column: Primary Weather Overview & Forecast (Span 2) -->
      <div class="lg:col-span-2 space-y-8 animate-fade-in scroll-section" style="animation-delay: 200ms;">
        <!-- Elegant 10 Major Cities Landmark Row with Auto-Slide Carousel with backdrop -->
        <MajorCitiesCarousel 
          :weather-data="weatherData"
          :selected-city="selectedCity" 
          :show-activities="!isLocating && !(isGeolocated && selectedCity === cities[0])"
          @select-city="$emit('select-city', $event)" 
          @select-course="handleSelectCourse($event)"
        />

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

        <!-- BMKG Satellite Map with Lazy Viewport Skeleton Loader -->
        <LazyCardLoader 
          min-height="460px" 
          title="Memuat Citra Satelit Himawari-9" 
          subtitle="Menghubungkan citra satelit BMKG"
        >
          <SatelliteMap
            :selected-city="selectedCity"
            @select-city="$emit('select-city', $event)"
          />
        </LazyCardLoader>

        <!-- BMKG Maritime Weather Map with Lazy Viewport Skeleton Loader -->
        <LazyCardLoader 
          min-height="540px" 
          title="Memuat Peta Maritim INAWAVES" 
          subtitle="Memuat data perairan & pelabuhan Indonesia"
        >
          <MarineMap 
            :selected-city="selectedCity"
            :user-lat="userLat"
            :user-lng="userLng"
          />
        </LazyCardLoader>

        <!-- Interactive BMKG Weather Radar Map (Hidden)
        <WeatherRadarMap
          :selected-city="selectedCity"
          :user-lat="userLat"
          :user-lng="userLng"
          :weather-data="weatherData"
        />
        -->

        <!-- Real-time Earthquake Seismic Proximity Monitor with Lazy Viewport Skeleton Loader -->
        <LazyCardLoader 
          min-height="480px" 
          title="Memuat Sensor Seismik Gempa Real-time" 
          subtitle="Sinkronisasi data sensor gempa BMKG"
        >
          <EarthquakeHistory 
            :selected-city="selectedCity"
            :user-lat="userLat"
            :user-lng="userLng"
          />
        </LazyCardLoader>
      </div>

      <!-- Right Column: Sidebar (Weather Activity & Analysis, Alerts, & Transport) (Span 1) -->
      <div class="lg:sticky lg:top-24 self-start z-30">
        <div class="space-y-8 animate-fade-in sidebar-contained scroll-section" style="animation-delay: 200ms;">
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


    </div>
  </main>

  <!-- Stands as standalone modal/drawer teleporter -->
  <MaritimeAdvisorDrawer
    :is-open="isMaritimeDrawerOpen"
    :initial-sector-id="activeMaritimeSector"
    :selected-city="selectedCity"
    :maritim-live="props.maritimLive"
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
    :initial-destination="initialDestination"
    @close="isLandDrawerOpen = false"
  />
  <AroundActivityDrawer
    :is-open="isAroundDrawerOpen"
    :activity="selectedAroundActivity"
    :selected-city="selectedCity"
    @close="isAroundDrawerOpen = false"
  />
</template>

<style scoped>
/*
  True carousel slide — all 3 cards move as one unit simultaneously.

  ── SLIDE LEFT  (klik kota di sebelah KANAN tab aktif)
     • Card lama: melesat keluar ke KIRI  (translateX  0 → -100%)
     • Card baru: masuk dari KANAN        (translateX +100% → 0)

  PERF: filter:blur() removed — blur on transitioning elements
  prevents the browser from using GPU-only compositing (transform/opacity)
  and causes a full repaint + compositor upload on every frame.
  Pure transform + opacity = smooth 60fps on compositor thread.
*/
.slide-left-enter-active,
.slide-left-leave-active {
  /* Perfectly synchronized — same duration & easing for both */
  transition:
    transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
    opacity   0.28s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
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
}
.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}
/* Old cards: blast out to the left */
.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0.4;
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
    opacity   0.28s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
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
}
.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}
/* Old cards: blast out to the right */
.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0.4;
}
</style>

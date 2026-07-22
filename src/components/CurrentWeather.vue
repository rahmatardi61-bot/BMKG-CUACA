<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { 
  Droplets, 
  Wind, 
  Sun, 
  SunDim,
  Cloudy,
  Eye,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Thermometer,
  Navigation,
  X,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  MapPin,
  Home,
  ThumbsUp,
  Sunrise,
  Sunset,
  Moon,
  ChevronDown
} from 'lucide-vue-next';
import type { WeatherData } from '../types/weather';
import { getCityTheme } from '../data/cityThemes';
import { 
  getAdditionalWeatherData, 
  getComfortIndex, 
  getNormalizedWeatherType, 
  getFormattedTimeAndZone 
} from '../data/weatherHelpers';

const props = defineProps<{
  weatherData: WeatherData;
  cities: string[];
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
  (e: 'delete-city', city: string): void;
}>();

// Real-time ticking clock state
const currentTime = ref(new Date());
let clockIntervalId: any = null;

onMounted(() => {
  clockIntervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (clockIntervalId) clearInterval(clockIntervalId);
  document.body.classList.remove('drawer-open');
});

// Computed time formatted with Indonesia timezones (WIB / WITA)
const formattedTimeAndZone = computed(() => {
  return getFormattedTimeAndZone(currentTime.value, props.selectedCity);
});

// Map weather status string to specific Lucide icons or gradients
const weatherStyling = computed(() => {
  const status = props.weatherData.status.toLowerCase();
  if (status.includes('cerah') && !status.includes('berawan')) {
    return {
      gradient: 'from-amber-400 via-orange-400 to-yellow-500 text-white',
      themeColor: 'text-amber-500',
      icon: Sun
    };
  } else if (status.includes('cerah berawan')) {
    return {
      gradient: 'from-sky-400 via-blue-400 to-amber-300 text-white',
      themeColor: 'text-sky-500',
      icon: SunDim
    };
  } else if (status.includes('sebagian berawan')) {
    return {
      gradient: 'from-sky-400 via-blue-400 to-amber-300 text-white',
      themeColor: 'text-sky-500',
      icon: CloudSun
    };
  } else if (status.includes('hujan')) {
    return {
      gradient: 'from-slate-700 via-blue-800 to-slate-800 text-white dark:from-slate-900 dark:via-blue-950 dark:to-slate-950',
      themeColor: 'text-blue-500',
      icon: CloudRain
    };
  } else if (status.includes('petir') || status.includes('badai')) {
    return {
      gradient: 'from-indigo-900 via-slate-900 to-purple-950 text-white',
      themeColor: 'text-indigo-500',
      icon: CloudLightning
    };
  } else if (status.includes('berawan tebal')) {
    return {
      gradient: 'from-blue-500 via-slate-400 to-indigo-600 text-white dark:from-brand-navy-900 dark:via-slate-800 dark:to-brand-navy-950',
      themeColor: 'text-slate-500',
      icon: Cloudy
    };
  } else {
    // Berawan / cloudy
    return {
      gradient: 'from-blue-500 via-slate-400 to-indigo-600 text-white dark:from-brand-navy-900 dark:via-slate-800 dark:to-brand-navy-950',
      themeColor: 'text-slate-500',
      icon: Cloud
    };
  }
});

// Playful, colorful landmarks and theme gradients for each city
const cityTheme = computed(() => {
  return getCityTheme(props.selectedCity);
});

// Additional weather details for full screen cards
const additionalWeatherData = computed(() => {
  return getAdditionalWeatherData(props.selectedCity);
});

// Dynamic comfort index data based on temperature
const comfortIndex = computed(() => {
  return getComfortIndex(props.weatherData.temp);
});

// Weather type normalization
const normalizedWeatherType = computed(() => {
  return getNormalizedWeatherType(props.weatherData.status);
});


const getRainStyle = (index: number, intensity: 'light' | 'heavy') => {
  const seed = (index * 17) % 100;
  const left = seed;
  const duration = intensity === 'light'
    ? 0.8 + ((index * 7) % 5) * 0.1
    : 0.4 + ((index * 7) % 5) * 0.08;
  const delay = -((index * 13) % 20) * 0.1;
  const height = intensity === 'light'
    ? 12 + ((index * 3) % 8)
    : 20 + ((index * 5) % 12);
  return {
    left: `${left}%`,
    top: `-32px`,
    height: `${height}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
};

const getSnowStyle = (index: number) => {
  const seed = (index * 23) % 100;
  const left = seed;
  const duration = 5 + ((index * 11) % 6) * 0.8; // 5s to 9s
  const delay = -((index * 19) % 10); // 0s to -10s
  const size = 3 + ((index * 3) % 5); // 3px to 8px
  const opacity = 0.5 + ((index * 7) % 6) * 0.08; // 0.5 to 0.9
  const swayDuration = 2 + ((index * 17) % 3) * 0.5; // 2s to 3s
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: opacity,
    animationDuration: `${duration}s, ${swayDuration}s`,
    animationDelay: `${delay}s`,
  };
};

import { toRef } from 'vue';
import { useWeatherReport } from '../composables/useWeatherReport';

const {
  isReportModalOpen,
  reportSubmitting,
  reportSuccess,
  reportActiveTab,
  overallConditions,
  tempFeelings,
  otherConditionsList,
  reportForm,
  reportHistory,
  getConditionIconBg,
  getConditionIconColor,
  toggleOtherCondition,
  openReportModal,
  closeReportModal,
  submitReport
} = useWeatherReport(toRef(props, 'selectedCity'));


const sunPosition = computed(() => {
  if (!additionalWeatherData.value) return { x: 50, y: 15, isDay: true };
  
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


const splitLocation = (fullName: string) => {
  if (!fullName) return { main: '', sub: '' };
  const parts = fullName.split(',');
  const main = parts[0].trim();
  const sub = parts.slice(1).map(p => p.trim()).join(', ');
  return { main, sub };
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
    <!-- City Navigation Tabs -->
    <div class="flex items-center gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      
      <!-- Fixed Location: Lokasi Saya -->
      <div 
        v-for="city in [cities[0]]" 
        v-if="cities.length > 0"
        :key="city"
        :id="'city-tab-' + city.split(',')[0].toLowerCase().replace(/ /g, '-')"
        @click="emit('select-city', city)"
        class="flex items-center gap-2 pl-3.5 pr-2 py-1.5 text-xs font-semibold rounded-full shrink-0 transition-all duration-300 border backdrop-blur-md cursor-pointer select-none active:scale-95 active:duration-75"
        :class="city === selectedCity 
          ? 'bg-blue-50/85 text-blue-600 border-blue-200/50 shadow-sm shadow-blue-500/5 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/30 dark:shadow-brand-cyan/5 font-bold' 
          : 'bg-white/45 text-slate-500 hover:bg-slate-50/70 hover:text-slate-700 border-slate-200/30 dark:bg-brand-navy-900/35 dark:text-slate-400 dark:hover:bg-brand-navy-850/60 dark:hover:text-slate-100 dark:border-brand-navy-800/20'"
      >
        <Home class="w-3.5 h-3.5 shrink-0" />
        <span>{{ city.split(',')[0] }}</span>
        
        <!-- Live GPS Signal Dot -->
        <div 
          class="w-[18px] h-[18px] rounded-full flex items-center justify-center border backdrop-blur-[2px]"
          :class="city === selectedCity 
            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/30' 
            : 'bg-slate-200/40 text-slate-500 border-slate-300/30 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'"
          title="Lokasi Saat Ini"
        >
          <span class="relative flex h-1.5 w-1.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              :class="city === selectedCity ? 'bg-blue-500 dark:bg-brand-cyan' : 'bg-slate-400 dark:bg-slate-500'"
            ></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5"
              :class="city === selectedCity ? 'bg-blue-500 dark:bg-brand-cyan' : 'bg-slate-400 dark:bg-slate-500'"
            ></span>
          </span>
        </div>
      </div>

      <!-- Elegant separator line -->
      <div class="w-px h-5 bg-slate-200/60 dark:bg-brand-navy-800/50 shrink-0 mx-1"></div>

      <!-- Dropdown Wrapper for Other Cities -->
      <div class="relative" ref="cityDropdownContainer">
        <button 
          id="city-dropdown-toggle"
          @click="showCityDropdown = !showCityDropdown"
          class="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border backdrop-blur-md cursor-pointer select-none active:scale-95 transition-all duration-300"
          :class="selectedCity !== cities[0]
            ? 'bg-blue-50/85 text-blue-600 border-blue-200/50 shadow-sm shadow-blue-500/5 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/30 dark:shadow-brand-cyan/5 font-bold' 
            : 'bg-white/45 text-slate-500 hover:bg-slate-50/70 hover:text-slate-700 border-slate-200/30 dark:bg-brand-navy-900/35 dark:text-slate-400 dark:hover:bg-brand-navy-850/60 dark:hover:text-slate-100 dark:border-brand-navy-800/20'"
        >
          <span>{{ selectedCity !== cities[0] ? selectedCity.split(',')[0] : 'Wilayah Lain' }}</span>
          <ChevronDown class="w-3.5 h-3.5 transition-transform duration-300" :class="{ 'rotate-180': showCityDropdown }" />
        </button>

        <!-- Dropdown Menu -->
        <div 
          v-if="showCityDropdown"
          class="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-xl border overflow-hidden py-2 z-50 animate-fade-in
            bg-white/95 border-slate-100/80 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
        >
          <button 
            v-for="city in cities.slice(1)"
            :key="city"
            :id="'city-dropdown-option-' + city.split(',')[0].toLowerCase().replace(/ /g, '-')"
            @click="emit('select-city', city); showCityDropdown = false"
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
              
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <span v-if="city === selectedCity" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
                
                <!-- Delete button inside dropdown -->
                <button 
                  :id="'city-dropdown-delete-' + city.split(',')[0].toLowerCase().replace(/ /g, '-')"
                  @click.stop="emit('delete-city', city)"
                  class="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-200
                    bg-slate-200/40 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20
                    dark:bg-white/5 dark:hover:bg-red-500/20 dark:hover:text-red-400 dark:hover:border-red-500/30
                    border border-slate-300/30 dark:border-white/10 backdrop-blur-[2px]
                    active:scale-90"
                  title="Hapus kota"
                >
                  <X class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
            
            <span class="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate w-full pr-4 text-left">
              {{ splitLocation(city).sub }}
            </span>
          </button>

          <!-- If no other cities are saved, show a helper text -->
          <div 
            v-if="cities.length <= 1"
            class="px-4 py-3 text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold uppercase tracking-wider"
          >
            Tidak ada wilayah lain
          </div>
        </div>
      </div>
    </div>


    <!-- Full Width: Large Hero Weather Card -->
    <div 
      class="w-full rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg flex flex-col transition-all duration-500 gap-8"
      :class="cityTheme.cardBg"
    >
      <!-- Decorative Glow Overlay -->
      <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
      <div class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-black/10 blur-2xl"></div>

      <!-- City Landmark Watermark SVG Overlay -->
      <div class="absolute bottom-0 right-0 w-64 h-64 pointer-events-none opacity-[0.35] dark:opacity-[0.20] transition-all duration-500 transform translate-y-4 translate-x-2">
        <svg viewBox="0 0 100 100" fill="none" class="w-full h-full" v-html="cityTheme.landmarkSvg"></svg>
      </div>

      <!-- Dynamic Weather Animations Background Overlays -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <!-- Sunny (Cerah) Animation -->
        <template v-if="normalizedWeatherType === 'sunny'">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-400/12 to-transparent dark:from-amber-500/12 dark:via-orange-500/8 dark:to-transparent transition-all duration-500"></div>
          <div class="sunny-aura absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-400/30 dark:bg-yellow-400/18 blur-3xl"></div>
          <div class="sun-rays absolute inset-0 overflow-hidden mix-blend-screen opacity-30">
            <div class="sun-ray-1"></div>
            <div class="sun-ray-2"></div>
          </div>
        </template>

        <!-- Partly Cloudy (Berawan) Animation -->
        <template v-if="normalizedWeatherType === 'partly-cloudy'">
          <div class="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-blue-400/12 to-amber-300/8 dark:from-sky-500/12 dark:via-blue-500/8 dark:to-amber-500/5 transition-all duration-500"></div>
          <div class="clouds-container absolute inset-0 opacity-35 dark:opacity-22">
            <div class="cloud-item cloud-1">
              <svg viewBox="0 0 100 60" fill="currentColor"><path d="M20 40 a15 15 0 0 1 22 -13 a20 20 0 0 1 37 5 a15 15 0 0 1 11 15 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" /></svg>
            </div>
            <div class="cloud-item cloud-2">
              <svg viewBox="0 0 100 60" fill="currentColor"><path d="M20 40 a15 15 0 0 1 22 -13 a20 20 0 0 1 37 5 a15 15 0 0 1 11 15 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" /></svg>
            </div>
          </div>
        </template>

        <!-- Cloudy (Mendung) Animation -->
        <template v-if="normalizedWeatherType === 'cloudy'">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-400/25 via-slate-500/12 to-indigo-500/8 dark:from-slate-800/18 dark:via-slate-900/12 dark:to-indigo-950/8 transition-all duration-500"></div>
          <div class="clouds-container cloudy-overcast absolute inset-0 opacity-55 dark:opacity-35">
            <div class="cloud-item cloud-1">
              <svg viewBox="0 0 100 60" fill="currentColor"><path d="M20 40 a15 15 0 0 1 22 -13 a20 20 0 0 1 37 5 a15 15 0 0 1 11 15 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" /></svg>
            </div>
            <div class="cloud-item cloud-2">
              <svg viewBox="0 0 100 60" fill="currentColor"><path d="M20 40 a15 15 0 0 1 22 -13 a20 20 0 0 1 37 5 a15 15 0 0 1 11 15 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" /></svg>
            </div>
            <div class="cloud-item cloud-3">
              <svg viewBox="0 0 100 60" fill="currentColor"><path d="M20 40 a15 15 0 0 1 22 -13 a20 20 0 0 1 37 5 a15 15 0 0 1 11 15 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" /></svg>
            </div>
          </div>
        </template>

        <!-- Hujan Ringan (Light Rain) Animation -->
        <template v-if="normalizedWeatherType === 'light-rain'">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-slate-500/12 to-blue-600/10 dark:from-blue-900/18 dark:via-slate-900/10 dark:to-blue-950/10 transition-all duration-500"></div>
          <div class="rain-container absolute inset-0 opacity-55">
            <div v-for="n in 15" :key="'lr-'+n" class="rain-drop" :style="getRainStyle(n, 'light')"></div>
          </div>
        </template>

        <!-- Hujan Lebat (Heavy Rain) Animation -->
        <template v-if="normalizedWeatherType === 'heavy-rain'">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-600/30 via-blue-600/18 to-slate-700/12 dark:from-slate-950/22 dark:via-blue-950/15 dark:to-slate-900/15 transition-all duration-500"></div>
          <div class="rain-container absolute inset-0 opacity-75">
            <div v-for="n in 35" :key="'hr-'+n" class="rain-drop" :style="getRainStyle(n, 'heavy')"></div>
          </div>
        </template>

        <!-- Badai Petir (Thunderstorm) Animation -->
        <template v-if="normalizedWeatherType === 'thunderstorm'">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-slate-600/18 to-purple-600/12 dark:from-indigo-950/25 dark:via-slate-950/15 dark:to-purple-950/18 transition-all duration-500"></div>
          <div class="lightning-overlay absolute inset-0 bg-white pointer-events-none mix-blend-overlay opacity-0 lightning-flash"></div>
          <div class="rain-container absolute inset-0 opacity-75">
            <div v-for="n in 40" :key="'ts-'+n" class="rain-drop" :style="getRainStyle(n, 'heavy')"></div>
          </div>
        </template>

        <!-- Salju (Snow) Animation -->
        <template v-if="normalizedWeatherType === 'snow'">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-100/25 via-white/10 to-blue-200/12 dark:from-blue-950/15 dark:via-slate-900/10 dark:to-blue-900/10 transition-all duration-500"></div>
          <div class="snow-container absolute inset-0 opacity-85">
            <div v-for="n in 20" :key="'sn-'+n" class="snow-flake" :style="getSnowStyle(n)"></div>
          </div>
        </template>
      </div>

      <!-- Top Row: Main Weather Stats & Summary -->
      <div class="flex flex-col md:flex-row justify-between items-stretch gap-6 w-full z-10">
        <!-- Card Left Portion -->
        <div class="flex flex-col justify-between flex-1">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black tracking-wider bg-current/10 px-2.5 py-1 rounded-full uppercase">
                Kondisi Saat Ini
              </span>
              <span class="text-[10px] font-black bg-current/10 px-2.5 py-1 rounded-full tracking-wider whitespace-nowrap">
                {{ formattedTimeAndZone }}
              </span>
            </div>
            <h2 class="text-3xl md:text-4xl font-black mt-3 tracking-tight">
              {{ weatherData.city.split(',')[0] }}
            </h2>
            <p class="text-[11px] font-bold opacity-80 mt-1.5 uppercase tracking-wider">
              {{ weatherData.city.split(',').slice(1).map(x => x.trim()).join(', ') }}
            </p>
          </div>
          
          <!-- Main Temp Info -->
          <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
            <div class="flex items-baseline gap-1">
              <span class="text-7xl md:text-8xl font-black tracking-tighter leading-none">{{ weatherData.temp }}</span>
              <span class="text-3xl md:text-4xl font-bold">°C</span>
            </div>

            <!-- Lapor Cuaca Button -->
            <button 
              @click="openReportModal"
              class="relative inline-flex items-center gap-2.5 px-3.5 py-2 text-xs tracking-wide rounded-[12px] border font-bold transition-all duration-300 hover:scale-105 active:scale-95 active:duration-75 select-none bg-current/10 hover:bg-current/15 border-current/15 text-current cursor-pointer sm:mb-2"
            >
              <!-- Glowing active dot indicating live reporting state -->
              <span class="w-1.5 h-1.5 rounded-full bg-current relative flex shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
              </span>
              
              <MessageSquare class="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              <span>Lapor Cuaca</span>
            </button>
          </div>
        </div>

        <!-- Card Right Portion -->
        <div class="flex flex-col justify-between items-end text-right gap-6">
          <!-- Animated Status Weather Icon Container -->
          <div class="p-3.5 bg-current/10 backdrop-blur-md rounded-2xl border border-current/15 self-end">
            <component :is="weatherStyling.icon" class="w-12 h-12 animate-bounce" style="animation-duration: 4s;" />
          </div>

          <!-- Temperature status summary -->
          <div class="border-t border-current/15 pt-4 w-full md:w-48">
            <p class="text-2xl font-black tracking-tight leading-tight">{{ weatherData.status }}</p>
            <p class="text-xs opacity-80 mt-0.5">Terasa seperti {{ weatherData.feelLike }}°C</p>
            <div class="mt-3 text-xs flex justify-between items-center">
              <span class="opacity-70 font-semibold">Min / Max</span>
              <span class="font-bold">{{ weatherData.tempMax }}° / {{ weatherData.tempMin }}°</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Full Width: Index Kenyamanan Card -->
    <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-6 shadow-sm backdrop-blur-md">
      <!-- Title Header Area -->
      <div class="mb-4">
        <div class="flex items-center gap-2">
          <!-- Custom thermal stress / comfort index icon -->
          <svg class="w-4 h-4 text-blue-500 dark:text-brand-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.15" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M17.66 6.34l-1.41 1.41M7.76 16.24l-1.41 1.41M6.34 6.34l1.41 1.41M16.24 16.24l1.41 1.41" />
          </svg>
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Indeks Kenyamanan
          </h3>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">
          {{ comfortIndex.desc }}
        </p>
      </div>

      <!-- Actionable Details Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-5">

        <!-- Good Heat Index Quality Indicator Box (span 2 of 4 cols) -->
        <div class="md:col-span-2 rounded-xl p-4 flex items-center gap-4 border border-transparent" :class="comfortIndex.colorClass">
          <div v-html="comfortIndex.smileySvg" class="w-9 h-9 shrink-0"></div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold leading-snug">{{ comfortIndex.quality }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <span class="inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold rounded-full tracking-wider whitespace-nowrap" :class="comfortIndex.pillClass">
                {{ comfortIndex.status }}
              </span>
              <span class="text-[9px] font-semibold opacity-60 whitespace-nowrap">{{ comfortIndex.tempText }}</span>
            </div>
          </div>
        </div>

        <!-- Recommendation 1 (Walking) -->
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-slate-100/50 dark:bg-brand-navy-950/60 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="4" r="1" />
              <path d="m9 20 2-4.5-1-2.5-1 3.5" />
              <path d="m15 20-2-6.5 2-2.5-1-2.5-2 1" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
            {{ comfortIndex.recommendation1 }}
          </span>
        </div>

        <!-- Recommendation 2 (Windows) -->
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-slate-100/50 dark:bg-brand-navy-950/60 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="1" stroke-width="1.5" />
              <path d="M4 3 L2 5 L2 19 L4 21 Z" opacity="0.15" fill="currentColor" />
              <path d="M4 3 L2 5 L2 19 L4 21" />
              <path d="M20 3 L22 5 L22 19 L20 21 Z" opacity="0.15" fill="currentColor" />
              <path d="M20 3 L22 5 L22 19 L20 21" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
            {{ comfortIndex.recommendation2 }}
          </span>
        </div>

      </div>
    </div>

    <!-- Responsive Weather Grid Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

      <!-- ── Shared mini illustration helper (rendered inside each card) ────── -->
      <!-- Slide transition wrapper: overflow-hidden clips the outgoing/incoming cards -->

      <!-- Card 1: Suhu -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- 🌡️ Temperature Illustration: Village + sun/clouds + thermometer -->
        <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Suhu</span>
          <div class="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400 shrink-0">
            <Thermometer class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.temp }}<span class="text-xs font-semibold">°C</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Suhu udara saat ini</p>
        </div>
      </div>

      <!-- Card 2: Angin -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- 💨 Wind Illustration: Turbines + hills + wind lines -->
        <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Angin</span>
          <div class="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 dark:bg-teal-500/15 dark:text-teal-400 shrink-0">
            <Wind class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.windSpeed }}<span class="text-xs font-semibold">km/jam</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Hembusan angin rata-rata</p>
        </div>
      </div>

      <!-- Card 3: Arah Angin -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- 🧭 Compass Illustration: Compass rose + countryside -->
        <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Arah Angin</span>
          <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-brand-cyan/15 dark:text-brand-cyan shrink-0">
            <Navigation class="w-4 h-4 transition-transform duration-700" :style="{ transform: `rotate(${additionalWeatherData.windAngle}deg)` }" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ additionalWeatherData.windDir }}
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Arah tiupan angin</p>
        </div>
      </div>

      <!-- Card 4: Kelembapan -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- 💧 Humidity Illustration: Rainforest + water drops -->
        <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Kelembapan</span>
          <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-brand-cyan/15 dark:text-brand-cyan shrink-0">
            <Droplets class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.humidity }}<span class="text-xs font-semibold">%</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Normal &amp; nyaman</p>
        </div>
      </div>

      <!-- Card 5: Indeks UV -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- ☀️ UV Illustration: Beach + palm + umbrella + intense sun -->
        <div class="absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Indeks UV</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 shrink-0">
            <Sun class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
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
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
        <!-- 👁️ Visibility Illustration: Mountain road -->
        <div class="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
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

        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Visibilitas</span>
          <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400 shrink-0">
            <Eye class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 relative z-10">
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {{ weatherData.visibility }}<span class="text-xs font-semibold">km</span>
          </p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-1">Udara cerah bersih</p>
        </div>
      </div>

      <!-- Card 7: Fase Bulan -->
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 col-span-2 md:col-span-3 lg:col-span-2 backdrop-blur-md relative overflow-hidden group">
        <!-- 🌙 Moon Illustration: Starry night + mountains + crescent moon -->
        <div class="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.06] dark:opacity-[0.08] group-hover:opacity-[0.45] dark:group-hover:opacity-[0.55] transition-opacity duration-700 ease-in-out z-0">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="moonBgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0" />
                <stop offset="40%" stop-color="#1e1b4b" stop-opacity="0.3" />
                <stop offset="70%" stop-color="#111033" stop-opacity="0.75" />
                <stop offset="100%" stop-color="#09081a" stop-opacity="1" />
              </linearGradient>
              <radialGradient id="moonHalo4" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fde68a" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="320" height="160" fill="url(#moonBgGrad)"/>
            <!-- Stars (Scattered in visible night sky) -->
            <circle cx="20"  cy="45" r="1.2" fill="#e0e7ff" opacity="0.90" class="animate-pulse"/>
            <circle cx="55"  cy="35" r="1.8" fill="#fff"    opacity="1.00" class="animate-pulse"/>
            <circle cx="95"  cy="50" r="1.0" fill="#c7d2fe" opacity="0.80"/>
            <circle cx="140" cy="40" r="2.0" fill="#fff"    opacity="1.00" class="animate-pulse"/>
            <circle cx="60"  cy="65" r="1.0" fill="#e0e7ff" opacity="0.75"/>
            <circle cx="100" cy="55" r="1.3" fill="#fff"    opacity="0.85" class="animate-pulse"/>
            <circle cx="185" cy="45" r="1.5" fill="#fff"    opacity="0.90"/>
            <circle cx="230" cy="60" r="1.0" fill="#c7d2fe" opacity="0.70"/>
            <circle cx="270" cy="40" r="1.8" fill="#fff"    opacity="0.95" class="animate-pulse"/>
            <circle cx="310" cy="55" r="1.0" fill="#e0e7ff" opacity="0.75"/>
            <!-- Moon halo glow -->
            <circle cx="272" cy="42" r="28" fill="url(#moonHalo4)"/>
            <!-- Crescent moon -->
            <circle cx="272" cy="42" r="16" fill="#fef3c7" opacity="0.92"/>
            <circle cx="281" cy="38" r="14" fill="#09081a" opacity="0.97"/>
            <!-- Shifted bottom vector elements -->
            <g transform="translate(0, 80)">
              <!-- Far mountain ridge -->
              <path d="M0 72 L22 48 L52 64 L85 38 L120 58 L158 32 L195 55 L230 40 L265 58 L295 45 L320 58 L320 80 L0 80Z" fill="#312e81" opacity="0.65"/>
              <!-- Near mountain ridge -->
              <path d="M0 80 L15 65 L45 76 L80 60 L115 72 L155 58 L190 70 L225 62 L260 74 L295 66 L320 74 L320 80Z" fill="#0f172a" opacity="0.85"/>
              <!-- Pine trees left -->
              <g fill="#0a0820" opacity="0.90">
                <polygon points="5,80 12,62 19,80"/>
                <polygon points="13,80 20,65 27,80"/>
                <polygon points="22,80 30,58 38,80"/>
              </g>
              <!-- Pine trees right -->
              <g fill="#0a0820" opacity="0.90">
                <polygon points="283,80 290,62 297,80"/>
                <polygon points="292,80 299,65 306,80"/>
                <polygon points="301,80 308,58 315,80"/>
              </g>
            </g>
          </svg>
        </div>

        <!-- Top Title Row -->
        <div class="flex items-start justify-between gap-3 relative z-10">
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

        <div class="mt-3 flex items-center justify-between w-full gap-2 sm:gap-4 relative z-10">
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
      <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 col-span-2 md:col-span-3 lg:col-span-2 backdrop-blur-md relative overflow-hidden group">
        <!-- Weather Illustration -->
        <div class="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-[0.08] dark:opacity-[0.12] group-hover:opacity-[0.40] dark:group-hover:opacity-[0.50] transition-opacity duration-500 ease-in-out">
          <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient :id="'sunSkyGrad-' + sunPosition.isDay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="sunPosition.isDay ? '#ffedd5' : '#020617'" />
                <stop offset="100%" :stop-color="sunPosition.isDay ? '#fdb981' : '#1e1b4b'" />
              </linearGradient>
            </defs>
            <rect width="240" height="120" :fill="`url(#sunSkyGrad-${sunPosition.isDay})`" :opacity="sunPosition.isDay ? 0.25 : 0.3" />
            
            <!-- Horizon Ocean/Bay -->
            <rect x="0" y="98" width="240" height="22" :fill="sunPosition.isDay ? '#c2410c' : '#0e7490'" opacity="0.3" />
            
            <!-- Horizon Landscape Hills -->
            <path d="M-20 98 Q50 90 110 98 T240 98" :stroke="sunPosition.isDay ? '#ea580c' : '#475569'" stroke-width="1.5" opacity="0.4" />
            
            <!-- Suspension Bridge Tower Silhouette -->
            <g transform="translate(160, 60)" :fill="sunPosition.isDay ? '#ea580c' : '#334155'" opacity="0.45">
              <!-- Main Towers -->
              <rect x="0" y="0" width="4" height="38" />
              <rect x="12" y="0" width="4" height="38" />
              <!-- Crossbeams -->
              <rect x="4" y="6" width="8" height="2" />
              <rect x="4" y="18" width="8" height="2" />
              <rect x="0" y="-3" width="16" height="3" rx="0.5" />
              <!-- Cable curves -->
              <path d="M-40 15 Q-12 35 8 10 T58 15" stroke="currentColor" stroke-width="1" fill="none" />
            </g>
            
            <!-- Small sailboat in the bay -->
            <g transform="translate(45, 90)" :fill="sunPosition.isDay ? '#c2410c' : '#64748b'" opacity="0.5">
              <path d="M0 8 L-3 12 L15 12 L12 8 Z" />
              <polygon points="3,8 11,8 3,0" />
            </g>
          </svg>
        </div>

        <!-- Top Title Row matching other cards -->
        <div class="flex items-start justify-between gap-3 relative z-10">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-0 break-words leading-tight">Matahari</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 shrink-0">
            <Sunrise class="w-4 h-4" />
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between w-full gap-2 sm:gap-4 relative z-10">
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
              <!-- Sun/Moon path arc -->
              <path 
                d="M 5 45 A 40 40 0 0 1 95 45" 
                :stroke="sunPosition.isDay ? '#fbbf24' : '#818cf8'" 
                :stroke-opacity="sunPosition.isDay ? '0.55' : '0.35'"
                stroke-width="1.5" 
                stroke-dasharray="3,3" 
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

    <!-- Futuristic Glassmorphic Lapor Cuaca Right-Side Panel -->
    <Teleport to="body">
      <div v-if="isReportModalOpen" class="fixed inset-0 z-[9999] overflow-hidden">
        <!-- Backdrop Overlay -->
        <Transition name="fade" appear>
          <div 
            v-if="isReportModalOpen"
            class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm cursor-default"
            @click="closeReportModal"
          ></div>
        </Transition>

        <!-- Slide-out Drawer Panel -->
        <Transition name="slide-right" appear>
          <div 
            v-if="isReportModalOpen"
            class="absolute top-0 right-0 bottom-0 w-full max-w-lg bg-white/95 dark:bg-brand-navy-950/95 border-l border-slate-200/30 dark:border-brand-navy-900/20 shadow-2xl text-slate-800 dark:text-slate-100 p-5 md:p-6 flex flex-col justify-between overflow-hidden"
          >
            <!-- Clean subtle top corner ambient glow -->
            <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-cyan/10 blur-3xl pointer-events-none"></div>
            
            <!-- Close button -->
            <button 
              @click="closeReportModal"
              class="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
            
            <!-- Header Section -->
            <div class="mb-4 pr-8 text-left">
              <h2 class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span class="w-1 h-5 bg-blue-600 dark:bg-brand-cyan rounded-full"></span>
                Laporkan Cuaca
              </h2>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                Pengamatan Anda membantu meningkatkan akurasi prakiraan.
              </p>
              
              <!-- Tab Navigation (Capsule Switcher) -->
              <div class="flex gap-3.5 mt-4 items-center justify-start">
                <button 
                  @click="reportActiveTab = 'feedback'"
                  class="py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
                  :class="reportActiveTab === 'feedback'
                    ? 'bg-slate-100 dark:bg-brand-navy-900/60 text-blue-650 dark:text-brand-cyan font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'"
                >
                  Lapor Masukan
                </button>
                <button 
                  @click="reportActiveTab = 'history'"
                  class="py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
                  :class="reportActiveTab === 'history'
                    ? 'bg-slate-100 dark:bg-brand-navy-900/60 text-blue-650 dark:text-brand-cyan font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'"
                >
                  Riwayat Laporan
                </button>
              </div>
            </div>

            <!-- Success Screen -->
            <div v-if="reportSuccess" class="flex-1 py-12 flex flex-col items-center justify-center text-center space-y-5 my-auto animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 dark:text-green-400 animate-bounce">
                <CheckCircle2 class="w-10 h-10 animate-pulse" />
              </div>
              <h3 class="text-xl font-bold text-slate-800 dark:text-white">Laporan Terkirim!</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Terima kasih atas kontribusi Anda. Laporan cuaca Anda di <strong class="text-blue-600 dark:text-brand-cyan">{{ selectedCity }}</strong> telah berhasil diverifikasi dan masuk ke sistem BMKG Crowd-Sourced Weather.
              </p>
            </div>

            <!-- Scrollable Content Area -->
            <div v-else class="flex-1 overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-2" style="will-change: scroll-position; -webkit-overflow-scrolling: touch;">
              <!-- FEEDBACK TAB -->
              <div v-if="reportActiveTab === 'feedback'" class="space-y-5">
                
                <!-- Location Section -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lokasi</label>
                    <button type="button" class="text-[10px] font-bold text-blue-600 dark:text-brand-cyan hover:text-blue-700 dark:hover:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200">
                      <Globe class="w-3.5 h-3.5" />
                      Temukan lokasi Anda di peta
                    </button>
                  </div>
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-brand-navy-900/20 border border-slate-200/15 dark:border-white/5 shadow-xs">
                    <div class="flex items-center gap-2.5 min-w-0 text-left">
                      <div class="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                        <MapPin class="w-4 h-4 text-rose-500" />
                      </div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {{ selectedCity }}, Indonesia
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 bg-white dark:bg-brand-navy-900/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-brand-navy-800/40 shadow-2xs">
                      <component :is="weatherStyling.icon" class="w-3.5 h-3.5 text-blue-600 dark:text-brand-cyan" />
                      <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {{ weatherData.temp }}°C
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Overall Condition Section -->
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-left">Kondisi umum</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button 
                      v-for="cond in overallConditions"
                      :key="cond.name"
                      type="button"
                      @click="reportForm.condition = cond.label"
                      class="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                      :class="reportForm.condition === cond.label
                        ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm shadow-blue-550/5 dark:shadow-brand-cyan/10'
                        : 'bg-slate-50/40 border-slate-200/15 hover:bg-slate-100/50 dark:bg-brand-navy-900/15 dark:border-white/5 dark:hover:border-brand-navy-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                    >
                      <div 
                        class="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors duration-200"
                        :class="[
                          reportForm.condition === cond.label
                            ? 'bg-blue-500/20 dark:bg-brand-cyan/25'
                            : getConditionIconBg(cond.label)
                        ]"
                      >
                        <component 
                          :is="cond.icon" 
                          class="w-4 h-4 transition-colors duration-200"
                          :class="[
                            reportForm.condition === cond.label
                              ? 'text-blue-600 dark:text-brand-cyan'
                              : getConditionIconColor(cond.label)
                          ]"
                        />
                      </div>
                      <span class="text-[10px] text-center leading-tight mt-0.5 font-bold">{{ cond.label }}</span>
                    </button>
                  </div>
                </div>

                <!-- Temperature Section -->
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-left">Suhu</label>
                  <div class="grid grid-cols-5 gap-1.5">
                    <button 
                      v-for="feel in tempFeelings"
                      :key="feel.name"
                      type="button"
                      @click="reportForm.tempFeeling = feel.label"
                      class="flex flex-col items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                      :class="reportForm.tempFeeling === feel.label
                        ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm shadow-blue-550/5 dark:shadow-brand-cyan/10'
                        : 'bg-slate-50/40 border-slate-200/15 hover:bg-slate-100/50 dark:bg-brand-navy-900/15 dark:border-white/5 dark:hover:border-brand-navy-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                    >
                      <div class="text-center space-y-0.5">
                        <span class="text-[8px] opacity-70 font-bold block leading-none">{{ feel.range }}</span>
                        <span class="text-[9px] font-extrabold block leading-tight mt-0.5">{{ feel.label }}</span>
                      </div>
                      <ThumbsUp class="w-3 h-3 mt-1" :class="reportForm.tempFeeling === feel.label ? 'fill-current text-blue-600 dark:text-brand-cyan opacity-100' : 'opacity-30'" />
                    </button>
                  </div>
                </div>

                <!-- Other Conditions Section -->
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-left">Kondisi lainnya</label>
                  <div class="grid grid-cols-5 gap-1.5">
                    <button 
                      v-for="oth in otherConditionsList"
                      :key="oth.name"
                      type="button"
                      @click="toggleOtherCondition(oth.label)"
                      class="flex flex-col items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                      :class="reportForm.otherConditions.includes(oth.label)
                        ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm shadow-blue-550/5 dark:shadow-brand-cyan/10'
                        : 'bg-slate-50/40 border-slate-200/15 hover:bg-slate-100/50 dark:bg-brand-navy-900/15 dark:border-white/5 dark:hover:border-brand-navy-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                    >
                      <component :is="oth.icon" class="w-4 h-4 text-slate-500 dark:text-slate-400 transition-colors" :class="reportForm.otherConditions.includes(oth.label) ? 'text-blue-600 dark:text-brand-cyan' : ''" />
                      <span class="text-[9px] text-center font-extrabold leading-tight mt-0.5">{{ oth.label }}</span>
                      <ThumbsUp class="w-3 h-3 mt-1" :class="reportForm.otherConditions.includes(oth.label) ? 'fill-current text-blue-600 dark:text-brand-cyan opacity-100' : 'opacity-30'" />
                    </button>
                  </div>
                </div>

                <!-- Comment Section -->
                <div class="space-y-2 text-left">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Apa lagi yang perlu kami ketahui?</label>
                  <textarea 
                    rows="3"
                    v-model="reportForm.comment"
                    placeholder="Tambahkan komentar, detail, atau hal lainnya..."
                    class="w-full bg-slate-50/30 border border-slate-200/80 dark:bg-brand-navy-900/20 dark:border-brand-navy-850/40 rounded-xl p-3 text-base md:text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-brand-cyan focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-brand-cyan/20 transition-all shadow-sm"
                  ></textarea>
                </div>

                <!-- Warning Info Box -->
                <div class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/15 text-xs text-amber-700 dark:text-amber-300 leading-normal">
                  <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span class="text-[10.5px] text-left font-semibold leading-relaxed">Pastikan laporan Anda sesuai dengan kondisi cuaca sebenarnya di lokasi Anda saat ini. Laporan palsu dapat ditindaklanjuti.</span>
                </div>

                <!-- Actions Area (Relocated inside scrollable area) -->
                <div v-if="!reportSuccess" class="pt-4 mt-6 border-t border-slate-150 dark:border-brand-navy-900/20 flex gap-3 bg-transparent">
                  <button 
                    type="button" 
                    @click="closeReportModal"
                    class="flex-1 py-2.5 rounded-xl border border-slate-200/80 dark:border-brand-navy-800 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/5 text-slate-655 dark:text-slate-300 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    @click="submitReport"
                    :disabled="reportSubmitting || !reportForm.condition"
                    class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-brand-cyan dark:to-cyan-400 dark:hover:from-brand-cyan/90 dark:hover:to-cyan-400/90 text-white dark:text-brand-navy-950 text-xs font-bold transition-all duration-300 active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:dark:from-brand-navy-800/80 disabled:dark:to-brand-navy-800/80 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/10 dark:shadow-brand-cyan/15 flex items-center justify-center gap-1.5"
                  >
                    <Loader2 v-if="reportSubmitting" class="w-3.5 h-3.5 animate-spin" />
                    <span>{{ reportSubmitting ? 'Mengirimkan...' : 'Kirim Laporan' }}</span>
                  </button>
                </div>
              </div>

              <!-- HISTORY TAB -->
              <div v-else class="space-y-4">
                <div 
                  v-for="hist in reportHistory" 
                  :key="hist.id" 
                  class="p-4 rounded-xl border border-slate-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900/20 shadow-sm flex flex-col gap-2.5 text-left"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ hist.city.split(',')[0] }}</span>
                      <span class="text-[9px] text-slate-400 dark:text-slate-500 font-medium block">{{ hist.city.split(',').slice(1).map(x => x.trim()).join(', ') }}</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{{ hist.time }}</span>
                    </div>
                    <span class="text-[10px] font-bold text-blue-600 dark:text-brand-cyan bg-blue-500/10 dark:bg-brand-cyan/10 px-2.5 py-0.5 rounded-full border border-blue-500/10 dark:border-brand-cyan/20">
                      {{ hist.condition }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5">
                    <p><strong class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Sensasi suhu:</strong> {{ hist.tempFeeling }}</p>
                    <p v-if="hist.otherConditions.length > 0"><strong class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Kondisi lainnya:</strong> {{ hist.otherConditions.join(', ') }}</p>
                    <p v-if="hist.comment" class="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-brand-navy-900/40 italic text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-brand-navy-800">
                      "{{ hist.comment }}"
                    </p>
                  </div>
                </div>

                <!-- History close actions (Relocated inside scrollable area) -->
                <div class="pt-4 mt-6 border-t border-slate-150 dark:border-brand-navy-900/20">
                  <button 
                    type="button" 
                    @click="closeReportModal"
                    class="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-brand-navy-800 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/5 text-slate-650 dark:text-slate-300 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Tutup Riwayat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>
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
</style>

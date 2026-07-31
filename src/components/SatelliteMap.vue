<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Radar, 
  Activity,
  Play,
  Pause,
  ChevronDown,
  Thermometer,
  Cloud,
  Droplet,
  Wind
} from 'lucide-vue-next';

const props = defineProps<{
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
}>();

const activeTab = ref('suhu');

const tabs = [
  { id: 'suhu', label: 'Suhu Permukaan', icon: Thermometer },
  { id: 'awan', label: 'Citra Awan', icon: Cloud },
  { id: 'hujan', label: 'Curah Hujan', icon: Droplet },
  { id: 'angin', label: 'Kec. Angin', icon: Wind }
];

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const activeTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.label : '';
});

const activeTabIcon = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.icon : Thermometer;
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectTab = (id: string) => {
  activeTab.value = id;
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

const cities = [
  { name: 'Sumatera Utara', x: '12%', y: '28%', temp: '30°C', weather: 'Berawan', wind: '10 km/h' },
  { name: 'DKI Jakarta', x: '22%', y: '62%', temp: '34°C', weather: 'Cerah', wind: '12 km/h' },
  { name: 'Jawa Barat', x: '25%', y: '65%', temp: '26°C', weather: 'Hujan Ringan', wind: '8 km/h' },
  { name: 'DI Yogyakarta', x: '33%', y: '68%', temp: '31°C', weather: 'Cerah Berawan', wind: '10 km/h' },
  { name: 'Jawa Timur', x: '41%', y: '67%', temp: '35°C', weather: 'Cerah Berawan', wind: '15 km/h' },
  { name: 'Bali', x: '47%', y: '68%', temp: '31°C', weather: 'Cerah Berawan', wind: '14 km/h' },
  { name: 'Sulawesi Selatan', x: '54%', y: '50%', temp: '32°C', weather: 'Hujan Sedang', wind: '18 km/h' }
];

// Real-time ticking clock state & playback timeline states
const currentTime = ref(new Date());
const selectedTimeIndex = ref(5); // 0 to 5, where 5 is 'Sekarang'
const isPlaying = ref(false);
const cacheBuster = ref(Date.now());

let clockIntervalId: any = null;
let playIntervalId: any = null;
let cacheIntervalId: any = null;

// Timezone computation based on active city selection
const cityTimezone = computed(() => {
  const city = props.selectedCity.toLowerCase();
  if (city.includes('makassar') || city.includes('denpasar')) {
    return { offset: 8, label: 'WITA' };
  }
  return { offset: 7, label: 'WIB' };
});

// Calculate current local date/time of the selected city
const localTime = computed(() => {
  const utc = currentTime.value.getTime() + (currentTime.value.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * cityTimezone.value.offset));
});

// Generate 6 hourly steps where the last index is 'Sekarang'
const timelineSteps = computed(() => {
  const steps = [];
  const baseTime = localTime.value;
  
  for (let i = 5; i >= 0; i--) {
    if (i === 0) {
      steps.push({
        label: 'Sekarang',
        subLabel: 'Live Feed',
        timeStr: 'Sekarang'
      });
    } else {
      const pastTime = new Date(baseTime.getTime() - (i * 3600000));
      const hour = String(pastTime.getHours()).padStart(2, '0');
      const timeStr = `${hour}:00`;
      steps.push({
        label: timeStr,
        subLabel: `${i} jam lalu`,
        timeStr: timeStr
      });
    }
  }
  return steps;
});

// Dynamic weather value variance based on the timeline steps
const dynamicCities = computed(() => {
  const hourOffset = 5 - selectedTimeIndex.value; // 0 for Sekarang, up to 5 for 5 hours ago
  return cities.map(city => {
    const baseTemp = parseInt(city.temp);
    const nameHash = city.name.charCodeAt(0) + city.name.charCodeAt(city.name.length - 1);
    
    // Vary temperature slightly
    const tempDiff = Math.round(Math.sin((hourOffset + nameHash) * 0.85) * 2) - Math.floor(hourOffset / 2);
    const newTemp = baseTemp + tempDiff;
    
    // Vary wind speed slightly
    const baseWind = parseInt(city.wind);
    const windDiff = Math.round(Math.cos((hourOffset + nameHash) * 0.7) * 3);
    const newWind = Math.max(4, baseWind + windDiff);

    // Vary weather condition slightly
    let weather = city.weather;
    if (hourOffset > 0) {
      const states = ['Cerah', 'Cerah Berawan', 'Berawan', 'Hujan Ringan', 'Hujan Sedang'];
      const index = Math.abs(nameHash + hourOffset) % states.length;
      weather = states[index];
    }

    return {
      ...city,
      temp: `${newTemp}°C`,
      wind: `${newWind} km/h`,
      weather
    };
  });
});

const imageUrls: Record<string, string> = {
  suhu: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
  awan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png',
  hujan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
  angin: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_WV_Indonesia.png'
};

const activeImageUrl = computed(() => imageUrls[activeTab.value]);

// Dynamic map style with horizontal drift based on time offset to simulate animation
const mapBgStyle = computed(() => {
  const offset = (selectedTimeIndex.value - 5) * 10; // offset between -50px and 0px
  return {
    backgroundImage: `url(${activeImageUrl.value}?t=${cacheBuster.value})`,
    backgroundSize: 'cover',
    backgroundPosition: `calc(50% + ${offset}px) 60%`
  };
});

const hoveredCity = ref<string | null>(null);

const selectedCityInfo = computed(() => {
  return dynamicCities.value.find(c => props.selectedCity.toLowerCase().includes(c.name.toLowerCase())) || dynamicCities.value[1];
});

const isSelectedCity = (cityName: string) => {
  return selectedCityInfo.value.name === cityName;
};

const activeTooltipCity = computed(() => {
  return hoveredCity.value ?? selectedCityInfo.value.name;
});

const selectedCitySpotlightStyle = computed(() => {
  const city = selectedCityInfo.value;
  let color = '239, 68, 68'; // Suhu: Red
  if (activeTab.value === 'awan') {
    color = '241, 245, 249'; // Awan: Light blue/white
  } else if (activeTab.value === 'hujan') {
    color = '6, 182, 212'; // Hujan: Cyan
  } else if (activeTab.value === 'angin') {
    color = '132, 204, 22'; // Angin: Lime
  }
  
  return {
    background: `radial-gradient(circle at ${city.x} ${city.y}, rgba(${color}, 0.55) 0%, rgba(${color}, 0.2) 28%, transparent 62%)`
  };
});

const detectionText = computed(() => {
  const step = timelineSteps.value[selectedTimeIndex.value];
  if (step.timeStr === 'Sekarang') {
    return `Deteksi: Sekarang (${cityTimezone.value.label})`;
  }
  return `Deteksi: ${step.timeStr} ${cityTimezone.value.label}`;
});

// Playback slider controls
const startPlayback = () => {
  stopPlayback();
  playIntervalId = setInterval(() => {
    selectedTimeIndex.value = (selectedTimeIndex.value + 1) % 6;
  }, 1500);
};

const stopPlayback = () => {
  if (playIntervalId) {
    clearInterval(playIntervalId);
    playIntervalId = null;
  }
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startPlayback();
  } else {
    stopPlayback();
  }
};

const selectTime = (index: number) => {
  selectedTimeIndex.value = index;
  isPlaying.value = false;
  stopPlayback();
};

onMounted(() => {
  // Real-time ticking clock
  clockIntervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  // Cache buster updates every 5 minutes
  cacheIntervalId = setInterval(() => {
    cacheBuster.value = Date.now();
  }, 300000);

  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (clockIntervalId) clearInterval(clockIntervalId);
  if (cacheIntervalId) clearInterval(cacheIntervalId);
  window.removeEventListener('click', handleClickOutside);
  stopPlayback();
});
</script>

<template>
  <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-6 shadow-sm backdrop-blur-md">
    <!-- Header Area -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Radar class="w-4 h-4 text-blue-500 dark:text-brand-cyan animate-spin" style="animation-duration: 6s;" />
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Citra Satelit Himawari-9</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time Advanced Imager Overlay</p>
      </div>

      <!-- Map Subtabs Dropdown -->
      <div ref="dropdownRef" class="relative z-50 shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer select-none
            bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700
            dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component 
            :is="activeTabIcon" 
            class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan"
          />
          <span class="text-xs tracking-wide">{{ activeTabLabel }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
        </button>

        <!-- Dropdown Menu -->
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
            class="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden py-1.5 z-50
              bg-white/95 border-slate-100 backdrop-blur-md
              dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="selectTab(tab.id)"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activeTab === tab.id ? 'font-bold text-blue-600 dark:text-brand-cyan' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                {{ tab.label }}
              </span>
              <span v-if="activeTab === tab.id" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Map container -->
    <div class="relative w-full h-[280px] rounded-2xl overflow-hidden bg-slate-900 select-none shadow-inner border border-transparent">
      <!-- Radar grid mesh overlay -->
      <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
      
      <!-- Coordinate lines -->
      <div class="absolute inset-x-0 top-1/2 h-[1px] bg-slate-700/30 border-dashed pointer-events-none"></div>
      <div class="absolute inset-y-0 left-1/2 w-[1px] bg-slate-700/30 border-dashed pointer-events-none"></div>
      
      <!-- Dynamic heatmap background -->
      <div 
        class="absolute inset-0 transition-all duration-700 ease-in-out bg-slate-950"
        :style="mapBgStyle"
      >
        <div class="absolute inset-0 bg-brand-navy-950/15 dark:bg-brand-navy-950/40 mix-blend-multiply"></div>
      </div>

      <!-- Spotlight overlay -->
      <div class="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out" :style="selectedCitySpotlightStyle"></div>

      <!-- Map Radar Pins -->
      <div 
        v-for="city in dynamicCities" 
        :key="city.name" 
        class="absolute" 
        :style="{ left: city.x, top: city.y }"
        @mouseenter="hoveredCity = city.name"
        @mouseleave="hoveredCity = null"
        @click="emit('select-city', city.name)"
      >
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span 
            class="absolute rounded-full animate-ping"
            :class="isSelectedCity(city.name) ? 'w-8 h-8 bg-yellow-400/50' : 'w-6 h-6 bg-brand-cyan/40'"
            style="animation-duration: 2s;"
          ></span>
          <span 
            class="absolute w-3 h-3 rounded-full border-2 transition-all duration-300"
            :class="isSelectedCity(city.name) ? 'bg-yellow-300 border-yellow-100 shadow-[0_0_8px_2px_rgba(250,204,21,0.7)]' : 'bg-blue-500 dark:bg-brand-cyan border-white/30'"
          ></span>
          
          <span 
            class="absolute top-4.5 px-2.5 py-0.5 backdrop-blur-sm rounded-full text-[10px] font-semibold whitespace-nowrap shadow-md"
            :class="isSelectedCity(city.name) ? 'bg-yellow-400 text-slate-900 border border-yellow-200' : 'bg-slate-900/90 border border-slate-700/40 text-white'"
          >
            {{ city.name }}
          </span>

          <div 
            v-if="activeTooltipCity === city.name" 
            class="absolute bottom-9 left-1/2 -translate-x-1/2 w-36 rounded-xl p-3.5 z-30 shadow-2xl border text-white backdrop-blur-md animate-fade-in pointer-events-none"
            :class="isSelectedCity(city.name) ? 'bg-yellow-950/90 border-yellow-600/40' : 'bg-slate-950/90 border-slate-800/40'"
          >
            <h5 class="text-xs font-bold tracking-wider border-b pb-1.5 mb-2 flex items-center justify-between"
              :class="isSelectedCity(city.name) ? 'border-yellow-700/50' : 'border-slate-800/50'"
            >
              <span>{{ city.name }}</span>
            </h5>
            <div class="space-y-1 text-[10px] text-slate-300 font-medium">
              <p class="flex justify-between">
                <span>Suhu:</span>
                <span class="font-bold" :class="isSelectedCity(city.name) ? 'text-yellow-300' : 'text-brand-cyan'">{{ city.temp }}</span>
              </p>
              <p class="flex justify-between">
                <span>Cuaca:</span>
                <span class="font-semibold text-slate-100">{{ city.weather }}</span>
              </p>
              <p class="flex justify-between">
                <span>Angin:</span>
                <span class="font-semibold text-slate-100">{{ city.wind }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Metadata Corner Badge (bottom-left) -->
      <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/30 rounded-xl p-2.5 text-white font-medium flex items-center gap-2 max-w-[170px] pointer-events-none z-20">
        <Activity class="w-3.5 h-3.5 text-brand-cyan animate-pulse shrink-0" />
        <div class="min-w-0">
          <p class="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none">Satelit Aktif</p>
          <p class="text-[9px] font-black text-slate-100 mt-1 truncate">HIMAWARI-9 (AHI)</p>
          <p class="text-[7px] text-slate-400 leading-none mt-0.5">{{ detectionText }}</p>
        </div>
      </div>

      <!-- Live / Playback badge (top-right) -->
      <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/30 rounded-full px-2.5 py-1 text-white font-medium flex items-center gap-1.5 pointer-events-none text-[8px] z-20">
        <span 
          class="w-1.5 h-1.5 rounded-full"
          :class="selectedTimeIndex === 5 ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'"
        ></span>
        <span class="font-bold tracking-widest text-slate-300">
          {{ selectedTimeIndex === 5 ? 'LIVE FEED' : 'PLAYBACK' }}
        </span>
      </div>

      <!-- Floating Timeline Controller (bottom-right) -->
      <div class="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/40 rounded-xl p-1.5 text-white flex items-center gap-2 z-20 shadow-lg">
        <div class="relative group flex-shrink-0">
          <button 
            @click="togglePlay"
            class="w-6 h-6 flex items-center justify-center bg-blue-600 dark:bg-brand-cyan hover:bg-blue-500 dark:hover:bg-brand-cyan/80 active:scale-95 text-white dark:text-brand-navy-950 rounded-lg transition-all cursor-pointer"
          >
            <Play v-if="!isPlaying" class="w-3 h-3 fill-current" />
            <Pause v-else class="w-3 h-3 fill-current" />
          </button>

          <!-- Premium Tooltip -->
          <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
            <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-r border-slate-800 dark:border-slate-800/60 rotate-45"></div>
              <span>Play/Pause Satelit</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-0.5">
          <button 
            v-for="(step, idx) in timelineSteps" 
            :key="idx"
            @click="selectTime(idx)"
            class="px-1.5 py-1 rounded text-[7.5px] font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap"
            :class="selectedTimeIndex === idx
              ? 'bg-blue-600 text-white dark:bg-brand-cyan dark:text-brand-navy-950 shadow-sm'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'"
          >
            {{ step.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

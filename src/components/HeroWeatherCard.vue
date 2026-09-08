<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { 
  Droplets, 
  Wind,
  Sun, 
  SunDim,
  Cloudy,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  MessageSquare,
  Calendar,
  X
} from 'lucide-vue-next';
import type { WeatherData } from '../types/weather';
import { getCityTheme } from '../data/cityThemes';
import type { AdditionalWeatherInfo } from '../data/weatherHelpers';
import { 
  getNormalizedWeatherType, 
  getFormattedTimeAndZone
} from '../data/weatherHelpers';
import { hourlyForecastsMap } from '../data/mockData';
import WeatherReportDrawer from './WeatherReportDrawer.vue';

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
const currentTime = ref(new Date());
let clockIntervalId: ReturnType<typeof setInterval> | null = null;

// Interactive Day Forecast Tooltip State
const activeTooltipDate = ref<string | null>(null);

const toggleDayTooltip = (dateStr: string, event?: Event) => {
  if (event) event.stopPropagation();
  activeTooltipDate.value = activeTooltipDate.value === dateStr ? null : dateStr;
};

const handleGlobalClick = () => {
  if (activeTooltipDate.value) {
    activeTooltipDate.value = null;
  }
};

const getWeatherDescription = (status: string, precipitation: number, tempMax: number): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('petir') || s.includes('badai') || s.includes('thunder')) {
    return 'Potensi hujan lebat disertai kilat/petir dan angin kencang sesaat. Hindari tempat terbuka dan pohon rindang.';
  }
  if (s.includes('hujan lebat') || precipitation >= 70) {
    return 'Peluang hujan berintensitas lebat cukup tinggi. Siapkan payung atau jas hujan serta waspadai genangan jalan.';
  }
  if (s.includes('hujan') || s.includes('gerimis') || precipitation >= 40) {
    return 'Prakiraan hujan intensitas ringan hingga sedang turun berkala. Sangat dianjurkan membawa perlengkapan hujan.';
  }
  if (s.includes('cerah berawan') || s.includes('sebagian berawan')) {
    return 'Kondisi cuaca didominasi cerah berawan dengan angin sejuk. Sangat ideal dan nyaman untuk aktivitas luar ruangan.';
  }
  if (s.includes('cerah')) {
    return `Cuaca cerah terik dengan suhu puncak ${tempMax}°C. Disarankan menggunakan tabir surya dan menjaga hidrasi.`;
  }
  if (s.includes('berawan tebal') || s.includes('mendung')) {
    return 'Langit cenderung tertutup awan tebal dengan udara sejuk. Peluang gerimis lokal di beberapa titik.';
  }
  return 'Kondisi cuaca diprakirakan cukup stabil dan kondusif untuk mendukung kegiatan harian Anda.';
};

onMounted(() => {
  const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
  const alignTimer = setTimeout(() => {
    currentTime.value = new Date();
    clockIntervalId = setInterval(() => {
      currentTime.value = new Date();
    }, 60000);
  }, msUntilNextMinute);
  (clockIntervalId as any) = alignTimer;
  window.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  if (clockIntervalId) clearInterval(clockIntervalId);
  window.removeEventListener('click', handleGlobalClick);
  document.body.classList.remove('drawer-open');
});

// Computed time formatted with Indonesia timezones (WIB / WITA / WIT)
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
    return {
      gradient: 'from-blue-500 via-slate-400 to-indigo-600 text-white dark:from-brand-navy-900 dark:via-slate-800 dark:to-brand-navy-950',
      themeColor: 'text-slate-500',
      icon: Cloud
    };
  }
});

// Landmarks and theme gradients for selected city
const cityTheme = computed(() => {
  return getCityTheme(props.selectedCity);
});

// Weather type normalization
const normalizedWeatherType = computed(() => {
  return getNormalizedWeatherType(props.weatherData.status);
});

interface DailyForecastItem {
  date: string;
  dayName: string;
  dayTitle: string;
  dateShort: string;
  dateFull: string;
  isToday: boolean;
  tempMin: number;
  tempMax: number;
  status: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  mobileIconColor: string;
  mobileIconBg: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

// Helper to resolve Lucide weather icons & colors for daily forecast cards
const getForecastWeatherStyle = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('petir') || s.includes('badai') || s.includes('lightning') || s.includes('thunderstorm')) {
    return {
      icon: CloudLightning,
      colorClass: 'text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]',
      bgClass: 'bg-indigo-500/20 border-indigo-400/30',
      mobileColorClass: 'text-purple-600 dark:text-purple-400',
      mobileBgClass: 'bg-purple-50/90 border-purple-200/90 shadow-sm dark:bg-purple-950/30 dark:border-purple-800/40'
    };
  }
  if (s.includes('hujan lebat') || s.includes('heavy-rain')) {
    return {
      icon: CloudRain,
      colorClass: 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.7)]',
      bgClass: 'bg-blue-600/20 border-blue-400/30',
      mobileColorClass: 'text-sky-500 dark:text-sky-400',
      mobileBgClass: 'bg-sky-50/90 border-sky-300/80 shadow-sm dark:bg-sky-950/30 dark:border-sky-800/40'
    };
  }
  if (s.includes('hujan') || s.includes('rain') || s.includes('gerimis') || s.includes('drizzle')) {
    return {
      icon: CloudRain,
      colorClass: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.7)]',
      bgClass: 'bg-cyan-500/20 border-cyan-400/30',
      mobileColorClass: 'text-sky-500 dark:text-sky-400',
      mobileBgClass: 'bg-sky-50/90 border-sky-300/80 shadow-sm dark:bg-sky-950/30 dark:border-sky-800/40'
    };
  }
  if (s.includes('cerah berawan') || s.includes('sebagian berawan') || s.includes('partly-cloudy')) {
    return {
      icon: CloudSun,
      colorClass: 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]',
      bgClass: 'bg-amber-500/15 border-amber-400/25',
      mobileColorClass: 'text-amber-500 dark:text-amber-400',
      mobileBgClass: 'bg-amber-50/90 border-amber-300/80 shadow-sm dark:bg-amber-950/30 dark:border-amber-800/40'
    };
  }
  if (s.includes('cerah') || s.includes('sunny')) {
    return {
      icon: Sun,
      colorClass: 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]',
      bgClass: 'bg-amber-500/20 border-amber-400/30',
      mobileColorClass: 'text-amber-500 dark:text-amber-400',
      mobileBgClass: 'bg-amber-50/90 border-amber-300/80 shadow-sm dark:bg-amber-950/30 dark:border-amber-800/40'
    };
  }
  if (s.includes('berawan tebal') || s.includes('mendung') || s.includes('overcast')) {
    return {
      icon: Cloudy,
      colorClass: 'text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]',
      bgClass: 'bg-slate-500/20 border-slate-400/25',
      mobileColorClass: 'text-slate-500 dark:text-slate-300',
      mobileBgClass: 'bg-slate-50/90 border-slate-300/80 shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50'
    };
  }
  return {
    icon: Cloud,
    colorClass: 'text-sky-100 drop-shadow-[0_0_8px_rgba(224,242,254,0.5)]',
    bgClass: 'bg-sky-500/15 border-sky-400/20',
    mobileColorClass: 'text-slate-500 dark:text-slate-300',
    mobileBgClass: 'bg-slate-50/90 border-slate-300/80 shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50'
  };
};

// 7-day weather forecast (Sekarang / Hari ini + 7 hari ke depan)
const sevenDaysForecast = computed<DailyForecastItem[]>(() => {
  const city = props.selectedCity;
  const forecasts = hourlyForecastsMap[city] || hourlyForecastsMap['DKI Jakarta'] || [];
  if (!forecasts.length) return [];

  const groups: Record<string, typeof forecasts> = {};
  for (const f of forecasts) {
    if (!groups[f.date]) {
      groups[f.date] = [];
    }
    groups[f.date].push(f);
  }

  const dateKeys = Object.keys(groups).slice(0, 8);
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indonesianMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return dateKeys.map((dateStr, idx) => {
    const slots = groups[dateStr];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = indonesianDays[dateObj.getDay()];
    const dateShort = `${String(d).padStart(2, '0')} ${indonesianMonths[m - 1]}`;

    const temps = slots.map(s => s.temp);
    const minTemp = idx === 0 ? props.weatherData.tempMin : Math.min(...temps);
    const maxTemp = idx === 0 ? props.weatherData.tempMax : Math.max(...temps);

    const middaySlot = slots.find(s => s.time === '12:00' || s.time === '13:00') || slots[Math.floor(slots.length / 2)];
    const status = idx === 0 ? props.weatherData.status : (middaySlot?.status || 'Cerah');
    const precip = Math.max(...slots.map(s => s.precipitation ?? 0));
    const hum = idx === 0 ? props.weatherData.humidity : (middaySlot?.humidity ?? 70);
    const wind = idx === 0 ? props.weatherData.windSpeed : (middaySlot?.windSpeed ?? 12);

    const style = getForecastWeatherStyle(status);

    return {
      date: dateStr,
      dayName: idx === 0 ? 'HARI INI' : idx === 1 ? 'BESOK' : dayOfWeek.toUpperCase(),
      dayTitle: idx === 0 ? 'Hari ini' : dayOfWeek,
      dateShort,
      dateFull: `${d} ${indonesianMonths[m - 1]} ${y}`,
      isToday: idx === 0,
      tempMin: minTemp,
      tempMax: maxTemp,
      status,
      icon: style.icon,
      iconColor: style.colorClass,
      iconBg: style.bgClass,
      mobileIconColor: style.mobileColorClass,
      mobileIconBg: style.mobileBgClass,
      precipitation: precip,
      humidity: hum,
      windSpeed: wind,
    };
  });
});

const getRainStyle = (n: number, intensity: 'light' | 'heavy') => {
  const left = ((n * 17) % 100);
  const delay = ((n * 0.3) % 2.5);
  const duration = intensity === 'heavy' ? (0.6 + (n % 4) * 0.15) : (1.0 + (n % 5) * 0.2);
  const height = intensity === 'heavy' ? (20 + (n % 15)) : (12 + (n % 10));
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    height: `${height}px`,
  };
};

const getSnowStyle = (n: number) => {
  const left = ((n * 19) % 100);
  const delay = ((n * 0.4) % 4);
  const duration = 3 + (n % 4);
  const size = 3 + (n % 4);
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`,
  };
};

// ── Lapor Cuaca Modal Drawer State & Logic ────────────────────────────────────
const isReportModalOpen = ref(false);
const reportSubmitting = ref(false);
const reportSuccess = ref(false);
const reportActiveTab = ref<'feedback' | 'history'>('feedback');

const reportForm = ref({
  condition: 'Cerah Berawan',
  tempFeeling: 'Nyaman / Pas',
  otherConditions: [] as string[],
  comment: ''
});

interface WeatherReportEntry {
  id: string;
  city: string;
  time: string;
  condition: string;
  tempFeeling: string;
  otherConditions: string[];
  comment: string;
}

const reportHistory = ref<WeatherReportEntry[]>([
  {
    id: 'rep-1',
    city: 'DKI Jakarta',
    time: '14:20 WIB',
    condition: 'Hujan Deras',
    tempFeeling: 'Dingin',
    otherConditions: ['Angin Kencang', 'Jalan Tergenang / Banjir'],
    comment: 'Wilayah Kemang hujan sangat deras disertai angin kencang. Hati-hati berkendara.'
  },
  {
    id: 'rep-2',
    city: 'DKI Jakarta',
    time: '13:45 WIB',
    condition: 'Berawan Tebal',
    tempFeeling: 'Lembap / Gerah',
    otherConditions: ['Langit Gelap', 'Mendung'],
    comment: 'Awan hitam tebal sudah menutupi area Jakarta Selatan.'
  }
]);

const overallConditions = [
  { name: 'sunny', label: 'Cerah', icon: Sun },
  { name: 'partly-cloudy', label: 'Cerah Berawan', icon: SunDim },
  { name: 'cloudy', label: 'Berawan Tebal', icon: Cloudy },
  { name: 'light-rain', label: 'Hujan Gerimis', icon: CloudRain },
  { name: 'heavy-rain', label: 'Hujan Deras', icon: CloudRain },
  { name: 'thunderstorm', label: 'Badai Petir', icon: CloudLightning }
];

const tempFeelings = [
  { name: 'hot', label: 'Panas Menyengat', range: '>33°C' },
  { name: 'humid', label: 'Gerah / Lembap', range: '29-33°C' },
  { name: 'comfy', label: 'Nyaman / Pas', range: '24-28°C' },
  { name: 'cool', label: 'Sejuk', range: '20-23°C' },
  { name: 'cold', label: 'Dingin', range: '<20°C' }
];

const otherConditionsList = [
  { name: 'windy', label: 'Angin Kencang', icon: Wind },
  { name: 'foggy', label: 'Kabut Tebal', icon: Cloud },
  { name: 'flood', label: 'Jalan Tergenang / Banjir', icon: CloudRain },
  { name: 'slippery', label: 'Jalan Licin', icon: CloudRain },
  { name: 'dark', label: 'Langit Gelap', icon: Cloudy },
  { name: 'lightning', label: 'Kilat / Petir Menyambar', icon: CloudLightning }
];

const getConditionIconBg = (_condName?: string) => {
  return 'bg-blue-500/10 dark:bg-blue-400/15';
};

const getConditionIconColor = (_condName?: string) => {
  return 'text-blue-600 dark:text-blue-400';
};

const openReportModal = () => {
  isReportModalOpen.value = true;
  reportSuccess.value = false;
  reportActiveTab.value = 'feedback';
  document.body.classList.add('drawer-open');
};

const closeReportModal = () => {
  isReportModalOpen.value = false;
  document.body.classList.remove('drawer-open');
};

const toggleOtherCondition = (condLabel: string) => {
  const idx = reportForm.value.otherConditions.indexOf(condLabel);
  if (idx > -1) {
    reportForm.value.otherConditions.splice(idx, 1);
  } else {
    reportForm.value.otherConditions.push(condLabel);
  }
};

const submitReport = () => {
  reportSubmitting.value = true;
  setTimeout(() => {
    reportSubmitting.value = false;
    reportSuccess.value = true;

    const newEntry: WeatherReportEntry = {
      id: `rep-${Date.now()}`,
      city: props.selectedCity,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      condition: reportForm.value.condition,
      tempFeeling: reportForm.value.tempFeeling,
      otherConditions: [...reportForm.value.otherConditions],
      comment: reportForm.value.comment
    };
    reportHistory.value.unshift(newEntry);

    setTimeout(() => {
      reportSuccess.value = false;
      reportActiveTab.value = 'history';
    }, 1800);
  }, 900);
};
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <!-- Full Width: Large Hero Weather Card -->
    <div 
      class="w-full h-full flex-1 rounded-[4px] p-6 md:p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between gap-8 group weather-card-dynamic text-white transition-all duration-300"
      :class="cityTheme.cardBg"
    >
      <!-- Decorative Glow Overlay -->
      <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
      <div class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-black/10 blur-2xl"></div>

      <!-- City Landmark Watermark Image Overlay (Full Card Background) -->
      <div v-if="cityTheme.landmarkImg" class="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-all duration-500 z-0">
        <img :src="cityTheme.landmarkImg" alt="City Landmark" class="w-full h-full object-cover" />
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
              <span class="text-[10px] font-black tracking-wider bg-current/10 px-2.5 py-1 rounded-[8px] uppercase">
                Kondisi Saat Ini
              </span>
              <span class="text-[10px] font-black bg-current/10 px-2.5 py-1 rounded-[8px] tracking-wider whitespace-nowrap">
                {{ formattedTimeAndZone }}
              </span>
            </div>
            <h2 class="text-3xl md:text-4xl font-black mt-3 tracking-tight">
              {{ weatherData.city.split(',')[0] }}
            </h2>
            <p class="text-[11px] font-bold opacity-80 mt-1.5 uppercase tracking-wider flex items-center gap-1 flex-wrap">
              <template v-if="weatherData.city.split(',').length > 1 && weatherData.city.split(',')[1].trim()">
                <span>{{ weatherData.city.split(',').slice(1).map(x => x.trim()).join(', ') }}</span>
              </template>
              <template v-else>
                <span>{{ weatherData.city.split(',')[0] }}</span>
              </template>
            </p>
          </div>
          
          <!-- Main Temp Info & Animated Weather Icon (Mobile Only: Sejajar Suhu) -->
          <div class="mt-6 flex items-end justify-between gap-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
              <div class="flex items-baseline gap-1">
                <span class="text-7xl md:text-8xl font-black tracking-tighter leading-none">{{ weatherData.temp }}</span>
                <span class="text-3xl md:text-4xl font-bold">°C</span>
              </div>

              <!-- Lapor Cuaca Button -->
              <button 
                @click="openReportModal"
                class="relative inline-flex items-center gap-2.5 px-3.5 py-2 text-xs tracking-wide rounded-[8px] border font-bold transition-all duration-300 hover:scale-105 active:scale-95 active:duration-75 select-none bg-current/10 hover:bg-current/15 border-current/15 text-current cursor-pointer sm:mb-2"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current relative flex shrink-0">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                </span>
                
                <MessageSquare class="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <span>Lapor Cuaca</span>
              </button>
            </div>

            <!-- Animated Status Weather Icon Container (Mobile Only: Sejajar Suhu) -->
            <div class="flex md:hidden p-3 bg-current/10 backdrop-blur-md rounded-[8px] border border-current/15 shrink-0 self-end sm:self-center">
              <component :is="weatherStyling.icon" class="w-12 h-12 animate-bounce" style="animation-duration: 4s;" />
            </div>
          </div>
        </div>

        <!-- Card Right Portion (Status Summary) -->
        <div class="flex flex-col justify-between items-end text-right gap-4 md:gap-6">
          <!-- Animated Status Weather Icon Container (Desktop Only: Kanan Atas) -->
          <div class="hidden md:flex p-3.5 bg-current/10 backdrop-blur-md rounded-[8px] border border-current/15 self-end">
            <component :is="weatherStyling.icon" class="w-12 h-12 md:w-14 md:h-14 animate-bounce" style="animation-duration: 4s;" />
          </div>

          <!-- Temperature status summary -->
          <div class="flex flex-col gap-2 w-full md:w-48 text-left md:text-right">
            <!-- Upper Panel: Status & Feels Like -->
            <div class="p-3.5 rounded-[8px] bg-white/10 dark:bg-black/20 backdrop-blur-md border border-current/10 shadow-sm">
              <p class="text-xl md:text-2xl font-black tracking-tight leading-tight">{{ weatherData.status }}</p>
              <p class="text-[11px] opacity-90 mt-1 font-semibold">Terasa seperti {{ weatherData.feelLike }}°C</p>
            </div>
            
            <!-- Lower Panel: Max / Min -->
            <div class="py-2.5 px-3.5 rounded-[8px] bg-white/10 dark:bg-black/20 backdrop-blur-md border border-current/10 shadow-sm text-[11px] flex justify-between items-center">
              <span class="opacity-75 font-bold">Max / Min</span>
              <span class="font-black">{{ weatherData.tempMax }}° / {{ weatherData.tempMin }}°</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Bottom Row: Prakiraan Cuaca Sekarang sampai 7 Hari ke Depan (Desktop Only) ── -->
      <div class="hidden md:flex relative z-10 w-full flex-col gap-3.5">


        <!-- 8 Days Full Grid on Desktop -->
        <div class="grid grid-cols-8 gap-2 sm:gap-2.5 w-full py-1 px-1 sm:px-2 md:px-3">
          <div
            v-for="(day, idx) in sevenDaysForecast"
            :key="day.date"
            @click="toggleDayTooltip(day.date, $event)"
            class="group/day relative rounded-[8px] p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all duration-300 backdrop-blur-xl border select-none cursor-pointer snap-start shrink-0 w-[96px] sm:w-[104px] md:w-auto md:shrink"
            :class="[
              activeTooltipDate === day.date
                ? 'bg-white/25 dark:bg-white/20 border-white/60 shadow-2xl ring-2 ring-blue-400 dark:ring-brand-cyan scale-[1.04] z-30'
                : (day.isToday 
                  ? 'bg-white/20 dark:bg-white/15 border-white/40 shadow-lg ring-1 ring-white/30 scale-[1.02] z-10' 
                  : 'bg-white/[0.08] hover:bg-white/[0.16] dark:bg-black/25 dark:hover:bg-black/40 border-white/10 hover:border-white/25 hover:scale-[1.02] shadow-sm hover:shadow-md')
            ]"
          >
            <!-- Day & Date Vertical Stack -->
            <div class="w-full flex flex-col items-center gap-0.5">
              <span 
                class="text-[11px] font-black tracking-wider uppercase leading-none" 
                :class="day.isToday ? 'text-white' : 'text-white/90'"
              >
                {{ day.dayName }}
              </span>
              <span class="text-[10px] font-semibold text-white/65 tracking-tight leading-tight">
                {{ day.dateShort }}
              </span>
            </div>

            <!-- Weather Icon Container -->
            <div class="my-2 p-1.5 sm:p-2 rounded-[8px] transition-all duration-300 shadow-sm border flex items-center justify-center group-hover/day:scale-110" :class="day.iconBg">
              <component :is="day.icon" class="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300" :class="day.iconColor" />
            </div>

            <!-- Min / Max Temperature -->
            <div class="w-full mt-auto flex items-baseline justify-center gap-1.5">
              <span class="text-sm font-black tracking-tight text-white">{{ day.tempMax }}°</span>
              <span class="text-[11px] font-semibold text-white/60">{{ day.tempMin }}°</span>
            </div>

            <!-- Precipitation badge -->
            <div 
              class="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[9px] font-bold tracking-wide transition-colors"
              :class="day.precipitation > 20 
                ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30' 
                : 'bg-white/10 text-white/70 border border-white/10'"
            >
              <Droplets class="w-2.5 h-2.5 shrink-0" />
              <span>{{ day.precipitation }}%</span>
            </div>

            <!-- Interactive Informative Tooltip Popover (Desktop) -->
            <Transition name="tooltip-pop">
              <div
                v-if="activeTooltipDate === day.date"
                @click.stop
                class="absolute bottom-full mb-3.5 z-50 w-72 p-3.5 rounded-[8px] backdrop-blur-2xl bg-slate-900/95 dark:bg-brand-navy-950/95 border border-white/20 dark:border-brand-navy-700/80 shadow-[0_12px_32px_rgba(0,0,0,0.5)] text-left text-white pointer-events-auto cursor-default"
                :class="idx === 0 ? 'left-0' : idx === 1 ? 'left-0 sm:-left-6' : idx >= 6 ? 'right-0' : 'left-1/2 -translate-x-1/2'"
              >
                <!-- Tooltip Header -->
                <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                  <div class="flex flex-col">
                    <span class="text-[11px] font-black tracking-wider uppercase text-blue-400 dark:text-brand-cyan leading-tight">
                      {{ day.dayTitle }}, {{ day.dateFull }}
                    </span>
                    <span class="text-xs font-bold text-white/95 mt-0.5 leading-tight">
                      {{ day.status }}
                    </span>
                  </div>
                  <button 
                    @click.stop="activeTooltipDate = null" 
                    class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Descriptive Narrative -->
                <p class="text-[11px] text-white/80 leading-relaxed mb-3">
                  {{ getWeatherDescription(day.status, day.precipitation, day.tempMax) }}
                </p>

                <!-- Key Parameters Grid -->
                <div class="grid grid-cols-3 gap-1.5 pt-1">
                  <!-- Suhu Range -->
                  <div class="p-1.5 rounded-[6px] bg-white/5 border border-white/10 flex flex-col items-center text-center">
                    <span class="text-[9px] text-white/60 font-medium leading-none">Suhu</span>
                    <span class="text-[11px] font-black text-white mt-1">{{ day.tempMax }}° / {{ day.tempMin }}°</span>
                  </div>
                  <!-- Peluang Hujan -->
                  <div class="p-1.5 rounded-[6px] bg-white/5 border border-white/10 flex flex-col items-center text-center">
                    <span class="text-[9px] text-white/60 font-medium leading-none">Hujan</span>
                    <span class="text-[11px] font-black text-cyan-300 mt-1">{{ day.precipitation }}%</span>
                  </div>
                  <!-- Angin -->
                  <div class="p-1.5 rounded-[6px] bg-white/5 border border-white/10 flex flex-col items-center text-center">
                    <span class="text-[9px] text-white/60 font-medium leading-none">Angin</span>
                    <span class="text-[11px] font-black text-white mt-1">{{ day.windSpeed }} km/j</span>
                  </div>
                </div>

                <!-- Bottom Arrow -->
                <div
                  class="absolute bottom-0 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95 dark:border-t-brand-navy-950/95"
                  :class="idx === 0 ? 'left-6' : idx === 1 ? 'left-10' : idx >= 6 ? 'right-6' : 'left-1/2 -translate-x-1/2'"
                ></div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Mobile Standalone Card: Prakiraan Cuaca Harian (Soft White Dominan) ── -->
    <div 
      class="block md:hidden mt-4 relative w-full rounded-2xl p-4 sm:p-5 overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 bg-gradient-to-b from-white via-white to-blue-50/25 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850"
    >
      <!-- Header Card -->
      <div class="pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 relative z-10">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/40 flex items-center justify-center shadow-xs">
            <Calendar class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100 uppercase leading-none mb-1">
              Prakiraan 7 Hari
            </h4>
            <p class="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
              Termasuk hari ini • {{ weatherData.city.split(',')[0] }}
            </p>
          </div>
        </div>
      </div>

      <!-- List Rows (sesuai screenshot referensi) -->
      <div class="divide-y divide-slate-100/90 dark:divide-slate-800/70 px-0.5 py-1 relative z-10">
        <div
          v-for="day in sevenDaysForecast"
          :key="day.date"
          @click="toggleDayTooltip(day.date, $event)"
          class="flex flex-col py-3 px-1 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer rounded-lg"
        >
          <!-- Main Row -->
          <div class="flex items-center justify-between w-full">
            <!-- Col 1: Day & Date -->
            <div class="flex flex-col w-[92px] shrink-0 text-left">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {{ day.dayTitle }}
              </span>
              <span class="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                {{ day.dateFull }}
              </span>
            </div>

            <!-- Col 2: Weather Icon with Soft Pastel Backdrop Box -->
            <div class="flex items-center justify-center shrink-0">
              <div 
                class="w-8 h-8 rounded-[10px] p-1.5 transition-all duration-200 border flex items-center justify-center shadow-xs" 
                :class="day.mobileIconBg"
              >
                <component 
                  :is="day.icon" 
                  class="w-4.5 h-4.5 stroke-[2.2] transition-transform duration-200" 
                  :class="day.mobileIconColor" 
                />
              </div>
            </div>

            <!-- Col 3: Precipitation with bullet • -->
            <div class="flex items-center justify-center w-14 shrink-0">
              <div v-if="day.precipitation > 0" class="flex items-center gap-1 text-xs font-semibold text-blue-500 dark:text-blue-400">
                <span class="text-sm font-black leading-none">•</span>
                <span>{{ day.precipitation }}%</span>
              </div>
            </div>

            <!-- Col 4: T (Max) · R (Min) -->
            <div class="flex items-center justify-end text-right shrink-0">
              <span class="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">T</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ day.tempMax }}°</span>
              <span class="mx-1.5 text-slate-300 dark:text-slate-600 font-bold">·</span>
              <span class="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">R</span>
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ day.tempMin }}°</span>
            </div>
          </div>

          <!-- Informative & Descriptive Tooltip Panel for Mobile -->
          <Transition name="tooltip-pop">
            <div 
              v-if="activeTooltipDate === day.date"
              @click.stop
              class="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-left text-xs text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <div class="flex items-center justify-between mb-1.5 font-bold text-slate-800 dark:text-slate-100">
                <div class="flex items-center gap-1.5">
                  <component :is="day.icon" class="w-4 h-4" :class="day.mobileIconColor" />
                  <span>{{ day.status }}</span>
                </div>
                <span class="text-blue-600 dark:text-blue-400 font-bold">{{ day.tempMax }}° / {{ day.tempMin }}°</span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                {{ getWeatherDescription(day.status, day.precipitation, day.tempMax) }}
              </p>
              <div class="grid grid-cols-3 gap-1.5 text-[10px] text-center pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                <div class="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <div class="text-slate-400 dark:text-slate-500 font-medium text-[9px]">Peluang Hujan</div>
                  <div class="font-bold text-blue-600 dark:text-blue-400">{{ day.precipitation }}%</div>
                </div>
                <div class="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <div class="text-slate-400 dark:text-slate-500 font-medium text-[9px]">Kelembapan</div>
                  <div class="font-bold text-slate-800 dark:text-slate-100">{{ day.humidity }}%</div>
                </div>
                <div class="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <div class="text-slate-400 dark:text-slate-500 font-medium text-[9px]">Kec. Angin</div>
                  <div class="font-bold text-slate-800 dark:text-slate-100">{{ day.windSpeed }} km/j</div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Lapor Cuaca Drawer -->
    <WeatherReportDrawer
      :isOpen="isReportModalOpen"
      :selectedCity="props.selectedCity"
      :weatherTemp="weatherData.temp"
      :weatherIcon="weatherStyling.icon"
      :reportSubmitting="reportSubmitting"
      :reportSuccess="reportSuccess"
      :reportActiveTab="reportActiveTab"
      :reportForm="reportForm"
      :reportHistory="reportHistory"
      :overallConditions="overallConditions"
      :tempFeelings="tempFeelings"
      :otherConditionsList="otherConditionsList"
      :getConditionIconBg="getConditionIconBg"
      :getConditionIconColor="getConditionIconColor"
      @close="closeReportModal"
      @update:reportActiveTab="reportActiveTab = $event"
      @update:reportForm="reportForm = $event"
      @toggleOtherCondition="toggleOtherCondition"
      @submit="submitReport"
    />
  </div>
</template>

<style scoped>
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

.tooltip-pop-enter-active,
.tooltip-pop-leave-active {
  transition: opacity 0.18s ease, margin-bottom 0.18s ease;
}
.tooltip-pop-enter-from,
.tooltip-pop-leave-to {
  opacity: 0;
  margin-bottom: -4px;
}
</style>

<script setup lang="ts">
import type { WeatherData, CityAnalysis } from '../types/weather';
import { computed } from 'vue';
import { getComfortIndex } from '../data/weatherHelpers';
import { 
  Compass, 
  Waves, 
  Plane, 
  Thermometer, 
  Sun, 
  Wind, 
  Navigation, 
  Eye, 
  Droplets,
  Ship,
  Anchor
} from 'lucide-vue-next';

const props = defineProps<{
  weatherData: WeatherData;
  currentAnalysis: CityAnalysis;
  additionalInfo: {
    windAngle: number;
    windDir: string;
  };
  selectedCity: string;
  slideDirection: string;
  currentCityLandmarkSvg: string;
  currentCityShortName: string;
}>();

const emit = defineEmits<{
  (e: 'open-maritime-advisor', sectorId?: string): void;
  (e: 'open-aviation-advisor', sectorId?: string): void;
  (e: 'open-land-advisor'): void;
}>();



function lockHeight(el: Element) {
  const wrapper = (el as HTMLElement).parentElement;
  if (wrapper) wrapper.style.height = (el as HTMLElement).offsetHeight + 'px';
}
function unlockHeight(el: Element) {
  const wrapper = (el as HTMLElement).parentElement;
  if (wrapper) wrapper.style.height = '';
}

const comfortIndex = computed(() => getComfortIndex(props.weatherData.temp));

const shippingDesc = computed(() => {
  const windKts = Math.round(props.weatherData.windSpeed * 0.539957);
  const waveEst = +(0.3 + (props.weatherData.windSpeed * 0.04)).toFixed(1);
  
  if (waveEst > 2.0 || windKts > 20) {
    return `Tinggi gelombang diperkirakan mencapai ${waveEst}m dengan angin ${windKts} knot. Kapal nelayan & tongkang diimbau meningkatkan kewaspadaan navigasi.`;
  }
  if (waveEst > 1.25 || windKts > 15) {
    return `Kondisi perairan bergelombang sedang (${waveEst}m) & angin ${windKts} knot. Navigasi alur pelayaran utama dan kapal Ro-Ro terpantau tetap aman terendali.`;
  }
  return `Tinggi gelombang tenang (${waveEst}m) & kecepatan angin ${windKts} knot. Kondisi sangat kondusif untuk alur masuk pelabuhan, pelayaran ferry, serta logistik maritim.`;
});

const airQualitySummary = computed(() => {
  const temp = props.weatherData?.temp ?? 28;
  const citySeed = (props.selectedCity || 'Jakarta').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const basePm25 = temp > 31 ? 42 : temp > 27 ? 28 : 16;
  const pm25 = Math.round(Math.max(8, basePm25 + (citySeed % 14)));
  const pm10 = Math.round(pm25 * 0.4 + 10 + (citySeed % 6));
  
  let aqi = 0;
  if (pm25 <= 12) {
    aqi = Math.round((pm25 / 12) * 50);
  } else if (pm25 <= 35.4) {
    aqi = Math.round(50 + ((pm25 - 12) / (35.4 - 12)) * 50);
  } else if (pm25 <= 55.4) {
    aqi = Math.round(100 + ((pm25 - 35.4) / (55.4 - 35.4)) * 50);
  } else if (pm25 <= 150.4) {
    aqi = Math.round(150 + ((pm25 - 55.4) / (150.4 - 55.4)) * 50);
  } else {
    aqi = Math.round(200 + ((pm25 - 150.4) / 100) * 100);
  }

  let status = 'Baik';
  let colorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  let pillClass = 'bg-emerald-500 text-white';
  let progressColor = 'bg-emerald-500';
  let desc = 'Kondisi udara bersih dan segar, sangat ideal untuk aktivitas fisik luar ruangan.';
  let recommendation = 'Aman untuk semua aktivitas luar ruangan tanpa masker.';

  if (aqi > 150) {
    status = 'Tidak Sehat';
    colorClass = 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    pillClass = 'bg-red-500 text-white';
    progressColor = 'bg-red-500';
    desc = 'Kadar polusi tinggi. Hindari aktivitas luar ruangan berdurasi panjang.';
    recommendation = 'Gunakan masker berfiltrasi tinggi jika beraktivitas di luar.';
  } else if (aqi > 100) {
    status = 'Kurang Sehat';
    colorClass = 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
    pillClass = 'bg-orange-500 text-white';
    progressColor = 'bg-orange-500';
    desc = 'Kelompok rentan dapat merasakan dampak. Batasi aktivitas luar berlebih.';
    recommendation = 'Disarankan memakai masker bagi kelompok sensitif / lansia.';
  } else if (aqi > 50) {
    status = 'Sedang';
    colorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    pillClass = 'bg-amber-500 text-white';
    progressColor = 'bg-amber-500';
    desc = 'Kualitas udara dapat diterima untuk sebagian besar aktivitas luar ruangan.';
    recommendation = 'Aman beraktivitas, pantau sensitivitas terhadap debu jalan.';
  }

  const meterPercent = Math.min(100, Math.round((aqi / 200) * 100));

  return {
    aqi,
    pm25,
    pm10,
    status,
    colorClass,
    pillClass,
    progressColor,
    desc,
    recommendation,
    meterPercent
  };
});
</script>

<template>
  <div class="space-y-4">
    <!-- Index Kenyamanan Card (Futuristic & Compact) -->
    <div class="relative w-full rounded-2xl p-4 overflow-hidden border border-slate-200/60 dark:border-brand-navy-800/60 backdrop-blur-xl bg-white/85 dark:bg-brand-navy-900/80 shadow-sm hover:shadow-md transition-all duration-300 group text-left">
      <!-- Neon Accent Top Line -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-cyan-500/0"></div>
      
      <!-- Subtle Cyber Ambient Glow -->
      <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

      <!-- Header & Main Metric Row -->
      <div class="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M17.66 6.34l-1.41 1.41M7.76 16.24l-1.41 1.41M6.34 6.34l1.41 1.41M16.24 16.24l1.41 1.41" />
            </svg>
          </div>
          <div class="min-w-0">
            <h4 class="text-xs font-black tracking-wider text-slate-800 dark:text-white uppercase leading-none truncate">
              Indeks Kenyamanan
            </h4>
            <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Analisis Paparan Panas
            </p>
          </div>
        </div>

        <!-- Telemetry Live Badge -->
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-brand-navy-950/80 border border-slate-200/50 dark:border-brand-navy-800 text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Live</span>
        </span>
      </div>

      <!-- Main Status Banner Box (Ultra-Compact Sleek Pill/Box) -->
      <div class="relative z-10 rounded-xl px-2.5 py-1.5 mb-2 flex items-center justify-between gap-2 border transition-all" :class="comfortIndex.colorClass">
        <div class="flex items-center gap-2 min-w-0">
          <div v-html="comfortIndex.smileySvg" class="w-5 h-5 shrink-0 overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full"></div>
          <div class="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span class="text-[10.5px] font-black leading-none truncate">{{ comfortIndex.quality }}</span>
            <span class="inline-flex items-center px-1.5 py-0.5 text-[8px] font-black rounded tracking-wider uppercase leading-none" :class="comfortIndex.pillClass">
              {{ comfortIndex.status }}
            </span>
          </div>
        </div>
        <span class="text-[10px] font-extrabold tracking-tight opacity-80 shrink-0 whitespace-nowrap">{{ comfortIndex.tempText }}</span>
      </div>

      <!-- Sub-description text -->
      <p class="relative z-10 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400 font-medium mb-2.5">
        {{ comfortIndex.desc }}
      </p>

      <!-- Actionable Advice Compact Grid -->
      <div class="relative z-10 space-y-1.5 pt-2 border-t border-slate-100 dark:border-brand-navy-800/50">
        <div class="flex items-center gap-2.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-medium">
          <div class="p-1 rounded-lg bg-slate-100 dark:bg-brand-navy-950/80 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="4" r="1" />
              <path d="m9 20 2-4.5-1-2.5-1 3.5" />
              <path d="m15 20-2-6.5 2-2.5-1-2.5-2 1" />
            </svg>
          </div>
          <span class="truncate">{{ comfortIndex.recommendation1 }}</span>
        </div>

        <div class="flex items-center gap-2.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-medium">
          <div class="p-1 rounded-lg bg-slate-100 dark:bg-brand-navy-950/80 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="3" width="16" height="18" rx="1" stroke-width="1.5" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </div>
          <span class="truncate">{{ comfortIndex.recommendation2 }}</span>
        </div>
      </div>
    </div>

    <!-- Card Resume Kualitas Udara (Futuristic & Compact) -->
    <div class="relative w-full rounded-2xl p-4 overflow-hidden border border-slate-200/60 dark:border-brand-navy-800/60 backdrop-blur-xl bg-white/85 dark:bg-brand-navy-900/80 shadow-sm hover:shadow-md transition-all duration-300 group text-left">
      <!-- Neon Accent Top Line (Teal/Emerald Glow) -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-teal-500/60 to-cyan-500/0"></div>

      <!-- Subtle Cyber Ambient Glow -->
      <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

      <!-- Header & Main Metric Row -->
      <div class="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
              <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
            </svg>
          </div>
          <div class="min-w-0">
            <h4 class="text-xs font-black tracking-wider text-slate-800 dark:text-white uppercase leading-none truncate">
              Kualitas Udara (AQI)
            </h4>
            <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Indeks Standar Pencemar Udara
            </p>
          </div>
        </div>

        <!-- Telemetry Live Badge -->
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-brand-navy-950/80 border border-slate-200/50 dark:border-brand-navy-800 text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
          <span>ISPU LIVE</span>
        </span>
      </div>

      <!-- Main Status Banner Box (Ultra-Compact Sleek Pill/Box) -->
      <div class="relative z-10 rounded-xl px-2.5 py-1.5 mb-2 flex items-center justify-between gap-2 border transition-all" :class="airQualitySummary.colorClass">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-5 h-5 shrink-0 flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <div class="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span class="text-[10.5px] font-black leading-none truncate">AQI {{ airQualitySummary.aqi }}</span>
            <span class="inline-flex items-center px-1.5 py-0.5 text-[8px] font-black rounded tracking-wider uppercase leading-none" :class="airQualitySummary.pillClass">
              {{ airQualitySummary.status }}
            </span>
          </div>
        </div>
        <span class="text-[10px] font-extrabold tracking-tight opacity-80 shrink-0 whitespace-nowrap">PM2.5: {{ airQualitySummary.pm25 }} µg/m³</span>
      </div>

      <!-- Compact Linear Progress Gauge -->
      <div class="relative z-10 mb-2.5">
        <div class="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-brand-navy-950/80 overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-700 ease-out" 
            :class="airQualitySummary.progressColor"
            :style="{ width: `${airQualitySummary.meterPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Sub-description text -->
      <p class="relative z-10 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400 font-medium mb-2.5">
        {{ airQualitySummary.desc }}
      </p>

      <!-- Actionable Advice & Particulate Telemetry -->
      <div class="relative z-10 pt-2 border-t border-slate-100 dark:border-brand-navy-800/50 space-y-1.5">
        <!-- Telemetry micro badges -->
        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div class="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-100/70 dark:bg-brand-navy-950/60 border border-slate-200/40 dark:border-brand-navy-800/40">
            <span class="text-slate-400 dark:text-slate-500 font-semibold">PM10</span>
            <span class="font-extrabold text-slate-700 dark:text-slate-200">{{ airQualitySummary.pm10 }} µg/m³</span>
          </div>
          <div class="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-100/70 dark:bg-brand-navy-950/60 border border-slate-200/40 dark:border-brand-navy-800/40">
            <span class="text-slate-400 dark:text-slate-500 font-semibold">Skala</span>
            <span class="font-extrabold text-slate-700 dark:text-slate-200">0 - 300</span>
          </div>
        </div>

        <!-- Recommendation item -->
        <div class="flex items-center gap-2 text-[10.5px] text-slate-600 dark:text-slate-300 font-medium pt-0.5">
          <div class="p-1 rounded-lg bg-slate-100 dark:bg-brand-navy-950/80 shrink-0 text-teal-600 dark:text-teal-400">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span class="truncate">{{ airQualitySummary.recommendation }}</span>
        </div>
      </div>
    </div>

    <!-- Title Section -->
    <div class="flex items-center gap-2 mb-2 pt-2">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Panduan Aktivitas & Analisis Cuaca</h3>
    </div>

    <!-- Weather Activity & Analysis Section -->
    <div class="relative overflow-hidden">
    <Transition
      :name="slideDirection"
      @before-leave="lockHeight"
      @after-enter="unlockHeight"
    >
      <div :key="selectedCity" class="flex flex-col gap-4">
        <!-- Card 1: Darat -->
        <div 
          @click="emit('open-land-advisor')"
          class="gpu-card group relative bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border border-slate-200/50 dark:border-brand-navy-700/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-500/40 dark:hover:border-orange-400/40 transition-[shadow,border-color,transform] duration-300 flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-orange-500/50 dark:active:border-orange-400/50"
        >
          <!-- Colored Ambient Glow Overlay -->
          <div class="perf-layer glow-orb absolute -right-6 -top-6 w-40 h-40 rounded-full bg-orange-500/12 dark:bg-orange-500/18 blur-2xl group-hover:bg-orange-500/30 dark:group-hover:bg-orange-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

          <!-- 🏔️ Land Illustration: City skyline + road + mountains -->
          <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
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
            

          </div>
          
          <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal flex-grow z-10">
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
            <span @click.stop="emit('open-land-advisor')" class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:text-orange-750 dark:hover:text-orange-300 hover:underline transition-colors font-black cursor-pointer">
              Selengkapnya
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <!-- Card 2: Pesisir & Laut -->
        <div 
          @click="emit('open-maritime-advisor', 'shipping')"
          class="gpu-card group relative bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border border-slate-200/50 dark:border-brand-navy-700/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-[shadow,border-color,transform] duration-300 flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-cyan-500/50 dark:active:border-cyan-400/50"
        >
          <!-- Colored Ambient Glow Overlay -->
          <div class="perf-layer glow-orb absolute -right-6 -top-6 w-40 h-40 rounded-full bg-cyan-500/12 dark:bg-cyan-500/18 blur-2xl group-hover:bg-cyan-500/30 dark:group-hover:bg-cyan-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

          <!-- 🌊 Sea Illustration: Ocean waves + ship + lighthouse -->
          <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
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
            

          </div>
          
          <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal flex-grow z-10">
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
            <span @click.stop="emit('open-maritime-advisor', 'shipping')" class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-cyan-600 dark:text-brand-cyan hover:text-cyan-750 dark:hover:text-cyan-300 hover:underline transition-colors font-black cursor-pointer">
              Selengkapnya
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <!-- Card Baru: Aktivitas Pelayaran -->
        <div 
          @click="emit('open-maritime-advisor', 'shipping')"
          class="gpu-card group relative bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border border-slate-200/50 dark:border-brand-navy-700/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-400/40 transition-[shadow,border-color,transform] duration-300 flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-blue-500/50 dark:active:border-blue-400/50"
        >
          <!-- Ambient Glow -->
          <div class="perf-layer glow-orb absolute -right-6 -top-6 w-40 h-40 rounded-full bg-blue-500/12 dark:bg-blue-500/18 blur-2xl group-hover:bg-blue-500/30 dark:group-hover:bg-blue-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

          <!-- Ship Illustration BG -->
          <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
            <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="xMidYMax meet">
              <rect x="0" y="60" width="320" height="20" fill="#1e3a8a" opacity="0.3"/>
              <path d="M0 65 Q20 58 40 64 Q60 70 80 64 Q100 58 120 64 Q140 70 160 64 Q180 58 200 64 Q220 70 240 64 Q260 58 280 64 Q300 70 320 65 L320 80 L0 80Z" fill="#3b82f6" opacity="0.4"/>
              <!-- Cargo Ship Icon -->
              <path d="M60 62 L48 70 L130 70 L118 62Z" fill="#334155" opacity="0.7"/>
              <rect x="70" y="52" width="18" height="10" fill="#475569" opacity="0.7"/>
              <rect x="90" y="47" width="10" height="15" fill="#64748b" opacity="0.7"/>
              <line x1="99" y1="36" x2="99" y2="47" stroke="#94a3b8" stroke-width="1.5"/>
            </svg>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between z-10">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-brand-cyan flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Ship class="w-5 h-5 transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-110" />
              </div>
              <h4 class="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-brand-cyan">
                Aktivitas Pelayaran
              </h4>
            </div>
            

          </div>
          
          <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal flex-grow z-10">
            {{ shippingDesc }}
          </p>

          <!-- Card Footer -->
          <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-200 dark:border-brand-navy-700/40 text-[11px] font-bold text-slate-800 dark:text-slate-100 z-10">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white/40 border-slate-200/30 dark:bg-white/5 dark:border-white/5 backdrop-blur-md shadow-sm">
                <Anchor class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Alur Pelabuhan Safe</span>
              </div>
            </div>
            <span @click.stop="emit('open-maritime-advisor', 'shipping')" class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-blue-600 dark:text-brand-cyan hover:text-blue-750 dark:hover:text-cyan-300 hover:underline transition-colors font-black cursor-pointer">
              Selengkapnya
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <!-- Card 3: Penerbangan -->
        <div 
          @click="emit('open-aviation-advisor', 'commercial')"
          class="gpu-card group relative bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border border-slate-200/50 dark:border-brand-navy-700/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-[shadow,border-color,transform] duration-300 flex flex-col gap-4 text-left cursor-pointer overflow-hidden active:scale-[0.98] active:duration-75 active:border-indigo-500/50 dark:active:border-indigo-400/50"
        >
          <!-- Colored Ambient Glow Overlay -->
          <div class="perf-layer glow-orb absolute -right-6 -top-6 w-40 h-40 rounded-full bg-indigo-500/12 dark:bg-indigo-500/18 blur-2xl group-hover:bg-indigo-500/30 dark:group-hover:bg-indigo-500/35 group-hover:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>

          <!-- ✈️ Aviation Illustration: Runway + sky + flying plane -->
          <div class="card-illustration absolute bottom-0 left-0 right-0 h-full pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-0">
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
            

          </div>
          
          <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal flex-grow z-10">
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
            <span
              @click.stop="emit('open-aviation-advisor', 'commercial')"
              class="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-300 hover:underline transition-colors font-black cursor-pointer"
            >
              Selengkapnya
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Activity, ChevronDown, Wind, Droplets, Cloud, Zap, Cloudy, CloudFog } from 'lucide-vue-next';
import type { WeatherData } from '../types/weather';

const props = defineProps<{
  weatherData: WeatherData;
  selectedCity: string;
}>();

// ── Pollutant selector (dropdown) ─────────────────────────────────────────────
const pollutantTabs = [
  { id: 'AQI', label: 'AQI', unit: 'ISPU', icon: Activity },
  { id: 'PM2.5', label: 'PM 2.5', unit: 'µg/m³', icon: Cloud },
  { id: 'PM10', label: 'PM 10', unit: 'µg/m³', icon: Cloudy },
  { id: 'O₃', label: 'Ozon (O₃)', unit: 'µg/m³', icon: Zap },
  { id: 'NO₂', label: 'Nitrogen (NO₂)', unit: 'µg/m³', icon: CloudFog },
  { id: 'CO', label: 'Karbon (CO)', unit: 'mg/m³', icon: Wind },
  { id: 'SO₂', label: 'Belerang (SO₂)', unit: 'µg/m³', icon: Droplets },
];
const activePollutant = ref('AQI');
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const activeTabInfo = computed(() => pollutantTabs.find(t => t.id === activePollutant.value) || pollutantTabs[0]);

// ── Deterministic "measurement" per city + day (mock) ────────────────────────
const todayIso = new Date().toISOString().slice(0, 10);

const measurements = computed(() => {
  const seedText = props.selectedCity + todayIso;
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 997;

  const basePm25 = props.weatherData.temp > 32 ? 65 : props.weatherData.temp > 28 ? 48 : 22;
  const pm25 = Math.round(Math.max(5, basePm25 + ((seed % 17) - 8)));
  const pm10 = Math.round(pm25 * 0.3 + 12 + (seed % 5));
  const o3 = Math.round(30 + ((seed * 7) % 60));
  const no2 = Math.round(8 + ((seed * 3) % 30));
  const co = Math.round((2 + (seed % 8)) * 10) / 10;
  const so2 = Math.round(5 + (seed % 20));
  const aqi = Math.round(pm25 * 1.15 + (seed % 8));

  return { aqi, pm25, pm10, o3, no2, co, so2, hour: new Date().getHours() };
});

const values: Record<string, () => number> = {
  AQI: () => measurements.value.aqi,
  'PM2.5': () => measurements.value.pm25,
  PM10: () => measurements.value.pm10,
  'O₃': () => measurements.value.o3,
  'NO₂': () => measurements.value.no2,
  CO: () => measurements.value.co,
  'SO₂': () => measurements.value.so2,
};

const currentValue = computed(() => values[activePollutant.value]().toFixed(activePollutant.value === 'CO' ? 1 : 0));

const activeStatus = computed(() => {
  const v = measurements.value.aqi;
  if (v <= 50) return { label: 'Baik', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500', barPct: 25 };
  if (v <= 100) return { label: 'Sedang', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500', barPct: 50 };
  if (v <= 200) return { label: 'Tidak Sehat', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500', barPct: 75 };
  if (v <= 300) return { label: 'Sangat Tidak Sehat', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', bar: 'bg-rose-500', barPct: 90 };
  return { label: 'Berbahaya', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-600/10 border-red-600/20', bar: 'bg-red-600', barPct: 100 };
});

const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value; };
const selectPollutant = (id: string) => { activePollutant.value = id; isDropdownOpen.value = false; };

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => window.addEventListener('click', handleClickOutside));
onUnmounted(() => window.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="relative w-full rounded-3xl p-5 overflow-hidden border border-white/10 dark:border-brand-navy-800/40 backdrop-blur-xl bg-white/80 dark:bg-brand-navy-900/60 transition-all duration-300 hover:border-white/15 dark:hover:border-brand-navy-850/50">
    <!-- Top Glow Border Line -->
    <div class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent rounded-t-2xl"></div>

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100 dark:border-brand-navy-800/60 relative z-10">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/10">
          <Activity class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">
            Pengukuran Kualitas Udara
          </h4>
          <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
            Indeks Standar Pencemar Udara (ISPU) • {{ selectedCity.split(',')[0] }}
          </p>
        </div>
      </div>

      <!-- Pollutant dropdown selector -->
      <div ref="dropdownRef" class="relative z-50 shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all cursor-pointer select-none bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700 dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component :is="activeTabInfo.icon" class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
          <span>{{ activeTabInfo.label }}</span>
          <ChevronDown class="w-3 h-3 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
        </button>
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
            class="absolute right-0 mt-2 w-44 rounded-xl shadow-lg border overflow-hidden py-1.5 z-50 bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="tab in pollutantTabs"
              :key="tab.id"
              @click="selectPollutant(tab.id)"
              class="w-full text-left px-4 py-2.5 text-[11px] hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activePollutant === tab.id ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                {{ tab.label }}
              </span>
              <span v-if="activePollutant === tab.id" class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Big AQI value + status -->
    <div class="relative z-10 flex items-end justify-between gap-4">
      <div>
        <p class="text-5xl font-black tracking-tighter leading-none" :class="activeStatus.color">
          {{ measurements.aqi }}
        </p>
        <p class="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">
          Indeks Kualitas Udara
        </p>
      </div>
      <div class="flex flex-col items-end gap-1.5">
        <span class="inline-flex items-center px-2.5 py-1 text-[10px] font-black rounded-full tracking-wider border" :class="[activeStatus.bg, activeStatus.color]">
          {{ activeStatus.label }}
        </span>
        <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">Diukur pukul {{ String(measurements.hour).padStart(2, '0') }}:00 WIB</span>
      </div>
    </div>

    <!-- Bar -->
    <div class="relative z-10 mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-brand-navy-950/80 overflow-hidden">
      <div class="h-full rounded-full transition-all duration-700" :class="activeStatus.bar" :style="{ width: activeStatus.barPct + '%' }"></div>
    </div>

    <!-- Active pollutant detail -->
    <div class="relative z-10 mt-4 rounded-xl p-3.5 border bg-slate-50/60 dark:bg-brand-navy-950/50 border-slate-100 dark:border-brand-navy-800/40 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <component :is="activeTabInfo.icon" class="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <div>
          <p class="text-[10px] font-bold text-slate-600 dark:text-slate-300">{{ activeTabInfo.label }}</p>
          <p class="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Konsentrasi terukur</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-lg font-black leading-none text-slate-800 dark:text-white">{{ currentValue }}</p>
        <p class="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ activeTabInfo.unit }}</p>
      </div>
    </div>

    <!-- Quick chips -->
    <div class="relative z-10 mt-3 grid grid-cols-4 gap-2">
      <div v-for="p in ['PM2.5', 'PM10', 'O₃', 'NO₂']" :key="p" class="rounded-lg px-2 py-1.5 bg-slate-100/50 dark:bg-brand-navy-950/60 border border-slate-100 dark:border-brand-navy-800/40 text-center">
        <p class="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{{ p }}</p>
        <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">{{ values[p]() }}{{ p === 'PM2.5' ? '' : '' }}</p>
      </div>
    </div>
  </div>
</template>
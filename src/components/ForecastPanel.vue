<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  ChevronDown,
  Droplet,
  Sunrise,
  Sunset,
  Wind,
  Thermometer,
  Cloud,
  Moon
} from 'lucide-vue-next';
import type { HourlyForecast } from '../types/weather';
import ForecastTemperatureChart from './forecast/ForecastTemperatureChart.vue';
import ForecastPrecipitationChart from './forecast/ForecastPrecipitationChart.vue';

const props = defineProps<{
  forecasts: HourlyForecast[];
}>();

// Navigation tab state
const activeTab = ref('Suhu');
const hourlyTabs = ['Suhu', 'Presipitasi', 'Angin', 'Kelembapan'];
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Header Date updated reactively by active chart scroll/selected states
const headerDate = ref('');

const updateHeaderDate = (dateStr: string) => {
  headerDate.value = dateStr;
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectTab = (tab: string) => {
  activeTab.value = tab;
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

const getTabIcon = (tabName: string) => {
  switch (tabName) {
    case 'Suhu': return Thermometer;
    case 'Presipitasi': return Droplet;
    case 'Angin': return Wind;
    case 'Kelembapan': return Cloud;
    default: return Thermometer;
  }
};

// ── Real-time clock ────────────────────────────────────────────────────────────
const currentTime = ref(new Date());
let clockIntervalId: any = null;

onMounted(async () => {
  await nextTick();
  window.addEventListener('click', handleClickOutside);
  // Tick every minute to update current hour calculations
  clockIntervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 60000);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  if (clockIntervalId) clearInterval(clockIntervalId);
});
</script>

<template>
  <div class="relative w-full rounded-[4px] overflow-hidden border border-white/10 dark:border-brand-navy-800/40 backdrop-blur-xl bg-white/80 dark:bg-brand-navy-900/60 transition-all duration-300 hover:border-white/15 dark:hover:border-brand-navy-850/50" v-api-marker:forecast-panel>
    <!-- Top Glow Border Line -->
    <div class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent rounded-t-[4px]"></div>

    <!-- ── Header ─────────────────────────────── -->
    <div class="p-5 pb-3.5 flex items-center justify-between gap-3 border-b border-slate-100/40 dark:border-brand-navy-800/30 relative z-10">
      <!-- Left: Title -->
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-[4px] bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-500 dark:text-brand-cyan border border-blue-500/10">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">
            Prakiraan Perjam
          </h4>
          <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 transition-all duration-300">
            {{ headerDate || 'Parameter Cuaca Hari Ini' }}
          </p>
        </div>
      </div>

      <!-- Right: Dropdown with glassmorphism and dynamic icon -->
      <div ref="dropdownRef" class="relative z-50 shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] border transition-all cursor-pointer select-none
            bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700
            dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component
            :is="getTabIcon(activeTab)"
            class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan"
          />
          <span class="text-xs tracking-wide">{{ activeTab }}</span>
          <ChevronDown class="w-3 h-3 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
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
            class="absolute right-0 mt-2 w-48 rounded-[4px] shadow-lg border overflow-hidden py-1.5 z-50
              bg-white/95 border-slate-100 backdrop-blur-md
              dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="tab in hourlyTabs"
              :key="tab"
              @click="selectTab(tab)"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activeTab === tab ? 'font-bold text-blue-600 dark:text-brand-cyan' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="getTabIcon(tab)" class="w-3.5 h-3.5" />
                {{ tab }}
              </span>
              <span v-if="activeTab === tab" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- ── Hourly Chart Section (Suhu / Angin / Kelembapan) ────────── -->
    <ForecastTemperatureChart
      v-if="activeTab !== 'Presipitasi'"
      :forecasts="forecasts"
      :active-tab="activeTab"
      :current-time="currentTime"
      @date-change="updateHeaderDate"
    />

    <!-- ── Precipitation View ────────────────────────────────────────── -->
    <ForecastPrecipitationChart
      v-else
      :forecasts="forecasts"
      :current-time="currentTime"
      @date-change="updateHeaderDate"
    />

    <!-- ── Legend footer ─────────────────────── -->
    <div v-if="activeTab !== 'Presipitasi'" class="px-6 pb-4 flex items-center justify-between flex-wrap gap-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 select-none">
      <div v-if="activeTab !== 'Presipitasi'" class="flex items-center gap-4">
        <!-- If Wind (Angin) tab -->
        <template v-if="activeTab === 'Angin'">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-brand-cyan block"></span>
            <span>Kecepatan Angin</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-4 h-0.5 bg-blue-400 dark:bg-brand-cyan/60 block" style="border-top: 1.5px dashed currentColor"></span>
            <span>Hembusan Angin</span>
          </div>
        </template>
        <!-- Standard legend for Suhu / Kelembapan -->
        <template v-else>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-0.5 rounded-full bg-blue-500 dark:bg-brand-cyan block"></span>
            <span>{{ activeTab }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Droplet class="w-2.5 h-2.5 text-blue-500 dark:text-brand-cyan" />
            <span>Peluang Hujan</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Moon class="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
            <span>Fase Bulan: Sabit Tua</span>
          </div>
        </template>
      </div>
      <div v-else class="flex items-center gap-4">
        <!-- Static placeholders just to align legends in Presipitasi mode -->
        <span class="block"></span>
      </div>
      <div class="flex items-center gap-1.5">
        <Sunrise class="w-2.5 h-2.5 text-amber-400" />
        <span class="text-amber-500 dark:text-amber-400 font-bold">05:51</span>
        <span class="mx-0.5 text-slate-300 dark:text-slate-600">·</span>
        <Sunset class="w-2.5 h-2.5 text-orange-400" />
        <span class="text-orange-500 dark:text-orange-400 font-bold">17:34</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Scoped styles are kept minimal as visual layouts are handled in child components */
</style>

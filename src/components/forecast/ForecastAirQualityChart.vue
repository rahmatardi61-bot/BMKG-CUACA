<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { 
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-vue-next';
import type { HourlyForecast } from '../../types/weather';

const props = defineProps<{
  forecasts: HourlyForecast[];
  currentTime: Date;
}>();

const emit = defineEmits<{
  (e: 'date-change', dateStr: string): void;
}>();

// Selected day and active sub-tabs
const selectedDate = ref('');
const activePollutant = ref<'AQI' | 'O₃' | 'PM 2.5' | 'PM 10' | 'NO₂' | 'CO' | 'SO₂'>('AQI');
const hoveredIndex = ref<number | null>(null);

// Scrollable container ref
const scrollContainer = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

const todayIso = computed(() => {
  const d = props.currentTime;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

// Watch selected date to notify parent container for header date updates
watch(selectedDate, (newVal) => {
  if (!newVal) return;
  const dateStr = new Date(newVal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  emit('date-change', dateStr);
}, { immediate: true });

// Deterministic AQI/pollutant mock generator
const getSlotAqiData = (slot: HourlyForecast) => {
  if (!slot) return { aqi: 0, pm25: 0, pm10: 0, o3: 0, no2: 0, co: 0, so2: 0 };
  const [h] = slot.time.split(':').map(Number);
  
  // Create seed from date string + hour
  const seed = slot.date.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0) + h;
  
  // PM2.5 base: Jakarta is hotter (higher temp), so higher PM2.5. Bandung is cooler, so lower PM2.5.
  const basePm25 = slot.temp > 32 ? 65 : slot.temp > 28 ? 48 : 22;
  const timeFactor = Math.sin((h - 8) * Math.PI / 12) * 15;
  const pm25 = Math.round(Math.max(5, basePm25 + timeFactor + (seed % 10)));
  
  // PM10 is roughly 0.3 * PM2.5 + some base
  const pm10 = Math.round(pm25 * 0.3 + 12 + (seed % 5));
  
  // O3 is higher in high solar radiation hours (midday)
  const o3 = Math.round(Math.max(5, (h >= 9 && h <= 17 ? 40 : 15) + Math.sin((h - 12) * Math.PI / 6) * 12 + (seed % 8)));
  
  // NO2 peaks during rush hours (8 AM and 6 PM)
  const no2 = Math.round(Math.max(2, (h === 8 || h === 18 ? 25 : 8) + (seed % 4)));
  
  // CO is higher with higher traffic (rush hours)
  const co = Math.round(500 + Math.max(100, (h === 8 || h === 18 ? 450 : 250) + (seed % 100)));
  
  // SO2 is generally low
  const so2 = Math.round(4 + (seed % 5));
  
  // Simplified PM2.5 to AQI mapper
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
  
  return { aqi, pm25, pm10, o3, no2, co, so2 };
};

const getAqiCategory = (aqi: number) => {
  if (aqi <= 50) {
    return { 
      text: 'Baik', 
      color: '#10b981', 
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400', 
      progressClass: 'bg-emerald-500' 
    };
  }
  if (aqi <= 100) {
    return { 
      text: 'Sedang', 
      color: '#eab308', 
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400', 
      progressClass: 'bg-amber-500' 
    };
  }
  if (aqi <= 150) {
    return { 
      text: 'Kurang Sehat', 
      color: '#f97316', 
      bg: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400', 
      progressClass: 'bg-orange-500' 
    };
  }
  if (aqi <= 200) {
    return { 
      text: 'Tidak Sehat', 
      color: '#ef4444', 
      bg: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400', 
      progressClass: 'bg-red-500' 
    };
  }
  if (aqi <= 300) {
    return { 
      text: 'Sangat Tidak Sehat', 
      color: '#a855f7', 
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400', 
      progressClass: 'bg-purple-500' 
    };
  }
  return { 
    text: 'Berbahaya', 
    color: '#881337', 
    bg: 'bg-rose-950/20 border-rose-900/30 text-rose-600 dark:text-rose-400', 
    progressClass: 'bg-rose-900' 
  };
};

const getMaxValForPollutant = (p: string) => {
  switch (p) {
    case 'AQI': return 300;
    case 'O₃': return 100;
    case 'PM 2.5': return 150;
    case 'PM 10': return 100;
    case 'NO₂': return 50;
    case 'CO': return 1500;
    case 'SO₂': return 30;
    default: return 300;
  }
};

const getPollutantUnit = (p: string) => {
  if (p === 'O₃' || p === 'NO₂' || p === 'CO' || p === 'SO₂') return 'ppb';
  if (p === 'PM 2.5' || p === 'PM 10') return 'µg/m³';
  return '';
};

// Group slots by calendar date and compute averages
const aqiDayGroups = computed(() => {
  const map = new Map<string, HourlyForecast[]>();
  for (const f of props.forecasts) {
    if (!map.has(f.date)) map.set(f.date, []);
    map.get(f.date)!.push(f);
  }
  return Array.from(map.entries()).map(([date, slots]) => {
    const dataSlots = slots.map(s => getSlotAqiData(s));
    const avgAqi = Math.round(dataSlots.reduce((acc, s) => acc + s.aqi, 0) / dataSlots.length);
    const category = getAqiCategory(avgAqi);
    
    // Find representative current condition PM2.5 for text
    const maxPm25 = Math.max(...dataSlots.map(s => s.pm25));
    
    return { date, slots, avgAqi, category, maxPm25 };
  });
});

// Selected day data
const chartSlots = computed(() => {
  if (!selectedDate.value) return [];
  const daySlots = props.forecasts.filter(f => f.date === selectedDate.value);
  return daySlots.map(s => {
    const values = getSlotAqiData(s);
    return {
      label: s.time,
      values,
      original: s
    };
  });
});

const getActiveValue = (slot: any) => {
  if (!slot) return 0;
  switch (activePollutant.value) {
    case 'AQI': return slot.values.aqi;
    case 'O₃': return slot.values.o3;
    case 'PM 2.5': return slot.values.pm25;
    case 'PM 10': return slot.values.pm10;
    case 'NO₂': return slot.values.no2;
    case 'CO': return slot.values.co;
    case 'SO₂': return slot.values.so2;
    default: return slot.values.aqi;
  }
};

// SVG geometry
const CHART_H = 160;
const CHART_PAD_T = 12;
const CHART_PAD_B = 12;
const INNER_H = CHART_H - CHART_PAD_T - CHART_PAD_B;
const colWidth = 72;
const scrollContentWidth = computed(() => chartSlots.value.length * colWidth);

const getPollutantColor = (p: string) => {
  switch (p) {
    case 'O₃': return '#d97706'; // Rich amber
    case 'PM 2.5': return '#ef4444'; // Red
    case 'PM 10': return '#3b82f6'; // Indigo/blue
    case 'NO₂': return '#a855f7'; // Purple
    case 'CO': return '#10b981'; // Green/emerald
    case 'SO₂': return '#ec4899'; // Pink/rose
    default: return '#3b82f6';
  }
};

const chartPoints = computed(() => {
  const slots = chartSlots.value;
  if (!slots.length) return [];
  const cw = colWidth;
  return slots.map((s, index) => {
    const x = (index + 0.5) * cw;
    const val = getActiveValue(s);
    const y = yPosForVal(val);
    return { x, y, val };
  });
});

const linePath = computed(() => {
  const pts = chartPoints.value;
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = pts[i], n = pts[i + 1];
    const mx = (n.x - c.x) / 2;
    d += ` C ${c.x + mx} ${c.y}, ${n.x - mx} ${n.y}, ${n.x} ${n.y}`;
  }
  return d;
});

const fillPath = computed(() => {
  const pts = chartPoints.value;
  if (pts.length === 0) return '';
  const last = pts[pts.length - 1];
  return `${linePath.value} L ${last.x} ${CHART_H} L ${pts[0].x} ${CHART_H} Z`;
});

const yPosForVal = (val: number) => {
  const max = getMaxValForPollutant(activePollutant.value);
  const ratio = Math.min(1, val / max);
  return CHART_PAD_T + INNER_H * (1 - ratio);
};

const barHeightForVal = (val: number) => {
  const max = getMaxValForPollutant(activePollutant.value);
  const ratio = Math.min(1, val / max);
  return ratio * INNER_H;
};

// SVG path generator for top-rounded bars
const getBarPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rad = Math.min(r, w / 2, h);
  if (rad <= 0) return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  return `M ${x} ${y + rad} Q ${x} ${y} ${x + rad} ${y} L ${x + w - rad} ${y} Q ${x + w} ${y} ${x + w} ${y + rad} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
};

const yGridLabels = computed(() => {
  const max = getMaxValForPollutant(activePollutant.value);
  const step = max / 4;
  return [max, max - step, max - 2 * step, max - 3 * step, 0].map(v => Math.round(v));
});

// Tooltip helpers
const tooltipHalfWidth = 90;
const tooltipLeft = computed(() => {
  const idx = hoveredIndex.value;
  if (idx === null) return 0;
  const cx = (idx + 0.5) * colWidth;
  const chartW = scrollContentWidth.value;
  return Math.max(tooltipHalfWidth, Math.min(chartW - tooltipHalfWidth, cx));
});

const tooltipArrowOffset = computed(() => {
  const idx = hoveredIndex.value;
  if (idx === null) return 0;
  const cx = (idx + 0.5) * colWidth;
  return cx - tooltipLeft.value;
});

const isTooltipFlipped = computed(() => {
  const idx = hoveredIndex.value;
  if (idx === null) return false;
  const slot = chartSlots.value[idx];
  if (!slot) return false;
  const y = yPosForVal(getActiveValue(slot));
  return (y - 12 - 95) < 0;
});

const tooltipTop = computed(() => {
  const idx = hoveredIndex.value;
  if (idx === null) return 0;
  const slot = chartSlots.value[idx];
  if (!slot) return 0;
  const y = yPosForVal(getActiveValue(slot));
  const estimatedHeight = 95;
  
  let top = isTooltipFlipped.value ? (y + 12) : (y - 12 - estimatedHeight);
  if (top + estimatedHeight > CHART_H) {
    top = CHART_H - estimatedHeight;
  }
  if (top < 0) {
    top = 0;
  }
  return top;
});

// Summary text for current day
const activeDaySummary = computed(() => {
  const group = aqiDayGroups.value.find(g => g.date === selectedDate.value);
  if (!group) return '';
  const catText = group.category.text.toLowerCase();
  
  if (group.avgAqi > 150) {
    return `Kualitas udara terpantau ${catText}. Indeks polusi udara meningkat dengan polutan utama terdeteksi adalah PM2.5 konsentrasi maksimal ${group.maxPm25} µg/m³. Direkomendasikan mengenakan masker jika beraktivitas di luar ruangan.`;
  } else if (group.avgAqi > 100) {
    return `Kualitas udara berada pada kategori ${catText} bagi kelompok sensitif. Polutan utama terdeteksi adalah PM2.5 dengan konsentrasi maksimal ${group.maxPm25} µg/m³. Kelompok sensitif harap membatasi kegiatan luar ruangan.`;
  } else if (group.avgAqi > 50) {
    return `Kualitas udara dalam rentang kategori ${catText}. Kondisi udara cukup aman untuk sebagian besar aktivitas luar ruangan. Polutan utama terdeteksi PM2.5 berkisar ${group.maxPm25} µg/m³.`;
  }
  return `Kualitas udara terpantau ${catText} dan sangat segar. Keadaan lingkungan sangat bersih dengan polutan utama PM2.5 di kisaran ${group.maxPm25} µg/m³. Sangat baik untuk beraktivitas luar ruangan.`;
});

const currentHour = computed(() => {
  const h = String(props.currentTime.getHours()).padStart(2, '0');
  return `${h}:00`;
});

const isCurrentHour = (slotLabel: string) =>
  selectedDate.value === todayIso.value && slotLabel === currentHour.value;

const scrollLeftBtn = () => scrollContainer.value?.scrollBy({ left: -colWidth * 3, behavior: 'smooth' });
const scrollRightBtn = () => scrollContainer.value?.scrollBy({ left: colWidth * 3, behavior: 'smooth' });

const scrollLeft = ref(0);

const updateScrollButtons = () => {
  if (!scrollContainer.value) return;
  const { scrollLeft: sL, scrollWidth, clientWidth } = scrollContainer.value;
  scrollLeft.value = sL;
  canScrollLeft.value = sL > 5;
  canScrollRight.value = sL + clientWidth < scrollWidth - 5;
};

const scrollToNow = async () => {
  await nextTick();
  if (!scrollContainer.value) return;
  
  if (selectedDate.value === todayIso.value) {
    const slots = chartSlots.value;
    const currH = currentHour.value;
    const idx = slots.findIndex(s => s.label === currH);
    if (idx !== -1) {
      scrollContainer.value.scrollLeft = Math.max(0, idx * colWidth - 8);
    } else {
      scrollContainer.value.scrollLeft = 0;
    }
  } else {
    scrollContainer.value.scrollLeft = 0;
  }
  updateScrollButtons();
};

watch([selectedDate, activePollutant], scrollToNow);

onMounted(async () => {
  window.addEventListener('resize', updateScrollButtons);
  selectedDate.value = todayIso.value;
  await scrollToNow();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollButtons);
});
</script>

<template>
  <div class="px-5 pb-2 pt-3">
    <!-- Daily summary strip for AQI -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
      <div
        v-for="group in aqiDayGroups"
        :key="group.date"
        @click="selectedDate = group.date"
        class="flex-shrink-0 w-[108px] rounded-2xl p-3 cursor-pointer transition-all duration-200 border select-none text-left flex items-stretch justify-between gap-1"
        :class="selectedDate === group.date
          ? 'bg-blue-500/15 dark:bg-brand-cyan/10 border-blue-400/60 dark:border-brand-cyan/40 shadow-md shadow-blue-500/10'
          : 'bg-slate-50/60 dark:bg-brand-navy-800/30 border-slate-100/60 dark:border-brand-navy-700/30 hover:bg-blue-50/40 dark:hover:bg-brand-navy-800/60'"
      >
        <div class="flex-grow">
          <div class="text-[9px] font-black uppercase tracking-wider mb-0.5"
            :class="selectedDate === group.date ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'"
          >
            {{ new Date(group.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}
          </div>
          <div class="text-sm font-black mb-1"
            :class="selectedDate === group.date ? 'text-blue-600 dark:text-brand-cyan' : 'text-slate-700 dark:text-slate-200'"
          >
            {{ new Date(group.date).getDate() }}
          </div>
          <div class="flex flex-col gap-0.5 mt-1">
            <span class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
              {{ group.avgAqi }}
            </span>
            <span class="text-[9.5px] font-bold mt-1 leading-tight text-slate-500 dark:text-slate-400">
              {{ group.category.text }}
            </span>
          </div>
        </div>
        <div class="flex-shrink-0 w-2.5 flex items-center justify-center">
          <div class="w-1.5 h-16 rounded-full bg-slate-200/50 dark:bg-brand-navy-800/40 relative overflow-hidden">
            <div
              class="absolute w-full rounded-full"
              :class="group.category.progressClass"
              :style="{
                bottom: '0px',
                height: Math.min(100, Math.max(15, (group.avgAqi / 300) * 100)) + '%'
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area: Split layout -->
    <div class="flex flex-col md:flex-row items-stretch gap-6 mb-2">
      <!-- Left Column: Current Conditions text & metrics grid -->
      <div class="flex-shrink-0 w-full md:w-[200px] flex flex-col gap-2 select-none justify-start">
        <!-- Indeks Kualitas Udara (AQI) tab -->
        <button
          @click="activePollutant = 'AQI'"
          class="flex-shrink-0 px-3.5 py-2.5 text-[9.5px] font-black rounded-xl transition-all duration-150 uppercase tracking-wider border cursor-pointer text-left w-full flex items-center justify-between"
          :class="activePollutant === 'AQI'
            ? 'bg-blue-500/15 dark:bg-brand-cyan/10 border-blue-400/60 dark:border-brand-cyan/40 text-blue-600 dark:text-brand-cyan shadow-sm shadow-blue-500/5'
            : 'bg-slate-100/60 dark:bg-brand-navy-900/60 border-transparent hover:bg-slate-200/50 dark:hover:bg-brand-navy-800/50 text-slate-600 dark:text-slate-300'"
        >
          <span>Indeks Kualitas Udara</span>
          <span v-if="activePollutant === 'AQI'" class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan hidden md:block"></span>
        </button>

        <!-- Other Pollutants (2 Rows of 3 Columns) -->
        <div class="grid grid-cols-3 gap-1.5 w-full">
          <button
            v-for="p in ['O₃', 'PM 2.5', 'PM 10', 'NO₂', 'CO', 'SO₂']"
            :key="p"
            @click="activePollutant = p as any"
            class="flex-shrink-0 px-2 py-2.5 text-[9.5px] font-black rounded-xl transition-all duration-150 uppercase tracking-wider border cursor-pointer text-center flex items-center justify-center"
            :class="activePollutant === p
              ? 'bg-blue-500/15 dark:bg-brand-cyan/10 border-blue-400/60 dark:border-brand-cyan/40 text-blue-600 dark:text-brand-cyan shadow-sm shadow-blue-500/5'
              : 'bg-slate-100/60 dark:bg-brand-navy-900/60 border-transparent hover:bg-slate-200/50 dark:hover:bg-brand-navy-800/50 text-slate-600 dark:text-slate-300'"
          >
            {{ p }}
          </button>
        </div>
      </div>

      <!-- Right Column: Interactive Chart Area -->
      <div class="flex-grow flex flex-col justify-between overflow-hidden relative">
        <div class="relative py-2">
          <!-- Left scroll arrow -->
          <button
            v-if="canScrollLeft"
            @click="scrollLeftBtn"
            class="absolute left-1 top-1/2 -translate-y-1/2 z-40 p-2 rounded-xl bg-white/90 dark:bg-brand-navy-900/90 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-brand-navy-700/40 shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- Right scroll arrow -->
          <button
            v-if="canScrollRight"
            @click="scrollRightBtn"
            class="absolute right-1 top-1/2 -translate-y-1/2 z-40 p-2 rounded-xl bg-white/90 dark:bg-brand-navy-900/90 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-brand-navy-700/40 shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <!-- Tooltip overlay (moved outside scroll container) -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="hoveredIndex !== null"
              class="pointer-events-none absolute z-30 transform -translate-x-1/2"
              :style="{
                left: (32 + tooltipLeft - scrollLeft) + 'px',
                top: (tooltipTop + 38) + 'px',
              }"
            >
              <div class="relative px-3 py-2.5 rounded-xl shadow-lg border text-left min-w-[180px]
                bg-white/95 border-slate-100/80 shadow-slate-200/60
                dark:bg-brand-navy-900/95 dark:border-brand-navy-700/60 dark:shadow-brand-navy-950/80
                backdrop-blur-md"
              >
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                  Pukul {{ chartSlots[hoveredIndex]?.label }}
                </div>
                <div class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <span class="font-bold">{{ activePollutant }}:</span>
                  <span class="font-black text-blue-600 dark:text-brand-cyan">
                    {{ getActiveValue(chartSlots[hoveredIndex]) }} {{ getPollutantUnit(activePollutant) }}
                  </span>
                </div>
                <div class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <span class="font-bold">Kategori:</span>
                  <span class="font-bold" :style="{ color: getAqiCategory(chartSlots[hoveredIndex]?.values.aqi).color }">
                    {{ getAqiCategory(chartSlots[hoveredIndex]?.values.aqi).text }}
                  </span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span class="font-semibold text-[9px]">PM2.5:</span>
                  <span class="font-bold text-[9px]">{{ chartSlots[hoveredIndex]?.values.pm25 }} µg/m³</span>
                </div>

                <!-- Bottom Arrow -->
                <div
                  v-if="!isTooltipFlipped"
                  class="absolute bottom-0 translate-y-full w-0 h-0
                    border-l-[5px] border-l-transparent
                    border-r-[5px] border-r-transparent
                    border-t-[5px]
                    border-t-white/95 dark:border-t-brand-navy-900"
                  :style="{
                    left: `calc(50% + ${tooltipArrowOffset}px)`,
                    transform: 'translateX(-50%)'
                  }"
                />

                <!-- Top Arrow -->
                <div
                  v-else
                  class="absolute top-0 -translate-y-full w-0 h-0
                    border-l-[5px] border-l-transparent
                    border-r-[5px] border-r-transparent
                    border-b-[5px]
                    border-b-white/95 dark:border-b-brand-navy-900"
                  :style="{
                    left: `calc(50% + ${tooltipArrowOffset}px)`,
                    transform: 'translateX(-50%)'
                  }"
                />
              </div>
            </div>
          </Transition>

          <div class="flex items-stretch">
            <!-- Static Y-axis labels -->
            <div class="flex-shrink-0 w-8 flex flex-col justify-between pb-[24px] pt-[38px] select-none pr-1.5">
              <span 
                v-for="lbl in yGridLabels" 
                :key="lbl" 
                class="text-[8.5px] text-right text-slate-400 dark:text-slate-500 font-bold leading-none"
              >
                {{ lbl }}
              </span>
            </div>

            <!-- Horizontal scroll container (with overflow-y-hidden) -->
            <div
              ref="scrollContainer"
              class="flex-grow overflow-x-auto overflow-y-hidden no-scrollbar relative min-w-0"
              @scroll="updateScrollButtons"
            >
              <div :style="{ width: scrollContentWidth + 'px' }" class="relative">
                <!-- Row 1: Time labels -->
                <div class="flex" style="height: 22px;">
                  <div
                    v-for="(s, i) in chartSlots"
                    :key="'t-' + i"
                    class="flex-shrink-0 flex items-center justify-center relative"
                    :style="{ width: colWidth + 'px' }"
                    @mouseenter="hoveredIndex = i"
                    @mouseleave="hoveredIndex = null"
                  >
                    <span
                      v-if="isCurrentHour(s.label)"
                      class="text-[9px] leading-none font-black px-1.5 py-0.5 rounded-full bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950 whitespace-nowrap"
                    >Sekarang</span>
                    <span
                      v-else
                      :class="[
                        'text-[10px] leading-none transition-all duration-150',
                        hoveredIndex === i ? 'text-blue-500 dark:text-brand-cyan font-semibold' : 'text-slate-400 dark:text-slate-500/80 font-medium'
                      ]"
                    >{{ s.label }}</span>
                  </div>
                </div>

                <!-- Row 2: Bar Graph -->
                <div class="relative" :style="{ height: CHART_H + 'px' }">
                  <!-- Mouse capture layer for each column -->
                  <div class="absolute inset-0 flex pointer-events-auto z-20">
                    <div
                      v-for="(_, i) in chartSlots"
                      :key="'hover-' + i"
                      class="flex-shrink-0 h-full cursor-pointer"
                      :style="{ width: colWidth + 'px' }"
                      @mouseenter="hoveredIndex = i"
                      @mouseleave="hoveredIndex = null"
                    ></div>
                  </div>

                  <svg
                    class="absolute inset-0 w-full overflow-visible pointer-events-none"
                    :viewBox="`0 0 ${scrollContentWidth} ${CHART_H}`"
                    :height="CHART_H"
                  >
                    <defs>
                      <linearGradient id="pollutantFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" :stop-color="getPollutantColor(activePollutant)" stop-opacity="0.25" />
                        <stop offset="100%" :stop-color="getPollutantColor(activePollutant)" stop-opacity="0.00" />
                      </linearGradient>
                      <filter id="pollutantGlow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>

                    <!-- Horizontal dotted grid lines -->
                    <line
                      v-for="val in yGridLabels" :key="val"
                      x1="0" :x2="scrollContentWidth"
                      :y1="yPosForVal(val)" :y2="yPosForVal(val)"
                      stroke="currentColor"
                      class="text-slate-200 dark:text-slate-700/50"
                      stroke-dasharray="3 4"
                      stroke-width="0.75"
                    />

                    <!-- Render bars only when AQI is active -->
                    <template v-if="activePollutant === 'AQI'">
                      <g v-for="(slot, i) in chartSlots" :key="'bar-' + i">
                        <!-- Base bar shadow / transparent container -->
                        <rect
                          :x="i * colWidth + colWidth * 0.18 + 1"
                          :y="yPosForVal(getActiveValue(slot)) + 1"
                          :width="colWidth * 0.64"
                          :height="barHeightForVal(getActiveValue(slot))"
                          rx="6"
                          fill="currentColor"
                          class="text-blue-500/5 dark:text-brand-cyan/5"
                        />
                        <!-- Colored Bar -->
                        <path
                          :d="getBarPath(
                            i * colWidth + colWidth * 0.18,
                            yPosForVal(getActiveValue(slot)),
                            colWidth * 0.64,
                            barHeightForVal(getActiveValue(slot)),
                            6
                          )"
                          :fill="getAqiCategory(slot.values.aqi).color"
                          :fill-opacity="hoveredIndex === i ? 1.0 : 0.85"
                          class="transition-all duration-150"
                        />
                      </g>
                    </template>

                    <!-- Render smooth curved line chart when other pollutants are active -->
                    <template v-else>
                      <!-- Gradient Area Fill -->
                      <path
                        :d="fillPath"
                        fill="url(#pollutantFill)"
                        class="transition-all duration-150"
                      />
                      <!-- Bezier Curved Line -->
                      <path
                        :d="linePath"
                        fill="none"
                        :stroke="getPollutantColor(activePollutant)"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        filter="url(#pollutantGlow)"
                        class="transition-all duration-150"
                      />
                      <!-- Hover Indicator Dot -->
                      <circle
                        v-if="hoveredIndex !== null && chartPoints[hoveredIndex]"
                        :cx="chartPoints[hoveredIndex].x"
                        :cy="chartPoints[hoveredIndex].y"
                        r="5.5"
                        :fill="getPollutantColor(activePollutant)"
                        stroke="white"
                        stroke-width="1.75"
                        class="transition-all duration-75"
                      />
                    </template>

                    <!-- Vertical dashed hover indicator -->
                    <line
                      v-if="hoveredIndex !== null && chartSlots[hoveredIndex]"
                      :x1="(hoveredIndex + 0.5) * colWidth"
                      :x2="(hoveredIndex + 0.5) * colWidth"
                      y1="0" :y2="CHART_H"
                      stroke="currentColor"
                      class="text-blue-400/50 dark:text-brand-cyan/40"
                      stroke-dasharray="3 4"
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend Footer for Air Quality Index or Pollutant Line Chart -->
    <div class="flex items-center justify-between flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100/40 dark:border-brand-navy-800/30 text-[9px] font-bold text-slate-400 dark:text-slate-500 select-none">
      <div v-if="activePollutant === 'AQI'" class="flex items-center flex-wrap gap-x-4 gap-y-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#10b981] block"></span>
          <span>Baik</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#eab308] block"></span>
          <span>Sedang</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#f97316] block"></span>
          <span class="whitespace-nowrap">Kurang Sehat</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#ef4444] block"></span>
          <span>Tidak Sehat</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#a855f7] block"></span>
          <span class="whitespace-nowrap">Sangat Tidak Sehat</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#881337] block"></span>
          <span>Berbahaya</span>
        </div>
      </div>
      <div v-else class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full block animate-fade-in" :style="{ backgroundColor: getPollutantColor(activePollutant) }"></span>
        <span class="text-slate-700 dark:text-slate-300 font-bold text-[10px] animate-fade-in">{{ activePollutant }}</span>
      </div>
      <div class="text-[8.5px] font-semibold text-slate-400">Unit: ppb / µg/m³ (mikrogram per meter kubik)</div>
    </div>

    <!-- Detailed Conditions Card (Moved below Legend Footer) -->
    <div class="mt-4 bg-slate-50/50 dark:bg-brand-navy-800/20 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 flex flex-col gap-4">
      <!-- Description Section -->
      <div>
        <div class="flex items-center gap-1.5 mb-2">
          <Info class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan" />
          <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300">Kondisi Kualitas Udara</h4>
        </div>
        <p class="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
          {{ activeDaySummary }}
        </p>
      </div>

      <!-- Pollutant Metrics Section (Stacked below description with top border divider) -->
      <div class="border-t border-slate-100/40 dark:border-brand-navy-800/30 pt-3">
        <div class="text-[9.5px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2.5">
          Polutan Utama saat ini: PM2.5 {{ chartSlots[0]?.values.pm25 ?? 68 }} µg/m³
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] text-slate-600 dark:text-slate-300">
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">O₃</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5">{{ chartSlots[0]?.values.o3 ?? 24 }} ppb</div>
          </div>
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">PM 2.5</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5 text-blue-600 dark:text-brand-cyan">{{ chartSlots[0]?.values.pm25 ?? 67.9 }} µg/m³</div>
          </div>
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">PM 10</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5">{{ chartSlots[0]?.values.pm10 ?? 19.5 }} µg/m³</div>
          </div>
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">NO₂</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5">{{ chartSlots[0]?.values.no2 ?? 9 }} ppb</div>
          </div>
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">CO</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5">{{ chartSlots[0]?.values.co ?? 831 }} ppb</div>
          </div>
          <div class="bg-white/50 dark:bg-brand-navy-900/30 border border-slate-100/30 dark:border-brand-navy-700/10 rounded-xl p-2 select-none transition-colors hover:bg-white/80 dark:hover:bg-brand-navy-900/50">
            <div class="font-bold text-[8.5px] text-slate-400 dark:text-slate-500">SO₂</div>
            <div class="font-black text-slate-700 dark:text-slate-200 mt-0.5">{{ chartSlots[0]?.values.so2 ?? 7 }} ppb</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

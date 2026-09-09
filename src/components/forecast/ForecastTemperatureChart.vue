<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { 
  Sun, 
  SunDim,
  CloudSun, 
  Cloud, 
  Cloudy,
  CloudRain, 
  CloudLightning,
  Moon,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Sunrise,
  Sunset,
  Navigation
} from 'lucide-vue-next';
import type { HourlyForecast } from '../../types/weather';

const props = defineProps<{
  forecasts: HourlyForecast[];
  activeTab: string;
  currentTime: Date;
}>();

const emit = defineEmits<{
  (e: 'date-change', dateStr: string): void;
}>();

// Base states
const selectedDate = ref('');
const tempInterval = ref<'1j' | '3j' | '6j'>('1j'); // Default to 1j (hourly) since controls are removed
const hoveredIndex = ref<number | null>(null);
const isScrolling = ref(false);
const setHoveredIndex = (idx: number | null) => {
  if (isScrolling.value) return;
  hoveredIndex.value = idx;
};
const showWindGust = ref(true);

// Scrollable container ref
const scrollContainer = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

// Today ISO date YYYY-MM-DD
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

// Wind specific helpers and states
const getWindAngle = (timeStr: string) => {
  const [h] = timeStr.split(':').map(Number);
  const baseAngle = 45;
  const offset = Math.sin(h * 0.5) * 60;
  return Math.round(baseAngle + offset);
};

const getGustVal = (slot: any) => {
  if (!slot) return 0;
  const baseSpeed = slot.val !== undefined ? slot.val : 0;
  const h = parseInt(slot.label?.split(':')[0] || '0') || 0;
  const gustFactor = 1.35 + 0.25 * Math.sin(h * 0.4);
  return Math.round(baseSpeed * gustFactor + 2);
};
// Group forecast slots by calendar date
const tempDayGroups = computed(() => {
  const map = new Map<string, HourlyForecast[]>();
  for (const f of props.forecasts) {
    if (!map.has(f.date)) map.set(f.date, []);
    map.get(f.date)!.push(f);
  }
  return Array.from(map.entries()).map(([date, slots]) => {
    let temps = slots.map(s => s.temp);
    if (props.activeTab === 'Angin') {
      temps = slots.map(s => s.windSpeed ?? 0);
    } else if (props.activeTab === 'Kelembapan') {
      temps = slots.map(s => s.humidity ?? 0);
    }
    const maxVal = Math.max(...temps);
    const minVal = Math.min(...temps);
    const maxProb = Math.max(...slots.map(s => s.precipitation ?? 0));
    
    // peak 3-hourly bar/dot for thumbnail sparkline
    const spark = [] as number[];
    for (let i = 0; i < slots.length; i += 3) {
      const chunk = slots.slice(i, i + 3);
      let vals = chunk.map(s => s.temp);
      if (props.activeTab === 'Angin') {
        vals = chunk.map(s => s.windSpeed ?? 0);
      } else if (props.activeTab === 'Kelembapan') {
        vals = chunk.map(s => s.humidity ?? 0);
      }
      spark.push(Math.max(...vals));
    }
    return { date, slots, maxVal, minVal, maxProb, spark };
  });
});

// Slots for the selected day filtered by time interval
const chartSlots = computed(() => {
  if (!selectedDate.value) return [];
  const daySlots = props.forecasts.filter(f => f.date === selectedDate.value);
  if (!daySlots.length) return [];
  
  const n = tempInterval.value === '1j' ? 1 : tempInterval.value === '3j' ? 3 : 6;
  if (n === 1) {
    return daySlots.map(s => ({
      label: s.time,
      val: props.activeTab === 'Angin' ? (s.windSpeed ?? 0) : props.activeTab === 'Kelembapan' ? (s.humidity ?? 0) : s.temp,
      status: s.status,
      icon: s.icon,
      prob: s.precipitation ?? 0,
      original: s
    }));
  }
  
  const grouped = [];
  for (let i = 0; i < daySlots.length; i += n) {
    const chunk = daySlots.slice(i, i + n);
    let val = 0;
    if (props.activeTab === 'Angin') {
      val = Math.max(...chunk.map(s => s.windSpeed ?? 0));
    } else if (props.activeTab === 'Kelembapan') {
      val = Math.max(...chunk.map(s => s.humidity ?? 0));
    } else {
      val = Math.max(...chunk.map(s => s.temp));
    }
    
    const midIdx = Math.floor(chunk.length / 2);
    const representative = chunk[midIdx];
    
    grouped.push({
      label: chunk[0].time,
      val,
      status: representative.status,
      icon: representative.icon,
      prob: Math.max(...chunk.map(s => s.precipitation ?? 0)),
      original: representative
    });
  }
  return grouped;
});

// Chart geometry constants
const CHART_H = 160;
const CHART_PAD_T = 14;
const CHART_PAD_B = 14;

const tempMaxVal = computed(() => {
  let vals = chartSlots.value.map(s => s.val);
  if (props.activeTab === 'Angin' && showWindGust.value) {
    const gustVals = chartSlots.value.map(s => getGustVal(s));
    vals = [...vals, ...gustVals];
  }
  const max = Math.max(...vals, 1);
  return props.activeTab === 'Angin' ? Math.max(max, 30) : props.activeTab === 'Kelembapan' ? 100 : Math.max(max, 40);
});

const tempMinVal = computed(() => {
  const vals = chartSlots.value.map(s => s.val);
  const min = Math.min(...vals, 0);
  return props.activeTab === 'Angin' ? 0 : props.activeTab === 'Kelembapan' ? 0 : Math.min(min, 10);
});

const yPosForVal = (val: number) => {
  const activeH = CHART_H - CHART_PAD_T - CHART_PAD_B;
  const min = tempMinVal.value;
  const max = tempMaxVal.value;
  const ratio = max === min ? 0.5 : (val - min) / (max - min);
  return CHART_PAD_T + activeH * (1 - ratio);
};

const colWidth = 72; // Lock to 72 width since controls are removed (1j hourly is constant)

const scrollContentWidth = computed(() => chartSlots.value.length * colWidth);

const chartPoints = computed(() => {
  const slots = chartSlots.value;
  if (!slots.length) return [];
  const cw = colWidth;
  return slots.map((s, index) => {
    const x = (index + 0.5) * cw;
    const y = yPosForVal(s.val);
    return { x, y, val: s.val, original: s.original };
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

const gustPoints = computed(() => {
  if (props.activeTab !== 'Angin' || !showWindGust.value) return [];
  const slots = chartSlots.value;
  const cw = colWidth;
  return slots.map((s, index) => {
    const x = (index + 0.5) * cw;
    const gustVal = getGustVal(s);
    const y = yPosForVal(gustVal);
    return { x, y, val: gustVal };
  });
});

const gustLinePath = computed(() => {
  const pts = gustPoints.value;
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = pts[i], n = pts[i + 1];
    const mx = (n.x - c.x) / 2;
    d += ` C ${c.x + mx} ${c.y}, ${n.x - mx} ${n.y}, ${n.x} ${n.y}`;
  }
  return d;
});

const yLabelsForTab = computed(() => {
  const min = tempMinVal.value;
  const max = tempMaxVal.value;
  const step = (max - min) / 3;
  return [
    max,
    max - step,
    max - 2 * step,
    min
  ].map(v => Math.round(v));
});

const getLabelSuffix = (val: number) => {
  if (props.activeTab === 'Angin') return `${val} km/j`;
  if (props.activeTab === 'Kelembapan') return `${val}%`;
  return `${val}°`;
};

const getSlotValue = (val: number) => {
  if (props.activeTab === 'Angin') {
    return `${val} km/j`;
  }
  if (props.activeTab === 'Kelembapan') {
    return `${val}%`;
  }
  return `${val}°C`;
};

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sun': return Sun;
    case 'SunDim': return SunDim;
    case 'CloudSun': return CloudSun;
    case 'Cloudy': return Cloudy;
    case 'CloudRain': return CloudRain;
    case 'CloudLightning': return CloudLightning;
    case 'Moon': return Moon;
    default: return Cloud;
  }
};

const getIconColor = (iconName: string, isHovered: boolean) => {
  switch (iconName) {
    case 'Sun':            return isHovered ? 'text-amber-400 dark:text-amber-300 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'text-amber-500 dark:text-amber-400';
    case 'SunDim':         return isHovered ? 'text-amber-400/95 dark:text-amber-300/95 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'text-amber-500/90 dark:text-amber-400/90';
    case 'CloudSun':       return isHovered ? 'text-sky-400 dark:text-sky-300 filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]' : 'text-sky-500 dark:text-sky-400';
    case 'Cloudy':         return isHovered ? 'text-slate-350 dark:text-slate-200 filter drop-shadow-[0_0_4px_rgba(148,163,184,0.5)]' : 'text-slate-400 dark:text-slate-500';
    case 'CloudRain':      return isHovered ? 'text-blue-400 dark:text-blue-300 filter drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]' : 'text-blue-500 dark:text-blue-400';
    case 'CloudLightning': return isHovered ? 'text-purple-400 dark:text-purple-300 filter drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]' : 'text-purple-500 dark:text-purple-400';
    case 'Moon':           return isHovered ? 'text-indigo-300 dark:text-indigo-200 filter drop-shadow-[0_0_4px_rgba(129,140,248,0.5)]' : 'text-indigo-400 dark:text-indigo-300';
    default:               return isHovered ? 'text-slate-350 dark:text-slate-200 filter drop-shadow-[0_0_4px_rgba(148,163,184,0.5)]' : 'text-slate-400 dark:text-slate-500';
  }
};

const getIconGlassStyle = (iconName: string, isHovered: boolean) => {
  const base = 'w-8 h-8 rounded-[4px] flex items-center justify-center transition-all duration-300 backdrop-blur-[6px] border shadow-[0_2px_8px_rgba(0,0,0,0.03),_inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.05)]';
  
  if (isHovered) {
    switch (iconName) {
      case 'Sun':
        return `${base} scale-110 bg-amber-500/20 border-amber-400/40 shadow-amber-500/10 dark:bg-amber-400/20 dark:border-amber-400/30`;
      case 'SunDim':
        return `${base} scale-110 bg-orange-500/20 border-orange-400/40 shadow-orange-500/10 dark:bg-orange-450/20 dark:border-orange-450/30`;
      case 'CloudSun':
        return `${base} scale-110 bg-sky-500/20 border-sky-400/40 shadow-sky-500/10 dark:bg-sky-400/20 dark:border-sky-400/30`;
      case 'Cloudy':
        return `${base} scale-110 bg-slate-500/20 border-slate-400/40 shadow-slate-500/10 dark:bg-slate-500/20 dark:border-slate-500/30`;
      case 'CloudRain':
        return `${base} scale-110 bg-blue-500/20 border-blue-400/40 shadow-blue-500/10 dark:bg-blue-400/20 dark:border-blue-400/30`;
      case 'CloudLightning':
        return `${base} scale-110 bg-purple-500/20 border-purple-400/40 shadow-purple-500/10 dark:bg-purple-400/20 dark:border-purple-400/30`;
      case 'Moon':
        return `${base} scale-110 bg-indigo-500/20 border-indigo-400/40 shadow-indigo-500/10 dark:bg-indigo-400/20 dark:border-indigo-400/30`;
      default:
        return `${base} scale-110 bg-slate-500/20 border-slate-400/40 shadow-slate-500/10 dark:bg-slate-500/20 dark:border-slate-500/30`;
    }
  }

  // Not hovered states
  switch (iconName) {
    case 'Sun':
      return `${base} bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/15 dark:from-amber-400/10 dark:to-yellow-500/5 dark:border-amber-400/15`;
    case 'SunDim':
      return `${base} bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/15 dark:from-orange-450/10 dark:to-amber-500/5 dark:border-orange-450/15`;
    case 'CloudSun':
      return `${base} bg-gradient-to-br from-sky-450/10 to-amber-200/5 border-sky-400/15 dark:from-sky-400/10 dark:to-amber-500/5 dark:border-sky-400/15`;
    case 'Cloudy':
      return `${base} bg-gradient-to-br from-slate-400/10 to-zinc-500/5 border-slate-400/15 dark:from-slate-500/10 dark:to-zinc-600/5 dark:border-slate-500/15`;
    case 'CloudRain':
      return `${base} bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15 dark:from-blue-400/10 dark:to-cyan-500/5 dark:border-blue-400/15`;
    case 'CloudLightning':
      return `${base} bg-gradient-to-br from-purple-500/10 to-indigo-600/5 border-purple-500/15 dark:from-purple-400/10 dark:to-indigo-650/5 dark:border-purple-400/15`;
    case 'Moon':
      return `${base} bg-gradient-to-br from-indigo-400/10 to-slate-900/5 border-indigo-400/15 dark:from-indigo-300/10 dark:to-brand-navy-950/5 dark:border-indigo-300/15`;
    default:
      return `${base} bg-gradient-to-br from-slate-400/10 to-slate-500/5 border-slate-400/15 dark:from-slate-500/10 dark:to-slate-650/5 dark:border-slate-500/15`;
  }
};

const currentHour = computed(() => {
  const h = String(props.currentTime.getHours()).padStart(2, '0');
  return `${h}:00`;
});

const isCurrentHour = (slotLabel: string) =>
  selectedDate.value === todayIso.value && slotLabel === currentHour.value;

const scrollLeftBtn = () => scrollContainer.value?.scrollBy({ left: -colWidth * 3, behavior: 'smooth' });
const scrollRightBtn = () => scrollContainer.value?.scrollBy({ left: colWidth * 3, behavior: 'smooth' });

const updateScrollButtons = () => {
  if (!scrollContainer.value) return;
  const { scrollLeft: sL, scrollWidth, clientWidth } = scrollContainer.value;
  canScrollLeft.value = sL > 5;
  canScrollRight.value = sL + clientWidth < scrollWidth - 5;
};

let scrollTimeout: number | any = null;
const onScroll = () => {
  updateScrollButtons();
  isScrolling.value = true;
  hoveredIndex.value = null; // hide active tooltip immediately to avoid lag
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false;
  }, 150);
};

// Scroll to current hour when date or tab changes
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

watch([selectedDate, () => props.activeTab], scrollToNow);



// Tooltip positioning computations
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
  const pt = chartPoints.value[idx];
  if (!pt) return false;
  return (pt.y - 12 - 95) < 0;
});

const tooltipTop = computed(() => {
  const idx = hoveredIndex.value;
  if (idx === null) return 0;
  const pt = chartPoints.value[idx];
  if (!pt) return 0;
  const y = pt.y;
  const estimatedHeight = 95;
  
  let top = isTooltipFlipped.value ? (y + 12) : (y - 12 - estimatedHeight);
  
  // Clamp boundaries
  if (top + estimatedHeight > CHART_H) {
    top = CHART_H - estimatedHeight;
  }
  if (top < 0) {
    top = 0;
  }
  return top;
});

onMounted(async () => {
  window.addEventListener('resize', updateScrollButtons);
  selectedDate.value = todayIso.value;
  await scrollToNow();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollButtons);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});
</script>

<template>
  <div class="px-5 pb-2 pt-3">
    <!-- Daily summary strip -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-0">
      <div
        v-for="group in tempDayGroups"
        :key="group.date"
        @click="selectedDate = group.date"
        class="flex-shrink-0 w-[108px] rounded-[4px] p-3 cursor-pointer transition-all duration-200 border select-none text-left"
        :class="selectedDate === group.date
          ? 'bg-blue-500/15 dark:bg-brand-cyan/10 border-blue-400/60 dark:border-brand-cyan/40 shadow-md shadow-blue-500/10'
          : 'bg-slate-50/60 dark:bg-brand-navy-800/30 border-slate-100/60 dark:border-brand-navy-700/30 hover:bg-blue-50/40 dark:hover:bg-brand-navy-800/60'"
      >
        <!-- If not wind (Angin) tab -->
        <div v-if="activeTab !== 'Angin'">
          <div class="text-[9px] font-black uppercase tracking-wider mb-0.5"
            :class="selectedDate === group.date ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'"
          >
            {{ new Date(group.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}
          </div>
          <div class="text-sm font-black mb-1.5"
            :class="selectedDate === group.date ? 'text-blue-600 dark:text-brand-cyan' : 'text-slate-700 dark:text-slate-200'"
          >
            {{ new Date(group.date).getDate() }}
          </div>
          <div class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
            <template v-if="activeTab === 'Kelembapan'">
              {{ group.maxVal }}<span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">%</span>
            </template>
            <template v-else>
              {{ group.maxVal }}° <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">/ {{ group.minVal }}°</span>
            </template>
          </div>
          <div class="flex items-center gap-1 mt-1">
            <Droplet class="w-2.5 h-2.5 text-blue-400 dark:text-brand-cyan" />
            <span class="text-[10px] font-bold"
              :class="selectedDate === group.date ? 'text-blue-600 dark:text-brand-cyan' : 'text-slate-500 dark:text-slate-400'"
            >{{ group.maxProb }}%</span>
          </div>
        </div>
        <!-- If wind (Angin) tab -->
        <div v-else class="w-full text-left">
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
              {{ group.maxVal }} <span class="text-[8px] font-semibold text-slate-400 dark:text-slate-500">km/j</span>
            </span>
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none">
              {{ group.minVal }} <span class="text-[8px] font-medium">km/j</span>
            </span>
            <span class="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-none whitespace-nowrap">
              Hembusan: {{ Math.round(group.maxVal * 1.5 + 2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls row (only for wind tab) -->
    <div v-if="activeTab === 'Angin'" class="flex items-center justify-between px-1 mb-3">
      <span class="text-sm font-black text-slate-800 dark:text-slate-100">Angin</span>
      <button
        @click="showWindGust = !showWindGust"
        class="flex items-center gap-2 text-[10px] font-semibold transition-colors select-none"
        :class="showWindGust ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'"
      >
        <span class="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Hembusan Angin</span>
        <div
          class="relative w-8 h-4 rounded-full transition-colors duration-200"
          :class="showWindGust ? 'bg-blue-500 dark:bg-brand-cyan' : 'bg-slate-200 dark:bg-brand-navy-800'"
        >
          <div
            class="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200 shadow-sm"
            :class="showWindGust ? 'right-0.5' : 'left-0.5'"
          />
        </div>
      </button>
    </div>

    <!-- Scrollable content area with arrows -->
    <div class="relative py-2">
      <!-- Left scroll arrow -->
      <button
        v-if="canScrollLeft"
        @click="scrollLeftBtn"
        class="absolute left-1 top-1/2 -translate-y-1/2 z-40 p-2 rounded-[4px] bg-white/90 dark:bg-brand-navy-900/90 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-brand-navy-700/40 shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Right scroll arrow -->
      <button
        v-if="canScrollRight"
        @click="scrollRightBtn"
        class="absolute right-1 top-1/2 -translate-y-1/2 z-40 p-2 rounded-[4px] bg-white/90 dark:bg-brand-navy-900/90 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-brand-navy-700/40 shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none cursor-pointer"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <div class="flex items-stretch">
        <!-- Static Y-axis labels -->
        <div 
          class="flex-shrink-0 w-8 flex flex-col justify-between pb-[24px] select-none pr-1.5"
          :class="activeTab === 'Angin' ? 'pt-[44px]' : 'pt-[68px]'"
        >
          <span 
            v-for="lbl in yLabelsForTab" 
            :key="lbl" 
            class="text-[9px] text-right text-slate-400 dark:text-slate-500 font-bold leading-none"
          >
            {{ getLabelSuffix(lbl) }}
          </span>
        </div>

        <!-- Horizontal scroll container -->
        <div
          ref="scrollContainer"
          class="flex-grow overflow-x-auto overflow-y-hidden no-scrollbar relative will-change-scroll min-w-0"
          @scroll="onScroll"
        >
          <!-- Tooltip overlay -->
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
              class="pointer-events-none absolute z-30 transform -translate-x-1/2 transform-gpu"
              :style="{
                left: tooltipLeft + 'px',
                top: (tooltipTop + (activeTab === 'Angin' ? 44 : 68)) + 'px',
              }"
              style="will-change: transform;"
            >
              <div class="relative px-3 py-2.5 rounded-[4px] shadow-lg border text-left min-w-[180px]
                bg-white/95 border-slate-100/80 shadow-slate-200/60
                dark:bg-brand-navy-900/95 dark:border-brand-navy-700/60 dark:shadow-brand-navy-950/80
                backdrop-blur-md"
              >
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                  Pukul {{ chartSlots[hoveredIndex]?.label }}
                </div>
                <div class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <span class="font-bold">{{ activeTab === 'Angin' ? 'Kecepatan' : activeTab }}:</span>
                  <span class="font-black text-blue-600 dark:text-brand-cyan">{{ getSlotValue(chartSlots[hoveredIndex]?.val) }}</span>
                </div>
                <div v-if="activeTab === 'Angin' && showWindGust" class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <span class="font-bold">Hembusan:</span>
                  <span class="font-black text-blue-500 dark:text-brand-cyan">{{ getGustVal(chartSlots[hoveredIndex]) }} km/j</span>
                </div>
                <div class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <span class="font-bold">Kondisi:</span>
                  <span>{{ chartSlots[hoveredIndex]?.status }}</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span class="font-semibold text-[9px]">Peluang Hujan:</span>
                  <span class="font-bold text-[9px]" :class="chartSlots[hoveredIndex]?.prob > 0 ? 'text-blue-500 dark:text-brand-cyan' : ''">{{ chartSlots[hoveredIndex]?.prob ?? 0 }}%</span>
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

          <div 
            :style="{ width: scrollContentWidth + 'px' }" 
            class="relative transform-gpu"
            style="will-change: transform; backface-visibility: hidden;"
          >
            <!-- Row 1: Time labels -->
            <div class="flex" style="height: 22px;">
              <div
                v-for="(s, i) in chartSlots"
                :key="'t-' + i"
                class="flex-shrink-0 flex items-center justify-center relative"
                :style="{ width: colWidth + 'px' }"
                @mouseenter="setHoveredIndex(i)"
                @mouseleave="setHoveredIndex(null)"
              >
                <span
                  v-if="isCurrentHour(s.label)"
                  class="text-[9px] leading-none font-black px-1.5 py-0.5 rounded-full bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950 whitespace-nowrap"
                >Sekarang</span>
                <span
                  v-else
                  :class="[
                    'text-[10px] leading-none transition-colors duration-150',
                    hoveredIndex === i ? 'text-blue-500 dark:text-brand-cyan font-semibold' : 'text-slate-800 dark:text-slate-200 font-bold'
                  ]"
                >{{ s.label }}</span>
              </div>
            </div>

            <!-- Row 1.5: Wind Direction Arrows (only for Angin tab) -->
            <div v-if="activeTab === 'Angin'" class="flex animate-fade-in" style="height: 22px;">
              <div
                v-for="(s, i) in chartSlots"
                :key="'dir-' + i"
                class="flex-shrink-0 flex items-center justify-center"
                :style="{ width: colWidth + 'px' }"
                @mouseenter="setHoveredIndex(i)"
                @mouseleave="setHoveredIndex(null)"
              >
                <Navigation
                  class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan/90 transition-transform duration-300"
                  :style="{ transform: `rotate(${getWindAngle(s.label)}deg)` }"
                />
              </div>
            </div>

            <!-- Row 2: Icon + Status -->
            <div v-if="activeTab !== 'Angin'" class="flex" style="height: 52px;">
              <div
                v-for="(s, i) in chartSlots"
                :key="'ic-' + i"
                class="flex-shrink-0 flex flex-col items-center justify-center gap-1"
                :style="{ width: colWidth + 'px' }"
                @mouseenter="setHoveredIndex(i)"
                @mouseleave="setHoveredIndex(null)"
              >
                <div :class="getIconGlassStyle(s.icon, hoveredIndex === i)">
                  <component
                    :is="getIcon(s.icon)"
                    :class="[
                      'w-4 h-4 transition-colors duration-300',
                      getIconColor(s.icon, hoveredIndex === i)
                    ]"
                  />
                </div>
                <span
                  :class="[
                    'text-[9px] text-center leading-tight line-clamp-1 max-w-[60px] transition-colors duration-150',
                    hoveredIndex === i ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400 dark:text-slate-500/80 font-medium'
                  ]"
                >{{ s.status }}</span>
              </div>
            </div>

            <!-- Row 4: SVG Chart -->
            <div class="relative" :style="{ height: CHART_H + 'px' }">
              <!-- Mouse capture layer for each column -->
              <div class="absolute inset-0 flex pointer-events-auto z-20">
                <div
                  v-for="(_, i) in chartSlots"
                  :key="'hover-' + i"
                  class="flex-shrink-0 h-full cursor-pointer"
                  :style="{ width: colWidth + 'px' }"
                  @mouseenter="setHoveredIndex(i)"
                  @mouseleave="setHoveredIndex(null)"
                ></div>
              </div>

              <svg
                class="absolute inset-0 w-full overflow-visible pointer-events-none"
                :viewBox="`0 0 ${scrollContentWidth} ${CHART_H}`"
                :height="CHART_H"
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" class="chart-fill-start" />
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.00" class="chart-fill-end" />
                  </linearGradient>
                  <filter id="chartGlow">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                <!-- Horizontal dotted grid lines -->
                <line
                  v-for="val in yLabelsForTab" :key="val"
                  x1="0" :x2="scrollContentWidth"
                  :y1="yPosForVal(val)" :y2="yPosForVal(val)"
                  stroke="currentColor"
                  class="text-slate-200 dark:text-slate-700/50"
                  stroke-dasharray="3 4"
                  stroke-width="0.75"
                />

                <!-- Area fill -->
                <path :d="fillPath" fill="url(#chartFill)" />

                <!-- Trend line -->
                <path
                  :d="linePath"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  filter="url(#chartGlow)"
                  class="stroke-blue-500 dark:stroke-brand-cyan"
                />

                <!-- Wind Gust Line (if activeTab is Angin and toggled on) -->
                <path
                  v-if="activeTab === 'Angin' && showWindGust && gustLinePath"
                  :d="gustLinePath"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="1.8"
                  stroke-dasharray="4 3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="stroke-blue-400/80 dark:stroke-brand-cyan/60"
                />

                <!-- Vertical dashed hover indicator -->
                <line
                  v-if="hoveredIndex !== null && chartPoints[hoveredIndex]"
                  :x1="chartPoints[hoveredIndex].x"
                  :x2="chartPoints[hoveredIndex].x"
                  y1="0" :y2="CHART_H"
                  stroke="currentColor"
                  class="text-blue-400/50 dark:text-brand-cyan/40"
                  stroke-dasharray="3 4"
                  stroke-width="1.5"
                />

                <!-- Data point dots -->
                <g v-for="(pt, i) in chartPoints" :key="'dot-' + i">
                  <circle
                    v-if="hoveredIndex === i"
                    :cx="pt.x" :cy="pt.y"
                    r="9"
                    fill="#3b82f6"
                    fill-opacity="0.15"
                    class="fill-blue-500/15 dark:fill-brand-cyan/20"
                  />
                  <circle
                    :cx="pt.x" :cy="pt.y"
                    :r="hoveredIndex === i ? 5 : 3.5"
                    fill="white"
                    :stroke="hoveredIndex === i ? '#2563eb' : '#3b82f6'"
                    :stroke-width="hoveredIndex === i ? 2.5 : 1.8"
                    class="transition-all duration-150 stroke-blue-500 dark:stroke-brand-cyan"
                  />
                </g>

                <!-- Data point dots for Wind Gust -->
                <g v-if="activeTab === 'Angin' && showWindGust">
                  <g v-for="(pt, i) in gustPoints" :key="'gust-dot-' + i">
                    <circle
                      v-if="hoveredIndex === i"
                      :cx="pt.x" :cy="pt.y"
                      r="9"
                      fill="#60a5fa"
                      fill-opacity="0.15"
                      class="fill-blue-400/15 dark:fill-brand-cyan/20"
                    />
                    <circle
                      :cx="pt.x" :cy="pt.y"
                      :r="hoveredIndex === i ? 5 : 3"
                      fill="white"
                      :stroke="hoveredIndex === i ? '#60a5fa' : '#93c5fd'"
                      :stroke-width="hoveredIndex === i ? 2.5 : 1.5"
                      class="transition-all duration-150 stroke-blue-400 dark:stroke-brand-cyan/80"
                    />
                  </g>
                </g>
              </svg>
            </div>

            <!-- Row 5: Sunrise / Sunset markers -->
            <div class="relative flex" style="height: 24px;">
              <template v-for="(s, i) in chartSlots" :key="'sun-' + i">
                <div
                  v-if="s.label === '06:00'"
                  class="absolute -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25 dark:border-amber-400/10 text-amber-600 dark:text-amber-400 text-[8px] font-semibold whitespace-nowrap shadow-sm z-10"
                  :style="{ left: (i + 0.5) * colWidth + 'px', top: '2px' }"
                >
                  <Sunrise class="w-2.5 h-2.5" />
                  <span>05:51</span>
                </div>
                <div
                  v-if="s.label === '17:00' || (tempInterval !== '1j' && s.label === '18:00')"
                  class="absolute -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-400/5 border border-orange-500/25 dark:border-orange-400/10 text-orange-600 dark:text-orange-400 text-[8px] font-semibold whitespace-nowrap shadow-sm z-10"
                  :style="{ left: (i + 0.5) * colWidth + 'px', top: '2px' }"
                >
                  <Sunset class="w-2.5 h-2.5" />
                  <span>17:34</span>
                </div>
              </template>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.chart-fill-start {
  stop-color: #3b82f6;
}
.dark .chart-fill-start {
  stop-color: #00f5ff;
}
.chart-fill-end {
  stop-color: #3b82f6;
}
.dark .chart-fill-end {
  stop-color: #00f5ff;
}
</style>

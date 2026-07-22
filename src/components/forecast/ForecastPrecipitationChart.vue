<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { Droplet, Sunrise, Sunset } from 'lucide-vue-next';
import type { HourlyForecast } from '../../types/weather';

const props = defineProps<{
  forecasts: HourlyForecast[];
  currentTime: Date;
}>();

const emit = defineEmits<{
  (e: 'date-change', dateStr: string): void;
}>();

// Base states
const precipSelectedDate = ref('');
const precipInterval = ref<'1j' | '3j' | '6j'>('1j');
const showAccumulation = ref(true);
const precipHoveredIdx = ref<number | null>(null);
const precipScrollContainer = ref<HTMLElement | null>(null);

// Today ISO date YYYY-MM-DD
const todayIso = computed(() => {
  return props.currentTime.toISOString().slice(0, 10);
});

// Watch selected date to notify parent container for header date updates
watch(precipSelectedDate, (newVal) => {
  if (!newVal) return;
  const dateStr = new Date(newVal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  emit('date-change', dateStr);
}, { immediate: true });

const scrollPrecipToNow = async () => {
  await nextTick();
  if (!precipScrollContainer.value) return;
  
  if (precipSelectedDate.value === todayIso.value) {
    precipScrollContainer.value.scrollLeft = Math.max(0, currentTimeBarX.value - 20);
  } else {
    precipScrollContainer.value.scrollLeft = 0;
  }
};

watch([precipSelectedDate, precipInterval], scrollPrecipToNow);

onMounted(async () => {
  precipSelectedDate.value = todayIso.value;
  await scrollPrecipToNow();
});

// Convert precipitation probability % → approximate rain rate (mm/h)
const toRainRate = (pct: number): number => (pct / 100) * 12;

// Group forecast slots by calendar date
const precipDayGroups = computed(() => {
  const map = new Map<string, HourlyForecast[]>();
  for (const f of props.forecasts) {
    if (!map.has(f.date)) map.set(f.date, []);
    map.get(f.date)!.push(f);
  }
  return Array.from(map.entries()).map(([date, slots]) => {
    const totalMm = slots.reduce((acc, s) => acc + toRainRate(s.precipitation ?? 0), 0);
    const maxProb = Math.max(...slots.map(s => s.precipitation ?? 0));
    // peak 3-hourly bar for thumbnail sparkline
    const spark = [] as number[];
    for (let i = 0; i < slots.length; i += 3) {
      const chunk = slots.slice(i, i + 3);
      spark.push(Math.max(...chunk.map(s => s.precipitation ?? 0)));
    }
    return { date, slots, totalMm, maxProb, spark };
  });
});

// Slots for the selected day filtered by time interval
const precipChartSlots = computed(() => {
  if (!precipSelectedDate.value) return [];
  const daySlots = props.forecasts.filter(f => f.date === precipSelectedDate.value);
  if (!daySlots.length) return [];
  const n = precipInterval.value === '1j' ? 1 : precipInterval.value === '3j' ? 3 : 6;
  if (n === 1) {
    return daySlots.map(s => ({
      label: s.time,
      rate: toRainRate(s.precipitation ?? 0),
      prob: s.precipitation ?? 0,
    }));
  }
  const grouped: { label: string; rate: number; prob: number }[] = [];
  for (let i = 0; i < daySlots.length; i += n) {
    const chunk = daySlots.slice(i, i + n);
    grouped.push({
      label: chunk[0].time,
      rate: Math.max(...chunk.map(s => toRainRate(s.precipitation ?? 0))),
      prob: Math.max(...chunk.map(s => s.precipitation ?? 0)),
    });
  }
  return grouped;
});

// Cumulative accumulation values
const precipAccum = computed(() => {
  const n = precipInterval.value === '1j' ? 1 : precipInterval.value === '3j' ? 3 : 6;
  let cum = 0;
  return precipChartSlots.value.map(s => {
    cum += s.rate * n;
    return cum;
  });
});

const precipMaxRate = computed(() => Math.max(...precipChartSlots.value.map(s => s.rate), 0.5));
const precipMaxAccum = computed(() => Math.max(...precipAccum.value, 0.5));

// Chart geometry for precipitation SVG
const PC_H = 160;       // chart height
const PC_PAD_T = 12;    // top padding
const PC_PAD_B = 12;    // bottom padding
const PC_INNER_H = PC_H - PC_PAD_T - PC_PAD_B;

// Bar width depends on interval
const precipBarW = computed(() =>
  precipInterval.value === '1j' ? 28 : precipInterval.value === '3j' ? 52 : 72
);
const precipChartW = computed(() => precipChartSlots.value.length * precipBarW.value);

// SVG Y position for a given rain rate value
const pcBarY = (rate: number): number =>
  PC_PAD_T + PC_INNER_H * (1 - rate / precipMaxRate.value);
const pcBarH = (rate: number): number =>
  (rate / precipMaxRate.value) * PC_INNER_H;

// Accumulation bezier path
const precipAccumPath = computed(() => {
  const slots = precipChartSlots.value;
  if (!slots.length || !showAccumulation.value) return '';
  const bw = precipBarW.value;
  const pts = precipAccum.value.map((a, i) => ({
    x: i * bw + bw * 0.5,
    y: PC_PAD_T + PC_INNER_H * (1 - a / precipMaxAccum.value),
  }));
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = pts[i], n = pts[i + 1];
    const mx = (n.x - c.x) / 2;
    d += ` C ${c.x + mx} ${c.y}, ${n.x - mx} ${n.y}, ${n.x} ${n.y}`;
  }
  return d;
});

// Y-axis rain rate grid labels (mm/h)
const precipYLabels = computed(() => {
  const max = precipMaxRate.value;
  const step = max <= 3 ? 1 : max <= 6 ? 2 : 3;
  const labels: number[] = [];
  for (let v = 0; v <= max + step; v += step) {
    if (v > max * 1.15) break;
    labels.push(Math.round(v * 10) / 10);
  }
  return labels;
});

// X position of the current-time vertical marker in the precipitation chart
const currentTimeBarX = computed(() => {
  const slots = precipChartSlots.value;
  if (!slots.length) return 0;
  const h = props.currentTime.getHours();
  const n = precipInterval.value === '1j' ? 1 : precipInterval.value === '3j' ? 3 : 6;
  const slotIdx = Math.min(Math.floor(h / n), slots.length - 1);
  const fracInSlot = (h % n) / n;
  const bw = precipBarW.value;
  return slotIdx * bw + fracInSlot * bw + bw * 0.5;
});

// Rain intensity classification
const precipIntensityLabel = (rate: number): { text: string; cls: string } | null => {
  if (rate <= 0) return null;
  if (rate < 1)  return { text: 'Sangat Ringan', cls: 'bg-sky-400/20 text-sky-600 dark:text-sky-300' };
  if (rate < 3)  return { text: 'Ringan',        cls: 'bg-blue-400/20 text-blue-600 dark:text-blue-300' };
  if (rate < 6)  return { text: 'Sedang',        cls: 'bg-indigo-400/20 text-indigo-600 dark:text-indigo-300' };
  if (rate < 10) return { text: 'Lebat',         cls: 'bg-violet-400/20 text-violet-600 dark:text-violet-300' };
  return         { text: 'Sangat Lebat',          cls: 'bg-purple-500/20 text-purple-600 dark:text-purple-300' };
};

// Mouse handlers for the chart container
const onPrecipMouseMove = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left + el.scrollLeft;
  const idx = Math.floor(x / precipBarW.value);
  if (idx >= 0 && idx < precipChartSlots.value.length) {
    precipHoveredIdx.value = idx;
  } else {
    precipHoveredIdx.value = null;
  }
};

const onPrecipMouseLeave = () => {
  precipHoveredIdx.value = null;
};

// SVG x-center of hovered bar
const precipHoverBarCx = computed(() => {
  const idx = precipHoveredIdx.value;
  if (idx === null) return 0;
  return idx * precipBarW.value + precipBarW.value * 0.5;
});

// Clamped tooltip X position
const tooltipHalfWidth = 90;
const tooltipLeft = computed(() => {
  const cx = precipHoverBarCx.value;
  const chartW = Math.max(precipChartW.value, 300);
  return Math.max(tooltipHalfWidth, Math.min(chartW - tooltipHalfWidth, cx));
});

// Arrow offset
const tooltipArrowOffset = computed(() => {
  return precipHoverBarCx.value - tooltipLeft.value;
});

// SVG y-position of accumulation curve at hovered index
const precipHoverAccumY = computed(() => {
  const idx = precipHoveredIdx.value;
  if (idx === null || !precipAccum.value.length) return 0;
  const a = precipAccum.value[idx] ?? 0;
  return PC_PAD_T + PC_INNER_H * (1 - a / precipMaxAccum.value);
});

const isTooltipFlipped = computed(() => {
  const idx = precipHoveredIdx.value;
  if (idx === null) return false;
  const y = showAccumulation.value ? precipHoverAccumY.value : pcBarY(precipChartSlots.value[idx]?.rate ?? 0);
  return (y - 12 - 95) < 0;
});

const tooltipTop = computed(() => {
  const idx = precipHoveredIdx.value;
  if (idx === null) return 0;
  
  const y = showAccumulation.value ? precipHoverAccumY.value : pcBarY(precipChartSlots.value[idx]?.rate ?? 0);
  const estimatedHeight = 95;
  
  let top = isTooltipFlipped.value ? (y + 12) : (y - 12 - estimatedHeight);
  
  // Clamp to container boundaries
  if (top + estimatedHeight > PC_H) {
    top = PC_H - estimatedHeight;
  }
  if (top < 0) {
    top = 0;
  }
  return top;
});
</script>

<template>
  <div class="px-5 pb-2 pt-3">
    <!-- Daily summary strip -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
      <div
        v-for="group in precipDayGroups"
        :key="group.date"
        @click="precipSelectedDate = group.date"
        class="flex-shrink-0 w-[108px] rounded-2xl p-3 cursor-pointer transition-all duration-200 border select-none"
        :class="precipSelectedDate === group.date
          ? 'bg-blue-500/15 dark:bg-brand-cyan/10 border-blue-400/60 dark:border-brand-cyan/40 shadow-md shadow-blue-500/10'
          : 'bg-slate-50/60 dark:bg-brand-navy-800/30 border-slate-100/60 dark:border-brand-navy-700/30 hover:bg-blue-50/40 dark:hover:bg-brand-navy-800/60'"
      >
        <div class="text-[9px] font-black uppercase tracking-wider mb-0.5"
          :class="precipSelectedDate === group.date ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'"
        >
          {{ new Date(group.date).toLocaleDateString('id-ID', { weekday: 'short' }) }}
        </div>
        <div class="text-sm font-black mb-1.5"
          :class="precipSelectedDate === group.date ? 'text-blue-600 dark:text-brand-cyan' : 'text-slate-700 dark:text-slate-200'"
        >
          {{ new Date(group.date).getDate() }}
        </div>
        <div class="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
          {{ group.totalMm.toFixed(1) }}
          <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">mm</span>
        </div>
        <div class="flex items-center gap-1 mt-1">
          <Droplet class="w-2.5 h-2.5 text-blue-400 dark:text-brand-cyan" />
          <span class="text-[10px] font-bold"
            :class="precipSelectedDate === group.date ? 'text-blue-600 dark:text-brand-cyan' : 'text-slate-500 dark:text-slate-400'"
          >{{ group.maxProb }}%</span>
        </div>
        <div class="mt-2 flex gap-0.5 items-end h-5">
          <div
            v-for="(v, si) in group.spark"
            :key="si"
            class="flex-1 rounded-sm transition-all duration-300"
            :class="precipSelectedDate === group.date ? 'bg-blue-400/70 dark:bg-brand-cyan/60' : 'bg-slate-300/60 dark:bg-slate-600/50'"
            :style="{ height: Math.max(2, (v / 100) * 20) + 'px' }"
          />
        </div>
      </div>
    </div>

    <!-- Chart controls row -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="flex items-center rounded-full bg-slate-100/70 dark:bg-brand-navy-800/50 border border-slate-200/50 dark:border-brand-navy-700/40 overflow-hidden p-0.5">
          <button
            v-for="iv in ['1j', '3j', '6j']"
            :key="iv"
            @click="precipInterval = (iv as '1j' | '3j' | '6j')"
            class="px-3 py-1 rounded-full text-[9px] font-bold transition-all duration-150"
            :class="precipInterval === iv
              ? 'bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
          >
            {{ iv.replace('j', ' jam') }}
          </button>
        </div>
      </div>
      <button
        @click="showAccumulation = !showAccumulation"
        class="flex items-center gap-2 text-[10px] font-semibold transition-colors select-none"
        :class="showAccumulation ? 'text-cyan-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'"
      >
        <span class="text-[9px] font-bold">Akumulasi</span>
        <div
          class="relative w-7 h-3.5 rounded-full transition-colors duration-200"
          :class="showAccumulation ? 'bg-cyan-500 dark:bg-brand-cyan' : 'bg-slate-300 dark:bg-slate-600'"
        >
          <div
            class="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all duration-200"
            :class="showAccumulation ? 'right-0.5' : 'left-0.5'"
          />
        </div>
      </button>
    </div>

    <!-- Dual-axis chart -->
    <div class="flex items-stretch gap-1">
      <!-- Left Y-axis: rain rate mm/h -->
      <div class="flex-shrink-0 w-9 flex flex-col justify-between select-none" :style="{ height: PC_H + 'px', paddingTop: PC_PAD_T + 'px', paddingBottom: PC_PAD_B + 'px' }">
        <template v-if="precipYLabels.length">
          <span
            v-for="lbl in [...precipYLabels].reverse()"
            :key="lbl"
            class="text-[8.5px] text-right font-bold text-slate-400 dark:text-slate-500 leading-none"
          >{{ lbl }}</span>
        </template>
      </div>

      <!-- SVG chart (scrollable) -->
      <div
        ref="precipScrollContainer"
        class="flex-grow overflow-x-auto overflow-y-hidden no-scrollbar relative"
        @mousemove="onPrecipMouseMove"
        @mouseleave="onPrecipMouseLeave"
      >
        <!-- Tooltip -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="precipHoveredIdx !== null"
            class="pointer-events-none absolute z-30 transform -translate-x-1/2"
            :style="{
              left: tooltipLeft + 'px',
              top: tooltipTop + 'px',
            }"
          >
            <div class="relative px-3 py-2.5 rounded-xl shadow-lg border text-left min-w-[180px]
              bg-white/95 border-slate-100/80 shadow-slate-200/60
              dark:bg-brand-navy-900/95 dark:border-brand-navy-700/60 dark:shadow-brand-navy-950/80
              backdrop-blur-md"
            >
              <div class="text-[11px] font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                {{ precipChartSlots[precipHoveredIdx]?.label }}
              </div>
              <div class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <span class="font-bold">Laju:</span>
                <span>{{ (precipChartSlots[precipHoveredIdx]?.rate ?? 0).toFixed(2) }} mm/jam</span>
                <span
                  v-if="precipIntensityLabel(precipChartSlots[precipHoveredIdx]?.rate ?? 0)"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none"
                  :class="precipIntensityLabel(precipChartSlots[precipHoveredIdx]?.rate ?? 0)!.cls"
                >
                  {{ precipIntensityLabel(precipChartSlots[precipHoveredIdx]?.rate ?? 0)!.text }}
                </span>
              </div>
              <div v-if="showAccumulation" class="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <span class="font-bold">Akumulasi:</span>
                <span>{{ (precipAccum[precipHoveredIdx] ?? 0).toFixed(2) }} mm</span>
              </div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span class="font-semibold text-[9px]">Peluang:</span>
                <span class="font-bold text-[9px]">{{ precipChartSlots[precipHoveredIdx]?.prob ?? 0 }}%</span>
              </div>
              
              <!-- Bottom Arrow (shown when tooltip is above the point) -->
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
              
              <!-- Top Arrow (shown when tooltip is flipped below the point) -->
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

        <svg
          :width="Math.max(precipChartW, 300)"
          :height="PC_H"
          class="overflow-visible"
        >
          <defs>
            <linearGradient id="precipBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.9" class="precip-bar-top" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.3" class="precip-bar-bot" />
            </linearGradient>
            <filter id="precipGlow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!-- Grid lines -->
          <line
            v-for="lbl in precipYLabels"
            :key="'gl-' + lbl"
            x1="0" :x2="Math.max(precipChartW, 300)"
            :y1="pcBarY(lbl)" :y2="pcBarY(lbl)"
            stroke="currentColor"
            class="text-slate-200 dark:text-slate-700/40"
            stroke-dasharray="3 4"
            stroke-width="0.75"
          />

          <!-- Rain bars -->
          <g v-for="(slot, i) in precipChartSlots" :key="'bar-' + i">
            <rect
              :x="i * precipBarW + precipBarW * 0.18 + 1"
              :y="pcBarY(slot.rate) + 1"
              :width="precipBarW * 0.64"
              :height="pcBarH(slot.rate)"
              rx="3"
              fill="currentColor"
              class="text-blue-400/10 dark:text-brand-cyan/10"
            />
            <rect
              :x="i * precipBarW + precipBarW * 0.18"
              :y="pcBarY(slot.rate)"
              :width="precipBarW * 0.64"
              :height="pcBarH(slot.rate)"
              rx="3"
              :fill="precipHoveredIdx === i ? '#60a5fa' : 'url(#precipBarFill)'"
              class="transition-all duration-150"
            />
          </g>

          <!-- Accumulation curve -->
          <path
            v-if="showAccumulation && precipAccumPath"
            :d="precipAccumPath"
            fill="none"
            stroke="#22d3ee"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#precipGlow)"
            class="stroke-cyan-400 dark:stroke-brand-cyan"
          />

          <!-- Hover vertical line -->
          <line
            v-if="precipHoveredIdx !== null"
            :x1="precipHoverBarCx"
            :x2="precipHoverBarCx"
            y1="0" :y2="PC_H - PC_PAD_B"
            stroke="currentColor"
            class="text-blue-400/70 dark:text-brand-cyan/60"
            stroke-dasharray="3 3"
            stroke-width="1.5"
          />

          <!-- Hover dot on accumulation curve -->
          <template v-if="precipHoveredIdx !== null && showAccumulation">
            <circle
              :cx="precipHoverBarCx"
              :cy="precipHoverAccumY"
              r="6.5"
              fill="#22d3ee"
              fill-opacity="0.25"
              class="fill-cyan-400/35 dark:fill-brand-cyan/35"
            />
            <circle
              :cx="precipHoverBarCx"
              :cy="precipHoverAccumY"
              r="4.5"
              class="fill-white dark:fill-brand-navy-900"
              stroke="white"
              stroke-width="2.5"
            />
          </template>

          <!-- Current time marker -->
          <template v-if="precipSelectedDate === todayIso">
            <line
              v-if="precipChartSlots.length"
              :x1="currentTimeBarX"
              :x2="currentTimeBarX"
              y1="0" :y2="PC_H"
              stroke="currentColor"
              class="text-blue-400/60 dark:text-brand-cyan/50"
              stroke-dasharray="3 3"
              stroke-width="1.5"
            />
            <text
              v-if="precipChartSlots.length"
              :x="currentTimeBarX + 3"
              :y="PC_PAD_T - 2"
              class="fill-blue-500 dark:fill-brand-cyan text-[8px] font-black"
              font-size="8"
              font-weight="800"
              fill="#3b82f6"
            >Sekarang</text>
          </template>

          <!-- X-axis time labels -->
          <text
            v-for="(slot, i) in precipChartSlots"
            :key="'xl-' + i"
            :x="i * precipBarW + precipBarW * 0.5"
            :y="PC_H - 1"
            text-anchor="middle"
            class="fill-slate-400 dark:fill-slate-500"
            font-size="7.5"
            font-weight="600"
            fill="#94a3b8"
          >{{ slot.label }}</text>
        </svg>
      </div>

      <!-- Right Y-axis: accumulation mm -->
      <div
        v-if="showAccumulation"
        class="flex-shrink-0 w-9 flex flex-col justify-between select-none"
        :style="{ height: PC_H + 'px', paddingTop: PC_PAD_T + 'px', paddingBottom: PC_PAD_B + 'px' }"
      >
        <span class="text-[8.5px] text-left font-bold text-cyan-500 dark:text-brand-cyan leading-none">{{ precipMaxAccum.toFixed(1) }}</span>
        <span class="text-[8.5px] text-left font-bold text-cyan-500 dark:text-brand-cyan leading-none">{{ (precipMaxAccum * 0.5).toFixed(1) }}</span>
        <span class="text-[8.5px] text-left font-bold text-cyan-500 dark:text-brand-cyan leading-none">0</span>
      </div>
    </div>

    <!-- Y-axis units row -->
    <div class="flex items-center justify-between mt-1 px-0.5">
      <span class="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">mm/jam</span>
      <span v-if="showAccumulation" class="text-[8.5px] font-bold text-cyan-500 dark:text-brand-cyan">akumulasi (mm)</span>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-between flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100/40 dark:border-brand-navy-800/30 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 select-none">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500/80 dark:bg-blue-400/80 block"></span>
          <span>Hujan</span>
        </div>
        <div v-if="showAccumulation" class="flex items-center gap-1.5">
          <span class="w-5 h-0.5 rounded-full bg-cyan-400 dark:bg-brand-cyan block"></span>
          <span>Akumulasi</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Droplet class="w-2.5 h-2.5 text-blue-400 dark:text-brand-cyan" />
          <span>Peluang maks: {{ precipDayGroups.find(g => g.date === precipSelectedDate)?.maxProb ?? 0 }}%</span>
        </div>
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
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Precipitation bar gradient – dark mode cyan */
.precip-bar-top {
  stop-color: #3b82f6;
}
.dark .precip-bar-top {
  stop-color: #00f5ff;
}
.precip-bar-bot {
  stop-color: #3b82f6;
}
.dark .precip-bar-bot {
  stop-color: #0891b2;
}
</style>

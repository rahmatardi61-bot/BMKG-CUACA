<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Radar, Waves, Wind, ChevronDown, Navigation, Activity } from 'lucide-vue-next';

const props = defineProps<{
  selectedCity: string;
}>();

type WaveTab = 'gelombang' | 'angin';
const activeTab = ref<WaveTab>('gelombang');

const tabs = [
  { id: 'gelombang' as WaveTab, label: 'Tinggi Gelombang', icon: Waves },
  { id: 'angin' as WaveTab, label: 'Kecepatan Angin', icon: Wind },
];

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const activeTabInfo = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

// Maritime zones with approximate map positions (x%, y%)
const zones = [
  { name: 'Perairan Utara Aceh', x: '7%', y: '18%', wave: 2.4, wind: 22 },
  { name: 'Perairan Sumatera Utara', x: '14%', y: '30%', wave: 1.8, wind: 18 },
  { name: 'Perairan Kep. Riau', x: '17%', y: '44%', wave: 1.1, wind: 12 },
  { name: 'Selat Sunda', x: '22%', y: '58%', wave: 0.9, wind: 10 },
  { name: 'Teluk Jakarta', x: '25%', y: '62%', wave: 0.4, wind: 8 },
  { name: 'Perairan Selatan Jawa', x: '33%', y: '72%', wave: 2.8, wind: 24 },
  { name: 'Selat Bali', x: '47%', y: '67%', wave: 2.2, wind: 20 },
  { name: 'Perairan Sulawesi Selatan', x: '54%', y: '50%', wave: 3.2, wind: 26 },
  { name: 'Perairan Maluku', x: '68%', y: '38%', wave: 1.6, wind: 15 },
  { name: 'Laut Arafura', x: '74%', y: '58%', wave: 2.6, wind: 23 },
];

const waveLevel = (w: number) => {
  if (w < 1) return { label: 'Rendah', color: 'text-emerald-400 border-emerald-400/40 bg-emerald-500/15', dot: 'bg-emerald-400' };
  if (w < 2) return { label: 'Sedang', color: 'text-amber-400 border-amber-400/40 bg-amber-500/15', dot: 'bg-amber-400' };
  if (w < 3) return { label: 'Tinggi', color: 'text-orange-400 border-orange-400/40 bg-orange-500/15', dot: 'bg-orange-400' };
  return { label: 'Sangat Tinggi', color: 'text-red-400 border-red-400/40 bg-red-500/15', dot: 'bg-red-400' };
};

const selectedZone = computed(() => {
  const lc = props.selectedCity.toLowerCase();
  const match = zones.find(z => {
    const zoneLc = z.name.toLowerCase();
    return lc.includes('jakarta') ? zoneLc.includes('teluk jakarta')
      : lc.includes('surabaya') ? zoneLc.includes('selat bali')
      : lc.includes('medan') ? zoneLc.includes('sumatera utara')
      : lc.includes('makassar') ? zoneLc.includes('sulawesi selatan')
      : lc.includes('semarang') || lc.includes('yogyakarta') ? zoneLc.includes('selatan jawa')
      : lc.includes('palembang') || lc.includes('batam') ? zoneLc.includes('kep. riau')
      : lc.includes('bandung') ? zoneLc.includes('selat sunda')
      : lc.includes('denpasar') || lc.includes('bali') ? zoneLc.includes('selat bali')
      : zoneLc.includes(lc.split(',')[0].trim());
  });
  return match || zones[3];
});

const hoveredZone = ref<string | null>(null);
const activeTooltipZone = computed(() => hoveredZone.value || selectedZone.value.name);

const isSelectedZone = (name: string) => selectedZone.value.name === name;

const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value; };
const selectTab = (id: WaveTab) => { activeTab.value = id; isDropdownOpen.value = false; };

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => window.addEventListener('click', handleClickOutside));
onUnmounted(() => window.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-6 shadow-sm backdrop-blur-md">
    <!-- Header Area -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Radar class="w-4 h-4 text-cyan-500 dark:text-brand-cyan animate-spin" style="animation-duration: 6s;" />
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Radar Tinggi Gelombang</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Peta Maritim Perairan Indonesia
          <a href="https://cuaca.bmkg.go.id/map#Maritim" target="_blank" rel="noopener" class="text-cyan-500 dark:text-brand-cyan hover:underline font-bold ml-1">cuaca.bmkg.go.id/map#Maritim ↗</a>
        </p>
      </div>

      <!-- Wave subtabs dropdown -->
      <div ref="dropdownRef" class="relative z-50 shrink-0">
        <button
          @click="toggleDropdown"
          class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer select-none bg-slate-100/60 border-transparent hover:bg-slate-200/50 text-slate-700 dark:bg-brand-navy-900/60 dark:hover:bg-brand-navy-800/50 dark:text-slate-200"
        >
          <component :is="activeTabInfo.icon" class="w-3.5 h-3.5 text-cyan-500 dark:text-brand-cyan" />
          <span class="text-xs tracking-wide">{{ activeTabInfo.label }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
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
            class="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden py-1.5 z-50 bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="selectTab(tab.id)"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center justify-between"
              :class="activeTab === tab.id ? 'font-bold text-cyan-600 dark:text-brand-cyan' : 'text-slate-600 dark:text-slate-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                {{ tab.label }}
              </span>
              <span v-if="activeTab === tab.id" class="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-brand-cyan"></span>
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

      <!-- Oceanic gradient backdrop -->
      <div class="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-slate-950 to-indigo-950/90"></div>
      <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,#22d3ee_0%,transparent_50%),radial-gradient(circle_at_70%_70%,#3b82f6_0%,transparent_50%)]"></div>

      <!-- Selected zone spotlight -->
      <div
        class="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out"
        :style="{
          background: `radial-gradient(circle at ${selectedZone.x} ${selectedZone.y}, rgba(34,211,238,0.45) 0%, rgba(34,211,238,0.15) 28%, transparent 62%)`
        }"
      ></div>

      <!-- Maritime zone pins -->
      <div
        v-for="zone in zones"
        :key="zone.name"
        class="absolute"
        :style="{ left: zone.x, top: zone.y }"
        @mouseenter="hoveredZone = zone.name"
        @mouseleave="hoveredZone = null"
      >
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span
            class="absolute rounded-full animate-ping"
            :class="isSelectedZone(zone.name) ? 'w-8 h-8 bg-cyan-400/50' : 'w-6 h-6 bg-cyan-500/30'"
            style="animation-duration: 2.5s;"
          ></span>
          <span
            class="absolute w-3 h-3 rounded-full border-2 transition-all duration-300"
            :class="isSelectedZone(zone.name) ? 'bg-cyan-300 border-cyan-100 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]' : 'bg-cyan-500 border-white/30'"
          ></span>

          <span
            class="absolute top-4.5 px-2 py-0.5 backdrop-blur-sm rounded-full text-[9px] font-bold whitespace-nowrap shadow-md"
            :class="isSelectedZone(zone.name) ? 'bg-cyan-400 text-slate-900 border border-cyan-200' : 'bg-slate-900/90 border border-slate-700/40 text-white'"
          >
            {{ zone.wave.toFixed(1) }} m • {{ zone.wind }} kt
          </span>

          <div
            v-if="activeTooltipZone === zone.name"
            class="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 rounded-xl p-3 z-30 shadow-2xl border text-white backdrop-blur-md animate-fade-in pointer-events-none"
            :class="isSelectedZone(zone.name) ? 'bg-cyan-950/90 border-cyan-600/40' : 'bg-slate-950/90 border-slate-800/40'"
          >
            <h5 class="text-[11px] font-bold tracking-wider border-b pb-1.5 mb-2"
              :class="isSelectedZone(zone.name) ? 'border-cyan-700/50' : 'border-slate-800/50'"
            >{{ zone.name }}</h5>
            <div class="space-y-1.5 text-[10px] text-slate-300 font-medium">
              <p class="flex justify-between">
                <span class="flex items-center gap-1"><Waves class="w-3 h-3" /> Gelombang</span>
                <span class="font-bold text-cyan-300">{{ zone.wave.toFixed(1) }} m</span>
              </p>
              <p class="flex justify-between">
                <span class="flex items-center gap-1"><Wind class="w-3 h-3" /> Angin</span>
                <span class="font-bold text-cyan-300">{{ zone.wind }} knot</span>
              </p>
              <p class="flex justify-between items-center">
                <span class="flex items-center gap-1"><Navigation class="w-3 h-3" /> Status</span>
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border" :class="waveLevel(zone.wave).color">
                  {{ waveLevel(zone.wave).label }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating metadata badge -->
      <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/30 rounded-xl p-2.5 text-white font-medium flex items-center gap-2 max-w-[170px] pointer-events-none z-20">
        <Activity class="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
        <div class="min-w-0">
          <p class="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none">Data Maritim</p>
          <p class="text-[9px] font-black text-slate-100 mt-1 truncate">BMKG WaveWatch III</p>
          <p class="text-[7px] text-slate-400 leading-none mt-0.5">{{ selectedZone.name }}</p>
        </div>
      </div>

      <!-- Legend -->
      <div class="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/40 rounded-xl px-2.5 py-2 z-20 flex items-center gap-2.5 shadow-lg">
        <span v-for="lvl in ['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi']" :key="lvl" class="flex items-center gap-1 text-[8px] font-bold text-slate-300">
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-emerald-400': lvl === 'Rendah',
            'bg-amber-400': lvl === 'Sedang',
            'bg-orange-400': lvl === 'Tinggi',
            'bg-red-400': lvl === 'Sangat Tinggi',
          }"></span>
          {{ lvl }}
        </span>
      </div>
    </div>
  </div>
</template>
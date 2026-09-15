<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
  Activity, 
  Compass, 
  Waves, 
  ShieldCheck, 
  ChevronDown, 
  BookOpen, 
  Clock, 
  MapPin 
} from 'lucide-vue-next';
import { getClosestEarthquake } from '../data/earthquakeData';

const props = defineProps<{
  selectedCity: string;
  userLat?: number | null;
  userLng?: number | null;
}>();

// Dynamic Proximity Calculation
const closestEq = computed(() => {
  return getClosestEarthquake(props.selectedCity, props.userLat, props.userLng);
});

const event = computed(() => closestEq.value.event);
const distance = computed(() => closestEq.value.distance);

// Proximity Warning Alert Config
const warningConfig = computed(() => {
  const dist = distance.value;
  if (dist < 100) {
    return {
      title: 'Perhatian: Gempa Sangat Dekat!',
      desc: `Episentrum gempa hanya berjarak ${dist} km dari lokasi Anda. Pastikan struktur bangunan aman.`,
      theme: 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400',
      pulseColor: 'bg-red-500',
      glowShadow: 'shadow-red-500/20'
    };
  } else if (dist < 300) {
    return {
      title: 'Waspada: Getaran Mungkin Dirasakan',
      desc: `Gempa terjadi dalam radius ${dist} km. Tetap waspada terhadap informasi dari pihak berwenang.`,
      theme: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      pulseColor: 'bg-amber-400',
      glowShadow: 'shadow-amber-500/15'
    };
  } else {
    return {
      title: 'Gempa Terdekat Terdeteksi',
      desc: `Episentrum berjarak ${dist} km. Kondisi wilayah terpilih saat ini dalam zona aman.`,
      theme: 'bg-slate-500/10 border-slate-500/20 text-slate-400 dark:text-slate-400',
      pulseColor: 'bg-slate-400',
      glowShadow: 'shadow-slate-500/5'
    };
  }
});

// Expandable accordion for safety guidelines
const showSafety = ref(false);

// Map MMI values to a percentage width and a color class for visualization
const getMmiWidth = (mmi: string) => {
  if (mmi.includes('V')) return 'w-5/6 bg-red-500';
  if (mmi.includes('IV')) return 'w-4/6 bg-orange-500';
  if (mmi.includes('III')) return 'w-3/6 bg-amber-500';
  return 'w-2/6 bg-yellow-500';
};
</script>

<template>
  <div 
    v-if="event"
    class="relative w-full rounded-[4px] p-5 overflow-hidden transition-all duration-500 border border-white/10 dark:border-brand-navy-800/40 backdrop-blur-xl text-left shadow-lg
      bg-white/80 dark:bg-brand-navy-900/60"
    :class="[
      warningConfig.glowShadow ? `shadow-[0_20px_50px_${warningConfig.glowShadow}]` : 'shadow-md'
    ]"
  >
    <!-- Seismic Ambient Wave Overlay -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" aria-hidden="true">
      <svg viewBox="0 0 100 100" class="w-full h-full" preserveAspectRatio="none">
        <path d="M0,50 Q10,40 20,60 T40,50 T60,30 T80,70 T100,50" fill="none" stroke="currentColor" stroke-width="0.8" />
        <path d="M0,60 Q15,45 30,55 T60,45 T75,65 T100,60" fill="none" stroke="currentColor" stroke-width="0.5" />
      </svg>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-brand-navy-800/60 relative z-10">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-[4px] bg-red-500/10 text-red-500 dark:text-red-400">
          <Activity class="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase">
            Aktivitas Seismik
          </h4>
          <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
            Monitoring Gempa Terdekat BMKG
          </p>
        </div>
      </div>
      
      <!-- Proximity Badge -->
      <span 
        class="px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border transition-all duration-300"
        :class="warningConfig.theme"
      >
        {{ distance }} km dari Anda
      </span>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-5 relative z-10">
      
      <!-- Left Column: Primary Stats & Proximity Banner -->
      <div class="flex flex-col gap-4">
        
        <!-- Proximity Alert Banner -->
        <div 
          class="flex gap-2.5 p-3 rounded-[4px] border transition-all duration-300"
          :class="warningConfig.theme"
        >
          <div class="relative flex h-2 w-2 mt-1 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="warningConfig.pulseColor"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="warningConfig.pulseColor"></span>
          </div>
          <div class="space-y-0.5">
            <h5 class="text-[10px] font-black tracking-wide leading-none uppercase">
              {{ warningConfig.title }}
            </h5>
            <p class="text-[9px] font-medium leading-relaxed opacity-90">
              {{ warningConfig.desc }}
            </p>
          </div>
        </div>

        <!-- 3-Column Key Parameters -->
        <div class="grid grid-cols-3 gap-3">
          
          <!-- Magnitude -->
          <div class="bg-slate-50/50 dark:bg-brand-navy-950/40 border border-slate-100/50 dark:border-brand-navy-800/20 rounded-[4px] p-3 flex flex-col items-center text-center justify-between">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kekuatan
            </span>
            <div class="my-1.5 flex items-center justify-center relative w-12 h-12">
              <!-- Radial ring effect -->
              <div 
                class="absolute inset-0 rounded-full border-2 border-slate-200/50 dark:border-brand-navy-800/40 flex items-center justify-center"
                :class="event.magnitude >= 6 ? 'border-red-500/20 animate-pulse' : event.magnitude >= 5 ? 'border-amber-500/20' : 'border-sky-500/20'"
              ></div>
              <span 
                class="text-sm font-black tracking-tight"
                :class="event.magnitude >= 6 ? 'text-red-500 dark:text-red-400' : event.magnitude >= 5 ? 'text-amber-500 dark:text-amber-400' : 'text-sky-500 dark:text-sky-400'"
              >
                M {{ event.magnitude.toFixed(1) }}
              </span>
            </div>
            <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400">
              Skala Richter
            </span>
          </div>

          <!-- Depth -->
          <div class="bg-slate-50/50 dark:bg-brand-navy-950/40 border border-slate-100/50 dark:border-brand-navy-800/20 rounded-[4px] p-3 flex flex-col items-center text-center justify-between">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kedalaman
            </span>
            <div class="my-1.5 flex flex-col items-center gap-0.5 justify-center h-12">
              <Compass class="w-5 h-5 text-indigo-400 dark:text-brand-cyan" />
              <span class="text-[11px] font-black text-slate-800 dark:text-white tracking-tight mt-0.5">
                {{ event.depth }} Km
              </span>
            </div>
            <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400">
              {{ event.depth <= 70 ? 'Dangkal' : event.depth <= 300 ? 'Menengah' : 'Dalam' }}
            </span>
          </div>

          <!-- Tsunami Alert -->
          <div class="bg-slate-50/50 dark:bg-brand-navy-950/40 border border-slate-100/50 dark:border-brand-navy-800/20 rounded-[4px] p-3 flex flex-col items-center text-center justify-between">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tsunami
            </span>
            <div class="my-1.5 flex flex-col items-center gap-0.5 justify-center h-12">
              <template v-if="event.tsunamiPotential">
                <Waves class="w-5 h-5 text-red-500 animate-bounce" />
                <span class="text-[8px] font-black text-red-500 uppercase tracking-tight mt-0.5">
                  WASPADA
                </span>
              </template>
              <template v-else>
                <ShieldCheck class="w-5 h-5 text-emerald-500" />
                <span class="text-[8px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-tight mt-0.5">
                  AMAN
                </span>
              </template>
            </div>
            <span class="text-[7.5px] font-bold leading-none text-slate-500 dark:text-slate-400 max-w-[50px] truncate">
              {{ event.tsunamiPotential ? 'Berpotensi' : 'Tidak Berpotensi' }}
            </span>
          </div>

        </div>

        <!-- Epicenter Detail -->
        <div class="flex items-center gap-3 bg-slate-50/50 dark:bg-brand-navy-950/40 border border-slate-100/50 dark:border-brand-navy-800/20 rounded-[4px] p-3">
          <div class="w-8 h-8 rounded-[4px] bg-blue-500/10 text-blue-500 dark:text-brand-cyan flex items-center justify-center shrink-0">
            <MapPin class="w-4.5 h-4.5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-1">
              Episentrum Pusat
            </p>
            <p class="text-[10px] font-black text-slate-800 dark:text-white truncate">
              {{ event.epicenter }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5 text-[8px] font-semibold text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-0.5">
                <Clock class="w-2.5 h-2.5 text-slate-400" />
                {{ event.time }}
              </span>
              <span>•</span>
              <span>{{ event.date }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: MMI intensity & Safety Guidelines -->
      <div class="flex flex-col justify-between gap-4">
        
        <!-- MMI Felt Areas -->
        <div class="bg-slate-50/50 dark:bg-brand-navy-950/40 border border-slate-100/50 dark:border-brand-navy-800/20 rounded-[4px] p-3 flex-1 flex flex-col">
          <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
            Wilayah Dirasakan (Skala MMI)
          </span>
          <div class="flex flex-col gap-2.5 flex-1 justify-center">
            <div 
              v-for="felt in event.feltMmi" 
              :key="felt.area"
              class="flex items-center justify-between text-[10px] font-semibold"
            >
              <span class="text-slate-700 dark:text-slate-300 font-extrabold truncate w-24">
                {{ felt.area }}
              </span>
              <!-- Visual strength indicator bar -->
              <div class="flex-1 mx-2.5 h-1 bg-slate-200 dark:bg-brand-navy-850 rounded-full overflow-hidden flex justify-start">
                <div class="h-full rounded-full" :class="getMmiWidth(felt.mmi)"></div>
              </div>
              <span class="text-slate-800 dark:text-white font-black shrink-0">
                {{ felt.mmi }} MMI
              </span>
            </div>
          </div>
        </div>

        <!-- Safety Accordion Toggle Button -->
        <div class="relative">
          <button 
            type="button"
            @click="showSafety = !showSafety"
            class="w-full h-9 rounded-[4px] bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-850 border border-slate-800 dark:border-brand-navy-800/40 shadow-sm flex items-center justify-between px-3.5 transition-all cursor-pointer text-xs font-black tracking-wide"
          >
            <span class="flex items-center gap-1.5">
              <BookOpen class="w-3.5 h-3.5 text-brand-cyan" />
              Siaga Gempa BMKG
            </span>
            <ChevronDown class="w-4 h-4 transition-transform duration-300 text-slate-400" :class="{ 'rotate-180': showSafety }" />
          </button>

          <!-- Safety Expandable Content -->
          <div 
            v-if="showSafety" 
            class="absolute bottom-full left-0 right-0 mb-2 bg-[#0f172a]/95 border border-slate-800/60 backdrop-blur-md text-slate-300 rounded-[4px] p-4 text-[9.5px] font-normal leading-relaxed shadow-2xl z-20 flex flex-col gap-2.5 animate-fade-in"
          >
            <h6 class="text-[10px] font-black text-cyan-400 dark:text-brand-cyan border-b border-slate-800 pb-1 leading-none uppercase">
              Petunjuk Siaga Gempa Bumi
            </h6>
            
            <div class="space-y-2">
              <div>
                <span class="font-extrabold text-white">1. Di Dalam Ruangan:</span>
                <span class="text-slate-400"> Segera merunduk di bawah meja kokoh, lindungi kepala dan leher Anda, serta hindari lemari tinggi/kaca jendela.</span>
              </div>
              <div>
                <span class="font-extrabold text-white">2. Di Luar Ruangan:</span>
                <span class="text-slate-400"> Lari ke area terbuka yang bebas dari papan reklame, tiang listrik, pohon, maupun bangunan yang rawan roboh.</span>
              </div>
              <div>
                <span class="font-extrabold text-white">3. Pasca Gempa:</span>
                <span class="text-slate-400"> Ikuti jalur evakuasi resmi, periksa kondisi kompor/gas, dan waspadai potensi runtuhan serta gempa susulan.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

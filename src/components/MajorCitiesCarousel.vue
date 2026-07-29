<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  ChevronLeft, 
  ChevronRight
} from 'lucide-vue-next';

import AroundActivityPanel from './AroundActivityPanel.vue';

const props = defineProps<{
  selectedCity: string;
  showActivities: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-city', city: string): void;
  (e: 'select-course', course: any): void;
}>();

import { cityLandmarks } from '../data/cityLandmarks';

const carouselContainer = ref<HTMLElement | null>(null);

// Determine the active city in the 10 major cities carousel. If not in the major cities list, fallback to 'DKI Jakarta'
const activeCarouselCity = computed(() => {
  const isMajorCity = cityLandmarks.some(l => l.fullName === props.selectedCity);
  return isMajorCity ? props.selectedCity : 'DKI Jakarta';
});

const scrollCarousel = (direction: 'left' | 'right') => {
  if (!carouselContainer.value) return;
  const container = carouselContainer.value;
  const scrollAmount = 320;
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
};
</script>

<template>
  <!-- Two-column grid: Left = carousel content | Right = Premium CTA card -->
  <div class="relative w-full mt-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-4 items-stretch">

    <!-- Left: Carousel card with backdrop -->
    <div class="relative bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 backdrop-blur-md rounded-3xl p-5 shadow-sm overflow-hidden">
      <!-- Soft gradient glows in background -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div class="absolute top-0 left-0 w-44 h-44 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-600/10 blur-3xl translate-x-[-30%] translate-y-[-30%]"></div>
        <div class="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 dark:from-cyan-500/10 dark:to-emerald-600/10 blur-3xl translate-x-[30%] translate-y-[30%]"></div>
        <div class="absolute top-1/3 left-1/3 w-36 h-36 rounded-full bg-gradient-to-br from-pink-400/10 to-rose-400/10 dark:from-pink-500/8 dark:to-rose-600/8 blur-3xl"></div>
      </div>

      <!-- Title & Subtitle -->
      <div class="relative space-y-0.5 mb-5 text-left">
        <h3 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
          Kondisi Terkini
        </h3>
        <p class="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
          10 Kota Besar Indonesia
        </p>
      </div>

    <!-- Carousel Wrapper -->
    <div class="relative group/carousel w-full">
      <!-- Left Arrow Button -->
      <button 
        @click="scrollCarousel('left')"
        class="absolute -left-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
        aria-label="Previous cities"
      >
        <ChevronLeft class="w-4 h-4 text-slate-800 dark:text-white" />
      </button>
      
      <!-- Right Arrow Button -->
      <button 
        @click="scrollCarousel('right')"
        class="absolute -right-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white/40 border-slate-200/30 hover:bg-white/65 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
        aria-label="Next cities"
      >
        <ChevronRight class="w-4 h-4 text-slate-800 dark:text-white" />
      </button>

      <!-- Scrollable Row -->
      <div 
        ref="carouselContainer"
        class="flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-0.5"
      >
        <button
          v-for="landmark in cityLandmarks"
          :key="landmark.name"
          v-memo="[activeCarouselCity === landmark.fullName]"
          :id="'landmark-card-' + landmark.name.toLowerCase()"
          @click="emit('select-city', landmark.fullName)"
          class="snap-start flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 min-w-[145px] sm:min-w-[155px] select-none active:scale-[0.97] backdrop-blur-md relative overflow-hidden group/card shadow-sm"
          :class="[
            activeCarouselCity === landmark.fullName
              ? {
                  'Jakarta': 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/45 shadow-sm shadow-blue-500/5 font-extrabold',
                  'Surabaya': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/45 shadow-sm shadow-cyan-500/5 font-extrabold',
                  'Bandung': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/45 shadow-sm shadow-emerald-500/5 font-extrabold',
                  'Medan': 'bg-amber-500/10 text-amber-600 border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/45 shadow-sm shadow-amber-500/5 font-extrabold',
                  'Semarang': 'bg-purple-500/10 text-purple-600 border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/45 shadow-sm shadow-purple-500/5 font-extrabold',
                  'Makassar': 'bg-red-500/10 text-red-600 border-red-500/40 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/45 shadow-sm shadow-red-500/5 font-extrabold',
                  'Palembang': 'bg-orange-500/10 text-orange-600 border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/45 shadow-sm shadow-orange-500/5 font-extrabold',
                  'Batam': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/45 shadow-sm shadow-indigo-500/5 font-extrabold',
                  'Pekanbaru': 'bg-teal-500/10 text-teal-600 border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/45 shadow-sm shadow-teal-500/5 font-extrabold',
                  'Denpasar': 'bg-rose-500/10 text-rose-600 border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/45 shadow-sm shadow-rose-500/5 font-extrabold'
                }[landmark.name] || 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-brand-cyan/15 dark:text-brand-cyan dark:border-brand-cyan/40 shadow-sm shadow-blue-500/5 font-extrabold'
              : 'bg-white/50 text-slate-600 hover:bg-white/80 border-slate-200/40 dark:bg-brand-navy-900/50 dark:text-slate-300 dark:hover:bg-brand-navy-850/70 dark:border-brand-navy-700/40'
          ]"
        >
          <!-- Animated background pulse highlight on active -->
          <div 
            v-if="activeCarouselCity === landmark.fullName"
            class="absolute -right-6 -top-6 w-16 h-16 rounded-full blur-xl animate-pulse"
            :class="[
              {
                'Jakarta': 'bg-blue-500/10 dark:bg-blue-500/15',
                'Surabaya': 'bg-cyan-500/10 dark:bg-cyan-500/15',
                'Bandung': 'bg-emerald-500/10 dark:bg-emerald-500/15',
                'Medan': 'bg-amber-500/10 dark:bg-amber-500/15',
                'Semarang': 'bg-purple-500/10 dark:bg-purple-500/15',
                'Makassar': 'bg-red-500/10 dark:bg-red-500/15',
                'Palembang': 'bg-orange-500/10 dark:bg-orange-500/15',
                'Batam': 'bg-indigo-500/10 dark:bg-indigo-500/15',
                'Pekanbaru': 'bg-teal-500/10 dark:bg-teal-500/15',
                'Denpasar': 'bg-rose-500/10 dark:bg-rose-500/15'
              }[landmark.name] || 'bg-blue-500/10 dark:bg-brand-cyan/15'
            ]"
          ></div>

          <!-- Landmark Icon Container with dynamic background theme -->
          <div 
            class="w-8 h-8 p-1.5 rounded-xl shrink-0 transition-transform duration-300 group-hover/card:scale-110 flex items-center justify-center"
            :class="[
              activeCarouselCity === landmark.fullName
                ? {
                    'Jakarta': 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400',
                    'Surabaya': 'bg-cyan-500/20 text-cyan-600 dark:bg-cyan-500/25 dark:text-cyan-400',
                    'Bandung': 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400',
                    'Medan': 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400',
                    'Semarang': 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/25 dark:text-purple-400',
                    'Makassar': 'bg-red-500/20 text-red-600 dark:bg-red-500/25 dark:text-red-400',
                    'Palembang': 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400',
                    'Batam': 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-400',
                    'Pekanbaru': 'bg-teal-500/20 text-teal-600 dark:bg-teal-500/25 dark:text-teal-400',
                    'Denpasar': 'bg-rose-500/20 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400'
                  }[landmark.name] || 'bg-blue-500/20 text-blue-600 dark:bg-brand-cyan/25 dark:text-brand-cyan'
                : 'bg-slate-100 dark:bg-brand-navy-800/80 ' + landmark.color
            ]"
            v-html="landmark.svg"
          ></div>

          <!-- Location Label & Indicator -->
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-bold tracking-tight truncate leading-tight">
              {{ landmark.name }}
            </span>
            <span 
              class="text-[9px] font-semibold mt-0.5"
              :class="[
                activeCarouselCity === landmark.fullName
                  ? {
                      'Jakarta': 'text-blue-500/80 dark:text-blue-400/80',
                      'Surabaya': 'text-cyan-500/80 dark:text-cyan-400/80',
                      'Bandung': 'text-emerald-500/80 dark:text-emerald-400/80',
                      'Medan': 'text-amber-500/80 dark:text-amber-400/80',
                      'Semarang': 'text-purple-500/80 dark:text-purple-400/80',
                      'Makassar': 'text-red-500/80 dark:text-red-400/80',
                      'Palembang': 'text-orange-500/80 dark:text-orange-400/80',
                      'Batam': 'text-indigo-500/80 dark:text-indigo-400/80',
                      'Pekanbaru': 'text-teal-500/80 dark:text-teal-400/80',
                      'Denpasar': 'text-rose-500/80 dark:text-rose-400/80'
                    }[landmark.name] || 'text-blue-500/80 dark:text-brand-cyan/80'
                  : 'text-slate-400 dark:text-slate-500'
              ]"
            >
              {{ activeCarouselCity === landmark.fullName ? 'Aktif' : 'Pilih Kota' }}
            </span>
          </div>
        </button>
      </div>
    </div>
    <!-- End Carousel Wrapper -->

      <!-- Dot Navigation -->
      <div class="flex items-center justify-center gap-1.5 mt-3 mb-1">
        <button
          v-for="landmark in cityLandmarks"
          :key="'dot-' + landmark.name"
          @click="emit('select-city', landmark.fullName)"
          class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
          :class="activeCarouselCity === landmark.fullName
            ? 'w-5 bg-blue-500 dark:bg-brand-cyan'
            : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'"
          :aria-label="'Pilih ' + landmark.name"
        ></button>
      </div>

      <!-- Around Activity -->
      <AroundActivityPanel 
        v-if="showActivities || !cityLandmarks.some(l => l.fullName === selectedCity)" 
        :selected-city="activeCarouselCity" 
        @select-course="emit('select-course', $event)"
        class="pt-5 border-t border-slate-100 dark:border-brand-navy-800/60"
      />
    </div>
    <!-- End Left Column -->

    <!-- Right: Mobile App Download CTA — Clean card with photo -->
    <div class="cta-card relative rounded-3xl overflow-hidden min-h-[280px] lg:min-h-0 shadow-lg group/cta cursor-default">

      <!-- Soft color blobs (light mode only) -->
      <div class="cta-blob-tl absolute -top-8 -left-8 w-44 h-44 rounded-full pointer-events-none"></div>
      <div class="cta-blob-bl absolute -bottom-10 left-4 w-36 h-36 rounded-full pointer-events-none"></div>
      <div class="cta-blob-tr absolute top-6 right-0 w-28 h-28 rounded-full pointer-events-none"></div>

      <!-- Ring border -->
      <div class="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.07] pointer-events-none"></div>

      <!-- Photo: positioned lower and shifted left to prevent clipping of head and arm -->
      <img
        src="/app-download-bg.png"
        alt=""
        aria-hidden="true"
        class="cta-photo absolute bottom-[-20%] right-[6%] sm:bottom-[-15%] sm:right-[5%] h-[120%] sm:h-[115%] lg:bottom-0 lg:right-0 lg:h-[88%] object-contain object-bottom pointer-events-none select-none"
        draggable="false"
      />

      <!-- ─── Content ─── -->
      <div class="relative h-full flex flex-col justify-between p-5 text-left" style="min-height: inherit;">

        <!-- Top: Icon + title -->
        <div class="flex flex-col gap-3.5">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm p-2 select-none">
            <img src="../assets/logo.svg" alt="Info BMKG Logo" class="w-full h-full object-contain" />
          </div>
          <div class="mt-0.5">
            <p class="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-sky-600 dark:text-brand-cyan">BMKG Mobile</p>
            <h4 class="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-tight mt-0.5">Info BMKG</h4>
            <p class="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-[150px]">
              Pantau <span class="text-slate-800 dark:text-white font-bold">cuaca realtime</span>,
              peringatan <span class="text-slate-800 dark:text-white font-bold">gempa</span>,
              &amp; prakiraan <span class="text-slate-800 dark:text-white font-bold">7 hari</span>.
            </p>
          </div>
        </div>

        <!-- Bottom: store download buttons -->
        <div class="mt-auto flex justify-center w-full">
          <div class="flex flex-row gap-2 w-full max-w-[280px]">
            <!-- Google Play -->
            <a href="https://play.google.com/store/apps/details?id=com.Info_BMKG" target="_blank" rel="noopener noreferrer"
               class="h-9 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-700 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800 flex-1 min-w-0">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-emerald-400 shrink-0">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.58-1.408V3.222c0-.528.22-1.01.58-1.408zM14.5 12.707l2.846 2.846-13.018 7.502a1.99 1.99 0 0 1-.718.131c-.52 0-.996-.2-1.378-.528L14.5 12.707zm7.558-.918l-3.328-1.92-2.176 2.176 2.176 2.176 3.328-1.92a1.144 1.144 0 0 0 0-2.022zM14.5 11.293L2.232 3.223c.382-.328.858-.528 1.378-.528.254 0 .5.048.718.131l13.018 7.502-2.846 2.965z"/>
              </svg>
              <div class="text-left leading-none min-w-0">
                <div class="text-[7px] uppercase font-bold text-slate-400">Temukan di</div>
                <div class="text-[10px] font-black tracking-tight truncate">Google Play</div>
              </div>
            </a>

            <!-- App Store -->
            <a href="https://apps.apple.com/id/app/info-bmkg/id1114372539" target="_blank" rel="noopener noreferrer"
               class="h-9 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-700 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800 flex-1 min-w-0">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-100 shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.01.24.02.36.02.94 0 2.01-.54 2.46-1.35z"/>
              </svg>
              <div class="text-left leading-none min-w-0">
                <div class="text-[7px] uppercase font-bold text-slate-400">Unduh di</div>
                <div class="text-[10px] font-black tracking-tight truncate">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    <!-- End Right CTA column -->

  </div>
</template>

<style scoped>
/* ── CTA Card — Light Mode ── */
.cta-card {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(241, 245, 249, 0.5); /* border-slate-100/50 */
}
.cta-blob-tl {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.16) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-blob-bl {
  background: radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-blob-tr {
  background: radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-photo { 
  opacity: 1.0; 
  filter: drop-shadow(-6px 6px 14px rgba(0, 0, 0, 0.04));
}
.cta-btn-play { background: rgba(2,136,209,0.06); border: 1px solid rgba(2,136,209,0.15); }
.cta-btn-apple { background: rgba(100,100,120,0.04); border: 1px solid rgba(100,100,120,0.08); }
</style>

<style>
/* ── CTA Card — Dark Mode ── */
.dark .cta-card {
  background-color: rgba(11, 22, 48, 0.6) !important; /* bg-brand-navy-900/60 */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 58, 138, 0.2) !important; /* border-brand-navy-700/20 */
}
.dark .cta-blob-tl { 
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-blob-bl { 
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-blob-tr { 
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-photo { 
  opacity: 0.95; 
  filter: drop-shadow(-4px 4px 16px rgba(0, 0, 0, 0.25));
}
.dark .cta-btn-play { background: rgba(0,245,255,0.05); border: 1px solid rgba(0,245,255,0.12); }
.dark .cta-btn-apple { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
</style>

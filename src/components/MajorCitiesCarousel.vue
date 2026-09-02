<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { 
  ChevronLeft, 
  ChevronRight,
  Info
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

const localActiveCity = ref('DKI Jakarta');
const hasUserSelectedCity = ref(false);

// Determine the active city in the 10 major cities carousel
const activeCarouselCity = computed(() => localActiveCity.value);

// ─── Auto Slide Timer Logic (10 seconds interval) ───
let autoSlideInterval: number | null = null;

const stopAutoSlide = () => {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
};

const startAutoSlide = () => {
  stopAutoSlide();
  if (hasUserSelectedCity.value) return;
  
  autoSlideInterval = window.setInterval(() => {
    const currentIndex = cityLandmarks.findIndex(l => l.fullName === activeCarouselCity.value);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % cityLandmarks.length;
      const nextCity = cityLandmarks[nextIndex];
      
      // Auto-slide only changes the local highlight/landmark card view
      // and does not change the parent dashboard's selected city.
      localActiveCity.value = nextCity.fullName;
    }
  }, 10000); // 10 seconds
};

const selectCityManually = (city: string) => {
  hasUserSelectedCity.value = true;
  stopAutoSlide();
  emit('select-city', city);
};

// Sync localActiveCity with selectedCity when selectedCity is one of the 10 major cities
watch(
  () => props.selectedCity,
  (newCity) => {
    const isMajor = cityLandmarks.some(l => l.fullName === newCity);
    if (isMajor) {
      localActiveCity.value = newCity;
    } else {
      // If it is a custom location (e.g. user clicked "Lokasi Saya" in the parent),
      // we reset hasUserSelectedCity so the auto slide resumes.
      hasUserSelectedCity.value = false;
      startAutoSlide();
    }
  },
  { immediate: true }
);

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

const scrollToActiveCard = async () => {
  await nextTick();
  if (!carouselContainer.value) return;
  
  const currentLandmark = cityLandmarks.find(l => l.fullName === activeCarouselCity.value);
  if (!currentLandmark) return;
  
  const activeCard = document.getElementById('landmark-card-' + currentLandmark.name.toLowerCase());
  if (activeCard && carouselContainer.value) {
    const container = carouselContainer.value;
    const cardLeft = activeCard.offsetLeft;
    const cardWidth = activeCard.offsetWidth;
    const containerWidth = container.offsetWidth;
    container.scrollTo({
      left: cardLeft - (containerWidth / 2) + (cardWidth / 2),
      behavior: 'smooth'
    });
  }
};

const showHint = ref(false);
const hintContainer = ref<HTMLElement | null>(null);

const handleClickOutsideHint = (event: MouseEvent) => {
  if (
    showHint.value &&
    hintContainer.value &&
    !hintContainer.value.contains(event.target as Node)
  ) {
    showHint.value = false;
  }
};

// Reset auto-slide timer and scroll active card into view when active city changes
watch(activeCarouselCity, () => {
  scrollToActiveCard();
  if (!hasUserSelectedCity.value) {
    startAutoSlide(); // resets the 10s timer
  }
});

onMounted(() => {
  startAutoSlide();
  // Scroll to active card on initial load
  setTimeout(() => {
    scrollToActiveCard();
  }, 350);
  document.addEventListener('click', handleClickOutsideHint);
});

onUnmounted(() => {
  stopAutoSlide();
  document.removeEventListener('click', handleClickOutsideHint);
});
</script>

<template>
  <!-- Full-width: Carousel card with backdrop -->
  <div class="relative w-full">

    <!-- Carousel card with backdrop -->
    <div class="relative bg-white/85 dark:bg-brand-navy-900/80 border border-slate-100/50 dark:border-brand-navy-700/20 no-blur rounded-3xl p-5 shadow-sm overflow-hidden">
      <!-- Soft gradient wash (no filter:blur — replaced with CSS gradient) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" aria-hidden="true">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(96,165,250,0.15)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08)_0%,transparent_60%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(52,211,153,0.12)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,rgba(52,211,153,0.06)_0%,transparent_60%)]"></div>
      </div>

      <!-- Title & Subtitle + Hints Button -->
      <div class="relative flex items-start justify-between mb-5">
        <div class="space-y-0.5 text-left">
          <h3 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Kondisi Terkini
          </h3>
          <p class="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
            Pilih kota besar untuk informasi lebih lanjut
          </p>
        </div>
        
        <div 
          class="relative shrink-0" 
          ref="hintContainer"
          @mouseenter="showHint = true"
          @mouseleave="showHint = false"
        >
          <button 
            @click.stop="showHint = !showHint"
            class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-navy-800/50 transition-colors duration-200 outline-none cursor-pointer flex items-center justify-center"
            aria-label="Informasi Navigasi"
          >
            <Info class="w-5 h-5" />
          </button>
          
          <!-- Popover -->
          <Transition name="fade-scale">
            <div 
              v-if="showHint"
              class="absolute right-0 mt-3 w-72 sm:w-85 rounded-2xl p-5 z-30 text-left
                bg-slate-900/70 dark:bg-slate-950/60 border border-white/10 dark:border-slate-800/60 backdrop-blur-xl text-slate-300 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.25)]"
            >
              <!-- Top Glow Line -->
              <div class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 dark:via-brand-cyan/60 to-transparent rounded-t-2xl"></div>

              <!-- Arrow pointing to the button (top-right of popover) -->
              <div class="absolute top-[-6px] right-4 w-3 h-3 bg-slate-900/70 dark:bg-slate-950/60 backdrop-blur-xl rotate-45 border-t border-l border-white/10 dark:border-slate-800/60 z-10"></div>

              <!-- Header with Cyan Title & Info Badge -->
              <div class="flex items-center gap-2 mb-3 relative z-20">
                <h4 class="text-sm font-black tracking-wide text-cyan-400 dark:text-brand-cyan">
                  Panduan Navigasi
                </h4>
                <span class="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
                  INFO
                </span>
              </div>
              
              <!-- Subtitle / Description -->
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed mb-4 relative z-20">
                Panduan perilaku carousel 10 kota besar &amp; cara kembali ke lokasi Anda saat ini.
              </p>

              <!-- Bullets List -->
              <ul class="space-y-3.5 text-[10px] sm:text-xs font-normal leading-relaxed relative z-20">
                <!-- Bullet 1 -->
                <li class="flex items-start gap-2.5">
                  <span class="relative flex h-2 w-2 mt-1.5 shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 dark:bg-brand-cyan opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 dark:bg-brand-cyan"></span>
                  </span>
                  <div>
                    <span class="font-extrabold text-white">Slide Otomatis:</span>
                    <span class="text-slate-300"> Mempresentasikan cuaca kota secara bergantian setiap 10 detik. Pada lokasi kustom/GPS, slide berjalan lokal tanpa mengubah cuaca utama Anda.</span>
                  </div>
                </li>
                <!-- Bullet 2 -->
                <li class="flex items-start gap-2.5">
                  <span class="relative flex h-2 w-2 mt-1.5 shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 dark:bg-brand-cyan opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 dark:bg-brand-cyan"></span>
                  </span>
                  <div>
                    <span class="font-extrabold text-white">Pilih Kota:</span>
                    <span class="text-slate-300"> Klik kartu kota manapun untuk beralih secara manual dan mengunci tampilan cuaca pada kota besar tersebut.</span>
                  </div>
                </li>
                <!-- Bullet 3 -->
                <li class="flex items-start gap-2.5">
                  <span class="relative flex h-2 w-2 mt-1.5 shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <div>
                    <span class="font-extrabold text-amber-400">Lokasi Saya:</span>
                    <span class="text-slate-300"> Klik tombol </span>
                    <span class="text-amber-400 font-bold">"LOKASI SAYA"</span>
                    <span class="text-slate-300"> di dropdown lokasi bagian atas layar untuk mengembalikan cuaca ke GPS wilayah Anda saat ini.</span>
                  </div>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Carousel Wrapper -->
      <div class="relative group/carousel w-full">
        <!-- Left Arrow Button -->
        <button 
          @click="scrollCarousel('left')"
          class="absolute -left-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md hover:scale-105 active:scale-95 transition-[transform,opacity,background-color,border-color] duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white dark:bg-brand-navy-800 border-slate-200 dark:border-brand-navy-700 hover:bg-slate-50 dark:hover:bg-brand-navy-750 text-slate-800 dark:text-white transform-gpu will-change-transform"
          aria-label="Previous cities"
        >
          <ChevronLeft class="w-4 h-4 text-slate-800 dark:text-white" />
        </button>
        
        <!-- Right Arrow Button -->
        <button 
          @click="scrollCarousel('right')"
          class="absolute -right-3 top-[27px] -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full border shadow-md hover:scale-105 active:scale-95 transition-[transform,opacity,background-color,border-color] duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex bg-white dark:bg-brand-navy-800 border-slate-200 dark:border-brand-navy-700 hover:bg-slate-50 dark:hover:bg-brand-navy-750 text-slate-800 dark:text-white transform-gpu will-change-transform"
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
            @click="selectCityManually(landmark.fullName)"
            class="gpu-card snap-start flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 min-w-[145px] sm:min-w-[155px] select-none active:scale-[0.97] no-blur relative overflow-hidden group/card shadow-sm"
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
              class="glow-orb absolute -right-6 -top-6 w-16 h-16 rounded-full blur-xl animate-pulse"
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
                      'Jakarta': 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-300',
                      'Surabaya': 'bg-cyan-500/20 text-cyan-600 dark:bg-cyan-500/30 dark:text-cyan-300',
                      'Bandung': 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-300',
                      'Medan': 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-300',
                      'Semarang': 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-300',
                      'Makassar': 'bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-300',
                      'Palembang': 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/30 dark:text-orange-300',
                      'Batam': 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-500/30 dark:text-indigo-300',
                      'Pekanbaru': 'bg-teal-500/20 text-teal-600 dark:bg-teal-500/30 dark:text-teal-300',
                      'Denpasar': 'bg-rose-500/20 text-rose-600 dark:bg-rose-500/30 dark:text-rose-300'
                    }[landmark.name] || 'bg-blue-500/20 text-blue-600 dark:bg-brand-cyan/30 dark:text-brand-cyan'
                  : {
                      'Jakarta': 'bg-blue-50 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
                      'Surabaya': 'bg-cyan-50 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400',
                      'Bandung': 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
                      'Medan': 'bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
                      'Semarang': 'bg-purple-50 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400',
                      'Makassar': 'bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-400',
                      'Palembang': 'bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
                      'Batam': 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
                      'Pekanbaru': 'bg-teal-50 text-teal-500 dark:bg-teal-500/20 dark:text-teal-400',
                      'Denpasar': 'bg-rose-50 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400'
                    }[landmark.name] || 'bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400'
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
                    : 'text-slate-400 dark:text-slate-300/70'
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
          @click="selectCityManually(landmark.fullName)"
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
        class="pt-4"
      />
    </div>
  </div>
</template>

<style scoped>
/* Transition fade-scale */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-6px);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

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

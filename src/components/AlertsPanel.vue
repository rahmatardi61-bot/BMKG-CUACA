<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { AlertTriangle, AlertCircle, Info, Calendar, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { WarningAlert } from '../types/weather';

const props = defineProps<{
  alerts: WarningAlert[];
}>();

// ── Mobile Carousel State ──────────────────────────────────────────────────
const currentIndex = ref(0);
const slideDir = ref<'left' | 'right'>('left');
const showMobileDetail = ref(false);

const prev = () => {
  if (currentIndex.value === 0) return;
  slideDir.value = 'right';
  currentIndex.value--;
};
const next = () => {
  if (currentIndex.value >= props.alerts.length - 1) return;
  slideDir.value = 'left';
  currentIndex.value++;
};
const goTo = (i: number) => {
  slideDir.value = i > currentIndex.value ? 'left' : 'right';
  currentIndex.value = i;
};

const currentAlert = computed(() => props.alerts[currentIndex.value]);

// ── Desktop Floating State ─────────────────────────────────────────────────
const openDesktopIndex = ref<number | null>(null);
const toggleDesktopCard = (index: number) => {
  openDesktopIndex.value = openDesktopIndex.value === index ? null : index;
};

// ── Click Outside to Close Both Panels ──────────────────────────────────────
const wrapperRef = ref<HTMLElement | null>(null);
const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    showMobileDetail.value = false;
    openDesktopIndex.value = null;
  }
};
onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));

// ── Severity Styling ───────────────────────────────────────────────────────
const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'Awas':
      return {
        borderClass: 'border-l-red-500',
        badgeClass: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
        activeRing: 'ring-2 ring-red-400/40',
        detailBg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/20',
        icon: AlertCircle,
        iconColor: 'text-red-500'
      };
    case 'Siaga':
      return {
        borderClass: 'border-l-orange-500',
        badgeClass: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        activeRing: 'ring-2 ring-orange-400/40',
        detailBg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/20',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      };
    default:
      return {
        borderClass: 'border-l-amber-500',
        badgeClass: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        activeRing: 'ring-2 ring-amber-400/40',
        detailBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20',
        icon: Info,
        iconColor: 'text-amber-500'
      };
  }
};

const getAlertDate = (index: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const transitionName = computed(() =>
  slideDir.value === 'left' ? 'slide-alert-left' : 'slide-alert-right'
);
</script>

<template>
  <div class="relative" ref="wrapperRef" v-if="alerts && alerts.length > 0">

    <!-- ─────────────────────────────────────────────────────────────────────────
         1. MOBILE VIEW: Single Card Carousel with Slide Navigation
         ───────────────────────────────────────────────────────────────────────── -->
    <div class="block sm:hidden space-y-2">
      <div class="flex items-center gap-2">
        <!-- Prev button -->
        <button
          type="button"
          @click="prev"
          :disabled="currentIndex === 0"
          class="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-brand-navy-800 border border-slate-200/60 dark:border-brand-navy-600/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Viewport -->
        <div class="flex-1 overflow-hidden relative" style="min-height: 64px;">
          <Transition :name="transitionName" mode="out-in">
            <button
              v-if="currentAlert"
              :key="currentIndex"
              type="button"
              class="w-full bg-white/80 dark:bg-brand-navy-900/70 rounded-r-2xl rounded-l-[5px] shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 overflow-hidden border-l-4 border border-slate-100/60 dark:border-brand-navy-700/20 backdrop-blur-md text-left cursor-pointer"
              :class="[
                getSeverityStyle(currentAlert.severity).borderClass,
                showMobileDetail ? getSeverityStyle(currentAlert.severity).activeRing : ''
              ]"
              @click="showMobileDetail = !showMobileDetail"
            >
              <div class="flex items-center gap-3 px-3.5 py-3">
                <component
                  :is="getSeverityStyle(currentAlert.severity).icon"
                  class="w-4 h-4 shrink-0"
                  :class="getSeverityStyle(currentAlert.severity).iconColor"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0" :class="getSeverityStyle(currentAlert.severity).badgeClass">
                      {{ currentAlert.severity }}
                    </span>
                    <div class="flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                      <Calendar class="w-3 h-3" />
                      <span>{{ getAlertDate(currentIndex) }}</span>
                    </div>
                  </div>
                  <h4 class="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">
                    {{ currentAlert.title }}
                  </h4>
                </div>
              </div>
            </button>
          </Transition>
        </div>

        <!-- Next button -->
        <button
          type="button"
          @click="next"
          :disabled="currentIndex >= alerts.length - 1"
          class="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-brand-navy-800 border border-slate-200/60 dark:border-brand-navy-600/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Dot indicators -->
      <div class="flex items-center justify-center gap-1.5">
        <button
          v-for="(_, i) in alerts"
          :key="i"
          type="button"
          @click="goTo(i)"
          class="rounded-full transition-all duration-300 cursor-pointer"
          :class="i === currentIndex
            ? 'w-4 h-1.5 bg-blue-500 dark:bg-brand-cyan'
            : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'"
        ></button>
      </div>

      <!-- Mobile Floating Detail Panel -->
      <Transition name="float-drop">
        <div
          v-if="showMobileDetail && currentAlert"
          class="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white dark:bg-brand-navy-900 rounded-2xl shadow-xl border border-slate-100/60 dark:border-brand-navy-700/40 overflow-hidden"
        >
          <div class="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div class="flex items-start gap-2.5">
              <component :is="getSeverityStyle(currentAlert.severity).icon" class="w-4 h-4 shrink-0 mt-0.5" :class="getSeverityStyle(currentAlert.severity).iconColor" />
              <div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" :class="getSeverityStyle(currentAlert.severity).badgeClass">
                  {{ currentAlert.severity }}
                </span>
                <h4 class="text-sm font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">
                  {{ currentAlert.title }}
                </h4>
                <p class="text-[10px] font-semibold text-blue-500 dark:text-brand-cyan mt-0.5 flex items-center gap-1">
                  <MapPin class="w-2.5 h-2.5 shrink-0" />
                  {{ currentAlert.region }}
                </p>
              </div>
            </div>
            <button type="button" @click.stop="showMobileDetail = false" class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-brand-navy-700 dark:hover:bg-brand-navy-600 text-slate-500 dark:text-slate-400 transition-colors duration-200 cursor-pointer">
              <X class="w-3 h-3" />
            </button>
          </div>
          <div class="mx-4 border-t border-slate-100 dark:border-brand-navy-700/40"></div>
          <div class="px-4 py-3.5">
            <div class="rounded-xl p-3.5 border text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed" :class="getSeverityStyle(currentAlert.severity).detailBg">
              {{ currentAlert.description }}
            </div>
            <div class="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 dark:text-slate-500">
              <Calendar class="w-3 h-3" />
              <span>{{ getAlertDate(currentIndex) }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────────────
         2. DESKTOP VIEW: Multi-Card Side-by-Side Flex Layout (Previous Style)
         ───────────────────────────────────────────────────────────────────────── -->
    <div class="hidden sm:flex sm:flex-row-reverse gap-2.5">
      <button
        v-for="(alert, index) in alerts"
        :key="alert.id"
        type="button"
        class="flex-1 min-w-0 bg-white/80 dark:bg-brand-navy-900/70 rounded-r-2xl rounded-l-[5px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden border-l-4 border border-slate-100/60 dark:border-brand-navy-700/20 backdrop-blur-md text-left cursor-pointer"
        :class="[
          getSeverityStyle(alert.severity).borderClass,
          openDesktopIndex === index ? getSeverityStyle(alert.severity).activeRing : ''
        ]"
        @click="toggleDesktopCard(index)"
      >
        <div class="flex items-start gap-3 px-3.5 py-3">
          <component
            :is="getSeverityStyle(alert.severity).icon"
            class="w-4 h-4 shrink-0 mt-0.5"
            :class="getSeverityStyle(alert.severity).iconColor"
          />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center justify-between gap-1.5 mb-1">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" :class="getSeverityStyle(alert.severity).badgeClass">
                {{ alert.severity }}
              </span>
              <div class="flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                <Calendar class="w-3 h-3" />
                <span>{{ getAlertDate(index) }}</span>
              </div>
            </div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">{{ alert.title }}</h4>
          </div>
        </div>
      </button>

      <!-- Desktop Floating Detail Panel -->
      <Transition name="float-drop">
        <div
          v-if="openDesktopIndex !== null && alerts[openDesktopIndex]"
          class="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white dark:bg-brand-navy-900 rounded-2xl shadow-xl border border-slate-100 dark:border-brand-navy-700/40 overflow-hidden"
        >
          <div class="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div class="flex items-start gap-2.5">
              <component :is="getSeverityStyle(alerts[openDesktopIndex].severity).icon" class="w-4 h-4 shrink-0 mt-0.5" :class="getSeverityStyle(alerts[openDesktopIndex].severity).iconColor" />
              <div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" :class="getSeverityStyle(alerts[openDesktopIndex].severity).badgeClass">
                  {{ alerts[openDesktopIndex].severity }}
                </span>
                <h4 class="text-sm font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">
                  {{ alerts[openDesktopIndex].title }}
                </h4>
                <p class="text-[10px] font-semibold text-blue-500 dark:text-brand-cyan mt-0.5 flex items-center gap-1">
                  <MapPin class="w-2.5 h-2.5 shrink-0" />
                  {{ alerts[openDesktopIndex].region }}
                </p>
              </div>
            </div>
            <button type="button" @click.stop="openDesktopIndex = null" class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-brand-navy-700 dark:hover:bg-brand-navy-600 text-slate-500 dark:text-slate-400 transition-colors duration-200 cursor-pointer">
              <X class="w-3 h-3" />
            </button>
          </div>
          <div class="mx-4 border-t border-slate-100 dark:border-brand-navy-700/40"></div>
          <div class="px-4 py-3.5">
            <div class="rounded-xl p-3.5 border text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed" :class="getSeverityStyle(alerts[openDesktopIndex].severity).detailBg">
              {{ alerts[openDesktopIndex].description }}
            </div>
            <div class="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 dark:text-slate-500">
              <Calendar class="w-3 h-3" />
              <span>{{ getAlertDate(openDesktopIndex) }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
/* Slide left (next) */
.slide-alert-left-enter-active,
.slide-alert-left-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-alert-left-enter-from { transform: translateX(40px); opacity: 0; }
.slide-alert-left-leave-to   { transform: translateX(-40px); opacity: 0; }

/* Slide right (prev) */
.slide-alert-right-enter-active,
.slide-alert-right-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-alert-right-enter-from { transform: translateX(-40px); opacity: 0; }
.slide-alert-right-leave-to   { transform: translateX(40px); opacity: 0; }

/* Floating panel */
.float-drop-enter-active { transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1); }
.float-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.float-drop-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.98); }
.float-drop-leave-to     { opacity: 0; transform: translateY(-4px) scale(0.99); }
</style>

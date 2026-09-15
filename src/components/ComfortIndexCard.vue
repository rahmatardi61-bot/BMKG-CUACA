<script setup lang="ts">
import { computed } from 'vue';
import { getComfortIndex } from '../data/weatherHelpers';

const props = defineProps<{ temp: number }>();

const comfortIndex = computed(() => getComfortIndex(props.temp));
</script>

<template>
    <div class="relative w-full rounded-3xl p-5 overflow-hidden border border-white/10 dark:border-brand-navy-800/40 backdrop-blur-xl bg-white/80 dark:bg-brand-navy-900/60 transition-all duration-300 hover:border-white/15 dark:hover:border-brand-navy-850/50 text-left">
      <!-- Top Glow Border Line -->
      <div class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent rounded-t-2xl"></div>

      <!-- Header Area -->
      <div class="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-brand-navy-800/60 relative z-10">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/10">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.15" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M17.66 6.34l-1.41 1.41M7.76 16.24l-1.41 1.41M6.34 6.34l1.41 1.41M16.24 16.24l1.41 1.41" />
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">
              Indeks Kenyamanan
            </h4>
            <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
              Analisis Paparan Panas &amp; Kenyamanan Aktivitas
            </p>
          </div>
        </div>
      </div>
      
      <!-- Sub-description below header -->
      <div class="relative z-10 mb-4">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {{ comfortIndex.desc }}
        </p>
      </div>

      <!-- Quality Indicator Box (full width, vertikal) -->
      <div class="relative z-10 rounded-xl p-4 flex items-center gap-4 border border-transparent" :class="comfortIndex.colorClass">
        <div v-html="comfortIndex.smileySvg" class="w-10 h-10 shrink-0"></div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold leading-snug">{{ comfortIndex.quality }}</p>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold rounded-full tracking-wider whitespace-nowrap" :class="comfortIndex.pillClass">
              {{ comfortIndex.status }}
            </span>
            <span class="text-[9px] font-semibold opacity-60 whitespace-nowrap">{{ comfortIndex.tempText }}</span>
          </div>
        </div>
      </div>

      <!-- Recommendations (vertikal, full width) -->
      <div class="relative z-10 mt-3 space-y-2.5">
        <!-- Recommendation 1 (Walking) -->
        <div class="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-slate-100/50 dark:bg-brand-navy-950/60">
          <div class="p-2.5 rounded-xl bg-slate-100/60 dark:bg-brand-navy-900/80 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="4" r="1" />
              <path d="m9 20 2-4.5-1-2.5-1 3.5" />
              <path d="m15 20-2-6.5 2-2.5-1-2.5-2 1" />
            </svg>
          </div>
          <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
            {{ comfortIndex.recommendation1 }}
          </span>
        </div>

        <!-- Recommendation 2 (Windows) -->
        <div class="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-slate-100/50 dark:bg-brand-navy-950/60">
          <div class="p-2.5 rounded-xl bg-slate-100/60 dark:bg-brand-navy-900/80 shrink-0" :class="comfortIndex.iconColor">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="1" stroke-width="1.5" />
              <path d="M4 3 L2 5 L2 19 L4 21 Z" opacity="0.15" fill="currentColor" />
              <path d="M4 3 L2 5 L2 19 L4 21" />
              <path d="M20 3 L22 5 L22 19 L20 21 Z" opacity="0.15" fill="currentColor" />
              <path d="M20 3 L22 5 L22 19 L20 21" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </div>
          <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
            {{ comfortIndex.recommendation2 }}
          </span>
        </div>
      </div>
    </div>
</template>

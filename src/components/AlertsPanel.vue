<script setup lang="ts">
import { AlertTriangle, AlertCircle, Info, Calendar } from 'lucide-vue-next';
import type { WarningAlert } from '../types/weather';

defineProps<{
  alerts: WarningAlert[];
}>();

// Map severity classes
const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'Awas':
      return {
        borderClass: 'border-l-red-500',
        badgeClass: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
        icon: AlertCircle,
        iconColor: 'text-red-500'
      };
    case 'Siaga':
      return {
        borderClass: 'border-l-orange-500',
        badgeClass: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      };
    default: // Waspada
      return {
        borderClass: 'border-l-amber-500',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        icon: Info,
        iconColor: 'text-amber-500'
      };
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Red Badge -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Peringatan Dini</h3>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
          {{ alerts.length }}
        </span>
      </div>
      <button 
        type="button" 
        class="group flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/15 dark:bg-brand-cyan/10 dark:hover:bg-brand-cyan/20 border border-blue-500/20 dark:border-brand-cyan/30 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-brand-cyan shadow-sm hover:shadow transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <span>Selengkapnya</span>
        <svg class="w-3 h-3 transform transition-transform group-hover:translate-x-0.5 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Alert Cards List -->
    <div class="space-y-3">
      <div 
        v-for="alert in alerts" 
        :key="alert.id"
        class="bg-white/70 dark:bg-brand-navy-900/60 rounded-r-2xl rounded-l-md p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex gap-3.5 border-l-4 border-y-0 border-r-0 backdrop-blur-md"
        :class="getSeverityStyle(alert.severity).borderClass"
      >
        <!-- Severity Icon -->
        <div class="shrink-0 mt-0.5">
          <component 
            :is="getSeverityStyle(alert.severity).icon" 
            class="w-4 h-4" 
            :class="getSeverityStyle(alert.severity).iconColor"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 justify-between">
            <span 
              class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border-0"
              :class="getSeverityStyle(alert.severity).badgeClass"
            >
              {{ alert.severity }}
            </span>
            
            <div class="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <Calendar class="w-3 h-3" />
              <span>{{ alert.date }}</span>
            </div>
          </div>

          <h4 class="text-xs font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">
            {{ alert.title }}
          </h4>
          <p class="text-xs font-medium text-blue-500 dark:text-brand-cyan mt-0.5">
            Wilayah: {{ alert.region }}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {{ alert.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

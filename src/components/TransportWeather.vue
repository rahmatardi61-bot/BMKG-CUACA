<script setup lang="ts">
import { 
  Car, 
  Plane, 
  Compass, 
  Train, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon 
} from 'lucide-vue-next';
import type { TransportStatus } from '../types/weather';

defineProps<{
  statuses: TransportStatus[];
}>();

// Map transport type to icon
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'road': return Car;
    case 'air': return Plane;
    case 'rail': return Train;
    case 'maritime': return Compass;
    default: return Car;
  }
};

// Map status to badge icons
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Aman': return CheckCircle2;
    case 'Waspada': return AlertTriangle;
    case 'Awas': return AlertOctagon;
    default: return CheckCircle2;
  }
};

// Map transport type to brand color class (for icon background)
const getBgIconClass = (type: string) => {
  switch (type) {
    case 'road':
      return 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
    case 'air':
      return 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400';
    case 'rail':
      return 'bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400';
    case 'maritime':
      return 'bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400';
    default:
      return 'bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400';
  }
};
</script>

<template>
  <div class="space-y-4" v-api-marker:transport>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Transportasi & Lalu Lintas</h3>
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Weather for Traffic</span>
    </div>

    <div class="space-y-3">
      <div 
        v-for="item in statuses" 
        :key="item.type"
        class="bg-white/90 dark:bg-brand-navy-900/90 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-[4px] p-4 shadow-sm hover:shadow-md transition-[box-shadow] duration-300 flex items-start gap-3 no-blur"
      >
        <!-- Vehicle Category Icon -->
        <div class="p-2 rounded-[4px] shrink-0 transition-transform duration-300" :class="getBgIconClass(item.type)">
          <component :is="getTypeIcon(item.type)" class="w-5 h-5" />
        </div>

        <!-- Details Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-bold text-slate-800 dark:text-white">{{ item.title }}</h4>
            
            <!-- Dynamic Severity Badge -->
            <span 
              class="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border-0" 
              :class="item.statusClass"
              style="border-width: 0 !important;"
            >
              <component :is="getStatusIcon(item.status)" class="w-3 h-3" />
              <span>{{ item.status }}</span>
            </span>
          </div>

          <!-- Advisory Description text -->
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal font-medium">
            {{ item.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

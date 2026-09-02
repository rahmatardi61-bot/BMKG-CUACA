<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  minHeight?: string;
  title?: string;
  subtitle?: string;
  rootMargin?: string;
}>(), {
  minHeight: '460px',
  title: 'Memuat Komponen Telemetri...',
  subtitle: 'Sinkronisasi data sensor BMKG',
  rootMargin: '250px 0px'
});

const isVisible = ref(false);
const containerRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    isVisible.value = true;
    return;
  }

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
      isVisible.value = true;
      if (observer && containerRef.value) {
        observer.unobserve(containerRef.value);
        observer.disconnect();
        observer = null;
      }
    }
  }, {
    root: null,
    rootMargin: props.rootMargin,
    threshold: 0
  });

  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <div ref="containerRef" class="w-full transition-opacity duration-500" :style="{ minHeight: !isVisible ? minHeight : undefined }">
    <slot v-if="isVisible" />

    <!-- Futuristic Shimmer Skeleton Card -->
    <div 
      v-else 
      class="w-full rounded-2xl p-6 border border-slate-100/60 dark:border-brand-navy-800/40 bg-white/70 dark:bg-brand-navy-900/60 shadow-sm backdrop-blur-md flex flex-col justify-between overflow-hidden relative"
      :style="{ height: minHeight }"
    >
      <!-- Top Glowing Shimmer Line -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 dark:via-brand-cyan/40 to-transparent animate-pulse"></div>

      <!-- Header Skeleton -->
      <div class="flex items-center justify-between gap-4 mb-6 z-10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-brand-navy-800/80 animate-pulse flex items-center justify-center">
            <span class="w-3 h-3 rounded-full bg-blue-500/40 dark:bg-brand-cyan/40 animate-ping"></span>
          </div>
          <div class="space-y-1.5">
            <div class="h-3 w-36 sm:w-48 bg-slate-200/80 dark:bg-brand-navy-800/80 rounded-full animate-pulse"></div>
            <div class="h-2 w-24 sm:w-32 bg-slate-200/50 dark:bg-brand-navy-800/50 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="h-6 w-20 bg-slate-200/60 dark:bg-brand-navy-800/60 rounded-full animate-pulse"></div>
      </div>

      <!-- Main Body Shimmer Surface with Radar/Sonar Wave -->
      <div class="flex-1 w-full rounded-xl bg-slate-100/60 dark:bg-brand-navy-950/60 border border-slate-200/40 dark:border-brand-navy-800/40 relative overflow-hidden flex items-center justify-center">
        <!-- Radial Radar Pulse -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div class="w-32 h-32 rounded-full border border-blue-500/30 dark:border-brand-cyan/30 animate-ping" style="animation-duration: 3s;"></div>
          <div class="w-48 h-48 rounded-full border border-blue-500/20 dark:border-brand-cyan/20 animate-ping" style="animation-duration: 4s; animation-delay: 1s;"></div>
        </div>

        <!-- Diagonal Light Shimmer Sweep -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-shimmer"></div>

        <!-- Center Status Pill -->
        <div class="z-10 flex flex-col items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-brand-navy-900/80 border border-slate-200/50 dark:border-brand-navy-800/60 shadow-sm backdrop-blur-md">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500 dark:bg-brand-cyan animate-pulse"></span>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{{ title }}</span>
          </div>
          <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500">{{ subtitle }}</span>
        </div>
      </div>

      <!-- Bottom Controls Skeleton -->
      <div class="flex items-center justify-between pt-4 mt-4 border-t border-slate-100/80 dark:border-brand-navy-800/40 z-10">
        <div class="h-3 w-28 bg-slate-200/60 dark:bg-brand-navy-800/60 rounded-full animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-7 w-16 bg-slate-200/60 dark:bg-brand-navy-800/60 rounded-lg animate-pulse"></div>
          <div class="h-7 w-16 bg-slate-200/60 dark:bg-brand-navy-800/60 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>

<template>
  <!-- ForecastPanel Skeleton -->
  <div class="animate-pulse rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm">
    <!-- Title -->
    <div class="h-5 w-36 rounded-full bg-slate-200 dark:bg-brand-navy-700 mb-4"></div>
    <!-- Hourly forecast strip -->
    <div class="flex gap-2 overflow-hidden">
      <div
        v-for="i in 8"
        :key="i"
        class="flex-shrink-0 w-14 h-24 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"
      ></div>
    </div>
    <!-- Graph placeholder -->
    <div class="h-20 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700 mt-4"></div>
  </div>
</template>

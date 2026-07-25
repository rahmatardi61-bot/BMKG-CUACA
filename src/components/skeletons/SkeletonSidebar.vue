<template>
  <!-- Sidebar Skeleton: WeatherActivity + TransportWeather -->
  <div class="space-y-6">
    <!-- WeatherActivity skeleton -->
    <div class="animate-pulse rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm space-y-4">
      <div class="h-5 w-40 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
      <!-- Tab buttons -->
      <div class="flex gap-2">
        <div v-for="i in 3" :key="i" class="h-8 flex-1 rounded-xl bg-slate-200 dark:bg-brand-navy-700"></div>
      </div>
      <!-- Content area -->
      <div class="h-48 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
      <div class="space-y-2">
        <div class="h-3 w-full rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <div class="h-3 w-4/5 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <div class="h-3 w-3/5 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
      </div>
    </div>
    <!-- TransportWeather skeleton -->
    <div class="animate-pulse rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm space-y-3">
      <div class="h-5 w-32 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
      <div v-for="i in 3" :key="i" class="h-14 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
    </div>
  </div>
</template>

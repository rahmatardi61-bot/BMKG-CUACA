<template>
  <!-- CurrentWeather Skeleton -->
  <div class="animate-pulse rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm overflow-hidden">
    <!-- Header row -->
    <div class="flex items-start justify-between mb-5">
      <div class="space-y-2">
        <div class="h-3 w-28 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <div class="h-6 w-44 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
      </div>
      <div class="h-8 w-20 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
    </div>
    <!-- Main temp + icon -->
    <div class="flex items-center gap-6 mb-6">
      <div class="h-24 w-24 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
      <div class="space-y-3 flex-1">
        <div class="h-12 w-32 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <div class="h-4 w-48 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <div class="h-3 w-36 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
      </div>
    </div>
    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
    </div>
  </div>
</template>

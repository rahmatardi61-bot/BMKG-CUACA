<template>
  <!-- Full Dashboard Skeleton — ditampilkan saat MainDashboard chunk belum selesai di-load -->
  <main class="w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left sidebar (col 1) -->
      <div class="space-y-6">
        <!-- Location header -->
        <div class="h-10 w-48 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
        <!-- AlertsPanel placeholder -->
        <div class="h-16 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
        <!-- Kondisi Terkini card -->
        <div class="rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm space-y-4">
          <div class="h-6 w-36 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
          <div class="flex gap-2 overflow-hidden">
            <div v-for="i in 4" :key="i" class="flex-shrink-0 w-36 h-14 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
          </div>
        </div>
        <!-- AroundActivity placeholder -->
        <div class="h-48 w-full rounded-3xl bg-slate-200 dark:bg-brand-navy-700"></div>
      </div>

      <!-- Center (col 2) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- CurrentWeather -->
        <div class="rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm">
          <div class="flex items-start justify-between mb-5">
            <div class="space-y-2">
              <div class="h-3 w-28 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
              <div class="h-6 w-44 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
            </div>
            <div class="h-8 w-20 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
          </div>
          <div class="flex items-center gap-6 mb-6">
            <div class="h-24 w-24 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
            <div class="space-y-3 flex-1">
              <div class="h-12 w-32 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
              <div class="h-4 w-48 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="i in 3" :key="i" class="h-16 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
          </div>
        </div>
        <!-- ForecastPanel -->
        <div class="rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm">
          <div class="h-5 w-36 rounded-full bg-slate-200 dark:bg-brand-navy-700 mb-4"></div>
          <div class="flex gap-2 overflow-hidden">
            <div v-for="i in 7" :key="i" class="flex-shrink-0 w-14 h-24 rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
          </div>
        </div>
      </div>

      <!-- Right sidebar: hidden on smaller screens -->
      <div class="hidden lg:block space-y-6">
        <div class="rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm space-y-4">
          <div class="h-5 w-40 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
          <div class="flex gap-2">
            <div v-for="i in 3" :key="i" class="h-8 flex-1 rounded-xl bg-slate-200 dark:bg-brand-navy-700"></div>
          </div>
          <div class="h-48 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
        </div>
        <div class="rounded-3xl bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 p-5 shadow-sm space-y-3">
          <div class="h-5 w-32 rounded-full bg-slate-200 dark:bg-brand-navy-700"></div>
          <div v-for="i in 3" :key="i" class="h-14 w-full rounded-2xl bg-slate-200 dark:bg-brand-navy-700"></div>
        </div>
      </div>

    </div>
  </main>
</template>

<template>
  <!-- Sidebar Skeleton — Premium Shimmer -->
  <div class="space-y-6">

    <!-- WeatherActivity skeleton -->
    <div class="skeleton-card p-5 overflow-hidden space-y-4">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>

      <!-- Title -->
      <div class="sk-bar skeleton-shimmer h-4 w-36"></div>

      <!-- Tab buttons -->
      <div class="flex gap-2">
        <div v-for="i in 3" :key="i" class="h-8 flex-1 sk-block skeleton-shimmer rounded-[4px]" :style="{ animationDelay: `${i * 80}ms` }"></div>
      </div>

      <!-- Large content area -->
      <div class="sk-block skeleton-shimmer h-44 w-full rounded-[4px]"></div>

      <!-- Text lines -->
      <div class="space-y-2">
        <div class="sk-bar skeleton-shimmer h-2.5 w-full"></div>
        <div class="sk-bar skeleton-shimmer h-2.5 w-4/5" style="animation-delay: 80ms"></div>
        <div class="sk-bar skeleton-shimmer h-2.5 w-3/5" style="animation-delay: 160ms"></div>
      </div>
    </div>

    <!-- TransportWeather skeleton -->
    <div class="skeleton-card p-5 overflow-hidden space-y-3">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

      <!-- Title -->
      <div class="sk-bar skeleton-shimmer h-4 w-28 mb-1"></div>

      <!-- Transport rows -->
      <div
        v-for="i in 3" :key="i"
        class="sk-block skeleton-shimmer h-14 w-full rounded-[4px]"
        :style="{ animationDelay: `${(i - 1) * 100}ms` }"
      ></div>
    </div>

  </div>
</template>

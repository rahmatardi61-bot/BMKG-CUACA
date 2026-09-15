<template>
  <!-- ForecastPanel Skeleton — Premium Shimmer -->
  <div class="skeleton-card p-5 overflow-hidden">
    <!-- Glowing accent line at top -->
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>

    <!-- Title + tab buttons row -->
    <div class="flex items-center justify-between mb-5">
      <div class="sk-bar skeleton-shimmer h-4 w-32"></div>
      <div class="flex gap-2">
        <div v-for="i in 3" :key="i" class="sk-bar skeleton-shimmer h-6 w-14 rounded-[4px]"></div>
      </div>
    </div>

    <!-- Hourly forecast strip -->
    <div class="flex gap-2 overflow-hidden">
      <div
        v-for="i in 8"
        :key="i"
        class="flex-shrink-0 sk-block skeleton-shimmer w-14 h-24 rounded-[4px]"
        :style="{ animationDelay: `${(i - 1) * 80}ms` }"
      ></div>
    </div>

    <!-- Graph placeholder -->
    <div class="sk-block skeleton-shimmer h-20 w-full rounded-[4px] mt-4"></div>

    <!-- Bottom legend dots -->
    <div class="flex items-center gap-3 mt-3">
      <div v-for="i in 3" :key="i" class="flex items-center gap-1.5">
        <div class="w-2 h-2 rounded-full skeleton-shimmer" :style="{ animationDelay: `${i * 100}ms` }"></div>
        <div class="sk-bar skeleton-shimmer h-2 w-10"></div>
      </div>
    </div>
  </div>
</template>

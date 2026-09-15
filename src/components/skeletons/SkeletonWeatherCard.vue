<template>
  <!-- CurrentWeather Skeleton — Premium Shimmer -->
  <div class="skeleton-card p-5 overflow-hidden">
    <!-- Glowing accent line at top -->
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent"></div>

    <!-- Header row -->
    <div class="flex items-start justify-between mb-5">
      <div class="space-y-2.5">
        <div class="sk-bar skeleton-shimmer h-2.5 w-24"></div>
        <div class="sk-bar skeleton-shimmer h-5 w-40"></div>
      </div>
      <div class="sk-bar skeleton-shimmer h-7 w-20 rounded-[4px]"></div>
    </div>

    <!-- Main temp + icon -->
    <div class="flex items-center gap-6 mb-6">
      <div class="sk-block skeleton-shimmer h-24 w-24 rounded-[4px]"></div>
      <div class="space-y-3 flex-1">
        <div class="sk-bar skeleton-shimmer h-11 w-28"></div>
        <div class="sk-bar skeleton-shimmer h-3.5 w-44"></div>
        <div class="sk-bar skeleton-shimmer h-3 w-32"></div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3">
      <div
        v-for="(i, idx) in 3" :key="i"
        class="sk-block skeleton-shimmer h-16 rounded-[4px]"
        :style="{ animationDelay: `${idx * 120}ms` }"
      ></div>
    </div>
  </div>
</template>

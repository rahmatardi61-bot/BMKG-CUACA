<template>
  <!-- Full Dashboard Skeleton — Premium Shimmer -->
  <main class="w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left sidebar (col 1) -->
      <div class="space-y-6">
        <!-- Location header pill -->
        <div class="sk-bar skeleton-shimmer h-9 w-52 rounded-full"></div>

        <!-- AlertsPanel placeholder -->
        <div class="sk-block skeleton-shimmer h-14 w-full rounded-[4px]"></div>

        <!-- Kondisi Terkini card -->
        <div class="skeleton-card p-5 space-y-4 overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent"></div>
          <div class="sk-bar skeleton-shimmer h-4 w-32"></div>
          <div class="flex gap-2 overflow-hidden">
            <div
              v-for="i in 4" :key="i"
              class="flex-shrink-0 sk-block skeleton-shimmer w-36 h-14 rounded-[4px]"
              :style="{ animationDelay: `${(i - 1) * 90}ms` }"
            ></div>
          </div>
        </div>

        <!-- AroundActivity placeholder -->
        <div class="skeleton-card p-5 space-y-4 overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"></div>
          <div class="sk-bar skeleton-shimmer h-4 w-40"></div>
          <div class="sk-block skeleton-shimmer h-36 w-full rounded-[4px]"></div>
          <div class="space-y-2">
            <div class="sk-bar skeleton-shimmer h-2.5 w-full"></div>
            <div class="sk-bar skeleton-shimmer h-2.5 w-3/4" style="animation-delay:80ms"></div>
          </div>
        </div>
      </div>

      <!-- Center (col 2) -->
      <div class="lg:col-span-2 space-y-6">

        <!-- CurrentWeather skeleton -->
        <div class="skeleton-card p-5 overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"></div>
          <div class="flex items-start justify-between mb-5">
            <div class="space-y-2.5">
              <div class="sk-bar skeleton-shimmer h-2.5 w-24"></div>
              <div class="sk-bar skeleton-shimmer h-5 w-44"></div>
            </div>
            <div class="sk-bar skeleton-shimmer h-7 w-20 rounded-[4px]"></div>
          </div>
          <div class="flex items-center gap-6 mb-6">
            <div class="sk-block skeleton-shimmer h-24 w-24 rounded-[4px]"></div>
            <div class="space-y-3 flex-1">
              <div class="sk-bar skeleton-shimmer h-12 w-32"></div>
              <div class="sk-bar skeleton-shimmer h-3.5 w-48"></div>
              <div class="sk-bar skeleton-shimmer h-3 w-36"></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="(_, idx) in 3" :key="idx" class="sk-block skeleton-shimmer h-16 rounded-[4px]" :style="{ animationDelay: `${idx * 100}ms` }"></div>
          </div>
        </div>

        <!-- ForecastPanel skeleton -->
        <div class="skeleton-card p-5 overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>
          <div class="sk-bar skeleton-shimmer h-4 w-36 mb-5"></div>
          <div class="flex gap-2 overflow-hidden">
            <div
              v-for="i in 7" :key="i"
              class="flex-shrink-0 sk-block skeleton-shimmer w-14 h-24 rounded-[4px]"
              :style="{ animationDelay: `${(i - 1) * 70}ms` }"
            ></div>
          </div>
          <div class="sk-block skeleton-shimmer h-20 w-full rounded-[4px] mt-4"></div>
        </div>

      </div>

      <!-- Right sidebar: hidden on smaller screens -->
      <div class="hidden lg:block space-y-6">
        <!-- WeatherActivity -->
        <div class="skeleton-card p-5 overflow-hidden space-y-4">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
          <div class="sk-bar skeleton-shimmer h-4 w-40"></div>
          <div class="flex gap-2">
            <div v-for="i in 3" :key="i" class="h-8 flex-1 sk-block skeleton-shimmer rounded-[4px]" :style="{ animationDelay: `${i * 80}ms` }"></div>
          </div>
          <div class="sk-block skeleton-shimmer h-44 w-full rounded-[4px]"></div>
        </div>

        <!-- TransportWeather -->
        <div class="skeleton-card p-5 overflow-hidden space-y-3">
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          <div class="sk-bar skeleton-shimmer h-4 w-32 mb-1"></div>
          <div
            v-for="i in 3" :key="i"
            class="sk-block skeleton-shimmer h-14 w-full rounded-[4px]"
            :style="{ animationDelay: `${(i - 1) * 100}ms` }"
          ></div>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup lang="ts">
import logoSvg from '../assets/logo.svg';
</script>

<template>
  <!-- Right: Mobile App Download CTA — Clean card with photo -->
  <div class="cta-card relative rounded-[4px] overflow-hidden min-h-[280px] lg:min-h-0 shadow-lg group/cta cursor-default w-full h-full flex-1 flex flex-col">

    <!-- Soft color blobs (light mode only) -->
    <div class="cta-blob-tl absolute -top-8 -left-8 w-44 h-44 rounded-full pointer-events-none"></div>
    <div class="cta-blob-bl absolute -bottom-10 left-4 w-36 h-36 rounded-full pointer-events-none"></div>
    <div class="cta-blob-tr absolute top-6 right-0 w-28 h-28 rounded-full pointer-events-none"></div>

    <!-- Ring border -->
    <div class="absolute inset-0 rounded-[4px] ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.07] pointer-events-none"></div>

    <!-- Photo: positioned lower and shifted right to sit closer to right border -->
    <img
      src="/app-download-bg.webp"
      alt=""
      aria-hidden="true"
      class="cta-photo absolute bottom-[-20%] right-[-3.5%] sm:bottom-[-15%] sm:right-[-2%] h-[120%] sm:h-[115%] lg:bottom-0 lg:right-0 lg:h-[88%] object-contain object-bottom pointer-events-none select-none"
      draggable="false"
    />

    <!-- ─── Content ─── -->
    <div class="relative w-full h-full flex-1 flex flex-col justify-between p-5 sm:p-6 text-left z-10">

      <!-- Top: Icon + title -->
      <div class="flex flex-col gap-3.5">
        <div class="w-12 h-12 rounded-[4px] flex items-center justify-center bg-white/70 dark:bg-white/15 backdrop-blur-md border border-slate-200/50 dark:border-white/20 shadow-sm dark:shadow-white/5 p-2 select-none">
          <img :src="logoSvg" alt="Info BMKG Logo" class="w-full h-full object-contain" />
        </div>
        <div class="mt-0.5">
          <p class="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-sky-600 dark:text-brand-cyan">BMKG Mobile</p>
          <h4 class="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-tight mt-0.5">Info BMKG</h4>
          <p class="text-[10px] sm:text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-[170px]">
            Pantau <span class="text-slate-800 dark:text-white font-bold">cuaca realtime</span>,
            peringatan <span class="text-slate-800 dark:text-white font-bold">gempa</span>,
            &amp; prakiraan <span class="text-slate-800 dark:text-white font-bold">7 hari</span>.
          </p>
        </div>
      </div>

      <!-- Bottom: store download buttons -->
      <div class="mt-auto pt-6 flex justify-center w-full">
        <div class="flex flex-row gap-2 w-full max-w-[280px]">
          <!-- Google Play -->
          <a href="https://play.google.com/store/apps/details?id=com.Info_BMKG" target="_blank" rel="noopener noreferrer"
             class="h-9 px-3 rounded-[4px] border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-700 text-white dark:bg-brand-navy-900/ dark:border-brand-navy-800 flex-1 min-w-0">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-emerald-400 shrink-0">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.58-1.408V3.222c0-.528.22-1.01.58-1.408zM14.5 12.707l2.846 2.846-13.018 7.502a1.99 1.99 0 0 1-.718.131c-.52 0-.996-.2-1.378-.528L14.5 12.707zm7.558-.918l-3.328-1.92-2.176 2.176 2.176 2.176 3.328-1.92a1.144 1.144 0 0 0 0-2.022zM14.5 11.293L2.232 3.223c.382-.328.858-.528 1.378-.528.254 0 .5.048.718.131l13.018 7.502-2.846 2.965z"/>
            </svg>
            <div class="text-left leading-none min-w-0">
              <div class="text-[7px] uppercase font-bold text-slate-400">Temukan di</div>
              <div class="text-[10px] font-black tracking-tight truncate">Google Play</div>
            </div>
          </a>

          <!-- App Store -->
          <a href="https://apps.apple.com/id/app/info-bmkg/id1114372539" target="_blank" rel="noopener noreferrer"
             class="h-9 px-3 rounded-[4px] border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-700 text-white dark:bg-brand-navy-900/ dark:border-brand-navy-800 flex-1 min-w-0">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-100 shrink-0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.01.24.02.36.02.94 0 2.01-.54 2.46-1.35z"/>
            </svg>
            <div class="text-left leading-none min-w-0">
              <div class="text-[7px] uppercase font-bold text-slate-400">Unduh di</div>
              <div class="text-[10px] font-black tracking-tight truncate">App Store</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CTA Card — Light Mode ── */
.cta-card {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(241, 245, 249, 0.5);
}
.cta-blob-tl {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.16) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-blob-bl {
  background: radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-blob-tr {
  background: radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%);
  filter: blur(16px);
}
.cta-photo { 
  opacity: 1.0; 
  filter: drop-shadow(-6px 6px 14px rgba(0, 0, 0, 0.04));
}
</style>

<style>
/* ── CTA Card — Dark Mode ── */
.dark .cta-card {
  background-color: rgba(11, 22, 48, 0.6) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 58, 138, 0.2) !important;
}
.dark .cta-blob-tl { 
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-blob-bl { 
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-blob-tr { 
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%) !important; 
  filter: blur(20px);
}
.dark .cta-photo { 
  opacity: 0.95; 
  filter: drop-shadow(-4px 4px 16px rgba(0, 0, 0, 0.25));
}
</style>

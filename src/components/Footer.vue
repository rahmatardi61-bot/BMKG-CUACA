<script setup lang="ts">
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Globe, 
  Mail, 
  PhoneCall 
} from 'lucide-vue-next';
</script>

<template>
  <footer class="bg-white border-t transition-colors duration-300
    border-slate-200 text-slate-600
    dark:bg-brand-navy-950 dark:border-brand-navy-800 dark:text-slate-400">
    
    <!-- Footer Links Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        
        <!-- Column 1: Weather Services -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
            Layanan Cuaca
          </h4>
          <ul class="space-y-2 text-[11px] font-semibold">
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Cuaca Publik</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Cuaca Penerbangan</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Cuaca Maritim</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Cuaca Karhutla</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Citra Radar</a></li>
          </ul>
        </div>

        <!-- Column 2: Earthquakes & Climate -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
            Eksplorasi
          </h4>
          <ul class="space-y-2 text-[11px] font-semibold">
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Gempabumi Real-time</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Tsunami Early Warning</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Kualitas Udara PM2.5</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Analisis Perubahan Iklim</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Geofisika Potensial</a></li>
          </ul>
        </div>

        <!-- Column 3: Navigation Maps -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
            MAPS & Digital
          </h4>
          <ul class="space-y-2 text-[11px] font-semibold">
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Sistem SIG Cuaca</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Digital Weather for Traffic</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">Aplikasi Info BMKG</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">API Data Terbuka</a></li>
            <li><a href="#" class="hover:text-blue-500 dark:hover:text-brand-cyan transition-colors">E-Library BMKG</a></li>
          </ul>
        </div>

        <!-- Column 4: Contact & Social Info -->
        <div class="space-y-4">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
            Hubungi Kami
          </h4>
          <div class="space-y-2.5 text-[11px] font-medium">
            <p class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan" />
              <span>cc196@bmkg.go.id</span>
            </p>
            <p class="flex items-center gap-2">
              <PhoneCall class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan" />
              <span>Call Center: 196 (Bebas Pulsa)</span>
            </p>
            <p class="flex items-start gap-2">
              <Globe class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan shrink-0 mt-0.5" />
              <span>Jl. Angkasa I No.2, Kemayoran, Jakarta Pusat</span>
            </p>
          </div>
        </div>

      </div>

      <!-- Divider line -->
      <div class="border-t border-slate-200 dark:border-brand-navy-800 my-8"></div>

      <!-- Bottom Branding, Apps & Socials -->
      <div class="grid grid-cols-1 lg:grid-cols-3 items-center gap-6 w-full">
        
        <!-- Left: Logo & Info BMKG -->
        <div class="flex items-center gap-3 shrink-0 justify-center lg:justify-start">
          <img src="../assets/logo.svg" alt="Logo BMKG" class="w-8 h-8 object-contain" />
          <div class="text-left">
            <h5 class="text-xs font-black text-slate-800 dark:text-white leading-none">BMKG Indonesia</h5>
            <span class="text-[9px] text-slate-400 dark:text-brand-navy-600 font-bold uppercase tracking-wider block mt-1">Cepat, Tepat, Akurat, Luas, dan Mudah Dipahami</span>
          </div>
        </div>

        <!-- Center: Google Play & App Store buttons -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 lg:col-start-2">
          <a href="https://play.google.com/store/apps/details?id=com.Info_BMKG" target="_blank" class="h-9 px-3.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-750 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-emerald-400">
               <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.58-1.408V3.222c0-.528.22-1.01.58-1.408zM14.5 12.707l2.846 2.846-13.018 7.502a1.99 1.99 0 0 1-.718.131c-.52 0-.996-.2-1.378-.528L14.5 12.707zm7.558-.918l-3.328-1.92-2.176 2.176 2.176 2.176 3.328-1.92a1.144 1.144 0 0 0 0-2.022zM14.5 11.293L2.232 3.223c.382-.328.858-.528 1.378-.528.254 0 .5.048.718.131l13.018 7.502-2.846 2.965z"/>
            </svg>
            <div class="text-left leading-none">
              <div class="text-[8px] uppercase font-bold text-slate-350">Temukan di</div>
              <div class="text-[11px] font-black">Google Play</div>
            </div>
          </a>
          <a href="https://apps.apple.com/id/app/info-bmkg/id1114372539" target="_blank" class="h-9 px-3.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-750 text-white dark:bg-brand-navy-900 dark:border-brand-navy-800">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-100">
               <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12.01.24.02.36.02.94 0 2.01-.54 2.46-1.35z"/>
            </svg>
            <div class="text-left leading-none">
              <div class="text-[8px] uppercase font-bold text-slate-350">Unduh di</div>
              <div class="text-[11px] font-black">App Store</div>
            </div>
          </a>
        </div>

        <!-- Social Media Links -->
        <div class="flex items-center gap-3 justify-center lg:justify-end">
          <a href="#" class="p-2 rounded-full border border-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:border-brand-navy-850 dark:hover:bg-brand-navy-800 dark:hover:text-brand-cyan transition-colors" title="Facebook BMKG">
            <Facebook class="w-4 h-4" />
          </a>
          <a href="#" class="p-2 rounded-full border border-slate-200 hover:bg-sky-50 hover:text-sky-500 dark:border-brand-navy-850 dark:hover:bg-brand-navy-800 dark:hover:text-brand-cyan transition-colors" title="Twitter BMKG">
            <Twitter class="w-4 h-4" />
          </a>
          <a href="#" class="p-2 rounded-full border border-slate-200 hover:bg-pink-50 hover:text-pink-600 dark:border-brand-navy-850 dark:hover:bg-brand-navy-800 dark:hover:text-brand-cyan transition-colors" title="Instagram BMKG">
            <Instagram class="w-4 h-4" />
          </a>
          <a href="#" class="p-2 rounded-full border border-slate-200 hover:bg-red-50 hover:text-red-600 dark:border-brand-navy-850 dark:hover:bg-brand-navy-800 dark:hover:text-brand-cyan transition-colors" title="Youtube BMKG">
            <Youtube class="w-4 h-4" />
          </a>
        </div>

      </div>

      <!-- Copyright Watermark -->
      <div class="text-center pt-8 text-[10px] text-slate-400 dark:text-brand-navy-600 font-bold uppercase tracking-wider">
        <p>&copy; 2026 BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA. HAK CIPTA DILINDUNGI.</p>
        <p class="mt-1 font-medium text-[9px]">DESIGNED BY LENTERA SINYAL NUSANTARA &bull; REDESIGN PORTAL CUACA</p>
      </div>
    </div>
  </footer>
</template>

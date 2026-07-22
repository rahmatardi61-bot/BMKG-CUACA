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

      <!-- Bottom Branding, Copyright, and Socials -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        
        <!-- Branding -->
        <div class="flex items-center gap-2.5">
          <img src="../assets/logo.svg" alt="Logo BMKG" class="w-7 h-7 object-contain" />
          <div class="text-left">
            <h5 class="text-xs font-black text-slate-800 dark:text-white leading-none">BMKG Indonesia</h5>
            <span class="text-[9px] text-slate-400 dark:text-brand-navy-600 font-semibold">Cepat, Tepat, Akurat, Luas, dan Mudah Dipahami</span>
          </div>
        </div>

        <!-- Copyright -->
        <div class="text-center">
          <p class="text-[10px] text-slate-400 dark:text-brand-navy-600 font-semibold">
            &copy; 2026 Badan Meteorologi, Klimatologi, dan Geofisika. Hak Cipta Dilindungi.
          </p>
          <p class="text-[9px] text-slate-400 dark:text-brand-navy-600 font-medium mt-0.5">
            Designed by Lentera Sinyal Nusantara
          </p>
        </div>

        <!-- Social Media Links -->
        <div class="flex items-center gap-3">
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
    </div>
  </footer>
</template>

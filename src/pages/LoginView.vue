<script setup lang="ts">
import { ref } from 'vue';
import { User, Lock, X, Info, Eye, EyeOff, Loader2, Globe, Shield, Activity } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  showCloseButton?: boolean;
}>(), {
  showCloseButton: true
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login-success', user: { name: string; username: string }): void;
}>();

// Form state
const username = ref('');
const password = ref('');
const showPassword = ref(false);

// UI states
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Form submission handler
const handleLogin = () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Simple client-side validation
  if (!username.value.trim()) {
    errorMessage.value = 'Username tidak boleh kosong';
    return;
  }
  if (!password.value) {
    errorMessage.value = 'Password tidak boleh kosong';
    return;
  }

  isLoading.value = true;

  // Simulate API Request
  setTimeout(() => {
    isLoading.value = false;
    
    // Mock credentials check
    if (username.value.toLowerCase() === 'lentera-01' && password.value === 'lsn123@01') {
      successMessage.value = 'Login berhasil! Mengalihkan...';
      
      setTimeout(() => {
        emit('login-success', {
          name: 'Administrator PT Lentera Sinyal Nusantara',
          username: username.value
        });
      }, 1000);
    } else {
      errorMessage.value = 'Username atau Password salah. Masukkan username dan password yang valid.';
    }
  }, 1200);
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen w-full transition-colors duration-300
    bg-gradient-to-br from-brand-sky-100 to-brand-sky-200 text-slate-800
    dark:from-brand-navy-950 dark:to-slate-950 dark:text-slate-100">
    
    <!-- Premium Backdrop Glows (Only visible in Dark Mode) -->
    <div class="absolute top-10 left-10 w-[500px] h-[500px] rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none hidden dark:block"></div>
    <div class="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none hidden dark:block"></div>

    <!-- Close button (Top-Right) -->
    <button 
      v-if="showCloseButton"
      id="login-close-button"
      @click="emit('close')"
      class="absolute top-6 right-6 p-2.5 rounded-full transition-all duration-300 z-50 cursor-pointer
        bg-white/80 border border-slate-200/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:scale-105 active:scale-95
        dark:bg-brand-navy-900/60 dark:border-brand-navy-800 dark:text-slate-400 dark:hover:bg-brand-navy-800 dark:hover:text-white"
      title="Kembali ke Beranda"
    >
      <X class="w-5 h-5" />
    </button>

    <!-- Main Container: Split screen Card -->
    <div class="w-full max-w-4xl min-h-[550px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-300 border backdrop-blur-md
      bg-white/80 border-slate-200/50
      dark:bg-brand-navy-900/40 dark:border-brand-navy-800/40">
      
      <!-- LEFT COLUMN: Branding & Cyberpunk Weather Visuals (Hidden on mobile) -->
      <div class="hidden md:flex md:w-1/2 p-10 flex-col justify-between relative overflow-hidden bg-gradient-to-br
        from-brand-sky-900 via-blue-900 to-indigo-950 text-white
        dark:from-brand-navy-950 dark:via-brand-navy-900 dark:to-slate-950 border-r
        border-slate-200/20 dark:border-brand-navy-800/40">
        
        <!-- Background Grid Pattern overlay -->
        <div class="absolute inset-0 opacity-[0.08] dark:opacity-[0.05] pointer-events-none select-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <!-- Rotating Meteorological Radar / Compass graphic simulation -->
        <div class="absolute -right-20 -top-20 w-80 h-80 opacity-20 dark:opacity-10 pointer-events-none animate-spin" style="animation-duration: 25s;">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="0.5" class="w-full h-full">
            <circle cx="50" cy="50" r="45" stroke-dasharray="2 2" />
            <circle cx="50" cy="50" r="35" />
            <circle cx="50" cy="50" r="25" stroke-dasharray="4 2" />
            <circle cx="50" cy="50" r="15" />
            <line x1="50" y1="5" x2="50" y2="95" />
            <line x1="5" y1="50" x2="95" y2="50" />
            <line x1="18.18" y1="18.18" x2="81.82" y2="81.82" />
            <line x1="18.18" y1="81.82" x2="81.82" y2="18.18" />
          </svg>
        </div>

        <!-- Top Header Info -->
        <div class="z-10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/20 dark:border-white/10 flex items-center justify-center shrink-0">
            <div class="lsn-logo-mask-desktop" title="PT Lentera Sinyal Nusantara"></div>
          </div>
          <div>
            <h1 class="text-sm font-black tracking-wider leading-none">PT Lentera Sinyal Nusantara</h1>
            <p class="text-[9px] opacity-75 font-semibold mt-0.5 whitespace-nowrap">Teknologi Informasi & Komunikasi</p>
          </div>
        </div>

        <!-- Center: Dynamic Taglines & Visual Elements -->
        <div class="z-10 my-8 space-y-5">
          <div class="space-y-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/10 dark:bg-brand-cyan/10 text-blue-200 dark:text-brand-cyan">
              <Shield class="w-3 h-3" />
              Sistem Akses Internal
            </span>
            <h2 class="text-2xl font-black tracking-tight leading-tight">
              Gerbang Administrasi & Kontrol Data Portal
            </h2>
            <p class="text-xs opacity-75 leading-relaxed">
              Silakan masuk menggunakan kredensial NIP atau email dinas Anda yang terdaftar untuk mengakses konsol manajemen sistem.
            </p>
          </div>

          <!-- Decorative Mini Stats/Indicators -->
          <div class="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div class="flex items-center gap-2">
              <Globe class="w-4 h-4 text-blue-300 dark:text-brand-cyan" />
              <span class="text-[10px] font-bold opacity-80">Jejaring Global WMO</span>
            </div>
            <div class="flex items-center gap-2">
              <Activity class="w-4 h-4 text-emerald-400" />
              <span class="text-[10px] font-bold opacity-80">Server Aktif 24/7</span>
            </div>
          </div>
        </div>

        <!-- Bottom: Disclaimer Note -->
        <div class="z-10 p-4 rounded-xl border bg-white/5 border-white/10 dark:bg-brand-navy-950/40 dark:border-brand-navy-800/40">
          <div class="flex gap-3">
            <Info class="w-5 h-5 shrink-0 mt-0.5 text-amber-300 dark:text-amber-400" />
            <div class="text-[10px] leading-relaxed text-blue-100 dark:text-slate-400 font-semibold">
              <span class="font-bold text-amber-300 dark:text-amber-400 uppercase tracking-wide">Disclaimer Redesign:</span> Halaman otentikasi ini merupakan portal akses untuk development PT Lentera Sinyal Nusantara dan <span class="underline underline-offset-2">bukan</span> merupakan bagian dari re-design visual antarmuka informasi cuaca publik.
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: Elegant Clean Login Form -->
      <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
        <!-- Back link/icon inside the card top left (mobile only) -->
        <div class="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-brand-navy-800/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900/5 dark:bg-white/5 border border-slate-200/20 dark:border-white/10 flex items-center justify-center shrink-0">
              <div class="lsn-logo-mask-mobile" title="PT Lentera Sinyal Nusantara"></div>
            </div>
            <h2 class="text-xs font-black tracking-wider text-slate-800 dark:text-white uppercase">Portal Admin</h2>
          </div>
        </div>

        <!-- Headline -->
        <div class="mb-8">
          <h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Selamat Datang di BMKG-Cuaca</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Akses untuk development PT Lentera Sinyal Nusantara BMKG Cuaca</p>
        </div>

        <!-- Mobile Disclaimer (Only visible on mobile screens) -->
        <div class="md:hidden mb-6 p-4 rounded-xl border text-left flex gap-3
          bg-amber-500/5 border-amber-500/10 text-amber-700 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400">
          <Info class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="text-[10px] leading-relaxed font-semibold">
            <span class="font-bold">Disclaimer:</span> Halaman ini khusus credential PT Lentera Sinyal Nusantara dan <span class="underline">bukan</span> bagian dari re-design cuaca publik.
          </div>
        </div>

        <!-- Form fields -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          
          <!-- Error & Success Message Alerts -->
          <Transition name="fade">
            <div v-if="errorMessage" class="p-3 text-xs font-bold rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2">
              <span class="rounded-full relative shrink-0 bg-red-500" style="width: 6px; height: 6px; min-width: 6px; min-height: 6px;">
                <span class="animate-ping absolute inset-0 rounded-full opacity-75 bg-red-500"></span>
              </span>
              {{ errorMessage }}
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="successMessage" class="p-3 text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span class="rounded-full shrink-0 bg-emerald-500" style="width: 6px; height: 6px; min-width: 6px; min-height: 6px;"></span>
              {{ successMessage }}
            </div>
          </Transition>

          <!-- Input fields -->
          <div class="space-y-4">
            <!-- Username Input -->
            <div class="space-y-1.5">
              <label for="username" class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Username / NIP
              </label>
              <div class="relative group">
                <input 
                  id="username" 
                  type="text" 
                  v-model="username"
                  placeholder="Masukkan username Anda"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-4 py-3 text-xs rounded-xl border outline-none transition-all duration-300
                    bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20
                    dark:bg-brand-navy-950 dark:border-brand-navy-700 dark:text-white dark:placeholder-slate-400 dark:focus:bg-brand-navy-950 dark:focus:border-brand-cyan dark:focus:ring-2 dark:focus:ring-brand-cyan/25"
                />
                <User class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-405 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-brand-cyan" />
              </div>
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <label for="password" class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div class="relative group">
                <input 
                  id="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="password"
                  placeholder="Masukkan password Anda"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-10 py-3 text-xs rounded-xl border outline-none transition-all duration-300
                    bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20
                    dark:bg-brand-navy-950 dark:border-brand-navy-700 dark:text-white dark:placeholder-slate-400 dark:focus:bg-brand-navy-950 dark:focus:border-brand-cyan dark:focus:ring-2 dark:focus:ring-brand-cyan/25"
                />
                <Lock class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-405 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-brand-cyan" />
                
                <button 
                  id="login-toggle-password-button"
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3.5 top-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            id="login-submit-button"
            type="submit" 
            :disabled="isLoading"
            class="w-full py-3.5 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6
              bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01] active:scale-[0.98]
              dark:bg-brand-cyan dark:hover:bg-brand-cyan-500 dark:text-brand-navy-950 dark:hover:shadow-[0_0_20px_rgba(0,245,255,0.35)] dark:hover:scale-[1.01] dark:active:scale-[0.98]"
          >
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span v-else>Masuk ke Portal</span>
          </button>

        </form>

        <!-- Footer watermark inside form -->
        <p class="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-10 font-bold uppercase tracking-wider">
          © 2026 PT LENTERA SINYAL NUSANTARA. ALL RIGHTS RESERVED.
        </p>

      </div>

    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom autofill styles to prevent browser defaults from ruining modes */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-text-fill-color: #1e293b !important;
  -webkit-box-shadow: 0 0 0px 1000px #f8fafc inset !important;
  transition: background-color 5000s ease-in-out 0s;
}

html.dark input:-webkit-autofill,
html.dark input:-webkit-autofill:hover, 
html.dark input:-webkit-autofill:focus,
html.dark input:-webkit-autofill:active {
  -webkit-text-fill-color: #ffffff !important;
  -webkit-box-shadow: 0 0 0px 1000px #070c19 inset !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>

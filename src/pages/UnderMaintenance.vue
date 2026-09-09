<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeft, Send, CheckCircle2, Cpu, Activity, Layers, Wifi } from 'lucide-vue-next';

defineProps<{
  menuName: string;
}>();

const emit = defineEmits<{
  (e: 'back-to-home'): void;
}>();

const feedbackText = ref('');
const isSubmitted = ref(false);

const submitFeedback = () => {
  if (!feedbackText.value.trim()) return;
  isSubmitted.value = true;
  feedbackText.value = '';
  setTimeout(() => {
    isSubmitted.value = false;
  }, 5000);
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden select-none animate-fade-in">
    <!-- Glowing background accent orbs -->
    <div class="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-brand-cyan/5 blur-[120px] pointer-events-none -z-10"></div>
    <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none -z-10"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 dark:bg-brand-cyan/3 blur-[160px] pointer-events-none -z-10"></div>

    <!-- Main Frosted Glass Card -->
    <div class="max-w-xl w-full text-center space-y-8 relative z-10 px-6 sm:px-10 py-12 rounded-[4px] border backdrop-blur-2xl shadow-2xl transition-all duration-500
      bg-white/50 border-white/60 shadow-slate-100/40
      dark:bg-brand-navy-900/20 dark:border-brand-navy-800/40 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      
      <!-- Status Badge -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] border text-[10px] font-black uppercase tracking-widest shadow-sm
        bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        Pemeliharaan Sistem
      </div>

      <!-- Futuristic Tech Scan / Radar Animation -->
      <div class="relative flex justify-center py-2">
        <div class="relative w-44 h-44 flex items-center justify-center">
          <!-- Outer Scan Ring -->
          <div class="absolute inset-0 rounded-full border border-dashed border-blue-500/20 dark:border-brand-cyan/15 animate-[spin_40s_linear_infinite]"></div>
          
          <!-- Outer glowing ring -->
          <div class="absolute w-36 h-36 rounded-full border border-blue-500/20 dark:border-brand-cyan/20 animate-[spin_20s_linear_infinite]">
            <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 dark:bg-brand-cyan shadow-[0_0_10px_#00f5ff]"></div>
          </div>
          
          <!-- Inner ring spinning reverse -->
          <div class="absolute w-28 h-28 rounded-full border border-dashed border-cyan-500/30 dark:border-brand-cyan/20 animate-[spin_10s_linear_infinite_reverse]"></div>
          
          <!-- Central pulsing radar dome -->
          <div class="absolute w-20 h-20 rounded-full bg-blue-500/5 dark:bg-brand-cyan/5 border border-blue-500/20 dark:border-brand-cyan/20 flex items-center justify-center shadow-inner">
            <div class="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-450/20 dark:from-brand-cyan/10 dark:to-blue-600/10 animate-ping"></div>
            <Cpu class="w-8 h-8 text-blue-600 dark:text-brand-cyan relative z-10 animate-pulse" />
          </div>

          <!-- Sweep line simulation -->
          <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/10 dark:to-brand-cyan/15 pointer-events-none animate-[spin_6s_linear_infinite]"></div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="space-y-3.5">
        <h2 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-tight">
          Layanan {{ menuName }} Sedang Diperbarui
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto font-medium">
          Kami sedang meningkatkan sistem transmisi telemetri dan desain visual antarmuka untuk menu <strong class="text-blue-600 dark:text-brand-cyan font-extrabold">{{ menuName }}</strong>. Halaman ini akan segera aktif kembali dengan performa yang lebih optimal.
        </p>
      </div>

      <!-- Telemetry Dashboard Metrics Grid -->
      <div class="grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
        <!-- Stat 1: Status -->
        <div class="p-3.5 rounded-[4px] border bg-white/40 dark:bg-brand-navy-900/10 border-slate-200/50 dark:border-brand-navy-900/60 shadow-2xs">
          <div class="flex items-center gap-1.5 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            <Activity class="w-3 h-3 text-blue-500 dark:text-brand-cyan shrink-0" />
            <span>Status</span>
          </div>
          <p class="text-[11px] font-black text-slate-800 dark:text-white mt-2 leading-none">Sinkronisasi</p>
        </div>
        <!-- Stat 2: Database -->
        <div class="p-3.5 rounded-[4px] border bg-white/40 dark:bg-brand-navy-900/10 border-slate-200/50 dark:border-brand-navy-900/60 shadow-2xs">
          <div class="flex items-center gap-1.5 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            <Layers class="w-3 h-3 text-cyan-500 dark:text-brand-cyan shrink-0" />
            <span>Proses</span>
          </div>
          <p class="text-[11px] font-black text-slate-800 dark:text-white mt-2 leading-none">Fase Migrasi</p>
        </div>
        <!-- Stat 3: Latency -->
        <div class="p-3.5 rounded-[4px] border bg-white/40 dark:bg-brand-navy-900/10 border-slate-200/50 dark:border-brand-navy-900/60 shadow-2xs">
          <div class="flex items-center gap-1.5 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            <Wifi class="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Jaringan</span>
          </div>
          <p class="text-[11px] font-black text-slate-800 dark:text-white mt-2 leading-none">12ms (Stabil)</p>
        </div>
      </div>

      <!-- Animated Progress Bar -->
      <div class="max-w-sm mx-auto p-4 rounded-[4px] border bg-slate-50/40 border-slate-200/50 dark:bg-brand-navy-900/10 dark:border-brand-navy-900/60 space-y-2">
        <div class="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Persentase Pengembangan</span>
          <span class="text-blue-600 dark:text-brand-cyan font-black">85% Selesai</span>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-brand-navy-950 rounded-[4px] overflow-hidden">
          <div class="h-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-brand-cyan dark:to-blue-500 rounded-[4px] w-[85%] relative">
            <!-- Animated progress bar overlay pattern -->
            <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
          </div>
        </div>
        <div class="flex justify-between items-center text-[8px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">
          <span>Modul: UI & Telemetri</span>
          <span class="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Server BMKG Aktif
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          @click="emit('back-to-home')"
          class="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all duration-300 active:scale-95 cursor-pointer shadow-sm
            bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
            dark:bg-brand-cyan dark:border-brand-cyan dark:text-brand-navy-950 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_15px_rgba(0,245,255,0.25)]"
        >
          <ArrowLeft class="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>

      <!-- Feedback Interaction Form -->
      <div class="max-w-sm mx-auto pt-6 border-t border-slate-200/50 dark:border-brand-navy-900/60">
        <Transition name="fade" mode="out-in">
          <div v-if="!isSubmitted" class="space-y-3">
            <label class="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest text-left">
              Beri Masukan untuk Halaman Ini
            </label>
            <form @submit.prevent="submitFeedback" class="flex gap-2">
              <input
                type="text"
                v-model="feedbackText"
                placeholder="Apa yang Anda harapkan di menu ini?"
                class="flex-grow px-4 py-2.5 text-xs rounded-xl border outline-none transition-all
                  bg-slate-100/50 border-transparent text-slate-850 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:shadow-sm focus:ring-1 focus:ring-blue-500/20
                  dark:bg-brand-navy-900/30 dark:border-brand-navy-900 dark:text-slate-100 dark:placeholder-slate-650 dark:focus:bg-brand-navy-900/60 dark:focus:border-brand-cyan/40 dark:focus:ring-brand-cyan/20"
              />
              <button
                type="submit"
                :disabled="!feedbackText.trim()"
                class="p-2.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                  bg-white border-slate-200 text-slate-700 hover:bg-slate-50
                  dark:bg-brand-navy-900/40 dark:border-brand-navy-800 dark:text-slate-350 dark:hover:bg-brand-navy-900/80"
              >
                <Send class="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
          <div v-else class="p-4 rounded-[4px] border flex items-center gap-3 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-fade-in text-left">
            <CheckCircle2 class="w-5 h-5 shrink-0" />
            <div>
              <p class="text-xs font-bold leading-none">Terima Kasih!</p>
              <p class="text-[10px] font-semibold mt-1.5 opacity-90 leading-relaxed">Saran Anda telah tersimpan dan akan membantu proses perancangan menu baru.</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes progress-bar-stripes {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}
</style>

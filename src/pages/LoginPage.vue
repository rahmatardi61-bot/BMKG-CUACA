<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CloudSun, Eye, EyeOff, Loader2, LogIn, ShieldAlert } from 'lucide-vue-next';
import { login } from '../services/auth';

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const userInput = ref<HTMLInputElement | null>(null);

onMounted(() => userInput.value?.focus());

async function submit(): Promise<void> {
  if (loading.value) return;
  error.value = '';
  if (!username.value.trim() || !password.value) {
    error.value = 'Username dan password wajib diisi.';
    return;
  }
  loading.value = true;
  const result = await login(username.value.trim(), password.value);
  if (result.ok) {
    location.reload(); // session tersimpan → root berganti ke aplikasi
    return;
  }
  error.value = result.error;
  loading.value = false;
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-brand-navy-950 via-slate-950 to-brand-navy-900 text-slate-100">
    <!-- dekorasi glow latar -->
    <div class="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse"></div>
    <div class="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-cyan-500/10 blur-3xl animate-pulse"></div>

    <div class="relative w-full max-w-sm">
      <!-- kartu login -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[4px] shadow-2xl p-8">
        <!-- identitas -->
        <div class="flex flex-col items-center text-center">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CloudSun class="w-7 h-7 text-white" />
          </div>
          <h1 class="mt-4 text-xl font-black tracking-tight">BMKG Cuaca <span class="text-cyan-400">Redesign</span></h1>
          <p class="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Akses terbatas · Tim &amp; Partner</p>
        </div>

        <!-- form -->
        <form class="mt-7 space-y-4" @submit.prevent="submit" novalidate>
          <div>
            <label for="login-username" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
            <input
              id="login-username"
              ref="userInput"
              v-model="username"
              name="username"
              type="text"
              autocomplete="username"
              spellcheck="false"
              placeholder="mis. bmkg"
              class="w-full bg-white/5 border border-white/10 rounded-[4px] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <div>
            <label for="login-password" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
            <div class="relative">
              <input
                id="login-password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-white/5 border border-white/10 rounded-[4px] pl-3.5 pr-11 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <button
                type="button"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[4px] text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- error -->
          <div v-if="error" class="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-[4px] px-3 py-2.5">
            <ShieldAlert class="w-4 h-4 shrink-0 mt-px" />
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-[4px] py-2.5 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <LogIn v-else class="w-4 h-4" />
            <span>{{ loading ? 'Memproses…' : 'Masuk' }}</span>
          </button>
        </form>
      </div>

      <!-- catatan -->
      <p class="mt-5 text-center text-[10px] text-slate-500 leading-relaxed">
        Halaman ini terpisah dari aplikasi publik — khusus internal &amp; mitra kerja.<br />
        Sesi aktif 7 hari di browser ini. Sumber data: BMKG.
      </p>
    </div>
  </div>
</template>

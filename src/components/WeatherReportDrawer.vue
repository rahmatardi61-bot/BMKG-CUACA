<script setup lang="ts">
import { computed } from 'vue'
import { X, MapPin, CheckCircle2, AlertTriangle, Loader2, ThumbsUp } from 'lucide-vue-next'
import type { Component } from 'vue'

const props = defineProps<{
  isOpen: boolean
  selectedCity: string
  weatherTemp: number
  weatherIcon: Component
  reportSubmitting: boolean
  reportSuccess: boolean
  reportActiveTab: 'feedback' | 'history'
  reportForm: { condition: string; tempFeeling: string; otherConditions: string[]; comment: string }
  reportHistory: Array<{ id: string; city: string; time: string; condition: string; tempFeeling: string; otherConditions: string[]; comment: string }>
  overallConditions: Array<{ name: string; label: string; icon: Component }>
  tempFeelings: Array<{ name: string; label: string; range: string }>
  otherConditionsList: Array<{ name: string; label: string; icon: Component }>
  getConditionIconBg: (label: string) => string
  getConditionIconColor: (label: string) => string
}>()

const emit = defineEmits<{
  close: []
  'update:reportActiveTab': ['feedback' | 'history']
  'update:reportForm': [typeof props.reportForm]
  toggleOtherCondition: [string]
  submit: []
}>()

const cityShort = computed(() => props.selectedCity.split(',')[0])
const cityRest = computed(() => props.selectedCity.split(',').slice(1).map(x => x.trim()).join(', '))

function setCondition(label: string) {
  emit('update:reportForm', { ...props.reportForm, condition: label })
}
function setTempFeeling(label: string) {
  emit('update:reportForm', { ...props.reportForm, tempFeeling: label })
}
function setComment(e: Event) {
  emit('update:reportForm', { ...props.reportForm, comment: (e.target as HTMLTextAreaElement).value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden flex flex-col justify-end md:flex-row md:justify-end">

      <!-- Backdrop -->
      <Transition name="drawer-fade" appear>
        <div v-if="isOpen"
          class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm cursor-default"
          @click="emit('close')" />
      </Transition>

      <!-- Drawer Panel -->
      <Transition name="drawer-slide" appear>
        <div v-if="isOpen"
          class="relative w-full h-full md:max-w-[480px] bg-white/95 dark:bg-brand-navy-950/95 md:border-l border-none shadow-2xl text-slate-800 dark:text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+16px)] px-5 pb-safe md:pt-6 md:px-6 md:pb-0 flex flex-col overflow-hidden rounded-none"
        >
          <!-- Ambient glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div class="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />

          <!-- Close button -->
          <button @click="emit('close')"
            class="absolute top-[calc(env(safe-area-inset-top,16px)+4px)] right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10 md:top-4">
            <X class="w-4 h-4" />
          </button>

          <!-- ── Header ──────────────────────────────────────────────── -->
          <div class="mb-4 pr-8 text-left shrink-0">
            <!-- Title & Icon Row -->
            <div class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-brand-navy-900/30">
              <div class="p-2.5 rounded-[4px] bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/10 flex items-center justify-center border border-blue-500/25 dark:border-blue-400/25 shrink-0 shadow-sm">
                <component :is="weatherIcon" class="w-5 h-5 text-blue-600 dark:text-brand-cyan" />
              </div>
              <div class="text-left min-w-0 flex-grow">
                <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-blue-500 dark:text-brand-cyan block">
                  Pengamatan Cuaca — {{ cityShort }}
                </span>
                <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                  Laporkan Kondisi Cuaca Anda
                </h3>
              </div>
            </div>

            <!-- Tab Switcher (Aviation-style pill) -->
            <div class="flex overflow-x-auto no-scrollbar gap-1.5 mt-4 pb-0.5">
              <button
                @click="emit('update:reportActiveTab', 'feedback')"
                class="shrink-0 py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap border"
                :class="reportActiveTab === 'feedback'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-blue-500/0 shadow-sm shadow-blue-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-brand-navy-800 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-brand-navy-700 bg-transparent'"
              >Lapor Masukan</button>
              <button
                @click="emit('update:reportActiveTab', 'history')"
                class="shrink-0 py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap border"
                :class="reportActiveTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-blue-500/0 shadow-sm shadow-blue-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-brand-navy-800 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-brand-navy-700 bg-transparent'"
              >Riwayat Laporan</button>
            </div>
          </div>

          <!-- ── Scrollable Body ─────────────────────────────────────── -->
          <div class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 pb-12 text-left"
            style="will-change: scroll-position; -webkit-overflow-scrolling: touch;">

            <!-- ══ Success Screen ══════════════════════════════════════ -->
            <div v-if="reportSuccess" class="h-full flex flex-col items-center justify-center text-center gap-5 p-4">
              <div class="relative">
                <div class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                  <CheckCircle2 class="w-12 h-12" />
                </div>
                <div class="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-brand-navy-950 flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="space-y-2">
                <h3 class="text-xl font-black text-slate-800 dark:text-white">Laporan Terkirim!</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Terima kasih atas kontribusi Anda. Laporan di
                  <strong class="text-blue-600 dark:text-brand-cyan">{{ cityShort }}</strong>
                  telah masuk ke sistem BMKG Crowd-Sourced Weather.
                </p>
              </div>
            </div>

            <!-- ══ FEEDBACK TAB ════════════════════════════════════════ -->
            <div v-else-if="reportActiveTab === 'feedback'" class="space-y-5">

              <!-- Location card -->
              <div class="flex items-center justify-between p-3 rounded-xl border bg-white/60 dark:bg-brand-navy-900/30 border-slate-200/60 dark:border-brand-navy-800">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <MapPin class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{{ cityShort }}</p>
                    <p v-if="cityRest" class="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate">{{ cityRest }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 bg-white dark:bg-brand-navy-900/60 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-brand-navy-700 shadow-2xs">
                  <component :is="weatherIcon" class="w-3.5 h-3.5 text-blue-600 dark:text-brand-cyan" />
                  <span class="text-xs font-black text-slate-800 dark:text-slate-200">{{ weatherTemp }}°C</span>
                </div>
              </div>

              <!-- ── Section: Kondisi Umum ─────────────────────────── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/5 border border-blue-500/20 dark:from-blue-400/15 dark:to-indigo-400/5 dark:border-blue-400/20">
                    <span class="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-brand-cyan">Kondisi Umum</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-blue-200/60 to-transparent dark:from-blue-800/40" />
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="cond in overallConditions" :key="cond.name"
                    type="button" @click="setCondition(cond.label)"
                    class="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                    :class="reportForm.condition === cond.label
                      ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm shadow-blue-550/5 dark:shadow-brand-cyan/10'
                      : 'bg-white/60 border-slate-200/60 hover:bg-slate-50/80 dark:bg-brand-navy-900/15 dark:border-brand-navy-800/60 dark:hover:border-brand-navy-700 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                    <div class="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors duration-200"
                      :class="reportForm.condition === cond.label ? 'bg-blue-500/20 dark:bg-brand-cyan/25' : getConditionIconBg(cond.label)">
                      <component :is="cond.icon" class="w-4 h-4 transition-colors duration-200"
                        :class="reportForm.condition === cond.label ? 'text-blue-600 dark:text-brand-cyan' : getConditionIconColor(cond.label)" />
                    </div>
                    <span class="text-[10px] text-center leading-tight mt-0.5 font-bold">{{ cond.label }}</span>
                    <!-- Pulse indicator when selected -->
                    <span v-if="reportForm.condition === cond.label" class="relative flex shrink-0">
                      <span class="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-brand-cyan opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600 dark:bg-brand-cyan"></span>
                    </span>
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── Section: Suhu ─────────────────────────────────── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/5 border border-orange-500/20 dark:from-orange-400/15 dark:to-amber-400/5 dark:border-orange-400/20">
                    <span class="text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Suhu</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-orange-200/60 to-transparent dark:from-orange-800/40" />
                </div>
                <div class="grid grid-cols-5 gap-1.5">
                  <button v-for="feel in tempFeelings" :key="feel.name"
                    type="button" @click="setTempFeeling(feel.label)"
                    class="flex flex-col items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                    :class="reportForm.tempFeeling === feel.label
                      ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm'
                      : 'bg-white/60 border-slate-200/60 hover:bg-slate-50/80 dark:bg-brand-navy-900/15 dark:border-brand-navy-800/60 dark:hover:border-brand-navy-700 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                    <div class="text-center space-y-0.5">
                      <span class="text-[8px] opacity-70 font-bold block leading-none">{{ feel.range }}</span>
                      <span class="text-[9px] font-extrabold block leading-tight mt-0.5">{{ feel.label }}</span>
                    </div>
                    <ThumbsUp class="w-3 h-3 mt-1"
                      :class="reportForm.tempFeeling === feel.label ? 'fill-current text-blue-600 dark:text-brand-cyan opacity-100' : 'opacity-30'" />
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── Section: Kondisi Lainnya ──────────────────────── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500/15 to-purple-500/5 border border-violet-500/20 dark:from-violet-400/15 dark:to-purple-400/5 dark:border-violet-400/20">
                    <span class="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Kondisi Lainnya</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-violet-200/60 to-transparent dark:from-violet-800/40" />
                </div>
                <div class="grid grid-cols-5 gap-1.5">
                  <button v-for="oth in otherConditionsList" :key="oth.name"
                    type="button" @click="emit('toggleOtherCondition', oth.label)"
                    class="flex flex-col items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] cursor-pointer min-h-[72px] shadow-2xs"
                    :class="reportForm.otherConditions.includes(oth.label)
                      ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/75 dark:text-brand-cyan font-bold shadow-sm'
                      : 'bg-white/60 border-slate-200/60 hover:bg-slate-50/80 dark:bg-brand-navy-900/15 dark:border-brand-navy-800/60 dark:hover:border-brand-navy-700 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                    <component :is="oth.icon" class="w-4 h-4 text-slate-500 dark:text-slate-400 transition-colors"
                      :class="reportForm.otherConditions.includes(oth.label) ? 'text-blue-600 dark:text-brand-cyan' : ''" />
                    <span class="text-[9px] text-center font-extrabold leading-tight mt-0.5">{{ oth.label }}</span>
                    <ThumbsUp class="w-3 h-3 mt-1"
                      :class="reportForm.otherConditions.includes(oth.label) ? 'fill-current text-blue-600 dark:text-brand-cyan opacity-100' : 'opacity-30'" />
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── Section: Catatan ──────────────────────────────── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-500/10 to-slate-500/5 border border-slate-300/40 dark:from-slate-500/10 dark:to-slate-500/5 dark:border-slate-700/40">
                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Catatan</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-slate-200/60 to-transparent dark:from-slate-700/40" />
                </div>
                <textarea rows="3" :value="reportForm.comment" @input="setComment"
                  placeholder="Tambahkan komentar, detail, atau hal lainnya..."
                  class="w-full bg-white/60 border border-slate-200/80 dark:bg-brand-navy-900/20 dark:border-brand-navy-850/40 rounded-xl p-3 text-base md:text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-brand-cyan focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-brand-cyan/20 transition-all shadow-sm" />
              </div>

              <!-- Warning -->
              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/15">
                <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span class="text-[10.5px] text-left font-semibold leading-relaxed text-amber-700 dark:text-amber-300">
                  Pastikan laporan Anda sesuai dengan kondisi cuaca sebenarnya di lokasi Anda. Laporan palsu dapat ditindaklanjuti.
                </span>
              </div>

              <!-- Actions -->
              <div class="pt-4 border-t border-slate-150 dark:border-brand-navy-900/20 flex gap-3">
                <button type="button" @click="emit('close')"
                  class="flex-1 py-2.5 rounded-xl border border-slate-200/80 dark:border-brand-navy-800 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/5 text-slate-655 dark:text-slate-300 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs">
                  Batal
                </button>
                <button type="button" @click="emit('submit')"
                  :disabled="reportSubmitting || !reportForm.condition"
                  class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 dark:from-brand-cyan dark:to-cyan-400 dark:hover:from-brand-cyan/90 dark:hover:to-cyan-400/90 text-white dark:text-brand-navy-950 text-xs font-bold transition-all duration-300 active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:dark:from-brand-navy-800/80 disabled:dark:to-brand-navy-800/80 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/10 dark:shadow-brand-cyan/15 flex items-center justify-center gap-1.5">
                  <Loader2 v-if="reportSubmitting" class="w-3.5 h-3.5 animate-spin" />
                  <span>{{ reportSubmitting ? 'Mengirimkan...' : 'Kirim Laporan' }}</span>
                </button>
              </div>
            </div>

            <!-- ══ HISTORY TAB ═════════════════════════════════════════ -->
            <div v-else class="space-y-4">
              <div v-for="hist in reportHistory" :key="hist.id"
                class="p-4 rounded-xl border border-slate-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900/20 shadow-sm flex flex-col gap-2.5 text-left">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ hist.city.split(',')[0] }}</span>
                    <span class="text-[9px] text-slate-400 dark:text-slate-500 font-medium block">{{ hist.city.split(',').slice(1).map((x: string) => x.trim()).join(', ') }}</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{{ hist.time }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-blue-600 dark:text-brand-cyan bg-blue-500/10 dark:bg-brand-cyan/10 px-2.5 py-0.5 rounded-full border border-blue-500/10 dark:border-brand-cyan/20">
                    {{ hist.condition }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5">
                  <p><strong class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Sensasi suhu:</strong> {{ hist.tempFeeling }}</p>
                  <p v-if="hist.otherConditions.length > 0"><strong class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Kondisi lainnya:</strong> {{ hist.otherConditions.join(', ') }}</p>
                  <p v-if="hist.comment" class="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-brand-navy-900/40 italic text-slate-500 dark:text-slate-400 border-l-2 border-blue-400/40 dark:border-brand-cyan/30">
                    "{{ hist.comment }}"
                  </p>
                </div>
              </div>

              <!-- History close -->
              <div class="pt-4 border-t border-slate-150 dark:border-brand-navy-900/20">
                <button type="button" @click="emit('close')"
                  class="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-brand-navy-800 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/5 text-slate-650 dark:text-slate-300 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs">
                  Tutup Riwayat
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.28s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }

.drawer-slide-enter-active, .drawer-slide-leave-active {
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
/* Mobile: slide up from bottom */
.drawer-slide-enter-from, .drawer-slide-leave-to {
  transform: translateY(100%);
  opacity: 0.9;
}
/* Desktop: slide in from right */
@media (min-width: 768px) {
  .drawer-slide-enter-from, .drawer-slide-leave-to {
    transform: translateX(100%);
    opacity: 0.9;
  }
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

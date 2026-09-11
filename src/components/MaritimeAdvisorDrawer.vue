<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  ArrowUpRight, 
  Ship, 
  Fish, 
  Flame, 
  Palmtree, 
  Users 
} from 'lucide-vue-next';
import { getSectorsDataForCity, type SectorAdvisor } from '../data/maritimeAdvisorData';
import { WAVE_CAT_MID } from '../services/bmkg/openData';

const props = defineProps<{
  isOpen: boolean;
  initialSectorId?: 'shipping' | 'fishery' | 'oilgas' | 'tourism' | 'public';
  selectedCity: string;
  maritimLive?: { waveDesc: string; waveCat: string; warningDesc: string; wilpel: string } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Replicate sectors locally to allow checklist mutation (toggling SOP checklist)
// Patch data maritim LIVE (public_api perairan) ke sector shipping/fishery:
// parameter 'Tinggi Gelombang' + narasi risiko mengikuti wave_cat/warning resmi.
function applyLiveMaritim(sectors: SectorAdvisor[]): void {
  const live = props.maritimLive;
  if (!live?.waveDesc) return;
  const cat = (live.waveCat || '').toLowerCase();
  const mid = Object.entries(WAVE_CAT_MID).find(([k]) => cat.includes(k))?.[1] ?? 1;
  const paramStatus = live.warningDesc !== 'NIL' && live.warningDesc ? 'bahaya'
    : mid >= 3 ? 'siaga' : mid >= 1.2 ? 'waspada' : 'aman';
  const risk = live.warningDesc && live.warningDesc !== 'NIL' ? 'Bahaya'
    : mid >= 3 ? 'Tinggi' : mid >= 1.2 ? 'Sedang' : 'Rendah';
  for (const s of sectors) {
    if (s.id !== 'shipping' && s.id !== 'fishery') continue;
    const p = s.parameters.find(x => /gelombang/i.test(x.label));
    if (p) { p.value = live.waveDesc; p.status = paramStatus as never; }
    s.riskLevel = risk as never;
    if (s.advisories.length) {
      s.advisories[0] = { status: risk === 'Rendah' ? 'info' : risk === 'Bahaya' ? 'danger' : 'warning',
        text: live.warningDesc && live.warningDesc !== 'NIL'
          ? `${live.warningDesc} — wilayah ${live.wilpel || s.name}.`
          : `Kategori gelombang ${live.waveCat} (${live.waveDesc}) di ${live.wilpel || s.name} per rilis terakhir BMKG.` };
    }
  }
}

// Replicate sectors locally to allow checklist mutation (toggling SOP checkbox)
const localSectors = ref<SectorAdvisor[]>([]);
const activeAdvisorSector = ref<SectorAdvisor | null>(null);

// Watch for initial sector, selected city, or open event
watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');
      const sectors: SectorAdvisor[] = JSON.parse(JSON.stringify(getSectorsDataForCity(props.selectedCity)));
      applyLiveMaritim(sectors);
      localSectors.value = sectors;
      const targetId = props.initialSectorId || 'shipping';
      const found = localSectors.value.find(s => s.id === targetId) || localSectors.value[0];
      if (found) activeAdvisorSector.value = found;
    } else {
      document.body.classList.remove('drawer-open');
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  document.body.classList.remove('drawer-open');
});

const getSectorIcon = (id: string) => {
  switch (id) {
    case 'shipping': return Ship;
    case 'fishery': return Fish;
    case 'oilgas': return Flame;
    case 'tourism': return Palmtree;
    case 'public': return Users;
    default: return Users;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'aman':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'waspada':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'siaga':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'bahaya':
      return 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const getPulseClass = (status: string) => {
  switch (status) {
    case 'aman': return 'bg-emerald-500';
    case 'waspada': return 'bg-yellow-500';
    case 'siaga': return 'bg-orange-500';
    case 'bahaya': return 'bg-red-500';
    default: return 'bg-slate-500';
  }
};

const getSectorLabel = (id: string) => {
  switch (id) {
    case 'shipping': return 'Pelayaran';
    case 'fishery': return 'Perikanan';
    case 'oilgas': return 'Migas';
    case 'tourism': return 'Wisata';
    case 'public': return 'Umum';
    default: return 'Sektor';
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden flex flex-col justify-end md:flex-row md:justify-end">
      <!-- Backdrop Overlay (reloaded) -->
      <Transition name="drawer-fade" appear>
        <div 
          v-if="isOpen"
          class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm cursor-default"
          @click="emit('close')"
        ></div>
      </Transition>

      <!-- Slide-out Drawer Panel -->
      <Transition name="drawer-slide" appear>
        <div 
          v-if="isOpen"
          class="relative w-full h-full md:max-w-lg bg-white/95 dark:bg-brand-navy-950/95 md:border-l border-none shadow-2xl text-slate-800 dark:text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+20px)] px-5 pb-safe md:pt-6 md:px-6 md:pb-0 flex flex-col justify-between overflow-hidden rounded-none side-advisor-drawer"
        >
          <!-- Ambient glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          
          <!-- Close button -->
          <button 
            @click="emit('close')"
            class="absolute top-[calc(env(safe-area-inset-top,16px)+4px)] right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10 md:top-4"
          >
            <X class="w-4 h-4" />
          </button>
          
          <!-- Header Section -->
          <div class="mb-4 pr-8 text-left">
            <!-- Title & Icon Row -->
            <div v-if="activeAdvisorSector" class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-brand-navy-900/30">
              <div class="p-2.5 rounded-[4px] bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/10 flex items-center justify-center border border-blue-500/25 dark:border-blue-400/25 shrink-0 shadow-sm">
                <component :is="getSectorIcon(activeAdvisorSector.id)" class="w-5 h-5" :class="activeAdvisorSector.textColor" />
              </div>
              <div class="text-left flex-grow min-w-0">
                <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 block">{{ activeAdvisorSector.name }}</span>
                <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                  {{ activeAdvisorSector.title }}
                </h3>
              </div>
            </div>
            
            <!-- Tab Navigation / Sector Switcher -->
            <div class="flex overflow-x-auto no-scrollbar gap-1.5 mt-4 pb-0.5">
              <button 
                v-for="sect in localSectors"
                :key="sect.id"
                @click="activeAdvisorSector = sect"
                class="shrink-0 py-1.5 px-3 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap border"
                :class="activeAdvisorSector?.id === sect.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500/0 shadow-sm shadow-blue-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-brand-navy-800 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-brand-navy-700 bg-transparent'"
              >
                {{ getSectorLabel(sect.id) }}
              </button>
            </div>
          </div>

          <!-- Scrollable Content Area -->
          <div v-if="activeAdvisorSector" class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 pb-12 text-left" style="will-change: scroll-position; -webkit-overflow-scrolling: touch;">
            
            <!-- Sector Details Clean Layout -->
            <div class="space-y-4">
              <!-- Description -->
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                {{ activeAdvisorSector.description }}
              </p>

              <!-- Properties Grid (Redesigned matching Aviation Parameter cards look) -->
              <div class="grid grid-cols-2 gap-2 my-2">
                <!-- Risk Level Parameter Card -->
                <div class="p-2.5 rounded-xl border bg-white/60 dark:bg-brand-navy-900/30 border-slate-200/60 dark:border-brand-navy-800 flex flex-col gap-1">
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">Tingkat Risiko</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span 
                      class="px-2 py-0.5 rounded text-[8.5px] font-black uppercase border leading-normal"
                      :class="getStatusBadgeClass(activeAdvisorSector.riskLevel === 'Rendah' ? 'aman' : activeAdvisorSector.riskLevel === 'Sedang' ? 'waspada' : activeAdvisorSector.riskLevel === 'Tinggi' ? 'siaga' : 'bahaya')"
                    >
                      {{ activeAdvisorSector.riskLevel }}
                    </span>
                    <span class="text-slate-500 dark:text-slate-455 font-bold text-[9px]">
                      Skor: {{ activeAdvisorSector.riskScore }}/100
                    </span>
                  </div>
                </div>

                <!-- Dynamic Parameters Card -->
                <div 
                  v-for="param in activeAdvisorSector.parameters" 
                  :key="param.label"
                  class="p-2.5 rounded-xl border bg-white/60 dark:bg-brand-navy-900/30 border-slate-200/60 dark:border-brand-navy-800 flex flex-col gap-1"
                >
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">{{ param.label }}</span>
                  <span class="text-[11px] font-black text-slate-800 dark:text-white leading-tight mt-0.5">{{ param.value }}</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <!-- Status indicator dot -->
                    <span class="rounded-full relative shrink-0" :class="getPulseClass(param.status)" style="width: 5px; height: 5px; min-width: 5px; min-height: 5px;">
                      <span class="animate-ping absolute inset-0 rounded-full opacity-75" :class="getPulseClass(param.status)"></span>
                    </span>
                    <span 
                      class="text-[7.5px] font-black uppercase tracking-wider"
                      :class="param.status === 'aman' ? 'text-emerald-600 dark:text-emerald-400' : param.status === 'waspada' ? 'text-amber-600 dark:text-amber-400' : param.status === 'siaga' ? 'text-orange-600 dark:text-orange-400' : 'text-red-650 dark:text-red-400'"
                    >
                      {{ param.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── STATUS CUACA ── -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/5 border border-blue-500/20 dark:from-blue-400/15 dark:to-indigo-400/5 dark:border-blue-400/20">
                    <Info class="w-3.5 h-3.5 text-blue-500 dark:text-blue-450 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-blue-650 dark:text-blue-450">Status Cuaca</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-blue-200/60 to-transparent dark:from-blue-800/40" />
                </div>
                <div class="space-y-2">
                  <div 
                    v-for="(adv, index) in activeAdvisorSector.advisories" 
                    :key="index"
                    class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-2.5 rounded-xl border-l-2 bg-white/40 dark:bg-brand-navy-900/20"
                    :class="adv.status === 'danger'
                      ? 'border-l-red-500 text-red-750 dark:text-red-300'
                      : adv.status === 'warning'
                      ? 'border-l-amber-500 text-amber-750 dark:text-amber-300'
                      : adv.status === 'safe'
                      ? 'border-l-emerald-500 text-emerald-750 dark:text-emerald-300'
                      : 'border-l-blue-500 text-slate-600 dark:text-slate-300'"
                  >
                    <AlertTriangle v-if="adv.status === 'danger'" class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <AlertTriangle v-else-if="adv.status === 'warning'" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <CheckCircle2 v-else-if="adv.status === 'safe'" class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <Info v-else class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p class="flex-grow">{{ adv.text }}</p>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── SOP CHECKLIST ── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/5 border border-emerald-500/20 dark:from-emerald-400/15 dark:to-teal-400/5 dark:border-emerald-400/20">
                    <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">SOP Checklist</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-emerald-200/60 to-transparent dark:from-emerald-800/40" />
                </div>
                <div class="space-y-1.5">
                  <div 
                    v-for="(step, index) in activeAdvisorSector.sopSteps" 
                    :key="index"
                    class="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 group/step border border-transparent"
                    :class="step.done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/40 dark:border-emerald-800/30'
                      : 'hover:bg-slate-50 dark:hover:bg-brand-navy-900/30 hover:border-slate-200/40'"
                    @click="step.done = !step.done"
                  >
                    <!-- Step number / check -->
                    <div 
                      class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 font-black text-[9px]"
                      :class="step.done 
                        ? 'bg-emerald-500 dark:bg-emerald-400 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-brand-navy-800 text-slate-400 dark:text-slate-500 group-hover/step:bg-emerald-100 dark:group-hover/step:bg-emerald-900/30 group-hover/step:text-emerald-600'"
                    >
                      <svg v-if="step.done" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span v-else>{{ String(index + 1).padStart(2, '0') }}</span>
                    </div>
                    <span 
                      class="text-[10.5px] font-semibold select-none leading-normal flex-grow"
                      :class="step.done 
                        ? 'text-slate-400 line-through dark:text-slate-500' 
                        : 'text-slate-700 dark:text-slate-300'"
                    >
                      {{ step.text }}
                    </span>
                  </div>
                  <div class="pt-0.5 text-[8px] font-black text-slate-450 dark:text-brand-navy-600 uppercase tracking-widest flex items-center gap-1.5 px-2.5">
                    <Sparkles class="w-3.5 h-3.5 text-yellow-500" />
                    Tip: Ketuk butir SOP di atas untuk menandai selesai.
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── emergency contacts ── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-500/15 to-orange-500/5 border border-red-500/20 dark:from-red-400/15 dark:to-orange-400/5 dark:border-red-400/20">
                    <AlertTriangle class="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Kontak Mitigasi</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-red-200/60 to-transparent dark:from-red-800/40" />
                </div>
                <div class="space-y-2">
                  <div 
                    v-for="contact in activeAdvisorSector.emergencyContacts" 
                    :key="contact.label"
                    class="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white/60 border-slate-200/60 dark:bg-brand-navy-900/30 dark:border-brand-navy-800 hover:border-red-200/60 dark:hover:border-red-800/30 transition-colors"
                  >
                    <div class="min-w-0">
                      <p class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Unit Hubungan</p>
                      <p class="text-[10.5px] font-black text-slate-800 dark:text-white mt-1 truncate">{{ contact.label }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[9px] font-mono font-black text-slate-755 dark:text-slate-200 bg-slate-100 dark:bg-brand-navy-900/60 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-brand-navy-700">
                        {{ contact.number }}
                      </span>
                      <a 
                        :href="'tel:' + contact.number.replace(/[^0-9]/g, '')"
                        class="p-1.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white hover:scale-105 active:scale-95 transition-all shadow-sm shadow-red-500/30 outline-none"
                        title="Panggil"
                      >
                        <ArrowUpRight class="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* Drawer Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.28s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  /* Mobile: slide up from bottom */
  transform: translateY(100%);
  opacity: 0.9;
}
@media (min-width: 768px) {
  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    /* Desktop: slide in from right */
    transform: translateX(100%);
    opacity: 0.9;
  }
}
</style>

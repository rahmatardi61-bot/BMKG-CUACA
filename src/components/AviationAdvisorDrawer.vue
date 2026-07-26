<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowUpRight,
  Plane,
  PackageOpen,
  Radio,
  FileText,
} from 'lucide-vue-next';
import { getAirportsDataForCity, getAirportsDataByCoordinates, type AirportAdvisor } from '../data/aviationAdvisorData';

const props = defineProps<{
  isOpen: boolean;
  initialSectorId?: 'commercial' | 'cargo' | 'sigmet' | 'pirep';
  selectedCity: string;
  userLat?: number | null;
  userLng?: number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeSectorTab = ref<'status' | 'sop' | 'emergency' | 'rekomendasi'>('status');

// Nearest airport info (shown when city name does not match directly)
const nearestAirportInfo = ref<{ name: string; icao: string; distanceKm: number } | null>(null);

// Replicate locally to allow SOP checklist mutation
const localSectors = ref<AirportAdvisor[]>([]);
const activeAdvisorSector = ref<AirportAdvisor | null>(null);

watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');
      nearestAirportInfo.value = null;

      // Coba match by city name dulu
      const byName = getAirportsDataForCity(props.selectedCity);
      const isDefaultFallback = byName.length === 1 && byName[0].icao === '----';

      if (isDefaultFallback && props.userLat != null && props.userLng != null) {
        // Fallback ke bandara terdekat berdasarkan GPS
        const result = getAirportsDataByCoordinates(props.userLat, props.userLng);
        localSectors.value = JSON.parse(JSON.stringify(result.data));
        nearestAirportInfo.value = { name: result.nearestName, icao: result.nearestIcao, distanceKm: result.distanceKm };
      } else {
        localSectors.value = JSON.parse(JSON.stringify(byName));
      }

      // Default to first available sector or specified initial sector
      activeAdvisorSector.value = (props.initialSectorId ? localSectors.value.find(s => s.id === props.initialSectorId) : null) || localSectors.value[0] || null;
      activeSectorTab.value = 'status';
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
    case 'commercial': return Plane;
    case 'cargo':      return PackageOpen;
    case 'sigmet':     return Radio;
    case 'pirep':      return FileText;
    default:           return Plane;
  }
};

const getSectorLabel = (id: string) => {
  switch (id) {
    case 'commercial': return 'Komersial';
    case 'cargo':      return 'Kargo';
    case 'sigmet':     return 'SIGMET';
    case 'pirep':      return 'PIREP';
    default:           return id;
  }
};



const getPulseClass = (status: string) => {
  switch (status) {
    case 'aman':    return 'bg-emerald-500';
    case 'waspada': return 'bg-yellow-500';
    case 'siaga':   return 'bg-orange-500';
    case 'bahaya':  return 'bg-red-500';
    default:        return 'bg-slate-500';
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden flex flex-col justify-end md:flex-row md:justify-end">
      <!-- Backdrop -->
      <Transition name="drawer-fade" appear>
        <div
          v-if="isOpen"
          class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm cursor-default"
          @click="emit('close')"
        />
      </Transition>

      <!-- Drawer Panel -->
      <Transition name="drawer-slide" appear>
        <div
          v-if="isOpen"
          class="relative w-full h-[100dvh] md:h-full md:max-w-lg bg-white/95 dark:bg-brand-navy-950/95 md:border-l border-none shadow-2xl text-slate-800 dark:text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+20px)] px-5 pb-safe md:pt-6 md:px-6 md:pb-0 flex flex-col justify-between overflow-hidden rounded-none"
        >
          <!-- Ambient glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <!-- Close button -->
          <button
            @click="emit('close')"
            class="absolute top-[calc(env(safe-area-inset-top,16px)+4px)] right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10 md:top-4"
          >
            <X class="w-4 h-4" />
          </button>

          <!-- Header -->
          <div class="mb-4 pr-8 text-left">
            <!-- Title & Icon Row -->
            <div class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-brand-navy-900/30">
              <template v-if="activeAdvisorSector">
                <div class="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 dark:from-indigo-400/20 dark:to-blue-400/10 flex items-center justify-center border border-indigo-500/25 dark:border-indigo-400/25 shrink-0 shadow-sm">
                  <component :is="getSectorIcon(activeAdvisorSector.id)" class="w-5 h-5" :class="activeAdvisorSector.textColor" />
                </div>
                <div class="text-left min-w-0 flex-grow">
                  <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400 block">{{ activeAdvisorSector.name }}</span>
                  <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                    {{ activeAdvisorSector.title }}
                  </h3>
                </div>
              </template>
              <template v-else-if="localSectors.length > 0">
                <div class="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 dark:from-amber-400/20 dark:to-orange-400/10 flex items-center justify-center border border-amber-500/25 dark:border-amber-400/25 shrink-0 shadow-sm">
                  <Sparkles class="w-5 h-5 text-amber-500" />
                </div>
                <div class="text-left min-w-0 flex-grow">
                  <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-amber-500 dark:text-amber-400 block">Panduan Pra-Terbang</span>
                  <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                    Checklist Sebelum Terbang — {{ localSectors[0].icao }}
                  </h3>
                </div>
              </template>
            </div>

            <!-- Nearest Airport Banner -->
            <div
              v-if="nearestAirportInfo"
              class="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-indigo-500/8 dark:bg-indigo-500/12 border border-indigo-500/20 dark:border-indigo-400/20 text-[10px]"
            >
              <span class="text-indigo-500 shrink-0 mt-0.5">📍</span>
              <p class="text-indigo-700 dark:text-indigo-300 font-semibold leading-normal">
                Bandara terdekat dari lokasi Anda:
                <span class="font-black">{{ nearestAirportInfo.name }} ({{ nearestAirportInfo.icao }})</span>
                — {{ nearestAirportInfo.distanceKm }} km
              </p>
            </div>

            <!-- Sector Tab Switcher -->
            <div class="flex overflow-x-auto no-scrollbar gap-1.5 mt-4 pb-0.5">
              <button
                v-for="sect in localSectors"
                :key="sect.id"
                @click="activeAdvisorSector = sect"
                class="shrink-0 py-1.5 px-3 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap border"
                :class="activeAdvisorSector?.id === sect.id
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-500/0 shadow-sm shadow-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-brand-navy-800 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-brand-navy-700 bg-transparent'"
              >
                {{ getSectorLabel(sect.id) }}
              </button>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div
            class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 pb-12 text-left"
            style="will-change: scroll-position; -webkit-overflow-scrolling: touch;"
          >


            <!-- TAMPILAN: Sektor Spesifik (Komersial, Pirep, dll) -->
            <div v-if="activeAdvisorSector" class="space-y-4">

              <!-- ── RISK BANNER ── -->
              <div
                class="relative rounded-2xl overflow-hidden border p-4"
                :class="activeAdvisorSector!.riskLevel === 'Rendah'
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-200/60 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-800/30'
                  : activeAdvisorSector!.riskLevel === 'Sedang'
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50/30 border-amber-200/60 dark:from-amber-950/30 dark:to-yellow-950/20 dark:border-amber-800/30'
                  : activeAdvisorSector!.riskLevel === 'Tinggi'
                  ? 'bg-gradient-to-br from-orange-50 to-red-50/30 border-orange-200/60 dark:from-orange-950/30 dark:to-red-950/20 dark:border-orange-800/30'
                  : 'bg-gradient-to-br from-red-50 to-rose-50/30 border-red-200/60 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-800/30'"
              >
                <!-- Ambient glow -->
                <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
                  :class="activeAdvisorSector!.riskLevel === 'Rendah' ? 'bg-emerald-400' : activeAdvisorSector!.riskLevel === 'Sedang' ? 'bg-amber-400' : 'bg-red-400'"
                />
                <div class="flex items-center justify-between gap-3 relative z-10">
                  <!-- Left: category + description -->
                  <div class="min-w-0">
                    <span
                      class="text-[8.5px] font-black uppercase tracking-[0.18em] block mb-0.5"
                      :class="activeAdvisorSector!.category === 'VFR' ? 'text-emerald-600 dark:text-emerald-400' : activeAdvisorSector!.category === 'MVFR' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'"
                    >{{ activeAdvisorSector!.category }} — {{ activeAdvisorSector!.name }}</span>
                    <p class="text-[10.5px] text-slate-600 dark:text-slate-300 font-semibold leading-snug">
                      {{ activeAdvisorSector!.description }}
                    </p>
                  </div>
                  <!-- Right: risk score circle -->
                  <div class="shrink-0 flex flex-col items-center gap-0.5">
                    <div
                      class="w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-[13px]"
                      :class="activeAdvisorSector!.riskLevel === 'Rendah'
                        ? 'border-emerald-400 text-emerald-700 bg-emerald-100/60 dark:text-emerald-400 dark:bg-emerald-900/40'
                        : activeAdvisorSector!.riskLevel === 'Sedang'
                        ? 'border-amber-400 text-amber-700 bg-amber-100/60 dark:text-amber-400 dark:bg-amber-900/40'
                        : 'border-red-400 text-red-700 bg-red-100/60 dark:text-red-400 dark:bg-red-900/40'"
                    >{{ activeAdvisorSector!.riskScore }}</div>
                    <span
                      class="text-[7.5px] font-black uppercase tracking-wider"
                      :class="activeAdvisorSector!.riskLevel === 'Rendah' ? 'text-emerald-600 dark:text-emerald-400' : activeAdvisorSector!.riskLevel === 'Sedang' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'"
                    >{{ activeAdvisorSector!.riskLevel }}</span>
                  </div>
                </div>
              </div>

              <!-- ── PARAMETER CARDS ── -->
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="param in activeAdvisorSector!.parameters"
                  :key="param.label"
                  class="p-2.5 rounded-xl border bg-white/60 dark:bg-brand-navy-900/30 border-slate-200/60 dark:border-brand-navy-800 flex flex-col gap-1"
                >
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">{{ param.label }}</span>
                  <span class="text-[11px] font-black text-slate-800 dark:text-white leading-tight">{{ param.value }}</span>
                  <div class="flex items-center gap-1.5">
                    <span
                      class="rounded-full relative shrink-0"
                      :class="getPulseClass(param.status)"
                      style="width:5px;height:5px;min-width:5px;min-height:5px;"
                    >
                      <span class="animate-ping absolute inset-0 rounded-full opacity-75" :class="getPulseClass(param.status)" />
                    </span>
                    <span
                      class="text-[7.5px] font-black uppercase tracking-wider"
                      :class="param.status === 'aman' ? 'text-emerald-600 dark:text-emerald-400' : param.status === 'waspada' ? 'text-amber-600 dark:text-amber-400' : param.status === 'siaga' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'"
                    >{{ param.status }}</span>
                  </div>
                </div>
              </div>

              <!-- ── STATUS CUACA ── -->
              <div>
                <div class="flex items-center gap-2.5 mb-2.5">
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-blue-500/5 border border-indigo-500/20 dark:from-indigo-400/15 dark:to-blue-400/5 dark:border-indigo-400/20">
                    <Info class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Status Cuaca</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-indigo-200/60 to-transparent dark:from-indigo-800/40" />
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(adv, index) in activeAdvisorSector!.advisories"
                    :key="index"
                    class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-2.5 rounded-xl border-l-2 bg-white/40 dark:bg-brand-navy-900/20"
                    :class="adv.status === 'danger'
                      ? 'border-l-red-500 text-red-700 dark:text-red-300'
                      : adv.status === 'warning'
                      ? 'border-l-amber-500 text-amber-700 dark:text-amber-300'
                      : adv.status === 'safe'
                      ? 'border-l-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-l-indigo-500 text-slate-600 dark:text-slate-300'"
                  >
                    <AlertTriangle v-if="adv.status === 'danger'"    class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <AlertTriangle v-else-if="adv.status === 'warning'" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <CheckCircle2 v-else-if="adv.status === 'safe'"  class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <Info         v-else                              class="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
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
                    v-for="(step, index) in activeAdvisorSector!.sopSteps"
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
                      :class="step.done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'"
                    >{{ step.text }}</span>
                  </div>
                  <div class="pt-0.5 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-1.5 px-2.5">
                    <Sparkles class="w-3 h-3 text-yellow-500" />
                    Ketuk item untuk menandai selesai
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-brand-navy-800/60" />

              <!-- ── KONTAK MITIGASI ── -->
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
                    v-for="contact in activeAdvisorSector!.emergencyContacts"
                    :key="contact.label"
                    class="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white/60 border-slate-200/60 dark:bg-brand-navy-900/30 dark:border-brand-navy-800 hover:border-red-200/60 dark:hover:border-red-800/30 transition-colors"
                  >
                    <div class="min-w-0">
                      <p class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Unit Hubungan</p>
                      <p class="text-[10.5px] font-black text-slate-800 dark:text-white mt-1 truncate">{{ contact.label }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[9px] font-mono font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-brand-navy-900/60 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-brand-navy-700">
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

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

const props = defineProps<{
  isOpen: boolean;
  initialSectorId?: 'shipping' | 'fishery' | 'oilgas' | 'tourism' | 'public';
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeSectorTab = ref<'status' | 'sop' | 'emergency'>('status');

// Replicate sectors locally to allow checklist mutation (toggling SOP checkbox)
const localSectors = ref<SectorAdvisor[]>([]);
const activeAdvisorSector = ref<SectorAdvisor | null>(null);

// Watch for initial sector, selected city, or open event
watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');
      localSectors.value = JSON.parse(JSON.stringify(getSectorsDataForCity(props.selectedCity)));
      const targetId = props.initialSectorId || 'shipping';
      const found = localSectors.value.find(s => s.id === targetId) || localSectors.value[0];
      if (found) activeAdvisorSector.value = found;
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
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
      <!-- Backdrop Overlay -->
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
          class="relative h-full w-full max-w-lg bg-white/95 dark:bg-brand-navy-950/95 border-l border-slate-200/30 dark:border-brand-navy-900/20 shadow-2xl text-slate-800 dark:text-slate-100 pt-5 px-5 pb-0 md:pt-6 md:px-6 md:pb-0 flex flex-col justify-between overflow-hidden"
        >
          <!-- Clean subtle top corner ambient glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-cyan/10 blur-3xl pointer-events-none"></div>
          
          <!-- Close button -->
          <button 
            @click="emit('close')"
            class="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10"
          >
            <X class="w-4 h-4" />
          </button>
          
          <!-- Header Section -->
          <div class="mb-4 pr-8 text-left">
            <!-- Title & Icon Row -->
            <div v-if="activeAdvisorSector" class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-brand-navy-900/20">
              <div class="p-2.5 rounded-xl bg-blue-500/10 dark:bg-brand-cyan/15 flex items-center justify-center border border-blue-500/20 dark:border-brand-cyan/35 shrink-0">
                <component :is="getSectorIcon(activeAdvisorSector.id)" class="w-5 h-5" :class="activeAdvisorSector.textColor" />
              </div>
              <div class="text-left flex-grow min-w-0">
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 block">{{ activeAdvisorSector.name }}</span>
                <h3 class="text-sm font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                  {{ activeAdvisorSector.title }}
                </h3>
              </div>
            </div>
            
            <!-- Tab Navigation / Sector Switcher -->
            <div class="flex overflow-x-auto no-scrollbar gap-1 mt-4 pb-0.5">
              <button 
                v-for="sect in localSectors"
                :key="sect.id"
                @click="activeAdvisorSector = sect"
                class="shrink-0 py-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
                :class="activeAdvisorSector?.id === sect.id
                  ? 'bg-slate-100 dark:bg-brand-navy-900/60 text-blue-600 dark:text-brand-cyan font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'"
              >
                {{ sect.id === 'shipping' ? 'Pelayaran' : sect.id === 'fishery' ? 'Perikanan' : sect.id === 'oilgas' ? 'Migas' : sect.id === 'tourism' ? 'Wisata' : 'Umum' }}
              </button>
            </div>
          </div>

          <!-- Scrollable Content Area -->
          <div v-if="activeAdvisorSector" class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 pb-12 text-left" style="will-change: scroll-position; -webkit-overflow-scrolling: touch;">
            
            <!-- Sector Details Clean Layout -->
            <div class="space-y-4">

              <!-- Description -->
              <p class="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-normal">
                {{ activeAdvisorSector.description }}
              </p>

              <!-- Properties Grid (Clean aligned key-value list) -->
              <div class="grid grid-cols-[110px_1fr] gap-y-3.5 text-[11px] border-t border-b border-slate-100 dark:border-brand-navy-900/20 py-4 my-2">
                <!-- Risk Level Parameter -->
                <div class="text-slate-500 dark:text-slate-450 font-semibold self-center">Tingkat Risiko</div>
                <div class="flex items-center gap-2 min-w-0">
                  <span 
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border self-start"
                    :class="getStatusBadgeClass(activeAdvisorSector.riskLevel === 'Rendah' ? 'aman' : activeAdvisorSector.riskLevel === 'Sedang' ? 'waspada' : activeAdvisorSector.riskLevel === 'Tinggi' ? 'siaga' : 'bahaya')"
                  >
                    {{ activeAdvisorSector.riskLevel }}
                  </span>
                  <span class="text-slate-500 dark:text-slate-400 font-semibold text-[10px]">
                    Skor: {{ activeAdvisorSector.riskScore }}/100
                  </span>
                </div>

                <!-- Dynamic Parameters -->
                <template v-for="param in activeAdvisorSector.parameters" :key="param.label">
                  <div class="text-slate-500 dark:text-slate-450 font-semibold self-center">{{ param.label }}</div>
                  <div class="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 min-w-0">
                    <span class="truncate">{{ param.value }}</span>
                    <!-- Subtle status indicator dot -->
                    <span class="rounded-full relative shrink-0" :title="param.status" :class="getPulseClass(param.status)" style="width: 6px; height: 6px; min-width: 6px; min-height: 6px;">
                      <span class="animate-ping absolute inset-0 rounded-full opacity-75" :class="getPulseClass(param.status)"></span>
                    </span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Sub-tabs Section -->
            <div class="space-y-4">
              <!-- Sub-tabs Selectors -->
              <div class="flex gap-6 border-b border-slate-150 dark:border-brand-navy-900/20 pb-2">
                <button 
                  v-for="tab in ['status', 'sop', 'emergency']" 
                  :key="tab"
                  @click="activeSectorTab = tab"
                  class="pb-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative text-left"
                  :class="activeSectorTab === tab 
                    ? 'text-blue-600 dark:text-brand-cyan font-black border-b-2 border-blue-600 dark:border-brand-cyan -mb-[10px]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'"
                >
                  {{ tab === 'status' ? 'Status' : tab === 'sop' ? 'SOP' : 'Mitigasi' }}
                </button>
              </div>

              <!-- Tab 1: Status & Analisis -->
              <div v-if="activeSectorTab === 'status'" class="space-y-2.5 min-h-[110px] pt-1 animate-fade-in text-left">
                <div 
                  v-for="(adv, index) in activeAdvisorSector.advisories" 
                  :key="index"
                  class="flex gap-2 text-[10.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-350"
                >
                  <AlertTriangle v-if="adv.status === 'danger'" class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <AlertTriangle v-else-if="adv.status === 'warning'" class="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <CheckCircle2 v-else-if="adv.status === 'safe'" class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <Info v-else class="w-3.5 h-3.5 text-blue-500 dark:text-brand-cyan shrink-0 mt-0.5" />
                  <p class="flex-grow">{{ adv.text }}</p>
                </div>
              </div>

              <!-- Tab 2: SOP Checklist -->
              <div v-if="activeSectorTab === 'sop'" class="space-y-2.5 min-h-[110px] pt-1 animate-fade-in text-left">
                <div 
                  v-for="(step, index) in activeAdvisorSector.sopSteps" 
                  :key="index"
                  class="flex items-start gap-2.5 cursor-pointer group/step"
                  @click="step.done = !step.done"
                >
                  <div 
                    class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5"
                    :class="[
                      step.done 
                        ? 'bg-blue-600 border-blue-600 dark:bg-brand-cyan dark:border-brand-cyan text-white dark:text-brand-navy-950 shadow-sm'
                        : 'border-slate-300 dark:border-brand-navy-700 bg-transparent'
                    ]"
                  >
                    <svg v-if="step.done" class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span 
                    class="text-[10.5px] font-semibold select-none leading-normal"
                    :class="[
                      step.done 
                        ? 'text-slate-400 line-through dark:text-slate-500' 
                        : 'text-slate-700 dark:text-slate-350'
                    ]"
                  >
                    {{ step.text }}
                  </span>
                </div>
                <div class="pt-2 text-[8px] font-black text-slate-450 dark:text-brand-navy-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-yellow-500" />
                  Tip: Ketuk butir SOP di atas untuk menandai selesai.
                </div>
              </div>

              <!-- Tab 3: Emergency Contacts -->
              <div v-if="activeSectorTab === 'emergency'" class="space-y-2.5 min-h-[110px] pt-1 animate-fade-in text-left">
                <div 
                  v-for="contact in activeAdvisorSector.emergencyContacts" 
                  :key="contact.label"
                  class="p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 bg-white border-slate-200/60 dark:bg-brand-navy-900/30 dark:border-brand-navy-800"
                >
                  <div class="text-left">
                    <p class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Unit Hubungan</p>
                    <p class="text-[10.5px] font-black text-slate-800 dark:text-white mt-1">{{ contact.label }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-mono font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-brand-navy-900/60 px-2 py-0.5 rounded border border-slate-200/40 dark:border-brand-navy-800/80">
                      {{ contact.number }}
                    </span>
                    <a 
                      :href="'tel:' + contact.number.replace(/[^0-9]/g, '')"
                      class="p-1 rounded-lg bg-blue-600 text-white dark:bg-brand-cyan dark:text-brand-navy-950 hover:scale-105 active:scale-95 transition-all outline-none"
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
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0.9;
}
</style>

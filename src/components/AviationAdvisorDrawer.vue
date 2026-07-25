<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import {
  X,
  AlertTriangle,
  UserCog,
  Users2,
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

      const targetId = props.initialSectorId || 'commercial';
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

const getCategoryBadgeClass = (cat: string) => {
  switch (cat) {
    case 'VFR':  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'MVFR': return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    case 'IFR':  return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'LIFR': return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
    default:     return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'aman':    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'waspada': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'siaga':   return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'bahaya':  return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    default:        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

// ── Rekomendasi Generator ─────────────────────────────────────────────────────
interface Recommendation { icon: string; text: string; }

const getPilotRecommendations = (category: string): Recommendation[] => {
  const base: Recommendation[] = [
    { icon: '📡', text: 'Dapatkan briefing cuaca terbaru dari BMKG MWO sebelum berangkat.' },
    { icon: '📋', text: 'Isi rencana terbang (flight plan) dengan data cuaca aktual yang diperoleh dari ATIS/VOLMET.' },
  ];
  if (category === 'VFR') return [
    ...base,
    { icon: '✅', text: 'Kondisi VFR aktif — visual approach diizinkan. Pantau ATIS 30 menit sebelum landing.' },
    { icon: '👁️', text: 'Pertahankan visual clearance dari awan dan hindari masuk IMC secara tidak sengaja.' },
    { icon: '🛬', text: 'Pilih runway dengan headwind optimal berdasarkan data angin METAR terkini.' },
  ];
  if (category === 'MVFR') return [
    ...base,
    { icon: '⚠️', text: 'Kondisi MVFR — siapkan ILS approach briefing meskipun kondisi masih marginal visual.' },
    { icon: '🛫', text: 'Tetapkan alternate airport dengan bahan bakar cukup sebelum departure.' },
    { icon: '📻', text: 'Monitor ATIS setiap 30 menit and minta update kondisi dari ATC saat descent.' },
    { icon: '🎯', text: 'Stabilized approach wajib dipenuhi — go-around jika tidak stabil di 500 ft AGL.' },
  ];
  if (category === 'IFR') return [
    ...base,
    { icon: '🚨', text: 'Kondisi IFR aktif — instrument approach wajib. Verifikasi ketersediaan ILS dan minima approach.' },
    { icon: '⛽', text: 'Hitung extra fuel untuk holding dan diversion ke alternate yang sudah dikonfirmasi kondisinya.' },
    { icon: '🎖️', text: 'Pastikan crew sudah qualified minimum CAT-I approach (DH 200 ft, RVR 550 m).' },
    { icon: '📡', text: 'Laporkan kondisi aktual saat landing sebagai PIREP untuk penerbangan berikutnya.' },
    { icon: '🔄', text: 'Siapkan missed approach procedure secara mental sebelum descend ke DH.' },
  ];
  if (category === 'LIFR') return [
    ...base,
    { icon: '🛑', text: 'LIFR KRITIS — pertimbangkan delay atau cancellation. Risiko go-around sangat tinggi.' },
    { icon: '⛽', text: 'Fuel planning wajib memperhitungkan hold 45 menit + full diversion.' },
    { icon: '📟', text: 'Minta laporan PIREP terbaru dari ATC sebelum memutuskan untuk approach.' },
    { icon: '🎖️', text: 'Hanya crew dengan kualifikasi CAT-II/III yang diizinkan melakukan approach pada kondisi ini.' },
    { icon: '📋', text: 'Dokumentasikan keputusan operasional dan laporkan ke dispatcher/ops control.' },
  ];
  return base;
};

const getPassengerRecommendations = (category: string): Recommendation[] => {
  if (category === 'VFR') return [
    { icon: '🌤️', text: 'Cuaca sangat baik hari ini. Penerbangan diperkirakan tepat waktu dan nyaman.' },
    { icon: '💺', text: 'Tetap kenakan sabuk pengaman meski lampu seat belt padam — antisipasi turbulensi mendadak.' },
    { icon: '📱', text: 'Simpan ponsel dalam mode pesawat selama penerbangan sesuai aturan maskapai.' },
    { icon: '🧃', text: 'Hidrasi cukup selama penerbangan — udara kabin cukup kering di ketinggian jelajah.' },
  ];
  if (category === 'MVFR') return [
    { icon: '⛅', text: 'Kondisi cuaca marginal — kemungkinan keterlambatan kecil. Pantau informasi penerbangan di aplikasi maskapai.' },
    { icon: '💺', text: 'Patuhi instruksi awak kabin dan tetap duduk dengan sabuk pengaman saat lampu menyala.' },
    { icon: '🤢', text: 'Siapkan kantong muntah jika rentan mabuk perjalanan — kemungkinan turbulensi ringan saat descent.' },
    { icon: '📡', text: 'Minta informasi terbaru dari pramugari jika penerbangan terasa tertunda lebih dari 15 menit.' },
  ];
  if (category === 'IFR') return [
    { icon: '⚠️', text: 'Kondisi cuaca buruk aktif di bandara tujuan. Kemungkinan keterlambatan signifikan — siapkan alternatif.' },
    { icon: '📲', text: 'Pantau status penerbangan di aplikasi maskapai atau website resmi bandara secara aktif.' },
    { icon: '🚌', text: 'Siapkan rencana alternatif transportasi darat jika penerbangan dibatalkan atau dialihkan.' },
    { icon: '💺', text: 'Selama penerbangan, tetap sabuk pengaman terpasang sepanjang waktu demi keselamatan.' },
    { icon: '😮‍💨', text: 'Tetap tenang jika terjadi perubahan rute mendadak — pilot dan ATC sudah memiliki prosedur standar.' },
  ];
  if (category === 'LIFR') return [
    { icon: '🛑', text: 'KONDISI KRITIS: Kemungkinan pembatalan atau pengalihan penerbangan sangat tinggi hari ini.' },
    { icon: '📲', text: 'Periksa status penerbangan Anda SEBELUM berangkat ke bandara untuk menghindari perjalanan sia-sia.' },
    { icon: '📞', text: 'Hubungi call center maskapai untuk informasi reschedule atau refund jika penerbangan dibatalkan.' },
    { icon: '🧳', text: 'Siapkan pakaian ekstra dan perlengkapan darurat jika harus menginap di kota tujuan atau transit.' },
    { icon: '🚨', text: 'Jika sudah di dalam pesawat, patuhi semua instruksi awak kabin tanpa pengecualian.' },
  ];
  return [
    { icon: '💺', text: 'Selalu kenakan sabuk pengaman selama penerbangan.' },
    { icon: '📱', text: 'Aktifkan mode pesawat saat boarding.' },
  ];
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
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
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
          class="relative h-full w-full max-w-lg bg-white/95 dark:bg-brand-navy-950/95 border-l border-slate-200/30 dark:border-brand-navy-900/20 shadow-2xl text-slate-800 dark:text-slate-100 p-5 md:p-6 flex flex-col justify-between overflow-hidden"
        >
          <!-- Ambient glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <!-- Close button -->
          <button
            @click="emit('close')"
            class="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer z-10"
          >
            <X class="w-4 h-4" />
          </button>

          <!-- Header -->
          <div class="mb-4 pr-8 text-left">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span class="w-1 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              Advisor Keselamatan Penerbangan
            </h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
              Data cuaca bandara, SIGMET, dan panduan operasi penerbangan berbasis BMKG.
            </p>

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
            <div class="flex overflow-x-auto no-scrollbar gap-1 mt-4 pb-0.5">
              <button
                v-for="sect in localSectors"
                :key="sect.id"
                @click="activeAdvisorSector = sect; activeSectorTab = 'status'"
                class="shrink-0 py-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
                :class="activeAdvisorSector?.id === sect.id
                  ? 'bg-slate-100 dark:bg-brand-navy-900/60 text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'"
              >
                {{ getSectorLabel(sect.id) }}
              </button>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div
            v-if="activeAdvisorSector"
            class="flex-grow overflow-y-auto pl-1 -ml-1 pr-1 -mr-2 space-y-5 py-3 text-left"
            style="will-change: scroll-position; -webkit-overflow-scrolling: touch;"
          >
            <div class="space-y-4">
              <!-- Title & Icon Row -->
              <div class="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-brand-navy-900/20">
                <div class="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-400/30 shrink-0">
                  <component :is="getSectorIcon(activeAdvisorSector.id)" class="w-4 h-4" :class="activeAdvisorSector.textColor" />
                </div>
                <div class="text-left min-w-0">
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">{{ activeAdvisorSector.name }}</span>
                  <h3 class="text-xs font-bold text-slate-800 dark:text-white leading-tight tracking-tight mt-0.5 truncate">
                    {{ activeAdvisorSector.title }}
                  </h3>
                </div>
              </div>

              <!-- Description -->
              <p class="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-normal">
                {{ activeAdvisorSector.description }}
              </p>

              <!-- Parameters Grid -->
              <div class="grid grid-cols-[110px_1fr] gap-y-3.5 text-[11px] border-t border-b border-slate-100 dark:border-brand-navy-900/20 py-4 my-2">
                <!-- Category row -->
                <div class="text-slate-500 dark:text-slate-450 font-semibold self-center">Kategori Cuaca</div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border"
                    :class="getCategoryBadgeClass(activeAdvisorSector.category)"
                  >
                    {{ activeAdvisorSector.category }}
                  </span>
                  <span class="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {{ activeAdvisorSector.icao }}
                  </span>
                </div>

                <!-- Risk Level row -->
                <div class="text-slate-500 dark:text-slate-450 font-semibold self-center">Tingkat Risiko</div>
                <div class="flex items-center gap-2">
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
                    <span
                      class="rounded-full relative shrink-0"
                      :title="param.status"
                      :class="getPulseClass(param.status)"
                      style="width:6px;height:6px;min-width:6px;min-height:6px;"
                    >
                      <span class="animate-ping absolute inset-0 rounded-full opacity-75" :class="getPulseClass(param.status)" />
                    </span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Sub-tabs -->
            <div class="space-y-4">
              <div class="flex gap-5 border-b border-slate-150 dark:border-brand-navy-900/20 pb-2 overflow-x-auto no-scrollbar">
                <button
                  v-for="tab in ['status', 'sop', 'emergency', 'rekomendasi']"
                  :key="tab"
                  @click="activeSectorTab = tab as any"
                  class="shrink-0 pb-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative text-left whitespace-nowrap"
                  :class="activeSectorTab === tab
                    ? 'text-indigo-600 dark:text-indigo-400 font-black border-b-2 border-indigo-600 dark:border-indigo-400 -mb-[10px]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'"
                >
                  {{ tab === 'status' ? 'Status' : tab === 'sop' ? 'SOP' : tab === 'emergency' ? 'Mitigasi' : 'Rekomendasi' }}
                </button>
              </div>

              <!-- Tab: Status -->
              <div v-if="activeSectorTab === 'status'" class="space-y-2.5 min-h-[110px] pt-1 animate-fade-in text-left">
                <div
                  v-for="(adv, index) in activeAdvisorSector.advisories"
                  :key="index"
                  class="flex gap-2 text-[10.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-350"
                >
                  <AlertTriangle v-if="adv.status === 'danger'"   class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <AlertTriangle v-else-if="adv.status === 'warning'" class="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <CheckCircle2 v-else-if="adv.status === 'safe'"  class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <Info          v-else                             class="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p class="flex-grow">{{ adv.text }}</p>
                </div>
              </div>

              <!-- Tab: SOP Checklist -->
              <div v-if="activeSectorTab === 'sop'" class="space-y-2.5 min-h-[110px] pt-1 animate-fade-in text-left">
                <div
                  v-for="(step, index) in activeAdvisorSector.sopSteps"
                  :key="index"
                  class="flex items-start gap-2.5 cursor-pointer group/step"
                  @click="step.done = !step.done"
                >
                  <div
                    class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5"
                    :class="step.done
                      ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-400 dark:border-indigo-400 text-white shadow-sm'
                      : 'border-slate-300 dark:border-brand-navy-700 bg-transparent'"
                  >
                    <svg v-if="step.done" class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span
                    class="text-[10.5px] font-semibold select-none leading-normal"
                    :class="step.done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-350'"
                  >
                    {{ step.text }}
                  </span>
                </div>
                <div class="pt-2 text-[8px] font-black text-slate-450 dark:text-brand-navy-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-yellow-500" />
                  Tip: Ketuk butir SOP di atas untuk menandai selesai.
                </div>
              </div>

              <!-- Tab: Emergency Contacts -->
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
                      class="p-1 rounded-lg bg-indigo-600 text-white hover:scale-105 active:scale-95 transition-all outline-none"
                      title="Panggil"
                    >
                      <ArrowUpRight class="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <!-- Tab: Rekomendasi Pilot & Penumpang -->
              <div v-if="activeSectorTab === 'rekomendasi'" class="space-y-4 min-h-[110px] pt-1 animate-fade-in text-left">
                <!-- Pilot -->
                <div class="space-y-2">
                  <div class="flex items-center gap-2 pb-1.5 border-b border-indigo-500/15 dark:border-indigo-400/10">
                    <UserCog class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Rekomendasi Pilot</span>
                  </div>
                  <div
                    v-for="(rec, i) in getPilotRecommendations(activeAdvisorSector.category)"
                    :key="'pilot-' + i"
                    class="flex items-start gap-2 text-[10.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-350"
                  >
                    <span class="shrink-0 text-[12px] leading-none mt-0.5">{{ rec.icon }}</span>
                    <p class="flex-grow">{{ rec.text }}</p>
                  </div>
                </div>

                <!-- Penumpang -->
                <div class="space-y-2 mt-4">
                  <div class="flex items-center gap-2 pb-1.5 border-b border-violet-500/15 dark:border-violet-400/10">
                    <Users2 class="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span class="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Rekomendasi Penumpang</span>
                  </div>
                  <div
                    v-for="(rec, i) in getPassengerRecommendations(activeAdvisorSector.category)"
                    :key="'pax-' + i"
                    class="flex items-start gap-2 text-[10.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-350"
                  >
                    <span class="shrink-0 text-[12px] leading-none mt-0.5">{{ rec.icon }}</span>
                    <p class="flex-grow">{{ rec.text }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Close Button -->
            <div class="pt-4 mt-6 border-t border-slate-150 dark:border-brand-navy-900/20">
              <button
                type="button"
                @click="emit('close')"
                class="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-brand-navy-800 bg-white hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-xs"
              >
                Tutup Advisor
              </button>
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
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0.9;
}
</style>

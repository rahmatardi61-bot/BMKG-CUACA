<script setup lang="ts">
// Widget "Laporan Parameter Gempa" — panel parameter satu gempa terbaru (TEWS autogempa).
// Di dashboard panel ini menempel di sidebar EarthquakeHistory; di sini berdiri sendiri.
import { computed, onMounted, ref } from 'vue';
import { Activity, Clock, Compass, MapPin, ShieldCheck, Waves } from 'lucide-vue-next';
import {
  calculateDistance,
  fetchLatestAutogempa,
  getCityCoordinates,
  type EarthquakeEvent,
} from '../data/earthquakeData';

const props = defineProps<{ selectedCity: string }>();

const event = ref<EarthquakeEvent | null>(null);
const loading = ref(true);
const error = ref('');

const distance = computed(() => {
  if (!event.value) return null;
  const c = getCityCoordinates(props.selectedCity);
  return calculateDistance(c.lat, c.lng, event.value.lat, event.value.lng);
});

onMounted(async () => {
  try {
    event.value = await fetchLatestAutogempa();
    if (!event.value) error.value = 'Data gempa terbaru belum tersedia.';
  } catch {
    error.value = 'Data gempa terbaru belum tersedia.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-3" v-api-marker:earthquake-params>
    <div class="rounded-[4px] border border-slate-100/60 dark:border-brand-navy-700/30 bg-white/85 dark:bg-brand-navy-900/80 p-4 shadow-sm">
      <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-brand-navy-900/30">
        <div class="p-2.5 rounded-[4px] flex items-center justify-center border shrink-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/25 text-amber-500">
          <Activity class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-red-500 dark:text-red-400 block">Laporan Parameter Gempa</span>
          <h3 class="text-[13px] font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
            BMKG Pusat<span v-if="distance !== null"> • Jarak {{ distance }} km dari {{ selectedCity }}</span>
          </h3>
        </div>
      </div>

      <p v-if="loading" class="py-6 text-center text-[11px] text-slate-500">Memuat parameter gempa…</p>
      <p v-else-if="error" class="py-6 text-center text-[11px] text-slate-500">{{ error }}</p>

      <div v-else-if="event" class="space-y-3 pt-3">
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-slate-50/60 dark:bg-brand-navy-900/40 border border-slate-100/60 dark:border-brand-navy-850/20 rounded-[4px] p-2.5 text-center">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400">Kekuatan</span>
            <p class="text-sm font-black mt-1" :class="event.magnitude >= 6 ? 'text-red-500' : 'text-amber-500'">
              M {{ event.magnitude.toFixed(1) }}
            </p>
            <span class="text-[8px] font-bold text-slate-500">Skala Richter</span>
          </div>
          <div class="bg-slate-50/60 dark:bg-brand-navy-900/40 border border-slate-100/60 dark:border-brand-navy-850/20 rounded-[4px] p-2.5 text-center">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400">Kedalaman</span>
            <p class="text-[11px] font-black text-slate-800 dark:text-white mt-1 flex items-center justify-center gap-1">
              <Compass class="w-3.5 h-3.5 text-indigo-400" />{{ event.depth }} Km
            </p>
            <span class="text-[8px] font-bold text-slate-500">{{ event.depth <= 70 ? 'Dangkal' : 'Menengah' }}</span>
          </div>
          <div class="bg-slate-50/60 dark:bg-brand-navy-900/40 border border-slate-100/60 dark:border-brand-navy-850/20 rounded-[4px] p-2.5 text-center">
            <span class="text-[8px] font-black uppercase tracking-wider text-slate-400">Tsunami</span>
            <p class="mt-1 flex items-center justify-center">
              <ShieldCheck v-if="!event.tsunamiPotential" class="w-4 h-4 text-emerald-500" />
              <Waves v-else class="w-4 h-4 text-red-500" />
            </p>
            <span class="text-[8px] font-black" :class="event.tsunamiPotential ? 'text-red-500' : 'text-emerald-500'">
              {{ event.tsunamiPotential ? 'WASPADA' : 'AMAN' }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-slate-50/60 dark:bg-brand-navy-900/40 border border-slate-100/60 dark:border-brand-navy-850/20 rounded-[4px] p-3">
          <div class="w-8 h-8 rounded-[4px] bg-blue-500/10 text-blue-500 dark:text-brand-cyan flex items-center justify-center shrink-0">
            <MapPin class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">Pusat Episentrum</p>
            <p class="text-[10px] font-black text-slate-800 dark:text-white leading-snug">{{ event.epicenter }}</p>
            <div class="flex items-center gap-1.5 mt-0.5 text-[8px] font-semibold text-slate-500">
              <Clock class="w-2.5 h-2.5" />{{ event.time }}
              <span>•</span><span>{{ event.date }}</span>
              <span>•</span><span>{{ event.lintang }}, {{ event.bujur }}</span>
            </div>
          </div>
        </div>

        <div v-if="event.feltMmi.length" class="bg-slate-50/60 dark:bg-brand-navy-900/40 border border-slate-100/60 dark:border-brand-navy-850/20 rounded-[4px] p-3">
          <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-2">Daftar Wilayah Dirasakan (Skala MMI)</span>
          <div class="flex flex-col gap-1.5">
            <div v-for="felt in event.feltMmi.slice(0, 6)" :key="felt.area" class="flex items-center justify-between gap-2 text-[10px] font-semibold">
              <span class="text-slate-700 dark:text-slate-300 font-extrabold truncate">{{ felt.area }}</span>
              <span class="text-slate-800 dark:text-white font-black shrink-0">{{ felt.mmi }} MMI</span>
            </div>
          </div>
        </div>

        <p class="text-[9px] text-slate-500 leading-relaxed">{{ event.potensi }}</p>
      </div>
    </div>
  </div>
</template>

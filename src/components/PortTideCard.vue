<script setup lang="ts">
// Kartu Pelabuhan & Pasut — sumber RESMI: maritim.bmkg.go.id/public_api/pelabuhan/*
// (dipilih pelabuhan terdekat dari koordinat kota di useBmkgWeather.loadPort).
// Atribusi "BMKG" wajib untuk pemakaian Open Data.
import { computed } from 'vue';
import {
  Anchor,
  Waves,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  AlertTriangle,
  Loader2,
} from 'lucide-vue-next';
import type { PortInfo } from '../composables/useBmkgWeather';

const props = defineProps<{
  port: PortInfo | null;
  selectedCity?: string;
  loading?: boolean;
}>();

const slot = computed(() => props.port?.slot ?? null);
const isWarn = computed(() => {
  const w = slot.value?.warning_desc;
  return !!w && w.toUpperCase() !== 'NIL';
});

/** offset zona waktu dari nama kota (pola sama dgn getFormattedTimeAndZone) */
const tzOffsetHours = computed(() => {
  const c = (props.selectedCity || '').toLowerCase();
  if (c.includes('makassar') || c.includes('denpasar') || c.includes('bali') || c.includes('wita')) return 8;
  if (c.includes('jayapura') || c.includes('wit')) return 9;
  return 7;
});
const tzLabel = computed(() => (tzOffsetHours.value === 7 ? 'WIB' : tzOffsetHours.value === 8 ? 'WITA' : 'WIT'));

/** "2026-09-15 23:00 UTC" → "06:00 WIB" (tanggal ikut kalau bergeser hari) */
function fmtTideTime(raw?: string): string {
  if (!raw) return '-';
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return raw;
  const utcMs = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const local = new Date(utcMs + tzOffsetHours.value * 3600_000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${tzLabel.value}`;
}

const windText = computed(() => {
  const s = slot.value;
  if (!s) return '-';
  const dir = s.wind_from ? `${s.wind_from} ` : '';
  const from = s.wind_speed_min ?? '-';
  const to = s.wind_speed_max ?? '-';
  return `${dir}${from}–${to} knot`;
});

const visKm = computed(() => {
  const v = slot.value?.visibility;
  return typeof v === 'number' ? `${(v / 1000).toFixed(1)} km` : '-';
});

/** tidak semua pelabuhan punya data pasut (field-nya null di API) */
const hasTide = computed(() => {
  const s = slot.value;
  return !!s && (s.high_tide != null || s.low_tide != null);
});

const metrics = computed(() => {
  const s = slot.value;
  if (!s) return [];
  return [
    { icon: Thermometer, label: 'Suhu', value: `${s.temp_min ?? '-'}–${s.temp_max ?? '-'}°C`, tone: 'text-rose-500 dark:text-rose-400' },
    { icon: Droplets, label: 'Kelembapan', value: `${s.rh_min ?? '-'}–${s.rh_max ?? '-'}%`, tone: 'text-blue-500 dark:text-blue-400' },
    { icon: Wind, label: 'Angin', value: windText.value, tone: 'text-teal-500 dark:text-teal-400' },
    { icon: Eye, label: 'Jarak Pandang', value: visKm.value, tone: 'text-indigo-500 dark:text-indigo-400' },
  ];
});
</script>

<template>
  <div class="space-y-4" v-api-marker:port-tide>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pelabuhan & Pasut</h3>
      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">BMKG Open Data</span>
    </div>

    <!-- Belum termuat -->
    <div v-if="!slot" class="bg-white/90 dark:bg-brand-navy-900/90 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-[4px] p-4 shadow-sm flex items-center gap-3">
      <Loader2 v-if="loading" class="w-4 h-4 text-slate-400 animate-spin" />
      <Anchor v-else class="w-4 h-4 text-slate-400" />
      <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        {{ loading ? 'Memuat data pelabuhan terdekat…' : 'Data pelabuhan belum tersedia untuk lokasi ini.' }}
      </p>
    </div>

    <div
      v-else
      class="bg-white/90 dark:bg-brand-navy-900/90 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-[4px] p-4 shadow-sm hover:shadow-md transition-[box-shadow] duration-300"
    >
      <!-- Header: nama pelabuhan + cuaca -->
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-[4px] shrink-0 bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400">
          <Anchor class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-bold text-slate-800 dark:text-white truncate">{{ port?.name }}</h4>
            <span
              v-if="isWarn"
              class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"
            >
              <AlertTriangle class="w-3 h-3" /> Peringatan
            </span>
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Kode {{ port?.portId }} · {{ slot.weather }} · {{ slot.time_desc || 'Hari ini' }}
          </p>
        </div>
      </div>

      <!-- Gelombang + peringatan resmi -->
      <div class="mt-3 flex items-center gap-2 flex-wrap">
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Waves class="w-3 h-3" /> Gelombang {{ slot.wave_desc }} ({{ slot.wave_cat }})
        </span>
      </div>
      <p v-if="isWarn" class="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-semibold leading-normal">
        {{ slot.warning_desc }}
      </p>

      <!-- Metrik -->
      <div class="grid grid-cols-2 gap-2 mt-3">
        <div v-for="m in metrics" :key="m.label" class="bg-slate-50/70 dark:bg-brand-navy-800/40 rounded-[4px] p-2">
          <div class="flex items-center gap-1">
            <component :is="m.icon" class="w-3 h-3" :class="m.tone" />
            <span class="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{{ m.label }}</span>
          </div>
          <p class="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{{ m.value }}</p>
        </div>
      </div>

      <!-- Pasut (tidak semua pelabuhan punya) -->
      <div v-if="hasTide" class="mt-2 grid grid-cols-2 gap-2">
        <div class="bg-slate-50/70 dark:bg-brand-navy-800/40 rounded-[4px] p-2">
          <div class="flex items-center gap-1">
            <Sunrise class="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span class="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Pasang</span>
          </div>
          <p class="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">
            {{ slot.high_tide ?? '-' }} m · {{ fmtTideTime(slot.high_tide_time) }}
          </p>
        </div>
        <div class="bg-slate-50/70 dark:bg-brand-navy-800/40 rounded-[4px] p-2">
          <div class="flex items-center gap-1">
            <Sunset class="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            <span class="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Surut</span>
          </div>
          <p class="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">
            {{ slot.low_tide ?? '-' }} m · {{ fmtTideTime(slot.low_tide_time) }}
          </p>
        </div>
      </div>
      <p v-else class="text-[9px] text-slate-400 dark:text-slate-500 mt-2 italic">
        Data pasut belum tersedia untuk pelabuhan ini.
      </p>

      <p class="text-[9px] text-slate-400 dark:text-slate-500 mt-2 leading-normal line-clamp-2">
        {{ slot.weather_desc }}
      </p>
    </div>
  </div>
</template>

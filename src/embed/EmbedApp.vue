<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// EMBED APP — host widget untuk iframe (widget BMKG di web pihak lain)
// ---------------------------------------------------------------------------
// Semua opsi STATIS (keputusan: tidak ada kustom warna/UI, tidak ada kota bebas):
//   ?widget=satellite                → peta satelit Himawari-9 (mandiri, nol props)
//   ?widget=earthquake&city=Jakarta  → gempa live TEWS (kota = penentu "terdekat")
//   ?widget=coming                   → placeholder resmi utk kartu yang belum siap
// Kota dibatasi daftar tertutup + fallback Jakarta: kota tak dikenal diabaikan
// (jangan pernah tampil kosong/rusak di web orang lain).
// ═══════════════════════════════════════════════════════════════════════════
import { computed, defineAsyncComponent } from 'vue';
import { MapPin, Construction, ExternalLink } from 'lucide-vue-next';

const SatelliteMap = defineAsyncComponent(() => import('../components/SatelliteMap.vue'));
const EarthquakeHistory = defineAsyncComponent(() => import('../components/EarthquakeHistory.vue'));

const params = new URLSearchParams(window.location.search);
const widget = params.get('widget') || 'coming';

// Hanya kota yang koordinatnya tersedia di app (composables/useBmkgWeather.ts:32)
const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Batam', 'Pekanbaru', 'Denpasar'];
const requestedCity = params.get('city') || 'Jakarta';
const city = CITIES.find(c => c.toLowerCase() === requestedCity.toLowerCase()) ?? 'Jakarta';

const title = computed(() => (widget === 'satellite' ? 'Citra Satelit Himawari-9' : 'Gempa Bumi Terkini'));

// Kartu yang belum siap di-embed (jujur di UI, bukan error)
const READY = ['satellite', 'earthquake'];
const isReady = READY.includes(widget);
</script>

<template>
  <div class="min-h-full bg-[#070c19] text-white">
    <!-- Widget siap -->
    <template v-if="isReady">
      <div v-if="widget === 'earthquake'" class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/60">
        <MapPin class="w-3 h-3 text-brand-cyan" />
        <span class="text-[10px] font-bold text-slate-300">{{ city }}</span>
        <span class="ml-auto text-[8px] font-bold tracking-wider text-slate-500">BMKG</span>
      </div>
      <SatelliteMap v-if="widget === 'satellite'" />
      <EarthquakeHistory v-else :selected-city="city" />
    </template>

    <!-- Placeholder: kartu belum siap di-embed -->
    <div v-else class="p-5 flex flex-col items-center text-center gap-2">
      <Construction class="w-6 h-6 text-amber-400" />
      <p class="text-[11px] font-black">Widget belum tersedia</p>
      <p class="text-[9px] text-slate-400 leading-relaxed max-w-[240px]">
        Widget <code class="text-brand-cyan">{{ widget }}</code> belum siap untuk di-embed.
        Lihat daftar widget yang tersedia di halaman dokumentasi.
      </p>
      <a
        :href="'/' + 'widgets'"
        target="_blank"
        class="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-brand-cyan hover:underline"
      >
        Dokumentasi widget <ExternalLink class="w-2.5 h-2.5" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
// Widget PENCARIAN LOKASI — memakai /api/widget-search (dijaga token).
// Hasil pilihan tidak ditelan sendiri: dikirim ke halaman pemasang sebagai
// `bmkg-widget-place`, sehingga SEMUA widget di halaman itu ikut pindah.
// Halaman pemasang bebas tidak menanggapinya (widget tetap jalan sendiri).
import { ref, onMounted, onUnmounted } from 'vue';
import { Search, MapPin, Loader2 } from 'lucide-vue-next';
import { currentToken } from '../services/embedToken';

type Hit = { name: string; region: string; lat: number; lon: number; source: string };

const q = ref('');
const items = ref<Hit[]>([]);
const loading = ref(false);
const warning = ref('');
const picked = ref<Hit | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

async function run(force = false): Promise<void> {
  const text = q.value.trim();
  if (text.length < 2) {
    items.value = [];
    warning.value = '';
    return;
  }
  const mine = ++seq;
  loading.value = true;
  try {
    const token = currentToken();
    const res = await fetch(`/api/widget-search?q=${encodeURIComponent(text)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = (await res.json().catch(() => ({}))) as { items?: Hit[]; warning?: string; reason?: string };
    if (mine !== seq && !force) return; // hasil query lama, buang
    items.value = json.items ?? [];
    warning.value = json.warning ?? json.reason ?? '';
  } catch (e) {
    items.value = [];
    warning.value = String(e instanceof Error ? e.message : e).slice(0, 120);
  } finally {
    loading.value = false;
  }
}

function onInput(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void run(), 320); // debounce: jangan hammer Nominatim
}

function choose(hit: Hit): void {
  picked.value = hit;
  // Kabari halaman pemasang → semua widget di halaman ikut pindah
  window.parent?.postMessage(
    { type: 'bmkg-widget-place', label: hit.name, lat: hit.lat, lon: hit.lon },
    '*',
  );
}

onMounted(() => {
  void run(); // tampilkan 10 kota bawaan tanpa perlu mengetik
});
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div class="p-4">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="q"
        type="search"
        placeholder="Cari kota, kecamatan, atau kelurahan…"
        class="w-full pl-9 pr-9 py-2.5 rounded-[4px] text-[13px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        @input="onInput"
        @keyup.enter="run(true)"
      />
      <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500 animate-spin" />
    </div>

    <p v-if="picked" class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
      Dipilih: {{ picked.name }} · {{ picked.lat.toFixed(3) }}, {{ picked.lon.toFixed(3) }}
    </p>

    <ul v-if="items.length" class="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
      <li v-for="(hit, i) in items" :key="`${hit.lat},${hit.lon},${i}`">
        <button
          type="button"
          class="w-full text-left px-2 py-2 rounded-[4px] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="choose(hit)"
        >
          <span class="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
            <MapPin class="w-3 h-3 text-cyan-500 shrink-0" />{{ hit.name }}
          </span>
          <span class="block pl-4.5 text-[10.5px] text-slate-500 truncate">{{ hit.region }}</span>
        </button>
      </li>
    </ul>

    <p v-else-if="q.trim().length >= 2 && !loading" class="mt-3 text-[11px] text-slate-500">
      Tidak ada hasil untuk “{{ q }}”.
    </p>

    <p v-if="warning" class="mt-2 text-[10.5px] text-amber-600 dark:text-amber-400">{{ warning }}</p>
    <p class="mt-3 text-[10px] text-slate-400">
      Sumber: daftar kota widget + OpenStreetMap (lewat server BMKG).
    </p>
  </div>
</template>

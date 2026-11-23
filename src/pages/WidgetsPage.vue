<script setup lang="ts">
import { ref, computed } from 'vue';
import { Copy, Check, Code2, Eye, Globe, ExternalLink, ShieldCheck, Layers, MapPin, Activity } from 'lucide-vue-next';

// Widget yang SUDAH siap embed (lihat src/embed/EmbedApp.vue → READY)
type Widget = {
  id: string;
  name: string;
  desc: string;
  city?: boolean;
  height: number;
  live: boolean;
};

const WIDGETS: Widget[] = [
  {
    id: 'satellite',
    name: 'Citra Satelit Himawari-9',
    desc: 'Peta satelit interaktif: 8 parameter channel, 18 frame (3 jam terakhir), kontrol animasi. Data langsung dari API BMKG.',
    height: 420,
    live: true
  },
  {
    id: 'earthquake',
    name: 'Gempa Bumi Terkini',
    desc: 'Gempa terbaru dari TEWS BMKG + peta lokasi. Menampilkan gempa terdekat dari kota yang dipilih.',
    city: true,
    height: 520,
    live: true
  }
];

// Kartu dashboard yang BELUM siap di-embed — ditampilkan jujur, bukan disembunyikan
const SOON = [
  { name: 'Peringatan Dini Cuaca', reason: 'Butuh adapter data (alerts di-inject dari dashboard)' },
  { name: 'Berita & Pengumuman', reason: 'Butuh adapter data (artikel di-inject dari dashboard)' },
  { name: 'Peta Maritim', reason: 'Terlalu besar (Leaflet + 232 wilayah), sedang dipertimbangkan' },
  { name: 'Transportasi & Rute', reason: 'Punya beberapa mode (jalan/kereta/laut/penerbangan)' },
  { name: 'Aktivitas & Rekomendasi', reason: 'Bergantung pada profil aktivitas pengguna' },
  { name: 'Prakiraan 7 Hari', reason: 'Butuh adapter data dari dashboard' }
];

const origin = window.location.origin;
const mode = ref<'script' | 'iframe'>('script');
const selCity = ref('Jakarta');
const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Batam', 'Pekanbaru', 'Denpasar'];

const activePreview = ref('satellite');
const copied = ref('');
const previewKey = ref(0);

function srcUrl(w: Widget) {
  const q = new URLSearchParams({ widget: w.id });
  if (w.city) q.set('city', selCity.value);
  return `${origin}/embed.html?${q.toString()}`;
}

function snippet(w: Widget) {
  if (mode.value === 'script') {
    const cityAttr = w.city ? ` data-city="${selCity.value}"` : '';
    const hAttr = w.city ? '' : ` data-height="${w.height}"`;
    // tag penutup dipecah supaya parser SFC tidak mengira blok <script> berakhir di sini
    const close = '</' + 'script>';
    return `<div data-bmkg-widget="${w.id}"${cityAttr}${hAttr}></div>\n<script async src="${origin}/embed.js">${close}`;
  }
  const cityQ = w.city ? `&city=${selCity.value}` : '';
  return `<iframe\n  src="${origin}/embed.html?widget=${w.id}${cityQ}"\n  width="100%" height="${w.height}"\n  style="border:0;border-radius:12px"\n  title="BMKG ${w.name}"\n  loading="lazy"\n></iframe>`;
}

async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => { if (copied.value === key) copied.value = ''; }, 1800);
  } catch {
    /* clipboard ditolak browser — user bisa seleksi manual */
  }
}

const previewWidget = computed(() => WIDGETS.find(w => w.id === activePreview.value) ?? WIDGETS[0]);
</script>

<template>
  <div class="min-h-screen bg-[#070c19] text-white">
    <!-- Header -->
    <header class="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-cyan to-blue-600 flex items-center justify-center shrink-0">
          <Layers class="w-4 h-4 text-slate-950" />
        </div>
        <div class="min-w-0">
          <h1 class="text-[13px] font-black leading-none">BMKG Widget</h1>
          <p class="text-[9px] text-slate-400 mt-0.5">Sematkan informasi cuaca BMKG di website Anda</p>
        </div>
        <a
          href="/"
          class="ml-auto text-[9px] font-bold text-slate-400 hover:text-brand-cyan transition-colors flex items-center gap-1"
        >
          Buka dashboard <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-5 py-6 space-y-8">
      <!-- Intro -->
      <section>
        <h2 class="text-lg font-black">Dokumentasi Widget BMKG</h2>
        <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
          Pilih widget, salin satu baris kode, tempel di website Anda. Tidak perlu API key,
          tidak perlu instalasi. Widget tampil dengan gaya visual BMKG dan terisolasi penuh
          dari CSS website Anda.
        </p>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck class="w-2.5 h-2.5" /> Tanpa API key
          </span>
          <span class="inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Code2 class="w-2.5 h-2.5" /> 1 baris kode
          </span>
          <span class="inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe class="w-2.5 h-2.5" /> Cocok semua framework
          </span>
        </div>
      </section>

      <!-- Cara pakai -->
      <section class="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
        <h3 class="text-[11px] font-black mb-1">Cara pakai</h3>
        <ol class="text-[10px] text-slate-400 space-y-1 leading-relaxed list-decimal list-inside">
          <li>Pilih widget yang diinginkan di bawah, lalu tekan <strong class="text-slate-200">Salin kode</strong>.</li>
          <li>Tempel kode tersebut di mana saja di dalam <code class="text-brand-cyan">&lt;body&gt;</code> website Anda.</li>
          <li>Selesai. Widget menyesuaikan lebar container-nya secara otomatis.</li>
        </ol>
      </section>

      <!-- Pilihan mode kode -->
      <section class="flex items-center gap-2 flex-wrap">
        <span class="text-[9px] font-bold text-slate-500">CARA SEMATKAN:</span>
        <button
          @click="mode = 'script'"
          :class="['px-2.5 py-1 rounded-md text-[9px] font-bold transition-colors border',
            mode === 'script' ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700']"
        >1 baris script (rekomendasi)</button>
        <button
          @click="mode = 'iframe'"
          :class="['px-2.5 py-1 rounded-md text-[9px] font-bold transition-colors border',
            mode === 'iframe' ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700']"
        >iframe manual (tanpa JS)</button>
        <p class="text-[8.5px] text-slate-500 ml-auto max-w-md leading-snug">
          Mode <strong class="text-slate-300">script</strong> memasang iframe untuk Anda secara otomatis.
          Mode <strong class="text-slate-300">iframe</strong> dipakai bila Anda tidak ingin memuat JavaScript tambahan.
        </p>
      </section>

      <!-- Daftar widget -->
      <section class="space-y-4">
        <h3 class="text-[11px] font-black flex items-center gap-1.5">
          <Activity class="w-3.5 h-3.5 text-emerald-400" /> Widget tersedia
          <span class="text-[8.5px] font-bold text-slate-500">({{ WIDGETS.length }})</span>
        </h3>

        <article
          v-for="w in WIDGETS"
          :key="w.id"
          class="rounded-xl border border-slate-800/60 bg-slate-900/40 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-slate-800/60 flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <h4 class="text-[11px] font-black leading-none">{{ w.name }}</h4>
              <p class="text-[9.5px] text-slate-400 mt-1 leading-relaxed">{{ w.desc }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="previewKey++; activePreview = w.id"
                class="text-[8.5px] font-bold text-slate-400 hover:text-brand-cyan px-2 py-1 rounded border border-slate-800 transition-colors flex items-center gap-1"
              ><Eye class="w-2.5 h-2.5" /> Preview</button>
              <button
                @click="copy(snippet(w), w.id)"
                class="text-[8.5px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
                :class="copied === w.id ? 'bg-emerald-500 text-slate-950' : 'bg-brand-cyan text-slate-950 hover:bg-brand-cyan/90'"
              >
                <component :is="copied === w.id ? Check : Copy" class="w-2.5 h-2.5" />
                {{ copied === w.id ? 'Tersalin' : 'Salin kode' }}
              </button>
            </div>
          </div>

          <!-- Pilihan kota (khusus widget yang butuh kota) -->
          <div v-if="w.city" class="px-4 py-2 border-b border-slate-800/60 flex items-center gap-2 flex-wrap">
            <MapPin class="w-3 h-3 text-brand-cyan" />
            <span class="text-[8.5px] font-bold text-slate-500">KOTA:</span>
            <button
              v-for="c in CITIES"
              :key="c"
              @click="selCity = c"
              :class="['text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-colors',
                selCity === c ? 'bg-brand-cyan text-slate-950' : 'text-slate-400 hover:text-slate-200']"
            >{{ c }}</button>
          </div>

          <div class="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
            <!-- Preview iframe live -->
            <div class="p-3">
              <p class="text-[8px] font-bold tracking-wider text-slate-500 mb-1.5">PREVIEW LANGSUNG</p>
              <iframe
                :key="`${w.id}-${w.city ? selCity : ''}-${previewKey}`"
                :src="srcUrl(w)"
                :height="w.height"
                width="100%"
                style="border:0;border-radius:8px;display:block"
                :title="`Preview ${w.name}`"
                loading="lazy"
              ></iframe>
            </div>

            <!-- Kode -->
            <div class="p-3 flex flex-col">
              <p class="text-[8px] font-bold tracking-wider text-slate-500 mb-1.5">KODE SEMATKAN</p>
              <pre class="flex-1 bg-slate-950/80 border border-slate-800/60 rounded-lg p-2.5 overflow-x-auto text-[8.5px] leading-relaxed text-brand-cyan font-mono"><code>{{ snippet(w) }}</code></pre>
            </div>
          </div>
        </article>
      </section>

      <!-- Widget dalam pengembangan -->
      <section class="space-y-3">
        <h3 class="text-[11px] font-black">Dalam pengembangan</h3>
        <p class="text-[9.5px] text-slate-500 leading-relaxed">
          Kartu berikut ada di dashboard BMKG tetapi belum disiapkan sebagai widget embed.
        </p>
        <div class="grid sm:grid-cols-2 gap-2">
          <div
            v-for="s in SOON"
            :key="s.name"
            class="rounded-lg border border-slate-800/40 bg-slate-900/20 px-3 py-2"
          >
            <p class="text-[9.5px] font-bold text-slate-300">{{ s.name }}</p>
            <p class="text-[8.5px] text-slate-500 mt-0.5 leading-snug">{{ s.reason }}</p>
          </div>
        </div>
      </section>

      <!-- FAQ singkat -->
      <section class="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 space-y-2.5">
        <h3 class="text-[11px] font-black">Pertanyaan umum</h3>
        <div>
          <p class="text-[9.5px] font-bold text-slate-300">Apakah tampilan bisa disesuaikan dengan desain website kami?</p>
          <p class="text-[9px] text-slate-500 leading-relaxed">Widget tampil dengan gaya visual BMKG. Penyesuaian warna mengikuti tema situs tidak tersedia pada versi ini.</p>
        </div>
        <div>
          <p class="text-[9.5px] font-bold text-slate-300">Apakah perlu API key atau pendaftaran?</p>
          <p class="text-[9px] text-slate-500 leading-relaxed">Tidak. Cukup tempel kode. Data diambil langsung dari layanan BMKG.</p>
        </div>
        <div>
          <p class="text-[9.5px] font-bold text-slate-300">Apakah widget bisa dipakai di React / WordPress / lainnya?</p>
          <p class="text-[9px] text-slate-500 leading-relaxed">Bisa. Widget berupa HTML biasa — berjalan di semua framework, CMS, maupun HTML statis.</p>
        </div>
        <div>
          <p class="text-[9.5px] font-bold text-slate-300">Berapa ukuran widget?</p>
          <p class="text-[9px] text-slate-500 leading-relaxed">Lebar mengikuti container Anda (100%). Tinggi menyesuaikan otomatis, atau bisa diatur lewat atribut <code class="text-brand-cyan">data-height</code>.</p>
        </div>
      </section>

      <footer class="text-center text-[8.5px] text-slate-600 pb-6">
        Badan Meteorologi, Klimatologi, dan Geofisika —
        <span class="text-slate-500">Widget versi 1 · {{ origin }}</span>
      </footer>
    </main>
  </div>
</template>

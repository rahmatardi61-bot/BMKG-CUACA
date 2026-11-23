<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Copy, Check, Code2, Eye, Globe, ExternalLink, ShieldCheck, Layers, MapPin, Activity, Moon, Sun, AlertTriangle, FlaskConical, Database, MousePointerClick, ListChecks, Construction } from 'lucide-vue-next';

// Tema dark/light — pola sama dengan app utama (class 'dark' di <html>, kunci localStorage)
const isDark = ref(true);
const applyTheme = (dark: boolean) => {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('bmkg-widget-theme', dark ? 'dark' : 'light');
};
onMounted(() => applyTheme(localStorage.getItem('bmkg-widget-theme') !== 'light'));

// Widget yang SUDAH siap embed (lihat src/embed/EmbedApp.vue → READY)
type Widget = {
  id: string;
  name: string;
  desc: string;
  city?: boolean;
  height: number;
  live: boolean;
  /** widget bisa jatuh ke data contoh bila layanan BMKG gagal */
  mockFallback?: string;
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
  },
  {
    id: 'alerts',
    name: 'Peringatan Dini Cuaca',
    desc: 'Peringatan cuaca ekstrem resmi BMKG untuk wilayah terpilih (nowcast + warning + siklon tropis).',
    city: true,
    height: 340,
    live: true
  },
  {
    id: 'news',
    name: 'Berita & Pengumuman BMKG',
    desc: 'Artikel dan video terbaru dari kanal resmi BMKG.',
    height: 420,
    live: true,
    mockFallback: 'Layanan berita BMKG (WordPress) cukup sering gagal (502). Bila itu terjadi, widget menampilkan artikel contoh dan menandainya dengan label MOCK.'
  },
  {
    id: 'forecast',
    name: 'Prakiraan Cuaca Per Jam',
    desc: 'Prakiraan suhu, kelembapan, dan peluang hujan per jam untuk wilayah terpilih.',
    city: true,
    height: 540,
    live: true
  },
  {
    id: 'current',
    name: 'Kondisi Cuaca Saat Ini',
    desc: 'Kartu utama dashboard: suhu, kondisi langit, angin, kelembapan, plus ringkasan 7 hari.',
    city: true,
    height: 520,
    live: true
  },
  {
    id: 'port-tide',
    name: 'Pasang Surut Pelabuhan',
    desc: 'Jadwal pasut pelabuhan terdekat dari Open Data resmi BMKG.',
    city: true,
    height: 380,
    live: true
  },
  {
    id: 'wave',
    name: 'Radar Tinggi Gelombang',
    desc: 'Peta perairan Indonesia dengan tinggi gelombang per wilayah laut (live BMKG).',
    city: true,
    height: 480,
    live: true
  },
  {
    id: 'marine',
    name: 'Peta Meteorologi Maritim',
    desc: 'Peta INAWAVES: prakiraan gelombang & cuaca perairan, lengkap dengan layer.',
    city: true,
    height: 600,
    live: true
  },
  {
    id: 'air-quality',
    name: 'Kualitas Udara (ISPU)',
    desc: 'Indeks kualitas udara per polutan (PM2.5, PM10, O₃, NO₂, CO, SO₂).',
    city: true,
    height: 420,
    live: false,
    mockFallback: 'BMKG tidak menyediakan API ISPU publik. Nilai dihitung deterministik per kota (bukan pengukuran resmi), jadi widget SELALU menampilkan label MOCK.'
  },
  {
    id: 'transport',
    name: 'Transportasi & Rute',
    desc: 'Status moda transportasi (jalan, kereta, laut, udara) di kota terpilih.',
    city: true,
    height: 360,
    live: false,
    mockFallback: 'Status transportasi tidak tersedia lewat API publik BMKG. Data pada widget ini adalah contoh, selalu berlabel MOCK.'
  },
  {
    id: 'major-cities',
    name: 'Kota-Kota Besar',
    desc: 'Kartu 10 kota besar Indonesia dengan landmark. Statis — tidak memuat data apa pun.',
    height: 400,
    live: false
  }
];

// Kartu dashboard yang BELUM siap di-embed — ditampilkan jujur, bukan disembunyikan
// Sengaja TIDAK dijadikan widget: isinya drawer interaktif / bergantung preferensi
// pengguna, jadi tidak masuk akal dibekukan di dalam iframe.
// Kartu dashboard yang BISA dijadikan widget, tapi belum dikerjakan (bahan diskusi)
const SOON = [
  {
    name: 'Current Weather Overview',
    reason: 'Isinya hampir sama dengan widget "Kondisi Cuaca Saat Ini" — kalau dibuat, keduanya jadi duplikat.'
  },
  {
    name: 'Aktivitas & Rekomendasi',
    reason: 'Narasi aktivitas dihitung dari data contoh (cityAnalysisMap), bukan produk resmi. Bisa dibuat, tapi harus berlabel MOCK.'
  },
  {
    name: 'Radar Cuaca',
    reason: 'Partikel angin & suhu stasiun dihitung di browser — animasi hasil hitungan, bukan produk radar BMKG. Butuh label MOCK.'
  },
  {
    name: 'Peta Angin',
    reason: 'Sama seperti radar: medan angin adalah animasi hasil hitungan, bukan data observasi.'
  },
  {
    name: 'Around Activity',
    reason: 'Daftar lapangan golf berasal dari data contoh; komponennya kini sudah tidak dipakai di dashboard.'
  }
];

// Tidak mungkin jadi iframe: berupa drawer/modal yang menunggu klik pengunjung
const NEEDS_CLICK = [
  {
    name: 'Land Based Activities',
    reason: 'Drawer dengan prop isOpen. Harus dibuka pengunjung — dibekukan di iframe hasilnya kotak kosong.'
  },
  {
    name: 'Penasihat Maritim',
    reason: 'Drawer interaktif: pengunjung memilih sektor, narasinya lalu dihitung dari data contoh.'
  },
  {
    name: 'Penasihat Penerbangan',
    reason: 'Drawer interaktif: butuh input bandara/sektor dari pengunjung.'
  },
  {
    name: 'Pencarian Lokasi',
    reason: 'Sudah tercakup parameter ?city= pada widget lain, jadi tidak perlu widget sendiri.'
  }
];

// Asal data tiap kelompok widget — ini yang menentukan seberapa "resmi" isinya
const DATA_SOURCES = [
  {
    label: 'API internal BMKG (via proxy)',
    tone: 'ok',
    where: 'cuaca.bmkg.go.id',
    detail: 'CORS ditutup, jadi diakses lewat proxy same-origin /api/bmkg. Butuh header Referer/Origin, X-API-KEY, dan x-public-token yang harus diambil ulang tiap ~25 menit.',
    widgets: 'Cuaca saat ini, prakiraan per jam, peringatan dini'
  },
  {
    label: 'Open Data BMKG (CORS terbuka)',
    tone: 'ok',
    where: 'publik.bmkg.go.id · maritim.bmkg.go.id',
    detail: 'Bisa dipanggil langsung dari browser. Dipakai sebagai jalur cadangan bila API internal gagal, dan sebagai sumber utama data maritim/pasut.',
    widgets: 'Pasang surut, gelombang, peta maritim'
  },
  {
    label: 'Tile & gambar (tanpa CORS)',
    tone: 'ok',
    where: 'satellite.bmkg.go.id · inderaja.bmkg.go.id',
    detail: 'Satelit memakai tile JSON (CORS *). inderaja tidak punya CORS sama sekali, jadi hanya bisa lewat <img> — tidak bisa dibaca sebagai data.',
    widgets: 'Citra satelit Himawari-9'
  },
  {
    label: 'Scraping halaman publik',
    tone: 'warn',
    where: 'www.bmkg.go.id · situs berita',
    detail: 'Tidak ada API resmi untuk berita & gempa, jadi diambil dari halaman/RSS publik. Rapuh: struktur halaman bisa berubah kapan saja tanpa pemberitahuan.',
    widgets: 'Berita, gempa (TEWS)'
  },
  {
    label: 'Data contoh (MOCK)',
    tone: 'bad',
    where: 'data/mockData.ts',
    detail: 'BMKG tidak menyediakan API-nya. Nilai dihitung sendiri atau diambil dari data contoh, dan widget SELALU memberi label MOCK.',
    widgets: 'Kualitas udara (ISPU), transportasi'
  }
];


const origin = window.location.origin;
const mode = ref<'script' | 'iframe'>('script');
const selCity = ref('DKI Jakarta');
const CITIES = ['DKI Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Batam', 'Pekanbaru', 'Denpasar'];

const copied = ref('');
const previewKey = ref(0);

function srcUrl(w: Widget) {
  const q = new URLSearchParams({ widget: w.id });
  if (w.city) q.set('city', selCity.value);
  q.set('theme', isDark.value ? 'dark' : 'light'); // preview ikut tema halaman
  return `${origin}/embed.html?${q.toString()}`;
}

function snippet(w: Widget) {
  const cityAttr = w.city ? ` data-city="${selCity.value}"` : '';
  const hAttr = w.city ? '' : ` data-height="${w.height}"`;
  if (mode.value === 'script') {
    const close = '</' + 'script>';
    return `<div data-bmkg-widget="${w.id}"${cityAttr}${hAttr}></div>\n<script async src="${origin}/embed.js">${close}`;
  }
  const cityQ = w.city ? `&city=${encodeURIComponent(selCity.value)}` : '';
  return `<iframe\n  src="${origin}/embed.html?widget=${w.id}${cityQ}&theme=${isDark.value ? 'dark' : 'light'}"\n  width="100%" height="${w.height}"\n  style="border:0;border-radius:12px"\n  title="BMKG ${w.name}"\n  loading="lazy"\n></iframe>`;
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
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#070c19] text-slate-900 dark:text-white transition-colors">
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-cyan to-blue-600 flex items-center justify-center shrink-0">
          <Layers class="w-4 h-4 text-slate-950" />
        </div>
        <div class="min-w-0">
          <h1 class="text-sm font-black leading-none">BMKG Widget</h1>
          <p class="text-sm text-slate-400 mt-0.5">Sematkan informasi cuaca BMKG di website Anda</p>
        </div>
        <button
          @click="applyTheme(!isDark)"
          class="ml-auto p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-cyan hover:text-brand-cyan transition-colors"
          :title="isDark ? 'Mode terang' : 'Mode gelap'"
        >
          <component :is="isDark ? Sun : Moon" class="w-4 h-4" />
        </button>
        <a
          href="/"
          class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-cyan transition-colors flex items-center gap-1"
        >
          Buka dashboard <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-5 py-6 space-y-8">
      <!-- Intro -->
      <section>
        <h2 class="text-lg font-black">Dokumentasi Widget BMKG</h2>
        <p class="text-[13px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
          Pilih widget, salin satu baris kode, tempel di website Anda. Tidak perlu API key,
          tidak perlu instalasi. Widget tampil dengan gaya visual BMKG dan terisolasi penuh
          dari CSS website Anda.
        </p>
        <p class="mt-2 inline-flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-md px-2.5 py-1.5">
          <FlaskConical class="w-3 h-3 shrink-0 mt-0.5" />
          <span><strong class="font-bold">Versi POC (proof of concept).</strong>
          Dibuat untuk keperluan pengembangan internal, <strong class="font-bold">belum untuk konsumsi publik</strong>.
          Lihat bagian <em>Status &amp; batasan</em> di bawah.</span>
        </p>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck class="w-2.5 h-2.5" /> Tanpa API key
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Code2 class="w-2.5 h-2.5" /> 1 baris kode
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe class="w-2.5 h-2.5" /> Cocok semua framework
          </span>
        </div>
      </section>

      <!-- Cara pakai -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4">
        <h3 class="text-xs font-black mb-1">Cara pakai</h3>
        <ol class="text-xs text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed list-decimal list-inside">
          <li>Pilih widget yang diinginkan di bawah, lalu tekan <strong class="text-slate-800 dark:text-slate-200">Salin kode</strong>.</li>
          <li>Tempel kode tersebut di mana saja di dalam <code class="px-1 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono text-[11px]">&lt;body&gt;</code> website Anda.</li>
          <li>Selesai. Widget menyesuaikan lebar container-nya secara otomatis.</li>
        </ol>
      </section>

      <!-- Pilihan mode kode -->
      <section class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-bold text-slate-500">CARA SEMATKAN:</span>
        <button
          @click="mode = 'script'"
          :class="['px-2.5 py-1 rounded-md text-sm font-bold transition-colors border',
            mode === 'script' ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700']"
        >1 baris script (rekomendasi)</button>
        <button
          @click="mode = 'iframe'"
          :class="['px-2.5 py-1 rounded-md text-sm font-bold transition-colors border',
            mode === 'iframe' ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700']"
        >iframe manual (tanpa JS)</button>
        <p class="text-[11px] text-slate-500 dark:text-slate-500 ml-auto max-w-md leading-relaxed">
          Mode <strong class="text-slate-800 dark:text-slate-300">script</strong> memasang iframe untuk Anda secara otomatis.
          Mode <strong class="text-slate-800 dark:text-slate-300">iframe</strong> dipakai bila Anda tidak ingin memuat JavaScript tambahan.
        </p>
      </section>

      <!-- Daftar widget -->
      <section class="space-y-4">
        <h3 class="text-[13px] font-black flex items-center gap-1.5">
          <Activity class="w-3.5 h-3.5 text-emerald-400" /> Widget tersedia
          <span class="text-[11px] font-bold text-slate-500">({{ WIDGETS.length }})</span>
        </h3>

        <article
          v-for="w in WIDGETS"
          :key="w.id"
          class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <h4 class="text-[13px] font-black leading-none">{{ w.name }}</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{{ w.desc }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="w.mockFallback"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                title="Widget ini bisa menampilkan data contoh (MOCK)"
              >MOCK fallback</span>
              <button
                @click="previewKey++"
                class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-cyan px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1"
              ><Eye class="w-2.5 h-2.5" /> Preview</button>
            </div>
          </div>

          <!-- Pilihan kota (khusus widget yang butuh kota) -->
          <div v-if="w.city" class="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-2 flex-wrap">
            <MapPin class="w-3 h-3 text-brand-cyan" />
            <span class="text-[11px] font-bold text-slate-500">KOTA:</span>
            <button
              v-for="c in CITIES"
              :key="c"
              @click="selCity = c"
              :class="['text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors',
                selCity === c ? 'bg-brand-cyan text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200']"
            >{{ c }}</button>
          </div>

          <div class="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/60">
            <!-- Preview iframe live -->
            <div class="p-3">
              <p class="text-[13px] font-bold tracking-wider text-slate-500 mb-1.5">PREVIEW LANGSUNG</p>
              <iframe
                :key="`${w.id}-${w.city ? selCity : ''}-${previewKey}-${isDark}`"
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
              <p class="text-[11px] font-bold tracking-wider text-slate-500 mb-1.5">KODE SEMATKAN</p>
              <div class="flex-1 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#0b1220]">
                <div class="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-300 dark:border-slate-700/80">
                  <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200">{{ mode === 'script' ? 'HTML' : 'HTML (iframe)' }}</span>
                  <button
                    @click="copy(snippet(w), w.id)"
                    class="text-[10px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    :class="copied === w.id ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-brand-cyan hover:text-brand-cyan'"
                  >
                    <component :is="copied === w.id ? Check : Copy" class="w-2.5 h-2.5" />
                    {{ copied === w.id ? 'Copied' : 'Copy' }}
                  </button>
                </div>
                <pre class="p-3 overflow-x-auto text-[11px] leading-relaxed text-slate-800 dark:text-slate-100 font-mono whitespace-pre"><code>{{ snippet(w) }}</code></pre>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Penjelasan fallback MOCK -->
      <section class="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-4 space-y-2">
        <h3 class="text-xs font-black flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle class="w-3.5 h-3.5" /> Tentang data contoh (MOCK)
        </h3>
        <p class="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
          Sebagian widget mengambil data langsung dari layanan BMKG. Bila layanan tersebut
          sedang tidak tersedia, widget tetap tampil agar tidak kosong — tetapi menampilkan
          <strong class="font-bold">data contoh</strong> dan memberi label
          <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">MOCK</span>
          di bagian atas widget.
        </p>
        <ul class="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed list-disc list-inside">
          <li><strong class="text-slate-800 dark:text-slate-200">Berita &amp; Pengumuman</strong> — layanan berita BMKG (WordPress) sering gagal; artikel contoh dipakai sebagai cadangan.</li>
          <li><strong class="text-slate-800 dark:text-slate-200">Peringatan Dini Cuaca</strong> — tidak memakai data contoh. Bila tidak ada peringatan aktif, widget menampilkan pesan "Tidak ada peringatan dini aktif" (data tetap asli).</li>
          <li><strong class="text-slate-800 dark:text-slate-200">Prakiraan Cuaca, Gempa, Satelit</strong> — tanpa data contoh. Bila gagal, widget menampilkan pesan bahwa data belum tersedia.</li>
        </ul>
      </section>

      <!-- Status & batasan (bahan diskusi pengembangan lanjutan) -->
      <section class="space-y-3">
        <h3 class="text-[13px] font-black">Status &amp; batasan</h3>
        <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed max-w-3xl">
          Fitur ini masih <strong class="text-slate-800 dark:text-slate-200">POC untuk pengembangan</strong>,
          bukan layanan produksi. Angka &amp; status di bawah ini sengaja ditulis apa adanya supaya
          jadi bahan diskusi, bukan klaim siap pakai.
        </p>

        <!-- ringkasan angka -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
            <p class="text-lg font-black text-emerald-500 leading-none">{{ WIDGETS.length }}</p>
            <p class="text-[10.5px] text-slate-500 mt-1 leading-tight">widget siap di-embed</p>
          </div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 px-3 py-2">
            <p class="text-lg font-black text-slate-500 leading-none">{{ SOON.length }}</p>
            <p class="text-[10.5px] text-slate-500 mt-1 leading-tight">belum dikerjakan</p>
          </div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 px-3 py-2">
            <p class="text-lg font-black text-slate-500 leading-none">{{ NEEDS_CLICK.length }}</p>
            <p class="text-[10.5px] text-slate-500 mt-1 leading-tight">butuh klik pengunjung</p>
          </div>
          <div class="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2">
            <p class="text-lg font-black text-amber-500 leading-none">2</p>
            <p class="text-[10.5px] text-slate-500 mt-1 leading-tight">widget selalu MOCK</p>
          </div>
        </div>

        <!-- asal data: seberapa resmi isinya -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 space-y-2.5">
          <h4 class="text-xs font-black flex items-center gap-1.5">
            <Database class="w-3.5 h-3.5 text-brand-cyan" /> Asal data — seberapa resmi isinya
          </h4>
          <p class="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Keterbatasan terbesar fitur ini bukan di tampilan, tapi di <strong class="text-slate-800 dark:text-slate-200">akses data</strong>.
            Sebagian API BMKG menutup CORS dan mewajibkan header khusus, sehingga harus dilewatkan
            proxy sendiri; sebagian lagi tidak punya API sama sekali.
          </p>
          <div class="space-y-2">
            <div
              v-for="d in DATA_SOURCES"
              :key="d.label"
              class="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 px-3 py-2"
            >
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  :class="['w-1.5 h-1.5 rounded-full shrink-0',
                    d.tone === 'ok' ? 'bg-emerald-500' : d.tone === 'warn' ? 'bg-amber-500' : 'bg-rose-500']"
                ></span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ d.label }}</p>
                <code class="text-[10px] font-mono text-slate-500 dark:text-slate-500">{{ d.where }}</code>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">{{ d.detail }}</p>
              <p class="text-[10.5px] text-slate-500 mt-1">
                <span class="font-bold">Dipakai:</span> {{ d.widgets }}
              </p>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 leading-relaxed pt-1">
            Konsekuensinya: perubahan kecil di sisi BMKG (header, struktur halaman, CORS) bisa
            mematikan widget tanpa peringatan. Tidak ada kontrak/SLA yang bisa dipegang.
          </p>
        </div>

        <!-- belum dikerjakan -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 space-y-2">
          <h4 class="text-xs font-black flex items-center gap-1.5">
            <Construction class="w-3.5 h-3.5 text-slate-400" /> Belum siap ({{ SOON.length }})
          </h4>
          <p class="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Bisa dibuat, tapi belum dikerjakan — bukan karena teknis mustahil.
          </p>
          <div class="grid sm:grid-cols-2 gap-2 pt-1">
            <div
              v-for="s in SOON"
              :key="s.name"
              class="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 px-3 py-2"
            >
              <p class="text-sm font-bold text-slate-800 dark:text-slate-300">{{ s.name }}</p>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">{{ s.reason }}</p>
            </div>
          </div>
        </div>

        <!-- butuh klik pengunjung -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 space-y-2">
          <h4 class="text-xs font-black flex items-center gap-1.5">
            <MousePointerClick class="w-3.5 h-3.5 text-slate-400" /> Butuh klik pengunjung ({{ NEEDS_CLICK.length }})
          </h4>
          <p class="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Ini <strong class="text-slate-800 dark:text-slate-200">tidak akan pernah</strong> jadi widget embed.
            Semuanya berupa drawer/modal: butuh pengunjung membuka panel dan memilih sesuatu.
            Dibekukan di dalam iframe, hasilnya kotak kosong tanpa jalan masuk.
          </p>
          <div class="grid sm:grid-cols-2 gap-2 pt-1">
            <div
              v-for="s in NEEDS_CLICK"
              :key="s.name"
              class="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20 px-3 py-2"
            >
              <p class="text-sm font-bold text-slate-800 dark:text-slate-300">{{ s.name }}</p>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">{{ s.reason }}</p>
            </div>
          </div>
        </div>

        <!-- yang dibutuhkan agar bisa naik ke produksi -->
        <div class="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-2">
          <h4 class="text-xs font-black flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <ListChecks class="w-3.5 h-3.5" /> Yang dibutuhkan sebelum naik ke produksi
          </h4>
          <ul class="text-[11.5px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
            <li><strong class="text-slate-800 dark:text-slate-200">Akses API resmi + dokumentasi + sample data</strong> — sekarang semuanya diakali lewat proxy dan scraping, tanpa kontrak tertulis.</li>
            <li><strong class="text-slate-800 dark:text-slate-200">Kebijakan token per partner</strong> — saat ini semua partner memakai satu <code class="font-mono text-[10px]">client_id</code>, jadi tidak ada rate-limit maupun audit per partner.</li>
            <li><strong class="text-slate-800 dark:text-slate-200">Pendaftaran IP/domain partner</strong> — supaya widget bisa dibatasi hanya untuk pemasang resmi, bukan ditempel di situs mana pun.</li>
            <li><strong class="text-slate-800 dark:text-slate-200">Token di header/cookie, bukan URL</strong> — URL bocor lewat log akses, <code class="font-mono text-[10px]">Referer</code>, dan riwayat browser.</li>
            <li><strong class="text-slate-800 dark:text-slate-200">Pemantauan kegagalan upstream</strong> — tanpa ini, widget yang mati tidak ketahuan sampai ada pengunjung yang mengeluh.</li>
            <li><strong class="text-slate-800 dark:text-slate-200">Kejelasan soal data MOCK</strong> — instansi yang memasang perlu tahu bahwa ISPU/transportasi bukan data resmi BMKG.</li>
          </ul>
        </div>
      </section>

      <!-- Integrasi framework -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 space-y-3">
        <h3 class="text-xs font-black flex items-center gap-1.5">
          <Code2 class="w-4 h-4 text-brand-cyan" /> Integrasi framework
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Widget berupa HTML biasa, jadi berjalan di semua framework. Tempel di dalam
          template komponen Anda:
        </p>
        <div class="grid sm:grid-cols-2 gap-2.5">
          <div>
            <p class="text-[11px] font-bold text-slate-500 mb-1">Vue</p>
            <pre class="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 overflow-x-auto text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-300 font-mono"><code>&lt;!-- App.vue --&gt;
&lt;div data-bmkg-widget="satellite"&gt;&lt;/div&gt;

&lt;script setup&gt;
onMounted(() =&gt; {
  const s = document.createElement('script')
  s.src = '{{ origin }}/embed.js'
  s.async = true
  document.body.appendChild(s)
})
&lt;/script&gt;</code></pre>
          </div>
          <div>
            <p class="text-[11px] font-bold text-slate-500 mb-1">React</p>
            <pre class="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 overflow-x-auto text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-300 font-mono"><code>useEffect(() =&gt; {
  const s = document.createElement('script')
  s.src = '{{ origin }}/embed.js'
  s.async = true
  document.body.appendChild(s)
}, [])

return &lt;div data-bmkg-widget="satellite" /&gt;</code></pre>
          </div>
          <div>
            <p class="text-[11px] font-bold text-slate-500 mb-1">Angular</p>
            <pre class="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 overflow-x-auto text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-300 font-mono"><code>&lt;!-- app.component.html --&gt;
&lt;div data-bmkg-widget="satellite"&gt;&lt;/div&gt;

// app.component.ts
ngAfterViewInit() {
  const s = document.createElement('script')
  s.src = '{{ origin }}/embed.js'
  s.async = true
  document.body.appendChild(s)
}</code></pre>
          </div>
          <div>
            <p class="text-[11px] font-bold text-slate-500 mb-1">WordPress / HTML statis</p>
            <pre class="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/60 rounded-lg p-2.5 overflow-x-auto text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-300 font-mono"><code>Tempel sebagai blok "HTML Kustom":

&lt;div data-bmkg-widget="satellite"&gt;&lt;/div&gt;
&lt;script async src="{{ origin }}/embed.js"&gt;&lt;/script&gt;</code></pre>
          </div>
        </div>
        <p class="text-[12px] text-slate-500 leading-relaxed">
          Konten yang dimuat dinamis (SPA) cukup memanggil
          <code class="px-1 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono text-[11px]">window.BMKGWidgets.scan()</code> setelah render.
        </p>
      </section>

      <!-- FAQ singkat -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 space-y-2.5">
        <h3 class="text-[13px] font-black">Pertanyaan umum</h3>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Apakah tampilan bisa disesuaikan dengan desain website kami?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Widget tampil dengan gaya visual BMKG. Penyesuaian warna mengikuti tema situs tidak tersedia pada versi ini.</p>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Apakah perlu API key atau pendaftaran?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Pada versi POC ini: tidak. Widget meminta token sendiri ke server BMKG (Keycloak), jadi pengunjung tidak melihat apa pun. Untuk integrasi resmi ke depan, partner perlu terdaftar dan IP/domain-nya didaftarkan manual.</p>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Apakah widget bisa dipakai di React / WordPress / lainnya?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Bisa. Widget berupa HTML biasa — berjalan di semua framework, CMS, maupun HTML statis.</p>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Berapa ukuran widget?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Lebar mengikuti container Anda (100%). Tinggi menyesuaikan otomatis, atau bisa diatur lewat atribut <code class="px-1 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono text-[11px]">data-height</code>.</p>
        </div>
      </section>

      <footer class="text-center text-[11px] text-slate-400 dark:text-slate-600 pb-6">
        Badan Meteorologi, Klimatologi, dan Geofisika —
        <span class="text-slate-500">Widget versi 1 · {{ origin }}</span>
      </footer>
    </main>
  </div>
</template>

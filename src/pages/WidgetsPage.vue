<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getToken, decodeJwt, verifyOnServer } from '../services/embedToken';
import { Copy, Check, Code2, Eye, Globe, ExternalLink, ShieldCheck, Layers, MapPin, Activity, Moon, Sun, AlertTriangle, FlaskConical, Database, ListChecks, KeyRound, Lock, ArrowUp } from 'lucide-vue-next';

// Tema dark/light — pola sama dengan app utama (class 'dark' di <html>, kunci localStorage)
const isDark = ref(true);
const applyTheme = (dark: boolean) => {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('bmkg-widget-theme', dark ? 'dark' : 'light');
};
onMounted(() => applyTheme(localStorage.getItem('bmkg-widget-theme') !== 'light'));

// ── Token akses (SIMULASI SISI PARTNER) ────────────────────────────────────
// Halaman ini sengaja TIDAK meminta token otomatis: partner yang harus minta
// sendiri. Tombol di bawah mensimulasikan backend partner yang menukar
// client_credentials ke Keycloak lalu menyerahkan token ke halamannya.
// Di produksi, token dibuat backend partner (client_secret di .env mereka),
// tidak pernah di browser.
const gen = ref({ loading: false, token: '', at: 0 });
const genError = ref('');
const verdict = ref<{ valid: boolean; reason: string | null; roles: string[] } | null>(null);
const now = ref(Date.now());
let ticker: number | undefined;

const decoded = computed(() => (gen.value.token ? decodeJwt(gen.value.token) : null));
const left = computed(() => {
  const exp = decoded.value?.claims?.exp;
  return typeof exp === 'number' ? Math.max(0, exp - Math.floor(now.value / 1000)) : 0;
});
const hasToken = computed(() => !!gen.value.token && left.value > 0);

/**
 * Ambil token. `keep` = pertahankan token lama saat mint gagal (dipakai
 * auto-refresh: token yang masih hidup lebih baik daripada kosong).
 */
async function fetchToken(keep = false) {
  gen.value = { ...gen.value, loading: true };
  genError.value = '';
  if (!keep) {
    gen.value = { loading: true, token: '', at: 0 };
    verdict.value = null;
  }
  try {
    const token = await getToken(true);
    gen.value = { loading: false, token, at: Date.now() };
    verdict.value = await verifyOnServer(token);
    window.clearInterval(ticker);
    ticker = window.setInterval(() => { now.value = Date.now(); }, 1000);
  } catch (e) {
    genError.value = String(e instanceof Error ? e.message : e).slice(0, 160);
    gen.value = { ...gen.value, loading: false };
    if (!keep) {
      gen.value = { loading: false, token: '', at: 0 };
      verdict.value = null;
    }
  }
}
const generateToken = () => fetchToken();

// Auto-refresh: setelah tombol Generate ditekan pertama kali, token diperbarui
// sendiri 60 detik sebelum habis, sampai halaman ditinggalkan. Kalau mint gagal,
// token lama tetap dipakai (jangan sampai preview mati gara-gara jaringan).
const REFRESH_BEFORE = 60;
let refreshing = false;
const canAutoRefresh = computed(() => !!gen.value.token);
watch([left, canAutoRefresh], async ([sisa, ada]) => {
  if (!ada || refreshing || sisa === 0 || sisa > REFRESH_BEFORE) return;
  refreshing = true;
  await fetchToken(true);
  refreshing = false;
});

// Token diperbarui → teruskan ke iframe yang sudah tampil. Tanpa ini iframe
// tetap memakai token lama sampai di-reload, padahal justru itu yang mau dicegah.
watch(() => gen.value.token, (token) => {
  if (!token) return;
  document.querySelectorAll<HTMLIFrameElement>('iframe[data-embed-preview]').forEach((f) => {
    f.contentWindow?.postMessage({ type: 'bmkg-embed-token', token }, '*');
  });
});

onUnmounted(() => {
  window.clearInterval(ticker);
  window.removeEventListener('message', onWidgetMessage);
});

// Serahkan token ke iframe lewat postMessage (bukan URL) — handshake:
// iframe kirim 'bmkg-embed-ready', kita balas 'bmkg-embed-token'.
function passToken(ev: Event) {
  const frame = ev.target as HTMLIFrameElement;
  if (!hasToken.value || !frame.contentWindow) return;
  frame.contentWindow.postMessage({ type: 'bmkg-embed-token', token: gen.value.token }, '*');
}
function onWidgetMessage(ev: MessageEvent) {
  const d = ev.data as { type?: string } | null;
  if (d?.type !== 'bmkg-embed-ready' || !hasToken.value) return;
  (ev.source as Window | null)?.postMessage({ type: 'bmkg-embed-token', token: gen.value.token }, '*');
}
onMounted(() => window.addEventListener('message', onWidgetMessage));

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

/** Widget yang tidak punya sumber data resmi — selalu berlabel MOCK. */
const alwaysMock = computed(() => WIDGETS.filter(w => !w.live));

const WIDGETS: Widget[] = [
  // ── Urutan mengikuti render dashboard (MainDashboard.vue), atas → bawah ──
  {
    id: 'alerts',
    name: 'Peringatan Dini Cuaca',
    desc: 'Peringatan cuaca ekstrem resmi BMKG untuk wilayah terpilih (nowcast + warning + siklon tropis).',
    city: true,
    height: 340,
    live: true
  },
  {
    id: 'current',
    name: 'Kondisi Cuaca Saat Ini',
    desc: 'Kartu utama: suhu, kondisi langit, suhu terasa, min/max harian, angin, kelembapan. Termasuk tombol Lapor Cuaca.',
    city: true,
    height: 520,
    live: true
  },
  {
    id: 'search',
    name: 'Pencarian Lokasi',
    desc: 'Kolom pencarian desa/kelurahan dari API BMKG. Pilihan pengunjung memindahkan semua widget di halaman pemasang.',
    height: 120,
    live: true
  },
  {
    id: 'major-cities',
    name: 'Kota-Kota Besar',
    desc: 'Kartu 10 kota besar Indonesia dengan landmark. Statis — tidak memuat data apa pun.',
    height: 400,
    live: false
  },
  {
    id: 'current-detail',
    name: 'Rincian Kondisi Cuaca',
    desc: 'Grid rincian: suhu, angin, arah angin, kelembapan, visibilitas, tekanan, dan titik embun.',
    city: true,
    height: 420,
    live: true
  },
  {
    id: 'forecast',
    name: 'Prakiraan Cuaca Per Jam',
    desc: 'Prakiraan per jam BMKG sampai beberapa hari, lengkap dengan grafik suhu.',
    city: true,
    height: 540,
    live: true
  },
  {
    id: 'satellite',
    name: 'Citra Satelit Himawari-9',
    desc: 'Peta satelit interaktif: 8 parameter channel, 18 frame (3 jam terakhir), kontrol animasi. Data langsung dari API BMKG.',
    height: 420,
    live: true
  },
  {
    id: 'marine',
    name: 'Peta Meteorologi Maritim',
    desc: 'Peta perairan Indonesia dengan prakiraan gelombang dan angin dari BMKG (INAWAVES / Open Data).',
    city: true,
    height: 600,
    live: true
  },
  {
    id: 'radar',
    name: 'Radar & Dinamika Atmosfer',
    desc: 'Peta animasi lapisan radar, satelit, dan angin dengan kontrol waktu, ketinggian, dan model.',
    city: true,
    height: 700,
    live: false,
    mockFallback: 'Medan angin & suhu dihitung sintetis di browser dari jangkar kota. Ini BUKAN produk radar BMKG — widget selalu berlabel MOCK.'
  },
  {
    id: 'earthquake',
    name: 'Gempa Bumi Terkini',
    desc: 'Gempa terbaru dari TEWS BMKG + peta lokasi. Menampilkan gempa terdekat dari kota yang dipilih.',
    city: true,
    height: 520,
    live: true
  },
  // ── Section aktivitas dipecah per kartu (dashboard: satu kolom berisi 4 kartu) ──
  {
    id: 'activity',
    name: 'Aktivitas & Rekomendasi (semua)',
    desc: 'Seluruh section seperti di dashboard: indeks kenyamanan, ringkasan kualitas udara, plus kartu darat, pesisir, pelayaran, penerbangan.',
    city: true,
    height: 620,
    live: true,
    mockFallback: 'Angka suhu/angin/kelembapan live dari BMKG. Narasi saran dihitung dari angka itu dengan aturan kami sendiri — bukan produk resmi BMKG.'
  },
  {
    id: 'activity-land',
    name: 'Aktivitas Darat',
    desc: 'Satu kartu: kesiapan aktivitas darat (jalan kaki, bersepeda, berkendara) beserta saran pakaian.',
    city: true,
    height: 320,
    live: true,
    mockFallback: 'Narasi saran dihitung dari angka cuaca live memakai aturan kami sendiri.'
  },
  {
    id: 'activity-coastal',
    name: 'Aktivitas Pesisir & Laut',
    desc: 'Satu kartu: tinggi gelombang, kecepatan angin, dan kesiapan aktivitas pesisir.',
    city: true,
    height: 320,
    live: true,
    mockFallback: 'Narasi saran dihitung dari angka cuaca live memakai aturan kami sendiri.'
  },
  {
    id: 'activity-shipping',
    name: 'Aktivitas Pelayaran',
    desc: 'Satu kartu: ringkasan kondisi pelayaran — gelombang, angin, dan peringatan perairan.',
    city: true,
    height: 320,
    live: true,
    mockFallback: 'Narasi saran dihitung dari angka cuaca live memakai aturan kami sendiri.'
  },
  {
    id: 'activity-aviation',
    name: 'Aktivitas Penerbangan',
    desc: 'Satu kartu: ringkasan kondisi penerbangan — visibilitas, angin, dan awan di bandara terdekat.',
    city: true,
    height: 320,
    live: true,
    mockFallback: 'Narasi saran dihitung dari angka cuaca live memakai aturan kami sendiri.'
  },
  {
    id: 'transport',
    name: 'Transportasi & Rute',
    desc: 'Status jalan raya, kereta, dan maritim untuk kota terpilih.',
    city: true,
    height: 360,
    live: false,
    mockFallback: 'BMKG tidak menerbitkan status transportasi lewat API publik. Angka & label dihitung dari cuaca kota, bukan pengumuman resmi operator.'
  },
  {
    id: 'port-tide',
    name: 'Pasang Surut Pelabuhan',
    desc: 'Pasang surut pelabuhan terdekat dari BMKG Open Data, lengkap dengan grafik ketinggian.',
    city: true,
    height: 380,
    live: true
  },
  {
    id: 'wave',
    name: 'Radar Tinggi Gelombang',
    desc: 'Peta zona gelombang BMKG dengan tinggi dan kategori per perairan.',
    city: true,
    height: 480,
    live: true
  },
  // ── Widget hasil pecahan drawer/modal: di dashboard baru muncul setelah klik ──
  {
    id: 'maritime-advisor',
    name: 'Saran Maritim',
    desc: 'Saran keselamatan pelayaran per sektor (pelayaran, perikanan, migas, wisata, publik) beserta SOP dan kontak mitigasi.',
    city: true,
    height: 640,
    live: true,
    mockFallback: 'Widget tidak punya jalur untuk mengoper pilihan sektor dari halaman pemasang, jadi selalu memakai sektor default (shipping).'
  },
  {
    id: 'aviation-advisor',
    name: 'Saran Penerbangan',
    desc: 'Saran operasi penerbangan per sektor (komersial, kargo, SIGMET, PIREP) untuk bandara terdekat.',
    city: true,
    height: 640,
    live: true,
    mockFallback: 'Sektor default: commercial. Pilihan sektor oleh pengunjung belum bisa dioper dari halaman pemasang.'
  },
  {
    id: 'land-activity',
    name: 'Aktivitas Darat & Rute',
    desc: 'Peta rute menuju destinasi, transportasi publik terdekat, dan kondisi cuaca di sepanjang perjalanan.',
    city: true,
    height: 640,
    live: false,
    mockFallback: 'Tujuan perjalanan masih contoh tetap (dekat kota terpilih) — partner belum bisa mengoper destinasi sendiri.'
  },
  {
    id: 'around',
    name: 'Detail Aktivitas Sekitar',
    desc: 'Detail satu aktivitas di sekitar kota: peta lokasi, indeks kenyamanan, dan prakiraan 4 jam ke depan.',
    city: true,
    height: 640,
    live: false,
    mockFallback: 'Aktivitas yang ditampilkan adalah contoh (taman kota). Di dashboard, kartu ini terbuka dari klik pengunjung.'
  },
  {
    id: 'report',
    name: 'Lapor Cuaca',
    desc: 'Formulir laporan kondisi cuaca oleh pengunjung: kondisi umum, rasa suhu, kondisi tambahan, dan riwayat laporan.',
    city: true,
    height: 700,
    live: false,
    mockFallback: 'Laporan tidak dikirim ke server mana pun — murni demo interaksi. Riwayat awal berisi dua contoh.'
  }
];


// Kartu dashboard yang BELUM siap di-embed — ditampilkan jujur, bukan disembunyikan
// Sengaja TIDAK dijadikan widget: isinya drawer interaktif / bergantung preferensi
// pengguna, jadi tidak masuk akal dibekukan di dalam iframe.
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

const TOKEN_PLACEHOLDER = 'TOKEN_KEYCLOAK_ANDA';

// Setup sekali per halaman: loader + token. Tanpa dua baris ini, tag div
// widget mana pun di bawah tidak akan melakukan apa pun.
const SETUP_SNIPPET = computed(() => {
  const close = '</' + 'script>';
  return `<script src="${origin}/bmkg-embed.js">${close}
<script>
  // token dari backend Anda sendiri (client_secret TIDAK boleh di browser)
  BmkgWidget.init({ token: '${TOKEN_PLACEHOLDER}' });
${close}`;
});

function snippet(w: Widget) {
  const cityAttr = w.city ? ` data-city="${selCity.value}"` : '';
  const hAttr = w.city ? '' : ` data-height="${w.height}"`;
  if (mode.value === 'script') {
    // Loader + token sudah dipasang di bagian "Setup awal" — cukup tag ini.
    return `<div data-bmkg-widget="${w.id}"${cityAttr}${hAttr}></div>`;
  }
  const cityQ = w.city ? `&city=${encodeURIComponent(selCity.value)}` : '';
  return `<iframe\n  src="${origin}/embed.html?widget=${w.id}${cityQ}&token=${TOKEN_PLACEHOLDER}&theme=${isDark.value ? 'dark' : 'light'}"\n  width="100%" height="${w.height}"\n  style="border:0;border-radius:12px"\n  title="BMKG ${w.name}"\n  loading="lazy"\n></iframe>`;
}

function jumpTo(id: string) {
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          Pilih widget, salin kodenya, tempel di website Anda. Satu hal yang wajib: <strong>token
          Keycloak yang sah</strong> — tanpa itu widget menolak tampil. Widget terisolasi penuh dari
          CSS website Anda (iframe), jadi tidak ada tabrakan gaya.
        </p>
        <p class="mt-2 inline-flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-md px-2.5 py-1.5">
          <FlaskConical class="w-3 h-3 shrink-0 mt-0.5" />
          <span><strong class="font-bold">Versi POC (proof of concept).</strong>
          Dibuat untuk keperluan pengembangan internal, <strong class="font-bold">belum untuk konsumsi publik</strong>.
          Lihat bagian <em>Status &amp; batasan</em> di bawah.</span>
        </p>
        <!-- ═══ TOKEN AKSES — simulasi sisi partner ═══════════════════════════
             Tidak auto-generate: partner yang harus minta token. Tombol ini
             mensimulasikan backend partner (client_credentials ke Keycloak). -->
        <div class="mt-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-3.5">
          <div class="flex items-start gap-2 flex-wrap">
            <div class="flex-1 min-w-0">
              <h3 class="text-xs font-black flex items-center gap-1.5">
                <KeyRound class="w-3.5 h-3.5 text-brand-cyan" /> Token akses widget
                <span class="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-400/20">SIMULASI PARTNER</span>
              </h3>
              <p class="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Tanpa token sah, <code class="font-mono text-[10.5px]">/api/embed-js</code> dan <code class="font-mono text-[10.5px]">/api/bmkg</code> menolak (401).
                Di produksi, token dibuat <strong>backend partner sendiri</strong> — <code class="font-mono text-[10.5px]">client_secret</code> ada di <code class="font-mono text-[10.5px]">.env</code> server mereka, lalu diverifikasi dengan JWKS realm ini.
              </p>
            </div>
            <button
              @click="generateToken"
              :disabled="gen.loading"
              class="shrink-0 text-[11px] font-black px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
              :class="hasToken ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700' : 'bg-brand-cyan text-slate-950 hover:brightness-110'"
            >
              <KeyRound class="w-3 h-3" />
              {{ gen.loading ? 'Meminta…' : hasToken ? 'Generate ulang' : 'Generate token' }}
            </button>
          </div>

          <!-- Hasil: token + decode + verdict server -->
          <div v-if="gen.token" class="mt-3 space-y-2">
            <div class="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-2">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-black tracking-wider text-slate-500">ACCESS TOKEN (JWT)</span>
                <button @click="copy(gen.token, 'jwt')" class="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-brand-cyan">
                  {{ copied === 'jwt' ? 'tersalin' : 'salin' }}
                </button>
              </div>
              <p class="font-mono text-[10px] leading-relaxed break-all max-h-16 overflow-y-auto text-emerald-700 dark:text-emerald-300">{{ gen.token }}</p>
            </div>

            <!-- Decode (bukan verifikasi) + hitung mundur -->
            <div class="grid sm:grid-cols-2 gap-2">
              <div class="rounded-md border border-slate-200 dark:border-slate-800 p-2 space-y-0.5">
                <p class="text-[10px] font-black tracking-wider text-slate-500 mb-1">ISI TOKEN (decode saja)</p>
                <p class="text-[11px] text-slate-600 dark:text-slate-400"><span class="font-bold text-slate-800 dark:text-slate-200">alg</span> {{ decoded?.header?.alg }}</p>
                <p class="text-[11px] text-slate-600 dark:text-slate-400"><span class="font-bold text-slate-800 dark:text-slate-200">azp</span> {{ decoded?.claims?.azp }}</p>
                <p class="text-[11px] text-slate-600 dark:text-slate-400"><span class="font-bold text-slate-800 dark:text-slate-200">iss</span> realm bmkg-partner</p>
                <p class="text-[11px] text-slate-600 dark:text-slate-400"><span class="font-bold text-slate-800 dark:text-slate-200">exp</span> {{ decoded?.claims?.exp ? new Date(decoded.claims.exp * 1000).toLocaleTimeString('id-ID') : '—' }}</p>
                <p class="text-[11px] text-slate-600 dark:text-slate-400"><span class="font-bold text-slate-800 dark:text-slate-200">roles</span> {{ (decoded?.claims?.realm_access?.roles || []).join(', ') || '—' }}</p>
              </div>

              <!-- Indikator sah/tidak: decode + verifikasi tanda tangan server -->
              <div class="rounded-md border p-2 space-y-1"
                :class="verdict?.valid && left > 0 ? 'border-emerald-500/35 bg-emerald-500/8' : 'border-rose-500/35 bg-rose-500/8'">
                <p class="text-[10px] font-black tracking-wider text-slate-500">STATUS</p>
                <p class="text-[12px] font-black flex items-center gap-1.5"
                  :class="verdict?.valid && left > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                  <ShieldCheck v-if="verdict?.valid && left > 0" class="w-3.5 h-3.5" />
                  <AlertTriangle v-else class="w-3.5 h-3.5" />
                  {{ verdict?.valid ? (left > 0 ? 'VALID' : 'KEDALUWARSA') : 'DITOLAK' }}
                  <span class="font-mono text-[11px] font-bold opacity-80">{{ left }}s</span>
                </p>
                <p class="text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
                  <span class="font-bold">Tanda tangan (JWKS server):</span>
                  {{ verdict?.valid ? 'cocok' : verdict?.reason || 'gagal' }}
                </p>
                <p class="text-[10.5px] leading-snug text-slate-500">
                  Decode di browser hanya tampilan — yang menentukan sah/tidak adalah verifikasi tanda tangan di server.
                </p>
              </div>
            </div>

            <p class="text-[10.5px] text-slate-500 leading-snug">
              Token yang sama dipakai preview di bawah (dikirim lewat
              <code class="font-mono">postMessage</code>, tidak lewat URL). Berlaku {{ decoded?.claims?.exp && decoded?.claims?.iat ? (decoded.claims.exp - decoded.claims.iat) : '±300' }} detik.
            </p>
          </div>

          <p v-if="genError" class="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-mono leading-snug">
            {{ genError }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 mt-3">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck class="w-2.5 h-2.5" /> Token wajib
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Code2 class="w-2.5 h-2.5" /> 1 baris kode
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe class="w-2.5 h-2.5" /> Cocok semua framework
          </span>
        </div>
      </section>

      <!-- ═══ 1. SETUP AWAL — wajib, sekali per halaman ═══════════════════ -->
      <section id="setup" class="rounded-xl border border-brand-cyan/35 bg-white dark:bg-slate-900/40 overflow-hidden scroll-mt-20">
        <div class="px-4 py-3 flex items-start gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800/60">
          <div class="flex-1 min-w-0">
            <h3 class="text-[13px] font-black flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-brand-cyan text-slate-950 text-[11px] font-black flex items-center justify-center shrink-0">1</span>
              Setup awal — pasang sekali, sebelum widget apa pun
            </h3>
            <p class="text-[12px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
              Dua tag di bawah adalah <strong class="text-slate-800 dark:text-slate-200">syarat semua widget</strong>:
              mengambil loader lalu menyerahkan token. Tanpa keduanya, tag div widget di bagian
              berikutnya tidak melakukan apa pun. Tempel sebelum <code class="font-mono text-[11px]">&lt;/body&gt;</code>.
            </p>
          </div>
          <button
            @click="copy(SETUP_SNIPPET, 'setup')"
            class="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
            :class="copied === 'setup' ? 'bg-emerald-500 text-white' : 'bg-brand-cyan text-slate-950 hover:brightness-110'"
          >
            <component :is="copied === 'setup' ? Check : Copy" class="w-3 h-3" />
            {{ copied === 'setup' ? 'Tersalin' : 'Copy setup' }}
          </button>
        </div>

        <div class="bg-slate-50 dark:bg-[#0b1220]">
          <pre class="p-4 overflow-x-auto text-[11.5px] leading-relaxed text-slate-800 dark:text-slate-100 font-mono whitespace-pre"><code>{{ SETUP_SNIPPET }}</code></pre>
        </div>

        <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800/60 border-t border-slate-200 dark:border-slate-800/60">
          <div class="px-3.5 py-2.5">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Token dari backend Anda</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              <code class="font-mono">client_credentials</code> ke realm BMKG. <code class="font-mono">client_secret</code>
              tidak boleh ada di browser.
            </p>
          </div>
          <div class="px-3.5 py-2.5">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Cukup sekali</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Mau 1 widget atau 10, setup ini tetap satu kali. Token diperbarui loader sendiri.
            </p>
          </div>
          <div class="px-3.5 py-2.5">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Urutan penting</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Setup dulu, baru tag div. Kalau dibalik, widget tidak terpasang.
            </p>
          </div>
        </div>
      </section>

      <!-- ═══ 2. SEMATKAN WIDGET ══════════════════════════════════════════ -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 px-4 py-3 flex items-center gap-2 flex-wrap">
        <h3 class="text-[13px] font-black flex items-center gap-2 mr-auto">
          <span class="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-black flex items-center justify-center shrink-0">2</span>
          Sematkan widget
        </h3>
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
        >iframe manual (token di URL)</button>
        <p class="text-[11px] text-slate-500 dark:text-slate-500 ml-auto max-w-md leading-relaxed">
          Mode <strong class="text-slate-800 dark:text-slate-300">script</strong>: loader mengambil script inti dengan header
          <code class="font-mono">Authorization</code>, lalu memasang iframe dan mengirim token lewat
          <code class="font-mono">postMessage</code> (token tidak muncul di URL).
          Mode <strong class="text-slate-800 dark:text-slate-300">iframe</strong> tanpa JS: token terpaksa ditaruh di URL
          — <span class="text-amber-600 dark:text-amber-400 font-bold">tertinggal di log &amp; Referer</span>, pakai hanya untuk uji cepat.
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
          :id="`widget-${w.id}`"
          :key="w.id"
          class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 overflow-hidden scroll-mt-20"
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

          <!-- Kode sematkan — full width, karena potongannya pendek -->
          <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60">
            <p class="text-[11px] font-bold tracking-wider text-slate-500 mb-1.5">
              KODE SEMATKAN
              <span class="font-normal normal-case tracking-normal text-slate-400">— setelah setup di bagian 1</span>
            </p>
            <div class="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#0b1220]">
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
              <pre class="px-3 py-2.5 overflow-x-auto text-[11.5px] leading-relaxed text-slate-800 dark:text-slate-100 font-mono whitespace-pre"><code>{{ snippet(w) }}</code></pre>
            </div>
          </div>

          <!-- Preview live — full width di bawah kode -->
          <div class="p-4 bg-slate-50 dark:bg-slate-950/30">
            <p class="text-[11px] font-bold tracking-wider text-slate-500 mb-1.5">PREVIEW LANGSUNG</p>
            <iframe
              v-if="hasToken"
              :key="`${w.id}-${w.city ? selCity : ''}-${previewKey}-${isDark}`"
              :src="srcUrl(w)"
              :height="w.height"
              width="100%"
              style="border:0;border-radius:8px;display:block;background:#fff"
              :title="`Preview ${w.name}`"
              data-embed-preview
              loading="lazy"
              @load="passToken"
            ></iframe>
            <div
              v-else
              :style="{ height: `${Math.min(w.height, 260)}px` }"
              class="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 flex flex-col items-center justify-center gap-1.5 px-4 text-center"
            >
              <Lock class="w-4 h-4 text-slate-400" />
              <p class="text-[11.5px] font-bold text-slate-500">Preview terkunci</p>
              <p class="text-[10.5px] text-slate-500 leading-snug max-w-[320px]">
                Tekan <strong>Generate token</strong> di atas. Tanpa token sah, widget menolak tampil — sama seperti di website partner.
              </p>
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
          <div class="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2">
            <p class="text-lg font-black text-amber-500 leading-none">{{ alwaysMock.length }}</p>
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
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Ya — <strong class="text-slate-800 dark:text-slate-300">token Keycloak wajib</strong>. Pada POC ini token dibuat server BMKG sebagai simulasi; di produksi partner mendapat <code class="font-mono text-[11px]">client_id</code>/<code class="font-mono text-[11px]">client_secret</code> dari kami, menyimpannya di <code class="font-mono text-[11px]">.env</code> backend sendiri, lalu membuat token di sana. Warisan lama ("tempel script, langsung jalan" tanpa token) sudah dihapus.</p>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Apakah widget bisa dipakai di React / WordPress / lainnya?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Bisa. Widget berupa HTML biasa — berjalan di semua framework, CMS, maupun HTML statis.</p>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-300">Apa yang terjadi kalau token kedaluwarsa?</p>
          <p class="text-sm text-slate-600 dark:text-slate-500 leading-relaxed">Widget berhenti memuat dan menampilkan layar "Tidak diotorisasi". Token Keycloak berumur 300 detik, jadi backend partner harus memperbaruinya — jangan menempel token mati di HTML.</p>
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

    <!-- Navigasi cepat. Bulat: klik = ke atas. Hover/fokus = daftar widget untuk lompat. -->
    <div class="fixed bottom-5 right-5 z-40 group/rail">
      <!-- pb-2: jarak visual tombol<->panel, tapi area hover tetap menyambung -->
      <div
        class="absolute bottom-full right-0 pb-2 invisible opacity-0 translate-y-1 pointer-events-none group-hover/rail:visible group-hover/rail:opacity-100 group-hover/rail:translate-y-0 group-hover/rail:pointer-events-auto group-focus-within/rail:visible group-focus-within/rail:opacity-100 group-focus-within/rail:translate-y-0 group-focus-within/rail:pointer-events-auto transition-all duration-150"
      >
        <div class="w-60 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 p-1.5">
        <p class="px-2 pt-1 pb-1.5 text-[10px] font-black tracking-wider text-slate-500">LOMPAT KE WIDGET ({{ WIDGETS.length }})</p>
        <button
          v-for="w in WIDGETS"
          :key="`rail-${w.id}`"
          @click="jumpTo(`widget-${w.id}`)"
          class="w-full text-left px-2 py-1.5 rounded-md text-[11.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-cyan hover:text-slate-950 transition-colors truncate"
          :title="w.name"
        >{{ w.name }}</button>
        <button
          @click="jumpTo('setup')"
          class="w-full text-left px-2 py-1.5 mt-1 rounded-md text-[11.5px] font-bold text-brand-cyan hover:bg-brand-cyan hover:text-slate-950 transition-colors border-t border-slate-200 dark:border-slate-700 pt-2"
          >↑ Setup awal</button>
        </div>
      </div>
      <button
        @click="jumpTo('top')"
        class="w-11 h-11 rounded-full bg-brand-cyan text-slate-950 shadow-lg shadow-brand-cyan/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center"
        title="Kembali ke atas / daftar widget"
        aria-label="Kembali ke atas"
      >
        <ArrowUp class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

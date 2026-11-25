<script setup lang="ts">
// /api-docs — dokumentasi API gateway untuk partner & tim mobile.
// Digate login seperti /widgets: isinya materi internal.
//
// Satu hal yang halaman ini lakukan dan dokumen .md tidak bisa: menanyakan
// GET /api ke server, supaya kalau daftar endpoint di server berubah, di sini
// kelihatan selisihnya (bukan diam-diam basi).
import { ref, computed, onMounted } from 'vue';
import { Copy, Check, Sun, Moon, ExternalLink, KeyRound, AlertTriangle, FlaskConical, ShieldAlert } from 'lucide-vue-next';
import { getToken } from '../services/embedToken';
import { ENDPOINTS, GROUPS, type EndpointDoc } from './apiDocs.data';

const isDark = ref(true);
const applyTheme = (dark: boolean) => {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('bmkg-widget-theme', dark ? 'dark' : 'light');
};
onMounted(() => applyTheme(localStorage.getItem('bmkg-widget-theme') !== 'light'));

// Jangan tulis 'https://' + origin: origin sudah memuat skema, hasilnya
// https://http://localhost:5173 — contoh curl yang tidak bisa dijalankan.
const origin = window.location.origin;
const copied = ref('');
async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => { if (copied.value === key) copied.value = ''; }, 1800);
  } catch {
    /* clipboard ditolak browser — user bisa seleksi manual */
  }
}

// ── Token (simulasi backend partner, sama seperti /widgets) ─────────────────
const token = ref('');
const tokenError = ref('');
const loading = ref(false);
const tokenLeft = computed(() => {
  const exp = decodeExp(token.value);
  return exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 0;
});
function decodeExp(jwt: string): number {
  try {
    const claims = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.exp === 'number' ? claims.exp : 0;
  } catch {
    return 0;
  }
}
async function mint() {
  loading.value = true;
  tokenError.value = '';
  try {
    token.value = await getToken(true);
  } catch (e) {
    tokenError.value = String(e instanceof Error ? e.message : e).slice(0, 160);
  } finally {
    loading.value = false;
  }
}

// ── Selisih antara halaman & server ────────────────────────────────────────
// Kalau server punya endpoint yang tidak ada di halaman ini, tampilkan di atas:
// dokumentasi yang diam-diam basi lebih berbahaya daripada yang kosong.
const missingOnPage = ref<string[]>([]);
const catalogCount = ref(0);
onMounted(async () => {
  try {
    const res = await fetch('/api');
    const json = (await res.json()) as { endpoints?: Array<{ path: string }> };
    const list = json.endpoints ?? [];
    catalogCount.value = list.length;
    const known = new Set(ENDPOINTS.map((e) => e.path));
    missingOnPage.value = list.map((e) => e.path).filter((p) => !known.has(p));
  } catch {
    /* server tidak terjangkau — biarkan kosong, jangan blokir halaman */
  }
});

const filter = ref<'all' | EndpointDoc['group']>('all');
const shown = computed(() =>
  filter.value === 'all' ? ENDPOINTS : ENDPOINTS.filter((e) => e.group === filter.value),
);
const groupLabel = (id: EndpointDoc['group']) => GROUPS.find((g) => g.id === id)?.label ?? id;

function curlFor(e: EndpointDoc) {
  return e.sample.replace(/\$TOKEN/g, token.value || 'TOKEN_KEYCLOAK_ANDA').replace(/https:\/\/DOMAIN/g, origin);
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#070c19] text-slate-900 dark:text-white transition-colors">
    <header class="border-b border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-cyan to-blue-600 flex items-center justify-center shrink-0">
          <KeyRound class="w-4 h-4 text-slate-950" />
        </div>
        <div class="min-w-0">
          <h1 class="text-sm font-black leading-none">API BMKG — Dokumentasi</h1>
          <p class="text-sm text-slate-400 mt-0.5">Gateway cuaca dengan bentuk respons sendiri</p>
        </div>
        <button
          @click="applyTheme(!isDark)"
          class="ml-auto p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-cyan hover:text-brand-cyan transition-colors"
          :title="isDark ? 'Mode terang' : 'Mode gelap'"
        >
          <component :is="isDark ? Sun : Moon" class="w-4 h-4" />
        </button>
        <a href="/widgets" class="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-cyan transition-colors flex items-center gap-1">
          Dokumentasi widget <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-5 py-6 space-y-6">
      <!-- Intro -->
      <section>
        <h2 class="text-lg font-black">{{ ENDPOINTS.length }} endpoint, {{ GROUPS.length }} kelompok</h2>
        <p class="text-[13px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-3xl">
          Nama endpoint mengikuti <strong>isi responsnya</strong>, bukan nama asli BMKG.
          Di balik layar kita memanggil
          <code class="font-mono text-[11px]">api/df/v1/forecast/coord</code>,
          <code class="font-mono text-[11px]">api/presentwx/coord</code> dan sejenisnya —
          semua nama & bentuk field itu sudah diterjemahkan di sini.
        </p>

        <div class="mt-3 grid sm:grid-cols-3 gap-2">
          <div class="rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 px-3 py-2">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Satu gerbang auth</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Semua endpoint butuh <code class="font-mono">Authorization: Bearer</code> — token Keycloak, sama seperti widget.
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 px-3 py-2">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Tanpa data contoh</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Kalau BMKG gagal, jawabannya error. Mock hanya ada di widget/dashboard, tidak di lapisan API.
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 px-3 py-2">
            <p class="text-[11px] font-black text-slate-700 dark:text-slate-200">Katalog dari server</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              <code class="font-mono">GET /api</code> mengembalikan daftar endpoint ini dalam JSON — untuk mesin & AI.
            </p>
          </div>
        </div>

        <p class="mt-2 inline-flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-md px-2.5 py-1.5">
          <FlaskConical class="w-3 h-3 shrink-0 mt-0.5" />
          <span><strong class="font-bold">Versi POC.</strong>
          Token dibuat untuk pengembangan internal. Di produksi token datang dari backend partner, bukan halaman ini.</span>
        </p>
      </section>

      <!-- Peringatan: dokumentasi tidak sinkron -->
      <section
        v-if="missingOnPage.length"
        class="rounded-xl border border-rose-500/35 bg-rose-500/8 p-3.5"
      >
        <h3 class="text-xs font-black flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <ShieldAlert class="w-3.5 h-3.5" /> Halaman ini ketinggalan
        </h3>
        <p class="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
          Server punya {{ catalogCount }} endpoint, halaman ini menampilkan {{ ENDPOINTS.length }}.
          Belum didokumentasikan di sini:
        </p>
        <p class="font-mono text-[11px] text-rose-600 dark:text-rose-300 mt-1 break-all">{{ missingOnPage.join(', ') }}</p>
      </section>

      <!-- Token -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-3.5">
        <div class="flex items-start gap-2 flex-wrap">
          <div class="flex-1 min-w-0">
            <h3 class="text-xs font-black flex items-center gap-1.5">
              <KeyRound class="w-3.5 h-3.5 text-brand-cyan" /> Token untuk mencoba
              <span class="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-400/20">SIMULASI PARTNER</span>
            </h3>
            <p class="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Tekan tombol, lalu semua contoh <code class="font-mono text-[10.5px]">curl</code> di bawah
              otomatis memakai token itu. Tanpa token, semua endpoint menjawab
              <code class="font-mono text-[10.5px]">401</code>.
            </p>
          </div>
          <button
            @click="mint"
            :disabled="loading"
            class="shrink-0 text-[11px] font-black px-3 py-1.5 rounded-md bg-brand-cyan text-slate-950 hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
          >
            <KeyRound class="w-3 h-3" />
            {{ loading ? 'Meminta…' : token ? 'Generate ulang' : 'Generate token' }}
          </button>
        </div>
        <p v-if="token" class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
          Token aktif — sisa {{ tokenLeft }} detik
        </p>
        <p v-if="tokenError" class="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-mono">{{ tokenError }}</p>
      </section>

      <!-- Filter kelompok -->
      <section class="flex items-center gap-1.5 flex-wrap">
        <button
          @click="filter = 'all'"
          :class="['px-2.5 py-1 rounded-md text-[11.5px] font-bold border transition-colors',
            filter === 'all' ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400']"
        >semua ({{ ENDPOINTS.length }})</button>
        <button
          v-for="g in GROUPS"
          :key="g.id"
          @click="filter = g.id"
          :class="['px-2.5 py-1 rounded-md text-[11.5px] font-bold border transition-colors',
            filter === g.id ? 'bg-brand-cyan text-slate-950 border-brand-cyan' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400']"
          :title="g.desc"
        >{{ g.label }} ({{ ENDPOINTS.filter(e => e.group === g.id).length }})</button>
      </section>

      <!-- Daftar endpoint -->
      <section class="space-y-4">
        <article
          v-for="e in shown"
          :key="e.path"
          class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60">
            <div class="flex items-start gap-2 flex-wrap">
              <div class="flex-1 min-w-0">
                <p class="font-mono text-[12.5px] font-bold text-brand-cyan break-all">{{ e.path }}</p>
                <p class="text-[13px] font-black mt-1">{{ e.title }}</p>
                <p class="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{{ e.desc }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 border border-slate-400/20">{{ groupLabel(e.group) }}</span>
                <span v-if="e.auth" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">Bearer</span>
              </div>
            </div>
            <p v-if="e.query.length" class="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span class="font-bold">query:</span>
              <code v-for="q in e.query" :key="q" class="font-mono ml-1 px-1 rounded bg-slate-100 dark:bg-slate-800">{{ q }}</code>
            </p>
          </div>

          <p v-if="e.warn" class="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 bg-amber-500/8 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
            <AlertTriangle class="w-3 h-3 shrink-0 mt-0.5" /> <span>{{ e.warn }}</span>
          </p>

          <!-- Contoh panggil -->
          <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60">
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[11px] font-bold tracking-wider text-slate-500">CONTOH</p>
              <button
                @click="copy(curlFor(e), e.path)"
                class="text-[10px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                :class="copied === e.path ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-brand-cyan hover:text-brand-cyan'"
              >
                <component :is="copied === e.path ? Check : Copy" class="w-2.5 h-2.5" />
                {{ copied === e.path ? 'Copied' : 'Copy' }}
              </button>
            </div>
            <div class="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#0b1220]">
              <pre class="px-3 py-2.5 overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre text-slate-800 dark:text-slate-100"><code>{{ curlFor(e) }}</code></pre>
            </div>
          </div>

          <!-- Field & contoh respons -->
          <div class="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/60">
            <div class="px-4 py-3">
              <p class="text-[11px] font-bold tracking-wider text-slate-500 mb-1.5">FIELD</p>
              <div v-for="f in e.fields" :key="f.name" class="py-0.5 leading-snug">
                <code class="font-mono text-[11px] text-slate-800 dark:text-slate-200">{{ f.name }}</code>
                <span class="text-[10.5px] text-slate-500 dark:text-slate-400 ml-1">{{ f.type }}</span>
                <span v-if="f.note" class="text-[10.5px] text-slate-500 dark:text-slate-500 ml-1">— {{ f.note }}</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <p class="text-[11px] font-bold tracking-wider text-slate-500 mb-1.5">CONTOH RESPONS</p>
              <div class="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#0b1220]">
                <pre class="px-3 py-2.5 overflow-x-auto text-[10.5px] leading-relaxed font-mono whitespace-pre text-slate-800 dark:text-slate-100"><code>{{ e.sampleRes }}</code></pre>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Aturan yang tidak boleh dilanggar -->
      <section class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
        <h3 class="text-xs font-black flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <AlertTriangle class="w-3.5 h-3.5" /> Dua hal yang mudah disalahpahami
        </h3>
        <div class="space-y-2 text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            <strong class="font-bold">1. `precipitation` bukan peluang hujan.</strong>
            Nilainya 0–100 dari curah hujan (mm × 20, dibatasi 100). 2 mm menjadi 40.
            Kalau aplikasi menampilkannya sebagai "peluang hujan 40%", itu salah tafsir —
            sebut saja <em>intensitas hujan</em>.
          </p>
          <p>
            <strong class="font-bold">2. `derived` bukan data BMKG.</strong>
            <code class="font-mono">feelLike</code> adalah aproksimasi heat index;
            <code class="font-mono">uvIndex</code> hanya diturunkan dari tutupan awan
            (tanpa jam, tanpa lintang). Keduanya disimpan dalam objek
            <code class="font-mono">derived</code> justru supaya kelihatan bedanya.
            Jangan tampilkan sebagai data resmi.
          </p>
        </div>
      </section>

      <!-- Kode error -->
      <section class="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4">
        <h3 class="text-xs font-black mb-1.5">Bentuk error</h3>
        <p class="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Selalu <code class="font-mono text-[10.5px]">{ error, code, reason }</code> — jangan andalkan teks
          <code class="font-mono text-[10.5px]">error</code>, pakai <code class="font-mono text-[10.5px]">code</code>.
        </p>
        <div class="mt-2 grid sm:grid-cols-2 gap-1.5">
          <p class="text-[11px]"><code class="font-mono font-bold">UNAUTHORIZED</code> <span class="text-slate-500">401 — token tidak ada / tidak sah</span></p>
          <p class="text-[11px]"><code class="font-mono font-bold">BAD_REQUEST</code> <span class="text-slate-500">400 — lat/lon hilang atau bukan angka</span></p>
          <p class="text-[11px]"><code class="font-mono font-bold">UPSTREAM_ERROR</code> <span class="text-slate-500">502 — BMKG menolak / mati (bukan salah Anda)</span></p>
          <p class="text-[11px]"><code class="font-mono font-bold">NOT_FOUND</code> <span class="text-slate-500">404 — endpoint tidak ada</span></p>
        </div>
      </section>
    </main>
  </div>
</template>

// ═══════════════════════════════════════════════════════════════════════════
// API BOX MARKER — alat dev (BUKAN untuk publik)
// ---------------------------------------------------------------------------
// Cara kerja:
//  1. `window.fetch` di-patch (dev-only, via initApiMarkerDevTools di main.ts)
//     → SEMUA request terekam otomatis: URL asli + status + sample response.
//  2. Directive `v-api-marker="'cardId'"` di tiap kartu → border 3px + chip
//     + tooltip (nama API, query terakhir, sample response).
//  3. Panel kecil kanan-bawah: rekap semua API — yang terpakai vs yang tidak
//     pernah dipanggil (kandidat dibuang), per analogi v-chip/v-tooltip
//     Vuetify (project ini tidak pakai Vuetify → dibuat manual dengan DOM).
//
// Border:
//  - merah    = nilai kartu dari API live
//  - amber    = campuran (ada child/nilai yang pakai API, ada yang mock/statis)
//  - abu-abu  = MOCK (data statis/estimasi, tanpa API live)
// ═══════════════════════════════════════════════════════════════════════════
import type { Directive } from 'vue';

// Aktif jika salah satu:
//   1. dev server (`npm run dev`)                 — otomatis
//   2. env VITE_API_MARKER=1 (Vercel/.env lokal)  — selalu aktif di build itu
//   3. URL ?apimarker=1                           — aktif sesi itu saja
export const MARKER_ACTIVE =
  import.meta.env.DEV ||
  import.meta.env.VITE_API_MARKER === '1' ||
  /[?&]apimarker=1/.test(window.location.search);
const DEV = MARKER_ACTIVE;

// ── Definisi API: urutan match penting (spesifik dulu) ──────────────────────
type ApiDef = { id: string; short: string; name: string; urlHint: string };
const API_DEFS: (ApiDef & { match: RegExp })[] = [
  { id: 'official-forecast', short: 'open-data', name: 'Open Data RESMI: prakiraan-cuaca (adm4)', urlHint: 'api.bmkg.go.id/publik/prakiraan-cuaca?adm4=…', match: /api\.bmkg\.go\.id\/publik\/prakiraan-cuaca/ },
  { id: 'nowcast', short: 'nowcast', name: 'Peringatan Dini Nowcast (RSS resmi)', urlHint: 'www.bmkg.go.id/alerts/nowcast/id', match: /\/alerts\/nowcast\/id/ },
  { id: 'public-warning-cyclone', short: 'cyclone', name: 'Public API: peringatan siklon', urlHint: '…/api/public/weather/warning/cyclone', match: /api\/public\/weather\/warning\/cyclone/ },
  { id: 'public-warning', short: 'warning', name: 'Public API: peringatan cuaca', urlHint: '…/api/public/weather/warning?lat&long', match: /api\/public\/weather\/warning/ },
  { id: 'public-weekly', short: 'weekly-t', name: 'Public API: suhu mingguan', urlHint: '…/api/public/weather/weekly-temperature', match: /weekly-temperature/ },
  { id: 'public-video', short: 'video', name: 'Public API: video berita', urlHint: '…/api/public/weather/video-latest', match: /video-latest/ },
  { id: 'public-banners', short: 'banners', name: 'Public API: banner', urlHint: '…/api/public/banners', match: /\/api\/public\/banners/ },
  { id: 'df-forecast', short: 'df/coord', name: 'DF Forecast: prakiraan 10 hari + per jam', urlHint: '…/api/df/v1/forecast/coord?lat&lon', match: /api\/df\/v1\/forecast\/coord/ },
  { id: 'df-adm', short: 'df/adm', name: 'DF Adm: resolve wilayah admin', urlHint: '…/api/df/v1/adm/coord?lat&lon', match: /api\/df\/v1\/adm\/coord/ },
  { id: 'df-amandemen', short: 'amandemen', name: 'DF Amandemen: update peringatan', urlHint: '…/api/df/v1/amandemen/coord', match: /amandemen\/coord/ },
  { id: 'presentwx', short: 'present', name: 'Present Weather: cuaca saat ini', urlHint: '…/api/presentwx/coord?lat&lon', match: /api\/presentwx\/coord/ },
  { id: 'sunset', short: 'sunset', name: 'API v1: waktu matahari terbit/terbenam', urlHint: '…/api/v1/sunset/json', match: /api\/v1\/sunset\/json/ },
  { id: 'maritim-nearest', short: 'maritim-ish', name: 'ISDP v1: wilayah laut terdekat', urlHint: '…/api/v1/public/maritim/nearest-location', match: /api\/v1\/public\/maritim\/nearest-location/ },
  { id: 'tcwc-cyclone', short: 'tcwc', name: 'TCWC: siklon tropis', urlHint: '…/api/v1/tcwc/cyclone/all', match: /tcwc\/cyclone/ },
  { id: 'tews', short: 'tews', name: 'Open Data: gempa (TEWS)', urlHint: 'data.bmkg.go.id/DataMKG/TEWS/…', match: /DataMKG\/TEWS/ },
  { id: 'maritim-overview', short: 'ov-gel', name: 'Maritim: overview tinggi gelombang (232 wilayah)', urlHint: 'maritim.bmkg.go.id/public_api/overview/gelombang.json', match: /overview\/gelombang/ },
  { id: 'maritim-wilayah', short: 'wil-perairan', name: 'Maritim: polygon 232 wilayah perairan', urlHint: 'maritim.bmkg.go.id/public_api/static/wilayah_perairan.json', match: /static\/wilayah_perairan/ },
  { id: 'maritim-perairan', short: 'perairan', name: 'Maritim: detail cuaca/gelombang perairan', urlHint: 'maritim.bmkg.go.id/public_api/perairan/{file}.json', match: /public_api\/perairan\// },
  { id: 'maritim-pelabuhan-list', short: 'pl-list', name: 'Maritim: daftar pelabuhan (294)', urlHint: 'maritim.bmkg.go.id/public_api/pelabuhan_list', match: /pelabuhan_list/ },
  { id: 'maritim-pelabuhan', short: 'pelabuhan', name: 'Maritim: detail pelabuhan + pasut', urlHint: 'maritim.bmkg.go.id/public_api/pelabuhan/{file}.json', match: /public_api\/pelabuhan\// },
  { id: 'dwt', short: 'dwt', name: 'DWT: cuaca kecamatan/stasiun (jalan+kereta)', urlHint: 'dwt.bmkg.go.id/event/source/dwt/apiDF_*', match: /dwt\/apiDF_/ },
  { id: 'blog-wp', short: 'berita', name: 'Berita WordPress BMKG (WP REST)', urlHint: 'cuaca.bmkg.go.id/blog/wp-json/wp/v2/…', match: /\/blog\/wp-json/ },
  { id: 'overpass', short: 'overpass', name: 'Overpass API: POI OpenStreetMap', urlHint: 'overpass-api.de/api/interpreter', match: /overpass-api\.de/ },
  { id: 'nominatim', short: 'nominatim', name: 'Nominatim: geocode OSM', urlHint: 'nominatim.openstreetmap.org/search', match: /nominatim\.openstreetmap\.org/ },
  { id: 'osrm', short: 'osrm', name: 'OSRM: routing', urlHint: 'router.project-osrm.org/route', match: /router\.project-osrm\.org/ },
  { id: 'satelit', short: 'satelit', name: 'Citra Satelit Himawari-9 (background-image, bukan fetch)', urlHint: 'inderaja.bmkg.go.id/IMAGE/HIMA/H08_*.png', match: /inderaja\.bmkg\.go\.id/ },
  { id: 'local-json', short: 'lokal', name: 'File statis lokal (snapshot/aset)', urlHint: '/data/*.json', match: /^\/(data|sectors|ports)\.json/ },
];

function matchApiId(url: string): string {
  for (const d of API_DEFS) if (d.match.test(url)) return d.id;
  return 'lainnya';
}

// ── Store: request terakhir per API ──────────────────────────────────────────
export type ApiCall = { url: string; method: string; status: number; sample: string; at: string };
const callsById = new Map<string, ApiCall[]>();
const totalById = new Map<string, number>();

/** Dipanggil dari patch window.fetch (dev-only). Tidak melempar error. */
export function recordApiCall(url: string, method: string, status: number, body: string): void {
  const id = matchApiId(url);
  const call: ApiCall = { url, method, status, sample: body.slice(0, 100_000), at: new Date().toISOString() };
  const list = callsById.get(id) ?? [];
  list.push(call);
  if (list.length > 3) list.shift();
  callsById.set(id, list);
  totalById.set(id, (totalById.get(id) ?? 0) + 1);
}

export function callCount(id: string): number { return totalById.get(id) ?? 0; }
export function lastCall(id: string): ApiCall | undefined { const l = callsById.get(id); return l?.[l.length - 1]; }

// ── Markers per kartu ─────────────────────────────────────────────────────────
export type CardMarker = {
  kind: 'live' | 'mixed' | 'mock';
  apis: string[];            // id API (harus ada di API_DEFS, atau 'lainnya')
  parts?: { type: 'live' | 'mock' | 'est'; label: string }[]; // rincian per bagian
  note?: string;
};
export const CARD_MARKERS: Record<string, CardMarker> = {
  hero: {
    kind: 'live', apis: ['df-forecast', 'presentwx'],
    note: "Kartu 'Hari Ini' = kondisi live saat ini; strip 7 hari = slot pertama tiap grup (df-forecast). API tidak punya tmin/tmax & probabilitas hujan → keduanya di-skip (badge % = tp×20, aproksimasi).",
  },
  'current-weather': {
    kind: 'live', apis: ['df-forecast', 'df-adm', 'presentwx', 'sunset'],
    parts: [{ type: 'est', label: 'UV: proksi tcc (bukan UV asli)' }, { type: 'est', label: '"Terasa seperti": rumus t + (hu-50)/10' }],
    note: 'Info matahari (sunset API), wilayah (df/adm).',
  },
  'forecast-panel': {
    kind: 'live', apis: ['df-forecast', 'official-forecast'],
    note: 'Tab Suhu = satu suhu per hari (slot pertama, tanpa min/max). Fallback resmi open-data bila df kosong.',
  },
  alerts: {
    kind: 'live', apis: ['public-warning', 'public-warning-cyclone', 'nowcast'],
    note: 'Nowcast (resmi, per provinsi) menang atas warning internal. Cyclone terdampak jarang (hanya saat ada siklon).',
  },
  news: {
    kind: 'live', apis: ['blog-wp', 'public-video'],
    parts: [{ type: 'mock', label: 'Fallback: artikel mock saat WP 502 (sering)' }],
  },
  earthquake: { kind: 'live', apis: ['tews'], note: 'autogempa + gempadirasakan, 2 endpoint TEWS.' },
  satellite: {
    kind: 'live', apis: ['satelit'],
    note: 'Gambar PNG inderaja.bmkg.go.id (background-image <img> → TIDAK terekam patch fetch).',
  },
  'major-cities': {
    kind: 'mock', apis: [], parts: [{ type: 'mock', label: 'Kartu statis: landmark + nama kota (auto-geser & fetch sengaja dimatikan, 16 Sep)' }],
  },
  transport: {
    kind: 'mixed', apis: ['dwt', 'maritim-nearest', 'maritim-perairan'],
    parts: [
      { type: 'live', label: 'Jalan Raya: DWT kecamatan terdekat' },
      { type: 'live', label: 'Kereta: DWT stasiun terdekat (178 stasiun)' },
      { type: 'live', label: 'Maritim: perairan resmi (fix currentSlot 15 Sep)' },
      { type: 'mock', label: 'Penerbangan: MOCK/PAUSED (menunggu data partner)' },
    ],
  },
  'weather-activity': {
    kind: 'mixed', apis: ['df-forecast', 'maritim-nearest', 'maritim-perairan'],
    parts: [
      { type: 'live', label: 'Aktivitas umum: forecast live' },
      { type: 'live', label: 'Aktivitas pelayaran: gelombang perairan resmi' },
      { type: 'est', label: 'ISPU/AQI: ESTIMASI sintetis (tidak ada sumber resmi)' },
      { type: 'mock', label: 'Indeks kenyamanan: label statis' },
    ],
  },
  'marine-map': {
    kind: 'mixed', apis: ['maritim-overview', 'maritim-wilayah', 'maritim-perairan', 'dwt'],
    parts: [
      { type: 'live', label: 'Gelombang: 232 wilayah resmi (warna/legend live), klik → detail live' },
      { type: 'mock', label: 'Layer angin/cuaca: SNAPSHOT statis (sectors.json)' },
      { type: 'mock', label: 'Mode Pelabuhan: snapshot ports.json (294) — hanya pelabuhan TERDEKAT yang live' },
    ],
  },
  'port-tide': {
    kind: 'live', apis: ['maritim-pelabuhan-list', 'maritim-pelabuhan'],
    note: 'Pasut null di sebagian pelabuhan → blok disembunyikan. Kolom arus di-skip (satuan ambigu).',
  },
  'around-activity': {
    kind: 'mixed', apis: ['df-forecast', 'overpass'],
    parts: [{ type: 'mock', label: 'Daftar POI: kurasi statis (cityLandmarks)' }],
    note: 'Nilai cuaca per titik POI live (1 request df/coord per POI).',
  },
  'land-based': {
    kind: 'mixed', apis: ['df-forecast', 'dwt', 'overpass', 'nominatim', 'osrm'],
    parts: [{ type: 'mock', label: 'Pilihan lokasi awal: daftar statis' }],
    note: 'Forecast per titik rute live; fallback mock saat API gagal.',
  },
  'maritime-advisor': {
    kind: 'mixed', apis: ['maritim-nearest', 'maritim-perairan'],
    parts: [{ type: 'mock', label: 'Sisa konten drawer (jenis aktivitas, tabel): statis maritimeAdvisorData.ts' }],
    note: 'Parameter gelombang resmi di-inject ke drawer.',
  },
  'aviation-advisor': {
    kind: 'mock', apis: [],
    parts: [{ type: 'mock', label: '100% statis (aviationAdvisorData.ts) — API penerbangan belum ada' }],
  },
  'location-search': {
    kind: 'mock', apis: [],
    parts: [{ type: 'mock', label: 'POI statis (poiSearchData.ts)' }],
  },
};

// ── Directive v-api-marker ───────────────────────────────────────────────────
const BORDER: Record<CardMarker['kind'], string> = {
  live: '#ef4444',  // merah — API live
  mixed: '#f59e0b', // amber — campuran (child pakai API)
  mock: '#94a3b8',  // abu — mock/statis
};

function el(tag: string, style: Partial<CSSStyleDeclaration>, text?: string): HTMLElement {
  const n = document.createElement(tag);
  Object.assign(n.style, style);
  if (text !== undefined) n.textContent = text;
  return n;
}

function defOf(id: string): ApiDef | undefined {
  return API_DEFS.find(d => d.id === id);
}
function defName(id: string): string {
  if (id === 'lainnya') return 'Lainnya (tidak terpetakan)';
  return defOf(id)?.name ?? id;
}

const tooltip = el('div', {
  position: 'fixed', zIndex: '1000000', display: 'none',
  minWidth: '220px', maxWidth: '440px',
  background: '#0f172a', color: '#e2e8f0',
  border: `2px solid ${BORDER.live}`, borderRadius: '8px',
  padding: '10px 12px', fontSize: '11px', lineHeight: '1.45',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  boxShadow: '0 8px 24px rgba(0,0,0,.45)', userSelect: 'text', cursor: 'auto',
  maxHeight: '70vh', overflowY: 'auto',
});
document.body?.appendChild(tooltip);

async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    try {
      const ta = el('textarea', { position: 'fixed', opacity: '0' }, t) as HTMLTextAreaElement;
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}

function copyBtn(getText: () => string): HTMLElement {
  const b = el('button', {
    background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px',
    padding: '1px 7px', fontSize: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: '0',
  }, '\u{1F4CB} salin');
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await copyText(getText());
    b.textContent = ok ? '\u2705 tersalin' : '\u274c gagal';
    setTimeout(() => { b.textContent = '\u{1F4CB} salin'; }, 1200);
  });
  return b;
}

function tRow(label: string, value: string, color = '#94a3b8', copyValue?: string): HTMLElement {
  const row = el('div', { margin: '2px 0' });
  row.appendChild(el('span', { color, fontWeight: '700', marginRight: '6px' }, label));
  row.appendChild(el('span', { color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }, value));
  if (copyValue !== undefined) row.appendChild(copyBtn(() => copyValue));
  return row;
}

function renderTooltip(marker: CardMarker, cardId: string): void {
  tooltip.textContent = '';
  const kindLabel = marker.kind === 'live' ? 'LIVE' : marker.kind === 'mixed' ? 'CAMPURAN' : 'MOCK';
  tooltip.style.borderColor = BORDER[marker.kind];
  tooltip.appendChild(el('div', { fontWeight: '800', fontSize: '12px', marginBottom: '6px' },
    `API BOX · ${cardId} — ${kindLabel}`));

  if (marker.apis.length === 0) {
    tooltip.appendChild(el('div', { color: '#94a3b8', margin: '2px 0' }, 'Tidak ada API live.'));
  }
  for (const id of marker.apis) {
    const head = el('div', { marginTop: '6px', borderBottom: '1px solid #334155', paddingBottom: '3px' });
    head.appendChild(el('span', { color: '#fbbf24', fontWeight: '800', marginRight: '6px' }, '▸'));
    head.appendChild(el('span', { color: '#f8fafc', fontWeight: '800' }, defName(id)));
    tooltip.appendChild(head);

    const n = callCount(id);
    const last = lastCall(id);
    tooltip.appendChild(tRow('calls', String(n), n > 0 ? '#4ade80' : '#64748b'));
    if (last) {
      tooltip.appendChild(tRow('query', `${last.method} ${last.url.slice(0, 300)}`, '#7dd3fc', `${last.method} ${last.url}`));
      const shown = last.sample.slice(0, 1000);
      const sh = el('div', { color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' });
      sh.appendChild(el('span', {}, `sample (status ${last.status}, ${last.sample.length} ch${last.sample.length > shown.length ? ', tampil 1000' : ''}):`));
      sh.appendChild(copyBtn(() => last.sample));
      tooltip.appendChild(sh);
      const pre = el('pre', {
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '220px', overflow: 'auto',
        background: '#1e293b', borderRadius: '4px', padding: '4px 6px', fontSize: '10px', color: '#a5f3fc', margin: '2px 0 4px',
      }, shown);
      tooltip.appendChild(pre);
    } else {
      tooltip.appendChild(tRow('sample', 'belum ada call terekam (klik/setel ulang halaman bila seharusnya ada)', '#64748b'));
    }
  }
  if (marker.parts?.length) {
    const parts = el('div', { marginTop: '6px' });
    for (const p of marker.parts) {
      const dot = p.type === 'live' ? '🟢' : p.type === 'est' ? '🟡' : '🔌';
      parts.appendChild(el('div', { margin: '2px 0' }, `${dot} ${p.label}`));
    }
    tooltip.appendChild(parts);
  }
  if (marker.note) {
    tooltip.appendChild(el('div', { marginTop: '6px', color: '#cbd5e1', fontStyle: 'italic' }, '💡 ' + marker.note));
  }
}

function attachMarker(root: HTMLElement, cardId: string, marker: CardMarker): void {
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.style.border = `3px solid ${BORDER[marker.kind]}`;
  root.style.borderRadius = '6px';

  const chip = el('span', {
    position: 'absolute', top: '4px', right: '4px', zIndex: '99999',
    background: BORDER[marker.kind], color: '#fff',
    borderRadius: '999px', padding: '2px 9px',
    fontSize: '10px', fontWeight: '800', letterSpacing: '0.4px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    boxShadow: '0 2px 6px rgba(0,0,0,.3)', cursor: 'help',
    maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  });
  const labels = marker.kind === 'mock' ? ['MOCK'] : marker.apis.map(id => defOf(id)?.short ?? id);
  chip.textContent = marker.kind === 'mock' ? '🔌 MOCK' : `⚡ ${labels.join(' · ')}`;
  chip.addEventListener('mouseenter', () => {
    renderTooltip(marker, cardId);
    tooltip.style.display = 'block';
    const r = chip.getBoundingClientRect();
    const w = Math.min(tooltip.offsetWidth, 480);
    const h = tooltip.offsetHeight;
    let left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    let top = r.bottom + 8;
    if (top + h > window.innerHeight) top = Math.max(8, r.top - h - 8);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });
  chip.addEventListener('mouseleave', () => { hideTimer = window.setTimeout(hideTooltip, 350); });
  root.appendChild(chip);
}

// tooltip interaktif: tetap terbuka selama kursor di dalamnya (seleksi, scroll, salin);
// tutup saat kursor meninggalkan chip DAN tooltip
let hideTimer: ReturnType<typeof setTimeout> | undefined;
function hideTooltip(): void { tooltip.style.display = 'none'; }
tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
tooltip.addEventListener('mouseleave', hideTooltip);

export const apiMarkerDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    if (!DEV) return;
    // gunakan ARG directive (literal string) — nilai (value) adalah ekspresi JS,
    // arg lebih aman utk id bertanda hubung (v-api-marker:current-weather)
    const cardId = binding.arg ?? binding.value;
    const marker = CARD_MARKERS[cardId];
    if (!marker) { console.warn(`[api-marker] cardId tidak dikenal: ${cardId}`); return; }
    attachMarker(el, cardId, marker);
  },
  unmounted() { if (DEV) tooltip.style.display = 'none'; },
};

// ── Patch window.fetch + panel rekap ─────────────────────────────────────────
export function initApiMarkerDevTools(): void {
  if (!DEV) return;
  const orig = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await orig(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url ?? '';
    res.clone().text()
      .then(body => recordApiCall(url, init?.method ?? 'GET', res.status, body))
      .catch(() => { /* opaque/stream body — abaikan */ });
    return res;
  }) as typeof fetch;

  // Panel rekap (kanan-bawah, bisa di-klik untuk sembunyi/muncul)
  const panel = el('div', {
    position: 'fixed', right: '8px', bottom: '8px', zIndex: '1000000',
    background: '#0f172a', color: '#e2e8f0', border: '2px solid #f59e0b',
    borderRadius: '8px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '10px', boxShadow: '0 8px 24px rgba(0,0,0,.45)', maxWidth: '360px',
  });
  const btn = el('button', {
    display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
    cursor: 'pointer', background: 'transparent', border: 'none', color: '#fbbf24',
    fontWeight: '800', fontSize: '11px',
  }, '■ API BOX MARKER (dev) — klik untuk buka/tutup');
  btn.addEventListener('click', () => { body.style.display = body.style.display === 'none' ? 'block' : 'none'; });
  const body = el('div', {
    display: 'none', maxHeight: '50vh', overflow: 'auto', padding: '4px 10px 10px',
    borderTop: '1px solid #334155',
  });
  panel.appendChild(btn);
  panel.appendChild(body);
  document.body.appendChild(panel);

  setInterval(() => {
    if (body.style.display === 'none') return;
    body.textContent = '';
    body.appendChild(el('div', { color: '#94a3b8', margin: '4px 0' },
      `REKAP ${new Date().toLocaleTimeString()} — hijau = pernah dipanggil, abu = tidak/kandidat dibuang`));
    for (const d of API_DEFS) {
      const n = callCount(d.id);
      body.appendChild(el('div', { margin: '2px 0', color: n > 0 ? '#4ade80' : '#64748b' },
        `${n > 0 ? '✓' : '○'} ${String(n).padStart(3)}  ${d.short.padEnd(14)} ${d.name}`));
    }
    body.appendChild(el('div', { marginTop: '6px', color: '#94a3b8' },
      `lainnya: ${callCount('lainnya')} (tiles peta, dll. — lihat tooltip kartu utk URL asli)`));
  }, 2000);
}
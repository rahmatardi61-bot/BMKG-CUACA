// Bangun dokumen "AI consume" untuk widget embed.
//   node docs/artifacts/scripts/build_ai_docs.mjs
// Output (ditulis ke bmkg_cuaca + bmkg-service-isdp):
//   public/ai/widgets.json         manifest widget + ukuran default dashboard
//   public/ai/dashboard-blueprint.json  layout + urutan region
//   public/ai-docs.md              dokumen teks (yang dibaca AI)
//   public/ai/index.html           pembungkus manusiawi untuk /ai/
//   docs/ai-consume.md             salinan file-side
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const UI = join(here, '../../..');                 // bmkg_cuaca
const SVC = join(UI, '../bmkg-service-isdp');

// ukuran = hasil ukur dashboard (viewport 1440 & 390), bukan default /widgets
const SIZE = {
  alerts:{r:'top',d:[1216,173],m:[358,173]},
  'major-cities':{r:'main',d:[800,479],m:[358,482]},
  current:{r:'main',d:[800,558],m:[358,1023]},
  forecast:{r:'main',d:[800,540],m:[358,563]},
  satellite:{r:'main',d:[800,390],m:[358,420]},
  marine:{r:'main',d:[800,694],m:[358,610]},
  earthquake:{r:'main',d:[800,929],m:[358,1456]},
  'activity-comfort':{r:'sidebar',d:[384,259],m:[358,259]},
  'activity-air':{r:'sidebar',d:[384,295],m:[358,295]},
  'activity-land':{r:'sidebar',d:[384,234],m:[358,234]},
  'activity-coastal':{r:'sidebar',d:[384,254],m:[358,273]},
  'activity-shipping':{r:'sidebar',d:[384,254],m:[358,254]},
  'activity-aviation':{r:'sidebar',d:[384,234],m:[358,254]},
  transport:{r:'sidebar',d:[384,444],m:[358,459]},
  'port-tide':{r:'sidebar',d:[384,173],m:[358,173]},
  // bukan kartu dashboard: dipakai di dalam kartu / panel lain
  search:{r:'extra',d:[384,105],m:[358,120],where:'di dalam header dashboard (kolom pencarian)'},
  'nearby-places':{r:'extra',d:[800,294],m:[358,280],where:'menempel di kartu "Kondisi Cuaca Saat Ini"'},
  'current-detail':{r:'extra',d:[800,575],m:[358,700],where:'di dalam kartu "Kondisi Cuaca Saat Ini"'},
  'earthquake-params':{r:'extra',d:[384,434],m:[358,443],where:'sidebar di kartu "Gempa Bumi Terkini"'},
  wave:{r:'extra',d:[800,504],m:[358,536],where:'kartu peta maritim (pengganti radar yang dinonaktifkan)'},
  'maritime-advisor':{r:'overlay',d:[900,997],m:[390,1056]},
  'aviation-advisor':{r:'overlay',d:[900,1029],m:[390,1083]},
  'land-activity':{r:'overlay',d:[900,674],m:[390,674]},
  around:{r:'overlay',d:[900,674],m:[390,674]},
  report:{r:'overlay',d:[900,1234],m:[390,1267]},
};

// interaksi: apa yang harus diklik user dan apa yang muncul (semua di dalam iframe)
const IX = {
  'activity-land':{click:'kartu Aktivitas Darat',opens:'LandBasedActivities (full-screen)',chain:['klik kartu','overview','cari tempat','pilih tempat','rute']},
  'activity-coastal':{click:'kartu Aktivitas Pesisir & Laut',opens:'MaritimeAdvisorDrawer',chain:['klik kartu','drawer sektor maritim']},
  'activity-shipping':{click:'kartu Aktivitas Pelayaran',opens:'MaritimeAdvisorDrawer',chain:['klik kartu','drawer sektor pelayaran']},
  'activity-aviation':{click:'kartu Aktivitas Penerbangan',opens:'AviationAdvisorDrawer',chain:['klik kartu','drawer bandara']},
  earthquake:{click:'item gempa / tombol peta',opens:'modal detail kejadian atau peta full-screen',chain:['klik item gempa','detail kejadian'],chain2:['klik peta','peta full-screen']},
  'nearby-places':{click:'kartu tempat',opens:'AroundActivityDrawer (inline di dalam kartu)',chain:['klik tempat','drawer detail tempat']},
  'land-activity':{click:'—',opens:'panel penuh (widget ini sendiri overlay)',chain:['render langsung']},
  'maritime-advisor':{click:'—',opens:'drawer penuh (widget ini sendiri overlay)',chain:['render langsung']},
  'aviation-advisor':{click:'—',opens:'drawer penuh (widget ini sendiri overlay)',chain:['render langsung']},
  around:{click:'—',opens:'drawer detail tempat (langsung terbuka)',chain:['render langsung']},
  report:{click:'—',opens:'drawer form laporan (langsung terbuka)',chain:['render langsung']},
};

const SOURCE = {'nearby-places':'MOCOMM', around:'MOCOMM'};

// status sama dengan sheet "Audit Card + Screenshot" (10 live / 7 mixed / 8 mock).
// Katalog runtime hanya tahu live|mock, jadi peta ini yang dipakai dokumen.
const STATUS = {
  live: ['search','alerts','current','current-detail','forecast','satellite','marine','earthquake-params','port-tide','wave'],
  mixed: ['earthquake','activity-comfort','activity-land','activity-coastal','activity-shipping','activity-aviation','land-activity'],
  mock: ['major-cities','nearby-places','activity-air','transport','maritime-advisor','aviation-advisor','around','report'],
};

// ambil katalog widget dari api/widget-catalog.js (satu sumber dengan runtime)
const cat = readFileSync(join(UI, 'api/widget-catalog.js'), 'utf8');
const ids = [...cat.matchAll(/\{ id: '([a-z-]+)', name: '([^']+)', needsCity: (\w+), live: (\w+), mock: ([^}]+?) \}/g)]
  .map(m => ({ id: m[1], name: m[2], needsCity: m[3] === 'true', live: m[4] === 'true', mock: m[5] === 'null' ? null : m[5].replace(/'/g, '') }));
if (ids.length !== 25) throw new Error(`katalog: ${ids.length} widget, harusnya 25`);
const mapped = [...STATUS.live, ...STATUS.mixed, ...STATUS.mock];
if (mapped.length !== 25 || new Set(mapped).size !== 25) throw new Error('peta STATUS tidak lengkap/ganda');
for (const id of ids.map(x => x.id)) if (!mapped.includes(id)) throw new Error(`STATUS belum memuat: ${id}`);

const widgets = ids.map(w => {
  const s = SIZE[w.id];
  if (!s) throw new Error(`ukuran belum ada: ${w.id}`);
  const ix = IX[w.id];
  return {
    id: w.id,
    title: w.name,
    sumber: SOURCE[w.id] ?? 'BMKG',
    status: STATUS.live.includes(w.id) ? 'live' : STATUS.mixed.includes(w.id) ? 'mixed' : 'mock',
    needsCity: w.needsCity,
    mockPart: w.mock,
    region: s.r,
    ...(s.where ? { placement: s.where } : {}),
    embed: {
      script: `<script src="https://<host>/embed.js" defer></script>`,
      element: `<div data-bmkg-widget="${w.id}"${w.needsCity ? ' data-city="DKI Jakarta"' : ''} data-theme="dark"></div>`,
      url: `/embed.html?widget=${w.id}${w.needsCity ? '&city=DKI%20Jakarta' : ''}`,
    },
    iframe: { desktop: { w: s.d[0], h: s.d[1] }, mobile: { w: s.m[0], h: s.m[1] } },
    interaction: ix
      ? { parentGesture: ix.click !== '—', click: ix.click, opens: ix.opens, chain: ix.chain, ...(ix.chain2 ? { chainAlt: ix.chain2 } : {}) }
      : { parentGesture: false, click: null, opens: null, chain: [] },
  };
});

const blueprint = {
  name: 'BMKG dashboard (mirror dari /dashboard)',
  note: 'Ukuran & urutan diukur dari dashboard asli, viewport 1440x900 (kontainer 1280px) dan 390x844.',
  consumeVia: 'embed.js (token & refresh ditangani otomatis)',
  container: { maxWidth: '80rem', padding: { base: '1rem', sm: '1.5rem', lg: '2rem' } },
  grid: { cols: { base: 1, lg: 3 }, gap: '2rem', breakpointLg: '1024px' },
  regions: [
    { id: 'top', span: 3, stack: 'space-y-3', order: ['alerts'] },
    { id: 'main', span: 2, stack: 'space-y-8', order: ['major-cities', 'current', 'forecast', 'satellite', 'marine', 'earthquake'] },
    { id: 'sidebar', span: 1, stack: 'space-y-8', sticky: 'top: 6rem', order: ['activity-comfort', 'activity-air', 'activity-land', 'activity-coastal', 'activity-shipping', 'activity-aviation', 'transport', 'port-tide'] },
  ],
  extraWidgets: ['search', 'nearby-places', 'current-detail', 'earthquake-params', 'wave'],
  overlayWidgets: ['maritime-advisor', 'aviation-advisor', 'land-activity', 'around', 'report'],
  excluded: { hero: 'tidak ada versi embed', downloadCta: 'tidak ada versi embed', news: 'tidak ada versi embed', radar: 'dinonaktifkan di dashboard' },
};

const sizeRows = widgets.map(w => `| \`${w.id}\` | ${w.title} | ${w.region} | ${w.iframe.desktop.w}×${w.iframe.desktop.h} | ${w.iframe.mobile.w}×${w.iframe.mobile.h} | ${w.status} | ${w.sumber} |`).join('\n');
const ixRows = widgets.filter(w => w.interaction.parentGesture || /drawer|overlay|panel/i.test(w.interaction.opens || ''))
  .map(w => `| \`${w.id}\` | ${w.interaction.parentGesture ? 'ya — ' + w.interaction.click : 'tidak'} | ${w.interaction.opens} | ${w.interaction.chain.join(' → ')} |`).join('\n');

const md = `# Konsumsi widget BMKG untuk membangun dashboard

Dokumen ini untuk **agen AI / developer** yang akan membangun halaman mirip dashboard BMKG
memakai widget embed kami. Semua isi halaman ini juga tersedia sebagai JSON:

- \`/ai/widgets.json\` — daftar 25 widget: id, judul, status data, sumber, ukuran default, interaksi
- \`/ai/dashboard-blueprint.json\` — layout & urutan region
- \`/ai-docs.md\` — dokumen ini (teks biasa)

Host: ganti \`<host>\` dengan alamat layanan (mis. \`https://<host>/ai-docs.md\`).

## 1. Prasyarat: autentikasi sudah diurus embed.js

Anggap Keycloak + kredensial **sudah** ada di sisi Anda. Anda **tidak perlu** meminta token,
menyimpan token, atau menulis logika refresh — \`embed.js\` yang membuat, memakai, dan
memperbarui token, lalu memanggil proxy kami. Jangan menaruh client secret / API key di halaman.

Yang Anda pakai hanya dua hal:

\`\`\`html
<script src="https://<host>/embed.js" defer></script>
<div data-bmkg-widget="forecast" data-city="DKI Jakarta" data-theme="dark"></div>
\`\`\`

Atribut: \`data-bmkg-widget\` (id dari \`widgets.json\`), \`data-city\` (wajib bila
\`needsCity: true\`), \`data-theme\` (\`dark\`/\`light\`), opsional \`data-height\`.

## 2. Layout

Ikuti \`dashboard-blueprint.json\`. Ringkasnya:

- Kontainer \`max-width: 80rem\`, padding 1rem / 1.5rem / 2rem (base/sm/lg).
- Grid: 1 kolom di bawah 1024px, 3 kolom di atasnya, gap 2rem.
- Region \`top\` (span 3) → \`main\` (span 2) → \`sidebar\` (span 1, \`position: sticky; top: 6rem\`).
- Urutan di dalam tiap region **persis** seperti kolom \`order\` pada blueprint.

Bagian dashboard yang **tidak** punya versi embed (jangan dibuat): hero cuaca besar,
tombol unduh aplikasi, berita, dan peta radar (dinonaktifkan).

## 3. Ukuran default (diukur dari dashboard, bukan dari halaman preview)

Pakai ukuran ini apa adanya; jangan memakai tinggi default halaman \`/widgets\`.

| id | judul | region | desktop (w×h) | mobile (w×h) | status | sumber |
|---|---|---|---|---|---|---|
${sizeRows}

\`region: extra\` = bukan kartu dashboard; dipakai di dalam bagian lain
(\`placement\` di \`widgets.json\`), sementara \`region: overlay\` = tampil sebagai
lapisan penuh (drawer/panel).

## 4. Interaksi: overlay sudah ada di dalam iframe

Penting: setiap drawer, modal, dan panel penuh **dirender di dalam iframe widget**.
Jangan membuat modal/drawer sendiri di halaman induk — hasilnya dobel.

| id | butuh klik user? | yang muncul | alur |
|---|---|---|---|
${ixRows}

Contoh rantai bertingkat: kartu **Kondisi Cuaca Saat Ini** memuat panel tempat;
klik salah satu tempat → **Detail Aktivitas Sekitar** muncul sebagai drawer
**di dalam** widget \`nearby-places\`, bukan di halaman induk.

## 5. Status data

- \`live\` — nilai dari API BMKG (lewat proxy kami).
- \`mixed\` — sebagian API BMKG, sebagian hasil olahan aplikasi/statis.
- \`mock\` — data contoh di frontend. **Wajib** diberi label "data contoh" di UI Anda.

Field \`mockPart\` di \`widgets.json\` menyebut bagian mana yang masih contoh.
Widget dengan \`sumber: MOCOMM\` berarti datanya akan datang dari layanan internal
(kota/tempat) yang belum tersedia; sampai saat itu nilainya masih statis.

## 6. Checklist verifikasi

1. 25 widget termuat, tidak ada yang kosong/gagal.
2. Urutan region sama dengan blueprint; sidebar tetap menempel saat scroll.
3. Setiap widget yang \`parentGesture: true\` bisa membuka overlay-nya tanpa error.
4. Tidak ada dialog/modal ganda (satu dari iframe, satu dari halaman Anda).
5. Tinggi widget sesuai tabel di atas; jika konten terpotong, tambahkan tinggi iframe.
6. Widget \`mock\` diberi label data contoh.
`;

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Konsumsi Widget BMKG — panduan untuk AI</title>
<style>
 body{margin:0;background:#0b1220;color:#dbe3ef;font:15px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}
 .wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
 h1{font-size:20px;color:#7dd3fc} a{color:#7dd3fc}
 pre{white-space:pre-wrap;word-break:break-word;background:#111a2b;border:1px solid #1f2b3d;border-radius:10px;padding:20px}
 .links{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 24px;font-size:13px}
 .links a{background:#111a2b;border:1px solid #1f2b3d;border-radius:8px;padding:8px 12px;text-decoration:none}
</style></head>
<body><div class="wrap">
<h1>Konsumsi Widget BMKG — panduan untuk AI</h1>
<div class="links">
 <a href="/ai-docs.md">/ai-docs.md</a>
 <a href="/ai/widgets.json">/ai/widgets.json</a>
 <a href="/ai/dashboard-blueprint.json">/ai/dashboard-blueprint.json</a>
</div>
<pre id="doc">memuat…</pre>
<script>
fetch('/ai-docs.md').then(r=>r.text()).then(t=>{document.getElementById('doc').textContent=t})
 .catch(e=>{document.getElementById('doc').textContent='Gagal memuat: '+e});
</script>
</div></body></html>
`;

// jaga-jaga: viewer lain kadang salah menebak encoding → dokumen dibuat ASCII murni
const ascii = (t) => t
  .replace(/\u2192/g, '->').replace(/\u00d7/g, 'x').replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-')
  .replace(/[^\x09\x0a\x20-\x7e]/g, '');

function emit(base) {
  mkdirSync(join(base, 'public/ai'), { recursive: true });
  writeFileSync(join(base, 'public/ai/widgets.json'), ascii(JSON.stringify({ generatedFrom: 'dashboard /dashboard', widgets }, null, 2)) + '\n');
  writeFileSync(join(base, 'public/ai/dashboard-blueprint.json'), JSON.stringify(blueprint, null, 2) + '\n');
  writeFileSync(join(base, 'public/ai-docs.md'), ascii(md));
  writeFileSync(join(base, 'public/ai/index.html'), html);
  mkdirSync(join(base, 'docs'), { recursive: true });
  writeFileSync(join(base, 'docs/ai-consume.md'), ascii(md));
}
emit(UI); emit(SVC);
console.log(`OK: ${widgets.length} widget → bmkg_cuaca + bmkg-service-isdp`);

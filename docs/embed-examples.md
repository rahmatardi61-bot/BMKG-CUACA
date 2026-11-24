# Contoh dashboard per framework (bukti embed bisa dipakai siapa saja)

Empat repo contoh di `../bmkg-embed-examples/`, **masing-masing berdiri sendiri** — tidak ada
file yang dipakai bersama. Kalau partner meminta sample React, kirim folder
`react-dashboard/` saja; mereka `npm install`, isi `.env`, `npm run dev`.

| Repo | Stack | Port web | Port backend stub |
|---|---|---|---|
| `vanilla-dashboard/` | HTML + TypeScript | 8101 | 8201 |
| `vue-dashboard/` | Vue 3 + Vite | 8102 | 8202 |
| `react-dashboard/` | React 18 + Vite | 8103 | 8203 |
| `angular-dashboard/` | Angular 22 | 8104 | 8204 |

## Kenapa tiap repo punya backend sendiri

Token Keycloak butuh `client_credentials` + `client_secret`. Itu **tidak boleh** ada di
browser. Jadi tiap repo membawa `server.mjs` kecil yang berperan sebagai "backend partner":

```
browser → GET /api/token                     backend partner (client_secret di .env)
browser → GET <server>/api/embed-js          Bearer token → script widget
        → eval(script)                       membuat iframe di tiap [data-bmkg-widget]
        → postMessage                        token ke iframe (bukan URL)
```

Penting: sample **tidak memakai** `/api/embed-token` milik kita. Itu keran khusus POC
internal, dan tidak akan ada di produksi. Yang dipakai hanya `/api/embed-js`,
`/api/widget-catalog`, `/api/widget-search` — semuanya dijaga Bearer dan `CORS: *`.

Konsekuensi: `EMBED_ALLOWED_ORIGINS` tidak lagi relevan untuk sample (hanya untuk
`/api/embed-token`). Sample boleh jalan di port berapa pun.

## Satu kontrak, empat framework

```html
<div data-bmkg-widget="current" data-city="Bandung"></div>
```

Loader (`bmkg-embed.ts`, disalin di tiap repo) mengurus token, `eval`, refresh, dan
penerusan pesan. Framework hanya perlu memanggil `rescan()` setelah render:

| Stack | Pemicu | Lokasi |
|---|---|---|
| Vanilla | langsung (DOM sudah ada) | `src/main.ts` |
| Vue 3 | `onMounted` | `src/App.vue` |
| React 18 | `useEffect` | `src/App.tsx` |
| Angular 22 | `ngAfterViewInit` | `src/app/bmkg-widget.component.ts` |

## Query widget yang tersedia

| Endpoint | Isi |
|---|---|
| `GET /api/widget-catalog` | 13 widget (id, `needsCity`, `live`, catatan MOCK) + 10 kota |
| `GET /api/widget-search?q=…` | kota kita + kelurahan via OpenStreetMap |

Pilihan lokasi diteruskan dengan satu pesan:

```js
window.postMessage({ type: 'bmkg-widget-place', label, lat, lon }, '*')
```

Widget menerima `?city=Nama` **atau** `?lat=&lon=` (hasil pencarian), jadi kelurahan juga
bisa ditampilkan.

## Biaya yang disengaja

`src/bmkg-embed.ts` (±170 baris) **disalin ke empat repo**. Itu harga standalone: tiap repo
harus bisa dikirim dan dijalankan tanpa folder lain. Perbaikan loader harus dilakukan di
keempatnya — dicatat di README masing-masing.

Yang **tidak** diduplikasi: daftar widget dan daftar kota. Keduanya diambil dari server,
supaya tidak pernah basi.

## Bug nyata yang ditemukan saat membangun ini

1. **`window.BMKG_EMBED_TOKEN` lupa di-set** sebelum `eval` → script jalan tapi tidak
   membuat iframe (0 iframe, tanpa error). Token harus diserahkan lewat variabel global
   karena script hasil `eval` tidak punya `document.currentScript`.
2. **`data-height` mematikan auto-resize** → kartu tinggi kosong. Cukup hilangkan atribut
   itu; loader mengukur sendiri dari isi iframe.
3. **Kelas Tailwind di repo tanpa Tailwind** (React) → layout berantakan tanpa error. Repo
   contoh memakai CSS biasa.
4. **`style="..."` berupa string di React** → React error #62, halaman kosong. Di React
   `style` harus objek.
5. **Angular tanpa `import.meta.env`** → build gagal. Di repo Angular alamat server jadi
   konstanta `BMKG_ORIGIN`.
6. **Vanilla: tombol kota tanpa `class="chip"`** → tampil tanpa gaya.

Semua di atas lolos `tsc`/build; hanya ketahuan dengan menjalankan halamannya.

## Status

Sudah diuji: keempat repo hidup bersamaan, masing-masing 6 iframe terisi, 10 chip kota,
pencarian "cibiru" memindahkan semua widget ke `-6.9145, 107.7230`, badge `Token OK`.

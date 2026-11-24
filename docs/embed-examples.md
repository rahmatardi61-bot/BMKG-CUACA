# Contoh pemasangan widget (evidence demo)

Halaman contoh untuk presentasi: memasang widget BMKG di **empat stack** dengan kontrak
yang sama. Dipakai untuk menunjukkan bahwa integrasi tidak bergantung pada Vue, dan tidak
memerlukan akses ke kode kita.

| Yang ingin ditunjukkan | Di mana |
|---|---|
| Integrasi cuma 2 baris | `vanilla/` |
| Framework modern pun polanya sama | `vue/`, `react/`, `angular/` |
| Token diambil & disegarkan otomatis | badge token di kanan atas, Network → `embed-token` |
| Token tidak ada di HTML | View Source semua halaman contoh |
| Tanpa token sah tidak ada data | buka `/embed.html` langsung → "Tidak diotorisasi" |
| Gerbang benar-benar menolak | ganti port halaman contoh → badge merah, 403 |

## Satu kontrak, empat stack

```html
<div data-bmkg-widget="current" data-city="Bandung"></div>
<script src="http://HOST:5173/api/embed-panel.js"></script>
```

Framework yang merender elemen **setelah** loader memindai halaman butuh satu tambahan:
`window.BMKGWidgets.scan()` setelah mount.

| Stack | Pemicu `scan()` | Lokasi kode |
|---|---|---|
| Vanilla | tidak perlu (HTML sudah ada saat loader jalan) | `vanilla/index.html` |
| Vue 3 | `onMounted` | `vue/index.html` |
| React 18 | `useEffect` | `react/index.html` |
| Angular 22 | `ngAfterViewInit` | `angular/src/app/bmkg-widget.component.ts` |

## Fungsi pendukung juga di-expose

Widget yang menampilkan wilayah butuh pilihan lokasi. Itu bukan tugas framework partner,
jadi servernya yang menyediakan — dan tiap halaman contoh memanggilnya **dari kodenya
sendiri**, bukan lewat iframe:

| Endpoint | Isi |
|---|---|
| `GET /api/widget-catalog` (Bearer) | 13 widget (id, nama, `needsCity`, `live`, catatan MOCK) + 10 kota + petunjuk pakai |
| `GET /api/widget-search?q=…` (Bearer) | kota kita + kelurahan/kecamatan via OpenStreetMap, dinormalisasi `{name, region, lat, lon}` |

Cara memanggilnya per stack (semuanya ± 10 baris): vanilla `addEventListener`, Vue
`watch`, React `useEffect`, Angular `onQuery()` + `ChangeDetectorRef`.

Pilihan lokasi lalu dipindahkan ke widget dengan **satu pesan**:

```js
window.postMessage({ type: 'bmkg-widget-place', label, lat, lon }, '*')
```

Loader meneruskannya ke semua iframe; widget memakai `?lat=&lon=` (bukan hanya 10 kota),
jadi kelurahan hasil pencarian juga bisa. Terbukti: pilih "Cibiru" → semua widget pindah
ke `-6.9145, 107.7230`.

### Kenapa `lat/lon`, bukan cuma `city`

Daftar kota kita hanya 10. Kalau widget hanya menerima nama kota, pencarian jadi sia-sia
(partner bisa memilih kelurahan tapi widget tidak bisa menampilkannya). `loadCity()` di
`useBmkgWeather` sudah menerima `coords` arbitrer, jadi ini hanya soal meneruskan
parameter — bukan perubahan arsitektur.

## Halaman /compare — bukti berdampingan

`/compare` (perlu login) menampilkan kartu yang **sama** dua kali:

- **kiri**: impor komponen Vue langsung (`<CurrentWeather :weather-data=…>`)
- **kanan**: iframe hasil embed (`/embed.html?widget=current&city=…`)

Satu pemilih kota menggerakkan keduanya, jadi perbedaan visual (kalau ada) bukan karena
sumber data berbeda. Token ke iframe dikirim lewat `postMessage`, bukan URL.

**Dua race yang sempat muncul dan sudah diperbaiki** (keduanya soal urutan waktu, bukan
logika):

1. Token dikirim saat `@load` → iframe belum memasang listener → hilang. Perbaikan:
   tunggu pesan `bmkg-embed-ready` dari iframe (jalur normal), `@load` jadi jaring pengaman.
2. Iframe minta token sebelum `getToken()` selesai → permintaan hilang. Perbaikan:
   `watch(token)` mengirim ulang ke semua iframe begitu token siap.

Gejalanya khas: 2 dari 3 iframe tampil, satu menulis "token tidak diterima dari halaman
pemasang". Kalau muncul lagi, curigai urutan, bukan isinya.

## Yang sengaja TIDAK dilakukan

Contoh di `bmkg_cuaca` mengimpor komponen langsung (`import CurrentWeather from
'.../components'`) dan itu **dibiarkan apa adanya** — itu aplikasi kita sendiri, bukan pola
yang dijual ke partner. Kalau sample embed memakai impor komponen, demo-nya menyesatkan:
partner tidak punya akses ke folder `components` kita.

## Alur token di halaman contoh

```
GET /api/embed-panel.js          publik, tanpa token (aman: tak ada rahasia di dalamnya)
  └─ GET /api/embed-token        server → Keycloak (client_secret hanya di server)
  └─ GET /api/embed-js?token=…   script inti, WAJIB token sah
  └─ eval(script)                buat iframe per [data-bmkg-widget]
  └─ postMessage                 token ke iframe (bukan URL)
```

Refresh: 60 detik sebelum `exp` (klaim JWT), plus saat tab kembali aktif bila sisa < 60
detik. Token baru diteruskan ke semua iframe; widget memakainya untuk fetch berikutnya
tanpa reload.

**Acuan kedaluwarsa adalah `exp` di dalam JWT, bukan `expires_at` dari `/api/embed-token`.**
Server memberi token dari cache, jadi `expires_at` bisa lebih panjang daripada umur token
sebenarnya — memakai yang optimistis membuat refresh datang terlambat (sempat 401).

## Origin gate

`/api/embed-token` memeriksa **header Origin** terhadap `EMBED_ALLOWED_ORIGINS`
(`api/embed-token.ts`), default:

```
http://localhost:8099, http://127.0.0.1:8099, http://localhost:8098, http://127.0.0.1:8098
```

Ganti port halaman contoh → harus ditambahkan di sana. Parameter `?origin=` **tidak**
dipakai sebagai izin: itu bisa dikarang lewat curl. Yang dipercaya hanya header yang
dikirim browser.

## Menjalankan

Lihat `bmkg-embed-examples/README.md`.

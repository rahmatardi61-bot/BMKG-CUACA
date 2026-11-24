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

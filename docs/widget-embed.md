# Widget Embed — sematkan kartu BMKG di website lain

Fitur: kartu dashboard BMKG bisa ditempel di web pihak lain dengan **1 div + 1 script**.
Kode: branch `feature/widget-embed`. Halaman dokumentasi & demo: **`/widgets`**.

## Keputusan desain (dan alasannya)

| Keputusan | Alasan |
|---|---|
| **iframe**, bukan inject DOM | Tailwind/Leaflet/z-index kita tidak bisa menabrak CSS host; CSS host juga tidak bisa merusak widget. Terbukti: halaman uji berlatar putih tetap putih setelah widget masuk. |
| Semua opsi **statis** | UI tidak bisa di-kustom (tanpa variabel warna). Keinginan "komponen ala Kiwitaxi" tidak dipakai: kartu kita jauh lebih kompleks daripada form. |
| Kota = **daftar tertutup** (10 kota) | Kota di luar `CITY_COORDS` tidak punya koordinat → bisa tampil kosong/pakai data mock. Widget tidak boleh menampilkan angka karangan di web orang lain. Kota tak dikenal → fallback `DKI Jakarta`. |
| Tanpa API key / pendaftaran | Data diambil dari layanan BMKG via app kita. |
| `/embed` **tanpa gate login** | Kalau di-gate, iframe di web klien akan menampilkan halaman login. |
| apiMarker **tidak** dipasang di `/widgets` & `/embed` | Panel dev hanya jadi noise di materi presentasi. |

## Arsitektur

```
embed.html                  entry Vite terpisah (bundle 2,7 kB)
src/embed/main.ts           mount + lapor tinggi ke parent via postMessage
src/embed/EmbedApp.vue      whitelist widget + kota; placeholder utk yang belum siap
public/embed.js             loader 2,1 kB: pasang iframe + auto-resize
src/pages/WidgetsPage.vue   dokumentasi /widgets (preview live + kode siap copy)
src/main.ts                 route /widgets (publik) + /embed (tanpa login)
vite.config.ts              dua entry (index.html + embed.html)
```

Alur: klien tempel `<div data-bmkg-widget="…">` + `<script src="…/embed.js">` →
loader membuat `<iframe src="/embed.html?widget=…">` → widget melaporkan tinggi aslinya
lewat `postMessage` → loader menyesuaikan `iframe.height`.

## Widget yang tersedia (4)

| ID | Nama | Query | Tinggi | Sumber data |
|---|---|---|---|---|
| `satellite` | Citra Satelit Himawari-9 | — | 420 | Tile API (mandiri, nol props) |
| `earthquake` | Gempa Bumi Terkini | `&city=` | 520 | TEWS (`EarthquakeHistory` fetch sendiri) |
| `alerts` | Peringatan Dini Cuaca | `&city=` | 340 | `useBmkgWeather().loadCity()` → `AlertsPanel :alerts` |
| `news` | Berita & Pengumuman | — | 420 | `useBmkgWeather().loadNews()` → `NewsSection :articles` |

`alerts`/`news` = komponen **presentasional** (props), jadi EmbedApp menyiapkan datanya
sendiri — pola sama seperti dashboard, tanpa mengubah komponen aslinya.

Belum siap (jujur ditampilkan di `/widgets`): Peta Maritim, Transportasi & Rute,
Aktivitas & Rekomendasi, Prakiraan 7 Hari. Widget tak dikenal → placeholder
"Widget belum tersedia", bukan error.

## Integrasi framework

Widget = HTML biasa, jalan di semua stack. Halaman `/widgets` memuat contoh Vue, React,
Angular, dan WordPress/HTML statis. Untuk konten dinamis (SPA): panggil
`window.BMKGWidgets.scan()` setelah render.

## Uji yang sudah dilakukan

- Halaman host tiruan (`file://`, CSS putih, font beda): 2 iframe terpasang,
  tinggi auto (420/888 px), **CSS host tidak terpengaruh**, 0 error.
- `/embed` tanpa login; `city=Atlantis` → fallback `DKI Jakarta`.
- 4 widget embed semua render data live (satelit 188 tile, gempa, alerts Surabaya, news).
- Tombol "Salin kode" diverifikasi menyalin teks yang benar ke clipboard.
- Tema dark/light di `/widgets` persist via `localStorage` (`bmkg-widget-theme`).
- `vue-tsc --noEmit` bersih.

## Catatan / risiko

- Beban server: tiap iframe = request API kita. Untuk demo/staging aman; kalau dipakai
  luas perlu rate-limit atau token.
- `origin` di kode dokumentasi mengikuti domain saat runtime (localhost saat dev).
- Belum diuji di domain publik/Vercel — `dist/embed.html` + `dist/embed.js` wajib ikut
  ter-deploy, dan jangan ada middleware yang memblokir `/embed`.
- Kalau klien minta "komponen React/Vue", jawabannya: bisa dipakai di framework apa pun,
  tetapi bukan npm package — itu fase terpisah (opsi migrasi), bukan versi ini.

# Konsumsi widget BMKG untuk membangun dashboard

Dokumen ini untuk **agen AI / developer** yang akan membangun halaman mirip dashboard BMKG
memakai widget embed kami. Semua isi halaman ini juga tersedia sebagai JSON:

- `/ai/widgets.json` - daftar 25 widget: id, judul, status data, sumber, ukuran default, interaksi
- `/ai/dashboard-blueprint.json` - layout & urutan region
- `/ai-docs.md` - dokumen ini (teks biasa)

Host: ganti `<host>` dengan alamat layanan (mis. `https://<host>/ai-docs.md`).

## 1. Prasyarat: autentikasi sudah diurus embed.js

Anggap Keycloak + kredensial **sudah** ada di sisi Anda. Anda **tidak perlu** meminta token,
menyimpan token, atau menulis logika refresh - `embed.js` yang membuat, memakai, dan
memperbarui token, lalu memanggil proxy kami. Jangan menaruh client secret / API key di halaman.

Yang Anda pakai hanya dua hal:

```html
<script src="https://<host>/embed.js" defer></script>
<div data-bmkg-widget="forecast" data-city="DKI Jakarta" data-theme="dark"></div>
```

Atribut: `data-bmkg-widget` (id dari `widgets.json`), `data-city` (wajib bila
`needsCity: true`), `data-theme` (`dark`/`light`), opsional `data-height`.

## 2. Layout

Ikuti `dashboard-blueprint.json`. Ringkasnya:

- Kontainer `max-width: 80rem`, padding 1rem / 1.5rem / 2rem (base/sm/lg).
- Grid: 1 kolom di bawah 1024px, 3 kolom di atasnya, gap 2rem.
- Region `top` (span 3) -> `main` (span 2) -> `sidebar` (span 1, `position: sticky; top: 6rem`).
- Urutan di dalam tiap region **persis** seperti kolom `order` pada blueprint.

Bagian dashboard yang **tidak** punya versi embed (jangan dibuat): hero cuaca besar,
tombol unduh aplikasi, berita, dan peta radar (dinonaktifkan).

## 3. Ukuran default (diukur dari dashboard, bukan dari halaman preview)

Pakai ukuran ini apa adanya; jangan memakai tinggi default halaman `/widgets`.

| id | judul | region | desktop (wxh) | mobile (wxh) | status | sumber |
|---|---|---|---|---|---|---|
| `search` | Pencarian Lokasi | extra | 384x105 | 358x120 | live | BMKG |
| `major-cities` | Kota-Kota Besar | main | 800x479 | 358x482 | mock | BMKG |
| `nearby-places` | Aktivitas Sekitar (Tempat & Peta) | extra | 800x294 | 358x280 | mock | MOCOMM |
| `alerts` | Peringatan Dini Cuaca | top | 1216x173 | 358x173 | live | BMKG |
| `current` | Kondisi Cuaca Saat Ini | main | 800x558 | 358x1023 | live | BMKG |
| `current-detail` | Rincian Kondisi Cuaca | extra | 800x575 | 358x700 | live | BMKG |
| `forecast` | Prakiraan Cuaca Per Jam | main | 800x540 | 358x563 | live | BMKG |
| `satellite` | Citra Satelit Himawari-9 | main | 800x390 | 358x420 | live | BMKG |
| `marine` | Peta Meteorologi Maritim | main | 800x694 | 358x610 | live | BMKG |
| `earthquake` | Gempa Bumi Terkini | main | 800x929 | 358x1456 | mixed | BMKG |
| `earthquake-params` | Laporan Parameter Gempa | extra | 384x434 | 358x443 | live | BMKG |
| `activity-comfort` | Indeks Kenyamanan | sidebar | 384x259 | 358x259 | mixed | BMKG |
| `activity-air` | Kualitas Udara (ringkasan) | sidebar | 384x295 | 358x295 | mock | BMKG |
| `activity-land` | Aktivitas Darat | sidebar | 384x234 | 358x234 | mixed | BMKG |
| `activity-coastal` | Aktivitas Pesisir & Laut | sidebar | 384x254 | 358x273 | mixed | BMKG |
| `activity-shipping` | Aktivitas Pelayaran | sidebar | 384x254 | 358x254 | mixed | BMKG |
| `activity-aviation` | Aktivitas Penerbangan | sidebar | 384x234 | 358x254 | mixed | BMKG |
| `transport` | Transportasi & Rute | sidebar | 384x444 | 358x459 | mock | BMKG |
| `port-tide` | Pasang Surut Pelabuhan | sidebar | 384x173 | 358x173 | live | BMKG |
| `wave` | Radar Tinggi Gelombang | extra | 800x504 | 358x536 | live | BMKG |
| `maritime-advisor` | Saran Maritim | overlay | 900x997 | 390x1056 | mock | BMKG |
| `aviation-advisor` | Saran Penerbangan | overlay | 900x1029 | 390x1083 | mock | BMKG |
| `land-activity` | Aktivitas Darat & Rute | overlay | 900x674 | 390x674 | mixed | BMKG |
| `around` | Detail Aktivitas Sekitar | overlay | 900x674 | 390x674 | mock | MOCOMM |
| `report` | Lapor Cuaca | overlay | 900x1234 | 390x1267 | mock | BMKG |

`region: extra` = bukan kartu dashboard; dipakai di dalam bagian lain
(`placement` di `widgets.json`), sementara `region: overlay` = tampil sebagai
lapisan penuh (drawer/panel).

## 4. Interaksi: overlay sudah ada di dalam iframe

Penting: setiap drawer, modal, dan panel penuh **dirender di dalam iframe widget**.
Jangan membuat modal/drawer sendiri di halaman induk - hasilnya dobel.

| id | butuh klik user? | yang muncul | alur |
|---|---|---|---|
| `nearby-places` | ya - kartu tempat | AroundActivityDrawer (inline di dalam kartu) | klik tempat -> drawer detail tempat |
| `earthquake` | ya - item gempa / tombol peta | modal detail kejadian atau peta full-screen | klik item gempa -> detail kejadian |
| `activity-land` | ya - kartu Aktivitas Darat | LandBasedActivities (full-screen) | klik kartu -> overview -> cari tempat -> pilih tempat -> rute |
| `activity-coastal` | ya - kartu Aktivitas Pesisir & Laut | MaritimeAdvisorDrawer | klik kartu -> drawer sektor maritim |
| `activity-shipping` | ya - kartu Aktivitas Pelayaran | MaritimeAdvisorDrawer | klik kartu -> drawer sektor pelayaran |
| `activity-aviation` | ya - kartu Aktivitas Penerbangan | AviationAdvisorDrawer | klik kartu -> drawer bandara |
| `maritime-advisor` | tidak | drawer penuh (widget ini sendiri overlay) | render langsung |
| `aviation-advisor` | tidak | drawer penuh (widget ini sendiri overlay) | render langsung |
| `land-activity` | tidak | panel penuh (widget ini sendiri overlay) | render langsung |
| `around` | tidak | drawer detail tempat (langsung terbuka) | render langsung |
| `report` | tidak | drawer form laporan (langsung terbuka) | render langsung |

Contoh rantai bertingkat: kartu **Kondisi Cuaca Saat Ini** memuat panel tempat;
klik salah satu tempat -> **Detail Aktivitas Sekitar** muncul sebagai drawer
**di dalam** widget `nearby-places`, bukan di halaman induk.

## 5. Status data

- `live` - nilai dari API BMKG (lewat proxy kami).
- `mixed` - sebagian API BMKG, sebagian hasil olahan aplikasi/statis.
- `mock` - data contoh di frontend. **Wajib** diberi label "data contoh" di UI Anda.

Field `mockPart` di `widgets.json` menyebut bagian mana yang masih contoh.
Widget dengan `sumber: MOCOMM` berarti datanya akan datang dari layanan internal
(kota/tempat) yang belum tersedia; sampai saat itu nilainya masih statis.

## 6. Checklist verifikasi

1. 25 widget termuat, tidak ada yang kosong/gagal.
2. Urutan region sama dengan blueprint; sidebar tetap menempel saat scroll.
3. Setiap widget yang `parentGesture: true` bisa membuka overlay-nya tanpa error.
4. Tidak ada dialog/modal ganda (satu dari iframe, satu dari halaman Anda).
5. Tinggi widget sesuai tabel di atas; jika konten terpotong, tambahkan tinggi iframe.
6. Widget `mock` diberi label data contoh.

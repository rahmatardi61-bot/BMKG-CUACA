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

## 1 server, banyak widget

Semua widget dilayani **satu aplikasi/domain** — pemisahnya hanya query `?widget=`.
Klien yang butuh 4 widget di satu halaman cukup 4 `<div>` + **1 script** (loader
dipakai bersama, dimuat sekali). Yang bertambah hanya jumlah iframe dan request API.

```
/embed.html?widget=satellite      ← halaman yang sama, parameter berbeda
/embed.html?widget=earthquake&city=DKI%20Jakarta
/embed.html?widget=alerts&city=Surabaya
/embed.html?widget=news
/embed.js                         ← 1 loader untuk semuanya
```

## Autentikasi (POC — Keycloak)

BE menyediakan Keycloak `client_credentials`:

```
POST {REALM_URL}/protocol/openid-connect/token
grant_type=client_credentials & client_id=partner-widget-service & client_secret=***
→ access_token (JWT, exp 300 detik)
```

**Keputusan POC:** widget meminta token ke **server kita** (`GET /api/embed-token`),
bukan langsung ke Keycloak dari browser — karena grant `client_credentials` butuh
`client_secret`, dan secret tidak boleh ada di browser. Partner yang sudah punya token
sendiri boleh mengirimkannya: `?token=<jwt>` dan widget langsung memakainya.

### Alur di widget

```
① iframe dimuat → animasi "Menyiapkan widget…" (spinner)
② fetch /api/embed-token  → server ambil token Keycloak (cache 4 menit)
③ token diterima → komponen memuat data BMKG
④ gagal → layar "Gagal menyiapkan widget" + alasan (bukan layar putih)
```

### Endpoint `api/embed-token.ts`

- Cache token per-instance (TTL `expires_in − 60s`), permintaan bersamaan digabung
  (`inflight`) supaya tidak menembak Keycloak berkali-kali
- Env: `KEYCLOAK_REALM_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`
  (secret **hanya** di server; `.env` gitignored)
- Terdaftar di `server.mjs` (dev/Docker) dan folder `api/` (Vercel)

### Batasan POC (disengaja, disepakati)

Ini POC internal untuk dev, bukan gerbang keamanan produksi:

- Token **tidak** divalidasi per-request; widget tetap jalan walau token tidak dikirim
- `client_credentials` = satu identitas untuk semua partner → tak ada rate-limit per
  partner, tak ada audit per partner
- Kalau ada penyalahgunaan → **blok manual** (rotasi `client_secret`, hapus izin)
- Ke depan: partner mendaftarkan IP/domain untuk di-allowlist manual; token sebaiknya
  lewat header/cookie (bukan query string) agar tidak bocor via log/Referer

## Tema widget

`?theme=dark|light|auto` (default `dark`). Komponen sudah punya varian `dark:`, jadi
EmbedApp cukup toggle class `dark` di `<html>`. `auto` mengikuti `prefers-color-scheme`.
Halaman `/widgets` meneruskan tema aktifnya ke setiap preview.

## Format kode di dokumentasi

Blok kode bergaya shell supaya bisa langsung dipakai:

```sh
# Citra Satelit Himawari-9
curl -s "https://DOMAIN/embed.html?widget=satellite" > widget-satellite.html

# atau sematkan di website:
<div data-bmkg-widget="satellite" data-height="420"></div>
<script async src="https://DOMAIN/embed.js"></script>
```

## Widget yang tersedia (12)

| ID | Nama | Query | Tinggi | Sumber data | Fallback MOCK |
|---|---|---|---|---|---|
| `satellite` | Citra Satelit Himawari-9 | — | 420 | Tile API (mandiri, nol props) | ❌ |
| `earthquake` | Gempa Bumi Terkini | `&city=` | 520 | TEWS (`EarthquakeHistory` fetch sendiri) | ❌ |
| `alerts` | Peringatan Dini Cuaca | `&city=` | 340 | `loadCity()` → `AlertsPanel :alerts` | ❌ (kosong → "tidak ada peringatan") |
| `news` | Berita & Pengumuman | — | 420 | `loadNews()` → `NewsSection :articles` | ✅ artikel mock |
| `forecast` | Prakiraan Cuaca Per Jam | `&city=` | 540 | `loadCity()` → `ForecastPanel :forecasts` | ❌ (kosong → pesan jujur) |
| `current` | Kondisi Cuaca Saat Ini | `&city=` | 520 | `loadCity()` → `HeroWeatherCard` | ❌ |
| `port-tide` | Pasang Surut Pelabuhan | `&city=` | 380 | Open Data `getNearestPelabuhan()` → `PortTideCard` | ❌ (upstream down → pesan jujur) |
| `air-quality` | Kualitas Udara (ISPU) | `&city=` | 420 | `AirQualityCard` (nilai deterministik per kota) | ✅ **selalu** MOCK |
| `transport` | Transportasi & Rute | `&city=` | 360 | `TransportWeather :statuses` (`transportStatusesMap`) | ✅ **selalu** MOCK |
| `major-cities` | Kota-Kota Besar | `&city=` | 400 | `MajorCitiesCarousel` (landmark statis) | ➖ tanpa data |
| `wave` | Radar Tinggi Gelombang | `&city=` | 480 | `WaveRadarMap` (zona live BMKG) | ❌ |
| `marine` | Peta Meteorologi Maritim | `&city=` | 600 | `MarineMap` (INAWAVES / Open Data live) | ❌ |

`alerts`/`news`/`forecast`/`current`/`port-tide`/`air-quality`/`transport` = komponen
**presentasional** (props), jadi EmbedApp menyiapkan datanya sendiri — pola sama seperti
dashboard, tanpa mengubah komponen aslinya. `satellite`/`earthquake`/`wave`/`marine`
mengambil datanya sendiri (dan `earthquake`/`wave`/`marine` butuh kota untuk titik peta).

Catatan teknis:
- `port-tide` menunggu `loadPort()` (di `loadCity()` hanya fire & forget), jadi datanya
  tidak kosong saat widget dibuka.
- `wave`/`marine` memakai Leaflet, dimuat lewat `defineAsyncComponent` — widget teks
  tidak ikut menanggung bundle peta.
- Basemap `wave` memakai Esri Dark Gray. CARTO (yang lama) sekarang minta API key dan
  menampilkan watermark "API KEY REQUIRED".

Belum dijadikan widget (jujur ditampilkan di `/widgets`): Aktivitas & Rekomendasi,
Penasihat Penerbangan, Penasihat Maritim, Pencarian Lokasi — semuanya drawer interaktif
atau bergantung input pengunjung, sehingga tidak masuk akal dibekukan di iframe.
Widget tak dikenal → placeholder "Widget belum tersedia", bukan error.

### Kebijakan data MOCK (penting untuk transparansi)

Tiga widget memakai data MOCK, dengan alasan berbeda:

| Widget | Kenapa MOCK |
|---|---|
| `news` | Endpoint WordPress BMKG sering 502 → fallback artikel contoh |
| `air-quality` | BMKG tidak punya API ISPU publik; nilai dihitung deterministik per kota |
| `transport` | Tidak ada API status transportasi publik |

`air-quality` dan `transport` **selalu** memberi label MOCK karena datanya memang bukan
pengukuran resmi — bukan fallback saat gagal. Untuk `air-quality`, waktu "Dilukur pukul
…" juga hasil hitungan, bukan jam pengukuran sungguhan.

Bila `news` gagal:

- widget tetap tampil (tidak kosong) dengan artikel contoh dari `data/mockData.ts`
- muncul **badge kuning "Data contoh (MOCK) — layanan BMKG sedang tidak tersedia"** di
  atas widget (`isMock` + ikon `FlaskConical`)
- di halaman `/widgets`, kartu Berita diberi badge **"MOCK fallback"** + catatan
  penjelasan, dan ada panel **"Tentang data contoh (MOCK)"** yang merinci widget mana
  yang bisa mock dan mana yang tidak

Widget lain **tidak** memakai mock: gagal = pesan jujur ("Prakiraan tidak tersedia",
"Tidak ada peringatan dini aktif", "Data pasut tidak tersedia"). Ini disengaja — lebih baik kosong dengan penjelasan
daripada menampilkan angka karangan di website pihak lain.

## Integrasi framework

Widget = HTML biasa, jalan di semua stack. Halaman `/widgets` memuat contoh Vue, React,
Angular, dan WordPress/HTML statis. Untuk konten dinamis (SPA): panggil
`window.BMKGWidgets.scan()` setelah render.

## Uji yang sudah dilakukan

- Halaman host tiruan (`file://`, CSS putih, font beda): 2 iframe terpasang,
  tinggi auto (420/888 px), **CSS host tidak terpengaruh**, 0 error.
- `/embed` tanpa login; `city=Atlantis` → fallback `DKI Jakarta`.
- **12 widget** diuji satu per satu (`?widget=…&city=Surabaya`): 12/12 render tanpa
  error JS, tanpa "Gagal menyiapkan widget", tanpa watermark API key.
- `port-tide` sempat tampil "Data pasut tidak tersedia" — **bukan bug**: saat diuji
  `maritim.bmkg.go.id/public_api` memang 503. Empty state jujur.
- `wave`: basemap CARTO memunculkan watermark "API KEY REQUIRED" → diganti Esri Dark Gray.
- `transport` & `major-cities`: komponen aslinya tanpa padding (di dashboard dibungkus
  kolom) → dibungkus `p-4` di embed agar tidak menempel tepi iframe.
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

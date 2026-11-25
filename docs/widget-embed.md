# Widget Embed — sematkan kartu BMKG di website lain

> **Status: POC (proof of concept) untuk pengembangan internal — belum untuk konsumsi publik.**
> Keterbatasan terbesar bukan di tampilan, tapi di **akses data**: sebagian API BMKG menutup
> CORS dan mewajibkan header khusus (diakali lewat proxy sendiri), sebagian lagi tidak punya
> API sama sekali (scraping / data contoh). Tidak ada kontrak atau SLA yang bisa dipegang.
> Rincian: lihat **§ Status & batasan** di bawah.
>
> **Sejak revisi terakhir, widget dijaga token Keycloak**: tanpa token sah, `/api/embed-js`
> dan `/api/bmkg` menolak (401). Snippet lama "tempel script, langsung jalan" sudah tidak
> berlaku — `public/embed.js` kini hanya stub pemberi tahu. Rincian: **§ Autentikasi**.

Fitur: kartu dashboard BMKG bisa ditempel di web pihak lain dengan **1 div + 1 token**
(+ loader). Kode: branch `feature/widget-embed`. Dokumentasi & demo: **`/widgets`**.

## Keputusan desain (dan alasannya)

| Keputusan | Alasan |
|---|---|
| **iframe**, bukan inject DOM | Tailwind/Leaflet/z-index kita tidak bisa menabrak CSS host; CSS host juga tidak bisa merusak widget. Terbukti: halaman uji berlatar putih tetap putih setelah widget masuk. |
| Semua opsi **statis** | UI tidak bisa di-kustom (tanpa variabel warna). Keinginan "komponen ala Kiwitaxi" tidak dipakai: kartu kita jauh lebih kompleks daripada form. |
| Kota = **daftar tertutup** (10 kota) | Kota di luar `CITY_COORDS` tidak punya koordinat → bisa tampil kosong/pakai data mock. Widget tidak boleh menampilkan angka karangan di web orang lain. Kota tak dikenal → fallback `DKI Jakarta`. |
| **Token Keycloak wajib** | Widget memuat data BMKG lewat proxy kita; tanpa gerbang, siapa pun bisa memakai kapasitas kita. Token dibuat backend partner, diverifikasi tanda tangannya (JWKS) di tiap pintu. |
| Token iframe lewat **`postMessage`**, bukan URL | URL iframe terlihat di devtools & Referer; `postMessage` tidak meninggalkan jejak. `?token=` hanya disisakan untuk uji cepat. |
| `/embed` **tanpa gate login** | Kalau di-gate, iframe di web klien akan menampilkan halaman login. |
| apiMarker **tidak** dipasang di `/widgets` & `/embed` | Panel dev hanya jadi noise di materi presentasi. |

## Arsitektur

```
embed.html                     entry Vite terpisah
src/embed/main.ts              mount + lapor tinggi ke parent via postMessage
src/embed/EmbedApp.vue         whitelist widget+kota; terima token via postMessage
api/_lib/jwt.ts                verifikasi RS256 lewat JWKS (WebCrypto, tanpa dep)
api/_lib/embedSource.ts        isi script loader (dikirim hanya ke pemegang token)
api/embed-js.ts                kunci 1: kirim loader / 401
api/embed-verify.ts            kunci 2: sah-tidaknya token
api/bmkg.ts                    kunci 4: proxy data BMKG (wajib Bearer)
api/embed-token.ts             simulasi backend partner (POC): mint token
public/bmkg-embed.js           loader publik: fetch ber-token + eval (aman dibagikan)
public/embed.js                stub: memberi tahu snippet lama sudah tidak dipakai
src/services/embedToken.ts     getToken/decode/adopt (klien)
src/pages/WidgetsPage.vue      dokumentasi /widgets (Generate token + preview)
vite.config.ts                 dua entry (index.html + embed.html)
```

Alur: partner tempel `<div data-bmkg-widget="…">` → `BmkgWidget.init({token})` →
loader fetch `/api/embed-js` dengan `Authorization` → script inti membuat
`<iframe src="/embed.html?widget=…">` (tanpa token di URL) → iframe kirim
`bmkg-embed-ready`, parent balas token → widget verifikasi ke server, ambil data,
lapor tinggi lewat `postMessage` → loader menyesuaikan `iframe.height`.

## 1 server, banyak widget

Semua widget dilayani **satu aplikasi/domain** — pemisahnya hanya query `?widget=`.
Klien yang butuh 4 widget di satu halaman cukup 4 `<div>` + **1 script** (loader
dipakai bersama, dimuat sekali). Yang bertambah hanya jumlah iframe dan request API.

```
/embed.html?widget=satellite      ← halaman yang sama, parameter berbeda
/embed.html?widget=earthquake&city=DKI%20Jakarta
/embed.html?widget=alerts&city=Surabaya
/embed.html?widget=news
/api/embed-js                     ← 1 script (butuh token) untuk semuanya
```

## Autentikasi — 4 kunci, 1 verifikator

Widget **tidak lagi terbuka untuk siapa saja**. Tanpa token Keycloak yang sah, tidak ada
satu pun data yang keluar. Ada empat pintu, semuanya diperiksa dengan fungsi yang sama
(`verifyJwt` di `api/_lib/jwt.ts`, verifikasi tanda tangan RS256 + `exp` + `iss`):

| Kunci | Endpoint | Tanpa token sah |
|---|---|---|
| 1 | `GET /api/embed-js` (script loader) | `401` — script inti tidak pernah diterima, tidak ada iframe dibuat |
| 2 | `GET /api/embed-verify` (cek token) | `401` — widget menolak membuka |
| 3 | `embed.html` (shell widget) | layar "Tidak diotorisasi" |
| 4 | `GET /api/bmkg` (data BMKG) | `401` — data tidak bisa diambil |

Kunci 4 yang paling penting: shell HTML statis tidak bisa dijaga tanpa SSR, tapi shell
itu **tidak berisi data**. Yang dijaga adalah data.

### Alur (dari sisi partner)

```
① backend partner  → POST Keycloak (client_credentials) → JWT 300 detik
                      client_id/secret di .env server partner, TIDAK di browser
② halaman partner  → fetch('/api/embed-js', {Authorization: Bearer <jwt>})
③ server kita      → verifikasi tanda tangan dengan JWKS → 200 / 401
④ loader           → <iframe src="/embed.html?widget=…">  (tanpa token di URL)
⑤ iframe           → postMessage 'bmkg-embed-ready' → parent balas token
⑥ widget           → fetch('/api/embed-verify') → sah? → ambil data /api/bmkg (Bearer)
```

Token **tidak** ditaruh di URL iframe (tidak muncul di log akses, Referer, atau riwayat).
Satu token dipakai ulang oleh semua widget di halaman itu.

### Setup di sisi partner

1. **Simpan kredensial di server**, bukan di browser:

   ```bash
   # .env server partner (bukan .env frontend)
   KEYCLOAK_REALM_URL=https://auth-dev-bmkg.vedata.online/realms/bmkg-partner
   KEYCLOAK_CLIENT_ID=partner-widget-service
   KEYCLOAK_CLIENT_SECRET=<diberikan BMKG>
   ```

2. **Mint token di backend** + cache sampai ~1 menit sebelum `exp`:

   ```js
   // GET /token  (endpoint milik partner, dipanggil halaman mereka)
   const r = await fetch(`${process.env.KEYCLOAK_REALM_URL}/protocol/openid-connect/token`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({
       grant_type: 'client_credentials',
       client_id: process.env.KEYCLOAK_CLIENT_ID,
       client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
     }),
   })
   const { access_token } = await r.json()
   ```

3. **Verifikasi tanda tangan dengan JWKS** sebelum token dipakai (decode saja tidak
   cukup — payload bisa diubah siapa pun):

   ```js
   const jwks = await (await fetch(`${REALM}/protocol/openid-connect/certs`)).json()
   // ambil key sesuai header.kid, importKey (RSASSA-PKCS1-v1_5/SHA-256), verify
   // lalu cek: signature cocok, exp belum lewat, iss = realm URL
   ```
   Referensi kerja: `api/_lib/jwt.ts` (WebCrypto, tanpa dependency).

4. **Pasang widget** — pilih salah satu:

   ```html
   <!-- A. loader publik (mudah) -->
   <div data-bmkg-widget="current" data-city="Bandung"></div>
   <script src="https://DOMAIN/bmkg-embed.js"></script>
   <script>BmkgWidget.init({ token: '<JWT>' })</script>

   <!-- B. fetch + eval manual -->
   <script>
     window.BMKG_EMBED_TOKEN = '<JWT>'
     fetch('https://DOMAIN/api/embed-js', { headers: { Authorization: 'Bearer ' + window.BMKG_EMBED_TOKEN } })
       .then(r => r.ok ? r.text() : Promise.reject('HTTP ' + r.status))
       .then(code => (0, eval)(code))
   </script>
   ```

   Var A memakai `fetch` + `eval` di dalam. **CSP ketat** (tanpa `'unsafe-eval'`)
   memblokir keduanya — lihat catatan di bawah.

### Indikator di `/widgets`

Halaman dokumentasi **tidak** meminta token otomatis (berbeda dari dashboard `/`), supaya
kelihatan bahwa token adalah urusan partner:

| Di mana | Cara | Artinya |
|---|---|---|
| `/widgets` | Tombol **Generate token** → JWT tampil + panel decode (`alg`, `azp`, `iss`, `exp`, `roles`) + badge **VALID / KEDALUWARSA / DITOLAK** + hitung mundur | Decode = tampilan. Baris "Tanda tangan (JWKS server): cocok" = hasil verifikasi sebenarnya |
| `/widgets` | Preview terkunci sebelum token ada | Sama seperti di situs partner: tanpa token, widget tidak tampil |
| `/` (dashboard) | Badge `TOKEN OK 240s` kanan bawah | Halaman ini berperan sebagai "situs partner": mint saat load, semua `/api/bmkg` membawa token |
| Widget | `&debug=1` | Strip: `auth: OK · sumber=parent · berlaku=278s` atau `auth: GAGAL · <sebab>` |
| Konsol | devtools | `[bmkg-widget] auth OK (sumber=parent, berlaku=278s)` |

Tombol Generate mensimulasikan **backend partner** (server kita yang memegang
`client_secret`). Di produksi tombol itu tidak ada — token datang dari server partner.

### Endpoint

| Endpoint | Fungsi |
|---|---|
| `GET /api/embed-token` | **Simulasi backend partner** (POC): tukar `client_credentials` → `{token, expires_in, expires_at}`. Cache TTL `expires_in−60s`, permintaan bersamaan digabung. **Hanya boleh dipanggil dari origin sendiri** (403 untuk `Origin` lain) — kalau tidak, semua gerbang di atas sia-sia karena siapa pun bisa mengambil token |
| `GET /api/embed-js` | Kirim script loader (200) atau `401` |
| `GET /api/embed-verify` | `{valid, reason, azp, iss, exp, expires_in, roles}` |
| `GET /api/bmkg` | Proxy BMKG — wajib `Authorization: Bearer` |

Env server: `KEYCLOAK_REALM_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`
(`.env` gitignored). JWKS di-cache 10 menit per instance — **Keycloak mati tidak
mematikan widget**, key lama masih bisa memverifikasi.

### Kegagalan yang sering (sudah diuji)

| Gejala | Penyebab |
|---|---|
| `502` + `Keycloak 401: unauthorized_client` | `client_secret` salah / sudah dirotasi |
| `502` + `KEYCLOAK_CLIENT_SECRET belum di-set` | env tidak terbaca (Vercel: set env lalu Redeploy) |
| `401` + `tanda tangan tidak cocok` | payload token diubah orang lain — verifikasi bekerja |
| `401` + `kid tidak ada di JWKS` | realm/URL JWKS salah |
| Widget kosong, **tanpa** pesan | `embed.js` lama masih tertempel → ganti ke `bmkg-embed.js` |
| `403` dari `/api/embed-token` | dipanggil dari origin lain — memang dilarang (keran token) |

### Shortcut yang disengaja (dan kapan harus diganti)

| Shortcut | Batasannya | Kapan diganti |
|---|---|---|
| `client_id` tunggal untuk semua partner | token partner A berlaku juga di B; tak bisa cabut/rate-limit per partner | sebelum produksi: 1 client per partner di Keycloak |
| `eval` script loader | diblokir CSP ketat milik situs partner | kalau ada partner ber-CSP ketat: pindah ke endpoint verifikasi + loader lokal |
| `?token=` di URL (mode iframe manual) | token tertinggal di log/Referer | jangan dipakai produksi — pakai `postMessage` (sudah jadi default) |
| Verifikasi `exp` belum diuji dengan token kedaluwarsa asli | butuh token ber-`exp` lampau yang ditandatangani | saat ada tooling uji token |
| `/api/embed-token` masih hidup di POC | keran token; dijaga same-origin saja, `curl` tetap lolos | **hapus endpoint ini saat produksi** — token hanya dari backend partner |

Pencabutan akses masih manual: rotasi `client_secret` di Keycloak → semua token baru gagal.

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

## Token & auto-refresh

`/widgets` meminta token saat tombol **Generate token** ditekan — bukan saat
halaman dibuka. Setelah itu token diperbarui sendiri **60 detik sebelum habis**
(umur token 300 dtk), sampai halaman ditinggalkan. Kalau permintaan token gagal,
token lama tetap dipakai: preview yang sudah tampil tidak boleh mati gara-gara
jaringan.

Token baru dikirim ke iframe yang sudah terpasang lewat
`postMessage {type:'bmkg-embed-token'}` — **bukan** dengan me-remount iframe.
Karena itu `gen.at` sengaja **tidak** ikut di `:key` iframe: dulu ikut, dan
setiap token baru membuat 23 iframe memuat ulang bersamaan.

Ini hanya untuk halaman dokumentasi (simulasi sisi partner). Loader
`bmkg-embed.js` **tidak** menyegarkan token sendiri — di produksi itu tugas
backend partner. `BmkgWidget.init()` mengembalikan `Promise<boolean>`; `false`
berarti token ditolak dan partner perlu minta token baru.

## Widget yang tersedia (25)

Urutan tabel = urutan render `src/pages/MainDashboard.vue`, supaya membandingkan
`/widgets` dengan `/dashboard` gampang. Urutan yang sama dipakai
`api/widget-catalog.js` dan daftar di `/widgets`.

| ID | Nama | Query | Sumber data | Fallback MOCK |
|---|---|---|---|---|
| `alerts` | Peringatan Dini Cuaca | `&city=` | `loadCity()` → `AlertsPanel :alerts` | ❌ (kosong → "tidak ada peringatan") |
| `current` | Kondisi Cuaca Saat Ini | `&city=` | `loadCity()` → `HeroWeatherCard` | ❌ |
| `search` | Pencarian Lokasi | — | `EmbedSearch` + `/api/widget-search` → **API BMKG** | ❌ |
| `major-cities` | Kota-Kota Besar | — | `MajorCitiesCarousel` (landmark statis) | ➖ tanpa data |
| `current-detail` | Rincian Kondisi Cuaca | `&city=` | `loadCity()` → `CurrentWeather` | ❌ |
| `forecast` | Prakiraan Cuaca Per Jam | `&city=` | `loadCity()` → `ForecastPanel :forecasts` | ❌ (kosong → pesan jujur) |
| `satellite` | Citra Satelit Himawari-9 | — | Tile API (mandiri, nol props) | ❌ |
| `marine` | Peta Meteorologi Maritim | `&city=` | `MarineMap` (INAWAVES / Open Data live) | ❌ |
| `radar` | Radar & Dinamika Atmosfer | `&city=` | `WeatherRadarMap` (medan sintetis) | ✅ **selalu** MOCK |
| `earthquake` | Gempa Bumi Terkini | `&city=` | TEWS (`EarthquakeHistory` fetch sendiri) | ❌ |
| `activity-comfort` | Indeks Kenyamanan | `&city=` | `WeatherActivity section="comfort"` | ➖ narasi dihitung sendiri |
| `activity-air` | Kualitas Udara (ringkasan) | `&city=` | `WeatherActivity section="air"` | ✅ **selalu** MOCK |
| `air-quality` | Kualitas Udara (ISPU) | `&city=` | `AirQualityCard` — kartu mandiri | ✅ **selalu** MOCK |
| `activity-land` | Aktivitas Darat | `&city=` | `WeatherActivity section="land"` | ➖ narasi dihitung sendiri |
| `activity-coastal` | Aktivitas Pesisir & Laut | `&city=` | `WeatherActivity section="coastal"` | ➖ idem |
| `activity-shipping` | Aktivitas Pelayaran | `&city=` | `WeatherActivity section="shipping"` | ➖ idem |
| `activity-aviation` | Aktivitas Penerbangan | `&city=` | `WeatherActivity section="aviation"` | ➖ idem |
| `transport` | Transportasi & Rute | `&city=` | `TransportWeather :statuses` (`transportStatusesMap`) | ✅ **selalu** MOCK |
| `port-tide` | Pasang Surut Pelabuhan | `&city=` | Open Data `getNearestPelabuhan()` → `PortTideCard` | ❌ (upstream down → pesan jujur) |
| `wave` | Radar Tinggi Gelombang | `&city=` | `WaveRadarMap` (zona live BMKG) | ❌ |
| `maritime-advisor` | Saran Maritim | `&city=&sector=` | `MaritimeAdvisorDrawer` (inline) | ➖ sektor default `shipping` |
| `aviation-advisor` | Saran Penerbangan | `&city=&sector=` | `AviationAdvisorDrawer` (inline) | ➖ sektor default `commercial` |
| `land-activity` | Aktivitas Darat & Rute | `&city=&destLat=&destLng=` | `LandBasedActivities` (inline) | ➖ tujuan contoh |
| `around` | Detail Aktivitas Sekitar | `&city=` | `AroundActivityDrawer` (inline) | ➖ satu aktivitas contoh |
| `report` | Lapor Cuaca | `&city=` | `EmbedWeatherReport` + `useWeatherReport` | ➖ laporan tidak dikirim |

Tinggi kartu tidak lagi ditulis di tabel ini: sejak auto-resize, iframe
menyesuaikan tinggi isinya (`bmkg-widget-height`). `data-height` hanya dipakai
di `/widgets` sebagai tinggi awal preview.

### Section aktivitas dipecah per kartu

Di dashboard, `WeatherActivity` adalah **satu kolom berisi 6 kartu**. Semua
kartu itu kini jadi widget sendiri — **tidak ada lagi widget paketan**:

| Kartu dashboard | Widget |
|---|---|
| Indeks Kenyamanan | `activity-comfort` |
| Kualitas Udara (AQI) | `activity-air` |
| Aktivitas Darat | `activity-land` |
| Aktivitas Pesisir & Laut | `activity-coastal` |
| Aktivitas Pelayaran | `activity-shipping` |
| Aktivitas Penerbangan | `activity-aviation` |

`air-quality` (kartu ISPU mandiri, `AirQualityCard`) **tidak** dirender di
dashboard — hanya tersedia sebagai widget. Bedanya dengan `activity-air`:
`activity-air` kartu ringkas milik section aktivitas, `air-quality` kartu ISPU
lebih besar dengan meter AQI dan ambang PM2.5/PM10.

Caranya bukan menduplikasi 500 baris markup: `WeatherActivity` menerima prop
`section` (`comfort` / `air` / `land` / `coastal` / `shipping` / `aviation`) dan
memberi `v-if` pada tiap kartu. Tanpa prop = semua kartu (dipakai dashboard).

Kartu-kartu ini didesain untuk kolom sidebar dashboard (~380 px), jadi di embed
lebarnya dibatasi `max-w-[400px]` dan ditengahkan. Kalau dibiarkan selebar
iframe, ilustrasi latarnya menumpuk teks dan terlihat terpotong.

### Kartu yang butuh pilihan pengunjung → pakai default

`maritime-advisor`, `aviation-advisor`, `land-activity`, `around` dan `report` di
dashboard hanya terbuka setelah pengunjung mengklik sesuatu (pilih sektor, pilih
destinasi, buka form). Di embed belum ada jalur untuk mengoper pilihan itu, jadi
dipakai nilai default yang paling wajar. Keterbatasan ini **dicatat di katalog**
(`mock`) dan di halaman `/widgets`, bukan disembunyikan.

Solusi "drawer di dalam iframe": komponen diberi prop `inline`. Saat `true`:
Teleport dimatikan, `fixed inset-0` diganti blok `relative`, backdrop dan tombol
tutup disembunyikan, dan `fullscreen-map-container` (yang memaksa `100vh`) tidak
dipakai. Tanpa ini, drawer muncul sebagai overlay setinggi iframe dengan latar gelap
dan tombol X yang tidak melakukan apa pun.

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

## Status & batasan

Angka ini juga tampil di halaman `/widgets` supaya bisa dipakai sebagai bahan diskusi.

| | Jumlah |
|---|---|
| Widget siap di-embed | 12 |
| Bisa dibuat, belum dikerjakan | 5 |
| Butuh klik pengunjung (tidak mungkin jadi widget) | 4 |
| Widget yang selalu MOCK | 2 (`air-quality`, `transport`) |

### Asal data — seberapa resmi isinya

| Jalur | Host | Konsekuensi | Dipakai widget |
|---|---|---|---|
| API internal BMKG (via proxy) | `cuaca.bmkg.go.id` | CORS ditutup → wajib proxy same-origin `/api/bmkg`; header `Referer`/`Origin`, `X-API-KEY`, dan `x-public-token` (diambil ulang tiap ~25 menit) | cuaca, prakiraan, peringatan |
| Open Data BMKG (CORS terbuka) | `publik.bmkg.go.id`, `maritim.bmkg.go.id` | Bisa dipanggil langsung; dipakai sebagai fallback prakiraan dan sumber data maritim | pasut, gelombang, peta maritim |
| Tile & gambar (tanpa CORS) | `satellite.bmkg.go.id`, `inderaja.bmkg.go.id` | Satelit = tile JSON (CORS `*`). inderaja tanpa CORS → hanya lewat `<img>`, tidak bisa dibaca sebagai data | satelit |
| Scraping halaman publik | `www.bmkg.go.id`, situs berita | Tidak ada API resmi; rapuh — struktur halaman bisa berubah tanpa pemberitahuan | berita, gempa (TEWS) |
| Data contoh (MOCK) | `src/data/mockData.ts` | Nilai dihitung sendiri/dari data contoh; widget SELALU berlabel MOCK | kualitas udara, transportasi |

Konsekuensi: perubahan kecil di sisi BMKG (header, struktur halaman, CORS) bisa mematikan
widget tanpa peringatan.

### Bisa dibuat, belum dikerjakan (5)

| Kartu | Alasan belum |
|---|---|
| Current Weather Overview | Isinya hampir sama dengan widget `current` → akan jadi duplikat |
| Aktivitas & Rekomendasi | Narasi dihitung dari `cityAnalysisMap` (mock) → harus berlabel MOCK |
| Radar Cuaca | Partikel angin & suhu stasiun dihitung di browser, bukan produk radar BMKG → MOCK |
| Peta Angin | Sama: medan angin adalah animasi hasil hitungan, bukan observasi |
| Around Activity | Daftar lapangan golf dari data contoh; komponennya sudah tidak dipakai di dashboard |

### Butuh klik pengunjung — tidak akan pernah jadi widget (4)

Semuanya drawer/modal dengan prop `isOpen`. Dibekukan di iframe hasilnya kotak kosong
tanpa jalan masuk:

| Komponen | Alasan |
|---|---|
| `LandBasedActivities` | Drawer `isOpen` — harus dibuka pengunjung |
| `MaritimeAdvisorDrawer` | Drawer: pengunjung memilih sektor, narasi dihitung dari data contoh |
| `AviationAdvisorDrawer` | Drawer: butuh input bandara/sektor |
| `LocationSearch` | Sudah tercakup parameter `?city=` pada widget lain |

### Yang dibutuhkan sebelum naik ke produksi

1. **Akses API resmi + dokumentasi + sample data** — sekarang semuanya diakali lewat proxy
   dan scraping, tanpa kontrak tertulis.
2. **Kebijakan token per partner** — saat ini semua partner memakai satu `client_id`
   (`partner-widget-service`), jadi tidak ada rate-limit maupun audit per partner.
3. **Pendaftaran IP/domain partner** — supaya widget hanya bisa dipasang pihak resmi.
4. **Token di header/cookie, bukan URL** — URL bocor lewat log akses, `Referer`, riwayat browser.
5. **Pemantauan kegagalan upstream** — tanpa ini widget yang mati tidak ketahuan.
6. **Kejelasan soal data MOCK** — pemasang perlu tahu ISPU/transportasi bukan data resmi BMKG.

## Integrasi framework

Widget = HTML biasa, jalan di semua stack. Halaman `/widgets` memuat contoh Vue, React,
Angular, dan WordPress/HTML statis. Untuk konten dinamis (SPA): panggil
`window.BMKGWidgets.scan()` setelah render.

## Uji yang sudah dilakukan

- Halaman host tiruan (`file://`, CSS putih, font beda): 2 iframe terpasang,
  tinggi auto (420/888 px), **CSS host tidak terpengaruh**, 0 error.
- `/embed` tanpa login; `city=Atlantis` → fallback `DKI Jakarta`.
- **25 widget** diuji satu per satu (`?widget=…&city=Surabaya`): 25/25 render tanpa
  error JS, tanpa "Gagal menyiapkan widget", tanpa watermark API key. Tinggi hasil
  ukur berkisar 98 px (`alerts` tanpa peringatan) sampai 1327 px (`activity`).
- `/widgets`: 25 kartu preview — seluruh iframe terisi setelah di-scroll (iframe
  di bawah fold dimuat saat masuk viewport).
- Pencarian lokasi diuji dengan sumber baru: `q=sleman` → hasil BMKG asli
  (`Trimulyo`, `Pandowoharjo`, `Tridadi`, `Triharjo`) di dashboard **dan** di
  widget `search`.
- Auto-refresh token `/widgets`: token berganti setelah 230 dtk (umur 300 dtk,
  refresh dipicu pada sisa ≤60 dtk), **iframe tidak di-remount** (dataset penanda
  bertahan) → tidak ada kedip.
- `port-tide` sempat tampil "Data pasut tidak tersedia" — **bukan bug**: saat diuji
  `maritim.bmkg.go.id/public_api` memang 503. Empty state jujur.
- `wave`: basemap CARTO memunculkan watermark "API KEY REQUIRED" → diganti Esri Dark Gray.
- `transport` & `major-cities`: komponen aslinya tanpa padding (di dashboard dibungkus
  kolom) → dibungkus `p-4` di embed agar tidak menempel tepi iframe.
- Tombol "Salin kode" diverifikasi menyalin teks yang benar ke clipboard.

**Gerbang token (uji setelah revisi auth):**

| Uji | Hasil |
|---|---|
| `<iframe src="/embed.html?widget=current">` tanpa token | layar "Tidak diotorisasi" |
| `<script src="/embed.js">` (snippet lama) | stub kuning: "sudah tidak dipakai" |
| `<script src="/api/embed-js">` tanpa header | 0 iframe (server balas 401 JSON) |
| `BmkgWidget.init({})` tanpa token | kotak merah, 0 iframe, tanpa unhandled rejection |
| `BmkgWidget.init({token})` token sah | 1 iframe, widget render, **token tidak muncul di URL** |
| Token diubah 1 byte (payload tetap JSON valid) | `401 tanda tangan tidak cocok` — verifikasi nyata, bukan decode |
| `/api/bmkg` tanpa token | 401, 0 request diteruskan ke upstream |
| Dashboard `/` | mint otomatis saat load, badge `TOKEN OK <sisa>s`, 11 panggilan `/api/bmkg` 200, 0 request tanpa `Authorization` |
| `/widgets` | 0 request token sebelum tombol diklik; setelah klik: 1 mint untuk 12 iframe (token di-`adopt`, tiap widget tidak mint sendiri) |
| Preview `/widgets` sebelum token | terkunci (placeholder), setelah Generate → 12 iframe render |
- Tema dark/light di `/widgets` persist via `localStorage` (`bmkg-widget-theme`).
- `vue-tsc --noEmit` bersih.

## Catatan / risiko

- Beban server: tiap iframe = request API kita + 1 verifikasi tanda tangan (murah, key
  di-cache). Yang mahal hanya cold start JSKS (sekali per instance).
- **Dev berbeda dari prod**: di dev, data BMKG lewat proxy path-style Vite
  (`/api/df/...`) yang tidak dijaga token. Uji gerbang harus lewat `npm run build` +
  `node server.mjs` (atau domain publik), bukan `npm run dev`.
- Belum diuji di domain publik/Vercel — `dist/embed.html` wajib ikut ter-deploy,
  `/api/embed-js` + `/api/embed-verify` harus terdeteksi sebagai function, dan jangan
  ada middleware yang memblokir `/embed`. `vercel.json` rewrite catch-all ke
  `index.html` **tidak** menimpa `/api/*`, tapi tolong dicek saat deploy.
- Verifikasi `exp` (token kedaluwarsa) belum diuji dengan token asli ber-`exp` lampau —
  butuh private key Keycloak untuk membuatnya. Jalur kodenya: signature dulu, lalu `exp`.
- jsDelivr/CDN tidak dipakai: script inti memang harus lewat server kita (itu gerbangnya).
- **Uji dari halaman `https://` ke `http://localhost` selalu gagal** — bukan bug widget:
  Chrome memblokir lewat *Private Network Access* (`blocked by CORS policy: Permission was
  denied for this request to access the 'loopback' address space`) dan juga *mixed content*.
  Uji dari halaman `http://` (localhost/`file://`), atau pakai tunnel (ngrok/cloudflared)
  bila butuh https. Di produksi https→https tidak kena aturan ini.
- Kalau klien minta "komponen React/Vue", jawabannya: bisa dipakai di framework apa pun,
  tetapi bukan npm package — itu fase terpisah (opsi migrasi), bukan versi ini.

---

## Loader publik `embed-panel.js` (khusus demo)

`/api/embed-panel.js` adalah **satu file publik** yang menggabungkan "minta token" +
"muat script inti" + "tampilkan status token". Dipakai halaman contoh di
`../bmkg-embed-examples`, bukan oleh partner produksi.

- Publik & tanpa token — isinya tidak berisi rahasia, hanya panggilan ke endpoint kita
- Meminta token ke `/api/embed-token` (server yang pegang `client_secret`)
- Menyegarkan 60 detik sebelum `exp` JWT, plus saat tab kembali aktif bila sisa < 60 detik
- Meneruskan token baru ke semua iframe lewat `postMessage` (bukan reload)
- Status disiarkan lewat `BMKGPanel.onStatus(cb)` — dipakai badge di Vue/React/Angular

**Untuk produksi:** partner mengambil token dari backend mereka sendiri dan memakai
`/api/embed-js` + `eval` (lihat bagian autentikasi di atas). `/api/embed-token` dihapus,
dan `embed-panel.js` tidak perlu dipakai.

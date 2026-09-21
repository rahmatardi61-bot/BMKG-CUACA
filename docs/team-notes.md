# Team Notes — Keputusan Penyesuaian UI & Smoke Test

> Bahan diskusi tim untuk hasil integrasi API BMKG ke redesign.
> Pasangan dokumen: `api-comparison.md` & `API-MAPPING.md`.

## Status implementasi (8–9 Sep 2026)

| Fase | Isi | Status |
|---|---|---|
| 0 | Proxy dev (`vite.config.ts`) + Vercel function (`api/bmkg/[...path].ts`) + service client | ✅ |
| 1 | `forecast/coord` + `presentwx/coord` → dashboard live | ✅ |
| 2 | `warning` + `sunset/json` (+ `weekly-temperature`*) | ✅* |
| 3 | `adm/coord` (ganti Nominatim, Nominatim jadi fallback) + `amandemen` (toast) + `video-latest` + `cyclone` | ✅ |
| 4 | Maritim/peta: `nearest-location` di-fetch & siap*; layer peta live** | ✅* |
| 5 | Berita: WP REST (`blog/wp-json/wp/v2/posts`) + video → `NewsSection` | ✅ |

`*` = data ter-fetch & adapter siap, tapi **belum ada slot UI** yang mengonsumsinya (lihat
§2). `**` = layer peta masih CartoCDN statis; metadata tiles BMKG sudah didokumentasikan.

## 1. Keputusan penyesuaian satuan/unit (mengikuti UI yang sekarang)

Semua ini **perlu konfirmasi tim** karena mengubah makna data API ke format mock lama:

| # | Item | API asli | UI sekarang | Keputusan sementara | Pertanyaan untuk tim |
|---|---|---|---|---|---|
| 1 | Prob. hujan di card per jam | `tp` = curah hujan **mm** + kode `weather` | `precipitation` dalam **%** | Konversi linier `pct = min(100, tp×20)` (0.1mm→2%, 5mm→100%) | Pakai tabel probabilitas per kode cuaca seperti original, atau tetap dari `tp`? |
| 2 | "Terasa seperti" | API **tidak punya** feels-like | `feelLike` (°C) | Aproksimasi: `t + max(0,(hu−50)/10)` | Original menghitung apa? (butuh reverse-engineering UI original lebih dalam) |
| 3 | Indeks UV | API **tidak punya** UV | `uvIndex` 0–11 | Estimasi dari cloud cover `tcc` + siang/malam | Kalau original tidak menampilkan UV → hapus dari WeatherData |
| 4 | Jarak pandang | `vs` = **meter** (+`vs_text` "< 7 km") | `visibility` km | `vs/1000`, 1 desimal | Ok? |
| 5 | Icon cuaca | `image` = URL SVG BMKG + `weather_desc` | Nama icon lucide (`'Sun'`, `'CloudRain'`) | Mapping keyword dari `weather_desc` (cerah/berawan/hujan/petir/...) + siang/malam dari jam lokal | Pakai SVG asli BMKG (lebih mirip original) atau tetap lucide (konsisten desain redesign)? |
| 6 | Sunrise/sunset | `results.sunrise` = `"5:48:51 AM"` | `"HH:mm"` 24 jam | Konversi AM/PM → 24 jam | Ok? |

## 2. Endpoint ter-fetch tapi belum punya slot UI (perlu keputusan desain)

| Endpoint | Data yang tersedia | Saran slot UI |
|---|---|---|
| `/api/public/banners` | Daftar banner promo | Strip banner di dashboard (original tampil di atas) |
| `/api/public/weather/weekly-temperature` | Suhu harian/mingguan | Grafik "Suhu Mingguan" sekarang **sudah agregat dari data jam-an** — API ini redundan kecuali mau lebih akurat |
| `/api/df/v1/amandemen/coord` | Jumlah revisi amandemen | Badge "amandemen" di panel prakiraan (sekarang: toast saja) |
| `/api/v1/public/maritim/nearest-location` | Wilayah laut terdekat (F.09 Teluk Jakarta, wilpel) + polygon | Info card di `WaveRadarMap`/`MaritimeAdvisorDrawer` |
| `/api/v1/maps/*/metadata/tiles`, `spartan/pollution/*`, `windmap/ecmwf` | Layer peta live (peringatan, polusi, angin) | Ganti/duet CartoCDN di `SatelliteMap`/`WaveRadarMap`/`MarineMap` |
| `/api/v1/sus/modelrun`, `spartan.bmkg.go.id/map/modelrun` | Katalog run model (14+) | Pemilih waktu run di peta |
| `/api/v1/api/signature/impact/public/list/<tgl>` | IBF 7 hari | Halaman/section IBF (belum ada di redesign) |
| `/api/v1/user/subscribe-type`, `/api/v1/developer/*` | Premium & dev console | Belum relevan (halaman tidak ada) |

## 3. Temuan teknis penting

- **Cloudflare**: request server-side wajib UA browser lengkap (UA pendek → 403). Proxy sudah
  mengatur ini; saat deploy ke Vercel, **spike dulu** kalau CF blok IP datacenter.
- **`/blog/wp-json/*` sedang 502 dari upstream** (bukan proxy kami) — sudah difallback ke
  artikel mock. Periksa ulang saat sudah normal.
- `x-public-token` expire ±30 menit — proxy dev & function prod auto-refresh dengan cache 25 menit.
- Endpoint `/api/public/*` menolak `Origin` asing (403) — makanya wajib proxy, bukan CORS biasa.
- **Proxy dev tanpa alias**: path request = persis path upstream (`/api/df/...`, `/api/public/...`, `/api/v1/public/...`, `/blog/...`) sehingga devtools langsung terbaca; host asli hanya bisa tampil untuk endpoint direct (`presentwx`, `api/v1/*`) karena browser dilarang set header `Referer` kustom — itu batasan browser, bukan pilihan desain.
- **Deploy nanti**: set `VITE_BMKG_PROXY=/api/bmkg` di env Vercel agar request lewat `api/bmkg/[...path].ts` (function sudah siap).
- **Pemisahan LIVE vs MOCK**:
  - Data mock TIDAK PERNAH lewat network (import langsung dari `mockData.ts`) → apapun yang muncul di network tab adalah API BMKG asli.
  - Request `localhost:5173/api/df/...` di devtools = **data live BMKG via proxy** (bukan mock); endpoint direct (`presentwx`, `v1/*`) tampil dengan host asli.
  - Badge dev-only di kanan-bawah layar: 🟢 `LIVE • BMKG API` / 🟡 `DEMO • MOCK` / memuat — state dari `bmkgWeather.status`.
  - Console (dev): tiap fetch proxy di-log sebagai `[BMKG API] https://cuaca.bmkg.go.id/...` (URL aslinya).

## 4. Smoke test manual (dev browser)

Jalankan `npm run dev`, buka `http://localhost:5173`. Checklist:

### A. Data live
- [x] **A1** Network tab: `GET /api/df/v1/forecast/coord?lat=-6.2...` (path identik upstream, via proxy dev) → **200** & response JSON valid
- [x] **A2** Network tab: `GET /api/public/weather/warning...` → **200** (bukan 401 — artinya token ter-inject)
- [x] **A3** Network tab: `GET https://cuaca.bmkg.go.id/api/presentwx/coord...` → **200** (direct, tanpa proxy)
- [x] **A4** Kartu "Kondisi Saat Ini" menampilkan data **live** — bandingkan dengan https://cuaca.bmkg.go.id/ (suhu & kondisi & "terasa seperti" harus cocok/dalam toleransi)
- [x] **A5** Prakiraan 7 hari + tab Per Jam + Suhu Mingguan render dari data live (angka berbeda dari mock, ikut jam WIB)
- [x] **A6** % kelembapan di card per jam menempel pada data (bukan angka mock lama)
- [x] **A7** Ikon siang/malam berubah sesuai jam (setelah 18:00 → Moon variant)

### B. Interaksi lokasi
- [x] **B1** Klik tab kota lain (Surabaya/Denpasar) → suhu & kondisi berubah (data live per kota)
- [x] **B2** Klik "Cari Lokasi Saya" + izinkan GPS → alamat ter-resolve via **BMKG** (Network: `api/df/v1/adm/coord` 200, Nominatim tidak terpanggil)
- [x] **B3** Blokir izin lokasi → fallback DKI Jakarta + toast peringatan muncul
- [x] **B4** (Opsional) Mock lokasi browser ke koordinat non-kota (mis. titik sawah) → nama desa/kec. dari BMKG tampil

### C. Peringatan & berita
- [x] **C1** `AlertsPanel` menampilkan konten (saat ini mock, karena baseline observation warning kosong untuk Jakarta)
- [x] **C2** Berita: kalau `blog/wp-json` 200 → artikel live + video BMKG (thumbnail YouTube); kalau 502 → artikel mock (jangan error putih)
- [x] **C3** Toast "Amandemen prakiraan tersedia" hanya muncul bila API mengembalikan revisi (jarang — biasanya tidak tampil; itu normal)

### D. Ketahanan
- [x] **D1** DevTools → Network → Offline, refresh: halaman tetap render penuh (mock fallback), console error tertangani rapi
- [x] **D2** Throttle "Slow 3G": skeleton muncul, lalu data live menggantikan — tidak ada flash putih
- [x] **D3** Tidak ada error CORS di console untuk semua family
- [x] **D4** Dark mode default + toggle gelap/terang/auto tetap berfungsi

### E. Deploy (opsional, saat mau up ke Vercel)
- [ ] **E1** Push → deploy otomatis → buka domain → `GET /api/bmkg/api/df/v1/forecast/coord...` **200** via Vercel function (bukan 4xx/5xx — kalau 5xx, kemungkinan CF blok IP Vercel; laporkan, ada opsi cadangan)
- [ ] **E2** Dashboard di production menampilkan data live sama seperti dev

## 5. Cara rollback cepat

Semua integrasi lewat `useBmkgWeather` di `App.vue` — matikan dengan mengosongkan
env `VITE_BMKG_PROXY` tidak cukup; rollback sebenarnya: `git revert` commit integrasi,
atau komentari pemanggilan `loadCity`/computed live di `App.vue` (data kembali 100% mock).

---

## 6. Iterasi "Tier A & B" (15 Sep 2026)

Lanjutan dari audit kartu mock vs live (`bmkg-api-mapping.xlsx` sheet **Audit Content Card**).
Semua item di bawah sudah **jalan di dev** dan diverifikasi lewat browser otomatis
(Playwright: cek teks kartu + daftar request + `pageerror`).

### 6.1 Yang diimplementasikan

| # | Item | Sumber data live | File utama |
|---|---|---|---|
| A1 | **Fix bug**: `currentSlot()` membaca `doc.slots`, padahal API resmi mengirim array di **`doc.data`** → seluruh integrasi maritim live (status transport maritim, patch drawer, teks pelayaran) tidak pernah aktif | maritim public_api | `services/bmkg/openData.ts` |
| A2 | **MarineMap**: layer gelombang memakai 232 polygon **wilayah perairan resmi** + warna/label dari overview live; klik wilayah → popup detail resmi (rentang gelombang, angin, cuaca, peringatan). Legend & timeline ikut live (Hari ini/Besok/H+2/H+3) | `/static/wilayah_perairan.json`, `/overview/gelombang.json`, `/perairan/{file}.json` | `MarineMap.vue` |
| A3 | **Berita**: `NewsSection` dipasang (sebelumnya data WP sudah di-fetch tapi prop `articles` tidak pernah dirender) | blog WP + video BMKG | `MainDashboard.vue` |
| A4 | **Aktivitas Pelayaran**: pakai gelombang resmi perairan, bukan estimasi `0.3 + angin×0.04` | `/api/v1/public/maritim/nearest-location` → perairan | `WeatherActivity.vue` |
| A5 | **AroundActivityPanel**: nilai cuaca per titik POI (comfort/hujan/UV/jam-an) diambil live dari `df/forecast/coord` per lat-lng POI; daftar POI tetap konten kurasi | internal `df/forecast/coord` | `AroundActivityPanel.vue` |
| B6 | **Peringatan dini nowcast resmi** (RSS) menang atas `warning` internal, difilter per provinsi (feed-nya nasional). Proxy baru: dev `/alerts` → `www.bmkg.go.id`, prod lewat `api/bmkg/[...path].ts` | `https://www.bmkg.go.id/alerts/nowcast/id` | `services/bmkg/nowcast.ts`, `vite.config.ts`, `api/bmkg/[...path].ts` |
| B7 | **Kartu baru "Pelabuhan & Pasut"** — pelabuhan terdekat + gelombang, suhu, kelembapan, angin, jarak pandang, pasang/surut (jam dikonversi ke WIB/WITA/WIT) | `/pelabuhan_list`, `/pelabuhan/{file}.json` | `PortTideCard.vue` |
| B8 | **Fallback jalur resmi**: kalau `df/forecast/coord` kosong/gagal → `api.bmkg.go.id/publik/prakiraan-cuaca?adm4=` (bentuk item identik, adapter sama) | Open Data `prakiraan-cuaca` | `useBmkgWeather.ts`, `services/bmkg/api.ts` |
| B9 | **WaveRadarMap**: bug properti diperbaiki (`WP_1`/`WP_IMM`, sebelumnya baca `code`/`kode` → semua zona kosong). **Tidak dipasang** — lihat §6.3 | overview + geojson | `WaveRadarMap.vue` |

**Bug lama lain yang ketemu & diperbaiki saat ini:**
- `getWilayahPerairanGeo()` memakai path `…/wilayah_perairan.geojson` yang **404** (path benar `/static/wilayah_perairan.json`) → overlay peta maritim tidak pernah muncul.
- Overlay itu juga membaca properti `name`/`code` yang tidak ada di geojson resmi (benar: `WP_IMM`/`WP_1`).
- `LandBasedActivities.vue`: `ReferenceError: Cannot access 'currentStep' before initialization` — ref dideklarasikan di bawah `computed` yang dibaca `watch(..., { immediate: true })`, jadi **setup crash di setiap load**. Deklarasi dipindah ke atas.

### 6.2 Hasil verifikasi (dev, 15 Sep 2026)

- Kartu Pelabuhan tampil live: contoh Jakarta → **Sunda Kelapa (0101)**, gelombang 0.5–1.25 m (Rendah), suhu 26–29 °C, kelembapan 68–81%, angin Timur 2–5 knot, jarak pandang 10.0 km.
- Peta maritim: legend live **78 Rendah + 123 Sedang + 31 Tinggi = 232** wilayah (pas dengan jumlah wilayah resmi), label timeline "Hari ini · Rilis terbaru BMKG".
- Berita & Pelabuhan & peta maritim ter-render; **0 page error** setelah fix TDZ.
- Request live yang terverifikasi 200: `overview/gelombang.json`, `static/wilayah_perairan.json`, `perairan/F.09…`, `perairan_list`, `pelabuhan/0101…`, `pelabuhan_list`, `/alerts/nowcast/id`.
- `blog/wp-json/wp/v2/posts` sesekali **502** dari sisi BMKG (sudah diketahui) → otomatis fallback ke artikel mock.

### 6.3 Keputusan & hal yang sengaja belum dikerjakan

1. **WaveRadarMap tidak dipasang.** Setelah MarineMap menampilkan gelombang live, WaveRadarMap menjadi visualisasi kembar (dua peta Leaflet + dua kali fetch geojson di satu halaman). Kodenya kini benar dan siap dipasang kapan saja kalau tim memutuskan memakai kartu ringkas itu sebagai ganti peta besar.
2. **Layer angin & cuaca di MarineMap tetap snapshot.** Endpoint resmi tidak menyediakan angin/cuaca **bulk** per wilayah (hanya kategori gelombang via overview); mengambil detail 232 wilayah berarti 232 request. Layer gelombang sudah live.
3. **MarineMap mode Pelabuhan masih snapshot** (`public/data/ports.json`, 294 pelabuhan) — data live pelabuhan hanya diambil untuk **pelabuhan terdekat** (kartu B7). Menghidupkan seluruh layer = 294 request.
4. **Kualitas udara (AQI/PM2,5) tidak dibuat live — tidak ada sumbernya.** `ispu.bmkg.go.id` tidak bisa diakses, `www.bmkg.go.id/kualitas-udara` → 404, `api.bmkg.go.id/publik/ispu` → 404, `ispu.menlhk.go.id` tidak merespons. Badge di card itu diubah dari **"ISPU LIVE"** menjadi **"ESTIMASI"** supaya tidak menyesatkan (angkanya masih `f(pm25)` dari suhu + hash nama kota).
5. **Indeks Kenyamanan** masih memakai label `tempText` statis dari `weatherHelpers.getComfortIndex()`; status/emoji-nya sudah mengikuti suhu live.
6. **Arus pelabuhan tidak ditampilkan** — satuannya ambigu (dokumen resmi menyebut cm/s, tapi nilainya 0.06–0.46 sehingga lebih masuk akal m/s). Daripada salah satuan, field ini di-skip sampai ada konfirmasi BMKG.

### 6.4 Cara menguji ulang

```bash
npm run dev
# lalu di browser: kartu "Pelabuhan & Pasut" (kanan bawah), peta maritim (klik satu wilayah),
# section Berita (bawah kolom kiri), dan badge "ESTIMASI" di card kualitas udara.
node --experimental-strip-types src/services/bmkg/nowcast.check.ts   # self-check parser RSS
```

### 6.5 Nonaktif sementara (permintaan produk, 16 Sep 2026)

1. **MajorCitiesCarousel — auto-geser & fetch per kota dimatikan.** Timer 10 detik dan seluruh
   logika auto-slide **dihapus** dari `MajorCitiesCarousel.vue` (bukan di-comment), dan tidak ada
   fetch cuaca per kota. Kartu kini statis: landmark + nama kota ("Aktif"/"Pilih Kota").
   Konsekuensi bila nanti dinyalakan: menampilkan suhu live 10 kota = **10 request tambahan**
   (`df/forecast/coord` per kota), jadi keputusan ini sekaligus menghemat kuota proxy.
2. **Teks sampah `aldskj`** yang ter-render di antara carousel dan CurrentWeather (sisa edit
   manual di `MainDashboard.vue`) sudah dihapus.

---

## 7. API BOX MARKER (branch `api-box-marker`, alat dev — BUKAN untuk publik)

Tujuan: membedakan sekali lihat kartu mana yang **live API**, **campuran**, atau **mock** —
untuk diskusi dengan partner: API mana yang terpakai, mana yang bisa dibuang, dan API apa
yang dibutuhkan konten yang belum ready.

### Cara kerja

| Elemen | Penjelasan |
|---|---|
| **Border 3px** | 🔴 merah = nilai kartu dari API live · 🟠 amber = campuran (ada child/nilai pakai API, ada yang mock) · ⚪ abu = mock/statis |
| **Chip (kanan-atas)** | Nama pendek API yang dipakai kartu, mis. `⚡ df/coord · present`; kartu mock = `🔌 MOCK` |
| **Tooltip (hover chip)** | Nama API lengkap, jumlah call, **query asli terakhir** (URL+param), dan **sample response asli** (potongan 1000 karakter, status HTTP). Ditambah rincian per bagian (🟢 live / 🟡 estimasi / 🔌 mock) dan catatan. |
| **Panel kanan-bawah** | Klik `■ API BOX MARKER` → rekap SEMUA API terdaftar: ✓ hijau = pernah dipanggil (dengan jumlah), ○ abu = **tidak pernah dipanggil → kandidat dibuang** |

### Implementasi (singkat)

- `src/dev/apiMarker.ts` — registry API (pencocokan URL→id) + registry kartu (`CARD_MARKERS`)
  + directive `v-api-marker` + patch `window.fetch` (dev-only): SEMUA request terekam otomatis
  (URL, status, sample response via `res.clone()`), tanpa mengubah call-site mana pun.
- Dipasang di `src/main.ts`; **semua ter-guard `MARKER_ACTIVE`** = dev server **atau** URL
  dengan query **`?apimarker=1`** → jadi di deploy Vercel/staging pun bisa dipakai: buka
  `https://<domain>/?apimarker=1` dan bagikan URL itu ke partner. Tanpa query: bersih,
  tanpa border/chip/patch fetch (directive no-op, tidak ada warning).
- Pemakaian di kartu: satu atribut di root komponen, contoh
  `<HeroWeatherCard v-api-marker:hero …>` (pakai **arg** directive, bukan value, agar id
  bertanda hubung tidak dianggap ekspresi JS oleh Volar/vue-tsc).
- Analogi `v-chip` & `v-tooltip` Vuetify dibuat manual (project tidak pakai Vuetify).

### Kartu yang sudah ditandai (17)

hero, current-weather, forecast-panel, alerts, news, earthquake, satellite, major-cities (mock),
transport (campuran), weather-activity (campuran), marine-map (campuran), port-tide,
around-activity (campuran), land-based (campuran), maritime-advisor (campuran),
aviation-advisor (mock), location-search (mock).

Menambah kartu baru: tambahkan entri di `CARD_MARKERS` (src/dev/apiMarker.ts) lalu beri atribut
`v-api-marker:<id>` di root komponennya.

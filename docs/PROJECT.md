# BMKG Cuaca — Dokumentasi Project

Redesign website BMKG sebagai **Single Page Application (SPA)**. Stack: **Vue 3 (`<script setup>`) + TypeScript + Vite + Tailwind CSS + lucide-vue-next + Leaflet**.

> ⚠️ **Semua data saat ini masih MOCK** (statis di `src/data/` + generator acak). Belum ada integrasi API BMKG yang sebenarnya.

---

## 1. Cara menjalankan

```bash
npm install        # pertama kali
npm run dev        # dev server (Vite)
npm run build      # type-check (vue-tsc) + build produksi
npm run preview    # preview build
```

- **[1] `npm run dev`** → jalankan saat develop
- **[2] `npm run build`** → wajib lolos `vue-tsc -b` (type-check) sebelum push

---

## 2. Struktur direktori

```
src/
├── main.ts                       # entry Vue (App.vue)
├── App.vue                       # ORCHESTRATOR: state global, tema, geolokasi, sesi login
├── style.css                     # global CSS (+ theme vars)
├── pages/
│   ├── MainDashboard.vue         # layout dashboard 3 kolom (tab Beranda)
│   ├── LoginView.vue             # halaman login (di-skip default)
│   └── UnderMaintenance.vue      # fallback untuk tab yg belum dibangun
├── components/
│   ├── Header.vue                # navbar: tab, tema, pilih kota, login
│   ├── CurrentWeather.vue        # kartu cuaca utama terpilih (+ strip detail 7 hari)
│   ├── ComfortIndexCard.vue      # Indeks Kenyamanan (kolom kanan)
│   ├── AirQualityCard.vue        # Pengukuran Kualitas Udara (kolom kanan)
│   ├── SatelliteMap.vue          # Radar cuaca satelit Himawari-9
│   ├── WaveRadarMap.vue          # Radar tinggi gelombang (maritim)
│   ├── ForecastPanel.vue         # ramalan 24jam/7hari
│   ├── WeatherActivity.vue       # sidebar aktivitas (darat/laut/udara)
│   ├── TransportWeather.vue      # status transportasi
│   ├── AlertsPanel.vue           # peringatan cuaca
│   ├── Earthquake*.vue           # gempa: aktivitas + riwayat
│   ├── MajorCitiesCarousel.vue   # carousel kota besar
│   ├── *Drawer.vue               # panel detail (maritim, penerbangan, lapor cuaca, dll)
│   ├── NewsSection.vue / Footer.vue / LandBasedActivities.vue
│   ├── forecast/                 # chart prakiraan (suhu, presipitasi, kualitas udara)
│   └── skeletons/                # placeholder saat komponen lazy-load
├── composables/
│   └── useWeatherReport.ts       # logika modal "Lapor Cuaca"
├── data/                         # ⚠️ SEMUA DATA MOCK DI SINI
├── types/weather.ts              # definisi tipe data inti
└── assets/                       # gambar landmark (webp), logo, svg
```

---

## 3. Arsitektur & alur data

`App.vue` adalah **single source of truth** untuk state global, lalu melempar **props** ke `MainDashboard`.

### 3.1 State global (di `App.vue`)

| State | Tipe | Deskripsi |
|---|---|---|
| `selectedCity` | `ref<string>` | Kota aktif (default `Mencari lokasi...`/DKI Jakarta) |
| `cities` | `ref<string[]>` | Daftar tab navigasi kota |
| `activeTab` | `ref<string>` | Tab aktif; hanya `Beranda` yang dibangun penuh |
| `themeMode` | `ref<'light'\|'dark'\|'auto'>` | Siklus toggle: light → dark → auto |
| `isLoggedIn` / `userProfile` | ref | Sesi login (default bypass) |
| `isGeolocated` / `userLat` / `userLng` | ref | Hasil geolokasi pengguna |

### 3.2 Data per kota (computed di `App.vue`)

Semua map di `src/data/mockData.ts` di-keyed oleh nama kota, dengan fallback **DKI Jakarta**:

- `activeWeatherData` ← `weatherDataMap[city]`
- `activeHourlyForecasts` ← `hourlyForecastsMap[city]`
- `activeTransportStatuses` ← `transportStatusesMap[city]`
- `activeWarningAlerts` ← `warningAlertsMap[city]` (ditekan jika geolokasi asli)

### 3.3 Tema otomatis (`auto`)

Tema dipilih berdasarkan **jam lokal kota terpilih** + **status cuaca**:

1. Petir/Badai → `theme-stormy` (gelap)
2. Hujan/Gerimis → `theme-rainy` (gelap malam)
3. Berawan/Mendung → `theme-cloudy` (gelap malam)
4. Cerah → siklus harian: `theme-morning/day/evening/night`

Tema juga memutar `meta theme-color` (status bar mobile) dan disimpan di `localStorage['bmkg-theme']`.

### 3.4 Geolokasi

`detectRealtimeLocation()` memanggil API **Nominatim** (reverse geocoding). Berhasil → kota/full-address dimasukkan ke `cities[0]` lalu data di-generate; gagal/ditolak → fallback DKI Jakarta + toast peringatan.

---

## 4. Data mock (penting untuk pengembangan)

Semua data statis ada di `src/data/`:

| File | Isi |
|---|---|
| `mockData.ts` | 11 kota inti (`citiesList`, `weatherDataMap`, `hourlyForecastsMap`, `transportStatusesMap`, `warningAlertsMap`, `newsArticles`, `cityAnalysisMap`) + `generateMockWeatherForCity()` untuk kota custom/geolokasi |
| `cityThemes.ts` | Gradien + landmark WebP per kota → `getCityTheme()` |
| `weatherHelpers.ts` | Info tambahan: atribut cuaca, **comfort index**, normalisasi tipe cuaca, format waktu+zona |
| `cityLandmarks.ts` | Daftar landmark kota |
| `earthquakeData.ts` | Data gempa statis, `calculateDistance()`, zona seismik, riwayat per kota |
| `maritimeAdvisorData.ts` | Konten sektor maritim per kota |
| `aviationAdvisorData.ts` | Data bandara per kota `${getAirportsDataForCity()}` |
| `landBasedActivitiesData.ts` | Lokasi aktivitas darat + koordinat routes |

**`generateMockWeatherForCity(cityName)`** — membuat `WeatherData` + 24 jam + 7 hari + transport + peringatan + analisis untuk kota yang belum ada, memakai nilai acak. Ini dipakai untuk kota hasil geolokasi.

---

## 5. Fitur & komponen utama

- **Dashboard 3 kolom** (`MainDashboard`): sidebar daftar kota/carousel, konten utama (cuaca saat ini, ramalan, chart), sidebar sticky (aktivitas, transport, peringatan, gempa, berita).
- **Lazy-load + skeleton**: komponen berat dimuat via `defineAsyncComponent` dengan `loadingComponent` skeleton → performa awal cepat.
- **Peta Leaflet** (`SatelliteMap.vue`): peta satelit + penanda.
- **Gempa**: aktivitas terkini + riwayat, jarak dihitung vs kota/koordinat user.
- **Drawer informatif**: Maritim (sektor), Penerbangan (bandara), Aktivitas sekitar, Lapor Cuaca (form + riwayat).
- **Login**: sesi di `localStorage['bmkg-session']`, expire 1 jam, tetapi **di-skip** (tidak muncul) kecuali dibuka manual.

---

## 6. Konfigurasi penting

- **`tailwind.config.js`**: dark mode via class `dark`; palet khusus `brand.navy`/`brand.cyan`/`brand.sky`; font `Plus Jakarta Sans`.
- **`vite.config.ts`**: manual chunking — `node_modules` → `vendor`, data mock → `mock-data` (memanfaatkan caching).
- **`types/weather.ts`**: antarmuka `WeatherData`, `HourlyForecast`, `TransportStatus`, `WarningAlert`, `NewsArticle`, `CityAnalysis`.

---

## 7. Konvensi tim

- **Branch**: `master` dari `tomianggriawan` **tidak boleh disentuh / di-merge**. Main branch kita = **`rahmat-branch`** (guard di `.githooks/pre-push` memblok push ke `master`).
- **`.agents/rules/`** milik pemilik repo — **diabaikan**, bukan konfigurasi kita.
- Gunakan TypeScript strict (`vue-tsc`) — pastikan `npm run build` lolos.
```

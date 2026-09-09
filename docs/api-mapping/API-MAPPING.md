# API Mapping — Baseline (cuaca.bmkg.go.id) vs Project Redesign (bmkg_cuaca)

> Komparasi API antara **baseline scraping** (`../scrapping_cuaca-bmkg-go-id/`, dianggap
> source original) dan **project redesign** (`src/`). Fokus: endpoint mana yang **belum
> diimplementasikan** di redesign, mana yang diimplementasikan dengan **sumber berbeda**.
>
> Versi tabel: `api-mapping.xlsx` (regenerate: `python3 generate_xlsx.py`).
> Baseline di-capture: 8 Sep 2026.

## Ringkasan

| Status | Jumlah | Arti |
|---|---|---|
| 🔴 **BELUM** | **19** | Endpoint original belum diimplementasikan — data masih mock / fitur tidak ada |
| 🟡 **BEDA-SUMBER** | **9** | Fitur ada di redesign, tapi datanya dari sumber berbeda (mock/OSM/OSRM/inderaja/Carto) |
| 🔵 **REDESIGN-ONLY** | **4** | Sumber yang hanya dipakai redesign (tidak ada di original) |

**Endpoint original terimplementasi identik (memanggil API yang sama): 0.**
Seluruh data cuaca di redesign berasal dari `src/data/mockData.ts` (1.089 baris) +
beberapa sumber eksternal non-ISDP. Ini wajar untuk fase redesign, dan tabel ini jadi
backlog integrasi.

## Prioritas implementasi yang disarankan

1. **`/api/df/v1/forecast/coord`** — sumber 80% konten dashboard (cuaca saat ini, 10 hari,
   per jam, tema day/night). Auth paling ringan (cukup Referer/Origin).
2. **`/api/presentwx/coord`** — kartu cuaca saat ini (terbuka, tanpa auth).
3. **`/api/public/weather/warning`** — panel peringatan (butuh `x-public-token` fresh).
4. **`/api/public/weather/weekly-temperature`** — grafik suhu mingguan.
5. **`/api/df/v1/adm/coord`** — replace Nominatim untuk resolve admin area (sudah ada
   geolocation handler di `App.vue`, tinggal ganti sumber + fallback Nominatim).

Catatan auth singkat (detail: `../scrapping_cuaca-bmkg-go-id/api_client_auth.md`):

| Family | Header wajib |
|---|---|
| `/api/df/*` | `Referer: https://cuaca.bmkg.go.id/` + `Origin` |
| `/api/presentwx/*` | — |
| `/api/v1/*` | `X-API-KEY` (JWT statis, ada di baseline `__NUXT_DATA__`) |
| `/api/public/*` | `x-public-token` (JWT 30 menit, ambil fresh dari HTML homepage) |

## Tabel mapping lengkap

### C. DF Forecast (Referer/Origin)

| Endpoint | Dipakai di Original | Komponen Redesign | Status | Sumber Pengganti |
|---|---|---|---|---|
| `GET /api/df/v1/forecast/coord?lat=&lon=` | Dashboard (cuaca saat ini, 10 hari, per jam), /perbandingan | `CurrentWeather.vue`, `ForecastPanel.vue`, `ForecastTemperatureChart.vue`, `ForecastPrecipitationChart.vue`, `ForecastAirQualityChart.vue` | 🔴 BELUM | `mockData.ts` |
| `GET /api/df/v1/adm/coord?lat=&lon=` | Resolve lokasi admin dari koordinat | `App.vue` (geolocation) | 🟡 BEDA-SUMBER | Nominatim reverse |
| `GET /api/df/v1/amandemen/coord?lat=&lon=` | Amandemen prakiraan | — | 🔴 BELUM | — |

### D. Present Weather (terbuka)

| Endpoint | Dipakai di Original | Komponen Redesign | Status | Sumber Pengganti |
|---|---|---|---|---|
| `GET /api/presentwx/coord?lat=&lon=` | Kartu "Cuaca Saat Ini" | `CurrentWeather.vue` | 🔴 BELUM | `mockData.ts` |

### B. Public API (x-public-token)

| Endpoint | Dipakai di Original | Komponen Redesign | Status | Sumber Pengganti |
|---|---|---|---|---|
| `GET /api/public/weather/warning?lat=&long=` | Peringatan wilayah (today/tomorrow) | `AlertsPanel.vue` | 🔴 BELUM | `mockData.ts` (warningAlertsMap) |
| `GET /api/public/weather/warning/cyclone` | Status siklon lokal | — | 🔴 BELUM | — |
| `GET /api/public/weather/weekly-temperature` | Grafik "Suhu Mingguan" | `ForecastTemperatureChart.vue` | 🔴 BELUM | `mockData.ts` |
| `GET /api/public/weather/video-latest?hashtag=` | Video IG terbaru | `NewsSection.vue` | 🔴 BELUM | `mockData.ts` (newsArticles) |
| `GET /api/public/banners` | Banner promo | — | 🔴 BELUM | — |

### A. ISDP v1 (X-API-KEY)

| Endpoint | Dipakai di Original | Komponen Redesign | Status | Sumber Pengganti |
|---|---|---|---|---|
| `GET /api/v1/setting/find-code?code=active` | Tema background per section | `cityThemes.ts` | 🟡 BEDA-SUMBER | Tema statis lokal |
| `GET /api/v1/sunset/json?lat=&lng=` | Info matahari & bulan (30+ field) | `CurrentWeather.vue` (day/night) | 🔴 BELUM | Data statis |
| `GET /api/v1/tcwc/cyclone/all` | Sirkulasi siklon TCWC | — | 🔴 BELUM | — |
| `GET /api/v1/public/maritim/nearest-location` | Wilayah laut terdekat | `WaveRadarMap.vue`, `MaritimeAdvisorDrawer.vue` | 🔴 BELUM | — |
| `GET /api/v1/maritim/route` | Rute pelayaran | `TransportWeather.vue` | 🟡 BEDA-SUMBER | OSRM |
| `GET /api/v1/maritim/water-area/water_area_point.geojson` | Titik area laut | — | 🔴 BELUM | — |
| `GET /api/v1/sus/modelrun` | Katalog run model radar/windmap | `SatelliteMap.vue` | 🟡 BEDA-SUMBER | inderaja HIMA (statis) |
| `GET /api/v1/api/signature/impact/public/list/<tanggal>` | IBF 7 hari (/ibf, /map) | — | 🔴 BELUM | — |
| `GET /api/v1/maps/*/metadata/tiles` (5 varian) | Metadata layer peta | `SatelliteMap.vue`, `WaveRadarMap.vue` | 🟡 BEDA-SUMBER | CartoCDN basemap |
| `GET /api/v1/tourism/tiles/data/tourism.json` | POI wisata | `LandBasedActivities.vue` | 🟡 BEDA-SUMBER | Overpass (OSM) |
| `GET /api/v1/sus/tiles/data/suspoi.json` | POI umum /map | `LandBasedActivities.vue` | 🟡 BEDA-SUMBER | Overpass (OSM) |
| `GET /api/v1/spartan/pollution/{pol}/{lvl}/{t0}/{t1}/{z}/{x}/{y}.png` | Tile polusi | `ForecastAirQualityChart.vue` | 🔴 BELUM | `mockData.ts` |
| `GET /api/v1/user/subscribe-type` | Tipe subscription (/premium) | — | 🔴 BELUM | — |
| `POST /api/v1/developer/{login,register,...}` | Console developer | — | 🔴 BELUM | — (opsional, tak relevan untuk publik) |

### E. Eksternal yang dipakai Original

| Endpoint | Dipakai di Original | Komponen Redesign | Status | Sumber Pengganti |
|---|---|---|---|---|
| `spartan.bmkg.go.id/map/modelrun` | Katalog 14+ model (GFS, SPARTAN, QPE, FDRS, dll) | — | 🔴 BELUM | — |
| `widis.bmkg.go.id/ndf/cgms/weather/forward` | Data satelit CGMS | `SatelliteMap.vue` | 🟡 BEDA-SUMBER | inderaja HIMA (statis) |
| `bmkg-sus.geo.id/windmap/ecmwf/1000` | Tile angin ECMWF | — | 🔴 BELUM | — |
| `tiles.circlegeo.com/data/{indocg,administration}.json` | Boundary administratif | `SatelliteMap.vue` | 🟡 BEDA-SUMBER | CartoCDN |
| `cuaca.bmkg.go.id/blog/wp-json/wp/v2/` | Konten /berita* (SSR) | `NewsSection.vue` | 🔴 BELUM | `mockData.ts` |

### R. Redesign-Only (tidak dipakai original)

| Sumber | Komponen Redesign | Catatan |
|---|---|---|
| `data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json` | `EarthquakeActivity.vue`, `EarthquakeHistory.vue` | Legacy BMKG endpoint — fitur gempa tidak ada di original |
| `nominatim.openstreetmap.org` (search/reverse) | `App.vue`, `LandBasedActivities.vue` | Pengganti adm/coord + pencarian lokasi |
| `overpass-api.de/api/interpreter` | `LandBasedActivities.vue` | POI aktivitas darat |
| `router.project-osrm.org/route/v1/driving` | `TransportWeather.vue` | Routing transport darat |

## Cara memakai dokumen ini

- Untuk mulai integrasi: ambil dari **prioritas** di atas; sample response & shape ada di
  `../scrapping_cuaca-bmkg-go-id/baseline/api_probes/` (per kota) dan `baseline/<route>/`.
- Untuk audit: buka `api-mapping.xlsx` (filter kolom Status/Family).
- Update mapping: edit `generate_xlsx.py` (data satu sumber) → `python3 generate_xlsx.py`.

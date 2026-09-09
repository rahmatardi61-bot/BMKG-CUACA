# Implementation Plan — Integrasi API cuaca.bmkg.go.id ke Redesign

> Rencana implementasi hasil analisis baseline (`../scrapping_cuaca-bmkg-go-id/`) +
> mapping (`API-MAPPING.md`) terhadap codebase pasca-merge `tomi/master`.
> **Status: DRAFT untuk direview — belum ada kode yang diubah.**

## 1. Hasil analisis

### 1.1 Kondisi codebase sekarang (pasca-merge)

- Satu-satunya entry data: `App.vue` → `generateMockWeatherForCity()` (dari `src/data/mockData.ts`)
  → props `weatherData`, `hourlyForecasts`, `alerts`, `news` → `MainDashboard.vue` → komponen.
- Semua komponen murni **props-driven** — tidak ada komponen yang fetch API cuaca sendiri.
  Artinya: integrasi cukup **mengganti sumber di App.vue + adapter types**, komponen kebanyakan tak tersentuh.
- Types existing (`src/types/weather.ts`): `WeatherData`, `HourlyForecast`, `WarningAlert`,
  `NewsArticle`, `TransportStatus` — **shape mock**, bukan shape API asli → butuh adapter.
- Post-merge ada `LazyCardLoader` (perf) dan komponen baru dari `tomi/master` (MarineMap, HeroWeatherCard).

### 1.2 Temuan CORS/auth (uji nyata dari origin asing) — penentu arsitektur

| Family | ACAO | Simulasi browser cross-origin | Kesimpulan |
|---|---|---|---|
| `/api/df/v1/*` | `*` | **403** — butuh header `Referer: https://cuaca.bmkg.go.id/`, dan **browser tidak bisa set Referer manual** (forbidden header) | 🔴 **WAJIB proxy** |
| `/api/public/*` | `*` | **403** — server memvalidasi `Origin` harus `cuaca.bmkg.go.id` (tanpa Origin = 200) | 🔴 **WAJIB proxy** |
| `/api/presentwx/*` | `*` | 200 | 🟢 direct dari browser |
| `/api/v1/*` + `X-API-KEY` | `*` + expose header | 200 | 🟢 direct dari browser |

Konsekuensi: **2 dari 4 family harus lewat proxy** — ini bukan pilihan, ini batasan server BMKG.

### 1.3 Risiko utama: Cloudflare vs serverless

Probe dari IP lokal berhasil, tapi **belum teruji dari IP datacenter Vercel** — Cloudflare bisa
menolak. → Fase 0 adalah *spike* untuk membuktikan proxy jalan di Vercel **sebelum** mulai
implementasi luas. Kalau CF memblokir Vercel: fallback opsi (a) proxy via server lain/GitHub
Action cache, (b) endpoint yang direct-OK saja (presentwx + v1), sisanya tetap mock.

## 2. Keputusan arsitektur

**Prinsip: satu seam, dua mode, fallback mock.**

```
Browser (app)                     Proxy/Server                        BMKG
─────────────                     ────────────                        ────
/api-bmkg/df/v1/forecast/coord ──▶ Vite dev proxy  ──(Referer inject)──▶ /api/df/v1/forecast/coord
                              ──▶ api/bmkg/[...path].ts (Vercel fn) ──▶ (strip Origin)
                              ──▶ (token auto-fetch + cache 30m utk /api/public/*)
/api-bmkg/v1/...  ── (atau direct ke cuaca.bmkg.go.id, X-API-KEY dari client) ──▶ /api/v1/...
/api-bmkg/presentwx/... ── direct (terbuka)
```

- **Client gak pegang auth sama sekali**: path relatif `/api-bmkg/*`, tanpa header khusus.
- **`X-API-KEY` di-inject server-side** di proxy (tetap publik di kenyataannya, tapi rapi).
- **`x-public-token`**: di-fetch server-side (ambil HTML homepage, regex extract JWT, cache
  in-memory sampai `exp` ~30 menit) — client tidak perlu tahu.
- `/api/v1/*` & `/api/presentwx/*` bisa **direct** tanpa proxy (ACAO `*`) — diputuskan di fase:
  direct dulu, pindah ke proxy kalau ada masalah (konsistensi lebih baik lewat proxy, tapi lazy-first).

### File baru yang akan dibuat

| File | Isi |
|---|---|
| `api/bmkg/[...path].ts` | Vercel serverless catch-all: forward path+query → BMKG, inject Referer/Key/Token, strip Origin |
| `src/services/bmkg/api.ts` | Klien fetch: `bmkgGet<T>(path, params)` → `/api-bmkg/...`, timeout, error normalizer |
| `src/services/bmkg/adapters.ts` | Mapping response API → types existing (`WeatherData`, `HourlyForecast`, `WarningAlert`, dst.) |
| `src/types/bmkg.ts` | Types response API asli (dari baseline shapes) |
| `src/composables/useBmkgWeather.ts` | Orkestrasi: fetch per koordinat/kota, loading, **fallback ke mock saat gagal** |
| `vite.config.ts` (edit) | `server.proxy['/api-bmkg']` → BMKG + header Referer |
| `.env` (edit) | `VITE_BMKG_PROXY=` (kosong = pakai `/api-bmkg` relatif) |

### Adapter kunci: `forecast/coord` → types existing

```
data[0].cuaca[0][i] (hourly)          HourlyForecast
  local_datetime       "2026-09-08 15:00:00"  →  time "15:00", date "2026-09-08"
  t                    31                     →  temp
  weather_desc         "Cerah"                →  status
  image                icon URL               →  icon
  tp (mm)              0.3                    →  precipitation (mm → persen via threshold/normalisasi*)
  hu                   57                     →  humidity
  ws                   12.4                   →  windSpeed
lokasi + cuaca harian (min/max agregat)      WeatherData (temp, tempMin/Max, humidity, windSpeed, visibility←vs/1000)
data[0].cuaca[n] (per-3-jam, hari 1–9)       prakiraan 10 hari (ForecastPanel)
```
`*` Catatan: mock pakai `precipitation` sebagai %; API kasih `tp` dalam mm + kode `weather`.
Mapping final ditentukan saat fase 1 (lihat cara original menghitung prob. hujan — bisa dari
kode `weather` + `tp`). Ini terlihat di UI original (angka % di bawah jam) → perlu cek pas
implementasi; diperkirakan `tp` dipetakan lewat tabel kode cuaca.

## 3. Fase implementasi

### Fase 0 — Fondasi + spike proxy (prioritas tertinggi, ~½ hari)
- Buat `api/bmkg/[...path].ts`, edit `vite.config.ts`, `src/services/bmkg/api.ts`, `src/types/bmkg.ts`.
- **Spike**: deploy → panggil `/api-bmkg/df/v1/forecast/coord` & `/api-bmkg/api/public/weather/warning`
  dari domain Vercel → pastikan 200 (bukti CF gak blok).
- ✅ Selesai bila: kedua path 200 dari browser prod; struktur response == baseline (`diff.mjs` SAME).

### Fase 1 — Core dashboard: forecast + presentwx (endpoint #1 & #2 di mapping)
- `useBmkgWeather`: fetch `forecast/coord` (proxy) + `presentwx/coord` (direct) per koordinat.
- Adapter → `WeatherData` + `HourlyForecast` + agregat 10 hari.
- Sambungkan di `App.vue`: ganti `generateMockWeatherForCity` → composable, **mock jadi fallback**
  (try/catch → data mock + flag `isMock` untuk badge kecil "data demo").
- Komponen yang otomatis hidup: `CurrentWeather`, `HeroWeatherCard`, `ForecastPanel`,
  `ForecastTemperatureChart`, `ForecastPrecipitationChart` (verifikasi prop-compat satu per satu).
- ✅ Selesai bila: dashboard menampilkan data live Jakarta default + ganti kota mengubah data;
  offline/API error → UI tetap tampil (mock).

### Fase 2 — Peringatan + mingguan + sunset (#3, #4, #5)
- `warning` (proxy public) → `WarningAlert[]` → `AlertsPanel` (mapping severity: `Awas/Siaga/Waspada`).
- `weekly-temperature` (proxy) → chart mingguan.
- `sunset/json` (direct v1) → sunrise/sunset di `CurrentWeather` (day/night logic).
- ✅ Selesai bila: alert live muncul saat ada peringatan; grafik suhu mingguan live; ikon siang/malam akurat.

### Fase 3 — Pelengkap ringan
- `adm/coord` (proxy) menggantikan Nominatim reverse di `App.vue` (fallback Nominatim tetap).
- `amandemen/coord` → badge "amandemen" di panel prakiraan bila non-kosong.
- `banners`, `video-latest`, `tcwc/cyclone/all` → slot banner, section video, indikator siklon.
- ✅ Selesai bila: pencarian lokasi resolve via BMKG; badge siklon tampil saat ada sirkulasi.

### Fase 4 — Maritim & peta (paling banyak aset)
- `nearest-location` (proxy) → `WaveRadarMap`/`MaritimeAdvisorDrawer`.
- `maps/*/metadata/tiles` + `spartan/pollution` tiles + `windmap` → layer peta (ganti/duet dengan CartoCDN).
- `sus/modelrun` + `spartan/map/modelrun` → pemilih waktu run model.
- ✅ Selesai bila: layer peta live render, tanpa error CORS di console.

### Fase 5 — Berita + non-prioritas
- WP REST (`blog/wp-json/wp/v2/posts?_embed`) → `NewsSection` (pilih endpoint posts/media).
- Skip: `developer/*`, `subscribe-type` (butuh akun / tidak relevan publik).
- ✅ Selesai bila: berita live dari WordPress.

## 4. Resiliensi & aturan main

1. **Mock tetap hidup sebagai fallback** sampai semua fase stabil (flag `isMock`).
2. **Timeout 10s + retry 1x** di `api.ts`; error tidak boleh membuat halaman putih.
3. Tidak ada perubahan kontrak props komponen kecuali benar-benar perlu (adapter yang menyesuaikan).
4. Tiap fase di-commit terpisah, push tetap ke **origin (gitlab)**.

## 5. Verifikasi per fase

- Struktur response: `node docs/scrapping_cuaca-bmkg-go-id/diff.mjs` (harus SAME).
- UI: network tab bebas error CORS/403; data berubah saat ganti kota/koordinat.
- Edge: koordinat luar jangkauan (403 dari API) → fallback mock + toast; token expired (401) →
  proxy auto-refresh token sekali lalu retry.

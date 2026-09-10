# ENDPOINTS — cuaca.bmkg.go.id

Semua endpoint yang terdeteksi dari network capture (Playwright) + probe langsung.
Sample: `baseline/api_probes/` (probe Node) & `baseline/<route>/` (capture browser).

Header auth per family lihat README.md. UA wajib full browser string.

> **Akses di redesign (dev)**: family dengan auth `Referer+Origin` (`/api/df/*`) dan
> `x-public-token` (`/api/public/*`, `/api/v1/public/*`, `/api/v1/user/*`) **wajib lewat
> proxy** (Vite dev / `api/bmkg/[...path].ts` di prod) — browser tidak bisa mengirim header
> tersebut. Family `Terbuka` / `X-API-KEY` bisa **direct** dari browser (`ACAO: *`).
> Daftar per endpoint: kolom "Akses (dev)" di `../api-mapping/api-mapping.xlsx`.

## A. ISDP API — `https://cuaca.bmkg.go.id/api/v1/*` (auth: `X-API-KEY`)

| Endpoint | Method | Params | Response shape | Dipakai di |
|---|---|---|---|---|
| `/api/v1/setting/find-code?code=active` | GET | `code` (`active` bebas; nilai lain 401) | `{statusCode, message, data: {id, code, name, setting: {public_background, aviation_background, maritim_background}}}` — tema background per section | semua route |
| `/api/v1/sunset/json` | GET | `lat`, `lng` | `{results: {date, sunrise, sunset, golden_hour, day_length, moonrise, moonset, moon_phase, moon_illumination, ...}, status, tzid}` — 30+ field sun/moon | home |
| `/api/v1/tcwc/cyclone/all` | GET | — | `{status, data: {cyclone_info: [...]}}` — sirkulasi siklon TCWC Jakarta | home |
| `/api/v1/public/maritim/nearest-location` | GET | `lat`, `long` | `{statusCode, data: {code (F.09), name (Teluk Jakarta), wilpel, geometry: Polygon GeoJSON}}` — wilayah laut terdekat | home (drawer maritim) |
| `/api/v1/sus/modelrun` | GET | — | `{model_available: [...]}` — daftar run model windmap | home (radar), /aviation, /map |
| `/api/v1/api/signature/impact/public/list/<ISO8601>` | GET | path: tanggal `YYYY-MM-DDT00:00:00Z` (7 hari ke depan) | `{data: {data: [...]}}` — daftar impact-based forecast per tanggal | /ibf, /map (layer Peringatan) |
| `/api/v1/maps/general/metadata/tiles` | GET | — | metadata tile-layer peta umum | /map |
| `/api/v1/maps/warning/metadata/tiles` | GET | — | `{sources, layers, layouts, overlays}` (18KB) | /map, home |
| `/api/v1/maps/maritim/metadata/tiles` | GET | — | idem (22KB) | /map, /maritim |
| `/api/v1/maps/aviation/metadata/tiles` | GET | — | **500 via Node** (200 via browser) | /aviation, /map |
| `/api/v1/maps/tourism/metadata/tiles` | GET | — | idem | /map |
| `/api/v1/tourism/tiles/data/tourism.json` | GET | — | POI wisata (GeoJSON/JSON) | /map |
| `/api/v1/sus/tiles/data/suspoi.json` | GET | — | POI (502 flaky saat probe; 200 via browser) | /map |
| `/api/v1/maritim/route` | GET | — | rute pelayaran (404 via Node, 200 via browser — butuh context CF) | /maritim |
| `/api/v1/maritim/water-area/water_area_point.geojson` | GET | — | GeoJSON titik area laut | /maritim |
| `/api/v1/user/subscribe-type` | GET | — | tipe subscription (auth publik token) | /premium |
| `/api/v1/developer/login` | POST | body `{email, password}` | 404 kredensial kosong; untuk akun dev | /Login, /devtools |
| `/api/v1/developer/register` | POST | — | idem | /register |
| `/api/v1/developer/token-management` (+`/services`) | GET | — | 401 tanpa login dev | /devtools/tokens |

### Tile pattern (raster, layer peta /map)
`/api/v1/spartan/pollution/{pol}/{level}/{t0}/{t1}/{z}/{x}/{y}.png`
- `{pol}`: `co` (dan polutan lain), `{t0}/{t1}`: `YYYYMMDDHHmm` (range 1 jam), tile z/x/y standar.
- Windmap: `https://bmkg-sus.geo.id/windmap/ecmwf/1000` (+ suffix z/x/y dari client).

## B. Public API — `https://cuaca.bmkg.go.id/api/public/*` & `/api/v1/public/*` (auth: `x-public-token`)

| Endpoint | Method | Params | Response shape | Dipakai di |
|---|---|---|---|---|
| `/api/public/weather/warning` | GET | `lat`, `long` | `{statusCode, data: {today: {...}, tomorrow: {...}}}` — peringatan cuaca per wilayah | home |
| `/api/public/weather/warning/cyclone` | GET | `lat`, `long` | status siklon lokal | home |
| `/api/public/weather/weekly-temperature` | GET | `lat`, `long` | `{data: {daily: [{date, temperature}], weekly: [...]}}` — grafik "Suhu Mingguan" | home |
| `/api/public/weather/video-latest` | GET | `hashtag` (`infobmkgpws`) | `[{title, videoUrl, ...}]` — video IG terbaru | home |
| `/api/public/banners` | GET | — | `{data: [banner]}` | home |
| `/api/v1/user/subscribe-type` | GET | — | subscription tiers | /premium |

## C. Forecast API — `https://cuaca.bmkg.go.id/api/df/v1/*` (auth: Referer/Origin; param invalid → 403)

| Endpoint | Method | Params | Response shape | Dipakai di |
|---|---|---|---|---|
| `/api/df/v1/forecast/coord` | GET | `lat`, `lon` | `{lokasi: {adm1..adm4, provinsi, kotkab, kecamatan, desa, lon, lat, distance, timezone}, data: [{lokasi, cuaca: [[jam], [jam3], ...10 grup hari]}]}` — grup1 jam-per-jam, dst 3-jam-an hingga +9 hari. Item: `{datetime (ISO Z), t (°C), tcc (%), tp (mm), weather (int kode), weather_desc/_en, wd_deg, wd, wd_to, ws (km/h→label), hu (%), vs (m), vs_text, time_index, analysis_date, image (icon URL), utc_datetime, local_datetime}` | home, /perbandingan |
| `/api/df/v1/amandemen/coord` | GET | `lat`, `lon` | `{lokasi, amandemen: []}` — amandemen prakiraan (kosong = tidak ada) | home, /perbandingan |
| `/api/df/v1/adm/coord` | GET | `lat`, `lon` | `{adm1..adm4, provinsi, kotkab, kecamatan, desa, lon, lat, distance}` — resolve admin area dari koordinat | home, /perbandingan |

Error: koordinat `999` / kosong → `403 {status:403, message:"Forbidden"}` (bukan Cloudflare).

## D. Present Weather — `https://cuaca.bmkg.go.id/api/presentwx/*` (terbuka)

| Endpoint | Params | Response |
|---|---|---|
| `/api/presentwx/coord` | `lat`, `lon` | `{status, data: {lokasi, cuaca: {...}}}` — cuaca observasi saat ini (sumber kartu "Cuaca Saat Ini") |

## E. External / pendukung

| Service | URL | Keterangan |
|---|---|---|
| Spartan | `https://spartan.bmkg.go.id/map/modelrun` | `{model_available, gfs_indo, spartan, spartanobs, pcm_co, pcm_pm25, gsmap, FDRS_BRG, QPE24h, ...}` — katalog model, terbuka |
| WIDIS | `https://widis.bmkg.go.id/ndf/cgms/weather/forward` | satellite weather forward (butuh param; 404 tanpa) |
| Windmap SUS | `https://bmkg-sus.geo.id/windmap/ecmwf/1000` | ECMWF wind tiles |
| CircleGeo | `https://tiles.circlegeo.com/data/{indocg,administration}.json` | boundary administratif peta |
| Blog WP | `https://cuaca.bmkg.go.id/blog/wp-json/wp/v2/` | konten /berita* — **dirender SSR** (tidak muncul di XHR) |
| Weather lama | `https://weather.bmkg.go.id/api/` | `defaultURL` di runtime config (belum terpakai di capture) |
| Chat | `tawk.to` | widget livechat |
| Analytics | Cloudflare zaraz/rum, Google GA | noise |

## Kode cuaca (`weather`) yang teramati di baseline

`0` Cerah (Sunny), `1` Cerah, `2` Cerah Berawan (Partly Cloudy), `3` Berawan (Mostly Cloudy) — mapping lengkap datang per-response via `weather_desc`/`weather_desc_en`/`image` (`api-apps.bmkg.go.id/storage/icon/cuaca/*.svg`), jadi tabel kode tidak perlu di-hardcode: pakai field `weather_desc` langsung.

## Icon assets

`https://api-apps.bmkg.go.id/storage/icon/cuaca/{cerah,cerah-berawan,berawan,...}-{am,pm}.svg` — suffix `am`/`pm` untuk siang/malam.

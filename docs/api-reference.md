# API Reference — cuaca.bmkg.go.id (scraped) + BMKG Open Data (resmi)

> Referensi teknis semua endpoint. Komparasi status/pemakaian: `api-comparison.md`.
> Data sample: `scrapping_cuaca-bmkg-go-id/baseline/`.

# Bagian 1 — API internal cuaca.bmkg.go.id (hasil scraping)

Semua endpoint yang terdeteksi dari network capture (Playwright) + probe langsung.
Sample: `baseline/api_probes/` (probe Node) & `baseline/<route>/` (capture browser).

UA wajib full browser string.

> **Akses di redesign (dev)**: family dengan auth `Referer+Origin` (`/api/df/*`) dan
> `x-public-token` (`/api/public/*`, `/api/v1/public/*`, `/api/v1/user/*`) **wajib lewat
> proxy** (Vite dev / `api/bmkg/[...path].ts` di prod) — browser tidak bisa mengirim header
> tersebut. Family `Terbuka` / `X-API-KEY` bisa **direct** dari browser (`ACAO: *`).
> Daftar per endpoint: kolom "Akses (dev)" di `bmkg-api-mapping.xlsx`.

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


---

## Lampiran: Auth client (dari __NUXT_DATA__ & bundle)

## Runtime config (`window.__NUXT__.config`, di HTML tiap render)

```js
{
  public: {
    baseURL: "https://cuaca.bmkg.go.id/api/v1/",
    publicBaseURL: "https://cuaca.bmkg.go.id/api/",
    dfBaseURL: "https://cuaca.bmkg.go.id/api/df",
    presentwxBaseURL: "https://cuaca.bmkg.go.id/api/presentwx",
    defaultURL: "https://weather.bmkg.go.id/api/",
    postBlog: "https://cuaca.bmkg.go.id/blog/wp-json/wp/v2/",
    defaultLang: "id",
  },
  app: { buildId: "d2971517-78e2-4b58-b44e-499af6df6213" },
}
```

## SSR state (`__NUXT_DATA__`)

- `$spublicToken` → `{token: "<JWT type=public_access>", expiresAt: <epoch ms>}` — JWT **short-lived ~30 menit** (`iat`→`exp` 1800s), di-issue server saat render. Dikirim sebagai header **`x-public-token`** untuk `/api/public/*`.
- `$sapiKey` → JWT statis (payload `{id: "1c5adee1...", iat: 1701583379}` = Des 2023). Dikirim sebagai header **`X-API-KEY`** untuk `/api/v1/*`.

## Interceptor (dari bundle `RhJE6rBC.js` / `CSY6jMQr.js`)

```js
// axios instance v1 (timeout 9e6 ms)
r.interceptors.request.use(e => { e.headers["X-API-KEY"] = useState("apiKey").value; ... });
// axios instance devtools (timeout 1e4 ms)
m.interceptors.request.use(o => {
  o.headers.Authorization = "Bearer " + publicToken.value;
  o.headers["X-API-KEY"] = apiKeyStore.value; ...
});
```

## Cara ambil publicToken fresh (untuk probe/diff)

```bash
curl -s -A "<UA browser lengkap>" https://cuaca.bmkg.go.id/ \
  | python3 -c "import sys,re; h=sys.stdin.read(); s=h[h.find('publicToken'):]; print(re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+',s).group(0))"
```

## Matriks header per family

| URL family | Header wajib | Tanpa header → |
|---|---|---|
| `/api/v1/*` | `X-API-KEY` | 401 "API KEY not provided!!" |
| `/api/public/*`, `/api/v1/public/*` | `x-public-token` (fresh!) | 401 "Public access token not provided" |
| `/api/df/v1/*` | `Referer` + `Origin` situs | 403 Forbidden |
| `/api/presentwx/*` | — | terbuka |
| `/api/v1/setting/find-code`, `/api/public/banners`, `spartan.bmkg.go.id/map/modelrun`, `maps/{warning,maritim}/metadata/tiles` | — | terbuka |
| `/api/v1/developer/*` | login dev | 401 |


---

# Bagian 3 — BMKG Open Data (RESMI — data.bmkg.go.id & maritim.bmkg.go.id/public_api)

> **Jalur resmi dari daftar partner BMKG.** Terdokumentasi, tanpa auth, limit 60 req/menit/IP
> (kecuali disebut lain), **WAJIB atribusi "BMKG" di UI**. Sample response tersimpan:
> `scrapping_cuaca-bmkg-go-id/baseline/open-data/`. Ringkasan tabel: `bmkg-api-mapping.xlsx`
> sheet **Official Open Data**.
>
> ⚠️ Web original (cuaca.bmkg.go.id) **TIDAK memakai** API Open Data ini (0 request di baseline) —
> dia pakai API internal ISDP. Open Data = peluang jalur resmi tambahan untuk redesign.

## 3.1 API Maritim — maritim.bmkg.go.id/public_api (resmi, dari daftar partner)

**Index:** `https://maritim.bmkg.go.id/public_api/` — "Data Terbuka BMKG (Cuaca Maritim)"
Semua data digital hasil pemodelan BMKG (per 17 Feb 2025).

### a) Cuaca Perairan — 232 wilayah perairan

| Endpoint | Isi |
|---|---|
| `GET /public_api/perairan_list` | Daftar file JSON per wilayah (name, file_date, kb) |
| `GET /public_api/perairan/{file}` | Data prakiraan 1 wilayah (contoh `F.09_Teluk%20Jakarta.json`) |
| `GET /public_api/static/wilayah_perairan.json` | **GeoJSON polygon** 232 wilayah + kode referensi (725 KB) |
| `GET /public_api/overview/gelombang.json` | Overview kategori gelombang per wilayah (today/tomorrow/h2/h3) |

- Format waktu: 4 slot prakiraan berurutan **12-12-24-24 jam** (`time_desc`: Hari ini, Besok, H+2, H+3)
- Field per slot: `weather`, `weather_desc` (narasi), **`warning_desc`** (peringatan dini cuaca buruk —
  contoh "Waspada Angin Kencang"), `wave_cat`/`wave_desc` (kategori + rentang m), `wind_from/to`,
  `wind_speed_min/max` (knot), `area_remark`
- **Kode wilayah (contoh `F.09` Teluk Jakarta) SAMA dengan kode respons internal
  `/api/v1/public/maritim/nearest-location`** → sambungan natural: GPS → nearest-location → code →
  fetch perairan resmi
- → Cocok untuk card: **Aktivitas Pesisir & Laut, Pelayaran, WaveRadarMap**

### b) Cuaca Pelabuhan — 294 pelabuhan

| Endpoint | Isi |
|---|---|
| `GET /public_api/pelabuhan_list` | Daftar file JSON pelabuhan (port_id, name) |
| `GET /public_api/pelabuhan/{file}` | Data 1 pelabuhan (contoh `0088_Sintete.json`) |

- Per pelabuhan: `port_id`, `name`, koordinat, `type` (utama/…)
- Field per slot (2 rilis terakhir): semua field perairan **plus**: `current_from/to`,
  `current_speed_min/max` (arus cm/s), `visibility`, `rh_min/max`, `temp_min/max`,
  **`low_tide`/`high_tide` + jamnya** (pasut!)
- → Cocok untuk card: **Pelayaran / Pelabuhan, tinggi rendah pasut**

## 3.2 Prakiraan cuaca per desa (ADM4)

```
GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah_tingkat_IV}
contoh: https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001
```

- Coverage: **3 hari, per 3 jam (8x/hari)**, pemutakhiran 2x sehari
- Params: `adm4` = kode wilayah Kemendagri No. 100.1.1-6117/2022 → **persis field `adm4`** yang
  dikembalikan `adm/coord` internal (sambungan natural: GPS → adm/coord → adm4 → official API)
- Field per item: `t` (°C), `hu` (%), `weather_desc`/`_en`, `ws` (km/jam), `wd`, `tcc` (%),
  `tp` (mm), `vs_text`, `analysis_date`, `image` — **hampir identik** respons internal
  `forecast/coord` → adapter existing dapat dipakai ulang
- Contoh kode resmi: `github.com/infoBMKG/data-cuaca`
- Implikasi: kandidat jalur DIRECT untuk 3-harian hourly; internal `df/forecast/coord` tetap
  berguna untuk 7–10 hari (official belum menyediakan)

## 3.3 Gempabumi (resmi — sudah dipakai redesign, path terverifikasi dari halaman open data)

Basis: `https://data.bmkg.go.id/DataMKG/TEWS/` (+ `.json` / `.xml`)

| Endpoint | Isi | Status di redesign |
|---|---|---|
| `GET .../TEWS/autogempa.json` | Gempa terbaru (M5.0+) | ✅ EarthquakeActivity |
| `GET .../TEWS/gempaterkini.json` | Daftar gempa M5.0+ terkini (15 entri) | ✅ EarthquakeHistory |
| `GET .../TEWS/gempadirasakan.json` | Gempa dirasakan (dengan felt reports) | ✅ EarthquakeHistory |
| `GET .../TEWS/tsunamiterkini.json` | **404** — path tidak tersedia (dinyatakan ada di halaman open data, tunggu path resmi) | — |

Field gempa: `Tanggal, Jam, DateTime, Coordinates, Lintang, Bujur, Magnitude, Kedalaman, Wilayah, Potensi`
(+ shakemap jpg: `https://static.bmkg.go.id/[kode_shakemap].jpg`)

## 3.4 Peringatan Dini Cuaca (Nowcast) — RSS/CAP

```
GET https://www.bmkg.go.id/alerts/nowcast/id          (RSS feed, per provinsi)
GET https://www.bmkg.go.id/alerts/nowcast/id/{kode_detail_cap}_alert.xml  (CAP, s/d kecamatan)
```

- RSS item: `title` (mis. "Hujan Lebat disertai Petir di Sumatera Barat"), `link` (CAP), `description`
- CAP 1.2 (`urn:oasis:names:tc:emergency:cap:1.2`): `event`, `severity`, `certainty`, `expires`,
  `description` (daftar kecamatan terdampak), `areaDesc`
- ⚠️ **Produk berbeda dari** `/api/public/weather/warning` internal (nowcast 3-jam vs peringatan
  harian today/tomorrow) — internal test 4 titik Sumbar = kosong saat RSS punya item (item RSS
  pun bisa stale/expired di feed)
- → Kandidat sumber peringatan yang **selalu terisi** & resmi; butuh adapter RSS/CAP baru

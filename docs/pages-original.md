# Pages Original — cuaca.bmkg.go.id

Semua route publik (diekstrak dari route table bundle Nuxt + verifikasi Playwright).
Teks UI lengkap per route: `scrapping_cuaca-bmkg-go-id/baseline/text/*.txt`. Screenshot: `scrapping_cuaca-bmkg-go-id/screenshots/*.png`.

## Route map

| Route | Status | Judul/Isi | API utama |
|---|---|---|---|
| `/` | 200 | Dashboard cuaca (default lokasi Jakarta) | lihat breakdown di bawah |
| `/perbandingan` | 200 | Bandingkan Lokasi Cuaca (multi-lokasi) | `df/v1/forecast/coord`, `df/v1/adm/coord`, `df/v1/amandemen/coord` |
| `/maritim` | 200 | Cuaca maritim + rute pelayaran | `v1/public/maritim/nearest-location`, `v1/maritim/route`, `v1/maritim/water-area/*.geojson`, `maps/maritim/metadata/tiles` |
| `/aviation` | 200 | Cuaca penerbangan (SIGMET tab → 3 API: `maps/aviation/metadata/tiles`, `v1/sus/modelrun`, `spartan/map/modelrun`) | idem |
| `/ibf` | 200 | Impact-Based Forecast — tab tanggal Sep 8–14 → 1 API per tanggal (`v1/api/signature/impact/public/list/<tanggal>`) | idem |
| `/map` | 200 | Peta interaktif; layer: General, Peringatan (20 API: impact list + tiles polusi SPARTAN), Maritim, Penerbangan, Turis (2 API) | `maps/*/metadata/tiles`, `tourism.json`, `suspoi.json`, `spartan/pollution/*` |
| `/berita` | 200 | Berita (SSR dari WordPress `blog/wp-json/wp/v2/`, 0 XHR) | — |
| `/berita/infografis` | 200 | Galeri infografis (SSR) | — |
| `/berita/video` | 200 | Galeri video (SSR) | — |
| `/premium` | 200 | Landing premium (judul kosong) | `v1/user/subscribe-type` |
| `/devtools`, `/devtools/tokens` | 200 | Dev console + manajemen token developer | `v1/developer/*` (auth) |
| `/Login`, `/register` | 200 | Form auth developer | `v1/developer/login` (POST) |

External nav (bukan bagian app): `signature.bmkg.go.id/dwt` (Digital Weather for Traffic), `inasiam.bmkg.go.id`, `maritim.bmkg.go.id/inawis`.

## Breakdown `/` (homepage) — mapping section → API

Semua API termuat upfront (interaksi klik → 0 API baru). Default koordinat browser: Jakarta `-6.2, 106.816666` (geolocation → semua endpoint koordinat).

| Section UI (urutan muncul) | Sumber data |
|---|---|
| Header: logo BMKG, nav Beranda/Penerbangan/Maritim/Premium, tombol LOG IN | statis |
| Lokasi saat ini ("Desa/Kelurahan Kebon Melati, Kec. Tanah Abang, Kota Adm. Jakarta Pusat, DKI Jakarta") | `df/v1/adm/coord` (adm1→desa) |
| Kartu Cuaca Saat Ini: 32°C, Berawan Tebal, "Terasa seperti 35°C", unit angin m/s–km/jam–knot, Arah Angin, Kelembapan 51% | `presentwx/coord` |
| Peringatan: "Tidak ada peringatan cuaca buruk saat ini" | `api/public/weather/warning` (+`/cyclone`) |
| Tombol "Laporkan Cuaca Lokasi Anda" | form (tanpa API terlihat) |
| Radar Cuaca (map mini) | `maps/warning/metadata/tiles` + tiles + `v1/sus/modelrun` |
| Prakiraan 10 hari (Hari Ini 31°/57% …) | `df/v1/forecast/coord` (grup cuaca per hari) |
| Tab **Ringkasan / Per Jam / Suhu Mingguan** | Ringkasan+Per Jam = `forecast/coord`; Suhu Mingguan = `api/public/weather/weekly-temperature` |
| Info terkait lokasi (sunset/sunrise/moon) | `v1/sunset/json` |
| Peta wilayah laut terdekat (drawer maritim) | `v1/public/maritim/nearest-location` |
| Amandemen prakiraan | `df/v1/amandemen/coord` |
| Banner promo | `api/public/banners` |
| Video terbaru (@infobmkgpws) | `api/public/weather/video-latest` |
| Sirkulasi siklon | `v1/tcwc/cyclone/all` |
| Background gradient tema | `v1/setting/find-code?code=active` |
| Footer: Tentang Direktorat Meteorologi Publik, share X/FB/WA | statis |

## Temuan UI penting untuk redesign

- Site pakai **div** bukan `h1-h3` → test berbasis teks, bukan heading.
- Drawer/modal besar: lokasi (search), bandingkan, maritim — konten ter-render via Vue teleport (`#teleports`).
- i18n ID/EN aktif (`defaultLang: id`, toggle id/en di header).
- Livechat tawk.to di pojok.
- Cloudflare challenge aktif (request dari Node tanpa UA penuh → 403).

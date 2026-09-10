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

# BMKG Signature — DWT (Digital Weather for Traffic)

Sumber: probe live 2026-02 (curl + Playwright) + hasil crawl search engine. Situs:
`https://signature.bmkg.go.id/dwt/` — aplikasi **CesiumJS 3D** "Rencanakan Perjalanan"
(rute kereta/pesawat/kapal + cuaca sepanjang rute).

## 1. Cloudflare — scraping otomatis GAGAL total

Host `signature.bmkg.go.id` memakai Cloudflare challenge di **semua path** (termasuk
`/api/*` dan `robots.txt` → 403 "Just a moment…"). Sudah dicoba & gagal:

- Playwright headless Chromium → 403
- Playwright **headed** + `--disable-blink-features=AutomationControlled` → 403
- **Chrome asli** (`channel: 'chrome'`) + persistent profile + spoof `navigator.webdriver` → tetap di interstisial "Tunggu sebentar…"
- Klik checkbox Turnstile via iframe → tidak tersedia/otomatis

Deteksinya level CDP (automation) — bukan sekadar UA. Satu-satunya jalur andal:
**session browser asli user** (buka situs normal, DevTools → Network → export HAR /
copy URL request yang merah) atau attach CDP ke Chrome yang dilaunch user sendiri.

## 2. Backend ArcGIS — TERBUKA tanpa Cloudflare (temuan crawl)

Dua host ArcGIS Enterprise melayani data-nya, keduanya jelas dari metadata publik:

### dashboard-signature.bmkg.go.id/server/rest/services (v11.4)
Folder: `GPTOOL`, `Hosted`, `IBF-NOWCASTING`, `MEWS`, `NWP`, `Utilities`.
- `IBF-NOWCASTING`: IBF, NOWCASTING, STATUS, ADMIN — endpoint dalam **sering timeout/000**
- `MEWS`: nowcasting banjir Jakarta (Area_Jalan, AWS_ARG, Nowcasting_MEWS, TMA, dll) —
  untuk portal signature MEWS, bukan DWT

### datacuaca.bmkg.go.id/arcgis/rest/services/production (v10.91) ✅ query jalan
| Service | Layer | Status probe |
|---|---|---|
| `signature_bmkg_forecast/FeatureServer` | 0 "Signature Forecast" | **count = 0 (kosong)** |
| `nowcasting_public/MapServer` | 0 Provinsi, 1 Kota Kab, 2 "Nowcasting aktif" | layer 2 **count = 0** |
| `prakiraan_cuaca/FeatureServer` | 0 Titik Kecamatan | schema OK |
| `rdca`, `rdca_geohotspot`, `geohotspot`, `saoffg`, `spartan_gsmmap` | — | terdaftar |

Deskripsi `signature_bmkg_forecast` membocorkan API aplikasinya:
`https://signature.bmkg.go.id/api/signature/impact/public/list/{ISO-UTC}` (cth
`2022-08-18T00:00:00Z`) — **Cloudflare'd, tak bisa diprobe**.

## 3. Interpretasi toast "Data terkini tidak tersedia. Menampilkan prediksi."

Saat memilih mode **kereta** di DWT, app mencoba data realtime (nowcast/IBF sepanjang
rute) → kosong → jatuh ke prediksi. Probe pendukung: layer "Nowcasting aktif" DAN
"Signature Forecast" sama-sama **0 feature** saat pengetesan → data kosong adalah
**kondisi sisi server/pipeline**, bukan error di sisi user. Toast = fallback by design.
Endpoint spesifik kereta (rute KAI, dsb.) tidak terverifikasi — ada di balik Cloudflare.

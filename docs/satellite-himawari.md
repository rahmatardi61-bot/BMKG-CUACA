# Scraping Data Citra Satelit BMKG — Dokumentasi Endpoint

Hasil investigasi live (terverifikasi 22 Sep 2026). Semua endpoint di bawah sudah dites dan mengembalikan data.
**Re-verifikasi sendiri (capture script, 22 Sep 2026)**: `modelrun` hidup (gk2a stale 15 Sep ✓), tile `6/52/31 EH` → 200 PNG 6,7KB ✓, `inderaja` tanpa header CORS ✓, `satellite` → `ACAO: *` ✓.

---

## 1. Tile API — `satellite.bmkg.go.id` ⭐ (paling fleksibel)

API tile peta (XYZ/TMS) yang dipakai peta interaktif Himawari BMKG.

### 1a. Daftar frame terbaru
```
GET https://satellite.bmkg.go.id/api22/modelrun
```
Response JSON berisi daftar timestamp per model (ISO 8601 UTC):
```json
{
  "himawari9":      ["2026-09-22T08:50:00Z", "2026-09-22T08:40:00Z", "..."],  // 18 frame
  "himawari9hires": ["2026-09-22T08:40:00Z", "..."],
  "himawari9fd":    ["2026-09-22T08:40:00Z", "..."],
  "gk2a":           ["2026-09-15T19:10:00Z", "..."],
  "gsmaprainrate":  ["2024-12-24T06:00:00Z"],
  "gsmapaccum12h":  ["2024-12-23T17:46:01Z"],
  "gsmapaccum24h":  ["2024-12-24T04:40:01Z"],
  "gsmapaccum72h":  ["2024-12-24T04:45:01Z"]
}
```

### 1b. Ambil tile PNG 256×256
```
GET https://satellite.bmkg.go.id/api22/tile/{z}/{x}/{y}.png
    ?tiletype={tiletype}&modelname={model}&param={param}&baserun={timestamp_dari_modelrun}
```

**Tabel kombinasi valid (terverifikasi HTTP 200):**

| model | tiletype | param valid | arti |
|---|---|---|---|
| `himawari9` | `himawari9` | `EH` | Infrared Enhanced |
| `himawari9` | `himawari9` | `NC` | Natural Color |
| `himawari9` | `himawari9` | `WV` | Water Vapor Enhanced |
| `himawari9` | `himawari9` | `RP` | Rainfall Potential |
| `himawari9` | `himawari9` | `SW` | Sandwich |
| `himawari9` | `himawari9` | `SM` | Smoke |
| `himawari9` | `himawari9` | `VA` | Volcanic Ash |
| `himawari9` | `himawari9` | `VS` | Visible |
| `himawari9hires` | `himawari9` | `VS` | Visible Hires 500 m |
| `gk2a` | `himawari9` | `EH`, `WV`, `RP` | GK2A (Korea) |
| `gsmaprainrate` | `mag` | `rainrate` | GSMAP rain rate ⚠️ server timeout |
| `gsmapaccum12h/24h/72h` | `mag` | `accum12h/24h/72h` | GSMAP akumulasi ⚠️ |

> ⚠️ GSMAP: server mengembalikan `422 tileworker timeout` — data sumber di server BMKG sudah basi (Des 2024). Untuk hujan gunakan gambar full dari inderaja.

**Contoh konkret (terbukti 200, PNG 256×256 RGBA):**
```
https://satellite.bmkg.go.id/api22/tile/6/52/31.png?tiletype=himawari9&modelname=himawari9&param=EH&baserun=2026-09-22T08:40:00Z
```
Catatan: skema `tms:true` → konversi XYZ standar: `y_xyz = 2^z - 1 - y_tms` (tidak selalu persis — pakai `tms:true` di Leaflet/MapLibre, jangan hitung manual).
Zoom yang melayani data: z=0–2 overview, detail maks z=7–8 (z≥9 blur, z≥11 kosong) → set `maxZoom: 8`.

### 1c. Titik data per koordinat — MATI
```
GET /point/onedate/{param}/{lng}/{lat}/{timestamp}   → ❌ 404 (bug server BMKG)
GET /point/rangedate/{model}/{lng}/{lat}/{ISO8601}   → ❌ 404
```
UI BMKG tetap memanggilnya, tapi endpoint mati. Butuh nilai per koordinat → pakai `cuaca.bmkg.go.id/api/df/v1/forecast/coord`.

### 1d. Overlay GeoJSON hotspot asap — MATI
```
GET https://satellite.bmkg.go.id/apistatic/geohotspot/OGH_{YYYYMMDDHHMM}.geojson   → ❌ 404
```

### 1e. Daftar titik lightning/overshooting
```
GET https://satellite.bmkg.go.id/apipoints   → 200 tapi isinya path MBTiles lokal, tidak berguna
```

### 1f. Proxy CORS mereka — MATI
```
POST https://satellite.bmkg.go.id/api/forward   → ❌ 404
```
Alternatif langsung: `https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_SCC_Indonesia.txt` (200, text/plain) — server-side saja.

---

## 2. Gambar statis — `inderaja.bmkg.go.id` ⭐ (paling simpel)

PNG resolusi tinggi (1674×1118), update ~10 menit, `cache-control: max-age=300`, **tanpa parameter**.
**❌ TANPA CORS — hanya bisa via `<img>`/`background-image`, TIDAK bisa `fetch()`** (inilah kenapa patch fetch capture script tidak melihat request satelit → refill binary marker).

### 2a. Citra Himawari (dipakai app kita — SatelliteMap.vue)
```
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png   # Infrared Enhanced (suhu awan)
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_NC_Indonesia.png   # Natural Color (awan)
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_WE_Indonesia.png   # Water Vapor
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png   # Rainfall Potential (hujan)
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RD_Indonesia.png   # RDCA
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Jakarta.png     # Jabodetabek
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_SCC_Indonesia.txt  # teks analisis awan konvektif (721 B)
https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_SCC_Indonesia.png  # peta awan konvektif
```
PARAM: `EH` `NC` `WE`/`WV` `RP` `RD` `VS`. AREA: 45 pilihan — `Indonesia`, `Jakarta`, `Aceh`, … `Region1`–`Region5`.

### 2b–2f. Produk lain
```
/IMAGE/MTS/VS/MTS_VS_Indonesia.png            # Visible
/IMAGE/MTS/IW/MTS_IW_Indonesia.png            # vektor angin
/IMAGE/GK2/GK2_EH_Indonesia.png               # GK2A (stale)
/IMAGE/GSMAP/Hourly_Prec.png                  # hujan per jam
/IMAGE/HCAI/CLC/HCAI_CLC_Indonesia.png        # tipe awan
/IMAGE/HOTSPOT/Hotspot_Indonesia.png          # hotspot
/IMAGE/GEOHOTSPOT/H08_GH_Asean.png            # geohotspot
/IMAGE/LDN/ld_a10.png                         # petir 10 menit
/Trajektori/Asap.png                          # sebaran asap
/Trajektori/{Semeru,Ibu,Dukono,Lewotobi,Anak_Krakatau}.png
```

### 2g. Animasi GIF 18 frame ⭐
```
/IMAGE/ANIMASI/H08_EH_Indonesia_m18.gif       # IR Enhanced (7,4 MB)
/IMAGE/ANIMASI/H08_WE_Indonesia_m18.gif       # Water Vapor (19,8 MB!)
/IMAGE/ANIMASI/H08_EH_Jakarta_m18.gif         # Jabodetabek (2,5 MB)
```
Pola `{PRODUK}_{AREA}_m18.gif`. Tidak ada: `NC`, `RP`, `MTS_VS`, `GSMaP`. Pakai `loading="lazy"`.

> ⚠️ Directory listing (`/IMAGE/`, dst) = **403** — harus tahu nama file persis.

---

## 3. CORS Matrix (hasil tes origin ketiga)

| Host | `Access-Control-Allow-Origin` | `fetch()` | `<img>` | Canvas `getImageData()` |
|---|---|---|---|---|
| `satellite.bmkg.go.id` | `*` ✅ | ✅ | ✅ | ⚠️ butuh `crossOrigin` |
| `inderaja.bmkg.go.id` | ❌ | ❌ | ✅ | ❌ tainted |

**Aturan emas:** `satellite` = aman `fetch()`; `inderaja` = hanya `<img>`.
Leaflet default TIDAK set `crossOrigin` → canvas tainted meski tile 200. Butuh baca pixel/export → `L.tileLayer(url, { tms: true, crossOrigin: true })`.

---

## 4. Integrasi peta (kalau upgrade SatelliteMap jadi interaktif)

```ts
// 1. fetch frame (CORS *) — jangan hardcode baserun
const r = await fetch("https://satellite.bmkg.go.id/api22/modelrun");
const frames = (await r.json()).himawari9;   // terbaru di index 0

// 2. tile layer — WAJIB tms:true; maxZoom 8; overlay di atas basemap
//    (tile transparan di luar cakupan Indonesia — 204 = di luar area, skip)
L.tileLayer(
  `https://satellite.bmkg.go.id/api22/tile/{z}/{x}/{y}.png?tiletype=himawari9&modelname=himawari9&param=${param}&baserun=${baserun}`,
  { tms: true, crossOrigin: true, opacity: 0.9, maxNativeZoom: 8, maxZoom: 8 }
);
// MapLibre: { type:'raster', tiles:[url], tileSize:256, scheme:'tms' } + raster-fade-duration: 0
// ganti frame: layer.setUrl(...) / source.setTiles([...]) — tanpa flicker
```
Polling `modelrun` tiap 30 s (meniru situs BMKG); handle 204=skip, 400=param salah, 422=gsmap mati.

---

## 5. Catatan teknis

1. **Timestamp**: `modelrun` ISO 8601 UTC; format `YYYYMMDDHHMM` (geohotspot) = hapus `-:TZ`.
2. **Cache**: Cloudflare, `max-age=300` — refresh tiap 10 menit cukup.
3. **Rate limit**: tidak ada; 27 request berturut aman. Jangan poll < 30 s.
4. **Endpoint mati** (jangan dipakai): `point/*`, `apistatic/geohotspot`, `api/forward`, tile `gsmap*`, `/apipoints`.
5. **Stale**: GK2A (15 Sep), GSMAP (Des 2024) — untuk data terkini selalu Himawari.
6. **Atribusi**: cantumkan "Sumber: BMKG" di UI.

---

*Bagian FE guide (hook React, proxy Next.js allowlist, contoh vanilla JS lengkap) tersimpan di arsip percakapan — inti teknisnya sudah diringkas §3–4. Minta jika butuh versi lengkapnya.*

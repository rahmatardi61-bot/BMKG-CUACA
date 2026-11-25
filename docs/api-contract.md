# Kontrak API — gateway BMKG

Dokumen ini untuk **mesin dan AI**: skema, aturan, dan riwayat perubahan.
Untuk manusia, buka halaman `/api-docs` (perlu login) — isinya sama plus contoh.

Kode: `api/**/*.js` · bentuk respons: `lib/normalize.js` · gerbang: `lib/http.js`
Katalog langsung dari server: `GET /api` (JSON, tanpa auth).

---

## Aturan yang mengikat

1. **Semua endpoint wajib `Authorization: Bearer <jwt>`** (Keycloak, realm
   `bmkg-partner`). Tanpa token → `401 UNAUTHORIZED`. Model auth **satu** untuk
   web partner, mobile, dan dashboard (opsi A).
2. **Tidak ada data contoh di lapisan ini.** Kalau BMKG gagal, jawabannya error
   `502 UPSTREAM_ERROR`. Mock hanya ada di widget/dashboard, tidak di sini.
   Alasannya: aplikasi pemanggil tidak boleh menampilkan berita/angka karangan
   tanpa tahu itu karangan.
3. **Error selalu** `{ error, code, reason }`. Pakai `code`, jangan teks `error`.

   | code | HTTP | arti |
   |---|---|---|
   | `UNAUTHORIZED` | 401 | token tidak ada / tanda tangan tidak sah |
   | `BAD_REQUEST` | 400 | `lat`/`lon` hilang atau bukan angka |
   | `UPSTREAM_ERROR` | 502 | BMKG menolak atau mati — bukan salah pemanggil |
   | `NOT_FOUND` | 404 | endpoint tidak ada |

4. **Nama field mengikuti artinya**, bukan nama BMKG (`t` → `temp`, `tp` →
   `precipitation`, `hu` → `humidity`, `ws` → `windSpeed`, `weather_desc` →
   `condition`).
5. **Tidak ada `icon`** di respons. Nama ikon adalah urusan UI; menurunkannya
   dari `condition` (lihat `descToIcon` di `src/services/bmkg/adapters.ts`).
6. **Tanpa versi di URL.** Karena itu: jangan ganti nama/arti field, hanya boleh
   menambah. Setiap perubahan dicatat di bagian *Riwayat* di bawah.
7. **Waktu lokal Indonesia** dikirim apa adanya dari BMKG (`date` + `time`
   terpisah). `visibility` bisa `null` — artinya BMKG tidak mengirim, **bukan** nol.

---

## Dua hal yang mudah disalahpahami

### `precipitation` bukan peluang hujan

```js
// lib/normalize.js
precipitation: mm <= 0 ? 0 : Math.min(100, Math.round(mm * 20))
```

Nilai 0–100 dari **curah hujan** (mm × 20, dibatasi 100). 2 mm → 40.
Nama field dipertahankan atas keputusan produk; artinya **intensitas hujan**.
Kalau pemanggil menampilkannya sebagai "peluang hujan 40%", itu salah tafsir.

### `derived` bukan data BMKG

```js
observation.derived = {
  feelLike: Math.round(temp + Math.max(0, (humidity - 50) / 10)),  // aproksimasi heat index
  uvIndex: cloud > 70 ? 2 : cloud > 40 ? 5 : 8,                    // hanya dari tutupan awan
}
```

Keduanya disimpan **di dalam objek `derived`** supaya bedanya terlihat secara
struktural, bukan hanya lewat komentar. `uvIndex` mengabaikan jam dan lintang —
jangan dipakai untuk klaim resmi.

---

## Endpoint

| Endpoint | Query | Respons |
|---|---|---|
| `GET /api/weather/current` | `lat`, `lon` | `{ region, observation }` |
| `GET /api/weather/forecast` | `lat`, `lon` | `{ region, hours[] }` |
| `GET /api/weather/alerts` | `lat`, `lon` | `{ alerts[] }` |
| `GET /api/weather/nowcast` | `province?` | `{ total, alerts[] }` |
| `GET /api/weather/weekly-temperature` | `lat`, `lon` | `{ daily[], weekly[] }` |
| `GET /api/weather/cyclones` | — | `{ cyclones[] }` |
| `GET /api/weather/amendment` | `lat`, `lon` | `{ region, count, items[] }` — `items` **belum pernah teramati terisi** |
| `GET /api/weather/forecast-official` | `adm4` | `{ region, hours[] }` (jalur cadangan) |
| `GET /api/sky/sun-times` | `lat`, `lon` | `{ sunrise, sunset, moonPhase, … }` |
| `GET /api/marine/nearest` | `lat`, `lon` | `{ marine }` |
| `GET /api/marine/ports` | `lat?`, `lon?` | `{ ports[] }` atau `{ port, distanceKm }` |
| `GET /api/marine/waves` | — | `{ zones[] }` |
| `GET /api/geo/region` | `lat`, `lon` | `{ region }` |
| `GET /api/geo/district-weather` | `lat?`, `lon?`, `kind?` | `{ file, stations[] }` atau `{ file, station }` |
| `GET /api/news` | — | `{ videos[], posts[], warnings[] }` |
| `GET /api` | — | katalog endpoint (tanpa auth) |

### `region`

```json
{
  "province": "DKI Jakarta",
  "city": "Kota Adm. Jakarta Barat",
  "district": "Pal Merah",
  "village": "Slipi",
  "codes": { "adm1": "31", "adm2": "31.73", "adm3": "31.73.07", "adm4": "31.73.07.1002" },
  "lat": -6.194, "lon": 106.801,
  "distanceKm": 0
}
```

`lat`/`lon` di sini adalah **titik yang dipakai BMKG**, bukan input mentah —
bisa berbeda beberapa ratus meter dari yang dikirim.

### `hours[]` / `observation`

```json
{
  "date": "2026-11-25", "time": "15:00",
  "temp": 28, "precipitation": 52, "condition": "Hujan Ringan",
  "humidity": 81, "windSpeed": 4.5, "windDirection": "W",
  "visibility": null
}
```

`observation` = bentuk yang sama + `derived`.

Upstream mengirim `cuaca` sebagai **array bersarang** (satu array per hari).
Di sini sudah diratakan jadi `hours[]` dan diurutkan naik menurut `date`+`time`.

### Sumber upstream per endpoint

| Endpoint | Upstream |
|---|---|
| `weather/current` | `cuaca.bmkg.go.id/api/presentwx/coord` |
| `weather/forecast` | `cuaca.bmkg.go.id/api/df/v1/forecast/coord` |
| `weather/alerts` | `cuaca.bmkg.go.id/api/public/weather/warning` |
| `weather/nowcast` | `www.bmkg.go.id/alerts/nowcast/id` (RSS) |
| `weather/weekly-temperature` | `cuaca.bmkg.go.id/api/public/weather/weekly-temperature` |
| `weather/cyclones` | `cuaca.bmkg.go.id/api/v1/tcwc/cyclone/all` |
| `sky/sun-times` | `cuaca.bmkg.go.id/api/v1/sunset/json` |
| `marine/nearest` | `cuaca.bmkg.go.id/api/v1/public/maritim/nearest-location` |
| `marine/ports` | `maritim.bmkg.go.id/public_api/pelabuhan_list` |
| `marine/waves` | `maritim.bmkg.go.id/public_api/overview/gelombang.json` |
| `geo/region` | `cuaca.bmkg.go.id/api/df/v1/adm/coord` |
| `geo/district-weather` | `publik.bmkg.go.id/event/source/dwt/apiDF_Darat\|Kereta/…` |
| `weather/amendment` | `cuaca.bmkg.go.id/api/df/v1/amandemen/coord` |
| `weather/forecast-official` | `api.bmkg.go.id/publik/prakiraan-cuaca?adm4=` |
| `news` | `…/blog/wp-json/wp/v2/posts` + `…/api/public/weather/video-latest` |

Header yang tidak bisa dilakukan browser (`Referer`, `Origin`, `X-API-KEY`,
`x-public-token`) disuntik di `lib/upstream.js` — satu tempat, dipakai juga
oleh proxy mentah `/api/bmkg`.

---

## Spesifikasi OpenAPI

Selain dokumen ini dan halaman `/api-docs`, tersedia spesifikasi mesin:

| URL | Isi | Auth |
|---|---|---|
| `GET /v3/api-docs` | OpenAPI 3.0.3 (JSON) | tidak — dokumentasi harus bisa dibaca sebelum punya token |
| `GET /api` | katalog ringkas | tidak |

URL `/v3/api-docs` sengaja meniru springdoc supaya tim yang biasa membuka
Swagger langsung mengenalinya. Bisa ditempel ke Swagger UI, Postman, atau
dipakai `openapi-generator` untuk membuat klien Android.

Spesifikasinya ditulis di `lib/openapi.js` — **bukan** hasil generate dari kode,
karena endpoint kita tidak memakai decorator. Konsekuensinya: kalau endpoint
berubah, file itu yang harus diperbarui. Yang menjaga agar tidak basi:

```bash
# 1. sah menurut aturan OpenAPI (validator resmi)
curl -s localhost:5173/v3/api-docs > /tmp/openapi.json
npx @redocly/cli lint /tmp/openapi.json

# 2. daftar path cocok dengan katalog GET /api (tidak ada yang tertinggal)

# 3. contoh respons benar-benar cocok dengan respons sungguhan
```

Pemeriksaan ketiga penting: dokumentasi yang menyebut field yang tidak pernah
dikirim server adalah kebohongan yang lebih halus daripada salah ketik biasa.
Empat endpoint sengaja **tanpa contoh** (`marine/ports`, `marine/waves`,
`geo/district-weather`, `/api`) karena jalur suksesnya belum pernah teramati —
lebih baik kosong daripada dikarang.

---

## Siapa yang memakai kontrak ini

**Dashboard dan 25 widget embed memakai endpoint di atas** — bukan jalur mentah
BMKG lagi. Konsekuensinya disengaja: kalau kontrak berubah, produk kita sendiri
ikut rusak lebih dulu, jadi kontrak tidak bisa basi diam-diam.

Yang masih memanggil di luar gateway, beserta alasannya:

| Pemanggil | Masih memanggil | Alasan |
|---|---|---|
| `openData.ts` (maritim) | `maritim.bmkg.go.id/public_api/*` langsung | detail perairan + polygon belum diekspos (`/api/marine/{waves,ports}` sudah ada, tapi upstream 503) |
| `satellite.bmkg.go.id`, `inderaja.bmkg.go.id` | langsung dari widget | tile gambar publik, tanpa token, tanpa CORS — bukan data yang perlu dinormalkan |

Semua ke `cuaca.bmkg.go.id`, `www.bmkg.go.id`, `publik.bmkg.go.id`, dan
`api.bmkg.go.id` sudah lewat gateway.

---

## Status upstream (diuji 25 Nov 2026)

| Upstream | Status | Akibat |
|---|---|---|
| `presentwx`, `forecast`, `adm`, `warning`, `weekly-temperature`, `sunset`, `cyclone`, `video-latest` | 200 | normal |
| `alerts/nowcast/id` (RSS) | 200 | normal |
| `maritim.bmkg.go.id/public_api/*` | **503** | `marine/ports`, `marine/waves` → 502 |
| `publik.bmkg.go.id/event/source/dwt/…/manifest_times.json` | **404** | `geo/district-weather` → 502 |
| `blog/wp-json/wp/v2/posts` | **502** | `news.posts` kosong + `warnings` |

Endpoint yang upstream-nya mati **tetap didokumentasikan** karena bentuk
responsnya sudah ditetapkan. Yang belum pernah diuji end-to-end hanya isinya,
bukan kontraknya.

---

## Cara menguji

```bash
# 1. token (POC saja — produksi: backend partner)
TOKEN=$(curl -s http://localhost:5173/api/embed-token | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. satu endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5173/api/weather/forecast?lat=-6.2&lon=106.8"

# 3. kesetaraan perilaku: normalize + adapters vs patokan sebelum refactor
node lib/normalize.check.js
```

`lib/fixtures/raw/*.json` = respons mentah BMKG yang direkam sekali.
`lib/fixtures/expected.json` = hasil `adapters.ts` **sebelum** dashboard
dipindah ke `/api/*`. Uji membandingkan keduanya, jadi memindahkan sumber data
tidak boleh mengubah satu angka pun yang dilihat pengguna.

`lib/normalize.check.js` membandingkan `lib/normalize.js` dengan
`src/services/bmkg/adapters.ts` yang selama ini dipakai 22 widget: `temp`,
`precipitation`, `condition`, `humidity`, `windSpeed`, `date`, `time`,
`feelLike`, `uvIndex` harus identik. Ini penjaga utama saat `adapters.ts`
diubah memakai `normalize*`.

---

## Riwayat perubahan

| Tanggal | Perubahan |
|---|---|
| 25 Nov 2026 | 13 endpoint pertama. `visibility` → `null` (dulu `0` saat upstream kosong). `feelLike`/`uvIndex` dipindah ke `derived`. |
| 25 Nov 2026 | `weather/amendment` + `weather/forecast-official`; `geo/district-weather` menerima `kind=kereta`. Dashboard & widget pindah memakai endpoint ini. |

Kalau arti sebuah field berubah, **wajib** menambah baris di sini — tidak ada
nomor versi di URL yang bisa menyelamatkan pemanggil lama.

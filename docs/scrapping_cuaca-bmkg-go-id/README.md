# Dokumentasi Scraping & Deep Testing — cuaca.bmkg.go.id

> Hasil breakdown menyeluruh situs **https://cuaca.bmkg.go.id/** menggunakan Playwright —
> mencakup semua route, API, konten, dan UI — sebagai **modal data / baseline untuk
> pencocokan** konten project redesign (`src/`) terhadap situs live.
> Captured: **8 Sep 2026** (WIB).

## Ringkasan eksekusi

1. **Recon** — situs teridentifikasi sebagai Nuxt 3 SSR dengan backend "ISDP API" (NestJS).
2. **Route discovery** — 14 route publik diekstrak dari route table bundle Nuxt, diverifikasi via Playwright (lihat `routes.json`).
3. **Capture per route** — visit semua route; intercept seluruh request XHR/fetch; simpan response JSON + full-page screenshot + teks DOM.
4. **Interaction probe** — klik semua button/tab per route → pemetaan aksi → API terpicu (`interaction_report.json`).
5. **API probe langsung** — 64 endpoint di-hit direct dengan variasi koordinat 6 kota (`baseline/api_probes/`).
6. **Reverse auth** — model autentikasi 3 lapis berhasil dipecahkan sehingga semua endpoint bisa di-hit tanpa browser.

## Temuan kunci

- **Arsitektur auth 3 lapis** (detail: `api_client_auth.md`):
  - `/api/v1/*` → header `X-API-KEY` (JWT statis, di-inject SSR ke state `apiKey`)
  - `/api/public/*` → header `x-public-token` (JWT short-lived ~30 menit, di-issue per render)
  - `/api/df/*` → cukup `Referer` + `Origin` situs
  - `/api/presentwx/*` → terbuka; Cloudflare menolak UA pendek (wajib UA browser penuh)
- **Homepage memuat semua data upfront** — semua interaksi klik (tab Ringkasan/Per Jam/Suhu Mingguan, drawer) memicu **0 API baru**; data sudah lengkap dari `forecast/coord` (9 hari, hourly), `weekly-temperature`, `sunset`, `warning`, dll.
- **API inti** = `GET /api/df/v1/forecast/coord?lat=&lon=` — respons berisi lokasi admin (adm1–adm4 → desa) + cuaca per jam & per 3 jam hingga +9 hari, dengan kode cuaca int + `weather_desc` + icon SVG.
- `/berita*` = SSR dari WordPress (`blog/wp-json/wp/v2/`), tidak lewat XHR.
- Site memakai **div** (bukan h1–h3) dan drawer via `#teleports` → test UI berbasis teks.
- i18n ID/EN aktif; livechat tawk.to; `window.__NUXT__.config` membuka semua baseURL.

## Isi direktori

| Path | Isi |
|---|---|
| `ENDPOINTS.md` | Referensi semua endpoint: params, auth, response shape, pemakai |
| `PAGES.md` | Peta route + breakdown section homepage → API |
| `api_client_auth.md` | Runtime config, interceptor, matriks header auth |
| `routes.json` | Daftar route publik (dari bundle Nuxt) |
| `capture_report.json` / `interaction_report.json` | Ringkasan capture & pemetaan klik→API |
| `baseline/<route>/` | Response JSON per request saat visit route + `_route.json` (manifest) |
| `baseline/api_probes/` | Response probe langsung per endpoint (variasi 6 kota) |
| `baseline/text/` | innerText per route (sebelum & sesudah interaksi) |
| `screenshots/` | Full-page screenshot 14 route |

## Tooling (script di direktori ini)

```bash
cd docs/scrapping_cuaca-bmkg-go-id
npm i playwright            # sekali (node_modules di-gitignore)

node capture.mjs capture            # visit semua route → baseline/ + screenshots/
node capture.mjs capture /maritim   # re-capture satu route
node probe.mjs "/perbandingan" ...  # klik semua button/tab, catat API terpicu
node api_probe.mjs                  # hit langsung 64 endpoint (variasi kota)
node diff.mjs                       # PENCOCOKAN: bandingkan struktur vs baseline
```

## Alur update ke depan (pencocokan data)

```bash
node diff.mjs   # → "SAME" per endpoint = struktur stabil
                # → "DIFF" = struktur situs berubah; re-run:
node api_probe.mjs && node capture.mjs capture   # baseline baru → review ENDPOINTS.md
```

Perbandingan bersifat **struktural** (bentuk key/type), bukan nilai — sehingga perubahan
suhu/jam tidak dianggap berubah, hanya perubahan skema/endpoint yang di-flag.

> Halaman ber-auth (`/premium`, `/devtools/*`, `/Login`, `/register`) dibaseline sebagai
> UI form saja; API-nya butuh akun developer (POST `/api/v1/developer/login`).

# Docs Index — Redesign BMKG Cuaca

> Entry point tunggal dokumentasi project. Format: **markdown + 1 file xlsx (multi-sheet)**.
> Terakhir dirapikan: 10 Sep 2026.

## Konteks (4 modal kerja)

| Modal | Peran |
|---|---|
| **Project redesign** (`src/`, repo ini) | Target implementasi |
| **Original** `https://cuaca.bmkg.go.id/` | Acuan fitur & UI bawaan |
| **Hasil scraping** (`scrapping_cuaca-bmkg-go-id/`) | Baseline data/API original |
| **BMKG Open Data** `https://data.bmkg.go.id/prakiraan-cuaca/` | API **resmi** terdokumentasi (jalur terbaik ke depan) |

Acuan utama tetap: **fitur web original + fitur redesign**, lalu dipetakan ke API mana yang
dipakai / belum dipakai / tersedia versi resminya.

## Struktur

| File | Isi | Kapan dibaca |
|---|---|---|
| `api-comparison.md` | Komparasi API original vs redesign vs official + status implementasi + daftar wajib-proxy | Mulai kerja / review backlog |
| `api-reference.md` | Referensi teknis semua endpoint (internal scraped + resmi open data) + model auth/proxy | Implementasi / debugging |
| `team-notes.md` | Keputusan penyesuaian satuan (§1), endpoint tanpa slot UI (§2), temuan teknis (§3), **smoke test checklist** (§4) | Diskusi tim / QA manual |
| `pages-original.md` | Peta route & section→API web original | Meniru perilaku UI original |
| `bmkg-api-mapping.xlsx` | **SATU file xlsx, 5 sheet**: `API Mapping` (32 endpoint, status + akses dev), `Web`/`Mobile` (checklist fitur tim), `Official Open Data` (API resmi), `Ringkasan` | Presentasi/rapat tim |
| `scrapping_cuaca-bmkg-go-id/` | Data: baseline JSON, screenshot, teks UI, report + tooling Playwright (`capture/probe/api_probe/diff.mjs`) | Butuh data mentah / re-scrape |

## Aturan main dokumentasi

- **Markdown** = narasi & referensi (4 file konten + index ini). Baru menambah dokumen = pikir dua kali; masukkan ke file yang ada dulu.
- **xlsx** = satu file `bmkg-api-mapping.xlsx`, di-edit **manual** (WPS/Excel) — kolom status & akses per endpoint; jangan membuat file xlsx baru.
- **Data scraping** = output tool, jangan diedit manual; update via `node capture.mjs capture` / `node api_probe.mjs` di folder tooling (lihat `scrapping_cuaca-bmkg-go-id/README.md`).
- Semua ini **modal pencocokan data** — bukan API docs resmi. Kekurangan data resmi diisi dari scraping; begitu BMKG merilis docs resmi, dokumen internal mengalah.

## Alur kerja cepat

1. **Cek data berubah?** → `cd scrapping_cuaca-bmkg-go-id && node diff.mjs` (SAME/DIFF per endpoint)
2. **Tahu API baru dari scraping?** → tambah baris di `bmkg-api-mapping.xlsx` (sheet API Mapping) + `api-reference.md`
3. **Implementasi endpoint** → update kolom Status di xlsx + `api-comparison.md`
4. **Keputusan desain/satuan** → catat di `team-notes.md` §1–2

## Peta status singkat (detail: `api-comparison.md`)

- ✅ Terimplementasi: 8 endpoint (dashboard, warning, sunset, berita, cyclone, adm)
- 🟡 Sebagian: 2 (amandemen, maritim-nearest — fetch siap, UI menyusul)
- 🔴 Belum: 10 · 🟠 Beda-sumber: 8 · 🔵 Redesign-only: 4
- 🆕 Official Open Data: prakiraan-cuaca ADM4 (direct!), gempabumi (resmi — ternyata sudah dipakai), nowcast CAP (kandidat pengganti warning)

# Panduan staging: app + Loki + Grafana

Semua perintah dijalankan **di host staging**, bukan di laptop.
Bentuk akhir: app dan Loki satu host (compose), Grafana tim lain membaca Loki kita.

## 1. Prasyarat host

- Docker + plugin `docker compose` (`docker compose version` harus jalan).
- Port `4021` (app) dan `3100` (Loki) bisa dijangkau; `3100` hanya perlu terbuka
  ke IP Grafana (172.11.12.124).
- Host staging harus bisa keluar ke `172.11.12.124:9411` (Zipkin).

## 2. Berkas yang dipakai

| Berkas | Fungsi |
|---|---|
| `Dockerfile` | build app (stage produksi hanya menyalin dist/api/lib/server) |
| `docker-compose.yml` | service `app` + `loki`, volume `loki-data` |
| `loki-config.yaml` | config Loki: retensi 7 hari, penyimpanan filesystem |
| `.env` | **tidak** ikut build (sudah di `.dockerignore`), di-inject saat run |

## 3. Siapkan `.env` di host staging

Salin dari lokal, lalu ubah tiga nilai ini:

```
OBS_ENV=staging                  # supaya log dev & staging tidak tercampur
OBS_SERVICE=bmkg-cuaca           # atau bmkg-cuaca-staging kalau mau dipisah di Zipkin
```

`LOKI_URL` tidak perlu diubah: `docker-compose.yml` sudah memaksa `LOKI_URL=http://loki:3100`
untuk service `app`, supaya `.env` lokal yang berisi `127.0.0.1` tidak ikut terpakai
(kesalahan ini membuat log hilang tanpa pesan error).

Sisanya (`KEYCLOAK_*`, `ZIPKIN_URL`) tetap sama. Jangan commit `.env`.

## 4. Jalankan

```
docker compose up -d --build       # build app + start loki
docker compose ps                  # app & loki harus "running"
docker compose logs -f app         # log JSON: {ts, level, msg, app, env, traceId, ...}
```

Loki butuh ~30-45 detik sampai siap; `/ready` akan `503` dulu, itu normal.

## 5. Verifikasi (urut, jangan lompat)

```
# a. app hidup
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4021/v3/api-docs      # 200
curl -sD - -o /dev/null http://localhost:4021/v3/api-docs | grep -i x-trace-id  # ada trace id

# b. loki siap dan menerima data
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3100/ready            # 200
curl -sG --data-urlencode 'query={app="bmkg-cuaca"}' \
  http://localhost:3100/loki/api/v1/query_range | head -c 200                   # ada baris log

# c. trace masuk Zipkin
curl -s -u admin:*** 'http://172.11.12.124:9411/api/v2/services'                # memuat bmkg-cuaca
```

## 6. Sambungkan Grafana (datasource terpisah)

Buat datasource baru khusus staging, jangan menimpa yang lokal:

```
curl -u admin:*** -H 'Content-Type: application/json' -X POST \
  --data '{"name":"Loki ISDP staging","type":"loki","access":"proxy","url":"http://<IP-STAGING>:3100"}' \
  http://172.11.12.124:3000/api/datasources

# uji dari sisi Grafana (bukan dari host staging)
curl -u admin:*** http://172.11.12.124:3000/api/datasources/uid/<uid>/health
```

Kalau health gagal, berarti Grafana tidak bisa menjangkau `<IP-STAGING>:3100` - itu masalah
firewall/routing, bukan aplikasi.

Query di Grafana Explore (pilih datasource staging):

```
{app="bmkg-cuaca", env="staging"}
{app="bmkg-cuaca"} |= "error"
{app="bmkg-cuaca"} | json | traceId="<id dari header X-Trace-Id>"
```

## 7. Perawatan

- Log disimpan 7 hari (`limits_config.retention_period: 168h` di `loki-config.yaml`).
  Naikkan kalau perlu, tapi cek `docker system df` - volume `loki-data` ikut tumbuh.
- `docker compose restart app` cukup untuk perubahan `.env`; `--build` hanya kalau kode berubah.
- Jangan hapus volume `loki-data` kecuali memang ingin membuang semua log.

## 8. Kalau ada masalah

| Gejala | Cek |
|---|---|
| app jalan tapi log tidak muncul di Grafana | `LOKI_URL` harus `http://loki:3100`; lihat `docker compose logs loki` |
| trace tidak muncul di Zipkin | `ZIPKIN_URL` benar? host bisa keluar ke 9411? respons API punya `X-Trace-Id`? |
| Grafana health gagal | port 3100 tidak terbuka ke IP Grafana, atau IP staging salah |
| Loki `/ready` 503 terus | tunggu 30-45 detik; kalau tetap, `docker compose logs loki` |
| disk penuh | turunkan retensi, atau `docker compose down -v` (log hilang) |

## 9. Membongkar

```
docker compose down          # stop, data log tetap
docker compose down -v       # stop + hapus volume log
curl -u admin:*** -X DELETE http://172.11.12.124:3000/api/datasources/uid/<uid>
```

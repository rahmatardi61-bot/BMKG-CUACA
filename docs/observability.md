# Observability: Zipkin (trace) + Loki/Grafana (log)

Kode: `lib/observability.js` (tanpa dependensi). Env:

```
ZIPKIN_URL=http://172.11.12.124:9411   # kirim span (ingest Zipkin terbuka)
ZIPKIN_USER=                           # hanya perlu kalau ingest dikunci
ZIPKIN_PASS=
LOKI_URL=http://127.0.0.1:3100         # Loki yang kita kelola sendiri
LOKI_USER=
LOKI_PASS=
OBS_SERVICE=bmkg-cuaca                 # nama di Zipkin & label Loki
OBS_ENV=dev
```

## Kenapa Loki sendiri

Loki milik tim lain hanya ada sebagai `http://loki:3100` di jaringan docker mereka, tidak
terbuka ke host, dan Grafana menolak POST lewat datasource proxy
(`non allow-listed POSTs not allowed`). Jadi kita jalankan Loki sendiri.

## Menjalankan Loki

```
docker run -d --name loki-isdp -p 3100:3100 grafana/loki:3.1.0 \
  -config.file=/etc/loki/local-config.yaml
```

Kalau service ikut docker compose, taruh Loki di network yang sama dan pakai
`LOKI_URL=http://loki:3100` (nama service), bukan `127.0.0.1`.

## Menyambungkan Grafana ke Loki kita

Butuh sekaligus: zipkin sudah terisi; datasource ditambah di Grafana yang ada.

```
curl -u admin:*** -H 'Content-Type: application/json' -X POST \
  --data '{"name":"Loki ISDP","type":"loki","access":"proxy","url":"http://<IP-KITA>:3100"}' \
  http://172.11.12.124:3000/api/datasources

# cek dari sisi Grafana (bukan dari mesin kita)
curl -u admin:*** http://172.11.12.124:3000/api/datasources/uid/<uid>/health
```

Hapus lagi kalau tidak dipakai: `curl -u admin:*** -X DELETE .../api/datasources/uid/<uid>`

## Query yang berguna

```
{app="bmkg-cuaca"} |= "error"
{app="bmkg-cuaca"} | json | status >= 500
{app="bmkg-cuaca"} | json | traceId="196e779603437c79"
```

Di Grafana, tambahkan *derived field* pada datasource Loki:
`traceId` -> `http://172.11.12.124:9411/zipkin/traces/${__value.raw}` supaya satu klik
dari log langsung membuka trace-nya.

## Catatan keamanan

Loki tanpa auth: siapa pun yang bisa menjangkau port 3100 dapat menulis dan membaca log.
Batasi ke jaringan internal, atau tambahkan auth sebelum dipakai di produksi. Kredensial
hanya di `.env` (gitignored) atau `--env-file` saat deploy; jangan di Dockerfile.

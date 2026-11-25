// ═══════════════════════════════════════════════════════════════════════════
// KATALOG ENDPOINT — halaman /api-docs
//
// Sumber kebenaran tetap `api/index.js` (GET /api). Halaman ini menampilkannya
// dan menambahkan hal yang tidak bisa dikirim server-side: contoh curl, contoh
// respons, dan alasan di balik bentuk yang aneh (mis. `derived`).
//
// Kalau endpoint baru ditambah, cukup: daftarkan di api/index.js (untuk mesin)
// dan tambah satu entri di SINI (untuk manusia). Nomor baris di `live` sengaja
// tidak ditulis tangan — halaman menanyakan ke server.
// ═══════════════════════════════════════════════════════════════════════════

export type Field = {
  name: string;
  type: string;
  note?: string;
};

export type EndpointDoc = {
  path: string;
  group: 'weather' | 'sky' | 'marine' | 'geo' | 'news';
  title: string;
  desc: string;
  query: string[];
  auth: boolean;
  sample: string;
  sampleRes: string;
  fields: Field[];
  /** catatan penting: nilai turunan, upstream mati, jebakan nama field */
  warn?: string;
};

export const GROUPS: Array<{ id: EndpointDoc['group']; label: string; desc: string }> = [
  { id: 'weather', label: 'weather', desc: 'Cuaca darat: kondisi, prakiraan, peringatan, siklon, amandemen' },
  { id: 'sky', label: 'sky', desc: 'Matahari & bulan' },
  { id: 'marine', label: 'marine', desc: 'Laut: wilayah perairan, pelabuhan, gelombang' },
  { id: 'geo', label: 'geo', desc: 'Wilayah & stasiun pengamatan' },
  { id: 'news', label: 'news', desc: 'Berita & video BMKG' },
];

const REGION_FIELDS: Field[] = [
  { name: 'region.province', type: 'string' },
  { name: 'region.city', type: 'string', note: 'kotkab' },
  { name: 'region.district', type: 'string', note: 'kecamatan' },
  { name: 'region.village', type: 'string', note: 'desa/kelurahan' },
  { name: 'region.codes', type: 'object', note: 'adm1…adm4, dipakai API BMKG lain' },
  { name: 'region.lat / lon', type: 'number', note: 'titik yang dipakai BMKG (bukan input mentah)' },
];

const OBSERVATION_FIELDS: Field[] = [
  { name: 'observation.date', type: 'string', note: 'YYYY-MM-DD' },
  { name: 'observation.time', type: 'string', note: 'HH:MM waktu lokal' },
  { name: 'observation.temp', type: 'number', note: '°C, dibulatkan' },
  { name: 'observation.precipitation', type: 'number', note: '0–100, lihat peringatan di bawah' },
  { name: 'observation.condition', type: 'string', note: 'teks Indonesia dari BMKG' },
  { name: 'observation.humidity', type: 'number', note: '%' },
  { name: 'observation.windSpeed', type: 'number', note: 'km/jam' },
  { name: 'observation.windDirection', type: 'string', note: 'mata angin: N, NE, …' },
  { name: 'observation.visibility', type: 'number | null', note: 'km; null = BMKG tidak kirim' },
  { name: 'observation.derived.feelLike', type: 'number', note: 'TURUNAN, bukan BMKG' },
  { name: 'observation.derived.uvIndex', type: 'number', note: 'TURUNAN, bukan BMKG' },
];

export const ENDPOINTS: EndpointDoc[] = [
  {
    path: '/api/weather/current',
    group: 'weather',
    title: 'Kondisi cuaca saat ini',
    desc: 'Observasi terakhir BMKG untuk titik terdekat. Dipakai kartu "Kondisi Saat Ini".',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/current?lat=-6.2&lon=106.8"',
    sampleRes: `{
  "region": { "province": "DKI Jakarta", "city": "Kota Adm. Jakarta Barat",
              "district": "Pal Merah", "village": "Slipi",
              "codes": { "adm1": "31", "adm4": "31.73.07.1002" },
              "lat": -6.194, "lon": 106.801 },
  "observation": {
    "date": "2026-11-25", "time": "14:00",
    "temp": 30, "precipitation": 0, "condition": "Berawan Tebal",
    "humidity": 72, "windSpeed": 4.5, "windDirection": "W",
    "visibility": null,
    "derived": { "feelLike": 32, "uvIndex": 2 }
  }
}`,
    fields: [...REGION_FIELDS, ...OBSERVATION_FIELDS],
    warn: 'Nilai feelLike dan uvIndex bukan berasal dari BMKG. Keduanya dihitung pada lapisan server (heat index sederhana; UV hanya dari tutupan awan) dan tidak untuk ditampilkan sebagai data resmi.',
  },
  {
    path: '/api/weather/forecast',
    group: 'weather',
    title: 'Prakiraan per jam',
    desc: 'Semua langkah waktu yang dikirim BMKG (hari ini + 9 hari), sudah diratakan dan diurutkan.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/forecast?lat=-6.2&lon=106.8"',
    sampleRes: `{
  "region": { "province": "DKI Jakarta", "city": "Kota Adm. Jakarta Barat", … },
  "hours": [
    { "date": "2026-11-25", "time": "15:00", "temp": 28,
      "precipitation": 52, "condition": "Hujan Ringan",
      "humidity": 81, "windSpeed": 4.5, "windDirection": "W",
      "visibility": null }
  ]
}`,
    fields: [
      ...REGION_FIELDS,
      { name: 'hours[]', type: 'array', note: 'urut naik menurut tanggal+jam' },
      { name: 'hours[].date / time', type: 'string' },
      { name: 'hours[].temp', type: 'number', note: '°C' },
      { name: 'hours[].precipitation', type: 'number', note: '0–100 (intensitas, bukan peluang)' },
      { name: 'hours[].condition', type: 'string' },
      { name: 'hours[].humidity', type: 'number', note: '%' },
      { name: 'hours[].windSpeed', type: 'number', note: 'km/jam' },
      { name: 'hours[].windDirection', type: 'string' },
      { name: 'hours[].visibility', type: 'number | null' },
    ],
    warn: 'Pada upstream, `cuaca` berbentuk array bersarang dengan satu array per hari. Di sini data telah diratakan menjadi `hours[]`; struktur lama tidak lagi digunakan.',
  },
  {
    path: '/api/weather/alerts',
    group: 'weather',
    title: 'Peringatan dini cuaca',
    desc: 'Peringatan per wilayah. Sering kali kosong, yang berarti tidak ada peringatan.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/alerts?lat=-6.2&lon=106.8"',
    sampleRes: `{ "alerts": [] }

// bila ada:
{ "alerts": [ { "day": "today", "severity": "Waspada",
                "description": "Hujan lebat disertai petir …" } ] }`,
    fields: [
      { name: 'alerts[].day', type: 'string', note: 'today | tomorrow' },
      { name: 'alerts[].severity', type: 'string', note: 'Awas | Siaga | Waspada' },
      { name: 'alerts[].description', type: 'string' },
    ],
    warn: 'Upstream internal ini sering kosong. Untuk feed yang hampir selalu terisi, pakai /api/weather/nowcast.',
  },
  {
    path: '/api/weather/nowcast',
    group: 'weather',
    title: 'Nowcast (RSS)',
    desc: 'Feed peringatan nasional. Sumbernya RSS, bukan JSON — parsing XML dilakukan di server.',
    query: ['province?'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/nowcast?province=Jawa Barat"',
    sampleRes: `{
  "total": 23,
  "alerts": [
    { "id": "nowcast-…", "severity": "Waspada",
      "title": "Hujan Lebat disertai Petir di Gorontalo",
      "description": "…", "region": "Gorontalo", "date": "2026-11-25" }
  ]
}`,
    fields: [
      { name: 'total', type: 'number', note: 'jumlah sebelum disaring provinsi' },
      { name: 'alerts[].severity', type: 'string', note: 'dipetakan dari judul, bukan field resmi' },
      { name: 'alerts[].region', type: 'string', note: 'diambil dari judul setelah "di …"' },
    ],
    warn: 'RSS tidak menyediakan field severity maupun expires. Nilai severity di sini merupakan hasil pemetaan kata kunci dari judul dan bersifat perkiraan, bukan bulletin resmi.',
  },
  {
    path: '/api/weather/weekly-temperature',
    group: 'weather',
    title: 'Suhu mingguan',
    desc: 'Deret suhu harian & mingguan.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/weekly-temperature?lat=-6.2&lon=106.8"',
    sampleRes: `{ "daily": [ { "date": "2026-11-25T00:00:00Z", "temperature": 26.72541300455698 }, … ],
  "weekly": [] }`,
    fields: [
      { name: 'daily[]', type: 'array', note: '7 hari' },
      { name: 'weekly[]', type: 'array', note: 'terbukti selalu kosong saat kontrak disusun' },
      { name: '[].date', type: 'string', note: 'timestamp ISO apa adanya dari BMKG (belum dirapikan jadi YYYY-MM-DD)' },
      { name: '[].temperature', type: 'number', note: '°C, tidak dibulatkan — mis. 26.72541300455698' },
    ],
    warn: 'Parameter lat dan lon bersifat wajib. Tanpa keduanya upstream menjawab HTTP 500, bukan 400, sehingga lapisan ini menerjemahkannya menjadi 502.',
  },
  {
    path: '/api/weather/cyclones',
    group: 'weather',
    title: 'Siklon tropis',
    desc: 'Siklon aktif beserta bulletin. Kosong berarti tidak ada siklon aktif.',
    query: [],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/cyclones"',
    sampleRes: `{ "cyclones": [ { "id": "67b446d4…", "title": "TC BIANCA",
                  "bulletin": "https://drive.google.com/…",
                  "gale": ["Samudera Hindia selatan Jawa Timur", …] } ] }`,
    fields: [
      { name: 'cyclones[].title', type: 'string' },
      { name: 'cyclones[].bulletin', type: 'string', note: 'URL dokumen BMKG, bukan teks' },
      { name: 'cyclones[].gale', type: 'string[]', note: 'wilayah terdampak' },
    ],
  },
  {
    path: '/api/weather/amendment',
    group: 'weather',
    title: 'Amandemen prakiraan',
    desc: 'Revisi prakiraan yang dikeluarkan BMKG untuk titik ini. Kosong berarti tidak ada revisi.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/amendment?lat=-6.2&lon=106.8"',
    sampleRes: `{ "region": { "province": "DKI Jakarta", … },
  "count": 0,
  "items": [] }`,
    fields: [
      { name: 'count', type: 'number', note: 'jumlah revisi; 0 = tidak ada' },
      { name: 'items', type: 'array', note: 'teruskan apa adanya dari BMKG — bentuk item belum pernah teramati' },
    ],
    warn: 'Pada penyusunan kontrak ini, seluruh pengujian (5 titik, 25 November 2026) menghasilkan respons kosong. Antarmuka pengguna sebaiknya tidak bergantung pada terisinya items.',
  },
  {
    path: '/api/weather/forecast-official',
    group: 'weather',
    title: 'Prakiraan jalur resmi (cadangan)',
    desc: 'Sumber Open Data api.bmkg.go.id. Bentuknya sama dengan /api/weather/forecast — hanya dipakai bila prakiraan internal kosong.',
    query: ['adm4'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/weather/forecast-official?adm4=31.73.07.1002"',
    sampleRes: `{ "region": { "adm4": "31.73.07.1002", … },
  "hours": [ { "date": "2026-11-25", "time": "14:00", "temp": 30, … }, … ] }`,
    fields: [
      { name: 'hours[]', type: 'object[]', note: 'bentuk field sama persis dengan /api/weather/forecast' },
      { name: 'region', type: 'object', note: 'terisi dari parameter adm4, bukan dari koordinat' },
    ],
    warn: 'Endpoint cadangan. Gunakan /api/weather/forecast terlebih dahulu; pemanggilan keduanya secara bersamaan tidak dianjurkan karena menambah beban dan berpotensi menghasilkan angka berbeda.',
  },
  {
    path: '/api/sky/sun-times',
    group: 'sky',
    title: 'Terbit/terbenam & bulan',
    desc: 'Waktu matahari dan bulan, sudah dalam format 24 jam.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/sky/sun-times?lat=-6.2&lon=106.8"',
    sampleRes: `{
  "date": "2026-11-25", "timezone": "Asia/Jakarta",
  "sunrise": "05:26:06", "sunset": "17:53:20",
  "firstLight": "04:11:24", "lastLight": "19:08:06",
  "moonrise": "18:43:07", "moonset": "05:42:14",
  "moonPhase": "Full Moon", "moonIllumination": "99.31"
}`,
    fields: [
      { name: 'sunrise / sunset', type: 'string', note: 'HH:MM:SS 24 jam' },
      { name: 'firstLight / lastLight', type: 'string | null', note: 'twilight' },
      { name: 'moonPhase / moonIllumination', type: 'string | null' },
    ],
    warn: 'BMKG mengirim waktu dalam format "5:26:06 AM". Di sini seluruh waktu telah dikonversi ke format 24 jam; tidak perlu diuraikan ulang sebagai format 12 jam.',
  },
  {
    path: '/api/marine/nearest',
    group: 'marine',
    title: 'Wilayah perairan terdekat',
    desc: 'Kode & nama wilayah laut terdekat, plus polygon batasnya.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/marine/nearest?lat=-6.2&lon=106.8"',
    sampleRes: `{ "marine": { "code": "F.09", "name": "…", "wilayah": "…",
                 "geometry": { "type": "Polygon", "coordinates": […] } } }`,
    fields: [
      { name: 'marine.code', type: 'string', note: 'kode wilayah perairan BMKG' },
      { name: 'marine.wilayah', type: 'string', note: 'wilayah pelayanan (wilpel)' },
      { name: 'marine.geometry', type: 'object | null', note: 'GeoJSON polygon' },
    ],
  },
  {
    path: '/api/marine/ports',
    group: 'marine',
    title: 'Pelabuhan & pasang surut',
    desc: 'Tanpa koordinat: daftar pelabuhan. Dengan koordinat: pelabuhan terdekat + slot pasut.',
    query: ['lat?', 'lon?'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/marine/ports?lat=-6.2&lon=106.8"',
    sampleRes: `// daftar
{ "ports": [ { "file": "0088_Sintete.json", "name": "Sintete", "type": "…", "lat": -0.0, "lon": 0.0 } ] }

// terdekat
{ "port": { "id": "…", "name": "…", "lat": …, "lon": …,
            "slots": [ { "time": "…", "height": 1.2, "type": "…" } ] },
  "distanceKm": 12 }`,
    fields: [
      { name: 'ports[]', type: 'array', note: 'mode daftar' },
      { name: 'port.slots[]', type: 'array', note: 'mode terdekat: pasut' },
      { name: 'distanceKm', type: 'number', note: 'perkiraan kasar (derajat × 111)' },
    ],
    warn: 'Upstream maritim.bmkg.go.id menjawab HTTP 503 pada saat endpoint ini dibuat. Contoh respons tidak disertakan dan kegagalan dikembalikan sebagai 502 beserta alasannya.',
  },
  {
    path: '/api/marine/waves',
    group: 'marine',
    title: 'Tinggi gelombang per wilayah',
    desc: 'Kategori gelombang hari ini sampai H+3 untuk tiap kode wilayah perairan.',
    query: [],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/marine/waves"',
    sampleRes: `{ "zones": [ { "code": "U.04", "issued": "…",
                  "today": "Rendah", "tomorrow": "Sedang",
                  "h2": "Sedang", "h3": "Tinggi" } ] }`,
    fields: [
      { name: 'zones[].code', type: 'string', note: 'cocokkan dengan marine/nearest' },
      { name: 'zones[].today … h3', type: 'string | null', note: 'kategori tekstual' },
    ],
    warn: 'Upstream maritim.bmkg.go.id menjawab HTTP 503. Contoh respons tidak disertakan.',
  },
  {
    path: '/api/geo/region',
    group: 'geo',
    title: 'Wilayah dari koordinat',
    desc: 'Provinsi/kotkab/kecamatan/desa + kode adm1–adm4 untuk satu titik.',
    query: ['lat', 'lon'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/geo/region?lat=-6.2&lon=106.8"',
    sampleRes: `{ "region": { "province": "DKI Jakarta", "city": "Kota Adm. Jakarta Barat",
                "district": "Pal Merah", "village": "Slipi",
                "codes": { "adm1": "31", "adm2": "31.73",
                           "adm3": "31.73.07", "adm4": "31.73.07.1002" },
                "lat": -6.194, "lon": 106.801, "distanceKm": 0 } }`,
    fields: REGION_FIELDS,
  },
  {
    path: '/api/geo/district-weather',
    group: 'geo',
    title: 'Cuaca per kecamatan (DWT)',
    desc: 'Suhu/kelembapan/angin per kecamatan dari file data terbaru. Ini sumber "cuaca kecamatan" di dashboard.',
    query: ['lat?', 'lon?'],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/geo/district-weather?lat=-6.2&lon=106.8"',
    sampleRes: `{ "file": "apiDF_Darat_2026-11-25_14.json",
  "station": { "province": "…", "wilayah": "…", "district": "…",
               "lat": …, "lon": …,
               "observation": { "humidity": 72, "temp": 30,
                                "conditionCode": "3", "windDirection": "W",
                                "windSpeed": 4.5 },
               "distanceKm": 3 } }`,
    fields: [
      { name: 'province / wilayah / district', type: 'string' },
      { name: 'observation.conditionCode', type: 'string', note: 'kode cuaca BMKG, bukan teks' },
      { name: 'distanceKm', type: 'number', note: 'hanya mode koordinat' },
    ],
    warn: 'Berkas manifest_times.json menjawab HTTP 404. Contoh respons tidak disertakan. Nilai conditionCode tidak diterjemahkan menjadi teks karena penerjemahan merupakan tanggung jawab antarmuka.',
  },
  {
    path: '/api/news',
    group: 'news',
    title: 'Berita & video',
    desc: 'Dua sumber digabung. Salah satu gagal tidak menggagalkan semuanya.',
    query: [],
    auth: true,
    sample: 'curl -H "Authorization: Bearer $TOKEN" \\\n  "https://DOMAIN/api/news"',
    sampleRes: `{
  "videos": [ { "title": "Prakiraan Cuaca Esok Hari …",
                "url": "https://www.youtube.com/watch?v=…",
                "thumbnail": "https://i.ytimg.com/vi/…/hqdefault.jpg" } ],
  "posts": [],
  "warnings": [ "artikel: HTTP 502" ]
}`,
    fields: [
      { name: 'videos[]', type: 'array', note: 'kanal YouTube resmi BMKG' },
      { name: 'posts[]', type: 'array', note: 'WordPress BMKG; sering kosong' },
      { name: 'warnings[]', type: 'string[]', note: 'sebab bagian yang kosong' },
    ],
    warn: 'WordPress BMKG kerap menjawab HTTP 502. Apabila kosong, field `warnings` memuat sebabnya. Artikel contoh tidak disertakan karena kekosongan berarti tidak ada data.',
  },
];

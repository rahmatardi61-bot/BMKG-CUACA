// ═══════════════════════════════════════════════════════════════════════════
// Spesifikasi OpenAPI 3.0 untuk /api/* — dihasilkan dari SATU tempat.
//
// GET /v3/api-docs  → JSON ini (publik, tanpa token: dokumentasi harus bisa
//                     dibaca sebelum punya token).
//
// Bentuknya sengaja meniru springdoc (`/v3/api-docs`) supaya tim yang biasa
// membuka Swagger langsung mengenalinya. Isinya bukan hasil generate dari kode
// (tidak memakai decorator), sehingga perubahan endpoint wajib diikuti
// pembaruan berkas ini; `GET /api` dipakai untuk memeriksa keduanya cocok.
//
// Contoh respons diambil dari respons aktual (25 November 2026). Endpoint yang
// jalur suksesnya belum teramati tidak diberi contoh, dan dinyatakan demikian
// pada deskripsinya.
// ═══════════════════════════════════════════════════════════════════════════

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

/** respons standar yang dipakai semua endpoint */
const ERRORS = {
  400: { description: 'Parameter tidak sah', content: { 'application/json': { schema: ref('Error'), example: { error: 'Parameter tidak sah', code: 'BAD_REQUEST', reason: 'query lat & lon wajib berupa angka (contoh: ?lat=-6.2&lon=106.8)' } } } },
  401: { description: 'Token tidak ada / kedaluwarsa / bukan penerbit sah', content: { 'application/json': { schema: ref('Error'), example: { error: 'Token tidak sah', code: 'UNAUTHORIZED', reason: 'token kedaluwarsa' } } } },
  404: { description: 'Endpoint tidak ada', content: { 'application/json': { schema: ref('Error'), example: { error: 'Endpoint tidak ditemukan', code: 'NOT_FOUND', reason: '/api/weather/tidak-ada' } } } },
  500: { description: 'Kesalahan internal gateway', content: { 'application/json': { schema: ref('Error'), example: { error: 'Kesalahan internal', code: 'INTERNAL', reason: 'detail' } } } },
  502: { description: 'Sumber upstream BMKG tidak merespons dengan benar. Tidak ada data pengganti; respons berisi alasan kegagalan.', content: { 'application/json': { schema: ref('Error'), example: { error: 'BMKG menolak permintaan', code: 'UPSTREAM_ERROR', reason: 'HTTP 500' } } } },
};

const ok = (schemaName, example, description = 'Berhasil') => ({
  description,
  content: { 'application/json': { schema: ref(schemaName), example } },
});

const q = (name, description, example, required = true) => ({
  name, in: 'query', required, description, schema: { type: 'string' }, example,
});

/** /api/weather/current → getWeatherCurrent (nama stabil untuk generator klien) */
function operationId(method, path) {
  const parts = path.split('/').filter((p) => p && p !== 'api').map((p) => p.replace(/[^a-z0-9]+/gi, ' ').trim().split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(''));
  return method + (parts.join('') || 'ApiIndex');
}

export function buildOpenApi(origin) {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'BMKG Cuaca — API gateway',
      version: '1.0.0',
      description: [
        'Gateway cuaca BMKG dengan **bentuk respons tersendiri**. Lapisan ini memanggil',
        '`cuaca.bmkg.go.id`, `publik.bmkg.go.id`, `api.bmkg.go.id`, dan `maritim.bmkg.go.id`;',
        'nama dan bentuk field mentahnya sudah diterjemahkan di sini.',
        '',
        '**Satu gerbang autentikasi.** Seluruh endpoint memerlukan `Authorization: Bearer <jwt>` dari Keycloak.',
        'Token diperoleh di sisi server aplikasi, bukan di browser pengunjung karena `client_secret` bersifat rahasia.',
        '',
        '**Tanpa versi pada URL.** Nama dan makna field tidak diubah; apabila diperlukan perubahan,',
        'perubahan dilakukan dengan menambah field baru dan dicatat pada bagian Riwayat di docs/api-contract.md.',
        '',
        '**Lapisan API tidak menyajikan data contoh.** Apabila BMKG gagal, respons yang',
        'dikembalikan adalah `502` beserta `reason` apa adanya. Data contoh hanya digunakan',
        'pada widget dan dashboard, tidak pada API.',
        '',
        'Dua ketentuan yang perlu diperhatikan sebelum menulis kode:',
        '`precipitation` adalah **intensitas 0–100**, bukan peluang hujan; dan',
        '`observation.derived` (`feelLike`, `uvIndex`) bukan angka BMKG, melainkan hasil perhitungan lapisan ini.',
      ].join('\n'),
      contact: { name: 'Tim BMKG Cuaca' },
      license: { name: 'Data BMKG', url: 'https://www.bmkg.go.id/' },
    },
    servers: [
      { url: origin, description: 'Host tempat Anda membuka dokumen ini' },
      { url: 'https://cuaca.rumahaplikasi.com', description: 'Staging' },
    ],
    tags: [
      { name: 'weather', description: 'Cuaca darat: kondisi, prakiraan, peringatan, siklon' },
      { name: 'sky', description: 'Matahari & bulan' },
      { name: 'marine', description: 'Laut: perairan terdekat, pelabuhan, gelombang' },
      { name: 'geo', description: 'Wilayah administratif & stasiun pengamatan' },
      { name: 'news', description: 'Berita & video BMKG' },
      { name: 'meta', description: 'Katalog endpoint' },
    ],
    security: [{ bearerAuth: [] }],

    paths: {
      // ── weather ────────────────────────────────────────────────────────────
      '/api/weather/current': {
        get: {
          tags: ['weather'], summary: 'Kondisi cuaca saat ini',
          description: 'Observasi terakhir BMKG untuk titik terdekat.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('Current', {
              region: { province: 'DKI Jakarta', city: 'Kota Adm. Jakarta Barat', district: 'Pal Merah', village: 'Slipi', codes: { adm1: '31', adm2: '31.73', adm3: '31.73.07', adm4: '31.73.07.1002' }, lat: -6.194, lon: 106.801, distanceKm: 0 },
              observation: { date: '2026-11-25', time: '14:40', temp: 28, precipitation: 0, condition: 'Berawan Tebal', humidity: 81, windSpeed: 4.5, windDirection: 'W', windDirectionDeg: 280, visibility: null, derived: { feelLike: 31, uvIndex: 5 } },
            }),
            ...ERRORS,
          },
        },
      },
      '/api/weather/forecast': {
        get: {
          tags: ['weather'], summary: 'Prakiraan per jam',
          description: '10 hari ke depan, diratakan jadi satu larik `hours` dan diurutkan menurut tanggal+waktu. `hours` kosong berarti BMKG tidak punya prakiraan untuk titik itu.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('Forecast', {
              region: { province: 'DKI Jakarta', city: 'Kota Adm. Jakarta Barat', district: 'Pal Merah', village: 'Slipi', codes: { adm1: '31', adm2: '31.73', adm3: '31.73.07', adm4: '31.73.07.1002' }, lat: -6.194, lon: 106.801, timezone: 'Asia/Jakarta' },
              hours: [
                { date: '2026-11-25', time: '15:00', temp: 30, precipitation: 0, condition: 'Berawan', humidity: 74, windSpeed: 3.7, windDirection: 'NW', windDirectionDeg: 310, visibility: null },
                { date: '2026-11-25', time: '16:00', temp: 29, precipitation: 20, condition: 'Hujan Ringan', humidity: 78, windSpeed: 2.2, windDirection: 'W', windDirectionDeg: 280, visibility: null },
              ],
            }, 'Berhasil (contoh dipotong: aslinya 61 jam)'),
            ...ERRORS,
          },
        },
      },
      '/api/weather/alerts': {
        get: {
          tags: ['weather'], summary: 'Peringatan dini (internal BMKG)',
          description: 'Sering kali kosong, yang berarti tidak ada peringatan, bukan kegagalan permintaan. Untuk peringatan yang umumnya tersedia, gunakan `/api/weather/nowcast`.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: { 200: ok('Alerts', { alerts: [] }, 'Berhasil (tidak ada peringatan)'), ...ERRORS },
        },
      },
      '/api/weather/nowcast': {
        get: {
          tags: ['weather'], summary: 'Nowcast peringatan dini (RSS)',
          description: 'Bersumber dari RSS nowcast BMKG. Field `severity` tidak tersedia pada RSS sehingga dipetakan dari judul dan bersifat perkiraan tingkat. Tanpa parameter `province`, hasil mencakup seluruh Indonesia.',
          parameters: [q('province', 'Nama provinsi, dicocokkan sebagai teks', 'DKI Jakarta', false)],
          responses: {
            200: ok('Nowcast', {
              total: 1,
              alerts: [{ id: 'nowcast-c4f2a1', severity: 'Waspada', title: 'Hujan Lebat disertai Petir di Jakarta', description: 'Hujan lebat disertai petir', region: 'Jakarta', date: '2026-11-25' }],
            }),
            ...ERRORS,
          },
        },
      },
      '/api/weather/weekly-temperature': {
        get: {
          tags: ['weather'], summary: 'Suhu harian & mingguan',
          description: 'Deret suhu 7 hari. `lat` & `lon` **wajib** — tanpa keduanya upstream menjawab HTTP 500, bukan 400.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('WeeklyTemp', { daily: [{ date: '2026-11-25T00:00:00Z', temperature: 26.72541300455698 }, { date: '2026-11-26T00:00:00Z', temperature: 25.602416992187177 }], weekly: [] }, 'Berhasil (contoh dipotong: aslinya 7 hari; weekly kosong)'),
            ...ERRORS,
          },
        },
      },
      '/api/weather/cyclones': {
        get: {
          tags: ['weather'], summary: 'Siklon tropis aktif',
          description: 'Kosong berarti tidak ada siklon aktif. Field `bulletin` berisi URL dokumen BMKG, bukan teks.',
          responses: {
            200: ok('Cyclones', { cyclones: [{ id: '67b446d42719de8e91f91cd3', title: 'TC BIANCA', bulletin: 'https://drive.google.com/file/d/…/view', gale: ['Samudera Hindia selatan Jawa Timur', 'Perairan selatan Banten'] }] }),
            ...ERRORS,
          },
        },
      },
      '/api/weather/amendment': {
        get: {
          tags: ['weather'], summary: 'Amandemen prakiraan',
          description: 'Revisi prakiraan yang dikeluarkan BMKG. Pada penyusunan kontrak ini, seluruh pengujian (5 titik) menghasilkan `items` kosong. Antarmuka pengguna sebaiknya tidak bergantung pada terisinya `items`; struktur item belum teramati.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('Amendment', { region: { province: 'DKI Jakarta', city: 'Kota Adm. Jakarta Barat', district: 'Pal Merah', village: 'Slipi', codes: { adm1: '31', adm2: '31.73', adm3: '31.73.07', adm4: '31.73.07.1002' }, lat: -6.194, lon: 106.801, distanceKm: 0 }, count: 0, items: [] }),
            ...ERRORS,
          },
        },
      },
      '/api/weather/forecast-official': {
        get: {
          tags: ['weather'], summary: 'Prakiraan jalur resmi (cadangan)',
          description: 'Bersumber dari api.bmkg.go.id. Struktur field identik dengan `/api/weather/forecast`. Endpoint ini merupakan jalur cadangan dan sebaiknya dipanggil hanya apabila prakiraan internal tidak tersedia; pemanggilan keduanya secara bersamaan tidak dianjurkan.',
          parameters: [q('adm4', 'Kode wilayah 4 tingkat; ambil dari `/api/geo/region`', '31.73.07.1002')],
          responses: {
            200: ok('Forecast', {
              region: { province: 'DKI Jakarta', city: 'Kota Adm. Jakarta Barat', district: '', village: '', codes: { adm1: '31', adm2: '31.73', adm3: '31.73.07', adm4: '31.73.07.1002' }, lat: -6.194, lon: 106.801, timezone: 'Asia/Jakarta' },
              hours: [{ date: '2026-11-25', time: '15:00', temp: 28, precipitation: 52, condition: 'Hujan Ringan', humidity: 81, windSpeed: 4.5, windDirection: 'W', windDirectionDeg: 280, visibility: null }],
            }, 'Berhasil (contoh dipotong: aslinya 19 jam)'),
            ...ERRORS,
          },
        },
      },

      // ── sky ────────────────────────────────────────────────────────────────
      '/api/sky/sun-times': {
        get: {
          tags: ['sky'], summary: 'Terbit/terbenam & fase bulan',
          description: 'Seluruh waktu menggunakan format 24 jam (HH:MM:SS), berbeda dari upstream yang memakai AM/PM.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('SunTimes', { date: '2026-11-25', timezone: 'Asia/Jakarta', sunrise: '05:26:06', sunset: '17:53:20', firstLight: '04:11:24', lastLight: '19:08:06', moonrise: '18:43:07', moonset: '05:42:14', moonPhase: 'Full Moon', moonIllumination: '99.31' }),
            ...ERRORS,
          },
        },
      },

      // ── marine ─────────────────────────────────────────────────────────────
      '/api/marine/nearest': {
        get: {
          tags: ['marine'], summary: 'Wilayah perairan terdekat',
          description: '`geometry` berisi poligon wilayah perairan dalam format GeoJSON dan dapat langsung digunakan pada peta aplikasi.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('MarineNearest', { marine: { code: 'F.09', name: 'Teluk Jakarta', wilayah: 'Stamar Tanjung Priok - Jakarta', geometry: { type: 'Polygon', coordinates: [[[106.684, -6.015], [106.684, -5.91], [107.034, -5.91]]] } } }, 'Berhasil (geometry dipotong)'),
            ...ERRORS,
          },
        },
      },
      '/api/marine/ports': {
        get: {
          tags: ['marine'], summary: 'Daftar pelabuhan / pasut satu pelabuhan',
          description: 'Tanpa `lat`/`lon`: seluruh pelabuhan. Dengan `lat`/`lon`: pelabuhan terdekat beserta slot pasutnya. Contoh respons tidak disertakan karena upstream `maritim.bmkg.go.id` menjawab HTTP 503 pada saat dokumen ini disusun, sehingga jalur suksesnya belum teramati.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2', false), q('lon', 'Garis bujur WGS84', '106.8', false)],
          responses: { 200: ok('Ports', undefined, 'Berhasil'), ...ERRORS },
        },
      },
      '/api/marine/waves': {
        get: {
          tags: ['marine'], summary: 'Tinggi gelombang per wilayah perairan',
          description: 'Contoh respons tidak disertakan karena upstream `maritim.bmkg.go.id` menjawab HTTP 503 pada saat dokumen ini disusun.',
          responses: { 200: ok('Waves', undefined, 'Berhasil'), ...ERRORS },
        },
      },

      // ── geo ────────────────────────────────────────────────────────────────
      '/api/geo/region': {
        get: {
          tags: ['geo'], summary: 'Wilayah administratif dari koordinat',
          description: 'Dipakai untuk alamat ("Slipi, Kec. Pal Merah, …") dan untuk mengambil `codes.adm4` yang dibutuhkan endpoint lain.',
          parameters: [q('lat', 'Garis lintang WGS84', '-6.2'), q('lon', 'Garis bujur WGS84', '106.8')],
          responses: {
            200: ok('RegionEnvelope', { region: { province: 'DKI Jakarta', city: 'Kota Adm. Jakarta Barat', district: 'Pal Merah', village: 'Slipi', codes: { adm1: '31', adm2: '31.73', adm3: '31.73.07', adm4: '31.73.07.1002' }, lat: -6.194, lon: 106.801, distanceKm: 0 } }),
            ...ERRORS,
          },
        },
      },
      '/api/geo/district-weather': {
        get: {
          tags: ['geo'], summary: 'Stasiun pengamatan kecamatan / kereta',
          description: 'Tanpa `lat`/`lon`: semua stasiun terbaru. Dengan `lat`/`lon`: stasiun terdekat saja. **Contoh tidak disertakan**: manifest DWT menjawab HTTP 404 saat dokumen ini disusun.',
          parameters: [
            q('lat', 'Garis lintang WGS84', '-6.2', false),
            q('lon', 'Garis bujur WGS84', '106.8', false),
            { name: 'kind', in: 'query', required: false, description: 'Jenis stasiun', schema: { type: 'string', enum: ['darat', 'kereta'], default: 'darat' }, example: 'darat' },
          ],
          responses: { 200: ok('DistrictWeather', undefined, 'Berhasil'), ...ERRORS },
        },
      },

      // ── news ───────────────────────────────────────────────────────────────
      '/api/news': {
        get: {
          tags: ['news'], summary: 'Video & artikel BMKG',
          description: 'Satu permintaan untuk dua sumber data. `warnings` mencatat kegagalan sebagian: apabila artikel gagal diambil, `posts` kosong dan `warnings` memuat sebabnya, sementara status respons tetap 200 karena sebagian data tersedia.',
          responses: {
            200: ok('News', {
              videos: [{ title: 'Prakiraan Cuaca Esok Hari - Edisi khusus wilayah Maluku Utara', url: 'https://www.youtube.com/watch?v=MjRMG2UATuU', thumbnail: 'https://i.ytimg.com/vi/MjRMG2UATuU/hqdefault.jpg' }],
              posts: [{ id: 23117, date: '2026-11-25', category: 'Berita', title: 'Peringatan Dini Cuaca', summary: 'Wilayah yang berpotensi hujan lebat…', imageUrl: 'https://cuaca.bmkg.go.id/blog/wp-content/uploads/…jpg', link: 'https://cuaca.bmkg.go.id/blog/…' }],
              warnings: [],
            }),
            ...ERRORS,
          },
        },
      },

      // ── meta ───────────────────────────────────────────────────────────────
      '/api': {
        get: {
          tags: ['meta'], summary: 'Katalog endpoint (tanpa auth)',
          description: 'Daftar endpoint yang dapat dibaca mesin. Berguna untuk memeriksa kesesuaian dokumen dengan kondisi server.',
          security: [],
          responses: {
            200: {
              description: 'Berhasil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' }, note: { type: 'string' },
                      errors: { type: 'object', additionalProperties: { type: 'integer' } },
                      endpoints: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, query: { type: 'array', items: { type: 'string' } }, returns: { type: 'string' }, live: { type: 'boolean', description: 'false = upstream sedang mati saat katalog dibuat' }, note: { type: 'string' } } } },
                    },
                  },
                },
              },
            },
            ...ERRORS,
          },
        },
      },
    },

    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token Keycloak. Perolehannya dilakukan di sisi server aplikasi, bukan di browser.' },
      },
      schemas: {
        Error: {
          type: 'object',
          description: 'Bentuk error tunggal untuk semua endpoint.',
          properties: {
            error: { type: 'string', description: 'Pesan kesalahan yang dapat dibaca langsung' },
            code: { type: 'string', enum: ['UNAUTHORIZED', 'BAD_REQUEST', 'UPSTREAM_ERROR', 'NOT_FOUND', 'INTERNAL'] },
            reason: { type: 'string', description: 'Sebab teknis apa adanya (mis. "HTTP 503" dari BMKG)' },
          },
          required: ['error', 'code'],
        },
        RegionEnvelope: {
          type: 'object',
          properties: { region: ref('Region') },
          required: ['region'],
        },
        Region: {
          type: 'object',
          description: 'Wilayah administratif hasil pencocokan koordinat oleh BMKG. `lat`/`lon` di sini adalah titik yang dipakai BMKG, bukan persis koordinat yang Anda kirim.',
          properties: {
            province: { type: 'string', example: 'DKI Jakarta' },
            city: { type: 'string', description: 'kotkab', example: 'Kota Adm. Jakarta Barat' },
            district: { type: 'string', description: 'kecamatan', example: 'Pal Merah' },
            village: { type: 'string', description: 'desa/kelurahan', example: 'Slipi' },
            codes: { type: 'object', properties: { adm1: { type: 'string' }, adm2: { type: 'string' }, adm3: { type: 'string' }, adm4: { type: 'string', description: 'dipakai API BMKG lain' } } },
            lat: { type: 'number' }, lon: { type: 'number' },
            timezone: { type: 'string', nullable: true },
            distanceKm: { type: 'number', description: 'jarak titik permintaan ke titik BMKG' },
          },
        },
        Hour: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD, waktu lokal', example: '2026-11-25' },
            time: { type: 'string', description: 'HH:MM waktu lokal (WIB/WITA/WIT sesuai wilayah)', example: '15:00' },
            temp: { type: 'integer', description: 'suhu °C, dibulatkan' },
            precipitation: { type: 'integer', minimum: 0, maximum: 100, description: '**Intensitas** 0–100, bukan peluang hujan. Diturunkan dari curah hujan mm (5 mm ≈ 100).' },
            condition: { type: 'string', description: 'teks Indonesia dari BMKG' },
            humidity: { type: 'number', description: '%' },
            windSpeed: { type: 'number', description: 'km/jam' },
            windDirection: { type: 'string', description: 'arah mata angin, mis. "W"' },
            windDirectionDeg: { type: 'integer' },
            visibility: { type: 'number', nullable: true, description: 'km. **null berarti tidak ada data**, bukan jarak pandang nol.' },
          },
        },
        Forecast: {
          type: 'object',
          properties: { region: ref('Region'), hours: { type: 'array', items: ref('Hour'), description: 'diratakan dari cuaca[][] dan diurutkan' } },
          required: ['region', 'hours'],
        },
        Current: {
          type: 'object',
          properties: {
            region: ref('Region'),
            observation: {
              allOf: [
                ref('Hour'),
                {
                  type: 'object',
                  properties: {
                    derived: {
                      type: 'object',
                      description: 'Nilai perhitungan lapisan ini, bukan data BMKG. Tidak untuk ditampilkan sebagai angka resmi.',
                      properties: {
                        feelLike: { type: 'integer', description: 'suhu terasa °C — aproksimasi heat index kasar' },
                        uvIndex: { type: 'integer', description: 'estimasi dari tutupan awan saja; tidak memperhitungkan jam maupun lintang' },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        Alerts: { type: 'object', properties: { alerts: { type: 'array', items: { type: 'object', properties: { day: { type: 'string', enum: ['today', 'tomorrow'] }, severity: { type: 'string', enum: ['Awas', 'Siaga', 'Waspada'] }, description: { type: 'string' } } } } } },
        Nowcast: {
          type: 'object',
          properties: {
            total: { type: 'integer', description: 'jumlah setelah disaring provinsi' },
            alerts: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, severity: { type: 'string', enum: ['Awas', 'Siaga', 'Waspada'], description: 'hasil pemetaan dari judul, bukan field resmi' }, title: { type: 'string' }, description: { type: 'string' }, region: { type: 'string' }, date: { type: 'string' } } } },
          },
        },
        WeeklyTemp: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', description: 'timestamp ISO apa adanya dari BMKG', example: '2026-11-25T00:00:00Z' }, temperature: { type: 'number', description: '°C, tidak dibulatkan' } } } },
            weekly: { type: 'array', description: 'terbukti selalu kosong saat kontrak ini disusun', items: { type: 'object', properties: { date: { type: 'string' }, temperature: { type: 'number' } } } },
          },
        },
        Cyclones: { type: 'object', properties: { cyclones: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', nullable: true }, title: { type: 'string', nullable: true }, bulletin: { type: 'string', nullable: true, description: 'URL dokumen BMKG, bukan teks' }, gale: { type: 'array', items: { type: 'string' }, description: 'wilayah terdampak' } } } } } },
        Amendment: {
          type: 'object',
          properties: {
            region: ref('Region'),
            count: { type: 'integer', description: 'jumlah revisi; 0 = tidak ada perubahan, bukan error' },
            items: { type: 'array', items: { type: 'object' }, description: 'Diteruskan apa adanya dari BMKG. Struktur item belum teramati dalam keadaan terisi.' },
          },
        },
        SunTimes: {
          type: 'object',
          properties: {
            date: { type: 'string' }, timezone: { type: 'string' },
            sunrise: { type: 'string', description: 'HH:MM:SS 24 jam' }, sunset: { type: 'string' },
            firstLight: { type: 'string', nullable: true }, lastLight: { type: 'string', nullable: true },
            moonrise: { type: 'string', nullable: true }, moonset: { type: 'string', nullable: true },
            moonPhase: { type: 'string', nullable: true }, moonIllumination: { type: 'string', nullable: true, description: 'persen, dikirim sebagai teks seperti dari BMKG' },
          },
        },
        GeoJsonGeometry: { type: 'object', description: 'Polygon GeoJSON apa adanya', properties: { type: { type: 'string' }, coordinates: { type: 'array', items: {} } } },
        MarineNearest: { type: 'object', properties: { marine: { type: 'object', properties: { code: { type: 'string', example: 'F.09' }, name: { type: 'string', example: 'Teluk Jakarta' }, wilayah: { type: 'string' }, geometry: { $ref: '#/components/schemas/GeoJsonGeometry' } } } } },
        Ports: {
          type: 'object',
          properties: {
            ports: { type: 'array', description: 'mode daftar (tanpa lat/lon)', items: { type: 'object', properties: { file: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' } } } },
            port: { type: 'object', description: 'mode terdekat (dengan lat/lon)', properties: { id: { type: 'string', nullable: true }, name: { type: 'string' }, lat: { type: 'number', nullable: true }, lon: { type: 'number', nullable: true }, slots: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, height: { type: 'number', description: 'meter' }, type: { type: 'string' } } } } } },
            distanceKm: { type: 'number' },
          },
        },
        Waves: {
          type: 'object',
          properties: {
            // Bentuk nilai gelombang diteruskan apa adanya dari BMKG — belum
            // pernah teramati (upstream 503), jadi tidak diberi properti karangan.
            zones: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, issued: { type: 'string', nullable: true }, today: { type: 'object', nullable: true }, tomorrow: { type: 'object', nullable: true }, h2: { type: 'object', nullable: true }, h3: { type: 'object', nullable: true } } } },
          },
        },
        DistrictWeather: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'nama berkas snapshot BMKG' },
            stations: { type: 'array', description: 'mode semua stasiun', items: ref('Station') },
            station: { $ref: '#/components/schemas/Station' },
            distanceKm: { type: 'number' },
          },
        },
        Station: {
          type: 'object',
          properties: {
            province: { type: 'string' }, wilayah: { type: 'string' }, district: { type: 'string' },
            lat: { type: 'number' }, lon: { type: 'number' },
            observation: { type: 'object', properties: { humidity: { type: 'number' }, temp: { type: 'number' }, conditionCode: { type: 'string' }, windDirection: { type: 'string' }, windSpeed: { type: 'number' } } },
          },
        },
        News: {
          type: 'object',
          properties: {
            videos: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' }, thumbnail: { type: 'string', nullable: true } } } },
            posts: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer', nullable: true }, date: { type: 'string' }, category: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string', description: 'HTML dibuang, dipotong 200 karakter' }, imageUrl: { type: 'string', nullable: true }, link: { type: 'string', nullable: true } } } },
            warnings: { type: 'array', items: { type: 'string' }, description: 'kegagalan sebagian, mis. "artikel: HTTP 502". Kosong = semua sumber berhasil.' },
          },
        },
      },
    },
  };

  // operationId diisi otomatis, tidak ditulis manual per endpoint.
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) op.operationId = operationId(method, path);
  }
  return spec;
}

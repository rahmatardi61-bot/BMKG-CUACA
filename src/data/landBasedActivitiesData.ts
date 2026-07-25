export interface LocationData {
  id: string;
  name: string;
  type: 'Desa' | 'Kecamatan' | 'Kabupaten' | 'Kota' | 'Tempat Wisata';
  region: string;
  lat: number;
  lng: number;
  temp: number;
  weather: string;
  uv: number;
  condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
  tips: string;
}

export const locationsList: LocationData[] = [
  // --- DI YOGYAKARTA & JAWA TENGAH ---
  { id: 'yogyakarta', name: 'Kota Yogyakarta', type: 'Kota', region: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695, temp: 30, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Kondisi aspal lembap. Waspadai genangan air di bahu jalan.' },
  { id: 'sleman', name: 'Sleman', type: 'Kabupaten', region: 'DI Yogyakarta', lat: -7.7123, lng: 110.3980, temp: 29, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Lalu lintas lancar. Suhu berkendara stabil.' },
  { id: 'bantul', name: 'Bantul', type: 'Kabupaten', region: 'DI Yogyakarta', lat: -7.8876, lng: 110.3273, temp: 31, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Kelembapan tinggi, laju kendaraan normal.' },
  { id: 'pakem', name: 'Pakem', type: 'Kecamatan', region: 'Sleman, DIY', lat: -7.6698, lng: 110.4200, temp: 24, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalanan lereng Merapi basah dan licin. Harap berkendara defensif.' },
  { id: 'kemadang', name: 'Kemadang', type: 'Desa', region: 'Gunungkidul, DIY', lat: -8.1256, lng: 110.5780, temp: 29, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Akses jalan pantai selatan kering. Cocok untuk berkendara.' },
  { id: 'kaliurang', name: 'Kaliurang', type: 'Tempat Wisata', region: 'Sleman, DIY', lat: -7.5956, lng: 110.4258, temp: 21, weather: 'Hujan Sedang', uv: 1, condition: 'hujan', tips: 'Jalur wisata Kaliurang berkabut tebal. Nyalakan lampu kabut.' },
  { id: 'borobudur_temple', name: 'Candi Borobudur', type: 'Tempat Wisata', region: 'Magelang, Jawa Tengah', lat: -7.6080, lng: 110.2038, temp: 28, weather: 'Berawan Tebal', uv: 3, condition: 'berawan', tips: 'Kawasan wisata padat kendaraan. Jaga konsentrasi berkendara.' },
  { id: 'borobudur_kec', name: 'Borobudur', type: 'Kecamatan', region: 'Magelang, Jawa Tengah', lat: -7.6000, lng: 110.2000, temp: 29, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Akses jalan Magelang-Yogya lancar.' },
  { id: 'parangtritis', name: 'Pantai Parangtritis', type: 'Tempat Wisata', region: 'Bantul, DIY', lat: -8.0254, lng: 110.3340, temp: 31, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Angin laut kencang. Waspadai pasir yang terbawa ke aspal.' },
  { id: 'breksi', name: 'Tebing Breksi', type: 'Tempat Wisata', region: 'Sleman, DIY', lat: -7.7816, lng: 110.4907, temp: 29, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Jalan menanjak terjal. Pastikan performa mesin dan rem prima.' },
  { id: 'prambanan_temple', name: 'Candi Prambanan', type: 'Tempat Wisata', region: 'Sleman, DIY', lat: -7.7520, lng: 110.4914, temp: 30, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Arus lalu lintas jalan raya Solo-Yogya stabil.' },
  { id: 'solo', name: 'Kota Surakarta (Solo)', type: 'Kota', region: 'Jawa Tengah', lat: -7.5754, lng: 110.8243, temp: 31, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Kondisi jalanan kering, perjalanan aman.' },
  { id: 'semarang', name: 'Kota Semarang', type: 'Kota', region: 'Jawa Tengah', lat: -6.9667, lng: 110.4167, temp: 32, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Jalan arteri pesisir kering. Waspadai cuaca panas.' },
  { id: 'purwokerto', name: 'Purwokerto', type: 'Kecamatan', region: 'Banyumas, Jawa Tengah', lat: -7.4244, lng: 109.2300, temp: 26, weather: 'Hujan Sedang', uv: 3, condition: 'hujan', tips: 'Hujan membatasi jarak pandang. Kurangi kecepatan.' },

  // --- DKI JAKARTA & JAWA BARAT ---
  { id: 'jakarta', name: 'Jakarta Pusat', type: 'Kota', region: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, temp: 33, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Lalu lintas ibukota kondusif. Cuaca aman.' },
  { id: 'bogor', name: 'Kota Bogor', type: 'Kota', region: 'Jawa Barat', lat: -6.5971, lng: 106.7986, temp: 26, weather: 'Hujan Sedang', uv: 2, condition: 'hujan', tips: 'Khas kota hujan, aspal basah. Hati-hati slip ban.' },
  { id: 'cisarua', name: 'Cisarua', type: 'Kecamatan', region: 'Bogor, Jawa Barat', lat: -6.6908, lng: 106.9450, temp: 22, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalur Puncak berkabut tebal dan licin. Jaga jarak aman.' },
  { id: 'bandung', name: 'Kota Bandung', type: 'Kota', region: 'Jawa Barat', lat: -6.9175, lng: 107.6191, temp: 25, weather: 'Berawan Tebal', uv: 3, condition: 'berawan', tips: 'Mendung merata di area cekungan Bandung.' },
  { id: 'lembang', name: 'Lembang', type: 'Kecamatan', region: 'Bandung Barat, Jabar', lat: -6.8200, lng: 107.6200, temp: 20, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalanan sempit berbukit rawan licin saat basah.' },
  { id: 'kawahputih', name: 'Kawah Putih', type: 'Tempat Wisata', region: 'Bandung, Jawa Barat', lat: -7.1662, lng: 107.4021, temp: 18, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Jalur Ciwidey sejuk berawan. Siapkan pakaian hangat.' },
  { id: 'ciwidey', name: 'Ciwidey', type: 'Kecamatan', region: 'Bandung, Jawa Barat', lat: -7.1000, lng: 107.4500, temp: 22, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Jalan lancar, aspal sebagian lembap.' },
  { id: 'sukabumi', name: 'Sukabumi', type: 'Kabupaten', region: 'Jawa Barat', lat: -6.9181, lng: 106.9267, temp: 28, weather: 'Hujan Ringan', uv: 3, condition: 'hujan', tips: 'Gerimis membasahi area kota. Aman berkendara perlahan.' },
  { id: 'pelabuhanratu', name: 'Pantai Pelabuhan Ratu', type: 'Tempat Wisata', region: 'Sukabumi, Jawa Barat', lat: -6.9880, lng: 106.5510, temp: 30, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Mendung berembus kencang di tepi pantai.' },
  { id: 'cirebon', name: 'Kota Cirebon', type: 'Kota', region: 'Jawa Barat', lat: -6.7216, lng: 108.5560, temp: 31, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Jalan Lintas Pantai Utara lancar dan kering.' },

  // --- JAWA TIMUR ---
  { id: 'surabaya', name: 'Kota Surabaya', type: 'Kota', region: 'Jawa Timur', lat: -7.2575, lng: 112.7521, temp: 32, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Kondisi jalan tol Trans-Java kering dan aman.' },
  { id: 'malang', name: 'Kota Malang', type: 'Kota', region: 'Jawa Timur', lat: -7.9666, lng: 112.6326, temp: 24, weather: 'Hujan Ringan', uv: 3, condition: 'hujan', tips: 'Gerimis sejuk di pegunungan Malang. Pastikan wiper bekerja.' },
  { id: 'batu', name: 'Kota Batu', type: 'Kota', region: 'Jawa Timur', lat: -7.8700, lng: 112.5200, temp: 21, weather: 'Hujan Sedang', uv: 2, condition: 'hujan', tips: 'Wisata pegunungan licin dan basah. Waspadai genangan.' },
  { id: 'bromo', name: 'Gunung Bromo', type: 'Tempat Wisata', region: 'Probolinggo, Jatim', lat: -7.9425, lng: 112.9530, temp: 15, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Suhu dingin ekstrem, aspal berpasir. Pastikan ban dalam kondisi prima.' },
  { id: 'banyuwangi', name: 'Banyuwangi', type: 'Kabupaten', region: 'Jawa Timur', lat: -8.2192, lng: 114.3691, temp: 31, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Akses penyeberangan Ketapang aman dan cerah.' },
  { id: 'ijen', name: 'Kawah Ijen', type: 'Tempat Wisata', region: 'Banyuwangi, Jatim', lat: -8.0583, lng: 114.2417, temp: 14, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalan menanjak terjal Licin saat hujan. Gunakan gigi rendah.' },

  // --- BALI ---
  { id: 'denpasar', name: 'Kota Denpasar', type: 'Kota', region: 'Bali', lat: -8.6500, lng: 115.2167, temp: 31, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Cuaca cerah panas. Jalur pariwisata kondusif.' },
  { id: 'kuta', name: 'Kuta', type: 'Kecamatan', region: 'Badung, Bali', lat: -8.7228, lng: 115.1780, temp: 31, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Jalanan kota pariwisata padat. Cuaca kering mendukung.' },
  { id: 'pantai_kuta', name: 'Pantai Kuta', type: 'Tempat Wisata', region: 'Badung, Bali', lat: -8.7185, lng: 115.1686, temp: 31, weather: 'Cerah', uv: 6, condition: 'cerah', tips: 'Kawasan pesisir kering, aman berkendara santai.' },
  { id: 'ubud', name: 'Ubud', type: 'Kecamatan', region: 'Gianyar, Bali', lat: -8.5080, lng: 115.2625, temp: 27, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Jalur wisata pedesaan asri dan kering.' },
  { id: 'tanahlot', name: 'Tanah Lot', type: 'Tempat Wisata', region: 'Tabanan, Bali', lat: -8.6212, lng: 115.0868, temp: 30, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Akses jalan pariwisata aman.' },
  { id: 'gilimanuk', name: 'Gilimanuk', type: 'Kecamatan', region: 'Jembrana, Bali', lat: -8.1633, lng: 114.4372, temp: 30, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Kawasan pelabuhan penyeberangan kondusif.' },

  // --- SUMATERA ---
  { id: 'medan', name: 'Kota Medan', type: 'Kota', region: 'Sumatera Utara', lat: 3.5952, lng: 98.6722, temp: 31, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Cuaca berawan mendung tipis. Jalanan kering.' },
  { id: 'berastagi', name: 'Berastagi', type: 'Kecamatan', region: 'Karo, Sumatera Utara', lat: 3.1906, lng: 98.5054, temp: 22, weather: 'Hujan Ringan', uv: 3, condition: 'hujan', tips: 'Jalan lintas pegunungan Medan-Berastagi licin. Waspadai longsor.' },
  { id: 'danautoba', name: 'Danau Toba (Samosir)', type: 'Tempat Wisata', region: 'Sumatera Utara', lat: 2.6322, lng: 98.7185, temp: 24, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Pemandangan berawan sejuk di sekitar Danau.' },
  { id: 'parapat', name: 'Parapat', type: 'Kecamatan', region: 'Simalungun, Sumut', lat: 2.6800, lng: 98.9300, temp: 25, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Jalan lintas Sumatera aman dilalui.' },
  { id: 'pekanbaru', name: 'Kota Pekanbaru', type: 'Kota', region: 'Riau', lat: 0.5070, lng: 101.4478, temp: 32, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Udara kering. Laju lalu lintas lancar.' },
  { id: 'palembang', name: 'Kota Palembang', type: 'Kota', region: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754, temp: 32, weather: 'Cerah', uv: 5, condition: 'cerah', tips: 'Aman melintasi Jembatan Ampera.' },
  { id: 'lampung', name: 'Bandar Lampung', type: 'Kota', region: 'Lampung', lat: -5.4292, lng: 105.2611, temp: 31, weather: 'Cerah Berawan', uv: 5, condition: 'cerah', tips: 'Selamat melintasi pintu tol Bakauheni.' },

  // --- SULAWESI ---
  { id: 'makassar', name: 'Kota Makassar', type: 'Kota', region: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4328, temp: 32, weather: 'Cerah', uv: 5, condition: 'cerah', tips: 'Jalan perkotaan Makassar kering dan kondusif.' },
  { id: 'toraja', name: 'Tana Toraja', type: 'Kabupaten', region: 'Sulawesi Selatan', lat: -3.0500, lng: 119.8500, temp: 23, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalan lintas kabupaten berkelok licin saat hujan.' },
  { id: 'manado', name: 'Kota Manado', type: 'Kota', region: 'Sulawesi Utara', lat: 1.4748, lng: 124.8421, temp: 28, weather: 'Hujan Petir', uv: 1, condition: 'badai', tips: 'Waspada badai petir dan angin kencang di teluk Manado.' },
  { id: 'bunaken', name: 'Bunaken', type: 'Tempat Wisata', region: 'Sulawesi Utara', lat: 1.6247, lng: 124.7612, temp: 29, weather: 'Hujan Sedang', uv: 2, condition: 'hujan', tips: 'Gerimis di jalur darat pulau Bunaken.' },
  
  // --- MALUKU ---
  { id: 'ambon', name: 'Kota Ambon', type: 'Kota', region: 'Maluku', lat: -3.6954, lng: 128.1814, temp: 27, weather: 'Hujan Ringan', uv: 2, condition: 'hujan', tips: 'Jalan pesisir pulau basah, kurangi kecepatan.' },
  { id: 'ternate', name: 'Kota Ternate', type: 'Kota', region: 'Maluku Utara', lat: 0.7893, lng: 127.3756, temp: 29, weather: 'Berawan', uv: 4, condition: 'berawan', tips: 'Jalan lingkar pulau Ternate berawan aman.' }
];

export const routesCoordinates: Record<string, [number, number][]> = {
  // Predefined key coords fallback if OSRM is offline or separating islands
  'jakarta-bandung': [
    [-6.2088, 106.8456], [-6.2201, 106.9200], [-6.2383, 106.9756], [-6.2650, 107.0800],
    [-6.2900, 107.1500], [-6.3227, 107.2905], [-6.3800, 107.3900], [-6.5562, 107.4431],
    [-6.6200, 107.4100], [-6.7200, 107.3900], [-6.8100, 107.4500], [-6.8402, 107.4725],
    [-6.8850, 107.5350], [-6.9175, 107.6191]
  ]
};

export const routesCheckpoints: Record<string, string[]> = {
  'jakarta-bandung': ['Bogor', 'Puncak Pass', 'Cianjur'],
  'jakarta-cirebon': ['Cikarang', 'Karawang', 'Subang', 'Indramayu'],
  'jakarta-semarang': ['Cirebon', 'Tegal', 'Pekalongan', 'Kendal'],
  'jakarta-yogyakarta': ['Bandung', 'Tasikmalaya', 'Kebumen', 'Purworejo'],
  'bandung-yogyakarta': ['Tasikmalaya', 'Ciamis', 'Kebumen', 'Purworejo'],
  'purwokerto-yogyakarta': ['Magelang', 'Temanggung', 'Wonosobo', 'Banjarnegara'],
  'semarang-yogyakarta': ['Ungaran', 'Ambarawa', 'Magelang'],
  'solo-yogyakarta': ['Klaten', 'Prambanan'],
  'semarang-surabaya': ['Demak', 'Kudus', 'Rembang', 'Tuban', 'Gresik'],
  'surabaya-yogyakarta': ['Mojokerto', 'Jombang', 'Nganjuk', 'Madiun', 'Solo'],
  'solo-surabaya': ['Sragen', 'Ngawi', 'Madiun', 'Nganjuk', 'Jombang'],
  'malang-surabaya': ['Sidoarjo', 'Gempol', 'Pasuruan', 'Lawang'],
  'denpasar-surabaya': ['Banyuwangi', 'Situbondo', 'Probolinggo', 'Pasuruan'],
  
  // New Routes
  'jakarta-lampung': ['Tangerang', 'Serang', 'Pelabuhan Merak', 'Pelabuhan Bakauheni', 'Kalianda'],
  'bandaaceh-medan': ['Sigli', 'Lhokseumawe', 'Langsa', 'Binjai'],
  'medan-pekanbaru': ['Tebing Tinggi', 'Kisaran', 'Rantau Prapat', 'Dumai'],
  'palembang-pekanbaru': ['Rengat', 'Tembilahan', 'Jambi'],
  'lampung-palembang': ['Menggala', 'Kayu Agung', 'Ogan Ilir'],
  'makassar-palu': ['Maros', 'Parepare', 'Majene', 'Mamuju'],
  'gorontalo-palu': ['Toboli', 'Parigi', 'Moutong', 'Marisa'],
  'gorontalo-manado': ['Kwandang', 'Boroko', 'Kotamobagu', 'Tomohon'],
  'denpasar-gilimanuk': ['Negara', 'Tabanan']
};

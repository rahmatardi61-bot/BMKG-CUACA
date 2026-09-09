export type POICategory = 'all' | 'wilayah' | 'tempat';

export interface SearchResultItem {
  id: string;
  name: string;
  category: 'wilayah' | 'tempat';
  categoryLabel: string;
  subLocation: string; // e.g. "Kec. Kasihan, Bantul, DI Yogyakarta"
  fullAddress: string; // Used when selected: e.g. "Bangunjiwo, Bantul, DI Yogyakarta"
  tag?: string;        // e.g. "Stadion", "Universitas", "Resto Populer", "Desa"
  lat?: number;
  lng?: number;
}

interface RawSearchResultItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  subLocation: string;
  fullAddress: string;
  tag?: string;
  lat?: number;
  lng?: number;
}

const RAW_POPULAR_RECOMMENDATIONS: RawSearchResultItem[] = [
  {
    id: 'rec-1',
    name: 'Bangunjiwo',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Kasihan, Bantul, DI Yogyakarta',
    fullAddress: 'Bangunjiwo, Kec. Kasihan, Bantul, DI Yogyakarta',
    tag: 'Kelurahan / Desa'
  },
  {
    id: 'rec-2',
    name: 'Universitas Gadjah Mada (UGM)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Bulaksumur, Sleman, DI Yogyakarta',
    fullAddress: 'Universitas Gadjah Mada, Sleman, DI Yogyakarta',
    tag: 'Kampus'
  },
  {
    id: 'rec-3',
    name: 'Stadion Utama Gelora Bung Karno (GBK)',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Tanah Abang, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Gelora Bung Karno, Tanah Abang, Jakarta Pusat',
    tag: 'Stadion Utama'
  },
  {
    id: 'rec-4',
    name: 'Warung Kopi Klotok',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Pakem, Sleman, DI Yogyakarta',
    fullAddress: 'Kopi Klotok, Pakem, Sleman, DI Yogyakarta',
    tag: 'Resto & Kuliner'
  },
  {
    id: 'rec-5',
    name: 'Candi Borobudur',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Borobudur, Magelang, Jawa Tengah',
    fullAddress: 'Candi Borobudur, Magelang, Jawa Tengah',
    tag: 'Situs Warisan Budaya'
  },
  {
    id: 'rec-6',
    name: 'Dago Heritage 1917 Golf',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Dago Atas, Kota Bandung, Jawa Barat',
    fullAddress: 'Dago Heritage 1917 Golf, Bandung, Jawa Barat',
    tag: 'Lapangan Golf'
  },
  {
    id: 'rec-7',
    name: 'Institut Teknologi Bandung (ITB)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Coblong, Kota Bandung, Jawa Barat',
    fullAddress: 'ITB Kampus Ganesha, Kota Bandung, Jawa Barat',
    tag: 'Kampus'
  },
  {
    id: 'rec-8',
    name: 'Kawasan Malioboro',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Gedongtengen, Kota Yogyakarta, DI Yogyakarta',
    fullAddress: 'Malioboro, Kota Yogyakarta, DI Yogyakarta',
    tag: 'Pusat Wisata Kota'
  }
];

export const POPULAR_RECOMMENDATIONS: SearchResultItem[] = RAW_POPULAR_RECOMMENDATIONS.map(item => {
  const isWilayah = item.category === 'wilayah';
  return {
    ...item,
    category: (isWilayah ? 'wilayah' : 'tempat') as 'wilayah' | 'tempat',
    categoryLabel: isWilayah ? 'Kelurahan & Desa' : 'Nama Tempat'
  };
});

const RAW_LOCAL_POI_DATABASE: RawSearchResultItem[] = [
  ...RAW_POPULAR_RECOMMENDATIONS,
  // ── KAMPUS & PENDIDIKAN ──
  {
    id: 'k-1',
    name: 'Universitas Indonesia (UI)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Pondok Cina, Beji, Kota Depok, Jawa Barat',
    fullAddress: 'Universitas Indonesia, Kota Depok, Jawa Barat',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-2',
    name: 'Institut Pertanian Bogor (IPB)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Dramaga, Kab. Bogor, Jawa Barat',
    fullAddress: 'IPB University, Dramaga, Kab. Bogor, Jawa Barat',
    tag: 'Institut Negeri'
  },
  {
    id: 'k-3',
    name: 'Universitas Diponegoro (Undip)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Tembalang, Kota Semarang, Jawa Tengah',
    fullAddress: 'Universitas Diponegoro, Tembalang, Kota Semarang',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-4',
    name: 'Institut Teknologi Sepuluh Nopember (ITS)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Sukolilo, Kota Surabaya, Jawa Timur',
    fullAddress: 'ITS Surabaya, Sukolilo, Kota Surabaya, Jawa Timur',
    tag: 'Institut Teknologi'
  },
  {
    id: 'k-5',
    name: 'Universitas Airlangga (Unair)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Gubeng, Kota Surabaya, Jawa Timur',
    fullAddress: 'Universitas Airlangga, Kota Surabaya, Jawa Timur',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-6',
    name: 'Universitas Brawijaya (UB)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Lowokwaru, Kota Malang, Jawa Timur',
    fullAddress: 'Universitas Brawijaya, Kota Malang, Jawa Timur',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-7',
    name: 'Universitas Padjadjaran (Unpad)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Jatinangor, Kab. Sumedang, Jawa Barat',
    fullAddress: 'Universitas Padjadjaran, Jatinangor, Jawa Barat',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-8',
    name: 'Universitas Sebelas Maret (UNS)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Jebres, Kota Surakarta (Solo), Jawa Tengah',
    fullAddress: 'Universitas Sebelas Maret, Kota Surakarta, Jawa Tengah',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-9',
    name: 'Universitas Hasanuddin (Unhas)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Tamalanrea, Kota Makassar, Sulawesi Selatan',
    fullAddress: 'Universitas Hasanuddin, Kota Makassar, Sulawesi Selatan',
    tag: 'Universitas Negeri'
  },
  {
    id: 'k-10',
    name: 'Telkom University',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Dayeuhkolot, Kab. Bandung, Jawa Barat',
    fullAddress: 'Telkom University, Dayeuhkolot, Bandung, Jawa Barat',
    tag: 'Universitas Swasta'
  },
  {
    id: 'k-11',
    name: 'Universitas Udayana (Unud)',
    category: 'kampus',
    categoryLabel: 'Kampus & Pendidikan',
    subLocation: 'Jimbaran, Kuta Selatan, Badung, Bali',
    fullAddress: 'Universitas Udayana, Jimbaran, Bali',
    tag: 'Universitas Negeri'
  },

  // ── OLAHRAGA & STADION ──
  {
    id: 'ol-1',
    name: 'Jakarta International Stadium (JIS)',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Tanjung Priok, Jakarta Utara, DKI Jakarta',
    fullAddress: 'Jakarta International Stadium, Jakarta Utara',
    tag: 'Stadion Internasional'
  },
  {
    id: 'ol-2',
    name: 'Stadion Si Jalak Harupat',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Kutawaringin, Kab. Bandung, Jawa Barat',
    fullAddress: 'Stadion Si Jalak Harupat, Bandung, Jawa Barat',
    tag: 'Stadion Sepak Bola'
  },
  {
    id: 'ol-3',
    name: 'Stadion Manahan Solo',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Banjarsari, Kota Surakarta, Jawa Tengah',
    fullAddress: 'Stadion Manahan, Kota Surakarta, Jawa Tengah',
    tag: 'Stadion Olahraga'
  },
  {
    id: 'ol-4',
    name: 'Stadion Gelora Bung Tomo (GBT)',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Pakal, Kota Surabaya, Jawa Timur',
    fullAddress: 'Stadion Gelora Bung Tomo, Surabaya, Jawa Timur',
    tag: 'Stadion Utama'
  },
  {
    id: 'ol-5',
    name: 'Pondok Indah Golf Course',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Kebayoran Lama, Jakarta Selatan, DKI Jakarta',
    fullAddress: 'Pondok Indah Golf Course, Jakarta Selatan',
    tag: 'Lapangan Golf'
  },
  {
    id: 'ol-6',
    name: 'GOR UNY (Gelanggang Olahraga)',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Depok, Kab. Sleman, DI Yogyakarta',
    fullAddress: 'GOR UNY, Depok, Sleman, DI Yogyakarta',
    tag: 'Gelanggang Olahraga'
  },
  {
    id: 'ol-7',
    name: 'Stadion Maguwoharjo',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Ngemplak, Kab. Sleman, DI Yogyakarta',
    fullAddress: 'Stadion Maguwoharjo, Sleman, DI Yogyakarta',
    tag: 'Stadion Sepak Bola'
  },
  {
    id: 'ol-8',
    name: 'Istora Senayan Gelora Bung Karno',
    category: 'olahraga',
    categoryLabel: 'Olahraga & Stadion',
    subLocation: 'Gelora, Tanah Abang, Jakarta Pusat',
    fullAddress: 'Istora Senayan, Jakarta Pusat, DKI Jakarta',
    tag: 'Arena Bulutangkis & Konser'
  },

  // ── KULINER & RESTORAN ──
  {
    id: 'cul-1',
    name: 'Cafe Batavia',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Taman Fatahillah, Kota Tua, Jakarta Barat',
    fullAddress: 'Cafe Batavia, Kota Tua, Jakarta Barat',
    tag: 'Cafe Bersejarah'
  },
  {
    id: 'cul-2',
    name: 'Bebek Bengil Ubud',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Padang Tegal, Ubud, Gianyar, Bali',
    fullAddress: 'Bebek Bengil, Ubud, Gianyar, Bali',
    tag: 'Restoran Ikonik'
  },
  {
    id: 'cul-3',
    name: 'Restoran Sederhana SA (Padang)',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Menteng, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Restoran Padang Sederhana, Menteng, Jakarta Pusat',
    tag: 'Restoran Masakan Padang'
  },
  {
    id: 'cul-4',
    name: 'Bandar Djakarta Ancol',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Taman Impian Jaya Ancol, Jakarta Utara',
    fullAddress: 'Bandar Djakarta, Ancol, Jakarta Utara',
    tag: 'Seafood Tepi Laut'
  },
  {
    id: 'cul-5',
    name: 'Gudeg Yu Djum Wijilan',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Kraton, Kota Yogyakarta, DI Yogyakarta',
    fullAddress: 'Gudeg Yu Djum, Wijilan, Kota Yogyakarta',
    tag: 'Kuliner Legendaris'
  },
  {
    id: 'cul-6',
    name: 'Kampung Laut Semarang',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Tawang Mas, Semarang Barat, Kota Semarang',
    fullAddress: 'Kampung Laut, Kota Semarang, Jawa Tengah',
    tag: 'Restoran Apung'
  },
  {
    id: 'cul-7',
    name: 'Mang Kabayan Resto',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Margonda Raya, Kota Depok, Jawa Barat',
    fullAddress: 'Mang Kabayan, Kota Depok, Jawa Barat',
    tag: 'Restoran Khas Sunda'
  },
  {
    id: 'cul-8',
    name: 'Bakso Presiden Malang',
    category: 'kuliner',
    categoryLabel: 'Kuliner & Resto',
    subLocation: 'Klojen, Kota Malang, Jawa Timur',
    fullAddress: 'Bakso Presiden, Kota Malang, Jawa Timur',
    tag: 'Kuliner Ikonik'
  },

  // ── WISATA & LANDMARK ──
  {
    id: 'wis-1',
    name: 'Monumen Nasional (Monas)',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Gambir, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Monas, Gambir, Jakarta Pusat, DKI Jakarta',
    tag: 'Landmark Nasional'
  },
  {
    id: 'wis-2',
    name: 'Kawah Putih Ciwidey',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Sugihmukti, Pasirjambu, Kab. Bandung, Jawa Barat',
    fullAddress: 'Kawah Putih, Ciwidey, Bandung, Jawa Barat',
    tag: 'Wisata Alam Kawah'
  },
  {
    id: 'wis-3',
    name: 'Pantai Kuta Bali',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Kuta, Kab. Badung, Bali',
    fullAddress: 'Pantai Kuta, Badung, Bali',
    tag: 'Wisata Pantai'
  },
  {
    id: 'wis-4',
    name: 'Gunung Bromo (TN Bromo Tengger Semeru)',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Sukapura, Kab. Probolinggo, Jawa Timur',
    fullAddress: 'Gunung Bromo, Kab. Probolinggo, Jawa Timur',
    tag: 'Wisata Gunung & Alam'
  },
  {
    id: 'wis-5',
    name: 'Candi Prambanan',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Bokoharjo, Prambanan, Sleman, DI Yogyakarta',
    fullAddress: 'Candi Prambanan, Sleman, DI Yogyakarta',
    tag: 'Situs Warisan UNESCO'
  },
  {
    id: 'wis-6',
    name: 'Pantai Parangtritis',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Kretek, Kab. Bantul, DI Yogyakarta',
    fullAddress: 'Pantai Parangtritis, Bantul, DI Yogyakarta',
    tag: 'Wisata Pantai Selatan'
  },
  {
    id: 'wis-7',
    name: 'Taman Mini Indonesia Indah (TMII)',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Cipayung, Jakarta Timur, DKI Jakarta',
    fullAddress: 'Taman Mini Indonesia Indah, Jakarta Timur',
    tag: 'Taman Budaya'
  },
  {
    id: 'wis-8',
    name: 'Tanah Lot Bali',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Beraban, Kediri, Kab. Tabanan, Bali',
    fullAddress: 'Tanah Lot, Tabanan, Bali',
    tag: 'Wisata Religi & Pantai'
  },
  {
    id: 'wis-9',
    name: 'Grand Indonesia Mall',
    category: 'wisata',
    categoryLabel: 'Wisata & Landmark',
    subLocation: 'Menteng, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Grand Indonesia Mall, Jakarta Pusat',
    tag: 'Pusat Perbelanjaan'
  },

  // ── TRANSPORTASI & FASILITAS ──
  {
    id: 'tr-1',
    name: 'Bandara Internasional Soekarno-Hatta (CGK)',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Benda, Kota Tangerang, Banten',
    fullAddress: 'Bandara Soekarno-Hatta, Tangerang, Banten',
    tag: 'Bandara Internasional'
  },
  {
    id: 'tr-2',
    name: 'Bandara Internasional Yogyakarta (YIA)',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Temon, Kab. Kulon Progo, DI Yogyakarta',
    fullAddress: 'Yogyakarta International Airport, Kulon Progo, DIY',
    tag: 'Bandara Internasional'
  },
  {
    id: 'tr-3',
    name: 'Bandara Internasional Juanda (SUB)',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Sedati, Kab. Sidoarjo, Jawa Timur',
    fullAddress: 'Bandara Juanda, Sidoarjo, Jawa Timur',
    tag: 'Bandara Internasional'
  },
  {
    id: 'tr-4',
    name: 'Stasiun Gambir',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Gambir, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Stasiun Gambir, Jakarta Pusat, DKI Jakarta',
    tag: 'Stasiun Kereta Api Eksekutif'
  },
  {
    id: 'tr-5',
    name: 'Stasiun Tugu Yogyakarta',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Gedongtengen, Kota Yogyakarta, DI Yogyakarta',
    fullAddress: 'Stasiun Tugu Yogyakarta, Kota Yogyakarta',
    tag: 'Stasiun Kereta Api Utama'
  },
  {
    id: 'tr-6',
    name: 'Stasiun Bandung (Hall)',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Andir, Kota Bandung, Jawa Barat',
    fullAddress: 'Stasiun Bandung, Kota Bandung, Jawa Barat',
    tag: 'Stasiun Kereta Api Utama'
  },
  {
    id: 'tr-7',
    name: 'Pelabuhan Merak',
    category: 'transportasi',
    categoryLabel: 'Transportasi & Fasilitas',
    subLocation: 'Pulomerak, Kota Cilegon, Banten',
    fullAddress: 'Pelabuhan Penyeberangan Merak, Cilegon, Banten',
    tag: 'Pelabuhan Feri Antarpulau'
  },

  // ── DESA, KELURAHAN & KECAMATAN ──
  {
    id: 'wil-1',
    name: 'Desa Bentarsari',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Salem, Kab. Brebes, Jawa Tengah',
    fullAddress: 'Bentarsari, Salem, Kab. Brebes, Jawa Tengah',
    tag: 'Desa'
  },
  {
    id: 'wil-2',
    name: 'Kecamatan Cisarua',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kawasan Puncak, Kab. Bogor, Jawa Barat',
    fullAddress: 'Cisarua, Kab. Bogor, Jawa Barat',
    tag: 'Kecamatan'
  },
  {
    id: 'wil-3',
    name: 'Kecamatan Lembang',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kab. Bandung Barat, Jawa Barat',
    fullAddress: 'Lembang, Bandung Barat, Jawa Barat',
    tag: 'Kecamatan'
  },
  {
    id: 'wil-4',
    name: 'Kelurahan Menteng',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Menteng, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Menteng, Jakarta Pusat, DKI Jakarta',
    tag: 'Kelurahan'
  },
  {
    id: 'wil-5',
    name: 'Kelurahan Cilandak Barat',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Cilandak, Jakarta Selatan, DKI Jakarta',
    fullAddress: 'Cilandak Barat, Jakarta Selatan, DKI Jakarta',
    tag: 'Kelurahan'
  },
  {
    id: 'wil-6',
    name: 'Kecamatan Kaliurang (Pakem)',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Pakem, Kab. Sleman, DI Yogyakarta',
    fullAddress: 'Pakem, Kab. Sleman, DI Yogyakarta',
    tag: 'Kecamatan'
  },
  {
    id: 'wil-7',
    name: 'Desa Kemadang',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kec. Tanjungsari, Kab. Gunungkidul, DIY',
    fullAddress: 'Kemadang, Gunungkidul, DI Yogyakarta',
    tag: 'Desa Pesisir'
  },
  {
    id: 'wil-8',
    name: 'Kecamatan Ciwidey',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kab. Bandung, Jawa Barat',
    fullAddress: 'Ciwidey, Kab. Bandung, Jawa Barat',
    tag: 'Kecamatan'
  },
  {
    id: 'wil-9',
    name: 'Kecamatan Ubud',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kab. Gianyar, Bali',
    fullAddress: 'Ubud, Kab. Gianyar, Bali',
    tag: 'Kecamatan'
  },
  {
    id: 'wil-10',
    name: 'Kota Purwokerto',
    category: 'wilayah',
    categoryLabel: 'Wilayah & Desa',
    subLocation: 'Kab. Banyumas, Jawa Tengah',
    fullAddress: 'Purwokerto, Banyumas, Jawa Tengah',
    tag: 'Kecamatan / Kota'
  }
];

export const LOCAL_POI_DATABASE: SearchResultItem[] = RAW_LOCAL_POI_DATABASE.map(item => {
  const isWilayah = item.category === 'wilayah';
  return {
    ...item,
    category: (isWilayah ? 'wilayah' : 'tempat') as 'wilayah' | 'tempat',
    categoryLabel: isWilayah ? 'Kelurahan & Desa' : 'Nama Tempat'
  };
});

/**
 * Filter local POI database based on search query and category
 */
export function filterLocalPOIs(query: string, category: POICategory = 'all'): SearchResultItem[] {
  const cleanQ = query.trim().toLowerCase();
  
  return LOCAL_POI_DATABASE.filter(item => {
    // Check category match
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    
    if (!cleanQ) return true;
    
    // Check keyword match in name, subLocation, fullAddress, or tag
    return (
      item.name.toLowerCase().includes(cleanQ) ||
      item.subLocation.toLowerCase().includes(cleanQ) ||
      item.fullAddress.toLowerCase().includes(cleanQ) ||
      (item.tag && item.tag.toLowerCase().includes(cleanQ))
    );
  });
}

/**
 * Perform live geocoder search with OpenStreetMap Nominatim API
 * Categorizes results into 'wilayah' (Kelurahan/Desa/Kecamatan) or 'tempat' (Nama Tempat/Fasilitas/POI)
 */
export async function searchOnlinePOIs(query: string, category: POICategory = 'all'): Promise<SearchResultItem[]> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ)}&countrycodes=id&limit=8&addressdetails=1`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const mappedResults: SearchResultItem[] = data.map((item: any) => {
      const type = (item.type || '').toLowerCase();
      const osmClass = (item.class || '').toLowerCase();
      const name = item.name || item.display_name.split(',')[0] || cleanQ;
      const addr = item.address || {};

      // Detect category: Kelurahan/Desa (wilayah) vs Nama Tempat (tempat)
      let cat: 'wilayah' | 'tempat' = 'wilayah';
      let catLabel = 'Kelurahan & Desa';
      let tag = 'Lokasi';

      const isPlace = 
        osmClass === 'amenity' || 
        osmClass === 'leisure' || 
        osmClass === 'tourism' || 
        osmClass === 'aeroway' || 
        osmClass === 'railway' || 
        osmClass === 'historic' || 
        osmClass === 'shop' || 
        osmClass === 'office' ||
        osmClass === 'sport' ||
        type.includes('stadium') ||
        type.includes('university') ||
        type.includes('school') ||
        type.includes('hospital') ||
        type.includes('hotel') ||
        type.includes('mall');

      if (isPlace) {
        cat = 'tempat';
        catLabel = 'Nama Tempat';
        if (type.includes('university') || type.includes('college') || type.includes('school')) {
          tag = 'Pendidikan';
        } else if (type.includes('stadium') || type.includes('sports') || type.includes('pitch')) {
          tag = 'Fasilitas Olahraga';
        } else if (type.includes('restaurant') || type.includes('cafe') || type.includes('food')) {
          tag = 'Kuliner';
        } else if (osmClass === 'tourism' || type.includes('attraction') || type.includes('museum')) {
          tag = 'Tempat Wisata';
        } else if (osmClass === 'aeroway' || osmClass === 'railway' || type.includes('station') || type.includes('airport')) {
          tag = 'Transportasi';
        } else {
          tag = 'Nama Tempat';
        }
      } else {
        cat = 'wilayah';
        catLabel = 'Kelurahan & Desa';
        tag = addr.village ? 'Desa' : (addr.suburb ? 'Kelurahan' : (addr.city_district ? 'Kecamatan' : 'Wilayah'));
      }

      // Build readable sublocation
      const subParts: string[] = [];
      if (addr.village && addr.village !== name) subParts.push(addr.village);
      if (addr.suburb && addr.suburb !== name && !subParts.includes(addr.suburb)) subParts.push(`Kel. ${addr.suburb}`);
      if (addr.city_district && !subParts.some(p => p.includes(addr.city_district))) subParts.push(`Kec. ${addr.city_district}`);
      if (addr.city || addr.county) subParts.push(addr.city || addr.county);
      if (addr.state) subParts.push(addr.state);

      const subLocation = subParts.length > 0 ? subParts.join(', ') : item.display_name.split(',').slice(1, 4).join(',').trim();
      const fullAddress = `${name}, ${subLocation}`;

      return {
        id: `osm-${item.place_id || Math.random()}`,
        name,
        category: cat,
        categoryLabel: catLabel,
        subLocation,
        fullAddress,
        tag,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      };
    });

    // Apply category filter if requested
    if (category !== 'all') {
      return mappedResults.filter(r => r.category === category);
    }
    return mappedResults;
  } catch (e) {
    // Network fail / offline fallback - silent fail, local data continues
    return [];
  }
}

export interface AdvisorParameter {
  label: string;
  value: string;
  status: 'aman' | 'waspada' | 'siaga' | 'bahaya';
}

export interface AdvisorAdvisory {
  status: 'safe' | 'warning' | 'danger' | 'info';
  text: string;
}

export interface AdvisorSopStep {
  text: string;
  done: boolean;
}

export interface AdvisorEmergencyContact {
  label: string;
  number: string;
}

export interface SectorAdvisor {
  id: 'shipping' | 'fishery' | 'oilgas' | 'tourism' | 'public';
  name: string;
  title: string;
  riskScore: number;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Bahaya';
  riskColor: string;
  glowColor: string;
  textColor: string;
  bgGradient: string;
  bgIllustration: string;
  description: string;
  parameters: AdvisorParameter[];
  advisories: AdvisorAdvisory[];
  sopSteps: AdvisorSopStep[];
  emergencyContacts: AdvisorEmergencyContact[];
}

export const citySectorsMap: Record<string, SectorAdvisor[]> = {
  'DKI Jakarta': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Tanjung Priok & Teluk Jakarta',
      riskScore: 48,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Navigasi kapal kontainer internasional, kapal Pelni, dan tongkang pengangkut material di sekitar area Teluk Jakarta.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '0.8 - 1.2 m (Rendah)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '12 - 15 Knot', status: 'aman' },
        { label: 'Visibilitas', value: '9.0 km (Sangat Baik)', status: 'aman' },
        { label: 'Arus Permukaan', value: '0.5 Knot (Barat)', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Alur masuk pelayaran Tanjung Priok terpantau aman untuk semua draf kapal.' },
        { status: 'info', text: 'Waspadai perubahan arah angin mendadak di sekitar perairan utara Jakarta Utara menjelang sore hari.' }
      ],
      sopSteps: [
        { text: 'Verifikasi kesiapan jangkar dan mesin kemudi cadangan.', done: false },
        { text: 'Pastikan kru dek memantau radar saat melintasi TSS Teluk Jakarta.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Tanjung Priok', number: '021-43930001' },
        { label: 'Basarnas Jakarta', number: '021-5501512' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Tangkap',
      title: 'PPS Nizam Zachman & Muara Angke',
      riskScore: 35,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Panduan operasional nelayan Muara Angke dan dermaga kapal ikan PPS Nizam Zachman menuju perairan Laut Jawa.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '0.7 m (Rendah)', status: 'aman' },
        { label: 'Suhu Permukaan', value: '28.5 °C', status: 'aman' },
        { label: 'Klorofil-a', value: 'Sedang (Potensial)', status: 'aman' },
        { label: 'Arus Pantai', value: '0.4 Knot (Barat)', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Tinggi gelombang di Laut Jawa bagian barat mendukung aktivitas kapal nelayan tangkap di bawah 30 GT.' },
        { status: 'info', text: 'Periksa kelengkapan es pengawet tangkapan untuk menjaga suhu ikan di tengah cuaca panas terik Jakarta.' }
      ],
      sopSteps: [
        { text: 'Periksa fungsi radio VHF saluran 16 sebelum melepas tali tambat.', done: false },
        { text: 'Kenakan life jacket saat bekerja di area dek luar.', done: false }
      ],
      emergencyContacts: [
        { label: 'Satpolair Muara Angke', number: '021-6691456' },
        { label: 'Syahbandar Perikanan', number: '021-6623450' }
      ]
    },
    {
      id: 'tourism',
      name: 'Pariwisata Bahari',
      title: 'Kepulauan Seribu & Ancol Beach',
      riskScore: 50,
      riskLevel: 'Sedang',
      riskColor: 'from-rose-500 to-pink-500',
      glowColor: 'shadow-rose-500/20 dark:shadow-rose-500/10 border-rose-500/35 dark:border-rose-400/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgGradient: 'from-rose-600/5 via-pink-600/5 to-transparent',
      bgIllustration: 'tourism-waves',
      description: 'Rekomendasi aman untuk aktivitas penyeberangan Marina Ancol ke Pulau Seribu, banana boat, jetski, dan snorkeling.',
      parameters: [
        { label: 'Indeks UV', value: '8 (Sangat Tinggi)', status: 'siaga' },
        { label: 'Gelombang Pantai', value: '0.5 m (Aman)', status: 'aman' },
        { label: 'Cuaca Pesisir', value: 'Cerah Berawan', status: 'aman' },
        { label: 'Pasang Air Laut', value: '0.9 m', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Paparan sinar UV sangat tinggi siang hari. Gunakan tabir surya minimal SPF 30 saat berwisata di pantai Pulau Seribu.' },
        { status: 'info', text: 'Penyeberangan dengan speedboat dari Marina Ancol terpantau lancar dan aman.' }
      ],
      sopSteps: [
        { text: 'Operator speedboat wajib melarang penumpang melepas life jacket selama perjalanan.', done: false },
        { text: 'Pantau posisi pasang surut air laut untuk menghindari karang dangkal.', done: false }
      ],
      emergencyContacts: [
        { label: 'Polres Kepulauan Seribu', number: '021-29469500' },
        { label: 'SAR Kepulauan Seribu', number: '0812-1122-3344' }
      ]
    }
  ],
  'Surabaya': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Tanjung Perak & Selat Madura',
      riskScore: 52,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Layanan keselamatan pelayaran niaga Pelabuhan Tanjung Perak, kapal feri Ujung-Kamal, dan pilar jembatan Suramadu.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.0 m (Rendah)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '14 - 18 Knot', status: 'waspada' },
        { label: 'Arus Selat', value: '1.5 Knot (Timur)', status: 'waspada' },
        { label: 'Visibilitas', value: '8.0 km (Baik)', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Arus pasang surut di Selat Madura berdurasi cukup kencang. Feri penyeberangan diimbau waspada terhadap drift.' },
        { status: 'info', text: 'Aktivitas bongkar muat kontainer luar ruangan di Pelabuhan Tanjung Perak berjalan kondusif.' }
      ],
      sopSteps: [
        { text: 'Nakhoda wajib memonitor VTS Surabaya Channel 12.', done: false },
        { text: 'Sesuaikan daya mesin saat feri merapat ke dermaga Ujung maupun Kamal.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Surabaya', number: '031-3291340' },
        { label: 'Basarnas Surabaya', number: '031-5671118' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Tangkap',
      title: 'Nelayan Pantai Kenjeran & Bulak',
      riskScore: 38,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Panduan keselamatan melaut untuk nelayan tradisional perahu motor tempel di perairan pesisir timur Surabaya.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '0.6 m (Rendah)', status: 'aman' },
        { label: 'Suhu Air', value: '28.0 °C', status: 'aman' },
        { label: 'Kecepatan Angin', value: '12 Knot', status: 'aman' },
        { label: 'Klorofil-a', value: 'Sangat Tinggi (Subur)', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Pesisir timur Surabaya sangat subur untuk penangkapan kerang dan ikan musiman.' },
        { status: 'info', text: 'Hembusan angin laut kering siang hari tidak mengganggu pelayaran nelayan tradisional.' }
      ],
      sopSteps: [
        { text: 'Pastikan membawa lampu isyarat jika melaut hingga malam hari.', done: false },
        { text: 'Periksa tali tambatan perahu di tanggul Kenjeran sebelum air surut maksimal.', done: false }
      ],
      emergencyContacts: [
        { label: 'Polsek Kenjeran', number: '031-3815110' },
        { label: 'Satpolairud Polres Perak', number: '031-3293110' }
      ]
    }
  ],
  'Bandung': [
    {
      id: 'shipping',
      name: 'Transportasi Air Waduk',
      title: 'Pelayaran Lokal Waduk Saguling & Jatiluhur',
      riskScore: 30,
      riskLevel: 'Rendah',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Pengawasan transportasi perahu wisata, angkutan pakan ikan, dan penyeberangan warga antar desa di wilayah bendungan.',
      parameters: [
        { label: 'Tinggi Riak Air', value: '0.2 m (Tenang)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '10 Knot', status: 'aman' },
        { label: 'Jarak Pandang', value: '7.0 km', status: 'aman' },
        { label: 'Arus Waduk', value: 'Hampir Statis', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Perairan waduk tenang dan aman untuk transportasi kapal motor kayu angkutan pakan.' },
        { status: 'info', text: 'Waspadai tiupan angin kencang lokal lembah (mountain-valley wind) pada sore hari.' }
      ],
      sopSteps: [
        { text: 'Jangan melebihi kapasitas beban kapal kayu penumpang.', done: false },
        { text: 'Siapkan dayung darurat pada setiap perahu penyeberangan.', done: false }
      ],
      emergencyContacts: [
        { label: 'BPBD Kabupaten Bandung Barat', number: '022-86121400' },
        { label: 'Call Center SAR Bandung', number: '022-7780001' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Darat',
      title: 'Budidaya Karamba Jaring Apung (KJA)',
      riskScore: 55,
      riskLevel: 'Sedang',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Layanan mitigasi kualitas air waduk untuk pembudidaya ikan nila dan mas di KJA bendungan besar Jawa Barat.',
      parameters: [
        { label: 'Suhu Air Waduk', value: '25.6 °C', status: 'aman' },
        { label: 'Oksigen Terlarut', value: '4.2 mg/L', status: 'aman' },
        { label: 'Potensi Upwelling', value: 'Rendah (Aman)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '8 Knot', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Indikasi umbulan air belerang (upwelling/turnover) negatif. Tingkat kematian ikan terkendali.' },
        { status: 'info', text: 'Beri pakan secara teratur pada siang hari untuk efisiensi penyerapan nutrisi ikan.' }
      ],
      sopSteps: [
        { text: 'Periksa kekuatan jangkar dan tali pengikat jaring karamba secara periodik.', done: false },
        { text: 'Siapkan aerator darurat jika kadar oksigen air menurun tajam mendadak.', done: false }
      ],
      emergencyContacts: [
        { label: 'Dinas Perikanan Jabar', number: '022-2501168' },
        { label: 'Penyuluh Perikanan Saguling', number: '0812-2244-5566' }
      ]
    }
  ],
  'Medan': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Belawan & Selat Malaka',
      riskScore: 68,
      riskLevel: 'Tinggi',
      riskColor: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/10 border-amber-500/35 dark:border-amber-400/30',
      textColor: 'text-amber-600 dark:text-amber-500',
      bgGradient: 'from-amber-600/5 via-orange-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Navigasi keselamatan di Selat Malaka barat, kapal kargo internasional Belawan, serta kapal feri tujuan Penang.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '2.0 m (Sedang)', status: 'waspada' },
        { label: 'Kecepatan Angin', value: '20 - 24 Knot', status: 'siaga' },
        { label: 'Arus Permukaan', value: '1.4 Knot (Utara)', status: 'waspada' },
        { label: 'Visibilitas', value: '6.0 km (Sedang)', status: 'waspada' }
      ],
      advisories: [
        { status: 'danger', text: 'Angin kencang di pintu masuk Selat Malaka meningkatkan risiko drift kapal draf tinggi. Kurangi kecepatan saat manuver.' },
        { status: 'warning', text: 'Tinggi gelombang di perairan luar Belawan berkisar 1.5 - 2.0 meter. Kapal kecil dilarang melintas.' }
      ],
      sopSteps: [
        { text: 'Aktifkan radar pencari sasaran navigasi laut secara konstan.', done: false },
        { text: 'Nakhoda kapal pandu wajib mendampingi kapal besar melewati alur sempit.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Belawan', number: '061-6941123' },
        { label: 'Basarnas Medan', number: '061-4565777' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Tangkap',
      title: 'Armada Nelayan Belawan & Pantai Cermin',
      riskScore: 58,
      riskLevel: 'Sedang',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Panduan keselamatan melaut untuk nelayan pukat cincin dan jaring insang di perairan pesisir Sumatera Utara.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.6 m (Sedang)', status: 'waspada' },
        { label: 'Suhu Permukaan', value: '27.9 °C', status: 'aman' },
        { label: 'Kecepatan Angin', value: '18 Knot', status: 'waspada' },
        { label: 'Klorofil-a', value: 'Sedang', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Hembusan angin kencang berdurasi pendek sering memicu gelombang kejut di Selat Malaka bagian tengah.' },
        { status: 'info', text: 'Pendaratan ikan di dermaga Belawan berjalan lancar dengan pasang air laut normal.' }
      ],
      sopSteps: [
        { text: 'Bawa radio komunikasi cadangan yang tahan air.', done: false },
        { text: 'Gunakan jaket keselamatan di atas dek sepanjang waktu.', done: false }
      ],
      emergencyContacts: [
        { label: 'Satpolairud Belawan', number: '061-6941852' },
        { label: 'KPLP Belawan', number: '061-6941245' }
      ]
    }
  ],
  'Semarang': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Tanjung Emas & Pantai Utara Jawa',
      riskScore: 60,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Manajemen navigasi di perairan pesisir Semarang, kapal tongkang batu bara, dan kapal kargo antar pulau.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.25 m (Sedang)', status: 'waspada' },
        { label: 'Kecepatan Angin', value: '16 Knot', status: 'waspada' },
        { label: 'Visibilitas', value: '8.0 km', status: 'aman' },
        { label: 'Arus Permukaan', value: '0.8 Knot (Timur)', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Kecepatan angin berembus konstan dari timur laut berpotensi menaikkan alun gelombang di Pelabuhan Tanjung Emas.' },
        { status: 'info', text: 'Kondisi alur pelayaran terpantau kondusif bagi kapal tongkang penyuplai PLTU.' }
      ],
      sopSteps: [
        { text: 'Pantau laporan tinggi gelombang dari Stasiun Meteorologi Maritim Tanjung Emas secara berkala.', done: false },
        { text: 'Pastikan pompa lambung kapal feri berfungsi optimal.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Tanjung Emas', number: '024-3580555' },
        { label: 'KSOP Kelas I Tanjung Emas', number: '024-3543666' }
      ]
    },
    {
      id: 'public',
      name: 'Warga Pesisir (Rob)',
      title: 'Mitigasi Banjir Rob Kaligawe & Genuk',
      riskScore: 78,
      riskLevel: 'Tinggi',
      riskColor: 'from-sky-500 to-cyan-500',
      glowColor: 'shadow-cyan-500/20 dark:shadow-cyan-500/10 border-cyan-500/35 dark:border-cyan-400/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      bgGradient: 'from-cyan-600/5 via-sky-600/5 to-transparent',
      bgIllustration: 'public-wind',
      description: 'Layanan peringatan dini genangan banjir rob di kawasan industri Terboyo, Kaligawe, dan pemukiman nelayan Tambak Lorok.',
      parameters: [
        { label: 'Pasang Air Laut', value: '1.45 m (Kritis)', status: 'bahaya' },
        { label: 'Amblesan Tanah', value: 'Tinggi Terdeteksi', status: 'siaga' },
        { label: 'Curah Hujan', value: 'Ringan Sore Hari', status: 'waspada' },
        { label: 'Pompa Status', value: 'Aktif Penuh', status: 'aman' }
      ],
      advisories: [
        { status: 'danger', text: 'Pasang maksimum mencapai puncaknya pukul 14:00 - 16:00 WIB. Jalan Raya Kaligawe berpotensi tergenang setinggi 20-40 cm.' },
        { status: 'warning', text: 'Warga Tambak Lorok diimbau mengamankan barang berharga dan waspada terhadap arus balik selokan.' }
      ],
      sopSteps: [
        { text: 'Siapkan tanggul pasir penghalang di depan pintu masuk rumah.', done: false },
        { text: 'Pantau operasional pompa pintu air sungai untuk mencegah luapan balik.', done: false }
      ],
      emergencyContacts: [
        { label: 'BPBD Kota Semarang', number: '024-3581567' },
        { label: 'Stasiun Maritim BMKG Semarang', number: '024-3546111' }
      ]
    }
  ],
  'Makassar': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Soekarno-Hatta & Selat Makassar',
      riskScore: 45,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Navigasi angkutan logistik peti kemas, penyeberangan feri antarpulau, dan jalur wisata kapal kayu Phinisi.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.2 m (Rendah)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '12 - 16 Knot', status: 'waspada' },
        { label: 'Arus Permukaan', value: '0.8 Knot (Selatan)', status: 'aman' },
        { label: 'Jarak Pandang', value: '8.5 km', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Tinggi gelombang di Selat Makassar bagian selatan kondusif untuk pelayaran feri penumpang cepat.' },
        { status: 'info', text: 'Waspadai turbulensi angin lokal di dekat pulau-pulau karang kecil gugusan Spermonde.' }
      ],
      sopSteps: [
        { text: 'Laporkan koordinat laut melalui radio pantai setiap 2 jam perjalanan.', done: false },
        { text: 'Pastikan manifest penumpang feri penyeberangan terdaftar resmi.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Makassar', number: '0411-3619551' },
        { label: 'Basarnas Makassar', number: '0411-554111' }
      ]
    },
    {
      id: 'tourism',
      name: 'Pariwisata Bahari',
      title: 'Pantai Losari & Pulau Samalona',
      riskScore: 40,
      riskLevel: 'Rendah',
      riskColor: 'from-rose-500 to-pink-500',
      glowColor: 'shadow-rose-500/20 dark:shadow-rose-500/10 border-rose-500/35 dark:border-rose-400/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgGradient: 'from-rose-600/5 via-pink-600/5 to-transparent',
      bgIllustration: 'tourism-waves',
      description: 'Panduan keselamatan rekreasi air untuk penyewaan kapal kayu (jolloro) Losari-Samalona, jet ski, dan wisata pantai.',
      parameters: [
        { label: 'Kecepatan Angin', value: '10 Knot', status: 'aman' },
        { label: 'Tinggi Gelombang', value: '0.4 m (Tenang)', status: 'aman' },
        { label: 'Indeks UV', value: '7 (Tinggi)', status: 'waspada' },
        { label: 'Cuaca Pesisir', value: 'Cerah Berawan', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Perairan pantai dangkal Losari sangat tenang, aman untuk perahu wisata rakyat.' },
        { status: 'info', text: 'Gunakan kacamata hitam pelindung dan topi lebar menghadapi sengatan matahari siang di Pulau Samalona.' }
      ],
      sopSteps: [
        { text: 'Penumpang jolloro diimbau mengenakan life jacket sebelum kapal melaju.', done: false },
        { text: 'Jangan membuang sampah plastik ke area terumbu karang pulau wisata.', done: false }
      ],
      emergencyContacts: [
        { label: 'SAR Ditpolair Polda Sulsel', number: '0411-456000' },
        { label: 'Pos SAR Samalona', number: '0812-4422-9900' }
      ]
    }
  ],
  'Palembang': [
    {
      id: 'shipping',
      name: 'Pelayaran Sungai',
      title: 'Alur Transportasi Sungai Musi & Boom Baru',
      riskScore: 35,
      riskLevel: 'Rendah',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Navigasi perahu ketek rakyat, kapal tongkang batu bara/sawit, dan kapal barang yang merapat ke Pelabuhan Boom Baru.',
      parameters: [
        { label: 'Lebar Gelombang', value: '0.2 m (Riak Sungai)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '8 - 12 Knot', status: 'aman' },
        { label: 'Arus Sungai', value: '0.6 Knot (Hilir)', status: 'aman' },
        { label: 'Jarak Pandang', value: '7.5 km (Baik)', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Arus sungai tergolong normal dan tidak deras. Penyeberangan ketek berjalan lancar.' },
        { status: 'info', text: 'Dilarang keras berlayar melebihi garis muatan aman lambung timbul (freeboard) kapal tongkang.' }
      ],
      sopSteps: [
        { text: 'Nakhoda tongkang wajib mengawasi tinggi ruang bebas (clearance) di bawah Jembatan Ampera.', done: false },
        { text: 'Nyalakan lampu navigasi depan saat malam hari atau cuaca mendung tebal.', done: false }
      ],
      emergencyContacts: [
        { label: 'KSOP Kelas II Boom Baru', number: '0711-710214' },
        { label: 'Polairud Polda Sumsel', number: '0711-710899' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Tangkap',
      title: 'Nelayan Tradisional Sungai & Muara Musi',
      riskScore: 32,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Panduan keselamatan menangkap ikan bagi nelayan perahu jaring di sepanjang tepian sungai Musi dan muara pantai timur.',
      parameters: [
        { label: 'Tinggi Riak Air', value: '0.3 m (Aman)', status: 'aman' },
        { label: 'Suhu Air Sungai', value: '29.2 °C', status: 'aman' },
        { label: 'Kecepatan Angin', value: '10 Knot', status: 'aman' },
        { label: 'Kekeruhan Air', value: 'Sedang (Normal)', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Tinggi air sungai stabil. Sangat aman bagi nelayan tebar jala di bantaran anak sungai.' },
        { status: 'info', text: 'Waspadai tumpukan kayu hanyut dari hulu sungai saat musim hujan terjadi di daerah pegunungan.' }
      ],
      sopSteps: [
        { text: 'Gunakan penanda apung berwarna terang pada jaring ikan agar tidak tertabrak tongkang.', done: false },
        { text: 'Tambatkan perahu kuat-kuat saat bersandar di dermaga kayu terendam pasang.', done: false }
      ],
      emergencyContacts: [
        { label: 'Satpolairud Polrestabes Palembang', number: '0711-515555' },
        { label: 'Basarnas Palembang', number: '0711-414777' }
      ]
    }
  ],
  'Batam': [
    {
      id: 'shipping',
      name: 'Pelayaran Internasional',
      title: 'Selat Singapura & Harbour Bay Batam',
      riskScore: 50,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Jalur keselamatan penyeberangan feri Batam - Singapura - Johor, lalu lintas kapal kontainer raksasa, dan draf kapal dalam.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.25 m (Sedang)', status: 'waspada' },
        { label: 'Kecepatan Angin', value: '18 Knot', status: 'waspada' },
        { label: 'Visibilitas', value: '7.5 km (Baik)', status: 'aman' },
        { label: 'Arus Selat', value: '1.8 Knot (Barat Laut)', status: 'waspada' }
      ],
      advisories: [
        { status: 'warning', text: 'Arus pasang surut Selat Singapura terpantau kuat. Feri penyeberangan internasional agar mewaspadai perubahan garis kemudi akibat arus silang.' },
        { status: 'info', text: 'Jalur lalu lintas pelayaran pelabuhan Batam Center dan Harbour Bay berjalan normal.' }
      ],
      sopSteps: [
        { text: 'Laporkan rencana pelayaran (passage plan) ke Batam VTS Channel 84.', done: false },
        { text: 'Pastikan kru dek memantau sistem navigasi AIS aktif.', done: false }
      ],
      emergencyContacts: [
        { label: 'Batam VTS', number: '0778-412300' },
        { label: 'Kantor SAR Batam', number: '0778-412234' }
      ]
    },
    {
      id: 'oilgas',
      name: 'Industri Lepas Pantai',
      title: 'Rig & Kilang Minyak Perairan Natuna Selatan',
      riskScore: 65,
      riskLevel: 'Sedang',
      riskColor: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/10 border-amber-500/35 dark:border-amber-400/30',
      textColor: 'text-amber-600 dark:text-amber-500',
      bgGradient: 'from-amber-600/5 via-orange-600/5 to-transparent',
      bgIllustration: 'oilgas-radar',
      description: 'Manajemen mitigasi cuaca laut untuk rig pengeboran, FPSO, instalasi pipa bawah laut, dan logistik suplai bahan bakar.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.8 m (Sedang)', status: 'waspada' },
        { label: 'Angin Maksimum', value: '20 Knot', status: 'waspada' },
        { label: 'Helideck Status', value: 'Amber (Caution)', status: 'waspada' },
        { label: 'Arus Bawah Laut', value: '1.1 Knot (Utara)', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Kecepatan angin lepas pantai dapat meningkat secara mendadak. Operasi lifting barang menggunakan crane agar dibatasi.' },
        { status: 'info', text: 'Status helideck di rig lepas pantai Natuna dinyatakan "Amber" (perhatikan olengan kapal/platform).' }
      ],
      sopSteps: [
        { text: 'Lakukan pengetatan pengikatan logistik kargo dek terbuka kapal suplai.', done: false },
        { text: 'Periksa kekuatan struktur penambat jangkar rig lepas pantai.', done: false }
      ],
      emergencyContacts: [
        { label: 'KKKS Marine Command Center', number: '021-3810011' },
        { label: 'Pos AL Batam', number: '0778-321110' }
      ]
    }
  ],
  'Pekanbaru': [
    {
      id: 'shipping',
      name: 'Pelayaran Sungai',
      title: 'Alur Transportasi Logistik Sungai Siak',
      riskScore: 35,
      riskLevel: 'Rendah',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Navigasi perahu motor, kapal pandu, tongkang pengangkut kontainer sawit, cangkang, dan bubur kertas (pulp).',
      parameters: [
        { label: 'Tinggi Riak Air', value: '0.1 - 0.3 m (Aman)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '8 Knot', status: 'aman' },
        { label: 'Visibilitas', value: '5.0 km (Kabut Asap Tipis)', status: 'waspada' },
        { label: 'Arus Sungai', value: '0.5 Knot (Hilir)', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Jarak pandang pagi hari berkurang akibat konsentrasi uap air dan kabut asap tipis. Kapal tongkang agar memperlambat laju navigasi.' },
        { status: 'safe', text: 'Kondisi debit air Sungai Siak terpantau normal, tidak ada ancaman banjir limpasan.' }
      ],
      sopSteps: [
        { text: 'Nakhoda kapal tongkang wajib membunyikan isyarat suling saat melintasi kelokan tajam Sungai Siak.', done: false },
        { text: 'Pastikan lampu navigasi menyala terang untuk menghindari tabrakan perahu nelayan tradisional.', done: false }
      ],
      emergencyContacts: [
        { label: 'KSOP Kelas III Pekanbaru', number: '0761-22922' },
        { label: 'Basarnas Pekanbaru', number: '0761-674848' }
      ]
    },
    {
      id: 'fishery',
      name: 'Perikanan Sungai',
      title: 'Dermaga Perikanan & Nelayan Sungai Siak',
      riskScore: 28,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      bgIllustration: 'fishery-contours',
      description: 'Layanan keselamatan melaut bagi nelayan tradisional pencari ikan patin, baung, dan tapah dengan jaring insang.',
      parameters: [
        { label: 'Suhu Air Sungai', value: '28.8 °C', status: 'aman' },
        { label: 'pH Air Sungai', value: '6.5 (Normal)', status: 'aman' },
        { label: 'Kecepatan Angin', value: '6 Knot', status: 'aman' },
        { label: 'Potensi Cuaca', value: 'Berawan Teduh', status: 'aman' }
      ],
      advisories: [
        { status: 'safe', text: 'Arus sungai lambat, sangat aman untuk nelayan tebar jala kayu.' },
        { status: 'info', text: 'Hasil tangkapan ikan air tawar di sepanjang aliran sungai terpantau stabil.' }
      ],
      sopSteps: [
        { text: 'Bawa jas hujan cadangan mengantisipasi cuaca hujan deras sore hari khas Pekanbaru.', done: false },
        { text: 'Hindari menebar jaring di dekat area kabel listrik tegangan tinggi penyeberangan sungai.', done: false }
      ],
      emergencyContacts: [
        { label: 'Polsek Sektor Kawasan Pelabuhan Pekanbaru', number: '0761-21575' },
        { label: 'Dinas Perikanan Riau', number: '0761-22447' }
      ]
    }
  ],
  'Denpasar': [
    {
      id: 'shipping',
      name: 'Pelayaran & Logistik',
      title: 'Pelabuhan Benoa & Selat Badung',
      riskScore: 58,
      riskLevel: 'Sedang',
      riskColor: 'from-blue-500 to-indigo-500',
      glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
      bgIllustration: 'shipping-grid',
      description: 'Pemantauan keselamatan kapal pesiar internasional, penyeberangan fast boat Sanur-Nusa Penida, dan kapal kargo Pelabuhan Benoa.',
      parameters: [
        { label: 'Tinggi Gelombang', value: '1.75 m (Sedang)', status: 'waspada' },
        { label: 'Kecepatan Angin', value: '16 Knot', status: 'waspada' },
        { label: 'Arus Selat', value: '2.0 Knot (Selatan)', status: 'siaga' },
        { label: 'Visibilitas', value: '9.0 km (Sangat Baik)', status: 'aman' }
      ],
      advisories: [
        { status: 'warning', text: 'Arus laut di Selat Badung terpantau kencang. Operator fast boat pariwisata diimbau menyesuaikan rute untuk kenyamanan penumpang.' },
        { status: 'info', text: 'Pelabuhan Benoa aman didarati oleh kapal pesiar ukuran menengah.' }
      ],
      sopSteps: [
        { text: 'Operator fast boat wajib mendata manifest manifes penumpang secara digital.', done: false },
        { text: 'Periksa kekuatan lashing bagasi barang penumpang di atas kapal cepat.', done: false }
      ],
      emergencyContacts: [
        { label: 'VTS Benoa', number: '0361-720002' },
        { label: 'SAR Denpasar', number: '0361-721111' }
      ]
    },
    {
      id: 'tourism',
      name: 'Pariwisata Bahari',
      title: 'Pantai Kuta, Sanur & Nusa Dua',
      riskScore: 75,
      riskLevel: 'Tinggi',
      riskColor: 'from-rose-500 to-pink-500',
      glowColor: 'shadow-rose-500/20 dark:shadow-rose-500/10 border-rose-500/35 dark:border-rose-400/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgGradient: 'from-rose-600/5 via-pink-600/5 to-transparent',
      bgIllustration: 'tourism-waves',
      description: 'Panduan keselamatan rekreasi laut wisatawan: surfing Kuta, snorkeling Sanur, watersport Tanjung Benoa, dan rip current.',
      parameters: [
        { label: 'Surf Zone Wave', value: '2.2 m (Tinggi)', status: 'siaga' },
        { label: 'Rip Current Pantai', value: 'Kuat Terdeteksi', status: 'bahaya' },
        { label: 'Indeks UV', value: '10 (Sangat Tinggi)', status: 'siaga' },
        { label: 'Pasang Air Laut', value: '1.4 m', status: 'waspada' }
      ],
      advisories: [
        { status: 'danger', text: 'DILARANG keras berenang di area bendera merah Pantai Kuta akibat arus seret bawah laut (rip current) yang kuat.' },
        { status: 'warning', text: 'Tinggi gelombang pecah di pantai selancar Kuta meningkat. Peselancar pemula wajib didampingi pemandu berlisensi.' },
        { status: 'info', text: 'Indeks UV ekstrem siang hari. Gunakan tabir surya tahan air minimal SPF 50 saat beraktivitas di laut.' }
      ],
      sopSteps: [
        { text: 'Operator jetski dan parasailing wajib mematuhi jam operasional cuaca aman.', done: false },
        { text: 'Wisatawan dilarang mendekati tebing pantai berkarang tajam saat ombak tinggi menghantam.', done: false }
      ],
      emergencyContacts: [
        { label: 'Balawista Kuta (Lifeguard)', number: '0361-755666' },
        { label: 'Polairud Polda Bali', number: '0361-224455' }
      ]
    }
  ]
};

const defaultSectors: SectorAdvisor[] = [
  {
    id: 'shipping',
    name: 'Pelayaran & Logistik',
    title: 'Pelayaran Niaga & Logistik Maritim',
    riskScore: 65,
    riskLevel: 'Sedang',
    riskColor: 'from-blue-500 to-indigo-500',
    glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/10 border-blue-500/35 dark:border-blue-400/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-600/5 via-indigo-600/5 to-transparent',
    bgIllustration: 'shipping-grid',
    description: 'Sistem rekomendasi keselamatan kapal kargo, kontainer, perahu penumpang, dan aktivitas logistik antar pelabuhan wilayah pesisir.',
    parameters: [
      { label: 'Tinggi Gelombang', value: '2.1 m (Sedang)', status: 'waspada' },
      { label: 'Kecepatan Angin', value: '18 - 22 Knot', status: 'waspada' },
      { label: 'Visibilitas', value: '8.5 km (Baik)', status: 'aman' },
      { label: 'Arus Permukaan', value: '1.2 Knot (Barat)', status: 'aman' }
    ],
    advisories: [
      { status: 'warning', text: 'Tinggi gelombang di area outer-bar pelabuhan meningkat. Kapal draft dalam agar berkonsultasi dengan stasiun pandu.' },
      { status: 'info', text: 'Kecepatan arus pasang surut maksimum diprediksi pada pukul 20:30 WIB sebesar 1.4 knot.' }
    ],
    sopSteps: [
      { text: 'Verifikasi sistem kelistrikan & mesin cadangan sebelum lepas jangkar.', done: false },
      { text: 'Lashing muatan kargo dek atas secara ganda demi meredam olengan gelombang.', done: false }
    ],
    emergencyContacts: [
      { label: 'VTS Cilacap Channel 16', number: '0282-531234' },
      { label: 'Basarnas DIY', number: '0274-6462111' }
    ]
  },
  {
    id: 'fishery',
    name: 'Perikanan Tangkap',
    title: 'Perikanan Tangkap & Budidaya Pesisir',
    riskScore: 40,
    riskLevel: 'Rendah',
    riskColor: 'from-emerald-500 to-teal-500',
    glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
    bgIllustration: 'fishery-contours',
    description: 'Nelayan tradisional, armada kapal tangkap <30 GT, serta pemantauan area tambak/karamba jaring apung.',
    parameters: [
      { label: 'Surf Zone Wave', value: '1.5 m (Sedang)', status: 'waspada' },
      { label: 'Klorofil-a', value: 'Tinggi (Potensial)', status: 'aman' },
      { label: 'Suhu Air Laut', value: '27.4 °C (Normal)', status: 'aman' },
      { label: 'Kecepatan Arus', value: '0.8 Knot (Barat Daya)', status: 'aman' }
    ],
    advisories: [
      { status: 'safe', text: 'Zona Potensial Penangkapan Ikan (ZPPI) terdeteksi melimpah pada jarak 10 - 15 mil dari garis pantai.' },
      { status: 'warning', text: 'Waspadai tinggi gelombang pecah di area pantai berkarang selatan saat terjadi pasang air laut malam hari.' }
    ],
    sopSteps: [
      { text: 'Wajib membawa radio komunikasi VHF dan GPS genggam.', done: false },
      { text: 'Siapkan jaket pelampung (life jacket) yang mudah dijangkau di atas dek kapal.', done: false }
    ],
    emergencyContacts: [
      { label: 'Pos AL Sadeng', number: '0812-3456-7890' },
      { label: 'Himpunan Nelayan Seluruh Indonesia (HNSI) DIY', number: '0274-554433' }
    ]
  }
];

export const getSectorsDataForCity = (cityName: string): SectorAdvisor[] => {
  if (!cityName) return defaultSectors;
  
  // Clean name from subdistrict/province to match map keys
  const cityClean = cityName.split(',')[0].trim();
  const lowerName = cityClean.toLowerCase();
  
  if (lowerName.includes('jakarta')) return citySectorsMap['DKI Jakarta'];
  if (lowerName.includes('surabaya')) return citySectorsMap['Surabaya'];
  if (lowerName.includes('bandung')) return citySectorsMap['Bandung'];
  if (lowerName.includes('medan')) return citySectorsMap['Medan'];
  if (lowerName.includes('semarang')) return citySectorsMap['Semarang'];
  if (lowerName.includes('makassar')) return citySectorsMap['Makassar'];
  if (lowerName.includes('palembang')) return citySectorsMap['Palembang'];
  if (lowerName.includes('batam')) return citySectorsMap['Batam'];
  if (lowerName.includes('pekanbaru')) return citySectorsMap['Pekanbaru'];
  if (lowerName.includes('denpasar')) return citySectorsMap['Denpasar'];
  
  // For custom geolocated cities (Sleman, Bantul, etc.), search key matches or return default
  for (const key of Object.keys(citySectorsMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return citySectorsMap[key];
    }
  }
  
  return defaultSectors;
};

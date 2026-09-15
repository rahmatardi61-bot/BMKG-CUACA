// ── Aviation Advisor Data ────────────────────────────────────────────────────
// Struktur ini mengikuti pola maritimeAdvisorData.ts untuk konsistensi.
// Setiap kota memiliki beberapa "sektor penerbangan" dengan parameter, advisory,
// SOP checklist, dan kontak darurat yang relevan.

export interface AviationParameter {
  label: string;
  value: string;
  status: 'aman' | 'waspada' | 'siaga' | 'bahaya';
}

export interface AviationAdvisory {
  status: 'safe' | 'warning' | 'danger' | 'info';
  text: string;
}

export interface AviationSopStep {
  text: string;
  done: boolean;
}

export interface AviationEmergencyContact {
  label: string;
  number: string;
}

export interface AirportAdvisor {
  id: 'commercial' | 'cargo' | 'sigmet' | 'pirep';
  name: string;
  title: string;
  icao: string;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  riskScore: number;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Bahaya';
  riskColor: string;
  glowColor: string;
  textColor: string;
  bgGradient: string;
  description: string;
  parameters: AviationParameter[];
  advisories: AviationAdvisory[];
  sopSteps: AviationSopStep[];
  emergencyContacts: AviationEmergencyContact[];
}

// ── City Airport Map ──────────────────────────────────────────────────────────

export const cityAirportsMap: Record<string, AirportAdvisor[]> = {

  // ── DKI Jakarta ─────────────────────────────────────────────────────────────
  'DKI Jakarta': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Soekarno-Hatta Intl (WIII) — Jakarta',
      icao: 'WIII',
      category: 'VFR',
      riskScore: 48,
      riskLevel: 'Sedang',
      riskColor: 'from-indigo-500 to-violet-500',
      glowColor: 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgGradient: 'from-indigo-600/5 via-violet-600/5 to-transparent',
      description: 'Operasional penerbangan domestik & internasional di Bandara Soekarno-Hatta, hub utama Jawa bagian barat. Traffic padat menjelang sore hari.',
      parameters: [
        { label: 'Visibilitas Landas', value: '9.000 m (Sangat Baik)', status: 'aman' },
        { label: 'Angin RWY 25L/R', value: '270° / 14 kt (Gust 22 kt)', status: 'waspada' },
        { label: 'Ceiling', value: 'FEW020 — 2.000 ft', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — Aman Terbang', status: 'aman' },
      ],
      advisories: [
        { status: 'warning', text: 'TEMPO TS 1300-1700Z. Potensi badai petir sementara di sektor timur bandara. Perhatikan ATIS terkini.' },
        { status: 'info', text: 'Wind shear dilaporkan oleh PIREP di short final RWY 25L. Crew waspada saat pendekatan.' },
      ],
      sopSteps: [
        { text: 'Dapatkan clearance ATIS terbaru sebelum pushback.', done: false },
        { text: 'Koordinasikan dengan ATC Arrival/Departure sebelum memasuki runway.', done: false },
        { text: 'Aktifkan proteksi petir pada avionik jika memasuki area cumulonimbus.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC TWR Soetta', number: '021-5591550' },
        { label: 'Basarnas Pusat', number: '115' },
      ],
    },
    {
      id: 'sigmet',
      name: 'SIGMET & AIRMET',
      title: 'FIR Jakarta — Peringatan Aktif',
      icao: 'WIII',
      category: 'MVFR',
      riskScore: 62,
      riskLevel: 'Tinggi',
      riskColor: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/10 border-amber-500/35 dark:border-amber-400/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'from-amber-600/5 via-orange-600/5 to-transparent',
      description: 'Informasi SIGMET aktif pada FIR Jakarta. Turbulensi kuat dan sel CB aktif di sekitar perairan Laut Jawa memerlukan mitigasi rute segera.',
      parameters: [
        { label: 'SIGMET WS-JKT', value: 'SEV TURB FL180-FL380', status: 'bahaya' },
        { label: 'AIRMET IFR', value: 'Low Vis Coastal West Java', status: 'siaga' },
        { label: 'CB Coverage', value: 'ISOL-OCNL Di Laut Jawa', status: 'waspada' },
        { label: 'Batas Waktu', value: 'Valid hingga 2200Z', status: 'waspada' },
      ],
      advisories: [
        { status: 'danger', text: 'SIGMET WS-JKT aktif: Severe Turbulence FL180-FL380 di atas Laut Jawa. Hindari ketinggian tersebut atau minta re-routing dari ATC.' },
        { status: 'warning', text: 'AIRMET: Kondisi IFR akibat visibilitas rendah di kawasan pesisir Jawa Barat hingga 2100Z.' },
      ],
      sopSteps: [
        { text: 'Periksa SIGMET dan AIRMET terbaru dari BMKG sebelum departure.', done: false },
        { text: 'Koordinasikan dengan dispatcher untuk flight plan alternatif.', done: false },
        { text: 'Laporkan turbulensi yang dijumpai ke ATC sebagai PIREP.', done: false },
      ],
      emergencyContacts: [
        { label: 'MWO Jakarta', number: '021-6541539' },
        { label: 'ACC Jakarta', number: '021-5501008' },
      ],
    },
  ],

  // ── Surabaya ─────────────────────────────────────────────────────────────────
  'Surabaya': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Juanda Intl (WARR) — Surabaya',
      icao: 'WARR',
      category: 'MVFR',
      riskScore: 58,
      riskLevel: 'Sedang',
      riskColor: 'from-indigo-500 to-violet-500',
      glowColor: 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgGradient: 'from-indigo-600/5 via-violet-600/5 to-transparent',
      description: 'Bandara Juanda sebagai hub penerbangan Jawa Timur dan Indonesia Timur. Kondisi kabut asap (Haze) aktif membatasi jarak pandang siang hari.',
      parameters: [
        { label: 'Visibilitas', value: '6.000 m (Haze — Terbatas)', status: 'waspada' },
        { label: 'Angin RWY 10', value: '120° / 8 kt (Calm)', status: 'aman' },
        { label: 'Ceiling', value: 'BKN015 — 1.500 ft', status: 'siaga' },
        { label: 'Kategori Cuaca', value: 'MVFR — Perlu Instrumen', status: 'waspada' },
      ],
      advisories: [
        { status: 'warning', text: 'Haze mengurangi visibilitas jarak landing di RWY 10/28. Pilot diimbau melakukan briefing IFR approach meskipun kondisi MVFR.' },
        { status: 'info', text: 'Perkiraan visibilitas membaik menjadi 8.000 m setelah pukul 15.00 WIB seiring angin laut masuk.' },
      ],
      sopSteps: [
        { text: 'Lakukan ILS approach briefing meskipun kondisi MVFR.', done: false },
        { text: 'Monitor ATIS WARR secara aktif dan update pre-approach.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Juanda', number: '031-8686600' },
        { label: 'Basarnas Surabaya', number: '031-5671118' },
      ],
    },
    {
      id: 'pirep',
      name: 'Laporan Pilot (PIREP)',
      title: 'PIREP Aktif — Koridor Jawa Timur',
      icao: 'WARR',
      category: 'MVFR',
      riskScore: 45,
      riskLevel: 'Sedang',
      riskColor: 'from-sky-500 to-cyan-500',
      glowColor: 'shadow-sky-500/20 dark:shadow-sky-500/10 border-sky-500/35 dark:border-sky-400/30',
      textColor: 'text-sky-600 dark:text-sky-400',
      bgGradient: 'from-sky-600/5 via-cyan-600/5 to-transparent',
      description: 'Laporan pilot (PIREP) aktif di koridor pendekatan WARR. Turbulensi ringan terdeteksi pada ketinggian FL030 saat descent melalui lapisan haze.',
      parameters: [
        { label: 'Turbulensi Dilaporkan', value: 'LGT — FL030 saat Descent', status: 'waspada' },
        { label: 'Lapisan Haze', value: 'SFC — 3.000 ft', status: 'waspada' },
        { label: 'Tipe Pesawat', value: 'A320 (Multiple Report)', status: 'aman' },
        { label: 'CB Terdeteksi', value: 'SCT CB Sektor Barat', status: 'siaga' },
      ],
      advisories: [
        { status: 'warning', text: 'PIREP: Turbulensi ringan di descent path WARR, FL080 ke bawah. Rekomendasi seat belt ON penumpang sejak TOD.' },
        { status: 'info', text: 'Lapisan CB tersebar di sektor barat dari WARR. Rute ke arah timur relatif bersih.' },
      ],
      sopSteps: [
        { text: 'Nyalakan fasten seat belt sign sejak ketinggian FL100.', done: false },
        { text: 'Lapor kondisi turbulensi ke ATC sebagai PIREP saat keluar dari turbulent layer.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Approach Juanda', number: '031-8686601' },
        { label: 'AOC Maskapai', number: 'Sesuai maskapai operasional' },
      ],
    },
  ],

  // ── Bandung ──────────────────────────────────────────────────────────────────
  'Bandung': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Husein Sastranegara (WICC) — Bandung',
      icao: 'WICC',
      category: 'IFR',
      riskScore: 78,
      riskLevel: 'Tinggi',
      riskColor: 'from-rose-500 to-red-500',
      glowColor: 'shadow-rose-500/20 dark:shadow-rose-500/10 border-rose-500/35 dark:border-rose-400/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgGradient: 'from-rose-600/5 via-red-600/5 to-transparent',
      description: 'Bandara Husein Sastranegara diselimuti kabut tebal (FG). Kondisi IFR aktif dengan ceiling rendah 800 ft. Kemungkinan keterlambatan dan pengalihan penerbangan tinggi.',
      parameters: [
        { label: 'Visibilitas', value: '2.000 m (Kabut Tebal)', status: 'bahaya' },
        { label: 'Ceiling', value: 'OVC008 — 800 ft', status: 'bahaya' },
        { label: 'Angin', value: 'Calm (00000KT)', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'IFR — Perlu CAT-I/II', status: 'siaga' },
      ],
      advisories: [
        { status: 'danger', text: 'KABUT TEBAL AKTIF: Visibilitas 2.000 m dengan OVC008. Potensi pengalihan penerbangan (divert) ke WIII atau WIHH sangat tinggi.' },
        { status: 'warning', text: 'Penerbangan hanya diizinkan bagi crew yang sudah ter-qualified CAT-I minimum approach. Cek NOTAMs perihal ILS availability.' },
      ],
      sopSteps: [
        { text: 'Verifikasi ketersediaan ILS WICC dan minima approach sebelum departure dari origin.', done: false },
        { text: 'Siapkan alternate airport (WIII/Jakarta) dengan bahan bakar diversion.', done: false },
        { text: 'Laporkan kondisi aktual saat landing kepada ATC sebagai PIREP.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Husein Sastranegara', number: '022-6040025' },
        { label: 'Basarnas Bandung', number: '022-6120098' },
      ],
    },
  ],

  // ── Medan ────────────────────────────────────────────────────────────────────
  'Medan': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Kualanamu Intl (WIMM) — Medan',
      icao: 'WIMM',
      category: 'VFR',
      riskScore: 35,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      description: 'Bandara Kualanamu dalam kondisi VFR cerah. Angin tenang dan visibilitas baik mendukung penerbangan internasional dari dan ke Singapura, Kuala Lumpur, dan kota-kota Sumatera.',
      parameters: [
        { label: 'Visibilitas', value: '9.999 m (Sangat Baik)', status: 'aman' },
        { label: 'Angin RWY 23', value: '180° / 8 kt', status: 'aman' },
        { label: 'Ceiling', value: 'SCT025 — 2.500 ft', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — Kondisi Ideal', status: 'aman' },
      ],
      advisories: [
        { status: 'safe', text: 'Kondisi penerbangan sangat kondusif di WIMM. Tidak ada peringatan cuaca aktif dalam radius 50 NM.' },
        { status: 'info', text: 'Angin permukaan tenang, crosswind di bawah 5 kt. Ideal untuk operasi penerbangan berjadwal dan kargo.' },
      ],
      sopSteps: [
        { text: 'Laksanakan briefing rutin sebelum taxi sesuai SOP maskapai.', done: false },
        { text: 'Pantau ATIS WIMM untuk update terbaru jelang blok off.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Kualanamu', number: '061-8951100' },
        { label: 'Basarnas Medan', number: '061-6617477' },
      ],
    },
    {
      id: 'sigmet',
      name: 'SIGMET & AIRMET',
      title: 'Abu Vulkanik — Sinabung Area',
      icao: 'WIMM',
      category: 'VFR',
      riskScore: 42,
      riskLevel: 'Sedang',
      riskColor: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/10 border-amber-500/35 dark:border-amber-400/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'from-amber-600/5 via-orange-600/5 to-transparent',
      description: 'Peringatan abu vulkanik dari Gunung Sinabung bergerak ke selatan. Meskipun WIMM tidak terdampak langsung, beberapa rute low altitude di Sumatera Utara perlu dihindari.',
      parameters: [
        { label: 'Sumber Vulkanik', value: 'Gunung Sinabung (WBST)', status: 'siaga' },
        { label: 'Pergerakan Abu', value: 'SE 20 kt, SFC–FL150', status: 'waspada' },
        { label: 'Dampak di WIMM', value: 'Tidak Langsung', status: 'aman' },
        { label: 'VA Advisory', value: 'Valid 241400Z–242000Z', status: 'waspada' },
      ],
      advisories: [
        { status: 'warning', text: 'Abu vulkanik Sinabung bergerak SE di ketinggian SFC-FL150. Hindari rute low altitude melewati sektor barat Sumatera Utara.' },
        { status: 'info', text: 'WIMM aman dari dampak langsung. Update VOLMET setiap 30 menit.' },
      ],
      sopSteps: [
        { text: 'Cek SIGMET VA terbaru dari ATC sebelum setiap penerbangan ke arah selatan Sumatera.', done: false },
        { text: 'Jika bertemu abu vulkanik, kurangi kecepatan dan beri laporan ke ATC segera.', done: false },
      ],
      emergencyContacts: [
        { label: 'VAAC Darwin', number: 'darwinvaac@bom.gov.au' },
        { label: 'MWO Medan', number: '061-6641800' },
      ],
    },
  ],

  // ── Makassar ─────────────────────────────────────────────────────────────────
  'Makassar': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Sultan Hasanuddin Intl (WAAA) — Makassar',
      icao: 'WAAA',
      category: 'VFR',
      riskScore: 38,
      riskLevel: 'Rendah',
      riskColor: 'from-indigo-500 to-violet-500',
      glowColor: 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgGradient: 'from-indigo-600/5 via-violet-600/5 to-transparent',
      description: 'Bandara Sultan Hasanuddin sebagai pintu gerbang penerbangan Indonesia Timur. Cuaca cerah mendukung koneksi ke Manado, Sorong, Jayapura, dan rute internasional ke Darwin.',
      parameters: [
        { label: 'Visibilitas', value: '9.999 m (Sangat Baik)', status: 'aman' },
        { label: 'Angin RWY 31', value: '300° / 10 kt', status: 'aman' },
        { label: 'Ceiling', value: 'FEW030 — 3.000 ft', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — Kondusif', status: 'aman' },
      ],
      advisories: [
        { status: 'safe', text: 'Kondisi penerbangan sangat baik di WAAA. Semua jadwal penerbangan beroperasi normal.' },
        { status: 'info', text: 'Musim kemarau menghadirkan angin timur yang stabil dan bermanfaat untuk efisiensi rute ke Jawa.' },
      ],
      sopSteps: [
        { text: 'Lakukan pre-departure check sesuai SOP dengan perhatian pada rute melintasi Selat Makassar.', done: false },
        { text: 'Verifikasi NOTAMs untuk rute ke Jayapura dan Papua sehubungan dengan kondisi gunung berapi di Maluku.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Sultan Hasanuddin', number: '0411-5551234' },
        { label: 'Basarnas Makassar', number: '0411-313101' },
      ],
    },
  ],

  // ── Denpasar ─────────────────────────────────────────────────────────────────
  'Denpasar': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'I Gusti Ngurah Rai Intl (WADD) — Denpasar',
      icao: 'WADD',
      category: 'VFR',
      riskScore: 28,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      description: 'Bandara Ngurah Rai dalam kondisi cuaca ideal untuk penerbangan internasional musim puncak pariwisata Bali. Langit biru dengan visibilitas penuh mendukung operasi normal.',
      parameters: [
        { label: 'Visibilitas', value: '9.999 m (10 km Penuh)', status: 'aman' },
        { label: 'Angin RWY 09', value: '110° / 12 kt (Headwind)', status: 'aman' },
        { label: 'Ceiling', value: 'FEW020 — 2.000 ft', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — Sangat Kondusif', status: 'aman' },
      ],
      advisories: [
        { status: 'safe', text: 'Kondisi penerbangan terbaik hari ini. Tidak ada peringatan aktif di WADD dan sekitarnya.' },
        { status: 'info', text: 'Headwind di RWY 09 membantu lift-off lebih efisien. Kondisi ideal untuk penerbangan wide-body B777 dan A330.' },
      ],
      sopSteps: [
        { text: 'Waspadai traffic padat di apron saat jam puncak pagi (07:00-09:00 WITA) dan sore (15:00-18:00 WITA).', done: false },
        { text: 'Cek NOTAM terkait RWY 27 yang digunakan saat angin barat musim barat.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Ngurah Rai', number: '0361-751011' },
        { label: 'Basarnas Bali', number: '0361-720222' },
      ],
    },
  ],

  // ── Semarang ─────────────────────────────────────────────────────────────────
  'Semarang': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Ahmad Yani Intl (WIIS) — Semarang',
      icao: 'WIIS',
      category: 'MVFR',
      riskScore: 55,
      riskLevel: 'Sedang',
      riskColor: 'from-indigo-500 to-violet-500',
      glowColor: 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgGradient: 'from-indigo-600/5 via-violet-600/5 to-transparent',
      description: 'Bandara Ahmad Yani mengalami pergeseran kondisi MVFR akibat persebaran awan rendah dari arah laut Jawa. Penerbangan sore hari memerlukan perhatian tambahan.',
      parameters: [
        { label: 'Visibilitas', value: '7.000 m (Cukup Baik)', status: 'aman' },
        { label: 'Angin RWY 13', value: '140° / 10 kt', status: 'aman' },
        { label: 'Ceiling', value: 'BKN012 — 1.200 ft', status: 'waspada' },
        { label: 'Kategori Cuaca', value: 'MVFR — Ceiling Rendah', status: 'waspada' },
      ],
      advisories: [
        { status: 'warning', text: 'Ceiling BKN012 di WIIS. Penerbangan visual tidak disarankan. Gunakan ILS approach dan siapkan alternate.' },
        { status: 'info', text: 'Diprakirakan kondisi membaik setelah pukul 14.00 WIB seiring dissipasi lapisan awan rendah.' },
      ],
      sopSteps: [
        { text: 'Pastikan crew sudah ber-qualified untuk ILS approach dengan decision height 200 ft.', done: false },
        { text: 'Briefing alternate airport ke WARR (Surabaya) atau WAII (Yogyakarta) sebelum departure.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Ahmad Yani', number: '024-7608200' },
        { label: 'Basarnas Semarang', number: '024-8315050' },
      ],
    },
  ],

  // ── Manado ───────────────────────────────────────────────────────────────────
  'Manado': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Sam Ratulangi Intl (WAMM) — Manado',
      icao: 'WAMM',
      category: 'VFR',
      riskScore: 42,
      riskLevel: 'Sedang',
      riskColor: 'from-sky-500 to-cyan-500',
      glowColor: 'shadow-sky-500/20 dark:shadow-sky-500/10 border-sky-500/35 dark:border-sky-400/30',
      textColor: 'text-sky-600 dark:text-sky-400',
      bgGradient: 'from-sky-600/5 via-cyan-600/5 to-transparent',
      description: 'Bandara Sam Ratulangi dalam kondisi VFR dengan hujan rintik sesaat (SHRA). Cuaca aktif di sektor barat perlu diantisipasi pada penerbangan ke arah Sulawesi Tengah.',
      parameters: [
        { label: 'Visibilitas', value: '8.000 m (Baik)', status: 'aman' },
        { label: 'Angin RWY 18', value: '320° / 6 kt', status: 'aman' },
        { label: 'Ceiling', value: 'SCT018 BKN080', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — TEMPO SHRA', status: 'waspada' },
      ],
      advisories: [
        { status: 'warning', text: 'TEMPO SHRA 1200-1500Z di sekitar WAMM. Potensi hujan deras sesaat selama 15-30 menit. Crew wajib memantau ATIS aktif.' },
        { status: 'info', text: 'CB tersebar di sektor barat. Rute ke Gorontalo dan Palu disarankan melalui jalur pesisir timur untuk menghindari CB.' },
      ],
      sopSteps: [
        { text: 'Monitor radar cuaca WAMM dan minta update dari ATC menjelang descent.', done: false },
        { text: 'Aktifkan WX Radar dan Turbulence Mode saat melintasi area SHRA.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Sam Ratulangi', number: '0431-812244' },
        { label: 'Basarnas Manado', number: '0431-851111' },
      ],
    },
  ],

  // ── Palembang ─────────────────────────────────────────────────────────────────
  'Palembang': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Sultan Mahmud Badaruddin II (WIPP) — Palembang',
      icao: 'WIPP',
      category: 'MVFR',
      riskScore: 65,
      riskLevel: 'Tinggi',
      riskColor: 'from-amber-500 to-orange-500',
      glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/10 border-amber-500/35 dark:border-amber-400/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'from-amber-600/5 via-orange-600/5 to-transparent',
      description: 'Bandara Palembang terdampak kabut asap (smoke haze) dari kebakaran lahan gambut di sekitar Musi Banyuasin. Visibilitas berpotensi menurun drastis siang hingga sore hari.',
      parameters: [
        { label: 'Visibilitas', value: '4.000 m (Smoke Haze)', status: 'siaga' },
        { label: 'Asap Lahan', value: 'Aktif Radius 30 km', status: 'bahaya' },
        { label: 'Angin', value: '090° / 5 kt (Lemah)', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'MVFR — Smoke Aktif', status: 'siaga' },
      ],
      advisories: [
        { status: 'danger', text: 'SMOKE HAZE AKTIF: Kebakaran gambut meningkatkan partikulat udara. Visibilitas berpotensi di bawah 1.000 m saat peak smoke sore hari.' },
        { status: 'warning', text: 'Penerbangan sore hari risiko tinggi. Disarankan jadwal departure dan arrival bergeser ke pagi hari (06:00–10:00 WIB).' },
      ],
      sopSteps: [
        { text: 'Cek tren visibilitas WIPP setiap 30 menit via ATIS saat operasi smoke season.', done: false },
        { text: 'Siapkan alternate WIBB (Pekanbaru) atau WIHH (Padang) dengan fuel extra diversion.', done: false },
        { text: 'Laporkan kondisi smoke visibility saat landing untuk update PIREP.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC SMB II Palembang', number: '0711-410031' },
        { label: 'BPBD Sumsel (Kebakaran)', number: '0711-311313' },
      ],
    },
  ],

  // ── Pekanbaru ─────────────────────────────────────────────────────────────────
  'Pekanbaru': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Sultan Syarif Kasim II (WIBB) — Pekanbaru',
      icao: 'WIBB',
      category: 'IFR',
      riskScore: 72,
      riskLevel: 'Tinggi',
      riskColor: 'from-rose-500 to-red-500',
      glowColor: 'shadow-rose-500/20 dark:shadow-rose-500/10 border-rose-500/35 dark:border-rose-400/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgGradient: 'from-rose-600/5 via-red-600/5 to-transparent',
      description: 'Bandara Sultan Syarif Kasim II menghadapi kondisi IFR akibat asap tebal kebakaran hutan Riau. Potensi penutupan bandara (aerodrome closure) jika smoke intensifies.',
      parameters: [
        { label: 'Visibilitas', value: '1.500 m (Smoke Sangat Tebal)', status: 'bahaya' },
        { label: 'Ceiling', value: 'OVC005 — 500 ft (Smoke)', status: 'bahaya' },
        { label: 'Indeks Asap', value: 'ISPU 285 (Sangat Berbahaya)', status: 'bahaya' },
        { label: 'Kategori Cuaca', value: 'IFR — Potensi Closure', status: 'bahaya' },
      ],
      advisories: [
        { status: 'danger', text: 'SMOKE IFR KRITIS: Visibilitas 1.500 m dengan OVC005 akibat smoke kebakaran hutan Riau. Operasi penerbangan sangat terbatas. Risiko go-around dan divert sangat tinggi.' },
        { status: 'danger', text: 'Otoritas bandara WIBB mempertimbangkan aerodrome closure jika visibilitas turun di bawah 800 m. Pantau NOTAM setiap jam.' },
      ],
      sopSteps: [
        { text: 'Cek status bandara WIBB via NOTAM sebelum departure dari bandara asal.', done: false },
        { text: 'Jangan departure menuju WIBB tanpa alternate airport yang sudah dikonfirmasi kondisinya.', done: false },
        { text: 'Siapkan prosedur go-around dan full ILS approach meskipun crew berpengalaman.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC SSK II Pekanbaru', number: '0761-674100' },
        { label: 'Basarnas Riau', number: '0761-21111' },
      ],
    },
  ],

  // ── Batam ─────────────────────────────────────────────────────────────────────
  'Batam': [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: 'Hang Nadim Intl (WIDD) — Batam',
      icao: 'WIDD',
      category: 'VFR',
      riskScore: 33,
      riskLevel: 'Rendah',
      riskColor: 'from-emerald-500 to-teal-500',
      glowColor: 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-600/5 via-teal-600/5 to-transparent',
      description: 'Bandara Hang Nadim beroperasi normal dalam kondisi VFR cerah. Rute penerbangan charter dan komersial ke Singapura (WSSS) dan KL (WMKK) terpantau lancar tanpa hambatan.',
      parameters: [
        { label: 'Visibilitas', value: '9.000 m (Sangat Baik)', status: 'aman' },
        { label: 'Angin RWY 04', value: '040° / 9 kt', status: 'aman' },
        { label: 'Ceiling', value: 'FEW025 — 2.500 ft', status: 'aman' },
        { label: 'Kategori Cuaca', value: 'VFR — Operasi Normal', status: 'aman' },
      ],
      advisories: [
        { status: 'safe', text: 'Tidak ada peringatan cuaca aktif di WIDD. Penerbangan charter dan komersial berjalan sesuai jadwal.' },
        { status: 'info', text: 'FIR Singapore (WSSS) melaporkan clear di sektor yang berdekatan. Koordinasi lintas batas tidak ada hambatan hari ini.' },
      ],
      sopSteps: [
        { text: 'Lakukan koordinasi dengan Singapore ATC untuk penerbangan melintas FIR boundary.', done: false },
        { text: 'Pastikan customs clearance dan manifes penumpang untuk penerbangan internasional ke Singapura sudah lengkap.', done: false },
      ],
      emergencyContacts: [
        { label: 'ATC Hang Nadim', number: '0778-761600' },
        { label: 'Basarnas Kepri', number: '0778-451111' },
      ],
    },
    {
      id: 'cargo',
      name: 'Kargo & Charter',
      title: 'Operasi Kargo & MRO — Batam',
      icao: 'WIDD',
      category: 'VFR',
      riskScore: 25,
      riskLevel: 'Rendah',
      riskColor: 'from-violet-500 to-purple-500',
      glowColor: 'shadow-violet-500/20 dark:shadow-violet-500/10 border-violet-500/35 dark:border-violet-400/30',
      textColor: 'text-violet-600 dark:text-violet-400',
      bgGradient: 'from-violet-600/5 via-purple-600/5 to-transparent',
      description: 'Operasi kargo internasional dan fasilitas MRO (Maintenance Repair Overhaul) di Batam berjalan aktif. Runway extra-wide WIDD mendukung operasi pesawat widebody kargo B747F dan B777F.',
      parameters: [
        { label: 'Status RWY', value: 'Aktif — Extra Wide 45m', status: 'aman' },
        { label: 'Operasi Kargo', value: 'B747F & B777F — Normal', status: 'aman' },
        { label: 'MRO Slot', value: 'Tersedia — Hanggar A & B', status: 'aman' },
        { label: 'Cuaca Apron', value: 'Cerah — Kerja Aman', status: 'aman' },
      ],
      advisories: [
        { status: 'safe', text: 'Kondisi apron dan taxiway bersih. Operasi ground handling kargo berjalan normal.' },
        { status: 'info', text: 'Slot kargo malam hari tersedia untuk koneksi ke hub WSSS. Koordinasikan departure time dengan Batam ATC.' },
      ],
      sopSteps: [
        { text: 'Verifikasi load sheet dan center of gravity kargo sebelum departure.', done: false },
        { text: 'Pastikan dangerous goods sudah ter-declare sesuai IATA DGR sebelum loading.', done: false },
      ],
      emergencyContacts: [
        { label: 'Ground Handling Batam', number: '0778-761700' },
        { label: 'Bea Cukai Batam', number: '0778-453700' },
      ],
    },
  ],
};

// ── Default fallback (digunakan jika kota tidak ditemukan di map) ──────────────
const defaultAirports: AirportAdvisor[] = [
  {
    id: 'commercial',
    name: 'Penerbangan Komersial',
    title: 'Bandara Terdekat — Data Aktual',
    icao: '----',
    category: 'VFR',
    riskScore: 40,
    riskLevel: 'Sedang',
    riskColor: 'from-indigo-500 to-violet-500',
    glowColor: 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    bgGradient: 'from-indigo-600/5 via-violet-600/5 to-transparent',
    description: 'Data penerbangan untuk lokasi Anda belum tersedia secara spesifik. Rekomendasi umum diterapkan berdasarkan kondisi cuaca regional yang berlaku.',
    parameters: [
      { label: 'Kategori Penerbangan', value: 'VFR — Kondisi Normal', status: 'aman' },
      { label: 'Status Bandara', value: 'Cek Bandara Terdekat', status: 'waspada' },
      { label: 'SIGMET Regional', value: 'Pantau FIR Terkait', status: 'aman' },
      { label: 'Sumber Data', value: 'Data Regional BMKG', status: 'aman' },
    ],
    advisories: [
      { status: 'info', text: 'Lokasi Anda tidak memiliki bandara spesifik dalam database. Gunakan data bandara terdekat dari aplikasi BMKG resmi.' },
      { status: 'safe', text: 'Kondisi umum penerbangan di wilayah Indonesia saat ini tidak ada peringatan kritis regional.' },
    ],
    sopSteps: [
      { text: 'Akses data penerbangan aktual melalui portal BMKG Aviation di https://aviation.bmkg.go.id', done: false },
      { text: 'Cek NOTAM terbaru untuk bandara tujuan di seluruh Indonesia.', done: false },
    ],
    emergencyContacts: [
      { label: 'BMKG Aviation Center', number: '021-6541539' },
      { label: 'Basarnas Nasional', number: '115' },
    ],
  },
];

// ── Koordinat Bandara Indonesia (Daftar Lebih Lengkap) ───────────────────────
// Koordinat bandara utama dan regional di Indonesia untuk lookup dinamis
const airportCoordinates: { cityKey: string; lat: number; lng: number; icao: string; name: string }[] = [
  // Jawa & Bali
  { cityKey: 'DKI Jakarta', lat: -6.1256,  lng: 106.6559, icao: 'WIII', name: 'Soekarno-Hatta' },
  { cityKey: 'DKI Jakarta', lat: -6.2697,  lng: 106.8886, icao: 'WIHH', name: 'Halim Perdanakusuma' },
  { cityKey: 'Surabaya',    lat: -7.3797,  lng: 112.7870, icao: 'WARR', name: 'Juanda' },
  { cityKey: 'Bandung',     lat: -6.9006,  lng: 107.5762, icao: 'WICC', name: 'Husein Sastranegara' },
  { cityKey: 'Yogyakarta',  lat: -7.9042,  lng: 110.0592, icao: 'WAHI', name: 'Yogyakarta International Airport (YIA)' },
  { cityKey: 'Yogyakarta',  lat: -7.7880,  lng: 110.4318, icao: 'WAHH', name: 'Adisucipto' },
  { cityKey: 'Solo',        lat: -7.5158,  lng: 110.7562, icao: 'WAHQ', name: 'Adi Sumarmo' },
  { cityKey: 'Semarang',    lat: -6.9727,  lng: 110.3750, icao: 'WIIS', name: 'Ahmad Yani' },
  { cityKey: 'Cilacap',     lat: -7.6385,  lng: 109.0347, icao: 'WAHL', name: 'Tunggul Wulung' },
  { cityKey: 'Malang',      lat: -7.9268,  lng: 112.7132, icao: 'WARI', name: 'Abdul Rachman Saleh' },
  { cityKey: 'Denpasar',    lat: -8.7481,  lng: 115.1671, icao: 'WADD', name: 'I Gusti Ngurah Rai' },

  // Sumatera
  { cityKey: 'Medan',       lat: 3.6425,   lng: 98.8853,  icao: 'WIMM', name: 'Kualanamu' },
  { cityKey: 'Batam',       lat: 1.1212,   lng: 104.1189, icao: 'WIDD', name: 'Hang Nadim' },
  { cityKey: 'Palembang',   lat: -2.8983,  lng: 104.6999, icao: 'WIPP', name: 'Sultan Mahmud Badaruddin II' },
  { cityKey: 'Pekanbaru',   lat: 0.4608,   lng: 101.4449, icao: 'WIBB', name: 'Sultan Syarif Kasim II' },
  { cityKey: 'Padang',      lat: -0.7854,  lng: 100.3540, icao: 'WIPT', name: 'Minangkabau' },
  { cityKey: 'Banda Aceh',  lat: 5.5173,   lng: 95.4206,  icao: 'WITT', name: 'Sultan Iskandar Muda' },

  // Kalimantan, Sulawesi & Papua
  { cityKey: 'Makassar',    lat: -5.0617,  lng: 119.5540, icao: 'WAAA', name: 'Sultan Hasanuddin' },
  { cityKey: 'Manado',      lat: 1.5492,   lng: 124.9260, icao: 'WAMM', name: 'Sam Ratulangi' },
  { cityKey: 'Balikpapan',  lat: -1.2683,  lng: 116.8967, icao: 'WALL', name: 'Sultan Aji Muhammad Sulaiman Sepinggan' },
  { cityKey: 'Banjarmasin', lat: -3.4414,  lng: 114.7617, icao: 'WAOO', name: 'Syamsudin Noor' },
  { cityKey: 'Jayapura',    lat: -2.5786,  lng: 140.5167, icao: 'WAJJ', name: 'Sentani' },
];

// ── Haversine distance (km) ───────────────────────────────────────────────────
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Dynamic Mock Data Generator ───────────────────────────────────────────────
// Membuat data advisor secara dinamis untuk bandara yang belum ada di database statis
const generateDynamicAirportData = (cityKey: string, airportName: string, icao: string): AirportAdvisor[] => {
  // Gunakan variasi cuaca acak tetapi realistis (VFR atau MVFR sebagai default)
  const isVfr = Math.random() > 0.4;
  const category = isVfr ? 'VFR' : 'MVFR';
  const categoryDesc = isVfr ? 'Visual Flight Rules — Aman' : 'Marginal Visual Flight Rules';
  const riskScore = isVfr ? 30 + Math.floor(Math.random() * 15) : 50 + Math.floor(Math.random() * 15);
  const riskLevel = isVfr ? 'Rendah' : 'Sedang';
  
  return [
    {
      id: 'commercial',
      name: 'Penerbangan Komersial',
      title: `${airportName} (${icao}) — ${cityKey}`,
      icao: icao,
      category: category,
      riskScore: riskScore,
      riskLevel: riskLevel as any,
      riskColor: isVfr ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-violet-500',
      glowColor: isVfr 
        ? 'shadow-emerald-500/20 dark:shadow-emerald-500/10 border-emerald-500/35 dark:border-emerald-400/30'
        : 'shadow-indigo-500/20 dark:shadow-indigo-500/10 border-indigo-500/35 dark:border-indigo-400/30',
      textColor: isVfr ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400',
      bgGradient: isVfr 
        ? 'from-emerald-600/5 via-teal-600/5 to-transparent'
        : 'from-indigo-600/5 via-violet-600/5 to-transparent',
      description: `Layanan operasional penerbangan regional di Bandara ${airportName} (${cityKey}). Memantau kondisi cuaca lokal untuk keselamatan takeoff dan landing.`,
      parameters: [
        { label: 'Visibilitas', value: isVfr ? '9.000 m (Baik)' : '6.000 m (Sedikit Haze)', status: isVfr ? 'aman' : 'waspada' },
        { label: 'Angin Permukaan', value: '110° / 8 Knot', status: 'aman' },
        { label: 'Ceiling Awan', value: isVfr ? 'SCT020 — 2.000 ft' : 'BKN015 — 1.500 ft', status: isVfr ? 'aman' : 'waspada' },
        { label: 'Kategori Cuaca', value: categoryDesc, status: isVfr ? 'aman' : 'waspada' }
      ],
      advisories: [
        { 
          status: isVfr ? 'safe' : 'warning', 
          text: isVfr 
            ? `Kondisi di ${icao} saat ini sangat kondusif untuk operasi penerbangan normal.` 
            : `Haze ringan membatasi jarak pandang di ${icao}. Briefing IFR approach direkomendasikan.`
        },
        { status: 'info', text: 'Periksa NOTAM aktif dan update ATIS reguler sebelum memulai startup mesin.' }
      ],
      sopSteps: [
        { text: 'Verifikasi kondisi runway dan crosswind terkini dari tower.', done: false },
        { text: 'Pastikan flight plan alternatif dan bahan bakar cadangan dikonfirmasi.', done: false },
        { text: 'Set transponder dan lakukan radio check frekuensi ATC setempat.', done: false }
      ],
      emergencyContacts: [
        { label: `VTS/ATC ${airportName}`, number: '021-6541539' },
        { label: 'Basarnas Nasional', number: '115' }
      ]
    }
  ];
};

// ── Helper Function — by city name ───────────────────────────────────────────
export const getAirportsDataForCity = (cityName: string): AirportAdvisor[] => {
  if (!cityName) return defaultAirports;

  const lowerAddress = cityName.toLowerCase();

  // Redirect Yogyakarta dan sekitarnya (Bantul/Sleman) ke Yogyakarta jika input bukan 'Yogyakarta' murni
  if (cityName !== 'Yogyakarta' && (lowerAddress.includes('yogyakarta') || lowerAddress.includes('sleman') || lowerAddress.includes('bantul'))) {
    return cityAirportsMap['Yogyakarta'] || getAirportsDataForCity('Yogyakarta');
  }

  // Bersihkan nama dari sub-distrik / provinsi untuk pencocokan
  let cityClean = cityName.split(',')[0].trim();

  // Jika berupa alamat lengkap Nominatim (memiliki koma), coba ambil Kabupaten/Kota
  const segments = cityName.split(',').map(s => s.trim());
  if (segments.length > 1) {
    const kabupatenSegment = segments.find(s => s.toLowerCase().includes('kab.') || s.toLowerCase().includes('kota'));
    if (kabupatenSegment) {
      cityClean = kabupatenSegment.replace(/^(kab\.|kota)\s+/gi, '').trim();
    }
  }

  const lowerName = cityClean.toLowerCase();

  if (lowerName.includes('jakarta')) return cityAirportsMap['DKI Jakarta'];
  if (lowerName.includes('surabaya')) return cityAirportsMap['Surabaya'];
  if (lowerName.includes('bandung')) return cityAirportsMap['Bandung'];
  if (lowerName.includes('medan')) return cityAirportsMap['Medan'];
  if (lowerName.includes('makassar')) return cityAirportsMap['Makassar'];
  if (lowerName.includes('denpasar') || lowerName.includes('bali')) return cityAirportsMap['Denpasar'];
  if (lowerName.includes('semarang')) return cityAirportsMap['Semarang'];
  if (lowerName.includes('manado')) return cityAirportsMap['Manado'];
  if (lowerName.includes('palembang')) return cityAirportsMap['Palembang'];
  if (lowerName.includes('pekanbaru')) return cityAirportsMap['Pekanbaru'];
  if (lowerName.includes('batam')) return cityAirportsMap['Batam'];

  // Pencocokan fuzzy untuk kota yang tidak terdaftar
  for (const key of Object.keys(cityAirportsMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return cityAirportsMap[key];
    }
  }

  // JIKA TIDAK DITEMUKAN: Generate mock data bandara secara dinamis menggunakan nama kota tersebut!
  // Bersihkan kata-kata administrative
  const rawClean = cityClean
    .replace(/^(kec\.|kab\.|kota|kecamatan|kabupaten)\s+/gi, '')
    .trim();
  
  // Format menjadi Capital Case (misal: kupang -> Kupang)
  const formattedName = rawClean.charAt(0).toUpperCase() + rawClean.slice(1);

  // Kamus Kode ICAO Riil Indonesia untuk pencocokan dinamis yang akurat
  const realIcaoMap: Record<string, { icao: string; name: string }> = {
    'Yogyakarta': { icao: 'WAHI', name: 'Yogyakarta International Airport (YIA)' },
    'Cilacap':    { icao: 'WAHL', name: 'Bandara Tunggul Wulung' },
    'Kupang':     { icao: 'WATT', name: 'Bandara El Tari' },
    'Solo':       { icao: 'WAHQ', name: 'Bandara Adi Sumarmo' },
    'Malang':     { icao: 'WARI', name: 'Bandara Abdul Rachman Saleh' },
    'Lombok':     { icao: 'WADL', name: 'Lombok International Airport' },
    'Balikpapan': { icao: 'WALL', name: 'Bandara Sepinggan' },
    'Banjarmasin':{ icao: 'WAOO', name: 'Bandara Syamsudin Noor' },
    'Jayapura':   { icao: 'WAJJ', name: 'Bandara Sentani' },
  };

  let dynamicAirportName = `Bandara ${formattedName}`;
  let dynamicIcao = '';

  const knownReal = realIcaoMap[formattedName];
  if (knownReal) {
    dynamicIcao = knownReal.icao;
    dynamicAirportName = knownReal.name;
  } else {
    // Buat ICAO Code deterministik buatan (misal: Gorontalo -> WAGO)
    const letters = rawClean.toUpperCase().replace(/[^A-Z]/g, '');
    const prefix = rawClean.toLowerCase().startsWith('m') || rawClean.toLowerCase().startsWith('b') || rawClean.toLowerCase().startsWith('p') ? 'WI' : 'WA';
    const char1 = letters[1] || 'X';
    const char2 = letters[2] || 'Y';
    dynamicIcao = prefix + char1 + char2;
  }

  // Generate dan masukkan ke map
  if (!cityAirportsMap[formattedName]) {
    cityAirportsMap[formattedName] = generateDynamicAirportData(formattedName, dynamicAirportName, dynamicIcao);
  }

  return cityAirportsMap[formattedName];
};

// ── Helper Function — by GPS coordinates (nearest airport) ──────────────────
export const getAirportsDataByCoordinates = (
  lat: number,
  lng: number
): { data: AirportAdvisor[]; nearestName: string; nearestIcao: string; distanceKm: number } => {
  let nearest = airportCoordinates[0];
  let minDist = haversineKm(lat, lng, nearest.lat, nearest.lng);

  for (const airport of airportCoordinates.slice(1)) {
    const dist = haversineKm(lat, lng, airport.lat, airport.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = airport;
    }
  }

  // Jika kota terdekat belum ada di static mock, generate dan simpan secara dinamis!
  if (!cityAirportsMap[nearest.cityKey]) {
    cityAirportsMap[nearest.cityKey] = generateDynamicAirportData(nearest.cityKey, nearest.name, nearest.icao);
  }

  return {
    data: cityAirportsMap[nearest.cityKey],
    nearestName: nearest.name,
    nearestIcao: nearest.icao,
    distanceKm: Math.round(minDist),
  };
};

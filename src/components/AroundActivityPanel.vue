<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Building2, TreePine, Waves, MapPin, CloudRain,
  Sun, ArrowDown, ArrowDownLeft, ArrowDownRight, Moon, Cloud, Flag,
  ChevronLeft, ChevronRight, CornerUpRight
} from 'lucide-vue-next';
import { cityAnalysisMap } from '../data/mockData';

const props = defineProps<{
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'select-course', course: GolfCourse): void;
}>();

// ─── Types ────────────────────────────────────────────────────────────────────
interface HourlyForecast {
  time: string;
  isCurrent?: boolean;
  temp: number;
  windSpeed: number;
  windDirIcon: any;
  rain: number;
  icon: any;
}

interface GolfCourse {
  id: number;
  name: string;
  distance: string;
  location: string;
  lat: number;
  lng: number;
  comfortIndex: 'Nyaman' | 'Cukup';
  comfortEmoji: string;
  rainWarning: string;
  uvWarning: string;
  hourly: HourlyForecast[];
  advisorType: 'land' | 'sea';
  colorKey: string;
  category: 'golf' | 'park' | 'beach' | 'heritage' | 'commercial' | 'nature';
  tags: string[];
}

// ─── Carousel State for Mobile ────────────────────────────────────────────────
const mobileIndex = ref(0);
const slideDir = ref<'left' | 'right'>('left');

const prevSlide = () => {
  if (mobileIndex.value === 0) return;
  slideDir.value = 'right';
  mobileIndex.value--;
};

const nextSlide = () => {
  const total = golfCourses.value.length;
  if (mobileIndex.value >= total - 1) return;
  slideDir.value = 'left';
  mobileIndex.value++;
};



// ── Touchscreen Swipe Handling ──────────────────────────────────────────────
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX;
};
const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX;
  handleSwipe();
};
const handleSwipe = () => {
  const threshold = 40;
  const diff = touchStartX.value - touchEndX.value;
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
};

// Reset index on city change to avoid index out of bounds
import { watch } from 'vue';
watch(() => props.selectedCity, () => {
  mobileIndex.value = 0;
});

// ─── Timezone helper ──────────────────────────────────────────────────────────
const getTimezoneInfoForCity = (cityName: string) => {
  if (!cityName) return { offset: 7, suffix: 'WIB' };
  const name = cityName.toLowerCase();
  if (name.includes('jakarta') || name.includes('gambir') ||
      name.includes('surabaya') || name.includes('gubeng') ||
      name.includes('bandung') || name.includes('braga') ||
      name.includes('medan') || name.includes('sikambing') ||
      name.includes('semarang') || name.includes('pekanbaru') ||
      name.includes('palembang') || name.includes('batam')) {
    return { offset: 7, suffix: 'WIB' };
  }
  if (name.includes('denpasar') || name.includes('dauh puri') || name.includes('bali') || name.includes('kuta') ||
      name.includes('makassar') || name.includes('mariso')) {
    return { offset: 8, suffix: 'WITA' };
  }
  if (name.includes('papua') || name.includes('maluku') || name.includes('jayapura')) {
    return { offset: 9, suffix: 'WIT' };
  }
  return { offset: 7, suffix: 'WIB' };
};

const getCurrentHoursList = () => {
  const now = new Date();
  const targetOffset = props.selectedCity ? getTimezoneInfoForCity(props.selectedCity).offset : 7;
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utcMs + (targetOffset * 3600000));
  const currentHour = targetTime.getHours();
  return [
    { hour: (currentHour - 1 + 24) % 24, isCurrent: false },
    { hour: currentHour, isCurrent: true },
    { hour: (currentHour + 1) % 24, isCurrent: false },
    { hour: (currentHour + 2) % 24, isCurrent: false }
  ].map(({ hour, isCurrent }) => ({
    time: `${String(hour).padStart(2, '0')}:00`,
    isCurrent
  }));
};

const getIconComponent = (weatherIcon: string, timeStr: string) => {
  const hr = parseInt(timeStr.split(':')[0]);
  const isNight = hr >= 18 || hr < 6;
  if (isNight && (weatherIcon === 'Sun' || weatherIcon === 'SunDim')) return Moon;
  return weatherIcon === 'Sun' ? Sun : (weatherIcon === 'SunDim' ? Sun : Cloud);
};

const generateHourlyForGolf = (comfort: string, baseTemp: number, weatherIcon: string): HourlyForecast[] => {
  const hours = getCurrentHoursList();
  return [
    { time: hours[0].time, temp: baseTemp - 1, windSpeed: 9, windDirIcon: ArrowDownLeft, rain: 0.01, icon: getIconComponent(weatherIcon, hours[0].time) },
    { time: hours[1].time, isCurrent: true, temp: baseTemp, windSpeed: 9, windDirIcon: ArrowDown, rain: 0.04, icon: getIconComponent(weatherIcon, hours[1].time) },
    { time: hours[2].time, temp: Math.max(16, baseTemp - 3), windSpeed: 5, windDirIcon: ArrowDown, rain: comfort === 'Nyaman' ? 0.22 : 0.77, icon: comfort === 'Nyaman' ? Cloud : CloudRain },
    { time: hours[3].time, temp: Math.max(15, baseTemp - 5), windSpeed: 6, windDirIcon: ArrowDownRight, rain: comfort === 'Nyaman' ? 0.15 : 0.76, icon: Cloud }
  ];
};

const getDistance = (cityFull: string, baseLocalDistanceStr: string) => {
  if (!cityFull) return baseLocalDistanceStr;
  const city = cityFull.toLowerCase();
  const numericMatch = baseLocalDistanceStr.match(/[\d.]+/);
  const localDist = numericMatch ? parseFloat(numericMatch[0]) : 0;
  let baseDist = 0;
  if (city.includes('jakarta')) baseDist = 440;
  else if (city.includes('surabaya')) baseDist = 265;
  else if (city.includes('bandung')) baseDist = 330;
  else if (city.includes('medan')) baseDist = 1850;
  else if (city.includes('semarang')) baseDist = 90;
  else if (city.includes('makassar')) baseDist = 1050;
  else if (city.includes('palembang')) baseDist = 870;
  else if (city.includes('batam')) baseDist = 1380;
  else if (city.includes('pekanbaru')) baseDist = 1340;
  else if (city.includes('denpasar') || city.includes('bali') || city.includes('kuta')) baseDist = 550;
  if (baseDist === 0) return `Radius • ${localDist} km`;
  return `Radius • ${(baseDist + localDist).toFixed(0)} km dari lokasi Anda`;
};

// ─── City advisor from cityAnalysisMap ────────────────────────────────────────
const cityAdvisor = computed(() => {
  if (!props.selectedCity) return null;
  const lc = props.selectedCity.toLowerCase();
  if (cityAnalysisMap[props.selectedCity]) return cityAnalysisMap[props.selectedCity];
  if (lc.includes('jakarta') || lc.includes('gambir')) return cityAnalysisMap['DKI Jakarta'];
  if (lc.includes('surabaya') || lc.includes('gubeng')) return cityAnalysisMap['Surabaya'];
  if (lc.includes('bandung') || lc.includes('braga')) return cityAnalysisMap['Bandung'];
  if (lc.includes('medan') || lc.includes('sikambing')) return cityAnalysisMap['Medan'];
  if (lc.includes('semarang') || lc.includes('pandanaran')) return cityAnalysisMap['Semarang'];
  if (lc.includes('makassar') || lc.includes('mariso')) return cityAnalysisMap['Makassar'];
  if (lc.includes('palembang') || lc.includes('ilir barat')) return cityAnalysisMap['Palembang'];
  if (lc.includes('batam') || lc.includes('belian')) return cityAnalysisMap['Batam'];
  if (lc.includes('pekanbaru') || lc.includes('tampan')) return cityAnalysisMap['Pekanbaru'];
  if (lc.includes('denpasar') || lc.includes('bali') || lc.includes('kuta') || lc.includes('dauh puri')) return cityAnalysisMap['Denpasar'];
  return null;
});

const getAdvisorForCourse = (course: GolfCourse) => {
  const advisor = cityAdvisor.value;
  if (!advisor) return { label: 'Info Cuaca', text: `${course.rainWarning} ${course.uvWarning}` };
  if (course.advisorType === 'sea') return { label: advisor.sea.title, text: advisor.sea.desc };
  return { label: advisor.land.title, text: advisor.land.desc };
};

// ─── Color palette per card ───────────────────────────────────────────────────
const COLOR_MAP: Record<string, { topBar: string; icon: string; advisorBg: string; border: string }> = {
  blue:    { topBar: 'from-blue-500 via-blue-400 to-indigo-500',    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',       advisorBg: 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/10',       border: 'border-blue-200/60 dark:border-blue-500/10' },
  emerald: { topBar: 'from-emerald-500 via-green-400 to-teal-500',  icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', advisorBg: 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/10', border: 'border-emerald-200/60 dark:border-emerald-500/10' },
  cyan:    { topBar: 'from-cyan-500 via-sky-400 to-blue-400',       icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',         advisorBg: 'bg-cyan-50/80 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-500/10',         border: 'border-cyan-200/60 dark:border-cyan-500/10' },
  amber:   { topBar: 'from-amber-500 via-yellow-400 to-orange-400', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',     advisorBg: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-500/10',     border: 'border-amber-200/60 dark:border-amber-500/10' },
  purple:  { topBar: 'from-purple-500 via-violet-400 to-fuchsia-400', icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400', advisorBg: 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-100 dark:border-purple-500/10', border: 'border-purple-200/60 dark:border-purple-500/10' },
  rose:    { topBar: 'from-rose-500 via-pink-400 to-fuchsia-500',   icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',         advisorBg: 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-100 dark:border-rose-500/10',         border: 'border-rose-200/60 dark:border-rose-500/10' },
  teal:    { topBar: 'from-teal-500 via-cyan-400 to-emerald-400',   icon: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',         advisorBg: 'bg-teal-50/80 dark:bg-teal-900/20 border-teal-100 dark:border-teal-500/10',         border: 'border-teal-200/60 dark:border-teal-500/10' },
  orange:  { topBar: 'from-orange-500 via-amber-400 to-yellow-400', icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', advisorBg: 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-100 dark:border-orange-500/10', border: 'border-orange-200/60 dark:border-orange-500/10' },
  indigo:  { topBar: 'from-indigo-500 via-blue-400 to-violet-500',  icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', advisorBg: 'bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/10', border: 'border-indigo-200/60 dark:border-indigo-500/10' },
};
const getColor = (key: string) => COLOR_MAP[key] ?? COLOR_MAP.blue;

const getCategoryIcon = (category: GolfCourse['category']) => {
  if (category === 'beach') return Waves;
  if (category === 'park' || category === 'nature') return TreePine;
  if (category === 'heritage') return Flag;
  return Building2;
};

// ─── Golf courses computed ────────────────────────────────────────────────────
const golfCourses = computed<GolfCourse[]>(() => {
  if (!props.selectedCity) return [];
  const cityLower = props.selectedCity.toLowerCase();
  let raw: GolfCourse[] = [];

  if (cityLower.includes('jakarta') || cityLower.includes('gambir')) {
    raw = [
      { id: 101, name: 'Monumen Nasional (Monas)', distance: 'Radius • 1.2 km', location: 'Jakarta Pusat, DKI Jakarta', lat: -6.1754, lng: 106.8272, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Tidak ada potensi curah hujan siang ini.', uvWarning: 'Indeks UV ekstrem. Disarankan memakai kacamata hitam dan tabir surya.', hourly: generateHourlyForGolf('Cukup', 33, 'Sun'), advisorType: 'land', colorKey: 'amber', category: 'heritage', tags: ['Wisata Sejarah', 'Edukasi', 'Fotografi'] },
      { id: 102, name: 'Royale Jakarta Golf Club', distance: 'Radius • 16 km', location: 'Jakarta Timur, DKI Jakarta', lat: -6.2804, lng: 106.9507, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Tidak ada curah hujan setidaknya selama 2 jam.', uvWarning: 'Kondisi angin sepoi-sepoi, nyaman untuk berolahraga outdoor.', hourly: generateHourlyForGolf('Nyaman', 32, 'SunDim'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Olahraga', 'Golf', 'Premium'] },
      { id: 103, name: 'Senayan Park (SPARK)', distance: 'Radius • 4.5 km', location: 'Jakarta Pusat, DKI Jakarta', lat: -6.2271, lng: 106.7994, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Cuaca cerah berawan, tidak ada potensi hujan.', uvWarning: 'Suhu cukup gerah di area terbuka. Sangat cocok dikunjungi sore hari.', hourly: generateHourlyForGolf('Cukup', 32, 'SunDim'), advisorType: 'land', colorKey: 'purple', category: 'commercial', tags: ['Gaya Hidup', 'Kuliner', 'Belanja'] },
    ];
  } else if (cityLower.includes('surabaya') || cityLower.includes('gubeng')) {
    raw = [
      { id: 201, name: 'Taman Bungkul', distance: 'Radius • 3.2 km', location: 'Wonokromo, Kota Surabaya, Jawa Timur', lat: -7.2939, lng: 112.7371, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca cerah berawan sepanjang hari.', uvWarning: 'Aman untuk aktivitas santai sore dan olahraga ringan.', hourly: generateHourlyForGolf('Nyaman', 31, 'SunDim'), advisorType: 'land', colorKey: 'emerald', category: 'park', tags: ['Taman Kota', 'Olahraga', 'Keluarga'] },
      { id: 202, name: 'Ciputra Golf Club Surabaya', distance: 'Radius • 14 km', location: 'Lakarsantri, Kota Surabaya, Jawa Timur', lat: -7.3153, lng: 112.6431, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Tidak ada curah hujan setidaknya selama 1 jam.', uvWarning: 'Suhu cukup terik di siang hari, siapkan air minum ekstra.', hourly: generateHourlyForGolf('Cukup', 34, 'Sun'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Premium'] },
      { id: 203, name: 'Jalan Tunjungan (Tunjungan Street)', distance: 'Radius • 1.8 km', location: 'Genteng, Kota Surabaya, Jawa Timur', lat: -7.2617, lng: 112.7414, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cerah sepanjang malam, sangat cocok untuk kulineran malam.', uvWarning: 'Aman untuk nongkrong outdoor setelah pukul 16:00 WIB.', hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim'), advisorType: 'land', colorKey: 'orange', category: 'heritage', tags: ['Gaya Hidup', 'Kuliner', 'Wisata Sejarah'] },
    ];
  } else if (cityLower.includes('bandung') || cityLower.includes('braga')) {
    raw = [
      { id: 301, name: 'Dago Heritage 1917 Golf', distance: 'Radius • 6.8 km', location: 'Bandung Utara, Jawa Barat', lat: -6.8679, lng: 107.6217, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Tidak ada curah hujan setidaknya selama 3 jam.', uvWarning: 'Suhu sejuk (24°C). Sangat direkomendasikan untuk aktivitas luar ruangan.', hourly: generateHourlyForGolf('Nyaman', 24, 'SunDim'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Sejuk'] },
      { id: 302, name: 'Kawah Putih Ciwidey', distance: 'Radius • 42 km', location: 'Kabupaten Bandung, Jawa Barat', lat: -7.1662, lng: 107.4021, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Potensi kabut tebal dan gerimis ringan sore hari.', uvWarning: 'Suhu dingin (18°C). Disarankan membawa jaket tebal.', hourly: generateHourlyForGolf('Cukup', 18, 'Cloud'), advisorType: 'land', colorKey: 'teal', category: 'nature', tags: ['Wisata Alam', 'Petualangan', 'Fotografi'] },
      { id: 303, name: 'Jalan Braga (Braga Street)', distance: 'Radius • 0.5 km', location: 'Sumur Bandung, Kota Bandung, Jawa Barat', lat: -6.9131, lng: 107.6066, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Udara sejuk dengan potensi gerimis tipis sore hari.', uvWarning: 'Suhu nyaman (22°C). Sangat asyik untuk jalan kaki santai.', hourly: generateHourlyForGolf('Nyaman', 23, 'Cloud'), advisorType: 'land', colorKey: 'orange', category: 'heritage', tags: ['Gaya Hidup', 'Kuliner', 'Belanja'] },
    ];
  } else if (cityLower.includes('medan') || cityLower.includes('sikambing')) {
    raw = [
      { id: 401, name: 'Taman Cadika Pramuka', distance: 'Radius • 8.2 km', location: 'Medan Johor, Kota Medan, Sumatera Utara', lat: 3.5430, lng: 98.6851, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca berawan tipis. Tidak ada potensi hujan.', uvWarning: 'Aman untuk aktivitas piknik keluarga luar ruangan.', hourly: generateHourlyForGolf('Nyaman', 29, 'Cloud'), advisorType: 'land', colorKey: 'emerald', category: 'park', tags: ['Taman Kota', 'Keluarga', 'Olahraga'] },
      { id: 402, name: 'Royal Sumatra Golf Course', distance: 'Radius • 12 km', location: 'Medan Tuntungan, Sumatera Utara', lat: 3.5018, lng: 98.6060, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Potensi mendung tebal mulai pukul 15:00 WIB.', uvWarning: 'Kelembapan tinggi, udara terasa sedikit gerah.', hourly: generateHourlyForGolf('Cukup', 30, 'Cloud'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Premium'] },
      { id: 403, name: 'Pos Bloc Medan', distance: 'Radius • 2.0 km', location: 'Medan Barat, Kota Medan, Sumatera Utara', lat: 3.5952, lng: 98.6722, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Mendung tebal berawan, tidak ada potensi hujan lebat.', uvWarning: 'Kelembapan tinggi, udara terasa hangat namun teduh.', hourly: generateHourlyForGolf('Cukup', 29, 'Cloud'), advisorType: 'land', colorKey: 'purple', category: 'commercial', tags: ['Gaya Hidup', 'Seni & Budaya', 'Kuliner'] },
    ];
  } else if (cityLower.includes('semarang') || cityLower.includes('pandanaran')) {
    raw = [
      { id: 411, name: 'Lawang Sewu', distance: 'Radius • 1.5 km', location: 'Semarang Tengah, Kota Semarang, Jawa Tengah', lat: -6.9836, lng: 110.4107, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca berawan sejuk sore hari.', uvWarning: 'Sangat cocok untuk wisata sejarah outdoor.', hourly: generateHourlyForGolf('Nyaman', 28, 'Cloud'), advisorType: 'land', colorKey: 'amber', category: 'heritage', tags: ['Wisata Sejarah', 'Edukasi', 'Fotografi'] },
      { id: 412, name: 'Gombel Golf Semarang', distance: 'Radius • 8.0 km', location: 'Banyumanik, Kota Semarang, Jawa Tengah', lat: -7.0393, lng: 110.4248, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Kondisi berawan sejuk tanpa curah hujan.', uvWarning: 'Permainan golf sangat ideal dengan angin bukit yang menyegarkan.', hourly: generateHourlyForGolf('Nyaman', 27, 'Cloud'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Pemandangan'] },
      { id: 413, name: 'Kota Lama Semarang', distance: 'Radius • 0.8 km', location: 'Semarang Utara, Kota Semarang, Jawa Tengah', lat: -6.9666, lng: 110.4263, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca sangat bersahabat, cerah berawan semilir.', uvWarning: 'Sangat direkomendasikan untuk hunting foto and jalan sore.', hourly: generateHourlyForGolf('Nyaman', 28, 'SunDim'), advisorType: 'land', colorKey: 'orange', category: 'heritage', tags: ['Gaya Hidup', 'Wisata Sejarah', 'Kuliner'] },
    ];
  } else if (cityLower.includes('makassar') || cityLower.includes('mariso')) {
    raw = [
      { id: 501, name: 'Pantai Losari Makassar', distance: 'Radius • 2.5 km', location: 'Ujung Pandang, Kota Makassar, Sulawesi Selatan', lat: -5.1481, lng: 119.4048, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Tidak ada curah hujan setidaknya selama 2 jam.', uvWarning: 'Angin laut kencang sepoi-sepoi, nyaman untuk jogging sore.', hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim'), advisorType: 'sea', colorKey: 'cyan', category: 'beach', tags: ['Wisata Bahari', 'Olahraga', 'Sunset'] },
      { id: 502, name: 'Padi Valley Golf Club', distance: 'Radius • 24 km', location: 'Gowa, Sulawesi Selatan', lat: -5.2850, lng: 119.4811, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Potensi hujan ringan singkat lewat sore hari.', uvWarning: 'Suhu siang hari terik, disarankan memakai topi.', hourly: generateHourlyForGolf('Cukup', 32, 'Sun'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Alam Terbuka'] },
      { id: 503, name: 'Center Point of Indonesia (CPI)', distance: 'Radius • 3.0 km', location: 'Mamajang, Kota Makassar, Sulawesi Selatan', lat: -5.1558, lng: 119.4120, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cerah berawan dengan hembusan angin laut sedang.', uvWarning: 'Indikasi UV sedang, nyaman untuk berfoto di sunset quay.', hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim'), advisorType: 'sea', colorKey: 'rose', category: 'commercial', tags: ['Gaya Hidup', 'Wisata Bahari', 'Belanja'] },
    ];
  } else if (cityLower.includes('palembang') || cityLower.includes('ilir barat')) {
    raw = [
      { id: 511, name: 'Jembatan Ampera & BKB', distance: 'Radius • 0.5 km', location: 'Ilir Barat I, Kota Palembang, Sumatera Selatan', lat: -2.9938, lng: 104.7626, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cerah berawan tanpa potensi hujan.', uvWarning: 'Angin sungai Musi sepoi-sepoi mendukung jalan santai sore.', hourly: generateHourlyForGolf('Nyaman', 31, 'SunDim'), advisorType: 'sea', colorKey: 'orange', category: 'heritage', tags: ['Wisata Sejarah', 'Wisata Sungai', 'Fotografi'] },
      { id: 512, name: 'Palembang Golf Club', distance: 'Radius • 5.0 km', location: 'Kota Palembang, Sumatera Selatan', lat: -3.0123, lng: 104.8091, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Mendung tipis berawan.', uvWarning: 'Suhu siang terik basah, terapkan tabir surya.', hourly: generateHourlyForGolf('Cukup', 33, 'Cloud'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Premium'] },
      { id: 513, name: 'Jakabaring Lake Side', distance: 'Radius • 6.5 km', location: 'Seberang Ulu I, Kota Palembang, Sumatera Selatan', lat: -3.0182, lng: 104.7801, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca teduh berawan tanpa potensi hujan.', uvWarning: 'Angin sepoi-sepoi, cocok untuk olahraga sore atau piknik.', hourly: generateHourlyForGolf('Nyaman', 30, 'Cloud'), advisorType: 'sea', colorKey: 'teal', category: 'nature', tags: ['Olahraga', 'Wisata Danau', 'Keluarga'] },
    ];
  } else if (cityLower.includes('batam') || cityLower.includes('belian')) {
    raw = [
      { id: 521, name: 'Jembatan Barelang Batam', distance: 'Radius • 20 km', location: 'Batam Kota, Kota Batam, Kepulauan Riau', lat: 0.9244, lng: 103.9854, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Angin kencang mendukung wisata pemandangan.', uvWarning: 'Suhu laut bersahabat, siapkan kacamata hitam.', hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim'), advisorType: 'sea', colorKey: 'cyan', category: 'heritage', tags: ['Wisata Bahari', 'Fotografi', 'Road Trip'] },
      { id: 522, name: 'SouthLinks Country Club Batam', distance: 'Radius • 6.0 km', location: 'Sekupang, Kota Batam, Kepulauan Riau', lat: 1.1120, lng: 103.9534, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Potensi gerimis ringan di sore hari.', uvWarning: 'Kelembapan tinggi, disarankan hidrasi berkala.', hourly: generateHourlyForGolf('Cukup', 31, 'Cloud'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Premium'] },
      { id: 523, name: 'Mega Wisata Ocarina Batam', distance: 'Radius • 4.5 km', location: 'Batam Kota, Kota Batam, Kepulauan Riau', lat: 1.1512, lng: 104.0268, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Hembusan angin laut kencang disertai awan mendung tipis.', uvWarning: 'Paparan UV rendah, cocok untuk rekreasi pantai berbayang.', hourly: generateHourlyForGolf('Cukup', 29, 'Cloud'), advisorType: 'sea', colorKey: 'indigo', category: 'beach', tags: ['Wisata Bahari', 'Gaya Hidup', 'Keluarga'] },
    ];
  } else if (cityLower.includes('pekanbaru') || cityLower.includes('tampan')) {
    raw = [
      { id: 531, name: 'Labersa Golf & Country Club', distance: 'Radius • 8.0 km', location: 'Siak Hulu, Dekat Pekanbaru, Riau', lat: 0.4546, lng: 101.3441, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca cerah berawan sangat bersahabat.', uvWarning: 'Aman beraktivitas golf dengan tingkat paparan UV sedang.', hourly: generateHourlyForGolf('Nyaman', 32, 'SunDim'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Premium'] },
      { id: 532, name: 'Taman Wisata Alam Mayang', distance: 'Radius • 6.0 km', location: 'Tenayan Raya, Kota Pekanbaru, Riau', lat: 0.5071, lng: 101.4559, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Udara bersih teduh berawan.', uvWarning: 'Ideal untuk rekreasi keluarga di bawah pepohonan hijau rindang.', hourly: generateHourlyForGolf('Nyaman', 30, 'Cloud'), advisorType: 'land', colorKey: 'emerald', category: 'nature', tags: ['Wisata Alam', 'Keluarga', 'Petualangan'] },
      { id: 533, name: 'Riau Creative Hub', distance: 'Radius • 2.2 km', location: 'Sail, Kota Pekanbaru, Riau', lat: 0.5102, lng: 101.4381, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca cerah berawan sangat bersahabat sore ini.', uvWarning: 'Tingkat UV aman, ideal untuk nongkrong outdoor komunitas.', hourly: generateHourlyForGolf('Nyaman', 31, 'SunDim'), advisorType: 'land', colorKey: 'purple', category: 'commercial', tags: ['Gaya Hidup', 'Seni & Budaya', 'Komunitas'] },
    ];
  } else if (cityLower.includes('denpasar') || cityLower.includes('dauh puri') || cityLower.includes('bali') || cityLower.includes('kuta')) {
    raw = [
      { id: 601, name: 'Bali National Golf Club', distance: 'Radius • 18 km', location: 'Nusa Dua, Kabupaten Badung, Bali', lat: -8.7951, lng: 115.2283, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca pantai cerah mendukung penuh permainan golf.', uvWarning: 'Aman beraktivitas luar ruangan. Tetap terapkan sunscreen.', hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim'), advisorType: 'land', colorKey: 'blue', category: 'golf', tags: ['Golf', 'Olahraga', 'Resor'] },
      { id: 602, name: 'Pantai Kuta Bali', distance: 'Radius • 9.5 km', location: 'Kuta, Kabupaten Badung, Bali', lat: -8.7195, lng: 115.1686, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cerah berawan. Gelombang laut terpantau sedang.', uvWarning: 'Sangat baik untuk selancar, berjemur, atau jalan santai pesisir.', hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim'), advisorType: 'sea', colorKey: 'cyan', category: 'beach', tags: ['Wisata Bahari', 'Surfing', 'Sunset'] },
      { id: 603, name: 'Beachwalk Shopping Center', distance: 'Radius • 0.2 km', location: 'Kuta, Kabupaten Badung, Bali', lat: -8.7188, lng: 115.1686, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca cerah berawan pantai mendukung aktivitas belanja.', uvWarning: 'Aman dan teduh berkat arsitektur semi-outdoor yang asri.', hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim'), advisorType: 'sea', colorKey: 'rose', category: 'commercial', tags: ['Gaya Hidup', 'Belanja', 'Kuliner'] },
    ];
  } else {
    const mainName = props.selectedCity.split(',')[0].trim();
    const subName = props.selectedCity.split(',').slice(1).join(', ').trim() || props.selectedCity;
    raw = [
      { id: 901, name: `${mainName} Central Park`, distance: 'Radius • 1.5 km', location: subName, lat: 0, lng: 0, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Kondisi udara sejuk dan tidak ada potensi hujan.', uvWarning: 'Sangat baik untuk jalan santai dan rekreasi keluarga.', hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim'), advisorType: 'land', colorKey: 'emerald', category: 'park', tags: ['Taman Kota', 'Keluarga', 'Olahraga'] },
      { id: 902, name: `${mainName} Sports Complex`, distance: 'Radius • 4.2 km', location: subName, lat: 0, lng: 0, comfortIndex: 'Cukup', comfortEmoji: '😐', rainWarning: 'Mendung tipis, angin bertiup sedang.', uvWarning: 'Cocok untuk olahraga sore luar ruangan.', hourly: generateHourlyForGolf('Cukup', 30, 'Cloud'), advisorType: 'land', colorKey: 'blue', category: 'park', tags: ['Olahraga', 'Fasilitas Publik'] },
      { id: 903, name: `${mainName} Culinary District`, distance: 'Radius • 2.0 km', location: subName, lat: 0, lng: 0, comfortIndex: 'Nyaman', comfortEmoji: '😊', rainWarning: 'Cuaca bersahabat untuk aktivitas kuliner luar ruangan.', uvWarning: 'Aman dinikmati bersama teman atau keluarga.', hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim'), advisorType: 'land', colorKey: 'purple', category: 'commercial', tags: ['Gaya Hidup', 'Kuliner', 'Komunitas'] },
    ];
  }

  return raw.map(course => ({
    ...course,
    distance: getDistance(props.selectedCity, course.distance)
  }));
});

// Computed active course for mobile carousel view
const activeMobileCourse = computed(() => {
  const courses = golfCourses.value;
  if (!courses || courses.length === 0) return null;
  return courses[mobileIndex.value] || courses[0];
});

const transitionName = computed(() =>
  slideDir.value === 'left' ? 'slide-left' : 'slide-right'
);

const getCourseImage = (course: GolfCourse) => {
  const images: Record<number, string> = {
    // Jakarta
    101: '/monas.png', // Monas
    102: '/royale_golf.png', // Royale Golf
    103: '/senayan_park.png', // SPARK
    // Surabaya
    201: '/taman_bungkul.png', // Taman Bungkul
    202: '/ciputra_golf.png', // Ciputra Golf
    203: '/tunjungan.png', // Tunjungan
    // Bandung
    301: '/dago_golf.png', // Dago Golf
    302: '/kawah_putih.png', // Kawah Putih
    303: '/braga.png', // Braga
    // Medan
    401: '/taman_cadika.jpg', // Cadika
    402: '/royal_sumatra.png', // Royal Sumatra
    403: '/pos_bloc.jpg', // Pos Bloc
    // Semarang
    411: '/lawang_sewu.png', // Lawang Sewu
    412: '/gombel_golf.png', // Gombel
    413: '/kota_lama.png', // Kota Lama
    // Makassar
    501: '/losari.jpg', // Pantai Losari
    502: '/padi_valley.png', // Padi Valley
    503: '/cpi.png', // CPI
    // Palembang
    511: '/ampera.png', // Ampera
    512: '/palembang_golf.png', // Palembang Golf
    513: '/jakabaring.png', // Jakabaring
    // Batam
    521: '/barelang.png', // Barelang
    522: '/south_links.png', // SouthLinks
    523: '/ocarina.jpg', // Ocarina
    // Pekanbaru
    531: '/labersa.png', // Labersa
    532: '/alam_mayang.jpg', // Alam Mayang
    533: '/riau_creative.jpg', // Creative Hub
    // Denpasar/Bali
    601: '/bali_golf.jpg', // Bali Golf
    602: '/kuta_beach.jpg', // Kuta
    603: '/beachwalk.png', // Beachwalk
  };
  return images[course.id] || 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=300&q=80';
};

// Map specific tag categories to distinct, vibrant styling
const getTagClass = (tag: string) => {
  const t = tag.toLowerCase();
  
  // History & Education: Warm Amber
  if (t.includes('sejarah') || t.includes('edukasi') || t.includes('budaya') || t.includes('seni')) {
    return 'bg-amber-50/90 text-amber-600 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
  
  // Sports & Facilities: Cool Blue
  if (t.includes('olahraga') || t.includes('golf') || t.includes('fasilitas') || t.includes('publik')) {
    return 'bg-blue-50/90 text-blue-600 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  }
  
  // Premium & Lifestyle: Royal Purple
  if (t.includes('premium') || t.includes('resor') || t.includes('gaya hidup') || t.includes('belanja')) {
    return 'bg-purple-50/90 text-purple-600 border-purple-200/50 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
  }
  
  // Culinary: Sunset Rose
  if (t.includes('kuliner') || t.includes('makanan') || t.includes('restoran')) {
    return 'bg-rose-50/90 text-rose-600 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
  }
  
  // Nature & Parks: Fresh Emerald/Green
  if (t.includes('taman') || t.includes('keluarga') || t.includes('alam') || t.includes('petualangan') || t.includes('sejuk')) {
    return 'bg-emerald-50/90 text-emerald-600 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  }
  
  // Maritime & Water: Sky Cyan
  if (t.includes('bahari') || t.includes('surfing') || t.includes('sungai') || t.includes('sunset') || t.includes('danau') || t.includes('pantai')) {
    return 'bg-cyan-50/90 text-cyan-600 border-cyan-200/50 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
  }
  
  // Photography & Communities: Creative Indigo
  if (t.includes('fotografi') || t.includes('pemandangan') || t.includes('road trip') || t.includes('komunitas')) {
    return 'bg-indigo-50/90 text-indigo-600 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
  }
  
  // Fallback styling
  return 'bg-slate-50/90 text-slate-550 border-slate-200/40 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/30';
};

// Open route on Google Maps
const openRoute = (course: GolfCourse) => {
  const query = `${course.name}, ${course.location}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};
</script>

<template>
  <div class="space-y-2.5">
    <!-- ── Header ───────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Aktivitas Sekitar
      </h3>
      <button
        type="button"
        class="group flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 dark:text-brand-cyan dark:hover:text-brand-cyan/80 transition-colors duration-300 cursor-pointer"
      >
        <span>Selengkapnya</span>
        <svg class="w-3 h-3 transform transition-transform group-hover:translate-x-0.5 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- ─── MOBILE VIEW: 1 Card Carousel ──────────────────────────────────── -->
    <div class="block md:hidden space-y-2">
      <div 
        class="relative w-full"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Prev button -->
        <button
          type="button"
          @click="prevSlide"
          :disabled="mobileIndex === 0"
          class="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-brand-navy-800/90 border border-slate-200/60 dark:border-brand-navy-600/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 shadow-md opacity-60 hover:opacity-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Viewport -->
        <div class="w-full overflow-hidden relative" style="min-height: 180px;">
          <Transition :name="transitionName" mode="out-in">
            <div
              v-if="activeMobileCourse"
              :key="activeMobileCourse.id"
              @click="emit('select-course', activeMobileCourse)"
              class="rounded-2xl overflow-hidden shadow-sm bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border w-full cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-[transform,box-shadow,border-color] duration-300 ease-out transform-gpu"
              :class="getColor(activeMobileCourse.colorKey).border"
            >
              <!-- Gradient top strip -->
              <div class="h-[3px] w-full bg-gradient-to-r" :class="getColor(activeMobileCourse.colorKey).topBar"></div>
 
              <div class="p-3.5 px-4">
                <!-- Name + Location & Route Button Row -->
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="getColor(activeMobileCourse.colorKey).icon">
                      <component :is="getCategoryIcon(activeMobileCourse.category)" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">
                        {{ activeMobileCourse.name }}
                      </h4>
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-0.5 min-w-0">
                        <MapPin class="w-2.5 h-2.5 shrink-0" />
                        <span class="truncate">{{ activeMobileCourse.distance }}</span>
                      </p>
                    </div>
                  </div>
                  
                  <!-- Route Button (Circular wrapper + Blue diamond + White CornerUpRight arrow) -->
                  <button 
                    type="button" 
                    @click.stop="openRoute(activeMobileCourse)"
                    class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50/80 dark:bg-brand-navy-950/40 hover:bg-blue-50 dark:hover:bg-brand-cyan/10 border border-slate-200/40 dark:border-brand-navy-800/40 shadow-sm transition-all duration-300 shrink-0 cursor-pointer active:scale-95 group/route"
                    title="Buka Rute di Google Maps"
                  >
                    <div class="w-4.5 h-4.5 rounded-[3px] bg-blue-600 dark:bg-brand-cyan rotate-45 flex items-center justify-center shadow-sm group-hover/route:bg-blue-700 dark:group-hover/route:bg-brand-cyan/85 transition-colors">
                      <CornerUpRight class="w-2.5 h-2.5 text-white dark:text-brand-navy-950 -rotate-45" />
                    </div>
                  </button>
                </div>
 
                <!-- Two Column Content Layout (Left: Premium Image, Right: Specs & Advisor) -->
                <div class="flex gap-3.5 items-start">
                  <!-- Left column: Premium Image (1x1 square) -->
                  <div class="w-[90px] h-[90px] shrink-0 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40 relative aspect-square">
                    <img 
                      :src="getCourseImage(activeMobileCourse)" 
                      :alt="activeMobileCourse.name" 
                      class="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  </div>

                  <!-- Right column: Details -->
                  <div class="flex-1 min-w-0 space-y-1.5">
                    <!-- Comfort + Chips row -->
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0"
                        :class="activeMobileCourse.comfortIndex === 'Nyaman'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'"
                      >
                        {{ activeMobileCourse.comfortIndex }} {{ activeMobileCourse.comfortEmoji }}
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 shrink-0"
                        :class="activeMobileCourse.advisorType === 'sea'
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400'"
                      >
                        <component :is="activeMobileCourse.advisorType === 'sea' ? Waves : TreePine" class="w-2.5 h-2.5" />
                        {{ activeMobileCourse.advisorType === 'sea' ? 'Pesisir' : 'Darat' }}
                      </span>
                    </div>

                    <!-- Advisor box from cityAnalysisMap (clamped to 2 lines for perfect mobile display) -->
                    <div class="rounded-xl p-2 border space-y-0.5" :class="getColor(activeMobileCourse.colorKey).advisorBg">
                      <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                        {{ getAdvisorForCourse(activeMobileCourse).label }}
                      </p>
                      <p class="text-[10px] text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
                        {{ getAdvisorForCourse(activeMobileCourse).text }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Tags & Real-time Weather Info Row -->
                <div class="flex items-center justify-between gap-2 mt-2.5">
                  <!-- Category Tags (Positioned below image block, memanjang ke kanan) -->
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in activeMobileCourse.tags"
                      :key="tag"
                      class="px-1.5 py-0.5 rounded text-[9px] font-semibold border tracking-wide transition-colors"
                      :class="getTagClass(tag)"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <!-- Weather Info (Temp + Icon) -->
                  <div 
                    v-if="activeMobileCourse.hourly && activeMobileCourse.hourly.length"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50/80 dark:bg-brand-navy-950/40 border border-slate-200/50 dark:border-brand-navy-800/40 text-slate-600 dark:text-slate-350 text-[10px] font-extrabold shrink-0 shadow-inner"
                  >
                    <component 
                      :is="activeMobileCourse.hourly.find(h => h.isCurrent)?.icon || activeMobileCourse.hourly[1]?.icon || activeMobileCourse.hourly[0]?.icon" 
                      class="w-3.5 h-3.5 text-amber-500 dark:text-brand-cyan" 
                    />
                    <span>{{ activeMobileCourse.hourly.find(h => h.isCurrent)?.temp ?? activeMobileCourse.hourly[1]?.temp ?? activeMobileCourse.hourly[0]?.temp }}°C</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
 
        <!-- Next button -->
        <button
          type="button"
          @click="nextSlide"
          :disabled="mobileIndex >= golfCourses.length - 1"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-brand-navy-800/90 border border-slate-200/60 dark:border-brand-navy-600/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 shadow-md opacity-60 hover:opacity-100 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
 
    </div>
 
    <!-- ─── DESKTOP VIEW: Multi-Card Flex Row (MD and up) ──────────────────── -->
    <div class="hidden md:block relative w-full">
      <!-- Scrollable row -->
      <div
        ref="desktopScroll"
        class="flex flex-row gap-3.5 w-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1.5 px-0"
      >
        <div
          v-for="course in golfCourses"
          :key="course.id"
          @click="emit('select-course', course)"
          class="snap-start shrink-0 w-[425px] rounded-2xl overflow-hidden shadow-sm bg-white/75 dark:bg-brand-navy-900/65 backdrop-blur-md border cursor-pointer group"
          :class="getColor(course.colorKey).border"
        >
          <!-- Gradient top strip -->
          <div class="h-[3px] w-full bg-gradient-to-r" :class="getColor(course.colorKey).topBar"></div>
   
          <div class="p-3.5">
            <!-- Name + Location & Route Button Row -->
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  :class="getColor(course.colorKey).icon"
                >
                  <component :is="getCategoryIcon(course.category)" class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">
                    {{ course.name }}
                  </h4>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-0.5 min-w-0">
                    <MapPin class="w-2.5 h-2.5 shrink-0" />
                    <span class="truncate">{{ course.distance }}</span>
                  </p>
                </div>
              </div>
              
              <!-- Route Button (Circular wrapper + Blue diamond + White CornerUpRight arrow) -->
              <button 
                type="button" 
                @click.stop="openRoute(course)"
                class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50/80 dark:bg-brand-navy-950/40 hover:bg-blue-50 dark:hover:bg-brand-cyan/10 border border-slate-200/40 dark:border-brand-navy-800/40 shadow-sm transition-all duration-300 shrink-0 cursor-pointer active:scale-95 group/route"
                title="Buka Rute di Google Maps"
              >
                <div class="w-4.5 h-4.5 rounded-[3px] bg-blue-600 dark:bg-brand-cyan rotate-45 flex items-center justify-center shadow-sm group-hover/route:bg-blue-700 dark:group-hover/route:bg-brand-cyan/85 transition-colors">
                  <CornerUpRight class="w-2.5 h-2.5 text-white dark:text-brand-navy-950 -rotate-45" />
                </div>
              </button>
            </div>
  
            <!-- Two Column Content Layout (Left: Premium Image, Right: Specs & Advisor) -->
            <div class="flex gap-3.5 items-start">
              <!-- Left column: Premium Image (1x1 square) -->
              <div class="w-[95px] h-[95px] shrink-0 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40 relative aspect-square">
                <img 
                  :src="getCourseImage(course)" 
                  :alt="course.name" 
                  class="w-full h-full object-cover" 
                  loading="lazy"
                />
              </div>
  
              <!-- Right column: Details -->
              <div class="flex-1 min-w-0 space-y-2">
                <!-- Comfort + Chips row -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0"
                    :class="course.comfortIndex === 'Nyaman'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'"
                  >
                    {{ course.comfortIndex }} {{ course.comfortEmoji }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 shrink-0"
                    :class="course.advisorType === 'sea'
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400'"
                  >
                    <component :is="course.advisorType === 'sea' ? Waves : TreePine" class="w-2.5 h-2.5" />
                    {{ course.advisorType === 'sea' ? 'Pesisir' : 'Darat' }}
                  </span>
                </div>
  
                <!-- Advisor box from cityAnalysisMap -->
                <div
                  class="rounded-xl p-2.5 border space-y-0.5"
                  :class="getColor(course.colorKey).advisorBg"
                >
                  <p class="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                    {{ getAdvisorForCourse(course).label }}
                  </p>
                  <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {{ getAdvisorForCourse(course).text }}
                  </p>
                </div>
              </div>
            </div>
  
            <!-- Tags & Real-time Weather Info Row -->
            <div class="flex items-center justify-between gap-2 mt-2.5">
              <!-- Category Tags (Positioned below image block, memanjang ke kanan) -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in course.tags"
                  :key="tag"
                  class="px-1.5 py-0.5 rounded text-[9px] font-semibold border tracking-wide transition-colors"
                  :class="getTagClass(tag)"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Weather Info (Temp + Icon) -->
              <div 
                v-if="course.hourly && course.hourly.length"
                class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50/80 dark:bg-brand-navy-950/40 border border-slate-200/50 dark:border-brand-navy-800/40 text-slate-600 dark:text-slate-350 text-[10px] font-extrabold shrink-0 shadow-inner"
              >
                <component 
                  :is="course.hourly.find(h => h.isCurrent)?.icon || course.hourly[1]?.icon || course.hourly[0]?.icon" 
                  class="w-3.5 h-3.5 text-amber-500 dark:text-brand-cyan" 
                />
                <span>{{ course.hourly.find(h => h.isCurrent)?.temp ?? course.hourly[1]?.temp ?? course.hourly[0]?.temp }}°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Slide left transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from { transform: translateX(30px); opacity: 0; }
.slide-left-leave-to   { transform: translateX(-30px); opacity: 0; }

/* Slide right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from { transform: translateX(-30px); opacity: 0; }
.slide-right-leave-to   { transform: translateX(30px); opacity: 0; }
</style>

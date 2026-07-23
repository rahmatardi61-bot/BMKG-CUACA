<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  CloudRain, 
  Sun, 
  Cloud,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  Moon
} from 'lucide-vue-next';

const props = defineProps<{
  selectedCity: string;
}>();

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
  comfortIndex: 'Nyaman' | 'Cukup';
  comfortEmoji: string;
  rainWarning: string;
  uvWarning: string;
  hourly: HourlyForecast[];
}

const getTimezoneInfoForCity = (cityName: string) => {
  const name = cityName.toLowerCase();
  
  if (name.includes('jakarta') || name.includes('gambir') || 
      name.includes('yogyakarta') || name.includes('sleman') || name.includes('bantul') || name.includes('mergangsan') || name.includes('brontokusuman') || name.includes('bangunjiwo') ||
      name.includes('surabaya') || name.includes('gubeng') || 
      name.includes('bandung') || name.includes('braga') || 
      name.includes('medan') || name.includes('sikambing')) {
    return { offset: 7, suffix: 'WIB' };
  }
  
  if (name.includes('denpasar') || name.includes('dauh puri') || name.includes('bali') || name.includes('kuta') || 
      name.includes('makassar') || name.includes('mariso') || name.includes('sulawesi') || name.includes('wita')) {
    return { offset: 8, suffix: 'WITA' };
  }
  
  if (name.includes('papua') || name.includes('maluku') || name.includes('ambon') || name.includes('jayapura') || name.includes('wit')) {
    return { offset: 9, suffix: 'WIT' };
  }

  const lonMatch = name.match(/lon:\s*([0-9.-]+)/i);
  if (lonMatch) {
    const lon = parseFloat(lonMatch[1]);
    if (lon >= 135) return { offset: 9, suffix: 'WIT' };
    if (lon >= 115) return { offset: 8, suffix: 'WITA' };
    return { offset: 7, suffix: 'WIB' };
  }

  return { offset: 7, suffix: 'WIB' };
};

const tzSuffix = computed(() => {
  return getTimezoneInfoForCity(props.selectedCity).suffix;
});

const getCurrentHoursList = () => {
  const now = new Date();
  const targetOffset = getTimezoneInfoForCity(props.selectedCity).offset;
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utcMs + (targetOffset * 3600000));
  const currentHour = targetTime.getHours();
  
  return [
    { hour: (currentHour - 1 + 24) % 24, isCurrent: false },
    { hour: currentHour, isCurrent: true },
    { hour: (currentHour + 1) % 24, isCurrent: false },
    { hour: (currentHour + 2) % 24, isCurrent: false }
  ].map(({ hour, isCurrent }) => {
    const formatted = `${String(hour).padStart(2, '0')}:00`;
    return { time: formatted, isCurrent };
  });
};

const getIconComponent = (weatherIcon: string, timeStr: string) => {
  const hr = parseInt(timeStr.split(':')[0]);
  const isNight = hr >= 18 || hr < 6;
  
  if (isNight) {
    if (weatherIcon === 'Sun' || weatherIcon === 'SunDim') return Moon;
  }
  return weatherIcon === 'Sun' ? Sun : (weatherIcon === 'SunDim' ? Sun : Cloud);
};

const generateHourlyForGolf = (comfort: string, baseTemp: number, weatherIcon: string) => {
  const hours = getCurrentHoursList();
  
  return [
    {
      time: hours[0].time,
      temp: baseTemp - 1,
      windSpeed: 9,
      windDirIcon: ArrowDownLeft,
      rain: 0.01,
      icon: getIconComponent(weatherIcon, hours[0].time)
    },
    {
      time: hours[1].time,
      isCurrent: true,
      temp: baseTemp,
      windSpeed: 9,
      windDirIcon: ArrowDown,
      rain: 0.04,
      icon: getIconComponent(weatherIcon, hours[1].time)
    },
    {
      time: hours[2].time,
      temp: Math.max(16, baseTemp - 3),
      windSpeed: 5,
      windDirIcon: ArrowDown,
      rain: comfort === 'Nyaman' ? 0.22 : 0.77,
      icon: comfort === 'Nyaman' ? Cloud : CloudRain
    },
    {
      time: hours[3].time,
      temp: Math.max(15, baseTemp - 5),
      windSpeed: 6,
      windDirIcon: ArrowDownRight,
      rain: comfort === 'Nyaman' ? 0.15 : 0.76,
      icon: Cloud
    }
  ];
};

const expandedStates = ref<Record<string, boolean>>({});

const toggleExpanded = (name: string) => {
  expandedStates.value[name] = !expandedStates.value[name];
};

const isExpanded = (name: string) => {
  return expandedStates.value[name] ?? false;
};

// ── Static Fallback mapping ──────────────────────────────────────────────────
const golfCourses = computed<GolfCourse[]>(() => {
  const cityLower = props.selectedCity.toLowerCase();
  
  if (cityLower.includes('jakarta') || cityLower.includes('gambir')) {
    return [
      {
        id: 101,
        name: 'Monumen Nasional (Monas)',
        distance: 'Radius • 1.2 km',
        location: 'Jakarta Pusat, DKI Jakarta',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Tidak ada potensi curah hujan siang ini.',
        uvWarning: 'Indeks UV ekstrem. Disarankan memakai kacamata hitam dan tabir surya.',
        hourly: generateHourlyForGolf('Cukup', 33, 'Sun')
      },
      {
        id: 102,
        name: 'Royale Jakarta Golf Club',
        distance: 'Radius • 16 km',
        location: 'Jakarta Timur, DKI Jakarta',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 2 jam.',
        uvWarning: 'Kondisi angin sepoi-sepoi, nyaman untuk berolahraga outdoor.',
        hourly: generateHourlyForGolf('Nyaman', 32, 'SunDim')
      }
    ];
  } else if (cityLower.includes('surabaya') || cityLower.includes('gubeng')) {
    return [
      {
        id: 201,
        name: 'Taman Bungkul',
        distance: 'Radius • 3.2 km',
        location: 'Wonokromo, Kota Surabaya, Jawa Timur',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Cuaca cerah berawan sepanjang hari.',
        uvWarning: 'Aman untuk aktivitas santai sore dan olahraga ringan.',
        hourly: generateHourlyForGolf('Nyaman', 31, 'SunDim')
      },
      {
        id: 202,
        name: 'Ciputra Golf Club Surabaya',
        distance: 'Radius • 14 km',
        location: 'Lakarsantri, Kota Surabaya, Jawa Timur',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 1 jam.',
        uvWarning: 'Suhu cukup terik di siang hari, siapkan air minum ekstra.',
        hourly: generateHourlyForGolf('Cukup', 34, 'Sun')
      }
    ];
  } else if (cityLower.includes('bandung') || cityLower.includes('braga')) {
    return [
      {
        id: 301,
        name: 'Dago Heritage 1917 Golf',
        distance: 'Radius • 6.8 km',
        location: 'Bandung Utara, Jawa Barat',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 3 jam.',
        uvWarning: 'Suhu sejuk (24°C). Sangat direkomendasikan untuk aktivitas luar ruangan.',
        hourly: generateHourlyForGolf('Nyaman', 24, 'SunDim')
      },
      {
        id: 302,
        name: 'Kawah Putih Ciwidey',
        distance: 'Radius • 42 km',
        location: 'Kabupaten Bandung, Jawa Barat',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Potensi kabut tebal dan gerimis ringan sore hari.',
        uvWarning: 'Suhu dingin (18°C). Disarankan membawa jaket tebal.',
        hourly: generateHourlyForGolf('Cukup', 18, 'Cloud')
      }
    ];
  } else if (cityLower.includes('medan') || cityLower.includes('sikambing')) {
    return [
      {
        id: 401,
        name: 'Taman Cadika Pramuka',
        distance: 'Radius • 8.2 km',
        location: 'Medan Johor, Kota Medan, Sumatera Utara',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Cuaca berawan tipis. Tidak ada potensi hujan.',
        uvWarning: 'Aman untuk aktivitas piknik keluarga luar ruangan.',
        hourly: generateHourlyForGolf('Nyaman', 29, 'Cloud')
      },
      {
        id: 402,
        name: 'Royal Sumatra Golf Course',
        distance: 'Radius • 12 km',
        location: 'Medan Tuntungan, Sumatera Utara',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Potensi mendung tebal mulai pukul 15:00 WIB.',
        uvWarning: 'Kelembapan tinggi, udara terasa sedikit gerah.',
        hourly: generateHourlyForGolf('Cukup', 30, 'Cloud')
      }
    ];
  } else if (cityLower.includes('makassar') || cityLower.includes('mariso')) {
    return [
      {
        id: 501,
        name: 'Pantai Losari Makassar',
        distance: 'Radius • 2.5 km',
        location: 'Ujung Pandang, Kota Makassar, Sulawesi Selatan',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 2 jam.',
        uvWarning: 'Angin laut kencang sepoi-sepoi, nyaman untuk jogging sore.',
        hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim')
      },
      {
        id: 502,
        name: 'Padi Valley Golf Club',
        distance: 'Radius • 24 km',
        location: 'Gowa, Sulawesi Selatan',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Potensi hujan ringan singkat lewat sore hari.',
        uvWarning: 'Suhu siang hari terik, disarankan memakai topi.',
        hourly: generateHourlyForGolf('Cukup', 32, 'Sun')
      }
    ];
  } else if (cityLower.includes('denpasar') || cityLower.includes('dauh puri') || cityLower.includes('bali') || cityLower.includes('kuta')) {
    return [
      {
        id: 601,
        name: 'Bali National Golf Club',
        distance: 'Radius • 18 km',
        location: 'Nusa Dua, Kabupaten Badung, Bali',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Cuaca pantai cerah mendukung penuh permainan golf.',
        uvWarning: 'Aman beraktivitas luar ruangan. Tetap terapkan sunscreen.',
        hourly: generateHourlyForGolf('Nyaman', 30, 'SunDim')
      },
      {
        id: 602,
        name: 'Pantai Kuta Bali',
        distance: 'Radius • 9.5 km',
        location: 'Kuta, Kabupaten Badung, Bali',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Cerah berawan. Gelombang laut terpantau sedang.',
        uvWarning: 'Sangat baik untuk selancar, berjemur, atau jalan santai pesisir.',
        hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim')
      }
    ];
  } else if (cityLower.includes('yogyakarta') || cityLower.includes('sleman') || cityLower.includes('bantul') || cityLower.includes('mergangsan') || cityLower.includes('brontokusuman') || cityLower.includes('bangunjiwo')) {
    return [
      {
        id: 1,
        name: 'Merapi Golf',
        distance: 'Radius • 30 km',
        location: 'Kabupaten Sleman Daerah Istimewa Yogyakarta',
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 1 jam.',
        uvWarning: 'Aman untuk beraktivitas di luar ruangan tanpa perlindungan khusus yang ketat.',
        hourly: generateHourlyForGolf('Nyaman', 32, 'Cloud')
      },
      {
        id: 2,
        name: 'Hyatt Regency Golf',
        distance: 'Radius • 14 km',
        location: 'Kabupaten Sleman Daerah Istimewa Yogyakarta',
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Tidak ada curah hujan setidaknya selama 1 jam.',
        uvWarning: 'Tidak direkomendasikan untuk aktivitas luar ruangan',
        hourly: generateHourlyForGolf('Cukup', 32, 'Cloud')
      }
    ];
  } else {
    const mainName = props.selectedCity.split(',')[0].trim();
    return [
      {
        id: 901,
        name: `${mainName} Central Park`,
        distance: 'Radius • 1.5 km',
        location: props.selectedCity.split(',').slice(1).join(', ').trim() || props.selectedCity,
        comfortIndex: 'Nyaman',
        comfortEmoji: '😊',
        rainWarning: 'Kondisi udara sejuk and tidak ada potensi hujan.',
        uvWarning: 'Sangat baik untuk jalan santai dan rekreasi keluarga lokal.',
        hourly: generateHourlyForGolf('Nyaman', 29, 'SunDim')
      },
      {
        id: 902,
        name: `${mainName} Sports Complex`,
        distance: 'Radius • 4.2 km',
        location: props.selectedCity.split(',').slice(1).join(', ').trim() || props.selectedCity,
        comfortIndex: 'Cukup',
        comfortEmoji: '😐',
        rainWarning: 'Mendung tipis, angin bertiup sedang.',
        uvWarning: 'Cocok untuk olahraga sore luar ruangan.',
        hourly: generateHourlyForGolf('Cukup', 30, 'Cloud')
      }
    ];
  }
});

const navigateToGolf = (name: string, location: string) => {
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`, '_blank');
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Badge and Selengkapnya Button -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Aktivitas Sekitar</h3>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950">
          {{ golfCourses.length }}
        </span>
      </div>
      <button 
        type="button" 
        class="group flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/15 dark:bg-brand-cyan/10 dark:hover:bg-brand-cyan/20 border border-blue-500/20 dark:border-brand-cyan/30 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-brand-cyan shadow-sm hover:shadow transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <span>Selengkapnya</span>
        <svg class="w-3 h-3 transform transition-transform group-hover:translate-x-0.5 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Golf Cards List -->
    <div class="space-y-3">
      <div 
        v-for="course in golfCourses" 
        :key="course.id"
        class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md text-slate-800 dark:text-white"
      >
        <!-- Header -->
        <div class="flex items-start gap-3 mb-3">
          <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
            <Building2 class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-slate-800 dark:text-white truncate">{{ course.name }}</h4>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {{ course.distance }} • {{ course.location }}
            </p>
          </div>
        </div>

        <!-- Index Kenyamanan Row -->
        <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-brand-navy-950/40 rounded-xl border border-slate-100 dark:border-brand-navy-700/10 mb-3">
          <div class="flex items-center gap-2">
            <!-- Custom thermal stress / comfort index icon -->
            <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.15" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M17.66 6.34l-1.41 1.41M7.76 16.24l-1.41 1.41M6.34 6.34l1.41 1.41M16.24 16.24l1.41 1.41" />
            </svg>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Index Kenyamanan</span>
          </div>
          <div class="flex items-center gap-2">
            <span 
              class="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border" 
              :class="course.comfortIndex === 'Nyaman' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'"
            >
              {{ course.comfortIndex }} {{ course.comfortEmoji }}
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <!-- Weather Alerts Box -->
        <div class="bg-slate-50/50 dark:bg-brand-navy-950/30 rounded-xl p-3.5 space-y-3 border border-slate-100 dark:border-brand-navy-700/10">
          <div class="flex items-start gap-2.5">
            <CloudRain class="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {{ course.rainWarning }}
            </p>
          </div>
          <div class="flex items-start gap-2.5">
            <Sun class="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {{ course.uvWarning }}
            </p>
          </div>
        </div>

        <!-- Accordion Ringkasan -->
        <div class="mt-3">
          <button 
            type="button"
            @click="toggleExpanded(course.name)"
            class="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors duration-200 border-t border-slate-100 dark:border-brand-navy-800/60"
          >
            <span>Ringkasan</span>
            <ChevronUp v-if="isExpanded(course.name)" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>

          <div v-if="isExpanded(course.name)" class="grid grid-cols-5 gap-y-3 text-[11px] font-semibold mt-3 bg-slate-50/50 dark:bg-brand-navy-950/20 rounded-xl p-3 border border-slate-100 dark:border-brand-navy-700/5">
            <!-- Row 1: Jam -->
            <div class="text-slate-500 dark:text-slate-400 font-medium">Jam <span class="text-[9px] block font-normal -mt-0.5">{{ tzSuffix }}</span></div>
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="text-center font-bold text-slate-800 dark:text-white"
            >
              <div v-if="h.isCurrent">
                <span class="text-[9px] text-blue-500 dark:text-brand-cyan block -mb-0.5 leading-tight">Sekarang</span>
                <span>{{ h.time }}</span>
              </div>
              <div v-else>
                <span class="block pt-2">{{ h.time }}</span>
              </div>
            </div>

            <!-- Row 2: Suhu -->
            <div class="text-slate-500 dark:text-slate-400 font-medium">Suhu <span class="text-[9px] block font-normal -mt-0.5">°C</span></div>
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="text-center text-slate-800 dark:text-white text-xs font-bold pt-0.5"
            >
              {{ h.temp }}°
            </div>

            <!-- Row 3: Angin -->
            <div class="text-slate-500 dark:text-slate-400 font-medium">Angin <span class="text-[9px] block font-normal -mt-0.5">km/jam</span></div>
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="text-center text-slate-600 dark:text-slate-300 pt-0.5"
            >
              {{ h.windSpeed }}
            </div>

            <!-- Row 4: Arah Angin -->
            <div class="text-slate-500 dark:text-slate-400 font-medium">Arah Angin</div>
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="flex justify-center text-slate-600 dark:text-slate-300"
            >
              <component :is="h.windDirIcon" class="w-3.5 h-3.5" />
            </div>

            <!-- Row 5: Hujan -->
            <div class="text-slate-500 dark:text-slate-400 font-medium">Hujan <span class="text-[9px] block font-normal -mt-0.5">mm/jam</span></div>
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="text-center text-slate-600 dark:text-slate-300"
            >
              {{ h.rain }}
            </div>

            <!-- Row 6: Rain Chart (spans columns 2-5) -->
            <div></div> <!-- Empty Col 1 -->
            <div class="col-span-4 flex items-end justify-between h-7 px-2 mt-1 mb-2">
              <div 
                v-for="(height, idx) in [15, 20, 30, 45, 60, 80, 95, 98, 92, 85, 75, 60, 45, 35, 25, 18, 12, 8, 5, 8, 12, 18, 25, 30, 35, 40]" 
                :key="idx"
                class="w-[3px] bg-blue-500/80 dark:bg-brand-cyan/80 rounded-t-[1.5px]"
                :style="{ height: height + '%' }"
              ></div>
            </div>

            <!-- Row 7: Weather Icons -->
            <div></div> <!-- Empty Col 1 -->
            <div 
              v-for="h in course.hourly" 
              :key="h.time"
              class="flex justify-center"
            >
              <component 
                :is="h.icon" 
                class="w-4 h-4" 
                :class="h.icon === Sun ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-400'"
              />
            </div>
          </div>
        </div>

        <!-- Button Petunjuk Arah -->
        <button 
          type="button"
          @click="navigateToGolf(course.name, course.location)"
          class="w-full mt-4 py-2.5 rounded-xl text-xs font-bold text-center transition-all bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 active:scale-[0.98] dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 cursor-pointer"
        >
          Petunjuk Arah
        </button>
      </div>
    </div>
  </div>
</template>

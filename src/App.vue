<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue';
import { X } from 'lucide-vue-next';

// ── Skeleton (tiny, load synchronously) ───────────────────────────────────────
import SkeletonDashboard from './components/skeletons/SkeletonDashboard.vue';

// ── Lazy loaded pages ─────────────────────────────────────────────────────────
const Header = defineAsyncComponent(() => import('./components/Header.vue'));
const MainDashboard = defineAsyncComponent({
  loader: () => import('./pages/MainDashboard.vue'),
  loadingComponent: SkeletonDashboard,
  delay: 100,
});
const Footer = defineAsyncComponent(() => import('./components/Footer.vue'));
const LoginView = defineAsyncComponent(() => import('./pages/LoginView.vue'));
const UnderMaintenance = defineAsyncComponent(() => import('./pages/UnderMaintenance.vue'));


// Import Mock Data
import { 
  citiesList, 
  weatherDataMap, 
  hourlyForecastsMap, 
  transportStatusesMap,
  warningAlertsMap,
  newsArticles,
  generateMockWeatherForCity
} from './data/mockData';

// Theme Mode state: 'light' | 'dark' | 'auto'
const themeMode = ref<'light' | 'dark' | 'auto'>('dark');

// Real-time ticking time state for local clock theme checking
const localClockTime = ref(new Date());

// Active selected location state
const selectedCity = ref('Mencari lokasi...');

// Active selected tab state
const activeTab = ref('Beranda');

// Reactive list of cities for navigation tabs
const cities = ref(['Mencari lokasi...', ...citiesList.slice(1)]);
// ── API BMKG live (fallback: mock di bawah) ───────────────────────────────────
import { useBmkgWeather, CITY_COORDS } from './composables/useBmkgWeather';
const bmkgWeather = useBmkgWeather();
const { liveWeather, liveHourly, liveAlerts, liveNews, liveAdditional, amandemenCount } = bmkgWeather;
const isDev = import.meta.env.DEV;
// 'live' = data BMKG asli; 'mock' = fallback mockData.ts; 'loading' = sedang fetch
const dataSource = computed(() => {
  if (bmkgWeather.status.value === 'loading') return 'loading';
  return liveWeather.value ? 'live' : 'mock';
});


// Computed current weather metrics based on selected city
const activeWeatherData = computed(() => {
  if (liveWeather.value && liveWeather.value.city === selectedCity.value) {
    return { ...liveWeather.value, city: selectedCity.value };
  }
  const baseData = weatherDataMap[selectedCity.value] || weatherDataMap['DKI Jakarta'];
  return {
    ...baseData,
    city: selectedCity.value
  };
});

// Computed hourly forecasts based on selected city
const activeHourlyForecasts = computed(() => {
  if (liveHourly.value.length && liveWeather.value?.city === selectedCity.value) {
    return liveHourly.value;
  }
  return hourlyForecastsMap[selectedCity.value] || hourlyForecastsMap['DKI Jakarta'];
});

// Computed per-city transport statuses
const activeTransportStatuses = computed(() => {
  return transportStatusesMap[selectedCity.value] || transportStatusesMap['DKI Jakarta'];
});

// Berita live (WP BMKG + video) — fallback ke artikel mock
const activeArticles = computed(() => {
  return liveNews.value.length ? liveNews.value : newsArticles;
});

// Computed per-city warning alerts
const activeWarningAlerts = computed(() => {
  // Data live dari API BMKG menang; alert siklon ikut masuk di sini
  if (liveWeather.value?.city === selectedCity.value && liveAlerts.value.length) {
    return liveAlerts.value;
  }
  // Only suppress alerts when user has real GPS location (mock data has no real alerts)
  if (isGeolocated.value && selectedCity.value === cities.value[0]) {
    return [];
  }
  return warningAlertsMap[selectedCity.value] || warningAlertsMap['DKI Jakarta'];
});

// Helper to get local hour of selected city
const getCityLocalHour = () => {
  const utc = localClockTime.value.getTime() + (localClockTime.value.getTimezoneOffset() * 60000);
  
  // Detect city timezone offset
  const name = selectedCity.value.toLowerCase();
  let offset = 7; // WIB (default)
  if (name.includes('denpasar') || name.includes('makassar') || name.includes('wita')) {
    offset = 8; // WITA
  } else if (name.includes('jayapura') || name.includes('wit')) {
    offset = 9; // WIT
  }
  
  const localTime = new Date(utc + (3600000 * offset));
  return localTime.getHours();
};

// Calculate sub-theme string based on local time and weather condition
const calculateAutoThemeState = () => {
  const hour = getCityLocalHour();
  const status = (activeWeatherData.value?.status || '').toLowerCase();
  
  // 1. Badai / Petir / Kilat / Halilintar (Stormy)
  if (status.includes('petir') || status.includes('badai') || status.includes('kilat') || status.includes('halilintar')) {
    return { isDark: true, themeClass: 'theme-stormy' };
  }
  
  // 2. Hujan / Gerimis / Deras / Lebat (Rainy)
  if (status.includes('hujan') || status.includes('gerimis') || status.includes('deras') || status.includes('lebat')) {
    return { isDark: hour < 5 || hour >= 18, themeClass: 'theme-rainy' };
  }
  
  // 3. Berawan / Mendung / Overcast / Kabut / Asap / Kabur (Cloudy/Foggy)
  if (
    status === 'berawan' || 
    status.includes('berawan tebal') || 
    status.includes('mendung') || 
    status.includes('overcast') || 
    status.includes('kabut') || 
    status.includes('asap') || 
    status.includes('kabur')
  ) {
    return { isDark: hour < 5 || hour >= 18, themeClass: 'theme-cloudy' };
  }
  
  // 4. Cerah / Cerah Berawan / Sunny / Partly Cloudy (Follow Day Cycle)
  if (hour >= 5 && hour < 10) {
    return { isDark: false, themeClass: 'theme-morning' };
  } else if (hour >= 10 && hour < 15) {
    return { isDark: false, themeClass: 'theme-day' };
  } else if (hour >= 15 && hour < 18) {
    return { isDark: false, themeClass: 'theme-evening' };
  } else {
    return { isDark: true, themeClass: 'theme-night' };
  }
};

// Cycle: 'dark' -> 'light' -> 'auto'
const toggleTheme = () => {
  const root = document.documentElement;
  root.classList.add('no-transitions');

  if (themeMode.value === 'dark') {
    themeMode.value = 'light';
  } else if (themeMode.value === 'light') {
    themeMode.value = 'auto';
  } else {
    themeMode.value = 'dark';
  }

  applyTheme();

  void root.offsetHeight; // Force reflow
  requestAnimationFrame(() => {
    root.classList.remove('no-transitions');
  });
};

const applyTheme = () => {
  const root = document.documentElement;
  
  // Clean up all theme-specific dynamic classes first
  root.classList.remove(
    'theme-morning', 'theme-day', 'theme-evening', 'theme-night', 
    'theme-rainy', 'theme-stormy', 'theme-cloudy', 'dark'
  );

  let themeColor = '#f8fafc'; // default light background color fallback
  let isDarkTheme = false;

  if (themeMode.value === 'dark') {
    root.classList.add('dark');
    themeColor = '#070c19';
    isDarkTheme = true;
    localStorage.setItem('bmkg-theme-v2', 'dark');
  } else if (themeMode.value === 'light') {
    themeColor = '#eef5ff';
    localStorage.setItem('bmkg-theme-v2', 'light');
  } else {
    // Mode 'auto': dynamically decide light/dark + sub-theme
    const autoTheme = calculateAutoThemeState();
    root.classList.add(autoTheme.themeClass);
    if (autoTheme.isDark) {
      root.classList.add('dark');
      isDarkTheme = true;
    }
    
    // Choose status bar color matching active weather condition background
    switch (autoTheme.themeClass) {
      case 'theme-morning': themeColor = '#fdf2f8'; break;
      case 'theme-day':     themeColor = '#f0f9ff'; break;
      case 'theme-evening': themeColor = '#fff1f2'; break;
      case 'theme-night':   themeColor = '#070c19'; break;
      case 'theme-rainy':   themeColor = isDarkTheme ? '#070c19' : '#f8fafc'; break;
      case 'theme-stormy':  themeColor = '#070c19'; break;
      case 'theme-cloudy':  themeColor = isDarkTheme ? '#070c19' : '#f8fafc'; break;
    }
    localStorage.setItem('bmkg-theme-v2', 'auto');
  }

  // Enforce root & body background color & color-scheme to eliminate white bars on iOS Safari
  root.style.backgroundColor = themeColor;
  root.style.colorScheme = isDarkTheme ? 'dark' : 'light';
  document.body.style.backgroundColor = themeColor;

  // ─── Update Smartphone / Mobile Browser Status Bar Theme ───
  try {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.setAttribute('content', isDarkTheme ? 'black-translucent' : 'default');

    let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (!metaColorScheme) {
      metaColorScheme = document.createElement('meta');
      metaColorScheme.setAttribute('name', 'color-scheme');
      document.head.appendChild(metaColorScheme);
    }
    metaColorScheme.setAttribute('content', isDarkTheme ? 'dark' : 'light');
  } catch (e) {
    console.error("Failed to update status bar meta tags:", e);
  }
};

// Watch for city/weather updates to refresh auto theme instantly
watch([selectedCity, activeWeatherData], () => {
  if (themeMode.value === 'auto') {
    applyTheme();
  }
});

// Geolocation state
const isLocating = ref(false);
const isGeolocated = ref(false);
const userLat = ref<number | null>(null);
const userLng = ref<number | null>(null);

const toastMessage = ref<{ text: string; type: 'warning' | 'info' } | null>(null);

const showToast = (text: string, type: 'warning' | 'info' = 'info') => {
  toastMessage.value = { text, type };
  setTimeout(() => {
    toastMessage.value = null;
  }, 7000);
};



const isGpsCity = (city: string) => isGeolocated.value && city === cities.value[0];
const coordsForCity = (city: string) =>
  isGpsCity(city) && userLat.value != null && userLng.value != null
    ? { lat: userLat.value, lon: userLng.value }
    : CITY_COORDS[city] ?? (userLat.value != null && userLng.value != null
        ? { lat: userLat.value, lon: userLng.value }
        : CITY_COORDS['DKI Jakarta']);

// fetch live saat kota berubah / GPS selesai
watch([selectedCity, isGeolocated], ([city]) => {
  if (!city || city === 'Mencari lokasi...') return;
  void bmkgWeather.loadCity(city, coordsForCity(city));
}, { immediate: true });

// berita WP + video sekali di mount
void bmkgWeather.loadNews();

// info amandemen prakiraan bila ada
watch(amandemenCount, (n) => {
  if (n > 0) showToast(`Amandemen prakiraan tersedia (${n} revisi) untuk lokasi Anda.`, 'info');
});



const detectRealtimeLocation = () => {
  if (!navigator.geolocation) {
    console.warn("Geolocation tidak didukung oleh browser Anda.");
    isGeolocated.value = false;
    if (cities.value[0] !== 'DKI Jakarta') {
      cities.value[0] = 'DKI Jakarta';
      if (cities.value[1] === 'DKI Jakarta') {
        cities.value.splice(1, 1);
      }
    }
    selectedCity.value = 'DKI Jakarta';
    return;
  }

  isLocating.value = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      userLat.value = lat;
      userLng.value = lon;
      
      // Pilihan 1: resolve alamat via API BMKG (adm/coord, lewat proxy)
      const bmkgAddress = await bmkgWeather.resolveAddress(lat, lon).catch(() => null);
      if (bmkgAddress) {
        generateMockWeatherForCity(bmkgAddress); // layer fallback tetap terisi
        cities.value[0] = bmkgAddress;
        selectedCity.value = bmkgAddress;
        isGeolocated.value = true;
        isLocating.value = false;
        return;
      }

      // Pilihan 2 (fallback): Nominatim OSM
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'id',
              'User-Agent': 'BMKGCuacaApp/1.0 (https://bmkg-cuaca-rho.vercel.app)'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          // Nominatim field mapping for Indonesian administrative levels:
          // - county/regency/city = Kabupaten/Kota
          // - state = Provinsi
          const state = addr.state || '';
          const kabupaten = addr.county || addr.city || addr.regency || addr.municipal || '';
          
          let kecamatan = '';
          let village = '';
          
          if (addr.county || addr.regency) {
            // Under a Regency (Kabupaten):
            // - 'town' is usually the subdistrict / Kecamatan (e.g., Sedayu, Kasihan)
            // - 'village' or 'city_district' is usually the village / Desa (e.g., Argomulyo, Bangunjiwo)
            kecamatan = addr.town || addr.subdistrict || addr.municipality || addr.city_district || '';
            village = addr.village || (addr.city_district !== kecamatan ? addr.city_district : '') || addr.suburb || addr.neighbourhood || addr.hamlet || '';
          } else {
            // Under a major city (Kota):
            // - 'city_district' or 'subdistrict' is usually the Kecamatan
            // - 'suburb', 'village', or 'neighbourhood' is usually the Kelurahan
            kecamatan = addr.city_district || addr.subdistrict || addr.town || addr.municipality || '';
            village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || '';
          }
          

          const addressParts = [];
          if (village && village !== kecamatan) {
            addressParts.push(village);
          }
          if (kecamatan) {
            addressParts.push(`Kec. ${kecamatan.replace(/Kecamatan\s*/gi, '').trim()}`);
          }
          if (kabupaten) {
            addressParts.push(kabupaten.replace(/Kabupaten\s*/gi, 'Kab. ').trim());
          }
          if (state) {
            addressParts.push(state.trim());
          }
          
          const formattedAddress = addressParts.filter(Boolean).join(', ');
          
          if (formattedAddress) {
            generateMockWeatherForCity(formattedAddress);
            cities.value[0] = formattedAddress;
            selectedCity.value = formattedAddress;
            isGeolocated.value = true;
          }
        }
      } catch (error) {
        console.error("Geocoding failed, falling back to coords:", error);
        const coordsName = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
        generateMockWeatherForCity(coordsName);
        cities.value[0] = coordsName;
        selectedCity.value = coordsName;
        isGeolocated.value = true;
      } finally {
        isLocating.value = false;
      }
    },
    (error) => {
      console.error("Geolocation failed:", error);
      isLocating.value = false;
      isGeolocated.value = false;
      
      // If permission is denied, show non-intrusive warning toast
      if (error.code === error.PERMISSION_DENIED) {
        showToast("Akses lokasi diblokir browser. Cuaca ditampilkan untuk DKI Jakarta (default). Anda dapat mengaktifkan izin lokasi di setelan browser.", "warning");
      }
      
      // Fallback to DKI Jakarta
      if (cities.value[0] !== 'DKI Jakarta') {
        cities.value[0] = 'DKI Jakarta';
        if (cities.value[1] === 'DKI Jakarta') {
          cities.value.splice(1, 1);
        }
      }
      selectedCity.value = 'DKI Jakarta';
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    }
  );
};

// Listen to city changes
const selectCity = (city: string) => {
  const matched = citiesList.find(c => c.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(c.toLowerCase()));
  const targetCity = matched || city;
  
  if (!weatherDataMap[targetCity]) {
    generateMockWeatherForCity(targetCity);
  }
  if (!cities.value.includes(targetCity)) {
    cities.value.push(targetCity);
  }
  selectedCity.value = targetCity;
};

// Handle deleting a city
const deleteCity = (cityToDelete: string) => {
  cities.value = cities.value.filter(c => c !== cityToDelete);
  if (selectedCity.value === cityToDelete) {
    if (cities.value.length > 0) {
      selectedCity.value = cities.value[0];
    } else {
      selectedCity.value = '';
    }
  }
};

// Login State
const showLogin = ref(false); // Default to false to bypass login screen on first load
const isLoggedIn = ref(false);
const userProfile = ref<{ name: string; username: string } | null>(null);

const handleLoginSuccess = (user: { name: string; username: string }) => {
  isLoggedIn.value = true;
  userProfile.value = user;
  showLogin.value = false;
  
  // Set session expiration to 1 hour (3600000 ms) from now
  const sessionData = {
    user,
    expiresAt: Date.now() + 60 * 60 * 1000
  };
  localStorage.setItem('bmkg-session', JSON.stringify(sessionData));
};

const handleLogout = () => {
  isLoggedIn.value = false;
  userProfile.value = null;
  localStorage.removeItem('bmkg-session');
  showLogin.value = false; // Bypass redirecting to login page on logout
};

onMounted(() => {
  // Load preferences from local storage or default to 'dark'
  const storedTheme = localStorage.getItem('bmkg-theme-v2');
  if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'auto') {
    themeMode.value = storedTheme as 'light' | 'dark' | 'auto';
  } else {
    themeMode.value = 'dark'; // Default: dark mode
    localStorage.setItem('bmkg-theme-v2', 'dark');
    localStorage.removeItem('bmkg-theme');
  }
  applyTheme();

  // Load session from local storage with 1-hour expiration check
  const storedSession = localStorage.getItem('bmkg-session');
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      const now = Date.now();
      
      // Check if session contains expiresAt and if it's still valid
      if (sessionData.user && sessionData.expiresAt && now < sessionData.expiresAt) {
        userProfile.value = sessionData.user;
        isLoggedIn.value = true;
        showLogin.value = false; // Bypass login
      } else {
        // Session expired or invalid format
        localStorage.removeItem('bmkg-session');
        showLogin.value = false;
      }
    } catch (e) {
      localStorage.removeItem('bmkg-session');
      showLogin.value = false;
    }
  } else {
    showLogin.value = false;
  }

  // Trigger geolocation immediately on open
  detectRealtimeLocation();

  // ── Touch Hover Simulation ─────────────────────────────────────────────────
  // On touch devices, Tailwind hover: classes don't fire reliably on tap.
  // This adds 'touch-hovering' class on touchstart so CSS can apply the same
  // hover visual effects. Removed after touchend for natural feel.
  const TOUCH_HOLD_MS = 280;
  let touchedEls: Element[] = [];
  let removeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTouched = () => {
    touchedEls.forEach(el => el.classList.remove('touch-hovering'));
    touchedEls = [];
  };

  document.addEventListener('touchstart', (e: TouchEvent) => {
    if (removeTimer) { clearTimeout(removeTimer); removeTimer = null; }
    clearTouched();

    const target = e.target as Element;
    let el: Element | null = target;

    // Walk up DOM: collect target + group ancestors (for group-hover children)
    while (el && el !== document.body) {
      const isInteractive =
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        el.getAttribute('role') === 'button' ||
        el.classList.contains('cursor-pointer') ||
        el.classList.contains('group');
      if (isInteractive) {
        el.classList.add('touch-hovering');
        touchedEls.push(el);
        if (!el.classList.contains('group')) break;
      }
      el = el.parentElement;
    }
  }, { passive: true });

  const onTouchEnd = () => {
    removeTimer = setTimeout(() => {
      clearTouched();
      removeTimer = null;
    }, TOUCH_HOLD_MS);
  };

  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', () => { clearTouched(); }, { passive: true });

  // ── Scroll Jank Prevention ─────────────────────────────────────────────
  // During scroll, suppress expensive group-hover effects (blur scale animations)
  // that trigger GPU compositing and cause frame drops.
  let scrollTimer: ReturnType<typeof setTimeout> | null = null;
  const onScroll = () => {
    if (!document.body.classList.contains('is-scrolling')) {
      document.body.classList.add('is-scrolling');
    }
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
      scrollTimer = null;
    }, 150);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
});
</script>

<template>
  <div 
    class="min-h-screen flex flex-col bg-transparent text-slate-800 dark:text-slate-100 w-full"
    style="padding-top: max(env(safe-area-inset-top, 0px), 0px); padding-bottom: max(env(safe-area-inset-bottom, 0px), 0px);"
  >
    <template v-if="!showLogin">
      <!-- Main Header -->
      <Header 
        :active-tab="activeTab"
        @change-tab="activeTab = $event"
        :theme-mode="themeMode" 
        :selected-city="selectedCity"
        :cities="cities"
        :is-logged-in="isLoggedIn"
        :user-profile="userProfile"
        @toggle-theme="toggleTheme" 
        @select-city="selectCity"
        @open-login="showLogin = true"
        @logout="handleLogout"
      />

      <!-- Main Dashboard Grid Layout -->
      <MainDashboard 
        v-if="activeTab === 'Beranda'"
        class="flex-grow"
        :weather-data="activeWeatherData"
        :forecasts="activeHourlyForecasts"
        :transport-statuses="activeTransportStatuses"
        :alerts="activeWarningAlerts"
        :articles="activeArticles"
        :cities="cities"
        :selected-city="selectedCity"
        :is-locating="isLocating"
        :is-geolocated="isGeolocated"
        :user-lat="userLat"
        :user-lng="userLng"
        :additional-info="liveAdditional ?? undefined"
        @select-city="selectCity"
        @delete-city="deleteCity"
        @detect-location="detectRealtimeLocation"
      />

      <UnderMaintenance
        v-else
        :menu-name="activeTab"
        @back-to-home="activeTab = 'Beranda'"
        class="flex-grow"
      />


      <!-- Footer -->
      <Footer />
    </template>

    <template v-else>
      <LoginView 
        :show-close-button="isLoggedIn"
        @close="showLogin = false"
        @login-success="handleLoginSuccess"
      />
    </template>

    <!-- Data source badge (dev-only): pemisah visual LIVE vs MOCK -->
    <div
      v-if="isDev"
      class="fixed bottom-3 right-3 z-[100] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md border"
      :class="dataSource === 'live'
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'"
      :title="dataSource === 'live' ? 'Data cuaca live dari API BMKG (cuaca.bmkg.go.id)' : 'Data contoh dari mockData.ts (API gagal / belum termuat)'"
    >
      <span class="relative flex h-2 w-2">
        <span class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          :class="dataSource === 'live' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
        <span class="relative inline-flex h-2 w-2 rounded-full"
          :class="dataSource === 'live' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
      </span>
      {{ dataSource === 'live' ? 'LIVE • BMKG API' : dataSource === 'loading' ? 'MEMUAT…' : 'DEMO • MOCK' }}
    </div>

    <!-- Elegant Dismissible Toast Notification -->
    <Transition name="slide-fade">
      <div 
        v-if="toastMessage"
        class="fixed top-6 left-6 z-[100] max-w-sm w-full bg-white/95 dark:bg-brand-navy-900/95 border-l-4 border-amber-500 dark:border-amber-400 rounded-[4px] shadow-xl p-4 backdrop-blur-md flex items-start gap-3 animate-slide-in text-slate-800 dark:text-white"
      >
        <!-- Warning Icon -->
        <div class="p-1 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-0.5 text-left">Akses Lokasi Diblokir</h4>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-left">
            {{ toastMessage.text }}
          </p>
        </div>
        <!-- Close Button -->
        <button 
          @click="toastMessage = null"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
/* CSS transition for pages fade-in */
.animate-fade-in {
  opacity: 0;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toast Slide In animation */
@keyframes slideInLeft {
  from {
    transform: translateX(-120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.animate-slide-in {
  animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>

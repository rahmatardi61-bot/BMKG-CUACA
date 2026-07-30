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
const themeMode = ref<'light' | 'dark' | 'auto'>('auto');

// Real-time ticking time state for local clock theme checking
const localClockTime = ref(new Date());

// Active selected location state
const selectedCity = ref('Mencari lokasi...');

// Active selected tab state
const activeTab = ref('Beranda');

// Reactive list of cities for navigation tabs
const cities = ref(['Mencari lokasi...', ...citiesList.slice(1)]);

// Computed current weather metrics based on selected city
const activeWeatherData = computed(() => {
  const baseData = weatherDataMap[selectedCity.value] || weatherDataMap['DKI Jakarta'];
  return {
    ...baseData,
    city: selectedCity.value
  };
});

// Computed hourly forecasts based on selected city
const activeHourlyForecasts = computed(() => {
  return hourlyForecastsMap[selectedCity.value] || hourlyForecastsMap['DKI Jakarta'];
});

// Computed per-city transport statuses
const activeTransportStatuses = computed(() => {
  return transportStatusesMap[selectedCity.value] || transportStatusesMap['DKI Jakarta'];
});

// Computed per-city warning alerts
const activeWarningAlerts = computed(() => {
  // Disable warning alert for sample layout of the user's current geolocated location
  if (selectedCity.value === cities.value[0]) {
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

// Cycle: 'light' -> 'dark' -> 'auto'
const toggleTheme = () => {
  const root = document.documentElement;
  root.classList.add('no-transitions');

  if (themeMode.value === 'light') {
    themeMode.value = 'dark';
  } else if (themeMode.value === 'dark') {
    themeMode.value = 'auto';
  } else {
    themeMode.value = 'light';
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

  if (themeMode.value === 'dark') {
    root.classList.add('dark');
    localStorage.setItem('bmkg-theme', 'dark');
  } else if (themeMode.value === 'light') {
    localStorage.setItem('bmkg-theme', 'light');
  } else {
    // Mode 'auto': dynamically decide light/dark + sub-theme
    const autoTheme = calculateAutoThemeState();
    root.classList.add(autoTheme.themeClass);
    if (autoTheme.isDark) {
      root.classList.add('dark');
    }
    localStorage.setItem('bmkg-theme', 'auto');
  }

  // Update a reactive state if needed or trigger updates
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
  // Load preferences from local storage or default to 'auto'
  const storedTheme = localStorage.getItem('bmkg-theme');
  if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'auto') {
    themeMode.value = storedTheme as 'light' | 'dark' | 'auto';
  } else {
    themeMode.value = 'auto';
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
  <div class="min-h-screen flex flex-col bg-transparent text-slate-800 dark:text-slate-100">
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
        :articles="newsArticles"
        :cities="cities"
        :selected-city="selectedCity"
        :is-locating="isLocating"
        :is-geolocated="isGeolocated"
        :user-lat="userLat"
        :user-lng="userLng"
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

    <!-- Elegant Dismissible Toast Notification -->
    <Transition name="slide-fade">
      <div 
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white/95 dark:bg-brand-navy-900/95 border-l-4 border-amber-500 dark:border-amber-400 rounded-2xl shadow-xl p-4 backdrop-blur-md flex items-start gap-3 animate-slide-in text-slate-800 dark:text-white"
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
@keyframes slideInRight {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.animate-slide-in {
  animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>

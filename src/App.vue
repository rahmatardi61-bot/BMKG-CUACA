<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { X } from 'lucide-vue-next';

const Header = defineAsyncComponent(() => import('./components/Header.vue'));
const MainDashboard = defineAsyncComponent(() => import('./pages/MainDashboard.vue'));
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

// Helper to determine if it is night time (6 PM to 6 AM)
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
};

// Theme Mode state
const darkMode = ref(isNightTime()); // Defaulting to light during day, dark during night

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
  return warningAlertsMap[selectedCity.value] || warningAlertsMap['DKI Jakarta'];
});

// Function to toggle Dark/Light mode theme instantly
const toggleTheme = () => {
  const root = document.documentElement;

  // Temporarily apply no-transitions helper class to skip animations
  root.classList.add('no-transitions');

  darkMode.value = !darkMode.value;
  applyTheme();

  // Force a style reflow to apply the styling change instantly
  void root.offsetHeight;

  // Remove the helper class in the next frame so regular animations continue working
  requestAnimationFrame(() => {
    root.classList.remove('no-transitions');
  });
};

const applyTheme = () => {
  const root = document.documentElement;
  if (darkMode.value) {
    root.classList.add('dark');
    localStorage.setItem('bmkg-theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('bmkg-theme', 'light');
  }
};

// Geolocation state
const isLocating = ref(false);
const isGeolocated = ref(false);

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
          const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || 'Lokasi Terdeteksi';
          const district = addr.city_district || addr.county || '';
          const city = addr.city || addr.regency || addr.town || '';
          const state = addr.state || '';
          
          let formattedAddress = '';
          if (village) formattedAddress += village;
          if (district) formattedAddress += `, Kec. ${district.replace(/Kecamatan/g, '').trim()}`;
          if (city) formattedAddress += `, ${city.trim()}`;
          if (state) formattedAddress += `, ${state.trim()}`;
          
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
  // Load preferences from local storage or default based on time (siang light, malam dark)
  const storedTheme = localStorage.getItem('bmkg-theme');
  if (storedTheme) {
    darkMode.value = storedTheme === 'dark';
  } else {
    darkMode.value = isNightTime();
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
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-brand-sky-100 text-slate-800 dark:bg-brand-navy-950 dark:text-slate-100">
    <template v-if="!showLogin">
      <!-- Main Header -->
      <Header 
        :active-tab="activeTab"
        @change-tab="activeTab = $event"
        :dark-mode="darkMode" 
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

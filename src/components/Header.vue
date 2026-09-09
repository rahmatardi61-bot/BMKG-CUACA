<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Sun, Moon, Bell, User, X, LogOut, Settings, Sparkles } from 'lucide-vue-next';
import LocationSearch from './LocationSearch.vue';

const props = withDefaults(defineProps<{
  themeMode: 'light' | 'dark' | 'auto';
  selectedCity: string;
  cities: string[];
  isLoggedIn: boolean;
  userProfile: { name: string; username: string } | null;
  activeTab?: string;
}>(), {
  activeTab: 'Beranda'
});

const emit = defineEmits<{
  (e: 'toggle-theme'): void;
  (e: 'select-city', city: string): void;
  (e: 'open-login'): void;
  (e: 'logout'): void;
  (e: 'change-tab', tab: string): void;
}>();

const handleSelectLocation = (location: string) => {
  emit('select-city', location);
};

const showProfileDropdown = ref(false);
const activeTab = ref(props.activeTab);
const isNavDrawerOpen = ref(false);

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab;
  }
});

const handleTabClick = (tab: string) => {
  activeTab.value = tab;
  emit('change-tab', tab);
};

const handleSettingsClick = () => {
  showProfileDropdown.value = false;
  emit('change-tab', 'Pengaturan Akun');
};


// Compute user initials for avatar
const userInitials = computed(() => {
  if (!props.userProfile || !props.userProfile.name) return 'US';
  const names = props.userProfile.name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
});

const handleUserClick = () => {
  showProfileDropdown.value = !showProfileDropdown.value;
};

const handleLogout = () => {
  showProfileDropdown.value = false;
  emit('logout');
};

const profileDropdownContainer = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (
    showProfileDropdown.value &&
    profileDropdownContainer.value &&
    !profileDropdownContainer.value.contains(event.target as Node)
  ) {
    showProfileDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header class="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] max-w-[1216px] transition-all duration-300
    bg-white/85 dark:bg-brand-navy-950/75 backdrop-blur-[24px]
    border border-white/60 dark:border-white/[0.08]
    shadow-[0_12px_40px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.01),0_1px_1px_rgba(255,255,255,0.85)_inset]
    dark:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.08)_inset]
    rounded-[4px] h-14 md:h-16 px-[18px] flex items-center justify-between gap-4 relative mb-6 md:mb-8">
      
      <!-- Left: Logo & Title -->
      <div 
        id="nav-drawer-toggle-desktop"
        @click="isNavDrawerOpen = true"
        class="flex items-center gap-2.5 shrink-0 cursor-pointer group hover:opacity-95 select-none"
        title=""
      >
        <img src="../assets/logo.svg" alt="Logo BMKG" class="w-8 h-8 md:w-9 md:h-9 object-contain transition-transform group-hover:scale-105 duration-300" />
        
        <div class="hidden md:flex flex-col justify-center">
          <h1 class="text-sm font-black tracking-wider text-slate-800 dark:text-white leading-none">
            BMKG
          </h1>
          <span class="hidden xl:block text-[9px] text-slate-500 dark:text-brand-navy-600 font-semibold mt-0.5 whitespace-nowrap">
            Badan Meteorologi, Klimatologi & Geofisika
          </span>
        </div>
      </div>

      <!-- Center: Search bar (Desktop - centered & elevated) -->
      <div class="hidden lg:block relative w-80 xl:w-96 transition-all duration-300 mx-auto">
        <LocationSearch 
          @select-location="handleSelectLocation" 
        />
      </div>
      
      <!-- Center: Search bar (Mobile/Tablet only - centered and flexible width) -->
      <div class="flex-1 max-w-sm sm:max-w-md mx-2 sm:mx-8 lg:hidden relative transition-all duration-300">
        <LocationSearch 
          :is-mobile="true"
          @select-location="handleSelectLocation" 
        />
      </div>

      <!-- Right: Search, Actions (Desktop Search visible only on lg+) -->
      <div class="flex items-center gap-2 md:gap-3 shrink-0 ml-auto lg:ml-0">


        <!-- Notification Icon -->
        <button v-if="isLoggedIn" id="notification-button" class="p-1.5 rounded-[4px] hover:bg-slate-100 dark:hover:bg-brand-navy-800 text-slate-500 dark:text-slate-300 relative transition-all active:scale-95 active:duration-75">
          <Bell class="w-4 h-4" />
          <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-brand-navy-950"></span>
        </button>

        <!-- Theme Toggle Button -->
        <div class="relative group shrink-0">
          <button 
            id="theme-toggle-button"
            @click="emit('toggle-theme')" 
            class="p-1.5 sm:px-3 sm:py-1.5 rounded-[4px] border transition-all duration-300 flex items-center gap-1.5 active:scale-95 active:duration-75 cursor-pointer"
            :class="[
              themeMode === 'light' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20' : '',
              themeMode === 'dark' ? 'bg-brand-navy-900 border-brand-navy-700 hover:bg-brand-navy-800 text-brand-cyan' : '',
              themeMode === 'auto' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:bg-brand-cyan/15 dark:border-brand-cyan/35 dark:text-brand-cyan hover:bg-blue-500/20 dark:hover:bg-brand-cyan/25' : ''
            ]"
          >
            <Sun v-if="themeMode === 'light'" class="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
            <Moon v-else-if="themeMode === 'dark'" class="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
            <Sparkles v-else class="w-4 h-4 transition-pulse duration-300" />
            
            <span class="hidden sm:inline text-[9px] font-black uppercase tracking-wider select-none">
              {{ themeMode === 'light' ? 'Terang' : themeMode === 'dark' ? 'Gelap' : 'Otomatis' }}
            </span>
          </button>

          <!-- Premium Tooltip -->
          <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-[100] pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
            <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
              <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-t border-l border-slate-800 dark:border-slate-800/60 rotate-45"></div>
              <span>Ubah Tema (Terang / Gelap / Otomatis)</span>
            </div>
          </div>
        </div>

        <!-- User Profile (Clickable Login Trigger / Profile Dropdown) -->
        <div ref="profileDropdownContainer" class="relative hidden">
          <div class="relative group">
            <button 
              id="user-profile-button"
              @click="handleUserClick" 
              class="w-7 h-7 rounded-[4px] flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border"
              :class="[
                isLoggedIn 
                  ? 'bg-blue-600 border-blue-500 text-white font-extrabold text-[10px] tracking-tight dark:bg-brand-cyan dark:border-brand-cyan/60 dark:text-brand-navy-950'
                  : 'bg-slate-100 dark:bg-brand-navy-900/60 border-slate-200/60 dark:border-brand-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-brand-navy-800/60'
              ]"
            >
              <span v-if="isLoggedIn">{{ userInitials }}</span>
              <User v-else class="w-3.5 h-3.5" />
            </button>

            <!-- Premium Tooltip -->
            <div class="absolute right-0 top-full mt-2.5 z-[100] pointer-events-none opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-250 ease-out whitespace-nowrap">
              <div class="relative bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 dark:border-slate-800/60 text-white text-[9px] font-bold py-1.5 px-3 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-1.5 backdrop-blur-sm">
                <div class="absolute -top-1 right-2.5 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-t border-l border-slate-800 dark:border-slate-800/60 rotate-45"></div>
                <span>{{ isLoggedIn ? 'Kelola Akun (' + userProfile?.name + ')' : 'Masuk ke Portal' }}</span>
              </div>
            </div>
          </div>

          <!-- Profile Dropdown Menu -->
          <div 
            v-if="showProfileDropdown" 
            class="absolute right-0 mt-2 w-48 rounded-[4px] shadow-lg border overflow-hidden py-1.5 z-50 animate-fade-in
              bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
            <!-- If Logged In -->
            <template v-if="isLoggedIn">
              <!-- User Info Summary Header -->
              <div class="px-4 py-2 border-b border-slate-100 dark:border-brand-navy-800/60 text-left">
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Terautentikasi</p>
                <p class="text-xs font-black text-slate-800 dark:text-white truncate mt-0.5">{{ userProfile?.name }}</p>
                <p class="text-[10px] text-slate-500 dark:text-brand-navy-600 truncate">@{{ userProfile?.username }}</p>
              </div>

              <!-- Profile Menu Items -->
              <button 
                id="profile-settings-button"
                @click="handleSettingsClick"
                class="w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Settings class="w-3.5 h-3.5 text-slate-400" />
                <span>Pengaturan Akun</span>
              </button>

              <button 
                id="profile-logout-button"
                @click="handleLogout"
                class="w-full text-left px-4 py-2.5 text-xs text-red-600 dark:text-rose-400 hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center gap-2 cursor-pointer font-semibold border-t border-slate-100/80 dark:border-brand-navy-800/40"
              >
                <LogOut class="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </template>

            <!-- If Not Logged In -->
            <template v-else>
              <button 
                id="profile-login-trigger"
                @click="emit('open-login'); showProfileDropdown = false"
                class="w-full text-left px-4 py-3 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-brand-navy-800/50 transition-colors flex items-center gap-2 cursor-pointer font-black"
              >
                <User class="w-4 h-4 text-blue-500 dark:text-brand-cyan" />
                <span>Masuk ke Akun Saya</span>
              </button>
            </template>
          </div>
        </div>

      </div>
  </header>

  <!-- Mobile Navigation Drawer (Teleport to body) -->
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      <!-- Backdrop Overlay -->
      <Transition name="fade" appear>
        <div 
          v-if="isNavDrawerOpen"
          class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-default pointer-events-auto"
          @click="isNavDrawerOpen = false"
        ></div>
      </Transition>

      <!-- Slide-out Left Drawer Panel -->
      <Transition name="slide-left" appear>
        <div 
          v-if="isNavDrawerOpen"
          class="absolute top-0 left-0 bottom-0 w-full max-w-[280px] bg-white dark:bg-brand-navy-950 border-r border-slate-200/80 dark:border-brand-navy-900/40 shadow-2xl text-slate-850 dark:text-white p-5 flex flex-col justify-between overflow-hidden pointer-events-auto"
        >
          <!-- Glowing accent corner -->
          <div class="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-brand-cyan/15 blur-2xl pointer-events-none"></div>
          
          <div>
            <!-- Close button & Logo -->
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-brand-navy-900">
              <div class="flex items-center gap-2">
                <img src="../assets/logo.svg" alt="Logo BMKG" class="w-7 h-7 object-contain" />
                <h2 class="text-sm font-black tracking-wider text-slate-850 dark:text-white">BMKG MENU</h2>
              </div>
              <button 
                id="nav-drawer-close-button"
                @click="isNavDrawerOpen = false"
                class="p-1.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300/30 dark:border-white/10 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Search bar in Drawer (visible on mobile only since hidden xl:block) -->
            <div class="mt-5 relative block xl:hidden">
              <LocationSearch 
                :is-mobile-drawer="true"
                @select-location="handleSelectLocation"
                @close-drawer="isNavDrawerOpen = false" 
              />
            </div>

            <!-- Drawer Navigation Links -->
            <nav class="mt-6 flex flex-col gap-2">
              <a 
                v-for="tab in ['Beranda', 'Weather for Traffic', 'Penerbangan', 'Maritim']" 
                :key="tab"
                :id="'nav-tab-drawer-' + tab.toLowerCase().replace(/ /g, '-')"
                href="#" 
                @click.prevent="handleTabClick(tab); isNavDrawerOpen = false"
                class="px-4 py-3 text-xs tracking-wide rounded-[4px] transition-all duration-200 flex items-center gap-3 font-bold cursor-pointer"
                :class="activeTab === tab 
                  ? 'bg-blue-50/90 text-blue-600 dark:bg-brand-cyan/10 dark:text-brand-cyan border-l-4 border-blue-600 dark:border-brand-cyan' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-brand-navy-900/40 hover:text-slate-800 dark:hover:text-white'"
              >
                <span 
                  v-if="activeTab === tab" 
                  class="w-[14px] h-[14px] rounded-full flex items-center justify-center border backdrop-blur-[2px] bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/30 shrink-0"
                >
                  <span class="relative flex h-1 w-1 shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-brand-cyan opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-1 w-1 bg-blue-600 dark:bg-brand-cyan"></span>
                  </span>
                </span>
                <span v-else class="w-[14px] h-[14px] rounded-full bg-transparent shrink-0"></span>
                {{ tab }}
              </a>
            </nav>
          </div>

          <!-- Footer info at the bottom of the drawer -->
          <div class="pt-4 border-t border-slate-100 dark:border-brand-navy-900 text-left">
            <p class="text-[9px] text-slate-400 dark:text-brand-navy-600 font-bold uppercase tracking-wider">Badan Meteorologi, Klimatologi & Geofisika</p>
            <p class="text-[9px] text-slate-500 mt-0.5">© 2026 BMKG Indonesia. All rights reserved.</p>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* Fade backdrop transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide left panel transition */
.slide-left-enter-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}
</style>

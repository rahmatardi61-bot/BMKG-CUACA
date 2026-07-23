<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, Sun, Moon, Bell, User, X, LogOut, Settings } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  darkMode: boolean;
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
  if (props.isLoggedIn) {
    showProfileDropdown.value = !showProfileDropdown.value;
  } else {
    emit('open-login');
  }
};

const handleLogout = () => {
  showProfileDropdown.value = false;
  emit('logout');
};
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b transition-all duration-300
    bg-white/80 dark:bg-brand-navy-950/80 backdrop-blur-md
    border-slate-200 dark:border-brand-navy-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative">
      
      <!-- Left: Logo & Title -->
      <div 
        id="nav-drawer-toggle-desktop"
        @click="isNavDrawerOpen = true"
        class="flex items-center gap-2.5 shrink-0 cursor-pointer group hover:opacity-95 select-none"
        title="Buka Menu"
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

      <!-- Center: Nav Links -->
      <nav class="hidden lg:flex items-center space-x-1.5 xl:space-x-2.5">
        <a 
          v-for="tab in ['Beranda', 'Weather for Traffic', 'Penerbangan', 'Maritim']" 
          :key="tab"
          :id="'nav-tab-desktop-' + tab.toLowerCase().replace(/ /g, '-')"
          href="#" 
          @click.prevent="handleTabClick(tab)"
          :class="[
            'px-3.5 py-2 text-xs tracking-wide rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 font-bold hover:scale-105 active:scale-95 active:duration-75 border',
            activeTab === tab 
              ? 'bg-blue-50/90 text-blue-600 border-blue-200/40 shadow-sm shadow-blue-500/5 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/20 dark:shadow-brand-cyan/5' 
              : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-brand-navy-900/40 hover:text-slate-800 dark:hover:text-white'
          ]"
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
          {{ tab }}
        </a>
      </nav>
      
      <!-- Center: Search bar (Mobile/Tablet only - centered and flexible width) -->
      <div class="flex-1 max-w-sm sm:max-w-md mx-2 sm:mx-8 lg:hidden relative transition-all duration-300">
        <input 
          id="search-input-mobile"
          type="text" 
          placeholder="Cari kelurahan/desa..." 
          class="w-full pl-9 pr-4 py-2 text-xs rounded-full border outline-none transition-all
            bg-slate-100/60 border-transparent text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:shadow-sm
            dark:bg-brand-navy-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-brand-navy-900 dark:focus:border-brand-cyan/40"
        />
        <Search class="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      </div>

      <!-- Right: Search, Actions (Desktop Search visible only on lg+) -->
      <div class="flex items-center gap-2 md:gap-3 shrink-0 ml-auto lg:ml-0">
        <!-- Search bar (Desktop only) -->
        <div class="relative hidden lg:block w-44 xl:w-56 transition-all duration-300">
          <input 
            id="search-input-desktop"
            type="text" 
            placeholder="Cari kelurahan/desa..." 
            class="w-full pl-9 pr-4 py-2 text-xs rounded-full border outline-none transition-all
              bg-slate-100/60 border-transparent text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:shadow-sm
              dark:bg-brand-navy-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-brand-navy-900 dark:focus:border-brand-cyan/40"
          />
          <Search class="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        </div>

        <!-- Notification Icon -->
        <button id="notification-button" class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-brand-navy-800 text-slate-500 dark:text-slate-300 relative transition-all active:scale-95 active:duration-75">
          <Bell class="w-4 h-4" />
          <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-brand-navy-950"></span>
        </button>

        <!-- Theme Toggle Button -->
        <button 
          id="theme-toggle-button"
          @click="emit('toggle-theme')" 
          class="p-1.5 rounded-full border transition-all duration-300
            bg-slate-50 border-slate-200 hover:bg-slate-100 text-amber-500
            dark:bg-brand-navy-900 dark:border-brand-navy-700 dark:hover:bg-brand-navy-800 dark:text-brand-cyan
            active:scale-95 active:duration-75"
          title="Ubah Tema"
        >
          <Sun v-if="darkMode" class="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
          <Moon v-else class="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
        </button>

        <!-- User Profile (Clickable Login Trigger / Profile Dropdown) -->
        <div v-if="isLoggedIn" class="relative">
          <button 
            id="user-profile-button"
            @click="handleUserClick" 
            class="w-7 h-7 rounded-full flex items-center justify-center shadow-sm shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border"
            :class="[
              isLoggedIn 
                ? 'bg-blue-600 border-blue-500 text-white font-extrabold text-[10px] tracking-tight dark:bg-brand-cyan dark:border-brand-cyan/60 dark:text-brand-navy-950'
                : 'bg-slate-100 dark:bg-brand-navy-900/60 border-slate-200/60 dark:border-brand-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-brand-navy-800/60'
            ]"
            :title="isLoggedIn ? 'Kelola Akun (' + userProfile?.name + ')' : 'Masuk ke Portal'"
          >
            <span v-if="isLoggedIn">{{ userInitials }}</span>
            <User v-else class="w-3.5 h-3.5" />
          </button>

          <!-- Profile Dropdown Menu -->
          <div 
            v-if="showProfileDropdown" 
            class="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden py-1.5 z-50 animate-fade-in
              bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
          >
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
          </div>
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
                class="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300/30 dark:border-white/10 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Search bar in Drawer (visible on mobile only since hidden xl:block) -->
            <div class="mt-5 relative block xl:hidden">
              <input 
                id="search-input-drawer"
                type="text" 
                placeholder="Cari kelurahan/desa..." 
                class="w-full pl-9 pr-4 py-2 text-xs rounded-full border outline-none transition-all
                  bg-slate-100/60 border-transparent text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:shadow-sm
                  dark:bg-brand-navy-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-brand-navy-900 dark:focus:border-brand-cyan/40"
              />
              <Search class="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </div>

            <!-- Drawer Navigation Links -->
            <nav class="mt-6 flex flex-col gap-2">
              <a 
                v-for="tab in ['Beranda', 'Weather for Traffic', 'Penerbangan', 'Maritim']" 
                :key="tab"
                :id="'nav-tab-drawer-' + tab.toLowerCase().replace(/ /g, '-')"
                href="#" 
                @click.prevent="handleTabClick(tab); isNavDrawerOpen = false"
                class="px-4 py-3 text-xs tracking-wide rounded-xl transition-all duration-200 flex items-center gap-3 font-bold cursor-pointer"
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

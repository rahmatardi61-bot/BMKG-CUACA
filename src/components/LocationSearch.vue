<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Search, 
  X, 
  MapPin, 
  Compass, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  Loader2,
  CornerDownLeft,
  ArrowLeft
} from 'lucide-vue-next';
import { 
  POPULAR_RECOMMENDATIONS, 
  filterLocalPOIs, 
  searchOnlinePOIs, 
  type SearchResultItem, 
  type POICategory 
} from '../data/poiSearchData';

const props = defineProps<{
  placeholder?: string;
  isMobileDrawer?: boolean;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-location', location: string): void;
  (e: 'close-drawer'): void;
}>();

// Search state
const searchQuery = ref('');
const isDropdownOpen = ref(false);
const activeCategory = ref<POICategory>('all');
const searchInputRef = ref<HTMLInputElement | null>(null);
const mobileSearchInputRef = ref<HTMLInputElement | null>(null);
const searchContainerRef = ref<HTMLElement | null>(null);
const highlightedIndex = ref(-1);
const isLoadingOnline = ref(false);

// Animated placeholder cues
const placeholderCues = [
  'Cari kelurahan/desa...',
  'Cari nama tempat...'
];
const currentCueIndex = ref(0);
let cueIntervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  cueIntervalId = setInterval(() => {
    currentCueIndex.value = (currentCueIndex.value + 1) % placeholderCues.length;
  }, 3500);

  loadRecentSearches();

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && isDropdownOpen.value) {
      closeSearch();
    }
  };
  window.addEventListener('keydown', handleGlobalKeydown);

  onUnmounted(() => {
    if (cueIntervalId) clearInterval(cueIntervalId);
    window.removeEventListener('keydown', handleGlobalKeydown);
  });
});

const currentPlaceholder = computed(() => {
  return props.placeholder || placeholderCues[currentCueIndex.value];
});

// Category pills: Hanya Semua, Kelurahan / Desa, dan Nama Tempat
const categoryTabs: { id: POICategory; label: string; icon: any }[] = [
  { id: 'all', label: 'Semua', icon: Sparkles },
  { id: 'wilayah', label: 'Kelurahan / Desa', icon: MapPin },
  { id: 'tempat', label: 'Nama Tempat', icon: Building2 }
];

// Recent Searches (Stored in localStorage)
const recentSearches = ref<string[]>([]);
const STORAGE_KEY = 'bmkg_recent_searches_v1';

const loadRecentSearches = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      recentSearches.value = JSON.parse(raw);
    }
  } catch (e) {
    recentSearches.value = [];
  }
};

const saveRecentSearch = (name: string) => {
  try {
    const filtered = recentSearches.value.filter(s => s.toLowerCase() !== name.toLowerCase());
    filtered.unshift(name);
    recentSearches.value = filtered.slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches.value));
  } catch (e) {
    // Ignore storage quota
  }
};

const removeRecentSearch = (name: string, event: MouseEvent) => {
  event.stopPropagation();
  recentSearches.value = recentSearches.value.filter(s => s !== name);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches.value));
  } catch (e) {
    // Ignore
  }
};

const clearAllRecent = () => {
  recentSearches.value = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
};

// Search results state
const onlineResults = ref<SearchResultItem[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Combined results: local results first (immediate 0ms), then online OSM results
const displayedResults = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) {
    if (activeCategory.value === 'all') {
      return POPULAR_RECOMMENDATIONS;
    }
    return filterLocalPOIs('', activeCategory.value).slice(0, 8);
  }

  const local = filterLocalPOIs(query, activeCategory.value);
  
  // Deduplicate online results that might match local names
  const localNames = new Set(local.map(l => l.name.toLowerCase()));
  const uniqueOnline = onlineResults.value.filter(
    o => !localNames.has(o.name.toLowerCase())
  );

  return [...local, ...uniqueOnline].slice(0, 10);
});

// Watch query for live debounced online search
watch([searchQuery, activeCategory], ([newQuery, newCat]) => {
  highlightedIndex.value = -1;
  const cleanQ = newQuery.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (cleanQ.length < 3) {
    onlineResults.value = [];
    isLoadingOnline.value = false;
    return;
  }

  isLoadingOnline.value = true;
  debounceTimer = setTimeout(async () => {
    const res = await searchOnlinePOIs(cleanQ, newCat);
    onlineResults.value = res;
    isLoadingOnline.value = false;
  }, 320);
});

// Open & close handlers
const openSearch = () => {
  isDropdownOpen.value = true;
  if (props.isMobile) {
    document.body.classList.add('overflow-hidden');
  }
  nextTick(() => {
    if (props.isMobile) {
      mobileSearchInputRef.value?.focus();
    } else {
      searchInputRef.value?.focus();
    }
  });
};

const closeSearch = () => {
  isDropdownOpen.value = false;
  highlightedIndex.value = -1;
  document.body.classList.remove('overflow-hidden');
};

const clearQuery = () => {
  searchQuery.value = '';
  onlineResults.value = [];
  if (props.isMobile) {
    mobileSearchInputRef.value?.focus();
  } else {
    searchInputRef.value?.focus();
  }
};

// Select a location item
const handleSelect = (item: SearchResultItem | string) => {
  const address = typeof item === 'string' ? item : item.fullAddress;
  saveRecentSearch(typeof item === 'string' ? item : item.name);
  emit('select-location', address);
  emit('close-drawer');
  closeSearch();
  searchQuery.value = '';
};

// Category badge helpers
const getCategoryIcon = (cat: SearchResultItem['category']) => {
  return cat === 'tempat' ? Building2 : MapPin;
};

const getCategoryStyle = (cat: SearchResultItem['category']) => {
  return cat === 'tempat'
    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
    : 'bg-blue-500/10 text-blue-600 dark:text-brand-cyan border-blue-200 dark:border-blue-800/40';
};

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!isDropdownOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      openSearch();
    }
    return;
  }

  const list = displayedResults.value;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (list.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % list.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (list.length > 0) {
      highlightedIndex.value = (highlightedIndex.value - 1 + list.length) % list.length;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex.value >= 0 && highlightedIndex.value < list.length) {
      handleSelect(list[highlightedIndex.value]);
    } else if (searchQuery.value.trim()) {
      handleSelect(searchQuery.value.trim());
    }
  } else if (e.key === 'Escape') {
    closeSearch();
  }
};

// Click outside handling
const handleClickOutside = (e: MouseEvent) => {
  if (props.isMobile) {
    return; // Handled by dedicated mobile backdrop & cancel button
  }
  if (
    searchContainerRef.value && 
    !searchContainerRef.value.contains(e.target as Node)
  ) {
    closeSearch();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.body.classList.remove('overflow-hidden');
});
</script>

<template>
  <div 
    ref="searchContainerRef"
    class="relative w-full transition-all duration-300 select-none"
  >
    <!-- ─── Search Input Bar ─── -->
    <div 
      class="relative flex items-center bg-slate-100/60 dark:bg-brand-navy-900/60 border border-slate-200/80 dark:border-white/10 rounded-[4px] pl-3.5 pr-1.5 py-1.5 transition-all duration-300 shadow-sm"
      :class="[
        isDropdownOpen ? 'bg-white dark:bg-brand-navy-900 border-blue-500/80 dark:border-brand-cyan/60 ring-2 ring-blue-500/15 dark:ring-brand-cyan/20 shadow-md' : 'hover:border-slate-300 dark:hover:border-white/20'
      ]"
    >
      <!-- Search Icon with subtle spinner when searching online -->
      <div class="shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 mr-2.5">
        <Loader2 v-if="isLoadingOnline" class="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-brand-cyan" />
        <Search v-else class="w-3.5 h-3.5" />
      </div>

      <!-- Input Text Field -->
      <input 
        :id="isMobileDrawer ? 'search-input-drawer' : (isMobile ? 'search-input-mobile' : 'search-input-desktop')"
        ref="searchInputRef"
        v-model="searchQuery"
        type="text" 
        :placeholder="currentPlaceholder" 
        @focus="openSearch"
        @keydown="handleKeydown"
        class="w-full bg-transparent border-none outline-none text-[16px] lg:text-xs placeholder:text-[11.5px] sm:placeholder:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pr-1 sm:pr-2"
        autocomplete="off"
        spellcheck="false"
      />

      <!-- Clear Query Button -->
      <button 
        v-if="searchQuery"
        @click="clearQuery"
        class="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors mr-1 cursor-pointer shrink-0"
        title="Bersihkan"
      >
        <X class="w-3.5 h-3.5" />
      </button>

      <!-- Keyboard Shortcut Badge (Desktop Only) -->
      <div 
        v-if="!searchQuery && !isMobileDrawer"
        class="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-slate-200/60 dark:bg-white/10 text-[9px] font-mono text-slate-400 dark:text-slate-400 border border-slate-300/40 dark:border-white/5 mr-1.5 shrink-0 select-none"
      >
        <span class="text-[8px]">Ctrl</span>
        <span>K</span>
      </div>

      <!-- Elegant 'Cari' Action Button (Desktop Only, hidden on mobile to avoid squishing input) -->
      <button 
        @click="openSearch(); if (searchQuery.trim()) handleSelect(searchQuery.trim())"
        class="hidden sm:flex bg-blue-500 hover:bg-blue-600 dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 text-white dark:text-brand-navy-950 px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 duration-200 shadow-sm shrink-0 cursor-pointer items-center gap-1"
      >
        <span>Cari</span>
      </button>
    </div>

    <!-- ─── Desktop Floating Modern Autocomplete / Spotlight Dropdown ─── -->
    <Transition
      v-if="!isMobile"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-2"
    >
      <div 
        v-if="isDropdownOpen"
        class="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white dark:bg-[#070c19] border border-slate-200 dark:border-white/20 rounded-[4px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.95)] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col max-h-[480px] w-full min-w-[320px] sm:min-w-[420px] md:min-w-[480px]"
        :class="[
          isMobileDrawer ? 'left-0 right-0' : 'md:-left-12 md:-right-12'
        ]"
      >
        <!-- Header: Category Filter Tabs -->
        <div class="px-3 pt-3 pb-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#0b1326]">
          <div class="flex items-center justify-between gap-2 mb-2 px-1">
            <span class="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Compass class="w-3 h-3 text-blue-500 dark:text-brand-cyan" />
              Kategori Pencarian
            </span>
            <span v-if="isLoadingOnline" class="text-[9px] text-blue-500 dark:text-brand-cyan flex items-center gap-1 font-bold animate-pulse">
              <Loader2 class="w-2.5 h-2.5 animate-spin" />
              Mencari Maps...
            </span>
          </div>

          <!-- Category Chips Horizontal Scroll -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              v-for="tab in categoryTabs"
              :key="tab.id"
              @click="activeCategory = tab.id"
              class="px-2.5 py-1 rounded-[4px] text-[10px] font-bold tracking-tight shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border"
              :class="[
                activeCategory === tab.id
                  ? 'bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950 border-transparent shadow-sm'
                  : 'bg-white dark:bg-[#121c33] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              ]"
            >
              <component :is="tab.icon" class="w-3 h-3" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Dropdown Body Scrollable -->
        <div class="overflow-y-auto max-h-[380px] p-2 space-y-3 bg-white dark:bg-[#070c19]">
          
          <!-- ─── 1. Recent Searches (if query is empty and has recents) ─── -->
          <div v-if="!searchQuery && recentSearches.length > 0" class="px-1.5 pt-1">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Clock class="w-3 h-3 text-slate-400" />
                Pencarian Terakhir
              </span>
              <button 
                @click="clearAllRecent"
                class="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="item in recentSearches"
                :key="item"
                @click="handleSelect(item)"
                class="group px-2.5 py-1 rounded-[4px] bg-slate-100 dark:bg-[#0e1933] hover:bg-blue-50 dark:hover:bg-brand-cyan/15 border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-brand-cyan flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Clock class="w-3 h-3 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-brand-cyan" />
                <span class="truncate max-w-[180px]">{{ item }}</span>
                <X 
                  @click="removeRecentSearch(item, $event)" 
                  class="w-2.5 h-2.5 text-slate-400 hover:text-rose-500 transition-colors ml-0.5" 
                />
              </button>
            </div>
          </div>

          <!-- ─── 2. Search Results List ─── -->
          <div>
            <div class="px-1.5 py-1 flex items-center justify-between">
              <span class="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Sparkles v-if="!searchQuery" class="w-3 h-3 text-amber-500" />
                <Building2 v-else class="w-3 h-3 text-blue-500 dark:text-brand-cyan" />
                {{ searchQuery ? `Hasil Pencarian (${displayedResults.length})` : 'Rekomendasi Tempat & Wilayah' }}
              </span>
              <span v-if="searchQuery" class="text-[9px] text-slate-400 dark:text-slate-500">
                Pilih untuk cuaca realtime
              </span>
            </div>

            <!-- List Items -->
            <div class="space-y-1 mt-1">
              <button
                v-for="(item, idx) in displayedResults"
                :key="item.id"
                @click="handleSelect(item)"
                @mouseenter="highlightedIndex = idx"
                class="w-full p-2.5 rounded-[4px] text-left flex items-start gap-3 transition-all cursor-pointer border group"
                :class="[
                  highlightedIndex === idx
                    ? 'bg-blue-500/15 dark:bg-brand-cyan/20 border-blue-500/50 dark:border-brand-cyan/60 shadow-sm translate-x-0.5'
                    : 'bg-slate-50/70 dark:bg-[#0a1122] border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#101b36] hover:border-blue-500/30 dark:hover:border-brand-cyan/40'
                ]"
              >
                <!-- Category Icon Badge -->
                <div 
                  class="w-8 h-8 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105 shadow-sm"
                  :class="getCategoryStyle(item.category)"
                >
                  <component :is="getCategoryIcon(item.category)" class="w-4 h-4" />
                </div>

                <!-- Text info: Name, Category, Sublocation -->
                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-brand-cyan transition-colors">
                      {{ item.name }}
                    </span>
                    <!-- Type Badge -->
                    <span 
                      v-if="item.tag" 
                      class="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border shrink-0"
                      :class="getCategoryStyle(item.category)"
                    >
                      {{ item.tag }}
                    </span>
                  </div>

                  <!-- Sub Location (Kecamatan / Kabupaten / Kota) -->
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate leading-tight">
                    {{ item.subLocation }}
                  </p>
                </div>

                <!-- Right Action Indicator -->
                <div class="shrink-0 flex items-center gap-1 mt-1.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-brand-cyan transition-colors">
                  <span class="text-[9px] font-bold hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat Cuaca
                  </span>
                  <ChevronRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>

            <!-- Empty State -->
            <div 
              v-if="displayedResults.length === 0 && !isLoadingOnline"
              class="py-8 px-4 text-center flex flex-col items-center justify-center gap-2"
            >
              <div class="w-10 h-10 rounded-[4px] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                <Search class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tidak ditemukan tempat dengan kata kunci "{{ searchQuery }}"
                </p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[280px] mx-auto">
                  Coba ketik nama kelurahan, desa, atau nama tempat, atau tekan Enter untuk mencari langsung ke BMKG.
                </p>
              </div>
              <button 
                @click="handleSelect(searchQuery)"
                class="mt-2 px-3 py-1.5 rounded-[4px] bg-blue-500 dark:bg-brand-cyan text-white dark:text-brand-navy-950 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Pakai "{{ searchQuery }}" Langsung</span>
                <CornerDownLeft class="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        <!-- Dropdown Footer / Keyboard Tips -->
        <div class="px-3 py-2 border-t border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#0b1326] flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded-[4px] bg-slate-200 dark:bg-white/10 font-mono text-[8px]">↑↓</kbd> Navigasi
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded-[4px] bg-slate-200 dark:bg-white/10 font-mono text-[8px]">Enter</kbd> Pilih
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded-[4px] bg-slate-200 dark:bg-white/10 font-mono text-[8px]">Esc</kbd> Tutup
            </span>
          </div>

          <span class="text-[8.5px] font-semibold text-blue-500 dark:text-brand-cyan flex items-center gap-1">
            <Sparkles class="w-2.5 h-2.5" />
            BMKG Realtime Maps POI
          </span>
        </div>
      </div>
    </Transition>

    <!-- ─── Mobile Full-Screen Modern Search Overlay (Teleported to body) ─── -->
    <Teleport to="body" v-if="isMobile">
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-[0.98]"
      >
        <div 
          v-if="isDropdownOpen"
          class="fixed inset-0 z-[99999] bg-slate-950 dark:bg-[#070c19] flex flex-col text-slate-100 overflow-hidden"
          style="padding-top: max(env(safe-area-inset-top, 0px), 8px); padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);"
        >
          <!-- Mobile Search Header Bar -->
          <div class="px-3 py-2.5 flex items-center gap-2 border-b border-white/10 bg-slate-900 dark:bg-[#0b1326] shrink-0">
            <!-- Back Button -->
            <button 
              @click="closeSearch"
              class="w-9 h-9 rounded-[4px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>

            <!-- Search Input Box -->
            <div class="flex-1 flex items-center bg-white/10 dark:bg-white/5 border border-white/15 focus-within:border-brand-cyan rounded-[4px] px-3 py-2 gap-2 transition-all">
              <Loader2 v-if="isLoadingOnline" class="w-4 h-4 animate-spin text-brand-cyan shrink-0" />
              <Search v-else class="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                ref="mobileSearchInputRef"
                v-model="searchQuery"
                type="text"
                :placeholder="currentPlaceholder"
                @keydown="handleKeydown"
                class="w-full bg-transparent border-none outline-none text-[16px] text-white placeholder-slate-400 placeholder:text-xs"
                autocomplete="off"
                spellcheck="false"
              />
              <button 
                v-if="searchQuery"
                @click="clearQuery"
                class="p-1 rounded-[4px] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Batal Button -->
            <button 
              @click="closeSearch"
              class="text-xs font-bold text-slate-300 hover:text-white px-2 py-1.5 shrink-0 cursor-pointer"
            >
              Batal
            </button>
          </div>

          <!-- Mobile Category Tabs (Horizontal Scrollable) -->
          <div class="px-3 py-2 border-b border-white/10 bg-slate-900/80 dark:bg-[#080e1c] shrink-0">
            <div class="flex items-center justify-between gap-2 mb-1.5 px-0.5">
              <span class="text-[9.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass class="w-3 h-3 text-brand-cyan" />
                Kategori Pencarian
              </span>
              <span v-if="isLoadingOnline" class="text-[9px] text-brand-cyan flex items-center gap-1 font-bold animate-pulse">
                <Loader2 class="w-2.5 h-2.5 animate-spin" />
                Mencari...
              </span>
            </div>

            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                v-for="tab in categoryTabs"
                :key="tab.id"
                @click="activeCategory = tab.id"
                class="px-3 py-1 rounded-[4px] text-[11px] font-bold tracking-tight shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border"
                :class="[
                  activeCategory === tab.id
                    ? 'bg-brand-cyan text-brand-navy-950 border-transparent shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                ]"
              >
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </div>

          <!-- Mobile Scrollable Results Body -->
          <div class="flex-1 overflow-y-auto p-3 space-y-3 overscroll-contain">
            <!-- Recent Searches -->
            <div v-if="!searchQuery && recentSearches.length > 0" class="px-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock class="w-3 h-3 text-slate-400" />
                  Pencarian Terakhir
                </span>
                <button 
                  @click="clearAllRecent"
                  class="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Hapus Semua
                </button>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="item in recentSearches"
                  :key="item"
                  @click="handleSelect(item)"
                  class="group px-3 py-1.5 rounded-[4px] bg-slate-900 dark:bg-[#0e1933] hover:bg-slate-800 dark:hover:bg-[#142347] border border-white/10 text-xs font-semibold text-slate-200 hover:text-brand-cyan flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Clock class="w-3 h-3 text-slate-400 group-hover:text-brand-cyan" />
                  <span class="truncate max-w-[200px]">{{ item }}</span>
                  <X 
                    @click.stop="removeRecentSearch(item, $event)" 
                    class="w-3 h-3 text-slate-400 hover:text-rose-400 transition-colors" 
                  />
                </button>
              </div>
            </div>

            <!-- Results List -->
            <div>
              <div class="px-0.5 py-1 flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles v-if="!searchQuery" class="w-3 h-3 text-amber-400" />
                  <Building2 v-else class="w-3 h-3 text-brand-cyan" />
                  {{ searchQuery ? `Hasil Pencarian (${displayedResults.length})` : 'Rekomendasi Tempat & Wilayah' }}
                </span>
                <span v-if="searchQuery" class="text-[9.5px] text-slate-400">
                  Pilih lokasi
                </span>
              </div>

              <!-- List Items (Full width on smartphone, no ugly cutoffs!) -->
              <div class="space-y-1.5 mt-1.5">
                <button
                  v-for="item in displayedResults"
                  :key="item.id"
                  @click="handleSelect(item)"
                  class="w-full p-3 rounded-[4px] text-left flex items-start gap-3 transition-all cursor-pointer border border-white/10 bg-[#0a1122] active:bg-brand-cyan/20 active:border-brand-cyan/50 shadow-sm"
                >
                  <!-- Category Icon Badge -->
                  <div 
                    class="w-8 h-8 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                    :class="getCategoryStyle(item.category)"
                  >
                    <component :is="getCategoryIcon(item.category)" class="w-4 h-4" />
                  </div>

                  <!-- Text info: Full name & Sublocation -->
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-black text-white leading-snug">
                        {{ item.name }}
                      </span>
                      <span 
                        v-if="item.tag" 
                        class="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border shrink-0"
                        :class="getCategoryStyle(item.category)"
                      >
                        {{ item.tag }}
                      </span>
                    </div>

                    <p class="text-[11px] text-slate-400 font-medium leading-tight">
                      {{ item.subLocation }}
                    </p>
                  </div>

                  <!-- Right Action Indicator -->
                  <div class="shrink-0 flex items-center text-slate-500 mt-1">
                    <ChevronRight class="w-4 h-4" />
                  </div>
                </button>
              </div>

              <!-- Empty State -->
              <div 
                v-if="displayedResults.length === 0 && !isLoadingOnline"
                class="py-10 px-4 text-center flex flex-col items-center justify-center gap-2.5"
              >
                <div class="w-11 h-11 rounded-[4px] bg-white/5 flex items-center justify-center text-slate-400">
                  <Search class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-200">
                    Tidak ditemukan tempat dengan kata kunci "{{ searchQuery }}"
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                    Coba ketik nama kelurahan, desa, atau nama tempat, atau tekan tombol di bawah untuk mencari langsung ke BMKG.
                  </p>
                </div>
                <button 
                  @click="handleSelect(searchQuery)"
                  class="mt-2 px-3.5 py-2 rounded-[4px] bg-brand-cyan text-brand-navy-950 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <span>Pakai "{{ searchQuery }}" Langsung</span>
                  <CornerDownLeft class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Footer -->
          <div class="px-4 py-2.5 border-t border-white/10 bg-slate-950 dark:bg-[#0b1326] flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span class="text-brand-cyan font-bold flex items-center gap-1.5">
              <Sparkles class="w-3 h-3" />
              BMKG Realtime Maps POI
            </span>
            <span>Ketuk lokasi untuk melihat cuaca</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Custom mini scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Prevent auto-zoom in mobile browsers by ensuring 16px font-size */
@media (max-width: 1023px) {
  input {
    font-size: 16px !important;
  }
}
</style>

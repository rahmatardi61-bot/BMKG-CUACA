<script setup lang="ts">
import { Calendar, ArrowRight } from 'lucide-vue-next';
import type { NewsArticle } from '../types/weather';

defineProps<{
  articles: NewsArticle[];
}>();

// Map category colors
const getCategoryClass = (category: string) => {
  switch (category) {
    case 'Iklim':
      return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'Gempabumi':
      return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
    case 'Teknologi':
      return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header Section -->
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Berita & Pengumuman</h3>
      <a href="#" class="text-xs font-semibold text-blue-600 dark:text-brand-cyan hover:underline flex items-center gap-0.5">
        <span>Semua Berita</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </a>
    </div>

    <!-- 3-Column News Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="article in articles" 
        :key="article.id"
        class="bg-white/90 dark:bg-brand-navy-900/90 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-[box-shadow] duration-300 flex flex-col group no-blur"
      >
        <!-- Article Image Thumbnail -->
        <div class="relative h-44 overflow-hidden bg-slate-100/60 dark:bg-brand-navy-950 shrink-0">
          <img 
            :src="article.imageUrl" 
            :alt="article.title"
            class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            loading="lazy"
          />
          <!-- Category Floating Overlay Badge -->
          <span 
            class="absolute top-3.5 left-3.5 text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-sm border-0"
            :class="getCategoryClass(article.category)"
          >
            {{ article.category }}
          </span>
        </div>

        <!-- Content Details -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            <!-- Article Date -->
            <div class="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ article.date }}</span>
            </div>

            <!-- Title -->
            <h4 class="text-sm font-bold text-slate-800 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-brand-cyan transition-colors line-clamp-2">
              {{ article.title }}
            </h4>

            <!-- Short Summary -->
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {{ article.summary }}
            </p>
          </div>

          <!-- Bottom Action link -->
          <div class="border-t border-slate-100/50 dark:border-brand-navy-700/20 pt-3 flex items-center">
            <a 
              href="#" 
              class="text-xs font-semibold text-blue-600 dark:text-brand-cyan hover:text-blue-700 dark:hover:text-brand-cyan/85 transition-colors flex items-center gap-1 group-hover:translate-x-0.5 duration-300"
            >
              <span>Baca Artikel</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

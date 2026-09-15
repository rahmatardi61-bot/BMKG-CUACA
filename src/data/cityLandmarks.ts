export const cityLandmarks = [
  {
    name: 'Jakarta',
    fullName: 'DKI Jakarta',
    color: 'text-blue-500 dark:text-blue-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <!-- Flame / Api Emas di puncak -->
      <path d="M12 2c0 0 1.2 1.5 1 2.5-.2 1-1 1.2-1 1.2s-.8-.2-1-1.2C10.8 3.5 12 2 12 2z" fill="currentColor" opacity="0.9" stroke="none"/>
      <!-- Obelisk body - tapered -->
      <path d="M11 5.7h2v1.8h-2z"/>
      <path d="M10.5 7.5h3v1.5h-3z"/>
      <path d="M10 9h4l.5 8h-5z"/>
      <!-- Pedestal base -->
      <path d="M8.5 17h7v1.5h-7z"/>
      <path d="M7 18.5h10V21H7z"/>
    </svg>`
  },
  {
    name: 'Surabaya',
    fullName: 'Surabaya',
    color: 'text-cyan-500 dark:text-cyan-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <!-- Jembatan Suramadu (cable-stayed bridge) -->
      <!-- Left tower -->
      <path d="M7 5v10"/>
      <!-- Right tower -->
      <path d="M17 5v10"/>
      <!-- Tower crossbar -->
      <path d="M6 7h2M16 7h2"/>
      <!-- Left cables -->
      <path d="M7 5L2 15M7 5L5 15M7 5L9 15"/>
      <!-- Right cables -->
      <path d="M17 5L22 15M17 5L19 15M17 5L15 15"/>
      <!-- Bridge deck -->
      <path d="M2 15h20"/>
      <!-- Ground/base -->
      <path d="M1 17h22" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'Bandung',
    fullName: 'Bandung',
    color: 'text-emerald-500 dark:text-emerald-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M12 2v5"/>
      <circle cx="12" cy="3" r="0.7" fill="currentColor"/>
      <circle cx="12" cy="4.5" r="0.7" fill="currentColor"/>
      <path d="M6 7h12v3H6z"/>
      <path d="M4 10h16v6H4z"/>
      <path d="M8 10v6M12 10v6M16 10v6"/>
      <path d="M3 16h18v4H3z"/>
    </svg>`
  },
  {
    name: 'Medan',
    fullName: 'Medan',
    color: 'text-amber-500 dark:text-amber-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M3 14h18v6H3z"/>
      <path d="M12 3v3"/>
      <path d="M3 14c2-4 5-6 9-6s7 2 9 6"/>
      <path d="M8 14v6M16 14v6"/>
      <path d="M6 16a2 2 0 0 1 4 0M14 16a2 2 0 0 1 4 0"/>
    </svg>`
  },
  {
    name: 'Semarang',
    fullName: 'Semarang',
    color: 'text-purple-500 dark:text-purple-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <rect x="3" y="10" width="4" height="10" rx="0.5"/>
      <rect x="17" y="10" width="4" height="10" rx="0.5"/>
      <path d="M3 10V8a2 2 0 0 1 4 0v2"/>
      <path d="M17 10V8a2 2 0 0 1 4 0v2"/>
      <path d="M7 14h10"/>
      <path d="M7 17h10"/>
      <path d="M7 14c0-4 10-4 10 0"/>
      <path d="M5 20h14"/>
    </svg>`
  },
  {
    name: 'Makassar',
    fullName: 'Makassar',
    color: 'text-red-500 dark:text-red-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M3 16c4 1 12 1 18 0l-2 5H5l-2-5z" fill="currentColor" opacity="0.15"/>
      <path d="M11 3v13M16 6v10"/>
      <path d="M11 3L3 13h8z" fill="currentColor" opacity="0.1"/>
      <path d="M16 6l-4 8h4z"/>
      <path d="M11 6l-6 7h6z"/>
    </svg>`
  },
  {
    name: 'Palembang',
    fullName: 'Palembang',
    color: 'text-orange-500 dark:text-orange-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 17h20M7 8v9M17 8v9"/>
      <path d="M7 8h10M5 12h14"/>
      <path d="M7 8l-5 4M17 8l5 4"/>
      <path d="M2 21h20" stroke-width="1" opacity="0.6"/>
    </svg>`
  },
  {
    name: 'Batam',
    fullName: 'Batam',
    color: 'text-indigo-500 dark:text-indigo-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 16h20"/>
      <path d="M8 16V8M16 16V8"/>
      <path d="M8 8l-6 8M8 8l8 8M16 8l-8 8M16 8l6 8"/>
      <path d="M2 19h20" stroke-width="1" opacity="0.5"/>
      <path d="M6 19v2M18 19v2"/>
      <rect x="7" y="6" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.7"/>
      <rect x="15" y="6" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.7"/>
    </svg>`
  },
  {
    name: 'Pekanbaru',
    fullName: 'Pekanbaru',
    color: 'text-teal-500 dark:text-teal-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M6 15h12v5H6z"/>
      <path d="M12 4v3"/>
      <path d="M6 15a6 6 0 0 1 12 0H6z" fill="currentColor" opacity="0.2"/>
      <path d="M20 8v12M4 8v12"/>
      <path d="M20 8l-2 3M4 8l2 3"/>
    </svg>`
  },
  {
    name: 'Denpasar',
    fullName: 'Denpasar',
    color: 'text-rose-500 dark:text-rose-400',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M12 2l-1 2h2l-1-2z" fill="currentColor" opacity="0.8"/>
      <path d="M10 4h4v1.5h-4z"/>
      <path d="M9 5.5h6v2H9z"/>
      <path d="M7.5 7.5h9v2h-9z"/>
      <path d="M6 9.5h12v2H6z"/>
      <path d="M5 11.5h14v2.5H5z"/>
      <path d="M4 14h16v6H4z" rx="0.5"/>
      <path d="M2 20h20"/>
    </svg>`
  }
];

export interface CityTheme {
  cardBg: string;
  landmarkSvg: string;
}

const jakartaTheme: CityTheme = {
  cardBg: 'from-indigo-50/90 via-purple-50/90 to-pink-50/90 text-indigo-950 border border-purple-100/50 shadow-purple-500/5 dark:from-indigo-950/85 dark:via-purple-950/75 dark:to-pink-950/40 dark:text-pink-100 dark:border-purple-900/30 dark:shadow-purple-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="jkSun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fdba74" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
      <linearGradient id="jkFlame" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#area580c" stop-color="#ea580c" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>
      <linearGradient id="jkShaft" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cbd5e1" />
        <stop offset="35%" stop-color="#f1f5f9" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="85%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <linearGradient id="jkCup" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#94a3b8" />
        <stop offset="50%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>
    </defs>
    <circle cx="76" cy="32" r="16" fill="url(#jkSun)" opacity="0.9" />
    <path d="M 58 40 C 64 32, 80 32, 86 40 C 92 40, 94 46, 88 50 C 88 52, 58 52, 58 40 Z" fill="#ffffff" opacity="0.45" />
    <path d="M 25 24 C 30 18, 42 18, 46 24 C 50 24, 52 28, 48 31 H 23 Z" fill="#ffffff" opacity="0.25" />
    <rect x="10" y="86" width="80" height="4" rx="1.5" fill="#94a3b8" />
    <rect x="18" y="78" width="64" height="8" rx="1" fill="#cbd5e1" />
    <rect x="26" y="72" width="48" height="6" rx="1" fill="#e2e8f0" />
    <path d="M 32 72 L 37 60 L 63 60 L 68 72 Z" fill="url(#jkCup)" />
    <path d="M 36 60 L 64 60 L 60 72 L 40 72 Z" fill="#ffffff" opacity="0.3" />
    <path d="M 46 25 L 47 60 L 53 60 L 54 25 Z" fill="url(#jkShaft)" />
    <path d="M 42 25 L 45 20 L 55 20 L 58 25 Z" fill="url(#jkCup)" />
    <circle cx="50" cy="11" r="9" fill="#fef08a" opacity="0.4" />
    <path d="M 50 2 C 43 9, 47 20, 50 20 C 53 20, 57 9, 50 2 Z" fill="url(#jkFlame)" />
    <path d="M 50 7 C 46 11, 48 20, 50 20 C 52 20, 54 11, 50 7 Z" fill="#facc15" />
    <path d="M 50 12 C 48 14, 49 20, 50 20 C 51 20, 52 14, 50 12 Z" fill="#ffffff" opacity="0.8" />
  `
};

const surabayaTheme: CityTheme = {
  cardBg: 'from-teal-50/90 via-cyan-50/90 to-blue-50/90 text-cyan-950 border border-cyan-100/50 shadow-cyan-500/5 dark:from-teal-950/80 dark:via-cyan-950/75 dark:to-blue-950/40 dark:text-cyan-100 dark:border-cyan-900/30 dark:shadow-cyan-950/40',
  landmarkSvg: `
    <defs>
      <radialGradient id="sbyGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="sbyShark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>
      <linearGradient id="sbyCroc" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="50%" stop-color="#059669" />
        <stop offset="100%" stop-color="#064e3b" />
      </linearGradient>
      <linearGradient id="sbySeaweed" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a3e635" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>
      <linearGradient id="sbyWater" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="55" r="38" fill="url(#sbyGlow)" />
    <path d="M 47 25 Q 42 45 47 65 Q 52 75 47 85" stroke="url(#sbySeaweed)" stroke-width="5" fill="none" stroke-linecap="round" />
    <path d="M 53 30 Q 58 48 53 66 Q 48 76 53 82" stroke="url(#sbySeaweed)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7" />
    <path d="M 44 65 C 26 65 14 50 22 30 C 26 22, 38 24, 46 34 C 41 42, 38 52, 44 60 Z" fill="url(#sbyShark)" />
    <path d="M 23 42 L 11 38 L 17 48 Z" fill="#0284c7" />
    <path d="M 16 26 L 8 20 L 14 32 Z" fill="#0369a1" />
    <circle cx="34" cy="34" r="2" fill="#ffffff" />
    <circle cx="34" cy="34" r="0.75" fill="#000000" />
    <path d="M 37 40 C 34 40, 32 44, 30 46" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
    <path d="M 56 75 C 74 75 86 60 78 40 C 74 32, 62 34, 54 44 C 59 52, 62 62, 56 70 Z" fill="url(#sbyCroc)" />
    <path d="M 77 50 L 88 46 L 82 56 Z" fill="#047857" />
    <path d="M 82 62 L 91 58 L 86 67 Z" fill="#065f46" />
    <circle cx="66" cy="42" r="2" fill="#ffffff" />
    <circle cx="66" cy="42" r="0.75" fill="#000000" />
    <path d="M 60 48 Q 63 52 66 48" stroke="#10b981" stroke-width="1.5" fill="none" stroke-linecap="round" />
    <path d="M 0 80 C 15 76, 25 84, 40 80 C 55 76, 65 84, 80 80 C 90 76, 100 80, 100 80 L 100 100 L 0 100 Z" fill="url(#sbyWater)" />
    <path d="M 0 85 C 15 81, 25 89, 40 85 C 55 81, 65 89, 80 85 C 95 81, 100 85, 100 85 L 100 100 L 0 100 Z" fill="#22d3ee" opacity="0.5" />
    <circle cx="28" cy="72" r="2" fill="#ffffff" opacity="0.6" />
    <circle cx="72" cy="74" r="1.5" fill="#ffffff" opacity="0.7" />
    <circle cx="50" cy="80" r="1.2" fill="#ffffff" opacity="0.8" />
  `
};

const bandungTheme: CityTheme = {
  cardBg: 'from-emerald-50/90 via-teal-50/90 to-cyan-50/90 text-emerald-950 border border-emerald-100/50 shadow-emerald-500/5 dark:from-emerald-950/80 dark:via-teal-950/75 dark:to-cyan-950/40 dark:text-emerald-100 dark:border-teal-900/30 dark:shadow-teal-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="bdSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffedd5" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#fdba74" stop-opacity="0.3" />
      </linearGradient>
      <linearGradient id="bdRoof" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ea580c" />
        <stop offset="100%" stop-color="#991b1b" />
      </linearGradient>
      <linearGradient id="bdWalls" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>
      <radialGradient id="bdSatayBall" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="40%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#854d0e" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="36" fill="url(#bdSun)" />
    <path d="M 8 36 C 18 30, 28 30, 32 36 C 36 36, 38 40, 35 44 H 5 Z" fill="#ffffff" opacity="0.35" />
    <rect x="5" y="76" width="90" height="12" rx="2" fill="url(#bdWalls)" />
    <rect x="8" y="78" width="84" height="2" fill="#94a3b8" />
    <rect x="22" y="58" width="56" height="18" fill="url(#bdWalls)" />
    <rect x="28" y="64" width="6" height="8" rx="1" fill="#475569" opacity="0.8" />
    <rect x="38" y="64" width="6" height="8" rx="1" fill="#475569" opacity="0.8" />
    <rect x="47" y="64" width="6" height="8" rx="1" fill="#475569" opacity="0.8" />
    <rect x="56" y="64" width="6" height="8" rx="1" fill="#475569" opacity="0.8" />
    <rect x="66" y="64" width="6" height="8" rx="1" fill="#475569" opacity="0.8" />
    <path d="M 16 58 L 84 58 L 76 50 L 24 50 Z" fill="url(#bdRoof)" />
    <rect x="32" y="44" width="36" height="8" fill="url(#bdWalls)" />
    <path d="M 28 44 L 72 44 L 66 36 L 34 36 Z" fill="url(#bdRoof)" />
    <rect x="44" y="24" width="12" height="12" fill="url(#bdWalls)" />
    <rect x="48" y="28" width="4" height="6" fill="#1e293b" />
    <path d="M 40 24 L 60 24 L 54 18 L 46 18 Z" fill="url(#bdRoof)" />
    <line x1="50" y1="18" x2="50" y2="2" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="50" cy="4.5" r="3.5" fill="url(#bdSatayBall)" />
    <circle cx="50" cy="10" r="3.5" fill="url(#bdSatayBall)" />
    <circle cx="50" cy="15.5" r="3.5" fill="url(#bdSatayBall)" />
    <circle cx="48.5" cy="3" r="0.75" fill="#ffffff" opacity="0.6" />
    <circle cx="48.5" cy="8.5" r="0.75" fill="#ffffff" opacity="0.6" />
    <circle cx="48.5" cy="14" r="0.75" fill="#ffffff" opacity="0.6" />
  `
};

const medanTheme: CityTheme = {
  cardBg: 'from-amber-50/95 via-orange-50/90 to-yellow-50/95 text-amber-950 border border-amber-100/50 shadow-amber-500/5 dark:from-amber-950/80 dark:via-orange-950/75 dark:to-yellow-950/30 dark:text-amber-100 dark:border-amber-900/30 dark:shadow-amber-950/40',
  landmarkSvg: `
    <defs>
      <radialGradient id="mdAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="mdWalls" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="mdRoof" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="mdArch" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#78350f" />
        <stop offset="100%" stop-color="#451a03" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#mdAura)" />
    <path d="M 65 30 Q 75 22 85 30 Q 95 38 75 38 Z" fill="#ffffff" opacity="0.3" />
    <rect x="5" y="82" width="90" height="6" fill="#cbd5e1" />
    <rect x="12" y="60" width="76" height="22" fill="url(#mdWalls)" />
    <rect x="32" y="52" width="36" height="30" fill="url(#mdWalls)" />
    <rect x="15" y="60" width="3" height="22" fill="#fef08a" />
    <rect x="82" y="60" width="3" height="22" fill="#fef08a" />
    <rect x="34" y="52" width="3.5" height="30" fill="#fef08a" />
    <rect x="62.5" y="52" width="3.5" height="30" fill="#fef08a" />
    <path d="M 20 82 L 20 70 A 3 3 0 0 1 26 70 L 26 82 Z" fill="url(#mdArch)" />
    <path d="M 42 82 L 42 66 A 4.5 4.5 0 0 1 51 66 L 51 82 Z" fill="url(#mdArch)" />
    <path d="M 74 82 L 74 70 A 3 3 0 0 1 80 70 L 80 82 Z" fill="url(#mdArch)" />
    <path d="M 20 68 L 20 62 A 3 3 0 0 1 26 62 L 26 68 Z" fill="url(#mdArch)" opacity="0.7" />
    <path d="M 74 68 L 74 62 A 3 3 0 0 1 80 62 L 80 68 Z" fill="url(#mdArch)" opacity="0.7" />
    <path d="M 15 60 C 15 48, 31 48, 31 60 Z" fill="url(#mdRoof)" />
    <line x1="23" y1="50" x2="23" y2="43" stroke="#fbbf24" stroke-width="1.5" />
    <circle cx="23" cy="42" r="1" fill="#fbbf24" />
    <path d="M 69 60 C 69 48, 85 48, 85 60 Z" fill="url(#mdRoof)" />
    <line x1="77" y1="50" x2="77" y2="43" stroke="#fbbf24" stroke-width="1.5" />
    <circle cx="77" cy="42" r="1" fill="#fbbf24" />
    <path d="M 33 52 C 33 28, 67 28, 67 52 Z" fill="url(#mdRoof)" />
    <line x1="50" y1="31" x2="50" y2="22" stroke="#fbbf24" stroke-width="2.5" />
    <circle cx="50" cy="20.5" r="2.2" fill="#fbbf24" />
    <rect x="32" y="50" width="36" height="2" fill="#b45309" />
  `
};

const makassarTheme: CityTheme = {
  cardBg: 'from-blue-50/90 via-indigo-50/90 to-slate-100/90 text-indigo-950 border border-blue-100/50 shadow-blue-500/5 dark:from-blue-950/80 dark:via-indigo-950/75 dark:to-slate-900/50 dark:text-blue-100 dark:border-blue-900/30 dark:shadow-indigo-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="mkSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e" />
        <stop offset="100%" stop-color="#fb923c" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="mkHull" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ea580c" />
        <stop offset="60%" stop-color="#78350f" />
        <stop offset="100%" stop-color="#451a03" />
      </linearGradient>
      <linearGradient id="mkSailPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
      <linearGradient id="mkSailSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#fed7aa" />
      </linearGradient>
      <linearGradient id="mkSea" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>
    </defs>
    <circle cx="74" cy="44" r="20" fill="url(#mkSun)" />
    <line x1="48" y1="80" x2="48" y2="12" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round" />
    <line x1="26" y1="80" x2="26" y2="24" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round" />
    <line x1="68" y1="80" x2="68" y2="30" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="26" y1="24" x2="8" y2="70" stroke="#ffffff" stroke-width="0.8" opacity="0.4" />
    <line x1="48" y1="12" x2="26" y2="80" stroke="#ffffff" stroke-width="0.8" opacity="0.4" />
    <line x1="48" y1="12" x2="84" y2="68" stroke="#ffffff" stroke-width="0.8" opacity="0.4" />
    <path d="M 48 16 Q 24 30 48 44 Z" fill="url(#mkSailPrimary)" />
    <path d="M 48 48 Q 20 60 48 74 Z" fill="url(#mkSailSecondary)" />
    <path d="M 26 28 Q 8 40 26 50 Z" fill="url(#mkSailPrimary)" />
    <path d="M 26 54 Q 6 64 26 74 Z" fill="url(#mkSailSecondary)" />
    <path d="M 48 22 L 84 66 L 48 66 Z" fill="url(#mkSailSecondary)" opacity="0.4" />
    <path d="M 48 34 L 74 66 L 48 66 Z" fill="url(#mkSailPrimary)" opacity="0.65" />
    <path d="M 6 68 C 15 68, 12 76, 22 82 L 80 82 C 88 80, 86 70, 94 66 L 90 84 C 75 88, 25 88, 6 78 Z" fill="url(#mkHull)" />
    <rect x="22" y="80" width="56" height="3" fill="#ea580c" />
    <path d="M 0 82 Q 20 77 40 82 Q 60 87 80 82 Q 90 80 100 84 L 100 100 L 0 100 Z" fill="url(#mkSea)" />
    <path d="M 0 86 Q 25 82 50 86 Q 75 90 100 86 L 100 100 L 0 100 Z" fill="#22d3ee" opacity="0.45" />
    <circle cx="16" cy="85" r="1.5" fill="#ffffff" opacity="0.6" />
    <circle cx="88" cy="87" r="1.2" fill="#ffffff" opacity="0.7" />
  `
};

const yogyakartaTheme: CityTheme = {
  cardBg: 'from-violet-50/90 via-indigo-50/90 to-purple-50/90 text-violet-950 border border-violet-100/50 shadow-violet-500/5 dark:from-violet-950/80 dark:via-indigo-950/75 dark:to-purple-950/40 dark:text-violet-100 dark:border-violet-900/30 dark:shadow-violet-950/40',
  landmarkSvg: `
    <defs>
      <radialGradient id="ygMoon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="ygGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#b45309" />
        <stop offset="30%" stop-color="#facc15" />
        <stop offset="70%" stop-color="#fef08a" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>
      <linearGradient id="ygShaft" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <linearGradient id="ygShaftShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <linearGradient id="ygTuguBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#f1f5f9" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>
      <linearGradient id="ygVolcano" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.02" />
      </linearGradient>
      <linearGradient id="ygJoglo" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#b45309" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#78350f" stop-opacity="0.1" />
      </linearGradient>
      <linearGradient id="ygGroundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#312e81" stop-opacity="0.4" />
      </linearGradient>
      <pattern id="ygBatik" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 0 8 L 8 0 M -2 2 L 2 -2 M 6 10 L 10 6" stroke="#fbbf24" stroke-width="0.8" opacity="0.12" />
        <circle cx="4" cy="4" r="1.5" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.1" />
      </pattern>
    </defs>
    <circle cx="80" cy="22" r="10" fill="url(#ygGold)" opacity="0.75" />
    <circle cx="80" cy="22" r="14" fill="#fde047" opacity="0.12" />
    <path d="M 8 32 Q 16 24 26 32 Q 32 26 40 34 Q 36 40 26 38 Q 16 42 8 32 Z" fill="#ffffff" opacity="0.25" />
    <path d="M 12 34 Q 18 28 26 34 Q 30 30 36 36 Q 32 40 26 39 Q 18 42 12 34 Z" fill="#ffffff" opacity="0.12" />
    <path d="M 60 24 Q 68 16 78 24 Q 84 18 92 26 Q 88 32 78 30 Q 68 34 60 24 Z" fill="#ffffff" opacity="0.25" />
    <path d="M 64 26 Q 70 20 78 26 Q 82 22 88 30 Q 84 32 78 31 Q 70 34 64 26 Z" fill="#ffffff" opacity="0.12" />
    <path d="M 20 20 L 21 23 L 24 24 L 21 25 L 20 28 L 19 25 L 16 24 L 19 23 Z" fill="#ffffff" opacity="0.8" />
    <path d="M 32 40 L 32.5 42 L 34 42.5 L 32.5 43 L 32 45 L 31.5 43 L 30 42.5 L 31.5 42 Z" fill="#ffffff" opacity="0.6" />
    <circle cx="12" cy="45" r="0.8" fill="#ffffff" opacity="0.5" />
    <circle cx="58" cy="15" r="0.8" fill="#ffffff" opacity="0.5" />
    <path d="M 12 86 L 38 48 Q 42 45 46 50 L 78 86 Z" fill="url(#ygVolcano)" />
    <path d="M 38 86 L 56 62 Q 60 60 64 64 L 86 86 Z" fill="url(#ygVolcano)" opacity="0.6" />
    <path d="M 5 86 L 9 76 C 13 75, 14 73, 15 72 L 18 62 L 26 62 L 29 72 C 30 73, 31 75, 35 76 L 39 86 Z" fill="url(#ygJoglo)" />
    <line x1="20" y1="62" x2="20" y2="86" stroke="#fbbf24" stroke-width="0.8" opacity="0.3" />
    <line x1="24" y1="62" x2="24" y2="86" stroke="#fbbf24" stroke-width="0.8" opacity="0.3" />
    <rect x="18" y="72" width="8" height="14" fill="#78350f" opacity="0.25" />
    <path d="M 66 86 L 70 78 C 73 77, 74 76, 75 75 L 77 67 L 83 67 L 85 75 C 86 76, 87 77, 90 78 L 93 86 Z" fill="url(#ygJoglo)" />
    <line x1="79" y1="67" x2="79" y2="86" stroke="#fbbf24" stroke-width="0.8" opacity="0.3" />
    <line x1="81" y1="67" x2="81" y2="86" stroke="#fbbf24" stroke-width="0.8" opacity="0.3" />
    <rect x="78" y="75" width="4" height="11" fill="#78350f" opacity="0.25" />
    <rect x="0" y="86" width="100" height="14" fill="url(#ygGroundGrad)" />
    <rect x="0" y="86" width="100" height="14" fill="url(#ygBatik)" />
    <line x1="0" y1="86" x2="100" y2="86" stroke="#fbbf24" stroke-width="0.8" opacity="0.4" />
    <rect x="30" y="83" width="40" height="3" fill="url(#ygTuguBase)" />
    <rect x="33" y="77" width="34" height="6" fill="url(#ygTuguBase)" />
    <path d="M 37 77 C 33 77, 33 71, 37 70 C 39 69, 39 67, 41 67 L 41 77 Z" fill="url(#ygTuguBase)" stroke="#cbd5e1" stroke-width="0.5" />
    <path d="M 63 77 C 67 77, 67 71, 63 70 C 61 69, 61 67, 59 67 L 59 77 Z" fill="url(#ygTuguBase)" stroke="#cbd5e1" stroke-width="0.5" />
    <rect x="37" y="67" width="26" height="10" fill="url(#ygTuguBase)" />
    <rect x="42" y="69" width="16" height="6" fill="#1e293b" opacity="0.08" />
    <rect x="41" y="68" width="18" height="8" fill="none" stroke="url(#ygGold)" stroke-width="0.5" />
    <path d="M 46.5 25 L 44 65 L 50 65 L 50 25 Z" fill="url(#ygShaft)" />
    <path d="M 50 25 L 50 65 L 56 65 L 53.5 25 Z" fill="url(#ygShaftShadow)" />
    <path d="M 44.4 58 L 44.3 60 L 55.7 60 L 55.6 58 Z" fill="url(#ygGold)" />
    <path d="M 50 58 L 50 60 L 55.7 60 L 55.6 58 Z" fill="#000000" opacity="0.18" />
    <path d="M 45.1 44 L 45.0 46 L 55.0 46 L 54.9 44 Z" fill="url(#ygGold)" />
    <path d="M 50 44 L 50 46 L 55.0 46 L 54.9 44 Z" fill="#000000" opacity="0.18" />
    <path d="M 45.8 30 L 45.7 32 L 54.3 32 L 54.2 30 Z" fill="url(#ygGold)" />
    <path d="M 50 30 L 50 32 L 54.3 32 L 54.2 30 Z" fill="#000000" opacity="0.18" />
    <path d="M 50 49 L 51.5 52 L 50 55 L 48.5 52 Z" fill="url(#ygGold)" />
    <path d="M 50 49 L 51.5 52 L 50 55 Z" fill="#000000" opacity="0.18" />
    <path d="M 50 35 L 51.5 38 L 50 41 L 48.5 38 Z" fill="url(#ygGold)" />
    <path d="M 50 35 L 51.5 38 L 50 41 Z" fill="#000000" opacity="0.18" />
    <path d="M 46.5 25 L 50 25 L 50 22 L 48 22 Z" fill="url(#ygGold)" />
    <path d="M 50 25 L 53.5 25 L 52 22 L 50 22 Z" fill="url(#ygGold)" />
    <path d="M 50 25 L 53.5 25 L 52 22 L 50 22 Z" fill="#000000" opacity="0.18" />
    <circle cx="50" cy="20" r="2.2" fill="url(#ygGold)" />
    <path d="M 50 17.8 A 2.2 2.2 0 0 1 50 22.2 Z" fill="#000000" opacity="0.18" />
    <path d="M 50 3 C 48.2 9, 47.8 16, 50 20 Z" fill="url(#ygGold)" />
    <path d="M 50 3 C 51.8 9, 52.2 16, 50 20 Z" fill="url(#ygGold)" />
    <path d="M 50 3 C 51.8 9, 52.2 16, 50 20 Z" fill="#000000" opacity="0.18" />
    <circle cx="50" cy="3" r="1.5" fill="#fef08a" opacity="0.6" />
  `
};

const defaultTheme: CityTheme = {
  cardBg: 'from-orange-50/90 via-red-50/90 to-pink-50/90 text-red-950 border border-orange-100/50 shadow-orange-500/5 dark:from-orange-950/80 dark:via-red-950/75 dark:to-pink-950/40 dark:text-orange-100 dark:border-orange-900/30 dark:shadow-orange-950/40',
  landmarkSvg: `
    <defs>
      <radialGradient id="dpSun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
        <stop offset="40%" stop-color="#f97316" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="dpBrick" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ea580c" />
        <stop offset="40%" stop-color="#c2410c" />
        <stop offset="60%" stop-color="#b45309" />
        <stop offset="100%" stop-color="#7c2d12" />
      </linearGradient>
      <linearGradient id="dpStone" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#475569" />
        <stop offset="50%" stop-color="#64748b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#dpSun)" />
    <path d="M 96 80 Q 82 46 95 22" stroke="#0f172a" stroke-width="3.5" fill="none" opacity="0.25" />
    <path d="M 95 22 Q 78 28 68 34" stroke="#0f172a" stroke-width="1.8" fill="none" opacity="0.25" stroke-linecap="round" />
    <path d="M 95 22 Q 82 12 76 8" stroke="#0f172a" stroke-width="1.8" fill="none" opacity="0.25" stroke-linecap="round" />
    <path d="M 95 22 Q 98 10 102 6" stroke="#0f172a" stroke-width="1.8" fill="none" opacity="0.25" stroke-linecap="round" />
    <path d="M 95 22 Q 104 22 108 28" stroke="#0f172a" stroke-width="1.8" fill="none" opacity="0.25" stroke-linecap="round" />
    <rect x="5" y="82" width="90" height="6" rx="1" fill="url(#dpStone)" />
    <rect x="12" y="80" width="76" height="2" fill="#94a3b8" />
    <rect x="15" y="70" width="20" height="10" fill="url(#dpBrick)" />
    <rect x="17" y="58" width="16" height="12" fill="url(#dpBrick)" />
    <rect x="17" y="56" width="16" height="2" fill="url(#dpStone)" />
    <rect x="19" y="44" width="12" height="12" fill="url(#dpBrick)" />
    <rect x="21" y="28" width="8" height="16" fill="url(#dpBrick)" />
    <path d="M 21 28 L 25 10 L 29 28 Z" fill="url(#dpBrick)" />
    <circle cx="25" cy="8" r="1.5" fill="url(#dpStone)" />
    <rect x="23" y="48" width="4" height="4" fill="url(#dpStone)" />
    <rect x="21" y="62" width="8" height="4" fill="url(#dpStone)" opacity="0.8" />
    <rect x="65" y="70" width="20" height="10" fill="url(#dpBrick)" />
    <rect x="67" y="58" width="16" height="12" fill="url(#dpBrick)" />
    <rect x="67" y="56" width="16" height="2" fill="url(#dpStone)" />
    <rect x="69" y="44" width="12" height="12" fill="url(#dpBrick)" />
    <rect x="71" y="28" width="8" height="16" fill="url(#dpBrick)" />
    <path d="M 71 28 L 75 10 L 79 28 Z" fill="url(#dpBrick)" />
    <circle cx="75" cy="8" r="1.5" fill="url(#dpStone)" />
    <rect x="73" y="48" width="4" height="4" fill="url(#dpStone)" />
    <rect x="71" y="62" width="8" height="4" fill="url(#dpStone)" opacity="0.8" />
  `
};

export const getCityTheme = (cityName: string): CityTheme => {
  const city = cityName.toLowerCase();
  if (city.includes('jakarta')) return jakartaTheme;
  if (city.includes('surabaya')) return surabayaTheme;
  if (city.includes('bandung')) return bandungTheme;
  if (city.includes('medan')) return medanTheme;
  if (city.includes('makassar')) return makassarTheme;
  if (city.includes('yogyakarta')) return yogyakartaTheme;
  return defaultTheme;
};

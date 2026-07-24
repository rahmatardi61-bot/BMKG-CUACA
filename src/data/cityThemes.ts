export interface CityTheme {
  cardBg: string;
  landmarkSvg: string;
}

const jakartaTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-[#1c0b36] via-[#2e0e4b] to-[#1a092b] text-white border border-purple-500/30 shadow-xl shadow-purple-950/40',
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
  cardBg: 'bg-gradient-to-r from-teal-900 via-cyan-950 to-blue-950 text-cyan-100 border border-cyan-500/30 shadow-xl shadow-cyan-950/40',
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
  cardBg: 'bg-gradient-to-r from-emerald-900 via-teal-950 to-cyan-950 text-emerald-100 border border-emerald-500/30 shadow-xl shadow-emerald-950/40',
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
  cardBg: 'bg-gradient-to-r from-amber-900 via-orange-950 to-yellow-950 text-amber-100 border border-amber-500/30 shadow-xl shadow-amber-950/40',
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
  cardBg: 'bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-blue-100 border border-blue-500/30 shadow-xl shadow-indigo-950/40',
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
  cardBg: 'bg-gradient-to-r from-violet-900 via-indigo-950 to-purple-950 text-violet-100 border border-violet-500/30 shadow-xl shadow-violet-950/40',
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

const semarangTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-violet-950 via-purple-950 to-indigo-950 text-purple-100 border border-purple-500/30 shadow-xl shadow-purple-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="srSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fae8ff" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#c084fc" stop-opacity="0.1" />
      </linearGradient>
      <linearGradient id="srRoof" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#d946ef" />
        <stop offset="100%" stop-color="#701a75" />
      </linearGradient>
      <linearGradient id="srWalls" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f3e8ff" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e9d5ff" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="48" r="35" fill="url(#srSun)" />
    <!-- Lawang Sewu Colonial Fasad -->
    <rect x="5" y="78" width="90" height="10" rx="1.5" fill="url(#srWalls)" />
    <!-- Central Building -->
    <rect x="18" y="58" width="64" height="20" fill="url(#srWalls)" />
    <!-- Arches -->
    <path d="M 22 78 V 65 A 3 3 0 0 1 28 65 V 78 M 32 78 V 65 A 3 3 0 0 1 38 65 V 78 M 42 78 V 65 A 3 3 0 0 1 48 65 V 78 M 52 78 V 65 A 3 3 0 0 1 58 65 V 78 M 62 78 V 65 A 3 3 0 0 1 68 65 V 78 M 72 78 V 65 A 3 3 0 0 1 78 65 V 78" stroke="#701a75" stroke-width="1.2" fill="none" />
    <path d="M 18 58 L 82 58 L 76 50 L 24 50 Z" fill="url(#srRoof)" />
    <!-- Left Tower -->
    <rect x="10" y="44" width="10" height="34" fill="url(#srWalls)" />
    <path d="M 8 44 L 22 44 L 15 32 Z" fill="url(#srRoof)" />
    <rect x="13" y="52" width="4" height="12" rx="1" fill="#701a75" opacity="0.6" />
    <!-- Right Tower -->
    <rect x="80" y="44" width="10" height="34" fill="url(#srWalls)" />
    <path d="M 78 44 L 92 44 L 85 32 Z" fill="url(#srRoof)" />
    <rect x="83" y="52" width="4" height="12" rx="1" fill="#701a75" opacity="0.6" />
  `
};

const palembangTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-red-950 via-rose-950 to-orange-950 text-red-100 border border-red-500/30 shadow-xl shadow-red-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="plSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffedd5" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#fdba74" stop-opacity="0.1" />
      </linearGradient>
      <linearGradient id="plBridge" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f43f5e" />
        <stop offset="50%" stop-color="#e11d48" />
        <stop offset="100%" stop-color="#9f1239" />
      </linearGradient>
      <linearGradient id="plWater" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#9f1239" stop-opacity="0.8" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="46" r="32" fill="url(#plSun)" />
    <!-- Ampera Bridge towers -->
    <rect x="25" y="24" width="6" height="52" fill="url(#plBridge)" />
    <rect x="69" y="24" width="6" height="52" fill="url(#plBridge)" />
    <!-- Tower connections and details -->
    <rect x="22" y="34" width="12" height="4" fill="#be123c" />
    <rect x="66" y="34" width="12" height="4" fill="#be123c" />
    <rect x="22" y="48" width="12" height="4" fill="#be123c" />
    <rect x="66" y="48" width="12" height="4" fill="#be123c" />
    <path d="M 28 24 L 25 15 L 31 15 Z" fill="#9f1239" />
    <path d="M 72 24 L 69 15 L 75 15 Z" fill="#9f1239" />
    <!-- Bridge Deck -->
    <rect x="2" y="60" width="96" height="6" rx="1" fill="url(#plBridge)" />
    <!-- Cable Stays -->
    <line x1="28" y1="34" x2="8" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="28" y1="34" x2="18" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="28" y1="34" x2="38" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="28" y1="34" x2="48" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="72" y1="34" x2="52" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="72" y1="34" x2="62" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="72" y1="34" x2="82" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <line x1="72" y1="34" x2="92" y2="60" stroke="#f43f5e" stroke-width="1" opacity="0.75" />
    <!-- Musi River -->
    <rect x="0" y="66" width="100" height="34" fill="url(#plWater)" />
    <path d="M 0 66 Q 25 64 50 67 Q 75 70 100 66 L 100 100 L 0 100 Z" fill="#e11d48" opacity="0.25" />
  `
};

const batamTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-sky-100 border border-sky-500/30 shadow-xl shadow-sky-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="btSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.15" />
      </linearGradient>
      <linearGradient id="btPylon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="btSea" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0369a1" stop-opacity="0.7" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="42" r="30" fill="url(#btSun)" />
    <!-- Barelang Cable Bridge Tower (Pylon) -->
    <path d="M 45 76 L 49 20 L 51 20 L 55 76 Z" fill="url(#btPylon)" />
    <path d="M 48 45 L 52 45 M 47 56 L 53 56 M 46 66 L 54 66" stroke="#ffffff" stroke-width="1.5" />
    <!-- Bridge Deck -->
    <rect x="2" y="66" width="96" height="5" rx="1" fill="#0284c7" />
    <rect x="2" y="71" width="96" height="1.5" fill="#38bdf8" />
    <!-- Suspension Cables -->
    <line x1="50" y1="26" x2="8" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="18" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="28" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="38" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="62" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="72" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="82" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <line x1="50" y1="26" x2="92" y2="66" stroke="#38bdf8" stroke-width="0.8" opacity="0.85" />
    <!-- Sea water -->
    <rect x="0" y="72.5" width="100" height="27.5" fill="url(#btSea)" />
  `
};

const pekanbaruTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-teal-950 via-emerald-950 to-green-950 text-emerald-100 border border-emerald-500/30 shadow-xl shadow-emerald-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="pkSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ecfdf5" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#a7f3d0" stop-opacity="0.15" />
      </linearGradient>
      <linearGradient id="pkDome" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#eab308" />
        <stop offset="50%" stop-color="#fef08a" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>
      <linearGradient id="pkWalls" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f0fdf4" />
        <stop offset="100%" stop-color="#dcfce7" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="48" r="35" fill="url(#pkSun)" />
    <!-- Masjid Raya An-Nur Pekanbaru Melayu-style Mosque -->
    <rect x="5" y="78" width="90" height="10" rx="1.5" fill="url(#pkWalls)" />
    <!-- Main Hall -->
    <rect x="22" y="60" width="56" height="18" fill="url(#pkWalls)" />
    <rect x="28" y="64" width="44" height="14" fill="#15803d" opacity="0.15" />
    <!-- Grand Yellow Dome -->
    <path d="M 33 60 C 33 40, 67 40, 67 60 Z" fill="url(#pkDome)" />
    <path d="M 50 43 L 50 34" stroke="#eab308" stroke-width="1.8" />
    <circle cx="50" cy="33" r="1.5" fill="#fef08a" />
    <!-- Minarets -->
    <rect x="12" y="44" width="6" height="34" fill="url(#pkWalls)" />
    <path d="M 10 44 L 20 44 L 15 38 Z" fill="url(#pkDome)" />
    <rect x="82" y="44" width="6" height="34" fill="url(#pkWalls)" />
    <path d="M 80 44 L 90 44 L 85 38 Z" fill="url(#pkDome)" />
  `
};

const denpasarTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-amber-950 via-[#7c2d12] to-amber-950 text-orange-100 border border-orange-500/30 shadow-xl shadow-orange-950/40',
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
    <!-- Balinese Split Gate Candi Bentar -->
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

const defaultTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-slate-100 border border-slate-700/30 shadow-xl shadow-slate-950/40',
  landmarkSvg: `
    <defs>
      <linearGradient id="dfSun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#312e81" stop-opacity="0" />
      </linearGradient>
    </defs>
    <!-- Neutral skyline landscape for fallback -->
    <circle cx="50" cy="50" r="32" fill="url(#dfSun)" />
    <!-- City silhouette lines -->
    <path d="M 5 82 L 15 72 L 25 78 L 35 62 L 45 74 L 55 58 L 65 72 L 75 64 L 85 76 L 95 82 Z M 5 82 L 95 82" stroke="#475569" stroke-width="2" stroke-linejoin="round" fill="none" opacity="0.4" />
    <rect x="5" y="82" width="90" height="6" rx="1" fill="#475569" opacity="0.5" />
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
  if (city.includes('semarang')) return semarangTheme;
  if (city.includes('palembang')) return palembangTheme;
  if (city.includes('batam')) return batamTheme;
  if (city.includes('pekanbaru')) return pekanbaruTheme;
  if (city.includes('denpasar')) return denpasarTheme;
  return defaultTheme;
};

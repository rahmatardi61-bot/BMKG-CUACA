export interface AdditionalWeatherInfo {
  windDir: string;
  windAngle: number;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  moonIllumination: string;
  moonrise: string;
  moonset: string;
}

export interface ComfortIndexInfo {
  quality: string;
  status: string;
  tempText: string;
  desc: string;
  colorClass: string;
  pillClass: string;
  recommendation1: string;
  recommendation2: string;
  iconColor: string;
  smileySvg: string;
}

export type WeatherType = 'sunny' | 'partly-cloudy' | 'cloudy' | 'light-rain' | 'heavy-rain' | 'thunderstorm' | 'snow';

export const getAdditionalWeatherData = (cityName: string): AdditionalWeatherInfo => {
  const city = cityName.toLowerCase();
  
  // Base sunrise and sunset times per city
  let windDir = 'Tenggara';
  let windAngle = 135;
  let sunriseStr = '06:00';
  let sunsetStr = '18:00';
  
  if (city.includes('jakarta')) {
    windDir = 'Tenggara'; windAngle = 135; sunriseStr = '06:01'; sunsetStr = '17:48';
  } else if (city.includes('surabaya')) {
    windDir = 'Timur'; windAngle = 90; sunriseStr = '05:42'; sunsetStr = '17:29';
  } else if (city.includes('bandung')) {
    windDir = 'Selatan'; windAngle = 180; sunriseStr = '06:03'; sunsetStr = '17:50';
  } else if (city.includes('medan')) {
    windDir = 'Barat Daya'; windAngle = 225; sunriseStr = '06:15'; sunsetStr = '18:32';
  } else if (city.includes('makassar')) {
    windDir = 'Barat'; windAngle = 270; sunriseStr = '06:05'; sunsetStr = '17:58';
  } else if (city.includes('denpasar')) {
    windDir = 'Selatan'; windAngle = 180; sunriseStr = '06:12'; sunsetStr = '18:05';
  } else if (city.includes('yogyakarta')) {
    windDir = 'Tenggara'; windAngle = 135; sunriseStr = '05:55'; sunsetStr = '17:41';
  }
  
  // Calculate real Moon Phase dynamically based on current date
  const now = new Date();
  const epoch = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); // Known New Moon
  const diffDays = (now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.530588853;
  const age = diffDays % synodicMonth;
  const ratio = age / synodicMonth;
  
  // Illumination percentage (0% to 100%)
  const illuminationVal = Math.round(50 * (1 - Math.cos(2 * Math.PI * ratio)));
  const moonIllumination = `${illuminationVal}%`;
  
  let moonPhase = '';
  if (ratio < 0.02 || ratio >= 0.98) {
    moonPhase = 'Bulan Baru';
  } else if (ratio < 0.23) {
    moonPhase = 'Sabit Awal';
  } else if (ratio < 0.27) {
    moonPhase = 'Perempat Pertama';
  } else if (ratio < 0.48) {
    moonPhase = 'Cembung Awal';
  } else if (ratio < 0.52) {
    moonPhase = 'Bulan Purnama';
  } else if (ratio < 0.73) {
    moonPhase = 'Cembung Akhir';
  } else if (ratio < 0.77) {
    moonPhase = 'Perempat Ketiga';
  } else {
    moonPhase = 'Sabit Akhir';
  }
  
  // Calculate dynamic moonrise and moonset based on lag (ratio * 24 hours)
  const [srHour, srMin] = sunriseStr.split(':').map(Number);
  const [ssHour, ssMin] = sunsetStr.split(':').map(Number);
  
  const srTotalMin = srHour * 60 + srMin;
  const ssTotalMin = ssHour * 60 + ssMin;
  
  const lagMinutes = Math.round(ratio * 24 * 60);
  
  const mrTotalMin = (srTotalMin + lagMinutes) % (24 * 60);
  const msTotalMin = (ssTotalMin + lagMinutes) % (24 * 60);
  
  const formatTime = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  
  const moonrise = formatTime(mrTotalMin);
  const moonset = formatTime(msTotalMin);
  
  return {
    windDir,
    windAngle,
    sunrise: sunriseStr,
    sunset: sunsetStr,
    moonPhase,
    moonIllumination,
    moonrise,
    moonset
  };
};

export const getComfortIndex = (temp: number): ComfortIndexInfo => {
  if (temp <= 26) {
    return {
      quality: 'Good Heat Index Quality',
      status: 'Nyaman',
      tempText: '20.6 °C',
      desc: 'Kondisi dianggap nyaman dan tidak menimbulkan stres panas',
      colorClass: 'bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30',
      pillClass: 'bg-emerald-600 text-white dark:bg-emerald-700',
      recommendation1: 'Enjoy outdoor activities',
      recommendation2: "It's okay to open windows",
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      smileySvg: `
        <svg class="w-10 h-10 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="3" stroke-linecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="3" stroke-linecap="round" />
        </svg>
      `
    };
  } else if (temp <= 31) {
    return {
      quality: 'Moderate Heat Index Quality',
      status: 'Cukup Nyaman',
      tempText: '27.4 °C',
      desc: 'Kondisi hangat, nyaman untuk sebagian besar aktivitas luar ruangan',
      colorClass: 'bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30',
      pillClass: 'bg-amber-500 text-white dark:bg-amber-600',
      recommendation1: 'Enjoy outdoor activities with sunscreen',
      recommendation2: 'Keep indoor ventilation active',
      iconColor: 'text-amber-500 dark:text-amber-400',
      smileySvg: `
        <svg class="w-10 h-10 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="15" x2="16" y2="15" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="3" stroke-linecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="3" stroke-linecap="round" />
        </svg>
      `
    };
  } else {
    return {
      quality: 'Caution Heat Index',
      status: 'Panas / Stres Panas',
      tempText: '32.8 °C',
      desc: 'Suhu cukup tinggi, potensi stres panas. Kurangi aktivitas luar ruangan.',
      colorClass: 'bg-orange-500/10 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-500/20 dark:border-orange-500/30',
      pillClass: 'bg-orange-500 text-white dark:bg-orange-600',
      recommendation1: 'Avoid direct sun exposure for too long',
      recommendation2: 'Close windows during highest heat hours',
      iconColor: 'text-orange-500 dark:text-orange-400',
      smileySvg: `
        <svg class="w-10 h-10 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="3" stroke-linecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="3" stroke-linecap="round" />
        </svg>
      `
    };
  }
};

export const getNormalizedWeatherType = (status: string): WeatherType => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('petir') || lowerStatus.includes('badai')) {
    return 'thunderstorm';
  }
  if (lowerStatus.includes('lebat') || lowerStatus.includes('deras') || lowerStatus.includes('sedang')) {
    return 'heavy-rain';
  }
  if (lowerStatus.includes('ringan') || lowerStatus.includes('hujan')) {
    return 'light-rain';
  }
  if (lowerStatus.includes('salju')) {
    return 'snow';
  }
  if (lowerStatus.includes('mendung') || lowerStatus.includes('overcast')) {
    return 'cloudy';
  }
  if (lowerStatus.includes('berawan')) {
    return 'partly-cloudy';
  }
  if (lowerStatus.includes('cerah')) {
    return 'sunny';
  }
  return 'sunny';
};

export const getFormattedTimeAndZone = (currentTime: Date, selectedCity: string): string => {
  const city = selectedCity.toLowerCase();
  let offset = 7; // WIB (UTC+7)
  let zone = 'WIB';

  if (city.includes('makassar') || city.includes('denpasar')) {
    offset = 8; // WITA (UTC+8)
    zone = 'WITA';
  }

  // Calculate local time for selected Indonesian zone
  const utc = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
  const cityTime = new Date(utc + (3600000 * offset));

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[cityTime.getDay()];
  const day = String(cityTime.getDate()).padStart(2, '0');
  const month = String(cityTime.getMonth() + 1).padStart(2, '0');
  const year = cityTime.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  const hours = String(cityTime.getHours()).padStart(2, '0');
  const minutes = String(cityTime.getMinutes()).padStart(2, '0');

  return `${dayName}, ${dateStr} ${hours}:${minutes} ${zone}`;
};

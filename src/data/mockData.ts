import type { WeatherData, HourlyForecast, TransportStatus, WarningAlert, NewsArticle, CityAnalysis } from '../types/weather';

// ── Helper: build a 7-day hourly array from a single-day base ───────────────
// startDate: today's Date object (local)
// base24: the 24-hour slice for "today"
// Each subsequent day gets slight temperature & precipitation variation
function build7DayForecast(base24: Omit<HourlyForecast, 'date'>[], startDate: Date): HourlyForecast[] {
  const result: HourlyForecast[] = [];

  // Daily variation deltas: [tempOffset, precipMultiplier]
  const dayVariants: [number, number][] = [
    [0, 1.00],   // Day 0 = today (base)
    [-1, 1.10],  // Day 1
    [1, 0.90],   // Day 2
    [2, 0.80],   // Day 3
    [-2, 1.20],  // Day 4
    [1, 1.05],   // Day 5
    [0, 0.95],   // Day 6
  ];

  for (let d = 0; d < 7; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const isoDate = date.toISOString().slice(0, 10); // YYYY-MM-DD

    const [tempDelta, precipMult] = dayVariants[d];

    for (const slot of base24) {
      const precip = slot.precipitation !== undefined
        ? Math.min(100, Math.max(0, Math.round(slot.precipitation * precipMult)))
        : undefined;
      result.push({
        ...slot,
        date: isoDate,
        temp: slot.temp + tempDelta,
        precipitation: precip,
      });
    }
  }

  return result;
}

// Base date = today (local)
const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export const citiesList = [
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta',
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta',
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur',
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat',
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara',
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan',
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali'
];

export const weatherDataMap: Record<string, WeatherData> = {
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta': {
    city: 'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta',
    temp: 34,
    status: 'Cerah',
    feelLike: 36,
    tempMin: 28,
    tempMax: 36,
    humidity: 65,
    windSpeed: 12,
    uvIndex: 8,
    visibility: 9,
    icon: 'Sun'
  },
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur': {
    city: 'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur',
    temp: 35,
    status: 'Cerah Berawan',
    feelLike: 38,
    tempMin: 27,
    tempMax: 37,
    humidity: 60,
    windSpeed: 15,
    uvIndex: 9,
    visibility: 10,
    icon: 'SunDim'
  },
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat': {
    city: 'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat',
    temp: 26,
    status: 'Hujan Ringan',
    feelLike: 27,
    tempMin: 20,
    tempMax: 28,
    humidity: 85,
    windSpeed: 8,
    uvIndex: 4,
    visibility: 7,
    icon: 'CloudRain'
  },
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara': {
    city: 'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara',
    temp: 30,
    status: 'Berawan',
    feelLike: 33,
    tempMin: 24,
    tempMax: 32,
    humidity: 75,
    windSpeed: 10,
    uvIndex: 6,
    visibility: 8,
    icon: 'Cloud'
  },
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan': {
    city: 'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan',
    temp: 32,
    status: 'Hujan Sedang',
    feelLike: 35,
    tempMin: 25,
    tempMax: 33,
    humidity: 80,
    windSpeed: 18,
    uvIndex: 5,
    visibility: 6,
    icon: 'CloudLightning'
  },
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali': {
    city: 'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali',
    temp: 31,
    status: 'Cerah Berawan',
    feelLike: 34,
    tempMin: 26,
    tempMax: 32,
    humidity: 70,
    windSpeed: 14,
    uvIndex: 8,
    visibility: 10,
    icon: 'SunDim'
  },
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta': {
    city: 'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta',
    temp: 31,
    status: 'Cerah Berawan',
    feelLike: 33,
    tempMin: 23,
    tempMax: 33,
    humidity: 70,
    windSpeed: 10,
    uvIndex: 7,
    visibility: 9,
    icon: 'SunDim'
  }
};

// Private single-day base data (no date field needed)
const hourlyBase: Record<string, Omit<HourlyForecast, 'date'>[]> = {
  // Gambir, Jakarta Pusat – Cerah (hot, humid capital, typical dry season)
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta': [
    { time: '00:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 82, windSpeed: 8 },
    { time: '01:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 84, windSpeed: 7 },
    { time: '02:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 85, windSpeed: 6 },
    { time: '03:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 86, windSpeed: 6 },
    { time: '04:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 87, windSpeed: 7 },
    { time: '05:00', temp: 25, status: 'Cerah Berawan', icon: 'Moon', precipitation: 5, humidity: 86, windSpeed: 8 },
    { time: '06:00', temp: 27, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 8, humidity: 83, windSpeed: 10 },
    { time: '07:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 6, humidity: 80, windSpeed: 11 },
    { time: '08:00', temp: 30, status: 'Cerah', icon: 'Sun', precipitation: 3, humidity: 76, windSpeed: 13 },
    { time: '09:00', temp: 32, status: 'Cerah', icon: 'Sun', precipitation: 2, humidity: 70, windSpeed: 14 },
    { time: '10:00', temp: 33, status: 'Cerah', icon: 'Sun', precipitation: 4, humidity: 65, windSpeed: 15 },
    { time: '11:00', temp: 34, status: 'Cerah', icon: 'Sun', precipitation: 5, humidity: 60, windSpeed: 16 },
    { time: '12:00', temp: 35, status: 'Cerah', icon: 'Sun', precipitation: 7, humidity: 57, windSpeed: 17 },
    { time: '13:00', temp: 35, status: 'Cerah', icon: 'Sun', precipitation: 10, humidity: 58, windSpeed: 18 },
    { time: '14:00', temp: 34, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 62, windSpeed: 16 },
    { time: '15:00', temp: 33, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 20, humidity: 67, windSpeed: 14 },
    { time: '16:00', temp: 31, status: 'Berawan', icon: 'Cloud', precipitation: 25, humidity: 72, windSpeed: 13 },
    { time: '17:00', temp: 30, status: 'Berawan', icon: 'Cloud', precipitation: 22, humidity: 75, windSpeed: 12 },
    { time: '18:00', temp: 29, status: 'Berawan', icon: 'Cloud', precipitation: 18, humidity: 78, windSpeed: 10 },
    { time: '19:00', temp: 28, status: 'Cerah Berawan', icon: 'Moon', precipitation: 12, humidity: 80, windSpeed: 9 },
    { time: '20:00', temp: 27, status: 'Cerah Berawan', icon: 'Moon', precipitation: 8, humidity: 82, windSpeed: 9 },
    { time: '21:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 83, windSpeed: 8 },
    { time: '22:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 84, windSpeed: 8 },
    { time: '23:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 84, windSpeed: 7 },
  ],

  // Gubeng, Surabaya – Cerah Berawan (hot & very dry coast)
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur': [
    { time: '00:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 75, windSpeed: 12 },
    { time: '01:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 76, windSpeed: 11 },
    { time: '02:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 77, windSpeed: 10 },
    { time: '03:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 78, windSpeed: 10 },
    { time: '04:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 78, windSpeed: 11 },
    { time: '05:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 77, windSpeed: 12 },
    { time: '06:00', temp: 28, status: 'Cerah', icon: 'Sun', precipitation: 2, humidity: 74, windSpeed: 14 },
    { time: '07:00', temp: 29, status: 'Cerah', icon: 'Sun', precipitation: 1, humidity: 70, windSpeed: 15 },
    { time: '08:00', temp: 31, status: 'Cerah', icon: 'Sun', precipitation: 0, humidity: 65, windSpeed: 17 },
    { time: '09:00', temp: 33, status: 'Cerah', icon: 'Sun', precipitation: 0, humidity: 58, windSpeed: 18 },
    { time: '10:00', temp: 35, status: 'Cerah', icon: 'Sun', precipitation: 2, humidity: 53, windSpeed: 20 },
    { time: '11:00', temp: 36, status: 'Cerah', icon: 'Sun', precipitation: 5, humidity: 50, windSpeed: 22 },
    { time: '12:00', temp: 37, status: 'Cerah', icon: 'Sun', precipitation: 8, humidity: 47, windSpeed: 23 },
    { time: '13:00', temp: 36, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 12, humidity: 50, windSpeed: 22 },
    { time: '14:00', temp: 35, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 18, humidity: 54, windSpeed: 20 },
    { time: '15:00', temp: 34, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 20, humidity: 58, windSpeed: 18 },
    { time: '16:00', temp: 32, status: 'Berawan', icon: 'Cloud', precipitation: 22, humidity: 63, windSpeed: 16 },
    { time: '17:00', temp: 31, status: 'Berawan', icon: 'Cloud', precipitation: 18, humidity: 67, windSpeed: 15 },
    { time: '18:00', temp: 30, status: 'Berawan', icon: 'Cloud', precipitation: 14, humidity: 70, windSpeed: 13 },
    { time: '19:00', temp: 29, status: 'Cerah Berawan', icon: 'Moon', precipitation: 8, humidity: 72, windSpeed: 12 },
    { time: '20:00', temp: 28, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 74, windSpeed: 12 },
    { time: '21:00', temp: 28, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 75, windSpeed: 12 },
    { time: '22:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 75, windSpeed: 11 },
    { time: '23:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 1, humidity: 75, windSpeed: 11 },
  ],

  // Braga, Bandung – Hujan Ringan (highland cool, afternoon rain pattern)
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat': [
    { time: '00:00', temp: 18, status: 'Cerah Berawan', icon: 'Moon', precipitation: 8, humidity: 88, windSpeed: 6 },
    { time: '01:00', temp: 17, status: 'Cerah Berawan', icon: 'Moon', precipitation: 7, humidity: 89, windSpeed: 5 },
    { time: '02:00', temp: 17, status: 'Cerah Berawan', icon: 'Moon', precipitation: 6, humidity: 90, windSpeed: 5 },
    { time: '03:00', temp: 16, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 91, windSpeed: 4 },
    { time: '04:00', temp: 16, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 91, windSpeed: 4 },
    { time: '05:00', temp: 17, status: 'Cerah Berawan', icon: 'Moon', precipitation: 7, humidity: 90, windSpeed: 5 },
    { time: '06:00', temp: 19, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 10, humidity: 88, windSpeed: 7 },
    { time: '07:00', temp: 20, status: 'Berawan', icon: 'Cloud', precipitation: 15, humidity: 86, windSpeed: 8 },
    { time: '08:00', temp: 22, status: 'Berawan', icon: 'Cloud', precipitation: 20, humidity: 83, windSpeed: 9 },
    { time: '09:00', temp: 24, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 18, humidity: 79, windSpeed: 10 },
    { time: '10:00', temp: 25, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 22, humidity: 76, windSpeed: 11 },
    { time: '11:00', temp: 26, status: 'Berawan', icon: 'Cloud', precipitation: 35, humidity: 74, windSpeed: 12 },
    { time: '12:00', temp: 27, status: 'Berawan', icon: 'Cloud', precipitation: 50, humidity: 72, windSpeed: 13 },
    { time: '13:00', temp: 26, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 75, humidity: 78, windSpeed: 14 },
    { time: '14:00', temp: 24, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 92, humidity: 88, windSpeed: 18 },
    { time: '15:00', temp: 23, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 88, humidity: 90, windSpeed: 20 },
    { time: '16:00', temp: 22, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 70, humidity: 89, windSpeed: 16 },
    { time: '17:00', temp: 21, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 60, humidity: 88, windSpeed: 13 },
    { time: '18:00', temp: 20, status: 'Berawan', icon: 'Cloud', precipitation: 40, humidity: 87, windSpeed: 10 },
    { time: '19:00', temp: 20, status: 'Berawan', icon: 'Cloud', precipitation: 30, humidity: 87, windSpeed: 9 },
    { time: '20:00', temp: 19, status: 'Cerah Berawan', icon: 'Moon', precipitation: 20, humidity: 88, windSpeed: 8 },
    { time: '21:00', temp: 19, status: 'Cerah Berawan', icon: 'Moon', precipitation: 15, humidity: 88, windSpeed: 7 },
    { time: '22:00', temp: 18, status: 'Cerah Berawan', icon: 'Moon', precipitation: 10, humidity: 89, windSpeed: 6 },
    { time: '23:00', temp: 18, status: 'Cerah Berawan', icon: 'Moon', precipitation: 8, humidity: 89, windSpeed: 6 },
  ],

  // Sei Sikambing C II, Medan – Berawan (equatorial, frequent cloud, afternoon showers)
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara': [
    { time: '00:00', temp: 23, status: 'Berawan', icon: 'Moon', precipitation: 15, humidity: 90, windSpeed: 7 },
    { time: '01:00', temp: 23, status: 'Berawan', icon: 'Moon', precipitation: 12, humidity: 91, windSpeed: 6 },
    { time: '02:00', temp: 22, status: 'Cerah Berawan', icon: 'Moon', precipitation: 10, humidity: 91, windSpeed: 6 },
    { time: '03:00', temp: 22, status: 'Cerah Berawan', icon: 'Moon', precipitation: 10, humidity: 92, windSpeed: 5 },
    { time: '04:00', temp: 22, status: 'Cerah Berawan', icon: 'Moon', precipitation: 12, humidity: 92, windSpeed: 6 },
    { time: '05:00', temp: 23, status: 'Cerah Berawan', icon: 'Moon', precipitation: 15, humidity: 91, windSpeed: 7 },
    { time: '06:00', temp: 24, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 20, humidity: 89, windSpeed: 9 },
    { time: '07:00', temp: 25, status: 'Berawan', icon: 'Cloud', precipitation: 25, humidity: 87, windSpeed: 10 },
    { time: '08:00', temp: 27, status: 'Berawan', icon: 'Cloud', precipitation: 30, humidity: 85, windSpeed: 11 },
    { time: '09:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 22, humidity: 82, windSpeed: 12 },
    { time: '10:00', temp: 30, status: 'Berawan', icon: 'Cloud', precipitation: 28, humidity: 80, windSpeed: 13 },
    { time: '11:00', temp: 31, status: 'Berawan', icon: 'Cloud', precipitation: 35, humidity: 78, windSpeed: 14 },
    { time: '12:00', temp: 32, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 55, humidity: 82, windSpeed: 15 },
    { time: '13:00', temp: 31, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 65, humidity: 85, windSpeed: 16 },
    { time: '14:00', temp: 30, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 85, humidity: 90, windSpeed: 22 },
    { time: '15:00', temp: 28, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 90, humidity: 92, windSpeed: 25 },
    { time: '16:00', temp: 27, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 75, humidity: 91, windSpeed: 18 },
    { time: '17:00', temp: 26, status: 'Berawan', icon: 'Cloud', precipitation: 55, humidity: 89, windSpeed: 14 },
    { time: '18:00', temp: 25, status: 'Berawan', icon: 'Cloud', precipitation: 40, humidity: 88, windSpeed: 11 },
    { time: '19:00', temp: 25, status: 'Cerah Berawan', icon: 'Moon', precipitation: 28, humidity: 89, windSpeed: 9 },
    { time: '20:00', temp: 24, status: 'Berawan', icon: 'Cloud', precipitation: 22, humidity: 90, windSpeed: 8 },
    { time: '21:00', temp: 24, status: 'Cerah Berawan', icon: 'Moon', precipitation: 18, humidity: 90, windSpeed: 8 },
    { time: '22:00', temp: 23, status: 'Berawan', icon: 'Moon', precipitation: 15, humidity: 91, windSpeed: 7 },
    { time: '23:00', temp: 23, status: 'Berawan', icon: 'Moon', precipitation: 15, humidity: 91, windSpeed: 7 },
  ],

  // Mariso, Makassar – Hujan Sedang (transitional, active wet season)
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan': [
    { time: '00:00', temp: 24, status: 'Berawan', icon: 'Moon', precipitation: 28, humidity: 85, windSpeed: 14 },
    { time: '01:00', temp: 24, status: 'Berawan', icon: 'Moon', precipitation: 25, humidity: 86, windSpeed: 13 },
    { time: '02:00', temp: 23, status: 'Cerah Berawan', icon: 'Moon', precipitation: 22, humidity: 87, windSpeed: 12 },
    { time: '03:00', temp: 23, status: 'Cerah Berawan', icon: 'Moon', precipitation: 20, humidity: 87, windSpeed: 11 },
    { time: '04:00', temp: 23, status: 'Berawan', icon: 'Moon', precipitation: 25, humidity: 87, windSpeed: 12 },
    { time: '05:00', temp: 24, status: 'Berawan', icon: 'Moon', precipitation: 30, humidity: 86, windSpeed: 14 },
    { time: '06:00', temp: 25, status: 'Berawan', icon: 'Cloud', precipitation: 35, humidity: 84, windSpeed: 16 },
    { time: '07:00', temp: 26, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 55, humidity: 86, windSpeed: 18 },
    { time: '08:00', temp: 27, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 60, humidity: 87, windSpeed: 19 },
    { time: '09:00', temp: 28, status: 'Berawan', icon: 'Cloud', precipitation: 45, humidity: 84, windSpeed: 20 },
    { time: '10:00', temp: 30, status: 'Berawan', icon: 'Cloud', precipitation: 40, humidity: 81, windSpeed: 22 },
    { time: '11:00', temp: 31, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 58, humidity: 82, windSpeed: 23 },
    { time: '12:00', temp: 32, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 82, humidity: 86, windSpeed: 25 },
    { time: '13:00', temp: 31, status: 'Badai Petir', icon: 'CloudLightning', precipitation: 95, humidity: 92, windSpeed: 30 },
    { time: '14:00', temp: 30, status: 'Badai Petir', icon: 'CloudLightning', precipitation: 90, humidity: 93, windSpeed: 28 },
    { time: '15:00', temp: 29, status: 'Hujan Lebat', icon: 'CloudLightning', precipitation: 80, humidity: 90, windSpeed: 24 },
    { time: '16:00', temp: 28, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 65, humidity: 88, windSpeed: 20 },
    { time: '17:00', temp: 27, status: 'Berawan', icon: 'Cloud', precipitation: 48, humidity: 86, windSpeed: 17 },
    { time: '18:00', temp: 26, status: 'Berawan', icon: 'Cloud', precipitation: 38, humidity: 85, windSpeed: 15 },
    { time: '19:00', temp: 26, status: 'Berawan', icon: 'Moon', precipitation: 30, humidity: 85, windSpeed: 14 },
    { time: '20:00', temp: 25, status: 'Cerah Berawan', icon: 'Moon', precipitation: 22, humidity: 86, windSpeed: 13 },
    { time: '21:00', temp: 25, status: 'Berawan', icon: 'Moon', precipitation: 28, humidity: 86, windSpeed: 13 },
    { time: '22:00', temp: 24, status: 'Berawan', icon: 'Moon', precipitation: 28, humidity: 86, windSpeed: 14 },
    { time: '23:00', temp: 24, status: 'Berawan', icon: 'Moon', precipitation: 28, humidity: 86, windSpeed: 14 },
  ],

  // Dauh Puri Kaja, Denpasar – Cerah Berawan (Bali, coastal warmth, moderate humidity)
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali': [
    { time: '00:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 78, windSpeed: 10 },
    { time: '01:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 79, windSpeed: 9 },
    { time: '02:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 80, windSpeed: 9 },
    { time: '03:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 2, humidity: 80, windSpeed: 8 },
    { time: '04:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 80, windSpeed: 9 },
    { time: '05:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 79, windSpeed: 10 },
    { time: '06:00', temp: 26, status: 'Cerah', icon: 'Sun', precipitation: 5, humidity: 77, windSpeed: 12 },
    { time: '07:00', temp: 27, status: 'Cerah', icon: 'Sun', precipitation: 3, humidity: 74, windSpeed: 13 },
    { time: '08:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 5, humidity: 72, windSpeed: 14 },
    { time: '09:00', temp: 30, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 8, humidity: 69, windSpeed: 16 },
    { time: '10:00', temp: 31, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 12, humidity: 66, windSpeed: 17 },
    { time: '11:00', temp: 32, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 64, windSpeed: 18 },
    { time: '12:00', temp: 32, status: 'Berawan', icon: 'Cloud', precipitation: 22, humidity: 66, windSpeed: 18 },
    { time: '13:00', temp: 31, status: 'Berawan', icon: 'Cloud', precipitation: 28, humidity: 70, windSpeed: 17 },
    { time: '14:00', temp: 31, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 42, humidity: 75, windSpeed: 16 },
    { time: '15:00', temp: 30, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 50, humidity: 78, windSpeed: 15 },
    { time: '16:00', temp: 29, status: 'Berawan', icon: 'Cloud', precipitation: 35, humidity: 76, windSpeed: 14 },
    { time: '17:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 20, humidity: 75, windSpeed: 13 },
    { time: '18:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 14, humidity: 76, windSpeed: 12 },
    { time: '19:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 8, humidity: 77, windSpeed: 11 },
    { time: '20:00', temp: 27, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 78, windSpeed: 10 },
    { time: '21:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 78, windSpeed: 10 },
    { time: '22:00', temp: 26, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 79, windSpeed: 10 },
    { time: '23:00', temp: 25, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 79, windSpeed: 10 },
  ],

  // Brontokusuman, Yogyakarta – Cerah Berawan (central Java, moderate, typical pre-kemarau)
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta': [
    { time: '00:00', temp: 22, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 82, windSpeed: 7 },
    { time: '01:00', temp: 21, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 83, windSpeed: 6 },
    { time: '02:00', temp: 21, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 84, windSpeed: 6 },
    { time: '03:00', temp: 20, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 84, windSpeed: 5 },
    { time: '04:00', temp: 20, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 85, windSpeed: 6 },
    { time: '05:00', temp: 21, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 84, windSpeed: 7 },
    { time: '06:00', temp: 23, status: 'Cerah', icon: 'Sun', precipitation: 5, humidity: 82, windSpeed: 8 },
    { time: '07:00', temp: 24, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 8, humidity: 79, windSpeed: 9 },
    { time: '08:00', temp: 26, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 10, humidity: 76, windSpeed: 10 },
    { time: '09:00', temp: 28, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 12, humidity: 73, windSpeed: 11 },
    { time: '10:00', temp: 30, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 69, windSpeed: 12 },
    { time: '11:00', temp: 31, status: 'Berawan', icon: 'Cloud', precipitation: 22, humidity: 67, windSpeed: 13 },
    { time: '12:00', temp: 32, status: 'Berawan', icon: 'Cloud', precipitation: 30, humidity: 66, windSpeed: 14 },
    { time: '13:00', temp: 32, status: 'Berawan', icon: 'Cloud', precipitation: 35, humidity: 67, windSpeed: 14 },
    { time: '14:00', temp: 31, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 58, humidity: 74, windSpeed: 16 },
    { time: '15:00', temp: 29, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 70, humidity: 80, windSpeed: 18 },
    { time: '16:00', temp: 27, status: 'Hujan Ringan', icon: 'CloudRain', precipitation: 62, humidity: 82, windSpeed: 15 },
    { time: '17:00', temp: 26, status: 'Berawan', icon: 'Cloud', precipitation: 42, humidity: 81, windSpeed: 12 },
    { time: '18:00', temp: 25, status: 'Berawan', icon: 'Cloud', precipitation: 28, humidity: 82, windSpeed: 10 },
    { time: '19:00', temp: 25, status: 'Cerah Berawan', icon: 'Moon', precipitation: 18, humidity: 82, windSpeed: 9 },
    { time: '20:00', temp: 24, status: 'Cerah Berawan', icon: 'Moon', precipitation: 12, humidity: 83, windSpeed: 8 },
    { time: '21:00', temp: 24, status: 'Cerah', icon: 'Moon', precipitation: 8, humidity: 83, windSpeed: 7 },
    { time: '22:00', temp: 23, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 83, windSpeed: 7 },
    { time: '23:00', temp: 22, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 83, windSpeed: 7 },
  ],
};

// ── Public 7-day forecast map ────────────────────────────────────────────────
export const hourlyForecastsMap: Record<string, HourlyForecast[]> = Object.fromEntries(
  Object.entries(hourlyBase).map(([city, base]) => [city, build7DayForecast(base, TODAY)])
);

export const transportStatusesMap: Record<string, TransportStatus[]> = {
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Arus lalu lintas utama (Tol Dalam Kota, Sudirman, Gatot Subroto) terpantau lancar. Cuaca cerah mendukung mobilitas optimal. Waspadai kemacetan rutin saat jam pulang kantor.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Soetta (CGK) & Halim (HLP) beroperasi normal. Visibilitas >9 km, tidak ada awan Cb signifikan. Tidak ada penundaan penerbangan akibat cuaca.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Gelombang Teluk Jakarta tenang (0.1–0.5 m). Penyeberangan ke Kepulauan Seribu aman dan kondusif bagi kapal cepat maupun perahu tradisional.'
    }
  ],
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Kondisi jalan raya di Surabaya (Tol MERR, A. Yani) terpantau kering dan aman. Namun suhu panas terik 35–37°C berpotensi menyebabkan kelelahan pada pengemudi jarak jauh.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Bandara Juanda (SUB) beroperasi normal. Waspadai turbulensi termal ringan pada penerbangan siang hari (10:00–15:00) akibat pemanasan permukaan daratan yang intens.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Selat Madura dan Pelabuhan Tanjung Perak kondusif dengan gelombang 0.5–1.25 m. Penyeberangan feri domestik Surabaya–Madura berjalan normal.'
    }
  ],
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Waspada jalanan licin di kawasan Lembang, Dago, dan Punclut pasca hujan sore. Pengendara roda dua disarankan membawa jas hujan dan mengurangi kecepatan.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Bandara Husein Sastranegara (BDO) beroperasi normal pagi hari. Rute sore (13:00–17:00) mungkin terdampak awan hujan lokal yang dapat menurunkan jarak pandang.'
    },
    {
      type: 'maritime',
      title: 'Wisata Air',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Aktivitas di Waduk Saguling dan Cirata cukup aman pagi hari. Waspadai perubahan cuaca lokal yang cepat saat sore hari. Hindari berada di danau saat petir.'
    }
  ],
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Ruas Jalan Medan–Berastagi berpotensi berkabut tebal di pagi hari. Waspadai genangan lokal di beberapa titik setelah hujan sore di kawasan Medan Utara.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Bandara Kualanamu (KNO) beroperasi normal. Jarak pandang 8 km. Waspadai pertumbuhan awan sel konvektif di jalur penerbangan utara Sumatera pada sore hari.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Perairan Selat Malaka terpantau tenang (0.5–1.0 m). Aman bagi kapal kargo dan nelayan tradisional. Kondisi angin Barat Daya mendukung pelayaran niaga regional.'
    }
  ],
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Potensi genangan di beberapa ruas jalan utama (Jl. Urip Sumoharjo, Jl. AP Pettarani) akibat hujan sedang. Pengemudi disarankan berhati-hati dan memantau info banjir.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Bandara Sultan Hasanuddin (UPG) beroperasi dengan perhatian khusus. Potensi wind shear akibat awan hujan aktif. Penerbangan siang hari dapat mengalami penundaan.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Awas',
      statusClass: 'bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
      description: 'Peringatan dini gelombang sedang-tinggi (1.25–2.5 m) di Selat Makassar selatan dan Teluk Bone. Nelayan kecil dan kapal tradisional DILARANG melaut hingga kondisi membaik.'
    }
  ],
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Kondisi jalan di Denpasar dan jalur wisata (Kuta, Seminyak, Ubud) terpantau aman dan cerah. Waspadai kepadatan lalu lintas wisata di titik-titik populer pada siang hari.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Bandara Ngurah Rai (DPS) beroperasi optimal. Jarak pandang excellent (>10 km). Rute domestik dan internasional berjalan normal tanpa hambatan cuaca.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Waspada gelombang sedang-tinggi (1.5–3.0 m) di Selat Bali selatan & perairan Kuta. Wisatawan diimbau mematuhi bendera merah dan tidak berenang di zona bahaya.'
    }
  ],
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta': [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Rute Jogja–Wonosari dan Parangtritis berpotensi hujan sore hingga malam. Waspadai jalanan licin dan berkabut di kawasan perbukitan menuju pantai selatan DIY.'
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Bandara YIA (Kulonprogo) dan Adisutjipto (JOG) beroperasi normal. Jarak pandang >10 km. Potensi turbulensi ringan di rute atas Jawa Tengah akibat awan Cb Occasional.'
    },
    {
      type: 'maritime',
      title: 'Maritim',
      status: 'Waspada',
      statusClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
      description: 'Peringatan gelombang tinggi (1.25–2.5 m) di pantai selatan DIY (Parangtritis, Depok, Drini). Wisatawan DILARANG berenang karena ancaman rip current yang berbahaya.'
    }
  ]
};

// Backwards-compatible export (fallback to Jakarta if needed)
export const transportStatuses: TransportStatus[] = transportStatusesMap['Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta'];

export const warningAlertsMap: Record<string, WarningAlert[]> = {
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta': [
    {
      id: 'jkt-alert-1',
      severity: 'Waspada',
      title: 'Potensi Banjir Rob Pesisir Utara',
      region: 'Muara Baru, Pluit, Penjaringan',
      description: 'Pasang surut air laut diprakirakan mencapai +0.8 m di atas normal. Warga pesisir utara Jakarta diminta waspada terhadap banjir rob pukul 06:00–09:00 WIB.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'jkt-alert-2',
      severity: 'Siaga',
      title: 'Kualitas Udara Tidak Sehat (AQI >150)',
      region: 'Jakarta Pusat, Jakarta Selatan',
      description: 'Konsentrasi PM2.5 meningkat akibat cuaca cerah dengan angin lemah. Kelompok rentan (anak-anak, lansia, penderita asma) disarankan membatasi aktivitas luar ruangan.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'jkt-alert-3',
      severity: 'Waspada',
      title: 'Gelombang Panas Urban (UHI)',
      region: 'Seluruh Wilayah DKI Jakarta',
      description: 'Efek Urban Heat Island memperkuat suhu permukaan hingga 38–40°C di area beraspal padat. Warga diimbau memperbanyak konsumsi cairan dan menghindari paparan matahari langsung.',
      date: 'Jumat, 20 Juni 2026'
    }
  ],
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur': [
    {
      id: 'sby-alert-1',
      severity: 'Waspada',
      title: 'Suhu Ekstrem Panas (>37°C)',
      region: 'Surabaya Pusat & Timur',
      description: 'Diprakirakan suhu maksimum mencapai 37–38°C pada pukul 12:00–15:00 WIB. Risiko heat stroke pada pekerja lapangan. Sediakan tempat berteduh dan air minum yang cukup.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'sby-alert-2',
      severity: 'Waspada',
      title: 'Angin Kencang Selat Madura',
      region: 'Perairan Selat Madura, Tanjung Perak',
      description: 'Kecepatan angin di Selat Madura diperkirakan 20–30 knot disertai gelombang 1–1.5 m. Kapal nelayan kecil harap meningkatkan kewaspadaan saat berlayar.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'sby-alert-3',
      severity: 'Siaga',
      title: 'Kekeringan Meteorologis',
      region: 'Surabaya Barat, Gresik',
      description: 'Defisit curah hujan kumulatif mencapai >150 mm dalam 30 hari terakhir. Petani di wilayah pertanian Surabaya Barat diminta berhemat sumber daya air irigasi.',
      date: 'Kamis, 19 Juni 2026'
    }
  ],
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat': [
    {
      id: 'bdg-alert-1',
      severity: 'Siaga',
      title: 'Hujan Lebat Disertai Petir',
      region: 'Bandung Barat, Lembang, Cimahi',
      description: 'Potensi hujan lebat (>50 mm/jam) disertai kilat/petir dan angin kencang di kawasan perbukitan Bandung Utara pada pukul 13:00–17:00 WIB.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'bdg-alert-2',
      severity: 'Waspada',
      title: 'Longsor & Banjir Bandang',
      region: 'Cicalengka, Majalaya, Banjaran',
      description: 'Curah hujan tinggi meningkatkan risiko tanah longsor di lereng perbukitan. Warga di kawasan rawan longsor diminta memperhatikan tanda-tanda retakan tanah.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'bdg-alert-3',
      severity: 'Waspada',
      title: 'Kabut Tebal Pagi Hari',
      region: 'Lembang, Punclut, Ciwidey',
      description: 'Jarak pandang <200 m diprakirakan terjadi antara pukul 04:00–08:00 WIB di kawasan wisata dataran tinggi. Pengemudi diminta menggunakan lampu kabut.',
      date: 'Kamis, 19 Juni 2026'
    }
  ],
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara': [
    {
      id: 'mdn-alert-1',
      severity: 'Waspada',
      title: 'Hujan Lebat Sore Hari',
      region: 'Medan Utara, Medan Belawan',
      description: 'Diprakirakan hujan lebat (>40 mm/jam) di pesisir Medan Belawan dan Medan Utara pada pukul 14:00–18:00 WIB. Potensi genangan di kawasan padat penduduk.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'mdn-alert-2',
      severity: 'Siaga',
      title: 'Awan Cumulonimbus Aktif',
      region: 'Deli Serdang, Langkat',
      description: 'Terdapat pertumbuhan awan Cb (Cumulonimbus) yang signifikan di wilayah Deli Serdang. Berpotensi menghasilkan hujan lebat disertai kilat dan angin puting beliung lokal.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'mdn-alert-3',
      severity: 'Waspada',
      title: 'Kabut Asap (Karhutla)',
      region: 'Sumatera Utara Bagian Barat',
      description: 'Titik panas (hotspot) karhutla terdeteksi di wilayah Tapanuli Utara. Kualitas udara berpotensi menurun menjadi tidak sehat di hari berikutnya jika asap bergerak ke arah timur.',
      date: 'Kamis, 19 Juni 2026'
    }
  ],
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan': [
    {
      id: 'mks-alert-1',
      severity: 'Awas',
      title: 'Badai Petir & Angin Kencang',
      region: 'Makassar, Gowa, Takalar',
      description: 'Potensi badai petir disertai angin kencang 40–60 km/jam di wilayah Makassar dan sekitarnya pukul 12:00–16:00 WITA. Warga diimbau menghindari pohon besar dan bangunan tak kokoh.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'mks-alert-2',
      severity: 'Awas',
      title: 'Gelombang Tinggi Selat Makassar',
      region: 'Selat Makassar, Teluk Bone Bagian Barat',
      description: 'Gelombang laut 2.0–3.5 meter di Selat Makassar bagian selatan dan Teluk Bone. Kapal berukuran kecil-menengah dilarang melintas. Nelayan agar segera kembali ke daratan.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'mks-alert-3',
      severity: 'Siaga',
      title: 'Banjir Perkotaan',
      region: 'Kecamatan Rappocini, Panakkukang',
      description: 'Hujan dengan intensitas tinggi berpotensi menyebabkan banjir genangan setinggi 30–60 cm di beberapa titik rawan banjir Makassar. Warga diminta mempersiapkan mitigasi.',
      date: 'Kamis, 19 Juni 2026'
    }
  ],
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali': [
    {
      id: 'dps-alert-1',
      severity: 'Waspada',
      title: 'Gelombang Tinggi Perairan Selatan Bali',
      region: 'Pantai Kuta, Seminyak, Uluwatu',
      description: 'Gelombang laut mencapai 1.5–3.0 m di pesisir selatan Bali. Wisatawan dan peselancar diimbau mematuhi peringatan bendera merah. Kegiatan snorkeling/diving dibatasi.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'dps-alert-2',
      severity: 'Waspada',
      title: 'UV Indeks Sangat Tinggi (8+)',
      region: 'Seluruh Wilayah Bali',
      description: 'Indeks UV mencapai kategori Sangat Tinggi (8–9) pada pukul 10:00–14:00 WITA. Wisatawan dan masyarakat disarankan menggunakan tabir surya SPF 50+ dan pakaian pelindung.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'dps-alert-3',
      severity: 'Siaga',
      title: 'Hujan Lokal Sore Mendadak',
      region: 'Ubud, Gianyar, Bangli',
      description: 'Kawasan pegunungan tengah Bali berpotensi hujan lebat lokal berdurasi singkat (15–30 menit) pada pukul 14:00–16:00 WITA. Wisatawan di jalur treking agar segera berlindung.',
      date: 'Kamis, 19 Juni 2026'
    }
  ],
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta': [
    {
      id: 'yog-alert-1',
      severity: 'Siaga',
      title: 'Rip Current Pantai Selatan DIY',
      region: 'Parangtritis, Pantai Depok, Pantai Baron',
      description: 'Arus balik (rip current) terdeteksi kuat di sepanjang pantai selatan DIY. Wisatawan DILARANG KERAS berenang. Nelayan diminta memperhatikan kondisi gelombang sebelum berlayar.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'yog-alert-2',
      severity: 'Waspada',
      title: 'Hujan Lebat & Angin Kencang',
      region: 'Sleman, Kulonprogo, Gunung Kidul',
      description: 'Potensi hujan lebat disertai angin kencang (>40 km/jam) di wilayah Sleman, Kulonprogo, dan Gunung Kidul pukul 13:00–18:00 WIB. Waspada pohon tumbang dan baliho.',
      date: 'Jumat, 20 Juni 2026'
    },
    {
      id: 'yog-alert-3',
      severity: 'Waspada',
      title: 'Aktivitas Vulkanik Merapi (Level II)',
      region: 'Lereng Gunung Merapi, Sleman Utara',
      description: 'PVMBG melaporkan peningkatan aktivitas vulkanik Gunung Merapi status Waspada (Level II). Masyarakat di KRB II diminta mewaspadai potensi guguran lava dan awan panas.',
      date: 'Kamis, 19 Juni 2026'
    }
  ]
};

// Backwards-compatible export (fallback to Jakarta if needed)
export const warningAlerts: WarningAlert[] = warningAlertsMap['Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta'];

export const newsArticles: NewsArticle[] = [
  {
    id: 'news-1',
    category: 'Iklim',
    title: 'Analisis Fenomena El Niño Lemah dan Dampaknya terhadap Musim Kemarau 2026',
    summary: 'BMKG merilis peta sebaran anomali suhu muka laut pasifik timur yang menunjukkan indikasi El Niño lemah pada pertengahan tahun ini.',
    date: '10 Juni 2026',
    imageUrl: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'news-2',
    category: 'Gempabumi',
    title: 'Mitigasi Gempa Megathrust: BMKG Sosialisasikan Jalur Evakuasi Baru di Pantai Selatan',
    summary: 'Kolaborasi BMKG dengan BNPB memasang 24 sirene peringatan dini tsunami tambahan dan rambu evakuasi sepanjang garis pantai DIY.',
    date: '08 Juni 2026',
    imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'news-3',
    category: 'Teknologi',
    title: 'Satelit Himawari-9 Optimalkan Deteksi Karhutla di Wilayah Kalimantan Barat',
    summary: 'Menggunakan sensor resolusi termal terbaru, data satelit diperbarui setiap 10 menit untuk memberikan notifikasi hotspot langsung ke Damkar.',
    date: '05 Juni 2026',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
  }
];

export const cityAnalysisMap: Record<string, CityAnalysis> = {
  'Gambir, Kec. Gambir, Jakarta Pusat, DKI Jakarta': {
    locationName: 'Daerah Khusus Ibukota Jakarta',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Cuaca Jakarta hari ini diprakirakan cerah (28°C - 36°C). Sangat mendukung mobilitas perkotaan dan logistik darat, namun disarankan menggunakan pelindung UV tingkat tinggi pada siang hari.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Tinggi gelombang di Teluk Jakarta terpantau tenang (0,1 - 0,5 meter). Aktivitas penyeberangan menuju Kepulauan Seribu aman dan kondusif bagi kapal cepat maupun perahu tradisional.'
    },
    air: {
      title: 'Penerbangan (CGK & HLP)',
      desc: 'Kondisi operasional Bandara Soekarno-Hatta dan Halim Perdanakusuma aman dengan visibilitas di atas 9 km. Tidak ada awan Cumulonimbus (Cb) signifikan di atas wilayah udara Jakarta.'
    }
  },
  'Gubeng, Kec. Gubeng, Kota Surabaya, Jawa Timur': {
    locationName: 'Kota Surabaya, Jawa Timur',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Cuaca Surabaya diprakirakan cerah berawan dengan suhu panas terik (27°C - 37°C). Kurangi aktivitas fisik luar ruangan pada tengah hari untuk menghindari dehidrasi akibat suhu tinggi.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Gelombang di Selat Madura dan pelabuhan Tanjung Perak berkisar rendah hingga sedang (0,5 - 1,25 meter). Kegiatan pelayaran penyeberangan feri domestik aman terkendali.'
    },
    air: {
      title: 'Penerbangan (SUB)',
      desc: 'Operasional Bandara Juanda aman. Harap waspadai potensi turbulensi termal tingkat ringan di rute penerbangan siang hari karena pemanasan permukaan daratan yang cukup intens.'
    }
  },
  'Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat': {
    locationName: 'Kota Bandung, Jawa Barat',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Diprakirakan hujan ringan di sore hari (20°C - 28°C). Diimbau bagi pengendara roda dua untuk membawa jas hujan dan mewaspadai jalanan licin di kawasan perbukitan.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Wisata Air',
      desc: 'Wilayah pegunungan tidak memiliki laut langsung. Namun diimbau kewaspadaan bagi wisata air danau/waduk di sekitar Bandung Barat terhadap perubahan cuaca lokal yang cepat.'
    },
    air: {
      title: 'Penerbangan (BDO)',
      desc: 'Bandara Husein Sastranegara aman secara umum, namun rute penerbangan sore hari perlu mewaspadai awan hujan lokal yang dapat menurunkan jarak pandang.'
    }
  },
  'Sei Sikambing C II, Kec. Medan Helvetia, Kota Medan, Sumatera Utara': {
    locationName: 'Kota Medan, Sumatera Utara',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Cuaca Medan diprakirakan berawan (24°C - 32°C). Cukup nyaman untuk mobilitas darat, namun siapkan payung menghadapi potensi hujan lokal dengan durasi singkat di sore hari.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Perairan Selat Malaka terpantau kondusif dengan tinggi gelombang rendah (0,5 - 1,0 meter). Aman untuk pelayaran kapal kargo niaga dan nelayan tradisional melaut.'
    },
    air: {
      title: 'Penerbangan (KNO)',
      desc: 'Bandara Internasional Kualanamu beroperasi normal dengan jarak pandang 8 km. Waspadai pertumbuhan awan sel sel kecil di rute penerbangan utara Sumatera.'
    }
  },
  'Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan': {
    locationName: 'Kota Makassar, Sulawesi Selatan',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Diprakirakan hujan sedang (25°C - 33°C). Waspadai potensi genangan air di beberapa ruas jalan utama kota dan persiapkan payung/mantel.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Peringatan dini gelombang sedang (1,25 - 2,0 meter) di Selat Makassar bagian selatan. Nelayan kecil diimbau membatasi jarak melaut demi keselamatan.'
    },
    air: {
      title: 'Penerbangan (UPG)',
      desc: 'Bandara Sultan Hasanuddin beroperasi dengan perhatian khusus terhadap potensi wind shear (perubahan arah angin mendadak) akibat awan hujan aktif.'
    }
  },
  'Dauh Puri Kaja, Kec. Denpasar Utara, Kota Denpasar, Bali': {
    locationName: 'Kota Denpasar, Bali',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Cuaca Bali cerah berawan (26°C - 32°C). Sangat baik untuk aktivitas pariwisata luar ruangan dan kunjungan pantai.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Waspadai tinggi gelombang sedang hingga tinggi (1,5 - 3,0 meter) di Selat Bali bagian selatan dan perairan Kuta. Wisatawan diimbau mematuhi bendera merah larangan berenang.'
    },
    air: {
      title: 'Penerbangan (DPS)',
      desc: 'Operasional Bandara Ngurah Rai kondusif dengan jarak pandang optimal. Rute penerbangan domestik dan internasional aman terkendali.'
    }
  },
  'Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, DI Yogyakarta': {
    locationName: 'Kabupaten Bantul, Daerah Istimewa Yogyakarta (DIY)',
    land: {
      title: 'Aktivitas Darat',
      desc: 'Cuaca Bantul hari ini diprakirakan cerah berawan (23°C - 31°C). Kondisi ini sangat ideal untuk aktivitas luar ruangan, namun disarankan melindungi diri dari sengatan terik matahari pada siang hari.'
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: 'Peringatan gelombang sedang (1,25 - 2,5 meter) di pantai selatan Bantul (seperti Pantai Parangtritis dan Pantai Depok). Wisatawan sangat dilarang berenang ke tengah karena adanya ancaman rip current (arus balik) yang kuat. Nelayan kecil diimbau ekstra waspada saat melaut.'
    },
    air: {
      title: 'Penerbangan (YIA & JOG)',
      desc: 'Kondisi operasional di bandara YIA sangat aman dengan jarak pandang di atas 10 km. Namun, rute penerbangan di atas Pulau Jawa berpotensi mengalami turbulensi ringan karena sebaran awan konvektif Cumulonimbus berkategori Occasional (cakupan 50% - 75%).'
    }
  }
};

export function generateMockWeatherForCity(cityName: string) {
  if (weatherDataMap[cityName]) return;

  const temp = Math.floor(Math.random() * 5) + 29; 
  const statusOptions = ['Cerah Berawan', 'Berawan', 'Cerah', 'Hujan Ringan'];
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  
  const statusIconMap: Record<string, string> = {
    'Cerah': 'Sun',
    'Cerah Berawan': 'SunDim',
    'Berawan': 'Cloud',
    'Hujan Ringan': 'CloudRain'
  };
  const icon = statusIconMap[status] || 'Cloud';

  weatherDataMap[cityName] = {
    city: cityName,
    temp,
    status,
    feelLike: temp + (Math.random() > 0.5 ? 2 : -1),
    tempMin: temp - 4,
    tempMax: temp + 3,
    humidity: Math.floor(Math.random() * 20) + 65, 
    windSpeed: Math.floor(Math.random() * 10) + 8, 
    uvIndex: Math.floor(Math.random() * 6) + 4,   
    visibility: Math.floor(Math.random() * 3) + 8, 
    icon
  };

  const base24: Omit<HourlyForecast, 'date'>[] = [
    { time: '00:00', temp: temp - 5, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 85, windSpeed: 7 },
    { time: '01:00', temp: temp - 5, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 85, windSpeed: 7 },
    { time: '02:00', temp: temp - 6, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 86, windSpeed: 6 },
    { time: '03:00', temp: temp - 6, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 86, windSpeed: 6 },
    { time: '04:00', temp: temp - 6, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 86, windSpeed: 6 },
    { time: '05:00', temp: temp - 6, status: 'Cerah Berawan', icon: 'CloudMoon', precipitation: 8, humidity: 86, windSpeed: 6 },
    { time: '06:00', temp: temp - 5, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 10, humidity: 84, windSpeed: 8 },
    { time: '07:00', temp: temp - 4, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 12, humidity: 80, windSpeed: 9 },
    { time: '08:00', temp: temp - 2, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 75, windSpeed: 10 },
    { time: '09:00', temp: temp - 1, status: 'Cerah', icon: 'Sun', precipitation: 10, humidity: 70, windSpeed: 11 },
    { time: '10:00', temp: temp, status: 'Cerah', icon: 'Sun', precipitation: 8, humidity: 68, windSpeed: 12 },
    { time: '11:00', temp: temp + 1, status: 'Cerah', icon: 'Sun', precipitation: 5, humidity: 65, windSpeed: 13 },
    { time: '12:00', temp: temp + 2, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 10, humidity: 62, windSpeed: 14 },
    { time: '13:00', temp: temp + 2, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 62, windSpeed: 14 },
    { time: '14:00', temp: temp + 1, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 18, humidity: 64, windSpeed: 13 },
    { time: '15:00', temp: temp, status: 'Berawan', icon: 'Cloud', precipitation: 25, humidity: 68, windSpeed: 12 },
    { time: '16:00', temp: temp - 1, status: 'Berawan', icon: 'Cloud', precipitation: 20, humidity: 72, windSpeed: 11 },
    { time: '17:00', temp: temp - 2, status: 'Cerah Berawan', icon: 'SunDim', precipitation: 15, humidity: 75, windSpeed: 10 },
    { time: '18:00', temp: temp - 3, status: 'Berawan', icon: 'Cloud', precipitation: 12, humidity: 80, windSpeed: 9 },
    { time: '19:00', temp: temp - 4, status: 'Cerah Berawan', icon: 'Moon', precipitation: 10, humidity: 82, windSpeed: 8 },
    { time: '20:00', temp: temp - 4, status: 'Cerah Berawan', icon: 'Moon', precipitation: 8, humidity: 83, windSpeed: 8 },
    { time: '21:00', temp: temp - 4, status: 'Cerah', icon: 'Moon', precipitation: 5, humidity: 84, windSpeed: 7 },
    { time: '22:00', temp: temp - 5, status: 'Cerah', icon: 'Moon', precipitation: 4, humidity: 84, windSpeed: 7 },
    { time: '23:00', temp: temp - 5, status: 'Cerah', icon: 'Moon', precipitation: 3, humidity: 84, windSpeed: 7 },
  ];
  
  hourlyForecastsMap[cityName] = build7DayForecast(base24, TODAY);

  transportStatusesMap[cityName] = [
    {
      type: 'road',
      title: 'Jalan Raya',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: `Lalu lintas di sekitar ${cityName} terpantau lancar dan kondusif. Cuaca cerah mendukung kenyamanan berkendara.`
    },
    {
      type: 'air',
      title: 'Penerbangan',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Jarak pandang udara di bandara sekitar wilayah ini sangat baik. Tidak ada potensi hambatan cuaca ekstrem.'
    },
    {
      type: 'maritime',
      title: 'Pelabuhan & Pesisir',
      status: 'Aman',
      statusClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Kondisi pasang surut laut dan tinggi gelombang sekitar pesisir terpantau normal. Operasional kapal rakyat berjalan aman.'
    }
  ];

  warningAlertsMap[cityName] = [
    {
      id: `custom-alert-1`,
      severity: 'Waspada',
      title: 'Kondisi Indeks UV Tinggi',
      region: cityName,
      description: 'Paparan sinar ultraviolet diprakirakan cukup kuat pada siang hari pukul 11:00–14:00 WIB. Disarankan menggunakan tabir surya atau pelindung saat beraktivitas di luar ruangan.',
      date: 'Hari ini'
    }
  ];

  cityAnalysisMap[cityName] = {
    locationName: cityName,
    land: {
      title: 'Aktivitas Darat',
      desc: `Cuaca di ${cityName} terpantau sangat baik untuk beraktivitas di luar ruangan. Pastikan tubuh tetap terhidrasi dengan baik.`
    },
    sea: {
      title: 'Aktivitas Pesisir & Laut',
      desc: `Tinggi gelombang di perairan sekitar terpantau berkisar antara 0,5 - 1,5 meter, aman bagi nelayan sedang dan kapal wisata.`
    },
    air: {
      title: 'Penerbangan Lokal',
      desc: 'Jarak pandang horizontal mendatar terpantau di atas 10 km, operasional penerbangan umum dan taksi udara berjalan aman.'
    }
  };
}

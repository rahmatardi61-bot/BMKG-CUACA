// Generator narasi dinamis untuk card aktivitas (audit #1: AroundActivityPanel/WeatherActivity).
// Fakta dari WeatherData (live BMKG atau mock) → template narasi sesuai kondisi.
// ponytail: heuristic kualitatif — tanpa angka gelombang palsu; upgrade ke maritim
// public_api (wave_cat/warning_desc) kalau butuh angka resmi.
import type { WeatherData, HourlyForecast, CityAnalysis } from '../types/weather';
import type { AdditionalWeatherInfo } from '../data/weatherHelpers';

const pct = (n: number) => `${n}%`;
const kmh = (n: number) => `${n} km/h`;

/** nama kota pendek: "Gambir, Kec. Gambir, Kota Jakarta Pusat, DKI Jakarta" → "Gambir" */
export function shortCityName(city: string): string {
  return city.split(',')[0].trim();
}

/** potensi hujan maksimum hari ini dari forecast jam-an */
function peakRainToday(forecasts: HourlyForecast[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const rows = forecasts.filter(f => f.date === today && typeof f.precipitation === 'number');
  return rows.length ? Math.max(...rows.map(f => f.precipitation!)) : 0;
}

function landNarrative(w: WeatherData, rain: number, uv: number, cityName: string): string {
  const parts: string[] = [];
  const kondisi = w.status || 'Cerah';
  parts.push(`Cuaca ${cityName} saat ini ${kondisi.toLowerCase()} dengan suhu ${Math.round(w.temp)}°C (terasa ${Math.round(w.feelLike)}°C)`);
  if (rain >= 50) parts.push(`potensi hujan mencapai ${pct(rain)} hari ini — siapkan jas hujan bila beraktivitas di luar`);
  else if (rain >= 20) parts.push(`ada potensi hujan ringan (${pct(rain)}), tetap waspada perubahan mendadak`);
  if (uv >= 8) parts.push('indeks UV tinggi, gunakan pelindung matahari saat siang hari');
  if (w.temp >= 33) parts.push('cuaca panas, perbanyak minum dan hindari aktivitas fisik berat di siang hari');
  else if (w.temp <= 22) parts.push('udara sejuk, nyaman untuk aktivitas luar ruangan');
  if (w.windSpeed >= 25) parts.push(`angin cukup kencang (${kmh(w.windSpeed)}), hati-hati saat berkendara roda dua atau memakai payung`);
  return parts.join(', ').replace(/^([^.]*), /, '$1, ') + '.';
}

function seaNarrative(w: WeatherData, rain: number): string {
  const wind = w.windSpeed;
  if (rain >= 50 || wind >= 30) {
    return `Cuaca saat ini ${w.status.toLowerCase()} dengan angin hingga ${kmh(wind)} — gelombang cenderung berkembang, tunda aktivitas pelayaran dan perikanan sampai kondisi membaik.`;
  }
  if (wind >= 15) {
    return `Angin berhembus ${kmh(wind)} dengan ${w.status.toLowerCase()} — gelombang cenderung sedang, pelayaran perahu kecil disarankan berhati-hati dan pantau peringatan BMKG.`;
  }
  return `Angin lembut ${kmh(wind)} dan cuaca ${w.status.toLowerCase()} — kondisi perairan cenderung tenang, mendukung aktivitas pesisir dan pelayaran lokal. Tetap pantau pembaruan cuaca.`;
}

function airNarrative(w: WeatherData, rain: number): string {
  const vis = Math.round(w.visibility);
  if (rain >= 50 || /petir|badai/i.test(w.status)) {
    return `Hujan ${w.status.toLowerCase()} menurunkan jarak pandang di sekitar bandara — waspadai pertumbuhan awan Cb yang dapat mempengaruhi jadwal penerbangan.`;
  }
  if (vis >= 9) {
    return `Visibilitas baik (${vis} km) dengan ${w.status.toLowerCase()} — kondisi mendukung operasional penerbangan normal.`;
  }
  return `Visibilitas terpantau ${vis} km dengan ${w.status.toLowerCase()} — potensi keterlambatan ringan, pantau informasi bandara.`;
}

/**
 * Susun CityAnalysis dari data cuaca (live BMKG / mock) untuk kota mana pun.
 * Dipakai MainDashboard (WeatherActivity) & AroundActivityPanel — menggantikan
 * narasi statis cityAnalysisMap.
 */
export function buildCityAnalysis(
  weatherData: WeatherData,
  selectedCity: string,
  forecasts: HourlyForecast[] = [],
  additionalInfo?: AdditionalWeatherInfo | null
): CityAnalysis {
  const w = weatherData;
  const cityName = shortCityName(selectedCity) || 'wilayah Anda';
  const rain = peakRainToday(forecasts);
  const arah = additionalInfo?.windDir ? `, angin dari arah ${additionalInfo.windDir.toLowerCase()}` : '';
  return {
    locationName: selectedCity,
    land: { title: 'Aktivitas Darat', desc: landNarrative(w, rain, w.uvIndex, cityName) + arah },
    sea: { title: 'Aktivitas Pesisir & Laut', desc: seaNarrative(w, rain) },
    air: { title: 'Aktivitas Penerbangan', desc: airNarrative(w, rain) },
  };
}

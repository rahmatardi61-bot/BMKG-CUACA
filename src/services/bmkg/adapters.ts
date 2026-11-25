// Adapter: bentuk normal /api/* → types UI existing (src/types/weather.ts,
// weatherHelpers.ts).
//
// Sejak dashboard & widget memakai endpoint /api/*, fungsi di sini TIDAK lagi
// menerjemahkan nama field BMKG (itu tugas lib/normalize.js di server). Yang
// tersisa hanya lapisan UI: nama ikon, teks Indonesia, bentuk yang diharapkan
// komponen.
//
// Kesetaraan perilaku dijaga lib/normalize.check.js: input = fixture mentah
// (lib/fixtures/raw/), patokan = hasil sebelum refactor
// (lib/fixtures/expected.json).
import type { HourlyForecast, NewsArticle, WarningAlert, WeatherData } from '../../types/weather';
import type { AdditionalWeatherInfo } from '../../data/weatherHelpers';
import type { ApiAlerts, ApiCurrent, ApiForecast, ApiNews, ApiRegion, ApiSunTimes } from '../../types/api';

// ── condition → nama icon lucide (format mock: 'Sun', 'CloudRain', dst.) ─────
function descToIcon(desc: string, isNight: boolean): string {
  const d = desc.toLowerCase();
  if (d.includes('petir') || d.includes('kilat')) return 'CloudLightning';
  if (d.includes('hujan lebat') || d.includes('hujan deras')) return 'CloudRainWind';
  if (d.includes('hujan')) return 'CloudRain';
  if (d.includes('salju')) return 'Snowflake';
  if (d.includes('kabut') || d.includes('kabur') || d.includes('asap')) return 'CloudFog';
  if (d.includes('berawan tebal') || d.includes('mendung')) return 'Cloudy';
  if (d.includes('cerah berawan')) return isNight ? 'CloudMoon' : 'CloudSun';
  if (d.includes('berawan')) return 'Cloud';
  return isNight ? 'Moon' : 'Sun'; // cerah
}

function isNightHour(time: string): boolean {
  const h = Number(time.slice(0, 2));
  return h < 5 || h >= 18;
}

/** Satu jam bentuk normal → HourlyForecast (menambah `icon`, `status`). */
function hourToForecast(h: ApiForecast['hours'][number]): HourlyForecast {
  return {
    time: h.time,
    date: h.date,
    temp: h.temp,
    status: h.condition,
    icon: descToIcon(h.condition, isNightHour(h.time)),
    precipitation: h.precipitation,
    humidity: h.humidity,
    windSpeed: h.windSpeed,
  };
}

/** GET /api/weather/forecast → HourlyForecast[] */
export function forecastToHourly(res: ApiForecast): HourlyForecast[] {
  return [...(res.hours ?? [])].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(hourToForecast);
}

/** GET /api/weather/current → WeatherData */
export function currentToWeatherData(res: ApiCurrent, city: string, hourly: HourlyForecast[]): WeatherData {
  const o = res.observation;
  const today = hourly.filter((h) => h.date === o.date);
  const temps = today.map((h) => h.temp);
  return {
    city,
    temp: o.temp,
    status: o.condition,
    feelLike: o.derived.feelLike,
    tempMin: temps.length ? Math.min(...temps) : o.temp,
    tempMax: temps.length ? Math.max(...temps) : o.temp,
    humidity: o.humidity,
    windSpeed: o.windSpeed,
    uvIndex: o.derived.uvIndex,
    // ponytail: UI masih memakai number (0 = "tidak ada data"). Kontrak API
    // mengirim null; menampilkan "—" di kartu perlu perubahan UI terpisah.
    visibility: o.visibility ?? 0,
    icon: descToIcon(o.condition, isNightHour(o.time)),
  };
}

/** GET /api/weather/alerts → WarningAlert[] (untuk AlertsPanel) */
export function alertsToPanel(res: ApiAlerts, region: string): WarningAlert[] {
  const LABEL: Record<string, string> = { today: 'Hari Ini', tomorrow: 'Besok' };
  return (res.alerts ?? []).map((a) => ({
    id: `bmkg-${a.day}-${region}`,
    severity: (['Awas', 'Siaga', 'Waspada'].includes(a.severity) ? a.severity : 'Waspada') as WarningAlert['severity'],
    title: `Peringatan Cuaca — ${LABEL[a.day] ?? a.day}`,
    description: a.description,
    region,
    date: new Date().toISOString().slice(0, 10),
  }));
}

/** GET /api/weather/nowcast → WarningAlert[] */
export function nowcastToAlerts(
  res: { alerts: Array<{ id: string; severity: string; title: string; description: string; region: string; date: string }> },
): WarningAlert[] {
  return (res.alerts ?? []).map((a) => ({
    id: `bmkg-${a.id}`,
    severity: (['Awas', 'Siaga', 'Waspada'].includes(a.severity) ? a.severity : 'Waspada') as WarningAlert['severity'],
    title: a.title,
    description: a.description,
    region: a.region,
    date: a.date,
  }));
}

/** GET /api/sky/sun-times + arah angin → AdditionalWeatherInfo (HeroWeatherCard) */
export function sunTimesToAdditional(
  res: ApiSunTimes | null,
  wind: { wd: string; wd_deg: number } | null,
): AdditionalWeatherInfo | null {
  if (!res?.sunrise) return null;
  // detail.tsx lama memakai "HH:MM"; API mengirim "HH:MM:SS"
  const hm = (t: string | null) => (t ? t.slice(0, 5) : '-');
  return {
    windDir: wind?.wd || 'Varia',
    windAngle: wind?.wd_deg ?? 0,
    sunrise: hm(res.sunrise),
    sunset: hm(res.sunset),
    moonPhase: res.moonPhase ?? '-',
    moonIllumination: res.moonIllumination ?? '0',
    moonrise: hm(res.moonrise),
    moonset: hm(res.moonset),
  };
}

/** GET /api/news → NewsArticle[] (video dulu, lalu artikel) */
export function newsToArticles(res: ApiNews): NewsArticle[] {
  const videos: NewsArticle[] = (res.videos ?? []).slice(0, 5).map((v, i) => ({
    id: `bmkg-video-${i}`,
    category: 'Video BMKG',
    title: v.title,
    summary: 'Video prakiraan cuaca resmi BMKG.',
    date: new Date().toISOString().slice(0, 10),
    imageUrl: v.thumbnail ?? '',
  }));
  const posts: NewsArticle[] = (res.posts ?? []).slice(0, 5).map((p, i) => ({
    id: `bmkg-post-${p.id ?? i}`,
    category: p.category || 'Berita',
    title: p.title,
    summary: p.summary.slice(0, 140),
    date: p.date,
    imageUrl: p.imageUrl ?? '',
  }));
  return [...posts, ...videos];
}

/** GET /api/geo/region → alamat terformat ("Desa, Kec. X, Kotkab, Provinsi") */
export function regionToAddress(r: ApiRegion): string {
  return [r.village, r.district ? `Kec. ${r.district}` : '', r.city, r.province].filter(Boolean).join(', ');
}

// Adapter: response API BMKG → types UI existing (src/types/weather.ts, weatherHelpers.ts)
// Keputusan penyesuaian satuan/unit didokumentasikan di docs/api-mapping/TEAM-NOTES.md
import type { HourlyForecast, NewsArticle, WarningAlert, WeatherData } from '../../types/weather';
import type { AdditionalWeatherInfo } from '../../data/weatherHelpers';
import type {
  BmkgForecastResponse,
  BmkgPresentWxResponse,
  BmkgSunsetResponse,
  BmkgVideoItem,
  BmkgWarningResponse,
  BmkgWeatherItem,
} from '../../types/bmkg';

// ── weather_desc → nama icon lucide (format mock: 'Sun', 'CloudRain', dst.) ──
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

function toLocalDate(iso: string): { date: string; time: string } {
  // "2026-09-08 15:00:00" (waktu lokal Indonesia dari API)
  const [date, time] = iso.split(' ');
  return { date, time: (time || '00:00').slice(0, 5) };
}

function itemToHourly(it: BmkgWeatherItem): HourlyForecast {
  const { date, time } = toLocalDate(it.local_datetime);
  const hour = Number(time.slice(0, 2));
  const isNight = hour < 5 || hour >= 18;
  // ponytail: UI mock memakai % — konversi mm→% skala sederhana (5mm≈100%);
  // penyesuaian final jadi bahan diskusi tim (TEAM-NOTES.md)
  const precipitation = it.tp <= 0 ? 0 : Math.min(100, Math.round(it.tp * 20));
  return {
    time,
    date,
    temp: Math.round(it.t),
    status: it.weather_desc,
    icon: descToIcon(it.weather_desc, isNight),
    precipitation,
    humidity: it.hu,
    windSpeed: it.ws,
  };
}

/** flatten semua grup jam → list HourlyForecast urut waktu (hari ini + 9 hari) */
export function forecastToHourly(res: BmkgForecastResponse): HourlyForecast[] {
  const items = res.data?.[0]?.cuaca?.flat() ?? [];
  return items
    .map(itemToHourly)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** hourly list → ringkasan cuaca saat ini (WeatherData) */
export function presentWxToWeatherData(res: BmkgPresentWxResponse, city: string, hourly: HourlyForecast[]): WeatherData {
  const it = res.data.cuaca;
  const today = hourly.filter(h => h.date === toLocalDate(it.local_datetime).date);
  const temps = today.map(h => h.temp);
  // ponytail: API tidak punya feels-like — aproksimasi heat index sederhana (TEAM-NOTES.md)
  const feelLike = Math.round(it.t + Math.max(0, (it.hu - 50) / 10));
  return {
    city,
    temp: Math.round(it.t),
    status: it.weather_desc,
    feelLike,
    tempMin: temps.length ? Math.min(...temps) : Math.round(it.t),
    tempMax: temps.length ? Math.max(...temps) : Math.round(it.t),
    humidity: it.hu,
    windSpeed: it.ws,
    // ponytail: API tidak punya UV — estimasi kasar dari awan+siang (TEAM-NOTES.md)
    uvIndex: it.tcc > 70 ? 2 : it.tcc > 40 ? 5 : 8,
    visibility: Math.round(it.vs / 100) / 10, // m → km 1 desimal
    icon: descToIcon(it.weather_desc, false),
  };
}

/** Respons warning (observasi baseline: kosong = {today:{}, tomorrow:null}) */
export function warningToAlerts(res: BmkgWarningResponse, region: string): WarningAlert[] {
  const alerts: WarningAlert[] = [];
  for (const [day, payload] of Object.entries({ 'Hari Ini': res.data?.today, Besok: res.data?.tomorrow })) {
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) continue;
    const p = payload as Record<string, unknown>;
    const level = String(p.warning_level ?? p.level ?? p.status ?? 'Waspada');
    const severity = ['Awas', 'Siaga', 'Waspada'].includes(level) ? (level as WarningAlert['severity']) : 'Waspada';
    const desc = [p.impact, p.warning, p.description, p.keterangan]
      .filter(Boolean)
      .map(String)
      .join('. ') || `Peringatan cuaca (${day.toLowerCase()}) untuk wilayah ini.`;
    alerts.push({
      id: `bmkg-${day}-${region}`,
      severity,
      title: `Peringatan Cuaca — ${day}`,
      description: desc,
      region,
      date: new Date().toISOString().slice(0, 10),
    });
  }
  return alerts;
}

/** sunset API "5:49:22 AM" → "05:49" (format HH:mm 24 jam yang dipakai CurrentWeather) */
function to24h(t: string | undefined): string {
  if (!t) return '';
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = Number(m[1]);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

/** sunset API → AdditionalWeatherInfo (dipakai CurrentWeather untuk day/night & panel info) */
export function sunsetToAdditional(
  res: BmkgSunsetResponse | null,
  wind: { wd: string; wd_deg: number } | null,
): AdditionalWeatherInfo | null {
  if (!res?.results) return null;
  const r = res.results;
  return {
    windDir: wind?.wd || 'Varia',
    windAngle: wind?.wd_deg ?? 0,
    sunrise: to24h(r.sunrise),
    sunset: to24h(r.sunset),
    moonPhase: String(r.moon_phase ?? '-'),
    moonIllumination: String(r.moon_illumination ?? 0),
    moonrise: to24h(r.moonrise) || '-',
    moonset: to24h(r.moonset) || '-',
  };
}

/** video YouTube → NewsArticle (thumbnail dari ytimg) */
export function videosToNews(items: BmkgVideoItem[]): NewsArticle[] {
  return items.slice(0, 5).map((v, i) => {
    const ytId = v.videoUrl.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
    return {
      id: `bmkg-video-${i}`,
      category: 'Video BMKG',
      title: v.title,
      summary: 'Video prakiraan cuaca resmi BMKG.',
      date: new Date().toISOString().slice(0, 10),
      imageUrl: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '',
    };
  });
}

/** WP REST post (rendered) → NewsArticle */
export function wpPostsToNews(posts: unknown[]): NewsArticle[] {
  return posts.slice(0, 5).map((p: any, i) => {
    const media = p?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const excerpt = String(p?.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim();
    return {
      id: `bmkg-post-${p?.id ?? i}`,
      category: (p?._embedded?.['wp:term']?.[0]?.[0]?.name as string) || 'Berita',
      title: String(p?.title?.rendered || '').replace(/&#\d+;|<[^>]*>/g, '').trim(),
      summary: excerpt.slice(0, 140),
      date: String(p?.date || '').slice(0, 10),
      imageUrl: media,
    };
  });
}

/** adm/coord → alamat terformat gaya existing ("Desa, Kec. X, Kotkab, Provinsi") */
export function admToAddress(l: {
  desa: string;
  kecamatan: string;
  kotkab: string;
  provinsi: string;
}): string {
  return [l.desa, l.kecamatan ? `Kec. ${l.kecamatan}` : '', l.kotkab, l.provinsi]
    .filter(Boolean)
    .join(', ');
}

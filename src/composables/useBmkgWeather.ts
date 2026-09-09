// Orkestrasi fetch API BMKG per lokasi/kota + cache + status live/mock
// Prinsip: tiap endpoint fetch independen — yang gagal tidak menjatuhkan yang lain,
// dan UI selalu punya data (fallback mock di App.vue).
import { ref, type Ref } from 'vue';
import { bmkg } from '../services/bmkg/api';
import {
  forecastToHourly,
  presentWxToWeatherData,
  sunsetToAdditional,
  videosToNews,
  warningToAlerts,
  wpPostsToNews,
} from '../services/bmkg/adapters';
import type { HourlyForecast, NewsArticle, WarningAlert, WeatherData } from '../types/weather';
import type { AdditionalWeatherInfo } from '../data/weatherHelpers';
import type { BmkgLocation, BmkgVideoItem } from '../types/bmkg';

// koordinat kota bawaan (dipakai kalau tidak ada GPS) — sama dengan citiesList mockData
export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'DKI Jakarta': { lat: -6.2, lon: 106.816666 },
  Surabaya: { lat: -7.257472, lon: 112.752083 },
  Bandung: { lat: -6.917464, lon: 107.619123 },
  Medan: { lat: 3.595196, lon: 98.672226 },
  Semarang: { lat: -6.966667, lon: 110.416664 },
  Makassar: { lat: -5.147665, lon: 119.432731 },
  Palembang: { lat: -2.976073, lon: 104.775427 },
  Batam: { lat: 1.130102, lon: 104.05304 },
  Pekanbaru: { lat: 0.507068, lon: 101.447777 },
  Denpasar: { lat: -8.65, lon: 115.216667 },
  'Tamanan, Kec. Bantul, Banguntapan, Daerah Istimewa Yogyakarta': { lat: -7.888, lon: 110.388 },
};

export interface BmkgCityData {
  weather: WeatherData | null;
  hourly: HourlyForecast[];
  alerts: WarningAlert[];
  additional: AdditionalWeatherInfo | null;
  amandemenCount: number;
  maritim: { code: string; name: string; wilpel: string } | null;
  fetchedAt: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 menit

export function useBmkgWeather() {
  const cache = new Map<string, BmkgCityData>();

  const liveWeather: Ref<WeatherData | null> = ref(null);
  const liveHourly: Ref<HourlyForecast[]> = ref([]);
  const liveAlerts: Ref<WarningAlert[]> = ref([]);
  const liveNews: Ref<NewsArticle[]> = ref([]);
  const liveAdditional: Ref<AdditionalWeatherInfo | null> = ref(null);
  const amandemenCount = ref(0);
  const maritimNearest = ref<BmkgCityData['maritim']>(null);
  const status = ref<'idle' | 'loading' | 'live' | 'mock'>('idle');

  async function loadNews() {
    try {
      const [posts, videos] = await Promise.all([
        bmkg.blogPosts(4).catch(() => []),
        bmkg.videos().catch((): BmkgVideoItem[] => []),
      ]);
      const merged = [...wpPostsToNews(posts), ...videosToNews(videos)];
      if (merged.length) liveNews.value = merged;
    } catch {
      /* fallback mock di App.vue */
    }
  }

  async function loadCyclone(region: string, into: WarningAlert[]) {
    try {
      const cyc = await bmkg.cyclone();
      const doc = cyc.data?.docs?.[0];
      if (doc) {
        into.unshift({
          id: `bmkg-cyclone-${doc._id ?? 'tcwc'}`,
          severity: 'Waspada',
          title: 'Sirkulasi Siklon TCWC Jakarta',
          description: `Ada sirkulasi siklon aktif. Area gelombang tinggi terdampak: ${(doc.ocean_gale || []).slice(0, 3).join('; ') || '-'}.`,
          region,
          date: new Date().toISOString().slice(0, 10),
        });
      }
    } catch {
      /* siklon opsional */
    }
  }

  /** fetch semua data live untuk satu lokasi (nama kota + opsional koordinat GPS) */
  async function loadCity(city: string, coords?: { lat: number; lon: number }) {
    const key = `${city}|${coords?.lat ?? ''},${coords?.lon ?? ''}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL) {
      liveWeather.value = hit.weather;
      liveHourly.value = hit.hourly;
      liveAlerts.value = hit.alerts;
      liveAdditional.value = hit.additional;
      amandemenCount.value = hit.amandemenCount;
      maritimNearest.value = hit.maritim;
      status.value = hit.weather ? 'live' : 'mock';
      return;
    }

    const c = coords ?? CITY_COORDS[city] ?? CITY_COORDS['DKI Jakarta'];
    status.value = 'loading';
    const [forecast, present, sunset, warning, amandemen, maritim] = await Promise.all([
      bmkg.forecast(c.lat, c.lon).catch(() => null),
      bmkg.presentWx(c.lat, c.lon).catch(() => null),
      bmkg.sunset(c.lat, c.lon).catch(() => null),
      bmkg.warning(c.lat, c.lon).catch(() => null),
      bmkg.amandemen(c.lat, c.lon).catch(() => null),
      bmkg.maritimNearest(c.lat, c.lon).catch(() => null),
    ]);

    const hourly = forecast ? forecastToHourly(forecast) : [];
    const weather = present ? presentWxToWeatherData(present, city, hourly) : null;
    const alerts: WarningAlert[] = warning ? warningToAlerts(warning, city) : [];
    void loadCyclone(city, alerts);

    const data: BmkgCityData = {
      weather,
      hourly,
      alerts,
      additional: sunset ? sunsetToAdditional(sunset, present ? { wd: present.data.cuaca.wd, wd_deg: present.data.cuaca.wd_deg } : null) : null,
      amandemenCount: amandemen?.amandemen?.length ?? 0,
      maritim: maritim ? { code: maritim.data.code, name: maritim.data.name, wilpel: maritim.data.wilpel } : null,
      fetchedAt: Date.now(),
    };
    cache.set(key, data);

    liveWeather.value = data.weather;
    liveHourly.value = data.hourly;
    liveAlerts.value = data.alerts;
    liveAdditional.value = data.additional;
    amandemenCount.value = data.amandemenCount;
    maritimNearest.value = data.maritim;
    status.value = data.weather ? 'live' : 'mock';
  }

  /** resolve alamat admin BMKG dari GPS; return null → caller pakai fallback */
  async function resolveAddress(lat: number, lon: number): Promise<string | null> {
    try {
      const adm = await bmkg.adm(lat, lon);
      return (
        [adm.desa, adm.kecamatan ? `Kec. ${adm.kecamatan}` : '', adm.kotkab, adm.provinsi]
          .filter(Boolean)
          .join(', ') || null
      );
    } catch {
      return null;
    }
  }

  return {
    liveWeather,
    liveHourly,
    liveAlerts,
    liveNews,
    liveAdditional,
    amandemenCount,
    maritimNearest,
    status,
    loadCity,
    loadNews,
    resolveAddress,
  };
}

export type BmkgLocation2 = BmkgLocation;

// Orkestrasi fetch API BMKG per lokasi/kota + cache + status live/mock
// Prinsip: tiap endpoint fetch independen — yang gagal tidak menjatuhkan yang lain,
// dan UI selalu punya data (fallback mock di App.vue).
import { ref, type Ref } from 'vue';
import { api } from '../services/bmkg/api';
import {
  alertsToPanel,
  currentToWeatherData,
  forecastToHourly,
  newsToArticles,
  nowcastToAlerts,
  regionToAddress,
  sunTimesToAdditional,
} from '../services/bmkg/adapters';
import {
  getNearestPelabuhan,
  type PelabuhanSlot,
} from '../services/bmkg/openData';
import type { HourlyForecast, NewsArticle, WarningAlert, WeatherData } from '../types/weather';
import type { AdditionalWeatherInfo } from '../data/weatherHelpers';

/** pelabuhan terdekat + slot prakiraan resmi (termasuk pasut) */
export interface PortInfo {
  portId: string;
  name: string;
  lat: number;
  lon: number;
  slot: PelabuhanSlot | null;
}

// koordinat kota bawaan (dipakai kalau tidak ada GPS) — sama dengan citiesList mockData
// Sumber tunggal: lib/cities.js (dipakai juga oleh api/widget-catalog.js).
// 'Tamanan' tetap di sini karena hanya relevan untuk dashboard, tidak untuk widget.
import { CITY_COORDS as BASE_CITY_COORDS } from '../../lib/cities.js';

export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  ...BASE_CITY_COORDS,
  'Tamanan, Kec. Bantul, Banguntapan, Daerah Istimewa Yogyakarta': { lat: -7.888, lon: 110.388 },
};

export interface BmkgCityData {
  weather: WeatherData | null;
  hourly: HourlyForecast[];
  alerts: WarningAlert[];
  additional: AdditionalWeatherInfo | null;
  amandemenCount: number;
  maritim: { code: string; name: string; wilpel: string } | null;
  province: string | null;
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
  const livePort: Ref<PortInfo | null> = ref(null);
  const amandemenCount = ref(0);
  const maritimNearest = ref<BmkgCityData['maritim']>(null);
  const status = ref<'idle' | 'loading' | 'live' | 'mock'>('idle');

  async function loadNews() {
    try {
      // satu endpoint: video + artikel, dengan warnings[] kalau salah satu mati
      const res = await api.news();
      const merged = newsToArticles(res);
      if (merged.length) liveNews.value = merged;
    } catch {
      /* fallback mock di App.vue */
    }
  }

  async function loadCyclone(region: string, into: WarningAlert[]) {
    try {
      const cyc = await api.cyclones();
      const doc = cyc.cyclones?.[0];
      if (doc) {
        into.unshift({
          id: `bmkg-cyclone-${doc.id ?? 'tcwc'}`,
          severity: 'Waspada',
          title: 'Sirkulasi Siklon TCWC Jakarta',
          description: `Ada sirkulasi siklon aktif. Area gelombang tinggi terdampak: ${(doc.gale || []).slice(0, 3).join('; ') || '-'}.`,
          region,
          date: new Date().toISOString().slice(0, 10),
        });
      }
    } catch {
      /* siklon opsional */
    }
  }

  /** pelabuhan terdekat + pasut (Open Data resmi) — fire & forget, tidak menahan render */
  async function loadPort(lat: number, lon: number) {
    try {
      const doc = await getNearestPelabuhan(lat, lon);
      if (!doc?.name) { livePort.value = null; return; }
      livePort.value = {
        portId: String(doc.port_id ?? ''),
        name: doc.name,
        lat: Number(doc.latitude ?? lat),
        lon: Number(doc.longitude ?? lon),
        slot: doc.data?.[0] ?? null,
      };
    } catch {
      livePort.value = null;
    }
  }

  /** fetch semua data live untuk satu lokasi (nama kota + opsional koordinat GPS) */
  async function loadCity(city: string, coords?: { lat: number; lon: number }) {
    const c = coords ?? CITY_COORDS[city] ?? CITY_COORDS['DKI Jakarta'];
    void loadPort(c.lat, c.lon);

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

    status.value = 'loading';
    // Semua lewat endpoint berbentuk normal (/api/*). nowcast tidak ikut di sini:
    // penyaringan provinsi dilakukan server, dan provinsinya baru diketahui
    // setelah /api/geo/region menjawab.
    const [forecast, present, sun, warning, amandemen, marine, region] = await Promise.all([
      api.forecast(c.lat, c.lon).catch(() => null),
      api.current(c.lat, c.lon).catch(() => null),
      api.sunTimes(c.lat, c.lon).catch(() => null),
      api.alerts(c.lat, c.lon).catch(() => null),
      api.amendment(c.lat, c.lon).catch(() => null),
      api.marineNearest(c.lat, c.lon).catch(() => null),
      api.region(c.lat, c.lon).catch(() => null),
    ]);

    let hourly = forecast ? forecastToHourly(forecast) : [];
    // Fallback jalur RESMI (Open Data) kalau prakiraan internal kosong/gagal.
    if (!hourly.length && region?.region.codes.adm4) {
      const official = await api.forecastOfficial(region.region.codes.adm4).catch(() => null);
      if (official) hourly = forecastToHourly(official);
    }
    const weather = present ? currentToWeatherData(present, city, hourly) : null;

    // Peringatan: nowcast menang (produk dini hari ini, hampir selalu terisi);
    // kalau tidak ada yang relevan untuk provinsi ini → pakai warning internal.
    const nowcastAlerts = region?.region.province
      ? nowcastToAlerts(await api.nowcast(region.region.province).catch(() => ({ alerts: [] })))
      : [];
    const alerts: WarningAlert[] = nowcastAlerts.length
      ? nowcastAlerts
      : warning ? alertsToPanel(warning, city) : [];
    void loadCyclone(city, alerts);

    const data: BmkgCityData = {
      weather,
      hourly,
      alerts,
      additional: sun
        ? sunTimesToAdditional(sun, present ? { wd: present.observation.windDirection, wd_deg: present.observation.windDirectionDeg } : null)
        : null,
      amandemenCount: amandemen?.count ?? 0,
      maritim: marine ? { code: marine.marine.code, name: marine.marine.name, wilpel: marine.marine.wilayah } : null,
      province: region?.region.province ?? null,
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
      const res = await api.region(lat, lon);
      return regionToAddress(res.region) || null;
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
    livePort,
    amandemenCount,
    maritimNearest,
    status,
    loadCity,
    loadNews,
    loadPort, // widget embed pasut perlu menunggu (loadCity hanya fire & forget)
    resolveAddress,
  };
}

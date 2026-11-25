// ═══════════════════════════════════════════════════════════════════════════
// Bentuk respons /api/* (lihat docs/api-contract.md).
//
// Ini BUKAN bentuk BMKG. Dashboard & widget memakai tipe ini, jadi nama field
// di sini = nama field di kontrak partner. Kalau salah satu berubah, dua
// pemakai ikut berubah — itu memang tujuannya (satu kebenaran).
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiRegion {
  province: string;
  city: string;
  district: string;
  village: string;
  codes: { adm1: string; adm2: string; adm3: string; adm4: string };
  lat: number;
  lon: number;
  timezone?: string;
  distanceKm?: number;
}

export interface ApiHour {
  date: string;
  time: string;
  temp: number;
  /** 0–100 INTENSITAS hujan (mm × 20), bukan peluang hujan — lihat kontrak */
  precipitation: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  windDirectionDeg: number;
  /** null = BMKG tidak mengirim data, bukan "0 km" */
  visibility: number | null;
}

export interface ApiForecast {
  region: ApiRegion;
  hours: ApiHour[];
}

export interface ApiCurrent {
  region: ApiRegion;
  observation: ApiHour & {
    /** TURUNAN — bukan data BMKG (heat index kasar, UV dari tutupan awan) */
    derived: { feelLike: number; uvIndex: number };
  };
}

export interface ApiAlerts {
  alerts: Array<{ day: string; severity: string; description: string }>;
}

export interface ApiNowcast {
  total: number;
  alerts: Array<{ id: string; severity: string; title: string; description: string; region: string; date: string }>;
}

export interface ApiWeeklyTemp {
  daily: Array<{ date: string; temperature: number }>;
  weekly: Array<{ date: string; temperature: number }>;
}

export interface ApiCyclones {
  cyclones: Array<{ id: string | null; title: string | null; bulletin: string | null; gale: string[] }>;
}

export interface ApiSunTimes {
  date: string;
  timezone: string;
  sunrise: string;
  sunset: string;
  firstLight: string | null;
  lastLight: string | null;
  moonrise: string | null;
  moonset: string | null;
  moonPhase: string | null;
  moonIllumination: string | null;
}

export interface ApiMarineNearest {
  marine: { code: string; name: string; wilayah: string; geometry: unknown };
}

export interface ApiAmendment {
  region: ApiRegion;
  count: number;
  items: unknown[];
}

export interface ApiNews {
  videos: Array<{ title: string; url: string; thumbnail: string | null }>;
  posts: Array<{
    id: number | null;
    date: string;
    category: string;
    title: string;
    summary: string;
    imageUrl: string | null;
    link: string | null;
  }>;
  warnings: string[];
}

export interface ApiError {
  error: string;
  code: 'UNAUTHORIZED' | 'BAD_REQUEST' | 'UPSTREAM_ERROR' | 'NOT_FOUND';
  reason?: string;
}

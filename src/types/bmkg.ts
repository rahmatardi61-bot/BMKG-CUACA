// Types respons API cuaca.bmkg.go.id — dari baseline scraping 8 Sep 2026
// (docs/scrapping_cuaca-bmkg-go-id/baseline/api_probes/)

/** Item cuaca per jam (forecast/coord) & observasi (presentwx/coord) */
export interface BmkgWeatherItem {
  datetime: string; // ISO Z
  local_datetime: string; // "2026-09-08 15:00:00"
  utc_datetime?: string;
  t: number; // suhu °C
  tcc: number; // total cloud cover %
  tp: number; // curah hujan mm
  weather: number; // kode cuaca
  weather_desc: string; // "Cerah"
  weather_desc_en: string;
  wd_deg: number;
  wd: string; // "NW"
  wd_to: string;
  ws: number; // kecepatan angin km/h
  hu: number; // kelembapan %
  vs: number; // jarak pandang meter
  vs_text: string;
  time_index?: string;
  analysis_date?: string;
  image: string; // URL icon SVG
}

export interface BmkgLocation {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lon: number;
  lat: number;
  distance?: number;
  timezone?: string;
}

/** Respons /api/df/v1/forecast/coord */
export interface BmkgForecastResponse {
  lokasi: BmkgLocation;
  data: Array<{
    lokasi: BmkgLocation;
    /** array of array: grup pertama hourly, lanjutan per-3-jam hari berikut */
    cuaca: BmkgWeatherItem[][];
  }>;
}

/** Respons /api/df/v1/adm/coord */
export interface BmkgAdmResponse extends BmkgLocation {}

/** Respons /api/df/v1/amandemen/coord */
export interface BmkgAmandemenResponse {
  lokasi: BmkgLocation;
  amandemen: unknown[];
}

/** Respons /api/presentwx/coord */
export interface BmkgPresentWxResponse {
  status: number;
  data: { lokasi: BmkgLocation; cuaca: BmkgWeatherItem };
}

/** Respons /api/public/weather/warning */
export interface BmkgWarningResponse {
  statusCode: number;
  message: string;
  data: { today: Record<string, unknown> | null; tomorrow: Record<string, unknown> | null };
}

/** Respons /api/public/weather/weekly-temperature */
export interface BmkgWeeklyTempResponse {
  statusCode: number;
  data: {
    daily: Array<{ date: string; temperature: number }>;
    weekly: Array<{ date: string; temperature: number }>;
  };
}

/** Respons /api/v1/sunset/json */
export interface BmkgSunsetResponse {
  results: {
    date: string;
    sunrise: string; // "5:49:22 AM"
    sunset: string;
    day_length?: string;
    moonrise?: string;
    moonset?: string;
    moon_phase?: string;
    moon_illumination?: number | string;
    [k: string]: unknown;
  };
  status: string;
  tzid: string;
}

/** Respons /api/public/weather/video-latest */
export interface BmkgVideoItem {
  title: string;
  videoUrl: string;
}

/** Respons /api/public/banners */
export interface BmkgBannersResponse {
  statusCode: number;
  data: unknown[];
}

/** Respons /api/v1/tcwc/cyclone/all */
export interface BmkgCycloneResponse {
  status: string;
  data: {
    docs?: Array<{
      _id?: string;
      technical_bulletin?: string;
      public_bulletin?: string;
      ocean_gale?: string[];
      [k: string]: unknown;
    }>;
    [k: string]: unknown;
  };
}

/** Respons /api/v1/public/maritim/nearest-location */
export interface BmkgMaritimNearestResponse {
  statusCode: number;
  data: {
    code: string;
    name: string;
    wilpel: string;
    geometry: { type: string; coordinates: number[][][] };
  };
}

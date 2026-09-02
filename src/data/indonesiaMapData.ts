/**
 * indonesiaMapData.ts
 *
 * OPTIMASI PERFORMA: Data koordinat sektoral (374 sektor, ~970KB) telah dipindahkan
 * ke public/data/sectors.json dan public/data/ports.json agar tidak masuk ke JS bundle.
 *
 * Komponen yang membutuhkan data ini (MarineMap.vue) harus memanggil:
 *   const { sectors, ports } = await fetchMapData();
 * pada saat onMounted, bukan saat import.
 */

// ══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

export interface HourlyForecast {
  hoursAhead: number;
  timeLabel: string;
  waveHeight: number;
  waveCategory: 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi' | 'Ekstrem';
  windSpeed: number;
  windDir: string;
  weather: string;
  weatherIcon: string;
  currentSpeed: number;
  currentDir: string;
  temp: number;
  humidity: number;
}

export interface IndonesiaMarineSector {
  id: string;
  name: string;
  coordinates: any; // LatLng arrays representing polygon or multipolygon
  center: [number, number]; // label anchor
  forecasts: HourlyForecast[];
  description?: string;
}

export interface MarinePort {
  id: string;
  name: string;
  coordinate: [number, number];
  weather: string;
  windSpeed: string;
  waveHeight: string;
  status: 'Aman' | 'Waspada' | 'Bahaya';
}

export interface LandMask {
  id: string;
  name: string;
  coordinates: [number, number][];
}

// ══════════════════════════════════════════════════════════════════════════════
// ASYNC DATA LOADERS — Data disimpan di public/data/ (tidak masuk ke JS bundle)
// ══════════════════════════════════════════════════════════════════════════════

let _sectorsCache: IndonesiaMarineSector[] | null = null;
let _portsCache: MarinePort[] | null = null;

/**
 * Fetch sector data secara async dari public/data/sectors.json.
 * Cache hasil di memori agar request kedua langsung.
 */
export async function fetchMarineSectors(): Promise<IndonesiaMarineSector[]> {
  if (_sectorsCache) return _sectorsCache;

  const res = await fetch('/data/sectors.json');
  if (!res.ok) throw new Error(`Failed to load sectors.json: ${res.status}`);
  _sectorsCache = await res.json();
  return _sectorsCache!;
}

/**
 * Fetch port data secara async dari public/data/ports.json.
 * Cache hasil di memori agar request kedua langsung.
 */
export async function fetchMarinePorts(): Promise<MarinePort[]> {
  if (_portsCache) return _portsCache;

  const res = await fetch('/data/ports.json');
  if (!res.ok) throw new Error(`Failed to load ports.json: ${res.status}`);
  _portsCache = await res.json();
  return _portsCache!;
}

/**
 * Fetch kedua dataset sekaligus (sectors + ports) secara paralel.
 */
export async function fetchMapData(): Promise<{
  sectors: IndonesiaMarineSector[];
  ports: MarinePort[];
}> {
  const [sectors, ports] = await Promise.all([
    fetchMarineSectors(),
    fetchMarinePorts(),
  ]);
  return { sectors, ports };
}

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY SYNC EXPORTS (empty — kept to avoid breaking any stale imports)
// Komponen yang masih menggunakan import langsung akan mendapat array kosong.
// Migrate ke fetchMapData() untuk data aktual.
// ══════════════════════════════════════════════════════════════════════════════
export const indonesiaMarineSectors: IndonesiaMarineSector[] = [];
export const marinePorts: MarinePort[] = [];
export const landMasks: LandMask[] = [];

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function formatCoordinate(val: number, isLat: boolean): string {
  const dir = isLat
    ? (val >= 0 ? 'LU' : 'LS')
    : (val >= 0 ? 'BT' : 'BB');
  const absVal = Math.abs(val);
  const degrees = Math.floor(absVal);
  const minutesDec = (absVal - degrees) * 60;
  const minutes = Math.floor(minutesDec);
  const seconds = Math.round((minutesDec - minutes) * 60);

  return `${degrees}°${String(minutes).padStart(2, '0')}'${String(seconds).padStart(2, '0')}" ${dir}`;
}

export function getSectorBoundaryText(coordinates: any): string {
  if (!coordinates || coordinates.length === 0) return '-';

  const lats: number[] = [];
  const lngs: number[] = [];

  function traverse(coords: any) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      lats.push(coords[0]);
      lngs.push(coords[1]);
      return;
    }
    for (let i = 0; i < coords.length; i++) {
      traverse(coords[i]);
    }
  }

  traverse(coordinates);

  if (lats.length === 0 || lngs.length === 0) return '-';

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latStr = minLat === maxLat
    ? formatCoordinate(minLat, true)
    : `${formatCoordinate(minLat, true)} - ${formatCoordinate(maxLat, true)}`;

  const lngStr = minLng === maxLng
    ? formatCoordinate(minLng, false)
    : `${formatCoordinate(minLng, false)} - ${formatCoordinate(maxLng, false)}`;

  return `${latStr} | ${lngStr}`;
}

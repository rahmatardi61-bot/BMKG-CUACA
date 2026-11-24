// Tipe untuk lib/cities.js (JS murni, dipakai src/ dan api/ sekaligus).
export interface City {
  name: string;
  lat: number;
  lon: number;
}
export declare const CITIES: City[];
export declare const CITY_COORDS: Record<string, { lat: number; lon: number }>;

// Import landmark PNGs
import bandungPng from '../assets/landmarks_png/Bandung.png';
import batamPng from '../assets/landmarks_png/Batam.png';
import denpasarPng from '../assets/landmarks_png/Denpasar.png';
import jakartaPng from '../assets/landmarks_png/Jakarta.png';
import makassarPng from '../assets/landmarks_png/Makassar.png';
import medanPng from '../assets/landmarks_png/Medan.png';
import palembangPng from '../assets/landmarks_png/Palembang.png';
import pekanbaruPng from '../assets/landmarks_png/Pekanbaru.png';
import semarangPng from '../assets/landmarks_png/Semarang.png';
import surabayaPng from '../assets/landmarks_png/Surabaya.png';
import yogyakartaPng from '../assets/landmarks_png/Yogyakarta.png';

export interface CityTheme {
  cardBg: string;
  landmarkImg?: string;
}

const jakartaTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-[#1c0b36] via-[#2e0e4b] to-[#1a092b] text-white border border-purple-500/30 shadow-xl shadow-purple-950/40',
  landmarkImg: jakartaPng,
};

const surabayaTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-teal-900 via-cyan-950 to-blue-950 text-cyan-100 border border-cyan-500/30 shadow-xl shadow-cyan-950/40',
  landmarkImg: surabayaPng,
};

const bandungTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-emerald-900 via-teal-950 to-cyan-950 text-emerald-100 border border-emerald-500/30 shadow-xl shadow-emerald-950/40',
  landmarkImg: bandungPng,
};

const medanTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-amber-900 via-orange-950 to-yellow-950 text-amber-100 border border-amber-500/30 shadow-xl shadow-amber-950/40',
  landmarkImg: medanPng,
};

const makassarTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-blue-100 border border-blue-500/30 shadow-xl shadow-indigo-950/40',
  landmarkImg: makassarPng,
};

const yogyakartaTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-violet-900 via-indigo-950 to-purple-950 text-violet-100 border border-violet-500/30 shadow-xl shadow-violet-950/40',
  landmarkImg: yogyakartaPng,
};

const semarangTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-violet-950 via-purple-950 to-indigo-950 text-purple-100 border border-purple-500/30 shadow-xl shadow-purple-950/40',
  landmarkImg: semarangPng,
};

const palembangTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-red-950 via-rose-950 to-orange-950 text-red-100 border border-red-500/30 shadow-xl shadow-red-950/40',
  landmarkImg: palembangPng,
};

const batamTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-sky-100 border border-sky-500/30 shadow-xl shadow-sky-950/40',
  landmarkImg: batamPng,
};

const pekanbaruTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-teal-950 via-emerald-950 to-green-950 text-emerald-100 border border-emerald-500/30 shadow-xl shadow-emerald-950/40',
  landmarkImg: pekanbaruPng,
};

const denpasarTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-amber-950 via-[#7c2d12] to-amber-950 text-orange-100 border border-orange-500/30 shadow-xl shadow-orange-950/40',
  landmarkImg: denpasarPng,
};

const defaultTheme: CityTheme = {
  cardBg: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-slate-100 border border-slate-700/30 shadow-xl shadow-slate-950/40',
};

export const getCityTheme = (cityName: string): CityTheme => {
  const city = cityName.toLowerCase();
  if (city.includes('jakarta')) return jakartaTheme;
  if (city.includes('surabaya')) return surabayaTheme;
  if (city.includes('bandung')) return bandungTheme;
  if (city.includes('medan')) return medanTheme;
  if (city.includes('makassar')) return makassarTheme;
  if (city.includes('yogyakarta')) return yogyakartaTheme;
  if (city.includes('semarang')) return semarangTheme;
  if (city.includes('palembang')) return palembangTheme;
  if (city.includes('batam')) return batamTheme;
  if (city.includes('pekanbaru')) return pekanbaruTheme;
  if (city.includes('denpasar')) return denpasarTheme;
  return defaultTheme;
};

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Play, Pause, Plus, Minus,
  Compass, Navigation,
  RotateCw, Eye, EyeOff,
  Radio, Satellite, Wind, CloudRain, Thermometer, Cloud, Waves
} from 'lucide-vue-next';
import type { WeatherData } from '../types/weather';
import { getCityCoordinates } from '../data/earthquakeData';

const props = defineProps<{
  selectedCity?: string;
  userLat?: number | null;
  userLng?: number | null;
  weatherData?: WeatherData;
}>();

// ── Windy.com Layer Definitions ───────────────────────────────────────────────
interface LayerDef {
  id: string;
  name: string;
  unit: string;
  hasParticles: boolean;
  colorGrad: string;
  legendVals: (number | string)[];
  colormap: [number, number, number, number][];
  icon: any;
}

const windyLayers: LayerDef[] = [
  {
    id: 'radar',
    name: 'Radar cuaca',
    unit: 'dBZ',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #a855f7)',
    legendVals: ['dBZ', 5, 15, 25, 35, 45, 55, '65+'],
    icon: Radio,
    colormap: [
      [170, 230, 170,  20],
      [ 34, 197,  94,  50],
      [ 22, 163,  74,  65],
      [234, 179,   8,  75],
      [249, 115,  22,  85],
      [239,  68,  68,  92],
      [168,  85, 247, 100],
    ]
  },
  {
    id: 'satellite',
    name: 'Satelit',
    unit: '°C',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #ffffff, #93c5fd, #2563eb, #1e1b4b)',
    legendVals: ['°C', 40, 20, 0, -20, -40, -60, '-80'],
    icon: Satellite,
    colormap: [
      [255, 255, 255,  30],
      [210, 225, 245,  45],
      [150, 175, 220,  60],
      [ 75, 105, 190,  72],
      [ 30,  60, 160,  85],
      [  5,  15, 110,  95],
    ]
  },
  {
    id: 'wind',
    name: 'Angin',
    unit: 'kt',
    hasParticles: true,
    colorGrad: 'linear-gradient(to right, #384ba2, #2a6eba, #189c9b, #3ab448, #9bcd2d, #e6af1e, #e86c1e, #d72638, #aa1496)',
    legendVals: ['kt', 0, 5, 10, 20, 30, 40, '60'],
    icon: Wind,
    colormap: [
      [ 56,  75, 162, 230],   // 0-3 kt (Windy crisp indigo slate over land)
      [ 42, 110, 186, 230],   // 3-7 kt (Deep ocean cerulean blue)
      [ 24, 156, 155, 235],   // 7-12 kt (Vivid teal / cyan)
      [ 58, 180,  72, 235],   // 12-18 kt (Vivid Emerald Green — Java Sea)
      [155, 205,  45, 235],   // 18-24 kt (Bright Lime Sun)
      [230, 175,  30, 240],   // 24-32 kt (Warm Amber Gold)
      [232, 108,  30, 240],   // 32-42 kt (Vivid Coral Orange)
      [215,  38,  56, 245],   // >42 kt (Deep Ruby Crimson)
      [170,  20, 150, 250],   // Gale / Storm Magenta
    ]
  },
  {
    id: 'rain_thunder',
    name: 'Hujan, petir',
    unit: 'mm',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #60a5fa, #3b82f6, #1d4ed8, #eab308, #ef4444)',
    legendVals: ['mm/h', 0.1, 0.5, 1.5, 3, 7, 15, '30+'],
    icon: CloudRain,
    colormap: [
      [147, 197, 253,  25],
      [ 59, 130, 246,  55],
      [ 29,  78, 216,  70],
      [234, 179,   8,  82],
      [239,  68,  68,  95],
    ]
  },
  {
    id: 'temperature',
    name: 'Suhu',
    unit: '°C',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #eab308, #f97316, #ef4444)',
    legendVals: ['°C', 10, 15, 20, 25, 30, 35, '40+'],
    icon: Thermometer,
    colormap: [
      [ 14, 116, 210,  45],
      [  6, 182, 212,  52],
      [ 16, 185, 129,  60],
      [234, 179,   8,  70],
      [249, 115,  22,  78],
      [239,  68,  68,  88],
    ]
  },
  {
    id: 'clouds',
    name: 'Awan',
    unit: '%',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #334155, #64748b, #cbd5e1, #ffffff)',
    legendVals: ['%', 0, 20, 40, 60, 80, 100],
    icon: Cloud,
    colormap: [
      [ 51,  65,  85,  20],
      [100, 116, 139,  45],
      [203, 213, 225,  68],
      [255, 255, 255,  88],
    ]
  },
  {
    id: 'waves',
    name: 'Gelombang',
    unit: 'm',
    hasParticles: false,
    colorGrad: 'linear-gradient(to right, #0284c7, #0d9488, #10b981, #eab308, #f97316, #dc2626)',
    legendVals: ['m', 0.5, 1, 2, 3, 4, 6, '8+'],
    icon: Waves,
    colormap: [
      [  2, 132, 199,  40],
      [ 13, 148, 136,  52],
      [ 16, 185, 129,  62],
      [234, 179,   8,  72],
      [249, 115,  22,  82],
      [220,  38,  38,  92],
    ]
  }
];

const activeLayerId = ref('wind');
const activeLayer = computed(() => windyLayers.find(l => l.id === activeLayerId.value) || windyLayers[2]);

// ── Altitude / Pressure Levels ────────────────────────────────────────────────
const altitudes = ['Surface', '100 m', '950 hPa', '850 hPa', '700 hPa', '500 hPa', '300 hPa', '200 hPa'];
const activeAltitude = ref('Surface');

// ── Forecast Models ───────────────────────────────────────────────────────────
const forecastModels = [
  { id: 'ECMWF', name: 'ECMWF', res: '9km' },
  { id: 'GFS', name: 'GFS', res: '22km' },
  { id: 'ICON', name: 'ICON', res: '13km' },
  { id: 'ACCESS', name: 'ACCESS', res: '12km' },
];
const activeModel = ref('ECMWF');

// ── Display Toggles ───────────────────────────────────────────────────────────
const showParticles = ref(true);
const showPressureIsolines = ref(false);
const showCityLabels = ref(true);



// ── Timeline & Days ───────────────────────────────────────────────────────────
const isPlaying = ref(false);
let playerTimer: any = null;
const currentSlot = ref(4);

interface DayTab {
  dayStr: string;
  dateStr: string;
}

const dayTabs = computed<DayTab[]>(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const res: DayTab[] = [];
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    res.push({ dayStr: days[d.getDay()], dateStr: String(d.getDate()) });
  }
  return res;
});

const totalSlotsCount = computed(() => dayTabs.value.length * 8);

const activeTimeLabel = computed(() => {
  const dayIdx = Math.floor(currentSlot.value / 8);
  const slotIdx = currentSlot.value % 8;
  const day = dayTabs.value[dayIdx] || dayTabs.value[0];
  const hour = String(slotIdx * 3).padStart(2, '0');
  return `${day.dayStr} ${day.dateStr} - ${hour}:00`;
});

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    playerTimer = setInterval(() => {
      currentSlot.value = (currentSlot.value + 1) % totalSlotsCount.value;
      scheduleRedraw();
    }, 850);
  } else {
    clearInterval(playerTimer);
  }
};

// ── Real Location Mock Weather Dataset (Indonesia & Surrounding Seas) ────────
interface GeoStation {
  name: string;
  lat: number;
  lng: number;
  temp: number;       // °C
  windSpeed: number;  // knots
  windDeg: number;    // 0..360 (degrees: 135 = Southeast -> blowing to Northwest)
  rain: number;       // dBZ / precipitation intensity (0..60)
  clouds: number;     // cloud cover %
  uv: number;         // UV index 0..12
  waves: number;      // wave height in meters
}

const REAL_GEO_STATIONS: GeoStation[] = [
  // Jawa & Bali Land
  { name: 'Jakarta', lat: -6.208, lng: 106.845, temp: 28, windSpeed: 4, windDeg: 105, rain: 10, clouds: 25, uv: 9, waves: 0.8 },
  { name: 'Bandung', lat: -6.917, lng: 107.619, temp: 23, windSpeed: 3, windDeg: 110, rain: 15, clouds: 40, uv: 7, waves: 0.5 },
  { name: 'Semarang', lat: -6.966, lng: 110.438, temp: 28, windSpeed: 4, windDeg: 100, rain: 8, clouds: 20, uv: 9, waves: 0.9 },
  { name: 'Yogyakarta', lat: -7.795, lng: 110.369, temp: 26, windSpeed: 3, windDeg: 115, rain: 10, clouds: 20, uv: 9, waves: 0.6 },
  { name: 'Surabaya', lat: -7.257, lng: 112.752, temp: 27, windSpeed: 5, windDeg: 95, rain: 5, clouds: 15, uv: 10, waves: 1.0 },
  { name: 'Denpasar', lat: -8.670, lng: 115.212, temp: 27, windSpeed: 5, windDeg: 110, rain: 5, clouds: 10, uv: 11, waves: 1.8 },

  // Perairan Laut Jawa (Utara Jawa) — Wind blowing East to West (95° - 105°)
  { name: 'Laut Jawa Barat', lat: -5.2, lng: 107.5, temp: 29, windSpeed: 18, windDeg: 100, rain: 5, clouds: 20, uv: 10, waves: 1.2 },
  { name: 'Laut Jawa Tengah (Legoncikmas)', lat: -5.8, lng: 110.5, temp: 28, windSpeed: 20, windDeg: 98, rain: 5, clouds: 15, uv: 10, waves: 1.4 },
  { name: 'Laut Jawa Timur (Bawean)', lat: -5.5, lng: 112.6, temp: 28, windSpeed: 22, windDeg: 95, rain: 2, clouds: 10, uv: 11, waves: 1.6 },

  // Samudra Hindia (Selatan Jawa & Sumatra) — Strong SE Trade Winds (115° - 130°)
  { name: 'Samudra Hindia Barat Sumatra', lat: -2.0, lng: 94.5, temp: 27, windSpeed: 26, windDeg: 135, rain: 15, clouds: 40, uv: 8, waves: 3.4 },
  { name: 'Samudra Hindia Pelabuhan Ratu', lat: -8.2, lng: 106.5, temp: 26, windSpeed: 28, windDeg: 125, rain: 10, clouds: 30, uv: 9, waves: 3.6 },
  { name: 'Samudra Hindia Cilacap/Yogya', lat: -9.5, lng: 110.0, temp: 26, windSpeed: 32, windDeg: 120, rain: 8, clouds: 25, uv: 10, waves: 3.9 },
  { name: 'Samudra Hindia Bali/Sumba', lat: -11.5, lng: 116.5, temp: 25, windSpeed: 36, windDeg: 115, rain: 5, clouds: 15, uv: 10, waves: 4.3 },

  // Sumatra Land
  { name: 'Banda Aceh', lat: 5.548, lng: 95.323, temp: 28, windSpeed: 5, windDeg: 160, rain: 40, clouds: 70, uv: 7, waves: 1.5 },
  { name: 'Medan', lat: 3.595, lng: 98.672, temp: 28, windSpeed: 4, windDeg: 150, rain: 45, clouds: 75, uv: 6, waves: 0.6 },
  { name: 'Padang', lat: -0.949, lng: 100.354, temp: 24, windSpeed: 4, windDeg: 140, rain: 35, clouds: 65, uv: 7, waves: 1.2 },
  { name: 'Palembang', lat: -2.990, lng: 104.756, temp: 27, windSpeed: 4, windDeg: 130, rain: 25, clouds: 55, uv: 8, waves: 0.4 },

  // Selat Sunda & Selat Karimata
  { name: 'Selat Sunda', lat: -6.0, lng: 105.7, temp: 28, windSpeed: 14, windDeg: 110, rain: 12, clouds: 30, uv: 9, waves: 1.5 },
  { name: 'Selat Karimata', lat: -2.5, lng: 109.0, temp: 28, windSpeed: 16, windDeg: 105, rain: 15, clouds: 35, uv: 9, waves: 1.1 },

  // Kalimantan & Sulawesi
  { name: 'Pontianak', lat: -0.026, lng: 109.342, temp: 27, windSpeed: 4, windDeg: 135, rain: 45, clouds: 80, uv: 6, waves: 0.5 },
  { name: 'Banjarmasin', lat: -3.319, lng: 114.590, temp: 25, windSpeed: 4, windDeg: 120, rain: 20, clouds: 50, uv: 8, waves: 0.6 },
  { name: 'Makassar', lat: -5.147, lng: 119.432, temp: 28, windSpeed: 6, windDeg: 125, rain: 8, clouds: 20, uv: 10, waves: 1.2 },
  { name: 'Manado', lat: 1.474, lng: 124.842, temp: 25, windSpeed: 5, windDeg: 150, rain: 18, clouds: 40, uv: 8, waves: 1.0 },

  // NTT & Maluku & Papua
  { name: 'Kupang', lat: -10.177, lng: 123.607, temp: 24, windSpeed: 10, windDeg: 115, rain: 2, clouds: 5, uv: 11, waves: 2.2 },
  { name: 'Ambon', lat: -3.695, lng: 128.181, temp: 23, windSpeed: 6, windDeg: 130, rain: 30, clouds: 65, uv: 7, waves: 1.6 },
  { name: 'Jayapura', lat: -2.533, lng: 140.718, temp: 25, windSpeed: 4, windDeg: 120, rain: 40, clouds: 75, uv: 7, waves: 1.2 },
];

function interpolateLocationData(lat: number, lng: number, metric: keyof GeoStation): number {
  const pow = 2.4;
  let num = 0;
  let den = 0;
  for (const st of REAL_GEO_STATIONS) {
    const dlat = lat - st.lat;
    const dlng = lng - st.lng;
    const d2 = dlat * dlat + dlng * dlng;
    const val = st[metric] as number;
    if (d2 < 1e-6) return val;
    const w = 1 / Math.pow(d2, pow / 2);
    num += w * val;
    den += w;
  }
  return num / den;
}

function getLayerValueAtGeo(lat: number, lng: number, layerId: string): number {
  if (layerId === 'wind') {
    const { speed } = getGfsWindVectorAt(lat, lng);
    return Math.max(0, Math.min(1, speed / 40));
  } else if (layerId === 'radar' || layerId === 'rain_thunder') {
    const rain = interpolateLocationData(lat, lng, 'rain');
    return Math.max(0, Math.min(1, rain / 60));
  } else if (layerId === 'temperature') {
    const temp = interpolateLocationData(lat, lng, 'temp');
    return Math.max(0, Math.min(1, (temp - 18) / 20));
  } else if (layerId === 'clouds' || layerId === 'satellite') {
    const clouds = interpolateLocationData(lat, lng, 'clouds');
    return Math.max(0, Math.min(1, clouds / 100));
  } else if (layerId === 'waves') {
    const waves = interpolateLocationData(lat, lng, 'waves');
    return Math.max(0, Math.min(1, waves / 5));
  }
  const { speed } = getGfsWindVectorAt(lat, lng);
  return Math.max(0, Math.min(1, speed / 40));
}

function sampleColor(cmap: [number, number, number, number][], v: number): [number, number, number, number] {
  const cl = Math.max(0, Math.min(0.9999, v));
  const step = 1 / (cmap.length - 1);
  const i = Math.floor(cl / step);
  const t = (cl - i * step) / step;
  const a = cmap[i];
  const b = cmap[Math.min(i + 1, cmap.length - 1)];
  return a.map((v0, idx) => Math.round(v0 + (b[idx] - v0) * t)) as [number, number, number, number];
}

// ── Leaflet shallowRef instance & Canvas Engine ──────────────────────────────
const leafletMap = shallowRef<L.Map | null>(null);
let tileLayer: L.TileLayer | null = null;
let cityMarkersLayer: L.LayerGroup | null = null;
let fieldCanvas: HTMLCanvasElement | null = null;
let fieldCtx: CanvasRenderingContext2D | null = null;
let particleCanvas: HTMLCanvasElement | null = null;
let particleCtx: CanvasRenderingContext2D | null = null;
let animId: number | null = null;
let inspectionMarker: L.Marker | null = null;
let redrawPending = false;

const inspected = ref<{
  lat: number; lng: number; temp: number; status: string;
  wind: string; rain: number;
} | null>(null);

function drawField() {
  if (!fieldCanvas || !fieldCtx || !leafletMap.value) return;
  const W = fieldCanvas.width;
  const H = fieldCanvas.height;
  if (!W || !H) return;

  const bounds = leafletMap.value.getBounds();
  const northLat = bounds.getNorth();
  const southLat = bounds.getSouth();
  const westLng  = bounds.getWest();
  const eastLng  = bounds.getEast();

  const cmap = activeLayer.value.colormap;
  const layerId = activeLayerId.value;

  const S = 3;
  const cols = Math.ceil(W / S);
  const rows = Math.ceil(H / S);
  const tmp = document.createElement('canvas');
  tmp.width = cols; tmp.height = rows;
  const tc = tmp.getContext('2d')!;
  const id = tc.createImageData(cols, rows);
  const d = id.data;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = westLng + (c / Math.max(1, cols - 1)) * (eastLng - westLng);
      const lat = northLat - (r / Math.max(1, rows - 1)) * (northLat - southLat);

      const val = getLayerValueAtGeo(lat, lng, layerId);
      const [ri, gi, bi, ai] = sampleColor(cmap, val);
      const off = (r * cols + c) * 4;
      d[off] = ri; d[off+1] = gi; d[off+2] = bi; d[off+3] = ai;
    }
  }
  tc.putImageData(id, 0, 0);
  fieldCtx.clearRect(0, 0, W, H);
  fieldCtx.save();
  fieldCtx.imageSmoothingEnabled = true;
  fieldCtx.imageSmoothingQuality = 'high';
  fieldCtx.drawImage(tmp, 0, 0, cols, rows, 0, 0, W, H);
  fieldCtx.restore();
}

// ── Dynamic Projection Particle Vector Engine ───────────────────────────────
import { generateIndonesiaGfsWindGrid, interpolateWindVectorField, getGfsWindVectorAt } from '../utils/gfsWindGrid';

const gfsDataGrid = generateIndonesiaGfsWindGrid();
console.log('GFS GRIB2 grid initialized:', gfsDataGrid[0].header.parameterCategoryName);

interface Particle { x: number; y: number; age: number; life: number; }
let particles: Particle[] = [];
const N_PARTICLES = 1000;

function windVec(px: number, py: number): [number, number] {
  if (!leafletMap.value) return [0, 0];
  const latLng = leafletMap.value.containerPointToLatLng([px, py]);
  
  const { u, v } = interpolateWindVectorField(latLng.lat, latLng.lng, REAL_GEO_STATIONS);

  // Zoom-adaptive scale factor: maintains crisp particle motion across zoom levels 2 to 12
  const zoom = leafletMap.value.getZoom();
  const zoomScale = Math.pow(2, Math.max(0, 6.2 - zoom));
  const step = 0.0018 * zoomScale;

  const pt0 = leafletMap.value.latLngToContainerPoint(latLng);
  const pt1 = leafletMap.value.latLngToContainerPoint([latLng.lat + v * step, latLng.lng + u * step]);

  const vx = pt1.x - pt0.x;
  const vy = pt1.y - pt0.y;

  return [vx, vy];
}

function initParticles(W: number, H: number) {
  particles = [];
  for (let i = 0; i < N_PARTICLES; i++) {
    const life = 90 + Math.random() * 110;
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      age: Math.floor(Math.random() * life),
      life
    });
  }
}

let lastTs = 0;
function animLoop(ts: number) {
  if (!particleCanvas || !particleCtx) return;
  const dt = Math.min((ts - lastTs) / 16.67, 1.5);
  lastTs = ts;

  const W = particleCanvas.width;
  const H = particleCanvas.height;

  // Authentic Windy.com Smooth Particle Trail Fade Effect
  particleCtx.globalCompositeOperation = 'destination-out';
  particleCtx.fillStyle = 'rgba(0, 0, 0, 0.09)';
  particleCtx.fillRect(0, 0, W, H);
  particleCtx.globalCompositeOperation = 'source-over';

  if (!showParticles.value || !activeLayer.value.hasParticles) {
    particleCtx.clearRect(0, 0, W, H);
    return;
  }

  particleCtx.lineWidth = 1.1;
  particleCtx.lineCap = 'round';

  for (const p of particles) {
    const [vx, vy] = windVec(p.x, p.y);
    const spd = Math.sqrt(vx * vx + vy * vy);
    if (spd < 0.001) { p.age++; continue; }

    const nextX = p.x + vx * dt * 0.5;
    const nextY = p.y + vy * dt * 0.5;

    const alpha = Math.sin((p.age / p.life) * Math.PI) * 0.7;
    particleCtx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    particleCtx.beginPath();
    particleCtx.moveTo(p.x, p.y);
    particleCtx.lineTo(nextX, nextY);
    particleCtx.stroke();

    p.x = nextX;
    p.y = nextY;
    p.age++;

    if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.age >= p.life) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.age = 0;
      p.life = 90 + Math.random() * 110;
    }
  }

  animId = requestAnimationFrame(animLoop);
}

function scheduleRedraw() {
  if (redrawPending) return;
  redrawPending = true;
  requestAnimationFrame(() => {
    redrawPending = false;
    drawField();
    if (activeLayer.value.hasParticles && showParticles.value) {
      if (!animId) {
        lastTs = performance.now();
        animId = requestAnimationFrame(animLoop);
      }
    } else {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    }
  });
}

// ── Watermark-Free Esri Dark Gray / OSM Basemap ───────────────────────────────
function updateBasemap() {
  if (!leafletMap.value) return;
  const dark = document.documentElement.classList.contains('dark');
  // Esri Dark Gray Base has ZERO watermarks and matches Windy dark basemap perfectly
  const url = dark
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  if (tileLayer) leafletMap.value.removeLayer(tileLayer);
  tileLayer = L.tileLayer(url, {
    maxZoom: 18,
    attribution: ''
  }).addTo(leafletMap.value);
}

// ── Signature Windy City Temperature Badges ──────────────────────────────────
function updateCityMarkers() {
  if (!leafletMap.value) return;
  if (!cityMarkersLayer) {
    cityMarkersLayer = L.layerGroup().addTo(leafletMap.value);
  }
  cityMarkersLayer.clearLayers();

  if (!showCityLabels.value) return;

  for (const st of REAL_GEO_STATIONS) {
    const html = `
      <div class="flex flex-col items-center pointer-events-none select-none -translate-x-1/2 -translate-y-1/2">
        <span class="text-[10px] font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap leading-none">${st.name}</span>
        <span class="text-[11px] font-black text-amber-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 leading-none">${st.temp}°</span>
      </div>
    `;
    const icon = L.divIcon({
      className: 'windy-city-marker',
      html,
      iconSize: [0, 0],
    });
    L.marker([st.lat, st.lng], { icon, interactive: false }).addTo(cityMarkersLayer);
  }
}



// ── Canvas Overlay Setup ──────────────────────────────────────────────────────
function setupCanvas() {
  const wrapper = document.getElementById('windy-map-wrap');
  if (!wrapper || !leafletMap.value) return;

  document.getElementById('windy-field-cvs')?.remove();
  document.getElementById('windy-particle-cvs')?.remove();

  const fCvs = document.createElement('canvas');
  fCvs.id = 'windy-field-cvs';
  fCvs.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:12;mix-blend-mode:multiply;opacity:0.55;';
  wrapper.appendChild(fCvs);
  fieldCanvas = fCvs;
  fieldCtx = fCvs.getContext('2d');

  const pCvs = document.createElement('canvas');
  pCvs.id = 'windy-particle-cvs';
  pCvs.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:13;';
  wrapper.appendChild(pCvs);
  particleCanvas = pCvs;
  particleCtx = pCvs.getContext('2d');

  const ro = new ResizeObserver(() => {
    const r = wrapper.getBoundingClientRect();
    const W = Math.round(r.width);
    const H = Math.round(r.height);
    fCvs.width = W; fCvs.height = H;
    pCvs.width = W; pCvs.height = H;
    if (activeLayer.value.hasParticles) initParticles(W, H);
    scheduleRedraw();
  });
  ro.observe(wrapper);
  
  leafletMap.value.on('move zoom movestart moveend zoomstart zoomend drag', () => {
    scheduleRedraw();
  });
}

function initMap() {
  if (leafletMap.value) return;
  if (!document.getElementById('windy-leaflet-map')) return;
  const initialCity = props.selectedCity || 'DKI Jakarta';
  const c = getCityCoordinates(initialCity, props.userLat, props.userLng);
  
  const mapInstance = L.map('windy-leaflet-map', {
    zoomControl: false, attributionControl: false, minZoom: 4, maxZoom: 14
  }).setView([c.lat || -2.3, c.lng || 118.6], 5);

  leafletMap.value = mapInstance;

  updateBasemap();
  setupCanvas();
  updateCityMarkers();

  leafletMap.value.on('click', (e: L.LeafletMouseEvent) => {
    const lat = +e.latlng.lat.toFixed(2);
    const lng = +e.latlng.lng.toFixed(2);
    
    const temp = Math.round(interpolateLocationData(lat, lng, 'temp'));
    const spd = Math.round(interpolateLocationData(lat, lng, 'windSpeed'));
    const deg = Math.round(interpolateLocationData(lat, lng, 'windDeg'));
    const rainVal = Math.round(interpolateLocationData(lat, lng, 'rain'));

    const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
    const dirStr = directions[Math.round(deg / 45) % 8];

    const statusStr = rainVal > 40 ? 'Hujan Lebat' : rainVal > 25 ? 'Hujan Ringan' : rainVal > 12 ? 'Berawan' : 'Cerah';

    inspected.value = {
      lat, lng,
      temp,
      status: statusStr,
      wind: `${spd} kt – ${dirStr}`,
      rain: rainVal
    };

    if (inspectionMarker) leafletMap.value!.removeLayer(inspectionMarker);
    inspectionMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '', iconSize: [22, 22], iconAnchor: [11, 11],
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px"><span style="position:absolute;inset:0;border-radius:50%;background:#ef4444;opacity:.5;animation:windy-ping 1.5s ease-out infinite;"></span><span style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.6);display:block;position:relative;"></span></div>`
      })
    }).addTo(leafletMap.value!);
  });

  setTimeout(() => leafletMap.value?.invalidateSize(), 200);
  setTimeout(() => leafletMap.value?.invalidateSize(), 600);
}

const zoomIn = () => leafletMap.value?.zoomIn();
const zoomOut = () => leafletMap.value?.zoomOut();
const goToUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        leafletMap.value?.setView([pos.coords.latitude, pos.coords.longitude], 9, { animate: true });
      },
      () => {
        const targetCity = props.selectedCity || 'DKI Jakarta';
        const c = getCityCoordinates(targetCity, props.userLat, props.userLng);
        leafletMap.value?.setView([c.lat, c.lng], 7, { animate: true });
      }
    );
  } else {
    const targetCity = props.selectedCity || 'DKI Jakarta';
    const c = getCityCoordinates(targetCity, props.userLat, props.userLng);
    leafletMap.value?.setView([c.lat, c.lng], 7, { animate: true });
  }
};


const selectLayer = (id: string) => {
  activeLayerId.value = id;
  scheduleRedraw();
};

watch(() => props.selectedCity, () => {
  if (!leafletMap.value || !props.selectedCity) return;
  const c = getCityCoordinates(props.selectedCity, props.userLat, props.userLng);
  leafletMap.value.setView([c.lat, c.lng], 6, { animate: true });
});

watch(activeLayerId, () => scheduleRedraw());
watch(showCityLabels, () => updateCityMarkers());

let themeObserver: MutationObserver | null = null;

onMounted(async () => {
  await nextTick();
  initMap();

  themeObserver = new MutationObserver(() => {
    updateBasemap();
    scheduleRedraw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
  if (themeObserver) themeObserver.disconnect();
  clearInterval(playerTimer);
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  if (leafletMap.value) { leafletMap.value.remove(); leafletMap.value = null; }
});
</script>

<template>
  <div class="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-brand-navy-800/40 backdrop-blur-xl bg-white/90 dark:bg-brand-navy-900/60 shadow-xl font-sans select-none transition-all duration-300">
    <!-- Top Glow Border Line -->
    <div class="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent rounded-t-2xl"></div>

    <!-- ── Header (Matching PRAKIRAAN PERJAM Card) ─────────────────────── -->
    <div class="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-brand-navy-800/30 relative z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <!-- Left: Title & BMKG Badge -->
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10 shrink-0">
          <Compass class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase leading-none mb-1">
            Radar & Dinamika Atmosfer
          </h4>
          <p class="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
            Badan Meteorologi, Klimatologi, dan Geofisika
          </p>
        </div>
      </div>
    </div>

    <!-- Map Main Container -->
    <div id="windy-map-wrap" class="relative w-full overflow-hidden" style="height:530px;min-height:460px;">
      <!-- Leaflet map -->
      <div id="windy-leaflet-map" class="absolute inset-0 z-10 bg-slate-900"></div>
      <!-- Left Master Viewport Dock: Single Stacked Vertical Rail (Zoom, Layers, & Toggles) -->
      <div class="absolute left-3 top-3 z-30 flex flex-col p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl gap-1 select-none">
        
        <!-- Group 1: Zoom & Navigation -->
        <div class="flex flex-col gap-1 items-center">
          <!-- Zoom In -->
          <div class="relative group flex items-center justify-center">
            <button @click="zoomIn" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer">
              <Plus class="w-4 h-4" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Perbesar (Zoom In)</span>
            </div>
          </div>

          <!-- Zoom Out -->
          <div class="relative group flex items-center justify-center">
            <button @click="zoomOut" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer">
              <Minus class="w-4 h-4" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Perkecil (Zoom Out)</span>
            </div>
          </div>

          <!-- Lokasi Saya -->
          <div class="relative group flex items-center justify-center">
            <button @click="goToUserLocation"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-200 cursor-pointer">
              <Navigation class="w-4 h-4 text-blue-500 dark:text-cyan-400 group-hover:text-white" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Lokasi Saya</span>
            </div>
          </div>
        </div>

        <div class="h-px bg-slate-200/60 dark:bg-slate-800/60 my-0.5 w-full"></div>

        <!-- Group 2: Weather Layer Selectors (Atas Bawah di Kiri) -->
        <div class="flex flex-col gap-1 items-center">
          <div 
            v-for="layer in windyLayers" 
            :key="layer.id" 
            @click="selectLayer(layer.id)"
            class="relative group flex items-center justify-center"
          >
            <button 
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative"
              :class="activeLayerId === layer.id
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 scale-[1.03]'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'"
            >
              <component 
                :is="layer.icon" 
                class="w-4 h-4 shrink-0 transition-colors"
                :class="activeLayerId === layer.id ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400'" 
              />
              <span v-if="activeLayerId === layer.id" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-300 ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse"></span>
            </button>

            <!-- Floating Tooltip (Pops to the right) -->
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>{{ layer.name }}</span>
            </div>
          </div>
        </div>

        <div class="h-px bg-slate-200/60 dark:bg-slate-800/60 my-0.5 w-full"></div>

        <!-- Group 3: Feature Toggles -->
        <div class="flex flex-col gap-1 items-center">
          <!-- Animasi -->
          <div class="relative group flex items-center justify-center">
            <button @click="showParticles = !showParticles; scheduleRedraw()"
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="showParticles ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'">
              <RotateCw class="w-4 h-4" :class="showParticles ? 'animate-spin' : ''" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Animasi Vektor</span>
            </div>
          </div>

          <!-- Label Kota -->
          <div class="relative group flex items-center justify-center">
            <button @click="showCityLabels = !showCityLabels"
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="showCityLabels ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'">
              <component :is="showCityLabels ? Eye : EyeOff" class="w-4 h-4" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Label Kota</span>
            </div>
          </div>

          <!-- Isobar -->
          <div class="relative group flex items-center justify-center">
            <button @click="showPressureIsolines = !showPressureIsolines; scheduleRedraw()"
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="showPressureIsolines ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'">
              <Compass class="w-4 h-4" />
            </button>
            <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white text-[10.5px] font-bold shadow-2xl pointer-events-none opacity-0 invisible -translate-x-1 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-950/95 border-b border-l border-slate-700/80 rotate-45"></div>
              <span>Garis Isobar</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Viewport Horizontal Altitude Pill Bar (Satu Baris Kanan Kiri di Bawah) -->
      <div class="absolute bottom-3 left-16 right-3 z-30 flex items-center justify-between gap-2 p-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-x-auto no-scrollbar select-none">
        <div class="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-200 shrink-0">
          <Compass class="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
          <span>Altitude</span>
        </div>
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button v-for="alt in altitudes" :key="alt"
            @click="activeAltitude = alt; scheduleRedraw()"
            class="px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition-all duration-200 text-center whitespace-nowrap shrink-0 cursor-pointer"
            :class="activeAltitude === alt
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.03]'
              : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60'">
            {{ alt }}
          </button>
        </div>
      </div>

      <!-- Popup Inspection Card BMKG -->
      <transition enter-active-class="transition duration-200" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
        <div v-if="inspected" class="absolute left-1/2 -translate-x-1/2 top-4 z-40 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-3.5 text-white">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <div class="text-[11px] font-bold text-cyan-300">Stasiun BMKG: {{ inspected.lat }}°, {{ inspected.lng }}°</div>
            </div>
            <button @click="inspected = null" class="text-slate-400 hover:text-white font-bold text-xs p-1 rounded hover:bg-slate-800 transition-colors">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-2.5 mt-2.5">
            <div class="rounded-xl bg-slate-800/70 p-2.5 border border-slate-700/80 shadow-md flex flex-col justify-between">
              <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Temperatur</div>
              <div class="font-black text-amber-400 text-lg my-0.5 leading-none">{{ inspected.temp }}°C</div>
              <div class="text-[11px] text-slate-200 font-medium">{{ inspected.status }}</div>
            </div>
            <div class="rounded-xl bg-slate-800/70 p-2.5 border border-slate-700/80 shadow-md flex flex-col justify-between">
              <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Vektor Angin</div>
              <div class="font-bold text-xs text-white my-0.5">{{ inspected.wind }}</div>
              <div class="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Hujan: {{ inspected.rain }}%</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Bottom Timeline Bar & Model Selector -->
    <div class="bg-slate-50/95 dark:bg-slate-900/95 text-slate-800 dark:text-white px-4 py-3 flex flex-col gap-2.5 z-20 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md transition-colors duration-200">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <button @click="togglePlay" class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 transition-transform active:scale-95">
            <component :is="isPlaying ? Pause : Play" class="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>
          <div class="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs shrink-0 tabular-nums shadow-md">
            {{ activeTimeLabel }}
          </div>

          <input type="range" min="0" :max="totalSlotsCount - 1" v-model.number="currentSlot" @input="scheduleRedraw()"
            class="w-full h-1.5 accent-blue-600 cursor-pointer rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>

        <!-- ── Weather Forecast Model Selector ── -->
        <div class="flex items-center gap-1 shrink-0 justify-end">
          <div class="flex items-center bg-slate-200/70 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/60 rounded-xl p-1 gap-1">
            <button v-for="m in forecastModels" :key="m.id"
              @click="activeModel = m.id; scheduleRedraw()"
              class="px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1"
              :class="activeModel === m.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/60 dark:hover:bg-slate-700/60'">
              <span>{{ m.name }}</span>
              <span class="text-[8px] font-semibold opacity-75">{{ m.res }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <div v-for="(day, dIdx) in dayTabs" :key="day.dayStr + dIdx" @click="currentSlot = dIdx * 8; scheduleRedraw()"
            class="flex flex-col items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="Math.floor(currentSlot / 8) === dIdx ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'">
            <span class="text-[9px] font-bold">{{ day.dayStr }}</span>
            <span class="text-[10px] font-extrabold">{{ day.dateStr }}</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-0.5 shrink-0">
          <div class="h-2 w-48 rounded overflow-hidden border border-slate-300/60 dark:border-white/10" :style="{ background: activeLayer.colorGrad }"></div>
          <div class="flex justify-between w-48 text-[8px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
            <span v-for="val in activeLayer.legendVals" :key="String(val)">{{ val }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#windy-leaflet-map {
  width: 100%;
  height: 100%;
}
:deep(.leaflet-container) {
  font-family: inherit !important;
  background: #1e293b !important;
}
:deep(.leaflet-control-zoom),
:deep(.leaflet-control-attribution) {
  display: none !important;
}

@keyframes windy-ping {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}
</style>

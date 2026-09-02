<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { Layers, ZoomIn, ZoomOut, Anchor } from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMarineSectors, fetchMarinePorts } from '../data/indonesiaMapData';
import type { IndonesiaMarineSector, MarinePort } from '../data/indonesiaMapData';


// Async-loaded map data
let indonesiaMarineSectors: IndonesiaMarineSector[] = [];
let marinePorts: MarinePort[] = [];

const isLoadingMapData = ref(true);

// Indonesia provinces GeoJSON — precise coastlines for all islands
const INDONESIA_GEOJSON_URLS = [
  '/data/indonesia-prov.json',
  'https://cdn.jsdelivr.net/gh/superpikar/indonesia-geojson@master/indonesia-province-simple.json',
  'https://cdn.jsdelivr.net/gh/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces@main/GeoJSON/indonesia-38-provinces.geojson',
];

const activeMode = defineModel<'perairan' | 'pelabuhan'>('activeMode', { default: 'perairan' });
const activeLayer = defineModel<'gelombang' | 'cuaca' | 'angin'>('activeLayer', { default: 'gelombang' });
const hoursAhead = defineModel<number>('hoursAhead', { default: 0 });

// Mobile menus
const isMobileLayerOpen = ref(false);
const mobileLayerRef = ref<HTMLElement | null>(null);
const isLayerPanelOpen = ref(false);

const handleMobileLayerClickOutside = (event: MouseEvent) => {
  if (mobileLayerRef.value && !mobileLayerRef.value.contains(event.target as Node)) {
    isMobileLayerOpen.value = false;
  }
};

// Map instance and state
let map: L.Map | null = null;
let baseTileLayer: L.TileLayer | null = null;
let labelsTileLayer: L.TileLayer | null = null;
let geoJsonLandLayer: L.GeoJSON | null = null;
const isDark = ref(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
let themeObserver: MutationObserver | null = null;
const mapContainerId = 'indonesia-leaflet-map';

// Optimized Leaflet instances & groups (Non-reactive to prevent Vue Proxy overhead)
let polygonInstances: L.Polygon[] = [];
let seaSectorsGroup: L.LayerGroup | null = null;
let portsGroup: L.LayerGroup | null = null;

// Single Canvas label layer — draws ALL sector labels in one pass.
// Replaces 375 L.Marker DOM elements, eliminating per-marker repositioning overhead.
let labelCanvas: HTMLCanvasElement | null = null;
let labelCanvasVisible = true;

// Shared Canvas renderer for sector polygons
let sharedCanvasRenderer: L.Canvas | null = null;

// Dedicated Canvas renderer for the GeoJSON land mask (optimized for zoom performance)
let canvasLandRenderer: L.Canvas | null = null;

// Pre-computed per-sector static HTML header — computed once at init
const sectorStaticHeaderCache: string[] = [];

const isLoadingGeoJson = ref(true);

// ─── Custom Tooltip (Vue-managed overlay) ────────────────────────────────────
// Why custom div instead of Leaflet bindTooltip/bindPopup:
//   By using a custom pane 'landPane' with pointer-events: none for the land mask layer,
//   the mouse events pass directly to the Canvas renderer containing our sea polygons.
//   This allows mouseover and click events to trigger reliably on both polygons and label markers.
const hoveredSectorIndex = ref<number | null>(null);
const tooltipVisible = computed(() => hoveredSectorIndex.value !== null);
const tooltipX = ref(0);
const tooltipY = ref(0);

const tooltipHtml = computed(() => {
  if (hoveredSectorIndex.value === null) return '';
  const sector = indonesiaMarineSectors[hoveredSectorIndex.value];
  if (!sector) return '';
  return buildTooltipHtml(sector, hoveredSectorIndex.value);
});

const moveTooltip = (containerX: number, containerY: number) => {
  if (!map) return;
  const size = map.getSize();
  let x = containerX + 14;
  let y = containerY - 10;
  // Keep tooltip inside container
  const TW = 290, TH = 200;
  if (x + TW > size.x) x = containerX - TW - 14;
  if (y + TH > size.y) y = containerY - TH + 10;
  tooltipX.value = Math.max(4, x);
  tooltipY.value = Math.max(4, y);
};
// ─────────────────────────────────────────────────────────────────────────────

// Land mask fill/border colors per theme
const LAND_DARK_FILL  = '#1a1c24';
const LAND_DARK_LINE  = '#334155';
const LAND_LIGHT_FILL = '#f5f5f3';
const LAND_LIGHT_LINE = '#cbd5e1';

const loadGeoJsonLandMask = async () => {
  if (!map) return;
  isLoadingGeoJson.value = true;

  if (geoJsonLandLayer) {
    map.removeLayer(geoJsonLandLayer);
    geoJsonLandLayer = null;
  }

  let geojson: any = null;
  for (const url of INDONESIA_GEOJSON_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) { geojson = await res.json(); break; }
    } catch { /* try next */ }
  }

  if (!map) return;
  if (!geojson) { isLoadingGeoJson.value = false; return; }

  const fillColor = isDark.value ? LAND_DARK_FILL : LAND_LIGHT_FILL;
  const lineColor = isDark.value ? LAND_DARK_LINE : LAND_LIGHT_LINE;

  geoJsonLandLayer = L.geoJSON(geojson, {
    style: { fillColor, fillOpacity: 1.0, color: lineColor, weight: 0.8, opacity: 1, smoothFactor: 1.5, fillRule: 'evenodd' } as any,
    interactive: false,
    pane: 'landPane',
    renderer: canvasLandRenderer as any,
  } as any).addTo(map);

  isLoadingGeoJson.value = false;
};

const updateGeoJsonStyle = () => {
  if (!geoJsonLandLayer) return;
  const fillColor = isDark.value ? LAND_DARK_FILL : LAND_LIGHT_FILL;
  const lineColor = isDark.value ? LAND_DARK_LINE : LAND_LIGHT_LINE;
  geoJsonLandLayer.setStyle({ fillColor, fillOpacity: 1.0, color: lineColor, weight: 0.8, opacity: 1, fillRule: 'evenodd' });
};

const zoomIn  = () => { if (map) map.zoomIn(); };
const zoomOut = () => { if (map) map.zoomOut(); };

// Geolocation
const isLocating = ref(false);
const locationError = ref('');
let userLocationMarker: L.Marker | null = null;

const locateMe = () => {
  if (!map || isLocating.value) return;
  if (!navigator.geolocation) {
    locationError.value = 'Geolokasi tidak didukung browser ini';
    setTimeout(() => { locationError.value = ''; }, 3000);
    return;
  }
  isLocating.value = true;
  locationError.value = '';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (userLocationMarker) { userLocationMarker.remove(); userLocationMarker = null; }
      const pulsingIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:pulse-ring 1.6s cubic-bezier(0.215,0.61,0.355,1) infinite;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#3b82f6;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 2px rgba(59,130,246,0.5),0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>`,
        iconSize: [24, 24], iconAnchor: [12, 12],
      });
      userLocationMarker = L.marker([lat, lng], { icon: pulsingIcon, pane: 'markerPane', interactive: false, zIndexOffset: 9999 }).addTo(map!);
      map!.flyTo([lat, lng], 6.5, { animate: true, duration: 1.2 });
      isLocating.value = false;
    },
    (err) => {
      isLocating.value = false;
      const msgs: Record<number, string> = { 1: 'Izin lokasi ditolak', 2: 'Lokasi tidak tersedia', 3: 'Permintaan lokasi timeout' };
      locationError.value = msgs[err.code] || 'Gagal mendapatkan lokasi';
      setTimeout(() => { locationError.value = ''; }, 3500);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
};

// Wave height color scale
const getWaveColor = (waveHeight: number) => {
  if (waveHeight <= 0.5)  return '#38bdf8';
  if (waveHeight <= 1.25) return '#34d399';
  if (waveHeight <= 2.5)  return '#fcd34d';
  if (waveHeight <= 4.0)  return '#fb923c';
  if (waveHeight <= 6.0)  return '#f87171';
  return '#e879f9';
};

// Weather emoji helper (HTML version for popups)
const getWeatherEmoji = (weather: string, size = 16): string => {
  const w = weather.toLowerCase();
  let emoji = '☁️';
  if (w.includes('petir') || w.includes('badai'))       emoji = '⛈️';
  else if (w.includes('hujan'))                          emoji = '🌧️';
  else if (w.includes('kabut') || w.includes('asap'))   emoji = '🌫️';
  else if (w.includes('angin') || w.includes('berangin')) emoji = '💨';
  else if (w.includes('cerah berawan') || w.includes('sebagian berawan')) emoji = '⛅';
  else if (w.includes('berawan'))                        emoji = '☁️';
  else if (w.includes('cerah'))                          emoji = '☀️';
  return `<span style="font-size:${size}px;line-height:1;display:inline-block;vertical-align:middle;">${emoji}</span>`;
};

// Emoji char helper for canvas drawing (no HTML span)
const getWeatherEmojiChar = (weather: string): string => {
  const w = weather.toLowerCase();
  if (w.includes('petir') || w.includes('badai'))        return '⛈';
  if (w.includes('hujan'))                               return '🌧';
  if (w.includes('kabut') || w.includes('asap'))         return '🌫';
  if (w.includes('angin') || w.includes('berangin'))     return '💨';
  if (w.includes('cerah berawan') || w.includes('sebagian berawan')) return '⛅';
  if (w.includes('berawan'))                             return '☁';
  if (w.includes('cerah'))                               return '☀';
  return '☁';
};

// ─── Canvas Label Drawing ─────────────────────────────────────────────────────
// One canvas element draws ALL labels in a single pass.
// Canvas sits in labelsPane so it gets the same CSS zoom transform as tiles.
const LABEL_PAD = 120; // extra canvas padding so labels stay visible during short pans
let canvasTopLeft = L.point(0, 0);

const resizeLabelCanvas = () => {
  if (!labelCanvas || !map) return;
  const size = map.getSize();
  const w = size.x + LABEL_PAD * 2;
  const h = size.y + LABEL_PAD * 2;
  if (labelCanvas.width !== w) labelCanvas.width  = w;
  if (labelCanvas.height !== h) labelCanvas.height = h;
  labelCanvas.style.width  = w + 'px';
  labelCanvas.style.height = h + 'px';
};

const drawLabels = () => {
  if (!labelCanvas || !map || !labelCanvasVisible) return;
  const ctx = labelCanvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  if (activeMode.value !== 'perairan') return;

  const outlineColor = isDark.value ? '#0b132b' : '#ffffff';
  const fillColor    = isDark.value ? '#ffffff'  : '#000000';

  // Find the top-left layer point of the current view, offset by our padding
  const nwLayerPoint = map.containerPointToLayerPoint([0, 0]);
  canvasTopLeft.x = nwLayerPoint.x - LABEL_PAD;
  canvasTopLeft.y = nwLayerPoint.y - LABEL_PAD;

  // Position canvas correctly inside the moving pane (L.DomUtil.setPosition uses CSS transform)
  L.DomUtil.setPosition(labelCanvas, canvasTopLeft);

  ctx.font      = 'bold 10.5px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.lineJoin  = 'round';

  indonesiaMarineSectors.forEach((sector) => {
    const forecast = sector.forecasts[hoursAhead.value] || sector.forecasts[0];
    let text = '';
    if (activeLayer.value === 'gelombang')   text = `${forecast.waveHeight}m`;
    else if (activeLayer.value === 'angin')  text = `${forecast.windSpeed}kt`;
    else                                     text = getWeatherEmojiChar(forecast.weather);

    // Get layer point for this coordinate
    const pt = map!.latLngToLayerPoint(L.latLng(sector.center[0], sector.center[1]));
    
    // Canvas coordinate is its layer point minus the canvas's own top-left layer point
    const x = pt.x - canvasTopLeft.x;
    const y = pt.y - canvasTopLeft.y;

    ctx.strokeStyle = outlineColor;
    ctx.strokeText(text, x, y);
    ctx.fillStyle   = fillColor;
    ctx.fillText(text, x, y);
  });
};
// ─────────────────────────────────────────────────────────────────────────────

const updateTileLayers = () => {
  if (!map) return;
  if (baseTileLayer)   map.removeLayer(baseTileLayer);
  if (labelsTileLayer) map.removeLayer(labelsTileLayer);
  const base  = isDark.value ? 'dark_nolabels'     : 'light_nolabels';
  const label = isDark.value ? 'dark_only_labels'  : 'light_only_labels';
  baseTileLayer   = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${base}/{z}/{x}/{y}{r}.png`,  { maxZoom: 8, updateWhenZooming: false, updateWhenIdle: true }).addTo(map);
  labelsTileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${label}/{z}/{x}/{y}{r}.png`, { maxZoom: 8, pane: 'tileLabelsPane', updateWhenZooming: false, updateWhenIdle: true }).addTo(map);
};

// Timeline play/pause
const isPlaying = ref(false);
let playInterval: ReturnType<typeof setInterval> | null = null;

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay();
  } else {
    isPlaying.value = true;
    playInterval = setInterval(() => {
      hoursAhead.value = hoursAhead.value < 4 ? hoursAhead.value + 1 : 0;
    }, 2500);
  }
};

const stopPlay = () => {
  isPlaying.value = false;
  if (playInterval) { clearInterval(playInterval); playInterval = null; }
};

// Time label helper
const getFormattedTime = (hours: number) => {
  const now = new Date();
  const targetDate = new Date(now.getTime() + hours * 3600 * 1000);
  const days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const hourVal = (20 + hours) % 24;
  const hourStr = String(hourVal).padStart(2,'0') + '.00 WIB';
  let displayDay  = days[targetDate.getDay()];
  let displayDate = `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
  if (20 + hours >= 24) {
    displayDay  = days[targetDate.getDay()];
    displayDate = `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
  }
  return {
    label:    `${displayDay}, ${displayDate}, ${hourStr}`,
    subtitle: hours === 0 ? 'Saat ini' : `Dalam ${hours} jam`,
  };
};

// Legend counts
const getLegendCount = (category: string) => {
  const base: Record<string, number> = { tenang:31, rendah:168, sedang:156, tinggi:0, sangatTinggi:0, ekstrem:0, sangatEkstrem:0, noData:0 };
  const v = (hoursAhead.value * 7) % 5;
  if (category === 'tenang') return base.tenang - v;
  if (category === 'rendah') return base.rendah + v * 2;
  if (category === 'sedang') return base.sedang - v;
  return base[category] || 0;
};

// ─── Build tooltip HTML (always uses current hoursAhead) ─────────────────────
const buildTooltipHtml = (sector: IndonesiaMarineSector, idx: number): string => {
  const forecast = sector.forecasts[hoursAhead.value] || sector.forecasts[0];
  const isZPPI = (
    (forecast.waveHeight <= 1.5 && !forecast.weather.toLowerCase().includes('petir')) ||
    sector.name.toLowerCase().includes('samudra hindia')
  ) && ((idx * 37 + hoursAhead.value * 13) % 10 < 3);

  const zppiBadge = isZPPI
    ? '<span style="flex-shrink:0;background:rgba(59,130,246,0.2);color:#93c5fd;border:1px solid rgba(59,130,246,0.3);padding:2px 6px;border-radius:4px;font-size:8.5px;font-weight:700;letter-spacing:0.05em;display:inline-flex;align-items:center;gap:4px;">ZPPI 🐟</span>'
    : '';

  const getZPPIDistance = (lat: number, lng: number) => {
    const hash = Math.abs(lat * 12.34 + lng * 56.78);
    const min = Math.floor((hash % 25) + 3);
    return `${min} - ${min + Math.floor((hash % 10) + 2)}`;
  };

  const dynamic = `
    <div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#94a3b8;">Tinggi Gelombang:</span><span style="font-weight:700;color:#fff;">${forecast.waveHeight} m (${forecast.waveCategory})</span></div>
    <div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#94a3b8;">Kecepatan Angin:</span><span style="font-weight:700;color:#fff;">${forecast.windSpeed} Knot (${forecast.windDir})</span></div>
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span style="color:#94a3b8;">Kondisi Cuaca:</span><span style="font-weight:700;color:#fff;">${forecast.weather} ${getWeatherEmoji(forecast.weather, 13)}</span></div>
    <div style="display:flex;justify-content:space-between;gap:8px;border-top:1px solid rgba(255,255,255,0.05);padding-top:5px;margin-top:3px;"><span style="color:#94a3b8;">Arus Permukaan:</span><span style="font-weight:700;color:#fff;">${forecast.currentSpeed} Knot (${forecast.currentDir})</span></div>
    <div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#94a3b8;">Suhu / Lembap:</span><span style="font-weight:700;color:#fff;">${forecast.temp}°C / ${forecast.humidity}%</span></div>
    ${isZPPI ? `<div style="margin-top:6px;padding:5px 6px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:5px;font-size:9px;color:#bfdbfe;line-height:1.4;"><strong style="color:#93c5fd;">Info:</strong> Zona Potensial Penangkapan Ikan pada jarak ${getZPPIDistance(sector.center[0], sector.center[1])} mil laut dari garis pantai.</div>` : ''}`;

  return (sectorStaticHeaderCache[idx] || '')
    .replace('__ZPPI_BADGE__', zppiBadge)
    .replace('__DYNAMIC__', dynamic);
};
// ─────────────────────────────────────────────────────────────────────────────

// Initialize Map Layers — called once data is loaded
const initializeMapLayers = () => {
  if (!map) return;
  seaSectorsGroup = L.layerGroup().addTo(map);
  portsGroup      = L.layerGroup();

  // Pre-cache tooltip HTML header per sector
  indonesiaMarineSectors.forEach((sector, idx) => {
    sectorStaticHeaderCache[idx] = `
      <div style="min-width:215px;max-width:270px;text-align:left;font-family:system-ui,sans-serif;user-select:none;">
        <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <p style="font-size:9px;font-weight:900;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;margin:0;">Wilayah Perairan</p>
            __ZPPI_BADGE__
          </div>
          <h4 style="font-size:11.5px;font-weight:700;color:#fff;text-transform:uppercase;line-height:1.3;margin:0;white-space:normal;word-break:break-word;">${sector.name}</h4>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;font-size:10.5px;">
          __DYNAMIC__
        </div>
      </div>`;
  });

  // Sea Sector Polygons
  indonesiaMarineSectors.forEach((sector, idx) => {
    const polygon = L.polygon(sector.coordinates, {
      color: 'rgba(255,255,255,0.4)', weight: 1.2, opacity: 1.0,
      fillOpacity: isDark.value ? 0.45 : 1.0,
      className: 'cyber-polygon', pane: 'overlayPane', smoothFactor: 4,
      renderer: sharedCanvasRenderer!, interactive: true,
    } as any);
    seaSectorsGroup!.addLayer(polygon);
    polygonInstances.push(polygon);

    const highlightPolygon = () => {
      polygon.setStyle({ fillOpacity: 0.85, weight: 2.0, color: 'rgba(255,255,255,0.9)', opacity: 1.0 });
    };
    const resetPolygon = () => {
      const f = sector.forecasts[hoursAhead.value] || sector.forecasts[0];
      polygon.setStyle({ fillColor: getWaveColor(f.waveHeight), fillOpacity: isDark.value ? 0.45 : 1.0, color: 'rgba(255,255,255,0.4)', weight: 1.2, opacity: 1.0 });
    };

    polygon.on('mouseover', (e: L.LeafletMouseEvent) => {
      highlightPolygon();
      hoveredSectorIndex.value = idx;
      moveTooltip(e.containerPoint.x, e.containerPoint.y);
    });
    polygon.on('mousemove', (e: L.LeafletMouseEvent) => {
      moveTooltip(e.containerPoint.x, e.containerPoint.y);
    });
    polygon.on('mouseout', () => {
      resetPolygon();
      hoveredSectorIndex.value = null;
    });
  });

  // 3. Port Markers
  marinePorts.forEach(port => {
    const pulseClass = port.status === 'Bahaya' ? 'bg-red-500 animate-ping' : port.status === 'Waspada' ? 'bg-orange-500 animate-ping' : 'bg-cyan-400 animate-ping';
    const solidClass = port.status === 'Bahaya' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : port.status === 'Waspada' ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-cyan-400 shadow-[0_0_10px_#00f5ff]';
    const portIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-7 h-7 rounded-full opacity-60 ${pulseClass}"></div>
        <div class="w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center z-10 ${solidClass}">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7Z"/><path d="M12 2a3 3 0 0 0-3 3v10a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><circle cx="12" cy="5" r="1"/>
          </svg>
        </div>
      </div>`,
      className: 'custom-port-icon', iconSize: [32, 32], iconAnchor: [16, 16],
    });
    const marker = L.marker(port.coordinate, { icon: portIcon, pane: 'labelsPane' });
    const statusColor = port.status === 'Aman' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : port.status === 'Waspada' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 'text-red-500 border-red-500/30 bg-red-500/10';
    marker.bindPopup(`
      <div class="text-left font-sans select-none min-w-[200px]">
        <div class="border-b border-white/10 pb-1.5 mb-2">
          <span class="inline-flex items-center gap-1 border px-1.5 py-0.5 rounded text-[8px] font-black uppercase leading-none ${statusColor}">Status: ${port.status}</span>
          <h4 class="text-xs font-black text-white uppercase mt-1.5">${port.name}</h4>
        </div>
        <div class="space-y-1.5 text-[10.5px]">
          <div class="flex justify-between"><span class="text-slate-400">Cuaca Pelabuhan:</span><span class="font-bold text-white">${port.weather} ${getWeatherEmoji(port.weather, 13)}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Kecepatan Angin:</span><span class="font-bold text-white">${port.windSpeed}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Gelombang Alur:</span><span class="font-bold text-white">${port.waveHeight}</span></div>
        </div>
      </div>`, { className: 'cyber-popup-container' });
    portsGroup!.addLayer(marker);
  });
};

// Update layers whenever mode/layer/time changes
const renderLayers = () => {
  if (!map || !seaSectorsGroup || !portsGroup) return;
  hoveredSectorIndex.value = null;

  if (activeMode.value === 'perairan') {
    if (!map.hasLayer(seaSectorsGroup)) map.addLayer(seaSectorsGroup);
    if (map.hasLayer(portsGroup))       map.removeLayer(portsGroup);
    if (labelCanvas) labelCanvas.style.display = '';

    // Batch all polygon color updates
    indonesiaMarineSectors.forEach((sector, idx) => {
      const forecast = sector.forecasts[hoursAhead.value] || sector.forecasts[0];
      const polygon  = polygonInstances[idx];
      if (polygon) polygon.setStyle({ fillColor: getWaveColor(forecast.waveHeight), fillOpacity: isDark.value ? 0.45 : 1.0, color: 'rgba(255,255,255,0.4)', weight: 1.2, opacity: 1.0 });
    });

    // Redraw label canvas in one pass
    drawLabels();

  } else {
    if (!map.hasLayer(portsGroup))      map.addLayer(portsGroup);
    if (map.hasLayer(seaSectorsGroup))  map.removeLayer(seaSectorsGroup);
    if (labelCanvas) labelCanvas.style.display = 'none';
  }
};

onMounted(() => {
  window.addEventListener('click', handleMobileLayerClickOutside);

  nextTick(() => {
    sharedCanvasRenderer = L.canvas({ padding: 0.1 });
    canvasLandRenderer   = L.canvas({ padding: 0.1, pane: 'landPane' });

    map = L.map(mapContainerId, {
      zoomControl: false, attributionControl: false,
      minZoom: 4.5, maxZoom: 7.5, preferCanvas: true,
      keyboard: false, scrollWheelZoom: false, touchZoom: false,
      doubleClickZoom: false, inertia: false, bounceAtZoomLimits: false,
      zoomSnap: 0.5, zoomDelta: 0.5,
      zoomAnimation: true, markerZoomAnimation: false,
    }).setView([-7.6, 110.0], 6.5);

    // Custom label canvas (single element replaces 375 L.Marker DOM nodes)
    const labelsPane = map.createPane('labelsPane');
    labelsPane.style.zIndex = '450';
    labelsPane.style.pointerEvents = 'none';

    labelCanvas = document.createElement('canvas');
    labelCanvas.style.cssText = 'position:absolute;pointer-events:none;';
    labelsPane.appendChild(labelCanvas);
    resizeLabelCanvas();

    const landPane = map.createPane('landPane');
    landPane.style.zIndex = '401';
    landPane.style.pointerEvents = 'none';

    const tileLabelsPane = map.createPane('tileLabelsPane');
    tileLabelsPane.style.zIndex = '420';
    tileLabelsPane.style.pointerEvents = 'none';

    // Only promote tile layer to GPU
    const panes = map.getPanes();
    (panes.tilePane as HTMLElement).style.willChange = 'transform';

    // Labels: fade out during zoom (canvas scales with pane CSS transform),
    // redraw at new positions after zoomend/moveend.
    map.on('zoomstart', () => { labelCanvasVisible = false; labelsPane.style.opacity = '0'; });
    map.on('zoomend',   () => {
      labelCanvasVisible = true;
      resizeLabelCanvas();
      drawLabels();
      labelsPane.style.transition = 'opacity 0.12s ease';
      labelsPane.style.opacity = '1';
    });
    map.on('moveend',  drawLabels);
    map.on('resize',   () => { resizeLabelCanvas(); drawLabels(); });

    updateTileLayers();

    const loadData = async () => {
      try {
        isLoadingMapData.value = true;
        const [sectors, ports] = await Promise.all([fetchMarineSectors(), fetchMarinePorts()]);
        indonesiaMarineSectors = sectors;
        marinePorts            = ports;
        isLoadingMapData.value = false;
        initializeMapLayers();
        renderLayers();
        loadGeoJsonLandMask();
      } catch {
        isLoadingMapData.value = false;
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => loadData(), { timeout: 2000 });
    } else {
      setTimeout(() => loadData(), 100);
    }

    setTimeout(() => { if (map) { map.invalidateSize(); } }, 400);
  });

  themeObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark');
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
  window.removeEventListener('click', handleMobileLayerClickOutside);
  stopPlay();
  if (themeObserver) { themeObserver.disconnect(); themeObserver = null; }
  if (userLocationMarker) { userLocationMarker.remove(); userLocationMarker = null; }
  if (labelCanvas) { labelCanvas.remove(); labelCanvas = null; }
  geoJsonLandLayer  = null;
  polygonInstances  = [];
  seaSectorsGroup   = null;
  portsGroup        = null;
  if (map) { map.remove(); map = null; }
});

watch([activeMode, activeLayer], ([newMode], [oldMode]) => {
  renderLayers();
  if (newMode !== oldMode && geoJsonLandLayer) geoJsonLandLayer.bringToFront();
});

watch(hoursAhead, () => { renderLayers(); });

watch(isDark, () => {
  if (map) { updateTileLayers(); updateGeoJsonStyle(); renderLayers(); }
});
</script>

<template>
  <div class="bg-white/70 dark:bg-brand-navy-900/60 border border-slate-100/50 dark:border-brand-navy-700/20 rounded-2xl p-6 shadow-sm backdrop-blur-md">
    <!-- Header Area -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Anchor class="w-4 h-4 text-blue-500 dark:text-brand-cyan animate-pulse" />
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">PETA METEOROLOGI MARITIM BMKG</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Prakiraan Gelombang & Cuaca Perairan Indonesia (INAWAVES)</p>
      </div>

      <div class="hidden sm:flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/60 dark:bg-brand-navy-900/60 border border-slate-200/40 dark:border-brand-navy-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live INAWAVES Telemetry</span>
        </div>
      </div>
    </div>

    <!-- Map Container Box -->
    <div class="relative w-full rounded-2xl overflow-hidden border shadow-inner h-[450px] md:h-[550px] bg-white dark:bg-slate-950 border-slate-200/50 dark:border-brand-navy-800" style="contain: layout paint;">
    
    <!-- Top-left Meteorological coordinate indicator -->
    <div class="absolute left-6 top-6 z-30 pointer-events-none font-mono text-[9px] text-slate-500 dark:text-slate-600 uppercase tracking-widest hidden md:block">
      Archipelago Map &bull; Live Telemetry Feed &bull; BMKG-INAWAVES API
    </div>

    <!-- Background grid overlay (cybernetic HUD style) -->
    <div class="absolute inset-0 opacity-[0.05] pointer-events-none select-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-20"></div>

    <!-- LEAFLET MAP ELEMENT CONTAINER -->
    <div :id="mapContainerId" class="absolute inset-0 z-10 w-full h-full" style="touch-action: none;"></div>

    <!-- Custom Hover Tooltip Overlay -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      leave-active-class="transition duration-75 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="tooltipVisible"
        class="absolute z-50 pointer-events-none"
        :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
      >
        <div
          class="rounded-2xl border shadow-2xl"
          style="background:rgba(8,15,30,0.97);border-color:rgba(6,182,212,0.4);padding:10px 14px;box-shadow:0 10px 35px rgba(0,0,0,0.7),0 0 20px rgba(6,182,212,0.15);"
          v-html="tooltipHtml"
        />
      </div>
    </Transition>

    <!-- GeoJSON Loading Indicator -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-500 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoadingGeoJson"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      >
        <div class="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[10px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/50 shadow-lg">
          <span class="w-2 h-2 rounded-full bg-blue-500 dark:bg-brand-cyan animate-pulse shrink-0"></span>
          Memuat masker pantai...
        </div>
      </div>
    </Transition>

    <!-- Map Data Loading Indicator -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-500 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoadingMapData"
        class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      >
        <div class="flex flex-col items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-xl">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin text-blue-500 dark:text-brand-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300">Memuat data peta maritim...</span>
          </div>
          <div class="text-[9px] text-slate-400 dark:text-slate-500">375 wilayah perairan Indonesia</div>
        </div>
      </div>
    </Transition>


    <!-- LEFT CORNER: ZOOM CONTROLS + LOCATE -->
    <div class="absolute left-4 top-4 flex flex-col gap-1.5 z-30">
      <!-- Zoom group pill -->
      <div class="flex flex-col bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-md border border-slate-200/60 dark:border-brand-navy-800 rounded-2xl shadow-xl overflow-hidden">
        <button
          @click="zoomIn"
          class="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-brand-navy-800 hover:text-blue-600 dark:hover:text-brand-cyan transition-all duration-150 cursor-pointer"
          title="Perbesar"
        >
          <ZoomIn class="w-4 h-4" />
        </button>
        <div class="h-px bg-slate-200/80 dark:bg-brand-navy-800 mx-2"></div>
        <button
          @click="zoomOut"
          class="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-brand-navy-800 hover:text-blue-600 dark:hover:text-brand-cyan transition-all duration-150 cursor-pointer"
          title="Perkecil"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
      </div>

      <!-- Locate Me Button -->
      <button
        @click="locateMe"
        :disabled="isLocating"
        class="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xl select-none outline-none transition-all duration-200 cursor-pointer"
        :class="isLocating
          ? 'bg-blue-500/20 border-blue-500/40 text-blue-500 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400 cursor-wait'
          : 'bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-md text-slate-600 border-slate-200/60 dark:border-brand-navy-800 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-brand-navy-800 dark:hover:text-brand-cyan active:scale-95'"
        title="Lokasi Saya"
      >
        <svg v-if="isLocating" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </svg>
      </button>
    </div>

    <!-- Location Error Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-300 ease-in"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="locationError"
        class="absolute left-14 top-[116px] z-30 pointer-events-none"
      >
        <div class="flex items-center gap-2 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ locationError }}
        </div>
      </div>
    </Transition>

    <!-- FLOATING COMPONENT: LAYER PANEL CONTROLLER (Top Right) -->
    <div class="hidden md:flex flex-col items-end gap-2 absolute right-4 top-4 z-30">
      
      <!-- Layer Panel (collapsible) -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0 scale-95 -translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-2"
      >
        <div v-if="isLayerPanelOpen" class="w-56 bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-brand-navy-800 text-left select-none shadow-2xl origin-top-right">

          <!-- Mode Section -->
          <div class="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 leading-none">Mode Tampilan</div>
          <div class="space-y-1.5 mb-3">
            <!-- Perairan -->
            <button
              @click="activeMode = 'perairan'"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-extrabold transition-all duration-200 text-left cursor-pointer"
              :class="activeMode === 'perairan' ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-brand-cyan dark:border-brand-cyan/40 dark:bg-brand-cyan/5' : 'border-slate-200/60 bg-white/60 text-slate-700 dark:border-brand-navy-800/80 dark:bg-brand-navy-900/40 dark:text-slate-300'"
            >
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" :class="activeMode === 'perairan' ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                <span>Perairan</span>
              </div>
              <div v-if="activeMode === 'perairan'" class="w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-brand-cyan flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </button>

            <!-- Pelabuhan -->
            <button
              @click="activeMode = 'pelabuhan'"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-extrabold transition-all duration-200 text-left cursor-pointer"
              :class="activeMode === 'pelabuhan' ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-brand-cyan dark:border-brand-cyan/40 dark:bg-brand-cyan/5' : 'border-slate-200/60 bg-white/60 text-slate-700 dark:border-brand-navy-800/80 dark:bg-brand-navy-900/40 dark:text-slate-300'"
            >
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" :class="activeMode === 'pelabuhan' ? 'text-blue-500 dark:text-brand-cyan' : 'text-slate-400 dark:text-slate-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7Z"/><path d="M12 2a3 3 0 0 0-3 3v10a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><circle cx="12" cy="5" r="1"/></svg>
                <span>Pelabuhan</span>
              </div>
              <div v-if="activeMode === 'pelabuhan'" class="w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-brand-cyan flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </button>
          </div>

          <!-- Tampilan Perairan options -->
          <div v-if="activeMode === 'perairan'" class="border-t border-slate-200/50 dark:border-brand-navy-800/80 pt-3">
            <div class="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 leading-none">Tampilan Perairan</div>
            <div class="space-y-1.5">
              <!-- Gelombang -->
              <button
                @click="activeLayer = 'gelombang'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all duration-200 text-left cursor-pointer"
                :class="activeLayer === 'gelombang' ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-brand-cyan dark:border-brand-cyan/40' : 'border-slate-200/40 bg-white/40 text-slate-655 dark:border-brand-navy-800/40 dark:bg-brand-navy-900/20 dark:text-slate-400'"
              >
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                  <span>Gelombang</span>
                </div>
                <div v-if="activeLayer === 'gelombang'" class="w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-brand-cyan flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </button>

              <!-- Cuaca -->
              <button
                @click="activeLayer = 'cuaca'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all duration-200 text-left cursor-pointer"
                :class="activeLayer === 'cuaca' ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-brand-cyan dark:border-brand-cyan/40' : 'border-slate-200/40 bg-white/40 text-slate-655 dark:border-brand-navy-800/40 dark:bg-brand-navy-900/20 dark:text-slate-400'"
              >
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A7 7 0 1 0 3 16.5c0 1.38 1.12 2.5 2.5 2.5h12Z"/></svg>
                  <span>Cuaca</span>
                </div>
                <div v-if="activeLayer === 'cuaca'" class="w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-brand-cyan flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </button>

              <!-- Kec. Angin -->
              <button
                @click="activeLayer = 'angin'"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all duration-200 text-left cursor-pointer"
                :class="activeLayer === 'angin' ? 'border-blue-500 bg-blue-500/5 text-blue-650 dark:text-brand-cyan dark:border-brand-cyan/40' : 'border-slate-200/40 bg-white/40 text-slate-655 dark:border-brand-navy-800/40 dark:bg-brand-navy-900/20 dark:text-slate-400'"
              >
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.8 3c-1.2 0-2.2 1-2.2 2.2a2.2 2.2 0 0 0 2.2 2.2h8.2"/><path d="M10.1 8c-1.5 0-2.7 1.2-2.7 2.7S8.6 13.4 10 13.4h11.2"/><path d="M16.2 14c-1.2 0-2.2 1-2.2 2.2a2.2 2.2 0 0 0 2.2 2.2h4.8"/></svg>
                  <span>Kec. Angin</span>
                </div>
                <div v-if="activeLayer === 'angin'" class="w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-brand-cyan flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </button>
            </div>
          </div>

        </div>
      </Transition>

      <!-- Toggle Button -->
      <button
        @click="isLayerPanelOpen = !isLayerPanelOpen"
        class="flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-xl bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-md border-slate-200/60 dark:border-brand-navy-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-brand-cyan hover:bg-blue-50 dark:hover:bg-brand-navy-800 transition-all duration-200 select-none cursor-pointer text-[10.5px] font-bold"
        :title="isLayerPanelOpen ? 'Sembunyikan Panel' : 'Tampilkan Panel'"
      >
        <!-- Layers icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
        </svg>
        <span>Layer</span>
        <!-- Chevron indicator -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 transition-transform duration-200" :class="isLayerPanelOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
    </div>

    <!-- FLOATING COMPONENT: LEGEND PANEL (Bottom Left Overlay) -->
    <div class="hidden md:block absolute left-4 bottom-4 z-25 w-52 bg-white/95 dark:bg-brand-navy-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-brand-navy-800 shadow-xl text-[9px] font-sans leading-relaxed select-none">
      <div class="font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2 text-[10px]">Tinggi Gelombang</div>
      
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#0ea5e9] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Tenang <span class="text-slate-400 font-medium">(0.0 - 0.5m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('tenang') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#10b981] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Rendah <span class="text-slate-400 font-medium">(0.5 - 1.25m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('rendah') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#fbbf24] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Sedang <span class="text-slate-400 font-medium">(1.25 - 2.5m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('sedang') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#f97316] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Tinggi <span class="text-slate-400 font-medium">(2.5 - 4.0m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('tinggi') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#ef4444] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Sangat Tinggi <span class="text-slate-400 font-medium">(4.0 - 6.0m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('sangatTinggi') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#d946ef] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Ekstrem <span class="text-slate-400 font-medium">(6.0 - 9.0m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('ekstrem') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#000000] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350">Sangat Ekstrem <span class="text-slate-400 font-medium">(> 9.0m)</span></span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('sangatEkstrem') }})</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded bg-[#94a3b8] border border-black/10 shrink-0"></span>
            <span class="text-slate-655 dark:text-slate-350 font-medium">No Data</span>
          </div>
          <span class="font-bold text-slate-500 dark:text-slate-400">({{ getLegendCount('noData') }})</span>
        </div>
      </div>

      <!-- Text labels color guides -->
      <div class="border-t border-slate-200/50 dark:border-slate-800/80 pt-2.5 mt-2">
        <div class="font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1.5 text-[8.5px]">Warna Teks</div>
        <div class="space-y-0.5 font-bold flex flex-col">
          <div class="flex items-center gap-2 text-[#a16207]">
            <span class="font-serif font-black text-xs leading-none">A</span>
            <span>Pelabuhan</span>
          </div>
          <div class="flex items-center gap-2 text-[#1d4ed8] dark:text-[#60a5fa]">
            <span class="font-serif font-black text-xs leading-none">A</span>
            <span>Perairan</span>
          </div>
        </div>
      </div>

      <!-- Port counter stats bottom row -->
      <div class="border-t border-slate-200/50 dark:border-slate-800/80 pt-2.5 mt-2 flex items-center gap-1.5 font-black text-slate-700 dark:text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-blue-600 dark:text-brand-cyan shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7Z"/><path d="M12 2a3 3 0 0 0-3 3v10a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><circle cx="12" cy="5" r="1"/></svg>
        <span>Pelabuhan (673/673)</span>
      </div>
    </div>

    <!-- FLOATING COMPONENT: TIMELINE CONTROLLER SLIDER (Bottom Center Overlay) -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-25 w-[280px] md:w-80 bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-brand-navy-800 shadow-xl flex items-center justify-between gap-3 text-slate-800 dark:text-white select-none">
      <button 
        @click="hoursAhead > 0 ? hoursAhead-- : null" 
        :disabled="hoursAhead === 0"
        class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-brand-navy-900 disabled:opacity-30 transition-all cursor-pointer outline-none shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div class="flex items-center gap-2 justify-center flex-grow leading-none">
        <div class="text-left">
          <div class="text-[10px] md:text-[11px] font-black text-slate-800 dark:text-white">{{ getFormattedTime(hoursAhead).label }}</div>
          <button class="text-[9px] font-extrabold text-blue-600 dark:text-brand-cyan tracking-wider uppercase mt-0.5 cursor-pointer hover:underline bg-transparent border-none p-0 text-left">
            {{ getFormattedTime(hoursAhead).subtitle }}
          </button>
        </div>
        
        <!-- Animated Play Button -->
        <button 
          @click="togglePlay"
          class="w-6 h-6 rounded-full bg-blue-50 dark:bg-brand-cyan/15 flex items-center justify-center shrink-0 border border-blue-200/30 dark:border-brand-cyan/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer outline-none"
          :title="isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 fill-current text-blue-600 dark:text-brand-cyan ml-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 fill-current text-blue-600 dark:text-brand-cyan" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
      </div>

      <button 
        @click="hoursAhead < 4 ? hoursAhead++ : null" 
        :disabled="hoursAhead === 4"
        class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-brand-navy-900 disabled:opacity-30 transition-all cursor-pointer outline-none shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- Mobile Layer Menu (Mobile/Tablet Only Dropdown) -->
    <div ref="mobileLayerRef" class="md:hidden absolute right-3 top-3 z-30">
      <button 
        @click="isMobileLayerOpen = !isMobileLayerOpen"
        class="w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg bg-white/90 text-slate-800 border-slate-200/50 hover:bg-slate-50 hover:scale-105 active:scale-95 dark:bg-brand-navy-900/90 dark:border-brand-navy-800 dark:text-white dark:hover:bg-brand-navy-800 select-none outline-none transition-all duration-200 cursor-pointer"
      >
        <Layers class="w-4.5 h-4.5 text-blue-600 dark:text-brand-cyan" />
      </button>
      
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div 
          v-if="isMobileLayerOpen"
          class="absolute right-0 mt-2 w-48 glass-panel-light dark:glass-panel-dark p-4 rounded-3xl border border-slate-200/60 dark:border-brand-navy-800 text-left shadow-2xl z-50
            bg-white/95 border-slate-100 backdrop-blur-md dark:bg-brand-navy-900/95 dark:border-brand-navy-800/40"
        >
          <div class="flex items-center gap-2 border-b border-slate-200/40 dark:border-brand-navy-800/80 pb-2 mb-3">
            <Layers class="w-4 h-4 text-blue-600 dark:text-brand-cyan" />
            <h5 class="text-[11px] font-black uppercase text-slate-800 dark:text-white tracking-widest leading-none">Kontrol Layer</h5>
          </div>

          <!-- Mode Selector -->
          <div class="flex rounded-xl overflow-hidden bg-slate-100 dark:bg-brand-navy-950 p-0.5 border border-slate-200/30 dark:border-brand-navy-800/40 text-[10px] font-black">
            <button 
              @click="activeMode = 'perairan'"
              class="flex-1 py-1.5 px-2 rounded-lg transition-all text-center uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
              :class="activeMode === 'perairan' ? 'bg-blue-600 text-white dark:bg-brand-cyan dark:text-brand-navy-950 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'"
            >
              Perairan
            </button>
            <button 
              @click="activeMode = 'pelabuhan'"
              class="flex-1 py-1.5 px-2 rounded-lg transition-all text-center uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
              :class="activeMode === 'pelabuhan' ? 'bg-blue-600 text-white dark:bg-brand-cyan dark:text-brand-navy-950 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'"
            >
              <Anchor class="w-3 h-3" /> Pelabuhan
            </button>
          </div>

          <!-- Layer Subheaders & Overlays toggles -->
          <div class="mt-4 space-y-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <div class="text-[8px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Overlay {{ activeMode === 'perairan' ? 'Laut' : 'Port' }}
            </div>
            
            <label class="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group">
              <input 
                type="radio" 
                name="layer-select-mobile" 
                value="gelombang"
                v-model="activeLayer"
                class="w-4 h-4 accent-blue-600 dark:accent-brand-cyan cursor-pointer transition-all"
              />
              <span class="group-hover:translate-x-0.5 transition-transform">Gelombang Laut</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group">
              <input 
                type="radio" 
                name="layer-select-mobile" 
                value="cuaca"
                v-model="activeLayer"
                class="w-4 h-4 accent-blue-600 dark:accent-brand-cyan cursor-pointer transition-all"
              />
              <span class="group-hover:translate-x-0.5 transition-transform">Kondisi Cuaca</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group">
               <input 
                 type="radio" 
                 name="layer-select-mobile" 
                 value="angin"
                 v-model="activeLayer"
                 class="w-4 h-4 accent-blue-600 dark:accent-brand-cyan cursor-pointer transition-all"
               />
               <span class="group-hover:translate-x-0.5 transition-transform">Kecepatan Angin</span>
            </label>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</div>
</template>

<style scoped>
/* Scoped deep overrides to style Leaflet custom elements */
:deep(.leaflet-container) {
  background: #f5f5f3 !important; /* CartoDB Positron land color */
  transition: background 0.3s ease;
}

.dark :deep(.leaflet-container) {
  background: #1a1c24 !important; /* CartoDB Dark Matter land color */
}

/* Tooltips have been completely removed and replaced with Popups */

/* Port popup styles */
:deep(.cyber-popup-container .leaflet-popup-content-wrapper) {
  background: rgba(8, 15, 30, 0.97) !important;
  border: 1px solid rgba(6, 182, 212, 0.4) !important;
  border-radius: 16px !important;
  padding: 8px 12px !important;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.2) !important;
  font-family: inherit !important;
  color: white !important;
}

:deep(.cyber-popup-container .leaflet-popup-tip) {
  background: rgba(8, 15, 30, 0.92) !important;
  border: 1px solid rgba(6, 182, 212, 0.4) !important;
}

/* Pulsing ring animation for user location marker */
@keyframes pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 0.8;
  }
  70% {
    transform: scale(2.2);
    opacity: 0;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>

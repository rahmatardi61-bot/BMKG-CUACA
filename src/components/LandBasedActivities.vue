<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  X, 
  Navigation, 
  Compass, 
  Sun,
  CloudRain,
  Clock,
  Map as MapIcon,
  ChevronLeft,
  Search,
  CloudLightning,
  Cloud,
  Eye,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  MapPin,
  Mic
} from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  type LocationData, 
  locationsList, 
  routesCoordinates,
  routesCheckpoints
} from '../data/landBasedActivitiesData';

const props = defineProps<{
  isOpen: boolean;
  selectedCity: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

void Cloud;

// Steps & Interactive states
const currentStep = ref<'overview' | 'search' | 'selected' | 'directions'>('overview');
const searchQuery = ref('');
const startLocation = ref<LocationData>(locationsList.find(c => c.id === 'bangunjiwo') || locationsList[0]);
const destinationLocation = ref<LocationData | null>(null);
const activeTravelMode = ref('car');

// Bottom sheet drag state
const sheetExpanded = ref(true);
let dragStartY = 0;
let dragStartTime = 0;
let isDraggingSheet = false;

const onSheetDragStart = (e: PointerEvent) => {
  isDraggingSheet = true;
  dragStartY = e.clientY;
  dragStartTime = Date.now();
  window.addEventListener('pointermove', onSheetDragMove, { passive: true });
  window.addEventListener('pointerup', onSheetDragEnd, { once: true });
};

const onSheetDragMove = (_e: PointerEvent) => {
  if (!isDraggingSheet) return;
  // Visual feedback while dragging handled by end only
};

const onSheetDragEnd = (e: PointerEvent) => {
  isDraggingSheet = false;
  window.removeEventListener('pointermove', onSheetDragMove);
  const deltaY = e.clientY - dragStartY;
  const elapsed = Date.now() - dragStartTime;
  const isFlick = elapsed < 300 && Math.abs(deltaY) > 30;
  // Drag down (positive deltaY) → minimize; drag up → expand
  if (deltaY > 60 || (isFlick && deltaY > 0)) {
    sheetExpanded.value = false;
  } else if (deltaY < -40 || (isFlick && deltaY < 0)) {
    sheetExpanded.value = true;
  }
};

const toggleSheetExpanded = () => {
  sheetExpanded.value = !sheetExpanded.value;
};

const travelModes = [
  { id: 'car', icon: Car },
  { id: 'moto', icon: Bike },
  { id: 'transit', icon: Bus },
  { id: 'train', icon: Train },
  { id: 'plane', icon: Plane }
];

// Form States
const startCityId = ref('');
const endCityId = ref('');
const isRouting = ref(false);

const isMobile = ref(false);
const mapEl = ref<HTMLElement | null>(null);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
};

const moveMapElement = () => {
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 250);
};

const handleResize = () => {
  checkMobile();
  moveMapElement();
};

const startQuery = ref('');
const endQuery = ref('');

// Search suggestions for the full-screen search step
const searchSuggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return locationsList.slice(0, 8);
  return locationsList.filter(loc =>
    loc.name.toLowerCase().includes(query) ||
    loc.region.toLowerCase().includes(query) ||
    loc.type.toLowerCase().includes(query)
  ).slice(0, 10);
});

// Leaflet Map instance references
let map: L.Map | null = null;
let tileLayer: L.TileLayer | null = null;
let routePolyline: L.Polyline | null = null;
let alternativePolylines: L.Polyline[] = [];
let mapMarkers: L.Marker[] = [];
let currentRouteTaskId = 0;
let themeObserver: MutationObserver | null = null;

// Alternative Routes State
interface AlternativeRoute {
  id: 'fastest' | 'safest' | 'least_rain';
  label: string;
  distance: number;
  duration: string;
  coords: [number, number][];
  checkpoints: Array<{
    name: string;
    lat: number;
    lng: number;
    temp: number;
    weather: string;
    condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
    tips: string;
    eta: string;
  }>;
}

const alternativeRoutes = ref<AlternativeRoute[]>([]);
const selectedRouteId = ref<'fastest' | 'safest' | 'least_rain'>('fastest');

// Results State
const routeDistance = ref(0);
const routeDuration = ref('');
const routeCheckpoints = ref<Array<{
  name: string;
  lat: number;
  lng: number;
  temp: number;
  weather: string;
  condition: 'cerah' | 'berawan' | 'hujan' | 'badai';
  tips: string;
  eta: string;
}>>([]);

// Custom dynamic HTML markers for OpenStreetMap
const createCustomMarker = (condition: 'cerah' | 'berawan' | 'hujan' | 'badai', label: string, isEnd = false) => {
  let iconHtml = `<svg class="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.25"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  let markerColor = 'from-orange-400 to-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)]';
  
  if (condition === 'berawan') {
    iconHtml = `<svg class="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.23.2A6 6 0 0 0 3 11.5A5.5 5.5 0 0 0 8.5 17h9Z" fill="currentColor" fill-opacity="0.25"/></svg>`;
    markerColor = 'from-slate-400 to-slate-500 shadow-[0_4px_12px_rgba(100,116,139,0.35)]';
  } else if (condition === 'hujan') {
    iconHtml = `<svg class="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.23.2A6 6 0 0 0 3 11.5A5.5 5.5 0 0 0 8.5 17h9Z" fill="currentColor" fill-opacity="0.1"/><path d="M16 14v6M8 14v6M12 16v6"/></svg>`;
    markerColor = 'from-cyan-400 to-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.4)]';
  } else if (condition === 'badai') {
    iconHtml = `<svg class="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.23.2A6 6 0 0 0 3 11.5A5.5 5.5 0 0 0 8.5 17h9Z" fill="currentColor" fill-opacity="0.1"/><path d="m13 10-4 6h6l-4 6"/></svg>`;
    markerColor = 'from-red-500 to-purple-600 shadow-[0_4px_14px_rgba(239,68,68,0.45)]';
  }

  const borderClass = isEnd ? 'border-red-500 ring-2 ring-red-300 dark:ring-red-900/50' : 'border-white dark:border-slate-800';

  return L.divIcon({
    className: 'custom-osm-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <!-- Pulse ring for end destination or active storms -->
        ${isEnd || condition === 'badai' ? `<span class="absolute top-0 w-9 h-9 rounded-full bg-current ${condition === 'badai' ? 'text-red-500' : 'text-red-650'} animate-ping opacity-30"></span>` : ''}
        
        <!-- Badge -->
        <div class="flex items-center justify-center w-9 h-9 rounded-full border-2 ${borderClass} bg-gradient-to-br ${markerColor} text-white transition-all duration-300 transform hover:scale-115 relative z-20">
          <span class="flex items-center justify-center">${iconHtml}</span>
        </div>
        
        <!-- Arrow Tail (rotates/shapes pointer) -->
        <div class="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-r border-b border-slate-200/80 dark:border-slate-800/40 transform rotate-45 -mt-1.5 z-10 shadow-[2px_2px_4px_rgba(0,0,0,0.04)]"></div>

        <!-- Tooltip Label (Modern capsule pill) -->
        <div class="absolute top-[38px] px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/45 text-slate-800 dark:text-slate-250 text-[9px] font-black tracking-tight whitespace-nowrap shadow-md z-30 transition-transform">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 56],
    iconAnchor: [18, 38]
  });
};

// Update Leaflet tile layers based on dark/light mode
const updateMapTheme = () => {
  if (!map) return;

  const isDarkMode = document.documentElement.classList.contains('dark');
  const lightUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const darkUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  const selectedUrl = isDarkMode ? darkUrl : lightUrl;

  if (tileLayer) {
    map.removeLayer(tileLayer);
  }

  tileLayer = L.tileLayer(selectedUrl, {
    maxZoom: 18,
    minZoom: 5
  }).addTo(map);
};

// Initialize Leaflet Map
const initMap = () => {
  if (map) {
    moveMapElement();
    updateMapTheme();
    return;
  }

  // Ensure the map element is in the correct slot first!
  moveMapElement();

  if (!mapEl.value) return;

  // Center around Java Island
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([-7.0, 110.0], 7);

  // Set the theme tiles dynamically
  updateMapTheme();

  // Only show zoom control on desktop (not mobile)
  if (window.matchMedia('(min-width: 768px)').matches) {
    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }
  
  calculateRoute();

  // Initialize theme MutationObserver to watch html class changes
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      updateMapTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
};

// Get predefined intermediate checkpoints based on route to avoid geographic naming anomalies
const getRouteCheckpoints = (startId: string, endId: string): string[] => {
  const routeKey = [startId, endId].sort().join('-');
  const checkpointNames = routesCheckpoints[routeKey];
  
  if (checkpointNames) {
    const isReversed = startId > endId;
    return isReversed ? [...checkpointNames].reverse() : [...checkpointNames];
  }

  // Fallback for general highways
  return ['Rest Area KM 86', 'Rest Area KM 207', 'Rest Area KM 379'];
};

// Clear map drawings helper
const clearMapDrawings = () => {
  if (routePolyline) {
    map?.removeLayer(routePolyline);
    routePolyline = null;
  }
  alternativePolylines.forEach(poly => map?.removeLayer(poly));
  alternativePolylines = [];
  mapMarkers.forEach(marker => map?.removeLayer(marker));
  mapMarkers = [];
};

// Render the active selected route and update reactive states for sidebar binding
const renderActiveRoute = () => {
  if (!map) return;

  clearMapDrawings();

  const selectedRoute = alternativeRoutes.value.find(r => r.id === selectedRouteId.value);
  if (!selectedRoute) return;

  routeDistance.value = selectedRoute.distance;
  routeDuration.value = selectedRoute.duration;
  routeCheckpoints.value = selectedRoute.checkpoints;

  // 1. Draw inactive alternatives in grey
  alternativeRoutes.value.forEach(routeOpt => {
    if (routeOpt.id === selectedRouteId.value) return;

    const poly = L.polyline(routeOpt.coords, {
      color: '#94a3b8',
      weight: 4.5,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map!);

    // Click to select route
    poly.on('click', () => {
      selectedRouteId.value = routeOpt.id;
    });

    alternativePolylines.push(poly);
  });

  // 2. Draw active route
  let routeColor = '#3b82f6'; // Terdekat (blue)
  if (selectedRoute.id === 'safest') routeColor = '#10b981'; // Cuaca Aman (emerald green)
  else if (selectedRoute.id === 'least_rain') routeColor = '#f59e0b'; // Minim Hujan (amber orange)

  routePolyline = L.polyline(selectedRoute.coords, {
    color: routeColor,
    weight: 6,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // 3. Add markers
  selectedRoute.checkpoints.forEach((step, index) => {
    const isEnd = index === selectedRoute.checkpoints.length - 1;
    const marker = L.marker([step.lat, step.lng], {
      icon: createCustomMarker(step.condition, step.name, isEnd)
    }).addTo(map!);

    marker.bindPopup(`
      <div class="text-left font-sans text-xs p-1">
        <strong class="text-slate-800 dark:text-white block text-[11px] font-black">${step.name}</strong>
        <span class="text-slate-500 dark:text-slate-400 block mt-0.5">${step.weather} — ${step.temp}°C</span>
        <p class="text-slate-600 dark:text-slate-350 text-[10px] mt-1 italic leading-normal border-t pt-1 border-slate-100">${step.tips}</p>
      </div>
    `);

    mapMarkers.push(marker);
  });

  // 4. Fit bounds
  map.fitBounds(routePolyline.getBounds(), {
    paddingTopLeft: isMobile.value ? [40, 40] : [480, 40],
    paddingBottomRight: [40, 40],
    animate: true,
    duration: 1.2
  });
};

// Calculate coordinates along the route and simulate driving conditions
const calculateRoute = async () => {
  if (!map) return;

  const taskId = ++currentRouteTaskId;
  isRouting.value = true;

  // Clear existing layers immediately
  clearMapDrawings();
  routeDistance.value = 0;
  routeDuration.value = '';
  routeCheckpoints.value = [];
  alternativeRoutes.value = [];

  if (!startCityId.value || !endCityId.value) {
    isRouting.value = false;
    return;
  }

  const startCity = locationsList.find(c => c.id === startCityId.value) || locationsList[0];
  const endCity = locationsList.find(c => c.id === endCityId.value) || locationsList[5];

  // Resolve coordinate sequence
  const routeKey = [startCityId.value, endCityId.value].sort().join('-');
  let primaryCoords: [number, number][] = [];
  let roadDist = 0;
  let durationText = '';
  let primaryDurationSeconds = 0;

  try {
    // Try to fetch actual road routing from OSRM API (OpenStreetMap Routing Engine)
    const url = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      primaryCoords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      roadDist = Math.round(route.distance / 1000);
      
      primaryDurationSeconds = route.duration;
      const hours = Math.floor(primaryDurationSeconds / 3600);
      const minutes = Math.round((primaryDurationSeconds % 3600) / 60);
      durationText = hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
    } else {
      throw new Error('No route found from OSRM');
    }
  } catch (error) {
    console.warn('OSRM routing failed, falling back to mock routing database:', error);
    
    // Fallback 1: Predefined mock coordinates database
    if (routesCoordinates[routeKey]) {
      const rawCoords = routesCoordinates[routeKey];
      const firstPoint = rawCoords[0];
      const distToStart = Math.pow(firstPoint[0] - startCity.lat, 2) + Math.pow(firstPoint[1] - startCity.lng, 2);
      const distToEnd = Math.pow(firstPoint[0] - endCity.lat, 2) + Math.pow(firstPoint[1] - endCity.lng, 2);
      primaryCoords = distToStart > distToEnd ? [...rawCoords].reverse() : [...rawCoords];
    } else {
      // Fallback 2: Dynamic curved interpolation
      const stepsCount = 20;
      for (let i = 0; i <= stepsCount; i++) {
        const ratio = i / stepsCount;
        let lat = startCity.lat + (endCity.lat - startCity.lat) * ratio;
        let lng = startCity.lng + (endCity.lng - startCity.lng) * ratio;
        if (i > 0 && i < stepsCount) {
          const perpLat = -(endCity.lng - startCity.lng);
          const perpLng = endCity.lat - startCity.lat;
          const length = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
          const offsetFactor = Math.sin(ratio * Math.PI) * 0.12;
          lat += (perpLat / length) * offsetFactor;
          lng += (perpLng / length) * offsetFactor;
        }
        primaryCoords.push([lat, lng]);
      }
    }

    // Calculate simulated road distance based on resolved path length
    let totalDist = 0;
    for (let i = 0; i < primaryCoords.length - 1; i++) {
      totalDist += map.distance(primaryCoords[i], primaryCoords[i + 1]);
    }
    roadDist = Math.round(totalDist / 1000);
    
    const totalHours = roadDist / 60;
    primaryDurationSeconds = totalHours * 3600;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    durationText = hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  }

  if (taskId !== currentRouteTaskId) return;

  // Generate alternative geometries (offset deviations)
  const safestCoords = primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.04; // curved offset
    return [coord[0] + offset, coord[1] - offset] as [number, number];
  });

  const leastRainCoords = primaryCoords.map((coord, idx) => {
    if (idx === 0 || idx === primaryCoords.length - 1) return coord;
    const ratio = idx / primaryCoords.length;
    const offset = Math.sin(ratio * Math.PI) * 0.025; // alternate curve offset
    return [coord[0] - offset, coord[1] + offset] as [number, number];
  });

  // Calculate checkpoints for each route option
  const intermediateNames = getRouteCheckpoints(startCityId.value, endCityId.value);
  const numSteps = intermediateNames.length + 1;

  const generateCheckpointsForOption = (coords: [number, number][], weatherMode: 'standard' | 'safe' | 'dry', totalSecs: number) => {
    const list: AlternativeRoute['checkpoints'] = [];
    const startTime = new Date();

    for (let i = 0; i <= numSteps; i++) {
      const ratio = i / numSteps;
      const coordIdx = Math.round(ratio * (coords.length - 1));
      const coord = coords[coordIdx];
      const lat = coord[0];
      const lng = coord[1];

      // Calculate ETA clock time and cumulative travel time
      const segmentSecs = Math.round((totalSecs * i) / numSteps);
      const segmentTime = new Date(startTime.getTime() + segmentSecs * 1000);
      const hh = String(segmentTime.getHours()).padStart(2, '0');
      const mm = String(segmentTime.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm} WIB`;

      const elapsedHours = Math.floor(segmentSecs / 3600);
      const elapsedMins = Math.round((segmentSecs % 3600) / 60);
      const elapsedStr = elapsedHours > 0 ? `+${elapsedHours}j ${elapsedMins}m` : `+${elapsedMins}m`;
      
      const etaText = i === 0 ? `Berangkat: ${timeStr}` : `Tiba: ${timeStr} (${elapsedStr})`;

      if (i === 0) {
        list.push({
          name: startCity.name, lat, lng,
          temp: startCity.temp, weather: startCity.weather, condition: startCity.condition,
          tips: `Titik Keberangkatan: ${startCity.tips}`,
          eta: etaText
        });
      } else if (i === numSteps) {
        list.push({
          name: endCity.name, lat, lng,
          temp: endCity.temp, weather: endCity.weather, condition: endCity.condition,
          tips: `Titik Tujuan: ${endCity.tips}`,
          eta: etaText
        });
      } else {
        const checkpointName = intermediateNames[i - 1];
        const nameHash = checkpointName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let dynamicCondition: LocationData['condition'] = 'cerah';

        if (weatherMode === 'dry') {
          // Strictly sunny or cloudy (0 rain/storms)
          dynamicCondition = nameHash % 2 === 0 ? 'cerah' : 'berawan';
        } else if (weatherMode === 'safe') {
          // Milder weather (cerah, berawan, max hujan ringan, NO STORMS/badai)
          const available: Array<LocationData['condition']> = ['cerah', 'berawan', 'hujan'];
          dynamicCondition = available[nameHash % 3];
        } else {
          // Standard weather simulation
          const conditions: Array<LocationData['condition']> = ['cerah', 'berawan', 'hujan', 'badai'];
          const startIdx = conditions.indexOf(startCity.condition);
          const endIdx = conditions.indexOf(endCity.condition);
          const interpolatedIdx = Math.round(startIdx + (endIdx - startIdx) * ratio);
          const conditionIdx = Math.max(0, Math.min(3, Math.round(interpolatedIdx + (nameHash % 2 - 0.5))));
          dynamicCondition = conditions[conditionIdx];
        }

        const weatherText = dynamicCondition === 'cerah' ? 'Cerah Berawan' : dynamicCondition === 'berawan' ? 'Berawan Tebal' : dynamicCondition === 'hujan' ? 'Hujan Sedang' : 'Hujan Petir';
        const tempDiff = endCity.temp - startCity.temp;
        const interpolatedTemp = Math.round(startCity.temp + tempDiff * ratio);
        const temperature = interpolatedTemp + (nameHash % 3 - 1);
        const tipsText = dynamicCondition === 'cerah' ? 'Kondisi jalan kondusif.' : dynamicCondition === 'berawan' ? 'Mendung, pandangan stabil.' : dynamicCondition === 'hujan' ? 'Jalan basah. Reduksi kecepatan berkendara.' : 'Angin kencang & jalan licin. Hati-hati hydroplaning!';

        list.push({
          name: checkpointName, lat, lng, temp: temperature, weather: weatherText, condition: dynamicCondition, tips: tipsText,
          eta: etaText
        });
      }
    }
    return list;
  };

  const getSimulatedDuration = (dist: number) => {
    const totalHours = dist / 60;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  };

  alternativeRoutes.value = [
    {
      id: 'fastest',
      label: 'Terdekat',
      distance: roadDist,
      duration: durationText || getSimulatedDuration(roadDist),
      coords: primaryCoords,
      checkpoints: generateCheckpointsForOption(primaryCoords, 'standard', primaryDurationSeconds)
    },
    {
      id: 'safest',
      label: 'Cuaca Aman',
      distance: Math.round(roadDist * 1.05),
      duration: getSimulatedDuration(Math.round(roadDist * 1.05)),
      coords: safestCoords,
      checkpoints: generateCheckpointsForOption(safestCoords, 'safe', primaryDurationSeconds * 1.05)
    },
    {
      id: 'least_rain',
      label: 'Minim Hujan',
      distance: Math.round(roadDist * 1.08),
      duration: getSimulatedDuration(Math.round(roadDist * 1.08)),
      coords: leastRainCoords,
      checkpoints: generateCheckpointsForOption(leastRainCoords, 'dry', primaryDurationSeconds * 1.08)
    }
  ];

  selectedRouteId.value = 'fastest';
  renderActiveRoute();
  isRouting.value = false;
};

// Map markers and routing renderer based on step
const renderMarkersForCurrentStep = () => {
  if (!map) return;
  clearMapDrawings();

  if (currentStep.value === 'overview') {
    const marker = L.marker([startLocation.value.lat, startLocation.value.lng], {
      icon: createCustomMarker(startLocation.value.condition, startLocation.value.name, false)
    }).addTo(map);
    map.setView([startLocation.value.lat, startLocation.value.lng], 13);
    // Pan down so marker is visible above the card (card covers ~56vh)
    map.panBy([0, 160], { animate: false });
    mapMarkers.push(marker);
  } else if (currentStep.value === 'selected' && destinationLocation.value) {
    const marker = L.marker([destinationLocation.value.lat, destinationLocation.value.lng], {
      icon: createCustomMarker(destinationLocation.value.condition, destinationLocation.value.name, true)
    }).addTo(map);
    map.setView([destinationLocation.value.lat, destinationLocation.value.lng], 11);
    mapMarkers.push(marker);
  } else if (currentStep.value === 'directions' && destinationLocation.value) {
    calculateRoute();
  }
};

watch(currentStep, () => {
  renderMarkersForCurrentStep();
});

const startSearch = () => {
  currentStep.value = 'search';
  searchQuery.value = '';
};

const selectLocation = (loc: LocationData) => {
  destinationLocation.value = loc;
  endCityId.value = loc.id;
  endQuery.value = loc.name;
  currentStep.value = 'selected';
};

// Expanded state for collapsible checkpoint cards (Set of indices)
const expandedCheckpoints = ref<Set<number>>(new Set([0]));

const toggleCheckpoint = (idx: number) => {
  const s = new Set(expandedCheckpoints.value);
  if (s.has(idx)) s.delete(idx); else s.add(idx);
  expandedCheckpoints.value = s;
};

// Intermediate checkpoint list based on selected route
const directionsCheckpoints = computed(() => {
  if (!destinationLocation.value) return [];
  const key = `${startCityId.value}-${endCityId.value}`;
  // Static checkpoint definition for bangunjiwo→bentarsari route (from image)
  const checkpointDefs: Array<{
    id: string; name: string; region: string;
    eta: string; weather: string; condition: 'cerah'|'berawan'|'hujan'|'badai';
    icon: string; tempHigh: number; tempLow: number;
    alerts: string[];
    grid: { times: string[]; nowIdx: number; suhu: number[]; angin: number[]; hujan: number[]; dirs: string[] };
    rainBars: number[];
  }> = [
    {
      id: 'destination',
      name: destinationLocation.value.name,
      region: destinationLocation.value.region,
      eta: '18.20', weather: 'Badai Petir', condition: 'badai', icon: '⛈️',
      tempHigh: 32, tempLow: 28,
      alerts: ['Badai Petir diprakirakan akan terjadi pada saat Anda tiba.'],
      grid: { times: ['18:00','18:20','19:00','20:00'], nowIdx: 1, suhu: [32,32,29,27], angin: [9,9,5,6], hujan: [0.01,0.74,0.77,0.76], dirs: ['↙','↙','↙','↘'] },
      rainBars: [5,5,5,5,55,70,80,85,80,75,70,65,60,55,50,45,40,35,30,25]
    },
    {
      id: 'purworejo',
      name: 'Purworejo', region: 'Kabupaten Purworejo',
      eta: '14.19', weather: 'Cerah', condition: 'cerah', icon: '🌤️',
      tempHigh: 36, tempLow: 30,
      alerts: ['Sangat Tinggi tidak disarankan untuk aktivitas luar ruangan.', 'Jarak Pandang 13.8km', 'Tidak ada curah hujan setidaknya 2 jam'],
      grid: { times: ['14:00','14:19','15:00','16:00'], nowIdx: 1, suhu: [32,32,29,27], angin: [9,9,5,6], hujan: [0.01,0.74,0.77,0.76], dirs: ['↙','↙','↙','↙'] },
      rainBars: [5,5,5,5,55,70,80,85,80,75,70,65,60,55,50,45,40,35,30,25]
    },
    {
      id: 'kebumen',
      name: 'Kebumen', region: 'Kabupaten Kebumen',
      eta: '15.23', weather: 'Awan Tebal', condition: 'berawan', icon: '🌥️',
      tempHigh: 36, tempLow: 30,
      alerts: ['Sangat Tinggi tidak disarankan untuk aktivitas luar ruangan.', 'Jarak Pandang 13.8km', 'Tidak ada curah hujan setidaknya 2 jam'],
      grid: { times: ['15:00','15:23','16:00','17:00'], nowIdx: 1, suhu: [31,31,28,26], angin: [7,8,6,5], hujan: [0,0,0.12,0.30], dirs: ['↙','↙','↙','↙'] },
      rainBars: [5,5,5,5,5,5,5,10,15,20,25,30,35,40,40,35,30,25,20,15]
    },
    {
      id: 'banyumas',
      name: 'Banyumas', region: 'Kabupaten Banyumas',
      eta: '17.10', weather: 'Awan Tebal', condition: 'berawan', icon: '🌥️',
      tempHigh: 36, tempLow: 30,
      alerts: ['Sangat Tinggi tidak disarankan untuk aktivitas luar ruangan.', 'Jarak Pandang 13.8km', 'Tidak ada curah hujan setidaknya 2 jam'],
      grid: { times: ['17:00','17:10','18:00','19:00'], nowIdx: 1, suhu: [30,30,27,25], angin: [6,6,5,4], hujan: [0,0,0.05,0.20], dirs: ['↙','↙','↙','↙'] },
      rainBars: [5,5,5,5,5,5,5,5,10,15,20,25,30,30,25,20,15,10,5,5]
    }
  ];
  // For non-predefined routes, generate generic list from available data
  if (key !== 'bangunjiwo-bentarsari') {
    return checkpointDefs.map((c, i) => ({ ...c, id: c.id + i }));
  }
  return checkpointDefs;
});

const getDirections = () => {
  currentStep.value = 'directions';
  expandedCheckpoints.value = new Set([0]);
};

const goBack = () => {
  if (currentStep.value === 'directions') {
    currentStep.value = 'selected';
  } else if (currentStep.value === 'selected') {
    currentStep.value = 'overview';
    destinationLocation.value = null;
  } else if (currentStep.value === 'search') {
    currentStep.value = 'overview';
  } else {
    emit('close');
  }
};

// Map center on drawer open or selectCity change
watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');
      
      currentStep.value = 'overview';
      sheetExpanded.value = true;
      startLocation.value = locationsList.find(c => c.id === 'bangunjiwo') || locationsList[0];
      startCityId.value = startLocation.value.id;
      startQuery.value = startLocation.value.name;
      destinationLocation.value = null;
      searchQuery.value = '';

      // Allow DOM repaint to load maps container correctly
      nextTick(() => {
        setTimeout(() => {
          initMap();
          if (map) {
            map.invalidateSize();
            renderMarkersForCurrentStep();
          }
        }, 350);
      });
    } else {
      document.body.classList.remove('drawer-open');
    }
  },
  { immediate: true }
);

watch(selectedRouteId, () => {
  renderActiveRoute();
});

// Cleanup maps instances safely
onMounted(() => {
  window.addEventListener('resize', handleResize);
  checkMobile();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.body.classList.remove('drawer-open');
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="map-fade" appear>
      <div v-if="isOpen" class="fixed inset-0 z-[9999] w-screen h-screen bg-slate-900 overflow-hidden text-slate-100 font-sans flex flex-col justify-between pb-3">
        
        <!-- The Background Map -->
        <div ref="desktopSlot" class="absolute inset-0 w-full h-full z-0 bg-slate-800">
          <div ref="mapEl" id="land-map" class="w-full h-full"></div>
        </div>

        <!-- Floating Close X Button on Map -->
        <button 
          v-if="currentStep !== 'search'"
          type="button"
          @click="emit('close')"
          class="absolute right-4 top-4 z-50 w-10 h-10 rounded-full bg-slate-900/95 text-white flex items-center justify-center border border-slate-700/40 backdrop-blur-md shadow-lg hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
          title="Tutup Rute"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- ─────────────────────────────────────────────────────────────────────────
             2. BOTTOM SHEET: Drawer content for all steps
             ───────────────────────────────────────────────────────────────────────── -->
        <Transition name="drawer-slide" appear>
          <div 
            v-if="isOpen"
            class="relative z-45 w-[calc(100%-24px)] mx-3 mb-3 md:w-[420px] md:ml-6 md:my-6 bg-white/95 dark:bg-[#182232]/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/40 shadow-2xl rounded-3xl flex flex-col overflow-hidden text-left mt-auto select-none transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-[calc(100vh-48px)] md:max-h-[calc(100vh-48px)]"
            :class="sheetExpanded ? 'max-h-[88vh]' : 'max-h-[56vh]'"
          >
            <!-- Drag Handle / Bar at the top of the sheet -->
            <div 
              class="py-3 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
              @pointerdown.prevent="onSheetDragStart"
              @click="toggleSheetExpanded"
              title="Seret untuk minimize/expand"
            >
              <div 
                class="h-1 rounded-full transition-all duration-300"
                :class="sheetExpanded ? 'w-11 bg-slate-300/60 dark:bg-slate-600/70' : 'w-16 bg-slate-300 dark:bg-slate-500/90'"
              ></div>
            </div>

            <!-- Search Bar inside Bottom Sheet -->
            <div v-if="currentStep !== 'directions'" class="px-4 pb-3 flex items-center gap-2 shrink-0">
              <!-- Back button circle -->
              <button 
                type="button"
                @click="goBack"
                class="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              
              <!-- Search input container -->
              <div class="flex-grow relative flex items-center bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 rounded-full px-4 py-2.5 shadow-inner">
                <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
                <input 
                  type="text" 
                  placeholder="Cari di peta" 
                  v-model="searchQuery"
                  @focus="startSearch"
                  class="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400"
                />
                <Mic class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 cursor-pointer hover:text-blue-500 transition-colors" />
                <button 
                  v-if="currentStep === 'search' || currentStep === 'selected'"
                  @click="goBack" 
                  class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs shrink-0 cursor-pointer"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
              
              <!-- Layer/Map Button (only shown in overview step) -->
              <button 
                v-if="currentStep === 'overview'"
                type="button"
                class="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700/30 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <MapIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable Content Area -->
            <div class="flex-grow overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar">

              <!-- =================================================================
                   STEP 1: DEFAULT OVERVIEW (Bangunjiwo details)
                   ================================================================= -->
              <div v-if="currentStep === 'overview'" class="space-y-4">
                <!-- Location Header -->
                <div class="flex items-center justify-between">
                  <div class="text-left">
                    <h3 class="text-[17px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">{{ startLocation.name }}</h3>
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin class="w-2.5 h-2.5" />
                      {{ startLocation.region }}
                    </p>
                  </div>
                  <!-- Live badge -->
                  <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] font-black uppercase tracking-widest text-emerald-500">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>

                <!-- Custom Alerts Box -->
                <div class="space-y-2">
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-blue-500 bg-blue-50 dark:bg-slate-950/20 text-blue-700 dark:text-slate-300">
                    <CloudRain class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak ada curah hujan setidaknya selama 1 jam.</span>
                  </div>
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-amber-500 bg-amber-50 dark:bg-slate-950/20 text-amber-700 dark:text-slate-300">
                    <Sun class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak direkomendasikan untuk aktivitas luar ruangan</span>
                  </div>
                </div>

                <!-- Section Heading -->
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
                    <Clock class="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    <span class="text-[8.5px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Cuaca Hari Ini</span>
                  </div>
                  <div class="flex-grow h-px bg-gradient-to-r from-indigo-200/60 dark:from-indigo-800/40 to-transparent"></div>
                </div>

                <!-- Weather Timeline Grid -->
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  <div class="grid grid-cols-5 items-center gap-y-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
                    <!-- Jam Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Jam</div>
                    <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400" /></div>
                    <div class="text-center text-slate-600 dark:text-slate-300">13:00</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center">
                      <span class="text-[7.5px] uppercase tracking-wide opacity-80 mb-0.5">Sekarang</span>
                      <span>14:00</span>
                    </div>
                    <div class="text-center text-slate-600 dark:text-slate-300">15:00</div>

                    <!-- Suhu Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Suhu</div>
                    <div class="text-center text-slate-400">°C</div>
                    <div class="text-center text-slate-800 dark:text-slate-100 font-black">32°</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 py-1 rounded-lg border border-blue-500/20 relative">
                      32°
                      <div class="absolute top-[28px] left-1/2 -translate-x-1/2 h-[120px] border-l border-dashed border-blue-500/40 pointer-events-none z-10"></div>
                    </div>
                    <div class="text-center text-slate-800 dark:text-slate-100 font-black">27°</div>

                    <!-- Angin Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Angin</div>
                    <div class="text-center text-slate-400">km/j</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">9</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-lg">9</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">6</div>

                    <!-- Arah Angin Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Arah</div>
                    <div class="flex justify-center"><Compass class="w-3.5 h-3.5 text-slate-400" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-slate-400 rotate-[225deg]" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-blue-500 dark:text-blue-400 rotate-[225deg]" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-slate-400 rotate-[135deg]" /></div>

                    <!-- Hujan Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Hujan</div>
                    <div class="text-center text-slate-400">mm/j</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">0.01</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-lg">0.04</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">0.76</div>
                  </div>

                  <!-- Rain Trend Bar Chart -->
                  <div class="pt-3 flex flex-col gap-2">
                    <div class="h-10 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-800/40">
                      <div class="flex-1 rounded-t bg-blue-500/15" style="height:5%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/20" style="height:10%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/25" style="height:15%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/40" style="height:25%"></div>
                      <div class="flex-1 rounded-t bg-blue-400 animate-pulse" style="height:40%"></div>
                      <div class="flex-1 rounded-t bg-blue-400" style="height:55%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:65%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:80%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:75%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:60%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:50%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/80" style="height:45%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/70" style="height:40%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/60" style="height:35%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/50" style="height:30%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/40" style="height:25%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/30" style="height:20%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/20" style="height:15%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/10" style="height:10%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/5" style="height:5%"></div>
                    </div>
                    <div class="flex justify-between px-1 text-slate-400">
                      <Sun class="w-3.5 h-3.5 text-amber-500" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-400" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- =================================================================
                   STEP 2: SEARCH INPUT ACTIVE / SUGGESTIONS
                   ================================================================= -->
              <div v-else-if="currentStep === 'search'" class="space-y-4 pt-1">
                <div class="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-1">Hasil Pencarian</div>
                
                <div class="flex flex-col rounded-2xl bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/40 divide-y divide-slate-200 dark:divide-slate-800/60 overflow-hidden">
                  <button 
                    v-for="loc in searchSuggestions" 
                    :key="'sug-' + loc.id"
                    @click="selectLocation(loc)"
                    class="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span class="text-xs font-bold text-slate-800 dark:text-white">{{ loc.name }}</span>
                    <span class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">{{ loc.type }} — {{ loc.region }}</span>
                  </button>
                  
                  <!-- Fallback custom Bentarsari search card dynamically added to support mockup search query -->
                  <button 
                    v-if="searchQuery.toLowerCase().includes('bentar')"
                    @click="selectLocation(locationsList.find(c => c.id === 'bentarsari') || locationsList[1])"
                    class="w-full text-left px-4 py-3 hover:bg-slate-800/40 transition-all flex flex-col gap-0.5 cursor-pointer bg-blue-500/5"
                  >
                    <span class="text-xs font-bold text-white flex items-center gap-1">
                      🏙️ Bentarsari, Salem
                    </span>
                    <span class="text-[9px] text-slate-450 font-semibold">Desa — Kabupaten Brebes Jawa Tengah</span>
                  </button>
                </div>
              </div>

              <!-- =================================================================
                   STEP 3: LOCATION SELECTED (Ready for Directions)
                   ================================================================= -->
              <div v-else-if="currentStep === 'selected' && destinationLocation" class="space-y-4">
                <!-- Selected Location Header -->
                <div class="flex items-center justify-between">
                  <div class="text-left min-w-0">
                    <h3 class="text-[17px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">{{ destinationLocation.name }}</h3>
                    <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin class="w-2.5 h-2.5 shrink-0" />
                      179 km • {{ destinationLocation.region }}
                    </p>
                  </div>
                  <span class="p-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/30 rounded-xl text-lg shrink-0">🏢</span>
                </div>

                <!-- Custom Alerts Box -->
                <div class="space-y-2">
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-blue-500 bg-blue-50 dark:bg-slate-950/20 text-blue-700 dark:text-slate-300">
                    <CloudRain class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak ada curah hujan setidaknya selama 1 jam.</span>
                  </div>
                  <div class="flex gap-2.5 text-[10.5px] font-semibold leading-relaxed p-3 rounded-xl border-l-2 border-l-amber-500 bg-amber-50 dark:bg-slate-950/20 text-amber-700 dark:text-slate-300">
                    <Sun class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span class="flex-grow text-left">Tidak direkomendasikan untuk aktivitas luar ruangan</span>
                  </div>
                </div>

                <!-- Weather Timeline Grid -->
                <div class="bg-slate-50 dark:bg-[#1e293b]/75 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  <div class="grid grid-cols-5 items-center gap-y-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
                    <!-- Jam Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Jam</div>
                    <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400" /></div>
                    <div class="text-center text-slate-600 dark:text-slate-300">13:00</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center">
                      <span class="text-[7.5px] uppercase tracking-wide opacity-80 mb-0.5">Sekarang</span>
                      <span>14:00</span>
                    </div>
                    <div class="text-center text-slate-600 dark:text-slate-300">15:00</div>

                    <!-- Suhu Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Suhu</div>
                    <div class="text-center text-slate-400">°C</div>
                    <div class="text-center text-slate-800 dark:text-slate-100 font-black">32°</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 py-1 rounded-lg border border-blue-500/20 relative">
                      32°
                      <div class="absolute top-[28px] left-1/2 -translate-x-1/2 h-[120px] border-l border-dashed border-blue-500/40 pointer-events-none z-10"></div>
                    </div>
                    <div class="text-center text-slate-800 dark:text-slate-100 font-black">27°</div>

                    <!-- Angin Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Angin</div>
                    <div class="text-center text-slate-400">km/j</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">9</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-lg">9</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">6</div>

                    <!-- Arah Angin Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Arah</div>
                    <div class="flex justify-center"><Compass class="w-3.5 h-3.5 text-slate-400" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-slate-400 rotate-[225deg]" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-blue-500 dark:text-blue-400 rotate-[225deg]" /></div>
                    <div class="flex justify-center"><Navigation class="w-3 h-3 text-slate-400 rotate-[135deg]" /></div>

                    <!-- Hujan Row -->
                    <div class="text-slate-500 dark:text-slate-400 font-bold">Hujan</div>
                    <div class="text-center text-slate-400">mm/j</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">0.01</div>
                    <div class="text-center text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-lg">0.04</div>
                    <div class="text-center text-slate-700 dark:text-slate-200">0.76</div>
                  </div>

                  <!-- Rain Bar Chart -->
                  <div class="pt-3 flex flex-col gap-2">
                    <div class="h-10 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-800/40">
                      <div class="flex-1 rounded-t bg-blue-500/15" style="height:5%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/20" style="height:10%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/25" style="height:15%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/40" style="height:25%"></div>
                      <div class="flex-1 rounded-t bg-blue-400 animate-pulse" style="height:40%"></div>
                      <div class="flex-1 rounded-t bg-blue-400" style="height:55%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:65%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:80%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:75%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:60%"></div>
                      <div class="flex-1 rounded-t bg-blue-500" style="height:50%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/80" style="height:45%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/70" style="height:40%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/60" style="height:35%"></div>
                      <div class="flex-1 rounded-t bg-blue-500/50" style="height:30%"></div>
                    </div>
                    <div class="flex justify-between px-1">
                      <Sun class="w-3.5 h-3.5 text-amber-500" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-400" />
                      <CloudRain class="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <!-- Action Button: Petunjuk Arah -->
                <button 
                  type="button" 
                  @click="getDirections"
                  class="w-full bg-[#1b5ebd] hover:bg-blue-600 active:scale-[0.98] py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
                >
                  Petunjuk Arah
                </button>
              </div>

              <!-- =================================================================
                   STEP 4: DIRECTIONS / ROUTE PLAN — Full-screen checkpoint list
                   ================================================================= -->
              <div v-else-if="currentStep === 'directions' && destinationLocation" class="space-y-3.5">
                <!-- Directions Mode Header -->
                <div class="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 class="text-sm font-black text-slate-900 dark:text-white leading-none">Petunjuk Arah</h3>
                  <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"><X class="w-4 h-4" /></button>
                </div>

                <!-- Travel Mode Selector Tabs -->
                <div class="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl">
                  <button 
                    v-for="mode in travelModes" 
                    :key="mode.id"
                    @click="activeTravelMode = mode.id"
                    class="flex-1 py-2 text-center rounded-xl transition-all cursor-pointer flex justify-center items-center"
                    :class="activeTravelMode === mode.id ? 'bg-[#2f3d53] dark:bg-[#2f3d53] text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'"
                  >
                    <component :is="mode.icon" class="w-4 h-4 shrink-0" />
                  </button>
                </div>

                <!-- ── CHECKPOINT CARDS LIST ── -->
                <div class="space-y-3.5">
                  
                  <!-- 1. DESTINATION OVERVIEW CARD -->
                  <div 
                    v-if="directionsCheckpoints.length > 0"
                    class="bg-slate-100 dark:bg-[#1c2d3f]/80 border border-slate-200/60 dark:border-slate-700/30 rounded-2xl p-4 space-y-3.5"
                  >
                    <div class="flex items-start gap-3">
                      <!-- Icon building circle -->
                      <div class="p-2 bg-slate-200 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/30 rounded-xl text-sm leading-none shrink-0">
                        🏢
                      </div>
                      <div class="min-w-0">
                        <h4 class="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {{ directionsCheckpoints[0].name }} • <span class="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">ETA {{ directionsCheckpoints[0].eta }}</span>
                        </h4>
                        <p class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold mt-0.5">
                          248 km • {{ directionsCheckpoints[0].region }}
                        </p>
                      </div>
                    </div>

                    <!-- Warning alert inside destination card -->
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5 text-red-400 text-[10px] font-semibold leading-relaxed">
                      <CloudLightning class="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                      <span>Badai Petir diprakirakan akan terjadi pada saat Anda tiba.</span>
                    </div>

                    <!-- Weather Grid -->
                    <div class="bg-white/80 dark:bg-[#111e2b]/70 border border-slate-200/80 dark:border-slate-800/40 rounded-xl p-3 text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                      <!-- Grid rows -->
                      <div class="grid grid-cols-6 items-center gap-y-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/50">
                        <!-- JAM ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Jam</div>
                        <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                        <div 
                          v-for="(t, ti) in directionsCheckpoints[0].grid.times" 
                          :key="'t-dest-'+ti"
                          class="text-center"
                          :class="ti === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center' : 'font-bold text-slate-700 dark:text-slate-200'"
                        >
                          <span v-if="ti === directionsCheckpoints[0].grid.nowIdx" class="text-[7px] uppercase tracking-wide opacity-80 block mb-0.5">Sekarang</span>
                          {{ t }}
                        </div>

                        <!-- SUHU ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Suhu</div>
                        <div class="text-center text-slate-400">°C</div>
                        <div 
                          v-for="(s, si) in directionsCheckpoints[0].grid.suhu" 
                          :key="'s-dest-'+si"
                          class="text-center font-black relative"
                          :class="si === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 py-0.5' : 'text-slate-800 dark:text-slate-100'"
                        >
                          {{ s }}°
                          <div v-if="si === directionsCheckpoints[0].grid.nowIdx" class="absolute top-[22px] left-1/2 -translate-x-1/2 h-[78px] border-l border-dashed border-blue-500/35 pointer-events-none z-10"></div>
                        </div>

                        <!-- ANGIN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Angin</div>
                        <div class="text-center text-slate-400">km/j</div>
                        <div 
                          v-for="(a, ai2) in directionsCheckpoints[0].grid.angin" 
                          :key="'a-dest-'+ai2"
                          class="text-center"
                          :class="ai2 === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                        >{{ a }}</div>

                        <!-- ARAH ANGIN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Arah</div>
                        <div class="flex justify-center"><Compass class="w-3 h-3 text-slate-400 dark:text-slate-550" /></div>
                        <div 
                          v-for="(d, di) in directionsCheckpoints[0].grid.dirs" 
                          :key="'d-dest-'+di"
                          class="text-center"
                          :class="di === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'"
                        >{{ d }}</div>

                        <!-- HUJAN ROW -->
                        <div class="text-slate-500 dark:text-slate-450 font-bold">Hujan</div>
                        <div class="text-center text-slate-400">mm/j</div>
                        <div 
                          v-for="(h, hi) in directionsCheckpoints[0].grid.hujan" 
                          :key="'h-dest-'+hi"
                          class="text-center"
                          :class="hi === directionsCheckpoints[0].grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                        >{{ h }}</div>
                      </div>

                      <!-- Rain bar chart + weather icons -->
                      <div class="pt-2.5 space-y-1.5">
                        <div class="h-8 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-lg px-1.5 py-1 border border-slate-200/80 dark:border-slate-800/40">
                          <div 
                            v-for="(bar, bi) in directionsCheckpoints[0].rainBars" 
                            :key="bi"
                            class="flex-1 rounded-t transition-all"
                            :style="{ height: bar + '%' }"
                            :class="bar > 40 ? 'bg-blue-500' : bar > 20 ? 'bg-blue-500/60' : 'bg-blue-500/20'"
                          ></div>
                        </div>
                        <!-- Weather icons below chart -->
                        <div class="flex justify-between px-1 text-slate-400">
                          <span class="text-xs">🌤️</span>
                          <span class="text-xs">🌧️</span>
                          <span class="text-xs">⛅</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2. COLLAPSIBLE INTERMEDIATE CHECKPOINTS -->
                  <div 
                    v-for="(cp, idx) in directionsCheckpoints.slice(1)" 
                    :key="cp.id"
                    class="bg-slate-100 dark:bg-[#1c2d3f]/80 border border-slate-200/60 dark:border-slate-700/30 rounded-2xl overflow-hidden text-left"
                  >
                    <!-- Card Header (always visible) -->
                    <div class="p-4 space-y-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-grow">
                          <!-- Name + ETA + Region -->
                          <div class="flex items-baseline gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-slate-900 dark:text-white leading-tight">{{ cp.name }}</span>
                            <span class="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">• ETA {{ cp.eta }} • {{ cp.region }}</span>
                          </div>
                          <!-- Weather summary row -->
                          <div class="flex items-center gap-2 mt-1.5">
                            <span class="text-base leading-none">{{ cp.icon }}</span>
                            <span class="text-[11px] font-extrabold text-slate-800 dark:text-white">{{ cp.weather }}</span>
                            <span class="text-[9px] text-slate-500 dark:text-slate-400 font-semibold ml-1">Tinggi: {{ cp.tempHigh }}°  Rendah: {{ cp.tempLow }}°</span>
                          </div>
                        </div>
                      </div>

                      <!-- Warning Bullets -->
                      <div class="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/40 mt-1">
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <Sun class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Sangat Tinggi tidak disarankan untuk aktivitas luar ruangan.</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <Eye class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Jarak Pandang 13.8km</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-350 leading-normal">
                          <div class="flex items-center gap-2.5">
                            <CloudRain class="w-3.5 h-3.5 text-blue-450 shrink-0" />
                            <span>Tidak ada curah hujan setidaknya 2 jam</span>
                          </div>
                          <!-- Accordion toggle button -->
                          <button 
                            @click="toggleCheckpoint(idx + 1)"
                            class="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 p-1 cursor-pointer transition-transform duration-300"
                            :class="expandedCheckpoints.has(idx + 1) ? 'rotate-180' : 'rotate-0'"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Expanded: Full 4-col weather grid + bar chart -->
                    <Transition name="expand">
                      <div v-if="expandedCheckpoints.has(idx + 1)" class="px-4 pb-4">
                        <div class="bg-white/80 dark:bg-[#111e2b]/70 border border-slate-200/80 dark:border-slate-800/40 rounded-xl p-3 text-[9px] font-semibold text-slate-600 dark:text-slate-350">
                          <!-- Grid rows -->
                          <div class="grid grid-cols-6 items-center gap-y-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/50">
                            <!-- JAM ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Jam</div>
                            <div class="flex justify-center"><Clock class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                            <div 
                              v-for="(t, ti) in cp.grid.times" 
                              :key="'t'+ti"
                              class="text-center"
                              :class="ti === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-extrabold flex flex-col items-center' : 'font-bold text-slate-700 dark:text-slate-200'"
                            >
                              <span v-if="ti === cp.grid.nowIdx" class="text-[7px] uppercase tracking-wide opacity-80 block mb-0.5">Sekarang</span>
                              {{ t }}
                            </div>

                            <!-- SUHU ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Suhu</div>
                            <div class="text-center text-slate-400">°C</div>
                            <div 
                              v-for="(s, si) in cp.grid.suhu" 
                              :key="'s'+si"
                              class="text-center font-black relative"
                              :class="si === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 py-0.5' : 'text-slate-800 dark:text-slate-100'"
                            >
                              {{ s }}°
                              <div v-if="si === cp.grid.nowIdx" class="absolute top-[22px] left-1/2 -translate-x-1/2 h-[78px] border-l border-dashed border-blue-500/35 pointer-events-none z-10"></div>
                            </div>

                            <!-- ANGIN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Angin</div>
                            <div class="text-center text-slate-400">km/jam</div>
                            <div 
                              v-for="(a, ai2) in cp.grid.angin" 
                              :key="'a'+ai2"
                              class="text-center"
                              :class="ai2 === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-bold bg-blue-500/5 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                            >
                              {{ a }}
                            </div>

                            <!-- ARAH ANGIN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Arah Angin</div>
                            <div class="flex justify-center"><Compass class="w-3.5 h-3.5 text-slate-400 dark:text-slate-450" /></div>
                            <div 
                              v-for="(d, di) in cp.grid.dirs" 
                              :key="'d'+di"
                              class="text-center"
                              :class="di === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'"
                            >
                              {{ d }}
                            </div>

                            <!-- HUJAN ROW -->
                            <div class="text-slate-500 dark:text-slate-450 font-bold">Hujan</div>
                            <div class="text-center text-slate-400">mm/jam</div>
                            <div 
                              v-for="(h, hi) in cp.grid.hujan" 
                              :key="'h'+hi"
                              class="text-center"
                              :class="hi === cp.grid.nowIdx ? 'text-blue-500 dark:text-blue-400 font-black bg-blue-500/10 rounded-md' : 'text-slate-700 dark:text-slate-100'"
                            >
                              {{ h }}
                            </div>
                          </div>

                          <!-- Rain bar chart + weather icons -->
                          <div class="pt-2.5 space-y-1.5">
                            <div class="h-8 flex items-end justify-between gap-px bg-slate-100 dark:bg-slate-950/30 rounded-lg px-1.5 py-1 border border-slate-200/80 dark:border-slate-800/40">
                              <div 
                                v-for="(bar, bi) in cp.rainBars" 
                                :key="bi"
                                class="flex-1 rounded-t transition-all"
                                :style="{ height: bar + '%' }"
                                :class="bar > 40 ? 'bg-blue-400' : bar > 20 ? 'bg-blue-500/60' : 'bg-blue-500/20'"
                              ></div>
                            </div>
                            <!-- Weather icons below chart -->
                            <div class="flex justify-between px-1 text-slate-400">
                              <span class="text-xs">{{ cp.condition === 'cerah' ? '🌤️' : '🌧️' }}</span>
                              <span class="text-xs">{{ cp.condition === 'badai' ? '⛈️' : cp.condition === 'hujan' ? '🌧️' : '🌤️' }}</span>
                              <span class="text-xs">{{ cp.condition === 'badai' ? '🌩️' : cp.condition === 'hujan' ? '⛈️' : '⛅' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Leaflet Map Overrides to fit premium UI dashboard */
.leaflet-container {
  font-family: inherit;
  background-color: #f1f5f9 !important;
}
.leaflet-bar {
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  border-radius: 12px !important;
  overflow: hidden;
}
.leaflet-bar a {
  background-color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(8px);
  color: #1e293b !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}
.leaflet-bar a:hover {
  background-color: #f8fafc !important;
}
.leaflet-popup-content-wrapper {
  border-radius: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background-color: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px);
}
.leaflet-popup-tip {
  background-color: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
}
.custom-osm-marker {
  background: none !important;
  border: none !important;
}

/* Animations */
.map-fade-enter-active,
.map-fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.map-fade-enter-from,
.map-fade-leave-to {
  opacity: 0;
}

/* Drawer slide from right transition */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0.95;
}

/* Custom scrollbar hiding */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Expand/collapse transition for checkpoint cards */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  overflow: hidden;
  max-height: 600px;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

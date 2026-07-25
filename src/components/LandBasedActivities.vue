<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  X, 
  MapPin, 
  Navigation, 
  Compass, 
  AlertTriangle, 
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  TrendingUp,
  Clock,
  Map as MapIcon
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

// Form States
const startCityId = ref('');
const endCityId = ref('');
const isRouting = ref(false);

const isMobile = ref(false);
const desktopSlot = ref<HTMLElement | null>(null);
const mobileSlot = ref<HTMLElement | null>(null);
const mapEl = ref<HTMLElement | null>(null);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
};

const moveMapElement = () => {
  if (!mapEl.value) return;
  if (isMobile.value) {
    if (mobileSlot.value) {
      mobileSlot.value.appendChild(mapEl.value);
    }
  } else {
    if (desktopSlot.value) {
      desktopSlot.value.appendChild(mapEl.value);
    }
  }
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 100);
};

const handleResize = () => {
  const prev = isMobile.value;
  checkMobile();
  if (isMobile.value !== prev) {
    nextTick(() => {
      moveMapElement();
    });
  }
};

const startQuery = ref('');
const endQuery = ref('');
const showStartSuggestions = ref(false);
const showEndSuggestions = ref(false);

const startSuggestions = computed(() => {
  const query = startQuery.value.toLowerCase().trim();
  if (!query) return [];
  return locationsList.filter(loc => 
    loc.name.toLowerCase().includes(query) || 
    loc.region.toLowerCase().includes(query) || 
    loc.type.toLowerCase().includes(query)
  ).slice(0, 8);
});

const endSuggestions = computed(() => {
  const query = endQuery.value.toLowerCase().trim();
  if (!query) return [];
  return locationsList.filter(loc => 
    loc.name.toLowerCase().includes(query) || 
    loc.region.toLowerCase().includes(query) || 
    loc.type.toLowerCase().includes(query)
  ).slice(0, 8);
});

const selectStart = (loc: LocationData) => {
  startCityId.value = loc.id;
  startQuery.value = loc.name;
  showStartSuggestions.value = false;
  calculateRoute();
};

const selectEnd = (loc: LocationData) => {
  endCityId.value = loc.id;
  endQuery.value = loc.name;
  showEndSuggestions.value = false;
  calculateRoute();
};

const onStartInput = () => {
  startCityId.value = '';
  showStartSuggestions.value = true;
  calculateRoute();
};

const onEndInput = () => {
  endCityId.value = '';
  showEndSuggestions.value = true;
  calculateRoute();
};

const closeStartSuggestionsDeferred = () => {
  setTimeout(() => {
    showStartSuggestions.value = false;
  }, 200);
};

const closeEndSuggestionsDeferred = () => {
  setTimeout(() => {
    showEndSuggestions.value = false;
  }, 200);
};

// Leaflet Map instance references
let map: L.Map | null = null;
let routePolyline: L.Polyline | null = null;
let alternativePolylines: L.Polyline[] = [];
let mapMarkers: L.Marker[] = [];
let currentRouteTaskId = 0;

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
}>>([]);

// Weather Icons Helper
const getWeatherIcon = (condition: 'cerah' | 'berawan' | 'hujan' | 'badai') => {
  switch (condition) {
    case 'cerah': return Sun;
    case 'berawan': return Cloud;
    case 'hujan': return CloudRain;
    case 'badai': return CloudLightning;
    default: return Sun;
  }
};

const getWeatherIconColor = (condition: 'cerah' | 'berawan' | 'hujan' | 'badai') => {
  switch (condition) {
    case 'cerah': return 'text-orange-500';
    case 'berawan': return 'text-slate-400';
    case 'hujan': return 'text-cyan-500';
    case 'badai': return 'text-red-500';
    default: return 'text-orange-500';
  }
};

// Custom dynamic HTML markers for OpenStreetMap
const createCustomMarker = (condition: 'cerah' | 'berawan' | 'hujan' | 'badai', label: string, isEnd = false) => {
  let iconHtml = `☀️`;
  let markerColor = 'from-orange-500 to-amber-400';
  
  if (condition === 'berawan') {
    iconHtml = `☁️`;
    markerColor = 'from-slate-400 to-slate-350';
  } else if (condition === 'hujan') {
    iconHtml = `🌧️`;
    markerColor = 'from-cyan-500 to-blue-400';
  } else if (condition === 'badai') {
    iconHtml = `⛈️`;
    markerColor = 'from-red-600 to-orange-500 animate-pulse';
  }

  const borderClass = isEnd ? 'border-red-500 ring-2 ring-red-300' : 'border-white';

  return L.divIcon({
    className: 'custom-osm-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <!-- Badge -->
        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 ${borderClass} shadow-lg bg-gradient-to-br ${markerColor} text-white transition-all duration-300 transform hover:scale-110">
          <span class="text-sm">${iconHtml}</span>
        </div>
        <!-- Tooltip Label -->
        <div class="absolute top-9 px-1.5 py-0.5 rounded bg-slate-955/90 text-white text-[8px] font-black tracking-tight whitespace-nowrap shadow-md">
          ${label}
        </div>
        <!-- Arrow Tail -->
        <div class="w-1.5 h-1.5 bg-slate-950 transform rotate-45 -mt-0.5 opacity-90"></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42]
  });
};

// Initialize Leaflet Map
const initMap = () => {
  if (map) {
    moveMapElement();
    return;
  }

  // Ensure the map element is in the correct slot first!
  moveMapElement();

  // Center around Java Island
  map = L.map('land-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([-7.0, 110.0], 7);

  // CartoDB Voyager Style - clean and matches modern dashboard style
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    minZoom: 5
  }).addTo(map);

  // Custom Zoom Control positioning (bottom-right, matching Google Maps look)
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  calculateRoute();
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
    paddingTopLeft: [40, 40],
    paddingBottomRight: isMobile.value ? [40, 40] : [450, 40],
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

  try {
    // Try to fetch actual road routing from OSRM API (OpenStreetMap Routing Engine)
    const url = `https://router.project-osrm.org/route/v1/driving/${startCity.lng},${startCity.lat};${endCity.lng},${endCity.lat}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      primaryCoords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      roadDist = Math.round(route.distance / 1000);
      
      const totalSeconds = route.duration;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.round((totalSeconds % 3600) / 60);
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

  const generateCheckpointsForOption = (coords: [number, number][], weatherMode: 'standard' | 'safe' | 'dry') => {
    const list: AlternativeRoute['checkpoints'] = [];
    for (let i = 0; i <= numSteps; i++) {
      const ratio = i / numSteps;
      const coordIdx = Math.round(ratio * (coords.length - 1));
      const coord = coords[coordIdx];
      const lat = coord[0];
      const lng = coord[1];

      if (i === 0) {
        list.push({
          name: startCity.name, lat, lng,
          temp: startCity.temp, weather: startCity.weather, condition: startCity.condition,
          tips: `Titik Keberangkatan: ${startCity.tips}`
        });
      } else if (i === numSteps) {
        list.push({
          name: endCity.name, lat, lng,
          temp: endCity.temp, weather: endCity.weather, condition: endCity.condition,
          tips: `Titik Tujuan: ${endCity.tips}`
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
          name: checkpointName, lat, lng, temp: temperature, weather: weatherText, condition: dynamicCondition, tips: tipsText
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
      checkpoints: generateCheckpointsForOption(primaryCoords, 'standard')
    },
    {
      id: 'safest',
      label: 'Cuaca Aman',
      distance: Math.round(roadDist * 1.05),
      duration: getSimulatedDuration(Math.round(roadDist * 1.05)),
      coords: safestCoords,
      checkpoints: generateCheckpointsForOption(safestCoords, 'safe')
    },
    {
      id: 'least_rain',
      label: 'Minim Hujan',
      distance: Math.round(roadDist * 1.08),
      duration: getSimulatedDuration(Math.round(roadDist * 1.08)),
      coords: leastRainCoords,
      checkpoints: generateCheckpointsForOption(leastRainCoords, 'dry')
    }
  ];

  selectedRouteId.value = 'fastest';
  renderActiveRoute();
  isRouting.value = false;
};

// Map center on drawer open or selectCity change
watch(
  () => [props.isOpen, props.selectedCity],
  ([isOpenVal]) => {
    if (isOpenVal) {
      document.body.classList.add('drawer-open');
      
      // Reset values to empty by default
      startCityId.value = '';
      endCityId.value = '';
      startQuery.value = '';
      endQuery.value = '';
      
      // Auto-set departure to selected city if matches available database
      const matched = locationsList.find(c => props.selectedCity.toLowerCase().includes(c.name.toLowerCase()));
      if (matched) {
        startCityId.value = matched.id;
        startQuery.value = matched.name;
      }

      // Allow DOM repaint to load maps container correctly
      nextTick(() => {
        setTimeout(() => {
          initMap();
          if (map) {
            map.invalidateSize();
            calculateRoute();
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
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="map-fade" appear>
      <div v-if="isOpen" class="fixed inset-0 z-[9999] w-screen h-screen bg-slate-50 dark:bg-brand-navy-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans flex justify-end">
        
        <!-- Desktop Map Slot (visible only on wide screens) -->
        <div ref="desktopSlot" class="hidden lg:block absolute inset-0 w-full h-full z-0 bg-slate-100">
          <!-- Loading Overlay for Desktop -->
          <div v-if="isRouting && !isMobile" class="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></span>
          </div>
        </div>

        <!-- Hidden container that keeps map DOM elements at boot -->
        <div class="hidden">
          <div ref="mapEl" id="land-map" class="w-full h-full"></div>
        </div>

        <!-- Right Docked Search & Details Drawer (Translucent Glassmorphic Dashboard Panel) -->
        <Transition name="drawer-slide" appear>
          <div v-if="isOpen" class="relative h-full w-full lg:w-[425px] z-10 flex flex-col bg-white/90 dark:bg-brand-navy-950/90 backdrop-blur-xl border-l border-slate-200/50 dark:border-brand-navy-800/40 shadow-[0_0_50px_rgba(0,0,0,0.15)] overflow-hidden">
            
            <!-- Drawer Header -->
            <div class="p-5 border-b border-slate-100/80 dark:border-brand-navy-900/40 shrink-0 text-left flex items-center justify-between gap-3 bg-white/40 dark:bg-brand-navy-950/40 backdrop-blur-md">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 dark:from-orange-500/15 dark:to-amber-500/5 flex items-center justify-center border border-orange-500/25 dark:border-orange-500/15 shrink-0 shadow-sm">
                  <Compass class="w-5 h-5 text-orange-500" />
                </div>
                <div class="text-left min-w-0 flex-grow">
                  <span class="text-[8.5px] font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400 block">Panduan Jalur Darat</span>
                  <h3 class="text-sm font-black text-slate-800 dark:text-white leading-snug mt-0.5 tracking-tight">
                    Trip Weather Route Planner
                  </h3>
                </div>
              </div>
              
              <!-- Close button -->
              <button
                @click="emit('close')"
                class="p-2 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-350 dark:hover:bg-brand-navy-900/80 transition-all cursor-pointer border border-slate-200/50 dark:border-brand-navy-800/60"
                title="Tutup Rute"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable Itinerary Details -->
            <div class="flex-grow overflow-y-auto p-5 space-y-5 no-scrollbar">
              
              <!-- Route Input Form -->
              <div class="grid grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-200/40 dark:bg-brand-navy-900/20 dark:border-brand-navy-800/40 backdrop-blur-md">
                
                <!-- Input Titik Awal -->
                <div class="relative flex flex-col gap-1 text-left">
                  <label class="text-[8.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                    <MapPin class="w-3 h-3 text-blue-500" />
                    Titik Awal
                  </label>
                  <div class="relative">
                    <input 
                      type="text"
                      v-model="startQuery"
                      @input="onStartInput"
                      @focus="showStartSuggestions = true"
                      @blur="closeStartSuggestionsDeferred"
                      placeholder="Cari Kota, Desa..."
                      class="w-full text-xs font-semibold bg-white/70 dark:bg-brand-navy-900/60 border border-slate-200/60 dark:border-brand-navy-800/60 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/60 outline-none transition-all dark:text-white shadow-sm backdrop-blur-sm"
                    />
                    <!-- Suggestions List -->
                    <div 
                      v-if="showStartSuggestions && startSuggestions.length" 
                      class="absolute left-0 right-0 z-20 mt-1.5 max-h-60 overflow-y-auto bg-white/95 dark:bg-brand-navy-900/95 backdrop-blur-md border border-slate-200/40 dark:border-brand-navy-800/60 rounded-2xl shadow-2xl py-1 text-xs no-scrollbar"
                    >
                      <button 
                        v-for="loc in startSuggestions" 
                        :key="'start-s-' + loc.id"
                        @mousedown="selectStart(loc)"
                        class="w-full text-left px-3.5 py-2 hover:bg-orange-500/8 dark:hover:bg-orange-500/12 transition-all flex flex-col gap-0.5 border-b border-slate-100/50 dark:border-brand-navy-800/30 last:border-b-0"
                      >
                        <span class="font-bold text-slate-800 dark:text-white">{{ loc.name }}</span>
                        <span class="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">{{ loc.type }} — {{ loc.region }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Input Titik Tujuan -->
                <div class="relative flex flex-col gap-1 text-left">
                  <label class="text-[8.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                    <Navigation class="w-3 h-3 text-red-500 rotate-45" />
                    Titik Tujuan
                  </label>
                  <div class="relative">
                    <input 
                      type="text"
                      v-model="endQuery"
                      @input="onEndInput"
                      @focus="showEndSuggestions = true"
                      @blur="closeEndSuggestionsDeferred"
                      placeholder="Cari Wisata, Desa..."
                      class="w-full text-xs font-semibold bg-white/70 dark:bg-brand-navy-900/60 border border-slate-200/60 dark:border-brand-navy-800/60 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/60 outline-none transition-all dark:text-white shadow-sm backdrop-blur-sm"
                    />
                    <!-- Suggestions List -->
                    <div 
                      v-if="showEndSuggestions && endSuggestions.length" 
                      class="absolute left-0 right-0 z-20 mt-1.5 max-h-60 overflow-y-auto bg-white/95 dark:bg-brand-navy-900/95 backdrop-blur-md border border-slate-200/40 dark:border-brand-navy-800/60 rounded-2xl shadow-2xl py-1 text-xs no-scrollbar"
                    >
                      <button 
                        v-for="loc in endSuggestions" 
                        :key="'end-s-' + loc.id"
                        @mousedown="selectEnd(loc)"
                        class="w-full text-left px-3.5 py-2 hover:bg-orange-500/8 dark:hover:bg-orange-500/12 transition-all flex flex-col gap-0.5 border-b border-slate-100/50 dark:border-brand-navy-800/30 last:border-b-0"
                      >
                        <span class="font-bold text-slate-800 dark:text-white">{{ loc.name }}</span>
                        <span class="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">{{ loc.type }} — {{ loc.region }}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
              
              <!-- Mobile Map Slot (visible only on mobile) -->
              <div 
                v-show="isMobile"
                ref="mobileSlot" 
                class="block lg:hidden w-full h-[220px] rounded-2xl overflow-hidden shadow-md border border-slate-200/40 dark:border-brand-navy-800/40 relative z-10 bg-slate-100"
              >
                <!-- Loading Overlay inside map container on mobile -->
                <div v-if="isRouting && isMobile" class="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center z-20">
                  <span class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></span>
                </div>
              </div>

              <!-- Active Route Display -->
              <template v-if="startCityId && endCityId">
                
                <!-- Alternative Route Options Tabs -->
                <div class="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/50 dark:bg-brand-navy-900/35 border border-slate-200/30 dark:border-brand-navy-800/40">
                  <button 
                    v-for="routeOpt in alternativeRoutes"
                    :key="routeOpt.id"
                    @click="selectedRouteId = routeOpt.id"
                    class="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-350 text-center gap-0.5 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    :class="[
                      selectedRouteId === routeOpt.id
                        ? 'bg-white dark:bg-brand-navy-800/90 shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] text-slate-850 dark:text-white font-black border border-slate-100/80 dark:border-brand-navy-700/50 scale-[1.02]'
                        : 'font-bold border border-transparent'
                    ]"
                  >
                    <!-- Color Dot Indicator -->
                    <div class="flex items-center gap-1.5">
                      <span 
                        class="w-1.5 h-1.5 rounded-full shrink-0"
                        :class="[
                          routeOpt.id === 'fastest' ? 'bg-blue-500' :
                          routeOpt.id === 'safest' ? 'bg-emerald-500' : 'bg-amber-500'
                        ]"
                      />
                      <span class="text-[8.5px] uppercase tracking-wider">{{ routeOpt.label }}</span>
                    </div>
                    <span class="text-[9.5px] font-black leading-tight mt-0.5">~{{ routeOpt.distance }} km</span>
                    <span class="text-[8px] opacity-75 leading-none">{{ routeOpt.duration }}</span>
                  </button>
                </div>

                <!-- Route Overview Info -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 rounded-2xl border bg-white/40 dark:bg-brand-navy-900/15 border-slate-200/60 dark:border-brand-navy-800/50 flex flex-col gap-1 text-left hover:border-slate-350 dark:hover:border-brand-navy-700/60 transition-all duration-300">
                    <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">Jarak Perjalanan</span>
                    <span class="text-xs font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 mt-0.5">
                      <TrendingUp class="w-4 h-4 text-blue-500" />
                      ~{{ routeDistance }} km
                    </span>
                  </div>
                  <div class="p-3 rounded-2xl border bg-white/40 dark:bg-brand-navy-900/15 border-slate-200/60 dark:border-brand-navy-800/50 flex flex-col gap-1 text-left hover:border-slate-350 dark:hover:border-brand-navy-700/60 transition-all duration-300">
                    <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">Estimasi Waktu</span>
                    <span class="text-xs font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 mt-0.5">
                      <Clock class="w-4 h-4 text-indigo-500" />
                      {{ routeDuration }}
                    </span>
                  </div>
                </div>

                <!-- Overall Route Safety Advice Banner -->
                <div 
                  class="p-4 rounded-2xl border-l-4 flex gap-3.5 items-start text-left shadow-sm backdrop-blur-md transition-all duration-300"
                  :class="routeCheckpoints.some(s => s.condition === 'badai')
                    ? 'bg-red-500/8 border-y-slate-200/50 border-r-slate-200/50 border-l-red-500 dark:bg-red-500/5 dark:border-y-brand-navy-900/30 dark:border-r-brand-navy-900/30 text-red-700 dark:text-red-350'
                    : routeCheckpoints.some(s => s.condition === 'hujan')
                    ? 'bg-amber-500/8 border-y-slate-200/50 border-r-slate-200/50 border-l-amber-500 dark:bg-amber-500/5 dark:border-y-brand-navy-900/30 dark:border-r-brand-navy-900/30 text-amber-700 dark:text-amber-350'
                    : 'bg-emerald-500/8 border-y-slate-200/50 border-r-slate-200/50 border-l-emerald-500 dark:bg-emerald-500/5 dark:border-y-brand-navy-900/30 dark:border-r-brand-navy-900/30 text-emerald-700 dark:text-emerald-350'"
                >
                  <div class="relative mt-0.5">
                    <AlertTriangle class="w-4 h-4 shrink-0" />
                    <span 
                      v-if="routeCheckpoints.some(s => s.condition === 'badai' || s.condition === 'hujan')" 
                      class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-ping"
                      :class="routeCheckpoints.some(s => s.condition === 'badai') ? 'bg-red-500' : 'bg-amber-500'"
                    />
                  </div>
                  <div class="text-xs font-semibold leading-relaxed">
                    <strong class="font-black uppercase tracking-wider block mb-0.5 text-[9.5px]">Rekomendasi Keselamatan</strong>
                    <span v-if="routeCheckpoints.some(s => s.condition === 'badai')">
                      Rute melewati wilayah berpotensi **Hujan Badai & Petir**. Hati-hati pohon tumbang, reduksi kecepatan, dan nyalakan lampu utama.
                    </span>
                    <span v-else-if="routeCheckpoints.some(s => s.condition === 'hujan')">
                      Sebagian rute terdeteksi **Hujan Basah**. Hati-hati hydroplaning, jaga jarak aman antar kendaraan.
                    </span>
                    <span v-else>
                      Rute dalam **Kondisi Aman & Cerah**. Selamat berkendara, pastikan kondisi fisik dan kendaraan prima sebelum berangkat.
                    </span>
                  </div>
                </div>

                <!-- ── ROUTE CHECKPOINTS LIST ── -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2.5 text-left">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/5 border border-orange-500/20 dark:from-orange-400/15 dark:to-amber-400/5 dark:border-orange-400/20 shadow-sm">
                      <MapIcon class="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span class="text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Pos Pemeriksaan Cuaca</span>
                    </div>
                    <div class="flex-grow h-px bg-gradient-to-r from-orange-200/60 to-transparent dark:from-orange-800/40" />
                  </div>
                  
                  <!-- Checkpoint Timeline Vertical Steps -->
                  <div class="relative pl-4 border-l border-slate-200/60 dark:border-brand-navy-800/55 ml-2.5 space-y-4.5">
                    <div 
                      v-for="(cp, index) in routeCheckpoints" 
                      :key="'cp-' + index"
                      class="relative text-left"
                    >
                      <!-- Connecting node dot indicator -->
                      <span 
                        class="absolute -left-[23.5px] top-2.5 w-3 h-3 rounded-full border bg-white dark:bg-brand-navy-950 flex items-center justify-center transition-all duration-300"
                        :class="[
                          index === 0 || index === routeCheckpoints.length - 1
                            ? 'border-orange-500 scale-125 ring-4 ring-orange-500/10'
                            : cp.condition === 'badai' ? 'border-red-500 ring-4 ring-red-500/15 animate-pulse'
                            : cp.condition === 'hujan' ? 'border-amber-500 ring-4 ring-amber-500/15'
                            : 'border-slate-350 dark:border-brand-navy-700 ring-2 ring-slate-100 dark:ring-brand-navy-900/40'
                        ]"
                      >
                        <span 
                          v-if="index === 0 || index === routeCheckpoints.length - 1"
                          class="w-1.5 h-1.5 rounded-full bg-orange-500"
                        ></span>
                      </span>

                      <!-- Checkpoint step card -->
                      <div class="group/item flex items-start justify-between gap-3.5 p-3.5 rounded-2xl border bg-white/40 dark:bg-brand-navy-900/15 border-slate-200/60 dark:border-brand-navy-800/50 hover:border-slate-350 dark:hover:border-brand-navy-700/60 hover:bg-white/60 dark:hover:bg-brand-navy-900/25 transition-all duration-300 shadow-sm hover:shadow">
                        <div class="min-w-0">
                          <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {{ index === 0 ? 'Titik Awal' : index === routeCheckpoints.length - 1 ? 'Titik Tujuan' : `Checkpoint ${index}` }}
                          </span>
                          <h4 class="text-[11.5px] font-black text-slate-800 dark:text-white mt-0.5 group-hover/item:text-orange-550 dark:group-hover/item:text-orange-400 transition-colors">
                            {{ cp.name }}
                          </h4>
                          <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-1">{{ cp.tips }}</p>
                        </div>

                        <!-- Weather Info Side Badging -->
                        <div class="flex flex-col items-end shrink-0 gap-1 pl-2.5 border-l border-slate-100/80 dark:border-brand-navy-800/40">
                          <div class="flex items-center gap-1.5">
                            <component :is="getWeatherIcon(cp.condition)" class="w-3.5 h-3.5 shrink-0" :class="getWeatherIconColor(cp.condition)" />
                            <span class="text-[11px] font-black text-slate-800 dark:text-white leading-none">{{ cp.temp }}°C</span>
                          </div>
                          <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">{{ cp.weather }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Empty State Placeholder -->
              <div v-else class="flex-grow flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 py-16 gap-4">
                <div class="w-16 h-16 rounded-full bg-slate-100/60 dark:bg-brand-navy-900/30 flex items-center justify-center border border-slate-200/20 dark:border-brand-navy-800/40 text-slate-400 dark:text-brand-navy-400 shrink-0">
                  <Compass class="w-8 h-8 animate-pulse text-orange-500" />
                </div>
                <div class="max-w-[280px]">
                  <h4 class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest leading-none">Tentukan Rute Perjalanan</h4>
                  <p class="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed mt-2 font-bold">
                    Pilih titik asal dan titik tujuan pada formulir di atas untuk memantau kondisi cuaca di sepanjang jalur perjalanan Anda secara real-time.
                  </p>
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
</style>

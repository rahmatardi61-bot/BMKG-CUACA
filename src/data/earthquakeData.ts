export interface CityCoords {
  lat: number;
  lng: number;
}

export interface EarthquakeEvent {
  id: string;
  time: string;
  date: string;
  magnitude: number;
  depth: number; // in km
  lat: number;
  lng: number;
  epicenter: string;
  tsunamiPotential: boolean;
  tsunamiStatus?: string;
  feltMmi: { area: string; mmi: string }[];
  shakemap?: string;
  lintang?: string;
  bujur?: string;
  potensi?: string;
  dirasakan?: string;
}

export const cityCoordsMap: Record<string, CityCoords> = {
  'DKI Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Surabaya': { lat: -7.2575, lng: 112.7521 },
  'Bandung': { lat: -6.9175, lng: 107.6191 },
  'Medan': { lat: 3.5952, lng: 98.6722 },
  'Semarang': { lat: -6.9932, lng: 110.4203 },
  'Makassar': { lat: -5.1477, lng: 119.4327 },
  'Palembang': { lat: -2.9909, lng: 104.7566 },
  'Batam': { lat: 1.1301, lng: 104.0529 },
  'Pekanbaru': { lat: 0.5071, lng: 101.4478 },
  'Denpasar': { lat: -8.6705, lng: 115.2126 },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'Bantul': { lat: -7.8895, lng: 110.3283 },
  'Padang': { lat: -0.9471, lng: 100.4172 },
  'Banda Aceh': { lat: 5.5483, lng: 95.3238 },
  'Bandar Lampung': { lat: -5.4500, lng: 105.2667 },
  'Jambi': { lat: -1.6101, lng: 103.6131 },
  'Bengkulu': { lat: -3.8004, lng: 102.2655 },
  'Pangkalpinang': { lat: -2.1316, lng: 106.1169 },
  'Tanjung Pinang': { lat: 0.9167, lng: 104.4500 },
  'Pontianak': { lat: -0.0263, lng: 109.3425 },
  'Banjarmasin': { lat: -3.3194, lng: 114.5908 },
  'Balikpapan': { lat: -1.2379, lng: 116.8289 },
  'Samarinda': { lat: -0.5022, lng: 117.1536 },
  'Palangkaraya': { lat: -2.2161, lng: 113.9139 },
  'Tarakan': { lat: 3.3270, lng: 117.5965 },
  'Manado': { lat: 1.4748, lng: 124.8428 },
  'Palu': { lat: -0.9003, lng: 119.8779 },
  'Kendari': { lat: -3.9985, lng: 122.5126 },
  'Gorontalo': { lat: 0.5435, lng: 123.0568 },
  'Mamuju': { lat: -2.6770, lng: 118.8890 },
  'Mataram': { lat: -8.5833, lng: 116.1167 },
  'Kupang': { lat: -10.1772, lng: 123.6070 },
  'Ambon': { lat: -3.6954, lng: 128.1814 },
  'Ternate': { lat: 0.7906, lng: 127.3842 },
  'Jayapura': { lat: -2.5916, lng: 140.6690 },
  'Manokwari': { lat: -0.8615, lng: 134.0620 },
  'Sorong': { lat: -0.8761, lng: 131.2558 },
  'Malang': { lat: -7.9666, lng: 112.6326 },
  'Surakarta': { lat: -7.5755, lng: 110.8243 },
  'Solo': { lat: -7.5755, lng: 110.8243 },
  'Bogor': { lat: -6.5971, lng: 106.7986 },
  'Bekasi': { lat: -6.2383, lng: 106.9756 },
  'Tangerang': { lat: -6.1783, lng: 106.6319 },
  'Depok': { lat: -6.4025, lng: 106.7942 },
  'Cirebon': { lat: -6.7320, lng: 108.5523 },
  'Serang': { lat: -6.1104, lng: 106.1640 }
};

export const earthquakeEvents: EarthquakeEvent[] = [
  {
    id: 'eq-001',
    time: '21:45:12 WIB',
    date: '31 Jul 2026',
    magnitude: 5.6,
    depth: 10,
    lat: -7.95,
    lng: 110.28,
    epicenter: '10 km Barat Daya Bantul, DIY',
    tsunamiPotential: false,
    tsunamiStatus: 'Tidak berpotensi tsunami',
    feltMmi: [
      { area: 'Bantul', mmi: 'IV-V' },
      { area: 'Yogyakarta', mmi: 'III-IV' },
      { area: 'Solo', mmi: 'II-III' },
      { area: 'Semarang', mmi: 'II' }
    ]
  },
  {
    id: 'eq-002',
    time: '14:22:05 WITA',
    date: '31 Jul 2026',
    magnitude: 6.2,
    depth: 540,
    lat: -7.54,
    lng: 122.25,
    epicenter: '95 km Barat Laut Larantuka, NTT',
    tsunamiPotential: false,
    tsunamiStatus: 'Tidak berpotensi tsunami',
    feltMmi: [
      { area: 'Larantuka', mmi: 'III' },
      { area: 'Makassar', mmi: 'II' },
      { area: 'Bima', mmi: 'II' }
    ]
  },
  {
    id: 'eq-003',
    time: '08:12:40 WIB',
    date: '30 Jul 2026',
    magnitude: 5.9,
    depth: 25,
    lat: 0.90,
    lng: 97.35,
    epicenter: '30 km Barat Daya Nias Barat, Sumatera Utara',
    tsunamiPotential: false,
    tsunamiStatus: 'Tidak berpotensi tsunami',
    feltMmi: [
      { area: 'Nias Barat', mmi: 'IV' },
      { area: 'Gunungsitoli', mmi: 'III' },
      { area: 'Medan', mmi: 'II' }
    ]
  },
  {
    id: 'eq-004',
    time: '02:05:19 WITA',
    date: '29 Jul 2026',
    magnitude: 5.1,
    depth: 15,
    lat: -8.25,
    lng: 115.65,
    epicenter: '42 km Timur Laut Karangasem, Bali',
    tsunamiPotential: false,
    tsunamiStatus: 'Tidak berpotensi tsunami',
    feltMmi: [
      { area: 'Karangasem', mmi: 'IV' },
      { area: 'Denpasar', mmi: 'III' },
      { area: 'Mataram', mmi: 'II-III' },
      { area: 'Lombok Barat', mmi: 'II' }
    ]
  }
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getCityCoordinates(cityName: string, userLat?: number | null, userLng?: number | null): CityCoords {
  const nameLower = (cityName || '').toLowerCase().trim();
  
  // Only use GPS userLat/userLng if user explicitly chose "Lokasi Saya" / GPS mode or cityName is empty
  const isGpsMode = nameLower.includes('lokasi') || nameLower.includes('saya') || nameLower.includes('current') || !nameLower;
  if (isGpsMode && userLat && userLng) {
    return { lat: userLat, lng: userLng };
  }
  
  // Search in cityCoordsMap by matching name
  for (const [key, coords] of Object.entries(cityCoordsMap)) {
    if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
      return coords;
    }
  }
  
  // Fallback to userLat/userLng if city wasn't matched in coords map
  if (userLat && userLng) {
    return { lat: userLat, lng: userLng };
  }
  
  return cityCoordsMap['DKI Jakarta'];
}

export function getClosestEarthquake(cityName: string, userLat?: number | null, userLng?: number | null) {
  const cityCoords = getCityCoordinates(cityName, userLat, userLng);
  let closest: EarthquakeEvent | null = null;
  let minDistance = Infinity;
  
  for (const event of earthquakeEvents) {
    const dist = calculateDistance(cityCoords.lat, cityCoords.lng, event.lat, event.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = event;
    }
  }
  
  return {
    event: closest,
    distance: minDistance
  };
}

export interface SeismicZoneInfo {
  status: 'Tinggi' | 'Sedang' | 'Rendah';
  faultLine: string;
  description: string;
}

export const seismicZonesMap: Record<string, SeismicZoneInfo> = {
  'DKI Jakarta': {
    status: 'Sedang',
    faultLine: 'Sesar Baribis & Ciputat',
    description: 'Berada di dekat jalur sesar aktif Ciputat dan Sesar Baribis segmen Jakarta dengan potensi getaran sedang.'
  },
  'Surabaya': {
    status: 'Sedang',
    faultLine: 'Sesar Kendeng',
    description: 'Dilintasi oleh sistem sesar aktif Kendeng di bagian utara Jawa dengan aktivitas kegempaan sedang.'
  },
  'Bandung': {
    status: 'Tinggi',
    faultLine: 'Sesar Lembang',
    description: 'Berada tepat di selatan jalur patahan aktif Sesar Lembang dengan panjang patahan 29 km yang sangat aktif.'
  },
  'Medan': {
    status: 'Tinggi',
    faultLine: 'Sesar Semangko',
    description: 'Dekat dengan Patahan Besar Sumatra (Sesar Semangko segmen Renun) dengan tingkat kerawanan seismik tinggi.'
  },
  'Semarang': {
    status: 'Sedang',
    faultLine: 'Sesar Semarang & Kaligarang',
    description: 'Memiliki sesar lokal aktif Semarang dan Kaligarang yang berpotensi memicu gempa dangkal berkekuatan kecil-sedang.'
  },
  'Makassar': {
    status: 'Rendah',
    faultLine: 'Zona Stabil Kalimantan-Sulawesi Selatan',
    description: 'Berada di wilayah tektonik relatif stabil dengan frekuensi kejadian gempa aktif yang sangat rendah.'
  },
  'Palembang': {
    status: 'Rendah',
    faultLine: 'Cekungan Sumatra Selatan',
    description: 'Jauh dari patahan aktif utama Sumatra, diklasifikasikan sebagai wilayah dengan tingkat kerawanan gempa rendah.'
  },
  'Batam': {
    status: 'Rendah',
    faultLine: 'Sesar Aktif Nihil',
    description: 'Terletak di Paparan Sunda yang stabil secara tektonik, dikategorikan sebagai zona bebas patahan aktif.'
  },
  'Pekanbaru': {
    status: 'Rendah',
    faultLine: 'Sesar Aktif Nihil',
    description: 'Berada pada lempeng benua yang sangat stabil dengan risiko kegempaan yang sangat rendah.'
  },
  'Denpasar': {
    status: 'Tinggi',
    faultLine: 'Zona Subduksi Megathrust Selatan Bali',
    description: 'Berhadapan langsung dengan zona subduksi lempeng Indo-Australia dan patahan naik Utara Bali.'
  },
  'Yogyakarta': {
    status: 'Tinggi',
    faultLine: 'Sesar Opak & Megathrust Selatan Jawa',
    description: 'Sangat dekat dengan jalur patahan aktif Sesar Opak dan zona subduksi Megathrust Selatan Jawa dengan potensi gempa kuat.'
  },
  'Bantul': {
    status: 'Tinggi',
    faultLine: 'Sesar Opak & Megathrust Selatan Jawa',
    description: 'Sangat dekat dengan jalur patahan aktif Sesar Opak dan zona subduksi Megathrust Selatan Jawa dengan potensi gempa kuat.'
  }
};

export function getSeismicZoneInfo(cityName: string): SeismicZoneInfo {
  const nameLower = cityName.toLowerCase();
  for (const [key, info] of Object.entries(seismicZonesMap)) {
    if (nameLower.includes(key.toLowerCase())) {
      return info;
    }
  }
  
  return {
    status: 'Sedang',
    faultLine: 'Sesar Lokal Regional',
    description: 'Berada di wilayah dengan tingkat potensi gempa sedang dari sesar lokal atau aktivitas lempeng tektonik regional.'
  };
}

export interface HistoryEvent extends EarthquakeEvent {
  distance: number;
}

export function getEarthquakeHistory(cityName: string, userLat?: number | null, userLng?: number | null): HistoryEvent[] {
  const cityCoords = getCityCoordinates(cityName, userLat, userLng);
  return earthquakeEvents.map(event => {
    const dist = calculateDistance(cityCoords.lat, cityCoords.lng, event.lat, event.lng);
    return {
      ...event,
      distance: dist
    };
  }).sort((a, b) => a.distance - b.distance);
}

export function parseFeltMmi(dirasakanStr: string): { area: string; mmi: string }[] {
  if (!dirasakanStr) return [];
  return dirasakanStr.split(',').map(part => {
    const trimmed = part.replace(/MMI\s+/gi, '').trim();
    const match = trimmed.match(/^([IVXLC\d\-]+)\s+(.+)$/i);
    if (match) {
      return {
        mmi: match[1].toUpperCase(),
        area: match[2].trim()
      };
    }
    return {
      mmi: 'II',
      area: trimmed
    };
  });
}

export async function fetchLatestAutogempa(): Promise<EarthquakeEvent | null> {
  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    const g = data?.Infogempa?.gempa;
    if (!g) return null;

    const coords = g.Coordinates ? g.Coordinates.split(',') : [0, 0];
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    const magnitude = parseFloat(g.Magnitude) || 5.0;
    const depth = parseInt(g.Kedalaman ? g.Kedalaman.replace(/[^0-9]/g, '') : '10') || 10;
    const shakemapUrl = g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : '';

    return {
      id: `auto-eq-${g.DateTime || Date.now()}`,
      time: g.Jam || '00:00 WIB',
      date: g.Tanggal || 'Hari ini',
      magnitude: magnitude,
      depth: depth,
      lat: lat,
      lng: lng,
      epicenter: g.Wilayah || 'Pusat Gempa',
      tsunamiPotential: (g.Potensi || '').toLowerCase().includes('berpotensi tsunami'),
      tsunamiStatus: g.Potensi || 'Tidak berpotensi tsunami',
      feltMmi: parseFeltMmi(g.Dirasakan || ''),
      shakemap: shakemapUrl,
      lintang: g.Lintang || `${Math.abs(lat).toFixed(2).replace('.', ',')} LS`,
      bujur: g.Bujur || `${Math.abs(lng).toFixed(2).replace('.', ',')} BT`,
      potensi: g.Potensi || 'Hati-hati terhadap gempabumi susulan yang mungkin terjadi',
      dirasakan: g.Dirasakan || ''
    };
  } catch (error) {
    console.warn("Failed to fetch autogempa from BMKG:", error);
    return null;
  }
}

export async function fetchRealtimeEarthquakes(): Promise<EarthquakeEvent[]> {
  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json', {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    if (!data?.Infogempa?.gempa) {
      throw new Error('Invalid JSON format from BMKG');
    }
    
    const gempaList = data.Infogempa.gempa;
    return gempaList.map((g: any, index: number) => {
      const coords = g.Coordinates ? g.Coordinates.split(',') : [0, 0];
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      const magnitude = parseFloat(g.Magnitude) || 5.0;
      const depth = parseInt(g.Kedalaman ? g.Kedalaman.replace(/[^0-9]/g, '') : '10') || 10;
      const shakemapUrl = g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : '';
      
      return {
        id: `real-eq-${index}-${g.DateTime}`,
        time: g.Jam || '00:00 WIB',
        date: g.Tanggal || 'Hari ini',
        magnitude: magnitude,
        depth: depth,
        lat: lat,
        lng: lng,
        epicenter: g.Wilayah || 'Pusat Gempa',
        tsunamiPotential: false,
        tsunamiStatus: 'Tidak berpotensi tsunami',
        feltMmi: parseFeltMmi(g.Dirasakan || ''),
        shakemap: shakemapUrl,
        lintang: g.Lintang || `${Math.abs(lat).toFixed(2).replace('.', ',')} LS`,
        bujur: g.Bujur || `${Math.abs(lng).toFixed(2).replace('.', ',')} BT`,
        potensi: g.Potensi || 'Hati-hati terhadap gempabumi susulan yang mungkin terjadi',
        dirasakan: g.Dirasakan || ''
      };
    });
  } catch (error) {
    console.warn("Failed to fetch BMKG real-time data, using local mock data fallback.", error);
    return earthquakeEvents;
  }
}

export function getEarthquakeHistoryFromList(events: EarthquakeEvent[], cityName: string, userLat?: number | null, userLng?: number | null): HistoryEvent[] {
  const cityCoords = getCityCoordinates(cityName, userLat, userLng);
  return events.map(event => {
    const dist = calculateDistance(cityCoords.lat, cityCoords.lng, event.lat, event.lng);
    return {
      ...event,
      distance: dist
    };
  }).sort((a, b) => a.distance - b.distance);
}

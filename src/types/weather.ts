export interface WeatherData {
  city: string;
  temp: number;
  status: string;
  feelLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // in %
  windSpeed: number; // in km/h
  uvIndex: number;
  visibility: number; // in km
  icon: string;
}

export interface HourlyForecast {
  time: string;
  date: string;           // ISO date string YYYY-MM-DD
  temp: number;
  status: string;
  icon: string;
  precipitation?: number; // percentage (0-100)
  humidity?: number;      // percentage (0-100)
  windSpeed?: number;     // km/h
}

export interface TransportStatus {
  type: 'road' | 'air' | 'maritime' | 'rail';
  title: string;
  status: 'Aman' | 'Waspada' | 'Awas';
  statusClass: string;
  description: string;
}

export interface WarningAlert {
  id: string;
  severity: 'Siaga' | 'Waspada' | 'Awas';
  title: string;
  description: string;
  region: string;
  date: string;
}

export interface NewsArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  date: string;
  imageUrl: string;
}

export interface CityAnalysis {
  locationName: string;
  land: {
    title: string;
    desc: string;
  };
  sea: {
    title: string;
    desc: string;
  };
  air: {
    title: string;
    desc: string;
  };
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export type LatLngTuple = [number, number];

export interface ElevationRequest {
  coordinates: LatLngTuple[];
}

export interface ElevationResult {
  elevation: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface ElevationResponse {
  results: ElevationResult[];
  status: string;
}

export interface RouteAnalysisRequest {
  lengthKm: number;
  elevationGain: number;
  coordinates: LatLngTuple[];
  elevationData: number[];
  lengthMeters: number;
}

export interface GeographicLocation {
  point: LatLngTuple;
  country: string;
  region: string;
  area: string;
  locality: string;
  type: string;
}

export interface GeographicContext {
  countries: string[];
  regions: string[];
  areas: string[];
  localities: string[];
  multiRegion: boolean;
  multiCountry: boolean;
  totalPointsAnalyzed: number;
}

export interface RouteGeometryAnalysis {
  avgSlope: number;
  maxSlope: number;
  steepSections: number;
  sinuosity: number;
  minElevation: number;
  maxElevation: number;
  elevationProfile: string;
}

export interface RouteAnalysisResponse {
  analysis: string;
  stats: RouteGeometryAnalysis;
  terrainType: string;
  geographicContext: GeographicContext;
  formattedGeoContext: string;
}

export interface ApiError {
  error: string;
}

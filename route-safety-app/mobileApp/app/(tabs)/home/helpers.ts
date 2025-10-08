import { API_CONFIG, getApiUrl } from "@/config/api";

type LatLng = { latitude: number; longitude: number };

export const getElevationData = async (coordinates: LatLng[]): Promise<number[]> => {
  // Ограничиваем количество точек для запроса
  const limitedCoords = Array.isArray(coordinates) ? coordinates.slice(0, 100) : [];
  if (limitedCoords.length === 0) {
    throw new Error("No coordinates provided for elevation");
  }

  try {
    console.log(`Requesting elevation data for ${limitedCoords.length} coordinates`);

    // Трансформируем в формат [lat, lng] для бэкенда
    const payloadCoords = limitedCoords.map((p) => [p.latitude, p.longitude]);

    // Реальный запрос к бэкенду на /api/elevation
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ELEVATION), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: payloadCoords })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ElevationResponse = await response.json();

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('No elevation data received');
    }

    const elevations = data.results.map((result) => result.elevation);

    // Проверяем качество данных
    const validElevations = elevations.filter((elev) =>
      elev !== null && elev !== undefined && !isNaN(elev) && elev >= -500 && elev <= 10000
    );

    if (validElevations.length === 0) {
      throw new Error('All elevation data is invalid');
    }

    if (validElevations.length < elevations.length) {
      console.warn(`Only ${validElevations.length} out of ${elevations.length} elevation points are valid`);
    }

    const minElev = Math.min(...validElevations);
    const maxElev = Math.max(...validElevations);
    console.log(`Elevation data received: min=${minElev}m, max=${maxElev}m, valid points=${validElevations.length}`);

    return elevations;
  } catch (error) {
    console.error('Error fetching elevation data:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch elevation data');
  }
};
import { ElevationRequest, ElevationResponse, ApiError } from '../types';

/**
 * Сервис для работы с данными о высотах
 */
export class ElevationService {
  /**
   * Получает данные о высотах через несколько источников
   */
  async getElevationData(request: ElevationRequest): Promise<ElevationResponse> {
    const locations = request.coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
    
    // Пробуем несколько источников данных о высотах
    const sources = [
      {
        name: 'OpenTopoData SRTM',
        url: `https://api.opentopodata.org/v1/srtm90m?locations=${locations}`,
        transform: (data: any) => data
      },
      {
        name: 'OpenTopoData ASTER',
        url: `https://api.opentopodata.org/v1/aster30m?locations=${locations}`,
        transform: (data: any) => data
      },
      {
        name: 'OpenElevation',
        url: `https://api.open-elevation.com/api/v1/lookup`,
        transform: (data: any) => this.transformOpenElevationData(data, request.coordinates)
      }
    ];

    for (const source of sources) {
      try {
        console.log(`Trying ${source.name}...`);
        const response = await fetch(source.url, {
          method: source.name === 'OpenElevation' ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: source.name === 'OpenElevation' ? JSON.stringify({
            locations: request.coordinates.map(coord => ({ latitude: coord[0], longitude: coord[1] }))
          }) : undefined
        });

        if (!response.ok) {
          console.log(`${source.name} failed with status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const transformedData = source.transform(data);
        
        // Проверяем, что данные валидны
        if (this.isValidElevationData(transformedData)) {
          console.log(`Successfully got elevation data from ${source.name}`);
          return transformedData;
        } else {
          console.log(`${source.name} returned invalid data`);
          continue;
        }
        
      } catch (error) {
        console.log(`${source.name} failed:`, error);
        continue;
      }
    }

    // Если все источники не сработали, возвращаем ошибку
    throw new Error('All elevation data sources failed');
  }

  /**
   * Преобразует данные от OpenElevation API в нужный формат
   */
  private transformOpenElevationData(data: any, coordinates: number[][]): ElevationResponse {
    if (data.results && Array.isArray(data.results)) {
      return {
        results: data.results.map((result: any, index: number) => ({
          elevation: result.elevation || 0,
          location: {
            lat: coordinates[index][0],
            lng: coordinates[index][1]
          }
        })),
        status: 'OK'
      };
    }
    throw new Error('Invalid OpenElevation response format');
  }

  /**
   * Проверяет валидность данных о высотах
   */
  private isValidElevationData(data: ElevationResponse): boolean {
    if (!data.results || !Array.isArray(data.results)) {
      return false;
    }

    // Проверяем, что есть хотя бы одна валидная высота
    const validResults = data.results.filter(result => 
      result.elevation !== null && 
      result.elevation !== undefined && 
      !isNaN(result.elevation) &&
      result.elevation >= -500 && // Минимальная разумная высота
      result.elevation <= 10000  // Максимальная разумная высота
    );

    return validResults.length > 0;
  }
}

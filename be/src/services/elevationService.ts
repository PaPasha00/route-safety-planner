import { ElevationRequest, ElevationResponse, ApiError } from '../types';

/**
 * Сервис для работы с данными о высотах
 */
export class ElevationService {
  /**
   * Получает данные о высотах через OpenTopoData API
   */
  async getElevationData(request: ElevationRequest): Promise<ElevationResponse> {
    try {
      const locations = request.coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
      
      const response = await fetch(
        `https://api.opentopodata.org/v1/srtm90m?locations=${locations}`
      );

      if (!response.ok) {
        throw new Error(`OpenTopoData API error: ${response.status}`);
      }

      const data = await response.json();
      return data as ElevationResponse;
      
    } catch (error) {
      console.error('Elevation API error:', error);
      throw new Error('Failed to fetch elevation data');
    }
  }
}

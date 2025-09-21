import { Request, Response } from 'express';
import { ElevationRequest, ApiError } from '../types';
import { ElevationService } from '../services/elevationService';

const elevationService = new ElevationService();

/**
 * Контроллер для работы с данными о высотах
 */
export class ElevationController {
  /**
   * Получает данные о высотах для переданных координат
   */
  async getElevation(req: Request, res: Response): Promise<void> {
    try {
      const { coordinates } = req.body as ElevationRequest;
      
      if (!coordinates || !Array.isArray(coordinates)) {
        const error: ApiError = { error: 'Invalid coordinates format' };
        res.status(400).json(error);
        return;
      }

      const data = await elevationService.getElevationData({ coordinates });
      res.json(data);
      
    } catch (error) {
      console.error('Elevation API error:', error);
      const apiError: ApiError = { error: 'Failed to fetch elevation data' };
      res.status(500).json(apiError);
    }
  }
}

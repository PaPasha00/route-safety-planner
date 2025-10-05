import { Request, Response } from 'express';
import { RouteAnalysisRequest, ApiError } from '../types';
import { RouteAnalysisService } from '../services/routeAnalysisService';

const routeAnalysisService = new RouteAnalysisService();

/**
 * Контроллер для анализа маршрутов
 */
export class RouteAnalysisController {
  /**
   * Анализирует маршрут и возвращает детальный отчет
   */
  async analyzeRoute(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body as RouteAnalysisRequest;

      const result = await routeAnalysisService.analyzeRoute(requestData);
      res.json(result);

    } catch (error) {
      console.error('❌ Ошибка анализа маршрута:', (error as Error).message);
      const apiError: ApiError = { error: 'Не удалось проанализировать маршрут' };
      res.status(500).json(apiError);
    }
  }
}

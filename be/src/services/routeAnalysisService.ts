import { RouteAnalysisRequest, RouteAnalysisResponse } from '../types';
import { determineTerrainType, getGeographicContext, formatGeographicContext } from '../helpers/geography';
import { analyzeRouteGeometry } from '../helpers/routeAnalysis';
import { generateAnalysisPrompt, analyzeRouteWithAI } from '../helpers/aiAnalysis';

/**
 * Сервис для анализа маршрутов
 */
export class RouteAnalysisService {
  /**
   * Выполняет полный анализ маршрута
   */
  async analyzeRoute(request: RouteAnalysisRequest): Promise<RouteAnalysisResponse> {
    try {
      console.log('📊 Получены данные для анализа маршрута:');
      console.log(`- Длина: ${request.lengthKm} км (${request.lengthMeters} м)`);
      console.log(`- Набор высоты: ${request.elevationGain} м`);
      console.log(`- Количество точек: ${request.coordinates?.length || 0}`);

      if (request.elevationData && request.elevationData.length > 0) {
        console.log('- Диапазон высот:', Math.min(...request.elevationData), '-', Math.max(...request.elevationData), 'м');
      }

      // Автоматически определяем тип местности
      const terrainType = determineTerrainType(request.coordinates, request.elevationData);
      console.log(`- Определенный тип местности: ${terrainType}`);

      // Получаем географический контекст по всем точкам
      const geographicContext = await getGeographicContext(request.coordinates);
      console.log('- Географический контекст:', geographicContext);

      const formattedGeoContext = formatGeographicContext(geographicContext);
      console.log('- Форматированный контекст:', formattedGeoContext);

      // Анализируем геометрию маршрута
      const routeAnalysis = analyzeRouteGeometry(request.coordinates, request.elevationData);
      
      // Генерируем промпт для ИИ
      const prompt = generateAnalysisPrompt(
        request,
        terrainType,
        geographicContext,
        formattedGeoContext,
        routeAnalysis
      );

      // Получаем анализ от ИИ
      const analysis = await analyzeRouteWithAI(prompt);
      
      return { 
        analysis,
        stats: routeAnalysis,
        terrainType: terrainType,
        geographicContext: geographicContext,
        formattedGeoContext: formattedGeoContext
      };

    } catch (error) {
      console.error('❌ Ошибка анализа маршрута:', (error as Error).message);
      throw new Error('Не удалось проанализировать маршрут');
    }
  }
}

import { RouteAnalysisRequest, RouteAnalysisResponse } from '../types';
import { determineTerrainType, getGeographicContext, formatGeographicContext } from '../helpers/geography';
import { analyzeRouteGeometry } from '../helpers/routeAnalysis';
import { generateAnalysisPrompt, analyzeRouteWithAI } from '../helpers/aiAnalysis';
import { ElevationService } from './elevationService';

/**
 * Сервис для анализа маршрутов
 */
export class RouteAnalysisService {
  private elevationService = new ElevationService();

  /**
   * Выполняет полный анализ маршрута без любых заглушек/рандомизации
   */
  async analyzeRoute(request: RouteAnalysisRequest): Promise<RouteAnalysisResponse> {
    try {
      console.log('📊 Получены данные для анализа маршрута:');
      console.log(`- Длина: ${request.lengthKm} км (${request.lengthMeters} м)`);
      console.log(`- Набор высоты (из запроса): ${request.elevationGain} м`);
      console.log(`- Количество точек: ${request.coordinates?.length || 0}`);
      console.log(`- elevationData: len=${request.elevationData?.length ?? 0}`);

      if (!request.coordinates || request.coordinates.length < 2) {
        throw new Error('Недостаточно точек маршрута (coordinates < 2)');
      }

      // Автоподтягивание высот, если данные отсутствуют/некорректны
      let elevationData = Array.isArray(request.elevationData) ? request.elevationData : [];
      const coordsLen = request.coordinates.length;
      const needFetch = elevationData.length !== coordsLen;
      if (needFetch) {
        console.log('🔄 elevationData отсутствует/некорректен — запрашиваем высоты по координатам...');
        const elevResp = await this.elevationService.getElevationData({ coordinates: request.coordinates });
        const results = elevResp.results || [];
        elevationData = results.map(r => Number(r.elevation) || 0);
        if (elevationData.length !== coordsLen) {
          throw new Error(`Не удалось получить корректные высоты: ${elevationData.length} на ${coordsLen}`);
        }
      }

      // Пересчёт набора высоты по реальному профилю
      const elevationGain = this.computeElevationGain(elevationData);
      console.log(`- Пересчитанный набор высоты: ${elevationGain} м`);

      // Определяем тип местности по реальным данным рельефа
      const terrainType = determineTerrainType(request.coordinates, elevationData);
      console.log(`- Определенный тип местности: ${terrainType}`);

      // Географический контекст по реальным точкам (Nominatim)
      const geographicContext = await getGeographicContext(request.coordinates);
      console.log('- Географический контекст собран', {
        countries: geographicContext.countries.length,
        regions: geographicContext.regions.length,
        areas: geographicContext.areas.length,
        localities: geographicContext.localities.length,
      });
      const formattedGeoContext = formatGeographicContext(geographicContext);

      // Анализ геометрии маршрута по реальным высотам
      const routeAnalysis = analyzeRouteGeometry(request.coordinates, elevationData);
      console.log('- Геометрия маршрута рассчитана');

      // Генерация промпта и запрос к ИИ (JSON-ответ)
      const prompt = generateAnalysisPrompt(
        { ...request, elevationData, elevationGain },
        terrainType,
        geographicContext,
        formattedGeoContext,
        routeAnalysis
      );
      console.log('🤖 Отправка запроса к ИИ...');
      const ai = await analyzeRouteWithAI(prompt);
      console.log('✅ Ответ ИИ получен');

      return {
        analysis: ai.text,
        analysisStructured: ai.json,
        stats: routeAnalysis,
        terrainType,
        geographicContext,
        formattedGeoContext,
        dailyRoutes: [],
        totalDays: 0,
      };
    } catch (error: any) {
      console.error('❌ Ошибка анализа маршрута (service):', error?.message || error);
      throw new Error('Не удалось проанализировать маршрут');
    }
  }

  private computeElevationGain(elevations: number[]): number {
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const delta = elevations[i] - elevations[i - 1];
      if (delta > 0) gain += delta;
    }
    return Math.round(gain);
  }
}

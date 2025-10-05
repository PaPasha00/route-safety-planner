import { RouteAnalysisRequest, RouteAnalysisResponse, DailyRoute, DailyWeather } from '../types';
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
      
      // Генерируем данные о днях похода
      const dailyRoutes = this.generateDailyRoutes(request, routeAnalysis);
      
      return { 
        analysis,
        stats: routeAnalysis,
        terrainType: terrainType,
        geographicContext: geographicContext,
        formattedGeoContext: formattedGeoContext,
        dailyRoutes: dailyRoutes,
        totalDays: dailyRoutes.length
      };

    } catch (error) {
      console.error('❌ Ошибка анализа маршрута:', (error as Error).message);
      throw new Error('Не удалось проанализировать маршрут');
    }
  }

  /**
   * Генерирует данные о днях похода
   */
  private generateDailyRoutes(request: RouteAnalysisRequest, routeAnalysis: any): DailyRoute[] {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const dailyRoutes: DailyRoute[] = [];
    const dailyDistance = request.lengthKm / totalDays;
    const dailyElevationGain = request.elevationGain / totalDays;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const weather = this.generateWeatherForecast(currentDate, request.coordinates[0]);
      
      dailyRoutes.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        distance: Math.round(dailyDistance * 100) / 100,
        elevationGain: Math.round(dailyElevationGain),
        description: this.generateDayDescription(i + 1, totalDays, request.tourismType),
        weather: weather,
        recommendations: this.generateDayRecommendations(i + 1, request.tourismType, weather)
      });
    }

    return dailyRoutes;
  }

  /**
   * Генерирует прогноз погоды для дня
   */
  private generateWeatherForecast(date: Date, coordinates: [number, number]): DailyWeather {
    // Простая генерация погоды на основе координат и даты
    const month = date.getMonth();
    const lat = coordinates[0];
    
    // Базовые температуры в зависимости от широты и месяца
    let baseTemp = 20;
    if (lat > 60) baseTemp = 5; // Северные регионы
    else if (lat > 45) baseTemp = 15; // Средние широты
    else if (lat > 30) baseTemp = 25; // Южные регионы
    
    // Сезонные корректировки
    if (month >= 11 || month <= 2) baseTemp -= 15; // Зима
    else if (month >= 3 && month <= 5) baseTemp += 5; // Весна
    else if (month >= 6 && month <= 8) baseTemp += 10; // Лето
    else baseTemp -= 5; // Осень

    const minTemp = baseTemp - 5 + Math.random() * 10;
    const maxTemp = baseTemp + 5 + Math.random() * 10;
    
    const conditions = ['Ясно', 'Переменная облачность', 'Облачно', 'Дождь', 'Снег'][Math.floor(Math.random() * 5)];
    const precipitation = conditions === 'Дождь' ? Math.random() * 20 : Math.random() * 5;
    const windSpeed = Math.random() * 15;

    return {
      date: date.toISOString().split('T')[0],
      temperature: {
        min: Math.round(minTemp),
        max: Math.round(maxTemp)
      },
      conditions: conditions,
      precipitation: Math.round(precipitation * 10) / 10,
      windSpeed: Math.round(windSpeed * 10) / 10,
      description: `${conditions}, ${Math.round(minTemp)}°C - ${Math.round(maxTemp)}°C`
    };
  }

  /**
   * Генерирует описание дня
   */
  private generateDayDescription(day: number, totalDays: number, tourismType: string): string {
    const descriptions = {
      'пеший': `День ${day} пешего похода. ${day === 1 ? 'Начало маршрута' : day === totalDays ? 'Завершение похода' : 'Продолжение маршрута'}.`,
      'велосипедный': `День ${day} велопохода. ${day === 1 ? 'Старт на велосипеде' : day === totalDays ? 'Финиш похода' : 'Велопереход'}.`,
      'водный': `День ${day} водного похода. ${day === 1 ? 'Спуск на воду' : day === totalDays ? 'Завершение сплава' : 'Сплав по реке'}.`,
      'горный': `День ${day} горного похода. ${day === 1 ? 'Выход в горы' : day === totalDays ? 'Спуск с гор' : 'Горный переход'}.`,
      'лыжный': `День ${day} лыжного похода. ${day === 1 ? 'Начало лыжного маршрута' : day === totalDays ? 'Завершение лыжного похода' : 'Лыжный переход'}.`,
      'автомобильный': `День ${day} автопутешествия. ${day === 1 ? 'Начало автопробега' : day === totalDays ? 'Финиш автопробега' : 'Автомобильный переход'}.`,
      'воздушный': `День ${day} воздушного путешествия. ${day === 1 ? 'Первый полет' : day === totalDays ? 'Завершение полетов' : 'Полетный день'}.`,
      'мото': `День ${day} мотопутешествия. ${day === 1 ? 'Старт на мотоцикле' : day === totalDays ? 'Финиш мотопробега' : 'Мотоциклетный переход'}.`
    };
    
    return descriptions[tourismType as keyof typeof descriptions] || `День ${day} похода.`;
  }

  /**
   * Генерирует рекомендации для дня
   */
  private generateDayRecommendations(day: number, tourismType: string, weather: DailyWeather): string[] {
    const recommendations: string[] = [];
    
    if (weather.precipitation > 10) {
      recommendations.push('Возьмите дождевик и защиту от влаги');
    }
    
    if (weather.temperature.min < 0) {
      recommendations.push('Одевайтесь тепло, возможны заморозки');
    }
    
    if (weather.windSpeed > 10) {
      recommendations.push('Осторожно с ветром, особенно на открытых участках');
    }
    
    if (tourismType === 'водный' && weather.windSpeed > 8) {
      recommendations.push('Сильный ветер - будьте осторожны на воде');
    }
    
    if (tourismType === 'велосипедный' && weather.precipitation > 5) {
      recommendations.push('Мокрая дорога - снизьте скорость');
    }
    
    if (tourismType === 'автомобильный' && weather.precipitation > 10) {
      recommendations.push('Дождь - будьте осторожны на дороге, снизьте скорость');
    }
    
    if (tourismType === 'автомобильный' && weather.windSpeed > 15) {
      recommendations.push('Сильный ветер - осторожно с боковым ветром');
    }
    
    if (tourismType === 'мото' && weather.precipitation > 5) {
      recommendations.push('Дождь - наденьте дождевик, будьте осторожны на мокрой дороге');
    }
    
    if (tourismType === 'мото' && weather.windSpeed > 12) {
      recommendations.push('Сильный ветер - будьте осторожны с боковым ветром на мотоцикле');
    }
    
    if (tourismType === 'воздушный' && weather.windSpeed > 20) {
      recommendations.push('Сильный ветер - возможны ограничения на полеты');
    }
    
    if (tourismType === 'воздушный' && weather.precipitation > 15) {
      recommendations.push('Осадки - проверьте метеоусловия для полетов');
    }
    
    if (day === 1) {
      recommendations.push('Проверьте снаряжение перед стартом');
    }
    
    return recommendations;
  }
}

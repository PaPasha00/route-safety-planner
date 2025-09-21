import axios from 'axios';
import { RouteAnalysisRequest, RouteGeometryAnalysis, GeographicContext, DailyRoute, DailyWeather } from '../types';

/**
 * Генерирует промпт для анализа маршрута ИИ
 */
export function generateAnalysisPrompt(
  request: RouteAnalysisRequest,
  terrainType: string,
  geographicContext: GeographicContext,
  formattedGeoContext: string,
  routeAnalysis: RouteGeometryAnalysis
): string {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return `
Проанализируй туристический маршрут и дай развернутую оценку сложности на основе следующих данных:

ГЕОГРАФИЧЕСКИЙ КОНТЕКСТ:
${formattedGeoContext}
${geographicContext.multiRegion ? 'МАРШРУТ ПРОХОДИТ ЧЕРЕЗ НЕСКОЛЬКО РЕГИОНОВ - УЧТИ ЭТО ПРИ АНАЛИЗЕ!' : ''}
${geographicContext.multiCountry ? 'МАРШРУТ ПРОХОДИТ ЧЕРЕЗ НЕСКОЛЬКО СТРАН - ОСОБОЕ ВНИМАНИЕ НА ГРАНИЦЫ И РАЗЛИЧИЯ В ИНФРАСТРУКТУРЕ!' : ''}

ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ МАРШРУТА:
- Протяженность: ${request.lengthKm} км
- Общий набор высоты: ${request.elevationGain} метров
- Тип местности: ${terrainType} (определено автоматически по рельефу)
- Количество точек маршрута: ${request.coordinates.length}
- Тип туризма: ${request.tourismType}
- Даты похода: ${request.startDate} - ${request.endDate} (${totalDays} дней)

АНАЛИЗ РЕЛЬЕФА:
- Средний уклон: ${routeAnalysis.avgSlope.toFixed(1)}%
- Максимальный уклон: ${routeAnalysis.maxSlope.toFixed(1)}%
- Крутых подъемов (>15%): ${routeAnalysis.steepSections} участков
- Общая извилистость: ${routeAnalysis.sinuosity.toFixed(2)}
- Высота над уровнем моря: от ${routeAnalysis.minElevation}м до ${routeAnalysis.maxElevation}м
- Перепад высот: ${routeAnalysis.maxElevation - routeAnalysis.minElevation}м

ДАННЫЕ О ВЫСОТАХ (первые 10 точек из ${request.elevationData.length}):
${request.elevationData.slice(0, 10).map((elev, i) => `  ${i+1}. ${elev}м`).join('\n')}

ПРОФИЛЬ МАРШРУТА: ${routeAnalysis.elevationProfile}

Проанализируй этот маршрут и дай развернутый ответ на русском языке, учитывая что маршрут может проходить через разные географические зоны:

1. ГЕОГРАФИЧЕСКАЯ ХАРАКТЕРИСТИКА
- Опиши все регионы/страны через которые проходит маршрут
- Характерные особенности рельефа для каждого участка
- Климатические зоны вдоль маршрута

2. ОБЩАЯ ОЦЕНКА СЛОЖНОСТИ (по шкале 1-10)
- Обоснуй оценку на основе параметров маршрута
- Укажи различия в сложности на разных участках
- Сравни с аналогичными маршрутами в этих регионах

3. ТИП МАРШРУТА И РЕКОМЕНДАЦИИ
- Для каких видов активности подходят разные участки
- Рекомендуемый сезон для каждого региона
- Оптимальное время прохождения с учетом протяженности

4. ТЕХНИЧЕСКИЕ ОСОБЕННОСТИ
- Анализ ключевых участков в разных регионах
- Оценка навигационной сложности (особенно на границах регионов)
- Изменение условий вдоль маршрута

5. ЭКИПИРОВКА И ПОДГОТОВКА
- Необходимое снаряжение с учетом разных типов местности
- Требуемый уровень физической подготовки для многодневного перехода
- Рекомендации по безопасности при пересечении регионов

6. ПОТЕНЦИАЛЬНЫЕ РИСКИ И ОСОБЕННОСТИ
- Опасные участки на маршруте (учитывая разные регионы)
- Метеорологические риски для каждого участка
- Особенности местной инфраструктуры и логистики

7. ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ
- Советы по планированию многодневного перехода
- Рекомендации по акклиматизации (если есть перепады высот)
- Информация о транспорте, ночлеге, воде вдоль маршрута

8. РАЗБИВКА ПО ДНЯМ
- Предложи оптимальное разделение маршрута на ${totalDays} дней
- Для каждого дня укажи: расстояние, набор высоты, ключевые точки
- Учти тип туризма (${request.tourismType}) при планировании дневных переходов

9. ПРОГНОЗ ПОГОДЫ
- Оцените погодные условия для каждого дня похода
- Учтите сезонность и географическое положение
- Дайте рекомендации по экипировке для каждого дня

ОСОБОЕ ВНИМАНИЕ: маршрут проходит через ${geographicContext.multiRegion ? 'несколько регионов' : 'один регион'} - учти это в анализе!
Ответ должен быть подробным, профессиональным и учитывать географические особенности всех регионов.
  `;
}

/**
 * Отправляет запрос к ИИ для анализа маршрута
 */
export async function analyzeRouteWithAI(prompt: string): Promise<string> {
  try {
    // Проверяем наличие API ключа
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY не настроен. Создайте файл .env с вашим API ключом');
    }
    
    console.log('🤖 Отправка запроса к ИИ с анализом всех точек маршрута...');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Route Safety Planner'
        }
      }
    );

    const analysis = response.data.choices[0].message.content.trim();
    console.log('✅ Анализ от ИИ получен успешно!');
    
    return analysis;
  } catch (error) {
    console.error('❌ Ошибка при обращении к ИИ:', (error as Error).message);
    
    // Если это ошибка с API ключом, даем более понятное сообщение
    if ((error as any).response?.status === 401) {
      throw new Error('API ключ OpenRouter не настроен или неверный. См. API_SETUP.md для настройки');
    }
    
    throw new Error('Не удалось получить анализ от ИИ');
  }
}

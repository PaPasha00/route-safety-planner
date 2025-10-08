import axios from 'axios';
import { RouteAnalysisRequest, RouteGeometryAnalysis, GeographicContext } from '../types';

/**
 * Генерирует промпт для анализа маршрута ИИ в формате JSON
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

  const jsonSchema = {
    summary: {
      difficultyScore: "number (1-10)",
      difficultyReasoning: "string",
    },
    stats: {
      distanceKm: "number",
      elevationGainM: "number",
      minElevationM: "number",
      maxElevationM: "number",
      avgSlopePercent: "number",
      maxSlopePercent: "number",
      sinuosity: "number",
    },
    geography: {
      terrainType: "string",
      countries: "string[]",
      regions: "string[]",
      areas: "string[]",
      localities: "string[]",
      notes: "string",
    },
    days: [
      {
        day: "number",
        date: "string",
        distanceKm: "number",
        elevationGainM: "number",
        keyPoints: "string[]",
        weather: {
          temperatureMin: "number",
          temperatureMax: "number",
          conditions: "string",
          windSpeed: "number",
          precipitation: "number",
        },
        description: "string",
        recommendations: "string[]",
      },
    ],
    recommendations: "string[]",
    warnings: "string[]",
  };

  return `
Ты — эксперт по походам. Верни строго JSON без какого-либо текста до или после JSON. Никаких комментариев, пояснений или маркдауна. Если чего-то не хватает в данных — ставь null или пустые поля, но сохраняй форму.

Схема JSON (пример типов):
${JSON.stringify(jsonSchema, null, 2)}

ДАННЫЕ:
- Геоконтекст (строка):\n${formattedGeoContext}
- Мульти-регион: ${geographicContext.multiRegion}
- Мульти-страна: ${geographicContext.multiCountry}
- Протяженность: ${request.lengthKm} км
- Набор высоты: ${request.elevationGain} м
- Тип местности: ${terrainType}
- Точек: ${request.coordinates.length}
- Тип туризма: ${request.tourismType}
- Даты: ${request.startDate} - ${request.endDate} (${totalDays} дн.)
- Уклон ср: ${routeAnalysis.avgSlope.toFixed(1)}%, макс: ${routeAnalysis.maxSlope.toFixed(1)}%
- Извилистость: ${routeAnalysis.sinuosity.toFixed(2)}
- Высоты: мин ${routeAnalysis.minElevation}м, макс ${routeAnalysis.maxElevation}м, перепад ${routeAnalysis.maxElevation - routeAnalysis.minElevation}м

Верни ТОЛЬКО валидный JSON по указанной схеме.
  `;
}

/**
 * Отправляет запрос к ИИ для анализа маршрута и возвращает { text, json? }
 */
export async function analyzeRouteWithAI(prompt: string): Promise<{ text: string; json?: any }> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY не настроен. Создайте файл .env с вашим API ключом');
    }

    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    console.log('🤖 Отправка запроса к ИИ... (model:', model, ')');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: 'Отвечай строго валидным JSON. Никакого текста вне JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Route Safety Planner'
        }
      }
    );

    const content: string = response.data.choices[0].message.content?.trim() || '';

    let parsed: any | undefined = undefined;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Если вдруг вернулся нестрогий JSON
      parsed = undefined;
    }

    console.log('✅ Ответ ИИ получен');
    return { text: content, json: parsed };
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status) {
      console.error('❌ Ошибка при обращении к ИИ:', status, typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.error('❌ Ошибка при обращении к ИИ:', (error as Error).message);
    }
    if (error?.response) throw error;
    if (status === 401) {
      throw new Error('API ключ OpenRouter не настроен или неверный. См. API_SETUP.md для настройки');
    }
    throw new Error('Не удалось получить анализ от ИИ');
  }
}

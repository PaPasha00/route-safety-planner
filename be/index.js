const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Добавляем расчет расстояния между координатами
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Функция для определения типа местности на основе координат и высот
function determineTerrainType(coordinates, elevationData) {
  if (!coordinates || !elevationData || coordinates.length < 2) {
    return 'неизвестно';
  }

  const minElevation = Math.min(...elevationData);
  const maxElevation = Math.max(...elevationData);
  const elevationRange = maxElevation - minElevation;
  const avgElevation = elevationData.reduce((sum, elev) => sum + elev, 0) / elevationData.length;

  let totalSlope = 0;
  let maxSlope = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const distance = calculateDistance(prev[0], prev[1], curr[0], curr[1]);
    
    if (distance > 0 && i < elevationData.length) {
      const elevationDiff = elevationData[i] - elevationData[i - 1];
      const slope = (elevationDiff / distance) * 100;
      totalSlope += Math.abs(slope);
      maxSlope = Math.max(maxSlope, Math.abs(slope));
    }
  }

  const avgSlope = totalSlope / (coordinates.length - 1);

  if (elevationRange > 1000) {
    return 'горная местность';
  } else if (elevationRange > 500) {
    return 'холмистая местность';
  } else if (elevationRange > 200) {
    return 'пересеченная местность';
  } else if (avgSlope > 8) {
    return 'волнистая равнина';
  } else if (avgElevation < 50) {
    return 'низменность';
  } else if (avgElevation > 500) {
    return 'возвышенность';
  } else {
    return 'равнинная местность';
  }
}

// Функция для получения географического контекста по всем точкам маршрута
async function getGeographicContext(coordinates) {
  try {
    // Выбираем несколько ключевых точек вдоль маршрута
    const samplePoints = [];
    const step = Math.max(1, Math.floor(coordinates.length / 5)); // Берем 5 точек равномерно
    
    for (let i = 0; i < coordinates.length; i += step) {
      if (samplePoints.length < 5) { // Максимум 5 точек для анализа
        samplePoints.push(coordinates[i]);
      }
    }

    // Добавляем начальную и конечную точки
    if (coordinates.length > 0) {
      samplePoints.push(coordinates[0]);
      samplePoints.push(coordinates[coordinates.length - 1]);
    }

    const uniquePoints = Array.from(new Set(samplePoints.map(p => p.join(','))))
      .map(str => str.split(',').map(Number));

    console.log(`🌍 Анализируем ${uniquePoints.length} точек маршрута для определения регионов`);

    // Анализируем каждую точку
    const locationPromises = uniquePoints.map(async (point, index) => {
      try {
        await new Promise(resolve => setTimeout(resolve, index * 200)); // Задержка между запросами
        
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point[0]}&lon=${point[1]}&zoom=8&accept-language=ru`,
          {
            headers: {
              'User-Agent': 'RouteSafetyPlanner/1.0'
            }
          }
        );

        const data = response.data;
        if (data && data.address) {
          return {
            point: point,
            country: data.address.country || 'неизвестно',
            region: data.address.state || data.address.region || data.address.province || 'неизвестно',
            area: data.address.county || data.address.district || 'неизвестно',
            locality: data.address.city || data.address.town || data.address.village || 'неизвестно',
            type: data.addresstype || 'неизвестно'
          };
        }
      } catch (error) {
        console.log(`Ошибка геокодирования точки ${index}:`, error.message);
      }
      return null;
    });

    const locations = (await Promise.all(locationPromises)).filter(loc => loc !== null);

    // Анализируем результаты по всем точкам
    const countries = new Set();
    const regions = new Set();
    const areas = new Set();
    const localities = new Set();

    locations.forEach(loc => {
      if (loc.country !== 'неизвестно') countries.add(loc.country);
      if (loc.region !== 'неизвестно') regions.add(loc.region);
      if (loc.area !== 'неизвестно') areas.add(loc.area);
      if (loc.locality !== 'неизвестно') localities.add(loc.locality);
    });

    // Определяем, проходит ли маршрут через несколько регионов
    const multiRegion = regions.size > 1;
    const multiCountry = countries.size > 1;

    return {
      countries: Array.from(countries),
      regions: Array.from(regions),
      areas: Array.from(areas),
      localities: Array.from(localities),
      multiRegion: multiRegion,
      multiCountry: multiCountry,
      totalPointsAnalyzed: locations.length
    };

  } catch (error) {
    console.log('Не удалось получить географический контекст:', error.message);
    return {
      countries: ['неизвестно'],
      regions: ['неизвестно'],
      areas: ['неизвестно'],
      localities: ['неизвестно'],
      multiRegion: false,
      multiCountry: false,
      totalPointsAnalyzed: 0
    };
  }
}

// Функция для форматирования географического контекста в текстовый вид
function formatGeographicContext(context) {
  if (context.countries[0] === 'неизвестно') {
    return 'географическое положение не определено';
  }

  let description = '';

  if (context.multiCountry) {
    description = `Маршрут проходит через несколько стран: ${context.countries.join(', ')}. `;
  } else {
    description = `Страна: ${context.countries[0]}. `;
  }

  if (context.multiRegion) {
    description += `Проходит через регионы: ${context.regions.join(', ')}. `;
  } else if (context.regions.length > 0) {
    description += `Регион: ${context.regions[0]}. `;
  }

  if (context.areas.length > 0) {
    description += `Районы: ${context.areas.join(', ')}. `;
  }

  if (context.localities.length > 0) {
    if (context.localities.length > 3) {
      description += `Населенные пункты: ${context.localities.slice(0, 3).join(', ')} и еще ${context.localities.length - 3}. `;
    } else {
      description += `Населенные пункты: ${context.localities.join(', ')}. `;
    }
  }

  return description;
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/elevation', async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    const locations = coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
    
    const response = await fetch(
      `https://api.opentopodata.org/v1/srtm90m?locations=${locations}`
    );

    if (!response.ok) {
      throw new Error(`OpenTopoData API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Elevation API error:', error);
    res.status(500).json({ error: 'Failed to fetch elevation data' });
  }
});

app.post('/api/analyze-route', async (req, res) => {
  try {
    const { lengthKm, elevationGain, coordinates, elevationData, lengthMeters } = req.body;

    console.log('📊 Получены данные для анализа маршрута:');
    console.log(`- Длина: ${lengthKm} км (${lengthMeters} м)`);
    console.log(`- Набор высоты: ${elevationGain} м`);
    console.log(`- Количество точек: ${coordinates?.length || 0}`);

    if (elevationData && elevationData.length > 0) {
      console.log('- Диапазон высот:', Math.min(...elevationData), '-', Math.max(...elevationData), 'м');
    }

    // Автоматически определяем тип местности
    const terrainType = determineTerrainType(coordinates, elevationData);
    console.log(`- Определенный тип местности: ${terrainType}`);

    // Получаем географический контекст по всем точкам
    const geographicContext = await getGeographicContext(coordinates);
    console.log('- Географический контекст:', geographicContext);

    const formattedGeoContext = formatGeographicContext(geographicContext);
    console.log('- Форматированный контекст:', formattedGeoContext);

    // Анализируем геометрию маршрута
    const routeAnalysis = analyzeRouteGeometry(coordinates, elevationData);
    
    const prompt = `
Проанализируй туристический маршрут и дай развернутую оценку сложности на основе следующих данных:

ГЕОГРАФИЧЕСКИЙ КОНТЕКСТ:
${formattedGeoContext}
${geographicContext.multiRegion ? 'МАРШРУТ ПРОХОДИТ ЧЕРЕЗ НЕСКОЛЬКО РЕГИОНОВ - УЧТИ ЭТО ПРИ АНАЛИЗЕ!' : ''}
${geographicContext.multiCountry ? 'МАРШРУТ ПРОХОДИТ ЧЕРЕЗ НЕСКОЛЬКО СТРАН - ОСОБОЕ ВНИМАНИЕ НА ГРАНИЦЫ И РАЗЛИЧИЯ В ИНФРАСТРУКТУРЕ!' : ''}

ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ МАРШРУТА:
- Протяженность: ${lengthKm} км
- Общий набор высоты: ${elevationGain} метров
- Тип местности: ${terrainType} (определено автоматически по рельефу)
- Количество точек маршрута: ${coordinates.length}

АНАЛИЗ РЕЛЬЕФА:
- Средний уклон: ${routeAnalysis.avgSlope.toFixed(1)}%
- Максимальный уклон: ${routeAnalysis.maxSlope.toFixed(1)}%
- Крутых подъемов (>15%): ${routeAnalysis.steepSections} участков
- Общая извилистость: ${routeAnalysis.sinuosity.toFixed(2)}
- Высота над уровнем моря: от ${routeAnalysis.minElevation}м до ${routeAnalysis.maxElevation}м
- Перепад высот: ${routeAnalysis.maxElevation - routeAnalysis.minElevation}м

ДАННЫЕ О ВЫСОТАХ (первые 10 точек из ${elevationData.length}):
${elevationData.slice(0, 10).map((elev, i) => `  ${i+1}. ${elev}м`).join('\n')}

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

ОСОБОЕ ВНИМАНИЕ: маршрут проходит через ${geographicContext.multiRegion ? 'несколько регионов' : 'один регион'} - учти это в анализе!
Ответ должен быть подробным, профессиональным и учитывать географические особенности всех регионов.
    `;

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
    
    res.json({ 
      analysis,
      stats: routeAnalysis,
      terrainType: terrainType,
      geographicContext: geographicContext,
      formattedGeoContext: formattedGeoContext
    });

  } catch (error) {
    console.error('❌ Ошибка анализа маршрута:', error.message);
    res.status(500).json({ error: 'Не удалось проанализировать маршрут' });
  }
});

// Функция для анализа геометрии маршрута
function analyzeRouteGeometry(coordinates, elevationData) {
  if (!coordinates || coordinates.length < 2) {
    return {
      avgSlope: 0,
      maxSlope: 0,
      steepSections: 0,
      sinuosity: 0,
      minElevation: 0,
      maxElevation: 0,
      elevationProfile: 'Недостаточно данных'
    };
  }

  let totalSlope = 0;
  let maxSlope = 0;
  let steepSections = 0;
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    
    const distance = calculateDistance(prev[0], prev[1], curr[0], curr[1]);
    totalDistance += distance;
    
    if (elevationData && elevationData.length > i) {
      const elevationDiff = elevationData[i] - elevationData[i - 1];
      const slope = (elevationDiff / distance) * 100;
      
      totalSlope += Math.abs(slope);
      maxSlope = Math.max(maxSlope, Math.abs(slope));
      
      if (Math.abs(slope) > 15) {
        steepSections++;
      }
    }
  }

  const straightLineDistance = calculateDistance(
    coordinates[0][0], coordinates[0][1],
    coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]
  );
  
  const sinuosity = totalDistance / straightLineDistance;

  let elevationProfile = 'Равнинный';
  if (elevationData) {
    const elevationRange = Math.max(...elevationData) - Math.min(...elevationData);
    if (elevationRange > 1000) elevationProfile = 'Горный';
    else if (elevationRange > 500) elevationProfile = 'Холмистый';
    else if (elevationRange > 200) elevationProfile = 'Пересеченный';
  }

  return {
    avgSlope: totalDistance > 0 ? totalSlope / (coordinates.length - 1) : 0,
    maxSlope,
    steepSections,
    sinuosity,
    minElevation: elevationData ? Math.min(...elevationData) : 0,
    maxElevation: elevationData ? Math.max(...elevationData) : 0,
    elevationProfile
  };
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});
// Функция для получения высотных данных
// Функция для получения высотных данных через ваш сервер
export const getElevationData = async (coordinates: LatLngTuple[]): Promise<number[]> => {
  try {
    // Ограничиваем количество точек для запроса
    const limitedCoords = coordinates.slice(0, 100);
    
    // Делаем запрос к вашему серверу
    const response = await fetch('http://localhost:3001/api/elevation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: limitedCoords })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.map((result: any) => result.elevation);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('No elevation data received');
    }
  } catch (error) {
    console.error('Error fetching elevation data:', error);
    
    // Возвращаем заглушку с случайными высотами для демонстрации
    console.log('Using simulated elevation data for demo');
    return simulateElevationData(coordinates);
  }
};

// Функция для генерации демо-данных о высотах
export const simulateElevationData = (coordinates: LatLngTuple[]): number[] => {
  if (coordinates.length === 0) return [];
  
  const elevations: number[] = [];
  let currentElevation = 100 + Math.random() * 200; // начальная высота 100-300м
  
  for (let i = 0; i < coordinates.length; i++) {
    // Добавляем случайные колебания высоты
    const change = (Math.random() - 0.5) * 50;
    currentElevation = Math.max(0, currentElevation + change);
    elevations.push(Math.round(currentElevation));
  }
  
  return elevations;
};

// Функция для расчета перепада высот
export const calculateElevationStats = (elevations: number[]): {
  totalGain: number;
  totalLoss: number;
  minElevation: number;
  maxElevation: number;
  avgElevation: number;
} => {
  if (elevations.length < 2) {
    return { totalGain: 0, totalLoss: 0, minElevation: 0, maxElevation: 0, avgElevation: 0 };
  }

  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) {
      totalGain += diff;
    } else {
      totalLoss += Math.abs(diff);
    }
  }

  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const avgElevation = elevations.reduce((sum, elev) => sum + elev, 0) / elevations.length;

  return {
    totalGain: Math.round(totalGain),
    totalLoss: Math.round(totalLoss),
    minElevation: Math.round(minElevation),
    maxElevation: Math.round(maxElevation),
    avgElevation: Math.round(avgElevation)
  };
};
import { LatLngTuple, ElevationResponse } from '../types';

/**
 * Получает данные о высотах через API
 */
export const getElevationData = async (coordinates: LatLngTuple[]): Promise<number[]> => {
  try {
    // Ограничиваем количество точек для запроса
    const limitedCoords = coordinates.slice(0, 100);
    
    // Делаем запрос к серверу
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

    const data: ElevationResponse = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.map((result) => result.elevation);
    } else if (data.status === 'ERROR') {
      throw new Error('Elevation data error');
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

/**
 * Генерирует демо-данные о высотах
 */
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

import { RouteAnalysisRequest, RouteAnalysisResponse, ApiError } from '../types';

/**
 * Отправляет запрос на анализ маршрута
 */
export const analyzeRoute = async (requestData: RouteAnalysisRequest): Promise<RouteAnalysisResponse> => {
  const response = await fetch("http://localhost:3001/api/analyze-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || 'Failed to analyze route');
  }

  const data: RouteAnalysisResponse = await response.json();
  return data;
};

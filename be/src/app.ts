import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import elevationRoutes from './routes/elevationRoutes';
import routeAnalysisRoutes from './routes/routeAnalysisRoutes';

// Загружаем переменные окружения
dotenv.config();

/**
 * Создает и настраивает Express приложение
 */
export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api', elevationRoutes);
  app.use('/api', routeAnalysisRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return app;
}

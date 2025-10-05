import dotenv from 'dotenv';
import { createApp } from './app';

// Загружаем переменные окружения
dotenv.config();

// Проверяем загрузку переменных
console.log('🔑 Проверка переменных окружения:');
console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'настроен' : 'НЕ НАЙДЕН'}`);
console.log(`PORT: ${process.env.PORT || 'не задан'}`);

/**
 * Главная точка входа приложения
 */
function main(): void {
  const app = createApp();
  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`🚀 Бэкенд запущен на http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

// Запускаем приложение
main();

import { createApp } from './app';

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

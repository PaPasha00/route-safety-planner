# Route Safety App

Приложение для анализа безопасности туристических маршрутов с использованием карт и ИИ.

## Структура проекта

```
route-safety-app/
├── be/                     # Backend (TypeScript + Express)
│   ├── src/
│   │   ├── controllers/    # Контроллеры API
│   │   ├── helpers/        # Вспомогательные функции
│   │   ├── routes/         # Маршруты API
│   │   ├── services/       # Бизнес-логика
│   │   ├── types/          # TypeScript типы
│   │   ├── app.ts          # Конфигурация Express
│   │   └── index.ts        # Точка входа
│   ├── package.json
│   └── tsconfig.json
├── fe/                     # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   │   ├── Map/        # Компоненты карты
│   │   │   ├── RouteInfo/  # Информация о маршруте
│   │   │   └── RouteAnalyzer/ # Анализатор маршрута
│   │   ├── helpers/        # Вспомогательные функции
│   │   ├── types/          # TypeScript типы
│   │   ├── App.tsx         # Главный компонент
│   │   └── main.jsx        # Точка входа
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Функционал

- 🗺️ Интерактивная карта с возможностью рисования маршрутов
- 📊 Автоматический расчет длины маршрута и перепадов высот
- 🌍 Получение данных о высотах через OpenTopoData API
- 🤖 Анализ маршрута с помощью ИИ (OpenRouter)
- 📈 Детальная статистика по маршруту
- 🎨 Современный UI с модульными стилями

## Технологии

### Backend

- **TypeScript** - типизированный JavaScript
- **Express.js** - веб-фреймворк
- **Axios** - HTTP клиент
- **CORS** - для кросс-доменных запросов
- **dotenv** - управление переменными окружения

### Frontend

- **React 19** - UI библиотека
- **TypeScript** - типизированный JavaScript
- **Vite** - сборщик и dev сервер
- **Leaflet** - карты
- **SCSS** - стили с модулями
- **React Leaflet** - React компоненты для Leaflet

## Установка и запуск

### Предварительные требования

- Node.js 18+
- npm или yarn

### Backend

1. Перейдите в папку бэкенда:

```bash
cd be
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` в папке `be/`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3001
```

4. Запустите в режиме разработки:

```bash
npm run dev
```

Или соберите и запустите продакшн версию:

```bash
npm run build
npm start
```

Backend будет доступен на `http://localhost:3001`

### Frontend

1. Перейдите в папку фронтенда:

```bash
cd fe
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите dev сервер:

```bash
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## API Endpoints

### GET /health

Проверка состояния сервера

### POST /api/elevation

Получение данных о высотах для координат

**Запрос:**

```json
{
  "coordinates": [
    [55.75, 37.62],
    [55.76, 37.63]
  ]
}
```

**Ответ:**

```json
{
  "results": [
    {
      "elevation": 150,
      "location": {
        "lat": 55.75,
        "lng": 37.62
      }
    }
  ],
  "status": "OK"
}
```

### POST /api/analyze-route

Анализ маршрута с помощью ИИ

**Запрос:**

```json
{
  "lengthKm": 10.5,
  "elevationGain": 500,
  "coordinates": [
    [55.75, 37.62],
    [55.76, 37.63]
  ],
  "elevationData": [150, 200, 300],
  "lengthMeters": 10500
}
```

**Ответ:**

```json
{
  "analysis": "Детальный анализ маршрута...",
  "stats": {
    "avgSlope": 5.2,
    "maxSlope": 15.8,
    "steepSections": 3,
    "sinuosity": 1.2,
    "minElevation": 150,
    "maxElevation": 650,
    "elevationProfile": "Холмистый"
  },
  "terrainType": "холмистая местность",
  "geographicContext": {
    "countries": ["Россия"],
    "regions": ["Московская область"],
    "areas": ["Раменский район"],
    "localities": ["Москва"],
    "multiRegion": false,
    "multiCountry": false,
    "totalPointsAnalyzed": 3
  },
  "formattedGeoContext": "Страна: Россия. Регион: Московская область..."
}
```

## Переменные окружения

### Backend (.env)

- `OPENROUTER_API_KEY` - API ключ для OpenRouter (обязательно)
- `PORT` - порт сервера (по умолчанию 3001)

## Разработка

### Структура кода

**Backend:**

- `controllers/` - обработчики HTTP запросов
- `services/` - бизнес-логика
- `helpers/` - утилиты и вспомогательные функции
- `routes/` - определение маршрутов
- `types/` - TypeScript интерфейсы

**Frontend:**

- `components/` - React компоненты с модульными стилями
- `helpers/` - утилиты и вспомогательные функции
- `types/` - TypeScript интерфейсы

### Стили

Все стили написаны в SCSS с использованием CSS модулей для изоляции стилей компонентов.

### Типизация

Полная типизация TypeScript для обеспечения безопасности типов и лучшего DX.

## Лицензия

ISC

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Улучшенная конфигурация CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// Проверка наличия API ключа
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY не найден в переменных окружения');
  process.exit(1);
}

// Инициализация Gemini AI с проверкой ключа
let genAI;
try {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
} catch (error) {
  console.error('Ошибка при инициализации Gemini AI:', error);
  process.exit(1);
}

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Шаблон промпта для генерации маршрута
const ROUTE_PROMPT_TEMPLATE = (userPrompt) => `Создай уникальный пешеходный маршрут по Москве на основе следующих параметров:
${userPrompt}

ВАЖНО: Сгенерируй JSON-ответ со следующей структурой, строго соблюдая формат и не добавляя никакого дополнительного текста:

{
  "stages": [
    {
      "name": "Точное название места",
      "type": "Тип места (музей, парк, etc.)",
      "description": "Подробное описание места минимум в 2-3 предложения",
      "address": "Точный адрес в Москве",
      "coordinates": [55.123456, 37.123456],
      "time": "Рекомендуемое время посещения",
      "facts": [
        "Интересный исторический факт 1",
        "Интересный исторический факт 2",
        "Интересный исторический факт 3"
      ],
      "photos": [
        "Описание лучшей точки для фото 1",
        "Описание лучшей точки для фото 2"
      ],
      "routeFromPrevious": {
        "walking": "Подробный пешеходный маршрут от предыдущей точки",
        "transport": "Альтернативный маршрут на общественном транспорте",
        "time": "Время в пути",
        "distance": "Расстояние в км"
      },
      "tips": {
        "weather": "Совет по посещению в разную погоду",
        "crowds": "Информация о загруженности в разное время",
        "money": "Информация о ценах, билетах и т.д."
      }
    }
  ],
  "metadata": {
    "totalTime": "Общее время маршрута",
    "totalDistance": "Общее расстояние",
    "budgetEstimate": "Примерный бюджет",
    "bestFor": ["Категория посетителей 1", "Категория 2"],
    "safetyTips": ["Совет по безопасности 1", "Совет 2"]
  }
}

СТРОГИЕ ТРЕБОВАНИЯ:
1. Генерируй ТОЛЬКО JSON, без вступительного или заключительного текста
2. Используй ТОЛЬКО реальные места в Москве с точными координатами
3. Все текстовые описания должны быть на русском языке
4. Расстояния и времена должны быть реалистичными
5. Учитывай время суток и сезон из параметров маршрута
6. Координаты должны быть точными, с 6 знаками после запятой
7. Каждое место должно иметь все указанные поля
8. Создавай УНИКАЛЬНЫЙ маршрут, а не стандартный туристический`;

// Функция для повторных попыток при ошибках
const retryOperation = async (operation, maxAttempts = 3, initialDelay = 2000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      
      const delay = initialDelay * attempt;
      console.log(`Попытка ${attempt} не удалась. Повторная попытка через ${delay}мс...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Функция для генерации маршрута
const generateRoute = async (userPrompt, temperature = 0.7) => {
  const enhancedPrompt = ROUTE_PROMPT_TEMPLATE(userPrompt);
  
  try {
    // Используем retryOperation для проверки API ключа
    const isKeyValid = await retryOperation(async () => {
      try {
        const testModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const testResult = await testModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Test connection' }]}],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          }
        });
        return true;
      } catch (error) {
        if (error.message?.includes('API key expired') || error.message?.includes('API_KEY_INVALID')) {
          console.error('Проблема с API ключом:', error.message);
          return false;
        }
        throw error;
      }
    }, 3, 1000);

    if (!isKeyValid) {
      throw new Error('API ключ недействителен или истек. Пожалуйста, обновите API ключ.');
    }

    // Используем retryOperation для генерации контента
    const response = await retryOperation(async () => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }]}],
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });

      if (!result || !result.response) {
        throw new Error('Пустой ответ от API');
      }

      return result;
    }, 3, 2000);

    const text = response.response.text();
    console.log('Получен ответ от API длиной:', text.length, 'символов');
    
    // Попытка найти JSON в ответе
    let jsonData;
    try {
      // Сначала пробуем распарсить весь ответ как JSON
      jsonData = JSON.parse(text);
    } catch (e) {
      // Если не получилось, ищем JSON в тексте
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе');
      }
      try {
        jsonData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error('Не удалось распарсить JSON из ответа');
      }
    }

    // Валидация структуры данных
    if (!jsonData.stages || !Array.isArray(jsonData.stages) || jsonData.stages.length === 0) {
      throw new Error('Некорректная структура данных: отсутствует или пуст массив stages');
    }

    // Проверка и дополнение данных
    jsonData.stages = jsonData.stages.map((stage, index) => ({
      name: stage.name || `Точка ${index + 1}`,
      type: stage.type || 'Место',
      description: stage.description || 'Описание отсутствует',
      address: stage.address || 'Адрес уточняется',
      coordinates: Array.isArray(stage.coordinates) && stage.coordinates.length === 2 
        ? stage.coordinates 
        : [55.753215, 37.622504], // Координаты центра Москвы по умолчанию
      time: stage.time || '30 минут',
      facts: Array.isArray(stage.facts) ? stage.facts : [],
      photos: Array.isArray(stage.photos) ? stage.photos : [],
      routeFromPrevious: {
        walking: stage.routeFromPrevious?.walking || '',
        transport: stage.routeFromPrevious?.transport || '',
        time: stage.routeFromPrevious?.time || '',
        distance: stage.routeFromPrevious?.distance || ''
      },
      tips: {
        weather: stage.tips?.weather || '',
        crowds: stage.tips?.crowds || '',
        money: stage.tips?.money || ''
      }
    }));

    // Проверка и дополнение метаданных
    if (!jsonData.metadata) {
      jsonData.metadata = {};
    }

    jsonData.metadata = {
      totalTime: jsonData.metadata.totalTime || 'Не указано',
      totalDistance: jsonData.metadata.totalDistance || 'Не указано',
      budgetEstimate: jsonData.metadata.budgetEstimate || 'Не указано',
      bestFor: Array.isArray(jsonData.metadata.bestFor) ? jsonData.metadata.bestFor : [],
      safetyTips: Array.isArray(jsonData.metadata.safetyTips) ? jsonData.metadata.safetyTips : []
    };

    return jsonData;
  } catch (error) {
    console.error('Ошибка при генерации маршрута:', error);
    throw new Error(`Ошибка при генерации маршрута: ${error.message}`);
  }
};

// Основной маршрут для генерации
app.post('/generate-route', async (req, res) => {
  console.log('Получен запрос на генерацию маршрута');
  
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ 
      error: 'Необходимо предоставить параметры для генерации маршрута'
    });
  }

  try {
    console.log('Начинаем генерацию маршрута с параметрами:', JSON.stringify(prompt, null, 2));
    
    let routeData;
    try {
      // Первая попытка генерации
      routeData = await generateRoute(prompt, 0.7);
    } catch (firstError) {
      console.log('Первая попытка не удалась, пробуем с другими параметрами...');
      try {
        // Вторая попытка с измененными параметрами
        routeData = await generateRoute(prompt, 0.5);
      } catch (secondError) {
        console.log('Вторая попытка не удалась, последняя попытка...');
        // Последняя попытка с минимальной температурой
        routeData = await generateRoute(prompt, 0.3);
      }
    }

    // Проверяем структуру данных
    if (!routeData.stages || !Array.isArray(routeData.stages)) {
      throw new Error('Некорректная структура данных: отсутствует массив stages');
    }

    if (routeData.stages.length === 0) {
      throw new Error('Массив stages пуст');
    }

    // Проверяем каждый этап маршрута
    routeData.stages = routeData.stages.map((stage, index) => {
      console.log(`Проверка этапа ${index + 1}:`, stage.name);
      
      if (!stage.name || !stage.coordinates) {
        throw new Error(`Отсутствуют обязательные поля в этапе ${index + 1}`);
      }

      // Проверяем координаты
      if (!Array.isArray(stage.coordinates) || 
          stage.coordinates.length !== 2 ||
          typeof stage.coordinates[0] !== 'number' ||
          typeof stage.coordinates[1] !== 'number') {
        throw new Error(`Некорректные координаты в этапе ${index + 1}`);
      }

      return {
        name: stage.name,
        type: stage.type || 'Место',
        description: stage.description || 'Описание отсутствует',
        address: stage.address || '',
        coordinates: stage.coordinates,
        time: stage.time || '30 минут',
        facts: Array.isArray(stage.facts) ? stage.facts : [],
        photos: Array.isArray(stage.photos) ? stage.photos : [],
        routeFromPrevious: {
          walking: stage.routeFromPrevious?.walking || '',
          transport: stage.routeFromPrevious?.transport || '',
          time: stage.routeFromPrevious?.time || '',
          distance: stage.routeFromPrevious?.distance || ''
        },
        tips: {
          weather: stage.tips?.weather || '',
          crowds: stage.tips?.crowds || '',
          money: stage.tips?.money || ''
        }
      };
    });

    // Проверяем метаданные
    if (!routeData.metadata) {
      throw new Error('Отсутствуют метаданные маршрута');
    }

    routeData.metadata = {
      totalTime: routeData.metadata.totalTime || 'Не указано',
      totalDistance: routeData.metadata.totalDistance || 'Не указано',
      budgetEstimate: routeData.metadata.budgetEstimate || 'Не указано',
      bestFor: Array.isArray(routeData.metadata.bestFor) ? routeData.metadata.bestFor : [],
      safetyTips: Array.isArray(routeData.metadata.safetyTips) ? routeData.metadata.safetyTips : []
    };

    console.log('Маршрут успешно сгенерирован и проверен');
    res.json(routeData);
  } catch (error) {
    console.error('Ошибка при генерации маршрута:', error);
    res.status(500).json({
      error: 'Не удалось сгенерировать маршрут',
      message: error.message,
      details: 'Пожалуйста, попробуйте еще раз или измените параметры маршрута'
    });
  }
});

// Тестовый endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает' });
});

// Обработка OPTIONS запросов
app.options('*', cors());

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Тестовый адрес: http://localhost:${port}`);
});

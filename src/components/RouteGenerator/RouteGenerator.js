import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaClock, FaWalking, FaTheaterMasks, FaTree, FaLandmark, 
  FaUtensils, FaMagic, FaChevronRight, FaChevronLeft,
  FaCamera, FaShoppingBag, FaHistory, FaMusic, FaPalette,
  FaGlassCheers, FaBookOpen, FaStreetView, FaAccessibleIcon, 
  FaBaby, FaUserClock, FaSun, FaMoon, FaMapMarkerAlt,
  FaDirections, FaSubway, FaInfoCircle, FaUmbrella,
  FaMobileAlt, FaTicketAlt, FaBolt, FaRegCompass,
  FaRoute, FaCoffee, FaRegClock, FaMapMarkedAlt
} from 'react-icons/fa';
import './RouteGenerator.css';

const RouteGenerator = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    duration: '',
    categories: [],
    pace: '',
    budget: '',
    preferences: '',
    accessibility: '',
    timeOfDay: '',
    season: ''
  });
  const [generatedRoute, setGeneratedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const categories = [
    { id: 'culture', icon: <FaTheaterMasks />, label: 'Культура и искусство' },
    { id: 'nature', icon: <FaTree />, label: 'Природа и парки' },
    { id: 'architecture', icon: <FaLandmark />, label: 'Архитектура' },
    { id: 'food', icon: <FaUtensils />, label: 'Рестораны и кафе' },
    { id: 'history', icon: <FaHistory />, label: 'Исторические места' },
    { id: 'photo', icon: <FaCamera />, label: 'Фотогеничные места' },
    { id: 'shopping', icon: <FaShoppingBag />, label: 'Шоппинг' },
    { id: 'entertainment', icon: <FaGlassCheers />, label: 'Развлечения' },
    { id: 'art', icon: <FaPalette />, label: 'Галереи и выставки' },
    { id: 'music', icon: <FaMusic />, label: 'Музыкальные места' },
    { id: 'literary', icon: <FaBookOpen />, label: 'Литературные места' },
    { id: 'hidden', icon: <FaStreetView />, label: 'Скрытые жемчужины' }
  ];

  const durations = [
    { value: '2', label: '2 часа' },
    { value: '3', label: '3 часа' },
    { value: '4', label: '4 часа' },
    { value: '6', label: '6 часов' },
    { value: '8', label: 'Весь день' }
  ];

  const paces = [
    { value: 'relaxed', label: 'Расслабленный', description: 'Много остановок, неспешные прогулки' },
    { value: 'moderate', label: 'Умеренный', description: 'Комфортный темп с перерывами' },
    { value: 'active', label: 'Активный', description: 'Быстрый темп, минимум остановок' }
  ];

  const budgets = [
    { value: 'budget', label: 'Бюджетный', description: 'До 1000₽ на человека' },
    { value: 'moderate', label: 'Средний', description: '1000-3000₽ на человека' },
    { value: 'luxury', label: 'Премиум', description: 'От 3000₽ на человека' }
  ];

  const timeOfDay = [
    { value: 'morning', label: 'Утро', description: '6:00 - 12:00' },
    { value: 'afternoon', label: 'День', description: '12:00 - 18:00' },
    { value: 'evening', label: 'Вечер', description: '18:00 - 23:00' }
  ];

  const seasons = [
    { value: 'summer', label: 'Лето' },
    { value: 'autumn', label: 'Осень' },
    { value: 'winter', label: 'Зима' },
    { value: 'spring', label: 'Весна' }
  ];

  const accessibility = [
    { value: 'standard', label: 'Стандартный' },
    { value: 'wheelchair', label: 'Доступно для колясок' },
    { value: 'elderly', label: 'Подходит для пожилых' },
    { value: 'children', label: 'С детьми' }
  ];

  const initMap = useCallback(() => {
    if (!window.ymaps || !generatedRoute) return;

    try {
      const mapElement = document.getElementById('map');
      if (!mapElement || !mapElement.offsetWidth) {
        setTimeout(initMap, 100);
        return;
      }

      if (map) {
        map.destroy();
      }

      const newMap = new window.ymaps.Map('map', {
        center: [55.753215, 37.622504],
        zoom: 12
      });
      setMap(newMap);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Ошибка при инициализации карты');
    }
  }, [generatedRoute, map]);

  useEffect(() => {
    if (generatedRoute && step === 6 && !isMapScriptLoaded) {
      const loadYandexMaps = () => {
        if (window.ymaps) {
          setIsMapScriptLoaded(true);
          window.ymaps.ready(initMap);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=4527e6e0-3b7e-4ade-9b8f-34ac356e812c&lang=ru_RU`;
        script.async = true;
        script.onerror = () => {
          setMapError('Ошибка при загрузке карты');
        };
        script.onload = () => {
          setIsMapScriptLoaded(true);
          window.ymaps.ready(initMap);
        };
        document.body.appendChild(script);
      };

      loadYandexMaps();
    }

    return () => {
      if (map) {
        map.destroy();
        setMap(null);
      }
    };
  }, [initMap, map, generatedRoute, step, isMapScriptLoaded]);

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.duration !== '';
      case 2:
        return formData.categories.length > 0;
      case 3:
        return formData.pace !== '';
      case 4:
        return formData.accessibility !== '';
      case 5:
        return formData.timeOfDay !== '' && formData.season !== '';
      case 6:
        return formData.categories.includes('food') ? formData.budget !== '' : true;
      case 7:
        return formData.preferences.length >= 10;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMapError(null);
    setError(null);
    setLoadingStep(0);

    const loadingSteps = [
      "Анализируем ваши предпочтения...",
      "Подбираем интересные места...",
      "Оптимизируем маршрут...",
      "Собираем информацию о достопримечательностях...",
      "Проверяем актуальность данных...",
      "Формируем детальное описание...",
      "Завершаем генерацию маршрута..."
    ];

    const loadingInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingSteps.length);
    }, 3000);

    try {
      console.log('Начинаем генерацию маршрута...', formData);
      const routePrompt = `Создай детальный пешеходный маршрут по Москве со следующими параметрами:

### Основные параметры:
${Object.entries({
  '⌚ Длительность': `${formData.duration} часа`,
  '🎯 Интересы': formData.categories.map(cat => categories.find(c => c.id === cat)?.label).join(', '),
  '🚶 Темп': paces.find(p => p.value === formData.pace)?.label,
  '🌆 Время суток': timeOfDay.find(t => t.value === formData.timeOfDay)?.label,
  '🍂 Сезон': seasons.find(s => s.value === formData.season)?.label,
  '♿ Доступность': accessibility.find(a => a.value === formData.accessibility)?.label,
  '💰 Бюджет': formData.budget ? budgets.find(b => b.value === formData.budget)?.label : 'Не указан',
  '💭 Пожелания': formData.preferences || 'Нет дополнительных пожеланий'
}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

### Требования к маршруту:
1. Разбей маршрут на 5-8 этапов в зависимости от длительности
2. Для каждого этапа укажи:
   - Точное название места и его тип (достопримечательность, кафе, музей и т.д.)
   - Подробное описание места (3-5 предложений)
   - Историческую справку или интересные факты
   - Лучшие точки для фотографий
   - Рекомендации по времени посещения
   - Особенности сезона и времени суток
3. Между этапами добавь:
   - Пешеходный маршрут с ориентирами
   - Время в пути и расстояние
   - Альтернативные варианты (на транспорте, если нужно)
4. Включи дополнительные разделы:
   - Локации для отдыха
   - Туалеты и зоны Wi-Fi
   - Проблемные участки маршрута
   - Рекомендации по одежде и обуви

### Формат ответа в виде JSON:
{
  "stages": [
    {
      "name": "Название",
      "type": "Тип места",
      "description": "Детальное описание...",
      "address": "Точный адрес",
      "coordinates": [55.12345, 37.12345],
      "time": "Рекомендуемое время посещения",
      "facts": ["Интересный факт 1", "Факт 2"],
      "photos": ["Описание фотоспота 1", "Совет по съемке 2"],
      "routeFromPrevious": {
        "walking": "Пеший маршрут...",
        "transport": "Вариант на транспорте...",
        "time": "15 минут",
        "distance": "1.2 км"
      },
      "tips": {
        "weather": "Рекомендации по погоде...",
        "crowds": "Загруженность места...",
        "money": "Средние цены..."
      }
    }
  ],
  "metadata": {
    "totalTime": "5 часов",
    "totalDistance": "7.8 км",
    "budgetEstimate": "2500-3000 руб.",
    "bestFor": ["Фотографы", "Историки", "Семьи"],
    "safetyTips": ["Избегать темных переулков...", "Не носить много наличных"]
  }
}

Важно:
- Только валидный JSON без Markdown
- Реальные существующие адреса
- Координаты с точностью до 5 знаков
- Уникальные факты для каждого места
- Практичные советы для туристов
- Учет сезонных особенностей (зимой - катки, летом - фонтаны)
- Альтернативные варианты для плохой погоды
- Логичная последовательность этапов`;

      console.log('Отправляем запрос на сервер...');

      const response = await fetch('http://localhost:3001/generate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ prompt: routePrompt })
      });

      console.log('Получен ответ от сервера, статус:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ответ сервера:', errorData);
        
        // Проверяем, есть ли частичные данные в ответе
        if (errorData.points && Array.isArray(errorData.points) && errorData.points.length > 0) {
          console.log('Получены частичные данные маршрута:', errorData.points);
          
          // Преобразуем частичные данные в формат для отображения
          const formattedRoute = {
            points: errorData.points.map(point => ({
              name: point.name || 'Без названия',
              type: point.type || 'Место',
              description: point.description || '',
              duration: point.duration || '30 минут',
              coordinates: point.coordinates || [55.753215, 37.622504],
              route: '',
              transport: '',
              sights: '',
              tips: '',
              photos: '',
              weatherAlternative: '',
              apps: [
                { name: "Яндекс.Карты", description: "Для навигации" },
                { name: "Яндекс.Метро", description: "Для поездок на метро" }
              ]
            })),
            summary: {
              totalTime: 'Примерно ' + errorData.points.reduce((acc, point) => 
                acc + parseInt(point.duration) || 0, 0) + ' минут',
              distance: 'Расчет недоступен',
              budget: 'Расчет недоступен'
            }
          };
          
          setGeneratedRoute(formattedRoute);
          setStep(8);
          setError({
            title: 'Маршрут создан частично',
            message: 'Сервер вернул базовый маршрут без детальной информации.',
            details: 'Технические детали ошибки: ' + (errorData.rawResponse || 'Неизвестная ошибка'),
            suggestion: 'Вы можете использовать этот базовый маршрут или попробовать сгенерировать новый позже.'
          });
          return;
        }
        
        throw new Error(`Ошибка сервера ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Полученные данные:', data);

      if (!data) {
        throw new Error('Получен пустой ответ от сервера');
      }

      if (!data.stages || !Array.isArray(data.stages) || data.stages.length === 0) {
        console.error('Некорректный формат данных:', data);
        
        // Проверяем наличие points в ответе как запасной вариант
        if (data.points && Array.isArray(data.points) && data.points.length > 0) {
          const formattedRoute = {
            points: data.points.map(point => ({
              name: point.name || 'Без названия',
              type: point.type || 'Место',
              description: point.description || '',
              duration: point.duration || '30 минут',
              coordinates: point.coordinates || [55.753215, 37.622504],
              route: '',
              transport: '',
              sights: '',
              tips: '',
              photos: '',
              weatherAlternative: '',
              apps: [
                { name: "Яндекс.Карты", description: "Для навигации" },
                { name: "Яндекс.Метро", description: "Для поездок на метро" }
              ]
            })),
            summary: {
              totalTime: 'Примерно ' + data.points.reduce((acc, point) => 
                acc + parseInt(point.duration) || 0, 0) + ' минут',
              distance: 'Расчет недоступен',
              budget: 'Расчет недоступен'
            }
          };
          
          setGeneratedRoute(formattedRoute);
          setStep(8);
          setError({
            title: 'Маршрут создан частично',
            message: 'Сгенерирован базовый маршрут без дополнительной информации.',
            details: 'Сервер вернул данные в упрощенном формате.',
            suggestion: 'Вы можете использовать этот базовый маршрут или попробовать сгенерировать новый позже.'
          });
          return;
        }
        
        throw new Error('Сервер вернул некорректный формат данных. Пожалуйста, попробуйте еще раз.');
      }

      // Преобразуем полученные данные в формат для отображения
      const formattedRoute = {
        points: data.stages.map(stage => {
          if (!stage.name || !stage.coordinates) {
            console.error('Некорректные данные этапа:', stage);
            throw new Error('Один из этапов маршрута содержит некорректные данные');
          }
          
          return {
            name: stage.name,
            type: stage.type || 'Место',
            description: stage.description || '',
            duration: stage.time || '30 минут',
            coordinates: stage.coordinates,
            route: stage.routeFromPrevious?.walking || '',
            transport: stage.routeFromPrevious?.transport || '',
            sights: Array.isArray(stage.facts) ? stage.facts.join('\n') : '',
            tips: [
              stage.tips?.weather,
              stage.tips?.crowds,
              stage.tips?.money
            ].filter(Boolean).join('\n'),
            photos: Array.isArray(stage.photos) ? stage.photos.join('\n') : '',
            weatherAlternative: stage.tips?.weather || '',
            apps: [
              { name: "Яндекс.Карты", description: "Для навигации" },
              { name: "Яндекс.Метро", description: "Для поездок на метро" }
            ]
          };
        }),
        summary: {
          totalTime: data.metadata?.totalTime || 'Не указано',
          distance: data.metadata?.totalDistance || 'Не указано',
          budget: data.metadata?.budgetEstimate || 'Не указано'
        },
        rawResponse: data
      };

      console.log('Маршрут успешно создан:', formattedRoute);
      setGeneratedRoute(formattedRoute);
      setStep(8);
    } catch (error) {
      console.error('Ошибка при генерации маршрута:', error);
      setError({
        title: 'Ошибка при создании маршрута',
        message: 'К сожалению, произошла ошибка при генерации маршрута.',
        details: error.message,
        suggestion: 'Пожалуйста, попробуйте еще раз или обратитесь в поддержку.'
      });
    } finally {
      clearInterval(loadingInterval);
      setIsLoading(false);
    }
  };

  const handleShowOnMap = () => {
    if (!map || !generatedRoute) return;

    map.geoObjects.removeAll();

    const multiRoute = new window.ymaps.multiRouter.MultiRoute({
      referencePoints: generatedRoute.points.map(point => point.coordinates),
      params: {
        routingMode: 'pedestrian'
      }
    }, {
      boundsAutoApply: true,
      wayPointStartIconColor: "#1E88E5",
      wayPointFinishIconColor: "#E53935",
      routeActiveStrokeColor: "#1E88E5",
      routeActiveStrokeWidth: 4
    });

    map.geoObjects.add(multiRoute);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content duration-step">
            <h2>Выберите продолжительность маршрута</h2>
            <div className="duration-options">
              {durations.map(duration => (
                <button
                  key={duration.value}
                  className={`duration-btn ${formData.duration === duration.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('duration', duration.value)}
                >
                  <FaClock />
                  <span>{duration.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content categories-step">
            <h2>Что вы хотите посмотреть?</h2>
            <p className="step-description">Выберите минимум одну категорию</p>
            <div className="categories-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${formData.categories.includes(category.id) ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content pace-step">
            <h2>Выберите темп прогулки</h2>
            <div className="option-cards">
              {paces.map(pace => (
                <div
                  key={pace.value}
                  className={`option-card ${formData.pace === pace.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('pace', pace.value)}
                >
                  <h3>
                    {pace.value === 'relaxed' && <FaWalking />}
                    {pace.value === 'moderate' && <FaRegCompass />}
                    {pace.value === 'active' && <FaRoute />}
                    {pace.label}
                  </h3>
                  <p>{pace.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content accessibility-step">
            <h2>Выберите тип доступности</h2>
            <div className="option-cards">
              {accessibility.map(option => (
                <div
                  key={option.value}
                  className={`option-card ${formData.accessibility === option.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('accessibility', option.value)}
                >
                  <h3>
                    {option.value === 'wheelchair' && <FaAccessibleIcon />}
                    {option.value === 'children' && <FaBaby />}
                    {option.value === 'elderly' && <FaUserClock />}
                    {option.value === 'standard' && <FaWalking />}
                    {option.label}
                  </h3>
                  <p>{option.description || 'Стандартный маршрут без специальных требований'}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content time-season-step">
            <h2>Выберите время и сезон</h2>
            <div className="option-cards">
              <h3>Время суток</h3>
              {timeOfDay.map(time => (
                <div
                  key={time.value}
                  className={`option-card ${formData.timeOfDay === time.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('timeOfDay', time.value)}
                >
                  <h3>
                    {time.value === 'morning' && <FaSun />}
                    {time.value === 'afternoon' && <FaClock />}
                    {time.value === 'evening' && <FaMoon />}
                    {time.label}
                  </h3>
                  <p>{time.description}</p>
                </div>
              ))}
            </div>
            <div className="option-cards" style={{ marginTop: '2rem' }}>
              <h3>Сезон</h3>
              {seasons.map(season => (
                <div
                  key={season.value}
                  className={`option-card ${formData.season === season.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('season', season.value)}
                >
                  <h3>{season.label}</h3>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return formData.categories.includes('food') ? (
          <div className="step-content budget-step">
            <h2>Выберите бюджет</h2>
            <div className="option-cards">
              {budgets.map(budget => (
                <div
                  key={budget.value}
                  className={`option-card ${formData.budget === budget.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('budget', budget.value)}
                >
                  <h3>
                    <FaCoffee />
                    {budget.label}
                  </h3>
                  <p>{budget.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : handleNext();

      case 7:
        return (
          <div className="step-content preferences-step">
            <h2>Дополнительные пожелания</h2>
            <p className="step-description">Опишите ваши предпочтения подробнее (минимум 10 символов)</p>
            <textarea
              className="preferences-input"
              value={formData.preferences}
              onChange={(e) => handleInputChange('preferences', e.target.value)}
              placeholder="Например: Интересуюсь историей архитектуры, хотел бы увидеть необычные дворики и узнать интересные факты о зданиях..."
              rows={6}
            />
          </div>
        );

      case 8:
        return (
          <div className="step-content result-step">
            {isLoading ? (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <div className="loading-message">
                  Генерируем ваш уникальный маршрут
                </div>
                <div className="loading-steps">
                  {[
                    "Анализируем ваши предпочтения...",
                    "Подбираем интересные места...",
                    "Оптимизируем маршрут...",
                    "Собираем информацию о достопримечательностях...",
                    "Проверяем актуальность данных...",
                    "Формируем детальное описание...",
                    "Завершаем генерацию маршрута..."
                  ].map((step, index) => (
                    <div
                      key={index}
                      className={`loading-step ${index === loadingStep ? 'active' : ''}`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="error-message">
                <h3>{error.title}</h3>
                <p>{error.message}</p>
                <p>{error.suggestion}</p>
                <div className="error-details">
                  {error.details}
                </div>
              </div>
            ) : generatedRoute && (
              <div className="generated-route">
                <h2>Ваш маршрут готов!</h2>
                {generatedRoute.points.map((point, index) => (
                  <div key={index} className="route-stage">
                    <div className="stage-header">
                      <div className="stage-number">{index + 1}</div>
                      <div className="stage-title">
                        <h3>{point.name}</h3>
                        <div className="stage-time">
                          <FaRegClock />
                          <span>{point.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="stage-content">
                      {point.description && (
                        <div className="info-section">
                          <h4><FaMapMarkerAlt /> Описание места</h4>
                          <p>{point.description}</p>
                        </div>
                      )}
                      {point.route && (
                        <div className="info-section">
                          <h4><FaDirections /> Как добраться</h4>
                          <div className="info-list">
                            {point.route.split('\n').map((item, i) => (
                              <div key={i} className="info-item">
                                <FaMapMarkedAlt className="info-item-icon" />
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.transport && (
                        <div className="info-section">
                          <h4><FaSubway /> Транспорт</h4>
                          <div className="info-list">
                            {point.transport.split('\n').map((item, i) => (
                              <div key={i} className="info-item">
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.sights && (
                        <div className="info-section">
                          <h4><FaLandmark /> Достопримечательности</h4>
                          <div className="info-list">
                            {point.sights.split('\n').map((item, i) => (
                              <div key={i} className="info-item">
                                <FaInfoCircle className="info-item-icon" />
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.foodSpots && (
                        <div className="info-section">
                          <h4><FaUtensils /> Где поесть</h4>
                          <div className="info-list">
                            {point.foodSpots.split('\n').map((item, i) => (
                              <div key={i} className="info-item">
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.tips && (
                        <div className="info-section">
                          <h4><FaBolt /> Советы</h4>
                          <div className="info-list">
                            {point.tips.split('\n').map((item, i) => (
                              <div key={i} className="info-item">
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.weatherAlternative && (
                        <div className="weather-alternative">
                          <h4><FaUmbrella /> План Б (при плохой погоде)</h4>
                          <div className="alternative-list">
                            {point.weatherAlternative.split('\n').map((item, i) => (
                              <div key={i} className="alternative-item">
                                <div className="info-item-content">{item}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {point.apps && (
                        <div className="useful-apps">
                          {point.apps.map((app, i) => (
                            <div key={i} className="app-item">
                              <FaMobileAlt className="app-icon" />
                              <div className="app-name">{app.name}</div>
                              <div className="app-description">{app.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {generatedRoute.summary && (
                  <div className="route-summary">
                    <div className="summary-header">Итоги маршрута</div>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <div className="summary-item-label">Общее время</div>
                        <div className="summary-item-value">{generatedRoute.summary.totalTime}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-item-label">Расстояние</div>
                        <div className="summary-item-value">{generatedRoute.summary.distance}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-item-label">Бюджет</div>
                        <div className="summary-item-value">{generatedRoute.summary.budget}</div>
                      </div>
                    </div>
                  </div>
                )}
                <a
                  href={`https://yandex.ru/maps/?rtext=${generatedRoute.points
                    .map(point => point.coordinates.join(','))
                    .join('~')}&rtt=pd`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yandex-maps-link"
                >
                  <FaMapMarkedAlt /> Открыть маршрут в Яндекс.Картах
                </a>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="route-generator">
      <div className="progress-bar">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(stepNumber => (
          <div
            key={stepNumber}
            className={`progress-step ${step >= stepNumber ? 'active' : ''} ${step === stepNumber ? 'current' : ''}`}
          >
            {stepNumber}
          </div>
        ))}
      </div>

      {renderStep()}

      <div className="form-navigation">
        {step > 1 && step < 8 && (
          <button className="nav-btn back" onClick={handleBack}>
            <FaChevronLeft /> Назад
          </button>
        )}
        {step < 7 ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Далее <FaChevronRight />
          </button>
        ) : step === 7 ? (
          <button
            className="nav-btn generate"
            onClick={handleSubmit}
            disabled={!isStepValid()}
          >
            Создать маршрут <FaMagic />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default RouteGenerator; 
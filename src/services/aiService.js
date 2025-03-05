import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { saveRoute } from './routeService';
import { getPlacesByType } from './placesService';

const AI_REQUESTS_COLLECTION = 'aiRequests';
const AI_GENERATED_ROUTES_COLLECTION = 'aiGeneratedRoutes';

// Функция для генерации маршрута с помощью нейросети
export const generateRoute = async (preferences) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Сохраняем запрос пользователя
    const requestData = {
      userId: auth.currentUser.uid,
      preferences,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    const requestRef = await addDoc(collection(db, AI_REQUESTS_COLLECTION), requestData);

    // Здесь будет вызов API нейросети
    // Для демонстрации создадим имитацию ответа нейросети
    const generatedRoute = await mockAIRouteGeneration(preferences);

    // Обновляем статус запроса
    const aiGeneratedRouteData = {
      requestId: requestRef.id,
      userId: auth.currentUser.uid,
      route: generatedRoute,
      createdAt: serverTimestamp()
    };

    // Сохраняем сгенерированный маршрут
    const generatedRouteRef = await addDoc(
      collection(db, AI_GENERATED_ROUTES_COLLECTION), 
      aiGeneratedRouteData
    );

    // Возвращаем результат
    return {
      id: generatedRouteRef.id,
      ...aiGeneratedRouteData,
      route: generatedRoute
    };
  } catch (error) {
    console.error('Error generating route:', error);
    throw error;
  }
};

// Функция для сохранения сгенерированного маршрута в коллекцию маршрутов пользователя
export const saveGeneratedRoute = async (generatedRouteId, routeData = {}) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Получаем сгенерированный маршрут
    const generatedRouteRef = doc(db, AI_GENERATED_ROUTES_COLLECTION, generatedRouteId);
    const generatedRouteSnap = await getDoc(generatedRouteRef);

    if (!generatedRouteSnap.exists()) {
      throw new Error('Сгенерированный маршрут не найден');
    }

    const generatedRouteData = generatedRouteSnap.data();

    // Проверяем, что пользователь является владельцем маршрута
    if (generatedRouteData.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на сохранение этого маршрута');
    }

    // Подготавливаем данные для сохранения
    const routeToSave = {
      ...generatedRouteData.route,
      ...routeData,
      isAIGenerated: true,
      aiGeneratedRouteId: generatedRouteId
    };

    // Сохраняем маршрут
    const savedRoute = await saveRoute(routeToSave);

    return savedRoute;
  } catch (error) {
    console.error('Error saving generated route:', error);
    throw error;
  }
};

// Получение истории сгенерированных маршрутов пользователя
export const getUserGeneratedRoutes = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const routesQuery = query(
      collection(db, AI_GENERATED_ROUTES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(routesQuery);
    const routes = [];

    querySnapshot.forEach((doc) => {
      routes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return routes;
  } catch (error) {
    console.error('Error getting user generated routes:', error);
    throw error;
  }
};

// Имитация генерации маршрута нейросетью
// В реальном приложении здесь будет вызов API нейросети
const mockAIRouteGeneration = async (preferences) => {
  // Имитируем задержку запроса к API
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Получаем случайные места для маршрута
  let places = [];
  
  try {
    // Получаем места в зависимости от предпочтений пользователя
    if (preferences.includeAttractions) {
      const attractionsResult = await getPlacesByType('attraction', null, 5);
      places = [...places, ...attractionsResult.places];
    }
    
    if (preferences.includeCafes) {
      const cafesResult = await getPlacesByType('cafe', null, 3);
      places = [...places, ...cafesResult.places];
    }
    
    if (preferences.includeViewpoints) {
      const viewpointsResult = await getPlacesByType('viewpoint', null, 2);
      places = [...places, ...viewpointsResult.places];
    }
  } catch (error) {
    console.error('Error fetching places for route:', error);
    // Если не удалось получить места, создаем заглушки
    places = generateMockPlaces(preferences);
  }

  // Если мест недостаточно, добавляем заглушки
  if (places.length < 3) {
    const additionalPlaces = generateMockPlaces(preferences, 5 - places.length);
    places = [...places, ...additionalPlaces];
  }

  // Создаем маршрут на основе полученных мест
  const route = {
    title: generateRouteTitle(preferences),
    description: generateRouteDescription(preferences, places),
    difficulty: preferences.difficulty || 'medium',
    distance: Math.round((Math.random() * 5 + 2) * 10) / 10, // 2-7 км
    duration: Math.round((Math.random() * 3 + 1) * 10) / 10, // 1-4 часа
    startPoint: places[0]?.name || 'Начальная точка',
    endPoint: places[places.length - 1]?.name || 'Конечная точка',
    isPublic: false,
    places: places.map(place => ({
      id: place.id,
      name: place.name,
      type: place.type,
      description: place.description,
      location: place.location,
      imageUrl: place.imageUrls?.[0] || null
    })),
    routePoints: generateRoutePoints(places),
    tags: generateTags(preferences)
  };

  return route;
};

// Генерация заголовка маршрута
const generateRouteTitle = (preferences) => {
  const themes = [
    'Исторический маршрут',
    'Живописный маршрут',
    'Культурный маршрут',
    'Гастрономический тур',
    'Архитектурный маршрут',
    'Панорамный маршрут',
    'Романтическая прогулка',
    'Семейный маршрут',
    'Приключенческий маршрут',
    'Фотографический маршрут'
  ];
  
  const locations = [
    'по центру города',
    'по старому городу',
    'по набережной',
    'по паркам',
    'по историческим местам',
    'по скрытым уголкам',
    'по живописным улочкам',
    'с видом на город',
    'по знаковым местам',
    'для знакомства с городом'
  ];
  
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  return `${theme} ${location}`;
};

// Генерация описания маршрута
const generateRouteDescription = (preferences, places) => {
  const intros = [
    'Этот маршрут позволит вам познакомиться с',
    'Отличный способ увидеть',
    'Прекрасная возможность исследовать',
    'Идеальный маршрут для знакомства с',
    'Увлекательное путешествие по'
  ];
  
  const highlights = [
    'историческими достопримечательностями',
    'культурными объектами',
    'живописными видами',
    'уютными кафе',
    'архитектурными шедеврами',
    'скрытыми жемчужинами',
    'знаковыми местами',
    'аутентичной атмосферой'
  ];
  
  const conclusions = [
    'Маршрут подходит для любого времени года.',
    'Лучшее время для прогулки - утро или вечер.',
    'Рекомендуется комфортная обувь для ходьбы.',
    'По пути вы найдете множество мест для отдыха.',
    'Маршрут можно пройти за один день.',
    'Возьмите с собой камеру для красивых фотографий.'
  ];
  
  const intro = intros[Math.floor(Math.random() * intros.length)];
  const highlight = highlights[Math.floor(Math.random() * highlights.length)];
  const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];
  
  let placesDescription = '';
  if (places.length > 0) {
    placesDescription = ' Вы посетите ' + places.slice(0, 3).map(p => p.name).join(', ') + 
      (places.length > 3 ? ' и другие интересные места.' : '.');
  }
  
  return `${intro} ${highlight}.${placesDescription} ${conclusion}`;
};

// Генерация точек маршрута
const generateRoutePoints = (places) => {
  // Базовые координаты (центр города)
  const baseLatitude = 55.7558;
  const baseLongitude = 37.6173;
  
  const points = [];
  
  // Если есть реальные места с координатами, используем их
  const placesWithLocation = places.filter(place => place.location);
  
  if (placesWithLocation.length > 0) {
    placesWithLocation.forEach(place => {
      points.push({
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        name: place.name,
        placeId: place.id
      });
    });
  } else {
    // Иначе генерируем случайные точки
    const numPoints = Math.floor(Math.random() * 5) + 5; // 5-10 точек
    
    for (let i = 0; i < numPoints; i++) {
      // Генерируем случайное смещение от базовых координат
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;
      
      points.push({
        latitude: baseLatitude + latOffset,
        longitude: baseLongitude + lngOffset,
        name: `Точка ${i + 1}`,
        placeId: null
      });
    }
  }
  
  return points;
};

// Генерация тегов для маршрута
const generateTags = (preferences) => {
  const allTags = [
    'история', 'архитектура', 'природа', 'искусство', 'еда', 'кафе',
    'музеи', 'парки', 'виды', 'фотография', 'прогулка', 'культура',
    'достопримечательности', 'местная кухня', 'отдых', 'развлечения'
  ];
  
  // Выбираем случайные теги
  const numTags = Math.floor(Math.random() * 4) + 3; // 3-6 тегов
  const tags = [];
  
  // Добавляем теги на основе предпочтений
  if (preferences.includeAttractions) tags.push('достопримечательности');
  if (preferences.includeCafes) tags.push('кафе', 'еда');
  if (preferences.includeViewpoints) tags.push('виды', 'фотография');
  
  // Добавляем случайные теги до нужного количества
  while (tags.length < numTags) {
    const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(randomTag)) {
      tags.push(randomTag);
    }
  }
  
  return tags;
};

// Генерация заглушек мест для маршрута
const generateMockPlaces = (preferences, count = 5) => {
  const placeTypes = [];
  
  if (preferences.includeAttractions) placeTypes.push('attraction');
  if (preferences.includeCafes) placeTypes.push('cafe');
  if (preferences.includeViewpoints) placeTypes.push('viewpoint');
  
  // Если ничего не выбрано, добавляем все типы
  if (placeTypes.length === 0) {
    placeTypes.push('attraction', 'cafe', 'viewpoint');
  }
  
  const attractionNames = [
    'Исторический музей', 'Центральный парк', 'Старинная башня',
    'Художественная галерея', 'Национальный театр', 'Городская площадь',
    'Древний собор', 'Памятник основателям города', 'Археологический музей'
  ];
  
  const cafeNames = [
    'Кафе "Уютное"', 'Ресторан "Панорама"', 'Кофейня "Ароматная"',
    'Бистро "У реки"', 'Кондитерская "Сладкоежка"', 'Чайная "Восточная"',
    'Пекарня "Свежий хлеб"', 'Кафе-мороженое "Холодок"', 'Бар "Вечерний"'
  ];
  
  const viewpointNames = [
    'Смотровая площадка "Высота"', 'Панорамный холм', 'Мост с видом на реку',
    'Башня с обзором 360°', 'Видовая терраса', 'Горная вершина',
    'Набережная с видом на закат', 'Парковая возвышенность', 'Крыша небоскреба'
  ];
  
  const places = [];
  
  for (let i = 0; i < count; i++) {
    const type = placeTypes[Math.floor(Math.random() * placeTypes.length)];
    let name, description;
    
    switch (type) {
      case 'attraction':
        name = attractionNames[Math.floor(Math.random() * attractionNames.length)];
        description = 'Историческая достопримечательность с богатой историей и культурным наследием.';
        break;
      case 'cafe':
        name = cafeNames[Math.floor(Math.random() * cafeNames.length)];
        description = 'Уютное место с отличной кухней и приятной атмосферой.';
        break;
      case 'viewpoint':
        name = viewpointNames[Math.floor(Math.random() * viewpointNames.length)];
        description = 'Потрясающий вид на город и окрестности, идеальное место для фотографий.';
        break;
      default:
        name = 'Интересное место';
        description = 'Стоит посетить во время прогулки по городу.';
    }
    
    // Базовые координаты (центр города)
    const baseLatitude = 55.7558;
    const baseLongitude = 37.6173;
    
    // Генерируем случайное смещение от базовых координат
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    
    places.push({
      id: `mock-place-${i}`,
      name,
      type,
      description,
      location: {
        latitude: baseLatitude + latOffset,
        longitude: baseLongitude + lngOffset
      },
      rating: Math.round(Math.random() * 2 + 3 * 10) / 10, // 3-5 звезд
      reviewsCount: Math.floor(Math.random() * 100),
      imageUrls: []
    });
  }
  
  return places;
}; 
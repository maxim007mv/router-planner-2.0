import { db, auth, storage } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  limit,
  startAfter,
  GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PLACES_COLLECTION = 'places';
const PLACE_REVIEWS_COLLECTION = 'placeReviews';

// Типы мест
export const PLACE_TYPES = {
  CAFE: 'cafe',
  RESTAURANT: 'restaurant',
  PARK: 'park',
  VIEWPOINT: 'viewpoint'
};

// Сохранение места в Firestore
export const savePlace = async (placeData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем обязательные поля
    if (!placeData.name || !placeData.type) {
      throw new Error('Название и тип места обязательны');
    }
    
    console.log('Сохранение места с типом:', placeData.type);
    
    // Убедимся, что тип места соответствует одному из допустимых значений
    if (!Object.values(PLACE_TYPES).includes(placeData.type)) {
      console.error('Неверный тип места:', placeData.type);
      console.error('Допустимые типы:', PLACE_TYPES);
      placeData.type = PLACE_TYPES.RESTAURANT; // Устанавливаем тип по умолчанию
    }

    // Создаем GeoPoint для координат, если они предоставлены
    let location = null;
    if (placeData.latitude && placeData.longitude) {
      location = new GeoPoint(
        parseFloat(placeData.latitude), 
        parseFloat(placeData.longitude)
      );
    }

    const placeWithMetadata = {
      ...placeData,
      location,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rating: 0,
      reviewsCount: 0
    };
    
    console.log('Итоговые данные места для сохранения:', placeWithMetadata);

    // Если есть изображения, загружаем их в Storage
    if (placeData.images && placeData.images.length > 0) {
      const imageUrls = await Promise.all(
        placeData.images.map(async (image) => {
          return await uploadPlaceImage(image);
        })
      );
      placeWithMetadata.imageUrls = imageUrls;
    }

    // Сохраняем место в Firestore
    const docRef = await addDoc(collection(db, PLACES_COLLECTION), placeWithMetadata);
    
    return {
      id: docRef.id,
      ...placeWithMetadata
    };
  } catch (error) {
    console.error('Error saving place:', error);
    throw error;
  }
};

// Обновление места
export const updatePlace = async (placeId, placeData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const placeRef = doc(db, PLACES_COLLECTION, placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
      throw new Error('Место не найдено');
    }

    // Проверяем, что пользователь является владельцем места или администратором
    const placeDoc = placeSnap.data();
    if (placeDoc.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на редактирование этого места');
    }

    // Создаем GeoPoint для координат, если они предоставлены
    let location = placeDoc.location;
    if (placeData.latitude && placeData.longitude) {
      location = new GeoPoint(
        parseFloat(placeData.latitude), 
        parseFloat(placeData.longitude)
      );
    }

    const updatedData = {
      ...placeData,
      location,
      updatedAt: serverTimestamp()
    };

    await updateDoc(placeRef, updatedData);
    
    return {
      id: placeId,
      ...placeDoc,
      ...updatedData
    };
  } catch (error) {
    console.error('Error updating place:', error);
    throw error;
  }
};

// Получение места по ID
export const getPlaceById = async (placeId) => {
  try {
    const placeRef = doc(db, PLACES_COLLECTION, placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
      throw new Error('Место не найдено');
    }

    return {
      id: placeId,
      ...placeSnap.data()
    };
  } catch (error) {
    console.error('Error getting place:', error);
    throw error;
  }
};

// Получение мест по типу
export const getPlacesByType = async (type, lastVisible = null, itemsPerPage = 10) => {
  try {
    console.log('Запрос мест по типу:', type);
    
    // Проверяем, что тип является допустимым значением
    if (!Object.values(PLACE_TYPES).includes(type)) {
      console.error('Неверный тип места в запросе:', type);
      console.error('Допустимые типы:', PLACE_TYPES);
      throw new Error('Неверный тип места');
    }
    
    let placesQuery;
    
    // Сначала получаем рекомендованные места этого типа
    const recommendedQuery = query(
      collection(db, PLACES_COLLECTION),
      where('type', '==', type),
      where('isRecommended', '==', true),
      where('recommendedBy', '==', 'team'),
      orderBy('rating', 'desc')
    );
    
    // Затем получаем обычные места этого типа
    if (lastVisible) {
      placesQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', type),
        where('isRecommended', '!=', true),
        orderBy('isRecommended'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );
    } else {
      placesQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', type),
        where('isRecommended', '!=', true),
        orderBy('isRecommended'),
        orderBy('createdAt', 'desc'),
        limit(itemsPerPage)
      );
    }

    console.log('Выполняем запрос к Firestore...');
    
    // Получаем рекомендованные места
    const recommendedSnapshot = await getDocs(recommendedQuery);
    const recommendedPlaces = [];
    
    recommendedSnapshot.forEach((doc) => {
      const placeData = doc.data();
      recommendedPlaces.push({
        id: doc.id,
        ...placeData
      });
    });
    
    console.log(`Найдено ${recommendedPlaces.length} рекомендованных мест типа ${type}`);
    
    // Получаем обычные места
    const querySnapshot = await getDocs(placesQuery);
    const regularPlaces = [];
    let lastVisibleDoc = null;

    querySnapshot.forEach((doc) => {
      const placeData = doc.data();
      regularPlaces.push({
        id: doc.id,
        ...placeData
      });
      lastVisibleDoc = doc;
    });
    
    console.log(`Найдено ${regularPlaces.length} обычных мест типа ${type}`);
    
    // Объединяем рекомендованные и обычные места
    // Рекомендованные места будут отображаться в начале списка
    const places = [...recommendedPlaces, ...regularPlaces];
    
    return {
      places,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error getting places by type:', error);
    throw error;
  }
};

// Получение мест рядом с маршрутом
export const getPlacesNearRoute = async (routePoints, radiusInKm = 1) => {
  try {
    // Получаем все места
    const placesQuery = query(
      collection(db, PLACES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(placesQuery);
    const places = [];

    // Фильтруем места, которые находятся в пределах указанного радиуса от точек маршрута
    querySnapshot.forEach((doc) => {
      const place = {
        id: doc.id,
        ...doc.data()
      };

      // Если у места есть координаты
      if (place.location) {
        // Проверяем, находится ли место рядом с какой-либо точкой маршрута
        const isNearRoute = routePoints.some(point => {
          return isPointWithinRadius(
            place.location.latitude, 
            place.location.longitude,
            point.latitude,
            point.longitude,
            radiusInKm
          );
        });

        if (isNearRoute) {
          places.push(place);
        }
      }
    });

    return places;
  } catch (error) {
    console.error('Error getting places near route:', error);
    throw error;
  }
};

// Функция для проверки, находится ли точка в пределах указанного радиуса
const isPointWithinRadius = (lat1, lon1, lat2, lon2, radiusInKm) => {
  // Радиус Земли в километрах
  const earthRadius = 6371;
  
  // Переводим градусы в радианы
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  // Формула гаверсинуса
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  
  return distance <= radiusInKm;
};

// Вспомогательная функция для перевода градусов в радианы
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Удаление места
export const deletePlace = async (placeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const placeRef = doc(db, PLACES_COLLECTION, placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
      throw new Error('Место не найдено');
    }

    // Проверяем, что пользователь является владельцем места
    const placeData = placeSnap.data();
    if (placeData.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на удаление этого места');
    }

    await deleteDoc(placeRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting place:', error);
    throw error;
  }
};

// Загрузка изображения места в Storage
const uploadPlaceImage = async (file) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `places/${auth.currentUser.uid}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Добавление отзыва к месту
export const addPlaceReview = async (placeId, reviewData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем, что рейтинг указан
    if (!reviewData.rating) {
      throw new Error('Рейтинг обязателен');
    }

    const reviewWithMetadata = {
      ...reviewData,
      placeId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      userPhotoURL: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp()
    };

    // Добавляем отзыв
    const docRef = await addDoc(collection(db, PLACE_REVIEWS_COLLECTION), reviewWithMetadata);
    
    // Обновляем средний рейтинг и количество отзывов места
    const placeRef = doc(db, PLACES_COLLECTION, placeId);
    const placeSnap = await getDoc(placeRef);
    
    if (placeSnap.exists()) {
      const placeData = placeSnap.data();
      const currentReviewsCount = placeData.reviewsCount || 0;
      const currentRating = placeData.rating || 0;
      
      // Вычисляем новый средний рейтинг
      const newRating = (currentRating * currentReviewsCount + reviewData.rating) / (currentReviewsCount + 1);
      
      await updateDoc(placeRef, {
        rating: newRating,
        reviewsCount: currentReviewsCount + 1
      });
    }
    
    return {
      id: docRef.id,
      ...reviewWithMetadata
    };
  } catch (error) {
    console.error('Error adding place review:', error);
    throw error;
  }
};

// Получение отзывов к месту
export const getPlaceReviews = async (placeId) => {
  try {
    const reviewsQuery = query(
      collection(db, PLACE_REVIEWS_COLLECTION),
      where('placeId', '==', placeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return reviews;
  } catch (error) {
    console.error('Error getting place reviews:', error);
    throw error;
  }
};

// Функция для заполнения базы данных примерами мест
export const populateSamplePlaces = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    // Проверяем, есть ли у пользователя права администратора
    // В реальном приложении здесь должна быть проверка прав
    
    console.log('Начинаем заполнение базы данных примерами мест...');
    
    // Примеры ресторанов (от дешевых до дорогих)
    const restaurants = [
      {
        name: 'Домашняя кухня',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Уютный ресторан с домашней кухней и доступными ценами. Идеально подходит для семейного обеда.',
        address: 'ул. Ленина, 15',
        priceLevel: '1',
        rating: 4.2,
        reviewsCount: 128,
        imageUrls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Итальянский дворик',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Аутентичная итальянская кухня в центре города. Пицца, паста и вино по разумным ценам.',
        address: 'ул. Пушкина, 42',
        priceLevel: '2',
        rating: 4.5,
        reviewsCount: 215,
        imageUrls: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Морской бриз',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Ресторан морепродуктов с видом на набережную. Свежие устрицы, креветки и рыба.',
        address: 'Набережная, 78',
        priceLevel: '3',
        rating: 4.7,
        reviewsCount: 342,
        imageUrls: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTV8fHNlYWZvb2QlMjByZXN0YXVyYW50fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Стейк Хаус',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Премиальные стейки и отборные вина. Идеальное место для особого случая.',
        address: 'пр. Мира, 101',
        priceLevel: '3',
        rating: 4.8,
        reviewsCount: 189,
        imageUrls: ['https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c3RlYWslMjByZXN0YXVyYW50fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Азиатский уголок',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Аутентичная азиатская кухня: суши, лапша и димсамы по доступным ценам.',
        address: 'ул. Гагарина, 55',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 167,
        imageUrls: ['https://images.unsplash.com/photo-1526318896980-cf78c088247c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YXNpYW4lMjByZXN0YXVyYW50fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      }
    ];
    
    // Примеры кафе
    const cafes = [
      {
        name: 'Утренний кофе',
        type: PLACE_TYPES.CAFE,
        description: 'Уютное кафе с лучшим кофе в городе и свежей выпечкой.',
        address: 'ул. Советская, 23',
        priceLevel: '1',
        rating: 4.6,
        reviewsCount: 203,
        imageUrls: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y29mZmVlJTIwc2hvcHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Французская пекарня',
        type: PLACE_TYPES.CAFE,
        description: 'Настоящие французские круассаны, багеты и десерты. Кофе из свежеобжаренных зерен.',
        address: 'ул. Парижская, 12',
        priceLevel: '2',
        rating: 4.8,
        reviewsCount: 178,
        imageUrls: ['https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YmFrZXJ5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Книжное кафе',
        type: PLACE_TYPES.CAFE,
        description: 'Кафе с большой библиотекой, где можно почитать книгу за чашкой чая или кофе.',
        address: 'ул. Достоевского, 35',
        priceLevel: '1',
        rating: 4.4,
        reviewsCount: 156,
        imageUrls: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Ym9vayUyMGNhZmV8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Веганское кафе',
        type: PLACE_TYPES.CAFE,
        description: 'Полностью веганское меню: смузи, боулы, салаты и десерты без продуктов животного происхождения.',
        address: 'ул. Зеленая, 42',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 132,
        imageUrls: ['https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmVnYW4lMjBjYWZlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Кофейня "Арабика"',
        type: PLACE_TYPES.CAFE,
        description: 'Специализированная кофейня с кофе со всего мира и профессиональными бариста.',
        address: 'пр. Ленина, 78',
        priceLevel: '2',
        rating: 4.7,
        reviewsCount: 221,
        imageUrls: ['https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OXx8Y29mZmVlJTIwc2hvcHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      }
    ];
    
    // Примеры парков
    const parks = [
      {
        name: 'Центральный парк',
        type: PLACE_TYPES.PARK,
        description: 'Большой городской парк с озером, детскими площадками и велосипедными дорожками.',
        address: 'ул. Парковая, 1',
        priceLevel: '1',
        rating: 4.5,
        reviewsCount: 312,
        imageUrls: ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cGFya3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Ботанический сад',
        type: PLACE_TYPES.PARK,
        description: 'Коллекция растений со всего мира, оранжереи и тематические сады.',
        address: 'ул. Ботаническая, 15',
        priceLevel: '1',
        rating: 4.7,
        reviewsCount: 245,
        imageUrls: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Ym90YW5pY2FsJTIwZ2FyZGVufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Парк "Сосновый бор"',
        type: PLACE_TYPES.PARK,
        description: 'Природный парк с хвойным лесом, экологическими тропами и местами для пикника.',
        address: 'Лесной проспект, 42',
        priceLevel: '1',
        rating: 4.6,
        reviewsCount: 187,
        imageUrls: ['https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8Zm9yZXN0JTIwcGFya3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Исторический парк',
        type: PLACE_TYPES.PARK,
        description: 'Парк с историческими памятниками, скульптурами и старинными аллеями.',
        address: 'ул. Историческая, 5',
        priceLevel: '1',
        rating: 4.4,
        reviewsCount: 156,
        imageUrls: ['https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8aGlzdG9yaWNhbCUyMHBhcmt8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Парк развлечений "Адреналин"',
        type: PLACE_TYPES.PARK,
        description: 'Парк с аттракционами, американскими горками и колесом обозрения.',
        address: 'пр. Победы, 100',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 289,
        imageUrls: ['https://images.unsplash.com/photo-1570481662006-a3a1374699e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YW11c2VtZW50JTIwcGFya3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      }
    ];
    
    // Примеры смотровых площадок
    const viewpoints = [
      {
        name: 'Городская панорама',
        type: PLACE_TYPES.VIEWPOINT,
        description: 'Смотровая площадка на крыше небоскреба с видом на весь город.',
        address: 'ул. Высотная, 1',
        priceLevel: '2',
        rating: 4.8,
        reviewsCount: 342,
        imageUrls: ['https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2l0eSUyMHZpZXdwb2ludHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Горная вершина',
        type: PLACE_TYPES.VIEWPOINT,
        description: 'Природная смотровая площадка на вершине горы с видом на долину и озеро.',
        address: 'Горный хребет, 5 км от города',
        priceLevel: '1',
        rating: 4.9,
        reviewsCount: 278,
        imageUrls: ['https://images.unsplash.com/photo-1454496522488-7a8e488e8606?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8bW91bnRhaW4lMjB2aWV3cG9pbnR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Маяк "Северный"',
        type: PLACE_TYPES.VIEWPOINT,
        description: 'Исторический маяк с смотровой площадкой и видом на море.',
        address: 'Морской бульвар, 42',
        priceLevel: '1',
        rating: 4.6,
        reviewsCount: 198,
        imageUrls: ['https://images.unsplash.com/photo-1507217633297-c9815ce2ac7d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bGlnaHRob3VzZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Обзорная башня',
        type: PLACE_TYPES.VIEWPOINT,
        description: 'Современная обзорная башня со стеклянным полом и панорамным видом.',
        address: 'пл. Революции, 1',
        priceLevel: '2',
        rating: 4.7,
        reviewsCount: 256,
        imageUrls: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8b2JzZXJ2YXRpb24lMjB0b3dlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Речная набережная',
        type: PLACE_TYPES.VIEWPOINT,
        description: 'Живописная набережная с видом на реку и исторический центр города.',
        address: 'Набережная, 10',
        priceLevel: '1',
        rating: 4.5,
        reviewsCount: 312,
        imageUrls: ['https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cml2ZXIlMjBwcm9tZW5hZGV8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      }
    ];
    
    // Объединяем все места в один массив
    const allPlaces = [...restaurants, ...cafes, ...parks, ...viewpoints];
    
    // Сохраняем все места в базу данных
    const savedPlaces = await Promise.all(
      allPlaces.map(async (place) => {
        const placeWithMetadata = {
          ...place,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Администратор',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, PLACES_COLLECTION), placeWithMetadata);
        return {
          id: docRef.id,
          ...placeWithMetadata
        };
      })
    );
    
    console.log(`Успешно добавлено ${savedPlaces.length} мест в базу данных`);
    return savedPlaces;
    
  } catch (error) {
    console.error('Error populating sample places:', error);
    throw error;
  }
};

// Функция для добавления рекомендованных ресторанов от команды разработчиков
export const addRecommendedRestaurants = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    console.log('Добавление рекомендованных ресторанов от команды разработчиков...');
    
    // Массив рекомендованных ресторанов
    const recommendedRestaurants = [
      {
        name: 'Шале',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Уютный ресторан с живой музыкой. Кухня: Европейская.',
        address: 'Ул. Сивцев Вражек, 10',
        priceLevel: '2',
        rating: 4.6,
        reviewsCount: 128,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская',
        features: 'Уютный ресторан с живой музыкой',
        imageUrls: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudCUyMGV1cm9wZWFufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Честная кухня',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Ресторан с натуральными продуктами и детской зоной. Кухня: Русская, европейская.',
        address: 'М. Китай-город, Покровский б-р, 16',
        priceLevel: '2',
        rating: 4.5,
        reviewsCount: 156,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Русская, европейская',
        features: 'Натуральные продукты, детская зона',
        imageUrls: ['https://images.unsplash.com/photo-1600891964599-f61ba0e24092?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cnVzc2lhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Пражка',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Ресторан с традиционными блюдами Чехии. Кухня: Чешская.',
        address: 'М. Тверская, ул. Малая Дмитровка, 8',
        priceLevel: '2',
        rating: 4.4,
        reviewsCount: 112,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Чешская',
        features: 'Традиционные блюда Чехии',
        imageUrls: ['https://images.unsplash.com/photo-1600891964599-f61ba0e24092?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y3plY2glMjBmb29kfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Биосфера',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Уютное пространство с акцентом на свежие продукты. Кухня: Европейская, итальянская.',
        address: 'М. Октябрьская, ул. Малая Калужская, 15',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 98,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская, итальянская',
        features: 'Уютное пространство с акцентом на свежие продукты',
        imageUrls: ['https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8aXRhbGlhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Starlite Diner',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Классический американский фастфуд, работает 24/7. Кухня: Американская, европейская.',
        address: 'М. Маяковская, Б. Садовая, 16',
        priceLevel: '2',
        rating: 4.2,
        reviewsCount: 203,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Американская, европейская',
        features: 'Работает 24/7, классический американский фастфуд',
        imageUrls: ['https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YW1lcmljYW4lMjBkaW5lcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Osteria Mario',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Аутентичные пасты и пиццы. Кухня: Итальянская.',
        address: 'М. Театральная, Манежная площадь',
        priceLevel: '2',
        rating: 4.7,
        reviewsCount: 245,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Итальянская',
        features: 'Аутентичные пасты и пиццы',
        imageUrls: ['https://images.unsplash.com/photo-1595295333158-4742f28fbd85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cGl6emF8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Рамен Тен',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Хиты: рамен и якиникки. Кухня: Японская.',
        address: 'М. Чистые пруды, ул. Покровка, 4',
        priceLevel: '2',
        rating: 4.6,
        reviewsCount: 178,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Японская',
        features: 'Хиты: рамен и якиникки',
        imageUrls: ['https://images.unsplash.com/photo-1557872943-16a5ac26437e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmFtZW58ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Дом 16',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Интерьер в стиле арт-деко. Кухня: Современная русская.',
        address: 'М. Китай-город, Покровский б-р, 16',
        priceLevel: '2',
        rating: 4.5,
        reviewsCount: 132,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Современная русская',
        features: 'Интерьер в стиле арт-деко',
        imageUrls: ['https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8cnVzc2lhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Варка',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Пивной бар со своим пивом и домашними солениями. Кухня: Пивная, закуски.',
        address: 'М. Семеновская, ул. Семеновский пер., 13',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 167,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Пивная, закуски',
        features: 'Свое пиво и домашние соления',
        imageUrls: ['https://images.unsplash.com/photo-1600788886242-5c96aabe3757?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YmVlciUyMGJhcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Bodrum',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Турецкая кухня: шашлык и хумус.',
        address: 'М. Сухаревская, ул. Ильинка, 11',
        priceLevel: '2',
        rating: 4.4,
        reviewsCount: 156,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Турецкая',
        features: 'Шашлык и хумус',
        imageUrls: ['https://images.unsplash.com/photo-1561626423-a51b45aef0a1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dHVya2lzaCUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Lyubov Pirogova',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Русская кухня: пироги и борщ.',
        address: 'М. Киевская, ул. Кирова, 36',
        priceLevel: '2',
        rating: 4.5,
        reviewsCount: 143,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Русская',
        features: 'Пироги и борщ',
        imageUrls: ['https://images.unsplash.com/photo-1589249303999-1de47ae78841?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cnVzc2lhbiUyMHBpZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Anderson',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Европейская кухня с классическим интерьером.',
        address: 'М. Арбатская, ул. Новый Арбат, 34',
        priceLevel: '2',
        rating: 4.3,
        reviewsCount: 187,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская',
        features: 'Классический интерьер',
        imageUrls: ['https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGV1cm9wZWFuJTIwcmVzdGF1cmFudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Bar Neon Monkey',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Европейская кухня с ночным меню и коктейлями.',
        address: 'М. Киевская, ул. Малая Ордынка, 27',
        priceLevel: '2',
        rating: 4.2,
        reviewsCount: 156,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская',
        features: 'Ночное меню и коктейли',
        imageUrls: ['https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8YmFyfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'RUSKI',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Европейская кухня с акцентом на мясные блюда.',
        address: 'М. Тверская, ул. Петровка, 25',
        priceLevel: '2',
        rating: 4.6,
        reviewsCount: 198,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская',
        features: 'Акцент на мясные блюда',
        imageUrls: ['https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8c3RlYWt8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Винный бар на Маросейке',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Более 14 видов вин по доступным ценам.',
        address: 'М. Китай-город, ул. Маросейка, 12',
        priceLevel: '2',
        rating: 4.4,
        reviewsCount: 167,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Европейская',
        features: 'Более 14 видов вин по доступным ценам',
        imageUrls: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8d2luZSUyMGJhcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60']
      },
      {
        name: 'Teremok',
        type: PLACE_TYPES.RESTAURANT,
        description: 'Русская кухня: пироги и компоты.',
        address: 'М. Пушкинская, ул. Ильинка, 19',
        priceLevel: '1',
        rating: 4.2,
        reviewsCount: 203,
        isRecommended: true,
        recommendedBy: 'team',
        cuisine: 'Русская',
        features: 'Пироги и компоты',
        imageUrls: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8cnVzc2lhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60']
      }
    ];
    
    // Сохраняем все рестораны в базу данных
    const savedRestaurants = await Promise.all(
      recommendedRestaurants.map(async (restaurant) => {
        // Проверяем, существует ли уже ресторан с таким названием и адресом
        const existingQuery = query(
          collection(db, PLACES_COLLECTION),
          where('name', '==', restaurant.name),
          where('address', '==', restaurant.address)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          console.log(`Ресторан "${restaurant.name}" уже существует, пропускаем...`);
          return null;
        }
        
        const restaurantWithMetadata = {
          ...restaurant,
          userId: auth.currentUser.uid,
          userName: 'Команда разработчиков',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, PLACES_COLLECTION), restaurantWithMetadata);
        console.log(`Добавлен ресторан: ${restaurant.name}`);
        
        return {
          id: docRef.id,
          ...restaurantWithMetadata
        };
      })
    );
    
    // Фильтруем null значения (уже существующие рестораны)
    const actuallyAddedRestaurants = savedRestaurants.filter(restaurant => restaurant !== null);
    
    console.log(`Успешно добавлено ${actuallyAddedRestaurants.length} рекомендованных ресторанов`);
    return actuallyAddedRestaurants;
    
  } catch (error) {
    console.error('Error adding recommended restaurants:', error);
    throw error;
  }
};

// Получение всех рекомендованных мест от команды разработчиков
export const getAllRecommendedPlaces = async (lastVisible = null, itemsPerPage = 20) => {
  try {
    console.log('Запрос всех рекомендованных мест от команды разработчиков');
    
    let recommendedQuery;
    
    if (lastVisible) {
      recommendedQuery = query(
        collection(db, PLACES_COLLECTION),
        where('isRecommended', '==', true),
        where('recommendedBy', '==', 'team'),
        orderBy('rating', 'desc'),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );
    } else {
      recommendedQuery = query(
        collection(db, PLACES_COLLECTION),
        where('isRecommended', '==', true),
        where('recommendedBy', '==', 'team'),
        orderBy('rating', 'desc'),
        limit(itemsPerPage)
      );
    }
    
    const recommendedSnapshot = await getDocs(recommendedQuery);
    const recommendedPlaces = [];
    let lastVisibleDoc = null;
    
    recommendedSnapshot.forEach((doc) => {
      const placeData = doc.data();
      recommendedPlaces.push({
        id: doc.id,
        ...placeData
      });
      lastVisibleDoc = doc;
    });
    
    console.log(`Найдено ${recommendedPlaces.length} рекомендованных мест от команды разработчиков`);
    
    return {
      places: recommendedPlaces,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error getting recommended places:', error);
    throw error;
  }
};

// Получение дешевых ресторанов (priceLevel = 1)
export const getCheapRestaurants = async (lastVisible = null, itemsPerPage = 10) => {
  try {
    console.log('Запрос дешевых ресторанов (priceLevel = 1)');
    
    let restaurantsQuery;
    
    if (lastVisible) {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('priceLevel', '==', 1),
        orderBy('rating', 'desc'),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );
    } else {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('priceLevel', '==', 1),
        orderBy('rating', 'desc'),
        limit(itemsPerPage)
      );
    }
    
    const querySnapshot = await getDocs(restaurantsQuery);
    const restaurants = [];
    let lastVisibleDoc = null;
    
    querySnapshot.forEach((doc) => {
      const placeData = doc.data();
      restaurants.push({
        id: doc.id,
        ...placeData
      });
      lastVisibleDoc = doc;
    });
    
    console.log(`Найдено ${restaurants.length} дешевых ресторанов`);
    
    return {
      places: restaurants,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error getting cheap restaurants:', error);
    throw error;
  }
};

// Получение дорогих ресторанов (priceLevel = 3)
export const getExpensiveRestaurants = async (lastVisible = null, itemsPerPage = 10) => {
  try {
    console.log('Запрос дорогих ресторанов (priceLevel = 3)');
    
    let restaurantsQuery;
    
    if (lastVisible) {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('priceLevel', '==', 3),
        orderBy('rating', 'desc'),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );
    } else {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('priceLevel', '==', 3),
        orderBy('rating', 'desc'),
        limit(itemsPerPage)
      );
    }
    
    const querySnapshot = await getDocs(restaurantsQuery);
    const restaurants = [];
    let lastVisibleDoc = null;
    
    querySnapshot.forEach((doc) => {
      const placeData = doc.data();
      restaurants.push({
        id: doc.id,
        ...placeData
      });
      lastVisibleDoc = doc;
    });
    
    console.log(`Найдено ${restaurants.length} дорогих ресторанов`);
    
    return {
      places: restaurants,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error getting expensive restaurants:', error);
    throw error;
  }
};

// Получение топовых ресторанов месяца (с высоким рейтингом и добавленные за последний месяц)
export const getTopMonthRestaurants = async (lastVisible = null, itemsPerPage = 10) => {
  try {
    console.log('Запрос топовых ресторанов месяца');
    
    // Получаем дату месяц назад
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    let restaurantsQuery;
    
    if (lastVisible) {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('createdAt', '>=', oneMonthAgo),
        orderBy('createdAt', 'desc'),
        orderBy('rating', 'desc'),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );
    } else {
      restaurantsQuery = query(
        collection(db, PLACES_COLLECTION),
        where('type', '==', PLACE_TYPES.RESTAURANT),
        where('createdAt', '>=', oneMonthAgo),
        orderBy('createdAt', 'desc'),
        orderBy('rating', 'desc'),
        limit(itemsPerPage)
      );
    }
    
    const querySnapshot = await getDocs(restaurantsQuery);
    const restaurants = [];
    let lastVisibleDoc = null;
    
    querySnapshot.forEach((doc) => {
      const placeData = doc.data();
      restaurants.push({
        id: doc.id,
        ...placeData
      });
      lastVisibleDoc = doc;
    });
    
    console.log(`Найдено ${restaurants.length} топовых ресторанов месяца`);
    
    return {
      places: restaurants,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error getting top month restaurants:', error);
    throw error;
  }
}; 
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
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ROUTES_COLLECTION = 'routes';
const REVIEWS_COLLECTION = 'reviews';

// Сохранение маршрута в Firestore
export const saveRoute = async (routeData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    console.log('Данные маршрута перед сохранением:', routeData);

    // Проверяем и преобразуем данные маршрута перед сохранением
    const sanitizedRouteData = {
      name: routeData.name || `Маршрут на ${routeData.duration || '2'} час(а/ов)`,
      description: routeData.description || '',
      duration: routeData.duration || '2',
      pace: routeData.pace || 'moderate',
      timeOfDay: routeData.timeOfDay || 'afternoon',
      isPublic: routeData.isPublic || false,
      yandexMapsUrl: routeData.yandexMapsUrl || null,
      // Преобразуем точки маршрута, чтобы убедиться, что они сохраняются корректно
      points: Array.isArray(routeData.points) ? routeData.points.map(point => ({
        name: point.name || '',
        description: point.description || '',
        duration: point.duration || '',
        activities: Array.isArray(point.activities) ? point.activities : [],
        tips: Array.isArray(point.tips) ? point.tips : [],
        transition: point.transition || '',
        coordinates: point.coordinates || null
      })) : []
    };

    const routeWithMetadata = {
      ...sanitizedRouteData,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0
    };

    // Если есть изображения, загружаем их в Storage
    if (routeData.images && routeData.images.length > 0) {
      const imageUrls = await Promise.all(
        routeData.images.map(async (image) => {
          return await uploadRouteImage(image);
        })
      );
      routeWithMetadata.imageUrls = imageUrls;
    }

    console.log('Данные маршрута с метаданными перед сохранением:', routeWithMetadata);

    // Сохраняем маршрут в Firestore
    const docRef = await addDoc(collection(db, ROUTES_COLLECTION), routeWithMetadata);
    
    // Создаем связь в коллекции userRoutes
    await addDoc(collection(db, 'userRoutes'), {
      userId: auth.currentUser.uid,
      routeId: docRef.id,
      savedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...routeWithMetadata
    };
  } catch (error) {
    console.error('Error saving route:', error);
    throw error;
  }
};

// Обновление маршрута
export const updateRoute = async (routeId, routeData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Маршрут не найден');
    }

    // Проверяем, что пользователь является владельцем маршрута
    const routeData = routeSnap.data();
    if (routeData.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на редактирование этого маршрута');
    }

    const updatedData = {
      ...routeData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(routeRef, updatedData);
    
    return {
      id: routeId,
      ...updatedData
    };
  } catch (error) {
    console.error('Error updating route:', error);
    throw error;
  }
};

// Получение маршрута по ID
export const getRouteById = async (routeId) => {
  try {
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Маршрут не найден');
    }

    const firestoreData = routeSnap.data();
    console.log('Сырые данные из Firestore:', firestoreData);

    // Преобразуем данные из Firestore в формат, ожидаемый компонентом
    // Поддерживаем как старый формат (title, cost), так и новый (name, duration)
    const routeData = {
      id: routeId,
      // Поддержка обоих форматов полей
      name: firestoreData.name || firestoreData.title || `Маршрут ${routeId}`,
      description: firestoreData.description || firestoreData.routeDescription || '',
      duration: firestoreData.duration || firestoreData.walkingTime || '2',
      pace: firestoreData.pace || firestoreData.walkingPace || 'moderate',
      timeOfDay: firestoreData.timeOfDay || firestoreData.time || 'afternoon',
      isPublic: firestoreData.isPublic || false,
      yandexMapsUrl: firestoreData.yandexMapsUrl || firestoreData.mapUrl || null,
      userId: firestoreData.userId || '',
      userName: firestoreData.userName || 'Пользователь',
      // Дополнительные поля из старого формата
      cost: firestoreData.cost || null,
      companions: firestoreData.companions || null,
      budget: firestoreData.budget || null,
      recommendations: firestoreData.recommendations || null,
      routeDescription: firestoreData.routeDescription || null,
      createdAt: firestoreData.createdAt ? new Date(firestoreData.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
      updatedAt: firestoreData.updatedAt ? new Date(firestoreData.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      // Преобразуем точки маршрута, если они есть
      points: Array.isArray(firestoreData.points) ? firestoreData.points.map(point => ({
        name: point.name || '',
        description: point.description || '',
        duration: point.duration || '',
        activities: Array.isArray(point.activities) ? point.activities : [],
        tips: Array.isArray(point.tips) ? point.tips : [],
        transition: point.transition || '',
        coordinates: point.coordinates || null
      })) : []
    };

    console.log('Данные маршрута, полученные из Firestore после преобразования:', routeData);
    
    return routeData;
  } catch (error) {
    console.error('Error getting route:', error);
    throw error;
  }
};

// Получение всех маршрутов пользователя
export const getUserRoutes = async (userId = null) => {
  try {
    console.log('getUserRoutes - Starting to fetch routes for user:', userId);
    const uid = userId || (auth.currentUser ? auth.currentUser.uid : null);
    
    if (!uid) {
      console.log('getUserRoutes - No user ID provided and no authenticated user');
      return [];
    }

    console.log('getUserRoutes - Fetching routes for user:', uid);
    
    // Получаем маршруты напрямую из коллекции routes
    const routesQuery = query(
      collection(db, 'routes'),
      where('userId', '==', uid)
    );

    console.log('getUserRoutes - Executing routes query');
    const routesSnapshot = await getDocs(routesQuery);
    
    if (routesSnapshot.empty) {
      console.log('getUserRoutes - No routes found for user:', uid);
      return [];
    }

    const routes = routesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('getUserRoutes - Successfully fetched routes:', routes.length);
    return routes;
  } catch (error) {
    console.error('Error getting user routes:', error);
    throw error;
  }
};

// Получение всех публичных маршрутов
export const getPublicRoutes = async () => {
  try {
    const routesQuery = query(
      collection(db, ROUTES_COLLECTION),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(routesQuery);
    const routes = [];

    querySnapshot.forEach((doc) => {
      const routeData = doc.data();
      // Проверяем наличие счетчика лайков
      if (typeof routeData.likesCount === 'undefined') {
        routeData.likesCount = 0;
      }
      
      routes.push({
        id: doc.id,
        ...routeData
      });
    });

    return routes;
  } catch (error) {
    console.error('Error getting public routes:', error);
    throw error;
  }
};

// Удаление маршрута
export const deleteRoute = async (routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Маршрут не найден');
    }

    // Проверяем, что пользователь является владельцем маршрута
    const routeData = routeSnap.data();
    if (routeData.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на удаление этого маршрута');
    }

    await deleteDoc(routeRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
};

// Загрузка изображения маршрута в Storage
const uploadRouteImage = async (file) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `routes/${auth.currentUser.uid}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Добавление отзыва к маршруту
export const addReview = async (routeId, reviewData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем существование маршрута
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Маршрут не найден');
    }

    const reviewWithMetadata = {
      ...reviewData,
      routeId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      userPhotoURL: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp()
    };

    // Добавляем отзыв в коллекцию отзывов
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewWithMetadata);
    
    // Обновляем информацию о маршруте (добавляем ссылку на отзыв и обновляем рейтинг)
    const routeData = routeSnap.data();
    const reviews = routeData.reviews || [];
    reviews.push(docRef.id);
    
    // Получаем все отзывы маршрута для расчета среднего рейтинга
    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('routeId', '==', routeId)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    let totalRating = 0;
    let reviewCount = 0;
    
    reviewsSnapshot.forEach((doc) => {
      const review = doc.data();
      if (review.rating) {
        totalRating += review.rating;
        reviewCount++;
      }
    });
    
    // Добавляем текущий отзыв
    if (reviewData.rating) {
      totalRating += reviewData.rating;
      reviewCount++;
    }
    
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    
    // Обновляем маршрут
    await updateDoc(routeRef, {
      reviews: reviews,
      averageRating: averageRating,
      reviewCount: reviewCount
    });
    
    return {
      id: docRef.id,
      ...reviewWithMetadata
    };
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

// Получение отзывов к маршруту
export const getRouteReviews = async (routeId) => {
  try {
    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('routeId', '==', routeId),
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
    console.error('Error getting route reviews:', error);
    throw error;
  }
};

// Получение отзывов пользователя
export const getUserReviews = async (userId) => {
  try {
    if (!userId) {
      console.log('getUserReviews - No user ID provided');
      return [];
    }

    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(reviewsQuery);
    
    if (querySnapshot.empty) {
      return [];
    }

    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Получаем информацию о маршрутах для каждого отзыва
    const reviewsWithRouteInfo = await Promise.all(
      reviews.map(async (review) => {
        if (!review.routeId) {
          return {
            ...review,
            routeName: 'Маршрут удален',
            routeDuration: 'N/A',
            routePace: 'N/A'
          };
        }

        try {
          const routeDoc = await getDoc(doc(db, ROUTES_COLLECTION, review.routeId));
          
          if (routeDoc.exists()) {
            const routeData = routeDoc.data();
            return {
              ...review,
              routeName: routeData.name || 'Без названия',
              routeDuration: routeData.duration || 'N/A',
              routePace: routeData.pace || 'N/A'
            };
          }
          
          return {
            ...review,
            routeName: 'Маршрут удален',
            routeDuration: 'N/A',
            routePace: 'N/A'
          };
        } catch (error) {
          console.error(`Error fetching route for review ${review.id}:`, error);
          return {
            ...review,
            routeName: 'Ошибка загрузки',
            routeDuration: 'N/A',
            routePace: 'N/A'
          };
        }
      })
    );

    return reviewsWithRouteInfo;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return [];
  }
};

// Сохранение маршрута в профиль пользователя
export const saveRouteToUserProfile = async (userId, routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем существование маршрута
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Маршрут не найден');
    }

    // Создаем или обновляем запись в коллекции userRoutes
    const userRoutesRef = collection(db, 'userRoutes');
    const userRouteQuery = query(
      userRoutesRef,
      where('userId', '==', userId),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(userRouteQuery);
    
    if (querySnapshot.empty) {
      // Если записи нет, создаем новую
      await addDoc(userRoutesRef, {
        userId,
        routeId,
        savedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving route to user profile:', error);
    throw error;
  }
}; 
import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  updateDoc
} from 'firebase/firestore';

const LIKES_COLLECTION = 'likes';
const FAVORITES_COLLECTION = 'favorites';
const ROUTES_COLLECTION = 'routes';

// Добавление лайка к маршруту
export const likeRoute = async (routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем, не лайкнул ли пользователь уже этот маршрут
    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(likesQuery);
    
    if (!querySnapshot.empty) {
      // Если лайк уже существует, просто возвращаем его
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
    }

    // Добавляем лайк
    const likeData = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      routeId,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, LIKES_COLLECTION), likeData);
    
    // Увеличиваем счетчик лайков в маршруте
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    
    // Сначала проверяем, существует ли поле likesCount
    const routeSnap = await getDoc(routeRef);
    
    if (!routeSnap.exists()) {
      // Если маршрут не найден, удаляем созданный лайк и выбрасываем ошибку
      await deleteDoc(doc(db, LIKES_COLLECTION, docRef.id));
      throw new Error(`Маршрут с ID ${routeId} не найден`);
    }
    
    const routeData = routeSnap.data();
    
    // Увеличиваем счетчик лайков
    if (typeof routeData.likesCount === 'undefined') {
      // Если поле не существует, устанавливаем его в 1
      await updateDoc(routeRef, {
        likesCount: 1
      });
    } else {
      // Если поле существует, увеличиваем его на 1
      await updateDoc(routeRef, {
        likesCount: increment(1)
      });
    }

    return {
      id: docRef.id,
      ...likeData
    };
  } catch (error) {
    console.error('Error liking route:', error);
    throw error;
  }
};

// Удаление лайка с маршрута
export const unlikeRoute = async (routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Находим лайк пользователя
    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(likesQuery);
    
    if (querySnapshot.empty) {
      // Если лайка нет, просто возвращаем успех
      return { success: true };
    }

    // Удаляем лайк
    const likeDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, LIKES_COLLECTION, likeDoc.id));
    
    // Уменьшаем счетчик лайков в маршруте
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    
    // Сначала проверяем, существует ли поле likesCount и его значение
    const routeSnap = await getDoc(routeRef);
    
    if (!routeSnap.exists()) {
      throw new Error(`Маршрут с ID ${routeId} не найден`);
    }
    
    const routeData = routeSnap.data();
    
    // Уменьшаем счетчик лайков, но не меньше 0
    if (typeof routeData.likesCount === 'undefined' || routeData.likesCount <= 0) {
      await updateDoc(routeRef, {
        likesCount: 0
      });
    } else {
      await updateDoc(routeRef, {
        likesCount: increment(-1)
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error unliking route:', error);
    throw error;
  }
};

// Проверка, лайкнул ли пользователь маршрут
export const hasUserLikedRoute = async (routeId) => {
  try {
    if (!auth.currentUser) {
      return false;
    }

    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(likesQuery);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if user liked route:', error);
    // В случае ошибки возвращаем false, чтобы не блокировать пользовательский интерфейс
    return false;
  }
};

// Получение количества лайков маршрута
export const getRouteLikesCount = async (routeId) => {
  try {
    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(likesQuery);
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting route likes count:', error);
    return 0;
  }
};

// Добавление маршрута в избранное
export const addRouteToFavorites = async (routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем, не добавил ли пользователь уже этот маршрут в избранное
    const favoritesQuery = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(favoritesQuery);
    
    if (!querySnapshot.empty) {
      console.log('Маршрут уже в избранном');
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
    }

    // Добавляем в избранное
    const favoriteData = {
      userId: auth.currentUser.uid,
      routeId,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, FAVORITES_COLLECTION), favoriteData);
    
    return {
      id: docRef.id,
      ...favoriteData
    };
  } catch (error) {
    console.error('Error adding route to favorites:', error);
    throw error;
  }
};

// Удаление маршрута из избранного
export const removeRouteFromFavorites = async (routeId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    // Находим запись в избранном
    const favoritesQuery = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(favoritesQuery);
    
    if (querySnapshot.empty) {
      console.log('Маршрут не найден в избранном');
      return { success: true };
    }

    // Удаляем из избранного
    const favoriteDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, FAVORITES_COLLECTION, favoriteDoc.id));
    
    return { success: true };
  } catch (error) {
    console.error('Error removing route from favorites:', error);
    throw error;
  }
};

// Проверка, добавил ли пользователь маршрут в избранное
export const isRouteInFavorites = async (routeId) => {
  try {
    if (!auth.currentUser) {
      return false;
    }

    const favoritesQuery = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      where('routeId', '==', routeId)
    );

    const querySnapshot = await getDocs(favoritesQuery);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if route is in favorites:', error);
    // В случае ошибки возвращаем false, чтобы не блокировать пользовательский интерфейс
    return false;
  }
};

// Получение избранных маршрутов пользователя
export const getUserFavoriteRoutes = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const favoritesQuery = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(favoritesQuery);
    const favoriteRouteIds = querySnapshot.docs.map(doc => doc.data().routeId);
    
    // Если нет избранных маршрутов, возвращаем пустой массив
    if (favoriteRouteIds.length === 0) {
      return [];
    }
    
    // Получаем данные маршрутов
    const routes = [];
    
    for (const routeId of favoriteRouteIds) {
      const routeDoc = await getDoc(doc(db, ROUTES_COLLECTION, routeId));
      if (routeDoc.exists()) {
        routes.push({
          id: routeDoc.id,
          ...routeDoc.data()
        });
      }
    }
    
    return routes;
  } catch (error) {
    console.error('Error getting user favorite routes:', error);
    throw error;
  }
}; 
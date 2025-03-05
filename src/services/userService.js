import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

// Получение данных пользователя по ID
export const getUserById = async (userId) => {
  try {
    console.log('Getting user data for ID:', userId);
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('User document does not exist, creating new user data');
      // Если документ пользователя не существует в Firestore, 
      // создаем новый документ с базовыми данными
      const userData = {
        uid: userId,
        displayName: auth.currentUser?.displayName || 'Пользователь',
        email: auth.currentUser?.email || '',
        photoURL: auth.currentUser?.photoURL || '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Создаем документ пользователя
      await setDoc(userRef, userData);
      console.log('Created new user document:', userData);
      
      return {
        id: userId,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const userData = userSnap.data();
    console.log('Retrieved existing user data:', userData);
    
    return {
      id: userSnap.id,
      ...userData
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Обновление профиля пользователя
export const updateUserProfile = async (userId, userData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    // Используем переданный userId или ID текущего пользователя
    const targetUserId = userId || auth.currentUser.uid;
    
    const userRef = doc(db, USERS_COLLECTION, targetUserId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Если документ пользователя не существует, создаем его
      await setDoc(userRef, {
        ...userData,
        uid: targetUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Если документ существует, обновляем его
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      message: 'Профиль успешно обновлен'
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Подписка на гида
export const subscribeToGuide = async (guideId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    // Проверяем, существует ли гид
    const guideRef = doc(db, USERS_COLLECTION, guideId);
    const guideSnap = await getDoc(guideRef);
    
    if (!guideSnap.exists()) {
      throw new Error(`Гид с ID ${guideId} не найден`);
    }
    
    // Добавляем запись о подписке
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${auth.currentUser.uid}_${guideId}`);
    
    await setDoc(subscriptionRef, {
      userId: auth.currentUser.uid,
      guideId: guideId,
      createdAt: serverTimestamp()
    });
    
    // Обновляем список подписок пользователя
    const userRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
    await updateDoc(userRef, {
      subscriptions: arrayUnion(guideId)
    });
    
    // Обновляем счетчик подписчиков гида
    await updateDoc(guideRef, {
      subscribersCount: (guideSnap.data().subscribersCount || 0) + 1
    });
    
    return {
      success: true,
      message: 'Вы успешно подписались на гида'
    };
  } catch (error) {
    console.error('Error subscribing to guide:', error);
    throw error;
  }
};

// Отписка от гида
export const unsubscribeFromGuide = async (guideId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    // Проверяем, существует ли гид
    const guideRef = doc(db, USERS_COLLECTION, guideId);
    const guideSnap = await getDoc(guideRef);
    
    if (!guideSnap.exists()) {
      throw new Error(`Гид с ID ${guideId} не найден`);
    }
    
    // Удаляем запись о подписке
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${auth.currentUser.uid}_${guideId}`);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (subscriptionSnap.exists()) {
      await deleteDoc(subscriptionRef);
    }
    
    // Обновляем список подписок пользователя
    const userRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
    await updateDoc(userRef, {
      subscriptions: arrayRemove(guideId)
    });
    
    // Обновляем счетчик подписчиков гида
    if (guideSnap.data().subscribersCount > 0) {
      await updateDoc(guideRef, {
        subscribersCount: guideSnap.data().subscribersCount - 1
      });
    }
    
    return {
      success: true,
      message: 'Вы успешно отписались от гида'
    };
  } catch (error) {
    console.error('Error unsubscribing from guide:', error);
    throw error;
  }
};

// Проверка подписки на гида
export const isSubscribedToGuide = async (guideId) => {
  try {
    if (!auth.currentUser) {
      return false;
    }
    
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${auth.currentUser.uid}_${guideId}`);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    return subscriptionSnap.exists();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

// Получение списка гидов
export const getGuides = async () => {
  try {
    const guidesQuery = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', 'guide')
    );
    
    const querySnapshot = await getDocs(guidesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting guides:', error);
    throw error;
  }
};

// Получение подписок пользователя
export const getUserSubscriptions = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId || auth.currentUser?.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('Пользователь не найден');
    }
    
    const subscriptions = userSnap.data().subscriptions || [];
    
    if (subscriptions.length === 0) {
      return [];
    }
    
    // Получаем данные всех гидов, на которых подписан пользователь
    const guides = await Promise.all(
      subscriptions.map(async (guideId) => {
        try {
          return await getUserById(guideId);
        } catch (error) {
          console.error(`Error getting guide ${guideId}:`, error);
          return null;
        }
      })
    );
    
    return guides.filter(guide => guide !== null);
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    throw error;
  }
};

// Получение расширенных данных пользователя из Firestore
export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId || auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return {
        ...auth.currentUser,
        ...userDoc.data()
      };
    }
    
    return auth.currentUser;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Форматирование даты регистрации
export const formatUserCreationDate = (user) => {
  if (!user || !user.metadata || !user.metadata.creationTime) {
    return 'Дата не указана';
  }
  
  try {
    const creationDate = new Date(user.metadata.creationTime);
    return creationDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Дата не указана';
  }
};

// Обновление статуса пользователя администратором
export const updateUserStatusByAdmin = async (userId, statusData) => {
  try {
    // Проверяем, авторизован ли администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    // Проверяем, существует ли пользователь
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('Пользователь не найден');
    }
    
    console.log('Обновление статуса пользователя администратором:', userId, statusData);
    
    // Обновляем статус пользователя
    await updateDoc(userRef, {
      ...statusData,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
    
    return {
      success: true,
      message: 'Статус пользователя успешно обновлен'
    };
  } catch (error) {
    console.error('Ошибка при обновлении статуса пользователя:', error);
    throw error;
  }
}; 
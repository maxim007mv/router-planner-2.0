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
  updateDoc,
  increment,
  runTransaction
} from 'firebase/firestore';

const COMMENTS_COLLECTION = 'comments';
const ROUTES_COLLECTION = 'routes';

// Добавление комментария к маршруту
export const addComment = async (routeId, text) => {
  if (!auth.currentUser) {
    throw new Error('Необходимо войти в систему для добавления комментария');
  }

  if (!routeId || !text.trim()) {
    throw new Error('Необходимо указать маршрут и текст комментария');
  }

  try {
    const commentData = {
      routeId,
      text: text.trim(),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Пользователь',
      userPhotoURL: auth.currentUser.photoURL,
      createdAt: serverTimestamp(),
    };

    let commentRef;
    // Используем транзакцию для атомарного обновления
    await runTransaction(db, async (transaction) => {
      // Добавляем комментарий
      commentRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData);
      
      // Обновляем счетчик комментариев в маршруте
      const routeRef = doc(db, ROUTES_COLLECTION, routeId);
      transaction.updateDoc(routeRef, {
        commentsCount: increment(1)
      });

      return commentRef;
    });

    // Возвращаем данные комментария с клиентским timestamp для немедленного отображения
    return {
      ...commentData,
      id: commentRef.id,
      createdAt: new Date(), // Используем клиентское время для UI
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Не удалось добавить комментарий');
  }
};

// Получение комментариев к маршруту
export const getRouteComments = async (routeId) => {
  if (!routeId) {
    throw new Error('Необходимо указать ID маршрута');
  }

  try {
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('routeId', '==', routeId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(commentsQuery);
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    console.log(`Fetched ${comments.length} comments for route ${routeId}`);
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Не удалось загрузить комментарии');
  }
};

// Удаление комментария
export const deleteComment = async (commentId) => {
  if (!auth.currentUser) {
    throw new Error('Необходимо войти в систему для удаления комментария');
  }

  if (!commentId) {
    throw new Error('Необходимо указать ID комментария');
  }

  try {
    // Получаем данные комментария для определения routeId
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Комментарий не найден');
    }

    const commentData = commentDoc.data();

    // Проверяем права на удаление
    if (commentData.userId !== auth.currentUser.uid) {
      throw new Error('У вас нет прав на удаление этого комментария');
    }

    // Используем транзакцию для атомарного обновления
    await runTransaction(db, async (transaction) => {
      // Удаляем комментарий
      transaction.delete(commentRef);
      
      // Обновляем счетчик комментариев в маршруте
      const routeRef = doc(db, ROUTES_COLLECTION, commentData.routeId);
      transaction.updateDoc(routeRef, {
        commentsCount: increment(-1)
      });
    });

    console.log(`Comment ${commentId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Не удалось удалить комментарий');
  }
};

// Редактирование комментария
export const updateComment = async (commentId, newText) => {
  if (!auth.currentUser) {
    throw new Error('Необходимо войти в систему для редактирования комментария');
  }

  if (!commentId || !newText.trim()) {
    throw new Error('Необходимо указать ID комментария и новый текст');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const updateData = {
      text: newText.trim(),
      updatedAt: serverTimestamp()
    };

    await updateDoc(commentRef, updateData);

    return {
      id: commentId,
      ...updateData,
      updatedAt: new Date() // Используем клиентское время для UI
    };
  } catch (error) {
    console.error('Error updating comment:', error);
    throw new Error('Не удалось обновить комментарий');
  }
};

// Получение комментариев пользователя
export const getUserComments = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(commentsQuery);
    const comments = [];

    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return comments;
  } catch (error) {
    console.error('Error getting user comments:', error);
    throw error;
  }
};

export const hasUserLikedRoute = async (routeId, userId) => {
  if (!routeId || !userId) {
    return false;
  }

  try {
    const likesQuery = query(
      collection(db, 'likes'),
      where('routeId', '==', routeId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(likesQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if user liked route:', error);
    return false;
  }
};

export const getRouteLikesCount = async (routeId) => {
  if (!routeId) {
    return 0;
  }

  try {
    const routeRef = doc(db, ROUTES_COLLECTION, routeId);
    const routeDoc = await getDoc(routeRef);
    
    if (!routeDoc.exists()) {
      return 0;
    }

    return routeDoc.data().likesCount || 0;
  } catch (error) {
    console.error('Error getting route likes count:', error);
    return 0;
  }
}; 
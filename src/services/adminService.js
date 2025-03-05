import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { generatePassword } from '../utils/passwordGenerator';

const ADMIN_ACCOUNTS_COLLECTION = 'adminAccounts';

// Генерация случайного имени пользователя
const generateUsername = () => {
  const prefix = 'admin';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${randomSuffix}`;
};

// Создание новой учетной записи администратора
export const createAdminAccount = async (name, email, role = 'admin', expiresAt = null) => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    // Генерируем имя пользователя и пароль
    const username = generateUsername();
    const password = generatePassword(10);
    
    // Создаем запись в Firestore
    const adminData = {
      name,
      email,
      username,
      password, // В реальном приложении пароль должен быть захеширован
      role,
      createdAt: serverTimestamp(),
      createdBy: localStorage.getItem('adminUsername') || 'unknown',
      lastLogin: null,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };
    
    const docRef = await addDoc(collection(db, ADMIN_ACCOUNTS_COLLECTION), adminData);
    
    return {
      id: docRef.id,
      ...adminData,
      password // Возвращаем пароль только при создании
    };
  } catch (error) {
    console.error('Ошибка при создании учетной записи администратора:', error);
    throw error;
  }
};

// Получение списка всех учетных записей администраторов
export const getAdminAccounts = async () => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    const adminQuery = query(collection(db, ADMIN_ACCOUNTS_COLLECTION));
    const querySnapshot = await getDocs(adminQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      password: '********' // Скрываем пароль при получении списка
    }));
  } catch (error) {
    console.error('Ошибка при получении списка администраторов:', error);
    throw error;
  }
};

// Удаление учетной записи администратора
export const deleteAdminAccount = async (adminId) => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    // Проверяем, не пытается ли администратор удалить свою учетную запись
    const currentAdminUsername = localStorage.getItem('adminUsername');
    const adminRef = doc(db, ADMIN_ACCOUNTS_COLLECTION, adminId);
    const adminSnap = await getDoc(adminRef);
    
    if (!adminSnap.exists()) {
      throw new Error('Учетная запись администратора не найдена');
    }
    
    if (adminSnap.data().username === currentAdminUsername) {
      throw new Error('Вы не можете удалить свою учетную запись');
    }
    
    await deleteDoc(adminRef);
    
    return {
      success: true,
      message: 'Учетная запись администратора успешно удалена'
    };
  } catch (error) {
    console.error('Ошибка при удалении учетной записи администратора:', error);
    throw error;
  }
};

// Деактивация учетной записи администратора
export const deactivateAdminAccount = async (adminId) => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    const adminRef = doc(db, ADMIN_ACCOUNTS_COLLECTION, adminId);
    
    await updateDoc(adminRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Учетная запись администратора деактивирована'
    };
  } catch (error) {
    console.error('Ошибка при деактивации учетной записи администратора:', error);
    throw error;
  }
};

// Активация учетной записи администратора
export const activateAdminAccount = async (adminId) => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    const adminRef = doc(db, ADMIN_ACCOUNTS_COLLECTION, adminId);
    
    await updateDoc(adminRef, {
      isActive: true,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Учетная запись администратора активирована'
    };
  } catch (error) {
    console.error('Ошибка при активации учетной записи администратора:', error);
    throw error;
  }
};

// Сброс пароля администратора
export const resetAdminPassword = async (adminId) => {
  try {
    // Проверяем, авторизован ли текущий пользователь как администратор
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (adminAuthenticated !== 'true') {
      throw new Error('Необходима авторизация администратора');
    }
    
    const newPassword = generatePassword(10);
    const adminRef = doc(db, ADMIN_ACCOUNTS_COLLECTION, adminId);
    
    await updateDoc(adminRef, {
      password: newPassword,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Пароль администратора сброшен',
      newPassword
    };
  } catch (error) {
    console.error('Ошибка при сбросе пароля администратора:', error);
    throw error;
  }
};

// Аутентификация администратора
export const authenticateAdmin = async (username, password) => {
  try {
    console.log('Попытка аутентификации администратора:', username);
    
    // Проверка на главного администратора (суперадмин)
    if (username === 'admin' && password === 'lomakin2006') {
      console.log('Аутентификация главного администратора успешна');
      
      // Сохраняем информацию о входе в localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUsername', username);
      localStorage.setItem('adminRole', 'superadmin');
      
      return {
        success: true,
        username: username,
        role: 'superadmin'
      };
    }
    
    // Если это не главный администратор, проверяем в базе данных
    const adminQuery = query(
      collection(db, ADMIN_ACCOUNTS_COLLECTION),
      where('username', '==', username)
    );
    
    const querySnapshot = await getDocs(adminQuery);
    
    if (querySnapshot.empty) {
      console.error('Администратор не найден');
      throw new Error('Неверное имя пользователя или пароль');
    }
    
    const adminDoc = querySnapshot.docs[0];
    const adminData = adminDoc.data();
    
    // Проверяем пароль
    if (adminData.password !== password) {
      console.error('Неверный пароль');
      throw new Error('Неверное имя пользователя или пароль');
    }
    
    // Проверяем, активна ли учетная запись
    if (!adminData.isActive) {
      console.error('Учетная запись деактивирована');
      throw new Error('Ваша учетная запись деактивирована. Обратитесь к главному администратору.');
    }
    
    // Проверяем срок действия
    if (adminData.expiresAt) {
      const expiresAt = adminData.expiresAt.toDate ? adminData.expiresAt.toDate() : new Date(adminData.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        console.error('Срок действия учетной записи истек');
        throw new Error('Срок действия вашей учетной записи истек. Обратитесь к главному администратору.');
      }
    }
    
    // Обновляем время последнего входа
    await updateDoc(doc(db, ADMIN_ACCOUNTS_COLLECTION, adminDoc.id), {
      lastLoginAt: serverTimestamp()
    });
    
    // Сохраняем информацию о входе в localStorage
    localStorage.setItem('adminAuthenticated', 'true');
    localStorage.setItem('adminUsername', adminData.username);
    localStorage.setItem('adminRole', adminData.role);
    
    return {
      success: true,
      username: adminData.username,
      role: adminData.role
    };
  } catch (error) {
    console.error('Ошибка при аутентификации администратора:', error);
    throw error;
  }
}; 
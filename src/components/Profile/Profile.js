import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaRoute, FaStar, FaEdit, FaSignOutAlt, FaTimes, 
  FaCheck, FaCamera, FaClock, FaMapMarkerAlt, 
  FaTrash, FaEye, FaWalking, FaEnvelope, FaPhone, FaCalendarAlt,
  FaShieldAlt, FaCrown, FaUserCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getUserRoutes, deleteRoute, addReview, getUserReviews } from '../../services/routeService'; // Импортируем функции из сервиса маршрутов
import { getUserById, isSubscribedToGuide, subscribeToGuide, unsubscribeFromGuide, updateUserProfile } from '../../services/userService';
import './Profile.css';
import { Container, Box, Typography, Avatar, Button, Grid, Paper, Divider, Chip, CircularProgress, Tabs, Tab, Alert, Tooltip } from '@mui/material';
import GuideProfile from './GuideProfile';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('routes');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewCase, setReviewCase] = useState(1);
  const [selectedAspects, setSelectedAspects] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRouteForReview, setSelectedRouteForReview] = useState(null);
  const [reviewStep, setReviewStep] = useState(0); // 0: не начат, 1: тест, 2: отзыв, 3: оценка
  const [reviewData, setReviewData] = useState({
    likedAspects: [],
    dislikedAspects: [],
    comment: '',
    rating: 0
  });
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [error, setError] = useState(null);
  const [isGuide, setIsGuide] = useState(false);
  const fileInputRef = useRef(null);

  // Аспекты маршрута для оценки
  const routeAspects = [
    { id: 'pace', label: 'Темп маршрута' },
    { id: 'attractions', label: 'Интересные места' },
    { id: 'difficulty', label: 'Сложность маршрута' },
    { id: 'duration', label: 'Длительность' },
    { id: 'navigation', label: 'Удобство навигации' },
    { id: 'surroundings', label: 'Окружающая среда' }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Если userId не указан, используем текущего пользователя
        const targetUserId = userId || currentUser?.uid;

        if (!targetUserId) {
          throw new Error('Пользователь не найден');
        }

        const userData = await getUserById(targetUserId);
        if (!userData) {
          throw new Error('Пользователь не найден');
        }

        setUserData(userData);
        setIsGuide(userData.isGuide || false);
        setIsAdmin(userData.role === 'admin' || userData.role === 'owner');

        // Загружаем маршруты пользователя
        const routes = await getUserRoutes(targetUserId);
        setSavedRoutes(routes);

        // Загружаем отзывы пользователя
        const userReviews = await getUserReviews(targetUserId);
        setReviews(userReviews);

        setAnimateIn(true);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  useEffect(() => {
    fetchSavedRoutes();
  }, [userData]);

  useEffect(() => {
    if (activeTab === 'reviews' && userData) {
      fetchUserReviews();
    }
  }, [activeTab, userData]);

  useEffect(() => {
    // Запускаем анимацию после загрузки данных
    if (!isLoading && userData) {
      setTimeout(() => {
        setAnimateIn(true);
      }, 100);
    }
  }, [isLoading, userData]);

  const fetchSavedRoutes = async () => {
    if (!userData) {
      setSavedRoutes([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Используем функцию из сервиса маршрутов для получения маршрутов пользователя из Firestore
      const routes = await getUserRoutes(userData.uid);
      setSavedRoutes(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Ошибка при загрузке маршрутов');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    if (!userData) return;
    
    setIsLoadingReviews(true);
    try {
      // Получаем отзывы пользователя из Firestore
      const reviews = await getUserReviews(userData.uid);
      setReviews(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      // Используем функцию из сервиса маршрутов для удаления маршрута из Firestore
      await deleteRoute(routeId);
      // Обновляем список маршрутов
      fetchSavedRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      setError('Ошибка при удалении маршрута');
    }
  };

  // Если идет загрузка, показываем индикатор
  if (isLoading) {
    return (
      <Container maxWidth="lg" className="profile-container">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <Container maxWidth="lg" className="profile-container">
        <Box sx={{ textAlign: 'center', my: 5 }}>
          <div className="tg-alert tg-alert-error">
            <Typography variant="h5">Ошибка</Typography>
            <Typography variant="body1" color="textSecondary">
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Вернуться на главную
            </Button>
          </div>
        </Box>
      </Container>
    );
  }

  // Если данные пользователя не загружены, показываем сообщение
  if (!userData) {
    return (
      <Container maxWidth="lg" className="profile-container">
        <Box sx={{ textAlign: 'center', my: 5 }}>
          <div className="tg-alert tg-alert-error">
            <Typography variant="h5">Профиль не найден</Typography>
            <Typography variant="body1" color="textSecondary">
              Запрашиваемый профиль не существует или был удален.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Вернуться на главную
            </Button>
          </div>
        </Box>
      </Container>
    );
  }

  // Если это профиль гида, показываем компонент GuideProfile
  if (isGuide && userId) {
    return <GuideProfile userData={userData} />;
  }

  const handleEditClick = () => {
    setEditedUser({
      displayName: userData.displayName,
      email: userData.email,
      bio: userData.bio || '',
      phone: userData.phone || '',
      location: userData.location || '',
      role: userData.role || 'user',
      isVerified: userData.isVerified || false
    });
    setIsEditModalOpen(true);
  };

  const handleVerificationToggle = () => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        isVerified: !editedUser.isVerified
      });
    }
  };

  const handleRoleChange = (e) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        role: e.target.value
      });
    }
  };

  // Функция для отображения значка роли пользователя
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'developer':
        return (
          <Tooltip title="Разработчик">
            <span className="user-role-badge developer">
              <FaShieldAlt style={{ marginRight: '5px' }} /> Разработчик
            </span>
          </Tooltip>
        );
      case 'owner':
        return (
          <Tooltip title="Владелец">
            <span className="user-role-badge owner">
              <FaCrown style={{ marginRight: '5px' }} /> Владелец
            </span>
          </Tooltip>
        );
      case 'admin':
        return (
          <Tooltip title="Администратор">
            <span className="user-role-badge admin">
              <FaUserCog style={{ marginRight: '5px' }} /> Администратор
            </span>
          </Tooltip>
        );
      case 'guide':
        return (
          <Tooltip title="Гид">
            <span className="user-role-badge">
              <FaRoute style={{ marginRight: '5px' }} /> Гид
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    // Здесь должна быть функция для выхода пользователя
    navigate('/');
  };

  // Форматирование даты с учетом разных форматов (Timestamp, ISO string, Date)
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Не указана';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      // Если это Firestore Timestamp
      if (dateValue && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('ru-RU', options);
      }
      
      // Если это строка ISO
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString('ru-RU', options);
      }
      
      // Если это объект Date
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('ru-RU', options);
      }
      
      return 'Не указана';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Не указана';
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, загрузите изображение');
        return;
      }

      try {
        setIsUploading(true);
        
        // Создаем ссылку на файл в Firebase Storage
        const storageRef = ref(storage, `avatars/${userData.uid}/${Date.now()}_${file.name}`);
        
        // Загружаем файл с отслеживанием прогресса
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Отслеживаем прогресс загрузки
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            // Обрабатываем ошибки
            console.error('Error uploading file:', error);
            toast.error('Ошибка при загрузке файла');
            setIsUploading(false);
          }, 
          async () => {
            // Загрузка завершена успешно
            try {
              // Получаем URL загруженного файла
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Обновляем данные пользователя в Firestore
              await updateDoc(doc(db, 'users', userData.uid), {
                photoURL: downloadURL
              });
              
              // Обновляем локальное состояние
              setUserData({
                ...userData,
                photoURL: downloadURL
              });
              
              toast.success('Фото профиля обновлено');
            } catch (error) {
              console.error('Error updating user profile:', error);
              toast.error('Ошибка при обновлении профиля');
            } finally {
              setIsUploading(false);
              setUploadProgress(0);
            }
          }
        );
      } catch (error) {
        console.error('Error handling file upload:', error);
        toast.error('Ошибка при загрузке фото');
        setIsUploading(false);
      }
    }
  };

  // Функция для обработки ошибок загрузки изображения
  const handleImageError = (e) => {
    e.target.src = '';
    e.target.classList.add('default-avatar');
  };

  const handleStartReview = (route) => {
    setSelectedRouteForReview(route);
    setReviewStep(1);
    setReviewData({
      likedAspects: [],
      dislikedAspects: [],
      comment: '',
      rating: 0
    });
  };

  const handleAspectToggle = (aspectId, isLiked) => {
    setReviewData(prev => {
      const newData = { ...prev };
      if (isLiked) {
        newData.likedAspects = newData.likedAspects.includes(aspectId)
          ? newData.likedAspects.filter(id => id !== aspectId)
          : [...newData.likedAspects, aspectId];
        newData.dislikedAspects = newData.dislikedAspects.filter(id => id !== aspectId);
      } else {
        newData.dislikedAspects = newData.dislikedAspects.includes(aspectId)
          ? newData.dislikedAspects.filter(id => id !== aspectId)
          : [...newData.dislikedAspects, aspectId];
        newData.likedAspects = newData.likedAspects.filter(id => id !== aspectId);
      }
      return newData;
    });
  };

  const handleSubmitReview = async () => {
    try {
      if (!selectedRouteForReview) return;

      const reviewToSubmit = {
        likedAspects: reviewData.likedAspects,
        dislikedAspects: reviewData.dislikedAspects,
        comment: reviewData.comment,
        rating: reviewData.rating
      };

      // Передаем routeId первым параметром, а данные отзыва - вторым
      await addReview(selectedRouteForReview.id, reviewToSubmit);

      // Сбрасываем состояние формы отзыва
      setSelectedRouteForReview(null);
      setReviewStep(0);
      setReviewData({
        likedAspects: [],
        dislikedAspects: [],
        comment: '',
        rating: 0
      });

      // Обновляем список отзывов
      fetchUserReviews();

      // Показываем уведомление об успешном добавлении отзыва
      setError('Отзыв успешно добавлен');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Ошибка при добавлении отзыва: ' + error.message);
    }
  };

  const renderReviewForm = () => {
    if (!selectedRouteForReview) return null;

    switch (reviewStep) {
      case 0: // Начальный экран
        return (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Оставить отзыв о маршруте
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              "{selectedRouteForReview.name}"
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Поделитесь своим опытом и помогите другим путешественникам!
            </Typography>
          </Box>
        );
        
      case 1: // Тест с аспектами
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Что вам понравилось?
            </Typography>
            
            <Grid container spacing={1}>
              {routeAspects.map(aspect => (
                <Grid item xs={12} key={aspect.id}>
                  <Box 
                    className="aspect-item"
                    onClick={() => handleAspectToggle(aspect.id, true)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: reviewData.likedAspects.includes(aspect.id) 
                        ? 'rgba(100, 188, 212, 0.1)' 
                        : 'var(--tg-card-bg)',
                      borderColor: reviewData.likedAspects.includes(aspect.id) 
                        ? 'var(--tg-accent-color)' 
                        : 'transparent'
                    }}
                  >
                    <Typography variant="body2">{aspect.label}</Typography>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: reviewData.likedAspects.includes(aspect.id) 
                        ? 'var(--tg-accent-color)' 
                        : 'var(--tg-secondary-bg)',
                    }}>
                      {reviewData.likedAspects.includes(aspect.id) && (
                        <FaCheck size={12} color="#fff" />
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
              Выберите хотя бы один аспект, который вам понравился
            </Typography>
          </Box>
        );

      case 2: // Развернутый отзыв
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Напишите свой отзыв
            </Typography>
            
            <textarea
              placeholder="Расскажите подробнее о вашем опыте..."
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              style={{ 
                width: '100%', 
                minHeight: '120px',
                padding: '12px', 
                backgroundColor: 'var(--tg-card-bg)', 
                border: '1px solid var(--tg-border-color)', 
                borderRadius: 'var(--tg-button-radius)', 
                color: 'var(--tg-text-primary)',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              Опишите ваши впечатления от маршрута
            </Typography>
          </Box>
        );

      case 3: // Финальная оценка
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Поставьте финальную оценку
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Box
                  key={star}
                  onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    transform: reviewData.rating >= star ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  <FaStar 
                    className={reviewData.rating >= star ? "rating-star active" : "rating-star"} 
                    size={32}
                  />
                </Box>
              ))}
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              {reviewData.rating === 5 ? 'Отлично! Маршрут превзошел ожидания!' :
               reviewData.rating === 4 ? 'Хороший маршрут, рекомендую!' :
               reviewData.rating === 3 ? 'Неплохой маршрут, есть над чем поработать' :
               reviewData.rating === 2 ? 'Маршрут не оправдал ожиданий' :
               reviewData.rating === 1 ? 'Маршрут разочаровал' :
               'Выберите оценку от 1 до 5 звезд'}
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Проверяем обязательные поля
      if (!editedUser.displayName.trim()) {
        toast.error('Имя пользователя не может быть пустым');
        return;
      }
      
      if (!editedUser.email.trim()) {
        toast.error('Email не может быть пустым');
        return;
      }
      
      // Обновляем данные пользователя в Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        displayName: editedUser.displayName,
        email: editedUser.email,
        bio: editedUser.bio,
        phone: editedUser.phone,
        location: editedUser.location,
        role: editedUser.role,
        isVerified: editedUser.isVerified
      });
      
      // Обновляем локальное состояние
      setUserData({
        ...userData,
        displayName: editedUser.displayName,
        email: editedUser.email,
        bio: editedUser.bio,
        phone: editedUser.phone,
        location: editedUser.location,
        role: editedUser.role,
        isVerified: editedUser.isVerified
      });
      
      setIsEditModalOpen(false);
      toast.success('Профиль успешно обновлен');
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Ошибка при обновлении профиля: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  // Функция быстрой верификации пользователя
  const handleQuickVerify = async () => {
    try {
      // Обновляем данные пользователя в Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        isVerified: true
      });
      
      // Обновляем локальное состояние
      setUserData({
        ...userData,
        isVerified: true
      });
      
      toast.success(`Пользователь ${userData.displayName} успешно верифицирован`);
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Ошибка при верификации пользователя: ' + (error.message || 'Неизвестная ошибка'));
    }
  };
  
  // Функция снятия верификации пользователя
  const handleQuickUnverify = async () => {
    try {
      // Обновляем данные пользователя в Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        isVerified: false
      });
      
      // Обновляем локальное состояние
      setUserData({
        ...userData,
        isVerified: false
      });
      
      toast.success(`Верификация пользователя ${userData.displayName} снята`);
    } catch (error) {
      console.error('Error unverifying user:', error);
      toast.error('Ошибка при снятии верификации: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  return (
    <Container maxWidth="lg" className="profile-container">
      {error && (
        <div className="tg-alert tg-alert-error">
          <Typography variant="body1">{error}</Typography>
        </div>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="loading-spinner"></div>
        </Box>
      ) : (
        <>
          <div className={`profile-header ${animateIn ? 'fade-in' : ''}`} style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease'
          }}>
            <Grid container spacing={2} direction="column">
              {/* Аватарка и информация о пользователе */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
                  {/* Аватарка */}
                  <Box sx={{ position: 'relative' }}>
                    <Avatar 
                      src={userData.photoURL} 
                      alt={userData.displayName} 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        border: '3px solid var(--primary-color)',
                        boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.5)'
                      }}
                      onError={handleImageError}
                    />
                    {currentUser && currentUser.uid === userData.uid && (
                      <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                        <div 
                          className="avatar-edit-icon"
                          onClick={handleAvatarClick}
                        >
                          <FaCamera />
                        </div>
                      </Box>
                    )}
                    {isUploading && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%'
                        }}
                      >
                        <CircularProgress 
                          variant="determinate" 
                          value={uploadProgress} 
                          sx={{ color: 'var(--primary-color)' }}
                        />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Информация о пользователе */}
                  <Box sx={{ flex: 1 }}>
                    {/* Имя пользователя */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {userData.displayName}
                        {userData.isVerified && (
                          <Tooltip title="Верифицированный пользователь">
                            <span className="verified-badge">
                              <FaCheck />
                            </span>
                          </Tooltip>
                        )}
                      </Typography>
                      {userData.role && userData.role !== 'user' && renderRoleBadge(userData.role)}
                    </Box>
                    
                    {/* Описание профиля */}
                    {userData.bio && (
                      <Box className="profile-bio">
                        <Typography variant="body2" color="textSecondary">
                          {userData.bio}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Контактная информация */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, mb: 2 }}>
                      <div className="tg-info-item">
                        <FaEnvelope className="tg-list-item-icon" />
                        <Typography variant="body2">{userData.email}</Typography>
                      </div>
                      
                      {userData.phone && (
                        <div className="tg-info-item">
                          <FaPhone className="tg-list-item-icon" />
                          <Typography variant="body2">{userData.phone}</Typography>
                        </div>
                      )}
                      
                      {userData.location && (
                        <div className="tg-info-item">
                          <FaMapMarkerAlt className="tg-list-item-icon" />
                          <Typography variant="body2">{userData.location}</Typography>
                        </div>
                      )}
                      
                      <div className="tg-info-item">
                        <FaCalendarAlt className="tg-list-item-icon" />
                        <Typography variant="body2">
                          Дата регистрации: {formatDate(userData.createdAt)}
                        </Typography>
                      </div>
                    </Box>
                    
                    {/* Кнопка редактирования */}
                    {currentUser && currentUser.uid === userData.uid && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <button className="tg-button" onClick={handleEditClick}>
                          <FaEdit /> Редактировать профиль
                        </button>
                        <button className="tg-button tg-button-secondary" onClick={() => fileInputRef.current.click()}>
                          <FaCamera /> Фото
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </Box>
                    )}
                    
                    {/* Кнопка для администраторов */}
                    {isAdmin && currentUser && currentUser.uid !== userData.uid && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <button className="tg-button" onClick={handleEditClick}>
                          <FaUserCog /> Управление пользователем
                        </button>
                        {!userData.isVerified && (
                          <button 
                            className="tg-button tg-button-secondary" 
                            onClick={handleQuickVerify}
                            title="Верифицировать пользователя"
                          >
                            <FaCheck /> Верифицировать
                          </button>
                        )}
                        {userData.isVerified && (
                          <button 
                            className="tg-button tg-button-secondary" 
                            onClick={handleQuickUnverify}
                            title="Снять верификацию"
                          >
                            <FaTimes /> Снять верификацию
                          </button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </div>

          <Box sx={{ mt: 3 }} style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ 
                borderBottom: '1px solid var(--tg-border)',
                mb: 3
              }}
            >
              <Tab 
                value="routes" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaRoute /> Маршруты
                  </Box>
                } 
                className={`custom-tab ${activeTab === 'routes' ? 'Mui-selected' : ''}`}
              />
              <Tab 
                value="reviews" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaStar /> Отзывы
                  </Box>
                } 
                className={`custom-tab ${activeTab === 'reviews' ? 'Mui-selected' : ''}`}
              />
            </Tabs>

            {activeTab === 'routes' && (
              <>
                {currentUser && currentUser.uid === userData.uid && (
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="tg-button" onClick={() => navigate('/create-route')}>
                      <FaRoute /> Создать новый маршрут
                    </button>
                  </Box>
                )}
                
                {savedRoutes.length === 0 ? (
                  <div className="tg-alert">
                    <Typography variant="body1" align="center">
                      {currentUser && currentUser.uid === userData.uid 
                        ? 'У вас пока нет сохраненных маршрутов. Создайте свой первый маршрут!' 
                        : 'У пользователя пока нет сохраненных маршрутов.'}
                    </Typography>
                  </div>
                ) : (
                  <Grid container spacing={3}>
                    {savedRoutes.map((route, index) => (
                      <Grid item xs={12} sm={6} md={4} key={route.id}>
                        <div className="route-card" 
                          onClick={() => navigate(`/route/${route.id}`)}
                          style={{
                            opacity: animateIn ? 1 : 0,
                            transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
                            transition: `opacity 0.5s ease ${0.3 + index * 0.1}s, transform 0.5s ease ${0.3 + index * 0.1}s`
                          }}
                        >
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                              {route.name}
                            </Typography>
                            
                            <div className="tg-divider"></div>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <FaMapMarkerAlt className="tg-list-item-icon" />
                              <Typography variant="body2">
                                {route.startPoint && route.endPoint 
                                  ? `${route.startPoint} → ${route.endPoint}`
                                  : 'Маршрут без указания точек'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <FaWalking className="tg-list-item-icon" />
                              <Typography variant="body2">
                                {route.distance ? `${route.distance} км` : 'Расстояние не указано'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FaClock className="tg-list-item-icon" />
                              <Typography variant="body2">
                                {route.duration ? `${route.duration} мин` : 'Длительность не указана'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
                              {route.tags && route.tags.map(tag => (
                                <span key={tag} className="tg-chip">
                                  {tag}
                                </span>
                              ))}
                            </Box>
                            
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                              <button 
                                className="tg-button tg-button-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/route/${route.id}`);
                                }}
                              >
                                <FaEye /> Просмотр
                              </button>
                              
                              {currentUser && currentUser.uid === userData.uid && (
                                <button 
                                  className="tg-button tg-button-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoute(route.id);
                                  }}
                                >
                                  <FaTrash /> Удалить
                                </button>
                              )}
                            </Box>
                          </Box>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                {isLoadingReviews ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <div className="loading-spinner"></div>
                  </Box>
                ) : (
                  <>
                    {reviews.length === 0 ? (
                      <div className="tg-alert">
                        <Typography variant="body1" align="center">
                          {currentUser && currentUser.uid === userData.uid 
                            ? 'Вы еще не оставили ни одного отзыва о маршрутах.' 
                            : 'Пользователь еще не оставил ни одного отзыва о маршрутах.'}
                        </Typography>
                      </div>
                    ) : (
                      <Grid container spacing={2}>
                        {reviews.map(review => (
                          <Grid item xs={12} key={review.id}>
                            <div className="review-form">
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FaRoute className="tg-list-item-icon" />
                                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {review.routeName || 'Маршрут'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar 
                                      key={i} 
                                      className={i < review.rating ? "rating-star active" : "rating-star"} 
                                      style={{ fontSize: '1.2rem' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                              
                              <div className="tg-divider"></div>
                              
                              <Typography variant="body1" sx={{ my: 1.5 }}>
                                {review.comment}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                {review.likedAspects && review.likedAspects.length > 0 && (
                                  review.likedAspects.map(aspect => (
                                    <span key={aspect} className="tg-chip">
                                      <FaCheck size={10} className="tg-chip-icon" /> {aspect}
                                    </span>
                                  ))
                                )}
                                
                                {review.dislikedAspects && review.dislikedAspects.length > 0 && (
                                  review.dislikedAspects.map(aspect => (
                                    <span key={aspect} className="tg-chip" style={{ background: 'rgba(229, 57, 53, 0.1)' }}>
                                      <FaTimes size={10} className="tg-chip-icon" style={{ color: '#e53935' }} /> {aspect}
                                    </span>
                                  ))
                                )}
                              </Box>
                              
                              <Box sx={{ mt: 1, textAlign: 'right' }}>
                                <Typography variant="caption" color="textSecondary">
                                  {formatDate(review.createdAt)}
                                </Typography>
                              </Box>
                            </div>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </>
      )}
      
      {/* Модальное окно для редактирования профиля */}
      {isEditModalOpen && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}
        >
          <Box 
            sx={{ 
              width: '90%', 
              maxWidth: 450, 
              backgroundColor: 'var(--tg-surface)', 
              borderRadius: '16px', 
              p: 2.5,
              boxShadow: 'var(--tg-card-shadow)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FaEdit className="tg-list-item-icon" style={{ marginRight: '10px' }} />
              <Typography variant="h6">Редактирование профиля</Typography>
            </Box>
            
            <div className="tg-divider"></div>
            
            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Имя пользователя</Typography>
              <input 
                type="text" 
                name="displayName"
                value={editedUser?.displayName || ''} 
                onChange={(e) => setEditedUser(prev => ({ ...prev, displayName: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                  border: '1px solid var(--tg-border)', 
                  borderRadius: '12px', 
                  color: 'var(--tg-text)',
                  fontSize: '0.95rem'
                }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Email</Typography>
              <input 
                type="email" 
                name="email"
                value={editedUser?.email || ''} 
                onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                  border: '1px solid var(--tg-border)', 
                  borderRadius: '12px', 
                  color: 'var(--tg-text)',
                  fontSize: '0.95rem'
                }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Описание</Typography>
              <textarea 
                name="bio"
                value={editedUser?.bio || ''} 
                onChange={(e) => setEditedUser(prev => ({ ...prev, bio: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                  border: '1px solid var(--tg-border)', 
                  borderRadius: '12px', 
                  color: 'var(--tg-text)',
                  fontSize: '0.95rem',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </Box>
            
            <div className="tg-divider"></div>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 2 }}>
              Контактная информация
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Телефон</Typography>
              <input 
                type="tel" 
                name="phone"
                value={editedUser?.phone || ''} 
                onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                  border: '1px solid var(--tg-border)', 
                  borderRadius: '12px', 
                  color: 'var(--tg-text)',
                  fontSize: '0.95rem'
                }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Местоположение</Typography>
              <input 
                type="text" 
                name="location"
                value={editedUser?.location || ''} 
                onChange={(e) => setEditedUser(prev => ({ ...prev, location: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                  border: '1px solid var(--tg-border)', 
                  borderRadius: '12px', 
                  color: 'var(--tg-text)',
                  fontSize: '0.95rem'
                }}
              />
            </Box>
            
            {/* Дополнительные поля для администраторов */}
            {isAdmin && (
              <>
                <div className="tg-divider"></div>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 2, color: 'var(--tg-primary)' }}>
                  Настройки администратора
                </Typography>
                
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id="verified-checkbox"
                    checked={editedUser?.isVerified || false} 
                    onChange={handleVerificationToggle}
                    style={{ marginRight: '10px' }}
                  />
                  <label htmlFor="verified-checkbox" style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Верифицированный пользователь</span>
                    <span className="verified-badge" style={{ marginLeft: '8px', width: '16px', height: '16px' }}>
                      <FaCheck size={10} />
                    </span>
                  </label>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Роль пользователя</Typography>
                  <select 
                    name="role"
                    value={editedUser?.role || 'user'} 
                    onChange={(e) => setEditedUser(prev => ({ ...prev, role: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      backgroundColor: 'rgba(21, 21, 21, 0.7)', 
                      border: '1px solid var(--tg-border)', 
                      borderRadius: '12px', 
                      color: 'var(--tg-text)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="user">Пользователь</option>
                    <option value="guide">Гид</option>
                    <option value="admin">Администратор</option>
                    <option value="developer">Разработчик</option>
                    <option value="owner">Владелец</option>
                  </select>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <button className="tg-button tg-button-secondary" onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </button>
              <button className="tg-button" onClick={handleSaveEdit}>
                Сохранить
              </button>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Модальное окно для отзыва */}
      {selectedRouteForReview && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}
        >
          <Box 
            sx={{ 
              width: '90%', 
              maxWidth: 500, 
              backgroundColor: 'var(--tg-secondary-bg)', 
              borderRadius: 'var(--tg-card-radius)', 
              p: 2.5,
              boxShadow: 'var(--tg-shadow)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FaStar className="tg-list-item-icon" style={{ marginRight: '10px' }} />
              <Typography variant="h6">Отзыв о маршруте</Typography>
            </Box>
            
            <div className="tg-divider"></div>
            
            {renderReviewForm()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <button 
                className="tg-button tg-button-secondary" 
                onClick={() => {
                  setSelectedRouteForReview(null);
                  setReviewStep(0);
                  setReviewData({
                    likedAspects: [],
                    dislikedAspects: [],
                    comment: '',
                    rating: 0
                  });
                }}
              >
                Отмена
              </button>
              
              {reviewStep > 0 && (
                <button 
                  className="tg-button tg-button-secondary" 
                  onClick={() => setReviewStep(prev => prev - 1)}
                >
                  Назад
                </button>
              )}
              
              {reviewStep < 3 ? (
                <button 
                  className="tg-button" 
                  onClick={() => setReviewStep(prev => prev + 1)}
                  disabled={
                    (reviewStep === 1 && reviewData.likedAspects.length === 0) ||
                    (reviewStep === 2 && !reviewData.comment)
                  }
                >
                  Далее
                </button>
              ) : (
                <button 
                  className="tg-button" 
                  onClick={handleSubmitReview}
                  disabled={reviewData.rating === 0}
                >
                  Отправить
                </button>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default Profile; 
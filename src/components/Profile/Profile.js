import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaRoute, FaStar, FaEdit, FaSignOutAlt, FaTimes, 
  FaCheck, FaCamera, FaClock, FaMapMarkerAlt, 
  FaTrash, FaEye, FaWalking 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [selectedRouteForReview, setSelectedRouteForReview] = useState(null);
  const [reviewStep, setReviewStep] = useState(0); // 0: не начат, 1: тест, 2: отзыв, 3: оценка
  const [reviewData, setReviewData] = useState({
    likedAspects: [],
    dislikedAspects: [],
    comment: '',
    rating: 0
  });
  const [userReviews, setUserReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const fileInputRef = useRef(null);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchSavedRoutes();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'reviews' && user) {
      fetchUserReviews();
    }
  }, [activeTab, user]);

  const fetchSavedRoutes = async () => {
    try {
      const response = await fetch(`http://localhost:3005/api/user-routes/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      const data = await response.json();
      setSavedRoutes(data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`http://localhost:3005/api/user-reviews/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setUserReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Ошибка при загрузке отзывов');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      const response = await fetch(`http://localhost:3005/api/routes/${routeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete route');
      }

      setSavedRoutes(routes => routes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedUser({
      username: user.username,
      email: user.email
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser(null);
  };

  const handleSaveEdit = () => {
    // Обновляем данные пользователя
    const updatedUser = {
      ...user,
      ...editedUser
    };
    login(updatedUser); // Используем login для обновления данных в контексте
    setIsEditing(false);
    setEditedUser(null);
  };

  const handleChange = (e) => {
    setEditedUser({
      ...editedUser,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, загрузите изображение');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch('http://localhost:3005/api/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload avatar');
        }

        const data = await response.json();
        const updatedUser = {
          ...user,
          avatar: data.avatarUrl
        };
        login(updatedUser);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setError('Ошибка при загрузке аватара. Пожалуйста, попробуйте снова.');
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
      const reviewPayload = {
        userId: user.id,
        routeId: selectedRouteForReview.id,
        likedAspects: reviewData.likedAspects,
        dislikedAspects: reviewData.dislikedAspects,
        comment: reviewData.comment,
        rating: reviewData.rating
      };

      const response = await fetch('http://localhost:3005/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      // Сбрасываем состояние отзыва
      setSelectedRouteForReview(null);
      setReviewStep(0);
      setReviewData({
        likedAspects: [],
        dislikedAspects: [],
        comment: '',
        rating: 0
      });

      // Обновляем список маршрутов
      fetchSavedRoutes();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Ошибка при сохранении отзыва. Пожалуйста, попробуйте снова.');
    }
  };

  const renderReviewForm = () => {
    if (!selectedRouteForReview) return null;

    switch (reviewStep) {
      case 1: // Тест с аспектами
        return (
          <div className="review-form">
            <h3>Оцените аспекты маршрута "{selectedRouteForReview.name}"</h3>
            <div className="aspects-grid">
              {routeAspects.map(aspect => (
                <div key={aspect.id} className="aspect-item">
                  <span>{aspect.label}</span>
                  <div className="aspect-buttons">
                    <button
                      className={`like-btn ${reviewData.likedAspects.includes(aspect.id) ? 'active' : ''}`}
                      onClick={() => handleAspectToggle(aspect.id, true)}
                    >
                      👍
                    </button>
                    <button
                      className={`dislike-btn ${reviewData.dislikedAspects.includes(aspect.id) ? 'active' : ''}`}
                      onClick={() => handleAspectToggle(aspect.id, false)}
                    >
                      👎
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="review-actions">
              <button className="cancel-btn" onClick={() => setSelectedRouteForReview(null)}>
                Отмена
              </button>
              <button 
                className="next-btn"
                onClick={() => setReviewStep(2)}
                disabled={reviewData.likedAspects.length === 0 && reviewData.dislikedAspects.length === 0}
              >
                Далее
              </button>
            </div>
          </div>
        );

      case 2: // Развернутый отзыв
        return (
          <div className="review-form">
            <h3>Напишите свой отзыв</h3>
            <textarea
              className="review-textarea"
              placeholder="Расскажите подробнее о вашем опыте..."
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            />
            <div className="review-actions">
              <button className="back-btn" onClick={() => setReviewStep(1)}>
                Назад
              </button>
              <button 
                className="next-btn"
                onClick={() => setReviewStep(3)}
                disabled={!reviewData.comment.trim()}
              >
                Далее
              </button>
            </div>
          </div>
        );

      case 3: // Финальная оценка
        return (
          <div className="review-form">
            <h3>Поставьте финальную оценку</h3>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${reviewData.rating >= star ? 'active' : ''}`}
                  onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="review-actions">
              <button className="back-btn" onClick={() => setReviewStep(2)}>
                Назад
              </button>
              <button 
                className="submit-btn"
                onClick={handleSubmitReview}
                disabled={!reviewData.rating}
              >
                Сохранить отзыв
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSavedRoutes = () => {
    if (loading) {
      return <div className="loading">Загрузка маршрутов...</div>;
    }

    if (savedRoutes.length === 0) {
      return (
        <div className="empty-routes">
          <FaRoute className="empty-routes-icon" />
          <p>У вас пока нет сохраненных маршрутов</p>
          <button className="create-route-btn" onClick={() => navigate('/create-route')}>
            Создать первый маршрут
          </button>
        </div>
      );
    }

    return (
      <div className="saved-routes-container">
        {savedRoutes.map(route => (
          <div key={route.id} className="saved-route-card">
            <h3 className="saved-route-title">{route.name}</h3>
            <div className="saved-route-info">
              <div className="route-stat">
                <FaClock className="route-stat-icon" />
                <span>{route.duration} часов</span>
              </div>
              <div className="route-stat">
                <FaWalking className="route-stat-icon" />
                <span>{route.pace === 'relaxed' ? 'Расслабленный' : 
                       route.pace === 'moderate' ? 'Умеренный' : 'Активный'}</span>
              </div>
              <div className="route-stat">
                <FaMapMarkerAlt className="route-stat-icon" />
                <span>{route.points?.length || 0} точек маршрута</span>
              </div>
            </div>
            <div className="saved-route-actions">
              <button 
                className="view-route-btn"
                onClick={() => navigate(`/route/${route.id}`)}
              >
                <FaEye /> Просмотреть
              </button>
              <button 
                className="review-route-btn"
                onClick={() => handleStartReview(route)}
              >
                <FaStar /> Оценить
              </button>
              <button 
                className="delete-route-btn"
                onClick={() => handleDeleteRoute(route.id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReviews = () => {
    if (loadingReviews) {
      return <div className="loading">Загрузка отзывов...</div>;
    }

    if (userReviews.length === 0) {
      return (
        <div className="empty-state">
          <FaStar className="empty-icon" />
          <p>У вас пока нет отзывов</p>
          <button className="explore-btn" onClick={() => setActiveTab('routes')}>
            Оценить маршруты
          </button>
        </div>
      );
    }

    return (
      <div className="reviews-list">
        {userReviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <h3>{review.routeName}</h3>
              <div className="review-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= review.rating ? 'star-filled' : 'star-empty'}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            <div className="review-aspects">
              {review.likedAspects.length > 0 && (
                <div className="liked-aspects">
                  <strong>Понравилось:</strong>
                  <div className="aspects-tags">
                    {review.likedAspects.map(aspect => (
                      <span key={aspect} className="aspect-tag liked">
                        {routeAspects.find(a => a.id === aspect)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {review.dislikedAspects.length > 0 && (
                <div className="disliked-aspects">
                  <strong>Можно улучшить:</strong>
                  <div className="aspects-tags">
                    {review.dislikedAspects.map(aspect => (
                      <span key={aspect} className="aspect-tag disliked">
                        {routeAspects.find(a => a.id === aspect)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="review-text">{review.comment}</p>
            <p className="review-date">Добавлен {formatDate(review.createdAt)}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar-container">
            <img 
              src={user.avatar || ''} 
              alt={user.username} 
              className="profile-avatar" 
              onError={handleImageError}
            />
            <div className="avatar-overlay">
              <button className="change-avatar-btn" onClick={handleAvatarClick} title="Изменить фото профиля">
                <FaCamera />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-details">
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  name="username"
                  value={editedUser.username}
                  onChange={handleChange}
                  className="edit-input"
                  placeholder="Имя пользователя"
                />
                <input
                  type="email"
                  name="email"
                  value={editedUser.email}
                  onChange={handleChange}
                  className="edit-input"
                  placeholder="Email"
                />
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveEdit}>
                    <FaCheck /> Сохранить
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    <FaTimes /> Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1>{user.username}</h1>
                <p className="email">{user.email}</p>
                <p className="join-date">На сайте с {formatDate(user.joinDate)}</p>
              </>
            )}
          </div>
        </div>
        <div className="profile-actions">
          {!isEditing && (
            <>
              <button className="edit-profile-btn" onClick={handleEditClick}>
                <FaEdit />
                Редактировать профиль
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt />
                Выйти
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="content-tabs">
          <button
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <FaRoute />
            Мои маршруты
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <FaStar />
            Мои отзывы
          </button>
        </div>

        <div className="tab-content">
          {selectedRouteForReview ? (
            renderReviewForm()
          ) : (
            <>
              {activeTab === 'routes' && renderSavedRoutes()}
              {activeTab === 'reviews' && renderReviews()}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default Profile; 
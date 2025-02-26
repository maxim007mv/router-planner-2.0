import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRoute, FaStar, FaEdit, FaSignOutAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

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

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar-container">
            <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} className="profile-avatar" />
            <div className="avatar-overlay">
              <button className="change-avatar-btn">
                <FaEdit />
              </button>
            </div>
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
          {activeTab === 'routes' && (
            <div className="empty-state">
              <FaRoute className="empty-icon" />
              <p>У вас пока нет сохраненных маршрутов</p>
              <button className="create-route-btn" onClick={() => navigate('/')}>
                Создать первый маршрут
              </button>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="empty-state">
              <FaStar className="empty-icon" />
              <p>У вас пока нет отзывов</p>
              <button className="explore-btn" onClick={() => navigate('/')}>
                Исследовать маршруты
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 
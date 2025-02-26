import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      setIsLoading(true);
      // Декодируем JWT токен от Google
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const { name, email, picture } = JSON.parse(jsonPayload);
      
      // Создаем пользователя из данных Google
      const userData = {
        username: name,
        email: email,
        avatar: picture,
        joinDate: new Date().toISOString()
      };
      
      login(userData);
      navigate('/profile');
    } catch (err) {
      setError('Ошибка при входе через Google');
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    // Инициализация Google Sign-In
    const initGoogleSignIn = () => {
      window.google?.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Замените на ваш ID клиента Google
        callback: handleGoogleResponse
      });
    };

    if (window.google?.accounts) {
      initGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    try {
      // Здесь будет реальный API запрос
      const userData = {
        username: formData.username,
        email: formData.email || `${formData.username}@example.com`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username}`,
        joinDate: new Date().toISOString()
      };
      
      login(userData);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Добро пожаловать!' : 'Создать аккаунт'}</h2>
            <p className="auth-subtitle">
              {isLogin 
                ? 'Войдите в свой аккаунт для доступа к маршрутам' 
                : 'Зарегистрируйтесь для создания персональных маршрутов'}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Вход
            </button>
            <button
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="Имя пользователя"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <div className="input-highlight"></div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <div className="input-highlight"></div>
              </div>
            )}

            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <div className="input-highlight"></div>
            </div>

            {!isLogin && (
              <div className="form-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Подтвердите пароль"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <div className="input-highlight"></div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div className="auth-divider">
            <span>или продолжить через</span>
          </div>

          <div className="social-auth">
            <div id="googleSignInButton"></div>
            <button 
              className="social-btn google"
              onClick={() => {
                window.google?.accounts.id.prompt();
              }}
              disabled={isLoading}
            >
              <FaGoogle />
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 
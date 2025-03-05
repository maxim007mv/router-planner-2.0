import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaClock, FaWalking, FaSun, FaMoon, 
  FaMapMarkerAlt, FaInfoCircle, FaLightbulb,
  FaCamera, FaUtensils, FaSubway, FaMap,
  FaUser, FaBookmark
} from 'react-icons/fa';
import {
  AttachMoney,
  Group,
  Restaurant
} from '@mui/icons-material';
import { getRouteById, saveRouteToUserProfile } from '../../services/routeService';
import './RouteDetails.css';

const RouteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const routeData = await getRouteById(id);
        console.log('Полученные данные маршрута:', routeData);
        setRoute(routeData);
      } catch (err) {
        console.error('Ошибка при получении маршрута:', err);
        setError(err.message || 'Маршрут не найден');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

  const handleSaveRoute = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSaveStatus('loading');
    try {
      await saveRouteToUserProfile(user.uid, id);
      setSaveStatus('success');
    } catch (err) {
      console.error('Ошибка при сохранении маршрута:', err);
      setSaveStatus('error');
    }
  };

  const getTimeIcon = (timeOfDay) => {
    switch (timeOfDay) {
      case 'morning':
        return <FaSun className="info-icon" />;
      case 'evening':
        return <FaMoon className="info-icon" />;
      default:
        return <FaClock className="info-icon" />;
    }
  };

  const getPaceIcon = (pace) => {
    switch (pace) {
      case 'relaxed':
        return '🚶‍♂️';
      case 'moderate':
        return '🚶‍♂️🚶‍♂️';
      case 'active':
        return '🏃‍♂️';
      default:
        return '🚶‍♂️';
    }
  };

  if (loading) {
    return (
      <div className="route-details-loading">
        <div className="loading-spinner">Загрузка маршрута...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="route-details-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="route-details-not-found">
        <h2>Маршрут не найден</h2>
      </div>
    );
  }

  return (
    <motion.div
      className="route-details-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="route-details-content">
        {!user && (
          <motion.div
            className="guest-notice"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <FaUser className="notice-icon" />
            <div className="notice-content">
              <p>Вы просматриваете маршрут как гость</p>
              <button className="auth-button" onClick={() => navigate('/auth')}>
                Войти, чтобы сохранить маршрут
              </button>
            </div>
          </motion.div>
        )}

        <h1 className="route-title">{route.name || route.title || 'Маршрут без названия'}</h1>
        
        <div className="route-info">
          <div className="info-item">
            <FaClock className="info-icon" />
            <span className="info-label">Длительность:</span>
            <span className="info-value">{route.duration || route.walkingTime || '2'} часов</span>
          </div>
          <div className="info-item">
            <FaWalking className="info-icon" />
            <span className="info-label">Темп:</span>
            <span className="info-value">
              {route.pace ? (
                route.pace === 'relaxed' ? 'Расслабленный' : 
                route.pace === 'moderate' ? 'Умеренный' : 
                route.pace === 'active' ? 'Активный' : route.pace
              ) : route.walkingPace ? (
                route.walkingPace === 'relaxed' ? 'Расслабленный' : 
                route.walkingPace === 'moderate' ? 'Умеренный' : 
                route.walkingPace === 'active' ? 'Активный' : route.walkingPace
              ) : 'Не указан'} {(route.pace || route.walkingPace) ? getPaceIcon(route.pace || route.walkingPace) : ''}
            </span>
          </div>
          <div className="info-item">
            {(route.timeOfDay || route.time) ? getTimeIcon(route.timeOfDay || route.time) : <FaClock className="info-icon" />}
            <span className="info-label">Время суток:</span>
            <span className="info-value">
              {route.timeOfDay ? (
                route.timeOfDay === 'morning' ? 'Утро' : 
                route.timeOfDay === 'afternoon' ? 'День' : 
                route.timeOfDay === 'evening' ? 'Вечер' : route.timeOfDay
              ) : route.time ? (
                route.time === 'morning' ? 'Утро' : 
                route.time === 'afternoon' ? 'День' : 
                route.time === 'evening' ? 'Вечер' : route.time
              ) : 'Не указано'}
            </span>
          </div>
          
          {/* Дополнительные поля для старого формата */}
          {route.cost && (
            <div className="info-item">
              <AttachMoney className="info-icon" />
              <span className="info-label">Стоимость:</span>
              <span className="info-value">{route.cost} ₽</span>
            </div>
          )}
          
          {route.companions && (
            <div className="info-item">
              <Group className="info-icon" />
              <span className="info-label">Компания:</span>
              <span className="info-value">{route.companions}</span>
            </div>
          )}
          
          {route.budget && (
            <div className="info-item">
              <AttachMoney className="info-icon" />
              <span className="info-label">Бюджет:</span>
              <span className="info-value">{route.budget}</span>
            </div>
          )}
        </div>

        {user && (
          <motion.div
            className="save-route-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={handleSaveRoute}
              disabled={saveStatus === 'loading' || saveStatus === 'success'}
              className={`save-button ${saveStatus}`}
            >
              <FaBookmark />
              {saveStatus === 'loading' ? 'Сохранение...' :
               saveStatus === 'success' ? 'Маршрут сохранен' :
               saveStatus === 'error' ? 'Ошибка сохранения' :
               'Сохранить маршрут'}
            </button>
          </motion.div>
        )}

        {(route.description || route.routeDescription) && (
          <div className="route-description">
            <h2><FaInfoCircle /> Обзор маршрута</h2>
            <p>{route.description || route.routeDescription}</p>
          </div>
        )}

        {route.recommendations && (
          <div className="route-description">
            <h2><Restaurant /> Рекомендации</h2>
            <p>{route.recommendations}</p>
          </div>
        )}

        <div className="route-points">
          <h2><FaMapMarkerAlt /> Точки маршрута</h2>
          {route.points && Array.isArray(route.points) && route.points.length > 0 ? (
            route.points.map((point, index) => (
              <motion.div
                key={index}
                className="route-point"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="point-number">{index + 1}</div>
                <div className="point-content">
                  <h3>{point.name || `Точка ${index + 1}`}</h3>
                  
                  {point.duration && (
                    <div className="point-duration">
                      <FaClock /> {point.duration}
                    </div>
                  )}

                  {point.description && (
                    <p className="point-description">{point.description}</p>
                  )}

                  {point.food && (
                    <div className="point-food">
                      <h4>🍽️ Еда и напитки:</h4>
                      <ul>
                        {Array.isArray(point.food) ? (
                          point.food.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))
                        ) : (
                          <li>{point.food}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {point.activities && (
                    <div className="point-activities">
                      <h4>🎯 Активности:</h4>
                      <ul>
                        {Array.isArray(point.activities) ? (
                          point.activities.map((activity, i) => (
                            <li key={i}>{activity}</li>
                          ))
                        ) : (
                          <li>{point.activities}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {point.photos && (
                    <div className="point-photos">
                      <h4>📸 Фото возможности:</h4>
                      <ul>
                        {Array.isArray(point.photos) ? (
                          point.photos.map((photo, i) => (
                            <li key={i}>{photo}</li>
                          ))
                        ) : (
                          <li>{point.photos}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {point.tips && Array.isArray(point.tips) && point.tips.length > 0 && (
                    <div className="point-tips">
                      <h4><FaLightbulb /> Советы:</h4>
                      <ul>
                        {point.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {point.transition && (
                    <div className="point-transition">
                      <FaSubway /> {point.transition}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <p>Точки маршрута не указаны</p>
          )}
        </div>

        {(route.yandexMapsUrl || route.mapUrl) && (
          <motion.div
            className="map-button-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href={route.yandexMapsUrl || route.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="view-on-map-button"
            >
              <FaMap /> Посмотреть маршрут на карте
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RouteDetails; 
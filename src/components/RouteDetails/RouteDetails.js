import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaClock, FaWalking, FaSun, FaMoon, 
  FaMapMarkerAlt, FaInfoCircle, FaLightbulb,
  FaCamera, FaUtensils, FaSubway, FaMap
} from 'react-icons/fa';
import './RouteDetails.css';

const RouteDetails = () => {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`http://localhost:3005/api/route/${id}`);
        if (!response.ok) {
          throw new Error('Маршрут не найден');
        }
        const data = await response.json();
        setRoute(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

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
        <h1 className="route-title">{route.name}</h1>
        
        <div className="route-info">
          <div className="info-item">
            <FaClock className="info-icon" />
            <span className="info-label">Длительность:</span>
            <span className="info-value">{route.duration} часов</span>
          </div>
          <div className="info-item">
            <FaWalking className="info-icon" />
            <span className="info-label">Темп:</span>
            <span className="info-value">
              {route.pace} {getPaceIcon(route.pace)}
            </span>
          </div>
          <div className="info-item">
            {getTimeIcon(route.timeOfDay)}
            <span className="info-label">Время суток:</span>
            <span className="info-value">{route.timeOfDay}</span>
          </div>
        </div>

        {route.description && (
          <div className="route-description">
            <h2><FaInfoCircle /> Обзор маршрута</h2>
            <p>{route.description}</p>
          </div>
        )}

        <div className="route-points">
          <h2><FaMapMarkerAlt /> Точки маршрута</h2>
          {route.points.map((point, index) => (
            <motion.div
              key={point.id}
              className="route-point"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="point-number">{index + 1}</div>
              <div className="point-content">
                <h3>{point.name}</h3>
                
                {point.duration && (
                  <div className="point-duration">
                    <FaClock /> {point.duration}
                  </div>
                )}

                {point.description && (
                  <p className="point-description">{point.description}</p>
                )}

                {point.activities && point.activities.length > 0 && (
                  <div className="point-activities">
                    <h4>🎯 Активности:</h4>
                    <ul>
                      {point.activities.map((activity, i) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {point.tips && point.tips.length > 0 && (
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
          ))}
        </div>

        {route.yandexMapsUrl && (
          <motion.div
            className="map-button-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href={route.yandexMapsUrl}
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
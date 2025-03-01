import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPalette, FaLandmark, FaUtensils } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const thematicRoutes = [
    {
      title: 'Арт-маршруты',
      description: 'Исследуйте современное искусство и культурные пространства столицы',
      icon: <FaPalette size={40} />,
      path: '/art-routes',
      image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3'
    },
    {
      title: 'Исторические маршруты',
      description: 'Погрузитесь в богатую историю города через его архитектуру и памятники',
      icon: <FaLandmark size={40} />,
      path: '/historical-routes',
      image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3'
    },
    {
      title: 'Гастрономические маршруты',
      description: 'Откройте для себя кулинарные традиции и современные заведения Москвы',
      icon: <FaUtensils size={40} />,
      path: '/gastro-routes',
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-4.0.3'
    }
  ];

  return (
    <motion.div 
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="home-title">
        Маршруты по Москве
      </h1>
      <p className="home-description">
        Откройте для себя уникальные маршруты по городу, созданные с учетом ваших интересов и предпочтений
      </p>

      <div style={{ textAlign: 'center' }}>
        <Link to="/create-route" className="create-route-button">
          Создать свой маршрут
        </Link>
      </div>

      <div className="routes-container">
        <h2 className="routes-title">
          Тематические маршруты
        </h2>

        <div className="routes-grid">
          {thematicRoutes.map((route, index) => (
            <motion.div
              key={index}
              className="route-card"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={route.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                <img 
                  src={route.image} 
                  alt={route.title} 
                  className="route-image"
                />
                <div className="route-content">
                  <div className="route-icon">
                    {route.icon}
                  </div>
                  <h3 className="route-title">
                    {route.title}
                  </h3>
                  <p className="route-description">
                    {route.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Home; 
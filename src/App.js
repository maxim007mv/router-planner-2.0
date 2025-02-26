import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaRoute } from 'react-icons/fa';
import Auth from './components/Auth/Auth';
import Profile from './components/Profile/Profile';
import RouteGenerator from './components/RouteGenerator/RouteGenerator';
import ArtRoutes from './components/ThematicRoutes/ArtRoutes';
import Header from './components/Header/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="glass-card">
            <h1 className="hero-title">Планировщик маршрутов по Москве</h1>
            <p className="hero-subtitle">
              Используйте силу искусственного интеллекта для создания уникальных маршрутов
            </p>
            <button className="create-route-btn" onClick={() => navigate('/create-route')}>
              <FaMapMarkedAlt className="map-icon" />
              Создать маршрут
            </button>
          </div>
        </div>
      </section>

      {/* Themed Routes Section */}
      <section className="themed-routes">
        <h2 className="section-title">Тематические маршруты</h2>
        <div className="routes-grid">
          <div className="route-card art">
            <div className="card-content">
              <div className="card-glass">
                <h3>Арт-маршруты</h3>
                <p>Галереи современного искусства и уличные арт-объекты</p>
                <button className="explore-btn" onClick={() => navigate('/art-routes')}>Исследовать</button>
              </div>
            </div>
          </div>
          
          <div className="route-card historical">
            <div className="card-content">
              <div className="card-glass">
                <h3>Исторические маршруты</h3>
                <p>Архитектурные памятники и музеи</p>
                <button className="explore-btn" onClick={() => navigate('/historical-routes')}>Исследовать</button>
              </div>
            </div>
          </div>
          
          <div className="route-card gastro">
            <div className="card-content">
              <div className="card-glass">
                <h3>Гастрономические туры</h3>
                <p>Лучшие рестораны и рынки города</p>
                <button className="explore-btn" onClick={() => navigate('/gastro-routes')}>Исследовать</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="app-container">
            <Header />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-route" element={<RouteGenerator />} />
              <Route path="/art-routes" element={<ArtRoutes />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

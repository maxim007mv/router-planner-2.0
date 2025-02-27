import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaRoute, FaSun, FaMoon, FaBars, FaTimes,
  FaHome, FaMapMarkedAlt, FaPalette, FaHistory,
  FaUtensils, FaUser, FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { icon: <FaHome />, label: 'Главная', action: () => navigate('/') },
    { icon: <FaMapMarkedAlt />, label: 'Создать маршрут', action: () => navigate('/create-route') },
    { icon: <FaPalette />, label: 'Арт-маршруты', action: () => navigate('/art-routes') },
    { icon: <FaHistory />, label: 'Исторические', action: () => navigate('/historical-routes') },
    { icon: <FaUtensils />, label: 'Гастрономические', action: () => navigate('/gastro-routes') },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <FaRoute className="logo-icon" />
          <span>Router-Planner</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-menu">
          <button onClick={() => navigate('/')} className="nav-link">
            Главная
          </button>
          <button onClick={() => navigate('/create-route')} className="nav-link">
            Создать маршрут
          </button>
          <button 
            className="theme-toggle-desktop"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          {!user ? (
            <>
              <button onClick={() => navigate('/auth')} className="nav-link">
                Войти
              </button>
              <button onClick={() => navigate('/auth')} className="nav-link register">
                Регистрация
              </button>
            </>
          ) : (
            <div className="user-profile-nav">
              <button onClick={() => navigate('/profile')} className="profile-button">
                <img 
                  src={user.avatar || 'https://via.placeholder.com/32'} 
                  alt={user.username}
                  className="profile-avatar"
                />
                <span className="profile-name">{user.username}</span>
              </button>
              <button onClick={handleLogout} className="nav-link logout">
                <FaSignOutAlt />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Controls */}
        <div className="mobile-controls">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <button 
            className="burger-menu"
            onClick={toggleMobileMenu}
            aria-label="Открыть меню"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMobileMenu} />}

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
              <nav className="nav-menu">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className="mobile-menu-item"
                    onClick={() => {
                      item.action();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="auth-buttons">
                {user ? (
                  <>
                    <button
                      className="mobile-menu-item"
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <FaUser />
                      <span>Профиль</span>
                    </button>
                    <button
                      className="mobile-menu-item"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="login-btn" onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}>
                      Войти
                    </button>
                    <button className="register-btn" onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}>
                      Регистрация
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header; 
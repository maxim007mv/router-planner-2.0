import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRoute, FaSun, FaMoon, FaBars, FaTimes,
  FaHome, FaMapMarkedAlt, FaPalette, FaHistory,
  FaUtensils, FaUser, FaSignOutAlt, FaUsers,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleImageError = (e) => {
    e.target.src = '';
    e.target.classList.add('default-avatar');
  };

  const menuItems = [
    { icon: <FaHome />, label: 'Главная', action: () => navigate('/') },
    { icon: <FaMapMarkedAlt />, label: 'Маршруты', action: () => navigate('/routes') },
    { icon: <FaMapMarkerAlt />, label: 'Места', action: () => navigate('/places') },
    { icon: <FaUsers />, label: 'Сообщество', action: () => navigate('/community') },
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
            <FaHome className="nav-icon" />
            <span>Главная</span>
          </button>
          <button onClick={() => navigate('/routes')} className="nav-link">
            <FaMapMarkedAlt className="nav-icon" />
            <span>Маршруты</span>
          </button>
          <button onClick={() => navigate('/places')} className="nav-link">
            <FaMapMarkerAlt className="nav-icon" />
            <span>Места</span>
          </button>
          <button onClick={() => navigate('/community')} className="nav-link">
            <FaUsers className="nav-icon" />
            <span>Сообщество</span>
          </button>
          <button 
            className="theme-toggle-desktop"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          {!currentUser ? (
            <button onClick={handleLogin} className="nav-link login">
              Войти
            </button>
          ) : (
            <div className="user-profile-nav">
              <button onClick={() => navigate('/profile')} className="profile-button">
                {currentUser.photoURL ? (
                  <img 
                    className="profile-avatar"
                    src={currentUser.photoURL}
                    alt="Profile"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="profile-avatar default-avatar">
                    <FaUser />
                  </div>
                )}
              </button>
              <button onClick={handleLogout} className="nav-link logout">
                <FaSignOutAlt className="nav-icon" />
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
          {currentUser && (
            <button onClick={() => navigate('/profile')} className="mobile-profile-button">
              {currentUser.photoURL ? (
                <img 
                  className="profile-avatar-mobile"
                  src={currentUser.photoURL}
                  alt="Profile"
                  onError={handleImageError}
                />
              ) : (
                <div className="profile-avatar-mobile default-avatar">
                  <FaUser />
                </div>
              )}
            </button>
          )}
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
            <motion.div 
              className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <nav className="nav-menu">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    className="mobile-menu-item"
                    onClick={() => {
                      item.action();
                      setIsMobileMenuOpen(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </nav>
              <div className="auth-buttons">
                {currentUser ? (
                  <>
                    <motion.button
                      className="mobile-menu-item profile"
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaUser />
                      <span>Профиль</span>
                    </motion.button>
                    <motion.button
                      className="mobile-menu-item logout"
                      onClick={handleLogout}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSignOutAlt />
                      <span>Выйти</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button 
                    className="login-btn"
                    onClick={handleLogin}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Войти
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header; 
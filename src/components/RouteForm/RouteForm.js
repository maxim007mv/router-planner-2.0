import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClock, FaWalking, FaTheaterMasks, FaTree, FaLandmark, 
  FaUtensils, FaMagic, FaChevronRight, FaChevronLeft,
  FaCamera, FaShoppingBag, FaHistory, FaMusic, FaPalette,
  FaGlassCheers, FaBookOpen, FaStreetView, FaAccessibleIcon, 
  FaBaby, FaUserClock, FaSun, FaMoon, FaMapMarkerAlt,
  FaDirections, FaSubway, FaInfoCircle, FaUmbrella,
  FaMobileAlt, FaTicketAlt, FaBolt, FaRegCompass,
  FaRoute, FaCoffee, FaRegClock, FaMapMarkedAlt,
  FaArrowLeft, FaArrowRight, FaBus, FaCar
} from 'react-icons/fa';
import './RouteForm.css';
import { useAuth } from '../../context/AuthContext';

const categories = [
  { id: 'culture', icon: <FaTheaterMasks />, label: 'Культура и искусство' },
  { id: 'nature', icon: <FaTree />, label: 'Природа и парки' },
  { id: 'architecture', icon: <FaLandmark />, label: 'Архитектура' },
  { id: 'food', icon: <FaUtensils />, label: 'Рестораны и кафе' },
  { id: 'history', icon: <FaHistory />, label: 'Исторические места' },
  { id: 'photo', icon: <FaCamera />, label: 'Фотогеничные места' },
  { id: 'shopping', icon: <FaShoppingBag />, label: 'Шоппинг' },
  { id: 'entertainment', icon: <FaGlassCheers />, label: 'Развлечения' },
  { id: 'art', icon: <FaPalette />, label: 'Галереи и выставки' },
  { id: 'music', icon: <FaMusic />, label: 'Музыкальные места' },
  { id: 'literary', icon: <FaBookOpen />, label: 'Литературные места' },
  { id: 'hidden', icon: <FaStreetView />, label: 'Скрытые жемчужины' }
];

const durations = [
  { value: '2', label: '2 часа' },
  { value: '3', label: '3 часа' },
  { value: '4', label: '4 часа' },
  { value: '6', label: '6 часов' },
  { value: '8', label: 'Весь день' }
];

const paces = [
  { value: 'relaxed', label: 'Расслабленный', description: 'Много остановок, неспешные прогулки' },
  { value: 'moderate', label: 'Умеренный', description: 'Комфортный темп с перерывами' },
  { value: 'active', label: 'Активный', description: 'Быстрый темп, минимум остановок' }
];

const budgets = [
  { value: 'budget', label: 'Бюджетный', description: 'До 1000₽ на человека' },
  { value: 'moderate', label: 'Средний', description: '1000-3000₽ на человека' },
  { value: 'luxury', label: 'Премиум', description: 'От 3000₽ на человека' }
];

const timeOfDay = [
  { value: 'morning', label: 'Утро', description: '6:00 - 12:00' },
  { value: 'afternoon', label: 'День', description: '12:00 - 18:00' },
  { value: 'evening', label: 'Вечер', description: '18:00 - 23:00' }
];

const seasons = [
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
  { value: 'spring', label: 'Весна' }
];

const accessibility = [
  { value: 'standard', label: 'Стандартный' },
  { value: 'wheelchair', label: 'Доступно для колясок' },
  { value: 'elderly', label: 'Подходит для пожилых' },
  { value: 'children', label: 'С детьми' }
];

const transportTypes = [
  { 
    value: 'walking', 
    label: 'Только пешком', 
    icon: <FaWalking />,
    description: 'Маршрут без использования транспорта' 
  },
  { 
    value: 'mixed', 
    label: 'Пешком + Транспорт', 
    icon: <FaSubway />,
    description: 'Комбинация пешей прогулки и общественного транспорта' 
  },
  { 
    value: 'transport', 
    label: 'В основном на транспорте', 
    icon: <FaBus />,
    description: 'Маршрут преимущественно на общественном транспорте' 
  }
];

const formSteps = [
  {
    id: 'categories',
    title: 'Категории',
    subtitle: 'Выберите интересующие вас места и активности'
  },
  {
    id: 'timing',
    title: 'Время и темп',
    subtitle: 'Укажите длительность и темп прогулки'
  },
  {
    id: 'transport',
    title: 'Способ передвижения',
    subtitle: 'Выберите предпочтительный способ передвижения'
  },
  {
    id: 'accessibility',
    title: 'Доступность',
    subtitle: 'Выберите подходящие параметры доступности'
  },
  {
    id: 'preferences',
    title: 'Пожелания',
    subtitle: 'Расскажите о ваших предпочтениях'
  }
];

const RouteForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    selectedCategories: [],
    duration: '',
    pace: '',
    transportType: '',
    budget: '',
    timeOfDay: '',
    season: [],
    accessibility: '',
    preferences: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  // Закомментируем код Яндекс.Карт
  // const [map, setMap] = useState(null);
  // const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.selectedCategories.length > 0;
      case 1:
        return formData.duration !== '' && formData.pace !== '';
      case 2:
        return formData.transportType !== '';
      case 3:
        return formData.timeOfDay !== '' && formData.accessibility !== '';
      case 4:
        return formData.preferences.length >= 10;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Для создания маршрута необходимо войти в систему');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3005/api/generate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: formData.selectedCategories,
          duration: formData.duration,
          pace: formData.pace,
          transportType: formData.transportType,
          timeOfDay: formData.timeOfDay,
          accessibility: formData.accessibility,
          preferences: formData.preferences,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Route generated:', result);

      // После успешной генерации перенаправляем на страницу с маршрутом
      window.location.href = `/route/${result.routeId}`;
    } catch (error) {
      console.error('Error generating route:', error);
      setError('Произошла ошибка при создании маршрута. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="categories-grid">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className={`category-item ${formData.selectedCategories.includes(category.id) ? 'selected' : ''}`}
                  onClick={() => handleCategoryToggle(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="category-icon">{category.icon}</div>
                  <span className="category-label">{category.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="form-field">
              <label>Длительность маршрута</label>
              <div className="options-grid">
                {durations.map((duration) => (
                  <motion.div
                    key={duration.value}
                    className={`option-item ${formData.duration === duration.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('duration', duration.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaClock className="option-icon" />
                    <span className="option-label">{duration.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Темп маршрута</label>
              <div className="options-grid">
                {paces.map((pace) => (
                  <motion.div
                    key={pace.value}
                    className={`option-item with-description ${formData.pace === pace.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('pace', pace.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pace.value === 'relaxed' && <FaWalking className="option-icon" />}
                    {pace.value === 'moderate' && <FaRegCompass className="option-icon" />}
                    {pace.value === 'active' && <FaRoute className="option-icon" />}
                    <span className="option-label">{pace.label}</span>
                    <span className="option-description">{pace.description}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="form-field">
              <label>Способ передвижения</label>
              <div className="options-grid">
                {transportTypes.map((type) => (
                  <motion.div
                    key={type.value}
                    className={`option-item with-description ${formData.transportType === type.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('transportType', type.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="option-icon">{type.icon}</div>
                    <span className="option-label">{type.label}</span>
                    <span className="option-description">{type.description}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="form-field">
              <label>Время суток</label>
              <div className="options-grid">
                {timeOfDay.map((time) => (
                  <motion.div
                    key={time.value}
                    className={`option-item with-description ${formData.timeOfDay === time.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('timeOfDay', time.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {time.value === 'morning' && <FaSun className="option-icon" />}
                    {time.value === 'afternoon' && <FaRegClock className="option-icon" />}
                    {time.value === 'evening' && <FaMoon className="option-icon" />}
                    <span className="option-label">{time.label}</span>
                    <span className="option-description">{time.description}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Доступность</label>
              <div className="options-grid">
                {accessibility.map((option) => (
                  <motion.div
                    key={option.value}
                    className={`option-item ${formData.accessibility === option.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('accessibility', option.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.value === 'wheelchair' && <FaAccessibleIcon className="option-icon" />}
                    {option.value === 'children' && <FaBaby className="option-icon" />}
                    {option.value === 'elderly' && <FaUserClock className="option-icon" />}
                    {option.value === 'standard' && <FaWalking className="option-icon" />}
                    <span className="option-label">{option.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="form-field">
              <label>Дополнительные пожелания</label>
              <textarea
                value={formData.preferences}
                onChange={(e) => handleInputChange('preferences', e.target.value)}
                placeholder="Опишите ваши предпочтения, пожелания или особые требования к маршруту..."
                className="neomorphic-textarea preferences-textarea"
                rows="6"
              />
              <p className="field-hint">Минимум 10 символов</p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="route-form-container">
      <motion.div
        className="form-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-header">
          <div className="steps-progress">
            {formSteps.map((step, index) => (
              <div
                key={step.id}
                className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{step.title}</div>
              </div>
            ))}
          </div>
          <h2 className="form-title">{formSteps[currentStep].title}</h2>
          <p className="form-subtitle">{formSteps[currentStep].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <div className="form-navigation">
            {currentStep > 0 && (
              <button
                type="button"
                className="nav-button prev"
                onClick={handlePrev}
              >
                <FaArrowLeft /> Назад
              </button>
            )}
            {currentStep < formSteps.length - 1 ? (
              <button
                type="button"
                className="nav-button next"
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Далее <FaArrowRight />
              </button>
            ) : (
              <button
                type="submit"
                className="nav-button submit"
                disabled={!isStepValid() || isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner">Создание маршрута...</span>
                ) : (
                  <>Создать маршрут <FaMagic /></>
                )}
              </button>
            )}
          </div>
        </form>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RouteForm; 
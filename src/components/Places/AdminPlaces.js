import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import { 
  Restaurant as RestaurantIcon,
  LocalCafe as CafeIcon,
  Park as ParkIcon,
  Landscape as ViewpointIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { 
  FaUserShield, 
  FaUsers, 
  FaMapMarkerAlt, 
  FaRoute, 
  FaSignOutAlt,
  FaUserCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { populateSamplePlaces, PLACE_TYPES, addRecommendedRestaurants } from '../../services/placesService';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

// Helper function to check if a user is an admin
const checkIsAdmin = (user) => {
  if (!user) return false;
  
  // Add your admin check logic here
  // This could be based on email, UID, or a custom claim in Firebase Auth
  return (
    user.email === 'admin@example.com' || 
    user.uid === 'YOUR_ADMIN_UID' ||
    // For demo purposes, allow any authenticated user to access admin features
    // Remove this in production
    true
  );
};

const AdminPlaces = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [placesAdded, setPlacesAdded] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Состояние для рекомендованных ресторанов
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedSuccess, setRecommendedSuccess] = useState(false);
  const [recommendedError, setRecommendedError] = useState('');
  const [recommendedAdded, setRecommendedAdded] = useState(0);

  // Категории мест
  const placeCategories = [
    { type: PLACE_TYPES.RESTAURANT, label: 'Рестораны', icon: <RestaurantIcon />, count: 5 },
    { type: PLACE_TYPES.CAFE, label: 'Кафе', icon: <CafeIcon />, count: 5 },
    { type: PLACE_TYPES.PARK, label: 'Парки', icon: <ParkIcon />, count: 5 },
    { type: PLACE_TYPES.VIEWPOINT, label: 'Смотровые площадки', icon: <ViewpointIcon />, count: 5 }
  ];
  
  // Преобразуем PLACE_TYPES в массив для использования с map
  const placeTypesArray = Object.entries(PLACE_TYPES).map(([key, value]) => ({
    key,
    value,
    label: key === 'RESTAURANT' ? 'Рестораны' : 
           key === 'CAFE' ? 'Кафе' : 
           key === 'PARK' ? 'Парки' : 
           key === 'VIEWPOINT' ? 'Смотровые площадки' : key,
    icon: key === 'RESTAURANT' ? <RestaurantIcon /> : 
          key === 'CAFE' ? <CafeIcon /> : 
          key === 'PARK' ? <ParkIcon /> : 
          key === 'VIEWPOINT' ? <ViewpointIcon /> : <RestaurantIcon />,
    count: 5
  }));
  
  console.log('PLACE_TYPES:', PLACE_TYPES);
  console.log('placeTypesArray:', placeTypesArray);

  // Проверяем, является ли пользователь администратором
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      // Проверяем, есть ли запись в localStorage
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      
      console.log('AdminPlaces - adminAuthenticated:', adminAuthenticated);
      
      if (adminAuthenticated !== 'true') {
        navigate('/admin-login');
        return;
      }
      
      // Если есть запись в localStorage, считаем пользователя администратором
      setIsAdmin(true);
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Обработчик заполнения базы данных примерами мест
  const handlePopulatePlaces = async () => {
    if (!currentUser) {
      setError('Необходимо авторизоваться');
      return;
    }

    if (!isAdmin) {
      setError('У вас нет прав администратора');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const savedPlaces = await populateSamplePlaces();
      
      setPlacesAdded(savedPlaces.length);
      setSuccess(true);
    } catch (error) {
      console.error('Error populating places:', error);
      setError(error.message || 'Произошла ошибка при заполнении базы данных');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик добавления рекомендованных ресторанов
  const handleAddRecommendedRestaurants = async () => {
    if (!currentUser) {
      setRecommendedError('Необходимо авторизоваться');
      return;
    }

    if (!isAdmin) {
      setRecommendedError('У вас нет прав администратора');
      return;
    }

    try {
      setRecommendedLoading(true);
      setRecommendedError('');
      setRecommendedSuccess(false);
      
      const savedRestaurants = await addRecommendedRestaurants();
      
      setRecommendedAdded(savedRestaurants.length);
      setRecommendedSuccess(true);
    } catch (error) {
      console.error('Error adding recommended restaurants:', error);
      setRecommendedError(error.message || 'Произошла ошибка при добавлении рекомендованных ресторанов');
    } finally {
      setRecommendedLoading(false);
    }
  };

  // Функция для выхода из админ-панели
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    toast.success('Выход из панели администратора выполнен успешно');
    navigate('/admin-login');
  };

  // Если пользователь не администратор, показываем сообщение о запрете доступа
  if (!isAdmin) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Загрузка...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4, pt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        <FaMapMarkerAlt style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
        Управление местами
      </Typography>
      
      <Grid container spacing={3}>
        {/* Все управление вертикально */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '16px',
              backgroundColor: 'var(--tg-surface)',
              border: '1px solid var(--tg-border)',
              boxShadow: 'var(--tg-card-shadow)',
              mb: 4
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
              Управление
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button" 
                  onClick={() => navigate('/admin')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaUserShield style={{ marginRight: '10px' }} /> Панель администратора
                </button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button" 
                  onClick={() => navigate('/admin-users')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaUsers style={{ marginRight: '10px' }} /> Пользователи
                </button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button" 
                  onClick={() => navigate('/admin-accounts')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaUserCog style={{ marginRight: '10px' }} /> Администраторы
                </button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button" 
                  onClick={() => navigate('/')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaRoute style={{ marginRight: '10px' }} /> Вернуться на сайт
                </button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button tg-button-secondary" 
                  onClick={handleLogout}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaSignOutAlt style={{ marginRight: '10px' }} /> Выйти
                </button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Секция для рекомендованных ресторанов */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '16px',
              backgroundColor: 'var(--tg-surface)',
              border: '1px solid var(--tg-border)',
              boxShadow: 'var(--tg-card-shadow)',
              height: '100%'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
              Рекомендованные рестораны
            </Typography>
            
            <Typography variant="body1" paragraph>
              Эта функция добавит в базу данных 16 рекомендованных ресторанов от команды разработчиков.
              Рестораны будут отмечены специальным значком и будут отображаться в разделе "Рестораны".
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StarIcon sx={{ color: 'gold', mr: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                16 отборных ресторанов с разной кухней и ценовой категорией
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              {recommendedError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {recommendedError}
                </Alert>
              )}
              
              {recommendedSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Успешно добавлены рекомендованные рестораны
                </Alert>
              )}
              
              <Button
                variant="contained"
                color="primary"
                startIcon={recommendedLoading ? <CircularProgress size={20} color="inherit" /> : <RestaurantIcon />}
                onClick={handleAddRecommendedRestaurants}
                disabled={recommendedLoading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {recommendedLoading ? 'Добавление ресторанов...' : 'Добавить рекомендованные рестораны'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Секция для примеров мест */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '16px',
              backgroundColor: 'var(--tg-surface)',
              border: '1px solid var(--tg-border)',
              boxShadow: 'var(--tg-card-shadow)',
              height: '100%'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
              Заполнение базы данных примерами
            </Typography>
            
            <Typography variant="body1" paragraph>
              Эта функция заполнит базу данных примерами мест разных категорий.
              Это поможет протестировать функциональность приложения и увидеть, как будут выглядеть места на карте.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Будут добавлены следующие категории мест:
            </Typography>
            
            <List sx={{ maxHeight: '200px', overflow: 'auto' }}>
              {placeTypesArray.map(category => (
                <ListItem key={category.key}>
                  <ListItemIcon>
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.label} 
                    secondary={`${category.count} мест`} 
                  />
                  <Chip 
                    label={`${category.count} мест`} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Успешно добавлено {placesAdded} мест в базу данных
                </Alert>
              )}
              
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : success ? <CheckIcon /> : <AddIcon />}
                onClick={handlePopulatePlaces}
                disabled={loading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loading ? 'Добавление мест...' : success ? 'Места успешно добавлены' : 'Заполнить базу данных примерами'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminPlaces; 
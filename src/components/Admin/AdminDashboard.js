import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Grid, Paper, CircularProgress, Button, Avatar, Chip
} from '@mui/material';
import { 
  FaUsers, FaRoute, FaMapMarkerAlt, FaComments, 
  FaStar, FaSignOutAlt, FaUserShield, FaUserCog
} from 'react-icons/fa';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../Profile/Profile.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalPlaces: 0,
    totalRoutes: 0,
    totalReviews: 0
  });
  const [currentAdmin, setCurrentAdmin] = useState({
    username: '',
    role: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminDashboard - Component mounted');
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    console.log('AdminDashboard - adminAuthenticated:', adminAuthenticated);
    
    fetchStats();
  }, []);

  // Проверяем, является ли текущий пользователь администратором
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Проверяем, есть ли запись в localStorage
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      const adminUsername = localStorage.getItem('adminUsername');
      const adminRole = localStorage.getItem('adminRole');
      
      console.log('AdminDashboard - adminAuthenticated:', adminAuthenticated);
      console.log('AdminDashboard - adminUsername:', adminUsername);
      console.log('AdminDashboard - adminRole:', adminRole);
      
      if (adminAuthenticated !== 'true') {
        navigate('/admin-login');
        return;
      }
      
      // Если есть запись в localStorage, считаем пользователя администратором
      setIsAdmin(true);
      
      // Устанавливаем информацию о текущем администраторе
      setCurrentAdmin({
        username: adminUsername || 'admin',
        role: adminRole || 'admin'
      });
      
      // Загружаем статистику
      fetchStats();
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Функция для получения статистики
  const fetchStats = async () => {
    try {
      console.log('AdminDashboard - Fetching stats...');
      setLoading(true);
      
      // Получаем количество пользователей
      const usersQuery = collection(db, 'users');
      const usersSnapshot = await getCountFromServer(usersQuery);
      const totalUsers = usersSnapshot.data().count;
      console.log('AdminDashboard - Total users:', totalUsers);
      
      // Получаем количество верифицированных пользователей
      const verifiedUsersQuery = query(collection(db, 'users'), where('isVerified', '==', true));
      const verifiedUsersSnapshot = await getCountFromServer(verifiedUsersQuery);
      const verifiedUsers = verifiedUsersSnapshot.data().count;
      console.log('AdminDashboard - Verified users:', verifiedUsers);
      
      // Получаем количество маршрутов
      const routesQuery = collection(db, 'routes');
      const routesSnapshot = await getCountFromServer(routesQuery);
      const totalRoutes = routesSnapshot.data().count;
      console.log('AdminDashboard - Total routes:', totalRoutes);
      
      // Получаем количество мест
      const placesQuery = collection(db, 'places');
      const placesSnapshot = await getCountFromServer(placesQuery);
      const totalPlaces = placesSnapshot.data().count;
      console.log('AdminDashboard - Total places:', totalPlaces);
      
      // Получаем количество отзывов
      const reviewsQuery = collection(db, 'reviews');
      const reviewsSnapshot = await getCountFromServer(reviewsQuery);
      const totalReviews = reviewsSnapshot.data().count;
      console.log('AdminDashboard - Total reviews:', totalReviews);
      
      setStats({
        totalUsers,
        totalRoutes,
        totalPlaces,
        totalReviews,
        verifiedUsers
      });
      
      console.log('AdminDashboard - Stats fetched successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Ошибка при загрузке статистики');
      setLoading(false);
    }
  };

  // Функция для выхода из админ-панели
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    toast.success('Выход из панели администратора выполнен успешно');
    navigate('/admin-login');
  };

  // Разделы админ-панели
  const adminSections = [
    {
      title: 'Управление пользователями',
      description: 'Просмотр, блокировка и верификация пользователей',
      icon: <FaUsers style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />,
      path: '/admin-users'
    },
    {
      title: 'Управление местами',
      description: 'Добавление, редактирование и удаление мест',
      icon: <FaMapMarkerAlt style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />,
      path: '/admin-places'
    },
    {
      title: 'Управление администраторами',
      description: 'Создание и управление учетными записями администраторов',
      icon: <FaUserCog style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />,
      path: '/admin-accounts'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4, pt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        <FaUserShield style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
        Панель администратора
      </Typography>
      
      {/* Информация о текущем администраторе */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'var(--primary-color)', 
                width: 50, 
                height: 50,
                mr: 2
              }}
            >
              <FaUserShield size={24} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {currentAdmin.username}
              </Typography>
              <Chip 
                label={currentAdmin.role === 'superadmin' ? 'Суперадмин' : 'Администратор'} 
                color={currentAdmin.role === 'superadmin' ? 'error' : 'primary'} 
                size="small" 
              />
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Последний вход: {new Date().toLocaleString('ru-RU')}
          </Typography>
        </Box>
      </Paper>
      
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
                  onClick={() => navigate('/admin-users')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaUsers style={{ marginRight: '10px' }} /> Пользователи
                </button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <button 
                  className="tg-button" 
                  onClick={() => navigate('/admin-places')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaMapMarkerAlt style={{ marginRight: '10px' }} /> Места
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
        
        {/* Разделы админ-панели */}
        {adminSections.map((section, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: '16px',
                backgroundColor: 'var(--tg-surface)',
                border: '1px solid var(--tg-border)',
                boxShadow: 'var(--tg-card-shadow)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {section.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                  {section.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                  {section.description}
                </Typography>
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => navigate(section.path)}
                sx={{ py: 1.5 }}
              >
                Перейти
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 
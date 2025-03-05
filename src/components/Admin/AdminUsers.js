import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Avatar, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, TextField, Button, Chip, CircularProgress
} from '@mui/material';
import { FaCheck, FaTimes, FaSearch, FaUserShield, FaUserCog, FaSignOutAlt, FaBan, FaUnlock, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import { collection, getDocs, query, orderBy, limit, startAfter, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../Profile/Profile.css';
import { updateUserStatusByAdmin } from '../../services/userService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Проверяем, является ли текущий пользователь администратором
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Проверяем, есть ли запись в localStorage
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      
      console.log('AdminUsers - adminAuthenticated:', adminAuthenticated);
      
      if (adminAuthenticated !== 'true') {
        navigate('/admin-login');
        return;
      }
      
      // Если есть запись в localStorage, считаем пользователя администратором
      setIsAdmin(true);
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  // Загружаем список пользователей
  useEffect(() => {
    let isMounted = true;
    
    if (isAdmin) {
      console.log('AdminUsers - isAdmin is true, fetching users...');
      fetchUsers(isMounted);
    }
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page, rowsPerPage]);
  
  const fetchUsers = async (isMounted) => {
    console.log('AdminUsers - Starting fetchUsers...');
    if (isMounted) setLoading(true);
    
    try {
      let usersQuery;
      
      if (lastVisible && page > 0) {
        console.log('AdminUsers - Fetching next page with lastVisible:', lastVisible);
        usersQuery = query(
          collection(db, 'users'),
          orderBy('displayName'),
          startAfter(lastVisible),
          limit(rowsPerPage)
        );
      } else {
        console.log('AdminUsers - Fetching first page');
        usersQuery = query(
          collection(db, 'users'),
          orderBy('displayName'),
          limit(rowsPerPage)
        );
      }
      
      console.log('AdminUsers - Executing query...');
      const querySnapshot = await getDocs(usersQuery);
      console.log('AdminUsers - Query completed, docs count:', querySnapshot.docs.length);
      
      // Добавляем небольшую задержку, чтобы избежать мерцания
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isMounted) return;
      
      if (querySnapshot.empty) {
        console.log('AdminUsers - No users found');
        setHasMore(false);
        setUsers([]);
      } else {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('AdminUsers - Users data:', usersData);
        setUsers(usersData);
        setHasMore(querySnapshot.docs.length === rowsPerPage);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (isMounted) {
        toast.error('Ошибка при загрузке пользователей');
        setUsers([]);
      }
    } finally {
      console.log('AdminUsers - Finished loading');
      if (isMounted) setLoading(false);
    }
  };
  
  // Обработчик изменения страницы
  const handleChangePage = (event, newPage) => {
    console.log('AdminUsers - Changing page to:', newPage);
    setPage(newPage);
  };
  
  // Обработчик изменения количества строк на странице
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('AdminUsers - Changing rows per page to:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setLastVisible(null);
  };
  
  // Обработчик поиска
  const handleSearch = async () => {
    console.log('AdminUsers - Searching for:', searchTerm);
    setLoading(true);
    
    try {
      if (!searchTerm.trim()) {
        // Если поисковый запрос пустой, возвращаемся к обычному списку
        setPage(0);
        setLastVisible(null);
        fetchUsers(true);
        return;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      
      // Поиск по всем пользователям (без пагинации)
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('displayName')
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      // Фильтруем результаты на стороне клиента
      const filteredUsers = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => 
          (user.displayName && user.displayName.toLowerCase().includes(searchTermLower)) ||
          (user.email && user.email.toLowerCase().includes(searchTermLower))
        );
      
      console.log('AdminUsers - Search results:', filteredUsers.length);
      
      // Добавляем небольшую задержку, чтобы избежать мерцания
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(filteredUsers);
      setHasMore(false); // Отключаем пагинацию для результатов поиска
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Ошибка при поиске пользователей');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик верификации пользователя
  const handleVerifyUser = async (userId, isVerified) => {
    console.log('Попытка верифицировать/снять верификацию пользователя:', userId, 'Текущий статус:', isVerified);
    
    try {
      if (!userId) {
        console.error('Неверный ID пользователя:', userId);
        toast.error('Ошибка: ID пользователя не указан');
        return;
      }
      
      setLoading(true);
      
      // Используем функцию из userService для обновления статуса
      await updateUserStatusByAdmin(userId, {
        isVerified: !isVerified
      });
      
      console.log('Статус верификации пользователя успешно обновлен');
      
      // Обновляем список пользователей в локальном состоянии
      setUsers(users.map(user => {
        if (user.id === userId) {
          console.log('Обновление пользователя в локальном состоянии:', user.displayName);
          return {
            ...user,
            isVerified: !isVerified
          };
        }
        return user;
      }));
      
      toast.success(`Пользователь ${isVerified ? 'лишен верификации' : 'верифицирован'}`);
    } catch (error) {
      console.error('Ошибка при верификации пользователя:', error);
      toast.error(`Ошибка при изменении статуса верификации: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик блокировки пользователя
  const handleBlockUser = async (userId, isBlocked) => {
    console.log('Попытка заблокировать/разблокировать пользователя:', userId, 'Текущий статус:', isBlocked);
    
    try {
      if (!userId) {
        console.error('Неверный ID пользователя:', userId);
        toast.error('Ошибка: ID пользователя не указан');
        return;
      }
      
      setLoading(true);
      
      // Используем функцию из userService для обновления статуса
      await updateUserStatusByAdmin(userId, {
        isBlocked: !isBlocked
      });
      
      console.log('Статус блокировки пользователя успешно обновлен');
      
      // Обновляем список пользователей в локальном состоянии
      setUsers(users.map(user => {
        if (user.id === userId) {
          console.log('Обновление пользователя в локальном состоянии:', user.displayName);
          return {
            ...user,
            isBlocked: !isBlocked
          };
        }
        return user;
      }));
      
      toast.success(`Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`);
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      toast.error(`Ошибка при изменении статуса блокировки: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик перехода к профилю пользователя
  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };
  
  // Форматирование даты
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Не указана';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      // Если это Firestore Timestamp
      if (dateValue && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('ru-RU', options);
      }
      
      // Если это строка ISO
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString('ru-RU', options);
      }
      
      // Если это объект Date
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('ru-RU', options);
      }
      
      return 'Не указана';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Не указана';
    }
  };
  
  // Рендер роли пользователя
  const renderUserRole = (role, isBlocked) => {
    let roleText = 'Пользователь';
    let roleClass = '';
    
    switch (role) {
      case 'admin':
        roleText = 'Администратор';
        roleClass = 'admin';
        break;
      case 'guide':
        roleText = 'Гид';
        break;
      case 'developer':
        roleText = 'Разработчик';
        roleClass = 'developer';
        break;
      case 'owner':
        roleText = 'Владелец';
        roleClass = 'owner';
        break;
      default:
        roleText = 'Пользователь';
    }
    
    if (isBlocked) {
      return (
        <Chip 
          label="Заблокирован" 
          sx={{ 
            backgroundColor: '#ff4d4d', 
            color: 'white',
            fontWeight: 'bold'
          }} 
        />
      );
    }
    
    return (
      <span className={`user-role-badge ${roleClass}`}>
        {roleText}
      </span>
    );
  };
  
  // Функция для выхода из админ-панели
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    toast.success('Выход из панели администратора выполнен успешно');
    navigate('/admin-login');
  };
  
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" align="center">
          Загрузка...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4, pt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        <FaUserShield style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
        Управление пользователями
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
        
        {/* Список пользователей */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '16px',
              backgroundColor: 'var(--tg-surface)',
              border: '1px solid var(--tg-border)',
              boxShadow: 'var(--tg-card-shadow)',
              position: 'relative',
              minHeight: '400px'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
              Список пользователей
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <TextField
                label="Поиск пользователей"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1 }}
                disabled={loading}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSearch />}
                disabled={loading}
              >
                {loading ? 'Поиск...' : 'Поиск'}
              </Button>
            </Box>
            
            {loading && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexDirection: 'column',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  borderRadius: '16px'
                }}
              >
                <div className="loading-spinner" style={{ width: '50px', height: '50px' }}></div>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Загрузка пользователей...
                </Typography>
              </Box>
            )}
            
            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Пользователь</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Дата регистрации</TableCell>
                    <TableCell align="center">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={user.photoURL} alt={user.displayName} />
                            <Box>
                              <Typography variant="body1">
                                {user.displayName}
                                {user.isVerified && (
                                  <span className="verified-badge" style={{ width: '16px', height: '16px', marginLeft: '8px' }}>
                                    <FaCheck size={10} />
                                  </span>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{renderUserRole(user.role, user.isBlocked)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <button 
                              className="tg-button tg-button-secondary"
                              onClick={() => handleVerifyUser(user.id, user.isVerified)}
                              style={{ minWidth: 'auto', padding: '5px 10px' }}
                              disabled={loading}
                            >
                              {user.isVerified ? <FaTimes /> : <FaCheck />}
                            </button>
                            
                            <button 
                              className="tg-button tg-button-secondary"
                              onClick={() => handleBlockUser(user.id, user.isBlocked)}
                              style={{ 
                                minWidth: 'auto', 
                                padding: '5px 10px',
                                backgroundColor: user.isBlocked ? '#4caf50' : '#ff4d4d',
                                borderColor: user.isBlocked ? '#4caf50' : '#ff4d4d'
                              }}
                              disabled={loading}
                            >
                              {user.isBlocked ? <FaUnlock /> : <FaBan />}
                            </button>
                            
                            <button 
                              className="tg-button"
                              onClick={() => handleViewProfile(user.id)}
                              style={{ minWidth: 'auto', padding: '5px 10px' }}
                              disabled={loading}
                            >
                              <FaUserCog />
                            </button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={-1}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Пользователей на странице:"
              labelDisplayedRows={({ from, to }) => `${from}-${to}`}
              nextIconButtonProps={{
                disabled: !hasMore || users.length < rowsPerPage || loading
              }}
              backIconButtonProps={{
                disabled: page === 0 || loading
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminUsers; 
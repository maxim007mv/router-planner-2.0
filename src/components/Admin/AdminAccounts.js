import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TextField, Button, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  Tooltip, Switch, FormControlLabel, Alert
} from '@mui/material';
import { 
  FaUserShield, FaUsers, FaMapMarkerAlt, FaRoute, FaSignOutAlt,
  FaPlus, FaTrash, FaKey, FaCheck, FaTimes, FaCopy, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  createAdminAccount, 
  getAdminAccounts, 
  deleteAdminAccount, 
  deactivateAdminAccount, 
  activateAdminAccount,
  resetAdminPassword
} from '../../services/adminService';
import { checkPasswordStrength } from '../../utils/passwordGenerator';
import '../Profile/Profile.css';

const AdminAccounts = () => {
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Состояние для новой учетной записи
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'admin',
    expiresAt: '',
    hasExpiration: false
  });
  
  const navigate = useNavigate();
  
  // Проверяем, является ли текущий пользователь администратором
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Проверяем, есть ли запись в localStorage
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      const adminRole = localStorage.getItem('adminRole');
      
      console.log('AdminAccounts - adminAuthenticated:', adminAuthenticated);
      console.log('AdminAccounts - adminRole:', adminRole);
      
      if (adminAuthenticated !== 'true') {
        navigate('/admin-login');
        return;
      }
      
      // Если есть запись в localStorage, считаем пользователя администратором
      setIsAdmin(true);
      
      // Загружаем список учетных записей
      fetchAdminAccounts();
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  // Загружаем список учетных записей администраторов
  const fetchAdminAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await getAdminAccounts();
      
      // Добавляем главного администратора в список, если его там нет
      const superadminExists = accounts.some(account => account.username === 'admin' && account.role === 'superadmin');
      
      if (!superadminExists) {
        // Добавляем главного администратора в список
        const superadmin = {
          id: 'superadmin',
          username: 'admin',
          name: 'Главный администратор',
          email: 'admin@example.com',
          role: 'superadmin',
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
        
        setAdminAccounts([superadmin, ...accounts]);
      } else {
        setAdminAccounts(accounts);
      }
    } catch (error) {
      console.error('Ошибка при загрузке учетных записей администраторов:', error);
      toast.error('Ошибка при загрузке учетных записей администраторов');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик создания новой учетной записи
  const handleCreateAdmin = async () => {
    try {
      if (!newAdmin.name || !newAdmin.email) {
        toast.error('Заполните все обязательные поля');
        return;
      }
      
      setLoading(true);
      
      const expiresAt = newAdmin.hasExpiration ? newAdmin.expiresAt : null;
      const result = await createAdminAccount(newAdmin.name, newAdmin.email, newAdmin.role, expiresAt);
      
      // Добавляем новую учетную запись в список
      setAdminAccounts([...adminAccounts, result]);
      
      // Показываем пароль пользователю
      setNewPassword(result.password);
      
      // Сбрасываем форму
      setNewAdmin({
        name: '',
        email: '',
        role: 'admin',
        expiresAt: '',
        hasExpiration: false
      });
      
      setOpenCreateDialog(false);
      toast.success('Учетная запись администратора успешно создана');
      
      // Открываем диалог с паролем
      setOpenResetDialog(true);
    } catch (error) {
      console.error('Ошибка при создании учетной записи администратора:', error);
      toast.error(`Ошибка при создании учетной записи: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик удаления учетной записи
  const handleDeleteAdmin = async () => {
    try {
      if (!selectedAdmin) return;
      
      // Запрещаем удаление главного администратора
      if (selectedAdmin.username === 'admin' && selectedAdmin.role === 'superadmin') {
        toast.error('Невозможно удалить главного администратора');
        setOpenDeleteDialog(false);
        return;
      }
      
      setLoading(true);
      await deleteAdminAccount(selectedAdmin.id);
      
      // Удаляем учетную запись из списка
      setAdminAccounts(adminAccounts.filter(admin => admin.id !== selectedAdmin.id));
      
      setOpenDeleteDialog(false);
      toast.success('Учетная запись администратора успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении учетной записи администратора:', error);
      toast.error(`Ошибка при удалении учетной записи: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик изменения статуса учетной записи
  const handleToggleStatus = async (admin) => {
    try {
      // Запрещаем деактивацию главного администратора
      if (admin.username === 'admin' && admin.role === 'superadmin') {
        toast.error('Невозможно деактивировать главного администратора');
        return;
      }
      
      setLoading(true);
      
      if (admin.isActive) {
        await deactivateAdminAccount(admin.id);
        toast.success('Учетная запись деактивирована');
      } else {
        await activateAdminAccount(admin.id);
        toast.success('Учетная запись активирована');
      }
      
      // Обновляем статус в списке
      setAdminAccounts(adminAccounts.map(item => {
        if (item.id === admin.id) {
          return {
            ...item,
            isActive: !item.isActive
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Ошибка при изменении статуса учетной записи:', error);
      toast.error(`Ошибка при изменении статуса: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик сброса пароля
  const handleResetPassword = async () => {
    try {
      if (!selectedAdmin) return;
      
      // Запрещаем сброс пароля главного администратора
      if (selectedAdmin.username === 'admin' && selectedAdmin.role === 'superadmin') {
        toast.error('Невозможно сбросить пароль главного администратора');
        setOpenResetDialog(false);
        return;
      }
      
      setLoading(true);
      const result = await resetAdminPassword(selectedAdmin.id);
      
      // Показываем новый пароль пользователю
      setNewPassword(result.newPassword);
      
      toast.success('Пароль успешно сброшен');
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      toast.error(`Ошибка при сбросе пароля: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик копирования пароля в буфер обмена
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword)
      .then(() => {
        toast.success('Пароль скопирован в буфер обмена');
      })
      .catch(err => {
        console.error('Ошибка при копировании пароля:', err);
        toast.error('Не удалось скопировать пароль');
      });
  };
  
  // Обработчик выхода из админ-панели
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminRole');
    navigate('/admin-login');
  };
  
  // Форматирование даты
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Не указано';
    
    try {
      // Если это Timestamp из Firestore
      if (dateValue.toDate) {
        dateValue = dateValue.toDate();
      }
      
      // Если это строка, преобразуем в объект Date
      if (typeof dateValue === 'string') {
        dateValue = new Date(dateValue);
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateValue);
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error);
      return 'Неверный формат';
    }
  };
  
  // Отображение роли администратора
  const renderAdminRole = (role) => {
    switch (role) {
      case 'superadmin':
        return <Chip label="Суперадмин" color="error" size="small" />;
      case 'admin':
        return <Chip label="Администратор" color="primary" size="small" />;
      case 'moderator':
        return <Chip label="Модератор" color="success" size="small" />;
      default:
        return <Chip label={role} color="default" size="small" />;
    }
  };
  
  // Отображение статуса учетной записи
  const renderAdminStatus = (isActive) => {
    return isActive 
      ? <Chip label="Активна" color="success" size="small" />
      : <Chip label="Неактивна" color="error" size="small" />;
  };
  
  // Отображение надежности пароля
  const renderPasswordStrength = (password) => {
    const strength = checkPasswordStrength(password);
    
    switch (strength) {
      case 'weak':
        return <Chip label="Слабый" color="error" size="small" />;
      case 'medium':
        return <Chip label="Средний" color="warning" size="small" />;
      case 'strong':
        return <Chip label="Надежный" color="success" size="small" />;
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4, pt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        <FaUserShield style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
        Управление администраторами
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
                  onClick={() => navigate('/admin-places')}
                  style={{ width: '100%', justifyContent: 'center', height: '50px' }}
                >
                  <FaMapMarkerAlt style={{ marginRight: '10px' }} /> Места
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
        
        {/* Список администраторов */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Учетные записи администраторов
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<FaPlus />}
                onClick={() => setOpenCreateDialog(true)}
                disabled={loading}
              >
                Создать учетную запись
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
                  Загрузка данных...
                </Typography>
              </Box>
            )}
            
            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Имя</TableCell>
                    <TableCell>Логин</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Дата создания</TableCell>
                    <TableCell>Срок действия</TableCell>
                    <TableCell align="center">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Учетные записи администраторов не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminAccounts.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.name}</TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{renderAdminRole(admin.role)}</TableCell>
                        <TableCell>{renderAdminStatus(admin.isActive)}</TableCell>
                        <TableCell>{formatDate(admin.createdAt)}</TableCell>
                        <TableCell>{admin.expiresAt ? formatDate(admin.expiresAt) : 'Бессрочно'}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title={admin.isActive ? 'Деактивировать' : 'Активировать'}>
                              <IconButton 
                                color={admin.isActive ? 'error' : 'success'}
                                onClick={() => handleToggleStatus(admin)}
                                disabled={loading}
                                size="small"
                              >
                                {admin.isActive ? <FaTimes /> : <FaCheck />}
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Сбросить пароль">
                              <IconButton 
                                color="primary"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setOpenResetDialog(true);
                                }}
                                disabled={loading}
                                size="small"
                              >
                                <FaKey />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Удалить">
                              <IconButton 
                                color="error"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setOpenDeleteDialog(true);
                                }}
                                disabled={loading || admin.username === localStorage.getItem('adminUsername')}
                                size="small"
                              >
                                <FaTrash />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Диалог создания новой учетной записи */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание новой учетной записи администратора</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Заполните форму для создания новой учетной записи администратора. 
            Логин и пароль будут сгенерированы автоматически.
          </DialogContentText>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Имя администратора"
                fullWidth
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Роль</InputLabel>
                <Select
                  value={newAdmin.role}
                  label="Роль"
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <MenuItem value="admin">Администратор</MenuItem>
                  <MenuItem value="moderator">Модератор</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={newAdmin.hasExpiration}
                    onChange={(e) => setNewAdmin({ ...newAdmin, hasExpiration: e.target.checked })}
                  />
                }
                label="Ограничить срок действия"
              />
            </Grid>
            
            {newAdmin.hasExpiration && (
              <Grid item xs={12}>
                <TextField
                  label="Срок действия"
                  type="datetime-local"
                  fullWidth
                  value={newAdmin.expiresAt}
                  onChange={(e) => setNewAdmin({ ...newAdmin, expiresAt: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} color="inherit">
            Отмена
          </Button>
          <Button 
            onClick={handleCreateAdmin} 
            variant="contained" 
            color="primary"
            disabled={loading || !newAdmin.name || !newAdmin.email}
          >
            {loading ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог удаления учетной записи */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Удаление учетной записи администратора</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить учетную запись администратора "{selectedAdmin?.name}"? 
            Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteAdmin} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог сброса пароля */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>
          {selectedAdmin ? 'Сброс пароля администратора' : 'Новая учетная запись создана'}
        </DialogTitle>
        <DialogContent>
          {selectedAdmin ? (
            <DialogContentText>
              Вы действительно хотите сбросить пароль для учетной записи "{selectedAdmin.name}"?
            </DialogContentText>
          ) : (
            <DialogContentText>
              Учетная запись успешно создана. Запишите логин и пароль для входа:
            </DialogContentText>
          )}
          
          {newPassword ? (
            <Box sx={{ mt: 2, mb: 2 }}>
              {!selectedAdmin && (
                <TextField
                  label="Логин"
                  fullWidth
                  value={adminAccounts[adminAccounts.length - 1]?.username || ''}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton 
                        onClick={() => {
                          navigator.clipboard.writeText(adminAccounts[adminAccounts.length - 1]?.username || '');
                          toast.success('Логин скопирован в буфер обмена');
                        }}
                      >
                        <FaCopy />
                      </IconButton>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
              
              <TextField
                label="Пароль"
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Box sx={{ display: 'flex' }}>
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                      <IconButton onClick={handleCopyPassword}>
                        <FaCopy />
                      </IconButton>
                    </Box>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Надежность пароля:
                </Typography>
                {renderPasswordStrength(newPassword)}
              </Box>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                Обязательно сохраните этот пароль! После закрытия этого окна вы не сможете его восстановить.
              </Alert>
            </Box>
          ) : selectedAdmin ? (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleResetPassword}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Сбросить пароль'}
              </Button>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenResetDialog(false);
              setNewPassword('');
              setSelectedAdmin(null);
            }} 
            color="primary"
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminAccounts; 
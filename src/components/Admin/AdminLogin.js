import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import { FaUserShield, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authenticateAdmin } from '../../services/adminService';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  // Проверяем, авторизован ли уже администратор
  useEffect(() => {
    const adminAuthenticated = localStorage.getItem('adminAuthenticated');
    
    if (adminAuthenticated === 'true') {
      navigate('/admin');
    }
  }, [navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, введите логин и пароль');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Попытка входа с логином:', username);
      
      // Используем новую функцию аутентификации
      const result = await authenticateAdmin(username, password);
      
      console.log('Вход выполнен успешно:', result);
      
      // Перенаправляем на страницу администратора
      navigate('/admin');
      
      toast.success('Вход выполнен успешно');
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError(error.message || 'Ошибка при входе');
      toast.error(error.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик для демо-входа (только для разработки)
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Сохраняем информацию о входе в localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUsername', 'admin');
      localStorage.setItem('adminRole', 'admin');
      
      // Перенаправляем на страницу администратора
      navigate('/admin');
      
      toast.success('Демо-вход выполнен успешно');
    } catch (error) {
      console.error('Ошибка при демо-входе:', error);
      setError('Ошибка при демо-входе');
      toast.error('Ошибка при демо-входе');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4, pt: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: '16px',
          backgroundColor: 'var(--tg-surface)',
          border: '1px solid var(--tg-border)',
          boxShadow: 'var(--tg-card-shadow)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <FaUserShield style={{ fontSize: '48px', color: 'var(--primary-color)' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
            Вход в панель администратора
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleLogin}>
          <TextField
            label="Логин"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <FaUserShield style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
              ),
            }}
            helperText="Для главного администратора: admin"
          />
          
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <FaLock style={{ marginRight: '10px', color: 'var(--primary-color)' }} />
              ),
            }}
            helperText="Для главного администратора: lomakin2006"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Войти'}
          </Button>
        </form>
        
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 1, color: 'text.secondary' }}>
              Только для разработки
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              size="large"
              onClick={handleDemoLogin}
              disabled={loading}
              sx={{ py: 1 }}
            >
              Демо-вход
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminLogin; 
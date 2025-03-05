import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      console.log('LoginForm - User authenticated, redirecting...');
      // Проверяем, есть ли сохраненный URL для редиректа
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('LoginForm - Form submitted');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }

    try {
      setError('');
      setLoading(true);
      console.log('LoginForm - Attempting to login');
      await login(formData.email, formData.password);
      // Редирект будет выполнен в useEffect
    } catch (error) {
      console.error('LoginForm - Login error:', error);
      setError(error.message || 'Произошла ошибка при входе. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        maxWidth: 400,
        mx: 'auto',
        p: 3
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Вход в систему
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        required
        disabled={loading}
        error={!!error && error.includes('email')}
      />

      <TextField
        label="Пароль"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        fullWidth
        required
        disabled={loading}
        error={!!error && error.includes('пароль')}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Войти'
        )}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Нет аккаунта?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => onSwitchToSignup('user')}
            sx={{ minWidth: '180px' }}
            disabled={loading}
          >
            Регистрация
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => onSwitchToSignup('guide')}
            sx={{ minWidth: '180px' }}
            disabled={loading}
          >
            Регистрация как гид
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm; 
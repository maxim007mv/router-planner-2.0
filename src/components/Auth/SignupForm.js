import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';

const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Пароли не совпадают');
    }

    // Проверка длины пароля
    if (formData.password.length < 6) {
      return setError('Пароль должен содержать не менее 6 символов');
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.displayName);
      navigate('/profile'); // Перенаправляем на страницу профиля после успешной регистрации
    } catch (error) {
      console.error('Signup error:', error);
      
      // Обработка конкретных ошибок Firebase
      if (error.message.includes('email-already-in-use')) {
        setError('Этот email уже используется');
      } else {
        setError(error.message || 'Ошибка при регистрации');
      }
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
        Регистрация
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Имя"
        name="displayName"
        value={formData.displayName}
        onChange={handleChange}
        fullWidth
        required
      />

      <TextField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        required
      />

      <TextField
        label="Пароль"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        fullWidth
        required
      />

      <TextField
        label="Подтвердите пароль"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        fullWidth
        required
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
          'Зарегистрироваться'
        )}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2">
          Уже есть аккаунт?{' '}
          <Link 
            component="button" 
            variant="body2" 
            onClick={onSwitchToLogin}
            sx={{ cursor: 'pointer' }}
          >
            Войти
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignupForm; 
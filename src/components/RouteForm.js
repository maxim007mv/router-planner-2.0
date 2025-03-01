import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';

const RouteForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    walkingTime: '',
    companions: '',
    budget: '',
    cafePreferences: '',
    additionalWishes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const prompt = `Сгенерируй персональный маршрут прогулки со следующими параметрами:
      - Время прогулки: ${formData.walkingTime} час(а/ов)
      - Компания: ${formData.companions}
      - Бюджет: ${formData.budget}
      - Предпочтения по кафе: ${formData.cafePreferences}
      - Дополнительные пожелания: ${formData.additionalWishes}
      
      Пожалуйста, предоставь детальный маршрут с рекомендациями по местам посещения, кафе и достопримечательностям.`;

      console.log('Отправляем запрос с данными:', { prompt });

      const response = await fetch('http://localhost:3005/generate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Ошибка от сервера:', data);
        throw new Error(data.error || 'Ошибка при генерации маршрута');
      }

      console.log('Получен ответ от сервера:', data);
      
      const formattedRoute = {
        walkingTime: formData.walkingTime,
        companions: formData.companions,
        budget: formData.budget,
        recommendations: data.output?.text || data.response?.text || 'Нет рекомендаций',
        routeDescription: data.output?.text || data.response?.text || 'Маршрут не сгенерирован'
      };

      console.log('Форматированный маршрут:', formattedRoute);

      localStorage.setItem('generatedRoute', JSON.stringify(formattedRoute));
      navigate('/route');
    } catch (error) {
      console.error('Ошибка при генерации маршрута:', error);
      setError(error.message || 'Произошла ошибка при генерации маршрута');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Планирование Маршрута
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Время прогулки</InputLabel>
              <Select
                name="walkingTime"
                value={formData.walkingTime}
                label="Время прогулки"
                onChange={handleChange}
                required
              >
                <MenuItem value="1">1 час</MenuItem>
                <MenuItem value="2">2 часа</MenuItem>
                <MenuItem value="3">3 часа</MenuItem>
                <MenuItem value="4">4+ часа</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="companions"
              label="С кем идете?"
              value={formData.companions}
              onChange={handleChange}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Бюджет</InputLabel>
              <Select
                name="budget"
                value={formData.budget}
                label="Бюджет"
                onChange={handleChange}
                required
              >
                <MenuItem value="low">Экономный (до 1000₽)</MenuItem>
                <MenuItem value="medium">Средний (1000₽-3000₽)</MenuItem>
                <MenuItem value="high">Высокий (3000₽+)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="cafePreferences"
              label="Предпочтения по кафе"
              value={formData.cafePreferences}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              name="additionalWishes"
              label="Дополнительные пожелания"
              value={formData.additionalWishes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
            />

            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Генерация...' : 'Сгенерировать Маршрут'}
            </Button>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RouteForm; 
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
import { useAuth } from '../context/AuthContext'; // Импортируем контекст аутентификации

// Используем переменную окружения для API_URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

const RouteForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Получаем текущего пользователя
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

  const parseRoutePoints = (routeText) => {
    const points = [];
    const pointsSection = routeText.split('📍 ДЕТАЛЬНЫЙ МАРШРУТ:')[1];
    
    if (pointsSection) {
      // Разбиваем на блоки по номерам точек
      const pointsBlocks = pointsSection.split(/\n\n\d+\./);
      
      // Пропускаем первый элемент, так как он пустой
      for (let i = 1; i < pointsBlocks.length; i++) {
        const block = pointsBlocks[i];
        const lines = block.trim().split('\n');
        
        const point = {
          name: '',
          description: '',
          duration: '',
          activities: [],
          tips: [],
          food: [],
          photos: [],
          transition: ''
        };

        // Первая строка - это название точки
        point.name = lines[0].trim();

        let currentSection = '';
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          
          if (line.startsWith('⏱️')) {
            point.duration = line.replace('⏱️ Время:', '').trim();
          } else if (line.startsWith('📝')) {
            point.description = line.replace('📝 Описание:', '').trim();
          } else if (line.startsWith('🎯 Активности:')) {
            currentSection = 'activities';
          } else if (line.startsWith('💡 Советы:')) {
            currentSection = 'tips';
          } else if (line.startsWith('🍽️')) {
            const food = line.replace('🍽️ Где поесть:', '').trim();
            if (food) point.food.push(food);
          } else if (line.startsWith('📸')) {
            const photos = line.replace('📸 Фото:', '').trim();
            if (photos) point.photos = [photos];
          } else if (line.startsWith('🚶')) {
            point.transition = line.replace('🚶 Переход:', '').trim();
          } else if (line.startsWith('- ')) {
            // Добавляем элементы в текущую секцию
            const item = line.replace('- ', '').trim();
            if (currentSection === 'activities' && item) {
              point.activities.push(item);
            } else if (currentSection === 'tips' && item) {
              point.tips.push(item);
            }
          }
        }

        if (point.name) {
          points.push(point);
        }
      }
    }
    
    console.log('Распарсенные точки:', points);
    return points;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Отправляем запрос с данными:', formData);

      const response = await fetch(`${API_URL}/api/generate-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: ['food', 'culture', 'entertainment'],
          duration: formData.walkingTime,
          pace: 'moderate',
          transportType: 'walking',
          timeOfDay: 'afternoon',
          accessibility: 'standard',
          preferences: `Компания: ${formData.companions}. Бюджет: ${formData.budget}. Предпочтения по кафе: ${formData.cafePreferences}. Дополнительные пожелания: ${formData.additionalWishes}`,
          userId: user ? user.uid : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при генерации маршрута');
      }

      const data = await response.json();
      console.log('Получен ответ от сервера:', data);
      console.log('Тип данных ответа:', typeof data);
      console.log('Структура ответа:', Object.keys(data));

      // Проверяем наличие необходимых данных
      if (!data.generatedRoute) {
        throw new Error('Некорректный формат ответа от сервера');
      }

      // Парсим точки из текстового описания маршрута
      const routePoints = parseRoutePoints(data.generatedRoute);
      console.log('Распарсенные точки маршрута:', routePoints);

      // Разделяем описание маршрута и детальный маршрут
      const [overview, details] = data.generatedRoute.split('📍 ДЕТАЛЬНЫЙ МАРШРУТ:');

      // Форматируем маршрут для сохранения
      const formattedRoute = {
        name: `Маршрут на ${formData.walkingTime} час(а/ов)`,
        description: overview.trim(),
        duration: formData.walkingTime,
        pace: data.routeMetadata?.pace || 'moderate',
        timeOfDay: data.routeMetadata?.timeOfDay || 'afternoon',
        points: routePoints,
        companions: formData.companions,
        budget: formData.budget,
        preferences: {
          cafePreferences: formData.cafePreferences,
          additionalWishes: formData.additionalWishes
        },
        weatherAdjustments: data.weatherAdjustments || {},
        recommendations: data.recommendations || {},
        routeMetadata: {
          ...data.routeMetadata,
          generatedAt: new Date().toISOString()
        }
      };

      console.log('Форматированный маршрут:', formattedRoute);
      console.log('Точки маршрута:', formattedRoute.points);
      console.log('Сохраняем в localStorage:', JSON.stringify(formattedRoute, null, 2));
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
              placeholder="Например: итальянская кухня, веганские блюда, уютная атмосфера..."
            />

            <TextField
              name="additionalWishes"
              label="Дополнительные пожелания"
              value={formData.additionalWishes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Например: интересуют исторические места, хочется посетить смотровые площадки, нужны места для фотосессии..."
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
              disabled={isLoading}
            >
              {isLoading ? 'Генерация маршрута...' : 'Сгенерировать маршрут'}
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
import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { FaLandmark } from 'react-icons/fa';

const HistoricalRoutes = () => {
  const historicalLocations = [
    {
      title: 'Красная площадь',
      description: 'Главная площадь Москвы, объект Всемирного наследия ЮНЕСКО',
      image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3'
    },
    {
      title: 'Старый Арбат',
      description: 'Знаменитая пешеходная улица с историческими зданиями и уличными музыкантами',
      image: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?ixlib=rb-4.0.3'
    },
    {
      title: 'Коломенское',
      description: 'Бывшая царская резиденция, музей-заповедник с уникальной архитектурой',
      image: 'https://images.unsplash.com/photo-1541447271487-09612b3f3555?ixlib=rb-4.0.3'
    }
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <FaLandmark size={32} color="#1976d2" />
          <Typography variant="h2" component="h1" sx={{ ml: 2 }}>
            Исторические маршруты
          </Typography>
        </Box>
        <Typography variant="h5" color="text.secondary">
          Погрузитесь в богатую историю и архитектуру Москвы
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {historicalLocations.map((location, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                }
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={location.image}
                alt={location.title}
              />
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  {location.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {location.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HistoricalRoutes; 
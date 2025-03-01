import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { FaUtensils } from 'react-icons/fa';

const GastroRoutes = () => {
  const gastroLocations = [
    {
      title: 'Даниловский рынок',
      description: 'Современный фудкорт и рынок с фермерскими продуктами',
      image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?ixlib=rb-4.0.3'
    },
    {
      title: 'Улица Никольская',
      description: 'Исторические рестораны и кафе в центре Москвы',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3'
    },
    {
      title: 'Депо',
      description: 'Крупнейший фудмолл Европы с разнообразной кухней',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3'
    }
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <FaUtensils size={32} color="#1976d2" />
          <Typography variant="h2" component="h1" sx={{ ml: 2 }}>
            Гастрономические маршруты
          </Typography>
        </Box>
        <Typography variant="h5" color="text.secondary">
          Откройте для себя кулинарное разнообразие столицы
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {gastroLocations.map((location, index) => (
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

export default GastroRoutes; 
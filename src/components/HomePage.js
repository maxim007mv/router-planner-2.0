import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { FaMapMarkedAlt, FaPalette, FaLandmark, FaUtensils } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(https://images.unsplash.com/photo-1512495039889-52a3b799c9bc?ixlib=rb-4.0.3)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 4,
          mb: 6,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 4,
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            p: 4,
            maxWidth: 800,
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom>
            Планировщик маршрутов по Москве
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Используйте силу искусственного интеллекта для создания уникальных маршрутов
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<FaMapMarkedAlt />}
            onClick={() => navigate('/form')}
            sx={{
              fontSize: '1.2rem',
              py: 2,
              px: 4,
            }}
          >
            Создать маршрут
          </Button>
        </Box>
      </Box>

      {/* Themed Routes Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Тематические маршруты
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
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
                image="https://images.unsplash.com/photo-1561488111-5d800fd56b8a?ixlib=rb-4.0.3"
                alt="Арт маршрут"
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FaPalette size={24} color="#1976d2" />
                  <Typography variant="h5" component="h3" sx={{ ml: 1 }}>
                    Арт-маршруты
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Исследуйте галереи современного искусства и уличные арт-объекты Москвы
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/art-routes')}
                >
                  Исследовать
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
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
                image="https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3"
                alt="Исторический маршрут"
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FaLandmark size={24} color="#1976d2" />
                  <Typography variant="h5" component="h3" sx={{ ml: 1 }}>
                    Исторические маршруты
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Откройте для себя архитектурные памятники и музеи столицы
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/historical-routes')}
                >
                  Исследовать
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
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
                image="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?ixlib=rb-4.0.3"
                alt="Гастрономический маршрут"
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FaUtensils size={24} color="#1976d2" />
                  <Typography variant="h5" component="h3" sx={{ ml: 1 }}>
                    Гастрономические туры
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Посетите лучшие рестораны и рынки города
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/gastro-routes')}
                >
                  Исследовать
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage; 
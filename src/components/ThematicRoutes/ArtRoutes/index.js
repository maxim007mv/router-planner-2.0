import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { FaPalette, FaMapMarkerAlt, FaClock, FaSubway, FaInfoCircle, FaCamera, FaWalking, FaCoffee } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ArtRoutes.css';

const ArtRoutes = () => {
  const artLocations = [
    {
      title: 'Винзавод',
      description: 'Центр современного искусства в здании бывшего пивоваренного завода',
      image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?ixlib=rb-4.0.3'
    },
    {
      title: 'Гараж',
      description: 'Музей современного искусства в Парке Горького',
      image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3'
    },
    {
      title: 'Третьяковская галерея на Крымском Валу',
      description: 'Основная площадка Третьяковской галереи для современного искусства',
      image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?ixlib=rb-4.0.3'
    }
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <FaPalette size={32} color="#1976d2" />
          <Typography variant="h2" component="h1" sx={{ ml: 2 }}>
            Арт-маршруты Москвы
          </Typography>
        </Box>
        <Typography variant="h5" color="text.secondary">
          Исследуйте современное искусство и культурные пространства столицы
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {artLocations.map((location, index) => (
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

export default ArtRoutes; 
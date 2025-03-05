import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Загрузка...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="h6" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 
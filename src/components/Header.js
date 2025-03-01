import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { FaMapMarkedAlt } from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <FaMapMarkedAlt size={24} color="#1976d2" />
          <Typography variant="h6" component="div" sx={{ ml: 1, color: '#1976d2', fontWeight: 600 }}>
            Route Planner
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="primary" onClick={() => navigate('/art-routes')}>
            Арт-маршруты
          </Button>
          <Button color="primary" onClick={() => navigate('/historical-routes')}>
            История
          </Button>
          <Button color="primary" onClick={() => navigate('/gastro-routes')}>
            Гастротуры
          </Button>
          <Button variant="contained" onClick={() => navigate('/form')}>
            Создать маршрут
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
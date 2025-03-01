import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  Group,
  Restaurant,
  AttachMoney,
  Place,
} from '@mui/icons-material';

const GeneratedRoute = () => {
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const savedRoute = localStorage.getItem('generatedRoute');
    if (savedRoute) {
      setRoute(JSON.parse(savedRoute));
    }
  }, []);

  if (!route) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Маршрут не найден. Пожалуйста, вернитесь на главную страницу.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          На главную
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ваш Персональный Маршрут
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <AccessTime />
            </ListItemIcon>
            <ListItemText
              primary="Время прогулки"
              secondary={`${route.walkingTime} час(а/ов)`}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Group />
            </ListItemIcon>
            <ListItemText
              primary="Компания"
              secondary={route.companions}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <AttachMoney />
            </ListItemIcon>
            <ListItemText
              primary="Бюджет"
              secondary={route.budget}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Restaurant />
            </ListItemIcon>
            <ListItemText
              primary="Рекомендуемые места"
              secondary={route.recommendations}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Place />
            </ListItemIcon>
            <ListItemText
              primary="Маршрут"
              secondary={route.routeDescription}
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/form')}
          >
            Создать новый маршрут
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            На главную
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default GeneratedRoute; 
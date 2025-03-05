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
  Snackbar,
  Alert
} from '@mui/material';
import {
  AccessTime,
  Group,
  Restaurant,
  AttachMoney,
  Place,
  Save,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { saveRoute, saveRouteToUserProfile } from '../services/routeService';
import { FaWalking, FaSun, FaMoon, FaClock, FaMap, FaInfoCircle, FaMapMarkerAlt, FaRoute, FaHome, FaUser, FaCamera } from 'react-icons/fa';

const GeneratedRoute = () => {
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const { user } = useAuth();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [routeSaved, setRouteSaved] = useState(false);

  useEffect(() => {
    const savedRoute = localStorage.getItem('generatedRoute');
    console.log('Данные из localStorage:', savedRoute);
    if (savedRoute) {
      try {
        const parsedRoute = JSON.parse(savedRoute);
        console.log('Загруженный маршрут:', parsedRoute);
        console.log('Тип данных маршрута:', typeof parsedRoute);
        console.log('Структура маршрута:', Object.keys(parsedRoute));
        console.log('Точки маршрута:', parsedRoute.points);
        if (!parsedRoute || !parsedRoute.points || !Array.isArray(parsedRoute.points)) {
          throw new Error('Некорректный формат маршрута');
        }
        setRoute(parsedRoute);
      } catch (error) {
        console.error('Ошибка при парсинге маршрута:', error);
        setSnackbar({
          open: true,
          message: 'Ошибка при загрузке маршрута',
          severity: 'error'
        });
      }
    }
  }, []);

  const handleSaveRoute = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Для сохранения маршрута необходимо авторизоваться',
        severity: 'warning'
      });
      return;
    }

    try {
      const sanitizedPoints = Array.isArray(route.points) ? route.points.map(point => ({
        name: point.name || '',
        description: point.description || '',
        duration: point.duration || '',
        activities: Array.isArray(point.activities) ? point.activities : 
          (point.activities ? [point.activities] : []),
        tips: Array.isArray(point.tips) ? point.tips : 
          (point.tips ? [point.tips] : []),
        food: Array.isArray(point.food) ? point.food : 
          (point.food ? [point.food] : []),
        photos: Array.isArray(point.photos) ? point.photos : 
          (point.photos ? [point.photos] : []),
        transition: point.transition || '',
        coordinates: point.coordinates || null
      })) : [];

      const routeData = {
        name: route.name || route.title || `Маршрут на ${route.duration || '2'} час(а/ов)`,
        description: route.description || '',
        duration: route.duration || '2',
        pace: route.pace || 'moderate',
        timeOfDay: route.timeOfDay || 'afternoon',
        isPublic: false,
        points: sanitizedPoints,
        createdAt: new Date().toISOString()
      };

      const savedRoute = await saveRoute(routeData);
      await saveRouteToUserProfile(user.uid, savedRoute.id);
      setRouteSaved(true);

      setSnackbar({
        open: true,
        message: 'Маршрут успешно сохранен в вашем профиле!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при сохранении маршрута:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при сохранении маршрута',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderPointDetails = (point) => {
    if (!point) return null;

    return (
      <Box sx={{ ml: 2 }}>
        {point.activities && point.activities.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary">Активности:</Typography>
            <List>
              {point.activities.map((activity, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={activity} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {point.food && point.food.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary">Еда и напитки:</Typography>
            <List>
              {point.food.map((item, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {point.photos && point.photos.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary">Фото возможности:</Typography>
            <List>
              {point.photos.map((photo, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={photo} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {point.tips && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Советы:
            </Typography>
            <List dense>
              {Array.isArray(point.tips) ? (
                point.tips.map((tip, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon>
                      <FaInfoCircle />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemIcon>
                    <FaInfoCircle />
                  </ListItemIcon>
                  <ListItemText primary={point.tips} />
                </ListItem>
              )}
            </List>
          </Box>
        )}

        {point.transition && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <FaRoute style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {point.transition}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

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
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
          Ваш Персональный Маршрут
        </Typography>

        <Box sx={{ mb: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <FaInfoCircle style={{ marginRight: '8px' }} /> Обзор маршрута
          </Typography>
          <Typography variant="body1">
            {route.description}
          </Typography>
        </Box>

        {/* Отображение точек маршрута */}
        {route.points && route.points.length > 0 ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <FaMapMarkerAlt style={{ marginRight: '8px' }} /> Точки маршрута
            </Typography>
            <List>
              {route.points.map((point, index) => {
                console.log(`Отображение точки ${index}:`, point);
                return (
                  <Paper key={index} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Place sx={{ mr: 1 }} />
                      {point.name}
                    </Typography>

                    {point.duration && (
                      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                        <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {point.duration}
                      </Typography>
                    )}

                    {point.description && (
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {point.description}
                      </Typography>
                    )}

                    {point.activities && point.activities.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Активности:
                        </Typography>
                        <List dense>
                          {point.activities.map((activity, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <FaRoute />
                              </ListItemIcon>
                              <ListItemText primary={activity} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {point.tips && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Советы:
                        </Typography>
                        <List dense>
                          {Array.isArray(point.tips) ? (
                            point.tips.map((tip, idx) => (
                              <ListItem key={idx}>
                                <ListItemIcon>
                                  <FaInfoCircle />
                                </ListItemIcon>
                                <ListItemText primary={tip} />
                              </ListItem>
                            ))
                          ) : (
                            <ListItem>
                              <ListItemIcon>
                                <FaInfoCircle />
                              </ListItemIcon>
                              <ListItemText primary={point.tips} />
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}

                    {point.food && point.food.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Где поесть:
                        </Typography>
                        <List dense>
                          {point.food.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <Restaurant />
                              </ListItemIcon>
                              <ListItemText primary={item} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {point.photos && point.photos.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Фото возможности:
                        </Typography>
                        <List dense>
                          {point.photos.map((photo, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <FaCamera />
                              </ListItemIcon>
                              <ListItemText primary={photo} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {point.transition && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <FaWalking style={{ marginRight: '8px' }} />
                          {point.transition}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </List>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Точки маршрута не найдены
          </Typography>
        )}

        <List>
          <ListItem>
            <ListItemIcon>
              <AccessTime />
            </ListItemIcon>
            <ListItemText
              primary="Время прогулки"
              secondary={`${route.duration || '2'} час(а/ов)`}
            />
          </ListItem>

          {route.pace && (
            <ListItem>
              <ListItemIcon>
                <FaWalking style={{ fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Темп"
                secondary={
                  route.pace === 'relaxed' ? 'Расслабленный' :
                  route.pace === 'moderate' ? 'Умеренный' : 'Активный'
                }
              />
            </ListItem>
          )}

          {route.timeOfDay && (
            <ListItem>
              <ListItemIcon>
                {route.timeOfDay === 'morning' ? <FaSun style={{ fontSize: 24 }} /> :
                 route.timeOfDay === 'evening' ? <FaMoon style={{ fontSize: 24 }} /> :
                 <FaClock style={{ fontSize: 24 }} />}
              </ListItemIcon>
              <ListItemText
                primary="Время суток"
                secondary={
                  route.timeOfDay === 'morning' ? 'Утро' :
                  route.timeOfDay === 'afternoon' ? 'День' : 'Вечер'
                }
              />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mt: 4 }}>
          Точки маршрута
        </Typography>

        {route.points && route.points.map((point, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              {point.name || `Точка ${index + 1}`}
            </Typography>
            
            {point.description && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {point.description}
              </Typography>
            )}

            {renderPointDetails(point)}
          </Paper>
        ))}

        {!routeSaved && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveRoute}
              startIcon={<Save />}
            >
              Сохранить маршрут
            </Button>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GeneratedRoute; 
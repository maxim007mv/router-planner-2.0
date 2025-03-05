import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { getUserRoutes, deleteRoute } from '../../services/routeService';
import { useAuth } from '../../context/AuthContext';

const RoutesList = () => {
  const { currentUser } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, routeId: null });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const userRoutes = await getUserRoutes();
        setRoutes(userRoutes);
        setError(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Не удалось загрузить маршруты. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchRoutes();
    }
  }, [currentUser]);

  const handleDeleteClick = (routeId) => {
    setDeleteDialog({ open: true, routeId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRoute(deleteDialog.routeId);
      setRoutes(routes.filter(route => route.id !== deleteDialog.routeId));
      setSnackbar({
        open: true,
        message: 'Маршрут успешно удален',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting route:', err);
      setSnackbar({
        open: true,
        message: 'Не удалось удалить маршрут: ' + err.message,
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, routeId: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Загрузка маршрутов...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Мои маршруты
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/routes/create"
        >
          Создать новый маршрут
        </Button>
      </Box>

      {routes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            У вас пока нет сохраненных маршрутов
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Создайте свой первый маршрут, чтобы он отобразился здесь
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/routes/create"
          >
            Создать маршрут
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {routes.map((route) => (
            <Grid item key={route.id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={route.imageUrls && route.imageUrls.length > 0 
                    ? route.imageUrls[0] 
                    : 'https://via.placeholder.com/400x200?text=Нет+изображения'}
                  alt={route.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {route.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {route.description && route.description.length > 100
                      ? `${route.description.substring(0, 100)}...`
                      : route.description || 'Нет описания'}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Сложность: {route.difficulty || 'Не указана'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Длина: {route.distance ? `${route.distance} км` : 'Не указана'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Статус: {route.isPublic ? 'Публичный' : 'Приватный'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/routes/${route.id}`}
                  >
                    Просмотр
                  </Button>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/routes/edit/${route.id}`}
                  >
                    Редактировать
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteClick(route.id)}
                  >
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, routeId: null })}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить этот маршрут? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, routeId: null })}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoutesList; 
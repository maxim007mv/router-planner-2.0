import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Divider, 
  CircularProgress, 
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as AccessTimeIcon,
  DirectionsWalk as DirectionsWalkIcon,
  Terrain as TerrainIcon,
  Place as PlaceIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getRouteById, deleteRoute } from '../../services/routeService';
import { likeRoute, unlikeRoute, hasUserLikedRoute, addRouteToFavorites, removeRouteFromFavorites, isRouteInFavorites } from '../../services/communityService';
import CommentsList from '../Comments/CommentsList';

// Временная заглушка для MapView
const MapView = ({ routePoints }) => (
  <Box sx={{ 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    bgcolor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 1
  }}>
    <Box sx={{ textAlign: 'center' }}>
      <MapIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
      <Typography>
        Карта маршрута ({routePoints.length} точек)
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Для отображения карты требуется настройка Yandex Maps API
      </Typography>
    </Box>
  </Box>
);

const RouteDetail = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLiked, setUserLiked] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [processingLike, setProcessingLike] = useState(false);
  const [processingFavorite, setProcessingFavorite] = useState(false);

  useEffect(() => {
    fetchRouteDetails();
  }, [routeId]);

  useEffect(() => {
    if (currentUser && route) {
      checkUserInteractions();
    }
  }, [currentUser, route]);

  const fetchRouteDetails = async () => {
    try {
      setLoading(true);
      const routeData = await getRouteById(routeId);
      setRoute(routeData);
      setLikesCount(routeData.likesCount || 0);
      setError('');
    } catch (error) {
      console.error('Error fetching route details:', error);
      setError('Не удалось загрузить информацию о маршруте');
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async () => {
    try {
      const [liked, favorited] = await Promise.all([
        hasUserLikedRoute(routeId),
        isRouteInFavorites(routeId)
      ]);
      setUserLiked(liked);
      setInFavorites(favorited);
    } catch (error) {
      console.error('Error checking user interactions:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    try {
      setProcessingLike(true);
      if (userLiked) {
        await unlikeRoute(routeId);
        setUserLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likeRoute(routeId);
        setUserLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setProcessingLike(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    try {
      setProcessingFavorite(true);
      if (inFavorites) {
        await removeRouteFromFavorites(routeId);
        setInFavorites(false);
      } else {
        await addRouteToFavorites(routeId);
        setInFavorites(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setProcessingFavorite(false);
    }
  };

  const handleEditRoute = () => {
    navigate(`/routes/edit/${routeId}`);
  };

  const handleDeleteRoute = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот маршрут?')) {
      try {
        await deleteRoute(routeId);
        navigate('/routes');
      } catch (error) {
        console.error('Error deleting route:', error);
        setError('Не удалось удалить маршрут');
      }
    }
  };

  const isOwner = currentUser && route && currentUser.uid === route.userId;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/routes')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку маршрутов
        </Button>
      </Box>
    );
  }

  if (!route) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">Маршрут не найден</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/routes')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку маршрутов
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/routes')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {route.title}
          </Typography>
          
          <Box>
            <IconButton 
              color={userLiked ? 'error' : 'default'} 
              onClick={handleLikeToggle}
              disabled={processingLike}
              aria-label={userLiked ? 'Убрать лайк' : 'Поставить лайк'}
            >
              {userLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2" component="span">
              {likesCount}
            </Typography>
            
            <IconButton 
              color={inFavorites ? 'primary' : 'default'} 
              onClick={handleFavoriteToggle}
              disabled={processingFavorite}
              aria-label={inFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
              sx={{ ml: 1 }}
            >
              {inFavorites ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {route.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {route.tags && route.tags.map((tag, index) => (
            <Chip key={index} label={tag} size="small" />
          ))}
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Продолжительность" 
                  secondary={`${route.duration} ч.`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DirectionsWalkIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Расстояние" 
                  secondary={`${route.distance} км`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <TerrainIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Сложность" 
                  secondary={
                    route.difficulty === 'easy' ? 'Легкий' :
                    route.difficulty === 'medium' ? 'Средний' :
                    route.difficulty === 'hard' ? 'Сложный' : 
                    route.difficulty
                  } 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PlaceIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Начальная точка" 
                  secondary={route.startPoint} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PlaceIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Конечная точка" 
                  secondary={route.endPoint} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PlaceIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Количество точек" 
                  secondary={route.routePoints ? route.routePoints.length : 0} 
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        {route.imageUrl && (
          <Box sx={{ mb: 3 }}>
            <img 
              src={route.imageUrl} 
              alt={route.title} 
              style={{ width: '100%', borderRadius: 8, maxHeight: 400, objectFit: 'cover' }} 
            />
          </Box>
        )}

        {route.routePoints && route.routePoints.length > 0 && (
          <Box sx={{ height: 400, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Карта маршрута
            </Typography>
            <MapView routePoints={route.routePoints} />
          </Box>
        )}

        {isOwner && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={handleEditRoute}
            >
              Редактировать
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={handleDeleteRoute}
            >
              Удалить
            </Button>
          </Box>
        )}
      </Paper>

      {route.places && route.places.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Места на маршруте
          </Typography>
          <Grid container spacing={3}>
            {route.places.map((place) => (
              <Grid item xs={12} sm={6} md={4} key={place.id}>
                <Card>
                  {place.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={place.imageUrl}
                      alt={place.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {place.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {place.type === 'cafe' ? 'Кафе' :
                       place.type === 'restaurant' ? 'Ресторан' :
                       place.type === 'attraction' ? 'Достопримечательность' :
                       place.type === 'museum' ? 'Музей' :
                       place.type === 'park' ? 'Парк' :
                       place.type === 'viewpoint' ? 'Смотровая площадка' :
                       place.type}
                    </Typography>
                    {place.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {place.description.length > 100 
                          ? `${place.description.substring(0, 100)}...` 
                          : place.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />
      
      <CommentsList routeId={routeId} />
    </Box>
  );
};

export default RouteDetail; 
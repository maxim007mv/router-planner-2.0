import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  CircularProgress, 
  Alert,
  Rating,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Card,
  CardMedia,
  IconButton,
  Chip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Send as SendIcon,
  Place as PlaceIcon,
  Restaurant as RestaurantIcon,
  LocalCafe as CafeIcon,
  Museum as MuseumIcon,
  Park as ParkIcon,
  Landscape as ViewpointIcon,
  Hotel as HotelIcon,
  Help as OtherIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getPlaceById, addPlaceReview, getPlaceReviews, PLACE_TYPES } from '../../services/placesService';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const PlaceDetail = () => {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      const placeData = await getPlaceById(placeId);
      setPlace(placeData);
      setError('');
      
      // Загружаем отзывы
      fetchReviews();
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError('Не удалось загрузить информацию о месте');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await getPlaceReviews(placeId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (reviewRating === 0) {
      setReviewError('Пожалуйста, укажите рейтинг');
      return;
    }

    try {
      setSubmitting(true);
      setReviewError('');
      
      await addPlaceReview(placeId, {
        rating: reviewRating,
        text: reviewText.trim()
      });
      
      setReviewText('');
      setReviewRating(0);
      
      // Обновляем данные места и отзывы
      fetchPlaceDetails();
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError('Не удалось добавить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  const formatReviewDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ru });
  };

  const getPlaceTypeIcon = (type) => {
    switch (type) {
      case PLACE_TYPES.CAFE:
        return <CafeIcon />;
      case PLACE_TYPES.RESTAURANT:
        return <RestaurantIcon />;
      case PLACE_TYPES.ATTRACTION:
        return <PlaceIcon />;
      case PLACE_TYPES.MUSEUM:
        return <MuseumIcon />;
      case PLACE_TYPES.PARK:
        return <ParkIcon />;
      case PLACE_TYPES.VIEWPOINT:
        return <ViewpointIcon />;
      case PLACE_TYPES.HOTEL:
        return <HotelIcon />;
      default:
        return <OtherIcon />;
    }
  };

  const getPlaceTypeName = (type) => {
    switch (type) {
      case PLACE_TYPES.CAFE:
        return 'Кафе';
      case PLACE_TYPES.RESTAURANT:
        return 'Ресторан';
      case PLACE_TYPES.ATTRACTION:
        return 'Достопримечательность';
      case PLACE_TYPES.MUSEUM:
        return 'Музей';
      case PLACE_TYPES.PARK:
        return 'Парк';
      case PLACE_TYPES.VIEWPOINT:
        return 'Смотровая площадка';
      case PLACE_TYPES.HOTEL:
        return 'Отель';
      default:
        return 'Другое';
    }
  };

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
          onClick={() => navigate('/places')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку мест
        </Button>
      </Box>
    );
  }

  if (!place) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">Место не найдено</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/places')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку мест
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        maxWidth: '100vw',
        overflowX: 'hidden',
        px: { xs: 1, sm: 2, md: 3 },
        pb: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/places')}
        sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        Вернуться к списку мест
      </Button>

      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 1, sm: 2 }
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Изображение места */}
          <Grid item xs={12} md={6}>
            {place.imageUrls && place.imageUrls.length > 0 ? (
              <Box
                component="img"
                src={place.imageUrls[0]}
                alt={place.name}
                sx={{
                  width: '100%',
                  height: { xs: 200, sm: 300, md: 400 },
                  objectFit: 'cover',
                  borderRadius: { xs: 1, sm: 2 }
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 200, sm: 300, md: 400 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: { xs: 1, sm: 2 }
                }}
              >
                <PlaceIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'grey.400' }} />
              </Box>
            )}
          </Grid>

          {/* Информация о месте */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' }, 
                  gap: { xs: 1, sm: 2 },
                  mb: { xs: 2, sm: 3 }
                }}
              >
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem' }
                  }}
                >
                  {place.name}
                </Typography>
                <Chip
                  icon={getPlaceTypeIcon(place.type)}
                  label={getPlaceTypeName(place.type)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    height: { xs: 24, sm: 32 }
                  }}
                />
              </Box>

              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                {place.cuisine && (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    <strong>Кухня:</strong> {place.cuisine}
                  </Typography>
                )}

                {place.features && (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    <strong>Особенности:</strong> {place.features}
                  </Typography>
                )}

                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  <strong>Адрес:</strong> {place.address}
                </Typography>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 2 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating
                      value={place.rating || 0}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        ml: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      ({place.reviewsCount || 0} отзывов)
                    </Typography>
                  </Box>
                  {place.priceLevel && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {[...Array(parseInt(place.priceLevel))].map((_, i) => (
                        <Typography 
                          key={i} 
                          color="success.main" 
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          ₽
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {currentUser && (
                <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Оставьте свой отзыв..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    sx={{ mb: { xs: 1, sm: 2 } }}
                  />
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: { xs: 1, sm: 2 }
                    }}
                  >
                    <Rating
                      value={reviewRating}
                      onChange={(event, newValue) => {
                        setReviewRating(newValue);
                      }}
                      size="large"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<SendIcon />}
                      onClick={handleSubmitReview}
                      disabled={!reviewText.trim() || !reviewRating || submitting}
                      fullWidth={false}
                      sx={{ 
                        width: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      Отправить отзыв
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Отзывы */}
      <Paper 
        elevation={0} 
        sx={{ 
          mt: { xs: 2, sm: 3 }, 
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 1, sm: 2 }
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Отзывы
        </Typography>
        
        {reviews.length > 0 ? (
          <List 
            sx={{ 
              width: '100%', 
              bgcolor: 'background.paper',
              '& .MuiListItem-root': {
                px: { xs: 0, sm: 2 },
                py: { xs: 1.5, sm: 2 }
              }
            }}
          >
            {reviews.map((review, index) => (
              <React.Fragment key={review.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        width: { xs: 32, sm: 40 }, 
                        height: { xs: 32, sm: 40 } 
                      }}
                    >
                      {review.userName ? review.userName[0] : 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 0.5, sm: 1 }
                        }}
                      >
                        <Typography 
                          component="span" 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {review.userName || 'Пользователь'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating 
                            value={review.rating} 
                            size="small" 
                            readOnly 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: ru })}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mt: { xs: 0.5, sm: 1 },
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {review.text}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < reviews.length - 1 && (
                  <Divider 
                    variant="inset" 
                    component="li" 
                    sx={{ 
                      my: { xs: 1, sm: 2 }
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Пока нет отзывов. Будьте первым!
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default PlaceDetail; 
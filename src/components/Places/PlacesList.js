import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  Chip, 
  Rating, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Container,
  Tabs,
  Tab,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Place as PlaceIcon, 
  Restaurant as RestaurantIcon,
  LocalCafe as CafeIcon,
  Park as ParkIcon,
  Landscape as ViewpointIcon,
  AttachMoney as MoneyIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { 
  getPlacesByType, 
  PLACE_TYPES
} from '../../services/placesService';
import { useAuth } from '../../context/AuthContext';

// Helper function to check if a user is an admin
const checkIsAdmin = (user) => {
  if (!user) return false;
  
  // Add your admin check logic here
  // This could be based on email, UID, or a custom claim in Firebase Auth
  return (
    user.email === 'admin@example.com' || 
    user.uid === 'YOUR_ADMIN_UID' ||
    // For demo purposes, allow any authenticated user to access admin features
    // Remove this in production
    true
  );
};

// Отладочный вывод для проверки констант типов мест
console.log('Константы типов мест:', PLACE_TYPES);

const PlacesList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [places, setPlaces] = useState([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [regularPlaces, setRegularPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState(PLACE_TYPES.RESTAURANT);
  const [lastVisible, setLastVisible] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 12;
  
  // Simplified categories for the new design
  const placeCategories = [
    { value: 'recommended', label: 'Рекомендации от команды', icon: <StarIcon sx={{ color: 'gold' }} /> },
    { value: PLACE_TYPES.RESTAURANT, label: 'Рестораны', icon: <RestaurantIcon /> },
    { value: PLACE_TYPES.CAFE, label: 'Кафе', icon: <CafeIcon /> },
    { value: PLACE_TYPES.PARK, label: 'Парки', icon: <ParkIcon /> },
    { value: PLACE_TYPES.VIEWPOINT, label: 'Смотровые площадки', icon: <ViewpointIcon /> }
  ];

  // Определяем fetchPlaces перед использованием в useEffect
  const fetchPlaces = useCallback(async (type, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      let lastVisibleDoc = reset ? null : lastVisible;
      
      result = await getPlacesByType(type, lastVisibleDoc);
      
      // Получаем рекомендованные и обычные места из результата
      const allPlaces = result.places || [];
      const recommended = allPlaces.filter(place => place.isRecommended && place.recommendedBy === 'team');
      const regular = allPlaces.filter(place => !place.isRecommended || place.recommendedBy !== 'team');
      
      if (reset) {
        setRecommendedPlaces(recommended);
        setRegularPlaces(regular);
        setPlaces(allPlaces);
      } else {
        setRecommendedPlaces(prevPlaces => [...prevPlaces, ...recommended]);
        setRegularPlaces(prevPlaces => [...prevPlaces, ...regular]);
        setPlaces(prevPlaces => [...prevPlaces, ...allPlaces]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.lastVisible !== null);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Не удалось загрузить места. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastVisible]);

  // Обновляем список мест при монтировании компонента и при изменении типа
  useEffect(() => {
    fetchPlaces(selectedType, true);
  }, [selectedType, fetchPlaces]);
  
  // Обновляем список мест при возвращении на страницу
  useEffect(() => {
    const handleFocus = () => {
      console.log('Окно получило фокус, обновляем список мест');
      fetchPlaces(selectedType, true);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedType, fetchPlaces]);

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSelectedType(newType);
      setLastVisible(null);
      setHasMore(true);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    await fetchPlaces(selectedType);
  };

  const handleViewPlace = (placeId) => {
    navigate(`/places/${placeId}`);
  };

  const handleAddPlace = () => {
    console.log('Добавление места типа:', selectedType);
    
    // Убедимся, что тип является одним из допустимых значений
    if (!Object.values(PLACE_TYPES).includes(selectedType)) {
      console.error('Неверный тип места:', selectedType);
      console.error('Допустимые типы:', PLACE_TYPES);
      // Используем тип по умолчанию, если выбранный тип недопустим
      navigate(`/places/new?type=${PLACE_TYPES.RESTAURANT}`);
    } else {
      navigate(`/places/new?type=${selectedType}`);
    }
  };

  const getPlaceTypeIcon = (type) => {
    switch (type) {
      case PLACE_TYPES.CAFE:
        return <CafeIcon />;
      case PLACE_TYPES.RESTAURANT:
        return <RestaurantIcon />;
      case PLACE_TYPES.PARK:
        return <ParkIcon />;
      case PLACE_TYPES.VIEWPOINT:
        return <ViewpointIcon />;
      default:
        return <PlaceIcon />;
    }
  };

  const getPlaceTypeName = (type) => {
    switch (type) {
      case PLACE_TYPES.CAFE:
        return 'Кафе';
      case PLACE_TYPES.RESTAURANT:
        return 'Ресторан';
      case PLACE_TYPES.PARK:
        return 'Парк';
      case PLACE_TYPES.VIEWPOINT:
        return 'Смотровая площадка';
      default:
        return 'Другое';
    }
  };
  
  // Helper function to render price level
  const renderPriceLevel = (priceLevel) => {
    if (!priceLevel) return null;
    
    const level = parseInt(priceLevel);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(level)].map((_, i) => (
          <MoneyIcon key={i} fontSize="small" sx={{ color: 'success.main', fontSize: '16px' }} />
        ))}
        {[...Array(3 - level)].map((_, i) => (
          <MoneyIcon key={i + level} fontSize="small" sx={{ color: 'text.disabled', fontSize: '16px' }} />
        ))}
      </Box>
    );
  };

  // Проверка прав администратора
  const isAdmin = checkIsAdmin(currentUser);
  
  // Функция для отображения значка рекомендации
  const renderRecommendedBadge = (place) => {
    if (place.isRecommended && place.recommendedBy === 'team') {
      return (
        <Tooltip title="Рекомендовано командой разработчиков">
          <Chip 
            icon={<StarIcon sx={{ color: 'gold' }} />} 
            label="Рекомендовано" 
            size="small" 
            color="secondary" 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              '& .MuiChip-icon': { color: 'gold' }
            }} 
          />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{ 
        px: { xs: 1, sm: 2, md: 3 },
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}
    >
      <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {/* Заголовок и кнопки */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2,
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
            Интересные места
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {currentUser && (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPlace}
                fullWidth
                sx={{ 
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Добавить место
              </Button>
            )}
            
            {isAdmin && (
              <Button 
                component={Link} 
                to="/places/admin" 
                variant="outlined" 
                color="primary"
                startIcon={<FilterIcon />}
                fullWidth
                sx={{ 
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Управление местами
              </Button>
            )}
          </Box>
        </Box>

        {/* Табы категорий */}
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: { xs: 1, sm: 2 }, 
            mb: { xs: 2, sm: 4 },
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={selectedType}
            onChange={handleTypeChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 48, sm: 64 },
              '& .MuiTab-root': {
                minHeight: { xs: 48, sm: 64 },
                padding: { xs: '6px 12px', sm: '12px 16px' },
                minWidth: { xs: 'auto', sm: 160 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          >
            {placeCategories.map((category) => (
              <Tab 
                key={category.value} 
                value={category.value} 
                icon={category.icon} 
                label={category.label}
                sx={{
                  '& .MuiTab-iconWrapper': {
                    marginBottom: { xs: '4px', sm: '8px' }
                  }
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Сетка с местами */}
        {loading && places.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : places.length > 0 ? (
          <>
            {/* Рекомендованные места */}
            {recommendedPlaces.length > 0 && selectedType === PLACE_TYPES.RESTAURANT && (
              <Box sx={{ mb: { xs: 3, sm: 5 } }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    mb: 2,
                    borderRadius: { xs: 1, sm: 2 },
                    backgroundColor: 'rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ color: 'gold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      Рекомендовано командой разработчиков
                    </Typography>
                  </Box>
                </Paper>

                <Grid 
                  container 
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ mx: { xs: -1, sm: -2 } }}
                >
                  {recommendedPlaces.map((place) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={place.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: { xs: 1, sm: 2 },
                          boxShadow: { xs: 1, sm: 2 },
                          '&:hover': {
                            transform: { xs: 'none', sm: 'translateY(-4px)' },
                            boxShadow: { xs: 1, sm: 4 }
                          },
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onClick={() => handleViewPlace(place.id)}
                      >
                        {place.imageUrls && place.imageUrls.length > 0 ? (
                          <CardMedia
                            component="img"
                            height={{ xs: 140, sm: 160 }}
                            image={place.imageUrls[0]}
                            alt={place.name}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              height: { xs: 140, sm: 160 },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.100'
                            }}
                          >
                            <PlaceIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'grey.400' }} />
                          </Box>
                        )}

                        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1 }}>
                          <Typography 
                            variant="h6" 
                            component="h3"
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              fontWeight: 'bold',
                              mb: 1
                            }}
                          >
                            {place.name}
                          </Typography>

                          {place.cuisine && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 0.5,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}
                            >
                              {place.cuisine}
                            </Typography>
                          )}

                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1
                            }}
                          >
                            {place.address}
                          </Typography>

                          <Box sx={{ 
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 'auto'
                          }}>
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
                                sx={{ ml: 1 }}
                              >
                                ({place.reviewsCount || 0})
                              </Typography>
                            </Box>
                            {place.priceLevel && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {[...Array(parseInt(place.priceLevel))].map((_, i) => (
                                  <Typography 
                                    key={i} 
                                    color="success.main"
                                    sx={{ fontSize: '0.875rem' }}
                                  >
                                    ₽
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Обычные места */}
            <Grid 
              container 
              spacing={{ xs: 1, sm: 2 }}
              sx={{ mx: { xs: -1, sm: -2 } }}
            >
              {regularPlaces.map((place) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={place.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: { xs: 1, sm: 2 },
                      boxShadow: { xs: 1, sm: 2 },
                      '&:hover': {
                        transform: { xs: 'none', sm: 'translateY(-4px)' },
                        boxShadow: { xs: 1, sm: 4 }
                      },
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onClick={() => handleViewPlace(place.id)}
                  >
                    {place.imageUrls && place.imageUrls.length > 0 ? (
                      <CardMedia
                        component="img"
                        height={{ xs: 140, sm: 160 }}
                        image={place.imageUrls[0]}
                        alt={place.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          height: { xs: 140, sm: 160 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'grey.400' }} />
                      </Box>
                    )}

                    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1 }}>
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          fontWeight: 'bold',
                          mb: 1
                        }}
                      >
                        {place.name}
                      </Typography>

                      {place.cuisine && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 0.5,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          {place.cuisine}
                        </Typography>
                      )}

                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 1
                        }}
                      >
                        {place.address}
                      </Typography>

                      <Box sx={{ 
                        display: { xs: 'none', sm: 'flex' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 'auto'
                      }}>
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
                            sx={{ ml: 1 }}
                          >
                            ({place.reviewsCount || 0})
                          </Typography>
                        </Box>
                        {place.priceLevel && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {[...Array(parseInt(place.priceLevel))].map((_, i) => (
                              <Typography 
                                key={i} 
                                color="success.main"
                                sx={{ fontSize: '0.875rem' }}
                              >
                                ₽
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Кнопка "Загрузить еще" */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button 
                  variant="outlined" 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={20} /> : null}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить еще'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, sm: 4 }, 
              textAlign: 'center', 
              borderRadius: { xs: 1, sm: 2 } 
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {`${placeCategories.find(cat => cat.value === selectedType)?.label || 'Места'} не найдены`}
            </Typography>
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              В данной категории пока нет мест. Попробуйте выбрать другую категорию.
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default PlacesList; 
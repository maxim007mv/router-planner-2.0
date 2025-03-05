import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Button,
  Chip,
  IconButton,
  Grid,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Fab,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Star,
  Comment as CommentIcon,
  LocationOn,
  Close as CloseIcon,
  Add as AddIcon,
  AutoFixHigh as AutoFixHighIcon,
  Person as PersonIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  DirectionsWalk as DirectionsWalkIcon,
  AttachMoney as AttachMoneyIcon,
  Place as PlaceIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPublicRoutes } from '../../services/routeService';
import { 
  likeRoute, 
  unlikeRoute, 
  hasUserLikedRoute, 
  getRouteLikesCount,
  addRouteToFavorites, 
  removeRouteFromFavorites, 
  isRouteInFavorites 
} from '../../services/communityService';
import { addComment, getRouteComments } from '../../services/commentService';
import { saveRoute } from '../../services/routeService';
import { generateRoute } from '../../services/aiService';
import './Community.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

const Community = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [postData, setPostData] = useState({
    title: '',
    description: '',
    category: 'all',
    tags: [],
    difficulty: 'medium',
    duration: '',
    distance: '',
    cost: '',
    routePoints: '',
    isPublic: true,
    imageUrl: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [processingAI, setProcessingAI] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [improvedText, setImprovedText] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Категории контента
  const tabs = [
    { label: 'Все', value: 'all' },
    { label: 'Маршруты от гидов', value: 'guides' },
    { label: 'Советы местных', value: 'locals' },
    { label: 'Популярные места', value: 'popular' },
    { label: 'Рестораны', value: 'restaurants' },
    { label: 'Фотолокации', value: 'photo' },
  ];

  // Шаги создания поста
  const createPostSteps = [
    'Основная информация',
    'Детали маршрута',
    'Предпросмотр и публикация'
  ];

  const formatGeneratedText = (text) => {
    // Разделяем текст на секции по пустым строкам
    const sections = text.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0];
      const content = lines.slice(1).join('\n');
      
      // Определяем тип секции по заголовку
      let icon = <InfoIcon />;
      if (title.toLowerCase().includes('время') || title.toLowerCase().includes('длительность')) {
        icon = <AccessTimeIcon />;
      } else if (title.toLowerCase().includes('маршрут') || title.toLowerCase().includes('путь')) {
        icon = <DirectionsWalkIcon />;
      } else if (title.toLowerCase().includes('стоимость') || title.toLowerCase().includes('цена')) {
        icon = <AttachMoneyIcon />;
      } else if (title.toLowerCase().includes('место') || title.toLowerCase().includes('локация')) {
        icon = <PlaceIcon />;
      }

      return (
        <Box key={index} className="formatted-text-section">
          <Box className="formatted-text-title">
            {icon}
            {title}
          </Box>
          <Box className="formatted-text-content">
            {content.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('-')) {
                return (
                  <Box key={lineIndex} className="formatted-text-list-item">
                    {line.replace('-', '').trim()}
                  </Box>
                );
              }
              return <div key={lineIndex}>{line}</div>;
            })}
          </Box>
          {index < sections.length - 1 && <Box className="formatted-text-divider" />}
        </Box>
      );
    });
  };

  // Получение публичных маршрутов
  const getPublicRoutesData = async () => {
    try {
      setLoading(true);
      
      const routesData = await getPublicRoutes();
      
      // Обновляем состояние маршрутов
      setRoutes(routesData);
      
      // Применяем фильтры к полученным маршрутам
      if (activeTab !== 'all') {
        const filtered = routesData.filter(route => route.category === activeTab);
        setRoutes(filtered);
      }
    } catch (error) {
      console.error('Error fetching public routes:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось загрузить маршруты. Пожалуйста, попробуйте позже.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для обновления маршрута в списке после лайка/анлайка
  const updateRouteInList = (routeId, newLikesCount) => {
    setRoutes(prevRoutes => 
      prevRoutes.map(route => 
        route.id === routeId 
          ? { ...route, likesCount: newLikesCount } 
          : route
      )
    );
  };

  // Загрузка маршрутов из Firestore
  useEffect(() => {
    let isMounted = true;
    
    const fetchRoutes = async () => {
      if (!isMounted) return;
      
      // Не показываем индикатор загрузки при смене категорий, только при первой загрузке
      if (routes.length === 0) {
        setLoading(true);
      }
      
      try {
        // Получаем маршруты через стандартный метод
        const fetchedRoutes = await getPublicRoutes();
        
        if (!isMounted) return;
        
        // Проверяем, что у всех маршрутов есть категория
        const validatedRoutes = fetchedRoutes.map(route => {
          if (!route.category) {
            return { ...route, category: 'all' };
          }
          return route;
        });
        
        // Фильтруем маршруты по выбранной категории
        const filteredRoutes = activeTab === 'all' 
          ? validatedRoutes // Если выбрана вкладка "Все", показываем все маршруты
          : validatedRoutes.filter(route => route.category === activeTab);
        
        if (!isMounted) return;
        
        setRoutes(filteredRoutes);
        setError('');
      } catch (error) {
        console.error('Error fetching routes:', error);
        if (isMounted) {
          setError('Не удалось загрузить маршруты');
          setRoutes([]); // Устанавливаем пустой массив маршрутов при ошибке
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRoutes();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, tabs]);

  // Проверка статуса аутентификации
  useEffect(() => {
    // Устанавливаем флаг, что проверка аутентификации выполнена
    setAuthChecked(true);
    
    // Если пользователь не авторизован, показываем уведомление только при попытке выполнить действие,
    // требующее авторизации (лайк, комментарий, добавление в избранное)
  }, [currentUser]);

  // Добавляем эффект для отслеживания состояния авторизации
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'No user');
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Добавляем эффект для проверки пользователя при монтировании
  useEffect(() => {
    if (currentUser) {
      console.log('Current user from context:', currentUser);
    }
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Обработчики для диалога создания поста
  const handleOpenCreatePostDialog = () => {
    setCreatePostDialogOpen(true);
  };

  const handleCloseCreatePostDialog = () => {
    setCreatePostDialogOpen(false);
    setActiveStep(0);
    setPostData({
      title: '',
      description: '',
      category: 'all',
      difficulty: 'medium',
      duration: '',
      cost: '',
      isPublic: true,
      tags: [],
    });
    setImprovedText(null);
    setFormErrors({});
  };

  const handlePostDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setPostData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!postData.tags.includes(newTag)) {
        setPostData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateStep = () => {
    const errors = {};
    
    if (activeStep === 0) {
      if (!postData.title.trim()) errors.title = 'Название обязательно';
      if (!postData.description.trim()) errors.description = 'Описание обязательно';
      if (!postData.category) {
        errors.category = 'Выберите категорию';
      } else {
        // Проверяем, что категория существует в списке доступных категорий
        const categoryExists = tabs && tabs.some(tab => tab.value === postData.category);
        if (!categoryExists) {
          errors.category = 'Выберите корректную категорию';
          // Устанавливаем категорию по умолчанию
          setPostData(prev => ({
            ...prev,
            category: 'all'
          }));
        }
      }
    } else if (activeStep === 1) {
      if (!postData.duration) errors.duration = 'Укажите продолжительность';
      if (postData.cost && isNaN(parseFloat(postData.cost))) {
        errors.cost = 'Стоимость должна быть числом';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleImproveText = async () => {
    if (!postData.description.trim()) {
      setFormErrors(prev => ({
        ...prev,
        description: 'Необходимо добавить описание для улучшения'
      }));
      return;
    }
    
    // Clear previous errors and success messages
    setProcessingAI(true);
    setSuccessMessage('');
    setFormErrors(prev => ({ ...prev, aiError: '' }));
    
    try {
      // Create a simpler implementation that doesn't rely on the full route generation
      // This is a temporary solution until the AI service is properly implemented
      const improvedDescription = await new Promise((resolve) => {
        // Simulate API call delay
        setTimeout(() => {
          // Simple text improvement logic
          let improved = postData.description;
          
          // Add structure if not present
          if (!improved.includes('\n\n')) {
            const sentences = improved.split('. ');
            if (sentences.length > 2) {
              improved = sentences.slice(0, 2).join('. ') + '.\n\n' + 
                        sentences.slice(2).join('. ');
            }
          }
          
          // Add some flair based on the difficulty
          const difficultyPhrases = {
            easy: 'Этот маршрут идеально подходит для спокойной прогулки.',
            medium: 'Маршрут средней сложности, требующий умеренной физической подготовки.',
            hard: 'Сложный маршрут, требующий хорошей физической подготовки.'
          };
          
          // Add difficulty-specific phrase if not present
          if (postData.difficulty && !improved.includes(difficultyPhrases[postData.difficulty])) {
            improved = difficultyPhrases[postData.difficulty] + '\n\n' + improved;
          }
          
          resolve(improved);
        }, 1000);
      });
      
      setImprovedText(improvedDescription);
      setSuccessMessage('Текст успешно улучшен!');
    } catch (error) {
      console.error('Error improving text:', error);
      setFormErrors(prev => ({
        ...prev,
        aiError: 'Произошла ошибка при улучшении текста. Пожалуйста, попробуйте снова.'
      }));
    } finally {
      setProcessingAI(false);
    }
  };

  const handlePublishPost = async () => {
    try {
      console.log('Publishing post, current user:', currentUser);
      console.log('Auth current user:', auth.currentUser);

      if (!currentUser || !auth.currentUser) {
        console.log('No user detected, redirecting to auth');
        setSnackbar({
          open: true,
          message: 'Необходимо войти в систему для публикации маршрута',
          severity: 'error'
        });
        navigate('/auth');
        return;
      }

      setPublishing(true);
      setError(null);

      // Проверяем наличие обязательных полей
      if (!postData.title || !postData.description || !postData.category) {
        setSnackbar({
          open: true,
          message: 'Пожалуйста, заполните все обязательные поля',
          severity: 'error'
        });
        setPublishing(false);
        return;
      }

      // Подготавливаем данные маршрута
      const routeData = {
        ...postData,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Пользователь',
        userPhotoURL: currentUser.photoURL || null,
        createdAt: new Date(),
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        status: 'active'
      };

      console.log('Publishing route with data:', routeData);

      // Публикуем маршрут
      const routeId = await publishRoute(routeData);

      if (routeId) {
        console.log('Route published successfully with ID:', routeId);
        setSnackbar({
          open: true,
          message: 'Маршрут успешно опубликован!',
          severity: 'success'
        });
        setCreatePostDialogOpen(false);
        setPostData({
          title: '',
          description: '',
          category: '',
          tags: [],
          difficulty: 'medium',
          duration: '',
          distance: '',
          cost: '',
          routePoints: '',
          isPublic: true,
          imageUrl: null
        });
        setActiveStep(0);
        
        // Обновляем список маршрутов
        await getPublicRoutesData();
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при публикации маршрута. Пожалуйста, попробуйте позже.',
        severity: 'error'
      });
    } finally {
      setPublishing(false);
    }
  };

  const publishRoute = async (routeData) => {
    try {
      if (!auth.currentUser) {
        console.error('No auth user in publishRoute');
        throw new Error('Пользователь не авторизован');
      }

      console.log('Creating route document with data:', routeData);

      // Создаем новый документ в коллекции routes
      const docRef = await addDoc(collection(db, 'routes'), {
        ...routeData,
        createdAt: serverTimestamp()
      });

      console.log('Route published successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error in publishRoute:', error);
      throw new Error('Не удалось опубликовать маршрут: ' + error.message);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Рендер содержимого шага создания поста
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 3, bgcolor: '#1e1e1e' }}>
            <TextField
              fullWidth
              label="Название маршрута"
              name="title"
              value={postData.title}
              onChange={handlePostDataChange}
              margin="normal"
              required
              error={Boolean(formErrors.title)}
              helperText={formErrors.title}
              InputLabelProps={{ style: { color: '#bbb' } }}
              InputProps={{ 
                style: { color: '#fff' },
                sx: {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#777',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#90caf9',
                  }
                }
              }}
              FormHelperTextProps={{ style: { color: formErrors.title ? '#f44336' : '#999' } }}
            />
            
            <FormControl 
              fullWidth 
              margin="normal" 
              required 
              error={Boolean(formErrors.category)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#90caf9',
                }
              }}
            >
              <InputLabel style={{ color: '#bbb' }}>Категория</InputLabel>
              <Select
                name="category"
                value={postData.category}
                onChange={handlePostDataChange}
                label="Категория"
                sx={{ color: '#fff' }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#252525',
                      color: '#fff',
                      '& .MuiMenuItem-root': {
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#333'
                        },
                        '&.Mui-selected': {
                          bgcolor: '#333',
                          '&:hover': {
                            bgcolor: '#444'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {tabs && tabs.map((tab) => (
                  tab ? <MenuItem key={tab.value} value={tab.value}>{tab.label}</MenuItem> : null
                ))}
              </Select>
              {formErrors.category ? (
                <FormHelperText style={{ color: '#f44336' }}>{formErrors.category}</FormHelperText>
              ) : (
                <FormHelperText style={{ color: '#999' }}>
                  Маршрут будет отображаться в выбранной категории
                </FormHelperText>
              )}
            </FormControl>
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>
                Описание маршрута
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={postData.description}
                onChange={handlePostDataChange}
                multiline
                rows={6}
                placeholder="Опишите ваш маршрут, что интересного можно увидеть, какие места посетить..."
                error={Boolean(formErrors.description)}
                helperText={formErrors.description}
                InputProps={{ 
                  style: { color: '#fff' },
                  sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#90caf9',
                    }
                  }
                }}
                FormHelperTextProps={{ style: { color: formErrors.description ? '#f44336' : '#999' } }}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="#bbb" gutterBottom>
                Теги (нажмите Enter после каждого тега)
              </Typography>
              <TextField
                fullWidth
                placeholder="Добавьте теги..."
                onKeyDown={handleTagInput}
                margin="normal"
                InputProps={{ 
                  style: { color: '#fff' },
                  sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#90caf9',
                    }
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {postData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{
                      color: '#90caf9',
                      borderColor: '#90caf9',
                      '& .MuiChip-deleteIcon': {
                        color: '#90caf9',
                        '&:hover': {
                          color: '#f44336'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ p: 3, bgcolor: '#1e1e1e' }}>
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#90caf9',
                }
              }}
            >
              <InputLabel style={{ color: '#bbb' }}>Сложность</InputLabel>
              <Select
                name="difficulty"
                value={postData.difficulty}
                onChange={handlePostDataChange}
                label="Сложность"
                sx={{ color: '#fff' }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#252525',
                      color: '#fff',
                      '& .MuiMenuItem-root': {
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#333'
                        },
                        '&.Mui-selected': {
                          bgcolor: '#333',
                          '&:hover': {
                            bgcolor: '#444'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="easy">Легкий</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="hard">Сложный</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Продолжительность (часов)"
              name="duration"
              type="number"
              value={postData.duration}
              onChange={handlePostDataChange}
              margin="normal"
              required
              inputProps={{ min: 0.5, step: 0.5 }}
              error={Boolean(formErrors.duration)}
              helperText={formErrors.duration || "Укажите примерную продолжительность маршрута в часах"}
              InputLabelProps={{ style: { color: '#bbb' } }}
              InputProps={{ 
                style: { color: '#fff' },
                sx: {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#777',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#90caf9',
                  }
                }
              }}
              FormHelperTextProps={{ style: { color: formErrors.duration ? '#f44336' : '#999' } }}
            />
            
            <TextField
              fullWidth
              label="Расстояние (км)"
              name="distance"
              type="number"
              value={postData.distance}
              onChange={handlePostDataChange}
              margin="normal"
              inputProps={{ min: 0.1, step: 0.1 }}
              error={Boolean(formErrors.distance)}
              helperText={formErrors.distance || "Укажите примерное расстояние маршрута в километрах"}
              InputLabelProps={{ style: { color: '#bbb' } }}
              InputProps={{ 
                style: { color: '#fff' },
                sx: {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#777',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#90caf9',
                  }
                }
              }}
              FormHelperTextProps={{ style: { color: formErrors.distance ? '#f44336' : '#999' } }}
            />
            
            <TextField
              fullWidth
              label="Стоимость (₽)"
              name="cost"
              type="number"
              value={postData.cost}
              onChange={handlePostDataChange}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ color: '#bbb' }}>₽</InputAdornment>,
                style: { color: '#fff' },
                sx: {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#777',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#90caf9',
                  }
                }
              }}
              inputProps={{ min: 0 }}
              error={Boolean(formErrors.cost)}
              helperText={formErrors.cost || "Оставьте пустым, если маршрут бесплатный"}
              InputLabelProps={{ style: { color: '#bbb' } }}
              FormHelperTextProps={{ style: { color: formErrors.cost ? '#f44336' : '#999' } }}
            />
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1 }} /> Точки маршрута
              </Typography>
              <Typography variant="body2" color="#bbb" sx={{ mb: 2 }}>
                Укажите основные точки вашего маршрута. В каждую строку вводите только один адрес.
              </Typography>
              <TextField
                fullWidth
                name="routePoints"
                value={postData.routePoints || ''}
                onChange={handlePostDataChange}
                multiline
                rows={4}
                placeholder="Например:
Невский проспект, 1
Дворцовая площадь
Исаакиевский собор"
                error={Boolean(formErrors.routePoints)}
                helperText={formErrors.routePoints}
                InputProps={{ 
                  style: { color: '#fff' },
                  sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#90caf9',
                    }
                  }
                }}
                FormHelperTextProps={{ style: { color: formErrors.routePoints ? '#f44336' : '#999' } }}
              />
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>
                  Улучшить описание с помощью ИИ
                </Typography>
                <Typography variant="body2" color="#bbb">
                  Наша нейросеть поможет сделать описание более структурированным и информативным
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoFixHighIcon />}
                onClick={handleImproveText}
                disabled={processingAI || !postData.description.trim()}
                sx={{ 
                  bgcolor: '#7e57c2',
                  '&:hover': {
                    bgcolor: '#9575cd'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#424242',
                    color: '#999'
                  }
                }}
              >
                {processingAI ? <CircularProgress size={24} /> : 'Улучшить текст'}
              </Button>
            </Box>
            
            {successMessage && (
              <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
                {successMessage}
              </Typography>
            )}
            
            {formErrors.aiError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {formErrors.aiError}
              </Typography>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={postData.isPublic}
                  onChange={handlePostDataChange}
                  name="isPublic"
                  color="primary"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#90caf9',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#90caf9',
                    },
                  }}
                />
              }
              label="Сделать маршрут публичным"
              sx={{ mt: 2, color: '#fff' }}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ p: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 2 }}>
              Предпросмотр маршрута
            </Typography>
            
            {improvedText ? (
              <Box className="formatted-text-container">
                {formatGeneratedText(improvedText)}
              </Box>
            ) : (
              <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#252525', color: '#fff' }}>
                <Typography variant="h5" gutterBottom>
                  {postData.title}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={(tabs && tabs.find(tab => tab.value === postData.category))?.label || 'Категория'} 
                    color="primary" 
                    size="small" 
                    sx={{ bgcolor: '#90caf9', color: '#121212' }}
                  />
                  <Chip 
                    label={
                      postData.difficulty === 'easy' ? 'Легкий' :
                      postData.difficulty === 'medium' ? 'Средний' :
                      'Сложный'
                    } 
                    color="secondary" 
                    size="small" 
                    sx={{ 
                      bgcolor: 
                        postData.difficulty === 'easy' ? '#4caf50' :
                        postData.difficulty === 'medium' ? '#ff9800' :
                        '#f44336',
                      color: '#fff'
                    }}
                  />
                  <Chip 
                    icon={<LocationOn fontSize="small" sx={{ color: '#fff' }} />}
                    label={`${postData.duration} ч.`} 
                    size="small" 
                    sx={{ bgcolor: '#333', color: '#fff' }}
                  />
                  {postData.cost && (
                    <Chip 
                      label={`${postData.cost} ₽`} 
                      size="small" 
                      sx={{ bgcolor: '#333', color: '#fff' }}
                    />
                  )}
                </Box>
                
                <Typography variant="body1" paragraph>
                  {postData.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {postData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ color: '#90caf9', borderColor: '#555' }}
                    />
                  ))}
                </Box>
              </Paper>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="#bbb" paragraph>
                Проверьте информацию перед публикацией. После публикации маршрут будет доступен в выбранной категории.
              </Typography>
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const PostCard = ({ route, updateRouteInList }) => {
    const [liked, setLiked] = useState(false);
    const [inFavorites, setInFavorites] = useState(false);
    const [likesCount, setLikesCount] = useState(route.likesCount || 0);
    const [processingLike, setProcessingLike] = useState(null);
    const [processingFavorite, setProcessingFavorite] = useState(null);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(route.commentsCount || 0);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [processingSubscribe, setProcessingSubscribe] = useState(false);
    
    // Add missing state variables for comments
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsCount, setCommentsCount] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    
    // Используем константу CONTENT_TABS
    const localTabs = tabs;

    // Получаем название категории для отображения
    const getCategoryLabel = (categoryValue) => {
      const category = localTabs && localTabs.find(tab => tab.value === categoryValue);
      return category ? category.label : 'Категория не указана';
    };
    
    // Обработчик клика по категории
    const handleCategoryClick = (e, categoryValue) => {
      e.stopPropagation();
      handleTabChange(null, categoryValue);
    };
    
    // Функция для подписки на гида
    const handleSubscribeToGuide = async (guideId) => {
      if (!currentUser) {
        setSnackbar({
          open: true,
          message: 'Войдите в систему, чтобы подписаться на гида',
          severity: 'info'
        });
        
        // Перенаправляем на страницу авторизации через 1.5 секунды
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
        return;
      }
      
      if (processingSubscribe) return;
      
      try {
        setProcessingSubscribe(true);
        
        // Оптимистичное обновление UI
        setIsSubscribed(!isSubscribed);
        
        // Здесь будет вызов API для подписки/отписки
        // Пока это заглушка, которая имитирует успешную операцию
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // В реальном приложении здесь будет код для подписки на гида
        // await subscribeToGuide(guideId);
        
        setSnackbar({
          open: true,
          message: isSubscribed 
            ? 'Вы отписались от обновлений гида' 
            : 'Вы подписались на обновления гида',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error subscribing to guide:', error);
        
        // Возвращаем предыдущее состояние
        setIsSubscribed(!isSubscribed);
        
        setSnackbar({
          open: true,
          message: 'Не удалось изменить подписку. Пожалуйста, попробуйте позже.',
          severity: 'error'
        });
      } finally {
        setProcessingSubscribe(false);
      }
    };

    // Проверяем, лайкнул ли пользователь маршрут и добавил ли в избранное
    useEffect(() => {
      let isMounted = true;
      
      const checkUserInteractions = async () => {
        if (currentUser && currentUser.uid) {
          try {
            console.log(`Проверка взаимодействий пользователя с маршрутом ${route.id}`);
            
            // Проверяем лайки и избранное по отдельности для лучшей обработки ошибок
            let userLiked = false;
            let userFavorited = false;
            let userSubscribed = false;
            
            try {
              userLiked = await hasUserLikedRoute(route.id);
              console.log(`Маршрут ${route.id} лайкнут пользователем: ${userLiked}`);
            } catch (likeError) {
              console.error('Ошибка при проверке лайка:', likeError);
            }
            
            try {
              userFavorited = await isRouteInFavorites(route.id);
              console.log(`Маршрут ${route.id} в избранном: ${userFavorited}`);
            } catch (favoriteError) {
              console.error('Ошибка при проверке избранного:', favoriteError);
            }
            
            // Проверяем подписку на гида, если маршрут создан гидом
            if (route.userRole === 'guide') {
              try {
                // Здесь будет вызов API для проверки подписки
                // В реальном приложении: userSubscribed = await isSubscribedToGuide(route.userId);
                // Пока используем заглушку
                userSubscribed = false;
                console.log(`Подписка на гида ${route.userId}: ${userSubscribed}`);
              } catch (subscribeError) {
                console.error('Ошибка при проверке подписки на гида:', subscribeError);
              }
            }
            
            if (!isMounted) {
              console.log('Компонент размонтирован, прерываем обновление состояния');
              return;
            }
            
            // Обновляем состояние только если компонент все еще смонтирован
            console.log(`Обновляем состояние лайка: ${userLiked}`);
            setLiked(userLiked);
            
            console.log(`Обновляем состояние избранного: ${userFavorited}`);
            setInFavorites(userFavorited);
            
            // Обновляем состояние подписки
            if (route.userRole === 'guide') {
              console.log(`Обновляем состояние подписки: ${userSubscribed}`);
              setIsSubscribed(userSubscribed);
            }
            
            // Обновляем счетчик лайков, если он доступен
            if (route.likesCount !== undefined) {
              console.log(`Обновляем счетчик лайков: ${route.likesCount}`);
              setLikesCount(route.likesCount);
            } else {
              // Если счетчик не доступен, получаем его из сервиса
              try {
                const count = await getRouteLikesCount(route.id);
                console.log(`Получен счетчик лайков из сервиса: ${count}`);
                setLikesCount(count);
              } catch (countError) {
                console.error('Ошибка при получении счетчика лайков:', countError);
              }
            }
          } catch (error) {
            console.error('Error checking user interactions:', error);
            
            if (!isMounted) return;
            
            // Показываем уведомление об ошибке
            setSnackbar({
              open: true,
              message: 'Не удалось проверить ваши взаимодействия с маршрутом',
              severity: 'error'
            });
          }
        } else {
          if (!isMounted) return;
          
          // Если пользователь не авторизован, сбрасываем состояния
          setLiked(false);
          setInFavorites(false);
        }
      };

      if (authChecked && route && route.id) {
        checkUserInteractions();
      }
      
      return () => {
        isMounted = false;
      };
    }, [currentUser, route.id, authChecked]);

    // Логирование начальных значений
    console.log(`Инициализация карточки маршрута ${route.id}:`, {
      initialLikesCount: route.likesCount,
      stateLikesCount: likesCount
    });

    // Обновляем likesCount при изменении route.likesCount
    useEffect(() => {
      console.log(`Обновление likesCount для маршрута ${route.id}:`, {
        newLikesCount: route.likesCount,
        currentStateLikesCount: likesCount
      });
      
      if (route.likesCount !== undefined && route.likesCount !== likesCount) {
        console.log(`Обновляем likesCount с ${likesCount} на ${route.likesCount}`);
        setLikesCount(route.likesCount);
      }
    }, [route.likesCount, likesCount]);

    // Логируем изменения likesCount
    useEffect(() => {
      console.log(`Изменение likesCount для маршрута ${route.id}: ${likesCount}`);
    }, [likesCount, route.id]);

    // Логируем изменения route
    useEffect(() => {
      console.log(`Изменение данных маршрута ${route.id}:`, {
        likesCount: route.likesCount,
        commentsCount: route.commentsCount
      });
    }, [route, route.id]);

    // Вспомогательная функция для обновления состояния лайка
    const updateLikeState = (isLiked, count) => {
      console.log(`Обновление состояния лайка: isLiked=${isLiked}, count=${count}`);
      setLiked(isLiked);
      setLikesCount(count);
    };

    // Функция для переключения лайка
    const handleLikeToggle = async (route) => {
      if (!currentUser) {
        setSnackbar({
          open: true,
          message: 'Войдите в систему, чтобы оценивать маршруты',
          severity: 'info'
        });
        setTimeout(() => navigate('/auth'), 1500);
        return;
      }

      if (processingLike === route.id) return;

      try {
        setProcessingLike(route.id);
        
        const newLikeState = !liked;
        const currentCount = likesCount;
        const newCount = newLikeState ? currentCount + 1 : Math.max(0, currentCount - 1);

        if (newLikeState) {
          await likeRoute(route.id);
        } else {
          await unlikeRoute(route.id);
        }

        setLiked(newLikeState);
        setLikesCount(newCount);
        updateRouteInList(route.id, newCount);

        setSnackbar({
          open: true,
          message: newLikeState ? 'Маршрут добавлен в понравившиеся' : 'Маршрут удален из понравившихся',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error toggling like:', error);
        setSnackbar({
          open: true,
          message: 'Не удалось обновить статус лайка',
          severity: 'error'
        });
      } finally {
        setProcessingLike(null);
      }
    };

    // Обработчик открытия диалога комментариев
    const handleRouteCommentClick = () => {
      handleOpenCommentDialog(route);
    };

    // Функция для переключения избранного
    const handleFavoriteToggle = async (route) => {
      // Проверяем, авторизован ли пользователь
      if (!currentUser) {
        setSnackbar({
          open: true,
          message: 'Войдите в систему, чтобы добавлять маршруты в избранное',
          severity: 'info'
        });
        
        // Перенаправляем на страницу авторизации через 1.5 секунды
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
        return;
      }

      try {
        // Устанавливаем состояние загрузки
        setProcessingFavorite(route.id);
        
        // Оптимистичное обновление UI для мгновенной реакции
        const newInFavorites = !inFavorites;
        setInFavorites(newInFavorites);
        
        console.log(`Переключение избранного для маршрута ${route.id}. Новое состояние:`, newInFavorites);
        
        // Выполняем фактическое действие на сервере
        if (newInFavorites) {
          try {
            await addRouteToFavorites(route.id);
            console.log('Маршрут успешно добавлен в избранное');
            
            // Показываем уведомление об успешном действии
            setSnackbar({
              open: true,
              message: 'Маршрут добавлен в избранное',
              severity: 'success'
            });
          } catch (addError) {
            console.error('Error adding to favorites:', addError);
            
            // Если ошибка связана с тем, что маршрут уже в избранном, игнорируем её
            if (addError.message === 'Этот маршрут уже в избранном') {
              console.log('Маршрут уже был в избранном');
            } else {
              // Для других ошибок возвращаем предыдущее состояние и показываем уведомление
              setInFavorites(false);
              setSnackbar({
                open: true,
                message: addError.message || 'Ошибка при добавлении в избранное',
                severity: 'error'
              });
            }
          }
        } else {
          try {
            await removeRouteFromFavorites(route.id);
            console.log('Маршрут успешно удален из избранного');
            
            // Показываем уведомление об успешном действии
            setSnackbar({
              open: true,
              message: 'Маршрут удален из избранного',
              severity: 'success'
            });
          } catch (removeError) {
            console.error('Error removing from favorites:', removeError);
            
            // Если ошибка связана с тем, что маршрута нет в избранном, игнорируем её
            if (removeError.message === 'Этого маршрута нет в избранном') {
              console.log('Маршрута уже не было в избранном');
            } else {
              // Для других ошибок возвращаем предыдущее состояние и показываем уведомление
              setInFavorites(true);
              setSnackbar({
                open: true,
                message: removeError.message || 'Ошибка при удалении из избранного',
                severity: 'error'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        
        // В случае общей ошибки проверяем актуальное состояние
        try {
          const actualFavoriteStatus = await isRouteInFavorites(route.id);
          setInFavorites(actualFavoriteStatus);
          
          setSnackbar({
            open: true,
            message: 'Не удалось обновить статус избранного. Пожалуйста, попробуйте еще раз.',
            severity: 'error'
          });
        } catch (checkError) {
          console.error('Error checking favorite status:', checkError);
          
          // В случае ошибки при проверке статуса, показываем общее уведомление об ошибке
          setSnackbar({
            open: true,
            message: 'Произошла ошибка. Пожалуйста, обновите страницу и попробуйте снова.',
            severity: 'error'
          });
        }
      } finally {
        // Сбрасываем состояние загрузки
        setProcessingFavorite(null);
      }
    };

    // Открытие диалога комментариев
    const handleOpenCommentDialog = async (route) => {
      try {
        setLoadingComments(true);
        setSelectedRoute(route);
        
        if (!route || !route.id) {
          throw new Error('Маршрут не имеет ID');
        }
        
        const fetchedComments = await getRouteComments(route.id);
        
        // Проверяем структуру каждого комментария
        const validComments = fetchedComments.map(comment => {
          // Убедимся, что у комментария есть все необходимые поля
          if (!comment.text) {
            console.warn('Комментарий без текста');
          }
          if (!comment.userName) {
            console.warn('Комментарий без имени пользователя');
          }
          return comment;
        });
        
        setComments(validComments || []);
        setCommentsCount(validComments.length);
        setCommentDialogOpen(true);
      } catch (error) {
        console.error('Error opening comment dialog:', error);
        // Даже при ошибке загрузки комментариев, открываем диалог
        // чтобы пользователь мог добавить комментарий
        setComments([]);
        setCommentsCount(0);
        setCommentDialogOpen(true);
      } finally {
        setLoadingComments(false);
      }
    };

    // Закрытие диалога комментариев
    const handleCloseCommentDialog = () => {
      setCommentDialogOpen(false);
      
      // Очищаем поле ввода нового комментария при закрытии диалога
      if (newComment) {
        setNewComment('');
      }
      
      // Сбрасываем выбранный маршрут через небольшую задержку
      // чтобы избежать мерцания при закрытии диалога
      setTimeout(() => {
        setSelectedRoute(null);
        setComments([]);
        setCommentsCount(0);
      }, 300);
    };

    // Отправка комментария
    const handleSubmitComment = async () => {
      if (!newComment.trim()) {
        setSnackbar({
          open: true,
          message: 'Комментарий не может быть пустым',
          severity: 'warning'
        });
        return;
      }

      if (!currentUser) {
        // Показываем уведомление о необходимости авторизации
        setSnackbar({
          open: true,
          message: 'Войдите в систему, чтобы оставлять комментарии',
          severity: 'info'
        });
        
        // Перенаправляем на страницу авторизации через 1.5 секунды
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
        return;
      }

      try {
        setSubmittingComment(true);
        
        // Сохраняем текст комментария перед очисткой поля ввода
        const commentText = newComment.trim();
        
        // Очищаем поле ввода сразу для лучшего UX
        setNewComment('');
        
        // Проверяем, что пользователь авторизован
        if (!currentUser || !currentUser.uid) {
          throw new Error('Пользователь не авторизован');
        }
        
        // Проверяем, что выбран маршрут
        if (!selectedRoute || !selectedRoute.id) {
          throw new Error('Маршрут не выбран');
        }
        
        // Добавляем комментарий
        const newCommentData = await addComment(selectedRoute.id, commentText);
        
        // Добавляем новый комментарий в начало списка (так как сортировка по убыванию даты)
        const updatedComments = [newCommentData, ...comments];
        setComments(updatedComments);
        
        // Обновляем счетчик комментариев
        setCommentsCount(updatedComments.length);
        
        // Обновляем локальный счетчик комментариев для текущего маршрута
        setLocalCommentsCount(prevCount => prevCount + 1);
        
        // Обновляем счетчик комментариев в маршруте в общем списке маршрутов
        setRoutes(prevRoutes => prevRoutes.map(r => {
          if (r.id === selectedRoute.id) {
            return {
              ...r,
              commentsCount: (r.commentsCount || 0) + 1
            };
          }
          return r;
        }));
        
        // Показываем уведомление об успешной отправке комментария
        setSnackbar({
          open: true,
          message: 'Комментарий добавлен',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error submitting comment:', error);
        // Показываем уведомление об ошибке
        setSnackbar({
          open: true,
          message: error.message || 'Ошибка при отправке комментария',
          severity: 'error'
        });
        
        // Пытаемся обновить список комментариев в случае ошибки
        try {
          if (selectedRoute && selectedRoute.id) {
            console.log('Попытка обновить комментарии после ошибки для маршрута:', selectedRoute.id);
            const fetchedComments = await getRouteComments(selectedRoute.id);
            console.log('Полученные комментарии после ошибки:', fetchedComments);
            setComments(fetchedComments || []);
            setCommentsCount(fetchedComments.length);
          } else {
            console.warn('Невозможно обновить комментарии: маршрут не выбран');
          }
        } catch (fetchError) {
          console.error('Error fetching comments after submit error:', fetchError);
        }
      } finally {
        setSubmittingComment(false);
      }
    };

    // Переход на страницу детального просмотра маршрута
    const handleRouteClick = () => {
      navigate(`/routes/${route.id}`);
    };

    return (
      <Card 
        elevation={3} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          },
          bgcolor: '#1e1e1e',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Заголовок карточки с автором */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={route.userPhotoURL} 
              alt={route.userName}
              className={route.userRole === 'guide' ? 'guide-avatar' : ''}
              sx={{ 
                width: 36, 
                height: 36,
                border: route.userRole === 'guide' ? '2px solid #4caf50' : '2px solid #f0f2ff',
                mr: 1.5,
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/profile/${route.userId}`)}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => navigate(`/profile/${route.userId}`)}
                >
                  {route.userName}
                </Typography>
                {route.userRole === 'guide' && (
                  <Chip
                    label="Гид"
                    size="small"
                    color="success"
                    icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      '& .MuiChip-icon': {
                        color: '#fff'
                      }
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="textSecondary">
                {route.userRole === 'guide' ? 'Профессиональный гид' : 'Пользователь'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {route.userRole === 'guide' && (
              <Button
                variant={isSubscribed ? "contained" : "outlined"}
                size="small"
                color={isSubscribed ? "success" : "primary"}
                sx={{ 
                  fontSize: '0.7rem', 
                  py: 0.5, 
                  borderRadius: 4,
                  textTransform: 'none',
                  minWidth: '100px'
                }}
                onClick={() => handleSubscribeToGuide(route.userId)}
                disabled={processingSubscribe}
                startIcon={processingSubscribe ? <CircularProgress size={14} color="inherit" /> : null}
              >
                {isSubscribed ? 'Подписан' : 'Подписаться'}
              </Button>
            )}
            {route.rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255, 255, 255, 0.08)', px: 1, py: 0.5, borderRadius: 1 }}>
                <Star sx={{ color: '#FFD700', mr: 0.5, fontSize: 16 }} />
                <Typography variant="body2" fontWeight="bold">
                  {route.rating}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Post Title with Guide Indicator */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {route.title}
            </Typography>
            {route.userRole === 'guide' && (
              <Chip
                label="Маршрут от гида"
                size="small"
                color="success"
                variant="outlined"
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  borderColor: '#4caf50',
                  color: '#4caf50'
                }}
              />
            )}
          </Box>
        </Box>
        
        {/* Изображение маршрута */}
        <CardMedia
          component="img"
          sx={{ 
            height: 180,
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          image={route.imageUrl || 'https://placehold.co/400x200/1e1e1e/ffffff?text=Маршрут'}
          alt={route.title}
          onClick={handleRouteClick}
        />
        
        {/* Метка сложности */}
        {route.difficulty && (
          <Box sx={{ position: 'relative', mt: -4, mb: 2, display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
            <Chip
              label={
                route.difficulty === 'easy' ? 'Легкий' :
                route.difficulty === 'medium' ? 'Средний' :
                route.difficulty === 'hard' ? 'Сложный' : 
                route.difficulty
              }
              size="small"
              sx={{
                backgroundColor: 
                  route.difficulty === 'easy' ? 'rgba(76, 175, 80, 0.9)' :
                  route.difficulty === 'medium' ? 'rgba(255, 152, 0, 0.9)' :
                  route.difficulty === 'hard' ? 'rgba(244, 67, 54, 0.9)' : 
                  'rgba(97, 97, 97, 0.9)',
                color: 'white',
                fontWeight: 'bold',
                backdropFilter: 'blur(4px)',
                zIndex: 1,
                fontSize: '0.7rem'
              }}
            />
          </Box>
        )}
        
        <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
          {/* Теги и категория */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Tooltip title="Нажмите, чтобы увидеть все маршруты в этой категории" placement="top">
              <Chip
                label={getCategoryLabel(route.category)}
                size="small"
                color="primary"
                onClick={(e) => handleCategoryClick(e, route.category)}
                sx={{ 
                  bgcolor: '#90caf9', 
                  color: '#121212',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#64b5f6',
                  },
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            </Tooltip>
            {route.tags && route.tags.slice(0, 2).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ddd',
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            ))}
            {route.tags && route.tags.length > 2 && (
              <Chip
                label={`+${route.tags.length - 2}`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ddd',
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            )}
          </Box>
          
          {/* Описание маршрута */}
          <Typography 
            variant="body2" 
            color="textSecondary" 
            onClick={handleRouteClick}
            sx={{ 
              cursor: 'pointer',
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4,
              fontSize: '0.85rem'
            }}
          >
            {route.description}
          </Typography>
          
          {/* Детали маршрута */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {(route.distance || route.duration) && (
              <Chip
                icon={<LocationOn fontSize="small" sx={{ fontSize: '0.9rem' }} />}
                label={`${route.distance || '0'} км • ${route.duration || '0'} ч.`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.08)', 
                  color: '#ddd',
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            )}
            {route.cost && (
              <Chip
                label={`${route.cost} ₽`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.08)', 
                  color: '#ddd',
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            )}
          </Box>
        </CardContent>
        
        <Divider sx={{ mx: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Действия с маршрутом */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>
              <IconButton 
                onClick={() => handleLikeToggle(route)}
                disabled={processingLike === route.id}
                color={liked ? 'error' : 'default'}
                className="icon-button"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  },
                  color: liked ? '#f44336' : '#aaa'
                }}
              >
                {processingLike === route.id ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  liked ? <FavoriteIcon sx={{ color: '#f44336' }} /> : <FavoriteBorderIcon />
                )}
              </IconButton>
            </span>
            <Typography variant="body2" fontWeight={liked ? 'bold' : 'normal'} sx={{ mr: 1.5, fontSize: '0.8rem' }}>
              {likesCount}
            </Typography>
          
            <span>
              <IconButton 
                onClick={handleRouteCommentClick}
                size="small"
                sx={{ 
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <CommentIcon />
              </IconButton>
            </span>
            <Typography variant="body2" sx={{ mr: 1.5, fontSize: '0.8rem' }}>
              {localCommentsCount}
            </Typography>
            
            <span>
              <IconButton 
                onClick={() => handleFavoriteToggle(route)}
                disabled={processingFavorite === route.id}
                color={inFavorites ? 'primary' : 'default'}
                className="icon-button"
              >
                {processingFavorite === route.id ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  inFavorites ? <BookmarkIcon /> : <BookmarkBorderIcon />
                )}
              </IconButton>
            </span>
          </Box>
          
          <Button
            variant="outlined"
            size="small"
            onClick={handleRouteClick}
            sx={{
              borderColor: '#90caf9',
              color: '#90caf9',
              '&:hover': {
                borderColor: '#64b5f6',
                backgroundColor: 'rgba(144, 202, 249, 0.08)'
              },
              fontSize: '0.75rem',
              py: 0.5
            }}
          >
            Подробнее
          </Button>
        </Box>

        {/* Диалог комментариев */}
        <Dialog 
          open={commentDialogOpen} 
          onClose={handleCloseCommentDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#1e1e1e',
              color: '#fff'
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#252525', py: 2, color: '#fff' }}>
            <Typography variant="h6">Комментарии к маршруту</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseCommentDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'grey.500',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, bgcolor: '#1e1e1e' }}>
            {loadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <Box key={comment.id} sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {/* Отладочная информация */}
                      {process.env.NODE_ENV === 'development' && (
                        <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.2)', fontSize: '10px', fontFamily: 'monospace' }}>
                          ID: {comment.id}<br/>
                          User: {comment.userId}<br/>
                          CreatedAt: {JSON.stringify(comment.createdAt)}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={comment.userPhotoURL} 
                          alt={comment.userName} 
                          sx={{ mr: 1, width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" color="#fff">{comment.userName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {comment.createdAt 
                              ? (comment.createdAt.toDate 
                                 ? new Date(comment.createdAt.toDate()).toLocaleString() 
                                 : new Date(comment.createdAt).toLocaleString())
                              : 'Только что'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ pl: 5, color: '#ddd' }}>
                        {comment.text || <em style={{ color: '#888' }}>Пустой комментарий</em>}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                      Пока нет комментариев
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Будьте первым, кто оставит комментарий к этому маршруту!
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          {currentUser ? (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', bgcolor: '#252525' }}>
              <Avatar 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'User'} 
                sx={{ mr: 1, mt: 1 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                sx={{ 
                  mr: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#333',
                    borderRadius: 2,
                    color: '#fff',
                    '& fieldset': {
                      borderColor: '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#90caf9',
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#aaa',
                    opacity: 1
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                sx={{ 
                  mt: 1,
                  borderRadius: 2,
                  px: 2,
                  bgcolor: '#90caf9',
                  color: '#121212',
                  fontWeight: 'bold',
                  minWidth: '120px',
                  height: '40px',
                  '&:hover': {
                    bgcolor: '#64b5f6'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#333',
                    color: '#777'
                  }
                }}
              >
                {submittingComment ? (
                  <CircularProgress size={24} sx={{ color: '#121212' }} />
                ) : (
                  'Отправить'
                )}
              </Button>
            </Box>
          ) : (
            <DialogActions sx={{ bgcolor: '#252525', py: 2 }}>
              <Button 
                onClick={() => {
                  setCommentDialogOpen(false);
                  setTimeout(() => navigate('/auth'), 300);
                }} 
                color="primary"
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  bgcolor: '#90caf9',
                  color: '#121212',
                  '&:hover': {
                    bgcolor: '#64b5f6'
                  }
                }}
              >
                Войдите, чтобы оставить комментарий
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Card>
    );
  };

  return (
    <Box className="community-container">
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Верхняя часть: заголовок слева, категории справа */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            mb: 4, 
            alignItems: { xs: 'center', md: 'flex-start' },
            justifyContent: 'space-between'
          }}>
            {/* Заголовок и кнопка создания маршрута (слева) */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'left' }, 
              mb: { xs: 4, md: 0 },
              maxWidth: { md: '400px' }
            }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Сообщество
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                Откройте для себя уникальные маршруты и места от местных жителей и профессиональных гидов
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleOpenCreatePostDialog}
                sx={{ 
                  mt: 1,
                  px: 3,
                  py: 1,
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(144, 202, 249, 0.3)'
                }}
                startIcon={<AddIcon />}
              >
                Создать маршрут
              </Button>
            </Box>
          </Box>

          {/* Категории (сверху по центру) */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Tabs 
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  bgcolor: '#252525',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#90caf9',
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  },
                  '& .MuiTab-root': {
                    fontWeight: 'bold',
                    py: 2,
                    minWidth: 100
                  }
                }}
              >
                {tabs && tabs.map((tab, index) => (
                  tab ? <Tab key={tab.value} value={tab.value} label={tab.label} /> : null
                ))}
              </Tabs>
            </Paper>
          </Box>

          {/* Контент под категориями */}
          <Box sx={{ width: '100%' }}>
            {loading && routes.length === 0 ? (
              <Box className="loading-container" sx={{ display: 'flex', justifyContent: 'center', my: 8, flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  Загружаем маршруты...
                </Typography>
              </Box>
            ) : error ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#1e1e1e', color: '#fff', mt: 3 }}>
                <Typography color="error" variant="h6" sx={{ mb: 2 }}>
                  {error}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Пожалуйста, попробуйте обновить страницу или вернитесь позже.
                </Typography>
              </Paper>
            ) : routes.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" sx={{ mb: 4, color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  {activeTab === 'all' 
                    ? 'Все маршруты' 
                    : `Маршруты в категории "${tabs && tabs.find(tab => tab.value === activeTab)?.label || 'Неизвестная категория'}"`}
                </Typography>
                
                {/* Сетка маршрутов (по 3 в ряд) */}
                <Grid container spacing={3}>
                  {routes.map((route) => (
                    <Grid item xs={12} sm={6} md={4} key={route.id}>
                      <PostCard route={route} updateRouteInList={updateRouteInList} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: '#1e1e1e', color: '#fff', mt: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  {activeTab === 'all' 
                    ? 'Пока нет маршрутов' 
                    : `В категории "${tabs && tabs.find(tab => tab.value === activeTab)?.label || 'Неизвестная категория'}" пока нет маршрутов`}
                </Typography>
                <Typography variant="body1" sx={{ my: 3, color: '#bbb', maxWidth: '500px', mx: 'auto' }}>
                  {activeTab === 'all' 
                    ? 'Будьте первым, кто создаст маршрут и поделится им с сообществом!' 
                    : 'Вы можете быть первым, кто создаст маршрут в этой категории!'}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleOpenCreatePostDialog}
                  sx={{ 
                    mt: 2,
                    bgcolor: '#90caf9',
                    color: '#121212',
                    '&:hover': {
                      bgcolor: '#64b5f6'
                    },
                    px: 3,
                    py: 1,
                    borderRadius: '50px',
                    fontWeight: 'bold'
                  }}
                  startIcon={<AddIcon />}
                >
                  Создать маршрут
                </Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>

      {/* Floating Action Button для создания поста */}
      <Tooltip title="Создать маршрут" placement="left">
        <Fab 
          color="primary" 
          aria-label="add" 
          onClick={handleOpenCreatePostDialog}
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              transform: 'scale(1.05)'
            },
            transition: 'transform 0.2s ease',
            bgcolor: '#90caf9',
            color: '#121212',
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Add Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Диалог создания маршрута */}
      <Dialog
        open={createPostDialogOpen}
        onClose={handleCloseCreatePostDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: '#1e1e1e',
            color: '#fff',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#252525', py: 2, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Создание маршрута</Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseCreatePostDialog}
            sx={{
              color: 'grey.500',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#1e1e1e' }}>
          <Box sx={{ width: '100%', bgcolor: '#252525', px: 3, py: 2 }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': {
                  color: '#bbb',
                  '&.Mui-active': {
                    color: '#90caf9'
                  },
                  '&.Mui-completed': {
                    color: '#4caf50'
                  }
                },
                '& .MuiStepIcon-root': {
                  color: '#555',
                  '&.Mui-active': {
                    color: '#90caf9'
                  },
                  '&.Mui-completed': {
                    color: '#4caf50'
                  }
                }
              }}
            >
              {createPostSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          {renderStepContent()}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#252525', p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleCloseCreatePostDialog}
            sx={{ 
              color: '#bbb',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff'
              }
            }}
          >
            Отмена
          </Button>
          <Box>
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                sx={{ 
                  mr: 1,
                  color: '#bbb',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff'
                  }
                }}
              >
                Назад
              </Button>
            )}
            {activeStep < createPostSteps.length - 1 ? (
              <Button 
                variant="contained" 
                onClick={handleNext}
                sx={{ 
                  bgcolor: '#90caf9',
                  color: '#121212',
                  '&:hover': {
                    bgcolor: '#64b5f6'
                  }
                }}
              >
                Далее
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handlePublishPost}
                disabled={processingAI}
                sx={{ 
                  bgcolor: '#4caf50',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#388e3c'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#333',
                    color: '#777'
                  }
                }}
              >
                {processingAI ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Опубликовать'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Community;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Paper, 
  CircularProgress, 
  Alert,
  IconButton,
  FormHelperText
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { savePlace, updatePlace, getPlaceById, PLACE_TYPES } from '../../services/placesService';

const PlaceForm = () => {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(placeId);
  
  // Get the type from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const typeFromUrl = queryParams.get('type');
  
  console.log('Тип из URL:', typeFromUrl);
  
  // Проверяем, что тип из URL является допустимым значением
  const isValidType = typeFromUrl && Object.values(PLACE_TYPES).includes(typeFromUrl);
  const initialType = isValidType ? typeFromUrl : PLACE_TYPES.RESTAURANT;
  
  console.log('Начальный тип места:', initialType);
  
  const [formData, setFormData] = useState({
    name: '',
    type: initialType,
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    priceLevel: '1',
    images: []
  });
  
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchPlaceData();
    }
  }, [placeId]);

  const fetchPlaceData = async () => {
    try {
      setLoading(true);
      const placeData = await getPlaceById(placeId);
      
      if (!placeData) {
        setError('Место не найдено');
        return;
      }
      
      // Проверяем, что текущий пользователь является владельцем места
      if (placeData.userId !== currentUser?.uid) {
        setError('У вас нет прав на редактирование этого места');
        return;
      }
      
      setFormData({
        name: placeData.name || '',
        type: placeData.type || PLACE_TYPES.CAFE,
        description: placeData.description || '',
        address: placeData.address || '',
        priceLevel: placeData.priceLevel || '1',
        latitude: placeData.location ? String(placeData.location.latitude) : '',
        longitude: placeData.location ? String(placeData.location.longitude) : '',
        images: []
      });
      
      if (placeData.imageUrls && placeData.imageUrls.length > 0) {
        setPreviewUrls(placeData.imageUrls);
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching place data:', error);
      setError('Не удалось загрузить данные места');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку поля при изменении
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Проверяем размер и тип файлов
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      setError('Некоторые файлы не были добавлены. Поддерживаются только изображения JPG и PNG размером до 5MB.');
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
    
    // Создаем превью для новых изображений
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Название обязательно';
    }
    
    if (!formData.type) {
      errors.type = 'Выберите тип места';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Адрес обязателен';
    }
    
    if (formData.latitude && !isValidCoordinate(formData.latitude)) {
      errors.latitude = 'Некорректная широта';
    }
    
    if (formData.longitude && !isValidCoordinate(formData.longitude)) {
      errors.longitude = 'Некорректная долгота';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidCoordinate = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Проверяем, что тип места является допустимым значением
      if (!Object.values(PLACE_TYPES).includes(formData.type)) {
        console.error('Неверный тип места при отправке формы:', formData.type);
        console.error('Допустимые типы:', PLACE_TYPES);
        setError('Выбран неверный тип места. Пожалуйста, выберите другой тип.');
        setSubmitting(false);
        return;
      }
      
      const placeData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        address: formData.address.trim(),
        priceLevel: formData.priceLevel,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: formData.images
      };
      
      // Отладочный вывод для проверки типа места
      console.log('Сохраняем место с типом:', placeData.type);
      console.log('Полные данные места:', placeData);
      
      let result;
      
      if (isEditMode) {
        result = await updatePlace(placeId, placeData);
      } else {
        result = await savePlace(placeData);
      }
      
      navigate(`/places/${result.id}`);
    } catch (error) {
      console.error('Error saving place:', error);
      setError(`Не удалось ${isEditMode ? 'обновить' : 'сохранить'} место: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get the place type name for the title
  const getPlaceTypeName = (type) => {
    switch (type) {
      case PLACE_TYPES.CAFE:
        return 'кафе';
      case PLACE_TYPES.RESTAURANT:
        return 'ресторан';
      case PLACE_TYPES.PARK:
        return 'парк';
      case PLACE_TYPES.VIEWPOINT:
        return 'смотровую площадку';
      default:
        return 'место';
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/places')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Редактирование места' : `Добавить ${getPlaceTypeName(formData.type)}`}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название места"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(formErrors.type)}>
                <InputLabel id="place-type-label">Тип места</InputLabel>
                <Select
                  labelId="place-type-label"
                  id="place-type"
                  name="type"
                  value={formData.type}
                  label="Тип места"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value={PLACE_TYPES.CAFE}>Кафе</MenuItem>
                  <MenuItem value={PLACE_TYPES.RESTAURANT}>Ресторан</MenuItem>
                  <MenuItem value={PLACE_TYPES.PARK}>Парк</MenuItem>
                  <MenuItem value={PLACE_TYPES.VIEWPOINT}>Смотровая площадка</MenuItem>
                </Select>
                {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="price-level-label">Ценовая категория</InputLabel>
                <Select
                  labelId="price-level-label"
                  id="price-level"
                  name="priceLevel"
                  value={formData.priceLevel}
                  label="Ценовая категория"
                  onChange={handleInputChange}
                >
                  <MenuItem value="1">$ (Бюджетно)</MenuItem>
                  <MenuItem value="2">$$ (Средне)</MenuItem>
                  <MenuItem value="3">$$$ (Премиум)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Адрес"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                error={Boolean(formErrors.address)}
                helperText={formErrors.address}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Широта"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                error={Boolean(formErrors.latitude)}
                helperText={formErrors.latitude}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Долгота"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                error={Boolean(formErrors.longitude)}
                helperText={formErrors.longitude}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Фотографии
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
              >
                Загрузить изображения
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              
              <Typography variant="caption" display="block" gutterBottom>
                Поддерживаются JPG и PNG до 5MB
              </Typography>
              
              {previewUrls.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            }
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  sx={{ minWidth: 120 }}
                >
                  {submitting ? (
                    <CircularProgress size={24} />
                  ) : isEditMode ? (
                    'Обновить'
                  ) : (
                    'Сохранить'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default PlaceForm; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { saveRoute, getRouteById, updateRoute } from '../../services/routeService';
import { useAuth } from '../../context/AuthContext';

const difficultyLevels = [
  { value: 'easy', label: 'Легкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'hard', label: 'Сложный' },
  { value: 'expert', label: 'Экспертный' }
];

const RouteForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: '',
    distance: '',
    duration: '',
    startPoint: '',
    endPoint: '',
    isPublic: false,
    images: []
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const routeData = await getRouteById(id);
        
        // Заполняем форму данными маршрута
        setFormData({
          title: routeData.title || '',
          description: routeData.description || '',
          difficulty: routeData.difficulty || '',
          distance: routeData.distance || '',
          duration: routeData.duration || '',
          startPoint: routeData.startPoint || '',
          endPoint: routeData.endPoint || '',
          isPublic: routeData.isPublic || false
        });

        // Если есть изображения, загружаем их превью
        if (routeData.imageUrls && routeData.imageUrls.length > 0) {
          setImagePreviewUrls(routeData.imageUrls);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Не удалось загрузить данные маршрута. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode && currentUser) {
      fetchRoute();
    }
  }, [id, isEditMode, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    e.preventDefault();
    
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Добавляем новые файлы к существующим
    setImageFiles([...imageFiles, ...files]);
    
    // Создаем URL превью для каждого файла
    const newImagePreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
    
    // Добавляем файлы в formData
    setFormData({
      ...formData,
      images: [...formData.images, ...files]
    });
  };

  const handleRemoveImage = (index) => {
    // Удаляем изображение из всех массивов
    const newImageFiles = [...imageFiles];
    const newImagePreviewUrls = [...imagePreviewUrls];
    const newFormDataImages = [...formData.images];
    
    newImageFiles.splice(index, 1);
    newImagePreviewUrls.splice(index, 1);
    newFormDataImages.splice(index, 1);
    
    setImageFiles(newImageFiles);
    setImagePreviewUrls(newImagePreviewUrls);
    setFormData({
      ...formData,
      images: newFormDataImages
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Проверяем обязательные поля
      if (!formData.title) {
        setError('Название маршрута обязательно');
        return;
      }
      
      // Подготавливаем данные для сохранения
      const routeData = {
        ...formData,
        // Преобразуем строковые числа в числовые значения
        distance: formData.distance ? parseFloat(formData.distance) : null,
        duration: formData.duration ? parseFloat(formData.duration) : null
      };
      
      let result;
      
      if (isEditMode) {
        // Обновляем существующий маршрут
        result = await updateRoute(id, routeData);
        setSnackbar({
          open: true,
          message: 'Маршрут успешно обновлен',
          severity: 'success'
        });
      } else {
        // Создаем новый маршрут
        result = await saveRoute(routeData);
        setSnackbar({
          open: true,
          message: 'Маршрут успешно создан',
          severity: 'success'
        });
      }
      
      // Перенаправляем на страницу просмотра маршрута
      navigate(`/routes/${result.id}`);
      
    } catch (err) {
      console.error('Error saving route:', err);
      setError(`Не удалось сохранить маршрут: ${err.message}`);
      setSnackbar({
        open: true,
        message: `Ошибка: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
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
          Загрузка данных маршрута...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Редактирование маршрута' : 'Создание нового маршрута'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                name="title"
                label="Название маршрута"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                error={!formData.title && error}
                helperText={!formData.title && error ? 'Название обязательно' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Описание маршрута"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="difficulty-label">Сложность</InputLabel>
                <Select
                  labelId="difficulty-label"
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label="Сложность"
                >
                  <MenuItem value="">
                    <em>Не выбрано</em>
                  </MenuItem>
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="distance"
                name="distance"
                label="Длина маршрута (км)"
                type="number"
                value={formData.distance}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="duration"
                name="duration"
                label="Продолжительность (часов)"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={handleChange}
                    name="isPublic"
                    color="primary"
                  />
                }
                label="Сделать маршрут публичным"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="startPoint"
                name="startPoint"
                label="Начальная точка"
                value={formData.startPoint}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="endPoint"
                name="endPoint"
                label="Конечная точка"
                value={formData.endPoint}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Изображения маршрута
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddPhotoAlternateIcon />}
                sx={{ mb: 2 }}
              >
                Добавить изображения
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              
              <Grid container spacing={2}>
                {imagePreviewUrls.map((url, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        position: 'relative',
                        height: 150,
                        backgroundImage: `url(${url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <IconButton
                        size="small"
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                          }
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} color="inherit" />}
                >
                  {saving ? 'Сохранение...' : (isEditMode ? 'Обновить маршрут' : 'Создать маршрут')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
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

export default RouteForm; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Autocomplete
} from '@mui/material';
import { PhotoCamera, Add } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const Register = ({ initialUserType = 'user' }) => {
  const navigate = useNavigate();
  const { register, login, user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    userType: initialUserType,
    // Основная информация гида
    bio: '',
    experience: '',
    specialization: [],
    languages: [],
    certificates: '',
    // Контактная информация
    phone: '',
    website: '',
    location: '',
    // Социальные сети
    instagram: '',
    facebook: '',
    twitter: '',
    // Дополнительная информация
    education: '',
    achievements: '',
    priceRange: '',
    availability: '',
    isTermsAccepted: false
  });

  // Предопределенные списки для выбора
  const availableSpecializations = [
    'История',
    'Архитектура',
    'Искусство',
    'Гастрономия',
    'Природа',
    'Фотография',
    'Активный отдых',
    'Культура',
    'Религия',
    'Ночная жизнь'
  ];

  const availableLanguages = [
    'Русский',
    'English',
    'Deutsch',
    'Français',
    'Español',
    'Italiano',
    'Polski',
    '中文',
    '日本語',
    'العربية'
  ];

  const steps = [
    'Основная информация',
    'Тип пользователя',
    'Профессиональная информация',
    'Контактные данные',
    'Подтверждение'
  ];

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isTermsAccepted' ? checked : value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Пожалуйста, загрузите изображение в формате JPEG, PNG или GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    try {
      const storageRef = ref(storage, `profile_photos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading file:', error);
          setError('Ошибка при загрузке файла');
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setPhotoURL(downloadURL);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError('Ошибка при обработке файла');
    }
  };

  const validateStep = (step) => {
    setError('');
    switch (step) {
      case 0:
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
          setError('Пожалуйста, заполните все обязательные поля');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Пароли не совпадают');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Пароль должен содержать минимум 6 символов');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Пожалуйста, введите корректный email');
          return false;
        }
        break;
      case 1:
        if (!formData.userType) {
          setError('Пожалуйста, выберите тип пользователя');
          return false;
        }
        break;
      case 2:
        if (formData.userType === 'guide') {
          if (!formData.bio || !formData.experience || formData.specialization.length === 0) {
            setError('Пожалуйста, заполните все обязательные поля профиля гида');
            return false;
          }
          if (formData.bio.length < 100) {
            setError('Описание должно содержать минимум 100 символов');
            return false;
          }
        }
        break;
      case 3:
        if (formData.userType === 'guide') {
          if (!formData.phone || !formData.location) {
            setError('Пожалуйста, укажите контактные данные');
            return false;
          }
          if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
            setError('Пожалуйста, введите корректный номер телефона');
            return false;
          }
        }
        break;
      case 4:
        if (!formData.isTermsAccepted) {
          setError('Необходимо принять условия использования');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  // Add useEffect for handling redirection
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;

    try {
      setError('');
      setLoading(true);
      
      const userData = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        photoURL: photoURL,
        userType: formData.userType,
        role: formData.userType === 'guide' ? 'guide' : 'user',
        bio: formData.bio,
        experience: formData.experience,
        specialization: formData.specialization,
        languages: formData.languages,
        certificates: formData.certificates,
        phone: formData.phone,
        website: formData.website,
        location: formData.location,
        socialMedia: {
          instagram: formData.instagram,
          facebook: formData.facebook,
          twitter: formData.twitter
        },
        education: formData.education,
        achievements: formData.achievements,
        priceRange: formData.priceRange,
        availability: formData.availability,
        isVerified: false,
        createdAt: new Date().toISOString()
      };

      console.log('Registering user with data:', userData);
      await register(userData);
      console.log('Registration successful, attempting login');
      await login(formData.email, formData.password);
      console.log('Login successful');
      // Redirection will be handled by useEffect
    } catch (err) {
      console.error('Registration error:', err);
      setError('Ошибка при регистрации: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="photo-upload">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      width: 100,
                      height: 100,
                      position: 'relative'
                    }}
                  >
                    {photoURL ? (
                      <Avatar
                        src={photoURL}
                        sx={{
                          width: 100,
                          height: 100
                        }}
                      />
                    ) : (
                      <PhotoCamera sx={{ width: 40, height: 40 }} />
                    )}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%',
                          color: 'white'
                        }}
                      >
                        {Math.round(uploadProgress)}%
                      </Box>
                    )}
                  </IconButton>
                </label>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Пароль"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Подтвердите пароль"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Выберите тип пользователя</FormLabel>
              <RadioGroup
                name="userType"
                value={formData.userType}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label="Обычный пользователь"
                />
                <FormControlLabel
                  value="guide"
                  control={<Radio />}
                  label="Профессиональный гид"
                />
              </RadioGroup>
            </FormControl>
            
            {formData.userType === 'guide' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Регистрация в качестве гида позволит вам создавать профессиональные маршруты,
                получать сообщения от пользователей и предлагать свои услуги.
                После регистрации ваш профиль будет проверен модераторами.
              </Alert>
            )}
          </Box>
        );

      case 2:
        return formData.userType === 'guide' ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="О себе"
                  name="bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  helperText="Минимум 100 символов"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Опыт работы"
                  name="experience"
                  multiline
                  rows={2}
                  value={formData.experience}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableSpecializations}
                  value={formData.specialization}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      specialization: newValue
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Специализация"
                      required
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableLanguages}
                  value={formData.languages}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      languages: newValue
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Языки"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Образование"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Достижения и награды"
                  name="achievements"
                  multiline
                  rows={2}
                  value={formData.achievements}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Сертификаты и лицензии"
                  name="certificates"
                  value={formData.certificates}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography>
              Для обычного пользователя дополнительная информация не требуется.
            </Typography>
          </Box>
        );

      case 3:
        return formData.userType === 'guide' ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Номер телефона"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+7 (999) 123-45-67"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Город"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Веб-сайт"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@username"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="@username"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Диапазон цен"
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleChange}
                  placeholder="от 1000 ₽/час"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Доступность"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  placeholder="Пн-Пт, 10:00-18:00"
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography>
              Для обычного пользователя контактная информация не требуется.
            </Typography>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            {formData.userType === 'guide' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Предварительный просмотр профиля
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Avatar
                        src={photoURL}
                        sx={{ width: 150, height: 150, mx: 'auto' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h5">{formData.displayName}</Typography>
                      <Chip label="Гид" color="primary" size="small" sx={{ mt: 1 }} />
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {formData.bio}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {formData.specialization.map((spec) => (
                          <Chip
                            key={spec}
                            label={spec}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  name="isTermsAccepted"
                  checked={formData.isTermsAccepted}
                  onChange={handleChange}
                />
              }
              label={
                <Typography variant="body2">
                  Я принимаю условия использования сервиса и даю согласие на обработку персональных данных
                </Typography>
              }
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {formData.userType === 'guide' ? 'Регистрация гида' : 'Регистрация'}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Назад
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Далее
              </Button>
            )}
          </Box>
        </form>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" align="center">
          Уже есть аккаунт?{' '}
          <Button color="primary" onClick={() => navigate('/login')}>
            Войти
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register; 
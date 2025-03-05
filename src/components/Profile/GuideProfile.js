import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Grid, 
  Paper, 
  Divider, 
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Rating
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Email,
  Language,
  Instagram,
  Facebook,
  Twitter,
  CheckCircle,
  Star
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../services/userService';
import { getUserRoutes } from '../../services/routeService';

const GuideProfile = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [guideData, setGuideData] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [processingSubscribe, setProcessingSubscribe] = useState(false);
  
  useEffect(() => {
    const fetchGuideData = async () => {
      try {
        setLoading(true);
        
        // Получаем данные гида
        const userData = await getUserById(userId);
        setGuideData(userData);
        
        // Получаем маршруты гида
        const guideRoutes = await getUserRoutes(userId);
        setRoutes(guideRoutes);
        
        // Проверяем, подписан ли текущий пользователь на гида
        // В реальном приложении: const subscribed = await isSubscribedToGuide(userId);
        // Пока используем заглушку
        setIsSubscribed(false);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching guide data:', error);
        setLoading(false);
      }
    };
    
    fetchGuideData();
  }, [userId]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSubscribeToggle = async () => {
    if (!currentUser) {
      // Показать сообщение о необходимости авторизации
      return;
    }
    
    if (processingSubscribe) return;
    
    try {
      setProcessingSubscribe(true);
      
      // Оптимистичное обновление UI
      setIsSubscribed(!isSubscribed);
      
      // Здесь будет вызов API для подписки/отписки
      // В реальном приложении: await toggleSubscription(userId);
      // Пока используем заглушку
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error toggling subscription:', error);
      
      // Возвращаем предыдущее состояние
      setIsSubscribed(!isSubscribed);
    } finally {
      setProcessingSubscribe(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Если данные гида не найдены
  if (!guideData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', my: 5 }}>
          <Typography variant="h5">Профиль не найден</Typography>
          <Typography variant="body1" color="textSecondary">
            Запрашиваемый профиль гида не существует или был удален.
          </Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Шапка профиля */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={guideData.photoURL} 
              alt={guideData.displayName}
              sx={{ 
                width: 150, 
                height: 150, 
                border: '4px solid #4caf50',
                mb: 2
              }}
            />
            <Button
              variant={isSubscribed ? "contained" : "outlined"}
              color={isSubscribed ? "success" : "primary"}
              fullWidth
              sx={{ mb: 1 }}
              onClick={handleSubscribeToggle}
              disabled={processingSubscribe}
              startIcon={processingSubscribe ? <CircularProgress size={20} /> : null}
            >
              {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
            </Button>
            <Button variant="outlined" color="primary" fullWidth>
              Связаться
            </Button>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mr: 1 }}>
                {guideData.displayName}
              </Typography>
              <Chip 
                label="Гид" 
                color="success" 
                size="small"
                icon={<CheckCircle />}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={4.7} precision={0.1} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                4.7 (42 отзыва)
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {guideData.bio || 'Профессиональный гид с опытом проведения экскурсий более 5 лет. Специализируюсь на исторических и архитектурных маршрутах.'}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {guideData.location || 'Санкт-Петербург, Россия'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {guideData.phone || '+7 (999) 123-45-67'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {guideData.email || 'guide@example.com'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Language color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {guideData.website || 'www.guide-tours.com'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Chip label="История" />
              <Chip label="Архитектура" />
              <Chip label="Искусство" />
              <Chip label="Гастрономия" />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Вкладки с контентом */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Маршруты" />
          <Tab label="Отзывы" />
          <Tab label="Об эксперте" />
        </Tabs>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Содержимое вкладок */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {routes.length > 0 ? (
            routes.map((route) => (
              <Grid item xs={12} sm={6} md={4} key={route.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={route.imageUrl || 'https://source.unsplash.com/random?city'}
                    alt={route.name}
                  />
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {route.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star sx={{ color: '#FFD700', mr: 0.5, fontSize: 16 }} />
                      <Typography variant="body2">
                        {route.rating || '4.5'} ({route.reviewsCount || '12'})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {route.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="body2" color="primary">
                        {route.duration || '2'} ч. • {route.distance || '3'} км
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {route.price ? `${route.price} ₽` : 'Бесплатно'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">Маршруты не найдены</Typography>
                <Typography variant="body2" color="textSecondary">
                  У этого гида пока нет опубликованных маршрутов.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Отзывы клиентов</Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Avatar sx={{ mr: 2 }}>A</Avatar>
              <Box>
                <Typography variant="subtitle1">Анна Иванова</Typography>
                <Rating value={5} size="small" readOnly />
                <Typography variant="caption" display="block">2 недели назад</Typography>
              </Box>
            </Box>
            <Typography variant="body2">
              Отличная экскурсия! Гид очень хорошо знает историю города и интересно рассказывает. Рекомендую всем, кто хочет узнать больше о Санкт-Петербурге.
            </Typography>
          </Paper>
          
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Avatar sx={{ mr: 2 }}>М</Avatar>
              <Box>
                <Typography variant="subtitle1">Михаил Петров</Typography>
                <Rating value={4} size="small" readOnly />
                <Typography variant="caption" display="block">1 месяц назад</Typography>
              </Box>
            </Box>
            <Typography variant="body2">
              Познавательная экскурсия, много интересных фактов. Единственный минус - немного быстрый темп, не всегда успевал сделать фотографии.
            </Typography>
          </Paper>
        </Box>
      )}
      
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Об эксперте</Typography>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              Я профессиональный гид с опытом работы более 5 лет. Имею историческое образование и глубокие знания об архитектуре и культуре Санкт-Петербурга.
            </Typography>
            <Typography variant="body1" paragraph>
              Провожу как классические обзорные экскурсии, так и тематические маршруты по необычным местам города. Каждая моя экскурсия - это не просто набор фактов, а увлекательное путешествие с историями и легендами.
            </Typography>
            <Typography variant="body1" paragraph>
              Языки: русский, английский, испанский.
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Образование и сертификаты</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Санкт-Петербургский государственный университет</Typography>
              <Typography variant="body2" color="textSecondary">Исторический факультет, 2015</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Сертифицированный гид Санкт-Петербурга</Typography>
              <Typography variant="body2" color="textSecondary">Лицензия №12345, 2016</Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default GuideProfile; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Chip
} from '@mui/material';
import {
  Message as MessageIcon,
  Star as StarIcon,
  Route as RouteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/userService';
import { getUserRoutes } from '../../services/routeService';
import { startChat } from '../../services/chatService';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userRoutes, setUserRoutes] = useState([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profile = await getUserProfile(userId);
        const routes = await getUserRoutes(userId);
        setUserProfile(profile);
        setUserRoutes(routes);
      } catch (err) {
        setError('Ошибка при загрузке профиля пользователя');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleMessageClick = () => {
    setIsMessageDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsMessageDialogOpen(false);
    setMessageText('');
  };

  const handleSendMessage = async () => {
    try {
      if (!messageText.trim()) return;

      await startChat({
        senderId: currentUser.uid,
        receiverId: userId,
        initialMessage: messageText
      });

      handleCloseDialog();
      navigate('/messages');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Ошибка при отправке сообщения');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Загрузка профиля...</Typography>
      </Box>
    );
  }

  if (error || !userProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography color="error">{error || 'Профиль не найден'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={userProfile.avatarUrl}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {userProfile.displayName}
              </Typography>
              {userProfile.isGuide && (
                <Chip
                  icon={<StarIcon />}
                  label="Профессиональный гид"
                  color="primary"
                  sx={{ mb: 2 }}
                />
              )}
              {currentUser && currentUser.uid !== userId && (
                <Button
                  variant="contained"
                  startIcon={<MessageIcon />}
                  fullWidth
                  onClick={handleMessageClick}
                  sx={{ mt: 2 }}
                >
                  Написать сообщение
                </Button>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              О себе
            </Typography>
            <Typography paragraph>
              {userProfile.bio || 'Пользователь пока не добавил информацию о себе'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Маршруты пользователя
            </Typography>
            <List>
              {userRoutes.map((route) => (
                <ListItem
                  key={route.id}
                  button
                  onClick={() => navigate(`/route/${route.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <RouteIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={route.name}
                    secondary={`Длительность: ${route.duration} ч`}
                  />
                </ListItem>
              ))}
              {userRoutes.length === 0 && (
                <Typography color="textSecondary">
                  Пользователь пока не создал ни одного маршрута
                </Typography>
              )}
            </List>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={isMessageDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Написать сообщение</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ваше сообщение"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSendMessage} color="primary">
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile; 
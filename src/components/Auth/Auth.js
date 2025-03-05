import React, { useState } from 'react';
import { Container, Paper, Box, Typography } from '@mui/material';
import LoginForm from './LoginForm';
import Register from './Register';
import './Auth.css';

const Auth = () => {
  const [authState, setAuthState] = useState({
    isLogin: true,
    userType: 'user'
  });

  const handleSwitchToLogin = () => {
    setAuthState({ isLogin: true, userType: 'user' });
  };

  const handleSwitchToSignup = (userType = 'user') => {
    setAuthState({ isLogin: false, userType });
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--bg-darker)',
          boxShadow: 'var(--shadow-dark)',
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)'
          }} 
        />
        
        <Box sx={{ p: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            align="center" 
            gutterBottom
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-color) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {authState.isLogin 
              ? 'Добро пожаловать!' 
              : authState.userType === 'guide' 
                ? 'Регистрация гида'
                : 'Регистрация пользователя'
            }
          </Typography>

          {authState.isLogin ? (
            <LoginForm onSwitchToSignup={handleSwitchToSignup} />
          ) : (
            <Register 
              initialUserType={authState.userType} 
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth; 
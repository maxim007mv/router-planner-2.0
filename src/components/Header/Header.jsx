import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Route as RouteIcon,
  Home as HomeIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Brightness7 as LightIcon,
  Brightness4 as DarkIcon,
  Close as CloseIcon,
  Map as MapIcon,
  Place as PlaceIcon,
  Palette as PaletteIcon,
  History as HistoryIcon,
  Restaurant as RestaurantIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleTheme } = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const navigationItems = [
    { text: 'Главная', icon: <HomeIcon />, path: '/' },
    { text: 'Маршруты', icon: <MapIcon />, path: '/routes' },
    { text: 'Места', icon: <PlaceIcon />, path: '/places' },
    { text: 'Сообщество', icon: <PeopleIcon />, path: '/community' },
    { text: 'Арт-маршруты', icon: <PaletteIcon />, path: '/art-routes' },
    { text: 'Исторические', icon: <HistoryIcon />, path: '/historical-routes' },
    { text: 'Гастрономические', icon: <RestaurantIcon />, path: '/gastro-routes' },
  ];

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const mobileMenu = (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="drawer-header">
          <Typography variant="h6" component="div">
            Меню
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </div>

        <List className="mobile-menu">
          {navigationItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={isCurrentPath(item.path)}
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>

        <Divider />

        <div className="drawer-actions">
          <IconButton onClick={toggleTheme}>
            {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
          </IconButton>
          {currentUser ? (
            <>
              <IconButton onClick={() => { navigate('/profile'); handleDrawerToggle(); }}>
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>
              <IconButton onClick={handleLogout}>
                <ExitToAppIcon />
              </IconButton>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => { navigate('/auth'); handleDrawerToggle(); }}
              startIcon={<PersonIcon />}
            >
              Войти
            </Button>
          )}
        </div>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="sticky">
      <Container>
        <Toolbar>
          <Box className="logo-section">
            <RouteIcon />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{ textDecoration: 'none', color: 'inherit' }}
            >
              ROUTE PLANNER
            </Typography>
          </Box>

          <Box className="nav-section">
            {navigationItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                color="inherit"
              >
                {item.text}
              </Button>
            ))}
          </Box>

          <Box className="actions-section">
            <IconButton onClick={toggleTheme}>
              {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
            {currentUser ? (
              <IconButton onClick={() => navigate('/profile')}>
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/auth')}
                startIcon={<PersonIcon />}
              >
                Войти
              </Button>
            )}
            <IconButton
              className="menu-button"
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--bg-accent)',
                }
              }}
            >
              <MenuIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
      {mobileMenu}
    </AppBar>
  );
};

export default Header; 
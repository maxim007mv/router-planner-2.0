import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Header from './components/Header/Header';
import LoadingScreen from './components/common/LoadingScreen';
import Profile from './components/Profile/Profile';
import Home from './components/Home/Home';
import ArtRoutes from './components/ThematicRoutes/ArtRoutes';
import HistoricalRoutes from './components/ThematicRoutes/HistoricalRoutes';
import GastroRoutes from './components/ThematicRoutes/GastroRoutes';
import RouteForm from './components/RouteForm/RouteForm';
import RouteDetails from './components/RouteDetails/RouteDetails';
import Auth from './components/Auth/Auth';
import Community from './components/Community/Community';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RouteDetail from './components/Routes/RouteDetail';
import PlacesList from './components/Places/PlacesList';
import PlaceDetail from './components/Places/PlaceDetail';
import PlaceForm from './components/Places/PlaceForm';
import AdminPlaces from './components/Places/AdminPlaces';
import GeneratedRoute from './components/GeneratedRoute';
import AdminUsers from './components/Admin/AdminUsers';
import { Toaster } from 'react-hot-toast';
import AdminLogin from './components/Admin/AdminLogin';
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminAccounts from './components/Admin/AdminAccounts';
import './App.css';

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Загрузка приложения..." />;
  }

  return (
    <div className="App">
      <Header />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.3)'
          },
        }}
      />
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/art-routes" element={<ArtRoutes />} />
        <Route path="/historical-routes" element={<HistoricalRoutes />} />
        <Route path="/gastro-routes" element={<GastroRoutes />} />
        <Route path="/route/:id" element={<RouteDetails />} />
        <Route path="/routes/:routeId" element={<RouteDetail />} />
        <Route path="/places" element={<PlacesList />} />
        <Route path="/places/:placeId" element={<PlaceDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/generated-route" element={<GeneratedRoute />} />
        
        {/* Защищенные маршруты */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/create-route" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
        <Route path="/edit-route/:routeId" element={<ProtectedRoute><RouteForm /></ProtectedRoute>} />
        <Route path="/place-form" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
        <Route path="/place-form/:placeId" element={<ProtectedRoute><PlaceForm /></ProtectedRoute>} />
        
        {/* Админ маршруты */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin-places" element={<AdminProtectedRoute><AdminPlaces /></AdminProtectedRoute>} />
        <Route path="/admin-users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="/admin-accounts" element={<AdminProtectedRoute><AdminAccounts /></AdminProtectedRoute>} />
        
        {/* Редирект для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

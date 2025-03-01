import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header/Header';
import Profile from './components/Profile/Profile';
import Home from './components/Home/Home';
import ArtRoutes from './components/ThematicRoutes/ArtRoutes';
import HistoricalRoutes from './components/ThematicRoutes/HistoricalRoutes';
import GastroRoutes from './components/ThematicRoutes/GastroRoutes';
import RouteForm from './components/RouteForm/RouteForm';
import RouteDetails from './components/RouteDetails/RouteDetails';
import Auth from './components/Auth/Auth';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/art-routes" element={<ArtRoutes />} />
              <Route path="/historical-routes" element={<HistoricalRoutes />} />
              <Route path="/gastro-routes" element={<GastroRoutes />} />
              <Route path="/create-route" element={<RouteForm />} />
              <Route path="/route/:id" element={<RouteDetails />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

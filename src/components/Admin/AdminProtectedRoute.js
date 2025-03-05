import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('AdminProtectedRoute - Starting check...');
      
      // Проверяем, есть ли запись в localStorage
      const adminAuthenticated = localStorage.getItem('adminAuthenticated');
      
      console.log('AdminProtectedRoute - adminAuthenticated:', adminAuthenticated);
      
      // Если есть запись в localStorage, считаем пользователя администратором
      if (adminAuthenticated === 'true') {
        console.log('AdminProtectedRoute - adminAuthenticated is true, granting access');
        setIsAdmin(true);
      } else {
        console.log('AdminProtectedRoute - adminAuthenticated is not true, denying access');
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };
    
    checkAdminStatus();
  }, []);
  
  if (isLoading) {
    console.log('AdminProtectedRoute - Still loading...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    console.log('AdminProtectedRoute - Not admin, redirecting to /admin-login');
    return <Navigate to="/admin-login" />;
  }
  
  console.log('AdminProtectedRoute - Is admin, showing protected content');
  return children;
};

export default AdminProtectedRoute; 
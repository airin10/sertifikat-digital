import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // CHECK 1: Apakah sedang logout manual?
          const isManualLogout = localStorage.getItem('manual_logout') === 'true';
          
          if (isManualLogout) {
            console.log('Manual logout in progress, skipping redirect');
            return Promise.reject(error);
          }
          
          // CHECK 2: Apakah token masih ada?
          const currentToken = localStorage.getItem('token');
          
          if (!currentToken) {
            console.log('Token already removed, skipping redirect');
            return Promise.reject(error);
          }
          
          // Token masih ada dan bukan manual logout = token expired
          console.warn('Token expired or invalid, redirecting to login...');
          
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await api.get('/api/auth/profile');
          setUser({ ...response.data, token });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      const userWithToken = { ...userData, token: access_token };
      setUser(userWithToken);
      
      return userWithToken;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  //LOGOUT 
  const logout = (shouldRedirect = true) => {
    localStorage.setItem('manual_logout', 'true');
    
    // Hapus token
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
    
    setTimeout(() => {
      localStorage.removeItem('manual_logout');
    }, 3000);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isParticipant: user?.role === 'participant',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

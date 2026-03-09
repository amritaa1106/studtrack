import { createContext, useContext, useState, useEffect } from 'react';
import { login, register, getCurrentUser } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await getCurrentUser(token);
      setUser(response.data);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    const response = await login({ email, password });
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return response.data;
  };

  const handleRegister = async (name, email, password) => {
    try {
      const response = await register({ name, email, password });
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const { access_token, user: userData } = response.data;
      
      if (!access_token || !userData) {
        throw new Error('Missing access token or user data in response');
      }
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      return response.data;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      // Re-throw to let the component handle it
      throw error;
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

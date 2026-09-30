import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, getErrorMessage } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('agroflow_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agroflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('agroflow_token');
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('agroflow_user', JSON.stringify(profile));
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password, expectedRole = null) => {
    const data = await authService.login({ username, password });
    const accessToken = data.access_token;
    localStorage.setItem('agroflow_token', accessToken);
    setToken(accessToken);

    const profile = await authService.getCurrentUser();
    if (expectedRole && profile.role !== expectedRole) {
      logout();
      throw new Error(`This account is registered as ${profile.role}. Please log in through the ${profile.role.toLowerCase()} portal.`);
    }

    setUser(profile);
    localStorage.setItem('agroflow_user', JSON.stringify(profile));
    return profile;
  };

  const registerFarmer = async (formData) => {
    return await authService.registerFarmer(formData);
  };

  const registerBuyer = async (formData) => {
    return await authService.registerBuyer(formData);
  };

  const logout = () => {
    localStorage.removeItem('agroflow_token');
    localStorage.removeItem('agroflow_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        registerFarmer,
        registerBuyer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

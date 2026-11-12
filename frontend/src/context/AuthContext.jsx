import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../utils/api';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => storage.getUser());
  const [token, setToken] = useState(() => storage.getToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    storage.clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  // Check token validity on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storage.getToken();
      const cachedUser = storage.getUser();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Verify token with backend GET /api/auth/me
        const res = await authApi.getMe();
        if (res.success && res.user) {
          // Merge token info with cached user profile (fullName, username, email)
          const mergedUser = {
            ...(cachedUser || {}),
            id: res.user.userId || res.user.id || (cachedUser && cachedUser.id),
            role: res.user.role || (cachedUser && cachedUser.role),
          };
          setUser(mergedUser);
          storage.setUser(mergedUser);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err?.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to 401 expired event dispatched by axios interceptor
    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [logout]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.token && res.user) {
      storage.setToken(res.token);
      storage.setUser(res.user);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    return res;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


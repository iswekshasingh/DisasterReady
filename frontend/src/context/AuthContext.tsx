import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginPayload } from '@/types/auth.types';
import { authService } from '@/api/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUserStats: (pointsDelta: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'disasterready_token';
const USER_KEY = 'disasterready_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      await authService.getMe();
      // Token is valid; maintain cached user profile
      const cached = localStorage.getItem(USER_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await authService.login(credentials);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStats = (pointsDelta: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const newPoints = (prev.totalPoints || 0) + pointsDelta;
      const newLevel = Math.max(1, Math.floor(newPoints / 100) + 1);
      const updated = {
        ...prev,
        totalPoints: newPoints,
        level: newLevel,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshSession,
        updateUserStats,
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


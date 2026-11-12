// Safe storage helpers for auth token and user session
const TOKEN_KEY = 'disasterready_token';
const USER_KEY = 'disasterready_user';

export const storage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to save token to localStorage', e);
    }
  },

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth from localStorage', e);
    }
  }
};


import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [shopSettings, setShopSettingsState] = useState(() => {
    const saved = localStorage.getItem('shopSettings');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const setShopSettings = (settings) => {
    if (settings) {
      try {
        localStorage.setItem('shopSettings', JSON.stringify(settings));
      } catch (_) { }
    }
    setShopSettingsState(settings);
  };

  useEffect(() => {
    // 1. Fetch live shop settings unconditionally for public visitor & admin sync
    refreshSettings();

    // 2. Load authenticated user if token exists
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
          if (res.data.data.settings) {
            setShopSettings(res.data.data.settings);
          }
          localStorage.setItem('user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        console.error('Failed to restore session:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      // fetch settings
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          setShopSettings(meRes.data.data.settings);
        }
      } catch (_) { }

      return newUser;
    }
    throw new Error(res.data.error || 'Login failed');
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          setShopSettings(meRes.data.data.settings);
        }
      } catch (_) { }

      return newUser;
    }
    throw new Error(res.data.error || 'Google login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          setShopSettings(meRes.data.data.settings);
        }
      } catch (_) { }

      return newUser;
    }
    throw new Error(res.data.error || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const refreshSettings = async () => {
    try {
      const res = await api.get('/portal/settings');
      if (res.data.success) {
        setShopSettings(res.data.data);
      }
    } catch (_) {
      try {
        const fallback = await api.get('/admin/settings');
        if (fallback.data.success) setShopSettings(fallback.data.data);
      } catch (_) { }
    }
  };

  const updateUser = (updatedUserData) => {
    if (updatedUserData) {
      setUser((prev) => {
        const next = { ...prev, ...updatedUserData };
        try {
          localStorage.setItem('user', JSON.stringify(next));
        } catch (_) { }
        return next;
      });
    }
  };

  const isPrimaryAdmin = !!(user?.isPrimaryAdmin || user?.email === 'hindtyre01@gmail.com');

  const value = {
    user,
    token,
    role: user?.role,
    isAdmin: user?.role === 'ADMIN',
    isPrimaryAdmin,
    isCounter: user?.role === 'COUNTER' || user?.role === 'ADMIN',
    isCustomer: false,
    shopSettings,
    setShopSettings,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    refreshSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

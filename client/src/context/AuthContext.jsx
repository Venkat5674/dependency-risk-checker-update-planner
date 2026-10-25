/**
 * @file AuthContext.jsx
 * @description Authentication context providing user state, login, registration,
 * and token persistence across the frontend application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('depsafe_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate session on initial load
  useEffect(() => {
    const token = localStorage.getItem('depsafe_token');
    if (token) {
      authService
        .me()
        .then((res) => {
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('depsafe_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token is invalid or expired
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { user: authedUser, token } = res.data;
    setUser(authedUser);
    localStorage.setItem('depsafe_user', JSON.stringify(authedUser));
    localStorage.setItem('depsafe_token', token);
    return authedUser;
  };

  const register = async (payload) => {
    const res = await authService.register(payload);
    const { user: newUser, token } = res.data;
    setUser(newUser);
    localStorage.setItem('depsafe_user', JSON.stringify(newUser));
    localStorage.setItem('depsafe_token', token);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem('depsafe_user');
    localStorage.removeItem('depsafe_token');
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('depsafe_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

/**
 * @file authService.js
 * @description Authentication service wrapping API requests for register, login, current user, and profile updates.
 */

import api from './api';

export const authService = {
  /**
   * Register a new user account.
   */
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  /**
   * Sign in with email and password.
   */
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  /**
   * Log out current session.
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  /**
   * Fetch current authenticated user profile.
   */
  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  /**
   * Update profile information.
   */
  updateProfile: async (payload) => {
    const res = await api.patch('/auth/me', payload);
    return res.data;
  },
};

export default authService;

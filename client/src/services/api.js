/**
 * @file api.js
 * @description Centralized Axios HTTP client configuration for DepSafe.
 * Automatically injects JWT Bearer token into Authorization headers from localStorage,
 * and standardizes error propagation.
 */

import axios from 'axios';

// Base API URL with fallback to Vite proxy /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach JWT access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('depsafe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials
      if (localStorage.getItem('depsafe_token')) {
        localStorage.removeItem('depsafe_token');
        localStorage.removeItem('depsafe_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

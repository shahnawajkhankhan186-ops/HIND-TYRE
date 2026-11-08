import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Smart URL resolver supporting both VITE_API_BASE_URL and VITE_API_URL
const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api').trim();
let resolvedBaseUrl = rawEnvUrl;

// Route directly to Render backend in production web (Vercel) or native Capacitor app
const isNativePlatform =
  Capacitor.isNativePlatform() ||
  (typeof window !== 'undefined' && window.location.protocol === 'capacitor:');
const isVercelHost =
  typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

if ((isNativePlatform || isVercelHost) && (resolvedBaseUrl === '/api' || !resolvedBaseUrl.startsWith('http'))) {
  resolvedBaseUrl = 'https://hind-tyres-backend.onrender.com/api';
}

if (resolvedBaseUrl.startsWith('http://') || resolvedBaseUrl.startsWith('https://')) {
  resolvedBaseUrl = resolvedBaseUrl.replace(/\/+$/, '');
  if (!resolvedBaseUrl.endsWith('/api')) {
    resolvedBaseUrl += '/api';
  }
}

export const getApiBaseUrl = () => resolvedBaseUrl;

export const getReceiptPdfUrl = (saleId) => {
  return `${resolvedBaseUrl}/sales/${saleId}/receipt.pdf`;
};

const api = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
  timeout: 60000, // 60s timeout to allow Render free tier to wake up (~30-50s cold start)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/forgot-password')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }

    // Friendly error message when backend is unreachable or waking up from Render free tier sleep
    if (
      !error.response ||
      (error.response.status === 500 &&
        (!error.response.data || typeof error.response.data !== 'object' || !error.response.data.error))
    ) {
      error.friendlyMessage =
        'Backend server is not reachable. If hosted on Render free tier, it may be waking up from sleep (~30-50s initial cold start). Please wait a moment and try again.';
    }

    return Promise.reject(error);
  }
);

export default api;

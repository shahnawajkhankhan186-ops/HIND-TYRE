import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
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

    // Friendly error message when Vite proxy fails to connect to backend on port 5001
    if (
      !error.response ||
      (error.response.status === 500 &&
        (!error.response.data || typeof error.response.data !== 'object' || !error.response.data.error))
    ) {
      error.friendlyMessage =
        'Backend server is not reachable on port 5001. Please make sure the backend is running (run "npm run dev").';
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import { Mutex } from 'async-mutex';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/token-storage';
import { useAuthStore } from '../../stores/auth-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshMutex = new Mutex();

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        // Refresh token itself failed/expired
        await clearTokens();
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Lock the refresh process so concurrent requests wait
      const release = await refreshMutex.acquire();
      try {
        const currentRefreshToken = await getRefreshToken();
        if (!currentRefreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });

        if (response.data?.success && response.data?.data) {
          const { accessToken, refreshToken } = response.data.data;
          await setTokens(accessToken, refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and logout
        await clearTokens();
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        release();
      }
    }

    return Promise.reject(error);
  }
);

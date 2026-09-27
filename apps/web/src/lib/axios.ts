import axios from 'axios';
import { env } from './env';
import { getValidTokenOrRefresh } from './api';

const API_BASE = env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Auth and Tenant IDs
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('school_token');
    const tenantId = localStorage.getItem('schoolsaas_tenant_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }
  return config;
});

// Response interceptor: unwrap data, and on 401 refresh + retry once
// (same shared refresh queue as `@/lib/api`, so it can't double-refresh).
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config;
    const canRetry =
      error.response?.status === 401 &&
      config &&
      !config.__isRetry &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('school_refresh_token');

    if (canRetry) {
      try {
        await getValidTokenOrRefresh();
        config.__isRetry = true;
        return axiosInstance(config);
      } catch {
        // refresh already forced a logout; fall through to the normal error
      }
    }

    const message = error.response?.data?.error || error.message || 'API Error';
    // You can add global toast here if needed
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

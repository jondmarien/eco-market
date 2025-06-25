import axios from 'axios';

// API Base URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:4000';
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:5000';
const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:6000';

// Create axios instances for different services
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userServiceClient = axios.create({
  baseURL: USER_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productServiceClient = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const orderServiceClient = axios.create({
  baseURL: ORDER_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
const addAuthInterceptor = (client: typeof axios) => {
  client.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor to handle token refresh
const addResponseInterceptor = (client: typeof axios) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            try {
              const response = await userServiceClient.post('/api/v1/auth/refresh', {
                refreshToken,
              });
              
              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all clients
[apiClient, userServiceClient, productServiceClient, orderServiceClient].forEach(client => {
  addAuthInterceptor(client);
  addResponseInterceptor(client);
});

// API functions for user service
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    userServiceClient.post('/api/v1/auth/login', credentials),
  
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) =>
    userServiceClient.post('/api/v1/auth/register', userData),
  
  logout: () =>
    userServiceClient.post('/api/v1/auth/logout'),
  
  getMe: () =>
    userServiceClient.get('/api/v1/auth/me'),
  
  refreshToken: (refreshToken: string) =>
    userServiceClient.post('/api/v1/auth/refresh', { refreshToken }),
};

// API functions for product service
export const productAPI = {
  getProducts: (params?: { page?: number; limit?: number; search?: string }) =>
    productServiceClient.get('/api/v1/products', { params }),
  
  getProduct: (id: string) =>
    productServiceClient.get(`/api/v1/products/${id}`),
  
  searchProducts: (query: string, filters?: Record<string, any>) =>
    productServiceClient.get('/api/v1/products/search', { 
      params: { query, ...filters } 
    }),
};

// API functions for order service
export const orderAPI = {
  getOrders: () =>
    orderServiceClient.get('/api/v1/orders'),
  
  getOrder: (id: string) =>
    orderServiceClient.get(`/api/v1/orders/${id}`),
  
  createOrder: (orderData: any) =>
    orderServiceClient.post('/api/v1/orders', orderData),
};

// Health check function
export const healthCheck = {
  userService: () => userServiceClient.get('/health'),
  productService: () => productServiceClient.get('/health'),
  orderService: () => orderServiceClient.get('/health'),
};

export default apiClient;

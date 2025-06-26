import axios from 'axios';
import {
  User,
  Product,
  Order,
  AuthUser,
  LoginCredentials,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  CreateProductForm,
  UpdateUserForm,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await api.post<ApiResponse<AuthUser>>('/auth/admin/login', credentials);
    return response.data.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('adminToken');
  },
  
  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },
  
  updateUser: async (id: string, userData: UpdateUserForm): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data.data;
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  
  suspendUser: async (id: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/suspend`);
    return response.data.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async (page = 1, limit = 10): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>(`/products?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },
  
  createProduct: async (productData: CreateProductForm): Promise<Product> => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images' && value) {
        Array.from(value).forEach((file) => {
          formData.append('images', file);
        });
      } else {
        formData.append(key, value.toString());
      }
    });
    
    const response = await api.post<ApiResponse<Product>>('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data.data;
  },
  
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (page = 1, limit = 10): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>(`/orders?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },
  
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },
};

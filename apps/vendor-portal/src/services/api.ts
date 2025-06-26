import axios from 'axios';
import {
  Vendor,
  VendorProduct,
  VendorOrder,
  VendorAnalytics,
  Message,
  VendorAuth,
  LoginCredentials,
  VendorRegistrationForm,
  ProductForm,
  MessageForm,
  VendorSettings,
  ApiResponse,
  PaginatedResponse,
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
  const token = localStorage.getItem('vendorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<VendorAuth> => {
    const response = await api.post<ApiResponse<VendorAuth>>('/auth/vendor/login', credentials);
    return response.data.data;
  },
  
  register: async (registrationData: VendorRegistrationForm): Promise<VendorAuth> => {
    const formData = new FormData();
    
    // Add basic vendor data
    Object.entries(registrationData).forEach(([key, value]) => {
      if (key === 'address') {
        formData.append('address', JSON.stringify(value));
      } else if (key === 'category') {
        formData.append('category', JSON.stringify(value));
      } else if (key === 'logo' || key === 'businessLicense' || key === 'taxDocument') {
        if (value && value.length > 0) {
          formData.append(key, value[0]);
        }
      } else {
        formData.append(key, value.toString());
      }
    });
    
    const response = await api.post<ApiResponse<VendorAuth>>('/auth/vendor/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('vendorToken');
  },
  
  getCurrentVendor: async (): Promise<VendorAuth> => {
    const response = await api.get<ApiResponse<VendorAuth>>('/auth/me');
    return response.data.data;
  },
};

// Vendor API
export const vendorAPI = {
  getProfile: async (): Promise<Vendor> => {
    const response = await api.get<ApiResponse<Vendor>>('/vendor/profile');
    return response.data.data;
  },
  
  updateProfile: async (vendorData: Partial<Vendor>): Promise<Vendor> => {
    const response = await api.put<ApiResponse<Vendor>>('/vendor/profile', vendorData);
    return response.data.data;
  },
  
  getAnalytics: async (period = '30d'): Promise<VendorAnalytics> => {
    const response = await api.get<ApiResponse<VendorAnalytics>>(`/vendor/analytics?period=${period}`);
    return response.data.data;
  },
  
  getSettings: async (): Promise<VendorSettings> => {
    const response = await api.get<ApiResponse<VendorSettings>>('/vendor/settings');
    return response.data.data;
  },
  
  updateSettings: async (settings: Partial<VendorSettings>): Promise<VendorSettings> => {
    const response = await api.put<ApiResponse<VendorSettings>>('/vendor/settings', settings);
    return response.data.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async (page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<VendorProduct>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await api.get<PaginatedResponse<VendorProduct>>(`/vendor/products?${params}`);
    return response.data;
  },
  
  getProduct: async (id: string): Promise<VendorProduct> => {
    const response = await api.get<ApiResponse<VendorProduct>>(`/vendor/products/${id}`);
    return response.data.data;
  },
  
  createProduct: async (productData: ProductForm): Promise<VendorProduct> => {
    const formData = new FormData();
    
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images' && value) {
        Array.from(value).forEach((file) => {
          formData.append('images', file);
        });
      } else if (key === 'dimensions') {
        formData.append('dimensions', JSON.stringify(value));
      } else if (key === 'tags') {
        formData.append('tags', JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });
    
    const response = await api.post<ApiResponse<VendorProduct>>('/vendor/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  updateProduct: async (id: string, productData: Partial<VendorProduct>): Promise<VendorProduct> => {
    const response = await api.put<ApiResponse<VendorProduct>>(`/vendor/products/${id}`, productData);
    return response.data.data;
  },
  
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/vendor/products/${id}`);
  },
  
  updateStock: async (id: string, stock: number): Promise<VendorProduct> => {
    const response = await api.patch<ApiResponse<VendorProduct>>(`/vendor/products/${id}/stock`, { stock });
    return response.data.data;
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<VendorOrder>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await api.get<PaginatedResponse<VendorOrder>>(`/vendor/orders?${params}`);
    return response.data;
  },
  
  getOrder: async (id: string): Promise<VendorOrder> => {
    const response = await api.get<ApiResponse<VendorOrder>>(`/vendor/orders/${id}`);
    return response.data.data;
  },
  
  updateOrderStatus: async (id: string, status: string, trackingNumber?: string): Promise<VendorOrder> => {
    const response = await api.patch<ApiResponse<VendorOrder>>(`/vendor/orders/${id}/status`, { 
      status,
      trackingNumber,
    });
    return response.data.data;
  },
  
  getOrdersByStatus: async (status: string): Promise<VendorOrder[]> => {
    const response = await api.get<ApiResponse<VendorOrder[]>>(`/vendor/orders/status/${status}`);
    return response.data.data;
  },
};

// Messages API
export const messagesAPI = {
  getMessages: async (page = 1, limit = 10): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>(`/vendor/messages?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getMessage: async (id: string): Promise<Message> => {
    const response = await api.get<ApiResponse<Message>>(`/vendor/messages/${id}`);
    return response.data.data;
  },
  
  sendMessage: async (messageData: MessageForm): Promise<Message> => {
    const formData = new FormData();
    
    formData.append('subject', messageData.subject);
    formData.append('content', messageData.content);
    
    if (messageData.attachments) {
      Array.from(messageData.attachments).forEach((file) => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post<ApiResponse<Message>>('/vendor/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/vendor/messages/${id}/read`);
  },
  
  replyToMessage: async (id: string, content: string, attachments?: FileList): Promise<Message> => {
    const formData = new FormData();
    formData.append('content', content);
    
    if (attachments) {
      Array.from(attachments).forEach((file) => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post<ApiResponse<Message>>(`/vendor/messages/${id}/reply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: async (): Promise<{
    analytics: VendorAnalytics;
    recentOrders: VendorOrder[];
    lowStockProducts: VendorProduct[];
    unreadMessages: number;
  }> => {
    const response = await api.get<ApiResponse<any>>('/vendor/dashboard');
    return response.data.data;
  },
};

// Categories API (for product forms)
export const categoriesAPI = {
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/categories');
    return response.data.data;
  },
  
  getSubcategories: async (category: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(`/categories/${category}/subcategories`);
    return response.data.data;
  },
};

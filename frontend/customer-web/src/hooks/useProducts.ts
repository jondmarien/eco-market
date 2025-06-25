import { useQuery } from '@tanstack/react-query';
import { productAPI } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sustainability_score: number;
  carbon_footprint: number;
  is_organic: boolean;
  is_local: boolean;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

export function useProducts(params?: { 
  page?: number; 
  limit?: number; 
  search?: string; 
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await productAPI.getProducts(params);
      return response.data as ProductsResponse;
    },
    enabled: true,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productAPI.getProduct(id);
      return response.data.data as Product;
    },
    enabled: !!id,
  });
}

export function useSearchProducts(
  query: string, 
  filters?: Record<string, any>
) {
  return useQuery({
    queryKey: ['products', 'search', query, filters],
    queryFn: async () => {
      const response = await productAPI.searchProducts(query, filters);
      return response.data as ProductsResponse;
    },
    enabled: !!query,
  });
}

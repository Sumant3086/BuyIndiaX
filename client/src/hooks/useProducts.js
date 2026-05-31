import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

// Fetch all products with filters
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: filters });
      return data.products;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 2,
  });
};

// Fetch single product
export const useProduct = (productId) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}`);
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10,
  });
};

// Fetch product recommendations
export const useRecommendations = (productId) => {
  return useQuery({
    queryKey: ['recommendations', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/recommendations/${productId}`);
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 15,
  });
};

// Search products
export const useProductSearch = (searchTerm) => {
  return useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      const { data } = await api.get('/products/search', { params: { q: searchTerm } });
      return data;
    },
    enabled: searchTerm.length > 2,
    staleTime: 1000 * 60 * 2,
  });
};

// Prefetch product details
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();
  
  return (productId) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: async () => {
        const { data } = await api.get(`/products/${productId}`);
        return data;
      },
    });
  };
};

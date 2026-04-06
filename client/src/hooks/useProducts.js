import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fetch all products with filters
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products`, { params: filters });
      return data.products;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch single product
export const useProduct = (productId) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${productId}`);
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Fetch product recommendations
export const useRecommendations = (productId) => {
  return useQuery({
    queryKey: ['recommendations', productId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/recommendations/${productId}`);
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Search products
export const useProductSearch = (searchTerm) => {
  return useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/search`, {
        params: { q: searchTerm }
      });
      return data;
    },
    enabled: searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Prefetch product details
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();
  
  return (productId) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: async () => {
        const { data } = await axios.get(`${API_URL}/products/${productId}`);
        return data;
      },
    });
  };
};

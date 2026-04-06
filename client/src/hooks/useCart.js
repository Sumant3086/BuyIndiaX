import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { showToast } from '../utils/toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fetch cart
export const useCart = () => {
  const token = localStorage.getItem('token');
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Add to cart with optimistic update
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/cart`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      // Update cart data
      queryClient.setQueryData(['cart'], data);
      showToast('Added to cart! 🛒', 'success');
    },
    onError: (err) => {
      console.error('Add to cart error:', err);
      showToast(err.response?.data?.message || 'Failed to add to cart', 'error');
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Update cart item
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_URL}/cart/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      showToast('Cart updated!', 'success');
    },
    onError: (err) => {
      console.error('Update cart error:', err);
      showToast('Failed to update quantity', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Remove from cart
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId) => {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`${API_URL}/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      showToast('Removed from cart', 'info');
    },
    onError: (err) => {
      console.error('Remove from cart error:', err);
      showToast('Failed to remove item', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

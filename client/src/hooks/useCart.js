import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { showToast } from '../utils/toast';

// Fetch cart
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get('/cart');
      return data;
    },
    enabled: !!localStorage.getItem('token'),
    staleTime: 1000 * 60 * 2,
  });
};

// Add to cart with optimistic update
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const { data } = await api.post('/cart', { productId, quantity });
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
      const { data } = await api.put(`/cart/${itemId}`, { quantity });
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
      const { data } = await api.delete(`/cart/${itemId}`);
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

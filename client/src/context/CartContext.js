import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import api from '../utils/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0, grandTotal: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const normalizeCart = (data) => ({
    ...data,
    items: (data.items || []).filter(item => item.product)
  });

  const fetchCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      const normalized = normalizeCart(data);
      setCart(normalized);
      queryClient.setQueryData(['cart'], normalized);
    } catch {
      setCart({ items: [], totalAmount: 0, grandTotal: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], totalAmount: 0, grandTotal: 0 });
      queryClient.setQueryData(['cart'], null);
    }
  }, [user, fetchCart, queryClient]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { productId, quantity });
    const normalized = normalizeCart(data);
    setCart(normalized);
    queryClient.setQueryData(['cart'], normalized);
    return normalized;
  };

  const updateCartItem = async (itemId, quantity) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    const normalized = normalizeCart(data);
    setCart(normalized);
    queryClient.setQueryData(['cart'], normalized);
  };

  const removeFromCart = async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    const normalized = normalizeCart(data);
    setCart(normalized);
    queryClient.setQueryData(['cart'], normalized);
  };

  const clearCart = async () => {
    await api.delete('/cart');
    const empty = { items: [], totalAmount: 0, grandTotal: 0 };
    setCart(empty);
    queryClient.setQueryData(['cart'], empty);
  };

  return (
    <CartContext.Provider value={{
      cart, loading, addToCart, updateCartItem,
      removeFromCart, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

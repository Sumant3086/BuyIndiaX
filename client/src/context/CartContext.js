import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const CartContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], totalAmount: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen to TanStack Query cart updates
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'cart' && event.type === 'updated') {
        const cartData = event.query.state.data;
        if (cartData) {
          setCart(cartData);
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cart`);
      const cartData = response.data || { items: [], totalAmount: 0 };
      
      // Filter out items with null products
      if (cartData.items) {
        cartData.items = cartData.items.filter(item => item.product);
      }
      
      setCart(cartData);
      // Update TanStack Query cache
      queryClient.setQueryData(['cart'], cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Set empty cart on error
      setCart({ items: [], totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await axios.post(`${API_URL}/cart`, { productId, quantity });
      setCart(response.data);
      queryClient.setQueryData(['cart'], response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await axios.put(`${API_URL}/cart/${itemId}`, { quantity });
      setCart(response.data);
      queryClient.setQueryData(['cart'], response.data);
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await axios.delete(`${API_URL}/cart/${itemId}`);
      setCart(response.data);
      queryClient.setQueryData(['cart'], response.data);
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/cart`);
      setCart({ items: [], totalAmount: 0 });
      queryClient.setQueryData(['cart'], { items: [], totalAmount: 0 });
    } catch (error) {
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      addToCart, 
      updateCartItem, 
      removeFromCart, 
      clearCart,
      fetchCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

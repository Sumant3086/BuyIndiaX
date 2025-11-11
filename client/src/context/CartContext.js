import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], totalAmount: 0 });
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await axios.post(`${API_URL}/cart`, { productId, quantity });
      setCart(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await axios.put(`${API_URL}/cart/${itemId}`, { quantity });
      setCart(response.data);
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await axios.delete(`${API_URL}/cart/${itemId}`);
      setCart(response.data);
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/cart`);
      setCart({ items: [], totalAmount: 0 });
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

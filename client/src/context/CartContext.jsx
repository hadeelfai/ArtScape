import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const CART_KEY = 'artscape-cart';

// Helper to load cart from localStorage
const loadCartFromStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  // Initialize state directly from localStorage
  const [cartItems, setCartItems] = useState(() => loadCartFromStorage());

  // Also load on mount to ensure we have the latest data
  useEffect(() => {
    const stored = loadCartFromStorage();
    if (stored.length > 0) {
      setCartItems(stored);
    }
  }, []);

  // Clear cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCartItems([]);
      // Clear localStorage when user logs out
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CART_KEY);
        } catch (error) {
          console.error('Error clearing cart from localStorage:', error);
        }
      }
    }
  }, [isAuthenticated]);

  // Persist to localStorage on change (only if authenticated)
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, isAuthenticated]);

  function addToCart(artwork, onError) {
    if (!isAuthenticated) {
      if (onError) {
        onError('Please sign in to add items to cart');
      }
      return false;
    }

    setCartItems(prev =>
      prev.some(item => item.id === (artwork._id || artwork.id))
        ? prev
        : [...prev, { ...artwork, id: artwork._id || artwork.id }]
    );
    return true;
  }

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }

  function clearCart() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

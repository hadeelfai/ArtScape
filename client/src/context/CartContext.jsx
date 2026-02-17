import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getApiBaseUrl } from '../config.js';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user?.id || !user?.token) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/cart`, {
        credentials: 'include',
        headers: {
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.token]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user?.id, fetchCart]);

  async function addToCart(artwork, onError) {
    if (!isAuthenticated || !user?.id) {
      if (onError) onError('Please sign in to add items to cart');
      return false;
    }
    const artworkId = artwork._id || artwork.id;
    if (!artworkId) {
      if (onError) onError('Invalid artwork');
      return false;
    }
    if (cartItems.some((item) => item.id === artworkId)) {
      return true;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ artworkId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCartItems(data.items || []);
        return true;
      }
      if (onError) onError(data.error || 'Failed to add to cart');
      return false;
    } catch (error) {
      console.error('Add to cart error:', error);
      if (onError) onError('Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function removeFromCart(id) {
    if (!user?.id) return;
    setLoading(true);
    const prev = [...cartItems];
    setCartItems((p) => p.filter((item) => item.id !== id));
    try {
      const res = await fetch(`${getApiBaseUrl()}/cart/${id}`, {
        method: 'DELETE',
        headers: {
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCartItems(prev);
        console.error(data.error || 'Failed to remove from cart');
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      setCartItems(prev);
    } finally {
      setLoading(false);
    }
  }

  async function clearCart() {
    if (!user?.id) return;
    setLoading(true);
    const prev = [...cartItems];
    setCartItems([]);
    try {
      const res = await fetch(`${getApiBaseUrl()}/cart`, {
        method: 'DELETE',
        headers: {
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        setCartItems(prev);
        console.error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      setCartItems(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, loading }}>
      {children}
    </CartContext.Provider>
  );
}

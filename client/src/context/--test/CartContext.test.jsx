import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext.jsx';

const authState = {
  user: null,
  isAuthenticated: false,
};

vi.mock('../AuthContext.jsx', () => ({
  useAuth: () => authState,
}));

vi.mock('../../config.js', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

function wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.isAuthenticated = false;
    global.fetch = vi.fn();
  });

  describe('addToCart guard matrix', () => {

    it('rejects invalid artwork ids', async () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-1', token: 'token-1' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const ok = await act(async () => result.current.addToCart({}, onError));

      expect(ok).toBe(false);
      expect(onError).toHaveBeenCalledWith('Invalid artwork');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('rejects sold artworks', async () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-1', token: 'token-1' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const ok = await act(async () => result.current.addToCart({ _id: 'sold-1', isSold: true }, onError));

      expect(ok).toBe(false);
      expect(onError).toHaveBeenCalledWith('This artwork is sold out');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns success for duplicate items without writing again', async () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-1', token: 'token-1' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'art-dup', title: 'Existing artwork' }] }),
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1);
      });

      const ok = await act(async () => result.current.addToCart({ _id: 'art-dup' }));

      expect(ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeFromCart rollback', () => {
    it('restores previous cart when DELETE fails', async () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-1', token: 'token-1' };

      const deleteResponse = deferred();

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            items: [
              { id: 'art-1', title: 'Artwork 1' },
              { id: 'art-2', title: 'Artwork 2' },
            ],
          }),
        })
        .mockImplementationOnce(() => deleteResponse.promise);

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(2);
      });

      let removePromise;
      await act(async () => {
        removePromise = result.current.removeFromCart('art-1');
      });

      await waitFor(() => {
        expect(result.current.cartItems).toEqual([{ id: 'art-2', title: 'Artwork 2' }]);
      });

      deleteResponse.resolve({
        ok: false,
        json: async () => ({ error: 'Failed to remove from cart' }),
      });

      await act(async () => {
        await removePromise;
      });

      await waitFor(() => {
        expect(result.current.cartItems).toEqual([
          { id: 'art-1', title: 'Artwork 1' },
          { id: 'art-2', title: 'Artwork 2' },
        ]);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

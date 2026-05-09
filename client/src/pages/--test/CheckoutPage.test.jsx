import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import CheckoutPage from '../CheckoutPage.jsx';

const mockNavigate = vi.fn();
const mockClearCart = vi.fn();

const authState = {
  user: { id: 'user-1', name: 'Dana', token: 'token-1' },
  isAuthenticated: true,
};

const cartState = {
  cartItems: [{ id: 'art-1', title: 'Artwork 1', price: 500, image: '/art.jpg' }],
  clearCart: mockClearCart,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children }) => <a>{children}</a>,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}));

vi.mock('../../context/CartContext.jsx', () => ({
  useCart: () => cartState,
}));

vi.mock('../../config.js', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.paypal = {
      Buttons: vi.fn(() => ({
        render: vi.fn(() => Promise.resolve()),
      })),
    };

    global.fetch = vi.fn();

    authState.user = { id: 'user-1', name: 'Dana', token: 'token-1' };
    authState.isAuthenticated = true;

    cartState.cartItems = [
      { id: 'art-1', title: 'Artwork 1', price: 500, image: '/art.jpg' },
    ];
  });

  it('redirects unauthenticated users to signin', async () => {
    authState.user = null;
    authState.isAuthenticated = false;

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });

  it('redirects users with empty cart to cart page', async () => {
    cartState.cartItems = [];

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });
  });

  it('places COD order successfully', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            city: 'Jeddah',
            country: 'Saudi Arabia',
            district: 'Al Rawdah',
            streetName: 'King Rd',
            phoneNumber: '0500000000',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('COD'));
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payment/cod'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(mockClearCart).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  it('shows new address form when address source is toggled', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          district: 'Al Rawdah',
          streetName: 'King Rd',
          phoneNumber: '0500000000',
        },
      }),
    });

    render(<CheckoutPage />);

    const radios = await screen.findAllByRole('radio');
    fireEvent.click(radios[1]);

    expect(
      await screen.findByPlaceholderText(/Who is receiving the art/i)
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/Their contact for delivery coordination/i)
    ).toBeInTheDocument();
  });

  it('updates shipping summary after entering new address', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          district: 'Al Rawdah',
          streetName: 'King Rd',
          phoneNumber: '0500000000',
        },
      }),
    });

    render(<CheckoutPage />);

    const radios = await screen.findAllByRole('radio');
    fireEvent.click(radios[1]);

    fireEvent.change(await screen.findByPlaceholderText(/Who is receiving the art/i), {
      target: { value: 'Noura' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Their contact for delivery coordination/i), {
      target: { value: '0555555555' },
    });

    fireEvent.change(screen.getByPlaceholderText(/King Sattam St/i), {
      target: { value: 'Olaya St' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Al-Waha/i), {
      target: { value: 'Al Olaya' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Jeddah/i), {
      target: { value: 'Riyadh' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Noura · 0555555555 · Olaya St/i)).toBeInTheDocument();
      expect(screen.getByText(/Al Olaya, Riyadh/i)).toBeInTheDocument();
    });
  });
});
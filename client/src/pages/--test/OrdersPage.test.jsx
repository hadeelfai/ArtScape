import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import OrdersPage from '../OrdersPage.jsx';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

vi.mock('../../context/AuthContext');

vi.mock('../../config.js', () => ({
  getApiBaseUrl: () => 'http://localhost/api',
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser = { id: '123', name: 'Riyam', token: 'fake-token' };

const buyerOrder = {
  _id: '1',
  createdAt: '2024-01-01',
  status: 'PENDING',
  paymentMethod: 'COD',
  totalAmount: 100,
  items: [
    {
      artwork: { title: 'Art 1', image: '' },
      price: 100,
      artist: { name: 'Artist 1' },
    },
  ],
  shipping: {
    recipientName: 'Dana',
    phone: '0500000000',
    streetName: 'King Rd',
    district: 'Al Rawdah',
    city: 'Jeddah',
    country: 'Saudi Arabia',
  },
};

const saleOrder = {
  _id: 'order-1',
  createdAt: '2024-01-01',
  status: 'PAID',
  paymentMethod: 'COD',
  totalAmount: 500,
  user: { _id: 'buyer-1', name: 'Buyer' },
  items: [
    {
      _id: 'item-1',
      price: 500,
      artwork: { title: 'Artwork 1', image: '/art.jpg' },
      artist: { name: 'Dana' },
    },
  ],
};

const renderOrdersPage = (route = '/orders') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <OrdersPage />
    </MemoryRouter>
  );
};

describe('OrdersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Orders page title', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/orders/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sales: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ orders: [buyerOrder] }),
      });
    });

    renderOrdersPage('/orders');

    expect(
      await screen.findByRole('heading', { name: /My Orders/i })
    ).toBeInTheDocument();
  });

  it('renders fetched orders', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/orders/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sales: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ orders: [buyerOrder] }),
      });
    });

    renderOrdersPage('/orders');

    expect(await screen.findByText('Art 1')).toBeInTheDocument();
    expect(screen.getByText('100 SAR')).toBeInTheDocument();
  });

  it('toggles order details', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/orders/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sales: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ orders: [buyerOrder] }),
      });
    });

    renderOrdersPage('/orders');

    const btn = await screen.findByText(/View details/i);
    fireEvent.click(btn);

    expect(screen.getByText(/Shipping Information/i)).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/orders/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sales: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ orders: [] }),
      });
    });

    renderOrdersPage('/orders');

    expect(await screen.findByText(/No orders yet/i)).toBeInTheDocument();
  });

  it('updates sale status successfully', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sales: [saleOrder] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ACCEPTED' }),
      });

    renderOrdersPage('/sales');

    const acceptButton = await screen.findByRole('button', {
      name: /accept order/i,
    });

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/order-1/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACCEPTED' }),
        })
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Status updated');
  });

  it('shows error when sale status update fails', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sales: [saleOrder] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update status' }),
      });

    renderOrdersPage('/sales');

    const acceptButton = await screen.findByRole('button', {
      name: /accept order/i,
    });

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update status');
    });
  });
});
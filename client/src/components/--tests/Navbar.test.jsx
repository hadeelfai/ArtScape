import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({ 
  useAuth: vi.fn()
}));
vi.mock('../../context/CartContext', () => ({ 
  useCart: vi.fn()
}));
vi.mock('../SearchBar', () => ({ default: () => <div>SearchBar</div> }));
vi.mock('framer-motion', () => ({
  motion: { div: ({ children }) => <div>{children}</div>, button: ({ children }) => <button>{children}</button> },
  AnimatePresence: ({ children }) => <>{children}</>
}));
vi.mock('lucide-react', () => ({
  ShoppingCart: () => <svg data-testid="cart-icon" />,
  Bell: () => <svg data-testid="bell-icon" />,
  LogOut: () => <svg />,
  User: () => <svg />,
  Package: () => <svg />,
  Palette: () => <svg />,
  Search: () => <svg />,
  X: () => <svg />,
  ChevronDown: () => <svg />
}));

import Navbar from '../Navbar';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, isAdmin: false, logout: vi.fn() });
    useCart.mockReturnValue({ cartItems: [] });
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  });

  it('renders logo', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getByText('ArtScape')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gallery').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Community').length).toBeGreaterThan(0);
    expect(screen.getAllByText('News').length).toBeGreaterThan(0);
  });

  it('shows Sign In when not authenticated', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
  });

  it('shows avatar when authenticated', () => {
    useAuth.mockReturnValue({ user: { id: '1', name: 'User' }, isAuthenticated: true, isAdmin: false, logout: vi.fn() });
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getAllByAltText('User').length).toBeGreaterThan(0);
  });

  it('shows cart with badge', () => {
    useAuth.mockReturnValue({ user: { id: '1' }, isAuthenticated: true, isAdmin: false, logout: vi.fn() });
    useCart.mockReturnValue({ cartItems: [{}, {}, {}] });
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getAllByTestId('cart-icon').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows notification bell when authenticated', () => {
    useAuth.mockReturnValue({ user: { id: '1', token: 'token' }, isAuthenticated: true, isAdmin: false, logout: vi.fn() });
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getAllByTestId('bell-icon').length).toBeGreaterThan(0);
  });
});

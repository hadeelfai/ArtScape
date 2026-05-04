import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessagesPage from '../MessagesPage.jsx';

const mockNavigate = vi.fn();

const authState = {
  user: {
    id: 'user-1',
    name: 'Dana',
    token: 'token-1',
  },
  isAuthenticated: true,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('')],
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Send: () => <span>SendIcon</span>,
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  Search: () => <span>SearchIcon</span>,
  Trash2: () => <span>TrashIcon</span>,
}));

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ conversations: [] }),
      })
    );

    authState.isAuthenticated = true;
    authState.user = {
      id: 'user-1',
      name: 'Dana',
      token: 'token-1',
    };
  });

  it('renders messages page title', async () => {
    render(<MessagesPage />);

    expect(await screen.findByText('Messages')).toBeInTheDocument();
  });

  it('shows empty state when there are no conversations', async () => {
    render(<MessagesPage />);

    expect(
      await screen.findByText(/No messages yet. Start a conversation!/i)
    ).toBeInTheDocument();
  });

  it('redirects unauthenticated users to signin', async () => {
    authState.isAuthenticated = false;
    authState.user = null;

    render(<MessagesPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });
});
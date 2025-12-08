import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from '../SearchBar';

// Mock useNavigate
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  X: () => <div data-testid="close-icon">X</div>
}));

describe('SearchBar', () => {
  it('renders search icon button when variant is icon', () => {
    render(<SearchBar variant="icon" />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders search input when variant is bar', () => {
    render(<SearchBar variant="bar" />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders search icon by default (no variant prop)', () => {
    render(<SearchBar />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });
});

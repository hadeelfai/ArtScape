import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DropdownMenu from '../DropdownMenu';

describe('DropdownMenu', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu content when open is true', () => {
    render(
      <DropdownMenu open={true} onClose={mockOnClose}>
        <button>Option 1</button>
        <button>Option 2</button>
      </DropdownMenu>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <DropdownMenu open={false} onClose={mockOnClose}>
        <div>Menu Content</div>
      </DropdownMenu>
    );

    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
  });
});


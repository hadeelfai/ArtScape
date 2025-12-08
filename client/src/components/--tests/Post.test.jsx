import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock ImageUploader
vi.mock('../ImageUploader', () => ({
  default: ({ onImageUpload }) => (
    <button 
      data-testid="image-uploader"
      onClick={() => onImageUpload('https://example.com/image.jpg')}
    >
      Upload Image
    </button>
  )
}));

// Mock toast
const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

import Post from '../Post';

describe('Post', () => {
  const mockOnPostCreated = vi.fn();
  const mockOnEditCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    global.localStorage = localStorageMock;
  });

  it('renders the post form', () => {
    render(<Post onPostCreated={mockOnPostCreated} />);

    expect(screen.getByPlaceholderText('Share and Describe Your Art..')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('shows Update button and populates fields when editing', () => {
    const editingPost = { _id: '123', text: 'Edit this post', image: 'https://example.com/image.jpg' };
    render(<Post editingPost={editingPost} onEditCompleted={mockOnEditCompleted} />);

    expect(screen.getByText('Update')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Share and Describe Your Art..');
    expect(input).toHaveValue('Edit this post');
  });

  it('shows error when posting without text or image', async () => {
    const user = userEvent.setup();
    
    localStorage.getItem.mockReturnValue(JSON.stringify({ token: 'test-token' }));
    render(<Post onPostCreated={mockOnPostCreated} />);

    const postButton = screen.getByText('Post');
    await user.click(postButton);

    expect(mockToast.error).toHaveBeenCalledWith('Please add an image or description');
  });
});


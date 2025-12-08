import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ImageUploader from '../ImageUploader';

// Mock lucide-react Image icon
vi.mock('lucide-react', () => ({
  Image: () => <div data-testid="image-icon">Image</div>
}));

describe('ImageUploader', () => {
  const mockOnImageUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.alert = vi.fn();
  });

  it('renders the upload button', () => {
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('renders file input', () => {
    const { container } = render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('calls onImageUpload when upload succeeds', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockResponse = { secure_url: 'https://example.com/image.jpg' };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { container } = render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    await userEvent.upload(fileInput, mockFile);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockOnImageUpload).toHaveBeenCalledWith('https://example.com/image.jpg');
  });
});


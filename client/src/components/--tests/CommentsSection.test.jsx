import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentsSection from '../CommentsSection';

// Mock API functions
vi.mock('../api/comments', () => ({
  getCommentByPost: vi.fn(),
  addComment: vi.fn(),
  addReply: vi.fn()
}));

// Mock toast
const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Send: () => <div>Send</div>,
  MessageCircle: () => <div>MessageCircle</div>,
  Trash: () => <div>Trash</div>
}));

// Mock timeago.js
vi.mock('timeago.js', () => ({
  format: vi.fn(() => '2 hours ago')
}));

describe('CommentsSection', () => {
  const mockOnCountChange = vi.fn();
  const postId = '123';
  const commentsCount = 5;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => JSON.stringify({ token: 'test-token', id: 'user-123' })),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = localStorageMock;
  });

  it('renders when showComments is true', () => {
    render(
      <CommentsSection 
        postId={postId} 
        showComments={true} 
        commentsCount={commentsCount}
        onCountChange={mockOnCountChange}
      />
    );
    
    expect(screen.getByPlaceholderText('Share and Describe Your Art...')).toBeInTheDocument();
  });

  it('does not render when showComments is false', () => {
    render(
      <CommentsSection 
        postId={postId} 
        showComments={false} 
        commentsCount={commentsCount}
        onCountChange={mockOnCountChange}
      />
    );
    
    expect(screen.queryByPlaceholderText('Share and Describe Your Art...')).not.toBeInTheDocument();
  });
});


import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ReportModal from '../ReportModal';

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

describe('ReportModal', () => {
  const mockOnClose = vi.fn();
  const artworkId = '123';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the modal', () => {
    render(<ReportModal onClose={mockOnClose} artworkId={artworkId} />);
    
    expect(screen.getByText('Report Artwork')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('shows all report reason options', () => {
    render(<ReportModal onClose={mockOnClose} artworkId={artworkId} />);
    
    expect(screen.getByLabelText('Spam')).toBeInTheDocument();
    expect(screen.getByLabelText('Harassment')).toBeInTheDocument();
    expect(screen.getByLabelText('Inappropriate content')).toBeInTheDocument();
    expect(screen.getByLabelText('Copyright violation')).toBeInTheDocument();
    expect(screen.getByLabelText('Other')).toBeInTheDocument();
  });

  it('shows error when submitting without selecting a reason', async () => {
    const user = userEvent.setup();
    render(<ReportModal onClose={mockOnClose} artworkId={artworkId} />);
    
    const submitButton = screen.getByText('Submit Report');
    await user.click(submitButton);
    
    expect(screen.getByText('Please select a reason')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ReportModal onClose={mockOnClose} artworkId={artworkId} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits report successfully and calls onClose', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    render(<ReportModal onClose={mockOnClose} artworkId={artworkId} />);
    
    await user.click(screen.getByLabelText('Spam'));
    const submitButton = screen.getByText('Submit Report');
    await user.click(submitButton);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockToast.success).toHaveBeenCalledWith('Report submitted successfully');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});


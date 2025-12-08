import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollVelocity from '../ScrollVelocity';

// Mock motion/react
const { mockMotionValue, mockUseScroll, mockUseVelocity, mockUseSpring, mockUseTransform, mockUseAnimationFrame } = vi.hoisted(() => {
  const mockMotionValue = vi.fn(() => ({
    get: vi.fn(() => 0),
    set: vi.fn()
  }));
  
  const mockUseScroll = vi.fn(() => ({ scrollY: mockMotionValue() }));
  const mockUseVelocity = vi.fn(() => mockMotionValue());
  const mockUseSpring = vi.fn(() => mockMotionValue());
  const mockUseTransform = vi.fn(() => ({
    get: vi.fn(() => 0)
  }));
  const mockUseAnimationFrame = vi.fn((callback) => {
    callback(0, 16);
  });

  return {
    mockMotionValue,
    mockUseScroll,
    mockUseVelocity,
    mockUseSpring,
    mockUseTransform,
    mockUseAnimationFrame
  };
});

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  useScroll: mockUseScroll,
  useSpring: mockUseSpring,
  useTransform: mockUseTransform,
  useMotionValue: mockMotionValue,
  useVelocity: mockUseVelocity,
  useAnimationFrame: mockUseAnimationFrame
}));

describe('ScrollVelocity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with texts', () => {
    const texts = ['Hello', 'World'];
    render(<ScrollVelocity texts={texts} />);
    
    expect(screen.getAllByText('Hello').length).toBeGreaterThan(0);
    expect(screen.getAllByText('World').length).toBeGreaterThan(0);
  });

  it('renders nothing when texts array is empty', () => {
    const { container } = render(<ScrollVelocity texts={[]} />);
    
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section?.children.length).toBe(0);
  });

  it('renders multiple text items', () => {
    const texts = ['Text 1', 'Text 2', 'Text 3'];
    render(<ScrollVelocity texts={texts} />);
    
    expect(screen.getAllByText('Text 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Text 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Text 3').length).toBeGreaterThan(0);
  });
});


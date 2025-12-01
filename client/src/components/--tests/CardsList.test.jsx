import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CardsList from '../CardsList';

describe('CardsList', () => {
  it('renders all 7 items', () => {
    render(<CardsList />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(7);
  });

  it('renders images with correct src attributes', () => {
    render(<CardsList />);
    
    const firstImage = screen.getByAltText('Slide 1');
    const lastImage = screen.getByAltText('Slide 7');
    
    expect(firstImage).toHaveAttribute('src', '/Hero-carousel/w2.jpeg');
    expect(lastImage).toHaveAttribute('src', '/Hero-carousel/wadi.jpg');
  });

  it('renders images with proper alt text', () => {
    render(<CardsList />);
    
    expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 2')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 3')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 4')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 5')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 6')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 7')).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    const { container } = render(<CardsList />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('pl-28');
    
    const scrollableDiv = mainDiv.firstChild;
    expect(scrollableDiv).toHaveClass('overflow-x-auto', 'whitespace-nowrap');
  });

  it('renders each card with correct width classes', () => {
    const { container } = render(<CardsList />);
    
    const cards = container.querySelectorAll('.w-72');
    expect(cards).toHaveLength(7);
    
    cards.forEach(card => {
      expect(card).toHaveClass('lg:w-96', 'md:w-96', 'flex-shrink-0');
    });
  });

  it('renders images with object-cover class', () => {
    render(<CardsList />);
    
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveClass('w-full', 'h-full', 'object-cover');
    });
  });
});
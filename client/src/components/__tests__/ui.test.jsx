import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PriceBlock, StarRating, Button } from '../ui';

describe('PriceBlock', () => {
  it('shows price, MRP and percent off', () => {
    render(<PriceBlock price={750} mrp={1000} />);
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText(/M\.R\.P\./)).toBeInTheDocument();
  });
  it('hides discount when price equals MRP', () => {
    render(<PriceBlock price={500} mrp={500} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });
});
describe('StarRating', () => {
  it('has an accessible label', () => {
    render(<StarRating value={4.5} count={12} />);
    expect(screen.getByLabelText('4.5 out of 5 stars')).toBeInTheDocument();
  });
});
describe('Button', () => {
  it('is disabled while loading', () => {
    render(<Button loading>Pay</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

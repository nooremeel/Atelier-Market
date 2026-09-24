import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RatingInput } from './RatingInput';

describe('RatingInput', () => {
  it('renders 5 star buttons and current rating label', () => {
    const onChange = vi.fn();
    render(<RatingInput label="Your Rating" value={4} onChange={onChange} />);

    expect(screen.getByText('Your Rating')).toBeInTheDocument();
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
    expect(screen.getByText('Very Good')).toBeInTheDocument();
  });

  it('calls onChange when a star is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RatingInput value={3} onChange={onChange} />);

    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]); // 5th star (index 4)
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('previews rating on hover and restores on mouse leave', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RatingInput value={3} onChange={onChange} />);

    expect(screen.getByText('Good')).toBeInTheDocument();

    const stars = screen.getAllByRole('radio');
    await user.hover(stars[4]); // hover 5th star
    expect(screen.getByText('Exceptional')).toBeInTheDocument();

    await user.unhover(stars[4]);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('supports keyboard navigation via arrow keys', () => {
    const onChange = vi.fn();
    render(<RatingInput value={3} onChange={onChange} />);

    const radiogroup = screen.getByRole('radiogroup');
    radiogroup.focus();

    fireEvent.keyDown(radiogroup, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(4);

    fireEvent.keyDown(radiogroup, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

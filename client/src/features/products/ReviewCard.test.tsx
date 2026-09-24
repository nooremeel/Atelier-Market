import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ReviewCard } from './ReviewCard';
import type { Review } from '../../types';

const mockReview: Review = {
  _id: 'rev-1',
  productId: 'prod-1',
  userId: {
    _id: 'user-1',
    name: 'Sara Hassan',
    email: 'sara@example.com',
  },
  rating: 5,
  title: 'Sensational brass work',
  body: 'The detailing is superb and weight feels substantial.',
  verified: true,
  createdAt: '2026-08-15T12:00:00.000Z',
};

describe('ReviewCard', () => {
  it('renders author, initials, rating, title, and body', () => {
    render(<ReviewCard review={mockReview} />);

    expect(screen.getByText('Sara Hassan')).toBeInTheDocument();
    expect(screen.getByText('SH')).toBeInTheDocument();
    expect(screen.getByText('Sensational brass work')).toBeInTheDocument();
    expect(screen.getByText(/The detailing is superb/)).toBeInTheDocument();
    expect(screen.getByTestId('verified-purchase-badge')).toBeInTheDocument();
  });

  it('derives author name and initials from email when name is empty', () => {
    const reviewWithNoName: Review = {
      ...mockReview,
      userId: {
        _id: 'user-2',
        name: '',
        email: 'nour.al-din@example.com',
      },
    };
    render(<ReviewCard review={reviewWithNoName} />);
    expect(screen.getByText('Nour Al Din')).toBeInTheDocument();
    expect(screen.getByText('NA')).toBeInTheDocument();
  });

  it('renders review.userName directly instead of indexing email when userName is provided', () => {
    const reviewWithExplicitUserName: Review = {
      ...mockReview,
      userName: 'Tariq Al-Sabah',
      userId: {
        _id: 'user-3',
        name: '',
        email: 'tariq.specialist@example.com',
      },
    };
    render(<ReviewCard review={reviewWithExplicitUserName} />);
    expect(screen.getByText('Tariq Al-Sabah')).toBeInTheDocument();
    expect(screen.queryByText('Tariq Specialist')).not.toBeInTheDocument();
  });

  it('hides verified badge when review is not verified', () => {
    const unverifiedReview = { ...mockReview, verified: false };
    render(<ReviewCard review={unverifiedReview} />);

    expect(screen.queryByTestId('verified-purchase-badge')).not.toBeInTheDocument();
  });

  it('shows delete option for author and triggers onDelete after confirm', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewCard
        review={mockReview}
        currentUserId="user-1"
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByTitle('Delete');
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    // Inline confirmation appears
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmBtn);

    expect(onDelete).toHaveBeenCalledWith('rev-1');
  });

  it('hides delete option for non-author customer', () => {
    render(
      <ReviewCard
        review={mockReview}
        currentUserId="user-other"
        currentUserRole="customer"
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('shows delete option for admin user', () => {
    render(
      <ReviewCard
        review={mockReview}
        currentUserId="admin-1"
        currentUserRole="admin"
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });
});

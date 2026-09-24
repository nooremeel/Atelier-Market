import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, it, expect } from 'vitest';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { ReviewList } from './ReviewList';

function wrap(ui: React.ReactElement) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient.clear();
});

describe('ReviewList', () => {
  it('renders rating summary, score, and distribution chart', async () => {
    server.use(
      http.get('/api/products/p1/reviews', () =>
        HttpResponse.json({
          reviews: [
            {
              _id: 'r1',
              productId: 'p1',
              userId: { _id: 'u1', name: 'Sara Hassan', email: 'sara@example.com' },
              rating: 5,
              title: 'Masterpiece of metalwork',
              body: 'The detail on the brass is astonishing. Arrived in pristine condition.',
              verified: true,
              createdAt: '2026-08-15T12:00:00.000Z',
            },
          ],
          pagination: { currentPage: 1, lastPage: 1, totalItems: 1 },
          stats: {
            average: 5,
            total: 1,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
          },
          userHasReviewed: false,
          isVerifiedPurchaser: true,
        })
      )
    );

    render(wrap(<ReviewList productId="p1" productTitle="Damascus Lantern" />));

    expect(await screen.findByText('Customer Reviews')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('Based on 1 review')).toBeInTheDocument();

    // Verify distribution row for 5 stars exists
    expect(screen.getByTestId('distribution-row-5')).toBeInTheDocument();

    // Verify review card content
    expect(screen.getByText('Masterpiece of metalwork')).toBeInTheDocument();
    expect(screen.getByText('Sara Hassan')).toBeInTheDocument();
  });

  it('renders empty state when there are no reviews', async () => {
    server.use(
      http.get('/api/products/p2/reviews', () =>
        HttpResponse.json({
          reviews: [],
          pagination: { currentPage: 1, lastPage: 1, totalItems: 0 },
          stats: {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          userHasReviewed: false,
          isVerifiedPurchaser: false,
        })
      )
    );

    render(wrap(<ReviewList productId="p2" productTitle="Amber Flagon" />));

    expect(await screen.findByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText(/Be the first collector to share your impressions/)).toBeInTheDocument();
  });

  it('opens review submission modal when clicking Write a Review as authenticated user', async () => {
    // Authenticate user
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({
          user: {
            _id: 'u1',
            name: 'Sara Hassan',
            email: 'sara@example.com',
            role: 'customer',
          },
        })
      ),
      http.get('/api/products/p1/reviews', () =>
        HttpResponse.json({
          reviews: [],
          pagination: { currentPage: 1, lastPage: 1, totalItems: 0 },
          stats: {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          userHasReviewed: false,
          isVerifiedPurchaser: true,
        })
      )
    );

    const user = userEvent.setup();
    render(wrap(<ReviewList productId="p1" productTitle="Damascus Lantern" />));

    const writeBtn = await screen.findAllByRole('button', { name: 'Write a Review' });
    await user.click(writeBtn[0]);

    // Modal opens
    expect(await screen.findByRole('dialog', { name: 'Write a Review' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Review Headline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Detailed Impression/i)).toBeInTheDocument();
  });
});

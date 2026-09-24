import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewForm } from './ReviewForm';
import * as AuthProviderModule from '../../auth/AuthProvider';
import * as useReviewsModule from './useReviews';

import { ToastProvider } from '../../components/ToastProvider';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('ReviewForm', () => {
  it('prefills reviewer name from authenticated user and allows editing before submission', async () => {
    const mutate = vi.fn();
    vi.spyOn(useReviewsModule, 'useSubmitReview').mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { _id: 'u1', email: 'patron@example.com', name: 'Nour Al-Atelier', role: 'customer' },
      loading: false,
      setUser: vi.fn(),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithClient(
      <ReviewForm
        open={true}
        onClose={onClose}
        productId="p1"
        productTitle="Damascus Lantern"
        isVerifiedPurchaser={true}
      />
    );

    // Verify reviewer name is prefilled with user's name
    const nameInput = screen.getByLabelText(/your name|اسمك/i);
    expect(nameInput).toHaveValue('Nour Al-Atelier');

    // Fill title and body
    const titleInput = screen.getByLabelText(/review headline|عنوان المراجعة/i);
    await user.type(titleInput, 'Superb craftsmanship');

    const bodyInput = screen.getByLabelText(/detailed impression|المراجعة المفصلة/i);
    await user.type(bodyInput, 'The pierced brass work has a sublime warm luminescence.');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /publish review|نشر المراجعة/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nour Al-Atelier',
        title: 'Superb craftsmanship',
        body: 'The pierced brass work has a sublime warm luminescence.',
        rating: 5,
      }),
      expect.any(Object)
    );
  });
});
